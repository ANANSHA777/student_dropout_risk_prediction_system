require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed

const seedAdmin = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-dropout-db';
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    const adminEmail = 'admin@university.edu';
    const rawPassword = 'Admin@123456';

    // 1. Clean up existing admin accounts to avoid duplicate key errors
    await User.deleteMany({ email: adminEmail });
    console.log(`🧹 Cleaned up existing records for ${adminEmail}`);

    // 2. Check if the User schema has an active pre-save hook for password hashing
    const hasPreSaveHook = User.schema.s.hooks._pres.get('save')?.some(
      (hook) => hook.fn.toString().includes('hash') || hook.fn.toString().includes('bcrypt')
    );

    // Hash manually only if no pre-save hook is detected in the model
    const finalPassword = hasPreSaveHook ? rawPassword : await bcrypt.hash(rawPassword, 10);

    // 3. Create Admin user with strictly clean non-student attributes
    const adminUser = new User({
      name: 'Admin',
      email: adminEmail,
      password: finalPassword,
      role: 'Admin', // Capitalized to satisfy Mongoose enum validation
      department: 'IT Operations',
      isFirstLogin: false
    });

    // 4. Save document (triggers Mongoose validation & pre-save hooks if present)
    await adminUser.save();

    console.log('✅ Admin user reset and created successfully!');
    console.log('-------------------------------------------');
    console.log(`Email:     ${adminEmail}`);
    console.log(`Password:  ${rawPassword}`);
    console.log(`Role:      ${adminUser.role}`);
    console.log(`ID:        ${adminUser._id}`);
    console.log('-------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    if (error.errors) {
      console.error('Validation Details:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`).join(', '));
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();