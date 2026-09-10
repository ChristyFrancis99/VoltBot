import { useState } from "react";
import { ChevronLeft, ChevronRight, Bell, Thermometer, BatteryFull, Zap, Wrench } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusDot } from "./ui";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Service dates highlighted on the calendar: [year, monthIndex, day] */
const SERVICE_DATES = [
  { y: 2026, m: 7, d: 18, kind: "past" as const },
  { y: 2026, m: 10, d: 18, kind: "next" as const },
];
const TODAY = { y: 2026, m: 8, d: 10 };

export function ServiceCalendar() {
  const { snapshot } = useBattery();
  const [month, setMonth] = useState(8); // September 2026
  const [year, setYear] = useState(2026);

  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const step = (delta: number) => {
    const next = month + delta;
    if (next < 0) {
      setMonth(11);
      setYear(year - 1);
    } else if (next > 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(next);
  };

  return (
    <Panel title="Battery Service">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          aria-label="Previous month"
          className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-sm font-medium">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => step(1)}
          aria-label="Next month"
          className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-muted-foreground">
        {DAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-xs">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const service = SERVICE_DATES.find((s) => s.y === year && s.m === month && s.d === day);
          const isToday = TODAY.y === year && TODAY.m === month && TODAY.d === day;
          return (
            <span key={day} className="flex justify-center">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full",
                  service?.kind === "next" && "bg-primary font-medium text-primary-foreground",
                  service?.kind === "past" && "bg-primary-soft text-primary-soft-foreground",
                  isToday && !service && "border border-primary font-medium text-primary",
                )}
              >
                {day}
              </span>
            </span>
          );
        })}
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Last Serviced</dt>
          <dd className="font-medium">{snapshot.service.lastServiced}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Next Recommended</dt>
          <dd className="font-medium">{snapshot.service.nextService}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Service Status</dt>
          <dd className="inline-flex items-center gap-1.5 font-medium text-success">
            <StatusDot status="normal" />
            {snapshot.service.daysRemaining} days remaining
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

const notificationIcons = {
  bell: Bell,
  thermometer: Thermometer,
  battery: BatteryFull,
  bolt: Zap,
  wrench: Wrench,
};

export function ImportantNotifications() {
  const { snapshot } = useBattery();
  return (
    <Panel
      title="Important Notifications"
      action={
        <Link to="/alerts" className="text-xs font-medium text-primary hover:underline">
          View All
        </Link>
      }
    >
      <ul className="space-y-3">
        {snapshot.notifications.map((n) => {
          const Icon = notificationIcons[n.icon];
          return (
            <li key={n.id} className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{n.timestamp}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
