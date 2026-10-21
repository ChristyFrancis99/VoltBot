"""Explore the processed NASA battery-cycle dataset without training a model."""

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ML_DIR = Path(__file__).resolve().parent
DATA_PATH = ML_DIR / "processed" / "battery_cycles.csv"
PLOT_DIR = ML_DIR / "processed" / "plots"

INPUT_FEATURES = [
    "cycle_number",
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

BATTERY_COLORS = {
    "B0005": "#2563eb",
    "B0006": "#dc2626",
    "B0007": "#059669",
    "B0018": "#d97706",
}


def _validate_columns(data: pd.DataFrame) -> None:
    required = {"battery_id", "capacity_ah", "soh_percent", *INPUT_FEATURES}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")


def _print_dataset_report(data: pd.DataFrame) -> None:
    print(f"Dataset: {DATA_PATH}")
    print(f"Rows: {len(data)}")
    print(f"Columns: {len(data.columns)}")
    print("Column names:")
    print(", ".join(data.columns))
    print("\nData types:")
    print(data.dtypes.to_string())
    print("\nMissing values by column:")
    print(data.isna().sum().to_string())
    print("\nBasic statistics:")
    print(data.describe(include="all").transpose().to_string())


def _print_correlations(data: pd.DataFrame) -> None:
    correlations = (
        data[INPUT_FEATURES + ["soh_percent"]]
        .corr(numeric_only=True)["soh_percent"]
        .drop("soh_percent")
        .sort_values(key=lambda values: values.abs(), ascending=False)
    )
    print("\nPearson correlation with SOH (capacity_ah excluded):")
    print(correlations.to_string(float_format=lambda value: f"{value:+.4f}"))


def _print_outlier_checks(data: pd.DataFrame) -> None:
    print("\nData quality and outlier checks:")
    checks = {
        "duplicate battery/cycle keys": data.duplicated(["battery_id", "cycle_number"]),
        "SOH outside 0-120%": ~data["soh_percent"].between(0, 120),
        "nonpositive capacity": data["capacity_ah"] <= 0,
        "nonpositive minimum voltage": data["min_voltage_v"] <= 0,
        "temperature outside -40 to 125 C": ~data["min_temperature_c"].between(-40, 125)
        | ~data["max_temperature_c"].between(-40, 125),
        "nonpositive discharge duration": data["discharge_duration_s"] <= 0,
        "nonpositive measurement count": data["measurement_count"] <= 0,
        "mean voltage outside measured bounds": ~data["mean_voltage_v"].between(
            data["min_voltage_v"], data["max_voltage_v"]
        ),
    }
    for label, mask in checks.items():
        print(f"{label}: {int(mask.sum())}")

    print("IQR outlier candidates by input feature and battery:")
    for feature in INPUT_FEATURES:
        outlier_count = 0
        for _, battery_rows in data.groupby("battery_id"):
            lower_quartile = battery_rows[feature].quantile(0.25)
            upper_quartile = battery_rows[feature].quantile(0.75)
            spread = upper_quartile - lower_quartile
            outlier_count += int(
                (
                    (battery_rows[feature] < lower_quartile - 1.5 * spread)
                    | (battery_rows[feature] > upper_quartile + 1.5 * spread)
                ).sum()
            )
        if outlier_count:
            print(f"{feature}: {outlier_count}")
    print("IQR flags are review candidates; lifecycle trends can naturally create them.")


def _save_line_plot(data: pd.DataFrame, y_column: str, y_label: str, filename: str) -> None:
    figure, axis = plt.subplots(figsize=(9, 5.5))
    for battery_id, battery_rows in data.groupby("battery_id", sort=True):
        battery_rows = battery_rows.sort_values("cycle_number")
        axis.plot(
            battery_rows["cycle_number"],
            battery_rows[y_column],
            marker=".",
            markersize=4,
            linewidth=1.2,
            color=BATTERY_COLORS.get(battery_id),
            label=battery_id,
        )
    axis.set(title=f"{y_label} vs cycle number", xlabel="Cycle number", ylabel=y_label)
    axis.grid(alpha=0.25)
    axis.legend(title="Battery")
    figure.tight_layout()
    figure.savefig(PLOT_DIR / filename, dpi=160)
    plt.close(figure)


def _save_scatter_plot(data: pd.DataFrame, x_column: str, x_label: str, filename: str) -> None:
    figure, axis = plt.subplots(figsize=(8, 5.5))
    for battery_id, battery_rows in data.groupby("battery_id", sort=True):
        axis.scatter(
            battery_rows[x_column],
            battery_rows["soh_percent"],
            s=22,
            alpha=0.7,
            color=BATTERY_COLORS.get(battery_id),
            label=battery_id,
        )
    axis.set(title=f"SOH vs {x_label.lower()}", xlabel=x_label, ylabel="SOH (%)")
    axis.grid(alpha=0.25)
    axis.legend(title="Battery")
    figure.tight_layout()
    figure.savefig(PLOT_DIR / filename, dpi=160)
    plt.close(figure)


def _save_plots(data: pd.DataFrame) -> None:
    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    _save_line_plot(data, "soh_percent", "SOH (%)", "soh_vs_cycle.png")
    _save_line_plot(data, "capacity_ah", "Capacity (Ah)", "capacity_vs_cycle.png")
    _save_scatter_plot(data, "mean_voltage_v", "Mean voltage (V)", "mean_voltage_vs_soh.png")
    _save_scatter_plot(
        data, "mean_temperature_c", "Mean temperature (C)", "mean_temperature_vs_soh.png"
    )
    _save_scatter_plot(
        data, "discharge_duration_s", "Discharge duration (s)", "discharge_duration_vs_soh.png"
    )


def main() -> None:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(f"Processed dataset not found: {DATA_PATH}")

    data = pd.read_csv(DATA_PATH)
    _validate_columns(data)
    PLOT_DIR.mkdir(parents=True, exist_ok=True)
    _print_dataset_report(data)
    _print_correlations(data)
    _print_outlier_checks(data)
    _save_plots(data)
    print(f"\nSaved 5 plots to: {PLOT_DIR}")


if __name__ == "__main__":
    main()
