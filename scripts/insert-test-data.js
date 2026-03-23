require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Area = require('../models/Area');
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

// Random number generator
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic inverter data
function generateInverter(id, basePower) {
  const power = basePower * randomFloat(0.8, 1.2);
  return {
    id: id,
    slave_address: id,
    model: `SMA-${randomInt(2000, 3000)}`,
    ac_power: Math.round(power * 100) / 100,
    ac_voltage_l1: randomFloat(220, 240),
    ac_current_l1: power / 230,
    power_factor: randomFloat(0.95, 1.0),
    grid_frequency: randomFloat(49.8, 50.2),
    daily_yield: 0,
    device_state: 'RUNNING',
    alarm_code: 0,
    efficiency: randomFloat(95, 98),
    internal_temp: randomFloat(35, 55)
  };
}

// Generate system data
function generateSystemData(numInverters, basePower) {
  const inverters = [];
  let totalPower = 0;
  
  for (let i = 1; i <= numInverters; i++) {
    const inverter = generateInverter(i, basePower / numInverters);
    inverters.push(inverter);
    totalPower += inverter.ac_power;
  }
  
  // Simulate day/night cycle - power is higher during day
  const hour = new Date().getHours();
  let timeMultiplier = 1;
  if (hour >= 6 && hour <= 18) {
    // Daytime: simulate sun position
    const sunPosition = Math.sin((hour - 6) / 12 * Math.PI);
    timeMultiplier = 0.3 + sunPosition * 0.7; // 30% to 100%
  } else {
    // Nighttime: minimal power
    timeMultiplier = 0.05;
  }
  
  totalPower *= timeMultiplier;
  
  return {
    system: {
      total_ac_power: Math.round(totalPower * 100) / 100,
      total_reactive_power: Math.round(totalPower * 0.1 * 100) / 100,
      avg_power_factor: randomFloat(0.95, 1.0),
      avg_frequency: randomFloat(49.9, 50.1),
      online_inverters: numInverters,
      total_inverters: numInverters,
      energy_5min: Math.round((totalPower / 12) * 100) / 100, // kWh in 5 minutes
      system_state: 'RUNNING'
    },
    inverters: inverters
  };
}

async function insertTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing test data (optional - comment out if you want to keep existing data)
    console.log('\nCleaning up existing test data...');
    await Project.deleteMany({ code: { $in: ['PRJ-001', 'PRJ-002'] } });
    await DataPoint.deleteMany({ device_id: /^SL-TEST-/ });
    console.log('Cleanup complete');

    // Create Projects
    console.log('\nCreating projects...');
    const project1 = await Project.create({
      name: 'Nhà Máy Điện Mặt Trời Bình Dương',
      code: 'PRJ-001',
      description: 'Dự án điện mặt trời quy mô lớn tại Bình Dương',
      location: 'Bình Dương, Việt Nam',
      status: 'active',
      start_date: new Date('2024-01-01'),
      contact_person: {
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '0123456789'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });

    const project2 = await Project.create({
      name: 'Trang Trại Năng Lượng Đồng Nai',
      code: 'PRJ-002',
      description: 'Trang trại năng lượng mặt trời tại Đồng Nai',
      location: 'Đồng Nai, Việt Nam',
      status: 'active',
      start_date: new Date('2024-03-01'),
      contact_person: {
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '0987654321'
      },
      settings: {
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND'
      }
    });
    console.log(`Created projects: ${project1.name}, ${project2.name}`);

    // Create Areas
    console.log('\nCreating areas...');
    const areas = [];
    
    // Project 1 areas
    const area1 = await Area.create({
      name: 'Khu vực A - Phía Đông',
      code: 'AREA-A1',
      project_id: project1._id,
      description: 'Khu vực lắp đặt phía đông nhà máy',
      location: 'Khu A - Phía Đông',
      capacity: 500, // kW
      status: 'active'
    });
    
    const area2 = await Area.create({
      name: 'Khu vực B - Phía Tây',
      code: 'AREA-A2',
      project_id: project1._id,
      description: 'Khu vực lắp đặt phía tây nhà máy',
      location: 'Khu B - Phía Tây',
      capacity: 500,
      status: 'active'
    });
    
    // Project 2 areas
    const area3 = await Area.create({
      name: 'Khu vực 1 - Mặt tiền',
      code: 'AREA-B1',
      project_id: project2._id,
      description: 'Khu vực mặt tiền trang trại',
      location: 'Khu 1 - Mặt tiền',
      capacity: 300,
      status: 'active'
    });
    
    const area4 = await Area.create({
      name: 'Khu vực 2 - Phía sau',
      code: 'AREA-B2',
      project_id: project2._id,
      description: 'Khu vực phía sau trang trại',
      location: 'Khu 2 - Phía sau',
      capacity: 300,
      status: 'active'
    });
    
    areas.push(area1, area2, area3, area4);
    console.log(`Created ${areas.length} areas`);

    // Create Devices
    console.log('\nCreating devices...');
    const devices = [];
    const deviceIds = [];
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      const project = i < 2 ? project1 : project2;
      
      // Create 2 devices per area
      for (let j = 1; j <= 2; j++) {
        const deviceId = `SL-TEST-${String(i + 1).padStart(2, '0')}${String(j).padStart(2, '0')}`;
        const device = await Device.create({
          device_id: deviceId,
          project_id: project._id,
          area_id: area._id,
          site_name: `${area.name} - Thiết bị ${j}`,
          location: area.location,
          timezone: 'Asia/Ho_Chi_Minh',
          version: '0.9.0',
          total_inverters: randomInt(4, 8),
          status: 'online',
          last_seen: new Date(),
          metadata: {
            installation_date: new Date('2024-01-15'),
            warranty_expiry: new Date('2027-01-15')
          }
        });
        devices.push(device);
        deviceIds.push(deviceId);
        console.log(`  Created device: ${deviceId} (${device.total_inverters} inverters)`);
      }
    }
    console.log(`Created ${devices.length} devices`);

    // Generate DataPoints - 100 records
    // Focus on last 7 days (70%) and spread rest over 30 days (30%)
    console.log('\nGenerating DataPoints...');
    const now = new Date();
    const dataPoints = [];
    
    for (let i = 0; i < 100; i++) {
      let daysAgo;
      // 70% of data in last 7 days, 30% in last 30 days
      if (i < 70) {
        daysAgo = randomInt(0, 7);
      } else {
        daysAgo = randomInt(8, 30);
      }
      
      // Random hour (weighted towards daytime for more realistic data)
      const hour = i < 50 ? randomInt(6, 18) : randomInt(0, 23);
      // Random minute
      const minute = randomInt(0, 59);
      
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(hour, minute, 0, 0);
      
      // Pick random device
      const deviceId = deviceIds[randomInt(0, deviceIds.length - 1)];
      const device = devices.find(d => d.device_id === deviceId);
      
      if (!device) continue;
      
      // Base power varies by area capacity
      const basePower = device.area_id.equals(area1._id) || device.area_id.equals(area2._id) 
        ? randomFloat(400, 500)  // Larger capacity areas
        : randomFloat(200, 300);  // Smaller capacity areas
      
      // Simulate day/night cycle
      const hourOfDay = timestamp.getHours();
      let timeMultiplier = 1;
      if (hourOfDay >= 6 && hourOfDay <= 18) {
        const sunPosition = Math.sin((hourOfDay - 6) / 12 * Math.PI);
        timeMultiplier = 0.2 + sunPosition * 0.8;
      } else {
        timeMultiplier = 0.05;
      }
      
      const systemData = generateSystemData(device.total_inverters, basePower * timeMultiplier);
      
      const dataPoint = new DataPoint({
        device_id: deviceId,
        timestamp: timestamp,
        timezone: 'Asia/Ho_Chi_Minh',
        version: '0.9.0',
        system: systemData.system,
        inverters: systemData.inverters
      });
      
      dataPoints.push(dataPoint);
    }
    
    // Insert in batches
    console.log(`Inserting ${dataPoints.length} DataPoints...`);
    const batchSize = 20;
    for (let i = 0; i < dataPoints.length; i += batchSize) {
      const batch = dataPoints.slice(i, i + batchSize);
      await DataPoint.insertMany(batch);
      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataPoints.length / batchSize)}`);
    }
    
    console.log('\n✅ Test data insertion complete!');
    console.log(`\nSummary:`);
    console.log(`  Projects: 2`);
    console.log(`  Areas: ${areas.length}`);
    console.log(`  Devices: ${devices.length}`);
    console.log(`  DataPoints: ${dataPoints.length}`);
    console.log(`\nYou can now view reports at: http://localhost:5023/reports`);
    
  } catch (error) {
    console.error('Error inserting test data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  insertTestData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = insertTestData;

