import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getLatestBatteryReading, mapBatteryReadingToTelemetry } from "./api";
import type { BatteryTelemetry } from "./api";
import { createDemoSnapshot } from "./source";
import type { BatterySnapshot, OperatingMode } from "./types";

const AUTH_KEY = "voltbot.session";

interface SimulationState {
  mode: OperatingMode;
  esp32Online: boolean;
  cloudOnline: boolean;
  temperatureSensorOnline: boolean;
}

interface BatteryContextValue {
  snapshot: BatterySnapshot;
  liveTelemetry: BatteryTelemetry | null;
  liveTelemetryLoading: boolean;
  liveTelemetryError: string | null;
  liveTelemetryConnected: boolean;
  refreshLiveTelemetry: () => Promise<void>;
  simulation: SimulationState;
  setMode: (mode: OperatingMode) => void;
  toggleDevice: (key: keyof Omit<SimulationState, "mode">) => void;
  user: { name: string; role: string } | null;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
  authReady: boolean;
}

const BatteryContext = createContext<BatteryContextValue | null>(null);

const LAST_TEMP = { value: 36.2, at: "18:41" };

export function BatteryProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [liveTelemetry, setLiveTelemetry] = useState<BatteryTelemetry | null>(null);
  const [liveTelemetryLoading, setLiveTelemetryLoading] = useState(true);
  const [liveTelemetryError, setLiveTelemetryError] = useState<string | null>(null);
  const [liveTelemetryConnected, setLiveTelemetryConnected] = useState(false);
  const liveRequestInFlight = useRef(false);
  const liveRefreshPending = useRef(false);
  const liveRefreshWaiters = useRef<Array<() => void>>([]);
  const livePollingActive = useRef(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [simulation, setSimulation] = useState<SimulationState>({
    mode: "discharging",
    esp32Online: true,
    cloudOnline: true,
    temperatureSensorOnline: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AUTH_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(AUTH_KEY);
      }
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2000);
    return () => window.clearInterval(id);
  }, []);

  const pollLiveTelemetry = useCallback(async (forceAfterCurrent = false): Promise<void> => {
    if (!livePollingActive.current) return;

    if (liveRequestInFlight.current) {
      if (!forceAfterCurrent) return;
      liveRefreshPending.current = true;
      return new Promise<void>((resolve) => {
        liveRefreshWaiters.current.push(resolve);
      });
    }

    liveRequestInFlight.current = true;
    setLiveTelemetryLoading(true);

    try {
      const reading = await getLatestBatteryReading();
      if (!livePollingActive.current) return;

      setLiveTelemetry(mapBatteryReadingToTelemetry(reading));
      setLiveTelemetryError(null);
      setLiveTelemetryConnected(true);
    } catch (error) {
      if (!livePollingActive.current) return;

      setLiveTelemetryError(
        error instanceof Error ? error.message : "Unable to load live battery telemetry",
      );
      setLiveTelemetryConnected(false);
    } finally {
      liveRequestInFlight.current = false;
      if (livePollingActive.current) setLiveTelemetryLoading(false);

      if (liveRefreshPending.current && livePollingActive.current) {
        liveRefreshPending.current = false;
        const waiters = liveRefreshWaiters.current.splice(0);
        void pollLiveTelemetry().finally(() => waiters.forEach((resolve) => resolve()));
      }
    }
  }, []);

  const refreshLiveTelemetry = useCallback(() => pollLiveTelemetry(true), [pollLiveTelemetry]);

  useEffect(() => {
    livePollingActive.current = true;
    const refreshWaiters = liveRefreshWaiters.current;
    void pollLiveTelemetry();
    const id = window.setInterval(() => void pollLiveTelemetry(), 3000);

    return () => {
      livePollingActive.current = false;
      window.clearInterval(id);
      liveRefreshPending.current = false;
      refreshWaiters.splice(0).forEach((resolve) => resolve());
    };
  }, [pollLiveTelemetry]);

  const signIn = useCallback((username: string, password: string) => {
    if (username.trim().toLowerCase() !== "admin" || password !== "admin123") return false;
    const session = { name: "Christy Francis", role: "Technician / Admin" };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setUser(session);
    return true;
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const setMode = useCallback((mode: OperatingMode) => setSimulation((s) => ({ ...s, mode })), []);

  const toggleDevice = useCallback(
    (key: keyof Omit<SimulationState, "mode">) => setSimulation((s) => ({ ...s, [key]: !s[key] })),
    [],
  );

  const snapshot = useMemo(() => {
    const base = createDemoSnapshot(simulation.mode, tick, {
      esp32Online: simulation.esp32Online,
      cloudOnline: simulation.cloudOnline,
    });

    if (!simulation.temperatureSensorOnline) {
      base.temperature = {
        ...base.temperature,
        value: null,
        unit: "°C",
        status: "critical",
        available: false,
        lastKnown: LAST_TEMP.value,
        lastKnownAt: LAST_TEMP.at,
      };
      base.device.sensors = base.device.sensors.map((sensor) =>
        sensor.key === "temperature" ? { ...sensor, online: false } : sensor,
      );
    }

    return base;
  }, [simulation, tick]);

  const value = useMemo(
    () => ({
      snapshot,
      liveTelemetry,
      liveTelemetryLoading,
      liveTelemetryError,
      liveTelemetryConnected,
      refreshLiveTelemetry,
      simulation,
      setMode,
      toggleDevice,
      user,
      signIn,
      signOut,
      authReady,
    }),
    [
      snapshot,
      liveTelemetry,
      liveTelemetryLoading,
      liveTelemetryError,
      liveTelemetryConnected,
      refreshLiveTelemetry,
      simulation,
      setMode,
      toggleDevice,
      user,
      signIn,
      signOut,
      authReady,
    ],
  );

  return <BatteryContext.Provider value={value}>{children}</BatteryContext.Provider>;
}

export function useBattery() {
  const ctx = useContext(BatteryContext);
  if (!ctx) throw new Error("useBattery must be used inside BatteryProvider");
  return ctx;
}
