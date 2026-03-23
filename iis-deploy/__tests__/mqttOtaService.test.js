const EventEmitter = require('events');

function setupService({ connected = true } = {}) {
  jest.resetModules();

  const client = new EventEmitter();
  client.connected = connected;
  client.publish = jest.fn((topic, message, opts, cb) => cb && cb(null));
  client.subscribe = jest.fn((topic, opts, cb) => cb && cb(null));
  client.end = jest.fn();

  const connect = jest.fn(() => client);
  const findOneAndUpdate = jest.fn().mockResolvedValue(null);

  jest.doMock('mqtt', () => ({ connect }));
  jest.doMock('../models/Device', () => ({ findOneAndUpdate }));

  const service = require('../services/mqttOtaService');
  return { service, client, connect, findOneAndUpdate };
}

describe('mqttOtaService', () => {
  test('publishUpdateCommand publishes OTA command payload with new fields', async () => {
    const { service, client } = setupService({ connected: true });

    const result = await service.publishUpdateCommand('SL-001', {
      url: 'https://fw.example/1.2.3.bin',
      version: '1.2.3',
      checksum_sha256: 'abc123',
      command_id: 'cmd-1',
      size_bytes: 1024,
      reboot_after: true,
      rollback_on_failure: false
    });

    expect(result.success).toBe(true);
    expect(client.publish).toHaveBeenCalledTimes(1);
    const [topic, rawPayload, opts] = client.publish.mock.calls[0];
    expect(topic).toBe('ota/cm4/SL-001/command');
    expect(opts).toEqual({ qos: 1 });
    const payload = JSON.parse(rawPayload);
    expect(payload).toMatchObject({
      action: 'update',
      url: 'https://fw.example/1.2.3.bin',
      version: '1.2.3',
      command_id: 'cmd-1',
      checksum: 'sha256:abc123',
      size_bytes: 1024,
      reboot_after: true,
      rollback_on_failure: false
    });
  });

  test('publishRelease publishes legacy broadcast payload', async () => {
    const { service, client } = setupService({ connected: true });

    const result = await service.publishRelease({
      version: '1.0.0',
      url: 'https://fw.example/1.0.0.bin',
      checksum_sha256: 'deadbeef',
      size: 512
    });

    expect(result.success).toBe(true);
    expect(client.publish).toHaveBeenCalledTimes(1);
    const [topic, rawPayload, opts] = client.publish.mock.calls[0];
    expect(topic).toBe('ota/release');
    expect(opts).toEqual({ qos: 1 });
    const payload = JSON.parse(rawPayload);
    expect(payload.version).toBe('1.0.0');
    expect(payload.size).toBe(512);
    expect(payload.url).toBe('https://fw.example/1.0.0.bin');
  });

  test('subscribeOtaStatusTopics subscribes wildcard topics and persists progress/result', async () => {
    const { service, client, findOneAndUpdate } = setupService({ connected: true });
    service.subscribeOtaStatusTopics();

    expect(client.subscribe).toHaveBeenCalledWith('ota/cm4/+/progress', { qos: 1 }, expect.any(Function));
    expect(client.subscribe).toHaveBeenCalledWith('ota/cm4/+/result', { qos: 1 }, expect.any(Function));

    client.emit(
      'message',
      'ota/cm4/SL-001/progress',
      Buffer.from(JSON.stringify({ command_id: 'cmd-a', stage: 'downloading', progress_pct: 30 }))
    );
    client.emit(
      'message',
      'ota/cm4/SL-001/result',
      Buffer.from(JSON.stringify({ command_id: 'cmd-a', status: 'success', version: '1.2.3', rebooted: true }))
    );

    await new Promise((r) => setImmediate(r));

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { device_id: 'SL-001' },
      {
        $set: expect.objectContaining({
          'ota_status.command_id': 'cmd-a',
          'ota_status.progress': expect.objectContaining({
            stage: 'downloading',
            progress_pct: 30
          })
        })
      },
      { upsert: false }
    );

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { device_id: 'SL-001' },
      {
        $set: expect.objectContaining({
          'ota_status.command_id': 'cmd-a',
          'ota_status.result': expect.objectContaining({
            status: 'success',
            version: '1.2.3',
            rebooted: true
          })
        })
      },
      { upsert: false }
    );
  });
});
