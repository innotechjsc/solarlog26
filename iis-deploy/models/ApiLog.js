const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  },
  path: {
    type: String,
    required: true,
    index: true
  },
  status_code: {
    type: Number,
    required: true,
    index: true
  },
  status_type: {
    type: String,
    enum: ['success', 'error', 'client_error', 'server_error'],
    required: true,
    index: true
  },
  ip_address: {
    type: String,
    index: true
  },
  user_agent: {
    type: String
  },
  response_time_ms: {
    type: Number,
    default: 0
  },
  request_size_bytes: {
    type: Number,
    default: 0
  },
  response_size_bytes: {
    type: Number,
    default: 0
  },
  error_message: {
    type: String
  },
  api_key: {
    type: String,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  request_body: {
    type: mongoose.Schema.Types.Mixed
  },
  response_body: {
    type: mongoose.Schema.Types.Mixed
  },
  query_params: {
    type: mongoose.Schema.Types.Mixed
  },
  headers: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ method: 1, path: 1, createdAt: -1 });
apiLogSchema.index({ status_code: 1, createdAt: -1 });
apiLogSchema.index({ ip_address: 1, createdAt: -1 });

// TTL index - auto delete logs older than 90 days (optional, can be configured)
// apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('ApiLog', apiLogSchema);
