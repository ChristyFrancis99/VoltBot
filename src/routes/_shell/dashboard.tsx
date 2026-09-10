import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Battery,
  Zap,
  Gauge,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
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

export const Route = createFileRoute("/_shell/dashboard")({component: DashboardPage,});

function DashboardPage() {
  const { snapshot, user } = useBattery();
  const firstName = user?.name.split(" ")[0] ?? "Christy";

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {/* Welcome Card + transparent MechBot mascot */}
        <section className="card-surface relative min-h-[190px] overflow-hidden p-5 sm:p-6">
          <div className="relative z-10 flex min-h-[155px] items-center pr-[34%] sm:pr-[30%] lg:pr-[28%]">
            <div className="min-w-0 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Live Monitoring System
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Welcome back, {firstName}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Your EV battery monitoring system is active.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <div className="rounded-lg bg-muted px-2.5 py-1">
                  <span className="text-muted-foreground">Battery ID: </span>
                  <span className="font-semibold text-foreground">{snapshot.batteryId}</span>
                </div>
                <div className="rounded-lg bg-muted px-2.5 py-1">
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-semibold text-foreground">{snapshot.batteryType}</span>
                </div>
                <div className="rounded-lg bg-muted px-2.5 py-1">
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-semibold text-success">{snapshot.monitoringStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent mascot: fills the card surface vertically, with no image background */}
          <div className="pointer-events-none absolute inset-y-0 right-2 flex w-[32%] items-end justify-center sm:right-4 sm:w-[30%] lg:w-[27%]">
            <img
              src={mechbot}
              alt="VoltBot mechanic robot"
              className="h-[96%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_10px_14px_rgba(49,43,79,0.14)]"
            />
            {/* Small EV Battery / Scooter Illustration */}
            <div className="relative z-10 flex shrink-0 items-center justify-center rounded-2xl bg-primary-soft/40 p-3 sm:p-4">
              <img
                src={mechbot}
                alt="EV Battery Pack Illustration"
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Six key battery metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="State of Charge" reading={snapshot.soc} statusLabel={`${snapshot.soc.value}%`} icon={Battery} hint="Current remaining energy capacity" />
          <MetricCard label="Battery Health" reading={snapshot.healthScore} statusLabel={`${snapshot.healthScore.value}/100`} icon={Gauge} hint="Overall calculated state of health" />
          <MetricCard label="Pack Voltage" reading={snapshot.packVoltage} statusLabel={`${snapshot.packVoltage.value} V`} icon={Zap} hint="Total battery pack voltage" />
          <MetricCard label="Current" reading={snapshot.current} statusLabel={`${snapshot.current.value} A`} icon={Activity} hint="Live net current flow" />
          <MetricCard label="Temperature" reading={snapshot.temperature} statusLabel={`${snapshot.temperature.value} °C`} icon={Thermometer} hint="Average pack temperature reading" />
          <MetricCard label="Cell Imbalance" reading={snapshot.cellImbalance} statusLabel={`${snapshot.cellImbalance.value} mV`} icon={ShieldAlert} hint="Max voltage delta between highest and lowest cells" />
        </div>

        {/* Battery Condition */}
        <Panel title="Battery Condition" description="Current battery health and risk overview">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center justify-center border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <HealthRing score={snapshot.healthScore.value ?? 72} size={110} />
              <div className="mt-3 text-center">
                <StatusChip status={snapshot.conditionStatus} label="WARNING" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoValue label="Health Score" value={`${snapshot.healthScore.value ?? 72} / 100`} />
                <InfoValue label="Risk Level" value={snapshot.riskLevel} />
                <InfoValue label="Operating Mode" value={<span className="capitalize">{snapshot.operatingMode}</span>} />
                <InfoValue label="Anomaly Score" value={snapshot.anomalyScore.toFixed(2)} hint="0.0 = baseline · 1.0 = high anomaly" />
              </div>

              <div className="rounded-xl bg-warning-soft p-3.5 text-xs text-warning-foreground">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Why this warning?</p>
                    <p className="mt-0.5">{snapshot.conditionDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Analysis + recommendation */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="Current Analysis" description="System parameter health status breakdown">
            <div className="divide-y divide-border">
              {snapshot.analysis.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{item.label}</span>
                    {item.detail && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">{item.verdict}</span>
                    <StatusChip status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recommended Action" description="Battery diagnostic advisory">
            <div className="flex h-full flex-col justify-between space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Wrench className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Action Advisory</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{snapshot.recommendedAction}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Standard Operating Procedure</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Verify physical connections if cell imbalance exceeds 60 mV.</li>
                  <li>Schedule a regular service check every 90 days.</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        {/* Device status + monitoring summary */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="IoT Device Status" description="ESP32 and sensor connectivity">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/60 p-3">
                <Wifi className="mb-2 size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">Wi-Fi</p>
                <p className="text-sm font-semibold text-foreground">Connected</p>
                <p className="text-[11px] text-muted-foreground">{snapshot.device.wifiSignalDbm} dBm</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <Cloud className="mb-2 size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">Cloud</p>
                <p className="text-sm font-semibold text-success">Synced</p>
                <p className="text-[11px] text-muted-foreground">Last packet {snapshot.lastUpdatedSeconds}s ago</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <Battery className="mb-2 size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">Device</p>
                <p className="text-sm font-semibold text-success">ESP32 Online</p>
                <p className="text-[11px] text-muted-foreground">{snapshot.device.deviceId}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <Clock3 className="mb-2 size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">Firmware</p>
                <p className="text-sm font-semibold text-foreground">{snapshot.device.firmware}</p>
                <p className="text-[11px] text-muted-foreground">All sensors online</p>
              </div>
            </div>
          </Panel>

          <Panel title="Charging / Operating Status" description="Current battery operating mode">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Operating Mode</p>
                  <p className="text-base font-semibold capitalize text-foreground">{snapshot.operatingMode}</p>
                </div>
                <StatusChip status={snapshot.operatingMode === "charging" ? "normal" : "info"} label={snapshot.operatingMode.toUpperCase()} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <InfoValue label="Charge" value={`${snapshot.charging.progress}%`} />
                <InfoValue label="Charge Current" value={`${snapshot.charging.current} A`} />
                <InfoValue label="Pack Voltage" value={`${snapshot.charging.voltage} V`} />
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-5">
        <ServiceCalendar />
        <ImportantNotifications />
      </div>
    </div>
  );
}
