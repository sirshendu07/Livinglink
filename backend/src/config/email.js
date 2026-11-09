const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  const isConfigured = Boolean(env.EMAIL_USER && env.EMAIL_APP_PASSWORD && env.EMAIL_APP_PASSWORD !== 'dummy_app_password');

  if (isConfigured) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD
      }
    });

    transporter.verify((err) => {
      if (err) {
        logger.warn({ err: err.message }, 'SMTP connection verification failed. Email will operate in logging mode.');
      } else {
        logger.info('SMTP Transporter ready for Gmail delivery');
      }
    });
  } else {
    logger.info('Live Gmail SMTP not configured. Utilizing simulated email delivery (logged to console)');
    transporter = {
      sendMail: async (options) => {
        logger.info(
          {
            to: options.to,
            subject: options.subject,
            preview: options.text || '[HTML email content]'
          },
          'Simulated Email Dispatched'
        );
        return { messageId: `mock-${Date.now()}` };
      }
    };
  }

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const mailClient = createTransporter();
  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
  };

  try {
    return await mailClient.sendMail(mailOptions);
  } catch (error) {
    logger.error({ error: error.message, to, subject }, 'Failed to send email');
    throw error;
  }
};

module.exports = {
  createTransporter,
  sendMail
};
