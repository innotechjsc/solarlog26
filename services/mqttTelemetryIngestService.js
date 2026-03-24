/**
 * MQTT ingest — Logger → Cloud (solar_logger_iot_api.md §3 + HTTP D2C §4.1 cùng pipeline).
 *
 * Topic:
 * - Legacy telemetry: `<MQTT_TELEMETRY_ROOT>/<site_id>/<device_id>/telemetry/<kind>`
 * - VPP G1: `vpp/<site_id>/telemetry/<slice>`, `vpp/<site_id>/telemetry/inverter/<inv_id>`
 * - VPP G2–G9 (logger → cloud): report, status, alarm, dispatch/response, config/ack,
 *   ota/progress, ota/result, sync/data, metering
 *
 * Bật: MQTT_TELEMETRY_INGEST_ENABLED=true
 * Env: MQTT_TELEMETRY_SUBSCRIBE_TOPICS — override (comma-separated patterns)
 */
const { processIotIngest } = require('./iotIngestRouter');
const { buildMqttClientOptions } = require('./mqttClientOptions');

let client = null;
let listenerAttached = false;

const ENABLED = ['1', 'true', 'yes'].includes(
  String(process.env.MQTT_TELEMETRY_INGEST_ENABLED || '').toLowerCase()
);
const MQTT_ROOT = (process.env.MQTT_TELEMETRY_ROOT || 'solar').replace(/\/$/, '');
const BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

/** @deprecated Chỉ giữ cho tương thích import cũ. */
function defaultSubscribePattern() {
  return `${MQTT_ROOT}/+/+/telemetry/+`;
}

/**
 * Đăng ký mặc định: legacy + toàn bộ nhánh Logger→Cloud theo spec VPP.
 */
function defaultSubscribePatterns() {
  return [
    `${MQTT_ROOT}/+/+/telemetry/+`,
    'vpp/+/telemetry/+',
    'vpp/+/telemetry/inverter/+',
    'vpp/+/report',
    'vpp/+/status',
    'vpp/+/alarm',
    'vpp/+/metering',
    'vpp/+/dispatch/response',
    'vpp/+/config/ack',
    'vpp/+/ota/progress',
    'vpp/+/ota/result',
    'vpp/+/sync/data'
  ];
}

/**
 * Parse topic → metadata (telemetry | gợi ý G2–G9 cho iotCategoryDetect).
 * @returns {object | null}
 */
function parseIngestTopic(topic) {
  const parts = String(topic || '')
    .split('/')
    .filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length === 5 && parts[0] === MQTT_ROOT && parts[3] === 'telemetry') {
    return {
      site_id: parts[1],
      device_id: parts[2],
      kind: parts[4],
      mode: 'telemetry_legacy'
    };
  }

  if (parts[0] !== 'vpp' || parts.length < 3) return null;

  const site_id = parts[1];

  if (parts[2] === 'telemetry') {
    if (parts[3] === 'inverter' && parts[4]) {
      return { site_id, kind: 'inverter', inv_id: parts[4], mode: 'telemetry_vpp' };
    }
    if (parts.length === 4 && parts[3]) {
      return { site_id, kind: parts[3], mode: 'telemetry_vpp' };
    }
    return null;
  }

  if (parts.length === 3 && parts[2] === 'report') {
    return { site_id, vpp_ingest_kind: 'report', mode: 'ingest' };
  }
  if (parts.length === 3 && parts[2] === 'status') {
    return { site_id, vpp_ingest_kind: 'status', mode: 'ingest' };
  }
  if (parts.length === 3 && parts[2] === 'alarm') {
    return { site_id, vpp_ingest_kind: 'alarm', mode: 'ingest' };
  }
  if (parts.length === 3 && parts[2] === 'metering') {
    return { site_id, vpp_ingest_kind: 'metering', mode: 'ingest' };
  }

  if (parts.length === 4 && parts[2] === 'dispatch' && parts[3] === 'response') {
    return { site_id, vpp_ingest_kind: 'dispatch_response', mode: 'ingest' };
  }
  if (parts.length === 4 && parts[2] === 'config' && parts[3] === 'ack') {
    return { site_id, vpp_ingest_kind: 'config_ack', mode: 'ingest' };
  }
  if (parts.length === 4 && parts[2] === 'ota' && parts[3] === 'progress') {
    return { site_id, vpp_ingest_kind: 'ota_progress', mode: 'ingest' };
  }
  if (parts.length === 4 && parts[2] === 'ota' && parts[3] === 'result') {
    return { site_id, vpp_ingest_kind: 'ota_result', mode: 'ingest' };
  }
  if (parts.length === 4 && parts[2] === 'sync' && parts[3] === 'data') {
    return { site_id, vpp_ingest_kind: 'sync_data', mode: 'ingest' };
  }

  return null;
}

function parseTelemetryTopic(topic) {
  return parseIngestTopic(topic);
}

/** Chuyển kết quả parse → topicMeta cho processIotIngest. */
function topicMetaFromParse(tmeta) {
  if (!tmeta) return {};
  const out = { site_id: tmeta.site_id };
  if (tmeta.device_id) out.device_id = tmeta.device_id;
  if (tmeta.mode === 'telemetry_legacy' || tmeta.mode === 'telemetry_vpp') {
    out.telemetry_kind = tmeta.kind;
    out.kind = tmeta.kind;
  }
  if (tmeta.vpp_ingest_kind) out.vpp_ingest_kind = tmeta.vpp_ingest_kind;
  return out;
}

function mergeInvIdIntoBody(body, invId) {
  if (invId == null || String(invId).trim() === '') return body;
  const id = String(invId).trim();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const next = { ...body };
  const prevPl =
    next.payload && typeof next.payload === 'object' && !Array.isArray(next.payload)
      ? next.payload
      : {};
  next.payload = { ...prevPl, inv_id: id };
  return next;
}

function subscribePatterns() {
  const raw = process.env.MQTT_TELEMETRY_SUBSCRIBE_TOPICS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return defaultSubscribePatterns();
}

function getClient() {
  if (client && client.connected) return client;
  try {
    const mqtt = require('mqtt');
    const opts = buildMqttClientOptions(
      { reconnectPeriod: 5000, connectTimeout: 10000, keepalive: 60 },
      BROKER
    );
    client = mqtt.connect(BROKER, opts);
    client.on('error', (err) => console.error('[MQTT telemetry] error:', err.message));
    client.on('connect', () => console.log('[MQTT telemetry] connected', BROKER));
    return client;
  } catch (e) {
    console.error('[MQTT telemetry]', e.message);
    return null;
  }
}

function subscribeTelemetryTopics() {
  if (!ENABLED || listenerAttached) return;
  const c = getClient();
  if (!c) return;
  listenerAttached = true;

  const patterns = subscribePatterns();

  const onMessage = async (topic, buf) => {
    let body;
    try {
      body = JSON.parse(buf.toString());
    } catch {
      console.warn('[MQTT ingest] non-JSON', topic);
      return;
    }

    const tmeta = parseIngestTopic(topic);
    const topicMeta = topicMetaFromParse(tmeta);

    if (tmeta?.mode === 'telemetry_vpp' && tmeta.inv_id) {
      body = mergeInvIdIntoBody(body, tmeta.inv_id);
    }

    if (body.timestamp == null && body.payload?.timestamp == null) {
      body.timestamp = new Date().toISOString();
    }

    try {
      const out = await processIotIngest(body, topicMeta);
      if (!out.ok) {
        console.warn('[MQTT ingest] failed:', topic, out.errors);
      }
    } catch (e) {
      console.error('[MQTT ingest] failed:', e.message);
    }
  };

  c.on('message', onMessage);

  const doSub = () => {
    patterns.forEach((p) => {
      c.subscribe(p, { qos: 1 }, (err) => {
        if (err) console.error('[MQTT ingest] subscribe failed', p, err.message);
        else console.log('[MQTT ingest] subscribed', p);
      });
    });
  };

  if (c.connected) doSub();
  else c.once('connect', doSub);
}

function close() {
  if (client) {
    client.end(true);
    client = null;
  }
  listenerAttached = false;
}

module.exports = {
  subscribeTelemetryTopics,
  close,
  parseIngestTopic,
  parseTelemetryTopic,
  topicMetaFromParse,
  defaultSubscribePattern,
  defaultSubscribePatterns,
  MQTT_ROOT,
  ENABLED
};
