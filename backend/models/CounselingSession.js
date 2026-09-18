// backend/models/CounselingSession.js
const mongoose = require('mongoose');

const counselingSessionSchema = new mongoose.Schema(
  {
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Counselor ID is required'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Tracks the teacher/admin who initiated the referral
    },
    notes: {
      type: String,
      required: [true, 'Session notes cannot be empty'],
      trim: true,
      default: 'Initial counseling session scheduled.',
    },
    reasonForReferral: {
      type: String,
      default: '',
      trim: true,
    },
    sessionNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    actionItems: [
      {
        item: { type: String, trim: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: ['Assigned', 'Scheduled', 'Pending Contact', 'In Progress', 'In Review', 'Completed', 'Resolved', 'Cancelled'],
      default: 'Assigned',
      // Inline index removed to eliminate Mongoose duplicate index warning
    },
    category: {
      type: String,
      enum: [
        'Academic',
        'Academic Support',
        'Academic Disengagement',
        'Financial',
        'Financial/Personal',
        'Personal',
        'Health',
        'Wellness & Mental Health',
        'Career Guidance',
        'General Support',
      ],
      default: 'General Support',
    },
    riskCategory: {
      type: String,
      enum: [
        'ACADEMIC',
        'ATTENDANCE',
        'FINANCIAL',
        'PERSONAL',
        'WELLNESS',
        'DISENGAGEMENT',
        'DUAL',
        'NONE',
        'Dual Risk (Academic + Personal)',
        'Academic Risk Only',
        'Personal / Financial Risk',
        'No Policy Risk',
        'General Support',
      ],
      default: 'General Support',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    scheduledDate: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    // --- FINANCIAL & ASSISTANCE LINKAGE ---
    financialAidAssigned: {
      type: Boolean,
      default: false,
    },
    financialGrantRequested: {
      type: Number,
      default: 0,
    },
    // --- STUDENT BACKGROUND CONTEXT ---
    studentBackgroundContext: {
      wellnessSummary: { type: String, default: '' },
      disengagementReason: { type: String, default: '' },
      financialStatus: { type: String, default: '' },
      academicSnapshot: {
        cgpa: { type: Number, default: null },
        attendance: { type: Number, default: null },
        backlogs: { type: String, default: '' },
      },
      evaluationCase: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Compound & Explicit Indexes (Single source of index definition for status)
counselingSessionSchema.index({ counselor: 1, date: -1 });
counselingSessionSchema.index({ student: 1, date: -1 });
counselingSessionSchema.index({ status: 1 });
counselingSessionSchema.index({ counselor: 1, status: 1 });
counselingSessionSchema.index({ riskCategory: 1 });

// Clean JSON response for frontend consumption
counselingSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('CounselingSession', counselingSessionSchema);