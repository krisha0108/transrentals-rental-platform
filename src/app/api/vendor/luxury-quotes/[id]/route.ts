// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    const { id } = params;
    const quote = await prisma.luxury_quotes.findFirst({
      where: { id, vendorId: vendorId },
      include: { luxury_quote_requests: { select: { id: true, requestNumber: true, customerName: true, customerPhone: true, customerEmail: true, pickupCity: true, dropCity: true, pickupAddress: true, dropAddress: true, pickupDate: true, pickupTime: true, returnDate: true, tripType: true, occasion: true, tripDays: true, tripHours: true, needDecoration: true, decorationType: true, needChauffeur: true, requirements: true, budgetMin: true, budgetMax: true, status: true } } },
    });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    const parseJson = (f: any) => { if (!f) return []; if (Array.isArray(f)) return f; try { return JSON.parse(f); } catch { return []; } };
    return NextResponse.json({ success: true, quote: { ...quote, request: quote.luxury_quote_requests, inclusions: parseJson(quote.inclusions), exclusions: parseJson(quote.exclusions), termsConditions: parseJson(quote.termsConditions) } });
  } catch (error: any) {
    logger.error('Failed to fetch luxury quote', error);
    return NextResponse.json({ error: 'Failed to fetch quote', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = params;
    const { action } = await request.json();
    const quote = await prisma.luxury_quotes.findFirst({ where: { id, vendorId: vendorId } });
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (action === 'withdraw') {
      if (!['SENT', 'VIEWED'].includes(quote.status)) return NextResponse.json({ error: 'Cannot withdraw' }, { status: 400 });
      const updated = await prisma.luxury_quotes.update({ where: { id }, data: { status: 'WITHDRAWN' } });
      return NextResponse.json({ success: true, message: 'Quote withdrawn', quote: updated });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to update luxury quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
