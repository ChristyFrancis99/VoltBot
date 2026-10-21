"""Standalone checks for the live telemetry feature processor."""

import math
from datetime import datetime, timedelta, timezone
from numbers import Real

from feature_processor import (
    load_model_feature_manifests,
    process_telemetry_window,
)


def main() -> None:
    start = datetime(2026, 10, 9, 12, 0, tzinfo=timezone.utc)
    readings = [
        {
            "timestamp": (start + timedelta(seconds=30 * index)).isoformat(),
            "voltage": 48.2 + 0.1 * index,
            "current": 10.5 + 0.2 * index,
            "temperature": 33.5 + 0.3 * index,
            "cell_voltages": [3.71 + 0.01 * index, 3.70, 3.72, 3.69],
        }
        for index in range(5)
    ]

    features = process_telemetry_window(readings)
    manifests = load_model_feature_manifests()

    print("Processed feature dictionary:")
    print(features)

    assert len(readings) == 5
    assert features["measurement_count"] == 5
    assert features["discharge_duration_s"] == 120.0
    assert all(isinstance(value, Real) and math.isfinite(value) for value in features.values())
    assert not {"capacity_ah", "soh_percent", "battery_id"}.intersection(features)

    for model_name, feature_order in manifests.items():
        assert all(feature in features for feature in feature_order), model_name
        ordered_vector = [features[feature] for feature in feature_order]
        assert len(ordered_vector) == len(feature_order)
        assert all(math.isfinite(value) for value in ordered_vector)
        print(f"{model_name} model order: {ordered_vector}")

    print("Feature processor checks passed.")


if __name__ == "__main__":
    main()
