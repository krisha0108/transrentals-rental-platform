import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

/**
 * POST - Store customer FCM token for push notifications
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id, token, fcm_token, platform } = body;

        // Support both 'token' and 'fcm_token' parameter names
        const finalToken = token || fcm_token;

        if (!customer_id || !finalToken) {
            return NextResponse.json({ error: 'customer_id and token required' }, { status: 400 });
        }

        // Placeholder: In a real app, we would store this in the database
        // For now, just log it and return success
        logger.info(`Received FCM token for customer ${customer_id}: ${finalToken} (${platform})`);

        return NextResponse.json({
            success: true,
            message: 'FCM token updated successfully'
        });
    } catch (error) {
        logger.error('FCM token POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update FCM token' },
            { status: 500 }
        );
    }
}
