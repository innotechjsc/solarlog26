const mongoose = require('mongoose');
const DataPoint = require('../models/DataPoint');
require('dotenv').config();

/**
 * Query top 5 DataPoints có alarm data trong inverters[].alarm.data[]
 */
async function queryAlarmData() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@42.118.102.108:20719/solarlogger?authSource=admin';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Query DataPoints có alarm data
    // Tìm các document có inverters[].alarm.data[] không rỗng
    const dataPoints = await DataPoint.find({
      'inverters.alarm.data': { $exists: true, $ne: [], $not: { $size: 0 } }
    })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean(); // Use lean() để trả về plain JavaScript objects

    console.log(`📊 Found ${dataPoints.length} DataPoints with alarm data\n`);
    console.log('='.repeat(80));

    if (dataPoints.length === 0) {
      console.log('⚠️  No DataPoints with alarm data found.');
      console.log('\nTrying alternative query (checking if alarm field exists)...\n');
      
      // Alternative query: check if any inverter has alarm field
      const altDataPoints = await DataPoint.find({
        'inverters.alarm': { $exists: true }
      })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

      if (altDataPoints.length > 0) {
        console.log(`📊 Found ${altDataPoints.length} DataPoints with alarm field\n`);
        altDataPoints.forEach((dp, index) => {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`📌 Record ${index + 1}:`);
          console.log(`   Device ID: ${dp.device_id}`);
          console.log(`   Timestamp: ${dp.timestamp}`);
          console.log(`   Schema Version: ${dp.schema_version || 'N/A'}`);
          console.log(`   Number of Inverters: ${dp.inverters?.length || 0}`);
          
          if (dp.inverters && Array.isArray(dp.inverters)) {
            dp.inverters.forEach((inv, invIndex) => {
              if (inv.alarm) {
                console.log(`\n   🔔 Inverter ${invIndex + 1} Alarm:`);
                console.log(`      Count: ${inv.alarm.count || 0}`);
                if (inv.alarm.data && Array.isArray(inv.alarm.data)) {
                  console.log(`      Data Array Length: ${inv.alarm.data.length}`);
                  inv.alarm.data.forEach((alarmData, alarmIndex) => {
                    console.log(`\n      Alarm ${alarmIndex + 1}:`);
                    console.log(`         Type: ${alarmData.type || 'N/A'}`);
                    console.log(`         Code: ${alarmData.code || 'N/A'}`);
                    console.log(`         Text: ${alarmData.text || 'N/A'}`);
                    console.log(`         First Seen: ${alarmData.first_seen_ts ? new Date(alarmData.first_seen_ts * 1000).toISOString() : 'N/A'}`);
                    console.log(`         Last Seen: ${alarmData.last_seen_ts ? new Date(alarmData.last_seen_ts * 1000).toISOString() : 'N/A'}`);
                  });
                } else {
                  console.log(`      ⚠️  alarm.data is not an array or is empty`);
                }
              }
            });
          }
        });
      } else {
        console.log('⚠️  No DataPoints with alarm field found.');
        console.log('\nChecking all DataPoints structure...\n');
        
        // Get any DataPoint to see structure
        const anyDataPoint = await DataPoint.findOne().sort({ timestamp: -1 }).lean();
        if (anyDataPoint) {
          console.log('📋 Sample DataPoint structure:');
          console.log(`   Device ID: ${anyDataPoint.device_id}`);
          console.log(`   Timestamp: ${anyDataPoint.timestamp}`);
          console.log(`   Schema Version: ${anyDataPoint.schema_version || 'N/A'}`);
          console.log(`   Has inverters: ${!!anyDataPoint.inverters}`);
          console.log(`   Inverters count: ${anyDataPoint.inverters?.length || 0}`);
          
          if (anyDataPoint.inverters && anyDataPoint.inverters.length > 0) {
            const firstInv = anyDataPoint.inverters[0];
            console.log(`\n   First Inverter keys: ${Object.keys(firstInv).join(', ')}`);
            if (firstInv.alarm) {
              console.log(`   First Inverter has alarm field: YES`);
              console.log(`   Alarm structure:`, JSON.stringify(firstInv.alarm, null, 2));
            } else {
              console.log(`   First Inverter has alarm field: NO`);
            }
          }
        }
      }
    } else {
      // Display results
      dataPoints.forEach((dp, index) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📌 Record ${index + 1}:`);
        console.log(`   Device ID: ${dp.device_id}`);
        console.log(`   Timestamp: ${dp.timestamp}`);
        console.log(`   Timezone: ${dp.timezone || 'N/A'}`);
        console.log(`   Version: ${dp.version || 'N/A'}`);
        console.log(`   Schema Version: ${dp.schema_version || 'N/A'}`);
        console.log(`   FW Version: ${dp.fw_version || 'N/A'}`);
        console.log(`   Number of Inverters: ${dp.inverters?.length || 0}`);
        
        // Display system data
        if (dp.system) {
          console.log(`\n   📊 System Data:`);
          if (dp.system.total_ac_active_power_w !== undefined) {
            console.log(`      Total AC Active Power: ${dp.system.total_ac_active_power_w} W`);
          }
          if (dp.system.total_ac_power !== undefined) {
            console.log(`      Total AC Power: ${dp.system.total_ac_power} kW`);
          }
          console.log(`      Online Inverters: ${dp.system.online_inverters || 0}`);
          console.log(`      Total Inverters: ${dp.system.total_inverters || 0}`);
        }
        
        // Display alarm data from each inverter
        if (dp.inverters && Array.isArray(dp.inverters)) {
          dp.inverters.forEach((inv, invIndex) => {
            if (inv.alarm && inv.alarm.data && Array.isArray(inv.alarm.data) && inv.alarm.data.length > 0) {
              console.log(`\n   🔔 Inverter ${invIndex + 1} Alarm:`);
              
              // Display inverter info if available
              if (inv.info) {
                console.log(`      Inverter Info:`);
                console.log(`         Modbus Address: ${inv.info.modbus_address || 'N/A'}`);
                console.log(`         Serial Number: ${inv.info.serial_number || 'N/A'}`);
                console.log(`         Model: ${inv.info.model_name || 'N/A'}`);
              }
              
              console.log(`      Alarm Count: ${inv.alarm.count || inv.alarm.data.length}`);
              console.log(`      Number of Alarms: ${inv.alarm.data.length}`);
              
              inv.alarm.data.forEach((alarmData, alarmIndex) => {
                console.log(`\n      ⚠️  Alarm ${alarmIndex + 1}:`);
                console.log(`         Type: ${alarmData.type || 'N/A'} ${alarmData.type === 'error' ? '🔴' : alarmData.type === 'warning' ? '🟡' : ''}`);
                console.log(`         Code: ${alarmData.code || 'N/A'}`);
                console.log(`         Text: ${alarmData.text || 'N/A'}`);
                console.log(`         First Seen: ${alarmData.first_seen_ts ? new Date(alarmData.first_seen_ts * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A'}`);
                console.log(`         Last Seen: ${alarmData.last_seen_ts ? new Date(alarmData.last_seen_ts * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A'}`);
                
                // Additional fields if present
                if (alarmData.current_value !== undefined) {
                  console.log(`         Current Value: ${alarmData.current_value}`);
                }
                if (alarmData.threshold !== undefined) {
                  console.log(`         Threshold: ${alarmData.threshold}`);
                }
              });
            }
          });
        }
      });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Query completed\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the query
queryAlarmData();
