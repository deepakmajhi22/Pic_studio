const nodemailer = require('nodemailer');

// Create email transporter
// NOTE: For production, use environment variables for email credentials
const createTransporter = () => {
    // For development: using Gmail
    // You'll need to set up App Password in your Gmail account
    // Go to: Google Account > Security > 2-Step Verification > App passwords

    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with your email
            pass: process.env.EMAIL_PASS || 'your-app-password'      // Replace with your app password
        }
    });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, req) => {
    const transporter = createTransporter();

    const resetUrl = `http://${req.headers.host}/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'PicStudio <your-email@gmail.com>',
        to: email,
        subject: 'Password Reset Request - PicStudio',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>You requested to reset your password for your PicStudio account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">PicStudio - Share Your Moments</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail
};
