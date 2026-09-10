import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, AlertTriangle, AlertCircle, CheckCircle2, Info, Filter } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip } from "@/components/battery/ui";
import type { AlertRecord } from "@/lib/battery/types";

export const Route = createFileRoute("/_shell/alerts")({
  component: AlertsPage,
});

type FilterCategory = "all" | "critical" | "warning" | "resolved";

function AlertsPage() {
  const { snapshot } = useBattery();
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filteredAlerts = snapshot.alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const getSeverityBadge = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "critical":
        return <StatusChip status="critical" label="Critical" />;
      case "warning":
        return <StatusChip status="warning" label="Warning" />;
      case "monitor":
        return <StatusChip status="monitor" label="Monitor" />;
      case "resolved":
        return <StatusChip status="normal" label="Resolved" />;
      case "information":
      default:
        return <StatusChip status="info" label="Information" />;
    }
  };

  const getSeverityIcon = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="size-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="size-4 text-warning" />;
      case "resolved":
        return <CheckCircle2 className="size-4 text-success" />;
      case "information":
      default:
        return <Info className="size-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Alert History & Logs</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            System notification log and anomaly alert history
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted p-1 text-xs">
          <span className="px-2 text-muted-foreground font-medium flex items-center gap-1">
            <Filter className="size-3" /> Filter:
          </span>
          {(["all", "critical", "warning", "resolved"] as FilterCategory[]).map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <Panel title={`Alert Records (${filteredAlerts.length})`}>
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No alerts found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
                    {getSeverityIcon(alert.severity)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {alert.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
