import nodemailer from 'nodemailer';

// SMTP Configuration
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  requireTLS: smtpPort === 587, // force STARTTLS for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs in dev
  },
});

// Email templates
const getOTPEmailTemplate = (otp: string, type: 'registration' | 'password-reset') => {
  const subject = type === 'registration'
    ? 'Verify Your Email - TransRentals'
    : 'Password Reset OTP - TransRentals';

  const heading = type === 'registration'
    ? 'Verify Your Email Address'
    : 'Reset Your Password';

  const message = type === 'registration'
    ? 'Thank you for registering with TransRentals. Please use the following OTP to verify your email address:'
    : 'We received a request to reset your password. Please use the following OTP to proceed:';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 40px; background-color: #1e40af; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">TransRentals</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1e40af; font-size: 22px;">${heading}</h2>
                  <p style="margin: 0 0 25px; color: #555555; font-size: 16px; line-height: 1.6;">
                    ${message}
                  </p>

                  <!-- OTP Box -->
                  <div style="background-color: #f0f7ff; border: 2px dashed #1e40af; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e40af;">${otp}</span>
                  </div>

                  <p style="margin: 25px 0 0; color: #888888; font-size: 14px;">
                    This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
                  </p>

                  <p style="margin: 20px 0 0; color: #888888; font-size: 14px;">
                    If you didn't request this, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 25px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; color: #888888; font-size: 12px; text-align: center;">
                    &copy; ${new Date().getFullYear()} TransRentals. All rights reserved.<br>
                    India's Largest Vehicle Rental Marketplace
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, html };
};

// Send OTP Email
export async function sendOTPEmail(
  to: string,
  otp: string,
  type: 'registration' | 'password-reset' = 'password-reset'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP credentials not configured');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('📧 SMTP Debug - User:', process.env.SMTP_USER);
    console.log('📧 SMTP Debug - Password length:', process.env.SMTP_PASSWORD?.length);
    console.log('📧 SMTP Debug - Host:', process.env.SMTP_HOST, 'Port:', process.env.SMTP_PORT);

    const { subject, html } = getOTPEmailTemplate(otp, type);

    const mailOptions = {
      from: `"TransRentals" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

// Send wander tour booking confirmation email
export async function sendWanderBookingEmail(params: {
  to: string;
  customerName: string;
  tourTitle: string;
  bookingNumber: string;
  travelDate: string;
  groupSize: number;
  amount: number;
  vendorName: string;
  status: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, customerName, tourTitle, bookingNumber, travelDate, groupSize, amount, vendorName, status } = params;

  const statusLabel = status === 'CONFIRMED' ? 'Confirmed' : status === 'PAYMENT_PENDING' ? 'Payment Pending' : status;
  const statusColor = status === 'CONFIRMED' ? '#059669' : '#d97706';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f4f4;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr><td align="center" style="padding:40px 0;">
          <table role="presentation" style="width:600px;border-collapse:collapse;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <tr><td style="padding:30px 40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#fff;font-size:22px;">🗺️ TransRentals Wander</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Tour Booking ${statusLabel}</p>
            </td></tr>
            <tr><td style="padding:30px 40px;">
              <p style="color:#374151;font-size:16px;margin:0 0 20px;">Hi <strong>${customerName}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                ${status === 'CONFIRMED'
                  ? 'Your tour booking has been confirmed! Here are your booking details:'
                  : 'Your quote has been accepted. Please complete the advance payment to confirm your booking.'}
              </p>
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Booking #</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;text-align:right;">${bookingNumber}</td></tr>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Tour</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;text-align:right;">${tourTitle}</td></tr>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Travel Date</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;text-align:right;">${travelDate}</td></tr>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Group Size</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;text-align:right;">${groupSize} person${groupSize !== 1 ? 's' : ''}</td></tr>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Amount</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#4f46e5;font-size:15px;font-weight:700;text-align:right;">₹${amount.toLocaleString('en-IN')}</td></tr>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Operator</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;text-align:right;">${vendorName}</td></tr>
                <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Status</td>
                    <td style="padding:12px 16px;text-align:right;"><span style="background:${statusColor}15;color:${statusColor};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${statusLabel}</span></td></tr>
              </table>
              <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center;">
                For any queries, contact us at <a href="mailto:book@transrentals.in" style="color:#4f46e5;">book@transrentals.in</a>
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"TransRentals Wander" <${process.env.SMTP_USER}>`,
      to,
      subject: `Tour Booking ${statusLabel} — ${bookingNumber}`,
      html,
    });
    console.log(`Wander booking email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send wander booking email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// Verify SMTP connection
export async function verifyEmailService(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}
