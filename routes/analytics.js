const express = require('express');
const router = express.Router();
const DataPoint = require('../models/DataPoint');
const HourlySummary = require('../models/HourlySummary');
const DailySummary = require('../models/DailySummary');
const Alarm = require('../models/Alarm');
const Device = require('../models/Device');
const Project = require('../models/Project');
const Area = require('../models/Area');
const moment = require('moment-timezone');

/**
 * GET /api/v1/analytics/performance
 * Get performance analytics for a device
 */
router.get('/v1/analytics/performance', async (req, res) => {
  try {
    const { deviceId, start, end } = req.query;
    
    if (!deviceId || !start || !end) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId, start, and end parameters are required'
      });
    }
    
    const startDate = new Date(parseInt(start) * 1000);
    const endDate = new Date(parseInt(end) * 1000);
    
    // Get hourly summaries for the period
    const summaries = await HourlySummary.find({
      device_id: deviceId,
      hour: { $gte: startDate, $lte: endDate }
    }).sort({ hour: 1 });
    
    if (summaries.length === 0) {
      return res.json({
        status: 'success',
        analytics: {
          total_energy: 0,
          avg_power: 0,
          max_power: 0,
          min_power: 0,
          efficiency: 0,
          availability: 0
        }
      });
    }
    
    const totalEnergy = summaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);
    const avgPower = summaries.reduce((sum, s) => sum + (s.avg_power || 0), 0) / summaries.length;
    const maxPower = Math.max(...summaries.map(s => s.max_power || 0));
    const minPower = Math.min(...summaries.map(s => s.min_power || 0));
    
    // Calculate average efficiency from inverter summaries
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    summaries.forEach(s => {
      if (s.inverter_summaries) {
        s.inverter_summaries.forEach(inv => {
          if (inv.efficiency) {
            totalEfficiency += inv.efficiency;
            efficiencyCount++;
          }
        });
      }
    });
    const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;
    
    // Calculate availability (hours with power > 0 / total hours)
    const totalHours = moment(endDate).diff(moment(startDate), 'hours');
    const activeHours = summaries.filter(s => (s.avg_power || 0) > 0).length;
    const availability = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;
    
    res.json({
      status: 'success',
      analytics: {
        total_energy: totalEnergy,
        avg_power: avgPower,
        max_power: maxPower,
        min_power: minPower,
        efficiency: avgEfficiency,
        availability: availability,
        period: {
          start: startDate,
          end: endDate,
          hours: totalHours
        }
      }
    });
  } catch (error) {
    console.error('Error calculating performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate performance analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/energy
 * Get energy production analytics
 */
router.get('/v1/analytics/energy', async (req, res) => {
  try {
    const { deviceId, period = '7days' } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId parameter is required'
      });
    }
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(7, 'days').toDate();
    }
    
    // Get daily summaries
    const dailySummaries = await DailySummary.find({
      device_id: deviceId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    const totalEnergy = dailySummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const avgDailyEnergy = dailySummaries.length > 0 ? totalEnergy / dailySummaries.length : 0;
    const maxDailyEnergy = Math.max(...dailySummaries.map(d => d.total_energy || 0), 0);
    
    // Calculate trend (compare last half vs first half)
    const midPoint = Math.floor(dailySummaries.length / 2);
    const firstHalf = dailySummaries.slice(0, midPoint);
    const secondHalf = dailySummaries.slice(midPoint);
    
    const firstHalfEnergy = firstHalf.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const secondHalfEnergy = secondHalf.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    
    const firstHalfAvg = firstHalf.length > 0 ? firstHalfEnergy / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? secondHalfEnergy / secondHalf.length : 0;
    
    const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    res.json({
      status: 'success',
      analytics: {
        period,
        total_energy: totalEnergy,
        avg_daily_energy: avgDailyEnergy,
        max_daily_energy: maxDailyEnergy,
        trend: trend,
        daily_data: dailySummaries.map(d => ({
          date: d.date,
          energy: d.total_energy,
          max_power: d.max_power,
          sunshine_hours: d.sunshine_hours
        }))
      }
    });
  } catch (error) {
    console.error('Error calculating energy analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate energy analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/alarms
 * Get alarm statistics
 */
router.get('/v1/analytics/alarms', async (req, res) => {
  try {
    const { deviceId, start, end } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId parameter is required'
      });
    }
    
    const query = { device_id: deviceId };
    
    if (start && end) {
      query.start_time = {
        $gte: new Date(parseInt(start) * 1000),
        $lte: new Date(parseInt(end) * 1000)
      };
    } else {
      // Default: last 30 days
      query.start_time = {
        $gte: moment().subtract(30, 'days').toDate()
      };
    }
    
    const alarms = await Alarm.find(query);
    
    const stats = {
      total: alarms.length,
      by_severity: {
        CRITICAL: alarms.filter(a => a.severity === 'CRITICAL').length,
        MAJOR: alarms.filter(a => a.severity === 'MAJOR').length,
        MINOR: alarms.filter(a => a.severity === 'MINOR').length,
        WARNING: alarms.filter(a => a.severity === 'WARNING').length
      },
      by_status: {
        ACTIVE: alarms.filter(a => a.status === 'ACTIVE').length,
        RESOLVED: alarms.filter(a => a.status === 'RESOLVED').length,
        ACKNOWLEDGED: alarms.filter(a => a.status === 'ACKNOWLEDGED').length
      },
      by_code: {}
    };
    
    // Count by alarm code
    alarms.forEach(alarm => {
      if (!stats.by_code[alarm.alarm_code]) {
        stats.by_code[alarm.alarm_code] = 0;
      }
      stats.by_code[alarm.alarm_code]++;
    });
    
    res.json({
      status: 'success',
      statistics: stats
    });
  } catch (error) {
    console.error('Error calculating alarm statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate alarm statistics'
    });
  }
});

/**
 * GET /api/v1/analytics/revenue
 * Get revenue analytics
 */
router.get('/v1/analytics/revenue', async (req, res) => {
  try {
    const { deviceId, projectId, period = 'today' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = moment().startOf('day').toDate();
        break;
      case 'month':
        startDate = moment().startOf('month').toDate();
        break;
      case 'year':
        startDate = moment().startOf('year').toDate();
        break;
      case 'lifetime':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = moment().startOf('day').toDate();
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      // Get all devices in project
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    }
    
    query.date = { $gte: startDate, $lte: endDate };
    
    const summaries = await DailySummary.find(query).sort({ date: 1 });
    
    const totalRevenue = summaries.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalEnergy = summaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);
    
    // Daily revenue data for charts
    const dailyRevenue = summaries.map(s => ({
      date: s.date,
      revenue: s.revenue || 0,
      energy: s.total_energy || 0
    }));
    
    res.json({
      status: 'success',
      analytics: {
        period,
        total_revenue: totalRevenue,
        total_energy: totalEnergy,
        daily_data: dailyRevenue
      }
    });
  } catch (error) {
    console.error('Error calculating revenue:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate revenue analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/environmental
 * Get environmental impact analytics
 */
router.get('/v1/analytics/environmental', async (req, res) => {
  try {
    const { deviceId, projectId, period = 'lifetime' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = moment().startOf('day').toDate();
        break;
      case 'month':
        startDate = moment().startOf('month').toDate();
        break;
      case 'year':
        startDate = moment().startOf('year').toDate();
        break;
      case 'lifetime':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    }
    
    query.date = { $gte: startDate, $lte: endDate };
    
    const summaries = await DailySummary.find(query);
    
    // Aggregate environmental data
    const totalCoalSaved = summaries.reduce((sum, s) => sum + ((s.environmental?.coal_saved) || 0), 0);
    const totalCO2Avoided = summaries.reduce((sum, s) => sum + ((s.environmental?.co2_avoided) || 0), 0);
    const totalTrees = summaries.reduce((sum, s) => sum + ((s.environmental?.trees_equivalent) || 0), 0);
    
    // If no environmental data in summaries, calculate from energy
    const totalEnergy = summaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);
    const energyMWh = totalEnergy / 1000;
    
    const environmental = {
      coal_saved: totalCoalSaved > 0 ? totalCoalSaved : (energyMWh * 0.4),
      co2_avoided: totalCO2Avoided > 0 ? totalCO2Avoided : (energyMWh * 0.5),
      trees_equivalent: totalTrees > 0 ? totalTrees : Math.round((energyMWh * 0.5) * 1.4),
      total_energy_mwh: energyMWh
    };
    
    res.json({
      status: 'success',
      analytics: {
        period,
        environmental
      }
    });
  } catch (error) {
    console.error('Error calculating environmental impact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate environmental impact'
    });
  }
});

/**
 * GET /api/v1/analytics/plants/status
 * Get plant status aggregation
 */
router.get('/v1/analytics/plants/status', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    let query = {};
    if (projectId) {
      query.project_id = projectId;
    }
    
    const devices = await Device.find(query);
    
    const totalPlants = devices.length;
    const normal = devices.filter(d => d.status === 'online').length;
    const error = devices.filter(d => d.status === 'offline' && moment().diff(moment(d.last_seen), 'hours') < 24).length;
    const disconnected = devices.filter(d => d.status === 'offline' && moment().diff(moment(d.last_seen), 'hours') >= 24).length;
    
    res.json({
      status: 'success',
      statistics: {
        total: totalPlants,
        normal: normal,
        error: error,
        disconnected: disconnected,
        breakdown: {
          normal_percent: totalPlants > 0 ? (normal / totalPlants * 100) : 0,
          error_percent: totalPlants > 0 ? (error / totalPlants * 100) : 0,
          disconnected_percent: totalPlants > 0 ? (disconnected / totalPlants * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error calculating plant status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate plant status'
    });
  }
});

/**
 * GET /api/v1/analytics/energy-management
 * Get energy management analytics
 */
router.get('/v1/analytics/energy-management', async (req, res) => {
  try {
    const { deviceId, period = 'day', date } = req.query;
    
    if (!deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId parameter is required'
      });
    }
    
    let startDate, endDate;
    
    if (date) {
      startDate = moment(date).startOf('day').toDate();
      endDate = moment(date).endOf('day').toDate();
    } else {
      endDate = new Date();
      switch (period) {
        case 'day':
          startDate = moment().startOf('day').toDate();
          break;
        case 'month':
          startDate = moment().startOf('month').toDate();
          break;
        case 'year':
          startDate = moment().startOf('year').toDate();
          break;
        case 'lifetime':
          startDate = new Date(0);
          break;
        default:
          startDate = moment().startOf('day').toDate();
      }
    }
    
    // Get hourly summaries for detailed data
    const hourlySummaries = await HourlySummary.find({
      device_id: deviceId,
      hour: { $gte: startDate, $lte: endDate }
    }).sort({ hour: 1 });
    
    // Get data points for power flow
    const dataPoints = await DataPoint.find({
      device_id: deviceId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });
    
    // Calculate energy flows
    let pvOutput = 0;
    let totalConsumption = 0;
    let consumedFromPV = 0;
    let consumedFromGrid = 0;
    let fedToGrid = 0;
    const batterySOC = [];
    const batteryCharge = [];
    
    // Detect schema version
    const isNewSchema = dataPoints.length > 0 && dataPoints[0].schema_version && parseFloat(dataPoints[0].schema_version) >= 0.9;
    
    dataPoints.forEach(dp => {
      if (isNewSchema) {
        // New schema: calculate power flow from new structure
        if (dp.inverters && Array.isArray(dp.inverters)) {
          dp.inverters.forEach(inv => {
            // PV output
            if (inv.pv_input && inv.pv_input.pv_inputs) {
              const pvPower = inv.pv_input.pv_inputs.reduce((sum, pv) => sum + (pv.dc_power_w || 0), 0);
              pvOutput += pvPower;
            }
            
            // Load consumption
            if (inv.load && inv.load.active_power_w) {
              totalConsumption += inv.load.active_power_w;
            }
            
            // Grid interaction
            if (inv.grid_interaction) {
              const exportPower = inv.grid_interaction.export_active_power_w || 0;
              const importPower = inv.grid_interaction.import_active_power_w || 0;
              
              consumedFromGrid += importPower;
              fedToGrid += exportPower;
              
              // PV to home = PV output - export - battery charge
              const pvPower = inv.pv_input?.pv_inputs?.reduce((sum, pv) => sum + (pv.dc_power_w || 0), 0) || 0;
              const batteryCharge = (inv.battery_storage?.mode === 'charge') ? (inv.battery_storage?.active_power_w || 0) : 0;
              consumedFromPV += Math.max(0, pvPower - exportPower - batteryCharge);
            }
            
            // Battery
            if (inv.battery_storage) {
              if (inv.battery_storage.soc_percent !== undefined) {
                batterySOC.push(inv.battery_storage.soc_percent);
              }
              if (inv.battery_storage.mode === 'charge' && inv.battery_storage.active_power_w) {
                batteryCharge.push(inv.battery_storage.active_power_w);
              }
            }
          });
        }
      } else {
        // Old schema: use power_flow and battery directly
        if (dp.power_flow) {
          pvOutput += (dp.power_flow.pv_to_grid || 0) + (dp.power_flow.pv_to_home || 0) + (dp.power_flow.pv_to_battery || 0);
          totalConsumption += (dp.power_flow.pv_to_home || 0) + (dp.power_flow.battery_to_home || 0) + (dp.power_flow.grid_to_home || 0);
          consumedFromPV += (dp.power_flow.pv_to_home || 0);
          consumedFromGrid += (dp.power_flow.grid_to_home || 0);
          fedToGrid += (dp.power_flow.pv_to_grid || 0) + (dp.power_flow.battery_to_grid || 0);
        }
        if (dp.battery) {
          if (dp.battery.soc !== undefined) batterySOC.push(dp.battery.soc);
          if (dp.battery.charge_power) batteryCharge.push(dp.battery.charge_power);
        }
      }
    });
    
    // Convert power to energy (approximate)
    const intervalMinutes = 5; // Data points are 5 minutes apart
    const pvOutputEnergy = pvOutput * (intervalMinutes / 60);
    const totalConsumptionEnergy = totalConsumption * (intervalMinutes / 60);
    const consumedFromPVEnergy = consumedFromPV * (intervalMinutes / 60);
    const consumedFromGridEnergy = consumedFromGrid * (intervalMinutes / 60);
    const fedToGridEnergy = fedToGrid * (intervalMinutes / 60);
    
    // Get daily summary for battery
    const dailySummary = await DailySummary.findOne({
      device_id: deviceId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const avgBatterySOC = batterySOC.length > 0 ? batterySOC.reduce((sum, s) => sum + s, 0) / batterySOC.length : 0;
    
    res.json({
      status: 'success',
      analytics: {
        period,
        summary: {
          pv_output: pvOutputEnergy,
          total_consumption: totalConsumptionEnergy,
          consumed_from_pv: consumedFromPVEnergy,
          consumed_from_grid: consumedFromGridEnergy,
          fed_to_grid: fedToGridEnergy,
          pv_consumption_percent: totalConsumptionEnergy > 0 ? (consumedFromPVEnergy / totalConsumptionEnergy * 100) : 0,
          grid_consumption_percent: totalConsumptionEnergy > 0 ? (consumedFromGridEnergy / totalConsumptionEnergy * 100) : 0,
          battery: {
            avg_soc: avgBatterySOC,
            total_charge: dailySummary?.battery?.total_charge || 0,
            total_discharge: dailySummary?.battery?.total_discharge || 0
          }
        },
        hourly_data: hourlySummaries.map(h => ({
          hour: h.hour,
          energy: h.total_energy,
          power: h.avg_power
        }))
      }
    });
  } catch (error) {
    console.error('Error calculating energy management:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate energy management analytics'
    });
  }
});

/**
 * GET /api/v1/projects
 * Get all projects (for device tree)
 */
router.get('/v1/projects', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' })
      .select('_id name code location')
      .sort({ name: 1 });
    
    res.json({
      status: 'success',
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects'
    });
  }
});

/**
 * GET /api/v1/projects/:projectId/areas
 * Get areas in a project
 */
router.get('/v1/projects/:projectId/areas', async (req, res) => {
  try {
    const { projectId } = req.params;
    const areas = await Area.find({ project_id: projectId })
      .select('_id name code location')
      .sort({ name: 1 });
    
    res.json({
      status: 'success',
      count: areas.length,
      areas
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch areas'
    });
  }
});

/**
 * GET /api/v1/projects/locations
 * Get all plant locations for map
 */
router.get('/v1/projects/locations', async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: 'active',
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null }
    }).select('_id name code location');
    
    const locations = projects.map(p => ({
      project_id: p._id,
      name: p.name,
      code: p.code,
      location: p.location
    }));
    
    res.json({
      status: 'success',
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch locations'
    });
  }
});

/**
 * GET /api/v1/areas/:areaId/devices
 * Get devices in an area
 */
router.get('/v1/areas/:areaId/devices', async (req, res) => {
  try {
    const { areaId } = req.params;
    const devices = await Device.find({ area_id: areaId })
      .select('_id device_id site_name status last_seen')
      .sort({ device_id: 1 });
    
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
 * GET /api/v1/analytics/alarms (Updated to support aggregation)
 * Get alarm statistics with optional aggregation
 */
router.get('/v1/analytics/alarms', async (req, res) => {
  try {
    const { deviceId, projectId, aggregate = 'false', start, end } = req.query;
    
    let query = {};
    
    if (aggregate === 'true') {
      // Aggregate across all devices in project
      if (projectId) {
        const devices = await Device.find({ project_id: projectId });
        query.device_id = { $in: devices.map(d => d.device_id) };
      }
      // If no projectId, aggregate all devices
    } else {
      if (!deviceId) {
        return res.status(400).json({
          status: 'error',
          message: 'deviceId parameter is required when aggregate=false'
        });
      }
      query.device_id = deviceId;
    }
    
    if (start && end) {
      query.start_time = {
        $gte: new Date(parseInt(start) * 1000),
        $lte: new Date(parseInt(end) * 1000)
      };
    } else {
      // Default: last 30 days
      query.start_time = {
        $gte: moment().subtract(30, 'days').toDate()
      };
    }
    
    const alarms = await Alarm.find(query);
    
    const stats = {
      total: alarms.length,
      by_severity: {
        CRITICAL: alarms.filter(a => a.severity === 'CRITICAL').length,
        MAJOR: alarms.filter(a => a.severity === 'MAJOR').length,
        MINOR: alarms.filter(a => a.severity === 'MINOR').length,
        WARNING: alarms.filter(a => a.severity === 'WARNING').length
      },
      by_status: {
        ACTIVE: alarms.filter(a => a.status === 'ACTIVE').length,
        RESOLVED: alarms.filter(a => a.status === 'RESOLVED').length,
        ACKNOWLEDGED: alarms.filter(a => a.status === 'ACKNOWLEDGED').length
      },
      by_code: {}
    };
    
    // Count by alarm code
    alarms.forEach(alarm => {
      if (!stats.by_code[alarm.alarm_code]) {
        stats.by_code[alarm.alarm_code] = 0;
      }
      stats.by_code[alarm.alarm_code]++;
    });
    
    res.json({
      status: 'success',
      statistics: stats
    });
  } catch (error) {
    console.error('Error calculating alarm statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate alarm statistics'
    });
  }
});

/**
 * GET /api/v1/analytics/battery-health
 * Get battery health analytics (SOH, SOC over time)
 */
router.get('/v1/analytics/battery-health', async (req, res) => {
  try {
    const { deviceId, projectId, period = '30days' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId or projectId parameter is required'
      });
    }
    
    query.timestamp = { $gte: startDate, $lte: endDate };
    
    // Get data points with battery data
    const dataPoints = await DataPoint.find(query)
      .select('timestamp device_id inverters battery')
      .sort({ timestamp: 1 })
      .limit(10000); // Limit for performance
    
    // Aggregate by day
    const dailyData = {};
    const isNewSchema = dataPoints.length > 0 && dataPoints[0].schema_version && parseFloat(dataPoints[0].schema_version) >= 0.9;
    
    dataPoints.forEach(dp => {
      const dateKey = moment(dp.timestamp).format('YYYY-MM-DD');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          soh: [],
          soc: [],
          voltage: [],
          current: [],
          charge_energy: [],
          discharge_energy: []
        };
      }
      
      if (isNewSchema && dp.inverters && Array.isArray(dp.inverters)) {
        dp.inverters.forEach(inv => {
          if (inv.battery_storage) {
            const bs = inv.battery_storage;
            if (bs.soh_percent !== undefined) dailyData[dateKey].soh.push(bs.soh_percent);
            if (bs.soc_percent !== undefined) dailyData[dateKey].soc.push(bs.soc_percent);
            if (bs.voltage_v !== undefined) dailyData[dateKey].voltage.push(bs.voltage_v);
            if (bs.current_a !== undefined) dailyData[dateKey].current.push(bs.current_a);
            if (bs.energy_charge_today_kwh !== undefined) dailyData[dateKey].charge_energy.push(bs.energy_charge_today_kwh);
            if (bs.energy_discharge_today_kwh !== undefined) dailyData[dateKey].discharge_energy.push(bs.energy_discharge_today_kwh);
          }
        });
      } else if (dp.battery) {
        // Old schema
        if (dp.battery.soh !== undefined) dailyData[dateKey].soh.push(dp.battery.soh);
        if (dp.battery.soc !== undefined) dailyData[dateKey].soc.push(dp.battery.soc);
      }
    });
    
    // Calculate averages
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      soh: day.soh.length > 0 ? (day.soh.reduce((a, b) => a + b, 0) / day.soh.length).toFixed(2) : null,
      soc: day.soc.length > 0 ? (day.soc.reduce((a, b) => a + b, 0) / day.soc.length).toFixed(2) : null,
      voltage: day.voltage.length > 0 ? (day.voltage.reduce((a, b) => a + b, 0) / day.voltage.length).toFixed(2) : null,
      current: day.current.length > 0 ? (day.current.reduce((a, b) => a + b, 0) / day.current.length).toFixed(2) : null,
      charge_energy: day.charge_energy.length > 0 ? day.charge_energy[day.charge_energy.length - 1] : null,
      discharge_energy: day.discharge_energy.length > 0 ? day.discharge_energy[day.discharge_energy.length - 1] : null
    }));
    
    // Calculate statistics
    const allSOH = chartData.filter(d => d.soh !== null).map(d => parseFloat(d.soh));
    const allSOC = chartData.filter(d => d.soc !== null).map(d => parseFloat(d.soc));
    
    const stats = {
      current_soh: allSOH.length > 0 ? allSOH[allSOH.length - 1] : null,
      current_soc: allSOC.length > 0 ? allSOC[allSOC.length - 1] : null,
      avg_soh: allSOH.length > 0 ? (allSOH.reduce((a, b) => a + b, 0) / allSOH.length).toFixed(2) : null,
      avg_soc: allSOC.length > 0 ? (allSOC.reduce((a, b) => a + b, 0) / allSOC.length).toFixed(2) : null,
      min_soh: allSOH.length > 0 ? Math.min(...allSOH).toFixed(2) : null,
      max_soh: allSOH.length > 0 ? Math.max(...allSOH).toFixed(2) : null,
      soh_trend: allSOH.length > 1 ? ((allSOH[allSOH.length - 1] - allSOH[0]) / allSOH[0] * 100).toFixed(2) : null
    };
    
    res.json({
      status: 'success',
      analytics: {
        period,
        statistics: stats,
        daily_data: chartData
      }
    });
  } catch (error) {
    console.error('Error calculating battery health:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate battery health analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/grid-interaction
 * Get grid interaction analytics (import/export, frequency)
 */
router.get('/v1/analytics/grid-interaction', async (req, res) => {
  try {
    const { deviceId, projectId, period = '30days' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId or projectId parameter is required'
      });
    }
    
    query.timestamp = { $gte: startDate, $lte: endDate };
    
    // Get hourly summaries for aggregated data
    const hourlySummaries = await HourlySummary.find({
      device_id: query.device_id,
      hour: { $gte: startDate, $lte: endDate }
    }).sort({ hour: 1 });
    
    // Get data points for frequency and detailed grid data
    const dataPoints = await DataPoint.find(query)
      .select('timestamp device_id inverters')
      .sort({ timestamp: 1 })
      .limit(5000);
    
    // Aggregate by day
    const dailyData = {};
    const isNewSchema = dataPoints.length > 0 && dataPoints[0].schema_version && parseFloat(dataPoints[0].schema_version) >= 0.9;
    
    dataPoints.forEach(dp => {
      const dateKey = moment(dp.timestamp).format('YYYY-MM-DD');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          import_energy: 0,
          export_energy: 0,
          frequency: [],
          zero_export_enabled: false
        };
      }
      
      if (isNewSchema && dp.inverters && Array.isArray(dp.inverters)) {
        dp.inverters.forEach(inv => {
          if (inv.grid_interaction) {
            const gi = inv.grid_interaction;
            // Use today's energy if available, otherwise calculate from power
            if (gi.import_energy_today_kwh !== undefined) {
              dailyData[dateKey].import_energy = Math.max(dailyData[dateKey].import_energy, gi.import_energy_today_kwh);
            }
            if (gi.export_energy_today_kwh !== undefined) {
              dailyData[dateKey].export_energy = Math.max(dailyData[dateKey].export_energy, gi.export_energy_today_kwh);
            }
            if (gi.frequency_hz !== undefined && gi.frequency_hz > 0) {
              dailyData[dateKey].frequency.push(gi.frequency_hz);
            }
            if (gi.zero_export_enabled !== undefined) {
              dailyData[dateKey].zero_export_enabled = gi.zero_export_enabled;
            }
          }
        });
      }
    });
    
    // Calculate daily averages
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      import_energy: day.import_energy.toFixed(2),
      export_energy: day.export_energy.toFixed(2),
      frequency: day.frequency.length > 0 ? (day.frequency.reduce((a, b) => a + b, 0) / day.frequency.length).toFixed(2) : null,
      zero_export_enabled: day.zero_export_enabled
    }));
    
    // Calculate statistics
    const allFreq = chartData.filter(d => d.frequency !== null).map(d => parseFloat(d.frequency));
    const totalImport = chartData.reduce((sum, d) => sum + parseFloat(d.import_energy), 0);
    const totalExport = chartData.reduce((sum, d) => sum + parseFloat(d.export_energy), 0);
    
    const stats = {
      total_import_energy: totalImport.toFixed(2),
      total_export_energy: totalExport.toFixed(2),
      net_energy: (totalExport - totalImport).toFixed(2),
      avg_frequency: allFreq.length > 0 ? (allFreq.reduce((a, b) => a + b, 0) / allFreq.length).toFixed(2) : null,
      min_frequency: allFreq.length > 0 ? Math.min(...allFreq).toFixed(2) : null,
      max_frequency: allFreq.length > 0 ? Math.max(...allFreq).toFixed(2) : null,
      frequency_stability: allFreq.length > 0 ? (allFreq.filter(f => f >= 49.5 && f <= 50.5).length / allFreq.length * 100).toFixed(2) : null
    };
    
    res.json({
      status: 'success',
      analytics: {
        period,
        statistics: stats,
        daily_data: chartData
      }
    });
  } catch (error) {
    console.error('Error calculating grid interaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate grid interaction analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/temperature
 * Get temperature analytics (inverter, ambient, heatsink)
 */
router.get('/v1/analytics/temperature', async (req, res) => {
  try {
    const { deviceId, projectId, period = '30days' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId or projectId parameter is required'
      });
    }
    
    query.timestamp = { $gte: startDate, $lte: endDate };
    
    // Get data points
    const dataPoints = await DataPoint.find(query)
      .select('timestamp device_id inverters')
      .sort({ timestamp: 1 })
      .limit(5000);
    
    // Aggregate by day
    const dailyData = {};
    const isNewSchema = dataPoints.length > 0 && dataPoints[0].schema_version && parseFloat(dataPoints[0].schema_version) >= 0.9;
    
    dataPoints.forEach(dp => {
      const dateKey = moment(dp.timestamp).format('YYYY-MM-DD');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          inverter_temp: [],
          ambient_temp: [],
          heatsink_temp: [],
          transformer_temp: []
        };
      }
      
      if (isNewSchema && dp.inverters && Array.isArray(dp.inverters)) {
        dp.inverters.forEach(inv => {
          if (inv.thermal_hardware) {
            const th = inv.thermal_hardware;
            if (th.inverter_temp_c !== undefined && th.inverter_temp_c > 0) {
              dailyData[dateKey].inverter_temp.push(th.inverter_temp_c);
            }
            if (th.ambient_temp_c !== undefined && th.ambient_temp_c > 0) {
              dailyData[dateKey].ambient_temp.push(th.ambient_temp_c);
            }
            if (th.heatsink_temp_c !== undefined && th.heatsink_temp_c > 0) {
              dailyData[dateKey].heatsink_temp.push(th.heatsink_temp_c);
            }
            if (th.transformer_temp_c !== undefined && th.transformer_temp_c > 0) {
              dailyData[dateKey].transformer_temp.push(th.transformer_temp_c);
            }
          }
        });
      }
    });
    
    // Calculate daily averages
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      inverter_temp: day.inverter_temp.length > 0 ? (day.inverter_temp.reduce((a, b) => a + b, 0) / day.inverter_temp.length).toFixed(2) : null,
      ambient_temp: day.ambient_temp.length > 0 ? (day.ambient_temp.reduce((a, b) => a + b, 0) / day.ambient_temp.length).toFixed(2) : null,
      heatsink_temp: day.heatsink_temp.length > 0 ? (day.heatsink_temp.reduce((a, b) => a + b, 0) / day.heatsink_temp.length).toFixed(2) : null,
      transformer_temp: day.transformer_temp.length > 0 ? (day.transformer_temp.reduce((a, b) => a + b, 0) / day.transformer_temp.length).toFixed(2) : null
    }));
    
    // Calculate statistics
    const allInverterTemp = chartData.filter(d => d.inverter_temp !== null).map(d => parseFloat(d.inverter_temp));
    const allAmbientTemp = chartData.filter(d => d.ambient_temp !== null).map(d => parseFloat(d.ambient_temp));
    
    const stats = {
      current_inverter_temp: allInverterTemp.length > 0 ? allInverterTemp[allInverterTemp.length - 1].toFixed(2) : null,
      current_ambient_temp: allAmbientTemp.length > 0 ? allAmbientTemp[allAmbientTemp.length - 1].toFixed(2) : null,
      avg_inverter_temp: allInverterTemp.length > 0 ? (allInverterTemp.reduce((a, b) => a + b, 0) / allInverterTemp.length).toFixed(2) : null,
      avg_ambient_temp: allAmbientTemp.length > 0 ? (allAmbientTemp.reduce((a, b) => a + b, 0) / allAmbientTemp.length).toFixed(2) : null,
      max_inverter_temp: allInverterTemp.length > 0 ? Math.max(...allInverterTemp).toFixed(2) : null,
      min_inverter_temp: allInverterTemp.length > 0 ? Math.min(...allInverterTemp).toFixed(2) : null,
      temp_difference: allInverterTemp.length > 0 && allAmbientTemp.length > 0 
        ? (allInverterTemp[allInverterTemp.length - 1] - allAmbientTemp[allAmbientTemp.length - 1]).toFixed(2) 
        : null
    };
    
    res.json({
      status: 'success',
      analytics: {
        period,
        statistics: stats,
        daily_data: chartData
      }
    });
  } catch (error) {
    console.error('Error calculating temperature analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate temperature analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/operating-state
 * Get operating state analytics (work mode, grid mode over time)
 */
router.get('/v1/analytics/operating-state', async (req, res) => {
  try {
    const { deviceId, projectId, period = '30days' } = req.query;
    
    let startDate, endDate;
    endDate = new Date();
    
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId or projectId parameter is required'
      });
    }
    
    query.timestamp = { $gte: startDate, $lte: endDate };
    
    // Get data points
    const dataPoints = await DataPoint.find(query)
      .select('timestamp device_id inverters')
      .sort({ timestamp: 1 })
      .limit(5000);
    
    // Aggregate by day
    const dailyData = {};
    const isNewSchema = dataPoints.length > 0 && dataPoints[0].schema_version && parseFloat(dataPoints[0].schema_version) >= 0.9;
    
    dataPoints.forEach(dp => {
      const dateKey = moment(dp.timestamp).format('YYYY-MM-DD');
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          normal: 0,
          standby: 0,
          fault: 0,
          on_grid: 0,
          off_grid: 0,
          total_samples: 0
        };
      }
      
      if (isNewSchema && dp.inverters && Array.isArray(dp.inverters)) {
        dp.inverters.forEach(inv => {
          if (inv.operating_state) {
            dailyData[dateKey].total_samples++;
            const workMode = inv.operating_state.work_mode || 'unknown';
            const gridMode = inv.operating_state.grid_mode || 'unknown';
            
            if (workMode === 'normal') dailyData[dateKey].normal++;
            else if (workMode === 'standby') dailyData[dateKey].standby++;
            else if (workMode === 'fault') dailyData[dateKey].fault++;
            
            if (gridMode === 'on_grid') dailyData[dateKey].on_grid++;
            else if (gridMode === 'off_grid') dailyData[dateKey].off_grid++;
          }
        });
      }
    });
    
    // Calculate daily percentages
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      normal: day.total_samples > 0 ? ((day.normal / day.total_samples) * 100).toFixed(1) : 0,
      standby: day.total_samples > 0 ? ((day.standby / day.total_samples) * 100).toFixed(1) : 0,
      fault: day.total_samples > 0 ? ((day.fault / day.total_samples) * 100).toFixed(1) : 0,
      on_grid: day.total_samples > 0 ? ((day.on_grid / day.total_samples) * 100).toFixed(1) : 0,
      off_grid: day.total_samples > 0 ? ((day.off_grid / day.total_samples) * 100).toFixed(1) : 0
    }));
    
    // Calculate statistics
    const totalNormal = chartData.reduce((sum, d) => sum + parseFloat(d.normal), 0);
    const totalStandby = chartData.reduce((sum, d) => sum + parseFloat(d.standby), 0);
    const totalFault = chartData.reduce((sum, d) => sum + parseFloat(d.fault), 0);
    const totalOnGrid = chartData.reduce((sum, d) => sum + parseFloat(d.on_grid), 0);
    const totalOffGrid = chartData.reduce((sum, d) => sum + parseFloat(d.off_grid), 0);
    const totalDays = chartData.length;
    
    const stats = {
      avg_normal_percent: totalDays > 0 ? (totalNormal / totalDays).toFixed(2) : 0,
      avg_standby_percent: totalDays > 0 ? (totalStandby / totalDays).toFixed(2) : 0,
      avg_fault_percent: totalDays > 0 ? (totalFault / totalDays).toFixed(2) : 0,
      avg_on_grid_percent: totalDays > 0 ? (totalOnGrid / totalDays).toFixed(2) : 0,
      avg_off_grid_percent: totalDays > 0 ? (totalOffGrid / totalDays).toFixed(2) : 0,
      uptime_percent: totalDays > 0 ? (totalNormal / totalDays).toFixed(2) : 0
    };
    
    res.json({
      status: 'success',
      analytics: {
        period,
        statistics: stats,
        daily_data: chartData
      }
    });
  } catch (error) {
    console.error('Error calculating operating state analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate operating state analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/demand-forecast
 * Get demand forecast using time series analysis
 */
router.get('/v1/analytics/demand-forecast', async (req, res) => {
  try {
    const { deviceId, projectId, days = 7 } = req.query;
    const forecastDays = parseInt(days) || 7;
    
    let query = {};
    if (deviceId) {
      query.device_id = deviceId;
    } else if (projectId) {
      const devices = await Device.find({ project_id: projectId });
      query.device_id = { $in: devices.map(d => d.device_id) };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'deviceId or projectId parameter is required'
      });
    }
    
    // Get last 30 days of daily summaries for training
    const startDate = moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();
    
    const dailySummaries = await DailySummary.find({
      ...query,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    if (dailySummaries.length < 7) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient data for forecasting. Need at least 7 days of data.'
      });
    }
    
    // Extract energy values
    const energyData = dailySummaries.map(d => d.total_energy || 0);
    const dates = dailySummaries.map(d => moment(d.date).format('YYYY-MM-DD'));
    
    // Simple moving average forecast (can be enhanced with ARIMA, LSTM, etc.)
    const windowSize = Math.min(7, energyData.length);
    const recentAvg = energyData.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    
    // Calculate trend
    const firstHalf = energyData.slice(0, Math.floor(energyData.length / 2));
    const secondHalf = energyData.slice(Math.floor(energyData.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) : 0;
    
    // Calculate seasonality (day of week pattern)
    const dayOfWeekPattern = {};
    dailySummaries.forEach((d, idx) => {
      const dayOfWeek = moment(d.date).day();
      if (!dayOfWeekPattern[dayOfWeek]) {
        dayOfWeekPattern[dayOfWeek] = [];
      }
      dayOfWeekPattern[dayOfWeek].push(d.total_energy || 0);
    });
    
    const avgByDayOfWeek = {};
    Object.keys(dayOfWeekPattern).forEach(day => {
      const values = dayOfWeekPattern[day];
      avgByDayOfWeek[day] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    // Generate forecast
    const forecast = [];
    const forecastDates = [];
    const baseDate = moment().add(1, 'day');
    
    for (let i = 0; i < forecastDays; i++) {
      const forecastDate = baseDate.clone().add(i, 'days');
      const dayOfWeek = forecastDate.day();
      const seasonalFactor = avgByDayOfWeek[dayOfWeek] ? (avgByDayOfWeek[dayOfWeek] / recentAvg) : 1;
      
      // Apply trend and seasonality
      const predicted = recentAvg * (1 + trend * (i / forecastDays)) * seasonalFactor;
      
      forecast.push(Math.max(0, predicted));
      forecastDates.push(forecastDate.format('YYYY-MM-DD'));
    }
    
    // Calculate confidence (based on data variance)
    const variance = energyData.reduce((sum, val) => {
      const diff = val - recentAvg;
      return sum + (diff * diff);
    }, 0) / energyData.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / recentAvg * 100)));
    
    res.json({
      status: 'success',
      forecast: {
        days: forecastDays,
        predicted: forecast,
        dates: forecastDates,
        confidence: confidence.toFixed(1),
        trend: (trend * 100).toFixed(2),
        methodology: 'moving_average_with_seasonality',
        historical_data: {
          dates: dates,
          energy: energyData,
          avg: recentAvg.toFixed(2),
          std_dev: stdDev.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error calculating demand forecast:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate demand forecast'
    });
  }
});

module.exports = router;






