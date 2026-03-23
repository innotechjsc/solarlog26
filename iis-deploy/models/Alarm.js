const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  alarm_code: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  inverter_id: {
    type: Number,
    default: null
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'ACKNOWLEDGED'],
    default: 'ACTIVE'
  },
  current_value: Number,
  threshold: Number,
  acknowledged_by: String,
  acknowledged_at: Date
}, {
  timestamps: true
});

// Compound indexes
alarmSchema.index({ device_id: 1, start_time: -1 });
alarmSchema.index({ status: 1, severity: 1 });

// TTL index - auto delete after 2 years
alarmSchema.index({ start_time: 1 }, { expireAfterSeconds: 63072000 });

// Method to resolve alarm
alarmSchema.methods.resolve = function() {
  this.status = 'RESOLVED';
  this.end_time = new Date();
  return this.save();
};

// Method to acknowledge alarm
alarmSchema.methods.acknowledge = function(user) {
  this.status = 'ACKNOWLEDGED';
  this.acknowledged_by = user;
  this.acknowledged_at = new Date();
  return this.save();
};

module.exports = mongoose.model('Alarm', alarmSchema);

