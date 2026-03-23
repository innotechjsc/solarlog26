const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateJWT } = require('../middleware/auth');

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
router.get('/v1/notifications', authenticateJWT, async (req, res) => {
  try {
    const { read, type, limit = 50 } = req.query;
    
    const query = { user_id: req.user._id };
    
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .populate('area_id', 'name code')
      .populate('project_id', 'name code')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Count unread
    const unreadCount = await Notification.countDocuments({
      user_id: req.user._id,
      read: false
    });
    
    res.json({
      status: 'success',
      count: notifications.length,
      unread_count: unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * PUT /api/v1/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/v1/notifications/:notificationId/read', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      user_id: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    notification.read = true;
    notification.read_at = new Date();
    await notification.save();
    
    res.json({
      status: 'success',
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.put('/v1/notifications/read-all', authenticateJWT, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user._id, read: false },
      { read: true, read_at: new Date() }
    );
    
    res.json({
      status: 'success',
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * DELETE /api/v1/notifications/:notificationId
 * Delete notification
 */
router.delete('/v1/notifications/:notificationId', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user_id: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
});

module.exports = router;

