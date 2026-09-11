import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

  const setMode = useCallback(
    (mode: OperatingMode) => setSimulation((s) => ({ ...s, mode })),
    [],
  );

  const toggleDevice = useCallback(
    (key: keyof Omit<SimulationState, "mode">) =>
      setSimulation((s) => ({ ...s, [key]: !s[key] })),
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
    () => ({ snapshot, simulation, setMode, toggleDevice, user, signIn, signOut, authReady }),
    [snapshot, simulation, setMode, toggleDevice, user, signIn, signOut, authReady],
  );

  return <BatteryContext.Provider value={value}>{children}</BatteryContext.Provider>;
}

export function useBattery() {
  const ctx = useContext(BatteryContext);
  if (!ctx) throw new Error("useBattery must be used inside BatteryProvider");
  return ctx;
}
