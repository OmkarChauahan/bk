const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Onboarding', 'Identity', 'Tax', 'Benefits', 'Other'],
    default: 'Other'
  },
  originalName: String,
  fileExtension: String,
  mimeType: String,
  fileSize: Number,
  data: {
    type: Buffer,   // File binary DB mein store hoga
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);