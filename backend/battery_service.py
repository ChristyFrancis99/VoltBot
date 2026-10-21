from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from threading import Lock
from typing import Any
from uuid import uuid4

from schemas import DemoScenario, SensorData


PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.battery_monitor import monitor_battery


DEMO_DEVICE_ID = "ESP32_BATTERY_DEMO_01"
_DEMO_LOCK = Lock()
_ACTIVE_DEMO_SCENARIO: str | None = None
_ACTIVE_DEMO_STAGE = -1
_ACTIVE_DEMO_SESSION_ID: str | None = None
_ACTIVE_DEMO_BASE_TIME: datetime | None = None

_DEMO_SEQUENCES: dict[str, list[dict[str, Any]]] = {
    "healthy": [
        {"voltage": 48.5, "current": 8.0, "temperature": 29.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.4, "current": 9.0, "temperature": 29.4, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.3, "current": 10.0, "temperature": 29.8, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.2, "current": 10.0, "temperature": 30.2, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.1, "current": 11.0, "temperature": 30.6, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 11.0, "temperature": 31.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 10.0, "temperature": 31.2, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
    ],
    "degradation": [
        {"voltage": 48.5, "current": 8.0, "temperature": 30.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.25, "current": 9.0, "temperature": 31.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 10.0, "temperature": 33.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.6, "current": 12.0, "temperature": 35.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.1, "current": 15.0, "temperature": 38.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 46.5, "current": 18.0, "temperature": 42.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 45.9, "current": 20.0, "temperature": 46.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
    ],
    "overheating": [
        {"voltage": 48.0, "current": 10.0, "temperature": 30.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.9, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.8, "current": 10.0, "temperature": 35.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.8, "current": 10.0, "temperature": 38.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.7, "current": 10.0, "temperature": 42.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.7, "current": 10.0, "temperature": 46.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.6, "current": 10.0, "temperature": 50.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 47.6, "current": 10.0, "temperature": 55.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
    ],
    "cell_imbalance": [
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.70]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.68]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.64]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.58]},
        {"voltage": 48.0, "current": 10.0, "temperature": 32.0, "cell_voltages": [3.70, 3.71, 3.69, 3.50]},
    ],
    "multiple_faults": [
        {"voltage": 48.0, "current": 20.0, "temperature": 38.0, "cell_voltages": [3.70, 3.71, 3.69, 3.67]},
        {"voltage": 47.0, "current": 24.0, "temperature": 42.0, "cell_voltages": [3.72, 3.71, 3.69, 3.60]},
        {"voltage": 45.0, "current": 27.0, "temperature": 46.0, "cell_voltages": [3.74, 3.70, 3.69, 3.55]},
        {"voltage": 43.0, "current": 30.0, "temperature": 50.0, "cell_voltages": [3.75, 3.70, 3.69, 3.50]},
        {"voltage": 41.8, "current": 30.0, "temperature": 55.0, "cell_voltages": [3.75, 3.70, 3.69, 3.45]},
        {"voltage": 41.5, "current": 30.0, "temperature": 58.0, "cell_voltages": [3.75, 3.70, 3.69, 3.45]},
    ],
}


def next_demo_sensor_data(
    scenario: DemoScenario,
    advance: bool = False,
) -> tuple[SensorData, str, int, str]:
    """Return the next raw packet in a selected demonstration sequence."""
    global _ACTIVE_DEMO_SCENARIO, _ACTIVE_DEMO_STAGE, _ACTIVE_DEMO_SESSION_ID, _ACTIVE_DEMO_BASE_TIME

    normalized_scenario = "healthy" if scenario == "normal" else scenario
    sequence = _DEMO_SEQUENCES[normalized_scenario]
    with _DEMO_LOCK:
        if not advance or _ACTIVE_DEMO_SCENARIO != normalized_scenario:
            _ACTIVE_DEMO_SCENARIO = normalized_scenario
            _ACTIVE_DEMO_STAGE = 0
            _ACTIVE_DEMO_SESSION_ID = uuid4().hex
            _ACTIVE_DEMO_BASE_TIME = datetime.now(timezone.utc)
        else:
            _ACTIVE_DEMO_STAGE = min(_ACTIVE_DEMO_STAGE + 1, len(sequence) - 1)
        stage = _ACTIVE_DEMO_STAGE
        session_id = _ACTIVE_DEMO_SESSION_ID
        base_time = _ACTIVE_DEMO_BASE_TIME
        assert session_id is not None and base_time is not None

    values = sequence[stage]
    sensor_data = SensorData(
        device_id=DEMO_DEVICE_ID,
        timestamp=base_time + timedelta(minutes=stage),
        **values,
    )
    return sensor_data, normalized_scenario, stage + 1, session_id


def process_sensor_data(sensor_data: SensorData) -> dict[str, Any]:
    timestamp = sensor_data.timestamp or datetime.now(timezone.utc)
    raw_reading: dict[str, Any] = {
        "device_id": sensor_data.device_id,
        "timestamp": timestamp.isoformat(),
        "voltage": sensor_data.voltage,
        "current": sensor_data.current,
        "temperature": sensor_data.temperature,
        "cell_voltages": list(sensor_data.cell_voltages),
    }
    monitoring = monitor_battery(raw_reading)

    return {
        **raw_reading,
        **monitoring,
        "power": monitoring["power_w"],
        "cell_min": monitoring["cell_min_v"],
        "cell_max": monitoring["cell_max_v"],
        "cell_imbalance": monitoring["cell_imbalance_v"],
    }
