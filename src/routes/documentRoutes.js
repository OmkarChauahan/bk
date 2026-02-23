const express    = require('express');
const multer     = require('multer');
const { protect } = require('../middleware/auth');
const {
  uploadDocument,
  getMyDocuments,
  viewDocument,
  downloadDocument,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

// Multer — memory storage (DB mein save karenge)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, Word, JPG, PNG allowed'), false);
  }
});

router.use(protect); // Sab routes protected

router.post('/upload',          upload.single('document'), uploadDocument);
router.get('/my-documents',     getMyDocuments);
router.get('/view/:id',         viewDocument);
router.get('/download/:id',     downloadDocument);
router.delete('/:id',           deleteDocument);

module.exports = router;