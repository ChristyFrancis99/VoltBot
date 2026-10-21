# VoltBot (BatteryGuard)
## IoT-Based EV Scooter Battery Health Monitoring & Early Fault Detection System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python%203.14-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## Table of Contents
1. [Project Title & Overview](#1-project-title--overview)
2. [Key Features](#2-key-features)
3. [Complete Project Workflow & Architecture](#3-complete-project-workflow--architecture)
4. [Battery Health Score & Fault Detection Calculation](#4-battery-health-score--fault-detection-calculation)
5. [Technology Stack](#5-technology-stack)
6. [Project Structure](#6-project-structure)
7. [Setup & Installation](#7-setup--installation)
8. [Running the Application](#8-running-the-application)
9. [Using the Application](#9-using-the-application)
10. [API Overview](#10-api-overview)
11. [Testing & Verification](#11-testing--verification)
12. [Limitations & Future Improvements](#12-limitations--future-improvements)
13. [Conclusion](#13-conclusion)

---

## 1. Project Title & Overview

**Project Title:**
*IoT-Based EV Scooter Battery Health Monitoring & Early Fault Detection System*
**Application Name:**
*VoltBot (BatteryGuard)*

### The Problem
Traditional Electric Vehicle (EV) Battery Management Systems (BMS) are primarily designed for immediate, hard safety cutoffsâ€”tripping a contactor only when catastrophic limits (such as a hard short circuit, deep undervoltage, or severe thermal runaway) are breached. However, standard BMS hardware provides minimal early visibility into gradual cell divergence, thermal build-up under load, or subtle degradation trends that develop over days or weeks of daily riding.

### The Solution
**VoltBot** adds an intelligent telemetry and early-warning layer alongside the battery. By continuously sampling voltage, operating current, temperature, and individual cell taps, the system evaluates real-time behavior against explainable, rule-based engineering thresholds. When an anomaly beginsâ€”such as a cell beginning to lag behind or the pack operating hotter than recommendedâ€”VoltBot alerts the user in plain language before permanent cell damage or roadside breakdown occurs.

> [!IMPORTANT]
> **Simulation Disclosure:**
> The current demonstration prototype uses **simulated battery telemetry** transmitted over HTTP by a standalone Python script (`backend/sensor_simulator.py`) or triggered via the dashboard demo controls. The data mirrors the exact JSON payload structure of an ESP32 IoT node sampling a 48V (13-series) lithium-ion scooter battery pack.

---

## 2. Key Features

- **Pack Voltage, Current & Temperature Tracking:**
  Real-time ingestion and display of total electrical potential (nominal 48V), discharge/charge current draw, and core thermal readings.
- **Individual Cell Voltage & Imbalance Monitoring:**
  Monitors 4 series cell taps in real time, computing the exact voltage difference between the highest and lowest cell (`cell_imbalance_v`). Flags divergences exceeding 100 mV.
- **Instantaneous Pack Power Calculation:**
  Calculates instantaneous power in Watts ($P = V \times I$) on every reading at the backend.
- **Explainable Rule-Based Health Assessment:**
  Calculates rates of change (temperature rise rate in Â°C/min, voltage drop rate in V/min, and current trend in A/min) over a rolling 12-reading telemetry window. Generates a transparent, rule-based 0â€“100 health condition index.
- **Plain-English Assistant & Alerts:**
  Translates complex electrical faults into 3 beginner-friendly questions:
  1. *What was detected?*
  2. *Why does it matter?*
  3. *What action should you take?*
- **Interactive Fault Scenarios:**
  Supports deterministic demonstration of 4 battery conditions:
  - ðŸŸ¢ **Normal Riding:** Balanced 48V pack at 30Â°C.
  - ðŸŸ  **Overheating Test:** Thermal rise past 50Â°C demonstrating cooling alerts.
  - ðŸ”´ **Cell Imbalance Test:** One cell dropping to test early divergence detection.
  - ðŸŸ¡ **Battery Degradation:** Voltage sagging under load as internal resistance increases.
- **Persistent Telemetry Logging:**
  Every sensor reading, calculated metric, alert, and trend pattern is stored in a local SQLite database (`battery_readings.db`).

---

## 3. How the Project Works

### End-to-End Architecture Flow

```mermaid
flowchart TD
    subgraph Simulation_Layer [Simulation Layer]
        A["Python Sensor Simulator<br/>(backend/sensor_simulator.py)<br/>or In-App Scenario Controls"]
    end

    subgraph Backend_Layer [FastAPI Backend (Port 8000)]
        B["POST /api/sensor-data<br/>(Pydantic Validation)"]
        C["Derived Metric Engine<br/>(Power, Cell Min/Max/Delta)"]
        D["Health & Trend Monitor<br/>(ml/live_health_monitor.py)"]
        E[("SQLite Database<br/>battery_readings.db")]
        F["REST Endpoints<br/>(/api/battery/latest, /history)"]
    end

    subgraph Frontend_Layer [React Dashboard (Port 8080)]
        G["React Store Poller<br/>(Polls /api/battery/latest every 3s)"]
        H["Overview Home Screen<br/>(3 Simple Indicators & Plain-English Alerts)"]
        I["Collapsible Technical Details<br/>(Volts, Amps, Power, Cell Bars, Recharts)"]
        J["Simulation Controls<br/>(Normal, Overheating, Imbalance, Degraded)"]
    end

    A -->|"HTTP POST (JSON payload)"| B
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|"HTTP GET (JSON polling)"| G
    G --> H
    G --> I
    J -->|"POST /api/demo/scenario"| B
```

### Component Roles

1. **Sensor Simulator (`backend/sensor_simulator.py`)**: Emulates the ESP32 IoT node by generating realistic telemetry for a 48V scooter pack and posting JSON packets to the backend every 3 seconds.
2. **FastAPI Backend (`backend/main.py`)**: Serves as the central API gateway. Validates schema inputs, orchestrates processing, manages CORS, and provides endpoints for the frontend.
3. **Derived Metrics Service (`backend/battery_service.py`)**: Computes pack electrical power ($P = V \times I$), extracts minimum/maximum cell voltages, and computes instantaneous cell imbalance.
4. **Health & Trend Monitor (`ml/live_health_monitor.py`)**: Analyzes the recent 12-sample telemetry window to detect thermal slopes, voltage drops, and cell divergences, computing an explainable 0â€“100 health score.
5. **SQLite Database (`backend/database.py`)**: Automatically creates and maintains the `battery_readings` table in `backend/battery_readings.db` with additive schema migrations.
6. **Frontend Dashboard (`frontend/`)**: React 19 single-page application built with Vite and TanStack Router, providing a simplified home screen for non-engineers and deep technical views for evaluators.

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose in Project |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **FastAPI** | `^0.143.0` | High-performance asynchronous REST API framework serving backend endpoints. |
| **ASGI Server** | **Uvicorn** | `^0.54.0` | Production ASGI web server running the FastAPI application. |
| **Validation** | **Pydantic** | `^2.14.0` | Data validation, type enforcement, and serialization for sensor payloads. |
| **Database** | **SQLite3** | Built-in | Embedded, zero-configuration SQL database storing telemetry history. |
| **Simulator Client** | **Requests** | `^2.34.2` | Python HTTP library used by `sensor_simulator.py` to transmit telemetry. |
| **Frontend Framework**| **React** | `^19.2.0` | Modern component-based user interface library. |
| **Language** | **TypeScript** | `^5.8.3` | Type-safe JavaScript ensuring reliable frontend components and contracts. |
| **Build Tool** | **Vite** | `^8.1.5` | Fast frontend build tool and local development server. |
| **Routing** | **TanStack Router**| `^1.170.18`| Type-safe client-side routing for multi-page dashboard navigation. |
| **Data Fetching** | **TanStack Query** | `^5.101.1` | State management and cache synchronization for live API polling. |
| **Styling** | **TailwindCSS** | `^4.2.1` | Utility-first CSS framework for clean, responsive UI components. |
| **Data Visualization**| **Recharts** | `^2.15.4` | Responsive SVG charting library rendering real-time history curves. |
| **UI Icons** | **Lucide React**| `^0.575.0` | Clean, modern iconography across status cards and navigation. |

---

## 5. Project Structure

```text
VoltBot/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ battery_readings.db      # SQLite database storing telemetry history
â”‚   â”œâ”€â”€ battery_service.py       # Core calculation service & scripted demo sequences
â”‚   â”œâ”€â”€ database.py              # SQLite connection, table init & additive migrations
â”‚   â”œâ”€â”€ main.py                  # FastAPI application, CORS setup & REST routes
â”‚   â”œâ”€â”€ README.md                # Backend-specific architectural reference
â”‚   â”œâ”€â”€ requirements.txt         # Backend Python dependencies (fastapi, uvicorn, pydantic)
â”‚   â”œâ”€â”€ schemas.py               # Pydantic models (SensorData, BatteryReading, etc.)
â”‚   â””â”€â”€ sensor_simulator.py      # Standalone Python script emulating ESP32 telemetry
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ assets/              # Logos and assistant robot graphics
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ battery/         # Domain components (MetricCard, Timeline, Panels)
â”‚   â”‚   â”‚   â””â”€â”€ ui/              # Reusable UI primitives (Buttons, Tooltips, Progress)
â”‚   â”‚   â”œâ”€â”€ lib/battery/
â”‚   â”‚   â”‚   â”œâ”€â”€ api.ts           # Fetch client connecting to FastAPI backend
â”‚   â”‚   â”‚   â”œâ”€â”€ simulator.ts     # In-browser step-by-step simulator logic
â”‚   â”‚   â”‚   â”œâ”€â”€ store.tsx        # React Context provider polling backend every 3s
â”‚   â”‚   â”‚   â””â”€â”€ types.ts         # TypeScript contracts for battery telemetry
â”‚   â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”‚   â”œâ”€â”€ _shell/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.tsx        # Overview home screen (Battery Health Assistant)
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ live-monitoring.tsx  # Battery Details & Engineering Telemetry
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ battery-simulator.tsx# Try a Simulation interactive page
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ fault-detection.tsx  # Fault diagnostic breakdown
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ alerts.tsx           # Searchable alert logs
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ trends.tsx           # Multi-cycle historical graphs
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ service.tsx          # Service and maintenance logs
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ technician.tsx       # Technician diagnostic mode
â”‚   â”‚   â”‚   â”œâ”€â”€ _shell.tsx       # Main layout shell with sidebar and header
â”‚   â”‚   â”‚   â”œâ”€â”€ index.tsx        # Root entry redirect
â”‚   â”‚   â”‚   â””â”€â”€ login.tsx        # Authentication page (admin / admin123)
â”‚   â”‚   â””â”€â”€ styles.css           # Global CSS variables and Tailwind setup
â”‚   â”œâ”€â”€ package.json             # Frontend dependencies and npm scripts
â”‚   â”œâ”€â”€ tsconfig.json            # TypeScript configuration
â”‚   â””â”€â”€ vite.config.ts           # Vite bundler configuration
â”œâ”€â”€ ml/
â”‚   â”œâ”€â”€ battery_monitor.py       # Heuristic monitoring rules and safety thresholds
â”‚   â”œâ”€â”€ feature_processor.py     # Rolling window feature extraction (averages, slopes)
â”‚   â”œâ”€â”€ live_health_monitor.py   # Trend evaluation and 0-100 health scoring engine
â”‚   â”œâ”€â”€ test_battery_monitor.py  # Unit tests for battery monitoring logic
â”‚   â”œâ”€â”€ test_feature_processor.py# Unit tests for rolling window processing
â”‚   â””â”€â”€ test_live_health_monitor.py # Unit tests for live health scoring
â””â”€â”€ README.md                    # Root project documentation (this file)
```

---

## 6. Setup & Installation

### Prerequisites
- **Python 3.10+** (Python 3.14 recommended)
- **Node.js v20+** (Node.js v24 recommended)
- **Windows PowerShell**

### Step 1: Clone or Navigate to the Workspace
```powershell
cd c:\Users\Admin\Desktop\PROJECTS\VoltBot
```

### Step 2: Set Up Python Virtual Environment & Backend Dependencies
From the repository root, create and activate a Python virtual environment, then install backend dependencies:

```powershell
# Create the virtual environment (if not already present)
python -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
python -m pip install -r backend/requirements.txt requests
```

### Step 3: Set Up Frontend Dependencies
Open a PowerShell terminal and install the frontend packages:

```powershell
cd frontend
& "C:\Program Files\nodejs\npm.cmd" install
```
*(If `npm` is configured globally in your PATH, you can run `npm install` directly).*

---

## 7. Running the Application

To run the complete system, open **three separate Windows PowerShell terminals**:

### Terminal 1: Start the FastAPI Backend
```powershell
cd c:\Users\Admin\Desktop\PROJECTS\VoltBot\backend
..\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```
- **Backend API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`

### Terminal 2: Start the React Frontend Dashboard
```powershell
cd c:\Users\Admin\Desktop\PROJECTS\VoltBot\frontend
& "C:\Program Files\nodejs\npm.cmd" run dev
```
- **Frontend Dashboard URL:** `http://localhost:8080` (or `http://localhost:5173`)
- **Demo Credentials:**
  - **Username:** `admin`
  - **Password:** `admin123`

### Terminal 3: Start the Python Sensor Simulator
```powershell
cd c:\Users\Admin\Desktop\PROJECTS\VoltBot
.\.venv\Scripts\python.exe backend/sensor_simulator.py
```
*The simulator will output generated voltage, current, temperature, and cell readings, printing `Backend: 200` every 3 seconds as telemetry is accepted.*

---

## 8. Using the Application

### 1. Navigation Overview
The application organizes functionality into 3 primary destinations:
1. **Overview (`/dashboard`):** The main battery health assistant screen. Displays high-level status, 3 key indicators, plain-English fault explanations, interactive simulation triggers, and an expandable technical drawer.
2. **Battery Details (`/live-monitoring`):** Full-screen engineering telemetry view displaying raw volts, amps, cell balance deltas, and live sensor chips.
3. **Try a Simulation (`/battery-simulator`):** Step-by-step simulator allowing manual stepping through individual reproducible telemetry ticks.

---

### 2. Demonstration Scenarios (Step-by-Step)

You can run demonstrations either by clicking the buttons on the **Overview** page under **"Try a Simulation"**, or by editing line 15 in `backend/sensor_simulator.py`.

#### Scenario A: Normal Riding (Baseline)
- **Action:** Click **"Simulate Normal"** on the dashboard.
- **Simulated Values:** Voltage $\approx 48.0\,\text{V}$, Current $\approx 10.0\,\text{A}$, Temperature $\approx 30.0^\circ\text{C}$, Cell voltages balanced ($\pm 0.02\,\text{V}$).
- **Expected Outcome:**
  - Top Banner displays green: **â€œBATTERY LOOKS HEALTHYâ€**.
  - One-sentence summary: *"Operating temperature, voltage levels, and individual cells are all balanced and running smoothly."*
  - Condition: **Good Condition (Score: 100/100)**.
  - Fault box: *"âœ“ No thermal, voltage, or cell divergence faults detected."*

#### Scenario B: Overheating Anomaly Test
- **Action:** Click **"Simulate Overheating"** on the dashboard.
- **Simulated Values:** Core pack temperature steadily climbs past $50.0^\circ\text{C}$ ($52^\circ\text{C} - 58^\circ\text{C}$).
- **Expected Outcome:**
  - Top Banner turns amber: **â€œATTENTION NEEDEDâ€**.
  - Simple Fault Explanation card displays:
    - **What was detected:** *"High pack temperature: core sensor reached 54.0Â°C (recommended safe ceiling is 45Â°C)."*
    - **Why it matters:** *"Excess heat strains battery chemistry, accelerates cell aging, and can cause the controller to throttle power."*
    - **What you should do:** *"Park the vehicle in a shaded or ventilated area. Let it cool down before heavy riding or fast charging."*
  - Health score drops into the watch band ($\approx 80/100$).
  - History chart for Temperature curves noticeably upward in red.

#### Scenario C: Cell Imbalance Test
- **Action:** Click **"Simulate Cell Imbalance"** on the dashboard.
- **Simulated Values:** Cells 1â€“3 maintain $\approx 3.70\,\text{V}$, but Cell 4 drops toward $3.45\,\text{V}$ (imbalance $> 150\,\text{mV}$).
- **Expected Outcome:**
  - Top Banner turns amber: **â€œATTENTION NEEDEDâ€**.
  - Simple Fault Explanation card displays:
    - **What was detected:** *"Cell imbalance detected: one cell is diverging by 180 mV from the pack average."*
    - **Why it matters:** *"When cells are uneven, the weakest cell drains first, limiting your total usable distance and placing stress on healthy cells."*
    - **What you should do:** *"Connect the vehicle to a standard AC charger and allow it to complete a full balancing charge cycle overnight."*
  - Inside the **Engineering Details** drawer, Cell 04 highlights with an orange **Diverging** badge.

#### Scenario D: Returning to Normal
- **Action:** Click the **â€œâ†© Return to Normalâ€** button.
- **Expected Outcome:** Telemetry resets to baseline; the banner returns to green **â€œBATTERY LOOKS HEALTHYâ€** within 3 seconds.

---

## 9. API Overview

The FastAPI backend exposes the following REST endpoints:

| Method | Endpoint | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck endpoint verifying API availability. | `{"status": "ok"}` |
| `POST` | `/api/sensor-data` | Ingests a raw sensor packet, computes derived metrics, evaluates health rules, stores to SQLite, and returns the enriched reading. | **Input:** `{"device_id":"ESP32_BATTERY_01", "voltage":48.2, "current":10.5, "temperature":32.0, "cell_voltages":[3.71,3.70,3.71,3.69]}`<br/>**Output:** Full `BatteryReading` JSON object. |
| `GET` | `/api/battery/latest` | Returns the most recently recorded battery reading from SQLite. Polled by the frontend every 3 seconds. | Returns latest `BatteryReading` object with `id`, `voltage`, `temperature`, `health_score`, `alerts`, etc. |
| `GET` | `/api/battery/history?limit=24` | Retrieves recent chronological readings in descending order (supports `limit=1` to `100`). | Array of `BatteryReading` objects used to populate the Recharts graphs. |
| `POST` | `/api/demo/scenario` | Initiates or advances a staged demonstration sequence (`healthy`, `overheating`, `cell_imbalance`, `degradation`, `multiple_faults`). | **Input:** `{"scenario": "overheating", "advance": true}`<br/>**Output:** `BatteryReading` at the advanced stage. |

---

## 10. Testing & Verification

The project includes unit tests for the monitoring logic, feature processor, and live health engine, as well as TypeScript validation and production build verification:

### 1. Python Monitoring Unit Tests
Run the unit test suite from the repository root:
```powershell
$env:PYTHONPATH=".;ml"
.\.venv\Scripts\python.exe -m unittest ml/test_battery_monitor.py ml/test_feature_processor.py ml/test_live_health_monitor.py
```
**Verified Result:**
```text
.....................
----------------------------------------------------------------------
Ran 21 tests in 0.003s

OK
```
*All 21 test cases pass, covering threshold alarms, rolling trend calculations, slope evaluations, and explainable health score boundaries.*

### 2. Frontend Typecheck Verification
Validate the entire frontend TypeScript codebase:
```powershell
cd frontend
& "C:\Program Files\nodejs\npm.cmd" run typecheck
```
**Verified Result:**
```text
> typecheck
> tsc --noEmit
(Exit code: 0 â€” 0 errors)
```

### 3. Frontend Production Build Verification
Compile the frontend client and SSR server bundle:
```powershell
cd frontend
& "C:\Program Files\nodejs\npm.cmd" run build
```
**Verified Result:**
```text
âœ“ built client in 692ms
âœ“ built server in 1.18s
[nitro] âˆš Generated public .output/public
```

---

## 11. Limitations & Future Improvements

To maintain academic and professional honesty, the following constraints are explicitly documented:

1. **Simulated Telemetry vs. Physical Hardware:**
   The current implementation uses a software-based Python generator (`sensor_simulator.py`) sending JSON payloads over HTTP. While the payload matches an ESP32 firmware specification, it has not yet been connected to physical voltage divider circuits, current shunts, or thermistors on a real battery pack.
2. **Heuristic Health Index vs. Certified Laboratory SOH:**
   The 0â€“100 health score is a transparent, rule-based engineering metric derived from recent trend stability, thermal excursions, and cell delta penalties. It is not an electrochemical, coulomb-counted, or machine-learning-certified State of Health (SOH) measurement.
3. **No Safety Guarantees:**
   VoltBot is an advisory early-warning demonstration. It does not replace onboard automotive-grade BMS hardware protection circuits and makes no guarantees regarding the prediction or prevention of battery failure.
4. **Future Roadmap:**
   - **Hardware Integration:** Flash physical ESP32 microcontrollers with Wi-Fi HTTP client firmware and wire analog inputs to multi-cell battery taps.
   - **Cell Pack Expansion:** Scale from 4 sampled taps to a full 13-cell / 16-cell BMS monitoring harness over CAN bus or I2C.
   - **Push Notifications:** Add WebPush or SMS alerts for immediate mobile notifications when the scooter is unattended on a charger.

---

## 12. Conclusion

**VoltBot (BatteryGuard)** successfully bridges the gap between low-level hardware safety circuits and real-world rider awareness. By combining an intuitive assistant interface for non-engineers with detailed engineering telemetry for technicians, the system demonstrates how IoT and transparent rule-based analytics can protect battery health, alert riders to early thermal and cell anomalies, and extend the lifespan of electric two-wheelers.

---
*Created for academic evaluation and demonstration.*
