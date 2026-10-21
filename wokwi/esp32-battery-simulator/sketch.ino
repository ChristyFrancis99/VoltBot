/*
 * VoltBot (BatteryGuard) - Wokwi ESP32 Battery Telemetry Node
 *
 * Target Board: ESP32 DevKit v1 / ESP32 DevKit C V4
 * Environment: Wokwi Online Simulator (https://wokwi.com)
 *
 * Hardware Mapping:
 * - Potentiometer 1 (SIG -> GPIO 34): Simulated Battery Pack Voltage (40.0V - 54.0V)
 * - Potentiometer 2 (SIG -> GPIO 35): Simulated Battery Pack Temperature (20.0°C - 65.0°C)
 * - Slide Switch (PIN 2 -> GPIO 21, PIN 1 -> GND): Cell Imbalance Fault Simulation
 * - Built-in LED (GPIO 2): Telemetry Activity Indicator
 *
 * Network Configuration:
 * - Wi-Fi: Wokwi-GUEST (open virtual network in Wokwi)
 * - Backend: Configurable tunnel URL pointing to local FastAPI server (/api/sensor-data)
 */

#include <WiFi.h>
#include <HTTPClient.h>

// If a local (git-ignored) secrets.h file exists, load credentials from it.
// SECURITY NOTE: While secrets.h prevents accidental git commits locally,
// pasting secrets into the online Wokwi web editor is NOT confidential.
// Always use temporary, disposable demonstration keys.
#if __has_include("secrets.h")
  #include "secrets.h"
#endif

#ifndef VOLTBOT_TUNNEL_URL
  #define VOLTBOT_TUNNEL_URL "https://YOUR-TUNNEL-URL-HERE"
#endif

#ifndef VOLTBOT_API_KEY
  #define VOLTBOT_API_KEY ""
#endif

// ============================================================================
// CONFIGURATION & ENDPOINTS
// ============================================================================
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Device ID registered in VoltBot monitoring pipeline
const char* DEVICE_ID = "ESP32_WOKWI_01";

// Configurable tunnel endpoint and optional ingestion API key
const char* BACKEND_BASE_URL = VOLTBOT_TUNNEL_URL;
const char* INGESTION_PATH = "/api/sensor-data";
const char* API_KEY = VOLTBOT_API_KEY;

// Telemetry interval: 3 seconds (matches VoltBot backend sampling window)
const unsigned long TELEMETRY_INTERVAL_MS = 3000;

// Pin assignments (using ADC1 pins safe for use with Wi-Fi)
const int PIN_POT_VOLTAGE   = 34; // ADC1_CH6 - Pack Voltage
const int PIN_POT_TEMP      = 35; // ADC1_CH7 - Pack Temperature
const int PIN_SW_IMBALANCE  = 21; // Digital input with pullup - Cell 4 Imbalance Switch
const int PIN_STATUS_LED    = 2;  // Built-in activity LED

// Bounded physical calibration ranges
const float VOLTAGE_MIN_V = 40.0f; // Low-voltage warning is < 42.0V
const float VOLTAGE_MAX_V = 54.0f; // High-voltage warning is > 50.0V
const float TEMP_MIN_C    = 20.0f; // Ambient room temperature
const float TEMP_MAX_C    = 65.0f; // High-temp warning is >= 45°C, critical >= 55°C

// ============================================================================
// STATE VARIABLES
// ============================================================================
unsigned long lastTelemetryTime = 0;
unsigned long transmissionCount = 0;
unsigned int consecutiveFailures = 0;
float currentPhase = 0.0f;

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("   VoltBot ESP32 Battery Telemetry Simulator      ");
  Serial.println("==================================================");
  Serial.print("Device ID:        "); Serial.println(DEVICE_ID);
  Serial.print("Target Endpoint:  "); Serial.print(BACKEND_BASE_URL); Serial.println(INGESTION_PATH);
  Serial.print("Ingestion Auth:   "); Serial.println(strlen(API_KEY) > 0 ? "[CONFIGURED (X-API-Key)]" : "[DISABLED (Local Dev Mode)]");
  Serial.println("--------------------------------------------------");

  pinMode(PIN_POT_VOLTAGE, INPUT);
  pinMode(PIN_POT_TEMP, INPUT);
  pinMode(PIN_SW_IMBALANCE, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  connectToWiFi();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  // Ensure Wi-Fi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;
    transmitBatteryTelemetry();
  }

  delay(50); // Small cooperative yield for ESP32 RTOS
}

// ============================================================================
// WI-FI CONNECTION
// ============================================================================
void connectToWiFi() {
  Serial.print("[Wi-Fi] Connecting to ");
  Serial.print(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[Wi-Fi] Connected! IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[Wi-Fi] Connection timed out. Will retry on next cycle.");
  }
}

// ============================================================================
// SENSOR READING & TELEMETRY GENERATION
// ============================================================================
float readAnalogAveraged(int pin, int samples = 4) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(pin);
    delay(2);
  }
  return (float)sum / (float)samples;
}

void transmitBatteryTelemetry() {
  transmissionCount++;

  // 1. Read Potentiometer 1 -> Pack Voltage (40.0V - 54.0V)
  float rawVoltage = readAnalogAveraged(PIN_POT_VOLTAGE);
  float voltage = VOLTAGE_MIN_V + (rawVoltage / 4095.0f) * (VOLTAGE_MAX_V - VOLTAGE_MIN_V);

  // 2. Read Potentiometer 2 -> Pack Temperature (20.0°C - 65.0°C)
  float rawTemp = readAnalogAveraged(PIN_POT_TEMP);
  float temperature = TEMP_MIN_C + (rawTemp / 4095.0f) * (TEMP_MAX_C - TEMP_MIN_C);

  // 3. Read Slide Switch -> Imbalance Simulation (LOW = Active, HIGH = Balanced)
  bool imbalanceActive = (digitalRead(PIN_SW_IMBALANCE) == LOW);

  // 4. Synthesize realistic operating current (8.5A - 11.5A nominal discharge)
  currentPhase += 0.25f;
  if (currentPhase > 6.283f) currentPhase = 0.0f;
  float current = 10.0f + sin(currentPhase) * 1.5f;

  // 5. Compute series cell voltages (4 series taps on a 13-series 48V pack)
  float baseCellVoltage = voltage / 13.0f;
  float cell1 = baseCellVoltage + 0.005f;
  float cell2 = baseCellVoltage - 0.004f;
  float cell3 = baseCellVoltage + 0.002f;
  float cell4 = baseCellVoltage - 0.003f;

  // If imbalance switch is active, drop Cell 4 significantly (divergence >= 0.20V)
  if (imbalanceActive) {
    cell4 = baseCellVoltage - 0.220f; // Triggers VoltBot's CRITICAL imbalance threshold (0.20V)
  }

  float cellMin = min(min(cell1, cell2), min(cell3, cell4));
  float cellMax = max(max(cell1, cell2), max(cell3, cell4));
  float cellImbalance = cellMax - cellMin;

  // Print telemetry to Serial Monitor
  Serial.println();
  Serial.print("--- Telemetry Packet #"); Serial.print(transmissionCount); Serial.println(" ---");
  Serial.printf("Pack Voltage:    %6.2f V   (Raw ADC: %4.0f)\n", voltage, rawVoltage);
  Serial.printf("Operating Curr:  %6.2f A   (Discharge)\n", current);
  Serial.printf("Pack Temp:       %6.2f C   (Raw ADC: %4.0f)\n", temperature, rawTemp);
  Serial.printf("Cell Imbalance:  %6.3f V   [%s]\n", cellImbalance, imbalanceActive ? "FAULT: CELL 4 LAGGING" : "NORMAL BALANCED");
  Serial.printf("Cells [1..4]:    [%.3f, %.3f, %.3f, %.3f] V\n", cell1, cell2, cell3, cell4);

  // Check if user has configured the tunnel URL
  String fullUrl = String(BACKEND_BASE_URL) + String(INGESTION_PATH);
  if (strstr(BACKEND_BASE_URL, "YOUR-TUNNEL-URL") != NULL) {
    Serial.println("[NOTE] BACKEND_BASE_URL is still set to placeholder.");
    Serial.println("       Update BACKEND_BASE_URL with your public tunnel URL in Phase 2.");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Cannot send: Wi-Fi is not connected.");
    return;
  }

  // Build JSON payload matching backend/schemas.py:SensorData schema exactly
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"voltage\":" + String(voltage, 2) + ",";
  payload += "\"current\":" + String(current, 2) + ",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"cell_voltages\":["
             + String(cell1, 3) + ","
             + String(cell2, 3) + ","
             + String(cell3, 3) + ","
             + String(cell4, 3) + "]";
  payload += "}";

  // Send HTTP POST request
  HTTPClient http;
  http.begin(fullUrl);
  http.addHeader("Content-Type", "application/json");
  if (strlen(API_KEY) > 0) {
    http.addHeader("X-API-Key", API_KEY);
  }
  http.setTimeout(5000); // 5 second timeout

  digitalWrite(PIN_STATUS_LED, HIGH); // Flash LED during network transmission
  int httpResponseCode = http.POST(payload);
  digitalWrite(PIN_STATUS_LED, LOW);

  if (httpResponseCode > 0) {
    Serial.printf("[HTTP] POST %d (%s)\n", httpResponseCode, httpResponseCode == 200 ? "OK" : "CHECK BACKEND");
    if (httpResponseCode == 200) {
      consecutiveFailures = 0;
      String response = http.getString();
      Serial.printf("[HTTP Response] %s\n", response.substring(0, 120).c_str());
    } else {
      consecutiveFailures++;
      Serial.printf("[HTTP Error] Backend returned status code: %d\n", httpResponseCode);
    }
  } else {
    consecutiveFailures++;
    Serial.printf("[HTTP] POST failed, error: %s (Failures: %u)\n", http.errorToString(httpResponseCode).c_str(), consecutiveFailures);
  }

  http.end();
}
