const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/user.model');
const { ROLES } = require('../src/constants/roles');
const { USER_STATUS } = require('../src/constants/statuses');
const { hashPassword } = require('../src/utils/crypto.utils');
const env = require('../src/config/env');
const logger = require('../src/config/logger');

const bootstrapAdmin = async () => {
  try {
    await connectDB();

    const email = env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      logger.info(`Admin account with email ${email} already exists.`);
      await disconnectDB();
      process.exit(0);
    }

    const hashedPassword = await hashPassword(env.ADMIN_BOOTSTRAP_PASSWORD);

    const admin = await User.create({
      name: env.ADMIN_BOOTSTRAP_NAME,
      email,
      phone: env.ADMIN_BOOTSTRAP_PHONE,
      password: hashedPassword,
      role: ROLES.ADMIN,
      flat: null,
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      approvedAt: new Date()
    });

    logger.info(`Bootstrap successful! Admin account created: ${admin.email} (Role: ${admin.role})`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to bootstrap admin account');
    await disconnectDB();
    process.exit(1);
  }
};

bootstrapAdmin();
