const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration - will be properly configured for production
// For now, we'll log emails to console for testing

const sendVerificationEmail = async (email, otp) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 VERIFICATION EMAIL (TEST MODE)`);
  console.log(`To: ${email}`);
  console.log(`Your verification code is: ${otp}`);
  console.log(`This code expires in 10 minutes.`);
  console.log(`${'='.repeat(60)}\n`);
  return true;
};

const sendApprovalEmail = async (email, fullName) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ APPROVAL NOTIFICATION (TEST MODE)`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your Account Has Been Approved!`);
  console.log(`Message: Dear ${fullName}, your account has been approved!`);
  console.log(`You can now login at: http://localhost:3000/login`);
  console.log(`${'='.repeat(60)}\n`);
  return true;
};

const sendRejectionEmail = async (email, fullName, notes) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`❌ REJECTION NOTIFICATION (TEST MODE)`);
  console.log(`To: ${email}`);
  console.log(`Subject: Account Update`);
  console.log(`Message: Dear ${fullName}, your account could not be verified.`);
  if (notes) console.log(`Admin notes: ${notes}`);
  console.log(`${'='.repeat(60)}\n`);
  return true;
};

module.exports = { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail };
