const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany();
    await Employee.deleteMany();
    await Inquiry.deleteMany();
    await Service.deleteMany();
    console.log('✅ Cleared existing data');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@workhub.com',
      password: 'Admin@123',
      role: 'Admin',
      status: 'Active'
    });
    console.log('✅ Admin user created');

    // Create Sample Users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'User@123',
        role: 'User',
        status: 'Active',
        joinDate: '2024-01-15'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'User@123',
        role: 'User',
        status: 'Active',
        joinDate: '2024-02-20'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'Manager@123',
        role: 'Manager',
        status: 'Active',
        joinDate: '2024-03-10'
      }
    ]);
    console.log(`✅ ${users.length} users created`);

    // Create Sample Employees
    const employees = await Employee.create([
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@workhub.com',
        designation: 'Senior Developer',
        department: 'Engineering',
        phone: '+91 98765 43210',
        salary: '₹85,000',
        reportingTo: 'Tech Lead',
        status: 'Active',
        joinDate: '2023-01-15'
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@workhub.com',
        designation: 'UI/UX Designer',
        department: 'Design',
        phone: '+91 98765 43211',
        salary: '₹65,000',
        reportingTo: 'Design Head',
        status: 'Active',
        joinDate: '2023-03-20'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@workhub.com',
        designation: 'Project Manager',
        department: 'Management',
        phone: '+91 98765 43212',
        salary: '₹95,000',
        reportingTo: 'Director',
        status: 'Active',
        joinDate: '2022-11-10'
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha.gupta@workhub.com',
        designation: 'Marketing Executive',
        department: 'Marketing',
        phone: '+91 98765 43213',
        salary: '₹55,000',
        reportingTo: 'Marketing Manager',
        status: 'Active',
        joinDate: '2023-05-12'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.singh@workhub.com',
        designation: 'DevOps Engineer',
        department: 'Engineering',
        phone: '+91 98765 43214',
        salary: '₹78,000',
        reportingTo: 'Tech Lead',
        status: 'On Leave',
        joinDate: '2023-02-18'
      }
    ]);
    console.log(`✅ ${employees.length} employees created`);

    // Create Sample Inquiries
    const inquiries = await Inquiry.create([
      {
        name: 'Sarah Chen',
        email: 'sarah@company.com',
        subject: 'Web Development Quote',
        message: 'Looking for a custom web application for our business. Need estimate.',
        status: 'New',
        date: new Date('2024-12-15')
      },
      {
        name: 'Mike Brown',
        email: 'mike@startup.io',
        subject: 'Cloud Migration Services',
        message: 'Need help migrating our infrastructure to AWS.',
        status: 'In Progress',
        date: new Date('2024-12-14')
      },
      {
        name: 'Emma Davis',
        email: 'emma@tech.com',
        subject: 'Mobile App Development',
        message: 'Interested in developing a mobile app for iOS and Android.',
        status: 'Completed',
        date: new Date('2024-12-13')
      },
      {
        name: 'David Wilson',
        email: 'david@agency.com',
        subject: 'UI/UX Design Services',
        message: 'Looking for design services for our new product.',
        status: 'New',
        date: new Date('2024-12-12')
      }
    ]);
    console.log(`✅ ${inquiries.length} inquiries created`);

    // ⭐⭐⭐ UPDATED SERVICES - PRICE AS NUMBER ⭐⭐⭐
    const services = await Service.create([
      {
        name: 'UI/UX Design',
        description: 'User interface and experience design services',
        price: 2500,  // ⭐ NUMBER
        features: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
        category: 'Design',
        duration: '2-3 weeks',
        status: 'Active'
      },
      {
        name: 'Web Development',
        description: 'Custom web applications built with modern technologies',
        price: 5000,  // ⭐ NUMBER
        features: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
        category: 'Development',
        duration: '4-6 weeks',
        status: 'Active'
      },
      {
        name: 'Mobile App Development',
        description: 'Native iOS and Android applications',
        price: 8000,  // ⭐ NUMBER
        features: ['React Native', 'Swift', 'Kotlin', 'Firebase'],
        category: 'Development',
        duration: '6-8 weeks',
        status: 'Active'
      },
      {
        name: 'Cloud Solutions',
        description: 'AWS, Azure, and GCP cloud infrastructure',
        price: 3000,  // ⭐ NUMBER
        features: ['AWS', 'Azure', 'GCP', 'Docker'],
        category: 'Infrastructure',
        duration: '2-4 weeks',
        status: 'Active'
      },
      {
        name: 'SEO Optimization',
        description: 'Search engine optimization services',
        price: 1500,  // ⭐ NUMBER
        features: ['On-page SEO', 'Analytics', 'Reporting', 'Keyword Research'],
        category: 'Marketing',
        duration: '1 month',
        status: 'Active'
      },
      {
        name: 'E-commerce Solutions',
        description: 'Complete e-commerce platform development',
        price: 6500,  // ⭐ NUMBER
        features: ['Shopping Cart', 'Payment Gateway', 'Inventory', 'Admin Panel'],
        category: 'Development',
        duration: '5-7 weeks',
        status: 'Active'
      },
      {
        name: 'Digital Marketing',
        description: 'Complete digital marketing strategy and execution',
        price: 2000,  // ⭐ NUMBER
        features: ['Social Media', 'Content Marketing', 'Email Campaigns', 'Ads'],
        category: 'Marketing',
        duration: '1 month',
        status: 'Active'
      },
      {
        name: 'API Development',
        description: 'RESTful and GraphQL API development',
        price: 3500,  // ⭐ NUMBER
        features: ['REST API', 'GraphQL', 'Documentation', 'Security'],
        category: 'Development',
        duration: '3-4 weeks',
        status: 'Active'
      }
    ]);
    console.log(`✅ ${services.length} services created`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Email: admin@workhub.com');
    console.log('Password: Admin@123');
    console.log('\nOther test users:');
    console.log('Email: john@example.com | Password: User@123');
    console.log('Email: bob@example.com | Password: Manager@123');
    console.log('\n📊 Services Created:');
    services.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - ₹${service.price.toLocaleString('en-IN')}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();