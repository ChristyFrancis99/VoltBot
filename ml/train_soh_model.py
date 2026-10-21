"""Train and evaluate the Phase 3 SOH regression baseline."""

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "processed" / "battery_cycles.csv"
MODEL_DIR = ML_DIR / "models"
PLOT_DIR = ML_DIR / "processed" / "plots"
MODEL_PATH = MODEL_DIR / "soh_model.pkl"
FEATURES_PATH = MODEL_DIR / "soh_model_features.json"
PLOT_PATH = PLOT_DIR / "soh_actual_vs_predicted_B0018.png"

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
TARGET = "soh_percent"
TRAIN_BATTERIES = ("B0005", "B0006", "B0007")
TEST_BATTERY = "B0018"


def main() -> None:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(f"Processed dataset not found: {DATA_PATH}")
    if "capacity_ah" in FEATURES or TARGET in FEATURES:
        raise ValueError("Target leakage: capacity_ah and soh_percent cannot be features")

    data = pd.read_csv(DATA_PATH)
    required_columns = {"battery_id", "cycle_number", TARGET, *FEATURES}
    missing_columns = required_columns.difference(data.columns)
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing_columns)}")

    train_data = data[data["battery_id"].isin(TRAIN_BATTERIES)].copy()
    test_data = data[data["battery_id"] == TEST_BATTERY].copy()
    if train_data.empty or test_data.empty:
        raise ValueError("Training or held-out battery data is empty")
    if set(train_data["battery_id"]) & set(test_data["battery_id"]):
        raise ValueError("Battery-level split contains a training/test overlap")
    if not np.isfinite(train_data[FEATURES + [TARGET]].to_numpy(dtype=float)).all():
        raise ValueError("Training data contains missing or non-finite model values")
    if not np.isfinite(test_data[FEATURES + [TARGET]].to_numpy(dtype=float)).all():
        raise ValueError("Test data contains missing or non-finite model values")

    X_train = train_data[FEATURES]
    y_train = train_data[TARGET]
    X_test = test_data[FEATURES]
    y_test = test_data[TARGET]

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        min_samples_leaf=2,
        n_jobs=1,
    )
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r_squared = r2_score(y_test, predictions)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    with FEATURES_PATH.open("w", encoding="utf-8") as feature_file:
        json.dump({"target": TARGET, "features": FEATURES}, feature_file, indent=2)
        feature_file.write("\n")

    results = test_data[["cycle_number"]].copy()
    results["actual_soh_percent"] = y_test.to_numpy()
    results["predicted_soh_percent"] = predictions

    figure, axis = plt.subplots(figsize=(7, 6))
    axis.scatter(y_test, predictions, alpha=0.75, s=28, color="#2563eb", edgecolors="none")
    lower = float(min(y_test.min(), predictions.min()))
    upper = float(max(y_test.max(), predictions.max()))
    axis.plot([lower, upper], [lower, upper], linestyle="--", color="#dc2626", label="Perfect prediction")
    axis.set(
        title=f"SOH prediction vs actual ({TEST_BATTERY})",
        xlabel="Actual SOH (%)",
        ylabel="Predicted SOH (%)",
    )
    axis.grid(alpha=0.25)
    axis.legend()
    figure.tight_layout()
    figure.savefig(PLOT_PATH, dpi=160)
    plt.close(figure)

    importance = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)

    print(f"Training rows: {len(train_data)}")
    print(f"Testing rows: {len(test_data)}")
    print(f"Training batteries: {', '.join(TRAIN_BATTERIES)}")
    print(f"Test battery: {TEST_BATTERY}")
    print(f"Features used, in model order: {FEATURES}")
    print("\nTest metrics:")
    print(f"MAE:  {mae:.4f} percentage points")
    print(f"RMSE: {rmse:.4f} percentage points")
    print(f"R²:   {r_squared:.4f}")
    print("\nFeature importance:")
    print(importance.to_string(float_format=lambda value: f"{value:.4f}"))
    print(f"\nActual vs predicted SOH for {TEST_BATTERY}:")
    print(
        results.to_string(
            index=False,
            formatters={
                "actual_soh_percent": "{:.4f}".format,
                "predicted_soh_percent": "{:.4f}".format,
            },
        )
    )
    print(f"\nSaved model: {MODEL_PATH}")
    print(f"Saved feature order: {FEATURES_PATH}")
    print(f"Saved prediction plot: {PLOT_PATH}")


if __name__ == "__main__":
    main()
