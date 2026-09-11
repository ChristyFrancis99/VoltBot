import { Activity, AlertTriangle, Bell, CheckCircle2, Wrench } from "lucide-react";
import type { BatterySnapshot } from "@/lib/battery/types";

const icons = { signal: Activity, cells: AlertTriangle, thermometer: AlertTriangle, bolt: CheckCircle2, play: Activity, bell: Bell, wrench: Wrench } as const;

type EventIcon = keyof typeof icons;

export function BatteryTimeline({ snapshot }: { snapshot: BatterySnapshot }) {
  const items = [
    ...snapshot.events.slice(0, 4).map((event) => ({ time: event.time, label: event.label, icon: event.icon as EventIcon })),
    { time: snapshot.alerts[0]?.timestamp ?? "Recent", label: snapshot.alerts[0]?.title ?? "No recent alert", icon: "bell" as const },
  ];

  return (
    <div className="relative ml-1 space-y-0">
      {items.map((item, index) => {
        const Icon = icons[item.icon] ?? Activity;
        return (
          <div key={`${item.time}-${item.label}`} className="relative flex gap-3 pb-4 last:pb-0">
            {index < items.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-8px)] w-px bg-border" />}
            <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-primary"><Icon className="size-3" /></span>
            <div className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-semibold text-foreground">{item.label}</p><span className="shrink-0 font-mono text-[10px] text-muted-foreground">{item.time}</span></div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Monitoring event</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
