# VoltBot backend

This backend handles real-time battery telemetry for the existing VoltBot dashboard. It validates incoming sensor packets, calculates the instantaneous pack metrics, stores readings in SQLite, and performs a small explainable health assessment across recent telemetry windows.

The NASA SOH pipeline remains separate and is not used for live 48V scooter telemetry. The live monitoring path is intentionally simple and transparent for faculty demonstration.

## Setup

From the repository root, create and activate a virtual environment, then install the backend dependencies:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS or Linux, use `python3 -m venv .venv` and `source .venv/bin/activate` instead.

## Start the API

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000` and Swagger docs are at `http://127.0.0.1:8000/docs`.

CORS is enabled for the common local Vite frontend origins: `http://localhost:5173` and `http://127.0.0.1:5173` (and port 8080 for compatibility).

## Endpoints

- `GET /api/health` -> `{ "status": "ok" }`
- `POST /api/sensor-data` -> accepts a single `SensorData` packet, calculates derived metrics, stores it in SQLite, and returns the processed reading.
- `GET /api/battery/latest` -> returns the most recent reading.
- `GET /api/battery/history?limit=20` -> returns recent readings in newest-first order.
- `POST /api/demo/scenario` -> starts or advances a demo sequence for `normal`, `overheating`, `cell_imbalance`, or `multiple_faults`.

Example sensor packet:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/sensor-data `
  -H "Content-Type: application/json" `
  -d '{"device_id":"ESP32_BATTERY_01","voltage":48.2,"current":10.5,"temperature":33.5,"cell_voltages":[3.71,3.70,3.72,3.69]}'
```

The timestamp is optional; when omitted, the server assigns the current UTC time. Derived metrics are computed from the raw packet, including `power_w`, `cell_min_v`, `cell_max_v`, and `cell_imbalance_v`.

## Demo scenarios

The demo endpoint supports a request body such as:

```json
{
  "scenario": "normal",
  "advance": true
}
```

Supported scenario names are:

- `normal`
- `overheating`
- `cell_imbalance`
- `multiple_faults`

`advance` controls stage progression. The backend keeps a demo session per scenario and advances through a staged sequence so the dashboard can show behavior developing over time, rather than a single static reading.

## Health behavior monitor

The live health monitor uses a recent window of telemetry and calculates explainable features:

- voltage trend (V/min)
- current trend (A/min)
- temperature trend (C/min)
- cell imbalance trend
- recent averages and extrema
- operating state from the current convention
- health flags and human-readable pattern explanations

The health score is a transparent 0-100 value that penalizes sustained abnormal patterns, not a machine-learning SOH estimate. The thresholds are centralized in `ml/live_health_monitor.py` and are explicitly demo engineering thresholds rather than universal EV safety limits.

The health statuses are:

- `HEALTHY`
- `WATCH`
- `DEGRADED`
- `CRITICAL`

The operating-state convention follows the existing live telemetry convention: positive current means discharge, negative current means charging, and near-zero current is idle.

## SQLite

SQLite is used directly via Python's standard library. On startup, the API creates or migrates the `battery_readings` table in `battery_readings.db` beside the backend files unless `BATTERY_DATABASE_PATH` is set. Existing records are preserved through additive database migrations.

## Notes

- No MQTT, no ESP32/Wokwi integration, and no ML inference are required for this phase.
- The live battery-monitoring engine is intentionally explainable and demo-friendly.
- Demo scenarios do not fabricate a fake health score; they generate raw telemetry that passes through the same monitoring logic as live readings.
