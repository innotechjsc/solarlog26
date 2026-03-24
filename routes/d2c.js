/**
 * HTTP D2C fallback — base /api/v1/d2c
 * Same MQTT envelope + business payload as POST /api/v1/data / MQTT ingest.
 */

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { authenticateD2cBearer } = require('../middleware/d2cBearerAuth');
const { processIotIngest } = require('../services/iotIngestRouter');

const router = express.Router();

const d2cLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.D2C_RATE_LIMIT_MAX || 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message_id: null,
      error: { code: 'RATE_LIMITED', message: 'Too many D2C requests from this IP' }
    });
  }
});

router.use(d2cLimiter);

function jsonError(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    message_id: null,
    error: { code, message, ...(details != null ? { details } : {}) }
  });
}

function mergeInvIdIntoBody(body, invId) {
  if (invId == null || String(invId).trim() === '') return body;
  const id = String(invId).trim();
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const next = { ...body };
  const prevPl =
    next.payload && typeof next.payload === 'object' && !Array.isArray(next.payload)
      ? next.payload
      : {};
  next.payload = { ...prevPl, inv_id: id };
  return next;
}

async function handleD2c(req, res, topicMeta = {}) {
  try {
    let body = req.body;
    if (body.timestamp == null && body?.payload?.timestamp == null) {
      body = { ...body, timestamp: new Date().toISOString() };
    }
    const out = await processIotIngest(body, topicMeta);
    if (!out.ok) {
      return jsonError(res, 400, 'BAD_REQUEST', 'Validation failed', out.errors);
    }
    return res.status(202).json({
      success: true,
      message_id: crypto.randomUUID(),
      error: null
    });
  } catch (e) {
    console.error('[D2C]', e);
    return jsonError(res, 500, 'INTERNAL', e.message || 'Internal error');
  }
}

const TELEMETRY_SLICES = new Set(['grid', 'bess', 'pv', 'meter', 'weather', 'power_quality']);

router.post('/v1/d2c/telemetry/inverter/:inv_id', authenticateD2cBearer, (req, res) => {
  req.body = mergeInvIdIntoBody(req.body, req.params.inv_id);
  return handleD2c(req, res, {
    telemetry_kind: 'inverter',
    kind: 'inverter',
    inv_id: req.params.inv_id
  });
});

router.post('/v1/d2c/telemetry/:slice', authenticateD2cBearer, (req, res) => {
  const slice = String(req.params.slice || '').trim();
  if (!TELEMETRY_SLICES.has(slice)) {
    return jsonError(res, 400, 'BAD_REQUEST', `Unknown telemetry slice: ${slice || '(empty)'}`);
  }
  return handleD2c(req, res, { telemetry_kind: slice, kind: slice });
});

router.post('/v1/d2c/report', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'report' })
);
router.post('/v1/d2c/status', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'status' })
);
router.post('/v1/d2c/alarm', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'alarm' })
);
router.post('/v1/d2c/dispatch/response', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'dispatch_response' })
);
router.post('/v1/d2c/config/ack', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'config_ack' })
);
router.post('/v1/d2c/metering', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'metering' })
);
router.post('/v1/d2c/batch', authenticateD2cBearer, (req, res) =>
  handleD2c(req, res, { vpp_ingest_kind: 'sync_data' })
);

module.exports = router;
