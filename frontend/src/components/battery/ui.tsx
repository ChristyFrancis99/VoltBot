import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/battery/types";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const statusText: Record<StatusLevel, string> = {
  normal: "Normal",
  monitor: "Monitor",
  warning: "Warning",
  critical: "Critical",
  info: "Information",
};

const dotClass: Record<StatusLevel, string> = {
  normal: "bg-success",
  monitor: "bg-warning",
  warning: "bg-warning",
  critical: "bg-destructive",
  info: "bg-primary",
};

const chipClass: Record<StatusLevel, string> = {
  normal: "bg-success-soft text-success",
  monitor: "bg-warning-soft text-warning-foreground",
  warning: "bg-warning-soft text-warning-foreground",
  critical: "bg-critical-soft text-destructive",
  info: "bg-primary-soft text-primary-soft-foreground",
};

export function StatusDot({ status, className }: { status: StatusLevel; className?: string }) {
  return <span className={cn("inline-block size-2 rounded-full", dotClass[status], className)} />;
}

export function StatusChip({
  status,
  label,
  className,
}: {
  status: StatusLevel;
  label?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        chipClass[status],
        className,
      )}
    >
      <StatusDot status={status} />
      {label ?? statusText[status]}
    </span>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  description,
}: {
  title?: string | undefined;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("card-surface p-5", className)}>
      {(title || action) && (
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function InfoValue({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
}) {
  const body = (
    <div className="rounded-xl bg-muted/70 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
  if (!hint) return body;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{body}</div>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={8}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function SensorUnavailable({
  lastKnown,
  lastKnownAt,
  unit,
}: {
  lastKnown?: number | undefined;
  lastKnownAt?: string | undefined;
  unit?: string | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
        <StatusDot status="critical" /> Sensor unavailable
      </p>
      {lastKnown !== undefined && (
        <p className="text-xs text-muted-foreground">
          Last reading: {lastKnown} {unit} · {lastKnownAt}
        </p>
      )}
    </div>
  );
}
