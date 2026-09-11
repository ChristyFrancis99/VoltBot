import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Wifi, Cloud, CheckCircle2, Terminal, Activity } from "lucide-react";
import { useBattery } from "@/lib/battery/store";
import { Panel, StatusChip, StatusDot } from "@/components/battery/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/technician")({ component: TechnicianPage });

function TechnicianPage() {
  const { snapshot, simulation, toggleDevice } = useBattery();
  const device = snapshot.device;
  const live = device.esp32Online && device.cloudSynced;

  return (
    <div className="space-y-5">
      <div className="card-surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Terminal className="size-4" /></span><h1 className="text-xl font-bold tracking-tight text-foreground">Technician Diagnostic Mode</h1></div><p className="mt-1 text-xs text-muted-foreground">Hardware gateway, sensor diagnostics and controlled prototype fault-injection tools</p></div>
        <span className="self-start rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground sm:self-center">Prototype Diagnostic Interface</span>
      </div>

      <Panel title="Hardware Gateway & Sensor Status" description="ESP32, network and sensor connectivity state">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-border bg-card p-3 text-center"><span className="block text-[11px] text-muted-foreground">ESP32 Gateway</span><div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold"><StatusDot status={device.esp32Online ? "normal" : "critical"} />{device.esp32Online ? "Online" : "Offline"}</div></div>
          {device.sensors.map((sensor) => <div key={sensor.key} className="rounded-xl border border-border bg-card p-3 text-center"><span className="block text-[11px] text-muted-foreground">{sensor.label}</span><div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold"><StatusDot status={sensor.online ? "normal" : "critical"} />{sensor.online ? "Online" : "Offline"}</div></div>)}
          <div className="rounded-xl border border-border bg-card p-3 text-center"><span className="block text-[11px] text-muted-foreground">Wi-Fi Connection</span><div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold"><StatusDot status={device.wifiConnected ? "normal" : "critical"} />{device.wifiConnected ? "Connected" : "Disconnected"}</div></div>
          <div className="rounded-xl border border-border bg-card p-3 text-center"><span className="block text-[11px] text-muted-foreground">Cloud Sync</span><div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold"><StatusDot status={device.cloudSynced ? "normal" : "critical"} />{device.cloudSynced ? "Synced" : "Disconnected"}</div></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
          <div><span className="block text-muted-foreground">Device ID</span><span className="font-mono font-semibold text-foreground">{device.deviceId}</span></div>
          <div><span className="block text-muted-foreground">Firmware</span><span className="font-mono font-semibold text-foreground">{device.firmware}</span></div>
          <div><span className="block text-muted-foreground">Wi-Fi Signal (RSSI)</span><span className="font-semibold text-foreground">{device.wifiConnected ? `${device.wifiSignalDbm} dBm` : "Unavailable"}</span></div>
          <div><span className="block text-muted-foreground">Last Packet</span><span className="font-semibold text-foreground">{live ? `${device.lastPacketSeconds} sec ago` : "Unavailable"}</span></div>
        </div>
      </Panel>

      <Panel title="Simulation & Fault Injection Controls" description="Test connection fallback and sensor error states without claiming real hardware telemetry">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={simulation.esp32Online ? "outline" : "destructive"} size="sm" onClick={() => toggleDevice("esp32Online")} className="rounded-xl text-xs">{simulation.esp32Online ? "Simulate ESP32 Disconnect" : "Reconnect ESP32"}</Button>
          <Button variant={simulation.cloudOnline ? "outline" : "destructive"} size="sm" onClick={() => toggleDevice("cloudOnline")} className="rounded-xl text-xs">{simulation.cloudOnline ? "Simulate Cloud Outage" : "Reconnect Cloud"}</Button>
          <Button variant={simulation.temperatureSensorOnline ? "outline" : "destructive"} size="sm" onClick={() => toggleDevice("temperatureSensorOnline")} className="rounded-xl text-xs">{simulation.temperatureSensorOnline ? "Simulate Temp Sensor Fault" : "Fix Temp Sensor"}</Button>
        </div>
      </Panel>

      <Panel title="Individual Cell Voltage Matrix" description="Prototype cell readings; replace with the real cell-monitor adapter for hardware deployment">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {snapshot.cells.map((cell) => <div key={cell.id} className="rounded-xl border border-border bg-card p-3 text-center"><span className="text-[11px] font-semibold text-muted-foreground">{cell.id}</span><p className="mt-1 text-lg font-bold text-foreground">{cell.voltage !== null ? cell.voltage.toFixed(2) : "--"} <span className="text-xs">V</span></p><div className="mt-1.5 flex justify-center"><StatusChip status={cell.status} label={cell.voltage === null ? "Unavailable" : undefined} /></div></div>)}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Prototype Anomaly Diagnostics" description="Transparent rule-based indicator used by the demo source">
          <dl className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2.5"><dt className="font-medium text-muted-foreground">Anomaly Score</dt><dd className="font-bold text-foreground">{live ? `${snapshot.anomalyScore.toFixed(2)} / 1.00` : "Unavailable"}</dd></div>
            <div className="flex justify-between py-2.5"><dt className="font-medium text-muted-foreground">Cell Voltage Deviation</dt><dd className="font-mono font-semibold text-warning">{snapshot.cellImbalance.available ? `${snapshot.cellImbalance.value} mV` : "Unavailable"}</dd></div>
            <div className="flex justify-between py-2.5"><dt className="font-medium text-muted-foreground">Temperature Baseline</dt><dd className="font-mono font-semibold text-warning">29–34 °C</dd></div>
            <div className="flex justify-between py-2.5"><dt className="font-medium text-muted-foreground">Inference Engine</dt><dd className="font-mono text-foreground">Prototype rules</dd></div>
          </dl>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground"><Activity className="mt-0.5 size-3.5 shrink-0" />The score is a transparent demo heuristic, not a trained ML inference engine or certified battery-safety assessment.</div>
        </Panel>

        <Panel title="System Diagnostic Summary" description="Application-level prototype checks; not a physical bus validation">
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5"><span className="font-medium text-foreground">ESP32 connectivity</span><span className="flex items-center gap-1 font-semibold text-success">{device.esp32Online ? <CheckCircle2 className="size-3.5" /> : <Wifi className="size-3.5" />}{device.esp32Online ? "Connected" : "Disconnected"}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5"><span className="font-medium text-foreground">Cloud synchronization</span><span className="flex items-center gap-1 font-semibold text-success"><Cloud className="size-3.5" />{device.cloudSynced ? "Synchronized" : "Unavailable"}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5"><span className="font-medium text-foreground">Telemetry source</span><span className="flex items-center gap-1 font-semibold text-muted-foreground"><Cpu className="size-3.5" />Demo / Mock</span></li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
