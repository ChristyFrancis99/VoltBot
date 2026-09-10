# Battery data layer

The UI never reads sensor values directly. It reads a single `BatterySnapshot`
object exposed by `useBattery()` (`src/lib/battery/store.tsx`).

```
Battery -> Sensors -> ESP32 -> Wi-Fi -> Backend / Firebase -> Database
       -> Preprocessing -> Feature extraction -> Behaviour profile
       -> Anomaly detection -> Risk calculation -> Health score -> Dashboard
```

- `types.ts` – the contract every data source must satisfy.
- `source.ts` – the current **mock/demo** source (`createDemoSnapshot`).
- `store.tsx` – React provider: polls the source, applies device/sensor
  availability and operating-mode simulation, exposes it to the UI.

To connect real hardware, implement a source with the same signature
(e.g. a Firebase Realtime Database listener or a REST poll of the ESP32
gateway) and swap it in `store.tsx`. No component changes are required.
Demo values are labelled with a "Demo Data" indicator in the header while the
mock source is active.
