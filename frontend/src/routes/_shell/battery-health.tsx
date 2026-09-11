import { createFileRoute } from "@tanstack/react-router";
import { useBattery } from "@/lib/battery/store";
import { Panel, HealthRing, StatusChip } from "@/components/battery/ui";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_shell/battery-health")({
  component: BatteryHealthPage,
});

function BatteryHealthPage() {
  const { snapshot } = useBattery();
  const profile = snapshot.behaviourProfile;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Battery Health Analysis</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Battery health score and configured behaviour-profile comparison
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="flex flex-col items-center justify-center p-6 text-center lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Battery Health Score</h2>
          <HealthRing score={snapshot.healthScore.value ?? 0} size={140} />
          <div className="mt-5 space-y-1.5">
            <StatusChip
              status={snapshot.healthScore.status}
              label={`${snapshot.healthScore.value ?? "--"} / 100 — ${snapshot.healthScore.status}`}
            />
            <p className="px-4 text-xs text-muted-foreground">
              Prototype health indicator based on the configured monitoring profile. It is not a certified State of Health measurement.
            </p>
          </div>
        </Panel>

        <Panel title="Health Metric Breakdown" description="Configured prototype health indicators" className="lg:col-span-2">
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Battery Behaviour Profile" description="Configured baseline values used by the prototype">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3.5"><span className="text-xs text-muted-foreground">Normal Temperature</span><p className="mt-1 text-base font-bold text-foreground">{profile.temperatureRange}</p></div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5"><span className="text-xs text-muted-foreground">Normal Cell Difference</span><p className="mt-1 text-base font-bold text-foreground">{profile.cellDifferenceRange}</p></div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5"><span className="text-xs text-muted-foreground">Average Charging Time</span><p className="mt-1 text-base font-bold text-foreground">{profile.averageChargingHours} hours</p></div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5"><span className="text-xs text-muted-foreground">Normal Voltage Range</span><p className="mt-1 text-base font-bold text-foreground">{profile.voltageRange}</p></div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 sm:col-span-2"><span className="text-xs text-muted-foreground">Typical Operating Current</span><p className="mt-1 text-base font-bold text-foreground">{profile.typicalCurrent}</p></div>
          </div>
        </Panel>

        <Panel title="Current Behaviour Status" description="Current values compared with the configured baseline">
          <div className="divide-y divide-border">
            {snapshot.currentBehaviour.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 text-xs">
                <span className="font-semibold text-foreground">{item.label}</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-medium text-muted-foreground">{item.verdict}</span>
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
