require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Flat = require('../src/models/flat.model');
const MaintenanceInvoice = require('../src/models/maintenanceInvoice.model');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');

describe('Maintenance & Payment Simulation Module', () => {
  let adminUser;
  let ownerUser1;
  let ownerUser2;
  let adminToken;
  let owner1Token;
  let owner2Token;
  let flat1;
  let flat2;

  beforeEach(async () => {
    flat1 = await Flat.create({ tower: 'Tower A', flatNumber: '101' });
    flat2 = await Flat.create({ tower: 'Tower B', flatNumber: '202' });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@society.local',
      phone: '+919999999999',
      password: 'HashedPassword123!',
      role: ROLES.ADMIN,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerUser1 = await User.create({
      name: 'Owner 1',
      email: 'owner1@society.local',
      phone: '+919876543201',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: flat1._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerUser2 = await User.create({
      name: 'Owner 2',
      email: 'owner2@society.local',
      phone: '+919876543202',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: flat2._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    adminToken = generateAccessToken({ id: adminUser._id.toString(), email: adminUser.email, role: ROLES.ADMIN });
    owner1Token = generateAccessToken({ id: ownerUser1._id.toString(), email: ownerUser1.email, role: ROLES.OWNER });
    owner2Token = generateAccessToken({ id: ownerUser2._id.toString(), email: ownerUser2.email, role: ROLES.OWNER });
  });

  it('should allow admin to create an invoice and owner to view only their own invoice', async () => {
    // Admin creates invoice for flat 1
    const createRes = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        flatId: flat1._id.toString(),
        billingMonth: '2026-11',
        amountInPaise: 450000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.invoice.invoiceNumber).toBeDefined();

    // Owner 1 views their invoices: should see it
    const owner1Res = await request(app)
      .get('/api/v1/maintenance/my')
      .set('Authorization', `Bearer ${owner1Token}`);

    expect(owner1Res.status).toBe(200);
    expect(owner1Res.body.data.items.length).toBe(1);
    expect(owner1Res.body.data.items[0].invoiceNumber).toBe(createRes.body.data.invoice.invoiceNumber);

    // Owner 2 views their invoices: should NOT see flat 1's invoice
    const owner2Res = await request(app)
      .get('/api/v1/maintenance/my')
      .set('Authorization', `Bearer ${owner2Token}`);

    expect(owner2Res.status).toBe(200);
    expect(owner2Res.body.data.items.length).toBe(0);
  });

  it('should prevent owner from paying another flat private invoice', async () => {
    const invoice = await MaintenanceInvoice.create({
      invoiceNumber: 'INV-202611-0005',
      flat: flat1._id,
      billingMonth: '2026-11',
      amountInPaise: 500000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'UNPAID'
    });

    // Owner 2 attempts to pay Owner 1's invoice
    const payRes = await request(app)
      .post('/api/v1/payments/pay-maintenance')
      .set('Authorization', `Bearer ${owner2Token}`)
      .send({
        invoiceId: invoice._id.toString(),
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-maint-001'
      });

    expect(payRes.status).toBe(403);
  });

  it('should successfully pay maintenance and handle idempotency and receipt download', async () => {
    const invoice = await MaintenanceInvoice.create({
      invoiceNumber: 'INV-202611-0006',
      flat: flat1._id,
      billingMonth: '2026-11',
      amountInPaise: 400000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'UNPAID'
    });

    // Pay invoice
    const payRes = await request(app)
      .post('/api/v1/payments/pay-maintenance')
      .set('Authorization', `Bearer ${owner1Token}`)
      .send({
        invoiceId: invoice._id.toString(),
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-maint-002'
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.payment.receiptNumber).toBeDefined();

    const paymentId = payRes.body.data.payment.paymentId;

    // Idempotent duplicate replay test:
    const replayRes = await request(app)
      .post('/api/v1/payments/pay-maintenance')
      .set('Authorization', `Bearer ${owner1Token}`)
      .send({
        invoiceId: invoice._id.toString(),
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-maint-002'
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.isIdempotentReplay).toBe(true);

    // Download PDF Receipt
    const receiptRes = await request(app)
      .get(`/api/v1/receipts/${paymentId}/download`)
      .set('Authorization', `Bearer ${owner1Token}`);

    expect(receiptRes.status).toBe(200);
    expect(receiptRes.headers['content-type']).toBe('application/pdf');
    expect(receiptRes.body).toBeDefined();
  });
});
