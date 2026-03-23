const mongoose = require('mongoose');

const inverterDailySummarySchema = new mongoose.Schema({
  inverter_id: Number,
  energy: Number,
  max_power: Number,
  avg_power: Number
}, { _id: false });

const batteryDailySummarySchema = new mongoose.Schema({
  total_charge: Number, // Total energy charged (kWh)
  total_discharge: Number, // Total energy discharged (kWh)
  avg_soc: Number // Average state of charge %
}, { _id: false });

const environmentalSummarySchema = new mongoose.Schema({
  coal_saved: Number, // Standard coal saved (tons)
  co2_avoided: Number, // CO2 avoided (tons)
  trees_equivalent: Number // Equivalent trees planted
}, { _id: false });

const dailySummarySchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  total_energy: Number,
  max_power: Number,
  min_power: Number,
  avg_power: Number,
  peak_hour: Number,
  sunshine_hours: Number,
  revenue: Number, // Revenue in VND
  battery: batteryDailySummarySchema,
  environmental: environmentalSummarySchema,
  inverter_summaries: [inverterDailySummarySchema]
}, {
  timestamps: true
});

// Compound index
dailySummarySchema.index({ device_id: 1, date: -1 });

// TTL index - auto delete after 5 years
dailySummarySchema.index({ date: 1 }, { expireAfterSeconds: 157680000 });

module.exports = mongoose.model('DailySummary', dailySummarySchema);

