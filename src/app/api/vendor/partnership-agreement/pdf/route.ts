// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { AGREEMENT_VERSION } from '@/lib/content/partnership-agreement';
import { buildAgreementPdf } from '@/lib/pdf/partnership-agreement-pdf';

export const dynamic = 'force-dynamic';

// GET — download the current agreement as a PDF laid out like the on-screen
// page. Always generated fresh from the shared content module, so it can
// never drift out of sync with what the vendor just read. If they have
// already signed, their signature details are filled in; otherwise the
// signature block is left blank for reference.
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [signature, vendor] = await Promise.all([
    (prisma as any).vendor_partnership_agreements.findFirst({
      where: { vendorId: auth.vendorId, agreementVersion: AGREEMENT_VERSION },
      orderBy: { acceptedAt: 'desc' },
    }),
    prisma.vendors.findUnique({
      where: { id: auth.vendorId },
      select: { businessName: true, vid: true, address: true, city: true, state: true, pincode: true },
    }),
  ]);

  const buffer = buildAgreementPdf(signature, vendor);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="TransRentals-Vendor-Agreement-${AGREEMENT_VERSION}.pdf"`,
      'Content-Length': String(buffer.length),
    },
  });
}
