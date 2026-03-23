const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    address: {
      type: String,
      default: ''
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  electricity_price: {
    type: Number,
    default: 2000 // VND per kWh - default price
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  contact_person: {
    name: String,
    email: String,
    phone: String
  },
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    },
    currency: {
      type: String,
      default: 'VND'
    }
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ code: 1 }, { unique: true });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);

