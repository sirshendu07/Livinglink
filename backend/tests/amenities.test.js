require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Flat = require('../src/models/flat.model');
const Amenity = require('../src/models/amenity.model');
const MaintenanceInvoice = require('../src/models/maintenanceInvoice.model');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');
const { MAINTENANCE_STATUS } = require('../src/constants/statuses');

describe('Amenities & Digital Access Card Module', () => {
  let ownerUser;
  let guardUser;
  let ownerToken;
  let guardToken;
  let testFlat;
  let testAmenity;

  beforeEach(async () => {
    testFlat = await Flat.create({ tower: 'Tower B', flatNumber: '202' });

    ownerUser = await User.create({
      name: 'Bob Owner',
      email: 'bob@example.com',
      phone: '+919876543211',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: testFlat._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    guardUser = await User.create({
      name: 'Guard Ramesh',
      email: 'ramesh@example.com',
      phone: '+919876543299',
      password: 'HashedPassword123!',
      role: ROLES.SECURITY,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerToken = generateAccessToken({
      id: ownerUser._id.toString(),
      email: ownerUser.email,
      role: ROLES.OWNER
    });

    guardToken = generateAccessToken({
      id: guardUser._id.toString(),
      email: guardUser.email,
      role: ROLES.SECURITY
    });

    testAmenity = await Amenity.create({
      name: 'Society Swimming Pool',
      slug: 'swimming-pool',
      description: 'Olympic size pool',
      plans: [
        { planId: 'PER_DAY', name: 'Day Pass', durationDays: 1, priceInPaise: 2500, isActive: true },
        { planId: 'PER_MONTH', name: 'Monthly Membership', durationDays: 30, priceInPaise: 40000, isActive: true }
      ],
      isActive: true
    });
  });

  it('should purchase a subscription using demo payment and reject invalid passphrase', async () => {
    // 1. Attempt with invalid passphrase
    const badPayRes = await request(app)
      .post('/api/v1/subscriptions/purchase')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amenityId: testAmenity._id.toString(),
        planId: 'PER_MONTH',
        paymentPassphrase: 'WrongPassphrase',
        idempotencyKey: 'idem-key-test-001'
      });

    expect(badPayRes.status).toBe(400);

    // 2. Attempt with correct demo passphrase
    const goodPayRes = await request(app)
      .post('/api/v1/subscriptions/purchase')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amenityId: testAmenity._id.toString(),
        planId: 'PER_MONTH',
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-test-002'
      });

    expect(goodPayRes.status).toBe(200);
    expect(goodPayRes.body.data.subscription).toBeDefined();
    expect(goodPayRes.body.data.payment.paymentId).toBeDefined();
  });

  it('should grant GREEN card status when subscription is active and no maintenance dues exist', async () => {
    // Purchase subscription
    await request(app)
      .post('/api/v1/subscriptions/purchase')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amenityId: testAmenity._id.toString(),
        planId: 'PER_MONTH',
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-test-003'
      });

    // View Access Card
    const cardRes = await request(app)
      .get(`/api/v1/amenity-access/cards/${testAmenity._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(cardRes.status).toBe(200);
    expect(cardRes.body.data.card.accessStatus).toBe('GREEN');
    expect(cardRes.body.data.card.qrToken).toBeDefined();

    // Guard scans / verifies QR token
    const verifyRes = await request(app)
      .post('/api/v1/amenity-access/verify')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ qrToken: cardRes.body.data.card.qrToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessStatus).toBe('GREEN');
    expect(verifyRes.body.data.verificationResult).toBe('ALLOWED');
  });

  it('should deny amenity access (RED card) if owner flat has unpaid maintenance dues', async () => {
    // Purchase active subscription
    await request(app)
      .post('/api/v1/subscriptions/purchase')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amenityId: testAmenity._id.toString(),
        planId: 'PER_MONTH',
        paymentPassphrase: 'LivingLinkDemoPay2026!',
        idempotencyKey: 'idem-key-test-004'
      });

    // Create an unpaid maintenance invoice for the owner's flat
    await MaintenanceInvoice.create({
      invoiceNumber: 'INV-202611-9999',
      flat: testFlat._id,
      billingMonth: '2026-11',
      amountInPaise: 350000,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
      status: MAINTENANCE_STATUS.UNPAID
    });

    // View Access Card: Should now be RED due to unpaid maintenance rule
    const cardRes = await request(app)
      .get(`/api/v1/amenity-access/cards/${testAmenity._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(cardRes.status).toBe(200);
    expect(cardRes.body.data.card.accessStatus).toBe('RED');
    expect(cardRes.body.data.card.unpaidMaintenanceDues).toBe(true);

    // Guard verifies token: Should be DENIED
    const verifyRes = await request(app)
      .post('/api/v1/amenity-access/verify')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ qrToken: cardRes.body.data.card.qrToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessStatus).toBe('RED');
    expect(verifyRes.body.data.verificationResult).toBe('DENIED');
  });
});
