// backend/controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create/Assign new task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, assignedBy, priority, dueDate } = req.body;

    // Validation
    if (!title || !description || !assignedTo || !assignedBy || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if employee exists
    const employee = await User.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy, // This will now be the admin's name as string
      priority: priority || 'Medium',
      dueDate,
      status: 'Pending'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks/all
// @access  Private/Admin
// backend/controllers/taskController.js

exports.getAllTasks = async (req, res) => {
  try {
    let tasks = await Task.find()
      .populate('assignedTo', 'name email employeeId')
      .populate('assignedBy', 'name')  // 🔥 ADD THIS LINE
      .sort({ createdAt: -1 });

    // Convert to plain objects and normalize assignedBy
    tasks = tasks.map(task => {
      const taskObj = task.toObject();
      
      // Handle assignedBy conversion
      if (taskObj.assignedBy) {
        if (typeof taskObj.assignedBy === 'object' && taskObj.assignedBy.name) {
          taskObj.assignedBy = taskObj.assignedBy.name;
        } else if (typeof taskObj.assignedBy === 'object' && taskObj.assignedBy._id) {
          // If ObjectId but no name populated, use 'Admin'
          taskObj.assignedBy = 'Admin';
        }
        // If already string, leave as is
      } else {
        taskObj.assignedBy = 'Admin';
      }
      
      return taskObj;
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

// @desc    Get tasks assigned to logged-in employee
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    task.status = status;
    
    if (status === 'Completed') {
      task.completedDate = new Date();
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email employeeId');

    res.json({
      success: true,
      message: 'Task status updated',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};