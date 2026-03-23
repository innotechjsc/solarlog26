const ApiLog = require('../models/ApiLog');

/**
 * Middleware to log all API requests
 */
const apiLogger = async (req, res, next) => {
  const startTime = Date.now();
  const requestStartTime = process.hrtime.bigint();
  
  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody = null;
  let requestBody = null;
  
  // Capture request body (limit size to prevent logging huge payloads)
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length < 10000) { // Only log if body is less than 10KB
      requestBody = req.body;
    }
  }
  
  // Override res.send to capture response
  res.send = function(body) {
    if (body && typeof body === 'string' && body.length < 10000) {
      try {
        responseBody = JSON.parse(body);
      } catch (e) {
        responseBody = body.substring(0, 500); // Truncate if not JSON
      }
    }
    return originalSend.call(this, body);
  };
  
  // Override res.json to capture response
  res.json = function(body) {
    if (body && typeof body === 'object') {
      const bodyStr = JSON.stringify(body);
      if (bodyStr.length < 10000) {
        responseBody = body;
      }
    }
    return originalJson.call(this, body);
  };
  
  // Log after response is sent
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Determine status type
      let statusType = 'success';
      if (res.statusCode >= 500) {
        statusType = 'server_error';
      } else if (res.statusCode >= 400) {
        statusType = 'client_error';
      } else if (res.statusCode >= 300) {
        statusType = 'success';
      }
      
      // Get IP address
      const ip = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                 'unknown';
      
      // Get API key if present
      const apiKey = req.headers['x-api-key'] || 
                     req.headers['X-API-Key'] ||
                     req.headers['authorization']?.replace('Bearer ', '') ||
                     null;
      
      // Prepare log entry
      const logData = {
        method: req.method,
        path: req.path || req.url,
        status_code: res.statusCode,
        status_type: statusType,
        ip_address: ip,
        user_agent: req.headers['user-agent'] || null,
        response_time_ms: responseTime,
        request_size_bytes: req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0,
        response_size_bytes: res.get('content-length') ? parseInt(res.get('content-length')) : 0,
        api_key: apiKey ? (apiKey.length > 20 ? apiKey.substring(0, 20) + '...' : apiKey) : null,
        user_id: req.user ? req.user._id : null,
        query_params: Object.keys(req.query).length > 0 ? req.query : undefined,
        request_body: requestBody,
        response_body: responseBody
      };
      
      // Only log error message if status is error
      if (statusType !== 'success') {
        if (responseBody && responseBody.message) {
          logData.error_message = responseBody.message;
        } else if (responseBody && responseBody.error) {
          logData.error_message = responseBody.error;
        }
      }
      
      // Save log asynchronously (don't block response)
      ApiLog.create(logData).catch(err => {
        console.error('Error saving API log:', err);
      });
      
    } catch (error) {
      console.error('Error in API logger middleware:', error);
    }
  });
  
  next();
};

/**
 * Filter to exclude certain paths from logging
 */
const shouldLog = (path) => {
  // Only log API requests (paths starting with /api)
  if (!path.startsWith('/api')) {
    return false;
  }
  
  // Skip logging for static assets, health checks, etc.
  const skipPaths = [
    '/health',
    '/favicon.ico'
  ];
  
  return !skipPaths.some(skipPath => path.startsWith(skipPath));
};

module.exports = { apiLogger, shouldLog };
