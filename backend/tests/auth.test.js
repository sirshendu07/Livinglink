require('./setup');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { cacheService } = require('../src/config/redis');
const { CACHE_KEYS } = require('../src/constants/cacheKeys');
const { hashToken } = require('../src/utils/crypto.utils');
const { generateAccessToken } = require('../src/utils/jwt.utils');
const { ROLES } = require('../src/constants/roles');

describe('Authentication & Authorization Module', () => {
  const testOwner = {
    name: 'Alice Resident',
    email: 'alice@example.com',
    phone: '+919876543210',
    password: 'Password#123',
    tower: 'Tower A',
    flatNumber: '101'
  };

  it('should successfully register a new owner account and send OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testOwner);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testOwner.email.toLowerCase());

    const user = await User.findOne({ email: testOwner.email.toLowerCase() });
    expect(user).toBeDefined();
    expect(user.isEmailVerified).toBe(false);
    expect(user.status).toBe('PENDING_APPROVAL');
  });

  it('should reject registration if email is duplicate', async () => {
    await request(app).post('/api/v1/auth/register').send(testOwner);

    const res = await request(app).post('/api/v1/auth/register').send(testOwner);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should verify registration OTP and reject invalid OTP', async () => {
    await request(app).post('/api/v1/auth/register').send(testOwner);

    // Test invalid OTP
    const badRes = await request(app).post('/api/v1/auth/verify-otp').send({
      email: testOwner.email,
      otp: '000000',
      purpose: 'REGISTRATION'
    });
    expect(badRes.status).toBe(400);

    // Set known OTP in cache for testing
    const validOtp = '123456';
    const otpKey = `${CACHE_KEYS.OTP_PREFIX}REGISTRATION:${testOwner.email.toLowerCase()}`;
    await cacheService.set(otpKey, hashToken(validOtp), 300);

    const goodRes = await request(app).post('/api/v1/auth/verify-otp').send({
      email: testOwner.email,
      otp: validOtp,
      purpose: 'REGISTRATION'
    });

    expect(goodRes.status).toBe(200);
    expect(goodRes.body.success).toBe(true);

    const updatedUser = await User.findOne({ email: testOwner.email.toLowerCase() });
    expect(updatedUser.isEmailVerified).toBe(true);
  });

  it('should not allow login if owner account is pending approval, then allow after approval', async () => {
    await request(app).post('/api/v1/auth/register').send(testOwner);
    const user = await User.findOne({ email: testOwner.email.toLowerCase() });
    user.isEmailVerified = true;
    await user.save();

    // Login before admin approval
    const pendingRes = await request(app).post('/api/v1/auth/login').send({
      email: testOwner.email,
      password: testOwner.password
    });
    expect(pendingRes.status).toBe(403);
    expect(pendingRes.body.message).toMatch(/pending admin approval/i);

    // Admin approves account
    user.status = 'ACTIVE';
    await user.save();

    // Login after approval
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testOwner.email,
      password: testOwner.password
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.refreshToken).toBeDefined();
  });

  it('should reject login with incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(testOwner);
    const user = await User.findOne({ email: testOwner.email.toLowerCase() });
    user.isEmailVerified = true;
    user.status = 'ACTIVE';
    await user.save();

    const res = await request(app).post('/api/v1/auth/login').send({
      email: testOwner.email,
      password: 'WrongPassword#999'
    });

    expect(res.status).toBe(401);
  });

  it('should perform refresh token rotation and detect refresh token reuse', async () => {
    await request(app).post('/api/v1/auth/register').send(testOwner);
    const user = await User.findOne({ email: testOwner.email.toLowerCase() });
    user.isEmailVerified = true;
    user.status = 'ACTIVE';
    await user.save();

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: testOwner.email,
      password: testOwner.password
    });

    const initialRefreshToken = loginRes.body.data.refreshToken;

    // First refresh: should succeed and issue rotated token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    const rotatedRefreshToken = refreshRes.body.data.refreshToken;
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

    // REUSE DETECTION: Re-using the consumed initialRefreshToken should be blocked and trigger alert
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: initialRefreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.message).toMatch(/reuse detected/i);
  });

  it('should enforce role-based access restrictions', async () => {
    // Create an active owner
    await request(app).post('/api/v1/auth/register').send(testOwner);
    const user = await User.findOne({ email: testOwner.email.toLowerCase() });
    user.isEmailVerified = true;
    user.status = 'ACTIVE';
    await user.save();

    const ownerToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: ROLES.OWNER
    });

    // Owner tries to access admin-only endpoint: /api/v1/users
    const forbiddenRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(forbiddenRes.status).toBe(403);
  });
});
