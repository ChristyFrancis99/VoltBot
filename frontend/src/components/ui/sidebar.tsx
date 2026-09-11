import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BatteryCharging,
  Bell,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  ShieldAlert,
  UserCircle,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBattery } from "@/lib/battery/store";
import logoHead from "@/assets/logo-head.png";
import voltBotLogo from "@/assets/volt-bot.png";

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
  const { user, signOut } = useBattery();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(Boolean(onNavigate));

  const firstName = user?.name?.split(" ")[0] ?? "Christy";
  const userName = user?.name ?? "Christy Francis";

  const toggleSidebar = () => setExpanded((value) => !value);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar px-2 py-5 transition-[width] duration-200 ease-out",
        expanded ? "w-64" : "w-[72px]",
      )}
    >
      {/* Logo area: two transparent image holders, with no background effects */}
      <div className={cn("flex items-center", expanded ? "justify-between px-1" : "justify-center")}>
        <button
          type="button"
          onClick={toggleSidebar}
          title={expanded ? "Collapse sidebar" : "Open sidebar"}
          aria-label={expanded ? "Collapse sidebar" : "Open sidebar"}
          className={cn(
            "flex min-w-0 items-center",
            expanded ? "gap-2.5" : "justify-center",
          )}
        >
          <img
            src={logoHead}
            alt="VoltBot logo"
            className={cn(
              "shrink-0 object-contain",
              expanded ? "h-10 w-10" : "h-10 w-10",
            )}
          />
          {expanded && (
            <img
              src={voltBotLogo}
              alt="VoltBot"
              className="h-9 w-auto max-w-[128px] object-contain"
            />
          )}
        </button>

        <div className="flex items-center gap-1">
          {expanded && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          {onNavigate && expanded && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          title="Open sidebar"
          className="mx-auto mt-3 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      <nav
        className={cn(
          "mt-7 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto no-scrollbar",
          expanded ? "px-1" : "items-center",
        )}
      >
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => {
                if (!expanded) setExpanded(true);
                onNavigate?.();
              }}
              title={!expanded ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm transition-colors",
                expanded ? "gap-3 px-3 py-2.5" : "size-11 justify-center",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile at the bottom */}
      <div className={cn("mt-4 border-t border-sidebar-border pt-3", expanded ? "px-1" : "px-0")}>
        <div
          className={cn(
            "flex items-center rounded-xl bg-muted/50",
            expanded ? "gap-3 px-3 py-2.5" : "size-11 justify-center",
          )}
          title={!expanded ? `${userName} · Technician/Admin` : undefined}
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {firstName.charAt(0).toUpperCase()}
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
              <p className="truncate text-[10px] text-muted-foreground">Technician / Admin</p>
            </div>
          )}
          {!expanded && <UserCircle className="hidden" />}
        </div>

        <button
          type="button"
          onClick={() => {
            signOut();
            navigate({ to: "/", replace: true });
          }}
          title={!expanded ? "Logout" : undefined}
          className={cn(
            "mt-1.5 flex items-center rounded-xl text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            expanded ? "w-full gap-3 px-3 py-2.5" : "mx-auto size-11 justify-center",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {expanded && "Logout"}
        </button>
      </div>
    </div>
  );
}
