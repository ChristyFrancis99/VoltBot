import { createFileRoute } from "@tanstack/react-router";
import { Gauge, ShieldAlert, Thermometer, Zap, Activity, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, HealthRing, StatusChip, InfoValue } from "@/components/battery/ui";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_shell/battery-health")({
  component: BatteryHealthPage,
});

function BatteryHealthPage() {
  const { snapshot } = useBattery();
  const profile = snapshot.behaviourProfile;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Battery Health Analysis</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Machine learning health degradation modeling & learned behaviour profile comparison
        </p>
      </div>

      {/* Main Health Overview Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Overall Health Score Card */}
        <Panel className="flex flex-col items-center justify-center p-6 text-center lg:col-span-1">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Battery Health Score</h2>
          <HealthRing score={snapshot.healthScore.value ?? 72} size={140} />
          
          <div className="mt-5 space-y-1.5">
            <StatusChip status="warning" label="72 / 100 — Warning" />
            <p className="text-xs text-muted-foreground px-4">
              State of Health (SOH) calculated from cell degradation, operating temperatures, and charge cycles.
            </p>
          </div>
        </Panel>

        {/* Health Breakdown */}
        <Panel title="Health Metric Breakdown" description="Sub-system degradation weighting breakdown" className="lg:col-span-2">
          <div className="space-y-4">
            {snapshot.healthBreakdown.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2.5" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Battery Behaviour Profile & Current Behaviour Comparison */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Battery Behaviour Profile */}
        <Panel title="Battery Behaviour Profile" description="Learned historical baseline metrics (ML trained)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="text-xs text-muted-foreground">Normal Temperature</span>
              <p className="mt-1 text-base font-bold text-foreground">{profile.temperatureRange}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="text-xs text-muted-foreground">Normal Cell Difference</span>
              <p className="mt-1 text-base font-bold text-foreground">{profile.cellDifferenceRange}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="text-xs text-muted-foreground">Average Charging Time</span>
              <p className="mt-1 text-base font-bold text-foreground">{profile.averageChargingHours} hours</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5">
              <span className="text-xs text-muted-foreground">Normal Voltage Range</span>
              <p className="mt-1 text-base font-bold text-foreground">{profile.voltageRange}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Typical Operating Current</span>
              <p className="mt-1 text-base font-bold text-foreground">{profile.typicalCurrent}</p>
            </div>
          </div>
        </Panel>

        {/* Current Behaviour Comparison */}
        <Panel title="Current Behaviour Status" description="Real-time variance vs learned profile baseline">
          <div className="divide-y divide-border">
            {snapshot.currentBehaviour.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground font-medium">{item.verdict}</span>
                  <StatusChip status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
