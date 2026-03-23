/**
 * G1 — telemetry slices (api/solar_logger_payload_desc.md §3) khi không có data_uploader đầy đủ.
 * Gộp vào DataPoint.system (Mixed) với _telemetry_slice = telemetry/<kind>
 */

const ENVELOPE_KEYS = new Set([
  'device_id',
  'logger_id',
  'site_id',
  'timestamp',
  'schema_version',
  'payload_type',
  'sequence',
  'timezone',
  'version',
  'fw_version',
  'data',
  'alarms',
  'payload'
]);

function stripEnvelopeKeys(o) {
  if (!o || typeof o !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (!ENVELOPE_KEYS.has(k)) out[k] = v;
  }
  return out;
}

function buildTelemetrySliceData(kind, pl) {
  const k = String(kind).replace(/^telemetry\//, '');
  const clean = stripEnvelopeKeys(pl);
  const system = {
    _telemetry_slice: `telemetry/${k}`,
    ...clean
  };
  return { system, inverters: [] };
}

function detectSliceKindFromPayload(pl) {
  if (!pl || typeof pl !== 'object' || Array.isArray(pl)) return null;
  if (Object.prototype.hasOwnProperty.call(pl, 'grid_status') || pl.total_grid_power != null) return 'grid';
  if (pl.battery_mode != null || pl.battery_soc_percent != null || pl.battery_active_power_w != null) return 'bess';
  if (pl.pv_day_energy_kwh != null || pl.pv1_voltage_v != null || pl.pv1_power_w != null) return 'pv';
  if (pl.meter_serial != null && (pl.export_total_kwh != null || pl.import_total_kwh != null)) return 'meter';
  if (pl.ghi_wm2 != null || pl.t_module_c != null || pl.wind_speed_ms != null) return 'weather';
  if (pl.thd_voltage_pct != null || pl.thd_current_pct != null || pl.voltage_unbalance_pct != null) {
    return 'power_quality';
  }
  return null;
}

module.exports = {
  buildTelemetrySliceData,
  detectSliceKindFromPayload,
  stripEnvelopeKeys
};
