const User = require('../models/User');
const { createNotification } = require('./notificationController');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
      phone: user.phone || null,
      address: user.address || null,
      workingType: user.workingType || 'Office',
    };
    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role,
      department, designation, salary,
      joiningDate, phone, address, workingType
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name, email, password,
      role: role || 'user',
      tempPassword: password,
      department, designation, salary, joiningDate,
      phone: phone || null,
      address: address || null,
      workingType: workingType || 'Office',
    });

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
      phone: req.body.phone || null,
      address: req.body.address || null,
      workingType: req.body.workingType || 'Office',
    };

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

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: {}, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Make Admin
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'Admin' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user, message: `${user.name} is now Admin` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Remove Admin
exports.removeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'user' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user, message: `${user.name} admin removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};