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
 * Send mechanic SOS email to garage owner
 * @param {Object} params
 * @param {string} params.to - Garage owner email
 * @param {string} params.mechanicName - Name of mechanic in danger
 * @param {Object} params.location - Location object with lat/lng
 * @param {string} params.garageOwnerName - Name of garage owner
 * @param {string} params.mechanicPhone - Mechanic's phone number
 */
export async function sendMechanicSOSEmail({
  to,
  mechanicName,
  location,
  garageOwnerName,
  mechanicPhone,
}) {
  const googleMapsLink = `https://www.google.com/maps?q=${location?.lat},${location?.lng}`;

  const mailOptions = {
    from: `"Emergency SOS Alert" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `🚨 URGENT: ${mechanicName} Needs Emergency Help!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff4d4d; font-size: 32px; margin: 0;">🚨 EMERGENCY SOS</h1>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">Immediate Action Required</p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ff4d4d; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Your mechanic has triggered an emergency SOS alert!</p>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Alert Details</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="padding: 12px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-weight: bold; width: 40%;">👤 Mechanic:</td>
                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${mechanicName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-weight: bold;">📞 Phone:</td>
                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                  <a href="tel:${mechanicPhone}" style="color: #667eea; text-decoration: none; font-weight: bold;">${
      mechanicPhone || "Not available"
    }</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-weight: bold;">📍 Location:</td>
                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                  Lat: ${location?.lat || "Unknown"}, Lng: ${
      location?.lng || "Unknown"
    }
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f8f9fa; font-weight: bold;">⏰ Time:</td>
                <td style="padding: 12px;">${new Date().toLocaleString(
                  "en-US",
                  { timeZone: "Asia/Dhaka" }
                )}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${googleMapsLink}" target="_blank" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
              📍 View on Google Maps
            </a>
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL
            }/garage/dashboard/team" style="display: inline-block; background: #ff4d4d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
              🏢 Go to Dashboard
            </a>
          </div>

          <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>💡 Next Steps:</strong><br/>
              1. Contact ${mechanicName} immediately<br/>
              2. Check their exact location on the map<br/>
              3. Send assistance if needed<br/>
              4. Update the status in your dashboard
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 25px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
            This is an automated emergency alert from your On-Road Vehicle Breakdown system.<br/>
            Please respond as soon as possible.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Mechanic SOS email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send mechanic SOS email:", error);
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
// ... existing exports ...

/**
 * Send Welcome Email with Quick Win (Psychology: Reciprocity)
 */
export async function sendWelcomeEmail(to, userName) {
  const mailOptions = {
    from: `"Welcome Team" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Welcome to the Family! Your Safety Net is Ready 🛡️`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #4CAF50; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Welcome Aboard, ${userName}!</h2>
        <p>You've just taken the first step towards worry-free driving. We're honored to protect you.</p>
        <p><strong>Your Goal:</strong> Request help in just 1 click.</p>
        <hr />
        <h3>🚀 Quick Start Guide:</h3>
        <ol>
            <li>Save our emergency number.</li>
            <li>Complete your vehicle profile.</li>
            <li>Sleep soundly knowing we have your back.</li>
        </ol>
        <p><em>P.S. Upgrade to Standard for nationwide coverage and priority dispatch.</em></p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Upgrades</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Welcome Email error:", error);
    return { success: false };
  }
}

/**
 * Send Quota Warning Email (Psychology: Scarcity/Loss Aversion)
 */
export async function sendQuotaWarningEmail(to, userName, remaining) {
  const mailOptions = {
    from: `"Account Alert" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `⚠️ Alert: You have ${remaining} service request left`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #FF9800; border-radius: 10px;">
        <h2 style="color: #FF9800;">Usage Alert</h2>
        <p>Hi ${userName},</p>
        <p>You have used <strong>50% of your Free Plan quota</strong>. You only have <strong>${remaining}</strong> rescue left this month.</p>
        <div style="background: #FFF3E0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin:0; font-weight:bold; color: #E65100;">Don't get stranded without coverage!</p>
        </div>
        <p>Upgrade to <strong>Standard</strong> for UNLIMITED rescues and peace of mind.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Upgrade for Unlimited</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Quota Email error:", error);
    return { success: false };
  }
}

/**
 * Send Upgrade Offer Email (Psychology: Social Proof + Discount)
 */
export async function sendUpgradeOfferEmail(to, userName) {
  const mailOptions = {
    from: `"Special Offer" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `🔥 Exclusive: Join 8,500+ Happy Drivers (25% OFF)`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #2196F3; border-radius: 10px;">
        <h2 style="color: #2196F3;">Unlock Nationwide Safety</h2>
        <p>Hi ${userName},</p>
        <p><strong>"I saved 3 hours and ৳2000 on my first tow!"</strong> - <em>Rahim, Standard User</em></p>
        <hr />
        <p>Join the <strong>Standard Plan</strong> today and get:</p>
        <ul>
            <li>✅ Nationwide Coverage</li>
            <li>✅ Priority Dispatch (2x Faster)</li>
            <li>✅ Unlimited Rescues</li>
        </ul>
        <p><strong>Special Offer:</strong> Save 25% when you switch to Annual.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Claim 25% OFF</a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Upgrade Offer Email error:", error);
    return { success: false };
  }
}

/**
 * Send Support Ticket Email (Priority Handling)
 */
export async function sendSupportTicketEmail({
  user,
  subject,
  message,
  planTier,
}) {
  // Determine Priority Tag based on Plan
  let priorityTag = "[Standard]";
  let priorityColor = "#607d8b"; // Grey

  if (["premium", "enterprise"].includes(planTier)) {
    priorityTag = "[VIP PRIORITY 🚀]";
    priorityColor = "#FFd700"; // Gold
  } else if (planTier === "standard") {
    priorityTag = "[Standard Priority]";
    priorityColor = "#4CAF50"; // Green
  }

  const mailOptions = {
    from: `"${user.name}" <${user.email}>`, // Sent "on behalf of" user (or uses system email with reply-to)
    replyTo: user.email,
    to: process.env.EMAIL_USER, // Admin receives this
    subject: `${priorityTag} Support Request: ${subject}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid ${priorityColor}; border-radius: 10px;">
        <h2 style="color: ${priorityColor};">${priorityTag} Support Ticket</h2>
        <p><strong>From:</strong> ${user.name} (${user.email})</p>
        <p><strong>Plan Tier:</strong> <span style="background:${priorityColor}; color:white; padding:2px 6px; border-radius:4px; text-transform:uppercase;">${planTier}</span></p>
        <hr />
        <h3>Subject: ${subject}</h3>
        <p style="background:#f9f9f9; padding:15px; border-radius:5px;">${message}</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Reply directly to this email to respond to the user.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Support Ticket Email error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send Contract Email to User
 */
export async function sendContractEmail({
  userEmail,
  userName,
  contractNumber,
  amount,
  currency,
  startDate,
  endDate,
  contractId,
}) {
  const mailOptions = {
    from: `"Enterprise Contracts" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `📄 Your Enterprise Contract is Ready - ${contractNumber}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #2196F3; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h2 style="color: white;">🎉 Welcome to Enterprise!</h2>
        <p>Dear ${userName},</p>
        <p>Your custom Enterprise contract has been prepared and is ready for your review.</p>
        <hr style="border-color: rgba(255,255,255,0.3);" />
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Contract Number:</strong> ${contractNumber}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${new Date(
            startDate
          ).toLocaleDateString()} - ${new Date(
      endDate
    ).toLocaleDateString()}</p>
        </div>

        <h3>📋 Next Steps:</h3>
        <ol style="line-height: 1.8;">
          <li>Review your contract in the dashboard</li>
          <li>Download the PDF for your records</li>
          <li>Sign digitally to activate your services</li>
        </ol>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard/contracts" 
           style="background: #FF5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold;">
          View Contract
        </a>

        <hr style="border-color: rgba(255,255,255,0.3); margin-top: 20px;" />
        <p style="font-size: 12px; opacity: 0.8;">
          Questions? Contact your dedicated account manager or reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Contract email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Contract Email error:", error);
    return { success: false, error: error.message };
  }
}
/**
 * Send Team Invitation Email
 */
export async function sendInvitationEmail(to, token, orgName) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;

  const mailOptions = {
    from: `"Team Invitation" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `You've been invited to join ${orgName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #2196F3; border-radius: 10px;">
        <h2 style="color: #2196F3;">Team Invitation</h2>
        <p>You have been invited to join <strong>${orgName}</strong> on On-Road Vehicle Breakdown.</p>
        <hr />
        <p>Click the button below to accept the invitation and join the team:</p>
        <a href="${inviteLink}" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Accept Invitation</a>
        <p style="font-size: 12px; color: #666;">Or copy this link: <br/>${inviteLink}</p>
        <p>This invitation will expire in 7 days.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Invitation Email error:", error);
    return { success: false, error: error.message };
  }
}
