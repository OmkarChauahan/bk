const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance'); // ✅ direct import for fix route
const {
  markAttendance,
  autoMarkAttendance,
  getAllAttendance,
  getMyAttendance,
  deleteAttendance,
  checkoutAttendance,
  updateCheckIn,
} = require('../controllers/attendanceController');

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

// ============================================================
// ⚠️ TEMPORARY FIX ROUTE — purane Absent records fix karo
// USE KARNE KE BAAD IS ROUTE KO HATA DENA !!
// URL: GET /api/attendance/fix-old-records
// ============================================================
router.get('/fix-old-records', async (req, res) => { // ⚠️ TEMP - no auth
  try {
    const result = await Attendance.updateMany(
      { status: 'Absent', checkIn: { $in: [null, '', '-', '--'] } },
      { $set: { checkIn: 'N/A' } }
    );
    console.log('🔧 Fix result:', result);
    res.json({ success: true, updated: result.modifiedCount, message: `${result.modifiedCount} records fixed!` });
  } catch(e) {
    console.error('Fix error:', e);
    res.json({ success: false, error: e.message });
  }
});

// Admin routes
router.post('/mark',  protect, authorize('Admin'), markAttendance);
router.get('/all',    protect, authorize('Admin'), getAllAttendance);
router.delete('/:id', protect, authorize('Admin'), deleteAttendance);

// Employee routes
router.get('/my-attendance',    protect, getMyAttendance);
router.post('/auto-mark',       protect, autoMarkAttendance);
router.post('/checkout',        protect, checkoutAttendance);
router.patch('/update-checkin', protect, updateCheckIn);

module.exports = router;