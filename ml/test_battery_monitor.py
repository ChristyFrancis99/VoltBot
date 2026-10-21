"""Standalone tests for rule-based live battery monitoring."""

import unittest
from datetime import datetime, timezone
from typing import Any

from battery_monitor import monitor_battery


def _reading(**overrides: Any) -> dict[str, Any]:
    reading: dict[str, Any] = {
        "device_id": "ESP32_BATTERY_01",
        "timestamp": datetime(2026, 10, 9, 12, 0, tzinfo=timezone.utc).isoformat(),
        "voltage": 48.0,
        "current": 10.0,
        "temperature": 32.0,
        "cell_voltages": [3.70, 3.71, 3.69, 3.70],
    }
    reading.update(overrides)
    return reading


class BatteryMonitorTests(unittest.TestCase):
    def test_normal_reading_has_no_alerts(self) -> None:
        result = monitor_battery(_reading())
        self.assertEqual(result["overall_status"], "NORMAL")
        self.assertEqual(result["alerts"], [])
        self.assertEqual(result["cell_imbalance_v"], 0.02)

    def test_overheating_warning(self) -> None:
        result = monitor_battery(_reading(temperature=50.0))
        self.assertEqual(result["temperature_status"], "WARNING")
        self.assertEqual(result["overall_status"], "WARNING")
        self.assertIn("Battery temperature is high", result["alerts"])

    def test_critical_overheating(self) -> None:
        result = monitor_battery(_reading(temperature=58.0))
        self.assertEqual(result["temperature_status"], "CRITICAL")
        self.assertEqual(result["overall_status"], "CRITICAL")
        self.assertIn("Battery temperature is critical", result["alerts"])

    def test_critical_cell_imbalance(self) -> None:
        result = monitor_battery(
            _reading(cell_voltages=[3.72, 3.71, 3.70, 3.50])
        )
        self.assertEqual(result["cell_imbalance_v"], 0.22)
        self.assertEqual(result["cell_status"], "CRITICAL")
        self.assertEqual(result["overall_status"], "CRITICAL")
        self.assertIn("Critical cell voltage imbalance", result["alerts"])

    def test_low_voltage_warning(self) -> None:
        result = monitor_battery(_reading(voltage=40.0))
        self.assertEqual(result["voltage_status"], "WARNING")
        self.assertEqual(result["overall_status"], "WARNING")
        self.assertIn("Battery voltage is low", result["alerts"])

    def test_high_current_warning(self) -> None:
        result = monitor_battery(_reading(current=30.0))
        self.assertEqual(result["current_status"], "WARNING")
        self.assertEqual(result["overall_status"], "WARNING")
        self.assertIn("Battery current is high", result["alerts"])

    def test_high_charging_current_warning_uses_magnitude(self) -> None:
        result = monitor_battery(_reading(current=-30.0))
        self.assertEqual(result["current_status"], "WARNING")
        self.assertEqual(result["overall_status"], "WARNING")
        self.assertIn("Battery current is high", result["alerts"])

    def test_multiple_problems_prioritize_critical(self) -> None:
        result = monitor_battery(
            _reading(
                temperature=58.0,
                voltage=40.0,
                current=30.0,
                cell_voltages=[3.72, 3.71, 3.70, 3.50],
            )
        )
        self.assertEqual(result["overall_status"], "CRITICAL")
        self.assertEqual(len(result["alerts"]), 4)

    def test_power_calculation(self) -> None:
        result = monitor_battery(_reading(voltage=48.0, current=10.0))
        self.assertEqual(result["power_w"], 480.0)

    def test_threshold_boundaries(self) -> None:
        self.assertEqual(monitor_battery(_reading(temperature=45.0))["temperature_status"], "WARNING")
        self.assertEqual(monitor_battery(_reading(temperature=55.0))["temperature_status"], "CRITICAL")
        self.assertEqual(monitor_battery(_reading(voltage=42.0))["voltage_status"], "NORMAL")
        self.assertEqual(monitor_battery(_reading(voltage=50.0))["voltage_status"], "NORMAL")
        self.assertEqual(monitor_battery(_reading(current=25.0))["current_status"], "NORMAL")
        self.assertEqual(
            monitor_battery(_reading(cell_voltages=[3.70, 3.80]))["cell_status"],
            "WARNING",
        )
        self.assertEqual(
            monitor_battery(_reading(cell_voltages=[3.70, 3.90]))["cell_status"],
            "CRITICAL",
        )

    def test_invalid_inputs_raise_value_error(self) -> None:
        invalid_cases = (
            ({"cell_voltages": []}, "cell_voltages.*empty"),
            ({"voltage": "48.0"}, "voltage.*numeric"),
            ({"temperature": "warm"}, "temperature.*numeric"),
            ({"voltage": float("nan")}, "voltage.*finite"),
            ({"current": float("inf")}, "current.*finite"),
            ({"cell_voltages": [3.7, float("nan")]}, "Cell voltage.*finite"),
        )
        for overrides, message in invalid_cases:
            with self.subTest(overrides=overrides):
                with self.assertRaisesRegex(ValueError, message):
                    monitor_battery(_reading(**overrides))

        missing_cells = _reading()
        del missing_cells["cell_voltages"]
        with self.assertRaisesRegex(ValueError, "cell_voltages"):
            monitor_battery(missing_cells)


def _print_examples() -> None:
    examples = (
        ("Normal", _reading()),
        ("Overheating", _reading(temperature=50.0)),
        ("Cell imbalance", _reading(cell_voltages=[3.72, 3.71, 3.70, 3.50])),
    )
    for scenario, reading in examples:
        print(f"{scenario} scenario: {monitor_battery(reading)}")


def main() -> None:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(BatteryMonitorTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    _print_examples()
    if not result.wasSuccessful():
        raise SystemExit(1)


if __name__ == "__main__":
    main()
