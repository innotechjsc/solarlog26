const DataPoint = require('../models/DataPoint');
const HourlySummary = require('../models/HourlySummary');
const DailySummary = require('../models/DailySummary');
const Device = require('../models/Device');
const Project = require('../models/Project');
const moment = require('moment-timezone');

class AggregationService {
  /**
   * Aggregate data points into hourly summary
   */
  async aggregateHourly(deviceId, hourStart) {
    const hourEnd = moment(hourStart).add(1, 'hour').toDate();
    
    const dataPoints = await DataPoint.find({
      device_id: deviceId,
      timestamp: { $gte: hourStart, $lt: hourEnd }
    }).sort({ timestamp: 1 });
    
    if (dataPoints.length === 0) {
      return null;
    }
    
    // Calculate aggregations
    const powers = dataPoints.map(dp => dp.system?.total_ac_power || 0);
    const energies = dataPoints.map(dp => dp.system?.energy_5min || 0);
    const powerFactors = dataPoints.map(dp => dp.system?.avg_power_factor || 0);
    const frequencies = dataPoints.map(dp => dp.system?.avg_frequency || 0);
    
    const totalEnergy = energies.reduce((sum, e) => sum + e, 0);
    const maxPower = Math.max(...powers);
    const minPower = Math.min(...powers);
    const avgPower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
    const avgPowerFactor = powerFactors.reduce((sum, pf) => sum + pf, 0) / powerFactors.length;
    const avgFrequency = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
    
    // Aggregate inverter data
    const inverterMap = new Map();
    dataPoints.forEach(dp => {
      if (dp.inverters) {
        dp.inverters.forEach(inv => {
          if (!inverterMap.has(inv.id)) {
            inverterMap.set(inv.id, {
              inverter_id: inv.id,
              energies: [],
              powers: [],
              efficiencies: []
            });
          }
          const invData = inverterMap.get(inv.id);
          invData.energies.push(inv.daily_yield || 0);
          invData.powers.push(inv.ac_power || 0);
          invData.efficiencies.push(inv.efficiency || 0);
        });
      }
    });
    
    const inverterSummaries = Array.from(inverterMap.values()).map(invData => ({
      inverter_id: invData.inverter_id,
      energy: Math.max(...invData.energies) - Math.min(...invData.energies),
      max_power: Math.max(...invData.powers),
      avg_power: invData.powers.reduce((sum, p) => sum + p, 0) / invData.powers.length,
      efficiency: invData.efficiencies.reduce((sum, e) => sum + e, 0) / invData.efficiencies.length
    }));
    
    const onlineInverters = dataPoints[dataPoints.length - 1]?.system?.online_inverters || 0;
    
    // Save or update hourly summary
    const summary = await HourlySummary.findOneAndUpdate(
      { device_id: deviceId, hour: hourStart },
      {
        device_id: deviceId,
        hour: hourStart,
        total_energy: totalEnergy,
        max_power: maxPower,
        min_power: minPower,
        avg_power: avgPower,
        avg_power_factor: avgPowerFactor,
        avg_frequency: avgFrequency,
        online_inverters: onlineInverters,
        inverter_summaries: inverterSummaries
      },
      { upsert: true, new: true }
    );
    
    return summary;
  }
  
  /**
   * Aggregate hourly summaries into daily summary
   */
  async aggregateDaily(deviceId, dateStart) {
    const dateEnd = moment(dateStart).add(1, 'day').toDate();
    
    const hourlySummaries = await HourlySummary.find({
      device_id: deviceId,
      hour: { $gte: dateStart, $lt: dateEnd }
    }).sort({ hour: 1 });
    
    if (hourlySummaries.length === 0) {
      return null;
    }
    
    const totalEnergy = hourlySummaries.reduce((sum, h) => sum + (h.total_energy || 0), 0);
    const maxPower = Math.max(...hourlySummaries.map(h => h.max_power || 0));
    const minPower = Math.min(...hourlySummaries.map(h => h.min_power || 0));
    const avgPower = hourlySummaries.reduce((sum, h) => sum + (h.avg_power || 0), 0) / hourlySummaries.length;
    
    // Find peak hour
    let peakHour = 0;
    let maxHourlyPower = 0;
    hourlySummaries.forEach(h => {
      if (h.max_power > maxHourlyPower) {
        maxHourlyPower = h.max_power;
        peakHour = moment(h.hour).hour();
      }
    });
    
    // Calculate sunshine hours (hours with power > 0)
    const sunshineHours = hourlySummaries.filter(h => (h.avg_power || 0) > 0).length;
    
    // Aggregate inverter data
    const inverterMap = new Map();
    hourlySummaries.forEach(h => {
      if (h.inverter_summaries) {
        h.inverter_summaries.forEach(inv => {
          if (!inverterMap.has(inv.inverter_id)) {
            inverterMap.set(inv.inverter_id, {
              inverter_id: inv.inverter_id,
              energies: [],
              powers: [],
              maxPowers: []
            });
          }
          const invData = inverterMap.get(inv.inverter_id);
          invData.energies.push(inv.energy || 0);
          invData.powers.push(inv.avg_power || 0);
          invData.maxPowers.push(inv.max_power || 0);
        });
      }
    });
    
    const inverterSummaries = Array.from(inverterMap.values()).map(invData => ({
      inverter_id: invData.inverter_id,
      energy: invData.energies.reduce((sum, e) => sum + e, 0),
      max_power: Math.max(...invData.maxPowers),
      avg_power: invData.powers.reduce((sum, p) => sum + p, 0) / invData.powers.length
    }));
    
    // Aggregate battery data from data points
    const batteryDataPoints = await DataPoint.find({
      device_id: deviceId,
      timestamp: { $gte: dateStart, $lt: dateEnd },
      battery: { $exists: true }
    }).sort({ timestamp: 1 });
    
    let totalCharge = 0;
    let totalDischarge = 0;
    const socValues = [];
    
    batteryDataPoints.forEach(dp => {
      if (dp.battery) {
        if (dp.battery.charge_energy_today) {
          totalCharge = Math.max(totalCharge, dp.battery.charge_energy_today);
        }
        if (dp.battery.discharge_energy_today) {
          totalDischarge = Math.max(totalDischarge, dp.battery.discharge_energy_today);
        }
        if (dp.battery.soc !== undefined && dp.battery.soc !== null) {
          socValues.push(dp.battery.soc);
        }
      }
    });
    
    const batterySummary = {
      total_charge: totalCharge,
      total_discharge: totalDischarge,
      avg_soc: socValues.length > 0 ? socValues.reduce((sum, s) => sum + s, 0) / socValues.length : 0
    };
    
    // Calculate revenue
    let revenue = 0;
    try {
      const device = await Device.findOne({ device_id: deviceId });
      if (device && device.project_id) {
        const project = await Project.findById(device.project_id);
        if (project && project.electricity_price) {
          revenue = totalEnergy * project.electricity_price; // kWh * VND/kWh = VND
        }
      }
    } catch (error) {
      console.error('Error calculating revenue:', error);
    }
    
    // Calculate environmental impact
    // Formulas:
    // Coal saved (tons) = Energy (MWh) * 0.4
    // CO2 avoided (tons) = Energy (MWh) * 0.5
    // Trees equivalent = CO2 avoided (tons) * 1.4
    const energyMWh = totalEnergy / 1000; // Convert kWh to MWh
    const environmental = {
      coal_saved: energyMWh * 0.4,
      co2_avoided: energyMWh * 0.5,
      trees_equivalent: Math.round((energyMWh * 0.5) * 1.4)
    };
    
    // Save or update daily summary
    const summary = await DailySummary.findOneAndUpdate(
      { device_id: deviceId, date: dateStart },
      {
        device_id: deviceId,
        date: dateStart,
        total_energy: totalEnergy,
        max_power: maxPower,
        min_power: minPower,
        avg_power: avgPower,
        peak_hour: peakHour,
        sunshine_hours: sunshineHours,
        revenue: revenue,
        battery: batterySummary,
        environmental: environmental,
        inverter_summaries: inverterSummaries
      },
      { upsert: true, new: true }
    );
    
    return summary;
  }
  
  /**
   * Process aggregation for a data point (called after data point is saved)
   */
  async processAggregation(deviceId, timestamp) {
    const ts = moment(timestamp);
    const hourStart = ts.startOf('hour').toDate();
    const dayStart = ts.startOf('day').toDate();
    
    // Aggregate hourly (if this is the last data point of the hour)
    const nextHour = moment(hourStart).add(1, 'hour');
    if (ts.isSameOrAfter(nextHour.subtract(5, 'minutes'))) {
      await this.aggregateHourly(deviceId, hourStart);
    }
    
    // Aggregate daily (if this is the last data point of the day)
    const nextDay = moment(dayStart).add(1, 'day');
    if (ts.isSameOrAfter(nextDay.subtract(5, 'minutes'))) {
      await this.aggregateDaily(deviceId, dayStart);
    }
  }
}

module.exports = new AggregationService();






