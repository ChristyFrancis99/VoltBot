"""Explainable recent-window health assessment for live pack telemetry."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping, Sequence


MIN_TREND_SAMPLES = 4
HEALTH_WINDOW_SIZE = 12

# Demo thresholds are intended for this project's simulation, not universal EV limits.
# Trend thresholds are per minute. They separate the bundled healthy demo
# sequence (about -0.09 V/min, +0.39 A/min, +0.38 C/min) from degradation
# (about -0.44 V/min, +2.1 A/min, +2.7 C/min).
VOLTAGE_DECLINE_WATCH_V_PER_MIN = 0.20
VOLTAGE_DECLINE_DEGRADED_V_PER_MIN = 0.35
TEMPERATURE_RISE_WATCH_C_PER_MIN = 1.0
TEMPERATURE_RISE_DEGRADED_C_PER_MIN = 2.0
CURRENT_INCREASE_WATCH_A_PER_MIN = 1.5
CELL_IMBALANCE_RISE_WATCH_V_PER_MIN = 0.05

HIGH_TEMPERATURE_C = 45.0
CRITICAL_TEMPERATURE_C = 55.0
HIGH_CURRENT_A = 25.0
CELL_IMBALANCE_WATCH_V = 0.10
CELL_IMBALANCE_CRITICAL_V = 0.20
IDLE_CURRENT_A = 0.5


def _number(reading: Mapping[str, Any], key: str) -> float:
    value = reading.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Telemetry field '{key}' must be numeric")
    return float(value)


def _timestamp_seconds(reading: Mapping[str, Any]) -> float:
    value = reading.get("timestamp")
    if not isinstance(value, str):
        raise ValueError("Telemetry timestamp must be an ISO timestamp string")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError as error:
        raise ValueError("Telemetry timestamp must be a valid ISO timestamp") from error


def _slope_per_minute(
    timestamps: Sequence[float], values: Sequence[float]
) -> float | None:
    if len(values) < 2:
        return None

    origin = timestamps[0]
    elapsed_minutes = [(value - origin) / 60.0 for value in timestamps]
    mean_x = sum(elapsed_minutes) / len(elapsed_minutes)
    mean_y = sum(values) / len(values)
    denominator = sum((value - mean_x) ** 2 for value in elapsed_minutes)
    if denominator == 0:
        return None
    return sum(
        (x - mean_x) * (y - mean_y)
        for x, y in zip(elapsed_minutes, values)
    ) / denominator


def _mean(values: Sequence[float]) -> float:
    return sum(values) / len(values)


def analyze_battery_health(
    readings: Sequence[Mapping[str, Any]],
) -> dict[str, Any]:
    """Assess recent telemetry behavior without using an ML model or SOH labels."""
    if not readings:
        raise ValueError("At least one telemetry reading is required")

    window = readings[-HEALTH_WINDOW_SIZE:]
    timestamps = [_timestamp_seconds(reading) for reading in window]
    voltages = [_number(reading, "voltage") for reading in window]
    currents = [_number(reading, "current") for reading in window]
    current_demand = [abs(value) for value in currents]
    temperatures = [_number(reading, "temperature") for reading in window]
    imbalances = [_number(reading, "cell_imbalance_v") for reading in window]

    voltage_trend = _slope_per_minute(timestamps, voltages)
    temperature_trend = _slope_per_minute(timestamps, temperatures)
    current_trend = _slope_per_minute(timestamps, currents)
    current_demand_trend = _slope_per_minute(timestamps, current_demand)
    imbalance_trend = _slope_per_minute(timestamps, imbalances)

    enough_for_trends = len(window) >= MIN_TREND_SAMPLES
    voltage_declining = (
        enough_for_trends
        and voltage_trend is not None
        and voltage_trend <= -VOLTAGE_DECLINE_WATCH_V_PER_MIN
    )
    temperature_rising = (
        enough_for_trends
        and temperature_trend is not None
        and temperature_trend >= TEMPERATURE_RISE_WATCH_C_PER_MIN
    )
    current_increasing = (
        enough_for_trends
        and current_demand_trend is not None
        and current_demand_trend >= CURRENT_INCREASE_WATCH_A_PER_MIN
    )
    cell_imbalance_detected = (
        imbalances[-1] >= CELL_IMBALANCE_WATCH_V
        or (
            enough_for_trends
            and imbalance_trend is not None
            and imbalance_trend >= CELL_IMBALANCE_RISE_WATCH_V_PER_MIN
        )
    )

    flags = {
        "voltage_declining": voltage_declining,
        "temperature_rising": temperature_rising,
        "current_increasing": current_increasing,
        "cell_imbalance_detected": cell_imbalance_detected,
    }
    patterns: list[str] = []
    if voltage_declining:
        patterns.append("Voltage is declining rapidly")
    if temperature_rising:
        patterns.append("Temperature is continuously increasing")
    if current_increasing:
        patterns.append("Current demand is increasing")
    if cell_imbalance_detected:
        if enough_for_trends and imbalance_trend is not None and imbalance_trend >= CELL_IMBALANCE_RISE_WATCH_V_PER_MIN:
            patterns.append("Cell voltage imbalance is increasing")
        else:
            patterns.append("Cell voltage imbalance is above the demo watch threshold")
    if max(temperatures) >= HIGH_TEMPERATURE_C:
        patterns.append("Recent temperature reached the high-temperature threshold")
    if min(voltages) < 42.0:
        patterns.append("Recent pack voltage fell below the demo warning threshold")
    if max(current_demand) > HIGH_CURRENT_A:
        patterns.append("Recent current exceeded the demo warning threshold")

    latest = window[-1]
    latest_statuses = [
        latest.get(key)
        for key in (
            "temperature_status",
            "voltage_status",
            "current_status",
            "cell_status",
        )
    ]
    abnormal_status_count = sum(status in ("WARNING", "CRITICAL") for status in latest_statuses)
    recent_statuses = [
        reading.get("overall_status")
        for reading in window[-2:]
    ]
    persistent_critical = len(recent_statuses) == 2 and all(
        status == "CRITICAL" for status in recent_statuses
    )
    simultaneous_faults = len(window) >= 3 and abnormal_status_count >= 3
    sustained_critical_temperature = (
        sum(value >= CRITICAL_TEMPERATURE_C for value in temperatures[-2:]) == 2
    )
    sustained_critical_imbalance = (
        sum(value >= CELL_IMBALANCE_CRITICAL_V for value in imbalances[-2:]) == 2
    )

    penalty = 0
    trend_count = sum(
        (voltage_declining, temperature_rising, current_increasing)
    )
    if voltage_declining:
        penalty += 28 if voltage_trend is not None and voltage_trend <= -VOLTAGE_DECLINE_DEGRADED_V_PER_MIN else 18
    if temperature_rising:
        penalty += 25 if temperature_trend is not None and temperature_trend >= TEMPERATURE_RISE_DEGRADED_C_PER_MIN else 16
    if current_increasing:
        penalty += 14
    if cell_imbalance_detected:
        penalty += 30 if imbalances[-1] >= CELL_IMBALANCE_CRITICAL_V else 15
    if sum(value >= HIGH_TEMPERATURE_C for value in temperatures[-3:]) >= 2:
        penalty += 18
    if sum(value > HIGH_CURRENT_A for value in current_demand[-3:]) >= 2:
        penalty += 15
    if sum(value < 42.0 for value in voltages[-3:]) >= 2:
        penalty += 15

    health_score = max(0, min(100, 100 - penalty))
    if (
        persistent_critical
        or simultaneous_faults
        or sustained_critical_temperature
        or sustained_critical_imbalance
    ):
        health_status = "CRITICAL"
    elif trend_count >= 2 or health_score < 65:
        health_status = "DEGRADED"
    elif trend_count > 0 or abnormal_status_count > 0 or health_score < 90:
        health_status = "WATCH"
    else:
        health_status = "HEALTHY"

    latest_current = currents[-1]
    if latest_current > IDLE_CURRENT_A:
        operating_state = "DISCHARGING"
    elif latest_current < -IDLE_CURRENT_A:
        operating_state = "CHARGING"
    else:
        operating_state = "IDLE"

    sample_count = len(window)
    return {
        "health_status": health_status,
        "health_score": health_score,
        "operating_state": operating_state,
        "patterns": patterns,
        "pattern_flags": flags,
        "voltage_trend_v_per_min": round(voltage_trend, 3) if voltage_trend is not None else None,
        "temperature_trend_c_per_min": round(temperature_trend, 3) if temperature_trend is not None else None,
        "current_trend_a_per_min": round(current_trend, 3) if current_trend is not None else None,
        "cell_imbalance_trend_v_per_min": round(imbalance_trend, 4) if imbalance_trend is not None else None,
        "average_voltage_v": round(_mean(voltages), 3),
        "average_current_a": round(_mean(currents), 3),
        "average_temperature_c": round(_mean(temperatures), 3),
        "maximum_temperature_c": round(max(temperatures), 3),
        "minimum_voltage_v": round(min(voltages), 3),
        "recent_current_behavior": (
            "increasing" if current_increasing else
            "decreasing" if current_demand_trend is not None and current_demand_trend <= -CURRENT_INCREASE_WATCH_A_PER_MIN else
            "stable"
        ),
        "sample_count": sample_count,
        "health_sample_count": sample_count,
    }
