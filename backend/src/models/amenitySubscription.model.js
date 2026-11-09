const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUS } = require('../constants/statuses');

const amenitySubscriptionSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    amenity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    planName: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    priceInPaise: {
      type: Number,
      required: true
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

amenitySubscriptionSchema.index({ user: 1, amenity: 1, status: 1 });

const AmenitySubscription = mongoose.model('AmenitySubscription', amenitySubscriptionSchema);

module.exports = AmenitySubscription;
