const mongoose = require('mongoose');

const inverterSummarySchema = new mongoose.Schema({
  inverter_id: Number,
  energy: Number,
  max_power: Number,
  avg_power: Number,
  efficiency: Number
}, { _id: false });

const hourlySummarySchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  hour: {
    type: Date,
    required: true
  },
  total_energy: Number,
  max_power: Number,
  min_power: Number,
  avg_power: Number,
  avg_power_factor: Number,
  avg_frequency: Number,
  online_inverters: Number,
  inverter_summaries: [inverterSummarySchema]
}, {
  timestamps: true
});

// Compound index
hourlySummarySchema.index({ device_id: 1, hour: -1 });

// TTL index - auto delete after 1 year
hourlySummarySchema.index({ hour: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('HourlySummary', hourlySummarySchema);

