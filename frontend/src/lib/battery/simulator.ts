export const SCENARIOS = [
  { id: "healthy", label: "Healthy Operation" },
  { id: "degradation", label: "Degradation Pattern" },
  { id: "overheating", label: "Overheating" },
  { id: "imbalance", label: "Cell Imbalance" },
  { id: "multiple", label: "Multiple Faults" },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]["id"];
export type HealthStatus = "HEALTHY" | "WATCH" | "DEGRADED" | "CRITICAL";
export type OperatingState = "DISCHARGING" | "CHARGING" | "IDLE";

export interface SimulatedReading {
  timestamp: number;
  step: number;
  voltage: number;
  current: number;
  temperature: number;
  cells: [number, number, number, number];
}

export interface PrototypeThresholds {
  minimumTrendReadings: number;
  trendWindowReadings: number;
  voltageDropWarning: number;
  currentRiseWarning: number;
  temperatureRiseWarning: number;
  temperatureWarning: number;
  temperatureCritical: number;
  currentWarning: number;
  currentCritical: number;
  voltageWarning: number;
  voltageCritical: number;
  imbalanceWarning: number;
  imbalanceCritical: number;
  idleCurrentMagnitude: number;
}

export const PROTOTYPE_THRESHOLDS: Readonly<PrototypeThresholds> = {
  minimumTrendReadings: 4,
  trendWindowReadings: 6,
  voltageDropWarning: 1.2,
  currentRiseWarning: 4,
  temperatureRiseWarning: 5,
  temperatureWarning: 42,
  temperatureCritical: 50,
  currentWarning: 22,
  currentCritical: 32,
  voltageWarning: 44.5,
  voltageCritical: 42.5,
  imbalanceWarning: 0.1,
  imbalanceCritical: 0.2,
  idleCurrentMagnitude: 0.2,
};

const SCENARIO_VALUES: Record<ScenarioId, Omit<SimulatedReading, "timestamp" | "step">[]> = {
  healthy: [
    { voltage: 48.5, current: 8, temperature: 30, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.48, current: 8.2, temperature: 30.2, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.52, current: 8.1, temperature: 30.3, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.49, current: 8.3, temperature: 30.5, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.51, current: 8, temperature: 30.6, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.5, current: 8.1, temperature: 30.8, cells: [3.7, 3.71, 3.69, 3.7] },
  ],
  degradation: [
    { voltage: 48.5, current: 8, temperature: 30, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48, current: 10, temperature: 32, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 47.5, current: 12, temperature: 35, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 46.8, current: 14, temperature: 38, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 45.9, current: 16, temperature: 41, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 45, current: 18, temperature: 44, cells: [3.7, 3.71, 3.69, 3.7] },
  ],
  overheating: [
    { voltage: 48.5, current: 8, temperature: 30, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.4, current: 8.1, temperature: 32, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.3, current: 8.1, temperature: 35, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.3, current: 8.2, temperature: 38, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.2, current: 8.2, temperature: 42, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.2, current: 8.3, temperature: 46, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.1, current: 8.3, temperature: 50, cells: [3.7, 3.71, 3.69, 3.7] },
  ],
  imbalance: [
    { voltage: 48.5, current: 8, temperature: 30, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.5, current: 8, temperature: 30.1, cells: [3.7, 3.71, 3.69, 3.68] },
    { voltage: 48.5, current: 8.1, temperature: 30.2, cells: [3.7, 3.71, 3.69, 3.65] },
    { voltage: 48.5, current: 8.1, temperature: 30.3, cells: [3.7, 3.71, 3.69, 3.62] },
    { voltage: 48.4, current: 8.2, temperature: 30.4, cells: [3.7, 3.71, 3.69, 3.58] },
    { voltage: 48.4, current: 8.2, temperature: 30.5, cells: [3.7, 3.71, 3.69, 3.48] },
  ],
  multiple: [
    { voltage: 48.5, current: 10, temperature: 32, cells: [3.7, 3.71, 3.69, 3.7] },
    { voltage: 48.2, current: 15, temperature: 35, cells: [3.7, 3.71, 3.69, 3.66] },
    { voltage: 47.8, current: 20, temperature: 39, cells: [3.7, 3.71, 3.69, 3.6] },
    { voltage: 46.9, current: 25, temperature: 43, cells: [3.7, 3.71, 3.69, 3.54] },
    { voltage: 45.5, current: 30, temperature: 47, cells: [3.7, 3.71, 3.69, 3.46] },
    { voltage: 43.9, current: 34, temperature: 50, cells: [3.7, 3.71, 3.69, 3.4] },
    { voltage: 42.2, current: 36, temperature: 52, cells: [3.7, 3.71, 3.69, 3.35] },
  ],
};

export interface FaultAlert {
  id: string;
  severity: "WARNING" | "CRITICAL";
  message: string;
}

export interface SimulationAnalysis {
  health: HealthStatus;
  operatingState: OperatingState;
  voltageMinimum: number;
  voltageMaximum: number;
  voltageChange: number | null;
  currentChange: number | null;
  temperatureChange: number | null;
  maximumTemperature: number;
  cellImbalance: number;
  patterns: string[];
  reasons: string[];
  alerts: FaultAlert[];
  historyReady: boolean;
}

export function createReading(
  scenario: ScenarioId,
  step: number,
  timestamp = Date.now(),
): SimulatedReading {
  const sequence = SCENARIO_VALUES[scenario];
  const value = sequence[Math.min(Math.max(step, 0), sequence.length - 1)]!;
  return { ...value, cells: [...value.cells], step, timestamp };
}

export function analyzeReadings(
  readings: readonly SimulatedReading[],
  thresholds: Readonly<PrototypeThresholds> = PROTOTYPE_THRESHOLDS,
): SimulationAnalysis {
  const latest = readings.at(-1) ?? createReading("healthy", 0);
  const window = readings.slice(-thresholds.trendWindowReadings);
  const first = window[0] ?? latest;
  const enoughHistory = readings.length >= thresholds.minimumTrendReadings;
  const voltageValues = window.map((reading) => reading.voltage);
  const cellImbalance = Math.max(...latest.cells) - Math.min(...latest.cells);
  const voltageChange = enoughHistory ? latest.voltage - first.voltage : null;
  const currentChange = enoughHistory ? latest.current - first.current : null;
  const temperatureChange = enoughHistory ? latest.temperature - first.temperature : null;
  const alerts: FaultAlert[] = [];

  if (latest.temperature >= thresholds.temperatureCritical) {
    alerts.push({
      id: "temperature",
      severity: "CRITICAL",
      message: `Temperature reached ${latest.temperature.toFixed(1)} °C (critical threshold ${thresholds.temperatureCritical} °C).`,
    });
  } else if (latest.temperature >= thresholds.temperatureWarning) {
    alerts.push({
      id: "temperature",
      severity: "WARNING",
      message: `Temperature reached ${latest.temperature.toFixed(1)} °C (warning threshold ${thresholds.temperatureWarning} °C).`,
    });
  }
  if (latest.current >= thresholds.currentCritical) {
    alerts.push({
      id: "current",
      severity: "CRITICAL",
      message: `Discharge current reached ${latest.current.toFixed(1)} A (critical threshold ${thresholds.currentCritical} A).`,
    });
  } else if (latest.current >= thresholds.currentWarning) {
    alerts.push({
      id: "current",
      severity: "WARNING",
      message: `Discharge current reached ${latest.current.toFixed(1)} A (warning threshold ${thresholds.currentWarning} A).`,
    });
  }
  if (latest.voltage <= thresholds.voltageCritical) {
    alerts.push({
      id: "voltage",
      severity: "CRITICAL",
      message: `Voltage reached ${latest.voltage.toFixed(1)} V (critical threshold ${thresholds.voltageCritical} V).`,
    });
  } else if (latest.voltage <= thresholds.voltageWarning) {
    alerts.push({
      id: "voltage",
      severity: "WARNING",
      message: `Voltage reached ${latest.voltage.toFixed(1)} V (warning threshold ${thresholds.voltageWarning} V).`,
    });
  }
  if (cellImbalance >= thresholds.imbalanceCritical) {
    alerts.push({
      id: "imbalance",
      severity: "CRITICAL",
      message: `Cell imbalance is ${(cellImbalance * 1000).toFixed(0)} mV (critical threshold ${(thresholds.imbalanceCritical * 1000).toFixed(0)} mV).`,
    });
  } else if (cellImbalance >= thresholds.imbalanceWarning) {
    alerts.push({
      id: "imbalance",
      severity: "WARNING",
      message: `Cell imbalance is ${(cellImbalance * 1000).toFixed(0)} mV (warning threshold ${(thresholds.imbalanceWarning * 1000).toFixed(0)} mV).`,
    });
  }

  const patterns: string[] = [];
  if (enoughHistory && voltageChange !== null && voltageChange <= -thresholds.voltageDropWarning) {
    patterns.push("Declining-voltage trend");
  }
  if (enoughHistory && currentChange !== null && currentChange >= thresholds.currentRiseWarning) {
    patterns.push("Increasing-current-demand trend");
  }
  if (
    enoughHistory &&
    temperatureChange !== null &&
    temperatureChange >= thresholds.temperatureRiseWarning
  ) {
    patterns.push("Rising-temperature trend");
  }

  const reasons = [...patterns];
  if (alerts.some((alert) => alert.id === "temperature"))
    reasons.push("Temperature crossed a configured prototype fault threshold.");
  if (alerts.some((alert) => alert.id === "current"))
    reasons.push("Current crossed a configured prototype fault threshold.");
  if (alerts.some((alert) => alert.id === "voltage"))
    reasons.push("Voltage crossed a configured prototype fault threshold.");
  if (alerts.some((alert) => alert.id === "imbalance"))
    reasons.push("Cell voltage imbalance crossed a configured prototype threshold.");
  if (!enoughHistory && alerts.length === 0)
    reasons.push(
      `Trend assessment needs ${thresholds.minimumTrendReadings} readings; ${readings.length} available.`,
    );
  if (enoughHistory && reasons.length === 0)
    reasons.push("Recent readings remain within configured prototype trend and fault thresholds.");

  let health: HealthStatus = "HEALTHY";
  if (alerts.some((alert) => alert.severity === "CRITICAL")) health = "CRITICAL";
  else if (patterns.length >= 2) health = "DEGRADED";
  else if (alerts.length > 0 || patterns.length === 1) health = "WATCH";

  const latestCurrent = latest.current;
  const operatingState: OperatingState =
    Math.abs(latestCurrent) <= thresholds.idleCurrentMagnitude
      ? "IDLE"
      : latestCurrent > 0
        ? "DISCHARGING"
        : "CHARGING";

  return {
    health,
    operatingState,
    voltageMinimum: Math.min(...voltageValues),
    voltageMaximum: Math.max(...voltageValues),
    voltageChange,
    currentChange,
    temperatureChange,
    maximumTemperature: Math.max(...window.map((reading) => reading.temperature)),
    cellImbalance,
    patterns,
    reasons,
    alerts,
    historyReady: enoughHistory,
  };
}
