import { NextRequest, NextResponse } from 'next/server';
import { getPaymentConfig } from '@/lib/payment-calc';

import logger from '@/lib/security/logger';
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const serviceIdParam = searchParams.get('serviceId');

    const serviceId = serviceIdParam || undefined;

    try {
        const config = await getPaymentConfig(serviceId);
        return NextResponse.json({ success: true, config });
    } catch (error) {
        logger.error('Failed to fetch payment config', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
    }
}
