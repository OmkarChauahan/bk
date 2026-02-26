// backend/scripts/fixDocumentUploadedBy.js
// Run once: node scripts/fixDocumentUploadedBy.js
// Yeh script purane documents mein uploadedBy null hai usse fix karti hai

require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('../models/Document');
const User     = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Sabse pehle dekho kitne documents mein uploadedBy null hai
  const broken = await Document.find({ uploadedBy: { $in: [null, undefined] } });
  console.log(`❌ Documents without uploadedBy: ${broken.length}`);

  if (broken.length === 0) {
    console.log('✅ All documents already have uploadedBy. No fix needed.');
    process.exit(0);
  }

  // Pehla employee user find karo (fallback ke liye)
  const firstEmployee = await User.findOne({ role: { $ne: 'Admin' } });
  if (!firstEmployee) {
    console.log('❌ No employee found. Cannot fix.');
    process.exit(1);
  }

  console.log(`\nAll broken documents will be assigned to: ${firstEmployee.name} (${firstEmployee.employeeId})`);
  console.log('NOTE: Manually fix in MongoDB Compass if different employees uploaded them.\n');

  const result = await Document.updateMany(
    { uploadedBy: { $in: [null, undefined] } },
    { $set: { uploadedBy: firstEmployee._id } }
  );

  console.log(`✅ Fixed ${result.modifiedCount} documents`);
  console.log('\nDone! Restart your server and refresh admin panel.');
  process.exit(0);
};

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});