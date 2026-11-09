const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');
const { SOS_STATUS } = require('../constants/statuses');

const sosAlertSchema = new mongoose.Schema(
  {
    sosCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null
    },
    status: {
      type: String,
      enum: Object.values(SOS_STATUS),
      default: SOS_STATUS.ACTIVE,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: 'Emergency assistance requested'
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

sosAlertSchema.index({ status: 1, createdAt: -1 });

const SosAlert = mongoose.model('SosAlert', sosAlertSchema);

module.exports = SosAlert;
