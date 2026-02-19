// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

// GET /api/vendor/booking-links/qr?linkId=xxx  → returns PNG buffer as base64
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  // If linkId given, verify ownership
  if (linkId) {
    const link = await prisma.vendor_booking_links.findFirst({
      where: { id: linkId, vendorId: auth.vendorId },
    });
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    return NextResponse.json({ qr: dataUrl });
  } catch (err) {
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 });
  }
}
