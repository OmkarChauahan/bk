// backend/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Leave', 'LoggedIn'], // ✅ LoggedIn add kiya
    required: [true, 'Status is required']
  },
  checkIn: {
    type: String,
    default: '-'
  },
  checkOut: {
    type: String,
    default: '-'
  },
  expectedCheckOut: {   // ✅ NEW — 8h baad ka expected time
    type: String,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ employee: 1, date: 1 });
attendanceSchema.index({ date: -1 });

// Prevent duplicate attendance for same employee on same day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);