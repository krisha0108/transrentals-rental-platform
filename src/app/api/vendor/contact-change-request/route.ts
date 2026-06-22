import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function generateId() {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET — return the current pending request (if any)
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const req = await prisma.vendor_contact_change_requests.findFirst({
    where: { vendorId: auth.vendorId, status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
    select: { id: true, newEmail: true, newPhone: true, status: true, requestedAt: true },
  });

  return NextResponse.json({ request: req ?? null });
}

// POST — submit a new change request
export async function POST(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newEmail = body.newEmail?.trim().toLowerCase() || null;
  const newPhone = body.newPhone?.trim() || null;

  if (!newEmail && !newPhone) {
    return NextResponse.json({ error: 'Provide at least one of new email or new phone' }, { status: 400 });
  }

  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (newPhone && !/^[6-9]\d{9}$/.test(newPhone.replace(/\D/g, '').slice(-10))) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  // Only one pending request at a time
  const existing = await prisma.vendor_contact_change_requests.findFirst({
    where: { vendorId: auth.vendorId, status: 'PENDING' },
  });
  if (existing) {
    return NextResponse.json({ error: 'You already have a pending change request' }, { status: 409 });
  }

  // Check uniqueness against other vendors
  if (newEmail) {
    const clash = await prisma.vendors.findFirst({ where: { email: newEmail, NOT: { id: auth.vendorId } } });
    if (clash) return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 });
  }
  if (newPhone) {
    const clash = await prisma.vendors.findFirst({ where: { phone: newPhone, NOT: { id: auth.vendorId } } });
    if (clash) return NextResponse.json({ error: 'Phone already in use by another account' }, { status: 409 });
  }

  const changeRequest = await prisma.vendor_contact_change_requests.create({
    data: { id: generateId(), vendorId: auth.vendorId, newEmail, newPhone },
    select: { id: true, newEmail: true, newPhone: true, status: true, requestedAt: true },
  });

  logger.info('Vendor contact change request submitted', { vendorId: auth.vendorId });

  return NextResponse.json({ request: changeRequest }, { status: 201 });
}

// DELETE — cancel a pending request
export async function DELETE(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reqId = searchParams.get('id');
  if (!reqId) return NextResponse.json({ error: 'Request ID required' }, { status: 400 });

  const existing = await prisma.vendor_contact_change_requests.findFirst({
    where: { id: reqId, vendorId: auth.vendorId, status: 'PENDING' },
  });
  if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  await prisma.vendor_contact_change_requests.update({
    where: { id: reqId },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}
