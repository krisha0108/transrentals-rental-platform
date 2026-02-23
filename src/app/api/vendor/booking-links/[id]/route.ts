// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// PUT — update link settings (toggle, customize)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const link = await prisma.vendor_booking_links.findFirst({
    where: { id: params.id, vendorId: auth.vendorId },
  });
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { isActive, formTitle, welcomeMsg, visibleFields, requireAdvance, advanceAmount } = body;

  const updated = await prisma.vendor_booking_links.update({
    where: { id: params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(formTitle !== undefined && { formTitle }),
      ...(welcomeMsg !== undefined && { welcomeMsg }),
      ...(visibleFields !== undefined && { visibleFields }),
      ...(requireAdvance !== undefined && { requireAdvance }),
      ...(advanceAmount !== undefined && { advanceAmount }),
    },
  });

  return NextResponse.json({ link: updated });
}
