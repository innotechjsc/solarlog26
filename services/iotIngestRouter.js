/**
 * Định tuyến ingest G1–G9 (api/solar_logger_payload_desc.md) — HTTP + MQTT.
 */

const Device = require('../models/Device');
const { parseEnvelope, isLegacyUploaderBody, validateStrictEnvelope } = require('./iotEnvelopeParse');
const { detectGCategory } = require('./iotCategoryDetect');
const { normalizeIngestBody } = require('./iotIngestNormalizer');
const { ingestDataPoint } = require('./dataIngestService');
const mqttOtaService = require('./mqttOtaService');

const IotEnergyReport = require('../models/IotEnergyReport');
const IotDeviceStatus = require('../models/IotDeviceStatus');
const IotAlarmEvent = require('../models/IotAlarmEvent');
const IotDispatchMessage = require('../models/IotDispatchMessage');
const IotConfigSnapshot = require('../models/IotConfigSnapshot');
const IotSyncBatch = require('../models/IotSyncBatch');
const IotMeteringRecord = require('../models/IotMeteringRecord');

async function applySiteIdFromEnvelope(device_id, site_id) {
  if (!site_id) return;
  const cur = await Device.findOne({ device_id }).select('site_id_cms_locked');
  const $set = { site_id_reported: site_id };
  if (!cur || !cur.site_id_cms_locked) {
    $set.site_id = site_id;
  }
  await Device.findOneAndUpdate({ device_id }, { $set }, { upsert: true, new: true });
}

/**
 * @param {object} body
 * @param {{ site_id?: string, device_id?: string, kind?: string, telemetry_kind?: string }} topicMeta
 * @returns {Promise<{ ok: true, result: object } | { ok: false, errors: string[] }>}
 */
async function processIotIngest(body, topicMeta = {}) {
  const env = parseEnvelope(body, topicMeta);
  if (!env.ok) return { ok: false, errors: env.errors };

  const strictErr = validateStrictEnvelope(env.value, body);
  if (strictErr.length) return { ok: false, errors: strictErr };

  const cat = detectGCategory(body, topicMeta);
  const v = env.value;
  const pl = v.payload && typeof v.payload === 'object' ? v.payload : {};

  if (cat !== 'G1') {
    await Device.updateDeviceStatus(v.device_id, true);
    await applySiteIdFromEnvelope(v.device_id, v.site_id);
  }

  const server_time = Math.floor(Date.now() / 1000);

  switch (cat) {
    case 'G1': {
      const norm = normalizeIngestBody(body, topicMeta);
      if (!norm.ok) return { ok: false, errors: norm.errors };
      const result = await ingestDataPoint(norm.value);
      return { ok: true, result: { ...result, g_category: 'G1' } };
    }

    case 'G2': {
      await IotEnergyReport.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        report_type: pl.report_type,
        report_date: pl.report_date,
        report_month: pl.report_month,
        generated_at: pl.generated_at ? new Date(pl.generated_at) : undefined,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G2' } };
    }

    case 'G3': {
      await IotDeviceStatus.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G3' } };
    }

    case 'G4': {
      await IotAlarmEvent.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        event_type: pl.event_type,
        severity: pl.severity,
        event_code: pl.event_code,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G4' } };
    }

    case 'G5': {
      const dispatchDirection = pl.action ? 'command' : 'response';
      await IotDispatchMessage.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        command_id: pl.command_id,
        direction: dispatchDirection,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G5' } };
    }

    case 'G6': {
      await IotConfigSnapshot.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G6' } };
    }

    case 'G7': {
      if (pl.stage) {
        await mqttOtaService.persistOtaProgress(v.device_id, pl);
      } else {
        await mqttOtaService.persistOtaResult(v.device_id, pl);
      }
      return { ok: true, result: { server_time, g_category: 'G7' } };
    }

    case 'G8': {
      await IotSyncBatch.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        batch_id: pl.batch_id,
        batch_index: pl.batch_index,
        batch_total: pl.batch_total,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G8' } };
    }

    case 'G9': {
      await IotMeteringRecord.create({
        device_id: v.device_id,
        site_id: v.site_id,
        schema_version: v.schema_version,
        sequence: v.sequence,
        metering_type: pl.metering_type,
        meter_serial: pl.meter_serial,
        payload: pl
      });
      return { ok: true, result: { server_time, g_category: 'G9' } };
    }

    default: {
      const norm = normalizeIngestBody(body, topicMeta);
      if (!norm.ok) return { ok: false, errors: norm.errors };
      const result = await ingestDataPoint(norm.value);
      return { ok: true, result: { ...result, g_category: 'G1' } };
    }
  }
}

module.exports = {
  processIotIngest
};
