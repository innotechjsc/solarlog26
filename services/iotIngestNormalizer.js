/**
 * Chuẩn hoá body ingest HTTP / MQTT theo api/solar_logger_payload_desc.md:
 * - Envelope §1 + legacy data.system + G1 telemetry slices
 */

const { parseIngestTimestamp } = require('./iotTimestamp');
const {
  buildTelemetrySliceData,
  detectSliceKindFromPayload,
  stripEnvelopeKeys
} = require('./iotTelemetrySlices');

const FLAT_INVERTER_HINT_KEYS = [
  'total_ac_output_power_active',
  'inverter_status',
  'rated_power_w',
  'inverter_types',
  'cumulative_production_active',
  'daily_production_active'
];

function isFlatInverterTelemetry(obj) {
  const o = stripEnvelopeKeys(obj);
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  let hits = 0;
  for (const k of FLAT_INVERTER_HINT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(o, k)) hits++;
  }
  return hits >= 2;
}

function buildDataFromFlatInverter(flat) {
  const o = stripEnvelopeKeys(flat);
  const p = Number(o.total_ac_output_power_active);
  const system = {
    total_ac_active_power_w: Number.isFinite(p) ? p : undefined,
    online_inverters: 1,
    total_inverters: 1
  };
  return { system, inverters: [{ ...o, _iot_slice: 'telemetry/inverter' }] };
}

function deriveSystemFromInverters(inverters) {
  const n = inverters.length;
  let sumW = 0;
  let online = 0;
  for (const inv of inverters) {
    const w =
      inv.ac_measurements?.inverter_ac_bus_active_power_w ??
      inv.total_ac_output_power_active;
    if (typeof w === 'number' && Number.isFinite(w)) sumW += w;
    if (inv.quality?.device_online !== false) online++;
  }
  return {
    total_ac_active_power_w: sumW > 0 ? sumW : undefined,
    online_inverters: online > 0 ? online : n,
    total_inverters: n
  };
}

/**
 * @param {object} body - req.body hoặc JSON từ MQTT
 * @param {{ site_id?: string, device_id?: string, kind?: string, telemetry_kind?: string }=} topicMeta
 * @returns {{ ok: true, value: object } | { ok: false, errors: string[] }}
 */
function normalizeIngestBody(body, topicMeta = {}) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  const device_id =
    body.device_id ||
    body.logger_id ||
    body.payload?.device_id ||
    body.payload?.logger_id ||
    topicMeta.device_id;

  if (!device_id || String(device_id).trim() === '') {
    errors.push('device_id or logger_id is required');
  }

  let schema_version = body.schema_version;
  if (!schema_version && body.payload?.schema_version) {
    schema_version = body.payload.schema_version;
  }
  if (!schema_version && body.payload_type) {
    schema_version = '1.0.0';
  }

  const { date: timestampDate, unixSec: timestampUnixSec } = parseIngestTimestamp(
    body.timestamp ?? body.payload?.timestamp
  );
  if (!timestampDate || timestampUnixSec == null) {
    errors.push('timestamp is required (Unix seconds, ms, or ISO 8601)');
  }

  const hasLegacyData =
    body.data && typeof body.data === 'object' && body.data.system != null && typeof body.data.system === 'object';
  const envelopePayload =
    body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload) ? body.payload : null;
  const plForSlice = envelopePayload || (!hasLegacyData ? body : null);

  let data = null;

  if (body.data && typeof body.data === 'object') {
    if (body.data.system != null && typeof body.data.system === 'object') {
      data = body.data;
    } else if (Array.isArray(body.data.inverters) && body.data.inverters.length > 0) {
      data = {
        system: deriveSystemFromInverters(body.data.inverters),
        inverters: body.data.inverters
      };
    }
  }

  if (!data && plForSlice && typeof plForSlice === 'object') {
    const pl = plForSlice;
    if (pl.data && typeof pl.data === 'object' && pl.data.system != null) {
      data = pl.data;
    } else if (
      pl.data &&
      typeof pl.data === 'object' &&
      Array.isArray(pl.data.inverters) &&
      pl.data.inverters.length > 0
    ) {
      data = {
        system: deriveSystemFromInverters(pl.data.inverters),
        inverters: pl.data.inverters
      };
    } else if (pl.system != null && typeof pl.system === 'object') {
      data = { system: pl.system, inverters: pl.inverters || [] };
    } else if (isFlatInverterTelemetry(pl)) {
      data = buildDataFromFlatInverter(pl);
    } else {
      const tk = topicMeta.kind || topicMeta.telemetry_kind;
      if (tk) {
        data = buildTelemetrySliceData(tk, pl);
      } else {
        const sk = detectSliceKindFromPayload(stripEnvelopeKeys(pl));
        if (sk) data = buildTelemetrySliceData(sk, pl);
      }
    }
  }

  if (!data || data.system == null || typeof data.system !== 'object') {
    errors.push(
      'Cannot derive data.system: use legacy data.{system,inverters}, envelope payload (uploader or slice), or flat telemetry/inverter fields'
    );
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  let site_id = body.site_id || body.payload?.site_id || topicMeta.site_id;
  if (site_id != null) site_id = String(site_id).trim() || undefined;

  let seq = body.sequence ?? body.payload?.sequence;
  if (typeof seq === 'string' && seq.trim() !== '' && !Number.isNaN(Number(seq))) {
    seq = Number(seq);
  }
  const sequence = typeof seq === 'number' && !Number.isNaN(seq) ? seq : undefined;

  let payload_type = body.payload_type || body.payload?.payload_type;
  if (payload_type != null) payload_type = String(payload_type).trim() || undefined;

  const timezone = body.timezone || body.payload?.timezone || 'Asia/Ho_Chi_Minh';
  const version = body.version || body.payload?.version;
  const fw_version = body.fw_version || body.payload?.fw_version;
  const alarms = Array.isArray(body.alarms) ? body.alarms : undefined;

  const value = {
    device_id: String(device_id).trim(),
    site_id,
    timezone,
    version,
    fw_version,
    schema_version,
    data,
    alarms,
    sequence,
    payload_type,
    timestampDate,
    timestampUnixSec,
    g_category: 'G1'
  };

  return { ok: true, value };
}

module.exports = {
  normalizeIngestBody,
  parseIngestTimestamp,
  isFlatInverterTelemetry,
  buildDataFromFlatInverter
};
