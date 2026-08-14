// backend/models/StudentProfile.js
const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Guarantees one profile document per User
    },
    studentId: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: 'Computer Science',
    },
    yearOfStudy: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      default: '1st Year',
    },
    cgpa: {
      type: Number,
      default: null, // Default null ensures missing values don't display dummy numbers
      min: 0,
      max: 10.0,
    },
    attendancePercentage: {
      type: Number,
      default: null, // Default null ensures missing values display as N/A
      min: 0,
      max: 100,
    },

    // --- STUDENT SELF-ASSESSMENT & SURVEY DATA ---
    surveyCompleted: {
      type: Boolean,
      default: false, // Tracks student survey completion status
    },
    surveyData: {
      familyMonthlyIncome: { type: String, default: '' },
      moneyFeeWorries: { type: String, default: '' },
      livingSituation: { type: String, default: '' },
      partTimeWork: { type: String, default: '' },
      dailySelfStudyHours: { type: String, default: '' },
      dailyCommuteTime: { type: String, default: '' },
      activeBacklogs: { type: String, default: '' },
      nightlySleepHours: { type: String, default: '' },
      mentalHealthState: { type: String, default: '' },
      impactFactors: [{ type: String }],
    },

    assignmentsSubmitted: {
      type: Number,
      default: 0,
    },
    assignmentsTotal: {
      type: Number,
      default: 0,
    },
    financialAidStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Emergency Assistance Requested'],
      default: 'Paid',
    },
    qualitativeNotes: [
      {
        authorRole: {
          type: String,
          enum: ['Teacher', 'Counselor'],
          default: 'Teacher',
        },
        note: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          enum: ['Academic', 'Financial', 'Personal', 'Health'],
          default: 'Academic',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // --- AI DIAGNOSTIC & CLASSIFICATION FIELDS ---
    riskEvaluated: {
      type: Boolean,
      default: false, // Explicitly tracks if AI evaluation was performed
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      default: null, // Default null ensures new/unevaluated students display "Not Evaluated"
    },
    riskCategory: {
      type: String,
      default: 'None', // Stores categories like "Wellness & Mental Health", "Financial Burden", "Academic Concern", etc.
    },
    primaryRiskCategory: {
      type: String,
      enum: ['ACADEMIC', 'ATTENDANCE', 'FINANCIAL', 'PERSONAL', 'WELLNESS', 'NONE'],
      default: 'NONE',
    },

    // --- AUTOMATED ACTION FLAGS ---
    recommendedActions: {
      enableRemedialQuiz: {
        type: Boolean,
        default: false,
      },
      matchPeerTutor: {
        type: Boolean,
        default: false,
      },
      escalateToCounselor: {
        type: Boolean,
        default: false,
      },
    },

    lastAiAnalysisDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);