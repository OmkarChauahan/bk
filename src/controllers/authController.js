const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate Employee ID - FIXED
// Pehle wala countDocuments use karta tha - agar employee delete ho toh same ID dobara generate hoti thi
// Ab last highest employeeId dhundhta hai aur +1 karta hai, plus unique check bhi hai
const generateEmployeeId = async () => {
  // Sabse badi employeeId wala record dhundho
  const lastEmployee = await User.findOne(
    { employeeId: { $exists: true, $ne: null } },
    { employeeId: 1 }
  ).sort({ employeeId: -1 });

  let nextNum = 1;
  if (lastEmployee && lastEmployee.employeeId) {
    const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  // Unique milne tak retry karo (race condition se bhi safe)
  let employeeId;
  let isUnique = false;
  while (!isUnique) {
    employeeId = `EMP${String(nextNum).padStart(4, '0')}`;
    const exists = await User.findOne({ employeeId });
    if (!exists) {
      isUnique = true;
    } else {
      nextNum++;
    }
  }

  return employeeId;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const adminExists = await User.findOne({ role: 'Admin' });
    
    if (adminExists) {
      return res.status(403).json({
        success: false,
        message: 'Registration is disabled. Please contact admin to create your account.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        profilePicture: user.profilePicture,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/auth/create-employee
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, designation, joiningDate, salary, phone, address, workingType } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const employeeId = await generateEmployeeId();

    const employee = await User.create({
      name,
      email,
      password,
      role: 'Employee',
      employeeId,
      department,
      designation,
      joiningDate: joiningDate || Date.now(),
      salary,
      phone: phone || '',
      address: address || '',
      workingType: workingType || 'Office',
      createdBy: req.user.id
    });

    const createdEmployee = await User.findById(employee._id);

    console.log('📧 Attempting to send welcome email...');
    try {
      const emailResult = await sendWelcomeEmail({
        name: createdEmployee.name,
        email: createdEmployee.email,
        employeeId: createdEmployee.employeeId,
        tempPassword: createdEmployee.tempPassword,
        department: createdEmployee.department,
        designation: createdEmployee.designation
      });

      if (emailResult.success) {
        console.log('✅ Email sent successfully!');
        console.log('📬 Email ID:', emailResult.messageId);
      } else {
        console.error('❌ Email sending failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully! Welcome email has been sent to their inbox.',
      data: {
        _id: createdEmployee._id,
        name: createdEmployee.name,
        email: createdEmployee.email,
        employeeId: createdEmployee.employeeId,
        department: createdEmployee.department,
        designation: createdEmployee.designation,
        phone: createdEmployee.phone,
        address: createdEmployee.address,
        workingType: createdEmployee.workingType,
        tempPassword: createdEmployee.tempPassword
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all employees
// @route   GET /api/auth/employees
// @access  Private/Admin
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password - Send reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log('📧 Sending password reset email...');
    try {
      const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);
      
      if (emailResult.success) {
        console.log('✅ Password reset email sent successfully!');
        res.status(200).json({
          success: true,
          message: 'Password reset email sent successfully! Please check your inbox.'
        });
      } else {
        throw new Error('Email sending failed');
      }
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload/Update profile picture
// @route   PUT /api/auth/upload-profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile picture'
      });
    }

    if (!profilePicture.startsWith('data:image')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Please upload a valid image.'
      });
    }

    const maxSize = 6850000;
    if (profilePicture.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully! ✅',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/auth/remove-profile-picture
// @access  Private
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to remove'
      });
    }

    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully! 🗑️'
    });

  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};