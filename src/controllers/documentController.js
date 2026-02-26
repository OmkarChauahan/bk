// backend/controllers/documentController.js
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

// ── Upload directory setup ───────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// @desc    Upload a document (Employee)
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Safety check — agar req.user nahi hai
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { category, name } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();

    const document = await Document.create({
      name:          name || req.file.originalname.replace(/\.[^/.]+$/, ''),
      originalName:  req.file.originalname,
      fileUrl:       `/uploads/documents/${req.file.filename}`,
      filePath:      req.file.path,
      mimeType:      req.file.mimetype,
      fileExtension: ext,
      fileSize:      req.file.size,
      category:      category || 'Other',
      uploadedBy:    req.user._id   // ← Logged-in user ka ID
    });

    const populated = await Document.findById(document._id)
      .populate('uploadedBy', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: populated
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

// @desc    Get all documents — for admin
// @route   GET /api/documents/all
// @access  Private/Admin
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email employeeId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

// @desc    Get my documents — for logged-in employee
// @route   GET /api/documents/my-documents
// @access  Private
exports.getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get my documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

// @desc    View / stream a document
// @route   GET /api/documents/view/:id
// @access  Private
exports.viewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Only owner or Admin can view
    if (
      document.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    fs.createReadStream(document.filePath).pipe(res);
  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({ success: false, message: 'Failed to view document', error: error.message });
  }
};

// @desc    Download a document
// @route   GET /api/documents/download/:id
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Only owner or Admin can download
    if (
      document.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    fs.createReadStream(document.filePath).pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ success: false, message: 'Failed to download document', error: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (owner or Admin)
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Only owner or Admin can delete
    if (
      document.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
  }
};