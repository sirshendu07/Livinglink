const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const env = require('../src/config/env');

let mongoServer;

beforeAll(async () => {
  env.NODE_ENV = 'test';
  env.DEMO_PAYMENTS_ENABLED = true;
  env.PAYMENT_DEMO_SECRET = 'LivingLinkDemoPay2026!';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
