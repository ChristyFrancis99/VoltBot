import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Bell, Cpu, Sliders, Shield, Save, Check } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel } from "@/components/battery/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_shell/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useBattery();
  const [saved, setSaved] = useState(false);

  // Settings form state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [samplingRate, setSamplingRate] = useState("2");
  const [imbalanceThreshold, setImbalanceThreshold] = useState("30");
  const [tempThreshold, setTempThreshold] = useState("35");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">System Settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure monitoring thresholds, device gateway preferences & user notifications
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
            <Check className="size-3.5" /> Settings saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Section 1: Account */}
          <Panel title="Account Information">
            <div className="space-y-3.5">
              <div>
                <Label htmlFor="account-name" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="account-name"
                  defaultValue={user?.name ?? "Christy Francis"}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <Label htmlFor="account-role" className="text-xs font-medium">Role / Title</Label>
                <Input
                  id="account-role"
                  defaultValue={user?.role ?? "Technician / Admin"}
                  readOnly
                  className="mt-1 h-9 rounded-xl text-xs bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="account-email" className="text-xs font-medium">Email Address</Label>
                <Input
                  id="account-email"
                  defaultValue="admin@voltbot.io"
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>
          </Panel>

          {/* Section 2: Notification Preferences */}
          <Panel title="Notification Preferences">
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <Label htmlFor="email-notif" className="text-xs font-medium cursor-pointer">Email Notifications</Label>
                  <p className="text-[11px] text-muted-foreground">Receive daily health summary & critical alerts</p>
                </div>
                <Checkbox
                  id="email-notif"
                  checked={emailAlerts}
                  onCheckedChange={(c) => setEmailAlerts(!!c)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <Label htmlFor="sms-notif" className="text-xs font-medium cursor-pointer">SMS Urgent Alerts</Label>
                  <p className="text-[11px] text-muted-foreground">Instant SMS for thermal or voltage warnings</p>
                </div>
                <Checkbox
                  id="sms-notif"
                  checked={smsAlerts}
                  onCheckedChange={(c) => setSmsAlerts(!!c)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                <div>
                  <Label htmlFor="push-notif" className="text-xs font-medium cursor-pointer">Browser Push Notifications</Label>
                  <p className="text-[11px] text-muted-foreground">In-app notifications when dashboard is open</p>
                </div>
                <Checkbox
                  id="push-notif"
                  checked={pushAlerts}
                  onCheckedChange={(c) => setPushAlerts(!!c)}
                />
              </div>
            </div>
          </Panel>

          {/* Section 3: Device Settings */}
          <Panel title="Device Settings">
            <div className="space-y-3.5">
              <div>
                <Label htmlFor="gateway-id" className="text-xs font-medium">ESP32 Gateway Device ID</Label>
                <Input
                  id="gateway-id"
                  defaultValue="ESP32-BAT001"
                  readOnly
                  className="mt-1 h-9 rounded-xl text-xs bg-muted font-mono"
                />
              </div>
              <div>
                <Label htmlFor="sampling-rate" className="text-xs font-medium">Telemetry Sampling Interval (Seconds)</Label>
                <Input
                  id="sampling-rate"
                  type="number"
                  value={samplingRate}
                  onChange={(e) => setSamplingRate(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>
          </Panel>

          {/* Section 4: Monitoring Preferences */}
          <Panel title="Monitoring Preferences">
            <div className="space-y-3.5">
              <div>
                <Label htmlFor="imbalance-threshold" className="text-xs font-medium">Cell Imbalance Warning Threshold (mV)</Label>
                <Input
                  id="imbalance-threshold"
                  type="number"
                  value={imbalanceThreshold}
                  onChange={(e) => setImbalanceThreshold(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <Label htmlFor="temp-threshold" className="text-xs font-medium">Pack Thermal Warning Threshold (°C)</Label>
                <Input
                  id="temp-threshold"
                  type="number"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs"
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-xl px-6">
            <Save className="mr-2 size-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
