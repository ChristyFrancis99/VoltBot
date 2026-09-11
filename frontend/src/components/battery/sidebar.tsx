import { Link, useRouterState } from "@tanstack/react-router";
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
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBattery } from "@/lib/battery/store";
import logoHead from "@/assets/logo-head.png";
import voltBotLogo from "@/assets/VoltBot-name.png";

type NavRoute =
  | "/dashboard"
  | "/live-monitoring"
  | "/battery-health"
  | "/fault-detection"
  | "/trends"
  | "/alerts"
  | "/service"
  | "/technician";

type NavItem = { to: NavRoute; label: string; icon: LucideIcon };
type NavSection = { label: string; items: readonly NavItem[] };

const navSections: readonly NavSection[] = [
  { label: "Monitor", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/live-monitoring", label: "Live Monitoring", icon: Activity },
    { to: "/battery-health", label: "Battery Health", icon: Gauge },
  ] },
  { label: "Diagnostics", items: [
    { to: "/fault-detection", label: "Fault Detection", icon: ShieldAlert },
    { to: "/trends", label: "Trends & History", icon: LineChart },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ] },
  { label: "Maintenance", items: [
    { to: "/service", label: "Service & Maintenance", icon: Wrench },
    { to: "/technician", label: "Technician Mode", icon: BatteryCharging },
  ] },
];

export const navItems = navSections.flatMap((section) => section.items);

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useBattery();
  const [expanded, setExpanded] = useState(Boolean(onNavigate));
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [samplingRate, setSamplingRate] = useState("2");
  const [imbalanceThreshold, setImbalanceThreshold] = useState("30");
  const [tempThreshold, setTempThreshold] = useState("35");
  const [saved, setSaved] = useState(false);
  const firstName = user?.name?.split(" ")[0] ?? "Christy";
  const userName = user?.name ?? "Christy Francis";

  const handleSaveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    signOut();
    setProfileOpen(false);
    onNavigate?.();
    window.location.assign("/");
  };

  return (
    <div className={cn("flex h-full flex-col border-r border-sidebar-border bg-sidebar px-2 py-5 transition-[width] duration-200 ease-out", expanded ? "w-64" : "w-[72px]")}>
      <div className={cn("flex items-center", expanded ? "justify-between px-1" : "justify-center")}>
        <button type="button" onClick={() => setExpanded((v) => !v)} title={expanded ? "Collapse sidebar" : "Open sidebar"} aria-label={expanded ? "Collapse sidebar" : "Open sidebar"} className={cn("flex min-w-0 items-center", expanded ? "gap-2.5" : "justify-center")}>
          <img src={logoHead} alt="VoltBot logo" className="h-10 w-10 shrink-0 object-contain" />
          {expanded && <img src={voltBotLogo} alt="VoltBot" className="h-9 w-auto max-w-[128px] object-contain" />}
        </button>
        <div className="flex items-center gap-1">
          {expanded && <button type="button" onClick={() => setExpanded(false)} aria-label="Collapse sidebar" title="Collapse sidebar" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>}
          {onNavigate && expanded && <button type="button" onClick={onNavigate} aria-label="Close navigation" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"><X className="size-4" /></button>}
        </div>
      </div>

      {!expanded && <button type="button" onClick={() => setExpanded(true)} aria-label="Open sidebar" title="Open sidebar" className="mx-auto mt-3 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>}

      <nav className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && "mt-5 border-t border-sidebar-border pt-4", expanded ? "px-1" : "px-0")}>
            {expanded && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{section.label}</p>}
            <div className={cn("flex flex-col gap-1", !expanded && "items-center")}>
              {section.items.map((item) => {
                const active = pathname === item.to;
                return <Link key={item.to} to={item.to} onClick={() => { if (!expanded) setExpanded(true); onNavigate?.(); }} title={!expanded ? item.label : undefined} className={cn("flex items-center rounded-xl text-sm transition-colors", expanded ? "gap-3 px-3 py-2.5" : "size-11 justify-center", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-4 shrink-0" />{expanded && <span className="truncate">{item.label}</span>}</Link>;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("relative mt-4 border-t border-sidebar-border pt-3", expanded ? "px-1" : "px-0")}>
        {profileOpen && expanded && (
          <div className="mb-2 max-h-[min(60vh,520px)] overflow-y-auto rounded-2xl border border-sidebar-border bg-background p-3 shadow-lg">
            <div className="mb-3 flex items-center gap-3 border-b border-border pb-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{firstName.charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                <p className="truncate text-[11px] text-muted-foreground">Technician / Admin</p>
              </div>
            </div>

            <button type="button" onClick={() => setSettingsOpen((v) => !v)} className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted">
              <span className="flex items-center gap-2"><Settings className="size-3.5" /> Settings</span>
              <span className="text-[10px] text-muted-foreground">{settingsOpen ? "Hide" : "Open"}</span>
            </button>

            {settingsOpen && (
              <div className="mt-2 space-y-3 rounded-xl bg-muted/40 p-2.5">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Account</p>
                  <div className="rounded-lg bg-background px-2.5 py-2">
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="truncate text-xs font-medium text-foreground">admin@voltbot.io</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Notifications</p>
                  <div className="space-y-1">
                    {[
                      ["Email alerts", emailAlerts, setEmailAlerts],
                      ["SMS urgent alerts", smsAlerts, setSmsAlerts],
                      ["Browser push", pushAlerts, setPushAlerts],
                    ].map(([label, checked, setter]) => (
                      <label key={label as string} className="flex cursor-pointer items-center justify-between rounded-lg bg-background px-2.5 py-2 text-[11px]">
                        <span>{label as string}</span>
                        <input type="checkbox" checked={checked as boolean} onChange={(e) => (setter as (value: boolean) => void)(e.target.checked)} className="size-3.5 accent-primary" />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Monitoring</p>
                  <div className="space-y-2">
                    <label className="block text-[11px]">Sampling interval (sec)<input type="number" min="1" value={samplingRate} onChange={(e) => setSamplingRate(e.target.value)} className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-xs" /></label>
                    <label className="block text-[11px]">Cell imbalance warning (mV)<input type="number" min="0" value={imbalanceThreshold} onChange={(e) => setImbalanceThreshold(e.target.value)} className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-xs" /></label>
                    <label className="block text-[11px]">Thermal warning (°C)<input type="number" min="0" value={tempThreshold} onChange={(e) => setTempThreshold(e.target.value)} className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-xs" /></label>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {saved && <span className="text-[10px] font-medium text-success">Saved</span>}
                  <button type="button" onClick={handleSaveSettings} className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90">Save settings</button>
                </div>
              </div>
            )}

            <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"><LogOut className="size-3.5" /> Logout</button>
          </div>
        )}

        <button type="button" onClick={() => { if (!expanded) setExpanded(true); setProfileOpen((v) => !v); }} title={!expanded ? `${userName} · Profile` : undefined} aria-expanded={profileOpen} className={cn("flex w-full items-center rounded-xl bg-muted/50 text-left transition-colors hover:bg-muted", expanded ? "gap-3 px-3 py-2.5" : "mx-auto size-11 justify-center")}>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{firstName.charAt(0).toUpperCase()}</div>
          {expanded && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-foreground">{userName}</p><p className="truncate text-[10px] text-muted-foreground">Profile & settings</p></div>}
          {expanded && <UserCircle className={cn("size-4 shrink-0 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />}
        </button>
      </div>
    </div>
  );
}
