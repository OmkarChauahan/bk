const express = require('express');
const cors = require('cors');
const connectDB = require('../config/database');

// Import routes
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const inquiryRoutes = require('../routes/inquiryRoutes');
const serviceRoutes = require('../routes/serviceRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const notificationRoutes = require('../routes/notificationRoutes'); // NEW

const quotationRoutes = require('../routes/quotationRoutes');


const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes); // NEW
app.use('/api/quotations', quotationRoutes); 

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;