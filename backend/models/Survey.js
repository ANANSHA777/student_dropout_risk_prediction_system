// backend/models/Survey.js
const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Changed from Number to String (or Number) to match frontend dropdowns
    stressLevel: {
      type: mongoose.Schema.Types.Mixed, 
      default: 'Manageable',
    },
    financialStress: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Low (No issue)',
    },
    personalSubstanceUsage: {
      type: String,
      default: 'None',
    },
    mentalHealthSelfReport: {
      type: String, 
      default: 'Good / Balanced',
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    comments: {
      type: String,
      default: '',
    },
    // Flexible payload dump to ensure data is never lost
    surveyData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { 
    timestamps: true,
    strict: false, // Ensures unmapped fields from forms aren't thrown away
  }
);

module.exports = mongoose.model('Survey', surveySchema);