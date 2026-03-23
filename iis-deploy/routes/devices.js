const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');
const Alarm = require('../models/Alarm');
const HourlySummary = require('../models/HourlySummary');
const DailySummary = require('../models/DailySummary');
const moment = require('moment-timezone');

/**
 * GET /api/v1/devices
 * Get list of all devices
 */
router.get('/v1/devices', async (req, res) => {
  try {
    const devices = await Device.find().sort({ device_id: 1 });
    res.json({
      status: 'success',
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch devices'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/ota-status
 * Tiến trình / kết quả OTA gần nhất (từ MQTT .../progress, .../result)
 */
router.get('/v1/devices/:deviceId/ota-status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findOne({ device_id: deviceId }).select('device_id ota_status site_id');
    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }
    res.json({
      status: 'success',
      device_id: device.device_id,
      site_id: device.site_id || '',
      ota_status: device.ota_status || null
    });
  } catch (error) {
    console.error('Error fetching OTA status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch OTA status'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/realtime
 * Get realtime data for a device
 */
router.get('/v1/devices/:deviceId/realtime', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const latestData = await DataPoint.findOne({ device_id: deviceId })
      .sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.status(404).json({
        status: 'error',
        message: 'No data found for device'
      });
    }
    
    res.json({
      status: 'success',
      data: latestData
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch realtime data'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/history
 * Get historical data for a device
 * Query params: start, end, interval (5min, 1hour, 1day)
 */
router.get('/v1/devices/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, interval = '5min' } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        status: 'error',
        message: 'start and end parameters are required'
      });
    }
    
    const startDate = new Date(parseInt(start) * 1000);
    const endDate = new Date(parseInt(end) * 1000);
    
    let data;
    
    if (interval === '5min') {
      data = await DataPoint.find({
        device_id: deviceId,
        timestamp: { $gte: startDate, $lte: endDate }
      }).sort({ timestamp: 1 }).limit(10000);
    } else if (interval === '1hour') {
      data = await HourlySummary.find({
        device_id: deviceId,
        hour: { $gte: startDate, $lte: endDate }
      }).sort({ hour: 1 });
    } else if (interval === '1day') {
      data = await DailySummary.find({
        device_id: deviceId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid interval. Use: 5min, 1hour, 1day'
      });
    }
    
    res.json({
      status: 'success',
      count: data.length,
      interval,
      data
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/summary/hourly
 * Get hourly summaries
 */
router.get('/v1/devices/:deviceId/summary/hourly', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, limit = 168 } = req.query; // Default: last 7 days (168 hours)
    
    const query = { device_id: deviceId };
    
    if (start && end) {
      query.hour = {
        $gte: new Date(parseInt(start) * 1000),
        $lte: new Date(parseInt(end) * 1000)
      };
    }
    
    const summaries = await HourlySummary.find(query)
      .sort({ hour: -1 })
      .limit(parseInt(limit));
    
    res.json({
      status: 'success',
      count: summaries.length,
      summaries
    });
  } catch (error) {
    console.error('Error fetching hourly summaries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch hourly summaries'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/summary/daily
 * Get daily summaries
 */
router.get('/v1/devices/:deviceId/summary/daily', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, limit = 365 } = req.query; // Default: last year
    
    const query = { device_id: deviceId };
    
    if (start && end) {
      query.date = {
        $gte: new Date(parseInt(start) * 1000),
        $lte: new Date(parseInt(end) * 1000)
      };
    }
    
    const summaries = await DailySummary.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      status: 'success',
      count: summaries.length,
      summaries
    });
  } catch (error) {
    console.error('Error fetching daily summaries:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch daily summaries'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/alarms
 * Get alarms for a device
 */
router.get('/v1/devices/:deviceId/alarms', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, severity, start, end, limit = 100 } = req.query;
    
    const query = { device_id: deviceId };
    
    if (status) {
      query.status = status;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (start && end) {
      query.start_time = {
        $gte: new Date(parseInt(start) * 1000),
        $lte: new Date(parseInt(end) * 1000)
      };
    }
    
    const alarms = await Alarm.find(query)
      .sort({ start_time: -1 })
      .limit(parseInt(limit));
    
    res.json({
      status: 'success',
      count: alarms.length,
      alarms
    });
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch alarms'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/battery
 * Get battery data for a device
 * Supports both old schema (battery at root) and new schema (battery in inverters[])
 */
router.get('/v1/devices/:deviceId/battery', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get latest data point
    const latestData = await DataPoint.findOne({ 
      device_id: deviceId
    }).sort({ timestamp: -1 });
    
    // Get today's battery summary from daily summary
    const today = moment().startOf('day').toDate();
    const dailySummary = await DailySummary.findOne({
      device_id: deviceId,
      date: { $gte: today }
    });
    
    if (!latestData && !dailySummary) {
      return res.status(404).json({
        status: 'error',
        message: 'No battery data found for device'
      });
    }
    
    // Extract battery data based on schema version
    let currentBattery = null;
    const isNewSchema = latestData?.schema_version && parseFloat(latestData.schema_version) >= 0.9;
    
    if (latestData) {
      if (isNewSchema) {
        // New schema: battery in inverters[].battery_storage
        const batteries = [];
        if (latestData.inverters && Array.isArray(latestData.inverters)) {
          latestData.inverters.forEach((inv, index) => {
            if (inv.battery_storage) {
              batteries.push({
                inverter_id: inv.info?.modbus_address || (index + 1),
                inverter_index: index,
                ...inv.battery_storage,
                soc: inv.battery_storage.soc_percent,
                soh: inv.battery_storage.soh_percent,
                charge_power: inv.battery_storage.mode === 'charge' ? inv.battery_storage.active_power_w : 0,
                discharge_power: inv.battery_storage.mode === 'discharge' ? Math.abs(inv.battery_storage.active_power_w) : 0
              });
            }
          });
        }
        currentBattery = batteries.length === 1 ? batteries[0] : (batteries.length > 1 ? batteries : null);
      } else {
        // Old schema: battery at root level
        currentBattery = latestData.battery || null;
      }
    }
    
    const batteryData = {
      current: currentBattery,
      today: dailySummary?.battery || null,
      last_updated: latestData?.timestamp || null
    };
    
    res.json({
      status: 'success',
      data: batteryData
    });
  } catch (error) {
    console.error('Error fetching battery data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch battery data'
    });
  }
});

/**
 * GET /api/v1/devices/:deviceId/components
 * Get device components (inverters, meters, batteries)
 */
router.get('/v1/devices/:deviceId/components', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get latest data point to extract components
    const latestData = await DataPoint.findOne({ device_id: deviceId })
      .sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.status(404).json({
        status: 'error',
        message: 'No data found for device'
      });
    }
    
    const components = {
      inverters: [],
      meters: [],
      batteries: []
    };
    
    // Detect schema version
    const isNewSchema = latestData.schema_version && parseFloat(latestData.schema_version) >= 0.9;
    
    // Extract inverters (support both old and new schema)
    if (latestData.inverters && latestData.inverters.length > 0) {
      components.inverters = latestData.inverters.map((inv, index) => {
        if (isNewSchema && inv.info) {
          // New schema structure (nested)
          return {
            id: inv.info.modbus_address || (index + 1),
            slave_address: inv.info.modbus_address,
            modbus_address: inv.info.modbus_address,
            serial_number: inv.info.serial_number,
            model: inv.info.model_name,
            model_name: inv.info.model_name,
            inverter_type: inv.info.inverter_type,
            rated_power_w: inv.info.rated_power_w,
            ac_power: inv.ac_measurements?.inverter_ac_bus_active_power_w,
            ac_voltage: inv.ac_measurements?.voltage_l1n_v,
            ac_current: inv.ac_measurements?.current_l1_a,
            efficiency: inv.performance?.inverter_efficiency_percent,
            state: inv.operating_state?.work_mode,
            grid_mode: inv.operating_state?.grid_mode,
            alarm_count: inv.alarm?.count || 0
          };
        } else {
          // Old schema structure (flat)
          return {
            id: inv.id,
            slave_address: inv.slave_address,
            model: inv.model,
            ac_power: inv.ac_power,
            ac_voltage: inv.ac_voltage_l1,
            ac_current: inv.ac_current_l1,
            efficiency: inv.efficiency,
            state: inv.device_state,
            alarm_code: inv.alarm_code
          };
        }
      });
    }
    
    // Extract battery (support both old and new schema)
    if (isNewSchema) {
      // New schema: battery is in inverters[].battery_storage
      const batteries = [];
      if (latestData.inverters && latestData.inverters.length > 0) {
        latestData.inverters.forEach((inv, index) => {
          if (inv.battery_storage) {
            batteries.push({
              inverter_index: index,
              inverter_id: inv.info?.modbus_address || (index + 1),
              mode: inv.battery_storage.mode,
              soc: inv.battery_storage.soc_percent,
              soh: inv.battery_storage.soh_percent,
              active_power_w: inv.battery_storage.active_power_w,
              voltage_v: inv.battery_storage.voltage_v,
              current_a: inv.battery_storage.current_a,
              charge_power: inv.battery_storage.mode === 'charge' ? inv.battery_storage.active_power_w : 0,
              discharge_power: inv.battery_storage.mode === 'discharge' ? Math.abs(inv.battery_storage.active_power_w) : 0,
              charge_energy_today: inv.battery_storage.energy_charge_today_kwh,
              discharge_energy_today: inv.battery_storage.energy_discharge_today_kwh,
              charge_limit_w: inv.battery_storage.charge_limit_w,
              discharge_limit_w: inv.battery_storage.discharge_limit_w
            });
          }
        });
      }
      components.batteries = batteries;
    } else {
      // Old schema: battery is at root level
      if (latestData.battery) {
        components.batteries = [{
          soc: latestData.battery.soc,
          charge_power: latestData.battery.charge_power,
          discharge_power: latestData.battery.discharge_power,
          charge_energy_today: latestData.battery.charge_energy_today,
          discharge_energy_today: latestData.battery.discharge_energy_today
        }];
      }
    }
    
    // Meters would typically come from a separate collection or be inferred
    // For now, we'll return empty array
    components.meters = [];
    
    res.json({
      status: 'success',
      components,
      last_updated: latestData.timestamp
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch components'
    });
  }
});

module.exports = router;






