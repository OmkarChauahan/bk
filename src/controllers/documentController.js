const Document = require('../models/Document');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const ext = req.file.originalname.split('.').pop();

    const doc = await Document.create({
      user:          req.user._id,
      name:          req.body.name || req.file.originalname.replace(/\.[^/.]+$/, ''),
      category:      req.body.category || 'Other',
      originalName:  req.file.originalname,
      fileExtension: '.' + ext,
      mimeType:      req.file.mimetype,
      fileSize:      req.file.size,
      data:          req.file.buffer,
    });

    res.status(201).json({
      success: true,
      data: {
        _id:          doc._id,
        name:         doc.name,
        category:     doc.category,
        fileExtension:doc.fileExtension,
        mimeType:     doc.mimeType,
        fileSize:     doc.fileSize,
        createdAt:    doc.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my documents
// @route   GET /api/documents/my-documents
// @access  Private
exports.getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user._id })
      .select('-data') // data field mat bhejo — sirf metadata
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    View / stream document
// @route   GET /api/documents/view/:id
// @access  Private
exports.viewDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.set('Content-Type',        doc.mimeType);
    res.set('Content-Disposition', `inline; filename="${doc.originalName}"`);
    res.send(doc.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download document
// @route   GET /api/documents/download/:id
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.set('Content-Type',        doc.mimeType);
    res.set('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.send(doc.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};