const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/v1/auth/register
 * Register a new user (admin only)
 */
router.post('/v1/auth/register', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, full_name, role, assigned_areas, assigned_projects, metadata } = req.body;
    
    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, password, and full_name are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }
    
    // Create user
    const user = new User({
      username,
      email,
      password,
      full_name,
      role: role || 'user',
      assigned_areas: assigned_areas || [],
      assigned_projects: assigned_projects || [],
      metadata: metadata || {}
    });
    
    await user.save();
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'User account is inactive'
      });
    }
    
    // Update last login
    user.last_login = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/v1/auth/me', authenticateJWT, async (req, res) => {
  try {
    res.json({
      status: 'success',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user info'
    });
  }
});

/**
 * PUT /api/v1/auth/me
 * Update current user profile
 */
router.put('/v1/auth/me', authenticateJWT, async (req, res) => {
  try {
    const { full_name, preferences, metadata } = req.body;
    
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };
    if (metadata) updates.metadata = { ...req.user.metadata, ...metadata };
    
    Object.assign(req.user, updates);
    await req.user.save();
    
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * PUT /api/v1/auth/change-password
 * Change password
 */
router.put('/v1/auth/change-password', authenticateJWT, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Verify current password
    const isPasswordValid = await req.user.comparePassword(current_password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    req.user.password = new_password;
    await req.user.save();
    
    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
});

module.exports = router;

