const MaintenanceInvoice = require('../models/maintenanceInvoice.model');
const Flat = require('../models/flat.model');
const AppError = require('../utils/appError');
const { MAINTENANCE_STATUS } = require('../constants/statuses');
const { recordAuditLog } = require('../middlewares/audit.middleware');
const { createNotification } = require('./notification.service');

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = (billingMonth, count) => {
  const cleanMonth = billingMonth.replace('-', '');
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${cleanMonth}-${sequence}`;
};

/**
 * Admin creates a single maintenance invoice for a flat
 */
const createInvoice = async ({ flatId, billingMonth, amountInPaise, dueDate }, adminUser) => {
  const flat = await Flat.findById(flatId).populate('residents');
  if (!flat) {
    throw AppError.notFound('Flat not found');
  }

  const existing = await MaintenanceInvoice.findOne({ flat: flat._id, billingMonth });
  if (existing) {
    throw AppError.conflict(`An invoice for flat ${flat.tower}-${flat.flatNumber} for month ${billingMonth} already exists.`);
  }

  const totalInvoicesMonth = await MaintenanceInvoice.countDocuments({ billingMonth });
  const invoiceNumber = generateInvoiceNumber(billingMonth, totalInvoicesMonth);

  const invoice = await MaintenanceInvoice.create({
    invoiceNumber,
    flat: flat._id,
    billingMonth,
    amountInPaise,
    dueDate: new Date(dueDate),
    status: MAINTENANCE_STATUS.UNPAID
  });

  // Notify flat residents
  if (flat.residents && flat.residents.length > 0) {
    for (const resident of flat.residents) {
      await createNotification({
        recipient: resident._id,
        type: 'MAINTENANCE_INVOICE_GENERATED',
        title: 'New Maintenance Bill Generated',
        message: `Maintenance invoice ${invoice.invoiceNumber} for ${billingMonth} (₹${(amountInPaise / 100).toFixed(2)}) is due on ${new Date(dueDate).toLocaleDateString()}.`,
        data: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber }
      });
    }
  }

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'CREATE_MAINTENANCE_INVOICE',
    resourceType: 'MaintenanceInvoice',
    resourceId: invoice._id,
    details: { invoiceNumber: invoice.invoiceNumber, flat: `${flat.tower}-${flat.flatNumber}`, amountInPaise }
  });

  return invoice;
};

/**
 * Admin creates bulk invoices for all flats (or a specific tower)
 */
const generateBulkInvoices = async ({ billingMonth, amountInPaise, dueDate, tower }, adminUser) => {
  const flatQuery = {};
  if (tower) flatQuery.tower = tower.trim().toUpperCase();

  const flats = await Flat.find(flatQuery).populate('residents');
  if (flats.length === 0) {
    throw AppError.notFound('No flats found matching criteria');
  }

  const createdInvoices = [];
  let existingCount = await MaintenanceInvoice.countDocuments({ billingMonth });

  for (const flat of flats) {
    const existing = await MaintenanceInvoice.findOne({ flat: flat._id, billingMonth });
    if (!existing) {
      const invoiceNumber = generateInvoiceNumber(billingMonth, existingCount++);
      const inv = await MaintenanceInvoice.create({
        invoiceNumber,
        flat: flat._id,
        billingMonth,
        amountInPaise,
        dueDate: new Date(dueDate),
        status: MAINTENANCE_STATUS.UNPAID
      });
      createdInvoices.push(inv);

      // Notify residents
      if (flat.residents && flat.residents.length > 0) {
        for (const resident of flat.residents) {
          createNotification({
            recipient: resident._id,
            type: 'MAINTENANCE_INVOICE_GENERATED',
            title: 'Monthly Maintenance Invoice',
            message: `Invoice ${inv.invoiceNumber} for ${billingMonth} has been issued.`,
            data: { invoiceId: inv._id }
          }).catch(() => {});
        }
      }
    }
  }

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'GENERATE_BULK_INVOICES',
    resourceType: 'MaintenanceInvoice',
    details: { billingMonth, generatedCount: createdInvoices.length }
  });

  return {
    generatedCount: createdInvoices.length,
    billingMonth,
    invoices: createdInvoices
  };
};

/**
 * Admin records waiver or adjustment on an invoice
 */
const recordWaiver = async (invoiceId, { waiverAmountInPaise, reason }, adminUser) => {
  const invoice = await MaintenanceInvoice.findById(invoiceId);
  if (!invoice) {
    throw AppError.notFound('Invoice not found');
  }

  if (invoice.status === MAINTENANCE_STATUS.PAID) {
    throw AppError.badRequest('Cannot apply waiver to an already paid invoice');
  }

  if (waiverAmountInPaise >= invoice.amountInPaise) {
    invoice.waiverAmountInPaise = invoice.amountInPaise;
    invoice.status = MAINTENANCE_STATUS.PAID;
    invoice.paidAt = new Date();
  } else {
    invoice.waiverAmountInPaise = waiverAmountInPaise;
  }

  invoice.waiverReason = reason;
  invoice.waiverRecordedBy = adminUser._id;
  await invoice.save();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'RECORD_MAINTENANCE_WAIVER',
    resourceType: 'MaintenanceInvoice',
    resourceId: invoice._id,
    details: { waiverAmountInPaise, reason }
  });

  return invoice;
};

/**
 * Get invoices for an owner's flat
 */
const getOwnerInvoices = async (flatId, { status, page = 1, limit = 20 }) => {
  const query = { flat: flatId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    MaintenanceInvoice.find(query)
      .populate('flat', 'tower flatNumber')
      .populate('payment')
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceInvoice.countDocuments(query)
  ]);

  return {
    items: invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Admin: Get all society invoices with tower/flat/status filters and sorting
 */
const getAllInvoicesAdmin = async ({ tower, flatNumber, status, billingMonth, sortBy = 'dueDate', sortOrder = 'desc', page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (billingMonth) query.billingMonth = billingMonth;

  if (tower || flatNumber) {
    const flatFilter = {};
    if (tower) flatFilter.tower = tower.trim().toUpperCase();
    if (flatNumber) flatFilter.flatNumber = flatNumber.trim().toUpperCase();
    const matchingFlats = await Flat.find(flatFilter).select('_id');
    query.flat = { $in: matchingFlats.map((f) => f._id) };
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    MaintenanceInvoice.find(query)
      .populate('flat', 'tower flatNumber')
      .populate('payment')
      .populate('waiverRecordedBy', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceInvoice.countDocuments(query)
  ]);

  return {
    items: invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Get Defaulters list (flats with unpaid/overdue invoices past due date)
 */
const getDefaulters = async ({ tower, page = 1, limit = 20 }) => {
  const now = new Date();
  const invoiceQuery = {
    status: { $in: [MAINTENANCE_STATUS.UNPAID, MAINTENANCE_STATUS.OVERDUE] },
    dueDate: { $lt: now }
  };

  const overdueInvoices = await MaintenanceInvoice.find(invoiceQuery)
    .populate({
      path: 'flat',
      populate: { path: 'residents', select: 'name email phone' }
    })
    .lean();

  // Aggregate by flat
  const defaulterMap = new Map();
  for (const inv of overdueInvoices) {
    if (!inv.flat) continue;
    if (tower && inv.flat.tower !== tower.trim().toUpperCase()) continue;

    const flatId = inv.flat._id.toString();
    if (!defaulterMap.has(flatId)) {
      defaulterMap.set(flatId, {
        flatId: inv.flat._id,
        tower: inv.flat.tower,
        flatNumber: inv.flat.flatNumber,
        residents: inv.flat.residents || [],
        totalOverdueInPaise: 0,
        unpaidInvoicesCount: 0,
        invoices: []
      });
    }

    const item = defaulterMap.get(flatId);
    item.totalOverdueInPaise += inv.amountInPaise - (inv.waiverAmountInPaise || 0);
    item.unpaidInvoicesCount += 1;
    item.invoices.push({
      invoiceId: inv._id,
      invoiceNumber: inv.invoiceNumber,
      billingMonth: inv.billingMonth,
      dueDate: inv.dueDate,
      amountInPaise: inv.amountInPaise
    });
  }

  const allDefaulters = Array.from(defaulterMap.values());
  const total = allDefaulters.length;
  const skip = (page - 1) * limit;
  const paginated = allDefaulters.slice(skip, skip + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  createInvoice,
  generateBulkInvoices,
  recordWaiver,
  getOwnerInvoices,
  getAllInvoicesAdmin,
  getDefaulters
};
