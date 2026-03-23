const mongoose = require('mongoose');

/** G2 — Energy Report (daily_energy, settlement, availability, performance, monthly) */
const schema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    site_id: { type: String, index: true },
    schema_version: String,
    sequence: Number,
    report_type: String,
    report_date: String,
    report_month: String,
    generated_at: Date,
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    received_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

schema.index({ device_id: 1, report_type: 1, report_date: -1 });

module.exports = mongoose.model('IotEnergyReport', schema);
