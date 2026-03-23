const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    index: true
  },
  /** IoT envelope site_id — giá trị hiệu lực (query/UI); CMS có thể khóa ghi đè từ logger */
  site_id: {
    type: String,
    default: '',
    index: true
  },
  /** `site_id` logger vừa gửi (luôn cập nhật khi ingest có field) */
  site_id_reported: {
    type: String,
    default: ''
  },
  /**
   * true = CMS đã chỉnh `site_id`; ingest HTTP không ghi đè `site_id` (vẫn cập nhật `site_id_reported`).
   * Gỡ khóa: CMS gửi `site_id_follow_device: true` khi PUT device.
   */
  site_id_cms_locked: {
    type: Boolean,
    default: false
  },
  site_name: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: 'Asia/Ho_Chi_Minh'
  },
  version: {
    type: String,
    default: '0.9.0'
  },
  total_inverters: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  last_seen: {
    type: Date,
    default: Date.now
  },
  metadata: {
    installation_date: Date,
    warranty_expiry: Date,
    notes: String
  },
  // Device info from payload v0.9.0 info section
  device_info: {
    serial_number: String,
    model_name: String,
    inverter_type: String,
    rated_power_w: Number,
    hw_version: String,
    protocol: String,
    modbus_address: Number
  },
  /** Cập nhật từ MQTT: ota/cm4/<device_id>/progress | .../result */
  ota_status: {
    command_id: { type: String, default: '' },
    progress: {
      stage: String,
      progress_pct: Number,
      message: String,
      speed_kbps: Number,
      eta_seconds: Number,
      updated_at: Date
    },
    result: {
      status: String,
      version: String,
      previous_version: String,
      rebooted: Boolean,
      error_code: String,
      error_message: String,
      duration_seconds: Number,
      updated_at: Date
    }
  }
}, {
  timestamps: true
});

// Compound indexes
deviceSchema.index({ project_id: 1, area_id: 1 });
deviceSchema.index({ project_id: 1, status: 1 });
deviceSchema.index({ area_id: 1, status: 1 });

// Update last_seen and status on data receive
deviceSchema.statics.updateDeviceStatus = async function(deviceId, isOnline = true) {
  return this.findOneAndUpdate(
    { device_id: deviceId },
    {
      status: isOnline ? 'online' : 'offline',
      last_seen: new Date()
    },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Device', deviceSchema);


