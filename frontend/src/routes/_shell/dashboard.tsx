import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Battery,
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Gauge,
  Info,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BatteryTimeline } from "@/components/battery/BatteryTimeline";
import { MetricCard } from "@/components/battery/MetricCard";
import { ImportantNotifications } from "@/components/battery/RightPanel";
import { Button } from "@/components/ui/button";
import { HealthRing, InfoValue, Panel, StatusChip } from "@/components/battery/ui";
import { getBatteryHistory, postDemoScenario } from "@/lib/battery/api";
import type { DemoScenario } from "@/lib/battery/api";
import { useBattery } from "@/lib/battery/store";
import type { StatusLevel } from "@/lib/battery/types";
import mechbot from "@/assets/mech-bot.png";

export const Route = createFileRoute("/_shell/dashboard")({ component: DashboardPage });

const SCENARIO_DESCRIPTIONS = [
  {
    scenario: "healthy" as DemoScenario,
    name: "Normal Riding",
    tag: "🟢 Baseline",
    badge: "HEALTHY",
    description: "Demonstrates balanced 48V operation at normal 30°C temperature under typical riding conditions.",
  },
  {
    scenario: "overheating" as DemoScenario,
    name: "Overheating Test",
    tag: "🟠 High Temperature",
    badge: "HEAT WARNING",
    description: "Simulates pack heat rising past 50°C to demonstrate thermal warnings and cooling recommendations.",
  },
  {
    scenario: "cell_imbalance" as DemoScenario,
    name: "Cell Imbalance Test",
    tag: "🔴 Cell Divergence",
    badge: "IMBALANCE",
    description: "Simulates one cell dropping faster than others to demonstrate early divergence detection.",
  },
  {
    scenario: "degradation" as DemoScenario,
    name: "Battery Degradation",
    tag: "🟡 Capacity Aging",
    badge: "DEGRADED",
    description: "Simulates voltage sagging under load as internal resistance increases with battery aging.",
  },
] as const;

type HistoryPoint = {
  time: string;
  timestamp: string;
  voltage: number;
  temperature: number;
  current: number;
};

function HistoryChart({
  data,
  dataKey,
  label,
  unit,
  color,
}: {
  data: HistoryPoint[];
  dataKey: "voltage" | "temperature" | "current";
  label: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="h-48 min-w-0 rounded-xl border border-border bg-background/70 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {data.length < 2 ? (
        <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
          {data.length === 0 ? "No backend history available" : "Waiting for another reading"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              width={42}
              tick={{ fontSize: 9 }}
              stroke="hsl(var(--muted-foreground))"
              domain={["auto", "auto"]}
              unit={unit}
            />
            <Tooltip
              labelFormatter={(_, payload) => {
                const timestamp = payload?.[0]?.payload?.timestamp;
                return timestamp ? new Date(timestamp).toLocaleString() : "";
              }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={label}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function statusName(status: StatusLevel | undefined) {
  if (!status || status === "info") return "Unavailable";
  return status.toUpperCase();
}

function healthStatusLevel(status: string | null): StatusLevel {
  switch (status) {
    case "HEALTHY":
      return "normal";
    case "WATCH":
      return "monitor";
    case "DEGRADED":
      return "warning";
    case "CRITICAL":
      return "critical";
    default:
      return "info";
  }
}

function DashboardPage() {
  const {
    snapshot,
    user,
    liveTelemetry,
    liveTelemetryLoading,
    liveTelemetryError,
    liveTelemetryConnected,
    refreshLiveTelemetry,
  } = useBattery();
  const firstName = user?.name.split(" ")[0] ?? "Christy";
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [pendingScenario, setPendingScenario] = useState<DemoScenario | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [demoMessage, setDemoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const latestReadingId = liveTelemetry?.readingId ?? null;
  const scenarioInFlight = useRef(false);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const readings = await getBatteryHistory(24);
        if (!active) return;

        const deviceReadings = liveTelemetry
          ? readings.filter(
              (reading) =>
                reading.device_id === liveTelemetry.deviceId &&
                (!liveTelemetry.demoSessionId ||
                  reading.demo_session_id === liveTelemetry.demoSessionId),
            )
          : readings;
        setHistory(
          [...deviceReadings].reverse().map((reading) => {
            const parsedTimestamp = new Date(reading.timestamp);
            return {
              time: Number.isNaN(parsedTimestamp.getTime())
                ? reading.timestamp
                : parsedTimestamp.toLocaleTimeString(),
              timestamp: reading.timestamp,
              voltage: reading.voltage,
              temperature: reading.temperature,
              current: reading.current,
            };
          }),
        );
        setHistoryError(null);
      } catch (error) {
        if (!active) return;
        setHistoryError(error instanceof Error ? error.message : "Unable to load backend history");
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      active = false;
    };
  }, [latestReadingId, liveTelemetry?.deviceId]);

  const lastUpdate = useMemo(() => {
    if (!liveTelemetry) return null;
    const date = new Date(liveTelemetry.timestamp);
    return Number.isNaN(date.getTime()) ? liveTelemetry.timestamp : date.toLocaleTimeString();
  }, [liveTelemetry]);

  const liveStatus = liveTelemetry?.overallStatus ?? "info";

  useEffect(() => {
    if (!selectedScenario) return;
    let active = true;

    const advanceScenario = async () => {
      if (scenarioInFlight.current) return;
      scenarioInFlight.current = true;
      try {
        await postDemoScenario(selectedScenario, true);
        if (!active) return;
        await refreshLiveTelemetry();
        if (active) {
          setDemoMessage({
            type: "success",
            text: `${selectedScenario.replaceAll("_", " ")} pattern advancing in real time.`,
          });
        }
      } catch (error) {
        if (active) {
          setDemoMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Unable to advance the scenario.",
          });
        }
      } finally {
        scenarioInFlight.current = false;
      }
    };

    const interval = window.setInterval(() => void advanceScenario(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [selectedScenario, refreshLiveTelemetry, scenarioInFlight]);

  const runDemoScenario = async (scenario: DemoScenario) => {
    setPendingScenario(scenario);
    setDemoMessage(null);

    try {
      await postDemoScenario(scenario);
      await refreshLiveTelemetry();
      setSelectedScenario(scenario);
      setHistoryError(null);
      setDemoMessage({
        type: "success",
        text: `Switched simulation to: ${scenario === "healthy" ? "Normal Riding" : scenario.replaceAll("_", " ")}.`,
      });
    } catch (error) {
      setDemoMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to activate demo scenario.",
      });
    } finally {
      setPendingScenario(null);
    }
  };

  // Determine Simple High-Level Status
  const isCritical =
    liveTelemetry?.overallStatus === "critical" ||
    liveTelemetry?.health.status === "CRITICAL";

  const isWarning =
    !isCritical &&
    (liveTelemetry?.overallStatus === "warning" ||
      liveTelemetry?.health.status === "WATCH" ||
      liveTelemetry?.health.status === "DEGRADED" ||
      (liveTelemetry?.alerts && liveTelemetry.alerts.length > 0));

  const primaryHeadline = isCritical
    ? "Critical warning"
    : isWarning
      ? "Attention needed"
      : "Battery looks healthy";

  const primaryExplanation = isCritical
    ? "Multiple operating limits have been exceeded. The vehicle should be inspected before continued riding."
    : isWarning
      ? liveTelemetry?.alerts?.[0]
        ? `${liveTelemetry.alerts[0]}. Review the guidance below.`
        : "One or more battery indicators are operating outside the ideal comfort zone."
      : "Operating temperature, voltage levels, and individual cells are all balanced and running smoothly.";

  // Null-safe values for display
  const currentTemp = liveTelemetry?.temperature.value ?? 30;
  const currentVolts = liveTelemetry?.packVoltage.value ?? 48;
  const currentAmps = liveTelemetry?.current.value ?? 0;

  // Plain English Fault Explanations
  const getFaultDetails = () => {
    if (isCritical) {
      return {
        detected: "Severe operating condition: multiple threshold warnings triggered simultaneously.",
        why: "Running a battery in this state risks accelerated permanent degradation and safety cutoff.",
        action: "Stop riding, power off the vehicle, and do not charge until a technician checks the pack.",
      };
    }

    if (liveTelemetry?.alerts.some((a) => a.toLowerCase().includes("temperature"))) {
      return {
        detected: `High pack temperature: core sensor reached ${currentTemp.toFixed(1)}°C (recommended safe ceiling is 45°C).`,
        why: "Excess heat strains battery chemistry, accelerates cell aging, and can cause the controller to throttle power.",
        action: "Park the vehicle in a shaded or ventilated area. Let it cool down before heavy riding or fast charging.",
      };
    }

    if (liveTelemetry?.alerts.some((a) => a.toLowerCase().includes("imbalance") || a.toLowerCase().includes("cell"))) {
      return {
        detected: `Cell imbalance detected: one cell is diverging by ${(liveTelemetry.cellImbalance.value ?? 0).toFixed(0)} mV from the pack average.`,
        why: "When cells are uneven, the weakest cell drains first, limiting your total usable distance and placing stress on healthy cells.",
        action: "Connect the vehicle to a standard AC charger and allow it to complete a full balancing charge cycle overnight.",
      };
    }

    if (liveTelemetry?.alerts.some((a) => a.toLowerCase().includes("voltage"))) {
      return {
        detected: `Voltage sag: pack voltage dropped to ${currentVolts.toFixed(1)} V under operating load.`,
        why: "Voltage sag indicates the battery is either heavily discharged or internal cell resistance has increased.",
        action: "Recharge the battery soon and avoid sudden full-throttle acceleration until charged.",
      };
    }

    return null;
  };

  const faultExplanation = getFaultDetails();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* 1. OVERVIEW AS HOME SCREEN: PROMINENT STATUS */}
      <section
        className={`card-surface relative overflow-hidden rounded-2xl border p-6 transition-all ${
          isCritical
            ? "border-destructive/40 bg-critical-soft/30"
            : isWarning
              ? "border-warning/40 bg-warning-soft/30"
              : "border-success/30 bg-success-soft/20"
        }`}
      >
        <div className="relative z-10 flex min-h-[140px] items-center pr-[28%] sm:pr-[24%]">
          <div className="min-w-0 space-y-3">
            {/* Simulation & Data Status Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                role="status"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isCritical
                    ? "bg-destructive text-destructive-foreground"
                    : isWarning
                      ? "bg-warning text-warning-foreground"
                      : "bg-success text-success-foreground"
                }`}
              >
                {isCritical ? (
                  <AlertCircle className="size-3.5" />
                ) : isWarning ? (
                  <AlertTriangle className="size-3.5" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                {primaryHeadline.toUpperCase()}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                SIMULATED DATA · BACKEND STREAM
              </span>

              {liveTelemetry?.deviceId === "ESP32_WOKWI_01" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Wifi className="size-3" />
                  SOURCE: WOKWI ESP32
                </span>
              ) : liveTelemetry?.deviceId === "ESP32_BATTERY_01" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  <Activity className="size-3" />
                  SOURCE: PYTHON SIMULATOR
                </span>
              ) : liveTelemetry?.deviceId === "ESP32_BATTERY_DEMO_01" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                  <Sparkles className="size-3" />
                  SOURCE: IN-APP DEMO
                </span>
              ) : null}

              <span className="text-[11px] text-muted-foreground">
                Updated: {lastUpdate ?? "Just now"}
              </span>
            </div>

            {/* Prominent Headline */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {primaryHeadline}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {primaryExplanation}
              </p>
            </div>

            {liveTelemetryError && (
              <p role="alert" className="text-xs text-destructive">
                {liveTelemetryError} Showing last known reading.
              </p>
            )}

            {/* Educational Disclaimer */}
            <p className="text-[11px] text-muted-foreground">
              <Info className="mr-1 inline size-3 text-muted-foreground" />
              Student prototype advisory: VoltBot evaluates simulated telemetry against rule-based
              thresholds. It does not replace hardware BMS cutoffs or guarantee fault prevention.
            </p>
          </div>
        </div>

        {/* Friendly Robot Graphic */}
        <div className="pointer-events-none absolute inset-y-0 right-2 flex w-[26%] items-end justify-center sm:right-4 sm:w-[22%]">
          <img
            src={mechbot}
            alt="VoltBot battery assistant"
            className="h-[92%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_8px_12px_rgba(49,43,79,0.12)]"
          />
        </div>
      </section>

      {/* 2. THREE SIMPLE BATTERY INDICATORS */}
      <section>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-foreground">Current Battery State</h2>
          <span className="text-xs text-muted-foreground">3 key indicators at a glance</span>
        </div>

        {liveTelemetry ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Indicator 1: Overall Condition */}
            <div className="card-surface flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Battery Condition</span>
                <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
                  <ShieldAlert className="size-4" />
                </span>
              </div>
              <div className="my-3">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {isCritical ? "Critical" : isWarning ? "Attention Needed" : "Good Condition"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Score: <strong className="text-foreground">{liveTelemetry.health.score ?? 100}/100</strong> (Heuristic behavior index)
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    isCritical ? "bg-destructive" : isWarning ? "bg-warning" : "bg-success"
                  }`}
                  style={{ width: `${liveTelemetry.health.score ?? 100}%` }}
                />
              </div>
            </div>

            {/* Indicator 2: Operating Temperature */}
            <div className="card-surface flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Operating Heat</span>
                <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Thermometer className="size-4" />
                </span>
              </div>
              <div className="my-3">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {currentTemp.toFixed(1)}°C
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {currentTemp > 50
                      ? "⚠️ Running Hot"
                      : currentTemp > 40
                        ? "Warm"
                        : "Comfortable"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recommended safe range: 25°C to 45°C
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    currentTemp > 50
                      ? "bg-destructive"
                      : currentTemp > 40
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(10, ((currentTemp - 20) / 45) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Indicator 3: Vehicle Activity */}
            <div className="card-surface flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Vehicle Activity</span>
                <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Activity className="size-4" />
                </span>
              </div>
              <div className="my-3">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {liveTelemetry.health.operatingState === "DISCHARGING"
                    ? "In Use (Riding)"
                    : liveTelemetry.health.operatingState === "CHARGING"
                      ? "Charging (Plugged In)"
                      : "Parked (Idle)"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current flow: {currentAmps.toFixed(1)} A
                  {currentAmps > 0 ? " power draw" : " charging rate"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pack voltage: {currentVolts.toFixed(1)} V (48V nominal)
              </p>
            </div>
          </div>
        ) : (
          <div className="card-surface rounded-xl border p-5 text-sm text-muted-foreground">
            {liveTelemetryLoading
              ? "Connecting to backend telemetry stream…"
              : "Backend disconnected. Please start the backend service."}
          </div>
        )}
      </section>

      {/* 3. SIMPLE FAULT EXPLANATION BOX */}
      <section>
        <div
          className={`rounded-2xl border p-5 transition-all ${
            faultExplanation
              ? "border-warning/40 bg-warning-soft/40 text-foreground"
              : "border-success/30 bg-success-soft/30 text-foreground"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
                faultExplanation ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"
              }`}
            >
              {faultExplanation ? (
                <AlertTriangle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </span>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">
                  {faultExplanation
                    ? "Simple Anomaly Explanation"
                    : "All Systems Running Normally"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {faultExplanation
                    ? "Plain-English diagnosis of the active warning"
                    : "No thermal, voltage, or cell divergence faults detected"}
                </p>
              </div>

              {faultExplanation ? (
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  <div className="rounded-xl border border-warning/30 bg-background/80 p-3">
                    <p className="font-semibold text-foreground">1. What Was Detected?</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {faultExplanation.detected}
                    </p>
                  </div>
                  <div className="rounded-xl border border-warning/30 bg-background/80 p-3">
                    <p className="font-semibold text-foreground">2. Why It Matters?</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {faultExplanation.why}
                    </p>
                  </div>
                  <div className="rounded-xl border border-warning/30 bg-background/80 p-3">
                    <p className="font-semibold text-foreground">3. What You Should Do?</p>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {faultExplanation.action}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The battery pack is operating in its optimal efficiency band. Cell balance is tight
                  and temperatures are cool. No special action is required.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRY A SIMULATION: 4 CLEAR OPTIONS */}
      <section className="card-surface rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                <Play className="size-3.5 fill-primary" />
              </span>
              <h2 className="text-base font-bold text-foreground">Try a Simulation</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select any condition below to see how the assistant detects and explains battery events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedScenario && selectedScenario !== "healthy" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void runDemoScenario("healthy")}
                className="gap-1.5 text-xs text-success hover:bg-success/10"
              >
                <RotateCcw className="size-3.5" /> Return to Normal
              </Button>
            )}
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIO_DESCRIPTIONS.map((item) => {
            const isActive =
              (liveTelemetry?.demoScenario === item.scenario) ||
              (selectedScenario === item.scenario);

            return (
              <div
                key={item.scenario}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isActive
                    ? "border-primary bg-primary-soft/40 shadow-sm ring-1 ring-primary"
                    : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{item.tag}</span>
                    {isActive && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="w-full text-xs"
                    disabled={pendingScenario !== null}
                    onClick={() => void runDemoScenario(item.scenario)}
                  >
                    {pendingScenario === item.scenario
                      ? "Transmitting…"
                      : isActive
                        ? "Active (Running)"
                        : `Simulate ${item.name.replace(" Test", "")}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback message */}
        {demoMessage && (
          <div
            role="status"
            className={`mt-4 rounded-xl p-3 text-xs ${
              demoMessage.type === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-success-soft text-success"
            }`}
          >
            {demoMessage.text}
          </div>
        )}
      </section>

      {/* 5. COLLAPSIBLE TECHNICAL ENGINEERING DETAILS */}
      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Looking for Engineering Details?
            </h3>
            <p className="text-xs text-muted-foreground">
              Review raw electrical voltage, current draw, individual cell distribution, and 24-sample trend graphs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTechnicalDetails((v) => !v)}
              className="gap-1.5 text-xs"
            >
              {showTechnicalDetails ? (
                <>
                  <ChevronUp className="size-3.5" /> Hide Engineering Details
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" /> Show Engineering Details
                </>
              )}
            </Button>

            <Link
              to="/live-monitoring"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open Battery Details Page →
            </Link>
          </div>
        </div>

        {/* Technical Details Drawer */}
        {showTechnicalDetails && liveTelemetry && (
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 animate-in fade-in-50">
            <div className="border-b border-border pb-3">
              <h4 className="text-sm font-bold text-foreground">Raw Telemetry & Pack Measurements</h4>
              <p className="text-xs text-muted-foreground">
                Heuristic calculations processed from simulated device ID {liveTelemetry.deviceId}
              </p>
            </div>

            {/* 6 Technical Metric Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCard
                label="Pack Voltage"
                reading={liveTelemetry.packVoltage}
                statusLabel={statusName(liveTelemetry.packVoltage.status)}
                icon={Zap}
                hint="Total voltage across the 13-series battery stack (Nominal: 48V)"
              />
              <MetricCard
                label="Operating Current"
                reading={liveTelemetry.current}
                statusLabel={statusName(liveTelemetry.current.status)}
                icon={Activity}
                hint="Current draw in Amperes: positive = discharge, negative = charging"
              />
              <MetricCard
                label="Core Temperature"
                reading={liveTelemetry.temperature}
                statusLabel={statusName(liveTelemetry.temperature.status)}
                icon={Thermometer}
                hint="Pack core thermal reading in Celsius. Warning threshold: 50°C"
              />
              <MetricCard
                label="Cell Imbalance"
                reading={liveTelemetry.cellImbalance}
                statusLabel={statusName(liveTelemetry.cellImbalance.status)}
                icon={ShieldAlert}
                hint="Delta between highest and lowest cell in millivolts"
              />
              <div className="card-surface flex flex-col justify-between gap-2 p-4">
                <span className="text-xs font-medium text-muted-foreground">Pack Power (W)</span>
                <p className="text-2xl font-bold leading-none text-foreground">
                  {liveTelemetry.powerW.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">W</span>
                </p>
                <span className="text-[11px] text-muted-foreground">V × I instantaneous</span>
              </div>
              <div className="card-surface flex flex-col justify-between gap-2 p-4">
                <span className="text-xs font-medium text-muted-foreground">Heuristic Index</span>
                <p className="text-2xl font-bold leading-none text-foreground">
                  {liveTelemetry.health.score ?? 100}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/ 100</span>
                </p>
                <StatusChip status={liveStatus} label={statusName(liveTelemetry.overallStatus)} />
              </div>
            </div>

            {/* 3 History Charts */}
            <div className="mt-4">
              <h5 className="mb-2 text-xs font-semibold text-foreground">
                Continuous Telemetry Trends (Last 24 Readings)
              </h5>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <HistoryChart
                  data={history}
                  dataKey="temperature"
                  label="Temperature Trend (°C)"
                  unit="°C"
                  color="#e11d48"
                />
                <HistoryChart
                  data={history}
                  dataKey="voltage"
                  label="Pack Voltage Trend (V)"
                  unit="V"
                  color="#7c3aed"
                />
                <HistoryChart
                  data={history}
                  dataKey="current"
                  label="Operating Current (A)"
                  unit="A"
                  color="#2563eb"
                />
              </div>
            </div>

            {/* Cell Voltage Distribution */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-foreground">Sampled Cell Voltages</h5>
                  <p className="text-[11px] text-muted-foreground">
                    4-cell taps monitored by the simulated hardware node
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Max Imbalance:{" "}
                  <strong className="text-foreground">
                    {((liveTelemetry.cellImbalance.value ?? 0) / 1000).toFixed(3)} V
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {liveTelemetry.cells.map((cell) => {
                  const isDiverging =
                    cell.voltage !== null &&
                    liveTelemetry.cellMaxV - cell.voltage > 0.1;

                  return (
                    <div
                      key={cell.id}
                      className={`rounded-xl border p-3 ${
                        isDiverging
                          ? "border-warning/60 bg-warning-soft/40"
                          : "border-border bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{cell.id}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            isDiverging ? "text-warning-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {isDiverging ? "Diverging" : "Balanced"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-lg font-bold tabular-nums">
                        {cell.voltage === null ? "--" : `${cell.voltage.toFixed(3)} V`}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            isDiverging ? "bg-warning" : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(10, (((cell.voltage ?? 3.7) - 3.0) / 1.2) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
