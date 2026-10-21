import os
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Mapping


DATABASE_PATH = Path(
    os.environ.get("BATTERY_DATABASE_PATH", Path(__file__).with_name("battery_readings.db"))
)


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    with _connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS battery_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                voltage REAL NOT NULL,
                current REAL NOT NULL,
                temperature REAL NOT NULL,
                power REAL NOT NULL,
                cell_min REAL NOT NULL,
                cell_max REAL NOT NULL,
                cell_imbalance REAL NOT NULL,
                cell_voltages TEXT NOT NULL DEFAULT '[]',
                power_w REAL,
                cell_min_v REAL,
                cell_max_v REAL,
                cell_imbalance_v REAL,
                temperature_status TEXT,
                voltage_status TEXT,
                current_status TEXT,
                cell_status TEXT,
                overall_status TEXT,
                alerts TEXT NOT NULL DEFAULT '[]',
                health_status TEXT,
                health_score REAL,
                operating_state TEXT,
                patterns TEXT NOT NULL DEFAULT '[]',
                pattern_flags TEXT NOT NULL DEFAULT '{}',
                voltage_trend_v_per_min REAL,
                temperature_trend_c_per_min REAL,
                current_trend_a_per_min REAL,
                cell_imbalance_trend_v_per_min REAL,
                average_voltage_v REAL,
                average_current_a REAL,
                average_temperature_c REAL,
                maximum_temperature_c REAL,
                minimum_voltage_v REAL,
                recent_current_behavior TEXT,
                health_sample_count INTEGER,
                demo_scenario TEXT,
                demo_stage INTEGER,
                demo_session_id TEXT
            )
            """
        )
        existing_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(battery_readings)")
        }
        migrations = {
            "cell_voltages": "TEXT NOT NULL DEFAULT '[]'",
            "power_w": "REAL",
            "cell_min_v": "REAL",
            "cell_max_v": "REAL",
            "cell_imbalance_v": "REAL",
            "temperature_status": "TEXT",
            "voltage_status": "TEXT",
            "current_status": "TEXT",
            "cell_status": "TEXT",
            "overall_status": "TEXT",
            "alerts": "TEXT NOT NULL DEFAULT '[]'",
            "health_status": "TEXT",
            "health_score": "REAL",
            "operating_state": "TEXT",
            "patterns": "TEXT NOT NULL DEFAULT '[]'",
            "pattern_flags": "TEXT NOT NULL DEFAULT '{}'",
            "voltage_trend_v_per_min": "REAL",
            "temperature_trend_c_per_min": "REAL",
            "current_trend_a_per_min": "REAL",
            "cell_imbalance_trend_v_per_min": "REAL",
            "average_voltage_v": "REAL",
            "average_current_a": "REAL",
            "average_temperature_c": "REAL",
            "maximum_temperature_c": "REAL",
            "minimum_voltage_v": "REAL",
            "recent_current_behavior": "TEXT",
            "health_sample_count": "INTEGER",
            "demo_scenario": "TEXT",
            "demo_stage": "INTEGER",
            "demo_session_id": "TEXT",
        }
        for column, definition in migrations.items():
            if column not in existing_columns:
                connection.execute(
                    f"ALTER TABLE battery_readings ADD COLUMN {column} {definition}"
                )


def insert_reading(reading: Mapping[str, Any]) -> dict[str, Any]:
    parameters = dict(reading)
    parameters["cell_voltages"] = json.dumps(reading["cell_voltages"])
    parameters["alerts"] = json.dumps(reading["alerts"])
    parameters["patterns"] = json.dumps(reading["patterns"])
    parameters["pattern_flags"] = json.dumps(reading["pattern_flags"])
    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO battery_readings (
                device_id, timestamp, voltage, current, temperature,
                power, cell_min, cell_max, cell_imbalance, cell_voltages,
                power_w, cell_min_v, cell_max_v, cell_imbalance_v,
                temperature_status, voltage_status, current_status,
                cell_status, overall_status, alerts,
                health_status, health_score, operating_state, patterns, pattern_flags,
                voltage_trend_v_per_min, temperature_trend_c_per_min,
                current_trend_a_per_min, cell_imbalance_trend_v_per_min,
                average_voltage_v, average_current_a, average_temperature_c,
                maximum_temperature_c, minimum_voltage_v, recent_current_behavior,
                health_sample_count, demo_scenario, demo_stage, demo_session_id
            ) VALUES (
                :device_id, :timestamp, :voltage, :current, :temperature,
                :power, :cell_min, :cell_max, :cell_imbalance, :cell_voltages,
                :power_w, :cell_min_v, :cell_max_v, :cell_imbalance_v,
                :temperature_status, :voltage_status, :current_status,
                :cell_status, :overall_status, :alerts,
                :health_status, :health_score, :operating_state, :patterns, :pattern_flags,
                :voltage_trend_v_per_min, :temperature_trend_c_per_min,
                :current_trend_a_per_min, :cell_imbalance_trend_v_per_min,
                :average_voltage_v, :average_current_a, :average_temperature_c,
                :maximum_temperature_c, :minimum_voltage_v, :recent_current_behavior,
                :health_sample_count, :demo_scenario, :demo_stage, :demo_session_id
            )
            """,
            parameters,
        )
    return {**reading, "id": cursor.lastrowid}


def _decode_reading(row: sqlite3.Row) -> dict[str, Any]:
    reading = dict(row)
    for column in ("cell_voltages", "alerts", "patterns", "pattern_flags"):
        value = reading.get(column)
        default: Any = {} if column == "pattern_flags" else []
        reading[column] = json.loads(value) if value is not None else default
    return reading


def get_latest_reading() -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            "SELECT * FROM battery_readings ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return _decode_reading(row) if row is not None else None


def get_reading_history(limit: int) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT * FROM battery_readings ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_decode_reading(row) for row in rows]


def get_recent_readings(device_id: str, limit: int) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT * FROM battery_readings
            WHERE device_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (device_id, limit),
        ).fetchall()
    return [_decode_reading(row) for row in rows]
