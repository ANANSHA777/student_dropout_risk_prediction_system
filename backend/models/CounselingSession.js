const mongoose = require('mongoose');

const counselingSessionSchema = new mongoose.Schema(
  {
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Counselor ID is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    notes: {
      type: String,
      required: [true, 'Session notes cannot be empty'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending Contact', 'In Review', 'Completed', 'Resolved'],
      default: 'Completed'
    },
    category: {
      type: String,
      enum: ['Academic Support', 'Financial/Personal', 'Career Guidance', 'General Support'],
      default: 'General Support'
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// Indexing for faster lookups when querying sessions by student or counselor
counselingSessionSchema.index({ counselor: 1, date: -1 });
counselingSessionSchema.index({ student: 1, date: -1 });

module.exports = mongoose.model('CounselingSession', counselingSessionSchema);