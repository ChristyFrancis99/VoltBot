import { createFileRoute } from "@tanstack/react-router";
import { Activity, Battery, Thermometer, Zap } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip } from "@/components/battery/ui";
import { MetricCard } from "@/components/battery/MetricCard";
import type { OperatingMode } from "@/lib/battery/types";

export const Route = createFileRoute("/_shell/live-monitoring")({
  component: LiveMonitoringPage,
});

function LiveMonitoringPage() {
  const {
    snapshot,
    setMode,
    liveTelemetry,
    liveTelemetryLoading,
    liveTelemetryError,
    liveTelemetryConnected,
  } = useBattery();
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
            <span
              role="status"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${liveTelemetryConnected ? "bg-success-soft text-success" : "bg-critical-soft text-destructive"}`}
            >
              <span className={`size-2 rounded-full ${liveTelemetryConnected ? "bg-success" : "bg-destructive"}`} />
              {liveTelemetryConnected
                ? "Backend Connected"
                : liveTelemetryLoading && !liveTelemetry
                  ? "Connecting to Backend"
                  : "Backend Disconnected"}
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
          {liveTelemetryError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {liveTelemetryError}
              {liveTelemetry && " Showing the last successful reading."}
            </p>
          )}
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
        {liveTelemetry ? (
          <>
            <MetricCard label="Pack Voltage" reading={liveTelemetry.packVoltage} statusLabel={`${liveTelemetry.packVoltage.value ?? "--"} V`} icon={Zap} />
            <MetricCard label="Current" reading={liveTelemetry.current} statusLabel={`${liveTelemetry.current.value ?? "--"} A`} icon={Activity} />
            <MetricCard label="Temperature" reading={liveTelemetry.temperature} statusLabel={`${liveTelemetry.temperature.value ?? "--"} °C`} icon={Thermometer} />
          </>
        ) : (
          <div role="status" className="card-surface col-span-1 flex items-center p-4 text-xs text-muted-foreground sm:col-span-2">
            {liveTelemetryLoading ? "Loading live sensor readings…" : "Live sensor readings unavailable"}
          </div>
        )}
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
              Max Delta: <span className="text-warning font-semibold">{liveTelemetry ? `${liveTelemetry.cellImbalance.value ?? "--"} mV` : "--"}</span>
            </span>
          </div>
        }
      >
        {liveTelemetry ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
            {liveTelemetry.cells.map((cell) => {
              const voltage = cell.voltage !== null ? cell.voltage.toFixed(3) : "--";

              return (
                <div
                  key={cell.id}
                  className="rounded-xl border border-border bg-card/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{cell.id}</span>
                    <StatusChip status="info" label="Voltage reading" />
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {voltage} <span className="text-xs font-normal text-muted-foreground">V</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Target: 4.00 V</span>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: cell.voltage !== null ? `${Math.min(100, (cell.voltage / 4.2) * 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p role="status" className="py-6 text-center text-xs text-muted-foreground">
            {liveTelemetryLoading ? "Loading live cell readings…" : "Live cell readings unavailable"}
          </p>
        )}

      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel title="Sensor Packet Diagnostics" description="Application-level telemetry status">
          <dl className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Device ID</dt><dd className="font-mono font-medium">{liveTelemetry?.deviceId ?? "--"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Pack Power</dt><dd className="font-medium">{liveTelemetry ? `${liveTelemetry.powerW.toFixed(2)} W` : "--"}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-muted-foreground">Overall Monitoring Status</dt><dd className="font-medium capitalize">{liveTelemetry?.overallStatus ?? "--"}</dd></div>
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
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold text-foreground">Live Monitoring Alerts</p>
            {!liveTelemetry ? (
              <p className="text-xs text-muted-foreground">
                {liveTelemetryLoading ? "Waiting for live telemetry…" : "Live alerts unavailable"}
              </p>
            ) : liveTelemetry.alerts.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {liveTelemetry.alerts.map((alert, index) => (
                  <li key={`${index}-${alert}`} className="rounded-lg bg-muted/50 px-3 py-2">
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No active monitoring alerts</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
