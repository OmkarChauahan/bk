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

    // Validation
    if (!employeeId || !date || !status) {
      console.log('❌ Missing fields:', { employeeId: !!employeeId, date: !!date, status: !!status });
      return res.status(400).json({
        success: false,
        message: 'Employee, date, and status are required'
      });
    }

    // Parse date properly
    const [year, month, day] = date.split('-');
    const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Date comparison:', {
      input: date,
      attendanceDate: attendanceDate.toISOString(),
      today: today.toISOString(),
      isFuture: attendanceDate > today
    });

    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      console.log('❌ Employee not found:', employeeId);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('✅ Employee found:', employee.name);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate
    });

    if (attendance) {
      // ⭐ ADMIN CAN UPDATE ⭐
      console.log('📝 Updating existing attendance from', attendance.status, 'to', status);
      
      attendance.status = status;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      attendance.markedBy = req.user.id;
      
      await attendance.save();
      
      console.log('✅ Attendance UPDATED by Admin:', employee.name, '→', status);
    } else {
      // Create new attendance
      console.log('➕ Creating new attendance');
      attendance = await Attendance.create({
        employee: employeeId,
        date: attendanceDate,
        status,
        checkIn: checkIn || '10:00',
        checkOut: checkOut || '18:00',
        markedBy: req.user.id,
        remarks: remarks || ''
      });
      
      console.log('✅ Attendance CREATED by Admin:', employee.name, '→', status);
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email employeeId')
      .populate('markedBy', 'name email');

    res.status(200).json({
      success: true,
      message: attendance ? 'Attendance updated successfully' : 'Attendance marked successfully',
      data: populatedAttendance
    });
  } catch (error) {
    console.error('❌ Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance'
    });
  }
};

// ============================================
// ADMIN: Get All Attendance Records
// ============================================
exports.getAllAttendance = async (req, res) => {
  try {
    console.log('📊 Fetching all attendance records...');
    
    const { startDate, endDate, employeeId, status } = req.query;
    
    // Build filter
    const filter = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (employeeId) {
      filter.employee = employeeId;
    }
    
    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name email employeeId department')
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    console.log(`✅ Found ${attendance.length} attendance records`);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('❌ Get All Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance records'
    });
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
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filter.date = { $gte: thirtyDaysAgo };
    }

    const attendance = await Attendance.find(filter)
      .populate('markedBy', 'name email')
      .sort({ date: -1 });

    console.log(`✅ Found ${attendance.length} attendance records for ${req.user.name}`);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('❌ Get My Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your attendance'
    });
  }
};

// ============================================
// EMPLOYEE: Auto Mark Attendance (Self Check-in)
// ============================================
exports.autoMarkAttendance = async (req, res) => {
  try {
    console.log('🤖 Auto-marking attendance for:', req.user.name);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked today
    const existingAttendance = await Attendance.findOne({
      employee: req.user.id,
      date: today
    });

    if (existingAttendance) {
      console.log('⚠️ Attendance already marked for today');
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today',
        data: existingAttendance
      });
    }

    // Get current time for check-in
    const now = new Date();
    const checkInTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Auto-determine status based on check-in time
    const workStartHour = 10; // 10 AM
    const isLate = now.getHours() > workStartHour || 
                   (now.getHours() === workStartHour && now.getMinutes() > 15);

    const attendance = await Attendance.create({
      employee: req.user.id,
      date: today,
      status: isLate ? 'Late' : 'Present',
      checkIn: checkInTime,
      markedBy: req.user.id,
      remarks: isLate ? 'Marked late by system' : 'Auto-marked by employee'
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email employeeId');

    console.log(`✅ Auto-marked attendance: ${req.user.name} → ${attendance.status}`);

    res.status(201).json({
      success: true,
      message: `Attendance marked as ${attendance.status}`,
      data: populatedAttendance
    });
  } catch (error) {
    console.error('❌ Auto Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await attendance.deleteOne();
    
    console.log('✅ Attendance record deleted');

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attendance record'
    });
  }
};