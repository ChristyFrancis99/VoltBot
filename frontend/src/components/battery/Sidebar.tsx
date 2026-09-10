import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BatteryCharging,
  Bell,
  Gauge,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  ShieldAlert,
  Wrench,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBattery } from "@/lib/battery/store";
import voltbotLogo from "@/assets/voltbot-logo.jpg";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live-monitoring", label: "Live Monitoring", icon: Activity },
  { to: "/battery-health", label: "Battery Health", icon: Gauge },
  { to: "/fault-detection", label: "Fault Detection", icon: ShieldAlert },
  { to: "/trends", label: "Trends & History", icon: LineChart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/service", label: "Service & Maintenance", icon: Wrench },
  { to: "/technician", label: "Technician Mode", icon: BatteryCharging },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useBattery();
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <img
            src={voltbotLogo}
            alt="VoltBot Logo"
            className="size-9 shrink-0 rounded-xl object-cover shadow-sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-foreground">VoltBot</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              EV Battery Monitoring
            </span>
          </span>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Close navigation"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => {
          signOut();
          navigate({ to: "/", replace: true });
        }}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4 shrink-0" />
        Logout
      </button>
    </div>
  );
}
