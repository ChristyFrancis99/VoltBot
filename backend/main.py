import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from battery_service import next_demo_sensor_data, process_sensor_data
from database import (
    get_latest_reading,
    get_reading_history,
    get_recent_readings,
    init_db,
    insert_reading,
)
from schemas import BatteryReading, DemoScenarioRequest, HealthResponse, SensorData
from ml.live_health_monitor import HEALTH_WINDOW_SIZE, analyze_battery_health


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


is_protected_mode = bool(os.environ.get("VOLTBOT_API_KEY", "").strip())

app = FastAPI(
    title="VoltBot Battery API",
    lifespan=lifespan,
    docs_url=None if is_protected_mode else "/docs",
    redoc_url=None if is_protected_mode else "/redoc",
    openapi_url=None if is_protected_mode else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.1.6:8080",
        "http://10.12.0.58:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)


@app.middleware("http")
async def restrict_public_tunnel_access(request: Request, call_next):
    # Only active when VOLTBOT_API_KEY is configured (protected/tunneled mode)
    if os.environ.get("VOLTBOT_API_KEY", "").strip():
        # Requests arriving through ngrok or public proxies carry forwarded headers or non-local hosts
        is_tunnel = bool(
            request.headers.get("x-forwarded-for")
            or request.headers.get("x-forwarded-proto")
            or request.headers.get("x-forwarded-host")
            or request.headers.get("host", "").split(":")[0].lower()
            not in ("localhost", "127.0.0.1", "::1", "testserver")
        )
        # On public tunnels, ONLY /api/sensor-data is exposed (and protected by X-API-Key).
        # Conceal all other endpoints (docs, history, latest, demo) with a 404 response.
        if is_tunnel and request.url.path != "/api/sensor-data":
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "Not Found"},
            )

    return await call_next(request)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


def _process_and_store(
    sensor_data: SensorData,
    demo_scenario: str | None = None,
    demo_stage: int | None = None,
    demo_session_id: str | None = None,
) -> BatteryReading:
    processed = process_sensor_data(sensor_data)
    recent = get_recent_readings(
        sensor_data.device_id,
        limit=HEALTH_WINDOW_SIZE - 1,
    )
    if demo_session_id is not None:
        recent = [
            reading
            for reading in recent
            if reading.get("demo_session_id") == demo_session_id
        ]
    health_readings = [*reversed(recent), processed]
    processed.update(analyze_battery_health(health_readings))
    processed["demo_scenario"] = demo_scenario
    processed["demo_stage"] = demo_stage
    processed["demo_session_id"] = demo_session_id
    return BatteryReading(**insert_reading(processed))


def verify_ingestion_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    expected_key = os.environ.get("VOLTBOT_API_KEY", "").strip()
    if not expected_key:
        # Development mode: No API key configured in environment.
        # Allows unauthenticated local requests. NOTE: An unset key is NOT safe for public exposure.
        return

    if not x_api_key or x_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header",
        )


@app.post(
    "/api/sensor-data",
    response_model=BatteryReading,
    dependencies=[Depends(verify_ingestion_api_key)],
)
def receive_sensor_data(sensor_data: SensorData) -> BatteryReading:
    return _process_and_store(sensor_data)


@app.post("/api/demo/scenario", response_model=BatteryReading)
def run_demo_scenario(request: DemoScenarioRequest) -> BatteryReading:
    if os.environ.get("VOLTBOT_API_KEY", "").strip():
        # Disabled when running in protected/tunneled mode to prevent unauthorized database mutation.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    sensor_data, scenario, stage, session_id = next_demo_sensor_data(
        request.scenario,
        advance=request.advance,
    )
    return _process_and_store(
        sensor_data,
        demo_scenario=scenario,
        demo_stage=stage,
        demo_session_id=session_id,
    )


@app.get("/api/battery/latest", response_model=BatteryReading)
def latest_battery_reading() -> BatteryReading:
    reading = get_latest_reading()
    if reading is None:
        raise HTTPException(status_code=404, detail="No battery readings are available")
    return BatteryReading(**reading)


@app.get("/api/battery/history", response_model=list[BatteryReading])
def battery_reading_history(
    limit: int = Query(default=20, ge=1, le=100),
) -> list[BatteryReading]:
    return [BatteryReading(**reading) for reading in get_reading_history(limit)]
