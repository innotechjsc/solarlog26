const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Area = require('../models/Area');
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');
const DailySummary = require('../models/DailySummary');
const HourlySummary = require('../models/HourlySummary');
const Alarm = require('../models/Alarm');
const moment = require('moment-timezone');

/**
 * GET /api/v1/reports/project/:projectId/detailed
 * Get detailed project report with predictions
 */
router.get('/v1/reports/project/:projectId/detailed', async (req, res) => {
  try {
    const { period = '30days', predictDays = 7 } = req.query;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    // Get all devices in project
    const devices = await Device.find({ project_id: req.params.projectId })
      .distinct('device_id');
    
    // Calculate date range
    const endDate = new Date();
    let startDate;
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '90days':
        startDate = moment().subtract(90, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    // Get daily summaries
    const dailySummaries = await DailySummary.find({
      device_id: { $in: devices },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate statistics
    const totalEnergy = dailySummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const avgDailyEnergy = dailySummaries.length > 0 ? totalEnergy / dailySummaries.length : 0;
    const maxDailyEnergy = Math.max(...dailySummaries.map(d => d.total_energy || 0), 0);
    const minDailyEnergy = Math.min(...dailySummaries.filter(d => d.total_energy > 0).map(d => d.total_energy || 0), maxDailyEnergy);
    
    // Calculate trend (linear regression for prediction)
    const predictions = calculateEnergyPrediction(dailySummaries, parseInt(predictDays));
    
    // Get hourly data for last 7 days
    const hourlyStartDate = moment().subtract(7, 'days').toDate();
    const hourlySummaries = await HourlySummary.find({
      device_id: { $in: devices },
      hour: { $gte: hourlyStartDate, $lte: endDate }
    }).sort({ hour: 1 });
    
    // Group by hour of day for average pattern
    const hourlyPattern = calculateHourlyPattern(hourlySummaries);
    
    // Get areas statistics
    const areas = await Area.find({ project_id: req.params.projectId });
    const areaStats = await Promise.all(
      areas.map(async (area) => {
        const areaDevices = await Device.find({ area_id: area._id }).distinct('device_id');
        const areaSummaries = dailySummaries.filter(d => areaDevices.includes(d.device_id));
        const areaEnergy = areaSummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
        
        return {
          area_id: area._id,
          area_name: area.name,
          area_code: area.code,
          energy: areaEnergy,
          percentage: totalEnergy > 0 ? (areaEnergy / totalEnergy) * 100 : 0,
          devices: areaDevices.length
        };
      })
    );
    
    // Calculate efficiency metrics
    const efficiency = calculateEfficiency(dailySummaries, hourlySummaries);
    
    res.json({
      status: 'success',
      project: {
        id: project._id,
        name: project.name,
        code: project.code
      },
      period: {
        start: startDate,
        end: endDate,
        days: moment(endDate).diff(moment(startDate), 'days')
      },
      statistics: {
        total_energy: totalEnergy,
        avg_daily_energy: avgDailyEnergy,
        max_daily_energy: maxDailyEnergy,
        min_daily_energy: minDailyEnergy,
        total_days: dailySummaries.length,
        devices_count: devices.length,
        areas_count: areas.length
      },
      efficiency: efficiency,
      daily_data: dailySummaries.map(d => ({
        date: d.date,
        energy: d.total_energy,
        max_power: d.max_power,
        avg_power: d.avg_power,
        sunshine_hours: d.sunshine_hours
      })),
      hourly_pattern: hourlyPattern,
      predictions: predictions,
      areas: areaStats
    });
  } catch (error) {
    console.error('Error generating detailed project report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate detailed report'
    });
  }
});

/**
 * GET /api/v1/reports/area/:areaId/detailed
 * Get detailed area report
 */
router.get('/v1/reports/area/:areaId/detailed', async (req, res) => {
  try {
    const { period = '30days', predictDays = 7 } = req.query;
    const area = await Area.findById(req.params.areaId).populate('project_id');
    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found'
      });
    }
    
    // Get all devices in area
    const devices = await Device.find({ area_id: req.params.areaId })
      .distinct('device_id');
    
    // Calculate date range
    const endDate = new Date();
    let startDate;
    switch (period) {
      case '7days':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30days':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      case '90days':
        startDate = moment().subtract(90, 'days').toDate();
        break;
      case '1year':
        startDate = moment().subtract(1, 'year').toDate();
        break;
      default:
        startDate = moment().subtract(30, 'days').toDate();
    }
    
    // Get daily summaries
    const dailySummaries = await DailySummary.find({
      device_id: { $in: devices },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate statistics
    const totalEnergy = dailySummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const avgDailyEnergy = dailySummaries.length > 0 ? totalEnergy / dailySummaries.length : 0;
    const maxDailyEnergy = Math.max(...dailySummaries.map(d => d.total_energy || 0), 0);
    
    // Calculate predictions
    const predictions = calculateEnergyPrediction(dailySummaries, parseInt(predictDays));
    
    // Get hourly data
    const hourlyStartDate = moment().subtract(7, 'days').toDate();
    const hourlySummaries = await HourlySummary.find({
      device_id: { $in: devices },
      hour: { $gte: hourlyStartDate, $lte: endDate }
    }).sort({ hour: 1 });
    
    const hourlyPattern = calculateHourlyPattern(hourlySummaries);
    
    // Get device stats
    const deviceStats = await Promise.all(
      devices.map(async (deviceId) => {
        const device = await Device.findOne({ device_id: deviceId });
        const deviceSummaries = dailySummaries.filter(d => d.device_id === deviceId);
        const deviceEnergy = deviceSummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
        const deviceHourly = hourlySummaries.filter(h => h.device_id === deviceId);
        
        return {
          device_id: deviceId,
          device_name: device?.site_name || deviceId,
          energy: deviceEnergy,
          percentage: totalEnergy > 0 ? (deviceEnergy / totalEnergy) * 100 : 0,
          status: device?.status || 'offline',
          avg_power: deviceHourly.length > 0 
            ? deviceHourly.reduce((sum, h) => sum + (h.avg_power || 0), 0) / deviceHourly.length 
            : 0
        };
      })
    );
    
    res.json({
      status: 'success',
      area: {
        id: area._id,
        name: area.name,
        code: area.code,
        project: {
          id: area.project_id._id,
          name: area.project_id.name,
          code: area.project_id.code
        }
      },
      period: {
        start: startDate,
        end: endDate,
        days: moment(endDate).diff(moment(startDate), 'days')
      },
      statistics: {
        total_energy: totalEnergy,
        avg_daily_energy: avgDailyEnergy,
        max_daily_energy: maxDailyEnergy,
        total_days: dailySummaries.length,
        devices_count: devices.length
      },
      daily_data: dailySummaries.map(d => ({
        date: d.date,
        energy: d.total_energy,
        max_power: d.max_power,
        avg_power: d.avg_power
      })),
      hourly_pattern: hourlyPattern,
      predictions: predictions,
      devices: deviceStats
    });
  } catch (error) {
    console.error('Error generating detailed area report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate detailed report'
    });
  }
});

/**
 * Calculate energy prediction using linear regression
 */
function calculateEnergyPrediction(dailySummaries, days) {
  if (dailySummaries.length < 7) {
    // Not enough data for prediction
    return {
        dates: [],
        predicted: [],
        trend: 0,
        confidence: 0
    };
  }
  
  // Get last 30 days for trend calculation
  const recentData = dailySummaries.slice(-30);
  const n = recentData.length;
  
  // Calculate linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  recentData.forEach((d, index) => {
    const x = index;
    const y = d.total_energy || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate average for baseline
  const avgEnergy = sumY / n;
  
  // Generate predictions
  const predictions = [];
  const dates = [];
  const lastDate = moment(dailySummaries[dailySummaries.length - 1].date);
  
  for (let i = 1; i <= days; i++) {
    const futureDate = lastDate.clone().add(i, 'days');
    const x = n + i - 1;
    const predicted = Math.max(0, slope * x + intercept); // Don't allow negative
    
    predictions.push(predicted);
    dates.push(futureDate.toDate());
  }
  
  // Calculate trend percentage
  const trend = avgEnergy > 0 ? (slope / avgEnergy) * 100 : 0;
  
  // Calculate confidence (based on data consistency)
  const variance = recentData.reduce((sum, d) => {
    const diff = (d.total_energy || 0) - avgEnergy;
    return sum + diff * diff;
  }, 0) / n;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgEnergy) * 100));
  
  return {
    dates,
    predicted: predictions,
    trend: trend,
    confidence: confidence,
    baseline: avgEnergy
  };
}

/**
 * Calculate hourly pattern (average energy by hour of day)
 */
function calculateHourlyPattern(hourlySummaries) {
  const pattern = Array(24).fill(0).map(() => ({ energy: 0, count: 0 }));
  
  hourlySummaries.forEach(h => {
    const hour = moment(h.hour).hour();
    if (pattern[hour]) {
      pattern[hour].energy += h.total_energy || 0;
      pattern[hour].count += 1;
    }
  });
  
  return pattern.map((p, hour) => ({
    hour: hour,
    avg_energy: p.count > 0 ? p.energy / p.count : 0
  }));
}

/**
 * Calculate efficiency metrics
 */
function calculateEfficiency(dailySummaries, hourlySummaries) {
  if (dailySummaries.length === 0) {
    return {
      avg_efficiency: 0,
      peak_efficiency: 0,
      utilization_rate: 0
    };
  }
  
  // Calculate average efficiency from hourly summaries
  let totalEfficiency = 0;
  let efficiencyCount = 0;
  
  hourlySummaries.forEach(h => {
    if (h.inverter_summaries) {
      h.inverter_summaries.forEach(inv => {
        if (inv.efficiency) {
          totalEfficiency += inv.efficiency;
          efficiencyCount++;
        }
      });
    }
  });
  
  const avgEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;
  
  // Calculate peak efficiency
  const peakEfficiency = Math.max(...hourlySummaries.map(h => {
    if (h.inverter_summaries) {
      return Math.max(...h.inverter_summaries.map(inv => inv.efficiency || 0));
    }
    return 0;
  }), 0);
  
  // Calculate utilization rate (hours with power > 0 / total hours)
  const totalHours = hourlySummaries.length;
  const activeHours = hourlySummaries.filter(h => (h.avg_power || 0) > 0).length;
  const utilizationRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;
  
  return {
    avg_efficiency: avgEfficiency,
    peak_efficiency: peakEfficiency,
    utilization_rate: utilizationRate
  };
}

module.exports = router;

