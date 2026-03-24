/**
 * MQTT OTA Service
 * - Spec (mqtt_topics.pdf): publish command to ota/cm4/<device_id>/command with payload
 *   {"action": "update", "url", "version", "checksum" (optional)}
 * - Legacy: publish to ota/release (broadcast) with custom payload
 * Requires: npm install mqtt
 * Env: MQTT_BROKER_URL, MQTT_OTA_TOPIC (legacy), MQTT_OTA_TOPIC_PREFIX, MQTT_USERNAME, MQTT_PASSWORD
 *      MQTT_OTA_SUBSCRIBE_STATUS — `0`/`false` tắt subscribe progress/result (mặc định bật)
 * Subscribe: <prefix>/<device_id>/progress | .../result (G7, api/solar_logger_payload_desc.md)
 */
const crypto = require('crypto');
const Device = require('../models/Device');
const { buildMqttClientOptions } = require('./mqttClientOptions');

let mqttClient = null;
const MQTT_TOPIC = process.env.MQTT_OTA_TOPIC || 'ota/release';
const MQTT_OTA_TOPIC_PREFIX = process.env.MQTT_OTA_TOPIC_PREFIX || 'ota/cm4';
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_OTA_SUBSCRIBE_STATUS = !['0', 'false', 'no'].includes(
  String(process.env.MQTT_OTA_SUBSCRIBE_STATUS || '').toLowerCase()
);

/** Topic cho command gửi đến 1 device (device subscribe topic này để nhận lệnh) */
function getCommandTopic(deviceId) {
  return `${MQTT_OTA_TOPIC_PREFIX}/${deviceId}/command`;
}

function getClient() {
  if (mqttClient && mqttClient.connected) return mqttClient;
  try {
    const mqtt = require('mqtt');
    const opts = buildMqttClientOptions({
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      keepalive: 60
    }, MQTT_BROKER_URL);
    mqttClient = mqtt.connect(MQTT_BROKER_URL, opts);
    mqttClient.on('error', (err) => console.error('[MQTT OTA] Client error:', err.message));
    mqttClient.on('close', () => {});
    mqttClient.on('connect', () => console.log('[MQTT OTA] Connected to', MQTT_BROKER_URL));
    return mqttClient;
  } catch (err) {
    console.error('[MQTT OTA] mqtt module not installed or broker unreachable:', err.message);
    return null;
  }
}

/**
 * Publish command "update" đến 1 device theo spec mqtt_topics.pdf
 * Topic: ota/cm4/<device_id>/command, QoS 1
 * Payload: { "action": "update", "url", "version", "checksum" (optional) }
 * @param {string} deviceId - VD: SL-2025-0002
 * @param {Object} release - { url, version, checksum_sha256?, command_id?, size_bytes?, reboot_after?, rollback_on_failure? }
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function publishUpdateCommand(deviceId, release) {
  const client = getClient();
  if (!client) {
    return { success: false, message: 'MQTT client not available. Install "mqtt" and set MQTT_BROKER_URL.' };
  }
  const topic = getCommandTopic(deviceId);
  const payload = {
    action: 'update',
    url: release.url,
    version: release.version,
    command_id: release.command_id || crypto.randomUUID()
  };
  if (release.checksum_sha256) {
    payload.checksum = release.checksum_sha256.startsWith('sha256:') ? release.checksum_sha256 : `sha256:${release.checksum_sha256}`;
  }
  const sz = release.size_bytes != null ? release.size_bytes : release.size;
  if (sz != null && !Number.isNaN(Number(sz))) {
    payload.size_bytes = Number(sz);
  }
  if (release.reboot_after !== undefined) {
    payload.reboot_after = !!release.reboot_after;
  }
  if (release.rollback_on_failure !== undefined) {
    payload.rollback_on_failure = !!release.rollback_on_failure;
  }
  const message = JSON.stringify(payload);

  return new Promise((resolve) => {
    const done = (err) => {
      if (err) {
        console.error('[MQTT OTA] Publish command error:', err);
        resolve({ success: false, message: err.message });
      } else {
        console.log('[MQTT OTA] Published update command to', topic, release.version);
        resolve({ success: true });
      }
    };
    if (client.connected) {
      client.publish(topic, message, { qos: 1 }, done);
    } else {
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        if (!client.connected) resolve({ success: false, message: 'MQTT broker connection timeout' });
      }, 8000);
      client.once('connect', () => {
        clearTimeout(timeoutId);
        if (timedOut) return;
        client.publish(topic, message, { qos: 1 }, done);
      });
    }
  });
}

/**
 * Publish lệnh update đến nhiều device (ota/cm4/<device_id>/command mỗi device)
 * @param {string[]} deviceIds
 * @param {Object} release - { url, version, checksum_sha256? }
 * @returns {Promise<{ success: boolean, published: number, failed: number, message?: string }>}
 */
async function publishUpdateToDevices(deviceIds, release) {
  let published = 0;
  let failed = 0;
  for (const deviceId of deviceIds) {
    const result = await publishUpdateCommand(deviceId, release);
    if (result.success) published++; else failed++;
  }
  return {
    success: failed === 0,
    published,
    failed,
    message: failed > 0 ? `${failed} device(s) failed to publish` : undefined
  };
}

/**
 * Publish OTA release payload to ota/release (QoS 1) - legacy broadcast
 * @param {Object} payload - { version, url, checksum_sha256, size, release_notes?, published_at? }
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function publishRelease(payload) {
  const client = getClient();
  if (!client) {
    return { success: false, message: 'MQTT client not available. Install "mqtt" and set MQTT_BROKER_URL.' };
  }

  return new Promise((resolve) => {
    const message = JSON.stringify({
      version: payload.version,
      url: payload.url,
      checksum_sha256: payload.checksum_sha256,
      size: payload.size,
      release_notes: payload.release_notes || '',
      published_at: payload.published_at || new Date().toISOString()
    });

    const done = (err) => {
      if (err) {
        console.error('[MQTT OTA] Publish error:', err);
        resolve({ success: false, message: err.message });
      } else {
        console.log('[MQTT OTA] Published to', MQTT_TOPIC, payload.version);
        resolve({ success: true });
      }
    };

    if (client.connected) {
      client.publish(MQTT_TOPIC, message, { qos: 1 }, done);
    } else {
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        if (!client.connected) {
          resolve({ success: false, message: 'MQTT broker connection timeout' });
        }
      }, 8000);
      client.once('connect', () => {
        clearTimeout(timeoutId);
        if (timedOut) return;
        client.publish(MQTT_TOPIC, message, { qos: 1 }, done);
      });
    }
  });
}

function close() {
  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
  }
}

let otaStatusListenerAttached = false;

async function persistOtaProgress(deviceId, payload) {
  const progress = {
    updated_at: new Date()
  };
  if (payload.stage != null) progress.stage = String(payload.stage);
  if (payload.progress_pct != null) progress.progress_pct = Number(payload.progress_pct);
  if (payload.message != null) progress.message = String(payload.message);
  if (payload.speed_kbps != null) progress.speed_kbps = Number(payload.speed_kbps);
  if (payload.eta_seconds != null) progress.eta_seconds = Number(payload.eta_seconds);

  const $set = { 'ota_status.progress': progress };
  if (payload.command_id) $set['ota_status.command_id'] = String(payload.command_id);

  await Device.findOneAndUpdate({ device_id: deviceId }, { $set }, { upsert: false });
}

async function persistOtaResult(deviceId, payload) {
  const result = { updated_at: new Date() };
  if (payload.status != null) result.status = String(payload.status);
  if (payload.version != null) result.version = String(payload.version);
  if (payload.previous_version != null) result.previous_version = String(payload.previous_version);
  if (payload.rebooted != null) result.rebooted = Boolean(payload.rebooted);
  if (payload.error_code != null) result.error_code = String(payload.error_code);
  if (payload.error_message != null) result.error_message = String(payload.error_message);
  if (payload.duration_seconds != null) result.duration_seconds = Number(payload.duration_seconds);

  const $set = { 'ota_status.result': result };
  if (payload.command_id) $set['ota_status.command_id'] = String(payload.command_id);

  await Device.findOneAndUpdate({ device_id: deviceId }, { $set }, { upsert: false });
}

/**
 * Subscribe wildcard progress/result để cập nhật Device.ota_status (chạy 1 lần khi server start).
 */
function subscribeOtaStatusTopics() {
  if (!MQTT_OTA_SUBSCRIBE_STATUS || otaStatusListenerAttached) return;
  const client = getClient();
  if (!client) return;
  otaStatusListenerAttached = true;

  const base = MQTT_OTA_TOPIC_PREFIX.replace(/\/$/, '');
  const topics = [`${base}/+/progress`, `${base}/+/result`];

  const onMessage = async (topic, buf) => {
    const parts = topic.split('/').filter(Boolean);
    if (parts.length < 2) return;
    const last = parts[parts.length - 1];
    const deviceId = parts[parts.length - 2];
    if (!deviceId || (last !== 'progress' && last !== 'result')) return;

    let data;
    try {
      data = JSON.parse(buf.toString());
    } catch {
      console.warn('[MQTT OTA] Non-JSON message on', topic);
      return;
    }

    try {
      if (last === 'progress') await persistOtaProgress(deviceId, data);
      else await persistOtaResult(deviceId, data);
    } catch (err) {
      console.error('[MQTT OTA] persist status failed:', err.message);
    }
  };

  client.on('message', onMessage);

  const doSubscribe = () => {
    topics.forEach((t) => {
      client.subscribe(t, { qos: 1 }, (err) => {
        if (err) console.error('[MQTT OTA] Subscribe failed:', t, err.message);
        else console.log('[MQTT OTA] Subscribed', t);
      });
    });
  };

  if (client.connected) doSubscribe();
  else client.once('connect', doSubscribe);
}

module.exports = {
  publishRelease,
  publishUpdateCommand,
  publishUpdateToDevices,
  getCommandTopic,
  close,
  subscribeOtaStatusTopics,
  persistOtaProgress,
  persistOtaResult,
  MQTT_TOPIC,
  MQTT_OTA_TOPIC_PREFIX,
  MQTT_BROKER_URL
};
