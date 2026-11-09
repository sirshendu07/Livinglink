const mongoose = require('mongoose');
const { MAINTENANCE_STATUS } = require('../constants/statuses');

const maintenanceInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true
    },
    billingMonth: {
      type: String, // Format: YYYY-MM
      required: true,
      trim: true,
      index: true
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 1
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.UNPAID,
      index: true
    },
    paidAt: {
      type: Date,
      default: null
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    waiverAmountInPaise: {
      type: Number,
      default: 0
    },
    waiverReason: {
      type: String,
      default: null
    },
    waiverRecordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

maintenanceInvoiceSchema.index({ flat: 1, billingMonth: 1 }, { unique: true });
maintenanceInvoiceSchema.index({ status: 1, dueDate: 1 });

const MaintenanceInvoice = mongoose.model('MaintenanceInvoice', maintenanceInvoiceSchema);

module.exports = MaintenanceInvoice;
