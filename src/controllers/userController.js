const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'Active' : 'Inactive',
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      salary: user.salary,
      tempPassword: user.tempPassword,
      joinDate: user.joinDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // ✅ NEW FIELDS
      phone: user.phone || null,
      address: user.address || null,
      workingType: user.workingType || 'Office',
    };

    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role,
      department, designation, salary,
      joiningDate,
      // ✅ NEW FIELDS
      phone, address, workingType
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      tempPassword: password,
      department,
      designation,
      salary,
      joiningDate,
      // ✅ NEW FIELDS
      phone: phone || null,
      address: address || null,
      workingType: workingType || 'Office',
    });

    // Notification for admin
    try {
      const adminUsers = await User.find({ role: 'Admin' });
      for (const admin of adminUsers) {
        await createNotification(
          admin._id,
          'New User Registered',
          `${user.name} (${user.email}) has registered to the platform`,
          'user',
          `/users/${user._id}`
        );
      }
    } catch (notifError) {
      console.log('Notification error:', notifError.message);
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      department: req.body.department,
      designation: req.body.designation,
      salary: req.body.salary,
      joiningDate: req.body.joiningDate,

      // ✅ NEW FIELDS
      phone: req.body.phone || null,
      address: req.body.address || null,
      workingType: req.body.workingType || 'Office',
    };

    // status → isActive convert
    if (req.body.status) {
      fieldsToUpdate.isActive = req.body.status === 'Active';
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};