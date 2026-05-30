const mongoose = require('mongoose');

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending',
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
    resume: {
      type: String,
      default: '',
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
    // --- Bonus Stage: OA Fields ---
    oaStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    oaScore: {
      type: Number,
      default: 0
    },
    proctorWarnings: {
      type: Number,
      default: 0
    },
    assessmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ job: 1 });

module.exports = mongoose.model('Application', applicationSchema);
