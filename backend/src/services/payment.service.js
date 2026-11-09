const crypto = require('crypto');
const Payment = require('../models/payment.model');
const MaintenanceInvoice = require('../models/maintenanceInvoice.model');
const Amenity = require('../models/amenity.model');
const AmenitySubscription = require('../models/amenitySubscription.model');
const env = require('../config/env');
const AppError = require('../utils/appError');
const {
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  MAINTENANCE_STATUS,
  SUBSCRIPTION_STATUS
} = require('../constants/statuses');
const { calculateSubscriptionEndDate } = require('./amenity.service');
const { createNotification } = require('./notification.service');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Validate Demo Payment Mode & Passphrase
 */
const verifyDemoPaymentPassphrase = (passphrase) => {
  if (!env.DEMO_PAYMENTS_ENABLED) {
    throw AppError.badRequest('Demo payment simulation is currently disabled in this environment.');
  }

  if (env.NODE_ENV === 'production') {
    throw AppError.forbidden('Demo payments are strictly disallowed in production mode.');
  }

  if (!passphrase || passphrase !== env.PAYMENT_DEMO_SECRET) {
    throw AppError.badRequest('Invalid demo payment passphrase. Simulation transaction rejected.');
  }
};

/**
 * Generate unique transaction & receipt identifiers
 */
const generatePaymentIdentifiers = () => {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const paymentId = `PAY-${timestamp}-${randomSuffix}`;
  const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
  return { paymentId, receiptNumber };
};

/**
 * Process Demo Payment for Maintenance Invoice
 */
const payMaintenanceInvoice = async ({ invoiceId, paymentPassphrase, idempotencyKey }, user) => {
  verifyDemoPaymentPassphrase(paymentPassphrase);

  // Idempotency check: Return existing payment if already completed
  const existingPayment = await Payment.findOne({ idempotencyKey }).populate('maintenanceInvoice');
  if (existingPayment) {
    return {
      isIdempotentReplay: true,
      payment: existingPayment
    };
  }

  const invoice = await MaintenanceInvoice.findById(invoiceId).populate('flat');
  if (!invoice) {
    throw AppError.notFound('Maintenance invoice not found');
  }

  // Ensure the invoice belongs to the owner's flat
  if (user.flat && invoice.flat._id.toString() !== user.flat._id.toString() && invoice.flat.toString() !== user.flat.toString()) {
    throw AppError.forbidden('You can only pay maintenance invoices for your own flat');
  }

  if (invoice.status === MAINTENANCE_STATUS.PAID) {
    throw AppError.badRequest('This maintenance invoice has already been paid in full');
  }

  // Server-side calculation of payable amount
  const payableAmountInPaise = Math.max(0, invoice.amountInPaise - (invoice.waiverAmountInPaise || 0));
  const { paymentId, receiptNumber } = generatePaymentIdentifiers();

  const payment = await Payment.create({
    paymentId,
    receiptNumber,
    user: user._id,
    flat: invoice.flat._id || invoice.flat,
    paymentType: PAYMENT_TYPE.MAINTENANCE,
    maintenanceInvoice: invoice._id,
    amountInPaise: payableAmountInPaise,
    paymentMethod: 'DEMO',
    status: PAYMENT_STATUS.SUCCESS,
    idempotencyKey,
    metadata: {
      isDemoSimulation: true,
      billingMonth: invoice.billingMonth,
      paidByName: user.name,
      paidAt: new Date().toISOString()
    }
  });

  invoice.status = MAINTENANCE_STATUS.PAID;
  invoice.paidAt = new Date();
  invoice.payment = payment._id;
  await invoice.save();

  // Create real-time notification
  await createNotification({
    recipient: user._id,
    type: 'PAYMENT_SUCCESS',
    title: 'Maintenance Payment Successful',
    message: `Payment of ₹${(payableAmountInPaise / 100).toFixed(2)} for ${invoice.billingMonth} maintenance received. Receipt #${receiptNumber}.`,
    data: { paymentId: payment.paymentId, receiptNumber }
  });

  await recordAuditLog({
    actor: user._id,
    actorRole: user.role,
    action: 'DEMO_PAYMENT_MAINTENANCE',
    resourceType: 'Payment',
    resourceId: payment._id,
    details: { invoiceId: invoice._id, amountInPaise: payableAmountInPaise }
  });

  return {
    isIdempotentReplay: false,
    payment
  };
};

/**
 * Process Demo Payment for Amenity Subscription Purchase
 */
const purchaseAmenitySubscription = async ({ amenityId, planId, paymentPassphrase, idempotencyKey }, user) => {
  verifyDemoPaymentPassphrase(paymentPassphrase);

  // Idempotency check
  const existingPayment = await Payment.findOne({ idempotencyKey }).populate('amenitySubscription');
  if (existingPayment) {
    return {
      isIdempotentReplay: true,
      payment: existingPayment
    };
  }

  const amenity = await Amenity.findById(amenityId);
  if (!amenity || !amenity.isActive) {
    throw AppError.notFound('Amenity is currently not available');
  }

  const selectedPlan = amenity.plans.find((p) => p.planId === planId && p.isActive);
  if (!selectedPlan) {
    throw AppError.badRequest('Selected subscription plan is invalid or deactivated');
  }

  // Calculate pricing and period strictly on the server
  const payableAmountInPaise = selectedPlan.priceInPaise;
  const startDate = new Date();
  const endDate = calculateSubscriptionEndDate(startDate, selectedPlan.planId);

  const { paymentId, receiptNumber } = generatePaymentIdentifiers();

  const payment = await Payment.create({
    paymentId,
    receiptNumber,
    user: user._id,
    flat: user.flat?._id || user.flat,
    paymentType: PAYMENT_TYPE.AMENITY_SUBSCRIPTION,
    amountInPaise: payableAmountInPaise,
    paymentMethod: 'DEMO',
    status: PAYMENT_STATUS.SUCCESS,
    idempotencyKey,
    metadata: {
      isDemoSimulation: true,
      amenityName: amenity.name,
      planName: selectedPlan.name,
      planId: selectedPlan.planId,
      paidAt: new Date().toISOString()
    }
  });

  const subscription = await AmenitySubscription.create({
    user: user._id,
    flat: user.flat?._id || user.flat,
    amenity: amenity._id,
    planId: selectedPlan.planId,
    planName: selectedPlan.name,
    startDate,
    endDate,
    priceInPaise: payableAmountInPaise,
    payment: payment._id,
    status: SUBSCRIPTION_STATUS.ACTIVE
  });

  payment.amenitySubscription = subscription._id;
  await payment.save();

  await createNotification({
    recipient: user._id,
    type: 'SUBSCRIPTION_ACTIVATED',
    title: 'Amenity Subscription Activated',
    message: `Your subscription to ${amenity.name} (${selectedPlan.name}) is now active until ${endDate.toLocaleDateString()}. Receipt #${receiptNumber}.`,
    data: { subscriptionId: subscription._id, receiptNumber }
  });

  return {
    isIdempotentReplay: false,
    payment,
    subscription
  };
};

/**
 * Get payment records for owner or admin
 */
const getPayments = async ({ userId, paymentType, page = 1, limit = 20 }) => {
  const query = {};
  if (userId) query.user = userId;
  if (paymentType) query.paymentType = paymentType;

  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('user', 'name email phone')
      .populate('flat', 'tower flatNumber')
      .populate('maintenanceInvoice')
      .populate('amenitySubscription')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query)
  ]);

  return {
    items: payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  payMaintenanceInvoice,
  purchaseAmenitySubscription,
  getPayments
};
