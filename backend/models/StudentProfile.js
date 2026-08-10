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
      // Note: Removed unique: true to prevent E11000 duplicate key errors on missing or empty string IDs
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
    surveyCompleted: {
      type: Boolean,
      default: false, // Tracks student survey completion status
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

    // AI Diagnostic & Classification Fields
    riskScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      default: null, // Default null ensures new/unevaluated students display "Not Evaluated"
    },
    primaryRiskCategory: {
      type: String,
      enum: ['ACADEMIC', 'ATTENDANCE', 'FINANCIAL', 'PERSONAL', 'NONE'],
      default: 'NONE',
    },

    // Automated Action Flags triggered by AI Category/Level
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