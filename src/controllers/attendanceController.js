// backend/src/controllers/attendanceController.js
// REPLACE the markAttendance function with this:

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
      // ⭐⭐⭐ ADMIN CAN UPDATE - YE IMPORTANT HAI ⭐⭐⭐
      console.log('📝 Updating existing attendance from', attendance.status, 'to', status);
      
      attendance.status = status;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      attendance.markedBy = req.user.id; // Admin ne update kiya
      
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