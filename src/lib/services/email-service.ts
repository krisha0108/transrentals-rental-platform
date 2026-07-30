import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Read the brand logo once at module load. Using the full colour wordmark
// (green "Trans" + dark "Rentals" + arrow) on a white plate inside the
// gradient header — keeps the brand recognisable on first glance.
// Falls back to null (template hides the <img>) if the file is missing.
const LOGO_PATH = path.join(process.cwd(), 'public', 'assets', 'logo-trans.png');
let LOGO_BUFFER: Buffer | null = null;
try {
  LOGO_BUFFER = fs.readFileSync(LOGO_PATH);
} catch {
  console.warn('[email] logo-white.png not found at', LOGO_PATH, '— OTP emails will render without logo');
}
const LOGO_CID = 'transrentals-logo';

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
const getOTPEmailTemplate = (otp: string, type: 'registration' | 'password-reset', to?: string) => {
  const subject = type === 'registration'
    ? 'Verify your email · TransRentals'
    : 'Your TransRentals password reset code';

  const preheader = type === 'registration'
    ? `Your verification code is ${otp}. Valid for 10 minutes.`
    : `Your password reset code is ${otp}. Valid for 10 minutes.`;

  const heading = type === 'registration'
    ? 'Verify your email address'
    : 'Reset your TransRentals password';

  const message = type === 'registration'
    ? 'Welcome to TransRentals! Use the verification code below to confirm this email address and finish setting up your account.'
    : 'We received a request to reset the password for your TransRentals account. Use the verification code below to proceed.';

  const securityNote = type === 'registration'
    ? 'TransRentals will never ask you to share this code over phone, WhatsApp, or chat. If someone is asking you for it, they are not from our team.'
    : 'TransRentals will never ask you to share this code over phone, WhatsApp, or chat. If you did not request a password reset, you can safely ignore this email — your account stays secure.';

  // Plain-text fallback — improves deliverability (spam filters favour
  // multipart emails) and renders correctly when an email client blocks HTML.
  const text = `TransRentals — ${heading}

${message}

Your code: ${otp}
This code expires in 10 minutes and can only be used once.

${securityNote}

Need help? Reply to this email or write to support@transrentals.in.

— Team TransRentals
${new Date().getFullYear()} TransRentals · India's Vehicle Rental Marketplace
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;color:#0f172a;">
  <!-- Preheader (hidden, shown in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,43,26,0.08);">

          <!-- Brand header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#022B1A 0%,#045030 50%,#09B368 100%);padding:32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    ${LOGO_BUFFER ? `
                    <!-- Logo plate — white panel so the full-colour wordmark
                         (green/dark/arrow) renders crisply on the dark
                         gradient. Inline CSS width is required because
                         Gmail ignores the HTML width attribute and would
                         otherwise render the image at its native size and
                         crop it inside the plate. -->
                    <div style="display:inline-block;background:#ffffff;padding:12px 22px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.18);vertical-align:middle;line-height:0;">
                      <img src="cid:${LOGO_CID}" alt="TransRentals" width="210" height="40" style="display:block;width:210px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
                    </div>
                    <div style="margin-top:14px;color:rgba(255,255,255,0.85);font-size:12px;font-weight:500;letter-spacing:0.6px;text-transform:uppercase;">India's Vehicle Rental Marketplace</div>
                    ` : `
                    <span style="display:inline-block;vertical-align:middle;">
                      <span style="display:block;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">TransRentals</span>
                      <span style="display:block;color:rgba(255,255,255,0.78);font-size:12px;font-weight:500;letter-spacing:0.4px;text-transform:uppercase;margin-top:4px;">Vehicle Rental Marketplace</span>
                    </span>
                    `}
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;border-radius:999px;letter-spacing:0.3px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.22);white-space:nowrap;">TransRentals Support</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 12px;color:#022B1A;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${heading}</h1>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.65;">
                Hello,<br>${message}
              </p>

              <!-- OTP box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:28px 20px;">
                    <div style="color:#047857;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Your verification code</div>
                    <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:38px;font-weight:700;letter-spacing:10px;color:#022B1A;line-height:1;">${otp}</div>
                    <div style="color:#475569;font-size:13px;margin-top:14px;">
                      Expires in <strong style="color:#022B1A;">10 minutes</strong> · One-time use
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;">
                    <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
                      <strong>Keep this code private.</strong> ${securityNote}
                    </p>
                  </td>
                </tr>
              </table>

              ${to ? `
              <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                This message was sent to <span style="color:#334155;font-weight:600;">${to}</span> because someone${type === 'registration' ? ' tried to register' : ' requested a password reset'} on TransRentals. If that wasn't you, you can ignore this email.
              </p>` : ''}
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:24px;color:#64748b;font-size:13px;line-height:1.6;">
                Need help? Write to us at <a href="mailto:support@transrentals.in" style="color:#045030;font-weight:600;text-decoration:none;">support@transrentals.in</a>
                or visit <a href="https://transrentals.in" style="color:#045030;font-weight:600;text-decoration:none;">transrentals.in</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:22px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px;color:#0f172a;font-size:12px;font-weight:600;">TransRentals</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                India's Vehicle Rental Marketplace · Bike, Car, Bus, Truck & more<br>
                &copy; ${new Date().getFullYear()} TransRentals. All rights reserved.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0;color:#94a3b8;font-size:11px;line-height:1.5;max-width:560px;">
          This is an automated security message from TransRentals. Please do not reply if you received this in error — contact <a href="mailto:support@transrentals.in" style="color:#64748b;">support@transrentals.in</a> instead.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
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

    const { subject, html, text } = getOTPEmailTemplate(otp, type, to);

    const mailOptions: nodemailer.SendMailOptions = {
      // "TransRentals Support" matches the in-email pill — keeps the brand
      // voice consistent and reassures the recipient the message is from
      // the official support team rather than an automated security bot.
      from: `"TransRentals Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      headers: {
        // Helps email clients categorise this as transactional, not marketing.
        'X-Entity-Ref-ID': `otp-${type}-${Date.now()}`,
      },
      // Inline-attach the logo so it renders without the user having to click
      // "Show images" — Gmail/Outlook block external images by default.
      ...(LOGO_BUFFER ? {
        attachments: [{
          filename: 'transrentals-logo.png',
          content: LOGO_BUFFER,
          cid: LOGO_CID,
          contentDisposition: 'inline',
        }],
      } : {}),
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

// Contact-form reply email — sent when a manager/admin writes a resolution
// note against a `contact_inquiries` row. This is the only outbound signal
// that closes the loop for an anonymous (not-logged-in) form submitter.
const getContactInquiryReplyTemplate = (params: {
  name: string;
  subject: string;
  resolution: string;
  referenceNumber: string;
}) => {
  const { name, subject, resolution, referenceNumber } = params;
  const emailSubject = `Re: ${subject} · TransRentals Support`;
  const preheader = resolution.length > 120 ? `${resolution.slice(0, 117)}...` : resolution;

  const text = `TransRentals Support — Reply to your message

Hi ${name},

You reached out to us about "${subject}" (Reference: ${referenceNumber}). Here's our reply:

${resolution}

Need to follow up? Reply to this email or write to support@transrentals.in.

— Team TransRentals
${new Date().getFullYear()} TransRentals · India's Vehicle Rental Marketplace
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${emailSubject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,43,26,0.08);">

          <!-- Brand header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#022B1A 0%,#045030 50%,#09B368 100%);padding:32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    ${LOGO_BUFFER ? `
                    <div style="display:inline-block;background:#ffffff;padding:12px 22px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.18);vertical-align:middle;line-height:0;">
                      <img src="cid:${LOGO_CID}" alt="TransRentals" width="210" height="40" style="display:block;width:210px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
                    </div>
                    <div style="margin-top:14px;color:rgba(255,255,255,0.85);font-size:12px;font-weight:500;letter-spacing:0.6px;text-transform:uppercase;">India's Vehicle Rental Marketplace</div>
                    ` : `
                    <span style="display:inline-block;vertical-align:middle;">
                      <span style="display:block;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;line-height:1.2;">TransRentals</span>
                      <span style="display:block;color:rgba(255,255,255,0.78);font-size:12px;font-weight:500;letter-spacing:0.4px;text-transform:uppercase;margin-top:4px;">Vehicle Rental Marketplace</span>
                    </span>
                    `}
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:600;padding:6px 12px;border-radius:999px;letter-spacing:0.3px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.22);white-space:nowrap;">TransRentals Support</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 12px;color:#022B1A;font-size:22px;font-weight:700;letter-spacing:-0.3px;">We've replied to your message</h1>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.65;">
                Hi ${name},<br>You reached out to us about <strong style="color:#022B1A;">${subject}</strong>. Here's our reply:
              </p>

              <!-- Reply box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:22px 24px;">
                    <div style="color:#047857;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Our Reply</div>
                    <div style="color:#022B1A;font-size:15px;line-height:1.65;white-space:pre-wrap;">${resolution}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Reference: <span style="color:#334155;font-weight:600;">${referenceNumber}</span>
              </p>
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:24px;color:#64748b;font-size:13px;line-height:1.6;">
                Need to follow up? Reply to this email, or write to us at <a href="mailto:support@transrentals.in" style="color:#045030;font-weight:600;text-decoration:none;">support@transrentals.in</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:22px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px;color:#0f172a;font-size:12px;font-weight:600;">TransRentals</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                India's Vehicle Rental Marketplace · Bike, Car, Bus, Truck & more<br>
                &copy; ${new Date().getFullYear()} TransRentals. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: emailSubject, html, text };
};

export async function sendContactInquiryReplyEmail(params: {
  to: string;
  name: string;
  subject: string;
  resolution: string;
  referenceNumber: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP credentials not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const { to, ...templateParams } = params;
    const { subject, html, text } = getContactInquiryReplyTemplate(templateParams);

    await transporter.sendMail({
      from: `"TransRentals Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `contact-reply-${params.referenceNumber}-${Date.now()}`,
      },
      ...(LOGO_BUFFER ? {
        attachments: [{
          filename: 'transrentals-logo.png',
          content: LOGO_BUFFER,
          cid: LOGO_CID,
          contentDisposition: 'inline',
        }],
      } : {}),
    });

    console.log(`Contact inquiry reply email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact inquiry reply email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
