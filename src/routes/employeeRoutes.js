const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(authorize('Admin', 'Manager'), createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(authorize('Admin', 'Manager'), updateEmployee)
  .delete(authorize('Admin'), deleteEmployee);

module.exports = router;