const fs = require('fs');
const path = require('path');

function readBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return defaultValue;
  return !['0', 'false', 'no', 'off'].includes(String(raw).toLowerCase().trim());
}

function resolveMaybeRelative(filePath) {
  if (!filePath || !String(filePath).trim()) return '';
  const p = String(filePath).trim();
  if (path.isAbsolute(p)) return p;
  return path.join(__dirname, '..', p);
}

/**
 * Build MQTT connect options supporting server-auth TLS (mqtts://:8883).
 * Env:
 * - MQTT_USERNAME, MQTT_PASSWORD
 * - MQTT_TLS_ENABLED=true|false (optional override)
 * - MQTT_TLS_CA_FILE=/path/to/ca.pem (optional)
 * - MQTT_TLS_REJECT_UNAUTHORIZED=true|false (default true)
 * - MQTT_TLS_SERVERNAME=broker.example.com (optional SNI override)
 */
function buildMqttClientOptions(baseOpts = {}, brokerUrl = '') {
  const opts = {
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    keepalive: 60,
    ...baseOpts
  };

  const user = process.env.MQTT_USERNAME || '';
  const pass = process.env.MQTT_PASSWORD || '';
  if (user) {
    opts.username = user;
    opts.password = pass;
  }

  const tlsByUrl = String(brokerUrl || '').toLowerCase().startsWith('mqtts://');
  const tlsEnabled = readBool('MQTT_TLS_ENABLED', tlsByUrl);
  if (!tlsEnabled) return opts;

  opts.rejectUnauthorized = readBool('MQTT_TLS_REJECT_UNAUTHORIZED', true);

  const caPath = resolveMaybeRelative(process.env.MQTT_TLS_CA_FILE || '');
  if (caPath && fs.existsSync(caPath)) {
    opts.ca = fs.readFileSync(caPath);
  }

  const servername = (process.env.MQTT_TLS_SERVERNAME || '').trim();
  if (servername) opts.servername = servername;

  return opts;
}

module.exports = { buildMqttClientOptions };
