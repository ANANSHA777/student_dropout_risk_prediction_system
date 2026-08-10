require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed

const seedAdmin = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-dropout-db';
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);

    // 1. Clean up existing admin attempt
    await User.deleteMany({ email: 'admin@university.edu' });

    // 2. Pass raw password so your Mongoose pre-save hook handles hashing properly
    // (If your User model lacks a pre-save hook, use: await bcrypt.hash('Admin@123456', 10))
    const rawPassword = 'Admin@123456';

    // 3. Create admin with capital 'Admin' to satisfy Mongoose enum validation
    await User.create({
      name: 'Admin',
      email: 'admin@university.edu',
      password: rawPassword,
      role: 'Admin', // Capitalized to match your Mongoose enum
      department: 'IT Operations'
    });

    console.log('✅ Admin user reset and created successfully!');
    console.log('-------------------------------------------');
    console.log('Email:    admin@university.edu');
    console.log('Password: Admin@123456');
    console.log('Role:     Admin');
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();