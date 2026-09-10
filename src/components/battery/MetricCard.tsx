import { cn } from "@/lib/utils";
import type { SensorReading } from "@/lib/battery/types";
import { StatusChip, SensorUnavailable } from "./ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  reading,
  statusLabel,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  reading: SensorReading;
  statusLabel?: string | undefined;
  icon: LucideIcon;
  hint?: string | undefined;
  className?: string | undefined;
}) {
  const card = (
    <div
      className={cn(
        "card-surface flex flex-col gap-3 p-4 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground">
          <Icon className="size-3.5" />
        </span>
      </div>
      {reading.available ? (
        <>
          <p className="text-2xl font-semibold leading-none">
            {reading.value}
            <span className="ml-1 text-sm font-medium text-muted-foreground">{reading.unit}</span>
          </p>
          <StatusChip
            status={reading.status}
            label={statusLabel ?? undefined}
            className="self-start"
          />
        </>
      ) : (
        <>
          <p className="text-2xl font-semibold leading-none text-muted-foreground">
            --<span className="ml-1 text-sm font-medium">{reading.unit}</span>
          </p>
          <SensorUnavailable
            lastKnown={reading.lastKnown}
            lastKnownAt={reading.lastKnownAt}
            unit={reading.unit}
          />
        </>
      )}
    </div>
  );

  if (!hint) return card;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{card}</div>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
