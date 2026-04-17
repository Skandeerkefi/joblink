const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  try {
    const result = await resend.emails.send({
      from: "JobLink <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your JobLink account",
      text: `Please verify your account:\n${verificationUrl}`,
      html: `
        <div>
          <h2>Welcome to JobLink 👋</h2>
          <p>Hi ${name || "there"},</p>
          <a href="${verificationUrl}">Verify Email</a>
        </div>
      `,
    });

    console.log("✅ RESEND SUCCESS RESPONSE:", result);

    if (result.error) {
      console.log("❌ RESEND ERROR:", result.error);
      throw new Error(result.error.message);
    }

    return result;
  } catch (err) {
    console.error("❌ Resend send failed:", err);
    throw err;
  }
};

module.exports = { sendVerificationEmail };
