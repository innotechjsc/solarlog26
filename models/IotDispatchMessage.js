const mongoose = require('mongoose');

/** G5 — dispatch/command & dispatch/response */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    sequence: Number,
    command_id: String,
    direction: { type: String, enum: ['command', 'response'], default: 'response' },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, command_id: 1, createdAt: -1 });

module.exports = mongoose.model('IotDispatchMessage', schema);
