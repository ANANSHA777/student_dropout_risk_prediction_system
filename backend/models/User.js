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
    department: {
      type: String,
      required: [true, 'Please specify a department'],
      default: 'Computer Science',
      trim: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },

    // --- STUDENT-ONLY FIELDS ---
    studentId: {
      type: String,
      trim: true,
    },
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
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
    surveyCompleted: {
      type: Boolean,
    },

    // --- EVALUATION & INTERVENTION FIELDS ---
    riskEvaluated: {
      type: Boolean,
      default: false,
    },
    riskLevel: {
      type: String,
      default: null,
    },
    riskCategory: {
      type: String,
      default: 'None',
    },
    primaryRiskCategory: {
      type: String,
      enum: [
        'ACADEMIC',
        'ATTENDANCE',
        'FINANCIAL',
        'PERSONAL',
        'WELLNESS',
        'DUAL',
        'NONE',
        'Dual Risk (Academic + Personal)',
        'Academic Risk Only',
        'Personal / Financial Risk',
        'No Policy Risk',
      ],
      default: 'NONE',
    },
    assignedCounselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigned_counselor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedPlan: {
      type: String,
      default: null,
    },
    financialAidStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Required', 'Granted', 'Emergency Assistance Requested', 'Pending Institutional Support'],
      default: 'Paid',
    },
    financial_relief_status: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'APPROVED', 'DISBURSED'],
      default: 'NONE',
    },
    evaluation_source: {
      type: String,
      enum: ['AUTOMATED_AI', 'MANUAL_TEACHER_OVERRIDE'],
      default: 'AUTOMATED_AI',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save Middleware: Async style without `next`
userSchema.pre('save', async function () {
  // 1. Sanitize Non-Student Accounts
  if (this.role !== 'Student') {
    this.studentId = undefined;
    this.yearOfStudy = undefined;
    this.cgpa = undefined;
    this.attendance = undefined;
    this.surveyCompleted = undefined;
    this.riskLevel = undefined;
    this.riskEvaluated = undefined;
    this.riskCategory = undefined;
    this.primaryRiskCategory = undefined;
    this.assignedCounselor = undefined;
    this.assigned_counselor_id = undefined;
    this.assignedPlan = undefined;
    this.financialAidStatus = undefined;
    this.financial_relief_status = undefined;
    this.evaluation_source = undefined;
  } else {
    // Default assignments for actual Student accounts
    if (this.surveyCompleted === undefined) this.surveyCompleted = false;
    if (!this.yearOfStudy) this.yearOfStudy = '1st Year';
    if (this.studentId === undefined) this.studentId = '';
  }

  // 2. Password Hashing Guard
  if (!this.isModified('password')) {
    return;
  }

  // Skip hashing if password is already a bcrypt hash
  if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to verify passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual getter mapping `_id` to `id` for standardized API JSON returns
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);