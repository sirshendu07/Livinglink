const mongoose = require('mongoose');
const {
  COMPLAINT_CATEGORY,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY
} = require('../constants/statuses');

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: 200,
      index: 'text'
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: Object.values(COMPLAINT_CATEGORY),
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    adminNotes: {
      type: String,
      default: null
    },
    resolutionDetails: {
      type: String,
      default: null
    },
    attachments: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
