import type { CellReading, SensorReading, StatusLevel } from "./types";

const API_BASE_URL = "http://localhost:8000";

export type BackendStatus = "NORMAL" | "WARNING" | "CRITICAL" | null;

export interface BatteryReading {
  id: number;
  device_id: string;
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  cell_voltages: number[];
  power_w: number | null;
  cell_min_v: number | null;
  cell_max_v: number | null;
  cell_imbalance_v: number | null;
  temperature_status: BackendStatus;
  voltage_status: BackendStatus;
  current_status: BackendStatus;
  cell_status: BackendStatus;
  overall_status: BackendStatus;
  alerts: string[];
  health_status: "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL" | null;
  health_score: number | null;
  operating_state: "CHARGING" | "DISCHARGING" | "IDLE" | null;
  patterns: string[];
  pattern_flags: Record<string, boolean>;
  voltage_trend_v_per_min: number | null;
  temperature_trend_c_per_min: number | null;
  current_trend_a_per_min: number | null;
  cell_imbalance_trend_v_per_min: number | null;
  average_voltage_v: number | null;
  average_current_a: number | null;
  average_temperature_c: number | null;
  maximum_temperature_c: number | null;
  minimum_voltage_v: number | null;
  recent_current_behavior: string | null;
  health_sample_count: number | null;
  demo_scenario: string | null;
  demo_stage: number | null;
  demo_session_id: string | null;

  power: number;
  cell_min: number;
  cell_max: number;
  cell_imbalance: number;
}

export interface BatteryTelemetry {
  readingId: number;
  deviceId: string;
  timestamp: string;
  powerW: number;
  packVoltage: SensorReading<number>;
  current: SensorReading<number>;
  temperature: SensorReading<number>;
  cellMinV: number;
  cellMaxV: number;
  cellImbalance: SensorReading<number>;
  cellStatus: StatusLevel;
  cells: CellReading[];
  overallStatus: StatusLevel;
  alerts: string[];
  health: BatteryHealthAnalysis;
  demoScenario: string | null;
  demoStage: number | null;
  demoSessionId: string | null;
}

export type DemoScenario =
  | "normal"
  | "healthy"
  | "degradation"
  | "overheating"
  | "cell_imbalance"
  | "multiple_faults";

export interface BatteryHealthAnalysis {
  status: BatteryReading["health_status"];
  score: number | null;
  operatingState: BatteryReading["operating_state"];
  patterns: string[];
  patternFlags: Record<string, boolean>;
  voltageTrendVPerMin: number | null;
  temperatureTrendCPerMin: number | null;
  currentTrendAPerMin: number | null;
  cellImbalanceTrendVPerMin: number | null;
  averageVoltageV: number | null;
  averageCurrentA: number | null;
  averageTemperatureC: number | null;
  maximumTemperatureC: number | null;
  minimumVoltageV: number | null;
  recentCurrentBehavior: string | null;
  sampleCount: number | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`VoltBot API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export function getLatestBatteryReading(): Promise<BatteryReading> {
  return getJson<BatteryReading>("/api/battery/latest");
}

export function postDemoScenario(
  scenario: DemoScenario,
  advance = false,
): Promise<BatteryReading> {
  return fetch(`${API_BASE_URL}/api/demo/scenario`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scenario, advance }),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`VoltBot demo request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as BatteryReading;
  });
}

export function getBatteryHistory(limit = 20): Promise<BatteryReading[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("Battery history limit must be an integer from 1 to 100");
  }

  const query = new URLSearchParams({ limit: String(limit) });
  return getJson<BatteryReading[]>(`/api/battery/history?${query.toString()}`);
}

function toStatus(status: BackendStatus): StatusLevel {
  switch (status) {
    case "NORMAL":
      return "normal";
    case "WARNING":
      return "warning";
    case "CRITICAL":
      return "critical";
    default:
      return "info";
  }
}

export function mapBatteryReadingToTelemetry(reading: BatteryReading): BatteryTelemetry {
  const imbalanceV = reading.cell_imbalance_v ?? reading.cell_imbalance;
  const cellMinV = reading.cell_min_v ?? reading.cell_min;
  const cellMaxV = reading.cell_max_v ?? reading.cell_max;

  return {
    readingId: reading.id,
    deviceId: reading.device_id,
    timestamp: reading.timestamp,
    powerW: reading.power_w ?? reading.power,
    packVoltage: {
      value: reading.voltage,
      unit: "V",
      status: toStatus(reading.voltage_status),
      available: true,
    },
    current: {
      value: reading.current,
      unit: "A",
      status: toStatus(reading.current_status),
      available: true,
    },
    temperature: {
      value: reading.temperature,
      unit: "°C",
      status: toStatus(reading.temperature_status),
      available: true,
    },
    cellMinV,
    cellMaxV,
    cellImbalance: {
      value: imbalanceV * 1000,
      unit: "mV",
      status: toStatus(reading.cell_status),
      available: true,
    },
    cellStatus: toStatus(reading.cell_status),
    cells: reading.cell_voltages.map((voltage, index) => ({
      id: `Cell ${String(index + 1).padStart(2, "0")}`,
      voltage,
      // The backend provides a pack-wide cell status, not per-cell classifications.
      status: "info",
    })),
    overallStatus: toStatus(reading.overall_status),
    alerts: [...reading.alerts],
    health: {
      status: reading.health_status,
      score: reading.health_score,
      operatingState: reading.operating_state,
      patterns: [...reading.patterns],
      patternFlags: { ...reading.pattern_flags },
      voltageTrendVPerMin: reading.voltage_trend_v_per_min,
      temperatureTrendCPerMin: reading.temperature_trend_c_per_min,
      currentTrendAPerMin: reading.current_trend_a_per_min,
      cellImbalanceTrendVPerMin: reading.cell_imbalance_trend_v_per_min,
      averageVoltageV: reading.average_voltage_v,
      averageCurrentA: reading.average_current_a,
      averageTemperatureC: reading.average_temperature_c,
      maximumTemperatureC: reading.maximum_temperature_c,
      minimumVoltageV: reading.minimum_voltage_v,
      recentCurrentBehavior: reading.recent_current_behavior,
      sampleCount: reading.health_sample_count,
    },
    demoScenario: reading.demo_scenario,
    demoStage: reading.demo_stage,
    demoSessionId: reading.demo_session_id,
  };
}
