"""Convert NASA battery MATLAB files into cycle-level CSV features."""

import csv
import sys
from pathlib import Path
from typing import Any

import numpy as np
from scipy.io import loadmat


ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / "data"
OUTPUT_PATH = ML_DIR / "processed" / "battery_cycles.csv"
BATTERY_IDS = ("B0005", "B0006", "B0007", "B0018")
COLUMNS = (
    "battery_id",
    "cycle_number",
    "capacity_ah",
    "soh_percent",
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


def _unwrap_singletons(value: Any) -> Any:
    while isinstance(value, np.ndarray) and value.size == 1:
        if value.dtype.names is not None:
            value = value.reshape(-1)[0]
        else:
            value = value.item()
    return value


def _finite_measurements(payload: np.void, field: str) -> np.ndarray:
    value = _unwrap_singletons(payload[field])
    measurements = np.asarray(value, dtype=float).reshape(-1)
    return measurements[np.isfinite(measurements)]


def _summarize_discharge(
    battery_id: str, cycle_number: int, cycle: np.void
) -> dict[str, str | int | float]:
    payload = _unwrap_singletons(cycle["data"])
    if not isinstance(payload, np.void) or payload.dtype.names is None:
        raise ValueError("discharge data is not a MATLAB struct")

    voltage = _finite_measurements(payload, "Voltage_measured")
    current = _finite_measurements(payload, "Current_measured")
    temperature = _finite_measurements(payload, "Temperature_measured")
    time = _finite_measurements(payload, "Time")
    capacity_values = _finite_measurements(payload, "Capacity")

    if any(values.size == 0 for values in (voltage, current, temperature, time)):
        raise ValueError("one or more measurement arrays are empty")
    if capacity_values.size != 1 or capacity_values[0] <= 0:
        raise ValueError("discharge capacity is missing or invalid")

    return {
        "battery_id": battery_id,
        "cycle_number": cycle_number,
        "capacity_ah": float(capacity_values[0]),
        "mean_voltage_v": float(np.mean(voltage)),
        "min_voltage_v": float(np.min(voltage)),
        "max_voltage_v": float(np.max(voltage)),
        "mean_current_a": float(np.mean(current)),
        "min_current_a": float(np.min(current)),
        "max_current_a": float(np.max(current)),
        "mean_temperature_c": float(np.mean(temperature)),
        "min_temperature_c": float(np.min(temperature)),
        "max_temperature_c": float(np.max(temperature)),
        "discharge_duration_s": float(np.max(time) - np.min(time)),
        "measurement_count": int(voltage.size),
    }


def _extract_battery(battery_id: str) -> list[dict[str, str | int | float]]:
    file_path = DATA_DIR / f"{battery_id}.mat"
    mat_data = loadmat(file_path)
    if battery_id not in mat_data:
        raise KeyError(f"MATLAB file does not contain '{battery_id}'")

    battery = mat_data[battery_id]
    cycles = battery[0, 0]["cycle"].reshape(-1)
    readings: list[dict[str, str | int | float]] = []
    skipped = 0

    for cycle_number, cycle in enumerate(cycles, start=1):
        cycle_type = _unwrap_singletons(cycle["type"])
        if str(np.asarray(cycle_type).squeeze().item()).lower() != "discharge":
            continue
        try:
            readings.append(_summarize_discharge(battery_id, cycle_number, cycle))
        except (KeyError, TypeError, ValueError) as error:
            skipped += 1
            print(f"Skipping {battery_id} cycle {cycle_number}: {error}")

    if not readings:
        raise ValueError(f"No valid discharge cycles found for {battery_id}")
    if skipped:
        print(f"{battery_id}: skipped {skipped} invalid discharge cycle(s)")

    # Capacity and SOH are reference/target columns, not input features for an
    # SOH model. Feeding capacity into that model would leak the target.
    initial_capacity = float(readings[0]["capacity_ah"])
    for reading in readings:
        reading["soh_percent"] = float(reading["capacity_ah"]) / initial_capacity * 100

    return readings


def _write_dataset(readings: list[dict[str, str | int | float]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(readings)


def _print_summary() -> None:
    with OUTPUT_PATH.open("r", newline="", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        rows = list(reader)

    missing = {
        column: sum(not row[column].strip() for row in rows)
        for column in COLUMNS
    }
    battery_count = len({row["battery_id"] for row in rows})

    print(f"Saved: {OUTPUT_PATH}")
    print(f"Batteries: {battery_count}")
    print(f"Cycles: {len(rows)}")
    print(f"Columns: {', '.join(COLUMNS)}")
    print(f"Missing values by column: {missing}")
    print("First 5 rows:")
    writer = csv.writer(sys.stdout)
    writer.writerow(COLUMNS)
    writer.writerows([[row[column] for column in COLUMNS] for row in rows[:5]])


def main() -> None:
    readings = [
        reading
        for battery_id in BATTERY_IDS
        for reading in _extract_battery(battery_id)
    ]
    _write_dataset(readings)
    _print_summary()


if __name__ == "__main__":
    main()
