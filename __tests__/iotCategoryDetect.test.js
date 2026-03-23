const { detectGCategory } = require('../services/iotCategoryDetect');

describe('iotCategoryDetect', () => {
  test('legacy uploader → G1', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        data: { system: { total_ac_power: 1 }, inverters: [] }
      })
    ).toBe('G1');
  });

  test('G2 daily_energy report', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload: { report_type: 'daily_energy', report_date: '2025-03-06' }
      })
    ).toBe('G2');
  });

  test('G9 metering interval', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload: { metering_type: 'interval', meter_serial: 'M1' }
      })
    ).toBe('G9');
  });

  test('G8 sync batch', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload: { batch_id: 'b1', batch_index: 1, batch_total: 3, records: [] }
      })
    ).toBe('G8');
  });

  test('G4 event', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload_type: 'event',
        payload: { event_type: 'fault_detected', severity: 'warning' }
      })
    ).toBe('G4');
  });

  test('G3 heartbeat', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload_type: 'heartbeat',
        payload: { logger: { online: true, uptime_s: 3600 } }
      })
    ).toBe('G3');
  });

  test('G7 OTA progress', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload: { command_id: 'c1', stage: 'downloading', progress_pct: 10 }
      })
    ).toBe('G7');
  });

  test('G5 dispatch response', () => {
    expect(
      detectGCategory({
        device_id: 'D',
        timestamp: 1000,
        payload: { command_id: 'c1', response_type: 'ack', status: 'success' }
      })
    ).toBe('G5');
  });
});
