require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("TEST_MAIL_ERROR:", error);
  } else {
    console.log("TEST_MAIL_SUCCESS: Server is ready to take our messages");
  }
});
