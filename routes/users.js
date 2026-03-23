const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateJWT, requireRole, requirePermission } = require('../middleware/auth');

/**
 * GET /api/v1/users
 * Get all users (admin only)
 */
router.get('/v1/users', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('assigned_areas', 'name code')
      .populate('assigned_projects', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user by ID
 */
router.get('/v1/users/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only view your own profile'
      });
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('assigned_areas', 'name code')
      .populate('assigned_projects', 'name code');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

/**
 * PUT /api/v1/users/:userId
 * Update user (admin only, or user updating themselves)
 */
router.put('/v1/users/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, role, assigned_areas, assigned_projects, status, preferences, metadata } = req.body;
    
    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === userId;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own profile'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Only admin can change role, status, and assignments
    if (isAdmin) {
      if (role) user.role = role;
      if (status) user.status = status;
      if (assigned_areas !== undefined) user.assigned_areas = assigned_areas;
      if (assigned_projects !== undefined) user.assigned_projects = assigned_projects;
    }
    
    // Users can update their own profile
    if (full_name) user.full_name = full_name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (metadata) user.metadata = { ...user.metadata, ...metadata };
    
    await user.save();
    
    res.json({
      status: 'success',
      message: 'User updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/v1/users/:userId
 * Delete user (admin only)
 */
router.delete('/v1/users/:userId', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent deleting yourself
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;

