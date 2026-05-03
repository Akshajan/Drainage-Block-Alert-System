/**
 * serverB.js — Ingestion server (FINAL, corrected)
 * (Added: TLS broker certificate validation using ISRG Root X1)
 */

import "dotenv/config";
import mqtt from "mqtt";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import fs from "fs";
import path from "path";

// ───────────────────────── CONFIG ─────────────────────────

const CFG = {
  // MQTT
  mqttUrl: process.env.MQTT_URL,
  mqttTopic: process.env.MQTT_TOPIC || "drainage/raw/+",
  mqttUser: process.env.MQTT_USERNAME || process.env.MQTT_USER,
  mqttPass: process.env.MQTT_PASSWORD || process.env.MQTT_PASS,

  // ✅ TLS CA (ISRG Root X1) path
  mqttCaPath: process.env.MQTT_CA_PATH || "",

  // Influx
  influxUrl: process.env.INFLUX_URL,
  influxToken: process.env.INFLUX_TOKEN,
  influxOrg: process.env.INFLUX_ORG,
  influxBucket: process.env.INFLUX_BUCKET,

  // Tags
  location: process.env.LOCATION_TAG || "Champion Baskaran Road",
  segmentId: process.env.SEGMENT_ID || "SEG_A",
  project: process.env.PROJECT_TAG || "DrainageBlockAlertSystem",

  // Sensor IDs
  s1: process.env.S1_ID || "s1",
  s2: process.env.S2_ID || "s2",

  // Measurements
  measSensor: process.env.MEAS_SENSOR || "drainage_sensor",
  measSegment: process.env.MEAS_SEGMENT || "drainage_segment",

  // Validation
  minCm: Number(process.env.MIN_CM ?? 1),
  maxCm: Number(process.env.MAX_CM ?? 400),

  // Filter
  medianN: Number(process.env.MEDIAN_N ?? 5),

  // Block logic
  blockCm: Number(process.env.BLOCK_CM ?? 10),
  warnCm: Number(process.env.WARN_CM ?? 20),
  diffTh: Number(process.env.BLOCKAGE_THRESHOLD_DIFF ?? 25),
  pairWindowSec: Number(process.env.PAIR_WINDOW_SEC ?? 5),

  precision: "ms",
};

// Sensor-specific placement
const SENSOR_LOC = {
  [CFG.s1]: process.env.S1_LOCATION || "Law College Junction",
  [CFG.s2]: process.env.S2_LOCATION || "USP Glory Apartment",
};

// Helpful env debug
console.log("ENV CHECK:", {
  MQTT_URL: CFG.mqttUrl,
  MQTT_TOPIC: CFG.mqttTopic,
  MQTT_USERNAME: CFG.mqttUser,
  MQTT_PASSWORD: CFG.mqttPass ? "SET" : "MISSING",
  MQTT_CA_PATH: CFG.mqttCaPath || "MISSING (TLS verify will fail)",
  INFLUX_URL: CFG.influxUrl,
  INFLUX_ORG: CFG.influxOrg,
  INFLUX_BUCKET: CFG.influxBucket,
  SEGMENT_ID: CFG.segmentId,
  LOCATION_TAG: CFG.location,
  S1_ID: CFG.s1,
  S2_ID: CFG.s2,
  S1_LOCATION: SENSOR_LOC[CFG.s1],
  S2_LOCATION: SENSOR_LOC[CFG.s2],
});

// Required checks
const REQUIRED = [
  ["mqttUrl", "MQTT_URL (must be mqtts://...:8883 for TLS)"],
  ["mqttUser", "MQTT_USERNAME (or MQTT_USER)"],
  ["mqttPass", "MQTT_PASSWORD (or MQTT_PASS)"],
  ["mqttCaPath", "MQTT_CA_PATH (path to ISRG Root X1 PEM)"],
  ["influxUrl", "INFLUX_URL"],
  ["influxToken", "INFLUX_TOKEN"],
  ["influxOrg", "INFLUX_ORG"],
  ["influxBucket", "INFLUX_BUCKET"],
];
for (const [key, envName] of REQUIRED) {
  if (!CFG[key]) throw new Error(`Missing env var: ${envName}`);
}
if (CFG.medianN < 3) console.warn("⚠️ MEDIAN_N recommended >= 3");

// ───────────────────────── TLS CA LOAD ─────────────────────────
const caPathAbs = path.resolve(process.cwd(), CFG.mqttCaPath);
let MQTT_CA_PEM = "";
try {
  MQTT_CA_PEM = fs.readFileSync(caPathAbs, "utf8");
  if (!MQTT_CA_PEM.includes("BEGIN CERTIFICATE")) {
    throw new Error("CA file does not look like a PEM certificate");
  }
  console.log("✅ Loaded MQTT Root CA:", caPathAbs);
} catch (e) {
  console.error("❌ Failed to load MQTT CA PEM:", e?.message || e);
  process.exit(1);
}

// ───────────────────────── INFLUX ─────────────────────────
const influx = new InfluxDB({
  url: CFG.influxUrl,
  token: CFG.influxToken,
  timeout: 30000
});
const writeApi = influx.getWriteApi(CFG.influxOrg, CFG.influxBucket, CFG.precision);
writeApi.useDefaultTags({ project: CFG.project });

setInterval(async () => {
  try { await writeApi.flush(); } catch { }
}, 5000);

// ───────────────────────── HELPERS ─────────────────────────
function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function classifyWaterLevel(distanceCm) {
  if (distanceCm > 295) return { code: 1, label: "Very Low Water" };
  if (distanceCm >= 270 && distanceCm <= 295) return { code: 2, label: "Low Water Level" };
  if (distanceCm >= 150 && distanceCm < 270) return { code: 3, label: "Normal Water Level" };
  if (distanceCm >= 70 && distanceCm < 150) return { code: 4, label: "High Water Level" };
  if (distanceCm >= 20 && distanceCm < 70) return { code: 5, label: "Very High Water Level" };
  return { code: 6, label: "Overflow of Water" };
}

const filterState = new Map();
function filtered(sensorId, rawCm) {
  let s = filterState.get(sensorId);
  if (!s) { s = { win: [] }; filterState.set(sensorId, s); }
  s.win.push(rawCm);
  if (s.win.length > CFG.medianN) s.win.shift();
  return median(s.win);
}

const latest = { [CFG.s1]: null, [CFG.s2]: null };
const latestTime = { [CFG.s1]: 0, [CFG.s2]: 0 };
const latestWL = { [CFG.s1]: { code: null, label: null }, [CFG.s2]: { code: null, label: null } };

function freshPairAvailable() {
  if (!Number.isFinite(latest[CFG.s1]) || !Number.isFinite(latest[CFG.s2])) return false;
  const age1 = (Date.now() - latestTime[CFG.s1]) / 1000;
  const age2 = (Date.now() - latestTime[CFG.s2]) / 1000;
  return age1 <= CFG.pairWindowSec && age2 <= CFG.pairWindowSec;
}

function computeSegmentBlocked(d1, d2) {
  const diff = Math.abs(d1 - d2);
  const isBlocked = d1 < CFG.blockCm || d2 < CFG.blockCm;
  const isWarn = d1 < CFG.warnCm || d2 < CFG.warnCm;
  return { isBlocked, isWarn, diff };
}

// ───────────────────────── WRITE POINTS ─────────────────────────
function writeSensorPoint(sensorId, rawCm, filtCm, wl) {
  const now = new Date();

  const p = new Point(CFG.measSensor)
    .tag("sensor_id", sensorId)
    .tag("segment_id", CFG.segmentId)
    .tag("location", CFG.location)
    .tag("sensor_location", SENSOR_LOC[sensorId] || "unknown")
    .floatField("distance_cm", rawCm)
    .floatField("distance_filt_cm", filtCm)
    .intField("water_level_code", wl.code)
    .stringField("water_level_label", wl.label)
    .timestamp(now);

  writeApi.writePoint(p);
}

function writeSegmentPoint(isBlocked, isWarn, d1, d2, diff) {
  const now = new Date();

  const p = new Point(CFG.measSegment)
    .tag("segment_id", CFG.segmentId)
    .tag("location", CFG.location)
    .tag("s1_id", CFG.s1)
    .tag("s2_id", CFG.s2)
    .tag("s1_location", SENSOR_LOC[CFG.s1] || "unknown")
    .tag("s2_location", SENSOR_LOC[CFG.s2] || "unknown")
    .booleanField("is_blocked", isBlocked)
    .booleanField("is_warn", isWarn)
    .floatField("s1_cm", d1)
    .floatField("s2_cm", d2)
    .floatField("diff_cm", diff)
    .timestamp(now);

  writeApi.writePoint(p);
}

// ───────────────────────── MQTT (TLS VERIFIED) ─────────────────────────
const client = mqtt.connect(CFG.mqttUrl, {
  clientId: `drainage-ingest-${Math.random().toString(16).slice(2)}`,
  username: CFG.mqttUser,
  password: CFG.mqttPass,

  clean: true,
  connectTimeout: 10_000,
  reconnectPeriod: 2_000,
  keepalive: 30,

  // ✅ TLS: verify broker certificate using ISRG Root X1
  ca: MQTT_CA_PEM,
  rejectUnauthorized: true,
});

client.on("connect", () => {
  console.log("✅ MQTT connected (TLS verified):", CFG.mqttUrl);
  client.subscribe(CFG.mqttTopic, { qos: 1 }, (err) => {
    if (err) console.error("❌ Subscribe error:", err);
    else console.log("📡 Subscribed:", CFG.mqttTopic);
  });
});

client.on("message", (topic, buf) => {
  let msg;
  try { msg = JSON.parse(buf.toString("utf8")); }
  catch { console.warn("⚠️ Bad JSON:", buf.toString("utf8")); return; }

  const sensorId = String(msg.sensor_id || "").trim();
  const rawCm = Number(msg.distance_cm);

  if (!sensorId || !Number.isFinite(rawCm)) return;
  if (rawCm < CFG.minCm || rawCm > CFG.maxCm) return;

  if (sensorId !== CFG.s1 && sensorId !== CFG.s2) {
    console.warn("⚠️ Unknown sensor:", sensorId, "topic:", topic);
    return;
  }

  const filtCm = filtered(sensorId, rawCm);
  const wl = classifyWaterLevel(filtCm);

  writeSensorPoint(sensorId, rawCm, filtCm, wl);

  latest[sensorId] = filtCm;
  latestTime[sensorId] = Date.now();
  latestWL[sensorId] = wl;

  if (freshPairAvailable()) {
    const d1 = latest[CFG.s1];
    const d2 = latest[CFG.s2];
    const { isBlocked, isWarn, diff } = computeSegmentBlocked(d1, d2);

    writeSegmentPoint(isBlocked, isWarn, d1, d2, diff);

    console.log("📥 SEGMENT", {
      segment_id: CFG.segmentId,
      time_utc: new Date().toISOString(),
      segment_location: CFG.location,

      sensor_1: {
        sensor_id: CFG.s1,
        location: SENSOR_LOC[CFG.s1] || "unknown",
        distance_filt_cm: Number(d1.toFixed(2)),
        water_level_code: latestWL[CFG.s1]?.code ?? null,
        water_level_label: latestWL[CFG.s1]?.label ?? null,
      },

      sensor_2: {
        sensor_id: CFG.s2,
        location: SENSOR_LOC[CFG.s2] || "unknown",
        distance_filt_cm: Number(d2.toFixed(2)),
        water_level_code: latestWL[CFG.s2]?.code ?? null,
        water_level_label: latestWL[CFG.s2]?.label ?? null,
      },

      diff_cm: Number(diff.toFixed(2)),
      blocked_between_s1_s2: isBlocked,
      warning_level: isWarn,
    });
  }
});

client.on("reconnect", () => console.log("… MQTT reconnecting"));
client.on("close", () => console.log("… MQTT connection closed"));
client.on("error", (e) => console.error("❌ MQTT error:", e?.message || e));

// ───────────────────────── Graceful shutdown ─────────────────────────
async function shutdown(code = 0) {
  console.log("\n🧹 Shutting down...");
  try { client.end(true); } catch { }
  try { await writeApi.close(); } catch { }
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (e) => { console.error("❌ Uncaught exception:", e); shutdown(1); });
process.on("unhandledRejection", (e) => { console.error("❌ Unhandled rejection:", e); shutdown(1); });
