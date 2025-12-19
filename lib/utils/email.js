import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Can be changed to other services
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification for a new SOS alert
 * @param {string} to - Recipient email
 * @param {object} sosInfo - SOS alert details
 */
export async function sendSOSEmail(to, sosInfo) {
  const { userName, location, phone, vehicleType } = sosInfo;

  const mailOptions = {
    from: `"Emergency SOS" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `🚨 EMERGENCY SOS: HELP REQUIRED for ${userName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff4d4d; border-radius: 10px;">
        <h2 style="color: #ff4d4d;">🚨 Emergency SOS Alert</h2>
        <p>A user needs immediate assistance on the road.</p>
        <hr />
        <p><strong>User:</strong> ${userName}</p>
        <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
        <p><strong>Vehicle:</strong> ${vehicleType}</p>
        <p><strong>Location:</strong> ${location}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Please log in to your dashboard to respond immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/garage/dashboard" style="background: #ff4d4d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Go to Dashboard</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`SOS Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send assignment notification to a specific garage
 */
export async function sendAssignmentEmail(to, garageName, sosInfo) {
  const { userName, location, phone } = sosInfo;

  const mailOptions = {
    from: `"Admin SOS" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `🛠️ EMERGENCY ASSIGNMENT: ${userName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #FFA500; border-radius: 10px;">
        <h2 style="color: #FFA500;">🛠️ Emergency SOS Assigned to You</h2>
        <p>Hello ${garageName}, the administrator has assigned an emergency SOS request to your garage.</p>
        <hr />
        <p><strong>User:</strong> ${userName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Location:</strong> ${location}</p>
        <hr />
        <p>Please contact the user and head to their location immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/garage/dashboard" style="background: #FFA500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View SOS Details</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Assignment Email error:", error);
    return { success: false };
  }
}
