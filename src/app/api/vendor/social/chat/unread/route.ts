import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ count: 0 });
    }
    const vendorId = auth.vendorId;

    // Find conversations where this vendor is a participant
    const myConvs = await prisma.vendor_conversations.findMany({
      where: { OR: [{ vendor1Id: vendorId }, { vendor2Id: vendorId }] },
      select: { id: true },
    });
    const convIds = myConvs.map(c => c.id);

    const count = await prisma.vendor_messages.count({
      where: {
        conversationId: { in: convIds },
        isRead: false,
        senderId: { not: vendorId },
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
