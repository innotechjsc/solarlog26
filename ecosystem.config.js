// PM2 — API + broker MQTT nội bộ (Aedes). Dùng: pm2 start ecosystem.config.js --env production
// Nếu dùng Mosquitto/EMQX bên ngoài: không cần app mqtt-broker; chỉ cần MQTT_BROKER_URL trỏ đúng broker.

const path = require('path');

module.exports = {
  apps: [
    {
      name: 'solarlogger-api',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5023
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5023
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'mqtt-broker',
      script: './scripts/mqtt-broker-local.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/mqtt-broker-err.log',
      out_file: './logs/mqtt-broker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
};
