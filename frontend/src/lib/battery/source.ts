import type { BatterySnapshot, OperatingMode, SensorReading } from "./types";

/**
 * DEMO / MOCK SOURCE.
 * Replace this module with a real adapter (Firebase listener or REST poll of
 * the ESP32 gateway) that returns the same `BatterySnapshot` shape.
 *
 * Important: this source never presents generated values as live telemetry
 * when the simulated cloud/device connection is unavailable.
 */

const baseCellVoltages = [4.02, 4.01, 4.03, 4.0, 4.01, 3.978, 4.02, 4.01];

export const trendData = [
  { cycle: "Cycle 1", health: 66, temperature: 31.2, voltage: 47.4, current: 7.2 },
  { cycle: "Cycle 2", health: 67, temperature: 32.1, voltage: 47.6, current: 7.6 },
  { cycle: "Cycle 3", health: 68, temperature: 32.8, voltage: 47.9, current: 7.9 },
  { cycle: "Cycle 4", health: 69, temperature: 33.5, voltage: 48.0, current: 8.0 },
  { cycle: "Cycle 5", health: 70, temperature: 34.9, voltage: 48.1, current: 8.2 },
  { cycle: "Cycle 6", health: 71, temperature: 35.7, voltage: 48.1, current: 8.3 },
  { cycle: "Cycle 7", health: 72, temperature: 36.8, voltage: 48.2, current: 8.4 },
];

const unavailable = <T>(reading: SensorReading<T>, lastKnownAt: string): SensorReading<T> => ({
  ...reading,
  value: null,
  available: false,
  status: "critical",
  lastKnown: reading.value ?? reading.lastKnown,
  lastKnownAt,
});

export function createDemoSnapshot(
  mode: OperatingMode,
  tick: number,
  connectivity: { esp32Online?: boolean; cloudOnline?: boolean } = {},
): BatterySnapshot {
  const esp32Online = connectivity.esp32Online ?? true;
  const cloudOnline = connectivity.cloudOnline ?? true;
  const j = (base: number, amp: number, offset = 0) =>
    Number((base + Math.sin((tick + offset) / 3) * amp).toFixed(2));

  const current = mode === "charging" ? j(6.8, 0.2) : mode === "idle" ? 0 : j(8.4, 0.3);
  const packVoltage = mode === "charging" ? j(52.1, 0.1) : mode === "idle" ? 49.0 : j(48.2, 0.15);
  const temperature = j(36.8, 0.2, 2);

  const cells = baseCellVoltages.map((v, i) => ({
    id: `Cell ${String(i + 1).padStart(2, "0")}`,
    voltage: Number((v + Math.sin((tick + i) / 5) * 0.004).toFixed(3)),
    status: v < 3.98 ? ("warning" as const) : ("normal" as const),
  }));

  const numericCells = cells.map((cell) => cell.voltage).filter((v): v is number => v !== null);
  const maxCell = Math.max(...numericCells);
  const minCell = Math.min(...numericCells);
  const imbalanceMv = Math.round((maxCell - minCell) * 1000);
  const temperatureStatus = temperature > 34 ? ("warning" as const) : ("normal" as const);

  const liveReadings = {
    soc: { value: 78, unit: "%", status: "normal" as const, available: true },
    healthScore: { value: 72, unit: "/ 100", status: "warning" as const, available: true },
    packVoltage: { value: packVoltage, unit: "V", status: "normal" as const, available: true },
    current: { value: Number(current.toFixed(1)), unit: "A", status: mode === "idle" ? ("info" as const) : ("normal" as const), available: true },
    temperature: { value: temperature, unit: "°C", status: temperatureStatus, available: true },
    cellImbalance: { value: imbalanceMv, unit: "mV", status: imbalanceMv > 30 ? ("monitor" as const) : ("normal" as const), available: true },
  };

  const anomalyScore = Number(
    Math.min(
      1,
      Math.max(
        0,
        0.45 * Math.min(1, Math.max(0, (temperature - 29) / 10)) +
          0.55 * Math.min(1, Math.max(0, (imbalanceMv - 10) / 50)),
      ),
    ).toFixed(2),
  );

  const snapshot: BatterySnapshot = {
    batteryId: "EVB-001",
    batteryType: "Lithium-ion",
    monitoringStatus: esp32Online && cloudOnline ? "Active" : "Connection Limited",
    operatingMode: mode,
    ...liveReadings,
    cells,
    anomalyScore,
    riskLevel: anomalyScore >= 0.75 ? "High" : anomalyScore >= 0.5 ? "Moderate" : "Low",
    conditionStatus: anomalyScore >= 0.75 ? "critical" : anomalyScore >= 0.5 ? "warning" : "normal",
    conditionDescription:
      anomalyScore >= 0.5
        ? "Battery remains operational, but temperature and cell-voltage variation require monitoring."
        : "Battery parameters are currently within the configured monitoring profile.",
    analysis: [
      { label: "Pack voltage", verdict: "Normal", status: "normal" },
      { label: "Cell imbalance", verdict: imbalanceMv > 30 ? "Above baseline" : "Normal", status: imbalanceMv > 30 ? "warning" : "normal", detail: `Current: ${imbalanceMv} mV · Normal: 10–30 mV` },
      { label: "Temperature", verdict: temperature > 34 ? "Above baseline" : "Normal", status: temperature > 34 ? "warning" : "normal", detail: `Normal: 29–34 °C · Current: ${temperature.toFixed(1)} °C` },
      { label: "Current pattern", verdict: "Normal", status: "normal" },
      { label: "Charging behaviour", verdict: "Normal", status: "normal" },
    ],
    recommendedAction:
      imbalanceMv > 60
        ? "Inspect cell connections and balancing circuitry because the measured cell difference exceeds the configured 60 mV inspection threshold."
        : "Continue monitoring. Inspect the battery if cell imbalance or temperature continues to increase.",
    healthBreakdown: [
      { label: "Temperature", value: 82 },
      { label: "Cell Balance", value: 65 },
      { label: "Voltage Stability", value: 88 },
      { label: "Current Pattern", value: 91 },
      { label: "Charging Pattern", value: 86 },
    ],
    behaviourProfile: {
      temperatureRange: "29–34 °C",
      cellDifferenceRange: "10–30 mV",
      averageChargingHours: 3.1,
      voltageRange: "44–54 V",
      typicalCurrent: "0–15 A",
    },
    currentBehaviour: [
      { label: "Temperature", verdict: temperature > 34 ? "Above baseline" : "Normal", status: temperature > 34 ? "warning" : "normal" },
      { label: "Cell imbalance", verdict: imbalanceMv > 30 ? "Above baseline" : "Normal", status: imbalanceMv > 30 ? "warning" : "normal" },
      { label: "Voltage", verdict: "Normal", status: "normal" },
      { label: "Current", verdict: "Normal", status: "normal" },
      { label: "Charging", verdict: "Normal", status: "normal" },
    ],
    faults: [
      {
        key: "thermal",
        name: "Thermal Anomaly",
        status: temperature > 34 ? "monitor" : "normal",
        summary: "Pack temperature is compared with the configured baseline range.",
        details: [
          { label: "Current Temperature", value: `${temperature.toFixed(1)} °C` },
          { label: "Baseline Range", value: "29–34 °C" },
          { label: "Rate of Rise", value: "0.6 °C / cycle" },
          { label: "Status", value: temperature > 34 ? "Monitor" : "Normal" },
        ],
        note: "This prototype provides an early-warning indicator; it does not certify battery safety.",
      },
      {
        key: "imbalance",
        name: "Cell Imbalance",
        status: imbalanceMv > 30 ? "warning" : "normal",
        summary: "Cell voltage spread is compared with the configured historical range.",
        details: [
          { label: "Maximum Cell", value: `${maxCell.toFixed(3)} V` },
          { label: "Minimum Cell", value: `${minCell.toFixed(3)} V` },
          { label: "Difference", value: `${imbalanceMv} mV` },
          { label: "Historical Normal Range", value: "10–30 mV" },
          { label: "Status", value: imbalanceMv > 30 ? "Warning" : "Normal" },
        ],
        note: "Inspection is recommended if the difference keeps increasing across cycles.",
      },
      {
        key: "voltage",
        name: "Voltage Anomaly",
        status: "normal",
        summary: "Pack voltage remains inside the configured operating window.",
        details: [
          { label: "Pack Voltage", value: `${packVoltage.toFixed(2)} V` },
          { label: "Normal Range", value: "44–54 V" },
          { label: "Status", value: "Normal" },
        ],
        note: "No action required based on the current prototype rule set.",
      },
      {
        key: "charging",
        name: "Charging Anomaly",
        status: "normal",
        summary: "Charging duration and current profile are compared with the demo behaviour profile.",
        details: [
          { label: "Average Charging Time", value: "3.1 h" },
          { label: "Last Charge Duration", value: "3.0 h" },
          { label: "Peak Charge Current", value: "6.9 A" },
          { label: "Status", value: "Normal" },
        ],
        note: "No action required based on the current prototype rule set.",
      },
    ],
    trends: trendData,
    alerts: [
      { id: "a1", severity: "warning", title: "Cell imbalance increasing", timestamp: "10 Sep 2026 · 18:40", description: "Cell difference increased from 32 mV to 52 mV over 3 cycles." },
      { id: "a2", severity: "monitor", title: "Temperature above baseline", timestamp: "10 Sep 2026 · 17:52", description: "Pack temperature reached 36.8 °C, baseline range is 29–34 °C." },
      { id: "a3", severity: "resolved", title: "Charging anomaly resolved", timestamp: "10 Sep 2026 · 14:20", description: "Charge current returned to the expected profile." },
      { id: "a4", severity: "information", title: "Behaviour profile updated", timestamp: "09 Sep 2026 · 21:05", description: "Baseline recalculated using the last 20 monitoring cycles." },
      { id: "a5", severity: "resolved", title: "Sensor packet loss recovered", timestamp: "08 Sep 2026 · 11:12", description: "ESP32 reconnected after a 42 second Wi-Fi dropout." },
    ],
    notifications: [
      { id: "n1", icon: "bell", title: "Cell imbalance detected", timestamp: "10 Sep · 18:40", description: "Cell difference increased to 52 mV." },
      { id: "n2", icon: "thermometer", title: "Temperature above baseline", timestamp: "10 Sep · 17:52", description: "Battery temperature reached 36.8 °C." },
      { id: "n3", icon: "battery", title: "Battery health updated", timestamp: "10 Sep · 16:30", description: "Health score updated to 72/100." },
      { id: "n4", icon: "bolt", title: "Charging completed", timestamp: "10 Sep · 14:15", description: "Battery reached full charge." },
      { id: "n5", icon: "wrench", title: "Service reminder", timestamp: "09 Sep · 10:00", description: "Next battery inspection is due soon." },
    ],
    events: [
      { time: "18:42", label: "Sensor data received", icon: "signal" },
      { time: "18:40", label: "Cell imbalance increased", icon: "cells" },
      { time: "18:32", label: "Temperature crossed baseline", icon: "thermometer" },
      { time: "18:15", label: "Charging completed", icon: "bolt" },
      { time: "17:45", label: "Monitoring session started", icon: "play" },
    ],
    device: {
      deviceId: "ESP32-BAT001",
      firmware: "v1.2.4",
      wifiSignalDbm: -58,
      lastPacketSeconds: 2,
      esp32Online,
      cloudSynced: cloudOnline && esp32Online,
      wifiConnected: esp32Online,
      sensors: [
        { key: "voltage", label: "Voltage Sensor", online: esp32Online && cloudOnline },
        { key: "current", label: "Current Sensor", online: esp32Online && cloudOnline },
        { key: "temperature", label: "Temperature Sensor", online: esp32Online && cloudOnline },
        { key: "cell", label: "Cell Monitor", online: esp32Online && cloudOnline },
      ],
    },
    service: {
      batteryId: "EVB-001",
      installationDate: "12 Aug 2026",
      monitoringCycles: 47,
      chargingCycles: 39,
      lastServiced: "18 Aug 2026",
      nextService: "18 Nov 2026",
      daysRemaining: Math.max(0, Math.ceil((new Date("2026-11-18T00:00:00").getTime() - Date.now()) / 86400000)),
      history: [
        { date: "18 Aug 2026", type: "Routine inspection", technician: "C. Francis", notes: "Cell balancing check, connector torque verified." },
        { date: "20 Jun 2026", type: "Thermal check", technician: "R. Menon", notes: "Thermal pad replaced on module 2." },
        { date: "14 Apr 2026", type: "Firmware update", technician: "C. Francis", notes: "ESP32 firmware updated to v1.2.4." },
      ],
    },
    charging: { progress: 78, current: 6.8, voltage: 52.1, estimatedMinutes: 42 },
    lastUpdatedSeconds: esp32Online && cloudOnline ? 2 : 0,
    isDemoData: true,
  };

  if (!esp32Online || !cloudOnline) {
    const lastKnownAt = "18:42";
    snapshot.soc = unavailable(snapshot.soc, lastKnownAt);
    snapshot.packVoltage = unavailable(snapshot.packVoltage, lastKnownAt);
    snapshot.current = unavailable(snapshot.current, lastKnownAt);
    snapshot.cellImbalance = unavailable(snapshot.cellImbalance, lastKnownAt);
    snapshot.temperature = unavailable(snapshot.temperature, lastKnownAt);
    snapshot.cells = snapshot.cells.map((cell) => ({ ...cell, voltage: null, status: "critical" }));
    snapshot.device.sensors = snapshot.device.sensors.map((sensor) => ({ ...sensor, online: false }));
    snapshot.device.cloudSynced = false;
    snapshot.lastUpdatedSeconds = 0;
    snapshot.monitoringStatus = "Connection Limited";
    snapshot.recommendedAction = !esp32Online
      ? "ESP32 is disconnected. Restore the device connection before treating new dashboard values as live telemetry."
      : "Cloud synchronization is unavailable. Live telemetry is paused until the cloud connection is restored.";
  }

  return snapshot;
}
