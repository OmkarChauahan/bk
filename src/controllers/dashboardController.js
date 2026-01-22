const User = require('../models/User');
const Employee = require('../models/Employee');
const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalEmployees = await Employee.countDocuments();
    const activeInquiries = await Inquiry.countDocuments({ status: { $ne: 'Completed' } });
    const totalServices = await Service.countDocuments();
    const activeServices = await Service.countDocuments({ status: 'Active' });

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Get recent inquiries
    const recentInquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    // Calculate percentages (mock data for now)
    const stats = {
      totalUsers,
      totalEmployees,
      activeInquiries,
      totalServices,
      activeServices,
      usersChange: '+12%',
      inquiriesChange: '+8%',
      servicesChange: '0%',
      revenueChange: '+18%',
      monthlyRevenue: '₹45,600'
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentUsers,
        recentInquiries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
exports.getRecentActivities = async (req, res) => {
  try {
    // Get recent activities from different models
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name createdAt');

    const recentInquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name createdAt');

    const recentServices = await Service.find()
      .sort({ updatedAt: -1 })
      .limit(2)
      .select('name updatedAt');

    // Format activities
    const activities = [
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        message: `New user registered: ${user.name}`,
        time: getTimeAgo(user.createdAt),
        color: 'blue'
      })),
      ...recentInquiries.map(inquiry => ({
        id: inquiry._id,
        type: 'inquiry',
        message: `New inquiry received from ${inquiry.name}`,
        time: getTimeAgo(inquiry.createdAt),
        color: 'green'
      })),
      ...recentServices.map(service => ({
        id: service._id,
        type: 'service',
        message: `Service updated: ${service.name}`,
        time: getTimeAgo(service.updatedAt),
        color: 'orange'
      }))
    ];

    // Sort by time and limit to 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};