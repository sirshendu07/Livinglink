const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  const emailUser = env.EMAIL_USER || process.env.EMAIL_USER || 'sirshendu1037@gmail.com';
  const emailPass = (env.EMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASSWORD || 'ozfiwodcmntlihez').replace(/\s+/g, '');

  const isConfigured = Boolean(emailUser && emailPass && emailPass !== 'dummy_app_password');

  if (isConfigured) {
    const isGmail = (env.EMAIL_HOST && env.EMAIL_HOST.includes('gmail')) || emailUser.includes('@gmail.com');

    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      : {
          host: env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(env.EMAIL_PORT, 10) || 587,
          secure: env.EMAIL_SECURE === true || env.EMAIL_PORT === 465,
          auth: {
            user: emailUser,
            pass: emailPass
          },
          tls: {
            rejectUnauthorized: false
          }
        };

    transporter = nodemailer.createTransport(transportOptions);

    transporter.verify((err) => {
      if (err) {
        logger.warn({ err: err.message }, 'SMTP connection verification warning. Will retry on send.');
      } else {
        logger.info('SMTP Transporter verified and ready for Gmail delivery');
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
  const fromAddress = env.EMAIL_FROM || `"LivingLink Society" <${env.EMAIL_USER || 'sirshendu1037@gmail.com'}>`;

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
  };

  try {
    const info = await mailClient.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to, subject }, 'Email sent successfully via Gmail SMTP');
    return info;
  } catch (error) {
    logger.error({ error: error.message, to, subject }, 'Failed to send email via SMTP');
    throw error;
  }
};

module.exports = {
  createTransporter,
  sendMail
};
