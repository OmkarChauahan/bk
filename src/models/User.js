const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  tempPassword: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['Admin', 'user'],
    default: 'user'
  },
  employeeId: String,
  department: String,
  designation: String,
  joiningDate: Date,
  salary: Number,
  phone: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  emergencyContact: {
    name:         { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone:        { type: String, default: '' }
  },
  workingType: {
    type: String,
    enum: ['Office', 'Home', 'Hybrid'],
    default: 'Office'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: String,
  profilePicture: {
    type: String,
    default: null
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.tempPassword = this.password;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);