const mongoose = require('mongoose');

const releaseSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  filename: {
    type: String,
    required: true,
    default: 'firmware.bin'
  },
  filepath: {
    type: String,
    required: true,
    trim: true
  },
  checksum_sha256: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  release_notes: {
    type: String,
    default: ''
  },
  is_latest: {
    type: Boolean,
    default: false,
    index: true
  },
  published_at: {
    type: Date,
    default: null
  },
  mqtt_pushed_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// When setting is_latest = true, unset others
releaseSchema.pre('save', async function (next) {
  if (this.isModified('is_latest') && this.is_latest) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { is_latest: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Release', releaseSchema);
