import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * POST - Start a spin
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id } = body;

        if (!customer_id) {
            return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
        }

        // List of possible prizes (matching SEGMENTS in SpinAndWinModal.js)
        const segments = [
            { key: 'better_luck', label: 'Better Luck', index: 0, value: 0, probability: 0.1 },
            { key: 'coin_1', label: '1 Backr', index: 1, value: 1, probability: 0.2 },
            { key: 'disc_10', label: '10% OFF', index: 2, value: 0, probability: 0.1 },
            { key: 'coin_5', label: '5 Backr', index: 3, value: 5, probability: 0.2 },
            { key: 'disc_50', label: '50% OFF', index: 4, value: 0, probability: 0.05 },
            { key: 'coin_10', label: '10 Backr', index: 5, value: 10, probability: 0.2 },
            { key: 'disc_20', label: '20% OFF', index: 6, value: 0, probability: 0.1 },
            { key: 'free_booking', label: 'Free Booking', index: 7, value: 0, probability: 0.05 },
        ];

        // Simple weighted random selection
        let random = Math.random();
        let selected = segments[0];
        let sum = 0;
        for (const seg of segments) {
            sum += seg.probability;
            if (random <= sum) {
                selected = seg;
                break;
            }
        }

        return NextResponse.json({
            success: true,
            key: selected.key,
            index: selected.index,
            value: selected.value,
            label: selected.label
        });
    } catch (error) {
        logger.error('Spin start POST error', error);
        return NextResponse.json(
            { success: false, error: 'Failed to start spin' },
            { status: 500 }
        );
    }
}
