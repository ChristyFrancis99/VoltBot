import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useBattery } from "@/lib/battery/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const searchTargets = [
  { label: "Battery EVB-001 overview", to: "/dashboard" as const },
  { label: "Live cell voltage monitoring", to: "/live-monitoring" as const },
  { label: "Battery health score", to: "/battery-health" as const },
  { label: "Cell imbalance fault", to: "/fault-detection" as const },
  { label: "Thermal anomaly fault", to: "/fault-detection" as const },
  { label: "Temperature trend", to: "/trends" as const },
  { label: "Alert history", to: "/alerts" as const },
  { label: "Service schedule", to: "/service" as const },
  { label: "ESP32 device status", to: "/technician" as const },
];

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());
}

export function TopHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const { snapshot, user } = useBattery();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = query
    ? searchTargets.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <header className="card-surface mb-5 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <div className="relative w-full max-w-[560px] min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search battery, alert, event..."
            className="h-10 rounded-xl border-transparent bg-muted pl-9"
            aria-label="Search battery, alert, or event"
          />
          {results.length > 0 && (
            <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              {results.slice(0, 6).map((r) => (
                <li key={r.label + r.to}>
                  <button
                    onClick={() => {
                      setQuery("");
                      navigate({ to: r.to });
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="hidden whitespace-nowrap text-xs text-muted-foreground lg:block">
            {formatCurrentDate()}
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
              >
                <Bell className="size-4" />
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 h-4.5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">
                  {snapshot.notifications.length}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              <p className="px-2 py-1.5 text-sm font-semibold">Notifications</p>
              <ul className="max-h-80 overflow-y-auto">
                {snapshot.notifications.map((n) => (
                  <li key={n.id} className="rounded-lg px-2 py-2 hover:bg-muted">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.timestamp}</p>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-foreground">
              CF
            </span>
            <span className="min-w-0">
              <span className="block max-w-[150px] truncate text-sm font-medium">
                {user?.name ?? "Christy Francis"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {user?.role ?? "Technician / Admin"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {!snapshot.device.cloudSynced && (
        <p className="mt-3 rounded-xl bg-critical-soft px-3 py-2 text-xs text-destructive">
          Cloud connection lost. Live telemetry is paused and the dashboard will resume when synchronization is restored.
        </p>
      )}
    </header>
  );
}
