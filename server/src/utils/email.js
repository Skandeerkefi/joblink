const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  try {
    await resend.emails.send({
      from: "JobLink <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your JobLink account",
      text: `Please verify your account by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Welcome to JobLink 👋</h2>
          <p>Hi ${name || "there"},</p>
          <p>Please verify your account by clicking the button below:</p>

          <p>
            <a href="${verificationUrl}" 
              style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
              Verify Email
            </a>
          </p>

          <p>Or open this link in your browser:</p>
          <p>${verificationUrl}</p>

          <p>This link expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    throw err;
  }
};

module.exports = { sendVerificationEmail };
