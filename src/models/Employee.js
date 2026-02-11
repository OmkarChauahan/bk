const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Engineering', 'Design', 'Management', 'Marketing', 'Sales', 'HR', 'Finance']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },
  salary: {
    type: String,
    required: [true, 'Salary is required']
  },
  reportingTo: {
    type: String,
    required: [true, 'Reporting manager is required']
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Inactive'],
    default: 'Active'
  },
  joinDate: {
    type: Date,
    required: [true, 'Join date is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);