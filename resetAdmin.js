require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB!');
  
  const users = mongoose.connection.db.collection('users');
  const admin = await users.findOne({ role: 'Admin' });
  
  if (!admin) {
    console.log('❌ No Admin found in database!');
    process.exit(1);
  }
  
  console.log('👤 Admin found:', admin.email);
  
  const hash = await bcrypt.hash('Admin@123', 10);
  const setObj = { password: hash };
  
  await users.updateOne(
    { _id: admin._id },
    { $set: setObj }
  );
  
  console.log('');
  console.log('✅ Password reset successfully!');
  console.log('📧 Email   :', admin.email);
  console.log('🔑 Password: Admin@123');
  
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});