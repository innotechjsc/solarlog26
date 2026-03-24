const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

/**
 * IIS / iisnode: process.cwd() thường không phải thư mục chứa server.js → dotenv mặc định không đọc được .env.
 * Một số file .env gõ `KEY = value` (có space quanh =) → tên biến trong process.env có thể không khớp KEY.
 */
function envValueByCanonicalName(name) {
  const n = String(name).trim();
  if (process.env[n] != null && String(process.env[n]).trim() !== '') {
    return String(process.env[n]).trim();
  }
  for (const k of Object.keys(process.env)) {
    if (k.trim() === n) return String(process.env[k]).trim();
  }
  return '';
}

const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Import services
const websocketService = require('./services/websocketService');
const mqttOtaService = require('./services/mqttOtaService');
const mqttTelemetryIngestService = require('./services/mqttTelemetryIngestService');

// Import middleware
const { apiLogger, shouldLog } = require('./middleware/logger');

// Import routes
const dataRoutes = require('./routes/data');
const deviceRoutes = require('./routes/devices');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cmsRoutes = require('./routes/cms');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const logsRoutes = require('./routes/logs');
const otaRoutes = require('./routes/ota');
const d2cRoutes = require('./routes/d2c');

const app = express();
// For IIS/iisnode, use process.env.PORT, otherwise default to 5023
const PORT = process.env.PORT || process.env.IISNODE_HTTP_PORT || 5023;

// Middleware
// CSP connect-src: thêm OTA upload subdomain nếu OTA_UPLOAD_BASE_URL được cấu hình
const connectSrcList = [
  "'self'",
  'http://localhost:*',
  'http://127.0.0.1:*',
  'https://cdn.jsdelivr.net'
];
const otaUploadUrl = process.env.OTA_UPLOAD_BASE_URL || '';
if (otaUploadUrl) {
  try {
    const u = new URL(otaUploadUrl);
    connectSrcList.push(u.origin);
  } catch (e) { /* ignore */ }
}
// Thêm các subdomain upload thường dùng (phòng config.js trả domain khác env)
connectSrcList.push('https://upload.adtrade.site', 'https://upload.sol.adtrade.site');
// Configure Helmet with CSP that allows external scripts for dashboard
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-hashes'",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: [
        "'unsafe-inline'",
        "'unsafe-hashes'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: connectSrcList
    }
  }
}));
// CORS: hỗ trợ nhiều origin (phân cách bằng dấu phẩy) để admin tại sol.adtrade.site gọi upload.adtrade.site
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : '*';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Logging middleware (should be after body parser, before routes)
app.use((req, res, next) => {
  if (shouldLog(req.path)) {
    apiLogger(req, res, next);
  } else {
    next();
  }
});

// Serve static files from dashboard folder
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Admin config (OTA upload subdomain - bypass Cloudflare) - inject env for frontend
// No-cache để luôn lấy giá trị mới khi đổi OTA_UPLOAD_BASE_URL
app.get('/admin/config.js', (req, res) => {
  const uploadBase = process.env.OTA_UPLOAD_BASE_URL || '';
  res.type('application/javascript');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(`window.ADMIN_CONFIG = ${JSON.stringify({ otaUploadBaseUrl: uploadBase ? uploadBase.replace(/\/$/, '') + '/api/v1' : '' })};`);
});

// Redirect /admin to /admin/admin/index.html (new admin panel) - MUST be before static middleware
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin', 'index.html'));
});

// Serve static files from admin folder (but exclude /admin route which is handled above)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// Redirect /reports to /reports/index.html
app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'reports', 'index.html'));
});
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Rate limiting - Increased for dashboard usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased for dashboard)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost; D2C có rate limit riêng trong routes/d2c.js
  skip: (req) => {
    const url = String(req.originalUrl || req.url || '').split('?')[0];
    if (url.includes('/v1/d2c')) return true;
    return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  }
});
app.use('/api/', limiter);

// Swagger UI — server mặc định dùng relative `/` để "Try it out" gọi đúng host (vd: sol.adtrade.site),
// tránh lỗi Failed to fetch khi mở Swagger trên domain nhưng servers vẫn trỏ localhost.
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
const swaggerServerUrl = envValueByCanonicalName('SWAGGER_SERVER_URL').replace(/\/$/, '');
swaggerDocument.servers = swaggerServerUrl
  ? [{ url: swaggerServerUrl, description: 'From SWAGGER_SERVER_URL' }]
  : [
      { url: '/', description: 'Cùng host với trang này (khuyến nghị)' },
      { url: `http://localhost:${PORT}`, description: `Localhost cổng ${PORT}` }
    ];
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SolarLogger API Documentation',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', d2cRoutes); // HTTP D2C fallback — Bearer device_token, /api/v1/d2c/*
app.use('/api', dataRoutes);
app.use('/api', deviceRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', adminRoutes);
app.use('/api', reportsRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', cmsRoutes);
app.use('/api', notificationRoutes);
app.use('/api', dashboardRoutes); // Dashboard aggregation route
app.use('/api', logsRoutes); // API logs route
app.use('/api', otaRoutes); // OTA releases (latest, by version, upload, publish MQTT)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  
  const sslKey =
    envValueByCanonicalName('SSL_KEY_FILE') || envValueByCanonicalName('HTTPS_KEY_FILE');
  const sslCert =
    envValueByCanonicalName('SSL_CERT_FILE') || envValueByCanonicalName('HTTPS_CERT_FILE');
  let server;
  if (sslKey && sslCert) {
    try {
      server = https.createServer(
        {
          key: fs.readFileSync(sslKey),
          cert: fs.readFileSync(sslCert)
        },
        app
      );
      console.log('HTTPS: listening with SSL_KEY_FILE / SSL_CERT_FILE');
    } catch (e) {
      console.error('HTTPS: failed to read cert/key, falling back to HTTP:', e.message);
      server = http.createServer(app);
    }
  } else {
    server = http.createServer(app);
  }

  // Initialize WebSocket
  websocketService.initialize(server);

  // MQTT: subscribe OTA progress/result (Device.ota_status); no-op if broker/mqtt unavailable
  mqttOtaService.subscribeOtaStatusTopics();
  // MQTT ingest Logger→Cloud (G1–G9 topics) — MQTT_TELEMETRY_INGEST_ENABLED=true
  mqttTelemetryIngestService.subscribeTelemetryTopics();

  // Start server
  server.listen(PORT, () => {
    const proto = server instanceof https.Server ? 'https' : 'http';
    console.log(`SolarLogger Backend API server running on ${proto}://0.0.0.0:${PORT}`);
    console.log(`WebSocket server initialized`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`MongoDB: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

