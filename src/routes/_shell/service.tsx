import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Calendar as CalendarIcon, Clock, CheckCircle2, FileText, UserCheck } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip, StatusDot } from "@/components/battery/ui";
import { ServiceCalendar } from "@/components/battery/RightPanel";

export const Route = createFileRoute("/_shell/service")({
  component: ServicePage,
});

function ServicePage() {
  const { snapshot } = useBattery();
  const service = snapshot.service;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Service & Maintenance Schedule</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Preventative battery service schedule, inspection logs, and cycle counters
        </p>
      </div>

      {/* Main Grid: Calendar on Left/Top + Service Overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Reused Calendar Component */}
        <div className="lg:col-span-1">
          <ServiceCalendar />
        </div>

        {/* Battery Info & Service Status */}
        <div className="space-y-5 lg:col-span-2">
          {/* Key Service Metrics */}
          <Panel title="Battery Service Summary" description={`Battery Pack ${service.batteryId}`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <span className="text-xs text-muted-foreground">Last Serviced</span>
                <p className="mt-1 text-sm font-bold text-foreground">{service.lastServiced}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <span className="text-xs text-muted-foreground">Next Recommended</span>
                <p className="mt-1 text-sm font-bold text-primary">{service.nextService}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <span className="text-xs text-muted-foreground">Service Status</span>
                <p className="mt-1 text-sm font-bold text-success flex items-center gap-1.5">
                  <StatusDot status="normal" /> {service.daysRemaining} days left
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <span className="text-xs text-muted-foreground">Installation Date</span>
                <p className="mt-1 text-sm font-bold text-foreground">{service.installationDate}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Monitoring Cycles</span>
                  <p className="text-2xl font-extrabold text-foreground">{service.monitoringCycles}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Clock className="size-5" />
                </span>
              </div>
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Charging Cycles</span>
                  <p className="text-2xl font-extrabold text-foreground">{service.chargingCycles}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Wrench className="size-5" />
                </span>
              </div>
            </div>
          </Panel>

          {/* Service History Table */}
          <Panel title="Service & Maintenance History" description="Certified technician inspection log">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Service Type</th>
                    <th className="pb-2.5 font-medium">Technician</th>
                    <th className="pb-2.5 font-medium">Inspection Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {service.history.map((h, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="py-3 font-mono font-medium text-foreground whitespace-nowrap">{h.date}</td>
                      <td className="py-3 font-semibold text-foreground whitespace-nowrap">{h.type}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{h.technician}</td>
                      <td className="py-3 text-muted-foreground">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
