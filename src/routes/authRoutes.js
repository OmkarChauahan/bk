const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword,
  updateProfile,
  changePassword,
  createEmployee: createEmployeeAuth,  // ⭐ RENAME with alias
  getAllEmployees
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin only routes
router.post('/create-employee', protect, authorize('Admin'), createEmployeeAuth); // ⭐ USE ALIAS
router.get('/employees', protect, authorize('Admin'), getAllEmployees);

module.exports = router;