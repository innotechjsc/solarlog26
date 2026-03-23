const mongoose = require('mongoose');

/** G3 — Device status / heartbeat (~60s) */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    sequence: Number,
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, createdAt: -1 });

module.exports = mongoose.model('IotDeviceStatus', schema);
