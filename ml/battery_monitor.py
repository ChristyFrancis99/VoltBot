"""Rule-based processing and status reporting for live battery telemetry."""

import math
from collections.abc import Mapping, Sequence
from numbers import Real
from typing import Any


TEMPERATURE_WARNING_C = 45.0
TEMPERATURE_CRITICAL_C = 55.0

VOLTAGE_LOW_WARNING_V = 42.0
VOLTAGE_HIGH_WARNING_V = 50.0

CURRENT_WARNING_A = 25.0

CELL_IMBALANCE_WARNING_V = 0.10
CELL_IMBALANCE_CRITICAL_V = 0.20


def _finite_number(reading: Mapping[str, Any], field: str) -> float:
    if field not in reading:
        raise ValueError(f"Missing required field '{field}'")

    value = reading[field]
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"Field '{field}' must be numeric")

    numeric_value = float(value)
    if not math.isfinite(numeric_value):
        raise ValueError(f"Field '{field}' must be finite")
    return numeric_value


def _cell_voltages(reading: Mapping[str, Any]) -> list[float]:
    if "cell_voltages" not in reading:
        raise ValueError("Missing required field 'cell_voltages'")

    raw_values = reading["cell_voltages"]
    if isinstance(raw_values, (str, bytes)) or not isinstance(raw_values, Sequence):
        raise ValueError("Field 'cell_voltages' must be a non-empty sequence")
    if not raw_values:
        raise ValueError("Field 'cell_voltages' must not be empty")

    values: list[float] = []
    for index, raw_value in enumerate(raw_values):
        if isinstance(raw_value, bool) or not isinstance(raw_value, Real):
            raise ValueError(f"Cell voltage at index {index} must be numeric")
        numeric_value = float(raw_value)
        if not math.isfinite(numeric_value):
            raise ValueError(f"Cell voltage at index {index} must be finite")
        values.append(numeric_value)
    return values


def _at_or_above(value: float, threshold: float) -> bool:
    return value >= threshold or math.isclose(value, threshold, rel_tol=0.0, abs_tol=1e-12)


def monitor_battery(reading: Mapping[str, Any]) -> dict[str, Any]:
    """Calculate pack metrics and rule-based statuses for one telemetry reading."""
    if not isinstance(reading, Mapping):
        raise ValueError("Reading must be a telemetry dictionary")

    voltage = _finite_number(reading, "voltage")
    current = _finite_number(reading, "current")
    temperature = _finite_number(reading, "temperature")
    cell_voltages = _cell_voltages(reading)

    cell_min = min(cell_voltages)
    cell_max = max(cell_voltages)
    cell_imbalance = cell_max - cell_min

    if temperature >= TEMPERATURE_CRITICAL_C:
        temperature_status = "CRITICAL"
        temperature_alert = "Battery temperature is critical"
    elif temperature >= TEMPERATURE_WARNING_C:
        temperature_status = "WARNING"
        temperature_alert = "Battery temperature is high"
    else:
        temperature_status = "NORMAL"
        temperature_alert = None

    if voltage < VOLTAGE_LOW_WARNING_V:
        voltage_status = "WARNING"
        voltage_alert = "Battery voltage is low"
    elif voltage > VOLTAGE_HIGH_WARNING_V:
        voltage_status = "WARNING"
        voltage_alert = "Battery voltage is high"
    else:
        voltage_status = "NORMAL"
        voltage_alert = None

    if abs(current) > CURRENT_WARNING_A:
        current_status = "WARNING"
        current_alert = "Battery current is high"
    else:
        current_status = "NORMAL"
        current_alert = None

    if _at_or_above(cell_imbalance, CELL_IMBALANCE_CRITICAL_V):
        cell_status = "CRITICAL"
        cell_alert = "Critical cell voltage imbalance"
    elif _at_or_above(cell_imbalance, CELL_IMBALANCE_WARNING_V):
        cell_status = "WARNING"
        cell_alert = "Cell voltage imbalance detected"
    else:
        cell_status = "NORMAL"
        cell_alert = None

    statuses = (temperature_status, voltage_status, current_status, cell_status)
    if "CRITICAL" in statuses:
        overall_status = "CRITICAL"
    elif "WARNING" in statuses:
        overall_status = "WARNING"
    else:
        overall_status = "NORMAL"

    alerts = [
        alert
        for alert in (temperature_alert, voltage_alert, current_alert, cell_alert)
        if alert is not None
    ]

    return {
        "power_w": round(voltage * current, 2),
        "cell_min_v": round(cell_min, 3),
        "cell_max_v": round(cell_max, 3),
        "cell_imbalance_v": round(cell_imbalance, 3),
        "temperature_status": temperature_status,
        "voltage_status": voltage_status,
        "current_status": current_status,
        "cell_status": cell_status,
        "overall_status": overall_status,
        "alerts": alerts,
    }
