// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// DELETE — remove an expense entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    // Verify expense belongs to this vendor + booking (raw — table may not be in client)
    const rows: any[] = await prisma.$queryRaw`
      SELECT id FROM vendor_direct_booking_expenses
      WHERE id = ${params.expenseId}
        AND vendorId = ${auth.vendorId}
        AND bookingId = ${params.id}
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.$executeRaw`
      DELETE FROM vendor_direct_booking_expenses WHERE id = ${params.expenseId}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[expenses DELETE] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
