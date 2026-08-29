import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

// POST /api/bookings/payment-proof-upload
// FormData: bookingId (required), file (required image)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bookingId = ((formData.get('bookingId') as string) || '').trim();
    const file = formData.get('file') as File | null;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'A screenshot file is required' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP or GIF images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
    }

    // bookingId comes straight from a route param upstream and is not
    // attacker-controlled path input, but sanitize anyway before it
    // touches the filesystem path.
    const safeBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeBookingId) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs', safeBookingId);
    await mkdir(uploadDir, { recursive: true });

    const safeName = (file.name || 'proof').replace(/[^a-zA-Z0-9.-]/g, '-');
    const ext = path.extname(safeName) || '.jpg';
    const base = path.basename(safeName, ext).slice(0, 40) || 'proof';
    const fileName = `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      url: `/uploads/payment-proofs/${safeBookingId}/${fileName}`,
    });
  } catch (error: any) {
    console.error('[payment-proof-upload]', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshot', details: error?.message },
      { status: 500 },
    );
  }
}
