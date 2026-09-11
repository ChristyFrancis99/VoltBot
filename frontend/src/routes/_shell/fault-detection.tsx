import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, Thermometer, Zap, BatteryCharging, AlertTriangle, ChevronRight, Info } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip } from "@/components/battery/ui";

export const Route = createFileRoute("/_shell/fault-detection")({
  component: FaultDetectionPage,
});

function FaultDetectionPage() {
  const { snapshot } = useBattery();
  const [selectedKey, setSelectedKey] = useState<string>("imbalance");
  const selectedFault = snapshot.faults.find((f) => f.key === selectedKey) ?? snapshot.faults[1];

  const getFaultIcon = (key: string) => {
    switch (key) {
      case "thermal": return Thermometer;
      case "imbalance": return ShieldAlert;
      case "voltage": return Zap;
      case "charging": return BatteryCharging;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Fault Detection & Diagnostics</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Prototype anomaly indicators and early-warning diagnostic comparisons
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.faults.map((fault) => {
          const Icon = getFaultIcon(fault.key);
          const isSelected = fault.key === selectedKey;

          return (
            <button
              key={fault.key}
              onClick={() => setSelectedKey(fault.key)}
              className={`card-surface flex flex-col justify-between p-4 text-left transition-all ${isSelected ? "ring-2 ring-primary border-transparent shadow-md" : "hover:shadow-sm hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground"><Icon className="size-4.5" /></span>
                <StatusChip status={fault.status} label={fault.status === "warning" ? "Detected" : undefined} />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground">{fault.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{fault.summary}</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary"><span>View Diagnostic Details</span><ChevronRight className="size-3.5" /></div>
            </button>
          );
        })}
      </div>

      {selectedFault && (
        <Panel
          title={`Fault Detail: ${selectedFault.name}`}
          description="Telemetry parameters compared with the configured prototype baseline"
          action={<StatusChip status={selectedFault.status} />}
        >
          <div className="space-y-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Summary</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{selectedFault.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {selectedFault.details.map((detail) => (
                <div key={detail.label} className="rounded-xl border border-border bg-card p-3.5">
                  <span className="text-xs text-muted-foreground">{detail.label}</span>
                  <p className="mt-1 text-base font-bold text-foreground">{detail.value}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-xl p-4 text-xs ${selectedFault.status === "warning" ? "bg-warning-soft text-warning-foreground" : selectedFault.status === "critical" ? "bg-critical-soft text-destructive" : "bg-primary-soft text-primary-soft-foreground"}`}>
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 size-4 shrink-0" />
                <div><p className="font-semibold">Diagnostic Recommendation</p><p className="mt-0.5 leading-relaxed">{selectedFault.note}</p></div>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
