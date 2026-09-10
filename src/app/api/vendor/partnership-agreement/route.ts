import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { AGREEMENT_VERSION, TERM_OPTIONS_MONTHS, DEFAULT_TERM_MONTHS } from '@/lib/content/partnership-agreement';
import { getAllActiveManagers, getManagersForLocation, notifyManagers } from '@/lib/notifications/manager-notify';
import logger from '@/lib/security/logger';

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

  const [latest, vendor] = await Promise.all([
    (prisma as any).vendor_partnership_agreements.findFirst({
      where: { vendorId: auth.vendorId },
      orderBy: { acceptedAt: 'desc' },
    }),
    prisma.vendors.findUnique({
      where: { id: auth.vendorId },
      select: { businessName: true, address: true, city: true, state: true, pincode: true },
    }),
  ]);

  return NextResponse.json({
    currentVersion: CURRENT_VERSION,
    // A rejected signature doesn't count — the vendor is asked to sign again.
    signed:
      !!latest &&
      latest.agreementVersion === CURRENT_VERSION &&
      latest.reviewStatus !== 'REJECTED',
    agreement: latest || null,
    // Signing is only half the flow — a manager still has to accept it.
    reviewStatus: latest?.reviewStatus || null,
    reviewedAt: latest?.reviewedAt || null,
    reviewNote: latest?.reviewNote || null,
    // Vendor's own business details, used to fill in the Vendor clause of
    // the agreement text on-screen (see vendorPartyLine in the content module).
    vendor,
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
  // A rejected signature is superseded by a fresh one, so only an untouched
  // or already-accepted record short-circuits here.
  if (existing && existing.reviewStatus !== 'REJECTED') {
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

  // Tell the managers who look after this vendor that there's something to
  // review. Best-effort: a notification failure must never fail the signing.
  try {
    const vendor = await prisma.vendors.findUnique({
      where: { id: auth.vendorId },
      select: { businessName: true, vid: true },
    });
    const approvedLocations = await prisma.vendor_approved_locations.findMany({
      where: { vendorId: auth.vendorId, isActive: true },
      select: { locationId: true },
    });

    // Scope to the managers who cover this vendor's locations; if the vendor
    // has none yet (they can sign before their first location is approved),
    // fall back to every active manager so the request is never orphaned.
    const scoped = await Promise.all(
      approvedLocations.map((l) => getManagersForLocation(l.locationId)),
    );
    let managerIds = [...new Set(scoped.flat())];
    if (managerIds.length === 0) managerIds = await getAllActiveManagers();

    const vendorLabel = vendor?.businessName
      ? `${vendor.businessName}${vendor.vid ? ` (${vendor.vid.toUpperCase()})` : ''}`
      : 'A vendor';

    await notifyManagers(managerIds, {
      type: 'NEW_VENDOR_AGREEMENT_SIGNED',
      title: 'Vendor signed the partnership agreement',
      body:
        `${vendorLabel} was signed by ${signedByName}` +
        `${signedByTitle ? `, ${signedByTitle}` : ''} · ${termMonths}-month term` +
        `${queryNote ? ' · has a question' : ''}. Review and accept it.`,
      link: '/manager/vendor-agreements',
      metadata: {
        vendorId: auth.vendorId,
        agreementId: created.id,
        agreementVersion: CURRENT_VERSION,
        termMonths,
        hasQuery: !!queryNote,
      },
      dedupeKey: created.id,
    });
  } catch (error) {
    logger.error('Failed to notify managers of a signed partnership agreement', error);
  }

  return NextResponse.json({ success: true, agreement: created });
}
