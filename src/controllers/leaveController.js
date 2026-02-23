const Leave = require('../models/Leave');

// ─── EMPLOYEE ────────────────────────────────────────────────

// POST /api/leaves  →  apply for leave
const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, days, reason } = req.body;

    if (!type || !startDate || !endDate || !days || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const leave = await Leave.create({
      employee: req.user._id,   // comes from auth middleware
      type,
      startDate,
      endDate,
      days,
      reason
    });

    res.status(201).json({ success: true, message: 'Leave applied successfully', data: leave });
  } catch (error) {
    console.error('applyLeave error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/leaves/my  →  logged-in employee's leaves
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ appliedOn: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('getMyLeaves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADMIN ───────────────────────────────────────────────────

// GET /api/leaves/all  →  all employees' leaves
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'name employeeId email')
      .sort({ appliedOn: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('getAllLeaves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/leaves/:id/status  →  approve or reject
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be updated' });
    }

    leave.status = status;
    await leave.save();

    res.json({ success: true, message: `Leave ${status} successfully`, data: leave });
  } catch (error) {
    console.error('updateLeaveStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus };