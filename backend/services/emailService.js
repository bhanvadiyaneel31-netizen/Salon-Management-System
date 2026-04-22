const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email notification to a customer
 * @param {Object} data - The email data
 * @param {string} data.to - Recipient email
 * @param {string} data.subject - Email subject
 * @param {string} data.customerName - Customer name
 * @param {string} data.serviceName - Service name
 * @param {string} data.status - Appointment status
 * @param {string} data.date - Appointment date
 * @param {string} data.time - Appointment time
 * @param {string} data.staffName - Staff name
 * @param {string} data.type - Event type (booked, confirmed, completed, cancelled)
 */
const sendAppointmentEmail = async (data) => {
  const { to, customerName, serviceName, status, date, time, staffName, type } = data;

  if (!to) {
    console.error('[EMAIL ERROR] Recipient email is missing');
    return;
  }

  // Header and Footer
  const header = `<h1>Bella Salon</h1>`;
  const footer = `<p>Thank you for choosing our service.</p>`;

  // Status mapping for better readability
  const s = status || "pending";
  const statusDisplay = s.charAt(0).toUpperCase() + s.slice(1);

  let body = '';
  let subject = `Appointment Update: ${serviceName} - ${statusDisplay}`;

  switch (type) {
    case 'booked':
      subject = `Appointment Booked: ${serviceName} at Bella Salon`;
      body = `
        <p>Hello ${customerName},</p>
        <p>Your appointment for <strong>${serviceName}</strong> has been successfully booked!</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Staff:</strong> ${staffName || 'To be assigned'}</li>
          <li><strong>Status:</strong> ${statusDisplay} (Pending Confirmation)</li>
        </ul>
        <p>We will notify you once our team confirms your slot.</p>
      `;
      break;

    case 'confirmed':
      subject = `Appointment Confirmed: ${serviceName} at Bella Salon`;
      body = `
        <p>Hello ${customerName},</p>
        <p><strong>Your appointment is now confirmed!</strong> We are looking forward to seeing you.</p>
        <p><strong>Final Schedule Details:</strong></p>
        <ul>
          <li><strong>Service:</strong> ${serviceName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Staff Assigned:</strong> ${staffName}</li>
        </ul>
        <p>Please arrive 5-10 minutes before your scheduled time.</p>
      `;
      break;

    case 'completed':
      subject = `Thank You for Visiting Bella Salon: ${serviceName}`;
      body = `
        <p>Hello ${customerName},</p>
        <p>Thank you for choosing Bella Salon! We hope you enjoyed your <strong>${serviceName}</strong> session today.</p>
        <p><strong>Service Summary:</strong></p>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Staff:</strong> ${staffName}</li>
        </ul>
        <p>Your feedback is very important to us. If you have a moment, please <strong>leave a review</strong> in your dashboard to help us improve!</p>
      `;
      break;

    case 'cancelled':
      subject = `Appointment Cancelled: ${serviceName} at Bella Salon`;
      body = `
        <p>Hello ${customerName},</p>
        <p>This email is to confirm that your appointment for <strong>${serviceName}</strong> has been cancelled.</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
        </ul>
        <p>We hope to see you again soon! If this was a mistake, feel free to book a new appointment on our website.</p>
      `;
      break;
    
    case 'reschedule':
      subject = `Appointment Rescheduled 🔄: ${serviceName} at Bella Salon`;
      body = `
        <p>Hello ${customerName},</p>
        <p>Your appointment for <strong>${serviceName}</strong> has been successfully rescheduled.</p>
        <p><strong>New Appointment Details:</strong></p>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Staff:</strong> ${staffName}</li>
          <li><strong>Service:</strong> ${serviceName}</li>
        </ul>
        <p>We look forward to seeing you at your new time!</p>
      `;
      break;
    
    default:
      body = `

        <p>Hello ${customerName},</p>
        <p>Your appointment for <strong>${serviceName}</strong> is now <strong>${statusDisplay}</strong>.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Date: ${date}</li>
          <li>Time: ${time}</li>
          <li>Staff: ${staffName || 'N/A'}</li>
        </ul>
      `;
  }

  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
      ${header}
      ${body}
      ${footer}
    </div>
  `;

  // If no credentials, log to console for testing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('--- MOCK EMAIL PREVIEW ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log('---------------------------');
    return;
  }

  // Sending email asynchronously
  transporter.sendMail({

    from: `"Bella Salon" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }).then(info => {
    console.log(`[EMAIL SENT] to ${to}: ${info.messageId}`);
  }).catch(error => {
    console.error(`[EMAIL FAILED] to ${to}:`, error);
  });
};

/**
 * Sends a password reset email with a secure link
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full reset URL with token
 * @param {string} userName - Recipient name (optional)
 */
const sendPasswordResetEmail = async (to, resetUrl, userName = 'there') => {
  if (!to) {
    console.error('[EMAIL ERROR] Recipient email is missing');
    return;
  }

  const subject = '🔐 Reset Your Password – Bella Salon';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f8f4ff;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(139,92,246,0.12);">
        
        <!-- Header Gradient -->
        <div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:48px 32px;text-align:center;">
          <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;line-height:64px;font-size:32px;margin-bottom:16px;">🔐</div>
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Password Reset</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Bella Salon – Security Center</p>
        </div>

        <!-- Body -->
        <div style="padding:40px 32px;">
          <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 28px;">
            We received a request to reset the password for your Bella Salon account. 
            Click the button below to create a new password. This link is valid for <strong>15 minutes</strong>.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" 
               style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(139,92,246,0.35);">
              Reset My Password →
            </a>
          </div>

          <!-- Fallback URL -->
          <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:24px 0;">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Or copy and paste this link into your browser:</p>
            <p style="color:#7c3aed;font-size:13px;word-break:break-all;margin:0;font-family:monospace;">${resetUrl}</p>
          </div>

          <!-- Security Notice -->
          <div style="border-left:4px solid #f59e0b;padding:12px 16px;background:#fffbeb;border-radius:0 8px 8px 0;margin:24px 0;">
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
              ⚠️ <strong>Didn't request this?</strong> You can safely ignore this email. 
              Your password will not change unless you click the link above. 
              If you're concerned, please contact our support team immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;">
          <p style="color:#9ca3af;font-size:13px;margin:0;">
            © ${new Date().getFullYear()} Bella Salon. This is an automated security email — please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // If no credentials configured, log to console for testing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('--- MOCK PASSWORD RESET EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('---------------------------------');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Bella Salon Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[PASSWORD RESET EMAIL SENT] to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`[PASSWORD RESET EMAIL FAILED] to ${to}:`, error);
    throw error; // Rethrow so the route can handle gracefully
  }
};

module.exports = { sendAppointmentEmail, sendPasswordResetEmail };
