const DataPoint = require('../models/DataPoint');
const Device = require('../models/Device');
const Alarm = require('../models/Alarm');
const Notification = require('../models/Notification');
const aggregationService = require('./aggregationService');
const websocketService = require('./websocketService');

/**
 * Lưu DataPoint + alarm + aggregation — dùng chung HTTP và MQTT.
 * @param {object} params - Kết quả normalizeIngestBody(...).value
 */
async function ingestDataPoint(params) {
  const {
    device_id,
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
    timestampUnixSec
  } = params;

  const timestamp = timestampUnixSec;
  const isNewSchema = schema_version && parseFloat(schema_version) >= 0.9;

  await Device.updateDeviceStatus(device_id, true);

  if (site_id) {
    const cur = await Device.findOne({ device_id }).select('site_id_cms_locked');
    const $set = { site_id_reported: site_id };
    if (!cur || !cur.site_id_cms_locked) {
      $set.site_id = site_id;
    }
    await Device.findOneAndUpdate({ device_id }, { $set }, { upsert: true, new: true });
  }

  if (isNewSchema && data.inverters && data.inverters.length > 0) {
    const firstInverter = data.inverters[0];
    if (firstInverter.info) {
      await Device.findOneAndUpdate(
        { device_id },
        {
          $set: {
            'device_info.serial_number': firstInverter.info.serial_number,
            'device_info.model_name': firstInverter.info.model_name,
            'device_info.inverter_type': firstInverter.info.inverter_type,
            'device_info.rated_power_w': firstInverter.info.rated_power_w,
            'device_info.hw_version': firstInverter.info.hw_version,
            'device_info.protocol': firstInverter.info.protocol,
            'device_info.modbus_address': firstInverter.info.modbus_address,
            total_inverters: data.system?.total_inverters || data.inverters.length
          }
        },
        { upsert: true }
      );
    }
  }

  const dataPointData = {
    device_id,
    timestamp: timestampDate,
    timezone: timezone || 'Asia/Ho_Chi_Minh',
    version: version || fw_version || '0.9.0',
    schema_version: schema_version || (isNewSchema ? '0.9.0' : undefined),
    fw_version,
    site_id: site_id || undefined,
    sequence,
    payload_type,
    system: data.system,
    inverters: data.inverters || []
  };

  const dataPoint = new DataPoint(dataPointData);

  try {
    await dataPoint.save();
    const schemaInfo = schema_version || (isNewSchema ? '0.9.0' : 'old');
    const inverterCount = data.inverters?.length || 0;
    console.log(
      `[ingest] ${device_id} @ ${timestampDate.toISOString()} schema=${schemaInfo} inverters=${inverterCount}`
    );

    if (isNewSchema && data.inverters && data.inverters.length > 0) {
      const firstInverter = data.inverters[0];
      const sections = [];
      if (firstInverter.info) sections.push('info');
      if (firstInverter.operating_state) sections.push('operating_state');
      if (firstInverter.sign_convention) sections.push('sign_convention');
      if (firstInverter.ac_measurements) sections.push('ac_measurements');
      if (firstInverter.grid_interaction) sections.push('grid_interaction');
      if (firstInverter.pv_input) sections.push('pv_input');
      if (firstInverter.battery_storage) sections.push('battery_storage');
      if (firstInverter.load) sections.push('load');
      if (firstInverter.performance) sections.push('performance');
      if (firstInverter.thermal_hardware) sections.push('thermal_hardware');
      if (firstInverter.quality) sections.push('quality');
      if (sections.length > 0) console.log(`  sections: ${sections.join(', ')}`);
    }
  } catch (saveError) {
    console.error('Error saving data point:', saveError);
    throw saveError;
  }

  const device = await Device.findOne({ device_id });

  const alarmsToProcess = [];
  if (isNewSchema) {
    if (data.inverters && Array.isArray(data.inverters)) {
      data.inverters.forEach((inverter, index) => {
        if (inverter.alarm && inverter.alarm.data && Array.isArray(inverter.alarm.data)) {
          inverter.alarm.data.forEach((alarmData) => {
            alarmsToProcess.push({
              ...alarmData,
              inverter_index: index,
              inverter_id: inverter.info?.modbus_address || index + 1
            });
          });
        }
      });
    }
  } else if (alarms && Array.isArray(alarms)) {
    alarmsToProcess.push(...alarms);
  }

  for (const alarmData of alarmsToProcess) {
    let alarmCode;
    let severity;
    let description;
    let inverterId;
    let startTime;

    if (isNewSchema) {
      alarmCode = alarmData.code;
      const typeMap = {
        warning: 'MINOR',
        error: 'CRITICAL',
        critical: 'CRITICAL'
      };
      severity = typeMap[alarmData.type?.toLowerCase()] || 'MINOR';
      description = alarmData.text || '';
      inverterId = alarmData.inverter_id || null;
      startTime = alarmData.first_seen_ts || timestamp;
    } else {
      alarmCode = alarmData.alarm_code;
      severity = alarmData.severity || 'MINOR';
      description = alarmData.description || '';
      inverterId = alarmData.inverter_id || null;
      startTime = alarmData.start_time || timestamp;
    }

    const existingAlarm = await Alarm.findOne({
      device_id,
      alarm_code: alarmCode,
      status: 'ACTIVE'
    });

    if (!existingAlarm) {
      const alarm = new Alarm({
        device_id,
        alarm_code: alarmCode,
        severity,
        description,
        inverter_id: inverterId,
        start_time: new Date(startTime * 1000),
        status: 'ACTIVE',
        current_value: alarmData.current_value,
        threshold: alarmData.threshold
      });
      await alarm.save();

      try {
        websocketService.emitAlarm(
          {
            alarm_code: alarm.alarm_code,
            severity: alarm.severity,
            description: alarm.description,
            device_id,
            inverter_id: inverterId,
            start_time: alarm.start_time
          },
          device_id,
          device?.area_id || null
        );
      } catch (err) {
        console.error('Error emitting alarm via WebSocket:', err);
      }

      if (device && device.area_id) {
        const severityMap = {
          CRITICAL: 'critical',
          MAJOR: 'error',
          MINOR: 'warning',
          WARNING: 'warning'
        };

        const notifications = await Notification.notifyAreaManagers(
          device.area_id,
          'alarm',
          severityMap[alarm.severity] || 'warning',
          `Cảnh báo ${alarm.severity}: ${device.site_name || device_id}`,
          alarm.description || `Mã cảnh báo: ${alarm.alarm_code}`,
          {
            device_id,
            alarm_code: alarm.alarm_code,
            severity: alarm.severity,
            alarm_id: alarm._id
          }
        ).catch((err) => {
          console.error('Error sending notification:', err);
          return [];
        });

        if (notifications && notifications.length > 0) {
          notifications.forEach((notification) => {
            try {
              websocketService.emitNotification(
                notification.user_id?.toString(),
                notification.area_id?.toString(),
                null,
                {
                  id: notification._id,
                  type: notification.type,
                  severity: notification.severity,
                  title: notification.title,
                  message: notification.message,
                  data: notification.data,
                  created_at: notification.createdAt
                }
              );
            } catch (err) {
              console.error('Error emitting notification via WebSocket:', err);
            }
          });
        }
      }
    }
  }

  aggregationService.processAggregation(device_id, timestampDate).catch((err) => {
    console.error('Aggregation error:', err);
  });

  return { server_time: Math.floor(Date.now() / 1000) };
}

module.exports = { ingestDataPoint };
