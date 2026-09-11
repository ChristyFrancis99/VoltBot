import { Bell, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useBattery } from "@/lib/battery/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "long" }).format(new Date());
}

export function TopHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const { snapshot } = useBattery();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => query ? searchTargets.filter((target) => target.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [], [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuery("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const connectionState = snapshot.device.esp32Online && snapshot.device.cloudSynced;

  return (
    <header className="card-surface mb-5 p-3.5 sm:p-4">
      <div className="flex items-center gap-3">
        <button onClick={onOpenNav} aria-label="Open navigation" className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted lg:hidden"><Menu className="size-4" /></button>

        <div className="relative min-w-0 flex-1 max-w-[560px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search battery, alert, event..." className="h-10 rounded-xl border-transparent bg-muted pl-9 pr-9" aria-label="Search battery, alert, or event" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"><X className="size-3.5" /></button>}
          {query && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {results.length > 0 ? <ul>{results.map((result) => <li key={result.label + result.to}><button type="button" onClick={() => { setQuery(""); navigate({ to: result.to }); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted">{result.label}</button></li>)}</ul> : <p className="px-4 py-3 text-xs text-muted-foreground">No matching pages or events found.</p>}
          </div>}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold sm:flex ${connectionState ? "bg-primary-soft text-primary-soft-foreground" : "bg-critical-soft text-destructive"}`}><span className={`size-1.5 rounded-full ${connectionState ? "animate-pulse bg-primary" : "bg-destructive"}`} />{connectionState ? "ESP32 + Cloud Online" : "Connection Limited"}</div>
          <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:block">{formatCurrentDate()}</span>

          <Popover>
            <PopoverTrigger asChild><button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"><Bell className="size-4" /><span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 h-4.5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground">{snapshot.notifications.length}</span></button></PopoverTrigger>
            <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-2">
              <div className="flex items-center justify-between px-2 py-1.5"><p className="text-sm font-semibold">Notifications</p><span className="text-[10px] text-muted-foreground">{snapshot.notifications.length} recent</span></div>
              <ul className="max-h-80 overflow-y-auto">{snapshot.notifications.map((notification) => <li key={notification.id} className="rounded-lg px-2 py-2.5 hover:bg-muted"><p className="text-sm font-medium">{notification.title}</p><p className="text-xs leading-relaxed text-muted-foreground">{notification.description}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{notification.timestamp}</p></li>)}</ul>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!snapshot.device.cloudSynced && <p className="mt-3 rounded-xl bg-critical-soft px-3 py-2 text-xs text-destructive">Cloud connection lost. Live telemetry is paused and the dashboard will resume when synchronization is restored.</p>}
    </header>
  );
}
