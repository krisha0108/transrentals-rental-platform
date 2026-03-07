import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get('customer_id');
  const email = url.searchParams.get('email');

  if (!customerId && !email) {
    return NextResponse.json({ isB2B: false });
  }

  let customer = null;

  // Try by ID first
  if (customerId) {
    customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { isB2B: true, b2bStatus: true, companyName: true, gstin: true, businessType: true, b2bApprovedAt: true },
    });
  }

  // Fallback to email lookup
  if (!customer && email) {
    customer = await prisma.customers.findFirst({
      where: { email },
      select: { isB2B: true, b2bStatus: true, companyName: true, gstin: true, businessType: true, b2bApprovedAt: true },
    });
  }

  return NextResponse.json({
    isB2B: customer?.isB2B === true && customer?.b2bStatus === 'APPROVED',
    companyName: customer?.companyName || null,
    gstin: customer?.gstin || null,
    businessType: customer?.businessType || null,
    b2bStatus: customer?.b2bStatus || null,
    b2bApprovedAt: customer?.b2bApprovedAt || null,
  });
}
