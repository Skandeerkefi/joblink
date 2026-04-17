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

const isNetworkUnreachableError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const errno = String(error?.errno || '').toUpperCase();
  const message = String(error?.message || '').toUpperCase();
  return code === 'ENETUNREACH' || errno === 'ENETUNREACH' || message.includes('ENETUNREACH');
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
      isNetworkUnreachableError(error);

    if (!canRetryWithIpv4) {
      throw error;
    }

    const ipv4Addresses = await dns.resolve4(smtpHost).catch((retryResolveError) => {
      console.warn(`SMTP IPv4 resolution failed for ${smtpHost}:`, retryResolveError.message || retryResolveError);
      return null;
    });
    if (!Array.isArray(ipv4Addresses) || !ipv4Addresses.length) {
      throw error;
    }

    let retryFailure;
    for (const ipv4Address of ipv4Addresses) {
      try {
        const fallbackTransporter = createTransporter({
          host: ipv4Address,
          tls: { servername: smtpHost },
        });
        info = await fallbackTransporter.sendMail(mailOptions);
        retryFailure = null;
        break;
      } catch (retryError) {
        retryFailure = retryError;
      }
    }

    if (retryFailure) {
      console.warn(
        `SMTP IPv4 retry failed for ${smtpHost} after ${ipv4Addresses.length} attempt(s):`,
        retryFailure.message || retryFailure
      );
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
