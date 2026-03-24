/**
 * HTTP D2C (device-to-cloud) — Authorization: Bearer {device_token}
 * Tokens: D2C_BEARER_TOKENS (comma-separated), fallback ALLOWED_API_KEYS.
 * If neither is set, every request returns 401 (configure at least one token).
 */

function parseTokenList() {
  const primary = String(process.env.D2C_BEARER_TOKENS || '').trim();
  const raw = primary || String(process.env.ALLOWED_API_KEYS || '');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

let warnedNoTokens = false;

function authenticateD2cBearer(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message_id: null,
      error: { code: 'UNAUTHORIZED', message: 'Authorization: Bearer {device_token} is required' }
    });
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message_id: null,
      error: { code: 'UNAUTHORIZED', message: 'Empty Bearer token' }
    });
  }

  const tokens = parseTokenList();
  if (tokens.length === 0) {
    if (!warnedNoTokens) {
      warnedNoTokens = true;
      console.warn('[D2C] Set D2C_BEARER_TOKENS or ALLOWED_API_KEYS — rejecting all D2C requests until configured');
    }
    return res.status(401).json({
      success: false,
      message_id: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Server has no D2C tokens configured (D2C_BEARER_TOKENS or ALLOWED_API_KEYS)'
      }
    });
  }

  if (!tokens.includes(token)) {
    return res.status(401).json({
      success: false,
      message_id: null,
      error: { code: 'UNAUTHORIZED', message: 'Invalid device token' }
    });
  }

  req.d2cDeviceToken = token;
  next();
}

module.exports = { authenticateD2cBearer, parseTokenList };
