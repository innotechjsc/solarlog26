/**
 * Kiểm tra kết nối MQTT broker và publish thử (cho OTA)
 * Chạy trên server: node scripts/check-mqtt-connection.js
 * Cần: MQTT_BROKER_URL, MQTT_OTA_TOPIC, MQTT_USERNAME, MQTT_PASSWORD trong .env hoặc env
 */
require('dotenv').config();

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_OTA_TOPIC = process.env.MQTT_OTA_TOPIC || 'ota/release';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

console.log('=== Kiểm tra kết nối MQTT ===');
console.log('Broker:', MQTT_BROKER_URL);
console.log('Topic:', MQTT_OTA_TOPIC);
console.log('Auth:', MQTT_USERNAME ? `username=${MQTT_USERNAME}` : '(anonymous)');
console.log('');

const opts = { connectTimeout: 8000, keepalive: 10 };
if (MQTT_USERNAME) {
  opts.username = MQTT_USERNAME;
  opts.password = MQTT_PASSWORD;
}

try {
  const mqtt = require('mqtt');
  const client = mqtt.connect(MQTT_BROKER_URL, opts);

  client.on('connect', () => {
    console.log('OK: Đã kết nối MQTT broker thành công!');
    const testPayload = JSON.stringify({
      version: 'check-test',
      url: 'https://test',
      checksum_sha256: 'test',
      size: 0,
      published_at: new Date().toISOString()
    });
    client.publish(MQTT_OTA_TOPIC, testPayload, { qos: 1 }, (err) => {
      if (err) {
        console.error('ERR: Publish thử thất bại:', err.message);
      } else {
        console.log('OK: Publish thử lên topic', MQTT_OTA_TOPIC, 'thành công.');
      }
      client.end();
      process.exit(err ? 1 : 0);
    });
  });

  client.on('error', (err) => {
    console.error('ERR: Lỗi MQTT:', err.message);
    client.end();
    process.exit(1);
  });

  client.on('close', () => {});

  setTimeout(() => {
    if (!client.connected) {
      console.error('ERR: Timeout 8s - Không kết nối được broker. Kiểm tra:');
      console.error('  - Broker có đang chạy không? (pm2 list | netstat -an | findstr 1883)');
      console.error('  - MQTT_BROKER_URL đúng không?');
      console.error('  - MQTT_USERNAME/PASSWORD (nếu broker bật auth)');
      client.end();
      process.exit(1);
    }
  }, 8000);
} catch (e) {
  console.error('ERR: Không load được module mqtt:', e.message);
  process.exit(1);
}
