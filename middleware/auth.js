// API Key authentication middleware (for device data ingestion)
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateApiKey = (req, res, next) => {
  // Default header name is 'X-API-Key'
  const apiKeyHeaderName = (process.env.API_KEY_HEADER || 'X-API-Key').trim();
  const allowedKeys = (process.env.ALLOWED_API_KEYS || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  // Express normalizes headers to lowercase, so check lowercase version
  // Also check original case and common variations
  const apiKey = req.headers[apiKeyHeaderName.toLowerCase()] || 
                 req.headers[apiKeyHeaderName] ||
                 req.headers['x-api-key'] ||
                 req.headers['X-API-Key'] ||
                 req.headers['authorization']?.replace('Bearer ', '');
  
  // Debug log (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('API Key check:', {
      headerName: apiKeyHeaderName,
      receivedKey: apiKey || 'NOT FOUND',
      allowedKeys: allowedKeys,
      allHeaders: Object.keys(req.headers).filter(h => h.toLowerCase().includes('api') || h.toLowerCase().includes('key')),
      headerValue: req.headers[apiKeyHeaderName.toLowerCase()] || req.headers['x-api-key'] || 'NOT FOUND'
    });
  }
  
  if (!apiKey) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_API_KEY',
      message: 'API key is required'
    });
  }
  
  // If no allowed keys configured, allow any key (for development)
  if (allowedKeys.length === 0) {
    console.warn('WARNING: No ALLOWED_API_KEYS configured. Allowing any API key.');
    req.apiKey = apiKey;
    return next();
  }
  
  if (!allowedKeys.includes(apiKey)) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_API_KEY',
      message: 'API key is invalid or expired'
    });
  }
  
  req.apiKey = apiKey;
  next();
};

// JWT authentication middleware (for web users)
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required'
      });
    }
    
    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({
          status: 'error',
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Permission check middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Role check middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have the required role'
      });
    }
    
    next();
  };
};

// Optional authentication - sets req.user if token is valid, but doesn't fail if missing
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    // Continue even if auth fails
    next();
  }
};

module.exports = {
  authenticateApiKey,
  authenticateJWT,
  requirePermission,
  requireRole,
  optionalAuth
};
