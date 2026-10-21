import os
import random
import time
import requests

API_URL = os.environ.get("VOLTBOT_API_URL", "http://127.0.0.1:8000/api/sensor-data")
API_KEY = os.environ.get("VOLTBOT_API_KEY", "").strip()

DEVICE_ID = "ESP32_BATTERY_01"

# Change this to test different battery conditions:
# "normal"
# "overheating"
# "cell_imbalance"
# "degraded"

SCENARIO = "overheating"

def generate_sensor_data():
    # -----------------------------
    # NORMAL BATTERY
    # -----------------------------
    if SCENARIO == "normal":

        voltage = random.uniform(46.5, 50.0)
        current = random.uniform(5.0, 15.0)
        temperature = random.uniform(28.0, 35.0)

        base_cell_voltage = voltage / 13

        cell_voltages = [
            base_cell_voltage + random.uniform(-0.02, 0.02)
            for _ in range(4)
        ]

    # -----------------------------
    # OVERHEATING
    # -----------------------------
    elif SCENARIO == "overheating":

        voltage = random.uniform(45.5, 49.0)
        current = random.uniform(10.0, 20.0)

        # High temperature
        temperature = random.uniform(50.0, 60.0)

        base_cell_voltage = voltage / 13

        cell_voltages = [
            base_cell_voltage + random.uniform(-0.02, 0.02)
            for _ in range(4)
        ]

    # -----------------------------
    # CELL IMBALANCE
    # -----------------------------
    elif SCENARIO == "cell_imbalance":

        voltage = random.uniform(46.0, 49.0)
        current = random.uniform(5.0, 15.0)
        temperature = random.uniform(28.0, 35.0)

        base_cell_voltage = voltage / 13

        # Three cells remain normal
        cell_voltages = [
            base_cell_voltage + random.uniform(-0.02, 0.02),
            base_cell_voltage + random.uniform(-0.02, 0.02),
            base_cell_voltage + random.uniform(-0.02, 0.02),

            # One cell has a significant deviation
            base_cell_voltage - random.uniform(0.15, 0.30)
        ]

    # -----------------------------
    # DEGRADED BATTERY
    # -----------------------------
    elif SCENARIO == "degraded":

        # Lower operating voltage
        voltage = random.uniform(42.0, 46.0)

        # Higher current for similar operation
        current = random.uniform(12.0, 22.0)

        temperature = random.uniform(35.0, 42.0)

        base_cell_voltage = voltage / 13

        cell_voltages = [
            base_cell_voltage + random.uniform(-0.05, 0.05)
            for _ in range(4)
        ]

    else:
        raise ValueError(f"Unknown scenario: {SCENARIO}")

    return {
        "device_id": DEVICE_ID,
        "voltage": round(voltage, 2),
        "current": round(current, 2),
        "temperature": round(temperature, 2),
        "cell_voltages": [
            round(cell, 3)
            for cell in cell_voltages
        ],
    }


while True:

    data = generate_sensor_data()

    headers = {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY

    try:
        response = requests.post(
            API_URL,
            json=data,
            headers=headers if headers else None,
        )

        print(f"Scenario: {SCENARIO}")
        print("Sent:", data)
        print("Backend:", response.status_code)
        print("-" * 60)

    except requests.exceptions.RequestException as e:
        print("Could not connect to backend:", e)

    time.sleep(3)