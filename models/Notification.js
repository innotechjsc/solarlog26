const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    index: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  device_id: {
    type: String,
    index: true
  },
  type: {
    type: String,
    enum: [
      'alarm',           // Cảnh báo từ thiết bị
      'maintenance',     // Nhắc nhở bảo trì
      'performance',     // Hiệu suất thấp
      'device_offline',  // Thiết bị offline
      'area_assigned',   // Được gán khu vực mới
      'system'           // Thông báo hệ thống
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  read_at: {
    type: Date
  },
  sent: {
    type: Boolean,
    default: false
  },
  sent_at: {
    type: Date
  },
  expires_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, type: 1, createdAt: -1 });
notificationSchema.index({ area_id: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// TTL index - auto delete after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Static method to create notification for area managers
notificationSchema.statics.notifyAreaManagers = async function(areaId, type, severity, title, message, data = {}) {
  const User = require('./User');
  
  // Find all managers assigned to this area
  const managers = await User.find({
    role: 'manager',
    assigned_areas: areaId,
    status: 'active'
  });
  
  const notifications = managers.map(manager => ({
    user_id: manager._id,
    area_id: areaId,
    type,
    severity,
    title,
    message,
    data
  }));
  
  if (notifications.length > 0) {
    return this.insertMany(notifications);
  }
  
  return [];
};

// Static method to create notification for project managers
notificationSchema.statics.notifyProjectManagers = async function(projectId, type, severity, title, message, data = {}) {
  const User = require('./User');
  
  // Find all managers assigned to this project
  const managers = await User.find({
    role: 'manager',
    assigned_projects: projectId,
    status: 'active'
  });
  
  const notifications = managers.map(manager => ({
    user_id: manager._id,
    project_id: projectId,
    type,
    severity,
    title,
    message,
    data
  }));
  
  if (notifications.length > 0) {
    return this.insertMany(notifications);
  }
  
  return [];
};

module.exports = mongoose.model('Notification', notificationSchema);

