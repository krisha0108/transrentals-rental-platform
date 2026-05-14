import { NextRequest, NextResponse } from 'next/server';
import { getSocialAuth } from '@/lib/auth/social-auth';
import { listCategories } from '@/lib/social/service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { actor, error } = await getSocialAuth(request);
    if (!actor) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    const result = await listCategories();
    return NextResponse.json(result);
  } catch (e: any) {
    logger.error('GET /api/social/categories', e);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
