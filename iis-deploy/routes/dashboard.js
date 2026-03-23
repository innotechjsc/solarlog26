// Dashboard Aggregation Route
// Provides aggregated data to reduce API calls

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');
const Alarm = require('../models/Alarm');
const DailySummary = require('../models/DailySummary');
const HourlySummary = require('../models/HourlySummary');
const moment = require('moment-timezone');

/**
 * GET /api/v1/dashboard/overview
 * Get aggregated overview data for dashboard
 * This endpoint reduces API calls by providing all overview data in one request
 */
router.get('/v1/dashboard/overview', async (req, res) => {
  try {
    // Get all devices
    const devices = await Device.find().sort({ device_id: 1 });

    // Get latest data point for each device
    const deviceIds = devices.map(d => d.device_id);
    const latestDataPoints = await DataPoint.aggregate([
      { $match: { device_id: { $in: deviceIds } } },
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: '$device_id',
        latest: { $first: '$$ROOT' }
      }}
    ]);

    // Create a map of device_id to latest data
    const latestDataMap = new Map();
    latestDataPoints.forEach(item => {
      latestDataMap.set(item._id, item.latest);
    });

    // Aggregate overview data
    let totalOnlineInverters = 0;
    let totalInverters = 0;
    let totalPower = 0;
    let totalEnergyToday = 0;
    let totalChargeToday = 0;
    let totalDischargeToday = 0;
    let totalRevenueToday = 0;
    let totalRevenueLifetime = 0;

    // Battery health
    let batterySOH = [];
    let batterySOC = [];

    // Temperature
    let inverterTemps = [];
    let ambientTemps = [];

    // Grid frequency
    let gridFrequencies = [];

    // Operating state
    const operatingStates = {
      work_mode: { normal: 0, standby: 0, fault: 0 },
      grid_mode: { on_grid: 0, off_grid: 0 }
    };

    // Process each device
    for (const device of devices) {
      const latestData = latestDataMap.get(device.device_id);
      if (!latestData) continue;

      const isNewSchema = latestData.schema_version && parseFloat(latestData.schema_version) >= 0.9;

      // System level
      if (latestData.system) {
        totalOnlineInverters += latestData.system.online_inverters || 0;
        totalInverters += latestData.system.total_inverters || 0;
        totalPower += latestData.system.total_ac_active_power_w || 0;
      }

      // Process inverters
      if (latestData.inverters && Array.isArray(latestData.inverters)) {
        latestData.inverters.forEach(inv => {
          if (isNewSchema) {
            // Battery
            if (inv.battery_storage) {
              const bs = inv.battery_storage;
              if (bs.soh_percent !== undefined) batterySOH.push(bs.soh_percent);
              if (bs.soc_percent !== undefined) batterySOC.push(bs.soc_percent);
            }

            // Temperature
            if (inv.thermal_hardware) {
              const th = inv.thermal_hardware;
              if (th.inverter_temp_c) inverterTemps.push(th.inverter_temp_c);
              if (th.ambient_temp_c) ambientTemps.push(th.ambient_temp_c);
            }

            // Grid frequency
            if (inv.grid_interaction && inv.grid_interaction.frequency_hz) {
              gridFrequencies.push(inv.grid_interaction.frequency_hz);
            }

            // Operating state
            if (inv.operating_state) {
              const workMode = inv.operating_state.work_mode;
              const gridMode = inv.operating_state.grid_mode;
              if (workMode && operatingStates.work_mode[workMode] !== undefined) {
                operatingStates.work_mode[workMode]++;
              }
              if (gridMode && operatingStates.grid_mode[gridMode] !== undefined) {
                operatingStates.grid_mode[gridMode]++;
              }
            }
          }
        });
      }
    }

    // Get daily summaries for today
    const todayStart = moment().startOf('day').toDate();
    const todaySummaries = await DailySummary.find({
      device_id: { $in: deviceIds },
      date: { $gte: todayStart }
    });

    // Aggregate daily data
    todaySummaries.forEach(summary => {
      totalEnergyToday += summary.total_energy || 0;
      totalRevenueToday += summary.revenue || 0;
      if (summary.battery) {
        totalChargeToday += summary.battery.total_charge || 0;
        totalDischargeToday += summary.battery.total_discharge || 0;
      }
    });

    // Get lifetime revenue
    const lifetimeSummaries = await DailySummary.find({
      device_id: { $in: deviceIds }
    });
    totalRevenueLifetime = lifetimeSummaries.reduce((sum, s) => sum + (s.revenue || 0), 0);

    // Get total energy (approximate from summaries)
    const totalEnergyLifetime = lifetimeSummaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);

    // Calculate averages
    const avgBatterySOH = batterySOH.length > 0 
      ? batterySOH.reduce((a, b) => a + b, 0) / batterySOH.length 
      : null;
    const avgBatterySOC = batterySOC.length > 0 
      ? batterySOC.reduce((a, b) => a + b, 0) / batterySOC.length 
      : null;
    const avgInverterTemp = inverterTemps.length > 0 
      ? inverterTemps.reduce((a, b) => a + b, 0) / inverterTemps.length 
      : null;
    const avgAmbientTemp = ambientTemps.length > 0 
      ? ambientTemps.reduce((a, b) => a + b, 0) / ambientTemps.length 
      : null;
    const avgGridFrequency = gridFrequencies.length > 0 
      ? gridFrequencies.reduce((a, b) => a + b, 0) / gridFrequencies.length 
      : null;

    // Get alarms count
    const alarmsCount = await Alarm.countDocuments({
      status: 'ACTIVE'
    });

    const alarmsBySeverity = await Alarm.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }}
    ]);

    const alarmsBreakdown = {
      CRITICAL: 0,
      MAJOR: 0,
      MINOR: 0,
      WARNING: 0
    };

    alarmsBySeverity.forEach(item => {
      alarmsBreakdown[item._id] = item.count;
    });

    // Get plant status
    const plantStatus = {
      total: devices.length,
      normal: devices.filter(d => d.status === 'online').length,
      error: devices.filter(d => d.status === 'offline' && moment().diff(moment(d.last_seen), 'hours') < 24).length,
      disconnected: devices.filter(d => d.status === 'offline' && moment().diff(moment(d.last_seen), 'hours') >= 24).length
    };

    // Get environmental data
    const lifetimeEnergyMWh = totalEnergyLifetime / 1000;
    const environmental = {
      coal_saved: lifetimeEnergyMWh * 0.4,
      co2_avoided: lifetimeEnergyMWh * 0.5,
      trees_equivalent: Math.round((lifetimeEnergyMWh * 0.5) * 1.4)
    };

    res.json({
      status: 'success',
      data: {
        // Revenue
        revenue: {
          today: totalRevenueToday,
          lifetime: totalRevenueLifetime
        },
        // Energy
        energy: {
          today: totalEnergyToday,
          lifetime: totalEnergyLifetime
        },
        // Battery
        battery: {
          charge_today: totalChargeToday,
          discharge_today: totalDischargeToday,
          avg_soh: avgBatterySOH,
          avg_soc: avgBatterySOC
        },
        // Inverter status
        inverter_status: {
          online: totalOnlineInverters,
          total: totalInverters,
          health_percent: totalInverters > 0 ? (totalOnlineInverters / totalInverters * 100).toFixed(1) : 0
        },
        // Temperature
        temperature: {
          inverter: avgInverterTemp,
          ambient: avgAmbientTemp
        },
        // Grid frequency
        grid_frequency: {
          value: avgGridFrequency,
          status: avgGridFrequency && avgGridFrequency >= 49.5 && avgGridFrequency <= 50.5 ? 'normal' : 'warning'
        },
        // Operating state
        operating_state: operatingStates,
        // Alarms
        alarms: {
          total: alarmsCount,
          breakdown: alarmsBreakdown
        },
        // Plant status
        plant_status: plantStatus,
        // Environmental
        environmental: environmental,
        // Timestamp
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard overview'
    });
  }
});

module.exports = router;

