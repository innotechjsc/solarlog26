/**
 * Cập nhật device_id trong database: LOGGER-RPI-001 → SL-2025-0001
 * Chạy từ thư mục backend-system: node scripts/update-device-id.js
 * Cần: MONGODB_URI trong .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');
const Alarm = require('../models/Alarm');
const HourlySummary = require('../models/HourlySummary');
const DailySummary = require('../models/DailySummary');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

const OLD_ID = 'LOGGER-RPI-001';
const NEW_ID = 'SL-2025-0001';

async function run() {
  try {
    console.log('Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối.\n');

    const existingNew = await Device.findOne({ device_id: NEW_ID });
    if (existingNew) {
      console.error(`Đã tồn tại thiết bị device_id="${NEW_ID}". Không đổi tên để tránh trùng.`);
      process.exit(1);
    }

    const device = await Device.findOne({ device_id: OLD_ID });
    if (!device) {
      console.error(`Không tìm thấy thiết bị device_id="${OLD_ID}".`);
      process.exit(1);
    }

    console.log(`Đổi device_id: "${OLD_ID}" → "${NEW_ID}"\n`);

    const rDevice = await Device.updateOne({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('Device:', rDevice.modifiedCount, 'document(s) updated.');

    const rDataPoint = await DataPoint.updateMany({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('DataPoint:', rDataPoint.modifiedCount, 'document(s) updated.');

    const rAlarm = await Alarm.updateMany({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('Alarm:', rAlarm.modifiedCount, 'document(s) updated.');

    const rHourly = await HourlySummary.updateMany({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('HourlySummary:', rHourly.modifiedCount, 'document(s) updated.');

    const rDaily = await DailySummary.updateMany({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('DailySummary:', rDaily.modifiedCount, 'document(s) updated.');

    const rNotif = await Notification.updateMany({ device_id: OLD_ID }, { $set: { device_id: NEW_ID } });
    console.log('Notification:', rNotif.modifiedCount, 'document(s) updated.');

    console.log('\nHoàn tất. Thiết bị hiển thị trong Admin là SL-2025-0001.');
  } catch (err) {
    console.error('Lỗi:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
