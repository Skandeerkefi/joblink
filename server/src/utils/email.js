const RESEND_API_URL = 'https://api.resend.com/emails';

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const payload = {
    from,
    to: [email],
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

  // Development fallback: output email payload to logs when Resend is not configured.
  if (!apiKey) {
    console.log('Verification email payload:', JSON.stringify(payload));
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const error = new Error(`Resend send failed with status ${response.status}`);
    error.code = 'RESEND_SEND_FAILED';
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
};
