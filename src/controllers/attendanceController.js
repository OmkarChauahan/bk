// backend/src/controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ============================================
// ADMIN: Mark Attendance (Create/Update)
// ============================================
exports.markAttendance = async (req, res) => {
  try {
    console.log('📋 Mark Attendance Request:', req.body);
    console.log('Admin User:', req.user.name);

    const { employeeId, date, status, checkIn, checkOut, remarks } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Employee, date, and status are required'
      });
    }

    const [year, month, day] = date.split('-');
    const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const today = new Date();
const istOffset = 5.5 * 60 * 60 * 1000;
const istDate = new Date(today.getTime() + istOffset);
istDate.setUTCHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate
    });

    if (attendance) {
      attendance.status   = status;
      attendance.checkIn  = checkIn  || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks  = remarks  || attendance.remarks;
      attendance.markedBy = req.user.id;
      await attendance.save();
      console.log('✅ Attendance UPDATED by Admin:', employee.name, '→', status);
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date:     attendanceDate,
        status,
        checkIn:  checkIn  || '-',
        checkOut: checkOut || '-',
        markedBy: req.user.id,
        remarks:  remarks  || ''
      });
      console.log('✅ Attendance CREATED by Admin:', employee.name, '→', status);
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email employeeId')
      .populate('markedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('❌ Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to mark attendance' });
  }
};

// ============================================
// ADMIN: Get All Attendance Records
// ============================================
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, status } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (employeeId) filter.employee = employeeId;
    if (status)     filter.status   = status;

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name email employeeId department')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    console.error('❌ Get All Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch attendance' });
  }
};

// ============================================
// EMPLOYEE: Get My Attendance
// ============================================
exports.getMyAttendance = async (req, res) => {
  try {
    console.log('👤 Fetching attendance for:', req.user.name);

    const { startDate, endDate } = req.query;

    const filter = { employee: req.user.id };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    console.log(`✅ Found ${attendance.length} records for ${req.user.name}`);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('❌ Get My Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch attendance' });
  }
};

// ============================================
// EMPLOYEE: Auto Mark Attendance on Login
// ✅ Supports: Present / Absent / LoggedIn
// ✅ Saves: checkIn, expectedCheckOut fields
// ============================================
exports.autoMarkAttendance = async (req, res) => {
  try {
    console.log('🤖 Auto-marking attendance for:', req.user.name);
    console.log('   Body received:', req.body);

    const today = new Date();
today.setUTCHours(0, 0, 0, 0);

    // Already marked today?
    const existing = await Attendance.findOne({
      employee: req.user.id,
      date: today
    });

    if (existing) {
      console.log('⚠️ Already marked today:', existing.status);
      return res.status(200).json({
        success:       false,
        alreadyMarked: true,
        message:       'Attendance already marked for today',
        data:          existing
      });
    }

    const {
      status:           frontendStatus,
      checkIn:          frontendCheckIn,
      expectedCheckOut: frontendExpectedCheckOut,
      remarks:          frontendRemarks,
    } = req.body;

    // Server-side time fallback
    const now        = new Date();
    const serverH    = now.getHours();
    const serverM    = now.getMinutes();
    const serverTime = `${String(serverH).padStart(2,'0')}:${String(serverM).padStart(2,'0')}`;

    // ✅ Accept: 'Present', 'Absent', 'LoggedIn'
    const allowedStatuses = ['Present', 'Absent', 'LoggedIn'];
    const finalStatus = allowedStatuses.includes(frontendStatus)
      ? frontendStatus
      : (serverH < 11 || (serverH === 11 && serverM === 0)) ? 'Present' : 'Absent';

    const finalCheckIn = frontendCheckIn || serverTime;

    // Default remarks based on status
    let finalRemarks = frontendRemarks || '';
    if (!finalRemarks) {
      if (finalStatus === 'Absent')   finalRemarks = 'Late login — auto marked absent';
      else if (finalStatus === 'LoggedIn') finalRemarks = 'Logged in — checkout pending';
      else                            finalRemarks = 'Auto-marked on login';
    }

    const attendance = await Attendance.create({
      employee:         req.user.id,
      date:             today,
      status:           finalStatus,
      checkIn:          finalCheckIn,              // ✅ actual login time saved
      checkOut:         null,
      expectedCheckOut: frontendExpectedCheckOut || null, // ✅ expected checkout saved
      markedBy:         req.user.id,
      remarks:          finalRemarks,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'name email employeeId');

    console.log(`✅ Auto-marked: ${req.user.name} → ${finalStatus} at ${finalCheckIn}`);

    res.status(201).json({
      success: true,
      message: `Attendance marked as ${finalStatus}`,
      data:    populated
    });

  } catch (error) {
    console.error('❌ Auto Mark Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EMPLOYEE: Checkout → Mark as Present
// POST /api/attendance/checkout
// ============================================
exports.checkoutAttendance = async (req, res) => {
  try {
    console.log('🚪 Checkout request for:', req.user.name);
    console.log('   Body:', req.body);

    const { date, checkOut, status } = req.body;

    if (!date || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'date and checkOut are required'
      });
    }

    const [year, month, day] = date.split('-');
    const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // ✅ 'employee' field use karo — 'user' nahi
    const record = await Attendance.findOneAndUpdate(
      {
        employee: req.user.id,
        date:     attendanceDate,
      },
      {
        $set: {
          checkOut: checkOut,
          status:   status || 'Present',
          remarks:  'Checked out — marked Present',
        },
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found for today. Please refresh and try again.',
      });
    }

    console.log(`✅ Checkout successful: ${req.user.name} at ${checkOut} → Present`);
    res.status(200).json({ success: true, data: record });

  } catch (error) {
    console.error('❌ Checkout Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EMPLOYEE: Update CheckIn Time
// (Jab DB mein '-' tha — fix karo)
// PATCH /api/attendance/update-checkin
// ============================================
exports.updateCheckIn = async (req, res) => {
  try {
    console.log('🕐 UpdateCheckIn request for:', req.user.name);
    console.log('   Body:', req.body);

    const { date, checkIn } = req.body;

    if (!date || !checkIn) {
      return res.status(400).json({
        success: false,
        message: 'date and checkIn are required'
      });
    }

    const [year, month, day] = date.split('-');
    const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // ✅ 'employee' field use karo — 'user' nahi
    const record = await Attendance.findOneAndUpdate(
      {
        employee: req.user.id,
        date:     attendanceDate,
      },
      {
        $set: { checkIn: checkIn },
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    console.log(`✅ CheckIn updated: ${req.user.name} → ${checkIn}`);
    res.status(200).json({ success: true, data: record });

  } catch (error) {
    console.error('❌ UpdateCheckIn Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: Delete Attendance Record
// ============================================
exports.deleteAttendance = async (req, res) => {
  try {
    console.log('🗑️ Deleting attendance record:', req.params.id);

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    await attendance.deleteOne();
    console.log('✅ Attendance record deleted');

    res.status(200).json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete attendance' });
  }
};