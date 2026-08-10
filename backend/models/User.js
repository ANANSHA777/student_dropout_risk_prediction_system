// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['Admin', 'Counselor', 'Teacher', 'Student'],
      default: 'Student',
    },
    // Custom Student Roll / Registration ID (e.g., CS2026-001)
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Please specify a department'],
      default: 'Computer Science',
      trim: true,
    },
    // Student Year Level
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      default: '1st Year',
    },
    // Academic Records
    cgpa: {
      type: Number,
      default: null,
      min: 0,
      max: 10,
    },
    attendance: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    // Student Survey Completion Status
    surveyCompleted: {
      type: Boolean,
      default: false,
    },
    // Risk assessment status (null = Not Evaluated)
    riskLevel: {
      type: String,
      default: null,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to verify passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);