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
  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

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

    from: `"Salon Name" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }).then(info => {
    console.log(`[EMAIL SENT] to ${to}: ${info.messageId}`);
  }).catch(error => {
    console.error(`[EMAIL FAILED] to ${to}:`, error);
  });
};

module.exports = { sendAppointmentEmail };
