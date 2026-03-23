const mongoose = require('mongoose');

/** G6 — Configuration push (config/push) */
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

module.exports = mongoose.model('IotConfigSnapshot', schema);
