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
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { MetricCard } from "@/components/battery/MetricCard";
import { ServiceCalendar, ImportantNotifications } from "@/components/battery/RightPanel";
import { Panel, StatusChip, HealthRing, InfoValue } from "@/components/battery/ui";
import batteryPackImg from "@/assets/battery-pack.png";

export const Route = createFileRoute("/_shell/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { snapshot, user } = useBattery();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main Content Area */}
      <div className="space-y-5">
        {/* Welcome Card */}
        <section className="card-surface relative overflow-hidden p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5 min-w-0 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-soft-foreground">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Live Monitoring System
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Welcome back, {user?.name.split(" ")[0] ?? "Christy"}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Your EV battery monitoring system is active.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 pt-1 text-xs">
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

            {/* Small EV Battery / Scooter Illustration */}
            <div className="relative z-10 flex shrink-0 items-center justify-center rounded-2xl bg-primary-soft/40 p-3 sm:p-4">
              <img
                src={batteryPackImg}
                alt="EV Battery Pack Illustration"
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* 6 Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            label="State of Charge"
            reading={snapshot.soc}
            statusLabel={`${snapshot.soc.value}%`}
            icon={Battery}
            hint="Current remaining energy capacity"
          />
          <MetricCard
            label="Battery Health"
            reading={snapshot.healthScore}
            statusLabel={`${snapshot.healthScore.value}/100`}
            icon={Gauge}
            hint="Overall calculated state of health"
          />
          <MetricCard
            label="Pack Voltage"
            reading={snapshot.packVoltage}
            statusLabel={`${snapshot.packVoltage.value} V`}
            icon={Zap}
            hint="Total battery pack voltage"
          />
          <MetricCard
            label="Current"
            reading={snapshot.current}
            statusLabel={`${snapshot.current.value} A`}
            icon={Activity}
            hint="Live net current flow"
          />
          <MetricCard
            label="Temperature"
            reading={snapshot.temperature}
            statusLabel={`${snapshot.temperature.value} °C`}
            icon={Thermometer}
            hint="Average pack temperature reading"
          />
          <MetricCard
            label="Cell Imbalance"
            reading={snapshot.cellImbalance}
            statusLabel={`${snapshot.cellImbalance.value} mV`}
            icon={ShieldAlert}
            hint="Max voltage delta between highest and lowest cells"
          />
        </div>

        {/* Battery Condition Card */}
        <Panel title="Battery Condition">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="flex flex-col items-center justify-center border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <HealthRing score={snapshot.healthScore.value ?? 72} size={110} />
              <div className="mt-3 text-center">
                <StatusChip status={snapshot.conditionStatus} label="WARNING" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoValue
                  label="Health Score"
                  value={`${snapshot.healthScore.value ?? 72} / 100`}
                />
                <InfoValue label="Risk Level" value={snapshot.riskLevel} />
                <InfoValue
                  label="Operating Mode"
                  value={
                    <span className="capitalize">{snapshot.operatingMode}</span>
                  }
                />
                <InfoValue
                  label="Anomaly Score"
                  value={snapshot.anomalyScore.toFixed(2)}
                  hint="0.0 = Baseline, 1.0 = High anomaly probability"
                />
              </div>

              <div className="rounded-xl bg-warning-soft p-3.5 text-xs text-warning-foreground">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Condition Description</p>
                    <p className="mt-0.5">{snapshot.conditionDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Current Analysis & Recommended Action */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Current Analysis */}
          <Panel title="Current Analysis" description="System parameter health status breakdown">
            <div className="divide-y divide-border">
              {snapshot.analysis.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.verdict}</span>
                    <StatusChip status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Recommended Action */}
          <Panel title="Recommended Action" description="AI diagnostic advisory">
            <div className="flex h-full flex-col justify-between space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Action Advisory</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      "{snapshot.recommendedAction}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Standard Operating Procedure:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Verify physical connections if cell imbalance exceeds 60 mV.</li>
                  <li>Schedule regular service checkup every 90 days.</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Right-side Service/Notification Panel */}
      <div className="space-y-5">
        <ServiceCalendar />
        <ImportantNotifications />
      </div>
    </div>
  );
}
