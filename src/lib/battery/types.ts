// Domain types for the VoltBot monitoring layer.
//
// Data flow (see src/lib/battery/README.md):
// Battery -> Sensors -> ESP32 -> Wi-Fi -> Backend/Firebase -> Database ->
// Preprocessing -> Feature extraction -> Behaviour profile -> Anomaly detection ->
// Risk calculation -> Health score -> Dashboard.
//
// Every value consumed by the UI comes through the BatterySnapshot shape below,
// so a real API/Firebase adapter can replace the mock source in `source.ts`
// without touching any component.

export type StatusLevel = "normal" | "monitor" | "warning" | "critical" | "info";
export type OperatingMode = "charging" | "discharging" | "idle";

export interface SensorReading<T = number> {
  value: T | null;
  unit: string;
  status: StatusLevel;
  /** false when the sensor did not report in this packet */
  available: boolean;
  lastKnown?: T | undefined;
  lastKnownAt?: string | undefined;
}

export interface CellReading {
  id: string;
  voltage: number | null;
  status: StatusLevel;
}

export interface DeviceStatus {
  deviceId: string;
  firmware: string;
  wifiSignalDbm: number;
  lastPacketSeconds: number;
  esp32Online: boolean;
  cloudSynced: boolean;
  wifiConnected: boolean;
  sensors: { key: string; label: string; online: boolean }[];
}

export interface BehaviourProfile {
  temperatureRange: string;
  cellDifferenceRange: string;
  averageChargingHours: number;
  voltageRange: string;
  typicalCurrent: string;
}

export interface HealthBreakdownItem {
  label: string;
  value: number;
}

export interface AnalysisItem {
  label: string;
  verdict: string;
  status: StatusLevel;
  detail?: string | undefined;
}

export interface FaultCategory {
  key: string;
  name: string;
  status: StatusLevel;
  summary: string;
  details: { label: string; value: string }[];
  note: string;
}

export interface AlertRecord {
  id: string;
  severity: "critical" | "warning" | "monitor" | "information" | "resolved";
  title: string;
  timestamp: string;
  description: string;
}

export interface NotificationRecord {
  id: string;
  icon: "bell" | "thermometer" | "battery" | "bolt" | "wrench";
  title: string;
  timestamp: string;
  description: string;
}

export interface EventRecord {
  time: string;
  label: string;
  icon: "signal" | "cells" | "thermometer" | "bolt" | "play";
}

export interface TrendPoint {
  cycle: string;
  health: number;
  temperature: number;
  voltage: number;
  current: number;
}

export interface ServiceInfo {
  batteryId: string;
  installationDate: string;
  monitoringCycles: number;
  chargingCycles: number;
  lastServiced: string;
  nextService: string;
  daysRemaining: number;
  history: { date: string; type: string; technician: string; notes: string }[];
}

export interface BatterySnapshot {
  batteryId: string;
  batteryType: string;
  monitoringStatus: string;
  operatingMode: OperatingMode;
  soc: SensorReading;
  healthScore: SensorReading;
  packVoltage: SensorReading;
  current: SensorReading;
  temperature: SensorReading;
  cellImbalance: SensorReading;
  cells: CellReading[];
  anomalyScore: number;
  riskLevel: string;
  conditionStatus: StatusLevel;
  conditionDescription: string;
  analysis: AnalysisItem[];
  recommendedAction: string;
  healthBreakdown: HealthBreakdownItem[];
  behaviourProfile: BehaviourProfile;
  currentBehaviour: AnalysisItem[];
  faults: FaultCategory[];
  trends: TrendPoint[];
  alerts: AlertRecord[];
  notifications: NotificationRecord[];
  events: EventRecord[];
  device: DeviceStatus;
  service: ServiceInfo;
  charging: { progress: number; current: number; voltage: number; estimatedMinutes: number };
  lastUpdatedSeconds: number;
  isDemoData: boolean;
}
