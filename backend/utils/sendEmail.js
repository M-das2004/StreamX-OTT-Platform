const nodemailer = require("nodemailer");

let transporter = null;
let cachedConfigured = null;

function getTransporter() {
  if (cachedConfigured !== null) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    cachedConfigured = false;
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  cachedConfigured = true;

  return transporter;
}

// Sends a real email if SMTP is configured; otherwise logs it to the
// console so password reset (and anything else that emails later) is still
// fully testable without a mail server. Fill in SMTP_HOST/PORT/USER/PASS in
// .env (a free Mailtrap sandbox, a Gmail app password, SendGrid, etc.) to
// start sending real emails — no code changes needed.
async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();

  if (!t) {
    console.log("\n===== EMAIL (SMTP not configured — logging instead of sending) =====");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("======================================================================\n");
    return;
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || "StreamX <no-reply@streamx.app>",
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;
