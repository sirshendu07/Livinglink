const env = require('./env');
const logger = require('./logger');

let cloudinary = null;

if (env.CLOUDINARY_ENABLED && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  try {
    const cloudinaryPkg = require('cloudinary');
    cloudinary = cloudinaryPkg.v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true
    });
    logger.info('Cloudinary configured successfully for media uploads');
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to initialize Cloudinary. Media upload will fallback gracefully.');
  }
} else {
  logger.info('Cloudinary disabled or credentials not provided. Media upload operates in direct URL/mock mode.');
}

const uploadFile = async (filePath, folder = 'livinglink') => {
  if (!cloudinary) {
    return {
      secure_url: filePath,
      public_id: `mock-media-${Date.now()}`
    };
  }

  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto'
  });
};

module.exports = {
  cloudinary,
  isCloudinaryEnabled: Boolean(cloudinary),
  uploadFile
};
