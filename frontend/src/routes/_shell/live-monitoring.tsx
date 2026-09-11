import { createFileRoute } from "@tanstack/react-router";
import { Activity, Battery, Thermometer, Zap, AlertTriangle } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip } from "@/components/battery/ui";
import { MetricCard } from "@/components/battery/MetricCard";
import type { OperatingMode } from "@/lib/battery/types";

export const Route = createFileRoute("/_shell/live-monitoring")({
  component: LiveMonitoringPage,
});

function LiveMonitoringPage() {
  const { snapshot, setMode } = useBattery();
  const live = snapshot.device.esp32Online && snapshot.device.cloudSynced;

  return (
    <div className="space-y-5">
      <div className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${live ? "bg-success-soft text-success" : "bg-critical-soft text-destructive"}`}>
              <span className={`size-2 rounded-full ${live ? "bg-success animate-pulse" : "bg-destructive"}`} />
              {live ? "Live" : "Unavailable"}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Battery Telemetry
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {live
              ? "Prototype telemetry stream updating every 2 seconds from the demo source."
              : "Live telemetry is unavailable. The interface will resume when the simulated connection is restored."}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-muted p-1">
          {(["discharging", "charging", "idle"] as OperatingMode[]).map((mode) => {
            const active = snapshot.operatingMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                disabled={!live}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                } ${!live ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="State of Charge" reading={snapshot.soc} statusLabel={`${snapshot.soc.value ?? "--"}%`} icon={Battery} />
        <MetricCard label="Pack Voltage" reading={snapshot.packVoltage} statusLabel={`${snapshot.packVoltage.value ?? "--"} V`} icon={Zap} />
        <MetricCard label="Current" reading={snapshot.current} statusLabel={`${snapshot.current.value ?? "--"} A`} icon={Activity} />
        <MetricCard label="Temperature" reading={snapshot.temperature} statusLabel={`${snapshot.temperature.value ?? "--"} °C`} icon={Thermometer} />
        <div className="card-surface flex flex-col justify-between p-4">
          <span className="text-xs font-medium text-muted-foreground">Operating Mode</span>
          <p className="text-xl font-bold capitalize leading-none text-foreground">{snapshot.operatingMode}</p>
          <StatusChip
            status={live ? (snapshot.operatingMode === "charging" ? "info" : "normal") : "critical"}
            label={live ? (snapshot.operatingMode === "charging" ? "Active Charge" : "Standard Mode") : "Unavailable"}
            className="self-start"
          />
        </div>
      </div>

      <Panel
        title="Cell Voltage Monitoring"
        description="Individual cell status across the 8-cell prototype pack"
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              Max Delta: <span className="text-warning font-semibold">{snapshot.cellImbalance.available ? `${snapshot.cellImbalance.value} mV` : "--"}</span>
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
          {snapshot.cells.map((cell) => {
            const isWarning = cell.status === "warning";
            const isUnavailable = cell.voltage === null;
            const voltage = cell.voltage !== null ? cell.voltage.toFixed(2) : "--";

            return (
              <div
                key={cell.id}
                className={`rounded-xl border p-4 transition-all ${
                  isWarning
                    ? "border-warning/50 bg-warning-soft/30 shadow-sm"
                    : "border-border bg-card/50 hover:bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{cell.id}</span>
                  <StatusChip
                    status={cell.status}
                    label={isUnavailable ? "Unavailable" : isWarning ? "Warning" : "Normal"}
                  />
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {voltage} <span className="text-xs font-normal text-muted-foreground">V</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">Target: 4.00 V</span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isWarning ? "bg-warning" : "bg-primary"}`}
                    style={{ width: cell.voltage !== null ? `${Math.min(100, (cell.voltage / 4.2) * 100)}%` : "0%" }}
                  />
                </div>

                {isWarning && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-warning-foreground">
                    <AlertTriangle className="size-3 shrink-0" /> Below nominal cell voltage threshold
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel title="Sensor Packet Diagnostics" description="Application-level telemetry status">
          <dl className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Device ID</dt><dd className="font-mono font-medium">{snapshot.device.deviceId}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Update Interval</dt><dd className="font-medium">2 seconds (demo)</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Wi-Fi Signal (RSSI)</dt><dd className="font-medium">{snapshot.device.wifiConnected ? `${snapshot.device.wifiSignalDbm} dBm` : "Unavailable"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Firmware Version</dt><dd className="font-mono font-medium">{snapshot.device.firmware}</dd></div>
          </dl>
        </Panel>

        <Panel title="Recent System Events" description="Demo telemetry event log">
          <ul className="space-y-2.5 text-xs">
            {snapshot.events.map((ev, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="font-medium text-foreground">{ev.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{ev.time}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
