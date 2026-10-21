# VoltBot Wokwi ESP32 Battery Telemetry Node

This directory contains the Wokwi ESP32 simulation project for **VoltBot (BatteryGuard)**. It simulates an IoT battery sensing node transmitting telemetry to VoltBot's FastAPI backend (`POST /api/sensor-data`).

---

## Files in this Project

- **`sketch.ino`**: Arduino C++ firmware for the ESP32 microcontroller.
  - Connects to Wokwi virtual Wi-Fi (`Wokwi-GUEST`).
  - Reads analog inputs from two potentiometers and one digital slide switch.
  - Builds JSON formatted to match VoltBot's `SensorData` schema.
  - Sends HTTP POST requests to `/api/sensor-data` every 3 seconds.
- **`diagram.json`**: Wokwi circuit schematic containing the ESP32 DevKit, potentiometers, switch, and wiring.
- **`wokwi.toml`**: Project configuration for Wokwi CLI and the Wokwi VS Code extension.
- **`secrets.h.example`**: Template for tunnel endpoint and API key configuration.

---

## Security Notice & Limitations

- **Git Safety:** `secrets.h` is excluded by root `.gitignore` to prevent leaking URLs and API keys into source control.
- **Wokwi Web Environment Limitation:** While a local `secrets.h` prevents git commits, **the online Wokwi web editor runs in the browser**. Any secret pasted into a Wokwi browser tab is stored in browser memory/project state and is NOT protected by hardware cryptographic vaults or secure HSMs.
- **Recommendation:** Always use temporary, disposable demonstration keys when exposing a tunnel to Wokwi. Revoke the key and terminate the tunnel immediately after demonstrations.

---

## Virtual Hardware Controls & Mapping

| Component | Pin | Simulated Metric | Working Range | VoltBot Detection Rules Tested |
| :--- | :--- | :--- | :--- | :--- |
| **Potentiometer 1** (`pot_voltage`) | **GPIO 34** (ADC1_CH6) | **Pack Voltage** | $40.0\,\text{V} - 54.0\,\text{V}$ | Low Voltage Warning ($< 42.0\,\text{V}$)<br/>High Voltage Warning ($> 50.0\,\text{V}$)<br/>Nominal ($48.0\,\text{V}$) |
| **Potentiometer 2** (`pot_temp`) | **GPIO 35** (ADC1_CH7) | **Pack Temperature** | $20.0^\circ\text{C} - 65.0^\circ\text{C}$ | Normal ($20 - 35^\circ\text{C}$)<br/>Thermal Warning ($\ge 45.0^\circ\text{C}$)<br/>Critical Overtemperature ($\ge 55.0^\circ\text{C}$) |
| **Slide Switch** (`sw_imbalance`) | **GPIO 21** (Pull-up) | **Cell 4 Imbalance Fault** | Normal vs. Lagging | **OFF (HIGH):** All 4 cells balanced ($V_{\text{pack}}/13 \pm 0.005\,\text{V}$)<br/>**ON (LOW):** Cell 4 drops by $0.22\,\text{V}$ ($\Delta V \ge 0.20\,\text{V}$, Critical Imbalance) |
| **Simulated Current** | *Internal Math Model* | **Discharge Current** | $8.5\,\text{A} - 11.5\,\text{A}$ | Smooth sinusoidal riding load variation |

---

## How to Run in Wokwi

1. Open [https://wokwi.com](https://wokwi.com) in your web browser.
2. Select **ESP32** -> **ESP32 DevKit v1 / C V4**.
3. In the code editor tab, replace the default code with the contents of [`sketch.ino`](sketch.ino).
4. In the `diagram.json` tab, replace the contents with [`diagram.json`](diagram.json).
5. If using tunnel authentication:
   - Click the **+** (New File) tab in Wokwi, create `secrets.h`, and paste:
     ```cpp
     #define VOLTBOT_TUNNEL_URL "https://YOUR-TUNNEL-URL.ngrok-free.app"
     #define VOLTBOT_API_KEY    "YOUR-TEMPORARY-KEY"
     ```
6. Click the green **Play (Start Simulation)** button.
7. The serial monitor will display:
   - Wi-Fi connection progress to `Wokwi-GUEST`.
   - Local IP assignment.
   - Authentication status: `[CONFIGURED (X-API-Key)]` or `[DISABLED (Local Dev Mode)]`.
   - Real-time telemetry packets generated every 3 seconds showing Pack Voltage, Current, Temperature, and Cell Voltages.
