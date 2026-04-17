const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const net = require('net');

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
};

const parseNumber = (value, fallback) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return fallback;
  const parsed = Number.parseInt(normalized, 10);
  // SMTP ports/timeouts should be configured as positive integers.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createTransporter = ({ host, tls } = {}) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: host || process.env.SMTP_HOST,
      port: parseNumber(process.env.SMTP_PORT, 587),
      secure: parseBoolean(process.env.SMTP_SECURE, false),
      connectionTimeout: parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 15000),
      greetingTimeout: parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10000),
      socketTimeout: parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000),
      ...(tls ? { tls } : {}),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback: output email payload to logs when SMTP is not configured.
  return nodemailer.createTransport({ jsonTransport: true });
};

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || 'no-reply@joblink.local';
  const mailOptions = {
    from,
    to: email,
    subject: 'Verify your JobLink account',
    text: `Hi ${name || 'there'},\n\nPlease verify your account by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome to JobLink 👋</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Please verify your account by clicking the button below:</p>
        <p>
          <a href="${verificationUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Verify Email
          </a>
        </p>
        <p>Or open this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  };

  let info;
  try {
    info = await transporter.sendMail(mailOptions);
  } catch (error) {
    const smtpHost = process.env.SMTP_HOST;
    const canRetryWithIpv4 =
      smtpHost &&
      !net.isIP(smtpHost) &&
      String(error?.code || '').toUpperCase() === 'ESOCKET' &&
      String(error?.message || '').includes('ENETUNREACH');

    if (!canRetryWithIpv4) {
      throw error;
    }

    try {
      const ipv4Addresses = await dns.resolve4(smtpHost);
      if (!ipv4Addresses.length) {
        throw error;
      }

      const fallbackTransporter = createTransporter({
        host: ipv4Addresses[0],
        tls: { servername: smtpHost },
      });
      info = await fallbackTransporter.sendMail(mailOptions);
    } catch {
      throw error;
    }
  }

  if (!process.env.SMTP_HOST) {
    console.log('Verification email payload:', info.message);
  }
};

module.exports = {
  sendVerificationEmail,
};
