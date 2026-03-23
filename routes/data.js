const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const DataPoint = require('../models/DataPoint');
const Device = require('../models/Device');
const Alarm = require('../models/Alarm');
const Notification = require('../models/Notification');
const { authenticateApiKey } = require('../middleware/auth');
const websocketService = require('../services/websocketService');
const { processIotIngest } = require('../services/iotIngestRouter');

/** Chuẩn hoá timestamp cảnh báo: Unix giây/ms hoặc ISO — tránh NaN khi nhân chuỗi ISO với 1000 */
function coerceAlarmStartTime(timestamp) {
  if (timestamp == null || timestamp === '') return new Date();
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    if (!Number.isNaN(d.getTime())) return d;
    const n = Number(timestamp);
    if (!Number.isNaN(n)) return new Date(n > 1e12 ? n : n * 1000);
    return new Date();
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
  }
  return new Date();
}

/**
 * POST /api/v1/data
 * Receive data from SolarLogger device
 * Supports both old schema (< 0.9.0) and new schema (>= 0.9.0)
 * Supports IoT envelope (api/solar_logger_payload_desc.md): payload, ISO timestamp, schema 1.0.x
 */
router.post('/v1/data', authenticateApiKey, async (req, res) => {
  try {
    const out = await processIotIngest(req.body, {});
    if (!out.ok) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        errors: out.errors
      });
    }

    res.json({
      status: 'success',
      message: 'Data received',
      server_time: out.result.server_time,
      g_category: out.result.g_category
    });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Failed to process data'
    });
  }
});

/**
 * POST /api/v1/alarms
 * Receive alarm notification from SolarLogger device
 */
router.post('/v1/alarms',
  authenticateApiKey,
  [
    body('device_id').notEmpty().withMessage('device_id is required'),
    body('alarm').notEmpty().withMessage('alarm is required'),
    body('alarm.alarm_code').notEmpty().withMessage('alarm.alarm_code is required'),
    body('alarm.severity').notEmpty().withMessage('alarm.severity is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          errors: errors.array()
        });
      }
      
      const { device_id, timestamp, alarm } = req.body;
      
      // Check if alarm already exists (active)
      const existingAlarm = await Alarm.findOne({
        device_id,
        alarm_code: alarm.alarm_code,
        status: 'ACTIVE'
      });
      
      if (existingAlarm) {
        // Update existing alarm
        existingAlarm.current_value = alarm.current_value;
        existingAlarm.threshold = alarm.threshold;
        await existingAlarm.save();
      } else {
        // Get device info for notification
        const device = await Device.findOne({ device_id });
        
        // Create new alarm
        const newAlarm = new Alarm({
          device_id,
          alarm_code: alarm.alarm_code,
          severity: alarm.severity,
          description: alarm.description,
          inverter_id: alarm.inverter_id || null,
          start_time: coerceAlarmStartTime(timestamp),
          status: 'ACTIVE',
          current_value: alarm.current_value,
          threshold: alarm.threshold
        });
        await newAlarm.save();
        
        // Send notification to area managers if device has area
        if (device && device.area_id) {
          const severityMap = {
            'CRITICAL': 'critical',
            'MAJOR': 'error',
            'MINOR': 'warning',
            'WARNING': 'warning'
          };
          
          // Emit alarm via WebSocket (real-time)
          try {
            websocketService.emitAlarm(
              {
                alarm_code: newAlarm.alarm_code,
                severity: newAlarm.severity,
                description: newAlarm.description,
                device_id: device_id,
                inverter_id: newAlarm.inverter_id,
                start_time: newAlarm.start_time
              },
              device_id,
              device?.area_id || null
            );
          } catch (err) {
            console.error('Error emitting alarm via WebSocket:', err);
          }

          // Send notification to area managers if device has area
          const notifications = await Notification.notifyAreaManagers(
            device.area_id,
            'alarm',
            severityMap[newAlarm.severity] || 'warning',
            `Cảnh báo ${newAlarm.severity}: ${device.site_name || device_id}`,
            newAlarm.description || `Mã cảnh báo: ${newAlarm.alarm_code}`,
            {
              device_id,
              alarm_code: newAlarm.alarm_code,
              severity: newAlarm.severity,
              alarm_id: newAlarm._id
            }
          ).catch(err => {
            console.error('Error sending notification:', err);
            return [];
          });

          // Emit notification via WebSocket (real-time)
          if (notifications && notifications.length > 0) {
            notifications.forEach(notification => {
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
      
      res.json({
        status: 'success',
        message: 'Alarm received'
      });
      
    } catch (error) {
      console.error('Error processing alarm:', error);
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to process alarm'
      });
    }
  }
);

/**
 * GET /api/v1/data/devices
 * Get list of all unique device_ids from data_points
 */
router.get('/v1/data/devices', async (req, res) => {
  try {
    // Get distinct device_ids from data_points
    const deviceIds = await DataPoint.distinct('device_id');
    
    // Get latest data point for each device to get additional info
    const devices = await Promise.all(
      deviceIds.map(async (device_id) => {
        const latestData = await DataPoint.findOne({ device_id })
          .sort({ timestamp: -1 })
          .select('device_id timestamp timezone version schema_version system');
        
        // Get device info from Device collection if exists
        const deviceInfo = await Device.findOne({ device_id })
          .select('site_name location area_id project_id status last_seen')
          .populate('area_id', 'name code')
          .populate('project_id', 'name code');
        
        return {
          device_id,
          site_name: deviceInfo?.site_name || '',
          location: deviceInfo?.location || '',
          area_id: deviceInfo?.area_id?._id || null,
          area_name: deviceInfo?.area_id?.name || null,
          project_id: deviceInfo?.project_id?._id || null,
          project_name: deviceInfo?.project_id?.name || null,
          status: deviceInfo?.status || 'offline',
          last_seen: deviceInfo?.last_seen || latestData?.timestamp || null,
          last_data_timestamp: latestData?.timestamp || null,
          version: latestData?.version || '',
          schema_version: latestData?.schema_version || ''
        };
      })
    );
    
    res.json({
      status: 'success',
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Error fetching devices from data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch devices from data'
    });
  }
});

module.exports = router;

