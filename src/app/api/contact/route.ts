import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import {
  checkRateLimit,
  RATE_LIMITS,
  checkIdentifierRateLimit,
  logger,
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  stripHtml,
} from '@/lib/security';
import { sendInquiryReceived } from '@/lib/whatsapp/client';

export const dynamic = 'force-dynamic';

const validatePayload = (data: Record<string, unknown>) => {
  const { name, phone, email, subject, message } = data;
  if (!name || typeof name !== 'string' || name.trim().length < 2) return 'Please enter your name';
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) return 'Please enter a valid phone';
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Please enter a valid email';
  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) return 'Please enter a subject';
  if (!message || typeof message !== 'string' || message.trim().length < 5)
    return 'Please enter a message';
  return null;
};

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const { limited, remaining, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.contact,
    'contact-form'
  );

  if (limited) {
    logger.logSecurityEvent('Contact form rate limit exceeded', 'low', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const email = (payload.email as string).toLowerCase().trim();

  // Additional rate limit by email to prevent spam from same sender
  const emailRateLimit = checkIdentifierRateLimit(email, RATE_LIMITS.contact, 'contact');
  if (emailRateLimit.limited) {
    logger.logSecurityEvent('Contact form email rate limit exceeded', 'low', { email });
    return NextResponse.json(
      { error: 'You have already submitted a message recently. Please wait before sending another.' },
      { status: 429 }
    );
  }

  const inquiryId = crypto.randomUUID();

  try {
    // SECURITY: Sanitize all inputs before storing
    const sanitizedData = {
      name: sanitizeName(payload.name as string),
      phone: sanitizePhone(payload.phone as string),
      email: sanitizeEmail(payload.email as string),
      subject: stripHtml(payload.subject as string).substring(0, 200), // Limit subject length
      message: stripHtml(payload.message as string).substring(0, 5000), // Limit message length
    };

    await prisma.contact_inquiries.create({
      data: { id: inquiryId, ...sanitizedData },
    });

    logger.info('Contact form submission', { email: sanitizedData.email });

    sendInquiryReceived({
      customerPhone: sanitizedData.phone,
      customerName: sanitizedData.name,
      subject: sanitizedData.subject,
    });
  } catch (error) {
    logger.error('Failed to save contact inquiry', error);
    return NextResponse.json(
      { error: 'Unable to save your message right now. Please try again later.' },
      { status: 500 }
    );
  }

  // Same cosmetic format the manager/admin UI already uses for this inquiry.
  const referenceNumber = `INQ-${inquiryId.slice(-6).toUpperCase()}`;

  // Does this email/phone already belong to a customer account? Drives the
  // post-submit popup: existing customers get sent straight to login
  // (email pre-filled, just asks for their password), new visitors get sent
  // to registration instead (asked to create a password / free account).
  let isExistingCustomer = false;
  try {
    const email = (payload.email as string).toLowerCase().trim();
    const phone = sanitizePhone(payload.phone as string);
    const existing = await prisma.customers.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true },
    });
    isExistingCustomer = !!existing;
  } catch (error) {
    logger.error('Failed to check existing customer for contact form', error);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Thank you for your message',
    referenceNumber,
    isExistingCustomer,
  });
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(resetIn));

  return response;
}
