"""Exercise saved SOH/anomaly models with deterministic telemetry examples."""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Sequence

import joblib
import numpy as np
import pandas as pd

from feature_processor import load_model_feature_manifests, process_telemetry_window


ML_DIR = Path(__file__).resolve().parent
MODEL_DIR = ML_DIR / "models"
SOH_MODEL_PATH = MODEL_DIR / "soh_model.pkl"
ANOMALY_MODEL_PATH = MODEL_DIR / "anomaly_model.pkl"
READING_COUNT = 5


def _make_window(
    start: datetime,
    voltages: Sequence[float],
    currents: Sequence[float],
    temperatures: Sequence[float],
    cell_voltage_sets: Sequence[Sequence[float]],
) -> list[dict[str, object]]:
    if not all(
        len(values) == READING_COUNT
        for values in (voltages, currents, temperatures, cell_voltage_sets)
    ):
        raise ValueError(f"Each scenario must contain exactly {READING_COUNT} readings")

    return [
        {
            "timestamp": (start + timedelta(minutes=index)).isoformat(),
            "voltage": voltages[index],
            "current": currents[index],
            "temperature": temperatures[index],
            "cell_voltages": list(cell_voltage_sets[index]),
        }
        for index in range(READING_COUNT)
    ]


def _scenarios() -> list[tuple[str, list[dict[str, object]]]]:
    normal_cells = [
        [3.70, 3.71, 3.69, 3.70],
        [3.70, 3.71, 3.70, 3.69],
        [3.71, 3.70, 3.69, 3.70],
        [3.70, 3.72, 3.69, 3.70],
        [3.71, 3.70, 3.70, 3.69],
    ]
    normal_voltage = [48.0, 48.1, 48.05, 48.15, 48.1]
    normal_current = [8.2, 8.5, 8.3, 8.6, 8.4]
    normal_temperature = [30.1, 30.4, 30.2, 30.7, 30.5]

    return [
        (
            "Normal",
            _make_window(
                datetime(2026, 10, 9, 12, 0, tzinfo=timezone.utc),
                normal_voltage,
                normal_current,
                normal_temperature,
                normal_cells,
            ),
        ),
        (
            "Overheating input example",
            _make_window(
                datetime(2026, 10, 9, 13, 0, tzinfo=timezone.utc),
                [46.8, 46.9, 47.0, 46.7, 46.9],
                [14.2, 15.0, 16.3, 15.8, 16.1],
                [51.0, 52.4, 54.1, 55.3, 56.0],
                [
                    [3.58, 3.59, 3.57, 3.58],
                    [3.58, 3.58, 3.57, 3.59],
                    [3.57, 3.58, 3.58, 3.59],
                    [3.57, 3.59, 3.58, 3.58],
                    [3.58, 3.58, 3.57, 3.59],
                ],
            ),
        ),
        (
            "Cell imbalance input example",
            _make_window(
                datetime(2026, 10, 9, 14, 0, tzinfo=timezone.utc),
                normal_voltage,
                normal_current,
                normal_temperature,
                [
                    [4.16, 3.28, 4.12, 4.08],
                    [4.17, 3.25, 4.11, 4.09],
                    [4.15, 3.30, 4.13, 4.07],
                    [4.18, 3.27, 4.10, 4.08],
                    [4.16, 3.26, 4.12, 4.09],
                ],
            ),
        ),
        (
            "Degraded battery input example",
            _make_window(
                datetime(2026, 10, 9, 15, 0, tzinfo=timezone.utc),
                [44.8, 44.5, 44.2, 43.9, 43.7],
                [15.2, 16.1, 17.3, 18.4, 19.2],
                [37.5, 38.2, 39.0, 40.3, 41.2],
                [
                    [3.43, 3.42, 3.41, 3.40],
                    [3.42, 3.41, 3.40, 3.39],
                    [3.41, 3.40, 3.39, 3.38],
                    [3.40, 3.39, 3.38, 3.37],
                    [3.39, 3.38, 3.37, 3.36],
                ],
            ),
        ),
    ]


def _model_input(features: dict[str, float | int], feature_order: tuple[str, ...]) -> pd.DataFrame:
    missing = set(feature_order).difference(features)
    if missing:
        raise AssertionError(f"Processed feature vector is missing: {sorted(missing)}")
    return pd.DataFrame([[features[name] for name in feature_order]], columns=feature_order)


def main() -> None:
    for model_path in (SOH_MODEL_PATH, ANOMALY_MODEL_PATH):
        if not model_path.is_file():
            raise FileNotFoundError(f"Saved model not found: {model_path}")

    soh_model = joblib.load(SOH_MODEL_PATH)
    anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
    manifests = load_model_feature_manifests()
    soh_features = manifests["soh"]
    anomaly_features = manifests["anomaly"]

    if len(soh_features) != soh_model.n_features_in_:
        raise AssertionError("SOH manifest length does not match the saved model")
    if len(anomaly_features) != anomaly_model.n_features_in_:
        raise AssertionError("Anomaly manifest length does not match the saved model")
    if hasattr(soh_model, "feature_names_in_") and tuple(soh_model.feature_names_in_) != soh_features:
        raise AssertionError("SOH manifest feature order does not match the saved model")
    if hasattr(anomaly_model, "feature_names_in_") and tuple(anomaly_model.feature_names_in_) != anomaly_features:
        raise AssertionError("Anomaly manifest feature order does not match the saved model")

    for scenario_name, readings in _scenarios():
        features = process_telemetry_window(readings)
        soh_input = _model_input(features, soh_features)
        anomaly_input = _model_input(features, anomaly_features)
        if len(soh_input.columns) != soh_model.n_features_in_:
            raise AssertionError("SOH input vector length does not match the saved model")
        if len(anomaly_input.columns) != anomaly_model.n_features_in_:
            raise AssertionError("Anomaly input vector length does not match the saved model")

        predicted_soh = float(np.asarray(soh_model.predict(soh_input)).reshape(-1)[0])
        anomaly_prediction = int(np.asarray(anomaly_model.predict(anomaly_input)).reshape(-1)[0])
        anomaly_score = float(np.asarray(anomaly_model.score_samples(anomaly_input)).reshape(-1)[0])

        if not np.isfinite(predicted_soh) or not 0 <= predicted_soh <= 100:
            raise AssertionError(f"Invalid SOH prediction for {scenario_name}: {predicted_soh}")
        if anomaly_prediction not in (-1, 1):
            raise AssertionError(
                f"Invalid IsolationForest prediction for {scenario_name}: {anomaly_prediction}"
            )
        if not np.isfinite(anomaly_score):
            raise AssertionError(f"Invalid anomaly score for {scenario_name}: {anomaly_score}")

        anomaly_label = "Not flagged" if anomaly_prediction == 1 else "Telemetry outlier indicated"
        print(f"Scenario: {scenario_name}")
        print(f"Predicted SOH: {predicted_soh:.2f}%")
        print(f"Anomaly prediction: {anomaly_label} ({anomaly_prediction})")
        print(f"Anomaly score_samples: {anomaly_score:.4f} (lower = more unusual)")
        print(f"Feature vector lengths: SOH={len(soh_features)}, anomaly={len(anomaly_features)}")
        print()

    print(
        "Scenario labels describe the supplied test inputs only. IsolationForest flags "
        "are telemetry outlier indications, not verified overheating or cell-imbalance diagnoses."
    )
    print("All live model inference checks passed.")


if __name__ == "__main__":
    main()
