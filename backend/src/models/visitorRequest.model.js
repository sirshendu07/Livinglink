const mongoose = require('mongoose');
const { VISITOR_CATEGORY, VISITOR_STATUS } = require('../constants/statuses');

const visitorRequestSchema = new mongoose.Schema(
  {
    visitorCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone number is required'],
      trim: true,
      index: true
    },
    destinationFlat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: Object.values(VISITOR_CATEGORY),
      required: true,
      index: true
    },
    purpose: {
      type: String,
      default: 'General Visit',
      trim: true
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    photoUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: Object.values(VISITOR_STATUS),
      default: VISITOR_STATUS.PENDING,
      index: true
    },
    createdGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    entryTimestamp: {
      type: Date,
      default: null
    },
    exitTimestamp: {
      type: Date,
      default: null
    },
    entryGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    exitGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

visitorRequestSchema.index({ destinationFlat: 1, status: 1, createdAt: -1 });

const VisitorRequest = mongoose.model('VisitorRequest', visitorRequestSchema);

module.exports = VisitorRequest;
