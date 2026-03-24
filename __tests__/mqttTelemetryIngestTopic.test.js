/**
 * solar_logger_iot_api.md — MQTT topic shapes (Logger → Cloud)
 */
describe('mqttTelemetryIngestService.parseIngestTopic', () => {
  const origRoot = process.env.MQTT_TELEMETRY_ROOT;
  beforeAll(() => {
    process.env.MQTT_TELEMETRY_ROOT = 'solar';
    jest.resetModules();
  });
  afterAll(() => {
    process.env.MQTT_TELEMETRY_ROOT = origRoot;
    jest.resetModules();
  });

  let parseIngestTopic;
  let topicMetaFromParse;
  beforeEach(() => {
    jest.resetModules();
    process.env.MQTT_TELEMETRY_ROOT = 'solar';
    ({
      parseIngestTopic,
      topicMetaFromParse
    } = require('../services/mqttTelemetryIngestService'));
  });

  it('parses VPP grid topic (device_id in envelope only)', () => {
    expect(parseIngestTopic('vpp/site-a/telemetry/grid')).toEqual({
      site_id: 'site-a',
      kind: 'grid',
      mode: 'telemetry_vpp'
    });
    expect(topicMetaFromParse(parseIngestTopic('vpp/site-a/telemetry/grid'))).toEqual({
      site_id: 'site-a',
      telemetry_kind: 'grid',
      kind: 'grid'
    });
  });

  it('parses VPP inverter topic and inv_id', () => {
    expect(parseIngestTopic('vpp/site-a/telemetry/inverter/inv-12')).toEqual({
      site_id: 'site-a',
      kind: 'inverter',
      inv_id: 'inv-12',
      mode: 'telemetry_vpp'
    });
  });

  it('parses VPP report → vpp_ingest_kind', () => {
    const t = parseIngestTopic('vpp/site-a/report');
    expect(t).toEqual({ site_id: 'site-a', vpp_ingest_kind: 'report', mode: 'ingest' });
    expect(topicMetaFromParse(t)).toEqual({
      site_id: 'site-a',
      vpp_ingest_kind: 'report'
    });
  });

  it('parses VPP sync/data', () => {
    expect(parseIngestTopic('vpp/site-a/sync/data')).toEqual({
      site_id: 'site-a',
      vpp_ingest_kind: 'sync_data',
      mode: 'ingest'
    });
  });

  it('parses legacy solar topic', () => {
    expect(parseIngestTopic('solar/site-a/logger-1/telemetry/pv')).toEqual({
      site_id: 'site-a',
      device_id: 'logger-1',
      kind: 'pv',
      mode: 'telemetry_legacy'
    });
  });

  it('returns null for unknown topic', () => {
    expect(parseIngestTopic('other/a/b/c')).toBeNull();
  });
});
