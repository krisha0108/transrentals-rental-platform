// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, RATE_LIMITS, createOTP, verifyOTP, logger } from '@/lib/security';
import { sendOTPEmail } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { limited, resetIn } = checkRateLimit(request, RATE_LIMITS.passwordReset, 'vendor-password-reset');
  if (limited) {
    return NextResponse.json(
      { status: false, message: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send-otp':
        return await handleSendOtp(body);
      case 'verify-otp':
        return await handleVerifyOtp(body);
      case 'reset-password':
        return await handleResetPassword(body);
      default:
        return NextResponse.json({ status: false, message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Vendor forgot password error', error);
    return NextResponse.json({ status: false, message: 'Server error' }, { status: 500 });
  }
}

async function handleSendOtp(body: { email: string }) {
  const { email } = body;
  if (!email) {
    return NextResponse.json({ status: false, message: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if vendor exists (but always return success to prevent enumeration)
  const vendor = await prisma.vendors.findUnique({ where: { email: normalizedEmail } });

  if (!vendor) {
    return NextResponse.json({
      status: true,
      message: 'If an account exists with this email, you will receive an OTP.',
    });
  }

  // Generate OTP
  const otpResult = await createOTP(normalizedEmail, 'password_reset');
  if (!otpResult.success) {
    return NextResponse.json(
      { status: false, message: otpResult.error, waitSeconds: otpResult.waitSeconds },
      { status: 429 }
    );
  }

  // Send OTP email
  const emailResult = await sendOTPEmail(normalizedEmail, otpResult.otp!, 'password-reset');

  if (!emailResult.success) {
    logger.error('Failed to send vendor password reset OTP', { email: normalizedEmail });
    // Dev mode - log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔐 ==========================================`);
      console.log(`🔐 DEV MODE - Vendor Password Reset OTP`);
      console.log(`🔐 Email: ${normalizedEmail}`);
      console.log(`🔐 OTP: ${otpResult.otp}`);
      console.log(`🔐 ==========================================\n`);
      return NextResponse.json({ status: true, message: 'OTP sent successfully.' });
    }
  }

  return NextResponse.json({ status: true, message: 'OTP sent to your email.' });
}

async function handleVerifyOtp(body: { email: string; otp: string }) {
  const { email, otp } = body;
  if (!email || !otp) {
    return NextResponse.json({ status: false, message: 'Email and OTP are required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Just peek at OTP record without consuming/marking as used
  // Actual verification happens in reset-password step
  try {
    const key = `otp:password_reset:${normalizedEmail}`;
    const dbRecord = await prisma.settings.findUnique({ where: { key } });

    if (!dbRecord) {
      return NextResponse.json({ status: false, message: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    const record = JSON.parse(dbRecord.value);

    if (record.verified) {
      return NextResponse.json({ status: false, message: 'OTP already used. Please request a new one.' }, { status: 400 });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return NextResponse.json({ status: false, message: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.otp !== otp) {
      // Increment attempts
      record.attempts = (record.attempts || 0) + 1;
      await prisma.settings.update({ where: { key }, data: { value: JSON.stringify(record) } });
      const remaining = 3 - record.attempts;
      return NextResponse.json(
        { status: false, message: 'Invalid OTP', attemptsRemaining: remaining },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return NextResponse.json({ status: false, message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}

async function handleResetPassword(body: { email: string; password: string; otp: string }) {
  const { email, password, otp } = body;
  if (!email || !password || !otp) {
    return NextResponse.json({ status: false, message: 'Email, OTP and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ status: false, message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  console.log(`\n🔑 [RESET-PASSWORD] Email: ${normalizedEmail}, OTP: ${otp}, PasswordLen: ${password.length}`);

  // Verify OTP one final time before resetting
  const verifyResult = await verifyOTP(normalizedEmail, otp, 'password_reset');
  console.log(`🔑 [RESET-PASSWORD] OTP verify result:`, JSON.stringify(verifyResult));
  if (!verifyResult.valid) {
    return NextResponse.json(
      { status: false, message: verifyResult.error },
      { status: 400 }
    );
  }

  // Update vendor password
  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await prisma.vendors.updateMany({
    where: { email: normalizedEmail },
    data: { password: hashedPassword },
  });

  console.log(`🔑 [RESET-PASSWORD] updateMany result count: ${result.count}`);

  if (result.count === 0) {
    return NextResponse.json({ status: false, message: 'Vendor not found' }, { status: 404 });
  }

  // Double-check: verify the new password was actually saved
  const updatedVendor = await prisma.vendors.findUnique({ where: { email: normalizedEmail }, select: { id: true, email: true, password: true } });
  const isNewPasswordCorrect = updatedVendor ? await bcrypt.compare(password, updatedVendor.password) : false;
  console.log(`🔑 [RESET-PASSWORD] Post-update bcrypt verify (new pw should match): ${isNewPasswordCorrect}`);

  logger.info('Vendor password reset successful', { email: normalizedEmail });

  return NextResponse.json({
    status: true,
    message: 'Password reset successfully! Please login with your new password.',
  });
}
