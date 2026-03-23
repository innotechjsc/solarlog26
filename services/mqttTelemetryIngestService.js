/**
 * Subscribe MQTT telemetry theo quy ước: <root>/<site_id>/<device_id>/telemetry/<kind>
 * (khớp ví dụ topic trong solar_logger_payload_desc.md §10 sync/records[].topic — ví dụ telemetry/grid).
 *
 * Bật: MQTT_TELEMETRY_INGEST_ENABLED=true
 * Env: MQTT_TELEMETRY_ROOT (default solar), MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD
 */
const { processIotIngest } = require('./iotIngestRouter');

let client = null;
let listenerAttached = false;

const ENABLED = ['1', 'true', 'yes'].includes(
  String(process.env.MQTT_TELEMETRY_INGEST_ENABLED || '').toLowerCase()
);
const MQTT_ROOT = (process.env.MQTT_TELEMETRY_ROOT || 'solar').replace(/\/$/, '');
const BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const USER = process.env.MQTT_USERNAME || '';
const PASS = process.env.MQTT_PASSWORD || '';

function defaultSubscribePattern() {
  return `${MQTT_ROOT}/+/+/telemetry/+`;
}

function parseTelemetryTopic(topic) {
  const parts = topic.split('/').filter(Boolean);
  if (parts.length !== 5) return null;
  if (parts[0] !== MQTT_ROOT || parts[3] !== 'telemetry') return null;
  return { site_id: parts[1], device_id: parts[2], kind: parts[4] };
}

function subscribePatterns() {
  const raw = process.env.MQTT_TELEMETRY_SUBSCRIBE_TOPICS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [defaultSubscribePattern()];
}

function getClient() {
  if (client && client.connected) return client;
  try {
    const mqtt = require('mqtt');
    const opts = { reconnectPeriod: 5000, connectTimeout: 10000, keepalive: 60 };
    if (USER) {
      opts.username = USER;
      opts.password = PASS;
    }
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
      console.warn('[MQTT telemetry] non-JSON', topic);
      return;
    }

    const tmeta = parseTelemetryTopic(topic);
    const topicMeta =
      tmeta ? { site_id: tmeta.site_id, device_id: tmeta.device_id } : {};

    if (body.timestamp == null && body.payload?.timestamp == null) {
      body.timestamp = new Date().toISOString();
    }

    try {
      const out = await processIotIngest(body, topicMeta);
      if (!out.ok) {
        console.warn('[MQTT telemetry] ingest failed:', topic, out.errors);
      }
    } catch (e) {
      console.error('[MQTT telemetry] ingest failed:', e.message);
    }
  };

  c.on('message', onMessage);

  const doSub = () => {
    patterns.forEach((p) => {
      c.subscribe(p, { qos: 1 }, (err) => {
        if (err) console.error('[MQTT telemetry] subscribe failed', p, err.message);
        else console.log('[MQTT telemetry] subscribed', p);
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
  parseTelemetryTopic,
  defaultSubscribePattern,
  MQTT_ROOT,
  ENABLED
};
