import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

type BulkAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'archive' | 'unarchive' | 'delete';
const VALID_ACTIONS: BulkAction[] = ['publish', 'unpublish', 'feature', 'unfeature', 'archive', 'unarchive', 'delete'];

// POST - Apply one action to many stories at once (multi-select toolbar on the list page)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : [];
    const action: BulkAction = body.action;

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No stories selected' }, { status: 400 });
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const where = { id: { in: ids } };
    const now = new Date();

    if (action === 'delete') {
      const result = await prisma.web_stories.deleteMany({ where });
      return NextResponse.json({ success: true, count: result.count });
    }

    // Feature can only stick to stories that are (or become) published — the
    // homepage carousel only reads from published stories, same rule as the
    // single-story feature toggle already enforces.
    let data: Record<string, unknown> | null = null;
    switch (action) {
      case 'publish':
        data = { isPublished: true, isArchived: false, publishedAt: now };
        break;
      case 'unpublish':
        data = { isPublished: false, isFeatured: false };
        break;
      case 'feature':
        await prisma.web_stories.updateMany({ where: { ...where, isPublished: true }, data: { isFeatured: true } });
        return NextResponse.json({ success: true });
      case 'unfeature':
        data = { isFeatured: false };
        break;
      case 'archive':
        data = { isArchived: true, isFeatured: false };
        break;
      case 'unarchive':
        data = { isArchived: false };
        break;
    }

    const result = await prisma.web_stories.updateMany({ where, data: data as any });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    logger.error('Failed to apply bulk web story action', error);
    return NextResponse.json({ error: 'Failed to apply bulk action' }, { status: 500 });
  }
}
