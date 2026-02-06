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
  // ⭐ YE FIELD ADD KARO - Plain password store karne ke liye
  tempPassword: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['Admin', 'Employee', 'User', 'Manager'],
    default: 'Employee'
  },
  employeeId: String,
  department: String,
  designation: String,
  joiningDate: Date,
  salary: Number,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: String,
  joinDate: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// ⭐ YE PRE-SAVE HOOK UPDATE KARO
userSchema.pre('save', async function(next) {
  // Agar password modify nahi hua to skip karo
  if (!this.isModified('password')) {
    return next();
  }

  // ⭐ PEHLE plain password save karo
  this.tempPassword = this.password;
  
  // Phir hash karo
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);