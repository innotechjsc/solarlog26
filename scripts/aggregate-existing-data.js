require('dotenv').config();
const mongoose = require('mongoose');
const DataPoint = require('../models/DataPoint');
const Device = require('../models/Device');
const DailySummary = require('../models/DailySummary');
const HourlySummary = require('../models/HourlySummary');
const moment = require('moment-timezone');
const aggregationService = require('../services/aggregationService');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

async function aggregateExistingData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all devices
    const devices = await Device.find({ device_id: /^SL-TEST-/ }).select('device_id');
    console.log(`Found ${devices.length} devices\n`);

    if (devices.length === 0) {
      console.log('No devices found. Please run insert-test-data.js first.');
      return;
    }

    // Process each device
    for (const device of devices) {
      console.log(`Processing device: ${device.device_id}`);
      
      // Get all data points for this device, sorted by timestamp
      const dataPoints = await DataPoint.find({ device_id: device.device_id })
        .sort({ timestamp: 1 });
      
      if (dataPoints.length === 0) {
        console.log(`  No data points found, skipping...\n`);
        continue;
      }

      console.log(`  Found ${dataPoints.length} data points`);

      // Group data points by hour
      const hourlyGroups = new Map();
      dataPoints.forEach(dp => {
        const hourKey = moment(dp.timestamp).startOf('hour').toISOString();
        if (!hourlyGroups.has(hourKey)) {
          hourlyGroups.set(hourKey, []);
        }
        hourlyGroups.get(hourKey).push(dp);
      });

      console.log(`  Creating ${hourlyGroups.size} hourly summaries...`);

      // Aggregate hourly summaries first
      let hourlyCount = 0;
      for (const [hourKey, dps] of hourlyGroups) {
        const hourStart = new Date(hourKey);
        try {
          await aggregationService.aggregateHourly(device.device_id, hourStart);
          hourlyCount++;
        } catch (err) {
          console.error(`    Error aggregating hour ${hourKey}:`, err.message);
        }
      }

      console.log(`    Created ${hourlyCount} hourly summaries`);

      // Group hourly summaries by day for daily aggregation
      const hourlySummaries = await HourlySummary.find({ device_id: device.device_id })
        .sort({ hour: 1 });
      
      const dailyGroups = new Map();
      hourlySummaries.forEach(hs => {
        const dayKey = moment(hs.hour).startOf('day').toISOString();
        if (!dailyGroups.has(dayKey)) {
          dailyGroups.set(dayKey, []);
        }
        dailyGroups.get(dayKey).push(hs);
      });

      console.log(`  Creating ${dailyGroups.size} daily summaries...`);

      // Aggregate daily summaries from hourly summaries
      let dailyCount = 0;
      for (const [dayKey, hourlySummaries] of dailyGroups) {
        const dayStart = new Date(dayKey);
        try {
          await aggregationService.aggregateDaily(device.device_id, dayStart);
          dailyCount++;
        } catch (err) {
          console.error(`    Error aggregating day ${dayKey}:`, err.message);
        }
      }
      
      console.log(`    Created ${dailyCount} daily summaries`);

      console.log(`  ✅ Completed device: ${device.device_id}\n`);
    }

    // Summary
    const totalHourly = await HourlySummary.countDocuments({ device_id: /^SL-TEST-/ });
    const totalDaily = await DailySummary.countDocuments({ device_id: /^SL-TEST-/ });
    
    console.log('========================================');
    console.log('✅ Aggregation complete!');
    console.log(`Total Hourly Summaries: ${totalHourly}`);
    console.log(`Total Daily Summaries: ${totalDaily}`);
    console.log('========================================');
    console.log('\nYou can now view reports at: http://localhost:5023/reports');

  } catch (error) {
    console.error('Error aggregating data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  aggregateExistingData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = aggregateExistingData;

