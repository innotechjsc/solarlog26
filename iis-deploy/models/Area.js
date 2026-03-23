const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  capacity: {
    type: Number, // Total capacity in kW
    default: 0
  },
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    }
  }
}, {
  timestamps: true
});

// Compound index for unique area code per project
areaSchema.index({ project_id: 1, code: 1 }, { unique: true });
areaSchema.index({ project_id: 1, status: 1 });

module.exports = mongoose.model('Area', areaSchema);

