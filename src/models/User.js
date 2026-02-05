const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['Admin', 'Employee'], // ⭐ CHANGED: Remove 'User', 'Manager'
    default: 'Employee' // ⭐ CHANGED: Default is Employee
  },
  // ⭐ NEW FIELDS for Employee
  employeeId: {
    type: String,
    unique: true,
    sparse: true // Only for employees
  },
  department: {
    type: String,
    enum: ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'],
  },
  designation: String,
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: Number,
  // ⭐ RENAMED: status -> isActive (better for role-based)
  isActive: {
    type: Boolean,
    default: true
  },
  // ⭐ NEW: Track who created this employee
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String,
    default: ''
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);