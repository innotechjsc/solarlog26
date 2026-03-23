const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user',
    index: true
  },
  assigned_areas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  }],
  assigned_projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  last_login: {
    type: Date
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'vi' },
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh' }
  },
  metadata: {
    phone: String,
    department: String,
    position: String,
    notes: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user permissions
userSchema.methods.hasPermission = function(permission) {
  const permissions = {
    admin: [
      'projects.create', 'projects.read', 'projects.update', 'projects.delete',
      'areas.create', 'areas.read', 'areas.update', 'areas.delete',
      'devices.create', 'devices.read', 'devices.update', 'devices.delete',
      'users.create', 'users.read', 'users.update', 'users.delete',
      'reports.read', 'reports.export',
      'analytics.read', 'analytics.export'
    ],
    manager: [
      'projects.read',
      'areas.read', 'areas.update',
      'devices.read', 'devices.update',
      'users.read',
      'reports.read', 'reports.export',
      'analytics.read', 'analytics.export',
      'notifications.receive'
    ],
    user: [
      'projects.read',
      'areas.read',
      'devices.read',
      'reports.read',
      'analytics.read'
    ]
  };
  
  return permissions[this.role]?.includes(permission) || false;
};

// Method to check if user can access area
userSchema.methods.canAccessArea = function(areaId) {
  if (this.role === 'admin') return true;
  if (this.role === 'manager' && this.assigned_areas.includes(areaId)) return true;
  return false;
};

// Method to check if user can access project
userSchema.methods.canAccessProject = function(projectId) {
  if (this.role === 'admin') return true;
  if (this.role === 'manager' && this.assigned_projects.includes(projectId)) return true;
  return false;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Indexes
// Note: email and username already have unique indexes from unique: true
userSchema.index({ role: 1, status: 1 });
userSchema.index({ assigned_areas: 1 });
userSchema.index({ assigned_projects: 1 });

module.exports = mongoose.model('User', userSchema);

