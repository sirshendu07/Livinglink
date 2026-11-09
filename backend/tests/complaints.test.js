require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Flat = require('../src/models/flat.model');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');

describe('Complaint Management Module', () => {
  let adminUser;
  let ownerUser;
  let guardUser;
  let adminToken;
  let ownerToken;
  let guardToken;
  let testFlat;

  beforeEach(async () => {
    testFlat = await Flat.create({ tower: 'Tower C', flatNumber: '303' });

    adminUser = await User.create({
      name: 'Admin Sharma',
      email: 'admin_comp@society.local',
      phone: '+919876543231',
      password: 'HashedPassword123!',
      role: ROLES.ADMIN,
      flat: null,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    ownerUser = await User.create({
      name: 'Owner Verma',
      email: 'owner_comp@society.local',
      phone: '+919876543232',
      password: 'HashedPassword123!',
      role: ROLES.OWNER,
      flat: testFlat._id,
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    guardUser = await User.create({
      name: 'Guard Santosh',
      email: 'guard_comp@society.local',
      phone: '+919876543233',
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

  it('should allow owner to create a complaint and admin to update status', async () => {
    // Owner creates complaint
    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Water leakage in master bathroom',
        description: 'Water is dripping from the false ceiling pipe continuously.',
        category: 'PLUMBING',
        priority: 'HIGH'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.complaint.complaintNumber).toBeDefined();
    const complaintId = createRes.body.data.complaint._id;

    // Admin updates complaint status
    const updateRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'IN_PROGRESS',
        adminNotes: 'Plumber dispatched to flat 303'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.complaint.status).toBe('IN_PROGRESS');
  });

  it('should forbid security guards from viewing private complaints', async () => {
    const res = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${guardToken}`);

    expect(res.status).toBe(403);
  });
});
