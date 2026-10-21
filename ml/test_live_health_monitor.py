import unittest
from datetime import datetime, timedelta, timezone

from ml.battery_monitor import monitor_battery
from ml.live_health_monitor import analyze_battery_health


def readings_for(
    voltage: list[float],
    current: list[float],
    temperature: list[float],
    imbalance: list[float] | None = None,
    interval_seconds: int = 60,
) -> list[dict[str, object]]:
    base = datetime(2026, 10, 9, tzinfo=timezone.utc)
    imbalances = imbalance or [0.02] * len(voltage)
    readings = []
    for index, values in enumerate(zip(voltage, current, temperature, imbalances)):
        v, a, c, spread = values
        reading: dict[str, object] = {
            "timestamp": (base + timedelta(seconds=interval_seconds * index)).isoformat(),
            "voltage": v,
            "current": a,
            "temperature": c,
            "cell_voltages": [3.7, 3.7 + spread, 3.7, 3.7],
        }
        readings.append({**reading, **monitor_battery(reading)})
    return readings


class LiveHealthMonitorTests(unittest.TestCase):
    def test_stable_healthy_window_has_no_patterns(self) -> None:
        result = analyze_battery_health(
            readings_for(
                [48.5, 48.4, 48.3, 48.2, 48.1, 48.0],
                [8, 9, 10, 10, 11, 11],
                [29, 29.4, 29.8, 30.2, 30.6, 31],
                interval_seconds=60,
            )
        )
        self.assertEqual(result["health_status"], "HEALTHY")
        self.assertEqual(result["patterns"], [])
        self.assertEqual(result["health_score"], 100)
        self.assertEqual(result["operating_state"], "DISCHARGING")

    def test_degradation_window_detects_multiple_trends(self) -> None:
        result = analyze_battery_health(
            readings_for(
                [48.5, 48.25, 48, 47.6, 47.1, 46.5, 45.9],
                [8, 9, 10, 12, 15, 18, 20],
                [30, 31, 33, 35, 38, 42, 46],
                interval_seconds=60,
            )
        )
        self.assertEqual(result["health_status"], "DEGRADED")
        self.assertTrue(result["pattern_flags"]["voltage_declining"])
        self.assertTrue(result["pattern_flags"]["current_increasing"])
        self.assertTrue(result["pattern_flags"]["temperature_rising"])
        self.assertTrue(any("Voltage" in item for item in result["patterns"]))
        self.assertTrue(any("Current" in item for item in result["patterns"]))
        self.assertTrue(any("Temperature" in item for item in result["patterns"]))

    def test_overheating_sequence_detects_temperature_trend_and_rule_alert(self) -> None:
        window = readings_for(
            [48.0, 47.9, 47.8, 47.8, 47.7, 47.7, 47.6, 47.6],
            [10.0] * 8,
            [30, 32, 35, 38, 42, 46, 50, 55],
            interval_seconds=60,
        )
        result = analyze_battery_health(window)
        self.assertTrue(result["pattern_flags"]["temperature_rising"])
        self.assertTrue(any("Temperature is continuously increasing" in item for item in result["patterns"]))
        self.assertEqual(result["health_status"], "DEGRADED")
        self.assertEqual(window[-1]["temperature_status"], "CRITICAL")
        self.assertEqual(window[-1]["overall_status"], "CRITICAL")

    def test_single_temperature_spike_does_not_make_critical_health(self) -> None:
        window = readings_for(
            [48, 48, 48, 48],
            [10, 10, 10, 10],
            [30, 30, 30, 58],
        )
        result = analyze_battery_health(window)
        self.assertNotEqual(result["health_status"], "CRITICAL")
        self.assertEqual(result["health_status"], "WATCH")

    def test_rising_imbalance_is_detected(self) -> None:
        result = analyze_battery_health(
            readings_for(
                [48] * 6,
                [10] * 6,
                [32] * 6,
                [0.02, 0.02, 0.02, 0.04, 0.10, 0.22],
                interval_seconds=60,
            )
        )
        self.assertTrue(result["pattern_flags"]["cell_imbalance_detected"])
        self.assertTrue(any("imbalance" in item.lower() for item in result["patterns"]))
        self.assertEqual(result["health_status"], "WATCH")

    def test_persistent_critical_cell_imbalance_is_critical(self) -> None:
        window = readings_for(
            [48.0] * 8,
            [10.0] * 8,
            [32.0] * 8,
            [0.02, 0.02, 0.02, 0.03, 0.08, 0.15, 0.21, 0.22],
            interval_seconds=60,
        )
        result = analyze_battery_health(window)
        self.assertTrue(result["pattern_flags"]["cell_imbalance_detected"])
        self.assertEqual(window[-1]["cell_status"], "CRITICAL")
        self.assertEqual(result["health_status"], "CRITICAL")

    def test_multiple_fault_sequence_is_critical_with_multiple_patterns(self) -> None:
        window = readings_for(
            [48.0, 47.0, 45.0, 43.0, 41.8, 41.5],
            [20.0, 24.0, 27.0, 30.0, 30.0, 30.0],
            [38.0, 42.0, 46.0, 50.0, 55.0, 58.0],
            [0.04, 0.12, 0.19, 0.25, 0.30, 0.30],
            interval_seconds=60,
        )
        result = analyze_battery_health(window)
        self.assertEqual(result["health_status"], "CRITICAL")
        self.assertGreaterEqual(len(result["patterns"]), 3)
        self.assertGreaterEqual(len(window[-1]["alerts"]), 3)

    def test_insufficient_history_does_not_infer_trends(self) -> None:
        result = analyze_battery_health(
            readings_for([48.0, 47.0, 46.0], [8.0, 15.0, 20.0], [30.0, 35.0, 40.0])
        )
        self.assertEqual(result["health_status"], "HEALTHY")
        self.assertFalse(any(result["pattern_flags"].values()))
        self.assertIsNotNone(result["voltage_trend_v_per_min"])

    def test_operating_state_respects_signed_current_convention(self) -> None:
        charging = analyze_battery_health(readings_for([48] * 4, [-5] * 4, [30] * 4))
        discharging = analyze_battery_health(readings_for([48] * 4, [5] * 4, [30] * 4))
        idle = analyze_battery_health(
            readings_for([48] * 4, [0.0, 0.2, -0.2, 0.49], [30] * 4)
        )

        self.assertEqual(charging["operating_state"], "CHARGING")
        self.assertEqual(discharging["operating_state"], "DISCHARGING")
        self.assertEqual(idle["operating_state"], "IDLE")

    def test_charging_current_demand_trend_uses_magnitude(self) -> None:
        result = analyze_battery_health(
            readings_for([48] * 5, [-5, -7, -9, -11, -13], [30] * 5)
        )
        self.assertLess(result["current_trend_a_per_min"], 0)
        self.assertTrue(result["pattern_flags"]["current_increasing"])
        self.assertEqual(result["recent_current_behavior"], "increasing")


if __name__ == "__main__":
    unittest.main()
