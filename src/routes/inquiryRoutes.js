const express = require('express');
const {
  getInquiries,
  getInquiry,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  updateInquiryStatus
} = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route
router.post('/', createInquiry);

// Protected routes
router.use(protect);

router.get('/', getInquiries);
router.get('/:id', getInquiry);
router.put('/:id', updateInquiry);
router.patch('/:id/status', updateInquiryStatus);
router.delete('/:id', authorize('Admin'), deleteInquiry);

module.exports = router;