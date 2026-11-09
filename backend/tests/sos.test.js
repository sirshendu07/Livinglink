require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Flat = require('../src/models/flat.model');
const SosAlert = require('../src/models/sosAlert.model');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');

describe('SOS Emergency Alert Module', () => {
  let adminUser;
  let ownerUser;
  let guardUser;
  let adminToken;
  let ownerToken;
  let guardToken;
  let testFlat;

  beforeEach(async () => {
    testFlat = await Flat.create({ tower: 'Tower D', flatNumber: '404' });

    adminUser = await User.create({
      name: 'Admin Chief',
      email: 'admin_sos@society.local',
      phone: '+919876543241',
      password: 'HashedPassword123!',
      role: ROLES.ADMIN,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerUser = await User.create({
      name: 'Owner Resident',
      email: 'owner_sos@society.local',
      phone: '+919876543242',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: testFlat._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    guardUser = await User.create({
      name: 'Guard Gate',
      email: 'guard_sos@society.local',
      phone: '+919876543243',
      password: 'HashedPassword123!',
      role: ROLES.SECURITY,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    adminToken = generateAccessToken({ id: adminUser._id.toString(), email: adminUser.email, role: ROLES.ADMIN });
    ownerToken = generateAccessToken({ id: ownerUser._id.toString(), email: ownerUser.email, role: ROLES.OWNER });
    guardToken = generateAccessToken({ id: guardUser._id.toString(), email: guardUser.email, role: ROLES.SECURITY });
  });

  it('should trigger SOS, persist in MongoDB, allow guard to acknowledge, and admin to resolve', async () => {
    // 1. Owner triggers SOS
    const triggerRes = await request(app)
      .post('/api/v1/sos/trigger')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ notes: 'Medical emergency in flat 404!' });

    expect(triggerRes.status).toBe(201);
    expect(triggerRes.body.data.alert.sosCode).toBeDefined();
    expect(triggerRes.body.data.alert.status).toBe('ACTIVE');

    const sosId = triggerRes.body.data.alert._id;

    // Verify persisted in MongoDB
    const persisted = await SosAlert.findById(sosId);
    expect(persisted).toBeDefined();
    expect(persisted.status).toBe('ACTIVE');

    // 2. Guard views active alerts
    const activeRes = await request(app)
      .get('/api/v1/sos/active')
      .set('Authorization', `Bearer ${guardToken}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data.alerts.length).toBe(1);

    // 3. Guard acknowledges alert
    const ackRes = await request(app)
      .patch(`/api/v1/sos/${sosId}/acknowledge`)
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ notes: 'First aid team dispatched to tower D' });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.alert.status).toBe('ACKNOWLEDGED');

    // 4. Admin resolves alert
    const resolveRes = await request(app)
      .patch(`/api/v1/sos/${sosId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionNotes: 'Ambulance attended. Resident safe.' });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.alert.status).toBe('RESOLVED');

    // 5. Active alerts list should now be empty
    const postActiveRes = await request(app)
      .get('/api/v1/sos/active')
      .set('Authorization', `Bearer ${guardToken}`);

    expect(postActiveRes.body.data.alerts.length).toBe(0);
  });
});
