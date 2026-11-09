require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Flat = require('../src/models/flat.model');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');

describe('Visitor Gate Approval Workflow Module', () => {
  let guardUser;
  let ownerUser;
  let anotherOwnerUser;
  let guardToken;
  let ownerToken;
  let anotherOwnerToken;
  let flat1;
  let flat2;

  beforeEach(async () => {
    flat1 = await Flat.create({ tower: 'Tower A', flatNumber: '501' });
    flat2 = await Flat.create({ tower: 'Tower B', flatNumber: '502' });

    guardUser = await User.create({
      name: 'Guard Bahadur',
      email: 'bahadur@society.local',
      phone: '+919876543277',
      password: 'HashedPassword123!',
      role: ROLES.SECURITY,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerUser = await User.create({
      name: 'Priya Sharma',
      email: 'priya@society.local',
      phone: '+919876543288',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: flat1._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    anotherOwnerUser = await User.create({
      name: 'Vikram Singh',
      email: 'vikram@society.local',
      phone: '+919876543299',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: flat2._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    guardToken = generateAccessToken({ id: guardUser._id.toString(), email: guardUser.email, role: ROLES.SECURITY });
    ownerToken = generateAccessToken({ id: ownerUser._id.toString(), email: ownerUser.email, role: ROLES.OWNER });
    anotherOwnerToken = generateAccessToken({ id: anotherOwnerUser._id.toString(), email: anotherOwnerUser.email, role: ROLES.OWNER });
  });

  it('should complete full visitor workflow: create -> approve -> enter -> exit', async () => {
    // 1. Guard creates visitor request
    const createRes = await request(app)
      .post('/api/v1/visitors')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({
        visitorName: 'Swiggy Delivery Partner',
        visitorPhone: '+919800011122',
        tower: 'Tower A',
        flatNumber: '501',
        category: 'FOOD_DELIVERY',
        purpose: 'Food delivery parcel'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.request.status).toBe('PENDING');
    const requestId = createRes.body.data.request._id;

    // 2. Guard attempts to mark entered while still PENDING: MUST BE REJECTED
    const earlyEnterRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/enter`)
      .set('Authorization', `Bearer ${guardToken}`);

    expect(earlyEnterRes.status).toBe(400);

    // 3. Security guard attempts to approve visitor: MUST BE FORBIDDEN
    const guardApproveRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/respond`)
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ decision: 'APPROVE' });

    expect(guardApproveRes.status).toBe(403);

    // 4. Another flat owner attempts to approve visitor: MUST BE FORBIDDEN
    const wrongOwnerApproveRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/respond`)
      .set('Authorization', `Bearer ${anotherOwnerToken}`)
      .send({ decision: 'APPROVE' });

    expect(wrongOwnerApproveRes.status).toBe(403);

    // 5. Destination Flat Owner approves visitor: SUCCESS
    const ownerApproveRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/respond`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ decision: 'APPROVE' });

    expect(ownerApproveRes.status).toBe(200);
    expect(ownerApproveRes.body.data.request.status).toBe('APPROVED');

    // 6. Guard marks approved visitor as entered: SUCCESS
    const enterRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/enter`)
      .set('Authorization', `Bearer ${guardToken}`);

    expect(enterRes.status).toBe(200);
    expect(enterRes.body.data.request.status).toBe('ENTERED');

    // 7. Guard marks entered visitor as exited: SUCCESS
    const exitRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/exit`)
      .set('Authorization', `Bearer ${guardToken}`);

    expect(exitRes.status).toBe(200);
    expect(exitRes.body.data.request.status).toBe('EXITED');
  });

  it('should handle visitor rejection by owner and block entry', async () => {
    // 1. Guard creates request
    const createRes = await request(app)
      .post('/api/v1/visitors')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({
        visitorName: 'Unknown Salesperson',
        visitorPhone: '+919811122233',
        tower: 'Tower A',
        flatNumber: '501',
        category: 'OTHER',
        purpose: 'Product demonstration'
      });

    const requestId = createRes.body.data.request._id;

    // 2. Owner rejects
    const rejectRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/respond`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ decision: 'REJECT', rejectionReason: 'Not interested' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.request.status).toBe('REJECTED');

    // 3. Guard cannot mark rejected visitor entered
    const enterRes = await request(app)
      .patch(`/api/v1/visitors/${requestId}/enter`)
      .set('Authorization', `Bearer ${guardToken}`);

    expect(enterRes.status).toBe(400);
  });
});
