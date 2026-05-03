// backend/routes/influxApi.js  (ESM)
import express from "express";
import { InfluxDB } from "@influxdata/influxdb-client";


const router = express.Router();

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;

const MEAS_SENSOR = process.env.MEAS_SENSOR || "drainage_sensor";
const MEAS_SEGMENT = process.env.MEAS_SEGMENT || "drainage_segment";

if (!INFLUX_URL || !INFLUX_TOKEN || !INFLUX_ORG || !INFLUX_BUCKET) {
  throw new Error("Missing env vars: INFLUX_URL / INFLUX_TOKEN / INFLUX_ORG / INFLUX_BUCKET");
}

const influx = new InfluxDB({ 
  url: INFLUX_URL, 
  token: INFLUX_TOKEN,
  timeout: 30000, // 30 seconds timeout to prevent RequestTimedOutError
  transportOptions: {
    rejectUnauthorized: false, // Bypass SSL validation since we might use direct IP
    headers: {
      "Host": "us-east-1-1.aws.cloud2.influxdata.com" // Provide Host header in case we connect via IP
    }
  }
});
const queryApi = influx.getQueryApi(INFLUX_ORG);

function runFlux(flux) {
  return new Promise((resolve, reject) => {
    const rows = [];
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      error(err) {
        reject(err);
      },
      complete() {
        resolve(rows);
      },
    });
  });
}

const toBool01 = (v) => (v === true || v === "true" || v === 1 || v === "1") ? 1 : 0;
const toNum = (v) => (v === null || v === undefined || v === "") ? null : Number(v);

// ✅ Debug sample
router.get("/debug/sample", async (req, res) => {
  const window = req.query.window || "1h";
  const flux = `
from(bucket: "${INFLUX_BUCKET}")
  |> range(start: -${window})
  |> keep(columns: ["_time","_measurement","_field","_value","sensor_id","segment_id","location","project"])
  |> limit(n: 30)
`;
  try {
    const rows = await runFlux(flux);
    res.json({ ok: true, server_time_utc: new Date().toISOString(), rows });
  } catch (e) {
    console.error("❌ debug/sample error:", e);
    res.status(500).json({ ok: false, where: "debug/sample", message: e?.message || String(e) });
  }
});

// ✅ Latest sensors
router.get("/latest/sensors", async (req, res) => {
  const window = req.query.window || "6h";
  const segmentId = req.query.segment_id || "SEG_A";

  const flux = `
from(bucket: "${INFLUX_BUCKET}")
  |> range(start: -${window})
  |> filter(fn: (r) => r._measurement == "${MEAS_SENSOR}")
  |> filter(fn: (r) => r.segment_id == "${segmentId}")
  |> filter(fn: (r) =>
      r._field == "distance_cm" or
      r._field == "distance_filt_cm" or
      r._field == "water_level_code" or
      r._field == "water_level_label"
    )
  |> group(columns: ["location","segment_id","sensor_id","sensor_location","_field"])
  |> last()
  |> keep(columns: ["_time","_value","location","segment_id","sensor_id","sensor_location","_field"])
`;

  try {
    const rows = await runFlux(flux);

    const map = new Map();
    for (const r of rows) {
      const key = `${r.sensor_id}`;
      const obj = map.get(key) || {
        time: r._time,
        location: r.location,              // segment location (road)
        segment_id: r.segment_id,
        sensor_id: r.sensor_id,
        sensor_location: r.sensor_location //  per-sensor location
      };

      if (obj.time < r._time) obj.time = r._time;

      if (r._field === "distance_cm") obj.distance_cm = toNum(r._value);
      if (r._field === "distance_filt_cm") obj.distance_filt_cm = toNum(r._value);
      if (r._field === "water_level_code") obj.water_level_code = toNum(r._value);
      if (r._field === "water_level_label") obj.water_level_label = r._value;

      //  Don't overwrite with undefined
      if (r.sensor_location) obj.sensor_location = r.sensor_location;

      map.set(key, obj);
    }

    const data = [...map.values()].sort((a, b) => (a.sensor_id || "").localeCompare(b.sensor_id || ""));
    res.json({ ok: true, server_time_utc: new Date().toISOString(), data });
  } catch (e) {
    console.error("❌ latest/sensors error:", e);
    res.status(500).json({ ok: false, where: "latest/sensors", message: e?.message || String(e) });
  }
});


// ✅ Latest segment blocked (between sensors) — supports old + new field names
// ✅ Latest segment blocked (between sensors)
router.get("/latest/segment", async (req, res) => {
  const window = req.query.window || "6h";
  const segmentId = req.query.segment_id || "SEG_A";

  const flux = `
from(bucket: "${INFLUX_BUCKET}")
  |> range(start: -${window})
  |> filter(fn: (r) => r._measurement == "${MEAS_SEGMENT}")
  |> filter(fn: (r) => r.segment_id == "${segmentId}")
  |> filter(fn: (r) =>
      r._field == "is_blocked" or
      r._field == "diff_cm" or
      r._field == "s1_cm" or
      r._field == "s2_cm" or
      r._field == "d1_cm" or
      r._field == "d2_cm"
    )
  |> group(columns: ["segment_id","_field"])
  |> last()
  |> keep(columns: ["_time","_value","location","segment_id","_field"])
`;

  try {
    const rows = await runFlux(flux);

    const out = {
      time: null,
      location: null,
      segment_id: segmentId,
      is_blocked: 0,
      diff_cm: null,
      s1_cm: null,
      s2_cm: null,
    };

    for (const r of rows) {
      out.location = r.location || out.location;
      out.time = (!out.time || out.time < r._time) ? r._time : out.time;

      if (r._field === "is_blocked") out.is_blocked = toBool01(r._value);
      if (r._field === "diff_cm") out.diff_cm = toNum(r._value);

      // ✅ accept BOTH naming styles (old + new)
      if (r._field === "s1_cm") out.s1_cm = toNum(r._value);
      if (r._field === "s2_cm") out.s2_cm = toNum(r._value);

      if (r._field === "d1_cm" && out.s1_cm == null) out.s1_cm = toNum(r._value);
      if (r._field === "d2_cm" && out.s2_cm == null) out.s2_cm = toNum(r._value);
    }

    res.json({ ok: true, server_time_utc: new Date().toISOString(), data: out });
  } catch (e) {
    console.error("❌ latest/segment error:", e);
    res.status(500).json({ ok: false, where: "latest/segment", message: e?.message || String(e) });
  }
});


// ✅ Sensor chart series (distance_filt_cm) — supports start/stop OR window
router.get("/series/sensor", async (req, res) => {
  const sensorId = req.query.sensor_id;
  const segmentId = req.query.segment_id || "SEG_A";

  // Prefer absolute range (for paging)
  const start = req.query.start;   // ISO string
  const stop  = req.query.stop;    // ISO string

  // Fallback: relative window
  const window = req.query.window || "24h";

  const every = req.query.every || "5s";
  const field = req.query.field || "distance_filt_cm"; // allow distance_cm too if needed

  if (!sensorId) return res.status(400).json({ ok: false, error: "Missing sensor_id" });

  const isIso = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s);

  if ((start && !isIso(start)) || (stop && !isIso(stop))) {
    return res.status(400).json({ ok: false, error: "start/stop must be ISO datetime" });
  }


  // Build range clause
  const rangeClause = (start && stop)
    ? `|> range(start: time(v: "${start}"), stop: time(v: "${stop}"))`
    : `|> range(start: -${window})`;

  const flux = `
from(bucket: "${INFLUX_BUCKET}")
  ${rangeClause}
  |> filter(fn: (r) => r._measurement == "${MEAS_SENSOR}")
  |> filter(fn: (r) => r.segment_id == "${segmentId}" and r.sensor_id == "${sensorId}")
  |> filter(fn: (r) => r._field == "${field}")
  |> aggregateWindow(every: ${every}, fn: last, createEmpty: false)
  |> keep(columns: ["_time","_value"])
  |> sort(columns: ["_time"])
`;

  try {
    const rows = await runFlux(flux);
    const points = rows.map(r => ({ time: r._time, value: toNum(r._value) }));
    res.json({
      ok: true,
      server_time_utc: new Date().toISOString(),
      sensor_id: sensorId,
      segment_id: segmentId,
      field,
      start: start || null,
      stop: stop || null,
      window: (!start || !stop) ? window : null,
      every,
      points
    });
  } catch (e) {
    console.error("❌ series/sensor error:", e);
    res.status(500).json({ ok: false, where: "series/sensor", message: e?.message || String(e) });
  }
});



// ✅ Segment chart series (diff_cm / is_blocked / s1_cm / s2_cm) - supports start/stop OR window
router.get("/series/segment", async (req, res) => {
  const segmentId = req.query.segment_id || "SEG_A";

  const start = req.query.start;
  const stop  = req.query.stop;

  const window = req.query.window || "24h";
  const every = req.query.every || "5s";

  // field can be diff_cm / is_blocked / s1_cm / s2_cm
  const field = req.query.field || "diff_cm";

  const isIso = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}T/.test(s);

  if ((start && !isIso(start)) || (stop && !isIso(stop))) {
    return res.status(400).json({ ok: false, error: "start/stop must be ISO datetime" });
  }


  const rangeClause = (start && stop)
    ? `|> range(start: time(v: "${start}"), stop: time(v: "${stop}"))`
    : `|> range(start: -${window})`;

  const flux = `
from(bucket: "${INFLUX_BUCKET}")
  ${rangeClause}
  |> filter(fn: (r) => r._measurement == "${MEAS_SEGMENT}")
  |> filter(fn: (r) => r.segment_id == "${segmentId}")
  |> filter(fn: (r) => r._field == "${field}")
  |> aggregateWindow(every: ${every}, fn: last, createEmpty: false)
  |> keep(columns: ["_time","_value"])
  |> sort(columns: ["_time"])
`;

  try {
    const rows = await runFlux(flux);
    const points = rows.map(r => ({
      time: r._time,
      value: field === "is_blocked" ? toBool01(r._value) : toNum(r._value),
    }));

    res.json({
      ok: true,
      server_time_utc: new Date().toISOString(),
      segment_id: segmentId,
      field,
      start: start || null,
      stop: stop || null,
      window: (!start || !stop) ? window : null,
      every,
      points,
    });
  } catch (e) {
    console.error("❌ series/segment error:", e);
    res.status(500).json({ ok: false, where: "series/segment", message: e?.message || String(e) });
  }
});

export default router;
