const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail transporter. Requires EMAIL_USER (full Gmail address) and
// EMAIL_PASS (a Gmail "App Password", not your normal password).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"STRAY Love Ph Foundation" <${process.env.EMAIL_USER}>`;

const sendVerificationEmail = async (email, otp) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your STRAY Love Ph verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
  return true;
};

const sendApprovalEmail = async (email, fullName) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your account has been approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome, ${fullName}!</h2>
        <p>Your account has been approved. You can now log in and start using STRAY Love Ph Foundation.</p>
      </div>
    `,
  });
  return true;
};

const sendRejectionEmail = async (email, fullName, notes) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Account verification update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Hello, ${fullName}</h2>
        <p>Unfortunately, your account could not be verified at this time.</p>
        ${notes ? `<p><strong>Notes from our team:</strong> ${notes}</p>` : ''}
      </div>
    `,
  });
  return true;
};

module.exports = { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail };
