// PM2 ecosystem configuration for SolarLogger API
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
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
  }]
};

