const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');

// Admin routes
router.post('/', protect, authorize('Admin'), createTask);
router.get('/all', protect, authorize('Admin'), getAllTasks);
router.delete('/:id', protect, authorize('Admin'), deleteTask);

// Employee routes
router.get('/my-tasks', protect, getMyTasks);
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;