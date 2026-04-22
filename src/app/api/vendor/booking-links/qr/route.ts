// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const LOGO_PATH = path.join(process.cwd(), 'public', 'qr-logo.png');

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
    const QR_SIZE = 400;
    const LOGO_SIZE = Math.round(QR_SIZE * 0.22); // 22% of QR = ~88px
    const PADDING   = 8; // white padding around logo

    // 1. Generate QR as PNG buffer (high error correction so logo doesn't break scan)
    const qrBuffer = await QRCode.toBuffer(url, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#1e293b', light: '#ffffff' },
    });

    // 2. Prepare logo — resize to LOGO_SIZE, make circular with white padded background
    let finalBuffer: Buffer;

    if (fs.existsSync(LOGO_PATH)) {
      const logoResized = await sharp(LOGO_PATH)
        .resize(LOGO_SIZE - PADDING * 2, LOGO_SIZE - PADDING * 2, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();

      // White square background with rounded corners for logo
      const logoBg = await sharp({
        create: {
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([{
          input: logoResized,
          top: PADDING,
          left: PADDING,
        }])
        .png()
        .toBuffer();

      // 3. Composite logo in center of QR
      const centerPos = Math.round((QR_SIZE - LOGO_SIZE) / 2);

      finalBuffer = await sharp(qrBuffer)
        .composite([{
          input: logoBg,
          top: centerPos,
          left: centerPos,
        }])
        .png()
        .toBuffer();
    } else {
      // No logo file — return plain QR
      finalBuffer = qrBuffer;
    }

    // 4. Return as base64 data URL
    const base64 = finalBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ qr: dataUrl });
  } catch (err) {
    console.error('[qr] generation error:', err);
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 });
  }
}
