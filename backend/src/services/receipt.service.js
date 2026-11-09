const Payment = require('../models/payment.model');
const AppError = require('../utils/appError');
const { generatePdfReceiptBuffer } = require('../utils/pdfReceipt');
const { ROLES } = require('../constants/roles');

/**
 * Generate PDF Receipt buffer for a payment
 */
const getPaymentReceiptPdf = async (paymentIdOrReceiptNum, requestingUser) => {
  const payment = await Payment.findOne({
    $or: [{ paymentId: paymentIdOrReceiptNum }, { receiptNumber: paymentIdOrReceiptNum }]
  })
    .populate('user', 'name email phone')
    .populate('flat', 'tower flatNumber')
    .populate('maintenanceInvoice')
    .populate('amenitySubscription');

  if (!payment) {
    throw AppError.notFound('Payment receipt record not found');
  }

  // Authorization check: Owner can only access their own receipts; Admin can access all
  const isOwnerOfReceipt = payment.user._id.toString() === requestingUser._id.toString();
  const isAdmin = requestingUser.role === ROLES.ADMIN;

  if (!isOwnerOfReceipt && !isAdmin) {
    throw AppError.forbidden('You are not authorized to access this payment receipt');
  }

  const receiptData = {
    receiptNumber: payment.receiptNumber,
    paymentId: payment.paymentId,
    transactionDate: payment.createdAt,
    ownerName: payment.user?.name || 'Resident',
    ownerEmail: payment.user?.email,
    ownerPhone: payment.user?.phone,
    tower: payment.flat?.tower || 'N/A',
    flatNumber: payment.flat?.flatNumber || 'N/A',
    paymentType: payment.paymentType,
    paymentMethod: payment.paymentMethod,
    amountInPaise: payment.amountInPaise,
    status: payment.status,
    description:
      payment.paymentType === 'MAINTENANCE'
        ? `Society Maintenance Dues for Billing Month ${payment.metadata?.billingMonth || 'N/A'}`
        : `Amenity Subscription (${payment.metadata?.amenityName || 'Amenity'} - ${payment.metadata?.planName || 'Plan'})`
  };

  const pdfBuffer = await generatePdfReceiptBuffer(receiptData);

  return {
    filename: `Receipt-${payment.receiptNumber}.pdf`,
    buffer: pdfBuffer
  };
};

module.exports = {
  getPaymentReceiptPdf
};
