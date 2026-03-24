const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  makeAdmin,
  removeAdmin
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

// ✅ Admin toggle routes
router.put('/:id/make-admin', makeAdmin);
router.put('/:id/remove-admin', removeAdmin);

module.exports = router;