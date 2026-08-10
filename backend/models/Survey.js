const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stressLevel: {
      type: Number, // Scale 1 - 5
      required: true,
    },
    financialStress: {
      type: Number, // Scale 1 - 5
      required: true,
    },
    personalSubstanceUsage: {
      type: String,
      enum: ['None', 'Occasional', 'Frequent'],
      default: 'None',
    },
    mentalHealthSelfReport: {
      type: String, // e.g. "Feeling overwhelmed", "Anxious", "Fine"
      required: true,
    },
    additionalNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Survey', surveySchema);