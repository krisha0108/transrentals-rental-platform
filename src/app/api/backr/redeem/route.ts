import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Redeem Backr tokens (Coming Soon)
 */
export async function POST(request: NextRequest) {
    return NextResponse.json({
        success: false,
        coming_soon: true,
        message: 'Redeem feature coming soon! Stay tuned.',
    });
}
