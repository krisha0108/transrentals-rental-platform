import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { AGREEMENT_VERSION, TERM_OPTIONS_MONTHS, DEFAULT_TERM_MONTHS } from '@/lib/content/partnership-agreement';

export const dynamic = 'force-dynamic';

// Single source of truth for the version string lives in
// src/lib/content/partnership-agreement.ts — bump it there when the
// agreement text changes, not here.
const CURRENT_VERSION = AGREEMENT_VERSION;

// GET — has this vendor digitally signed the current partnership agreement?
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const latest = await (prisma as any).vendor_partnership_agreements.findFirst({
    where: { vendorId: auth.vendorId },
    orderBy: { acceptedAt: 'desc' },
  });

  return NextResponse.json({
    currentVersion: CURRENT_VERSION,
    signed: !!latest && latest.agreementVersion === CURRENT_VERSION,
    agreement: latest || null,
  });
}

// POST — digitally sign the current partnership agreement.
// Intentionally NOT gated by vendorStatusGuard — a suspended/rejected
// vendor should still be able to sign this, same as they can still view
// their dashboard (see VendorLayout's suspended-banner flow).
export async function POST(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const signedByName = (body?.signedByName || '').trim();
  const signedByTitle = (body?.signedByTitle || '').trim();
  const queryNote = (body?.queryNote || '').trim() || null;
  const agreed = !!body?.agreed;
  const termMonths = Number(body?.termMonths) || DEFAULT_TERM_MONTHS;

  if (!agreed) {
    return NextResponse.json({ error: 'You must confirm you agree to the terms' }, { status: 400 });
  }
  if (!signedByName || signedByName.length < 2) {
    return NextResponse.json({ error: 'Please type your full name to sign' }, { status: 400 });
  }
  if (!signedByTitle) {
    return NextResponse.json({ error: 'Please select your designation' }, { status: 400 });
  }
  if (!(TERM_OPTIONS_MONTHS as readonly number[]).includes(termMonths)) {
    return NextResponse.json({ error: 'Please select a valid agreement term' }, { status: 400 });
  }

  // Already signed the current version — return the existing record
  // instead of creating a duplicate.
  const existing = await (prisma as any).vendor_partnership_agreements.findFirst({
    where: { vendorId: auth.vendorId, agreementVersion: CURRENT_VERSION },
    orderBy: { acceptedAt: 'desc' },
  });
  if (existing) {
    return NextResponse.json({ success: true, agreement: existing });
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;
  const userAgent = request.headers.get('user-agent') || null;

  const created = await (prisma as any).vendor_partnership_agreements.create({
    data: {
      id: `vpa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      vendorId: auth.vendorId,
      agreementVersion: CURRENT_VERSION,
      signedByName,
      signedByTitle,
      queryNote,
      termMonths,
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ success: true, agreement: created });
}
