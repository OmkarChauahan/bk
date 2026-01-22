const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');  // ⭐ Changed this line

// All routes require authentication
router.use(protect);  // ⭐ Changed from auth to protect

// Get all notifications
router.get('/', notificationController.getAllNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', notificationController.clearAll);

module.exports = router;