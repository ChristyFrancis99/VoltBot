import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  CheckCircle2,
  Cloud,
  Gauge,
  ShieldAlert,
  Thermometer,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { MetricCard } from "@/components/battery/MetricCard";
import { ServiceCalendar, ImportantNotifications } from "@/components/battery/RightPanel";
import { Panel, StatusChip, HealthRing, InfoValue } from "@/components/battery/ui";
import mechbot from "@/assets/mech-bot.png";

export const Route = createFileRoute("/_shell/dashboard")({ component: DashboardPage });

type TrendPoint = { voltage: number; temperature: number; current: number };

function Sparkline({ values, unavailable = false }: { values: number[]; unavailable?: boolean }) {
  if (unavailable || values.length < 2) {
    return <div className="flex h-12 items-center justify-center rounded-lg bg-muted/50 text-[10px] text-muted-foreground">Telemetry unavailable</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 42 - ((value - min) / range) * 32;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div className="h-12 overflow-hidden rounded-lg bg-muted/50 px-1">
      <svg viewBox="0 0 100 48" preserveAspectRatio="none" className="h-full w-full" aria-label="Telemetry trend">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-primary" />
      </svg>
    </div>
  );
}

function CellGrid({ cells, live }: { cells: Array<{ id: string; voltage: number | null; status: string }>; live: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {cells.map((cell) => {
        const warning = cell.status !== "normal";
        return (
          <div key={cell.id} className={`rounded-xl border p-3 ${warning ? "border-warning/40 bg-warning-soft/60" : "border-border bg-muted/40"}`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">{cell.id.replace("Cell ", "C")}</span>
              {live ? (warning ? <AlertTriangle className="size-3 text-warning" /> : <CheckCircle2 className="size-3 text-primary" />) : <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
            </div>
            <p className="mt-2 text-sm font-bold tabular-nums text-foreground">{cell.voltage == null ? "--" : `${cell.voltage.toFixed(3)} V`}</p>
          </div>
        );
      })}
    </div>
  );
}

function DashboardPage() {
  const { snapshot, user } = useBattery();
  const firstName = user?.name.split(" ")[0] ?? "Christy";
  const live = snapshot.device.esp32Online && snapshot.device.cloudSynced;
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  useEffect(() => {
    if (!live || snapshot.packVoltage.value == null || snapshot.temperature.value == null || snapshot.current.value == null) return;
    setTrend((previous) => [...previous, {
      voltage: snapshot.packVoltage.value,
      temperature: snapshot.temperature.value,
      current: snapshot.current.value,
    }].slice(-24));
  }, [live, snapshot.packVoltage.value, snapshot.temperature.value, snapshot.current.value]);

  const trendStats = useMemo(() => ({
    voltage: trend.map((item) => item.voltage),
    temperature: trend.map((item) => item.temperature),
    current: trend.map((item) => item.current),
  }), [trend]);

  const healthAvailable = snapshot.healthScore.value != null;
  const anomalyAvailable = live;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section className="card-surface relative overflow-hidden p-5 sm:p-6">
          <div className="relative z-10 flex min-h-[155px] items-center pr-[34%] sm:pr-[30%] lg:pr-[28%]">
            <div className="min-w-0 space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-soft-foreground">
                <span className={`size-1.5 rounded-full ${live ? "animate-pulse bg-primary" : "bg-destructive"}`} />
                {live ? "Live Monitoring System" : "Connection Limited"}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Welcome back, {firstName}</h1>
              <p className="max-w-xl text-xs text-muted-foreground sm:text-sm">{live ? "Your EV battery monitoring system is active and receiving telemetry." : "Live telemetry is paused until ESP32 and cloud connectivity are restored."}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Battery ID: </span><span className="font-semibold text-foreground">{snapshot.batteryId}</span></div>
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Type: </span><span className="font-semibold text-foreground">{snapshot.batteryType}</span></div>
                <div className="rounded-lg bg-muted px-2.5 py-1"><span className="text-muted-foreground">Status: </span><span className="font-semibold text-foreground">{snapshot.monitoringStatus}</span></div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex w-[32%] items-end justify-center sm:right-4 sm:w-[30%] lg:w-[27%]"><img src={mechbot} alt="VoltBot mechanic robot" className="h-[96%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_10px_14px_rgba(49,43,79,0.14)]" /></div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="State of Charge" reading={snapshot.soc} statusLabel={`${snapshot.soc.value ?? "--"}%`} icon={Battery} hint="Current remaining energy capacity" />
          <MetricCard label="Battery Health" reading={snapshot.healthScore} statusLabel={`${snapshot.healthScore.value ?? "--"}/100`} icon={Gauge} hint="Prototype battery health score" />
          <MetricCard label="Pack Voltage" reading={snapshot.packVoltage} statusLabel={`${snapshot.packVoltage.value ?? "--"} V`} icon={Zap} hint="Total battery pack voltage" />
          <MetricCard label="Current" reading={snapshot.current} statusLabel={`${snapshot.current.value ?? "--"} A`} icon={Activity} hint="Live net current flow" />
          <MetricCard label="Temperature" reading={snapshot.temperature} statusLabel={`${snapshot.temperature.value ?? "--"} °C`} icon={Thermometer} hint="Average pack temperature reading" />
          <MetricCard label="Cell Imbalance" reading={snapshot.cellImbalance} statusLabel={`${snapshot.cellImbalance.value ?? "--"} mV`} icon={ShieldAlert} hint="Max voltage delta between cells" />
        </div>

        <Panel title="Live Telemetry" description="Recent readings from the prototype monitoring stream">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Pack Voltage", value: snapshot.packVoltage.value == null ? "--" : `${snapshot.packVoltage.value.toFixed(2)} V`, values: trendStats.voltage },
              { label: "Temperature", value: snapshot.temperature.value == null ? "--" : `${snapshot.temperature.value.toFixed(1)} °C`, values: trendStats.temperature },
              { label: "Current", value: snapshot.current.value == null ? "--" : `${snapshot.current.value.toFixed(1)} A`, values: trendStats.current },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-background/70 p-3.5">
                <div className="mb-2 flex items-end justify-between gap-2"><div><p className="text-[11px] text-muted-foreground">{metric.label}</p><p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{metric.value}</p></div><span className="text-[10px] text-muted-foreground">Last 24 packets</span></div>
                <Sparkline values={metric.values} unavailable={!live} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Battery Condition" description="Current battery health and risk overview">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center justify-center border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              {healthAvailable ? <HealthRing score={snapshot.healthScore.value} size={110} /> : <div className="grid size-[110px] place-items-center rounded-full border-8 border-muted text-center"><span className="text-xs font-semibold text-muted-foreground">Unavailable</span></div>}
              <div className="mt-3 text-center"><StatusChip status={snapshot.conditionStatus} label={healthAvailable ? snapshot.conditionStatus.toUpperCase() : "DATA UNAVAILABLE"} /></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoValue label="Health Score" value={`${snapshot.healthScore.value ?? "--"} / 100`} />
                <InfoValue label="Risk Level" value={live ? snapshot.riskLevel : "Unavailable"} />
                <InfoValue label="Operating Mode" value={<span className="capitalize">{snapshot.operatingMode}</span>} />
                <InfoValue label="Anomaly Score" value={anomalyAvailable ? snapshot.anomalyScore.toFixed(2) : "--"} hint="Prototype heuristic · 0.0 = baseline" />
              </div>
              <div className="rounded-xl bg-warning-soft p-3.5 text-xs text-warning-foreground"><div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">Current status</p><p className="mt-0.5">{snapshot.conditionDescription}</p></div></div></div>
            </div>
          </div>
        </Panel>

        <Panel title="Cell Monitoring" description="Individual cell voltage view and pack balance">
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoValue label="Highest Cell" value={live ? `${Math.max(...snapshot.cells.map((cell) => cell.voltage ?? 0)).toFixed(3)} V` : "--"} />
            <InfoValue label="Lowest Cell" value={live ? `${Math.min(...snapshot.cells.map((cell) => cell.voltage ?? 9)).toFixed(3)} V` : "--"} />
            <InfoValue label="Difference" value={live ? `${snapshot.cellImbalance.value ?? "--"} mV` : "--"} />
            <InfoValue label="Cells Online" value={live ? `${snapshot.cells.filter((cell) => cell.voltage != null).length}/${snapshot.cells.length}` : "--"} />
          </div>
          <CellGrid cells={snapshot.cells} live={live} />
        </Panel>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <Panel title="Current Analysis" description="System parameter health status breakdown">
            <div className="divide-y divide-border">{snapshot.analysis.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 py-2.5 text-xs"><div className="min-w-0"><span className="font-medium text-foreground">{item.label}</span>{item.detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>}</div><div className="flex shrink-0 items-center gap-2"><span className="text-muted-foreground">{item.verdict}</span><StatusChip status={item.status} /></div></div>)}</div>
          </Panel>

          <Panel title="Recommended Action" description="Battery diagnostic advisory">
            <div className="space-y-4"><div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Wrench className="size-4" /></span><div><h3 className="text-sm font-semibold text-foreground">Action Advisory</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{snapshot.recommendedAction}</p></div></div></div><div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground"><p className="mb-1 font-medium text-foreground">Standard Operating Procedure</p><ul className="list-disc space-y-1 pl-4"><li>Verify physical connections if cell imbalance exceeds 60 mV.</li><li>Schedule a regular service check every 90 days.</li></ul></div></div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="IoT Device Status" description="ESP32 and sensor connectivity">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/60 p-3"><Wifi className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Wi-Fi</p><p className="text-sm font-semibold text-foreground">{snapshot.device.wifiConnected ? "Connected" : "Disconnected"}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.wifiConnected ? `${snapshot.device.wifiSignalDbm} dBm` : "Signal unavailable"}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Cloud className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Cloud</p><p className="text-sm font-semibold text-foreground">{snapshot.device.cloudSynced ? "Synced" : "Disconnected"}</p><p className="text-[11px] text-muted-foreground">{live ? `Last packet ${snapshot.lastUpdatedSeconds}s ago` : "Live packet unavailable"}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><BatteryCharging className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Device</p><p className="text-sm font-semibold text-foreground">{snapshot.device.esp32Online ? "ESP32 Online" : "ESP32 Offline"}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.deviceId}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><Gauge className="mb-2 size-4 text-primary" /><p className="text-[11px] text-muted-foreground">Firmware</p><p className="text-sm font-semibold text-foreground">{snapshot.device.firmware}</p><p className="text-[11px] text-muted-foreground">{snapshot.device.sensors.filter((sensor) => sensor.online).length}/{snapshot.device.sensors.length} sensors online</p></div>
            </div>
          </Panel>

          <Panel title="Charging / Operating Status" description="Current battery operating mode">
            <div className="space-y-3"><div className="flex items-center justify-between rounded-xl bg-muted/60 p-3"><div><p className="text-[11px] text-muted-foreground">Operating Mode</p><p className="text-base font-semibold capitalize text-foreground">{snapshot.operatingMode}</p></div><StatusChip status={live ? (snapshot.operatingMode === "charging" ? "normal" : "info") : "critical"} label={live ? snapshot.operatingMode.toUpperCase() : "DATA UNAVAILABLE"} /></div><div className="grid grid-cols-3 gap-2 text-center"><InfoValue label="Charge" value={live ? `${snapshot.charging.progress}%` : "--"} /><InfoValue label="Charge Current" value={live ? `${snapshot.charging.current} A` : "--"} /><InfoValue label="Pack Voltage" value={live ? `${snapshot.charging.voltage} V` : "--"} /></div></div>
          </Panel>
        </div>
      </div>

      <div className="space-y-5"><ServiceCalendar /><ImportantNotifications /></div>
    </div>
  );
}
