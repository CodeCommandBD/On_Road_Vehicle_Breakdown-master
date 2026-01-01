/**
 * Send Password Reset Email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name
 * @returns {Promise<Object>} Success status
 */
export async function sendPasswordResetEmail(
  to,
  resetToken,
  userName = "User"
) {
  const resetUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/en/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Quick Service Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Password Reset Request - Quick Service",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px;">
        <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #ff4800 0%, #ff6a3d 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
              🔐
            </div>
            <h1 style="color: #333; font-size: 28px; margin: 0;">Password Reset Request</h1>
            <p style="color: #666; font-size: 14px; margin: 10px 0;">We received a request to reset your password</p>
          </div>

          <!-- Greeting -->
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #666; font-size: 15px; line-height: 1.6;">
            Someone requested a password reset for your Quick Service account. If this was you, click the button below to reset your password:
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff4800 0%, #ff6a3d 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 72, 0, 0.3);">
              Reset Password
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: bold;">Or copy and paste this link:</p>
            <p style="margin: 0; color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          </div>

          <!-- Warning Box -->
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 5px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Important Security Information:</strong>
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404; font-size: 13px;">
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>

          <!-- Help Section -->
          <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>Need help?</strong> If you have any questions or didn't request this password reset, please contact our support team immediately.
            </p>
          </div>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
            Best regards,<br/>
            <strong>Quick Service Security Team</strong><br/><br/>
            © ${new Date().getFullYear()} Quick Service. All rights reserved.<br/>
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    `,
    text: `
      Hello ${userName},
      
      We received a request to reset your password for your Quick Service account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email. Your password won't change until you create a new one.
      
      Best regards,
      Quick Service Security Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}
