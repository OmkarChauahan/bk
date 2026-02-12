// backend/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance,
  autoMarkAttendance,
  getAllAttendance,
  getMyAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

// ⭐⭐⭐ DEBUG MIDDLEWARE - YE SABSE UPAR RAKHO ⭐⭐⭐
router.use((req, res, next) => {
  console.log('\n🚦 ===== ATTENDANCE ROUTE HIT =====');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Full URL:', req.originalUrl);
  console.log('   Authorization Header:', req.headers.authorization ? '✅ Present' : '❌ Missing');
  console.log('   Body:', req.body);
  console.log('=====================================\n');
  next();
});

// Admin routes
router.post('/mark', protect, authorize('Admin'), markAttendance);
router.get('/all', protect, authorize('Admin'), getAllAttendance);
router.delete('/:id', protect, authorize('Admin'), deleteAttendance);

// Employee routes
router.get('/my-attendance', protect, getMyAttendance);
router.post('/auto-mark', protect, autoMarkAttendance);

module.exports = router;