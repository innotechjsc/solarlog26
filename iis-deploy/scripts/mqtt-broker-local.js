/**
 * MQTT broker chạy trên local (port 1883) để test OTA push không cần cài Mosquitto.
 * Chạy: node scripts/mqtt-broker-local.js
 * Sau đó chạy backend: npm start
 * HTTP port 1884: GET / → số thiết bị đang subscribe topic ota/release (cho admin)
 *
 * Xác thực (tùy chọn): đặt MQTT_USERNAME và MQTT_PASSWORD trong env để bật auth.
 * Nếu đặt cả hai, broker yêu cầu client kết nối với username/password tương ứng.
 */
require('dotenv').config();
const net = require('net');
const http = require('http');
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const authEnabled = Boolean(MQTT_USERNAME && MQTT_PASSWORD);

const aedesModule = require('aedes');
const createBroker = typeof aedesModule === 'function' ? aedesModule : (aedesModule.default || aedesModule.createBroker);
if (typeof createBroker !== 'function') {
  throw new Error('aedes: expected function export. Got: ' + typeof aedesModule + '. Try: npm install aedes@0.50');
}
const aedes = createBroker({
  authenticate: (client, username, password, cb) => {
    if (!authEnabled) {
      return cb(null, true); // Cho phép anonymous
    }
    const pass = password ? password.toString() : '';
    if (username === MQTT_USERNAME && pass === MQTT_PASSWORD) {
      cb(null, true);
    } else {
      const err = new Error('Authentication failed');
      err.returnCode = 4; // MQTT 3.1.1: Bad username or password
      cb(err, false);
    }
  }
});
const server = net.createServer(aedes.handle);
const PORT = parseInt(process.env.MQTT_PORT || '1883', 10);
const HTTP_PORT = parseInt(process.env.MQTT_STATS_PORT || '1884', 10);
const OTA_TOPIC = process.env.MQTT_OTA_TOPIC || 'ota/release';
const OTA_TOPIC_PREFIX = process.env.MQTT_OTA_TOPIC_PREFIX || 'ota/cm4';

// Số client đang subscribe topic ota/release (legacy broadcast, cho admin)
const otaSubscribers = new Map();

// Theo dõi device_id đang subscribe ota/cm4/<device_id>/command (spec)
const commandTopicRe = new RegExp(`^${OTA_TOPIC_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)/command$`);
const topicToClients = new Map();   // topic -> Set<clientId>
const clientToCommandTopics = new Map(); // clientId -> Set<topic>

function updateOtaSubscribers(client, subs, add) {
  const arr = Array.isArray(subs) ? subs : [subs];
  const hasOta = arr.some(s => s && (s.topic === OTA_TOPIC || (s.topic && s.topic.toString() === OTA_TOPIC)));
  if (hasOta) {
    if (add) otaSubscribers.set(client.id, true);
    else otaSubscribers.delete(client.id);
  }
}

function updateCommandSubscriptions(client, subs, add) {
  const arr = Array.isArray(subs) ? subs : [subs];
  for (const sub of arr) {
    const topic = sub && (sub.topic || sub);
    if (!topic || typeof topic !== 'string') continue;
    const m = topic.match(commandTopicRe);
    if (!m) continue;
    if (add) {
      if (!topicToClients.has(topic)) topicToClients.set(topic, new Set());
      topicToClients.get(topic).add(client.id);
      if (!clientToCommandTopics.has(client.id)) clientToCommandTopics.set(client.id, new Set());
      clientToCommandTopics.get(client.id).add(topic);
    } else {
      clientToCommandTopics.get(client.id)?.delete(topic);
      const s = topicToClients.get(topic);
      if (s) {
        s.delete(client.id);
        if (s.size === 0) topicToClients.delete(topic);
      }
    }
  }
}

function getSubscribedDeviceIds() {
  return Array.from(topicToClients.keys()).map(t => t.split('/')[2]).filter(Boolean);
}

aedes.on('subscribe', (subs, client) => {
  updateOtaSubscribers(client, subs, true);
  updateCommandSubscriptions(client, subs, true);
});
aedes.on('unsubscribe', (unsubs, client) => {
  const arr = Array.isArray(unsubs) ? unsubs : [unsubs];
  const topics = arr.map(t => (t && t.toString) ? t.toString() : t);
  const hadOta = topics.some(t => t === OTA_TOPIC);
  if (hadOta) otaSubscribers.delete(client.id);
  updateCommandSubscriptions(client, topics.map(t => ({ topic: t })), false);
});
aedes.on('clientDisconnect', (client) => {
  otaSubscribers.delete(client.id);
  const topics = clientToCommandTopics.get(client.id);
  if (topics) {
    for (const topic of topics) {
      const s = topicToClients.get(topic);
      if (s) {
        s.delete(client.id);
        if (s.size === 0) topicToClients.delete(topic);
      }
    }
    clientToCommandTopics.delete(client.id);
  }
});

server.listen(PORT, () => {
  console.log(`[MQTT Broker] Chạy trên port ${PORT} (mqtt://localhost:${PORT})`);
  if (authEnabled) {
    console.log('[MQTT Broker] Auth bật: username=' + MQTT_USERNAME + ' (cần MQTT_USERNAME, MQTT_PASSWORD khi connect)');
  } else {
    console.log('[MQTT Broker] Auth tắt (allow_anonymous). Đặt MQTT_USERNAME + MQTT_PASSWORD để bật.');
  }
  console.log('[MQTT Broker] Backend dùng MQTT_BROKER_URL + MQTT_USERNAME, MQTT_PASSWORD');
});

aedes.on('client', (c) => {
  console.log('[MQTT Broker] Client kết nối:', c.id);
});
aedes.on('publish', (pkt, c) => {
  if (pkt.topic === OTA_TOPIC) {
    console.log('[MQTT Broker] OTA message published to ' + OTA_TOPIC);
  }
});

// HTTP: stats và danh sách device_id đang sub command topic
const httpServer = http.createServer((req, res) => {
  const url = req.url || '';
  const path = url.split('?')[0];
  if (req.method !== 'GET') {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (path === '/' || path === '/subscribers') {
    const count = otaSubscribers.size;
    res.end(JSON.stringify({ topic: OTA_TOPIC, subscribers: count }));
    return;
  }
  if (path === '/subscribed-devices') {
    const device_ids = getSubscribedDeviceIds();
    res.end(JSON.stringify({
      topic_pattern: `${OTA_TOPIC_PREFIX}/<device_id>/command`,
      device_ids,
      count: device_ids.length
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});
httpServer.listen(HTTP_PORT, () => {
  console.log('[MQTT Broker] Stats HTTP port ' + HTTP_PORT + ' (GET / hoặc /subscribers → count; GET /subscribed-devices → device_ids đang sub command)');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[MQTT Broker] Port ${PORT} đang dùng. Có thể đã chạy broker khác (Mosquitto). Dừng hoặc đặt MQTT_PORT khác.`);
  } else {
    console.error('[MQTT Broker] Lỗi:', err.message);
  }
  process.exit(1);
});
