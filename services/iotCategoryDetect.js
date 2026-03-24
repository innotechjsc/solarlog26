/**
 * Phân loại nhóm G1–G9 theo api/solar_logger_payload_desc.md (mục lục + từng section).
 * Thứ tự kiểm tra: cụ thể trước, G1 (telemetry mặc định) sau cùng.
 */

/** Phần payload nghiệp vụ: envelope.payload hoặc body phẳng (không có payload lồng) */
function payloadObj(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)) return body.payload;
  if (body.data && body.data.system) return null;
  return body;
}

function detectGCategory(body, topicMeta = {}) {
  /** solar_logger_iot_api.md — ưu tiên topic HTTP/MQTT đã gắn nhãn (tránh G7/G5 lẫn payload). */
  const vk = topicMeta.vpp_ingest_kind;
  if (vk === 'report') return 'G2';
  if (vk === 'status') return 'G3';
  if (vk === 'alarm') return 'G4';
  if (vk === 'dispatch_response') return 'G5';
  if (vk === 'config_ack') return 'G6';
  if (vk === 'ota_progress' || vk === 'ota_result') return 'G7';
  if (vk === 'sync_data') return 'G8';
  if (vk === 'metering') return 'G9';

  const pl = payloadObj(body);
  if (!pl) return 'G1';
  const pt = body?.payload_type ?? pl?.payload_type;

  if (pl?.metering_type) {
    const m = String(pl.metering_type);
    if (['interval', 'daily_index', 'audit'].includes(m)) return 'G9';
  }

  if (pl?.batch_id != null && pl?.batch_total != null && Array.isArray(pl.records)) return 'G8';

  if (pl?.report_type) {
    const r = String(pl.report_type);
    if (
      ['daily_energy', 'settlement', 'availability', 'performance', 'monthly'].some(
        (x) => r === x || r.includes(x)
      )
    ) {
      return 'G2';
    }
  }

  if (pl?.stage && ['downloading', 'verifying', 'installing', 'rebooting'].includes(String(pl.stage))) {
    return 'G7';
  }

  if (
    pl?.command_id &&
    ['success', 'failed', 'rollback'].includes(String(pl.status || '')) &&
    (pl.version != null || pl.rebooted !== undefined || pl.error_code !== undefined || pl.previous_version != null)
  ) {
    return 'G7';
  }

  if (pl?.response_type && pl?.command_id) return 'G5';

  if (pl?.event_type || pt === 'event' || body?.payload_type === 'event') return 'G4';

  if (pt === 'config' || body?.payload_type === 'config') return 'G6';

  if (body?.payload_type === 'control' || (pl?.command_id && pl?.action)) return 'G5';

  if (body?.payload_type === 'heartbeat' || (pl?.logger && typeof pl.logger === 'object')) return 'G3';

  if (topicMeta.kind || topicMeta.telemetry_kind) return 'G1';

  return 'G1';
}

module.exports = { detectGCategory, payloadObj };
