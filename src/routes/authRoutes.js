const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword,
  updateProfile,
  changePassword,
  createEmployee: createEmployeeAuth,
  getAllEmployees,
  uploadProfilePicture,    // ⭐ YEH ADD KARO
  removeProfilePicture     // ⭐ YEH ADD KARO
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

// ⭐⭐⭐ PROFILE PICTURE ROUTES - YEH 2 ROUTES ADD KARO ⭐⭐⭐
router.put('/upload-profile-picture', protect, uploadProfilePicture);
router.delete('/remove-profile-picture', protect, removeProfilePicture);

// Admin only routes
router.post('/create-employee', protect, authorize('Admin'), createEmployeeAuth);
router.get('/employees', protect, authorize('Admin'), getAllEmployees);

module.exports = router;