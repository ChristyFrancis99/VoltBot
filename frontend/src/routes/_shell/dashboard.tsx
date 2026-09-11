import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Battery,
  Zap,
  Gauge,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Wrench,
  Wifi,
  Cloud,
  Clock3,
} from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { MetricCard } from "@/components/battery/MetricCard";
import { ServiceCalendar, ImportantNotifications } from "@/components/battery/RightPanel";
import { Panel, StatusChip, HealthRing, InfoValue } from "@/components/battery/ui";
import mechbot from "@/assets/mech-bot.png";

export const Route = createFileRoute("/_shell/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { snapshot, user } = useBattery();
  const firstName = user?.name.split(" ")[0] ?? "Christy";
  const live = snapshot.device.esp32Online && snapshot.device.cloudSynced;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section className="card-surface relative min-h-[190px] overflow-hidden p-5 sm:p-6">
          <div className="relative z-10 flex min-h-[155px] items-center pr-[34%] sm:pr-[30%] lg:pr-[28%]">
            <div className="min-w-0 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
                <span className={`size-1.5 rounded-full ${live ? "bg-primary animate-pulse" : "bg-destructive"}`} />
                {live ? "Live Monitoring System" : "Connection Limited"}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Welcome back, {firstName}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {live ? "Your EV battery monitoring system is active." : "Live telemetry is paused until connectivity is restored."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Battery ID: </span><span className="font-semibold text-foreground">{snapshot.batteryId}</span></div>
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Type: </span><span className="font-semibold text-foreground">{snapshot.batteryType}</span></div>
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Status: </span><span className="font-semibold text-foreground">{snapshot.monitoringStatus}</span></div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex w-[32%] items-end justify-center sm:right-4 sm:w-[30%] lg:w-[27%]">
            <img src={mechbot} alt="VoltBot mechanic robot" className="h-[96%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_10px_14px_rgba(49,43,79,0.14)]" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="State of Charge" reading={snapshot.soc} statusLabel={`${snapshot.soc.value ?? "--"}%`} icon={Battery} hint="Current remaining energy capacity" />
          <MetricCard label="Battery Health" reading={snapshot.healthScore} statusLabel={`${snapshot.healthScore.value ?? "--"}/100`} icon={Gauge} hint="Overall calculated state of health" />
          <MetricCard label="Pack Voltage" reading={snapshot.packVoltage} statusLabel={`${snapshot.packVoltage.value ?? "--"} V`} icon={Zap} hint="Total battery pack voltage" />
          <MetricCard label="Current" reading={snapshot.current} statusLabel={`${snapshot.current.value ?? "--"} A`} icon={Activity} hint="Live net current flow" />
          <MetricCard label="Temperature" reading={snapshot.temperature} statusLabel={`${snapshot.temperature.value ?? "--"} °C`} icon={Thermometer} hint="Average pack temperature reading" />
          <MetricCard label="Cell Imbalance" reading={snapshot.cellImbalance} statusLabel={`${snapshot.cellImbalance.value ?? "--"} mV`} icon={ShieldAlert} hint="Max voltage delta between highest and lowest cells" />
        </div>

        <Panel title="Battery Condition" description="Current battery health and risk overview">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center justify-center border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <HealthRing score={snapshot.healthScore.value ?? 72} size={110} />
              <div className="mt-3 text-center"><StatusChip status={snapshot.conditionStatus} label={snapshot.conditionStatus.toUpperCase()} /></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoValue label="Health Score" value={`${snapshot.healthScore.value ?? "--"} / 100`} />
                <InfoValue label="Risk Level" value={snapshot.riskLevel} />
                <InfoValue label="Operating Mode" value={<span className="capitalize">{snapshot.operatingMode}</span>} />
                <InfoValue label="Anomaly Score" value={snapshot.anomalyScore.toFixed(2)} hint="0.0 = baseline · 1.0 = high anomaly" />
              </div>
              <div className="rounded-xl bg-warning-soft p-3.5 text-xs text-warning-foreground">
                <div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">Current status</p><p className="mt-0.5">{snapshot.conditionDescription}</p></div></div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <Panel title="Current Analysis" description="System parameter health status breakdown">
            <div className="divide-y divide-border">
              {snapshot.analysis.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <div className="min-w-0"><span className="font-medium text-foreground">{item.label}</span>{item.detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>}</div>
                  <div className="flex shrink-0 items-center gap-2"><span className="text-muted-foreground">{item.verdict}</span><StatusChip status={item.status} /></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recommended Action" description="Battery diagnostic advisory">
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Wrench className="size-4" /></span>
                  <div><h3 className="text-sm font-semibold text-foreground">Action Advisory</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{snapshot.recommendedAction}</p></div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Standard Operating Procedure</p>
                <ul className="list-disc space-y-1 pl-4"><li>Verify physical connections if cell imbalance exceeds 60 mV.</li><li>Schedule a regular service check every 90 days.</li></ul>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="IoT Device Status" description="ESP32 and sensor connectivity">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/60 p-3"><Wifi className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Wi-Fi</p><p className="text-sm font-semibold text-foreground">{snapshot.device.wifiConnected ? "Connected" : "Disconnected"}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.wifiConnected ? `${snapshot.device.wifiSignalDbm} dBm` : "Signal unavailable"}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Cloud className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Cloud</p><p className="text-sm font-semibold text-foreground">{snapshot.device.cloudSynced ? "Synced" : "Disconnected"}</p><p className="text-[11px] text-muted-foreground">{live ? `Last packet ${snapshot.lastUpdatedSeconds}s ago` : "Live packet unavailable"}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Battery className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Device</p><p className="text-sm font-semibold text-foreground">{snapshot.device.esp32Online ? "ESP32 Online" : "ESP32 Offline"}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.deviceId}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Clock3 className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Firmware</p><p className="text-sm font-semibold text-foreground">{snapshot.device.firmware}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.sensors.filter((sensor) => sensor.online).length}/{snapshot.device.sensors.length} sensors online</p></div>
            </div>
          </Panel>

          <Panel title="Charging / Operating Status" description="Current battery operating mode">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3"><div><p className="text-[11px] text-muted-foreground">Operating Mode</p><p className="text-base font-semibold capitalize text-foreground">{snapshot.operatingMode}</p></div><StatusChip status={live ? (snapshot.operatingMode === "charging" ? "normal" : "info") : "critical"} label={live ? snapshot.operatingMode.toUpperCase() : "DATA UNAVAILABLE"} /></div>
              <div className="grid grid-cols-3 gap-2 text-center"><InfoValue label="Charge" value={live ? `${snapshot.charging.progress}%` : "--"} /><InfoValue label="Charge Current" value={live ? `${snapshot.charging.current} A` : "--"} /><InfoValue label="Pack Voltage" value={live ? `${snapshot.charging.voltage} V` : "--"} /></div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-5"><ServiceCalendar /><ImportantNotifications /></div>
    </div>
  );
}
