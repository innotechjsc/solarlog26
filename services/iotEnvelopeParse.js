/**
 * Envelope §1 api/solar_logger_payload_desc.md + chế độ strict (IOT_ENVELOPE_STRICT).
 */

const { parseIngestTimestamp } = require('./iotTimestamp');

const STRICT = ['1', 'true', 'yes'].includes(String(process.env.IOT_ENVELOPE_STRICT || '').toLowerCase());

function isLegacyUploaderBody(body) {
  return !!(
    body &&
    body.data &&
    typeof body.data === 'object' &&
    body.data.system != null &&
    typeof body.data.system === 'object'
  );
}

/**
 * @returns {{ ok: true, value: object } | { ok: false, errors: string[] }}
 */
function parseEnvelope(body, topicMeta = {}) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  const device_id = String(
    body.device_id ||
      body.logger_id ||
      body.payload?.device_id ||
      body.payload?.logger_id ||
      topicMeta.device_id ||
      ''
  ).trim();

  if (!device_id) errors.push('device_id or logger_id is required');

  const { date: timestampDate, unixSec: timestampUnixSec } = parseIngestTimestamp(
    body.timestamp ?? body.payload?.timestamp
  );
  if (!timestampDate || timestampUnixSec == null) {
    errors.push('timestamp is required (Unix seconds, ms, or ISO 8601)');
  }

  let site_id = body.site_id ?? body.payload?.site_id ?? topicMeta.site_id;
  if (site_id != null) site_id = String(site_id).trim() || undefined;

  let schema_version = body.schema_version ?? body.payload?.schema_version;
  if (schema_version != null) schema_version = String(schema_version).trim() || undefined;

  let payload_type = body.payload_type ?? body.payload?.payload_type;
  if (payload_type != null) payload_type = String(payload_type).trim() || undefined;

  let seq = body.sequence ?? body.payload?.sequence;
  if (typeof seq === 'string' && seq.trim() !== '' && !Number.isNaN(Number(seq))) seq = Number(seq);
  const sequence = typeof seq === 'number' && !Number.isNaN(seq) ? seq : undefined;

  const payload = extractPayloadForStorage(body);

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      device_id,
      site_id,
      timestampDate,
      timestampUnixSec,
      schema_version,
      payload_type,
      sequence,
      payload,
      raw: body
    }
  };
}

/** Nội dung nghiệp vụ: envelope.payload hoặc toàn bộ body (trừ legacy data.*) */
function extractPayloadForStorage(body) {
  if (!body || typeof body !== 'object') return {};
  if (body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)) {
    return body.payload;
  }
  if (isLegacyUploaderBody(body)) return {};
  const o = { ...body };
  delete o.data;
  return o;
}

/**
 * Bắt buộc site_id, schema_version, payload_type theo §1 khi không phải legacy uploader.
 */
function validateStrictEnvelope(envValue, body) {
  const errors = [];
  if (!STRICT) return errors;
  if (isLegacyUploaderBody(body)) return errors;

  if (!envValue.site_id) errors.push('site_id is required (envelope §1, IOT_ENVELOPE_STRICT)');
  if (!envValue.schema_version) errors.push('schema_version is required (envelope §1, IOT_ENVELOPE_STRICT)');
  if (!envValue.payload_type) errors.push('payload_type is required (envelope §1, IOT_ENVELOPE_STRICT)');

  return errors;
}

module.exports = {
  parseEnvelope,
  isLegacyUploaderBody,
  validateStrictEnvelope,
  extractPayloadForStorage,
  STRICT
};
