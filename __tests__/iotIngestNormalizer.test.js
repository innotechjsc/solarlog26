const { normalizeIngestBody } = require('../services/iotIngestNormalizer');

describe('iotIngestNormalizer', () => {
  test('legacy Unix timestamp + data.system', () => {
    const n = normalizeIngestBody({
      device_id: 'D1',
      timestamp: 1703761800,
      data: {
        system: { total_ac_power: 1 },
        inverters: []
      }
    });
    expect(n.ok).toBe(true);
    expect(n.value.device_id).toBe('D1');
    expect(n.value.timestampUnixSec).toBe(1703761800);
    expect(n.value.data.system.total_ac_power).toBe(1);
  });

  test('ISO timestamp + envelope payload flat inverter telemetry', () => {
    const n = normalizeIngestBody({
      device_id: 'solar-logger-test',
      site_id: 'site-hcm-001',
      timestamp: '2026-03-18T09:22:54.000Z',
      timezone: 'Asia/Ho_Chi_Minh',
      schema_version: '1.0.0',
      payload_type: 'telemetry',
      sequence: 1,
      payload: {
        rated_power_w: 5000,
        total_ac_output_power_active: 1157.4,
        inverter_status: 'Normal'
      }
    });
    expect(n.ok).toBe(true);
    expect(n.value.schema_version).toBe('1.0.0');
    expect(n.value.sequence).toBe(1);
    expect(n.value.data.system.total_ac_active_power_w).toBe(1157.4);
    expect(n.value.data.inverters[0].rated_power_w).toBe(5000);
  });

  test('device_id can come from payload.device_id', () => {
    const n = normalizeIngestBody({
      timestamp: 1000,
      payload: {
        device_id: 'from-payload',
        rated_power_w: 100,
        total_ac_output_power_active: 50,
        inverter_status: 'ok'
      },
      payload_type: 'telemetry'
    });
    expect(n.ok).toBe(true);
    expect(n.value.device_id).toBe('from-payload');
  });

  test('envelope payload.data with inverters only derives system', () => {
    const n = normalizeIngestBody({
      device_id: 'D-env',
      timestamp: 1703761800,
      schema_version: '1.0.0',
      payload: {
        data: {
          inverters: [
            {
              ac_measurements: { inverter_ac_bus_active_power_w: 100 },
              quality: { device_online: true }
            }
          ]
        }
      }
    });
    expect(n.ok).toBe(true);
    expect(n.value.data.system.total_ac_active_power_w).toBe(100);
    expect(n.value.data.inverters).toHaveLength(1);
  });

  test('G1 flat grid telemetry slice (§3.1)', () => {
    const n = normalizeIngestBody({
      device_id: 'g-grid',
      site_id: 'site-1',
      timestamp: 1703761800,
      schema_version: '1.0.0',
      payload_type: 'telemetry',
      grid_status: 'Selling energy',
      total_grid_power: 1200
    });
    expect(n.ok).toBe(true);
    expect(n.value.data.system._telemetry_slice).toBe('telemetry/grid');
    expect(n.value.g_category).toBe('G1');
  });

  test('topicMeta supplies device_id and site_id', () => {
    const n = normalizeIngestBody(
      {
        timestamp: 1000,
        payload: {
          rated_power_w: 100,
          total_ac_output_power_active: 50,
          inverter_status: 'ok'
        },
        payload_type: 'telemetry'
      },
      { device_id: 'from-topic', site_id: 'site-x' }
    );
    expect(n.ok).toBe(true);
    expect(n.value.device_id).toBe('from-topic');
    expect(n.value.site_id).toBe('site-x');
  });
});
