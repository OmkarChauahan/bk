const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');

// Admin routes
router.get('/all',          protect, authorize('Admin'), getAllLeaves);
router.patch('/:id/status', protect, authorize('Admin'), updateLeaveStatus);

// Employee routes
router.post('/',  protect, applyLeave);
router.get('/my', protect, getMyLeaves);

module.exports = router;