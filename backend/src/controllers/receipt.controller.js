const receiptService = require('../services/receipt.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Download payment receipt PDF generated via PDFKit
 */
const downloadReceipt = catchAsync(async (req, res) => {
  const { filename, buffer } = await receiptService.getPaymentReceiptPdf(req.params.id, req.user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  return res.send(buffer);
});

module.exports = {
  downloadReceipt
};
