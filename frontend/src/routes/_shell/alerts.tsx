import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Filter, Info, Search } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip } from "@/components/battery/ui";
import type { AlertRecord } from "@/lib/battery/types";

export const Route = createFileRoute("/_shell/alerts")({ component: AlertsPage });

type FilterCategory = "all" | "critical" | "warning" | "monitor" | "information" | "resolved";

function AlertsPage() {
  const { snapshot } = useBattery();
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [query, setQuery] = useState("");

  const filteredAlerts = useMemo(() => snapshot.alerts.filter((alert) => {
    const matchesFilter = filter === "all" || alert.severity === filter;
    const haystack = `${alert.title} ${alert.description} ${alert.timestamp}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  }), [filter, query, snapshot.alerts]);

  const getSeverityBadge = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "critical": return <StatusChip status="critical" label="Critical" />;
      case "warning": return <StatusChip status="warning" label="Warning" />;
      case "monitor": return <StatusChip status="monitor" label="Monitor" />;
      case "resolved": return <StatusChip status="normal" label="Resolved" />;
      default: return <StatusChip status="info" label="Information" />;
    }
  };

  const getSeverityIcon = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "critical": return <AlertCircle className="size-4 text-destructive" />;
      case "warning": return <AlertTriangle className="size-4 text-warning" />;
      case "resolved": return <CheckCircle2 className="size-4 text-success" />;
      default: return <Info className="size-4 text-primary" />;
    }
  };

  const filters: FilterCategory[] = ["all", "critical", "warning", "monitor", "information", "resolved"];

  return (
    <div className="space-y-5">
      <div className="card-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary"><Filter className="size-4" /></span><h1 className="text-xl font-bold tracking-tight text-foreground">Alert History & Logs</h1></div>
            <p className="mt-1 text-xs text-muted-foreground">System notification log and prototype anomaly alert history</p>
          </div>
          <div className="relative w-full lg:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts..." className="h-10 w-full rounded-xl border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" aria-label="Search alerts" /></div>
        </div>
        <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-xl bg-muted p-1 text-xs">
          {filters.map((category) => <button key={category} onClick={() => setFilter(category)} className={`shrink-0 rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${filter === category ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{category}</button>)}
        </div>
      </div>

      <Panel title={`Alert Records (${filteredAlerts.length})`} description="Use severity filters and search to isolate events quickly">
        {filteredAlerts.length === 0 ? <div className="py-12 text-center"><p className="text-sm font-medium text-foreground">No matching alerts</p><p className="mt-1 text-xs text-muted-foreground">Try another severity filter or search term.</p></div> : <div className="divide-y divide-border">
          {filteredAlerts.map((alert) => <div key={alert.id} className="group flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted">{getSeverityIcon(alert.severity)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>{getSeverityBadge(alert.severity)}</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.description}</p></div></div>
            <span className="shrink-0 text-left font-mono text-[11px] text-muted-foreground sm:text-right">{alert.timestamp}</span>
          </div>)}
        </div>}
      </Panel>
    </div>
  );
}
