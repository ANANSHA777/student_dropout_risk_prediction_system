// backend/models/Survey.js
const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Academic & Study Metrics
    academicInterest: {
      type: String,
      default: 'High (Motivated)',
    },
    abilityToStudy: {
      type: String,
      default: 'Full (Can focus well)',
    },
    academicWorkload: {
      type: String,
      default: '3 - 5 hours',
    },
    studyHoursPerDay: {
      type: String,
      default: '3 - 5 hours',
    },
    dailySelfStudyHours: {
      type: String,
      default: '3 - 5 hours',
    },

    // Stress & Financial Metrics
    stressLevel: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Manageable',
    },
    financialStress: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Low (No issue)',
    },
    moneyFeeWorries: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Low (No issue)',
    },

    // Personal & Mental Health Metrics
    personalSubstanceUsage: {
      type: String,
      default: 'None',
    },
    mentalHealthSelfReport: {
      type: String,
      default: 'Good / Balanced',
    },
    mentalHealthStatus: {
      type: String,
      default: 'Good / Balanced',
    },
    mentalHealthState: {
      type: String,
      default: 'Good / Balanced',
    },

    // Notes and Comments
    additionalNotes: {
      type: String,
      default: '',
    },
    comments: {
      type: String,
      default: '',
    },

    // Status Tracking Flags
    surveyCompleted: {
      type: Boolean,
      default: true,
    },
    surveyStatus: {
      type: String,
      default: 'Completed',
    },

    // Flexible payload dump to ensure data is never lost
    surveyData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false, // Ensures unmapped fields from custom forms aren't thrown away
  }
);

// Optimize query performance for historical survey retrieval
surveySchema.index({ studentId: 1, createdAt: -1 });

// Clean JSON response for frontend consumption
surveySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Survey', surveySchema);