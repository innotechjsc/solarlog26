const mongoose = require('mongoose');

/** G9 — Metering & settlement (interval, daily_index, audit) */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    sequence: Number,
    metering_type: { type: String, index: true },
    meter_serial: String,
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, metering_type: 1, createdAt: -1 });

module.exports = mongoose.model('IotMeteringRecord', schema);
