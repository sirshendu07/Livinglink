const mongoose = require('mongoose');
const { AMENITY_VERIFICATION_RESULT } = require('../constants/statuses');

const amenityEntryLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null
    },
    amenity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: true,
      index: true
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AmenitySubscription',
      default: null
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    verificationResult: {
      type: String,
      enum: Object.values(AMENITY_VERIFICATION_RESULT),
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: null
    },
    adminOverrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    overrideReason: {
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

amenityEntryLogSchema.index({ amenity: 1, createdAt: -1 });

const AmenityEntryLog = mongoose.model('AmenityEntryLog', amenityEntryLogSchema);

module.exports = AmenityEntryLog;
