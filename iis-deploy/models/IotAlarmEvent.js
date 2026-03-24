const mongoose = require('mongoose');

/** G4 — Alarm & event (event_type, severity, envelope spec) */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    sequence: Number,
    event_type: String,
    severity: String,
    event_code: String,
    /** Idempotency — envelope hoặc payload.message_id (QoS1 / retry) */
    message_id: { type: String, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, event_type: 1, createdAt: -1 });
schema.index({ device_id: 1, message_id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('IotAlarmEvent', schema);
