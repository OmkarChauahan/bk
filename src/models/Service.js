// backend/src/models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  price: {
    type: Number,  // ⭐ CHANGED FROM STRING TO NUMBER
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  features: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active'
  },
  category: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for formatted price (backward compatibility)
serviceSchema.virtual('formattedPrice').get(function() {
  return this.price ? this.price.toLocaleString() : '0';
});

// Enable virtuals in JSON
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);