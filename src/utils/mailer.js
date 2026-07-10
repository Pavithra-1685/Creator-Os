const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn(`[MAILER MOCK] Email to ${to} with subject "${subject}" was skipped (SMTP not configured).`);
    logger.info(`[MAILER MOCK] Body: ${text || html}`);
    return { messageId: 'mock-id' };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    // Return mock ID instead of crashing so that registration / password resets still work in dev
    return { messageId: 'mock-id-failed' };
  }
};

module.exports = { sendMail };
