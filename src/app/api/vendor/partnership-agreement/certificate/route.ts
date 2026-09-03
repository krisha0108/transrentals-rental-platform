// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { AGREEMENT_VERSION } from '@/lib/content/partnership-agreement';
import { buildAgreementCertificatePdf } from '@/lib/pdf/partnership-agreement-certificate-pdf';

export const dynamic = 'force-dynamic';

// GET — download the decorative "Vendor Agreement Certificate". Only
// available once a manager has accepted the vendor's signature (the
// certificate is itself a statement of that acceptance); the plain
// legal-style agreement PDF at /api/vendor/partnership-agreement/pdf
// remains available regardless of review status.
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
    prisma.vendors.findUnique({ where: { id: auth.vendorId }, select: { businessName: true, vid: true } }),
  ]);

  if (!signature || signature.reviewStatus !== 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Certificate is only available once TransRentals has accepted your signed agreement' },
      { status: 400 },
    );
  }

  const buffer = buildAgreementCertificatePdf(signature, vendor);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="TransRentals-Vendor-Certificate-${AGREEMENT_VERSION}.pdf"`,
      'Content-Length': String(buffer.length),
    },
  });
}
