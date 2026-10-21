"""Train an IsolationForest baseline for unusual battery telemetry."""

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "processed" / "battery_cycles.csv"
MODEL_DIR = ML_DIR / "models"
PLOT_DIR = ML_DIR / "processed" / "plots"
MODEL_PATH = MODEL_DIR / "anomaly_model.pkl"
FEATURES_PATH = MODEL_DIR / "anomaly_model_features.json"

FEATURES = [
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
]
TRAINING_SELECTION = (
    "Per battery, use cycles at or before the 75th percentile of source cycle_number "
    "as early-to-mid-life presumed-normal baseline samples; this excludes each battery's "
    "final cycle quartile and does not use SOH to select training rows."
)
SOH_RANGE_LABELS = ["<60%", "60-<70%", "70-<80%", "80-<90%", ">=90%"]


def _select_training_rows(data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    early_cycle_cutoff = data.groupby("battery_id")["cycle_number"].transform(
        lambda cycles: cycles.quantile(0.75)
    )
    normal_training_mask = data["cycle_number"] <= early_cycle_cutoff
    return normal_training_mask, early_cycle_cutoff


def _save_score_plot(data: pd.DataFrame, x_column: str, x_label: str, filename: str) -> None:
    figure, axis = plt.subplots(figsize=(8, 5.5))
    for is_anomaly, label, color in (
        (False, "Not flagged", "#059669"),
        (True, "Flagged", "#dc2626"),
    ):
        rows = data[data["is_anomaly"] == is_anomaly]
        axis.scatter(
            rows[x_column],
            rows["anomaly_score"],
            s=24,
            alpha=0.7,
            label=label,
            color=color,
        )
    axis.set(title=f"Anomaly score vs {x_label.lower()}", xlabel=x_label, ylabel="Anomaly score (higher = more unusual)")
    axis.grid(alpha=0.25)
    axis.legend()
    figure.tight_layout()
    figure.savefig(PLOT_DIR / filename, dpi=160)
    plt.close(figure)


def _save_telemetry_scatter(data: pd.DataFrame) -> None:
    figure, axis = plt.subplots(figsize=(8, 5.5))
    for is_anomaly, label, color in (
        (False, "Not flagged", "#059669"),
        (True, "Flagged", "#dc2626"),
    ):
        rows = data[data["is_anomaly"] == is_anomaly]
        axis.scatter(
            rows["mean_voltage_v"],
            rows["mean_temperature_c"],
            s=24,
            alpha=0.7,
            label=label,
            color=color,
        )
    axis.set(
        title="Mean voltage vs mean temperature",
        xlabel="Mean voltage (V)",
        ylabel="Mean temperature (C)",
    )
    axis.grid(alpha=0.25)
    axis.legend()
    figure.tight_layout()
    figure.savefig(PLOT_DIR / "anomaly_telemetry_scatter.png", dpi=160)
    plt.close(figure)


def _print_evaluation(evaluation: pd.DataFrame, normal_training_count: int) -> None:
    anomaly_count = int(evaluation["is_anomaly"].sum())
    evaluation_count = len(evaluation)
    anomaly_percentage = anomaly_count / evaluation_count * 100

    print(f"Normal training samples: {normal_training_count}")
    print(f"Evaluation samples: {evaluation_count}")
    print(f"Evaluation samples classified as normal: {evaluation_count - anomaly_count}")
    print(f"Evaluation samples classified as anomalies: {anomaly_count}")
    print(f"Anomaly percentage of evaluation set: {anomaly_percentage:.2f}%")

    print("\nAnomaly counts by battery (evaluation rows, flagged):")
    by_battery = evaluation.groupby("battery_id").agg(
        evaluation_rows=("is_anomaly", "size"),
        anomalies=("is_anomaly", "sum"),
    )
    print(by_battery.to_string())

    print("\nAnomaly counts by SOH range (evaluation rows, flagged):")
    by_soh = evaluation.groupby("soh_range", observed=False).agg(
        evaluation_rows=("is_anomaly", "size"),
        anomalies=("is_anomaly", "sum"),
    )
    print(by_soh.to_string())

    print("\nFlagged battery/cycle pairs:")
    flagged = evaluation[evaluation["is_anomaly"]].sort_values(
        ["battery_id", "cycle_number"]
    )
    if flagged.empty:
        print("None")
    else:
        for battery_id, rows in flagged.groupby("battery_id", sort=True):
            cycles = ", ".join(str(int(cycle)) for cycle in rows["cycle_number"])
            print(f"{battery_id}: {cycles}")

    print("\nExample anomalous rows (highest anomaly scores):")
    example_columns = [
        "battery_id",
        "cycle_number",
        "soh_percent",
        "anomaly_score",
        "mean_voltage_v",
        "min_voltage_v",
        "mean_temperature_c",
    ]
    print(
        flagged.nlargest(10, "anomaly_score")[example_columns].to_string(
            index=False,
            formatters={
                "soh_percent": "{:.2f}".format,
                "anomaly_score": "{:.5f}".format,
                "mean_voltage_v": "{:.4f}".format,
                "min_voltage_v": "{:.4f}".format,
                "mean_temperature_c": "{:.2f}".format,
            },
        )
    )
    print(
        "\nThese are unsupervised telemetry flags, not verified fault labels. "
        "SOH is used only for report stratification; it is neither a model feature "
        "nor a training-selection criterion."
    )


def main() -> None:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(f"Processed dataset not found: {DATA_PATH}")

    data = pd.read_csv(DATA_PATH)
    required_columns = {"battery_id", "cycle_number", "soh_percent", *FEATURES}
    missing_columns = required_columns.difference(data.columns)
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing_columns)}")
    if "capacity_ah" in FEATURES or "soh_percent" in FEATURES or "battery_id" in FEATURES:
        raise ValueError("Target, capacity, and battery identity cannot be model features")
    if not np.isfinite(data[FEATURES + ["soh_percent"]].to_numpy(dtype=float)).all():
        raise ValueError("Dataset contains missing or non-finite model values")

    normal_training_mask, early_cycle_cutoff = _select_training_rows(data)
    normal_training = data[normal_training_mask].copy()
    evaluation = data[~normal_training_mask].copy()
    if normal_training.empty or evaluation.empty:
        raise ValueError("Normal training subset or evaluation set is empty")

    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        random_state=42,
        n_jobs=1,
    )
    model.fit(normal_training[FEATURES])

    evaluation["anomaly_score"] = -model.score_samples(evaluation[FEATURES])
    evaluation["is_anomaly"] = model.predict(evaluation[FEATURES]) == -1
    evaluation["soh_range"] = pd.cut(
        evaluation["soh_percent"],
        bins=[-np.inf, 60, 70, 80, 90, np.inf],
        labels=SOH_RANGE_LABELS,
        right=False,
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with FEATURES_PATH.open("w", encoding="utf-8") as feature_file:
        json.dump(
            {
                "features": FEATURES,
                "normal_training_selection": TRAINING_SELECTION,
                "contamination": 0.05,
            },
            feature_file,
            indent=2,
        )
        feature_file.write("\n")

    _save_score_plot(
        evaluation,
        "soh_percent",
        "SOH (%)",
        "anomaly_score_vs_soh.png",
    )
    _save_score_plot(
        evaluation,
        "cycle_number",
        "Cycle number",
        "anomaly_score_vs_cycle.png",
    )
    _save_telemetry_scatter(evaluation)

    print(f"Dataset rows: {len(data)}")
    print(f"Normal subset rule: {TRAINING_SELECTION}")
    print("Normal training rows by battery:")
    print(normal_training.groupby("battery_id").size().to_string())
    print("Early-to-mid-life cycle cutoff by battery:")
    print(
        data.assign(cutoff=early_cycle_cutoff)
        .groupby("battery_id")["cutoff"]
        .first()
        .to_string()
    )
    print(f"Features used, in model order: {FEATURES}")
    print("Contamination setting: 0.05")
    _print_evaluation(evaluation, len(normal_training))
    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved feature order: {FEATURES_PATH}")
    print(f"Saved plots: {PLOT_DIR}")


if __name__ == "__main__":
    main()
