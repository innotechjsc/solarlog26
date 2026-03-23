const mongoose = require('mongoose');

/** G8 — sync/data (offline batch) */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    batch_id: { type: String, index: true },
    batch_index: Number,
    batch_total: Number,
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, batch_id: 1 });

module.exports = mongoose.model('IotSyncBatch', schema);
