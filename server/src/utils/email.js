const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
};

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || 'no-reply@joblink.local';

  const info = await transporter.sendMail({
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
  });

  if (!process.env.SMTP_HOST) {
    console.log('Verification email payload:', info.message);
  }
};

module.exports = {
  sendVerificationEmail,
};
