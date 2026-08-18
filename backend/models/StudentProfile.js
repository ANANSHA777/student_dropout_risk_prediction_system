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
      default: null,
      min: 0,
      max: 10.0,
    },
    attendancePercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    // --- STUDENT SELF-ASSESSMENT & SURVEY DATA ---
    surveyCompleted: {
      type: Boolean,
      default: false,
    },
    surveyStatus: {
      type: String,
      default: 'Pending',
    },
    lastSurveySubmittedAt: {
      type: Date,
    },

    // --- FLAT SURVEY FIELDS ---
    familyIncome: { type: String, default: null },
    financialStress: { type: String, default: null },
    livingSituation: { type: String, default: null },
    commuteTime: { type: String, default: null },
    partTimeJob: { type: String, default: null },
    activeBacklogs: { type: String, default: null },
    studyHoursPerDay: { type: String, default: null },
    sleepHoursPerNight: { type: String, default: null },
    mentalHealthSelfReport: { type: String, default: null },
    addictions: [{ type: String }],

    // --- NESTED SURVEY OBJECT (FLEXIBLE / UNRESTRICTED) ---
    // 💡 REMOVED default: '' from internal keys so Mongoose won't wipe existing fields!
    surveyData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
      default: false,
    },
    riskScore: {
      type: Number,
      default: 0,
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
    strict: false, // 💡 Essential so unexpected UI fields aren't discarded on submit
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);