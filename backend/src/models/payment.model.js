const mongoose = require('mongoose');
const { PAYMENT_TYPE, PAYMENT_STATUS } = require('../constants/statuses');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    receiptNumber: {
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
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true
    },
    paymentType: {
      type: String,
      enum: Object.values(PAYMENT_TYPE),
      required: true,
      index: true
    },
    maintenanceInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceInvoice',
      default: null
    },
    amenitySubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AmenitySubscription',
      default: null
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 1
    },
    paymentMethod: {
      type: String,
      default: 'DEMO'
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.SUCCESS,
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
