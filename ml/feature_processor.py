"""Transform a telemetry window into the feature order expected by ML models."""

import json
import math
from datetime import datetime, timezone
from functools import lru_cache
from numbers import Real
from pathlib import Path
from typing import Mapping, Sequence


ML_DIR = Path(__file__).resolve().parent
MODEL_FEATURE_MANIFESTS = {
    "soh": ML_DIR / "models" / "soh_model_features.json",
    "anomaly": ML_DIR / "models" / "anomaly_model_features.json",
}
FEATURE_ORDER = (
    "mean_voltage_v",
    "min_voltage_v",
    "max_voltage_v",
    "mean_current_a",
    "min_current_a",
    "max_current_a",
    "mean_temperature_c",
    "min_temperature_c",
    "max_temperature_c",
    "discharge_duration_s",
    "measurement_count",
)
FORBIDDEN_MODEL_FEATURES = {"capacity_ah", "soh_percent", "battery_id"}


@lru_cache(maxsize=1)
def load_model_feature_manifests() -> dict[str, tuple[str, ...]]:
    """Load and validate the saved SOH and anomaly model feature orders."""
    manifests: dict[str, tuple[str, ...]] = {}
    for model_name, manifest_path in MODEL_FEATURE_MANIFESTS.items():
        if not manifest_path.is_file():
            raise FileNotFoundError(f"Feature manifest not found: {manifest_path}")
        with manifest_path.open(encoding="utf-8") as manifest_file:
            manifest = json.load(manifest_file)
        features = manifest.get("features")
        if not isinstance(features, list) or not all(
            isinstance(feature, str) for feature in features
        ):
            raise ValueError(f"Invalid feature list in {manifest_path}")
        forbidden = FORBIDDEN_MODEL_FEATURES.intersection(features)
        if forbidden:
            raise ValueError(
                f"{model_name} manifest contains forbidden model features: {sorted(forbidden)}"
            )
        manifests[model_name] = tuple(features)
    return manifests


def _parse_timestamp(value: object, index: int) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Reading {index} must have a non-empty ISO timestamp")
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as error:
        raise ValueError(f"Reading {index} has an invalid ISO timestamp") from error


def _numeric_values(readings: Sequence[Mapping[str, object]], field: str) -> list[float]:
    values: list[float] = []
    for index, reading in enumerate(readings):
        if field not in reading:
            raise ValueError(f"Reading {index} is missing '{field}'")
        value = reading[field]
        if isinstance(value, bool) or not isinstance(value, Real):
            raise ValueError(f"Reading {index} field '{field}' must be numeric")
        numeric_value = float(value)
        if not math.isfinite(numeric_value):
            raise ValueError(f"Reading {index} field '{field}' must be finite")
        values.append(numeric_value)
    return values


def verify_model_feature_coverage(features: Mapping[str, Real]) -> None:
    """Ensure computed features cover both model manifests without leakage keys."""
    forbidden = FORBIDDEN_MODEL_FEATURES.intersection(features)
    if forbidden:
        raise ValueError(f"Feature vector contains forbidden inputs: {sorted(forbidden)}")

    for model_name, required_features in load_model_feature_manifests().items():
        missing = set(required_features).difference(features)
        if missing:
            raise ValueError(
                f"Feature vector is missing {model_name} model features: {sorted(missing)}"
            )


def process_telemetry_window(
    readings: Sequence[Mapping[str, object]],
) -> dict[str, float | int]:
    """Summarize raw readings into the shared SOH/anomaly model feature vector."""
    if not readings:
        raise ValueError("At least one telemetry reading is required")

    timestamps = [
        _parse_timestamp(reading.get("timestamp"), index)
        for index, reading in enumerate(readings)
    ]
    awareness = [timestamp.utcoffset() is not None for timestamp in timestamps]
    if any(is_aware != awareness[0] for is_aware in awareness):
        raise ValueError("Timestamps must consistently include or omit timezone offsets")
    if awareness[0]:
        timestamps = [timestamp.astimezone(timezone.utc) for timestamp in timestamps]

    duration_seconds = (timestamps[-1] - timestamps[0]).total_seconds()
    if duration_seconds < 0:
        raise ValueError("Last timestamp must not precede the first timestamp")

    voltages = _numeric_values(readings, "voltage")
    currents = _numeric_values(readings, "current")
    temperatures = _numeric_values(readings, "temperature")

    features: dict[str, float | int] = {
        "mean_voltage_v": sum(voltages) / len(voltages),
        "min_voltage_v": min(voltages),
        "max_voltage_v": max(voltages),
        "mean_current_a": sum(currents) / len(currents),
        "min_current_a": min(currents),
        "max_current_a": max(currents),
        "mean_temperature_c": sum(temperatures) / len(temperatures),
        "min_temperature_c": min(temperatures),
        "max_temperature_c": max(temperatures),
        "discharge_duration_s": duration_seconds,
        "measurement_count": len(readings),
    }
    verify_model_feature_coverage(features)
    return features
