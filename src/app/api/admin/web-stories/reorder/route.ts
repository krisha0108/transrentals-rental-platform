import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Moving a story one place up or down.
//
// The obvious implementation — write displayOrder = current ± 1 on the one row
// — does not actually reorder anything. Nothing guarantees the neighbour holds
// the adjacent value, and in practice most rows share displayOrder 0, so that
// write just invents a duplicate or a negative and the visible order barely
// changes. The list is also paginated, so the row above a page's first row
// lives on the previous page and cannot be reasoned about from the client.
//
// So the move is resolved here, against the whole ordered list: find the story,
// swap it with its true neighbour, and renumber. Renumbering every affected row
// also repairs the duplicate zeros left behind by the old behaviour, which is
// why the orders are rewritten from scratch rather than swapped in place.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const id: string = body?.id;
    const direction: 'up' | 'down' = body?.direction;

    if (!id || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json(
        { error: 'id and direction ("up" | "down") are required' },
        { status: 400 }
      );
    }

    // Same ordering the list uses, so "the row above" here is the row the
    // admin actually sees above.
    const ordered = await prisma.web_stories.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, displayOrder: true },
    });

    const index = ordered.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) {
      // Already at the end it was asked to move towards — not an error.
      return NextResponse.json({ success: true, moved: false });
    }

    const moved = [...ordered];
    [moved[index], moved[target]] = [moved[target], moved[index]];

    // Write only the rows whose number actually changes.
    const writes = moved
      .map((s, i) => ({ id: s.id, displayOrder: i, was: s.displayOrder }))
      .filter((s) => s.displayOrder !== s.was)
      .map((s) =>
        prisma.web_stories.update({
          where: { id: s.id },
          data: { displayOrder: s.displayOrder },
        })
      );

    if (writes.length) await prisma.$transaction(writes);

    return NextResponse.json({ success: true, moved: true, updated: writes.length });
  } catch (error: any) {
    logger.error('Reorder web story error', error);
    return NextResponse.json(
      { error: 'Failed to reorder story', details: error?.message },
      { status: 500 }
    );
  }
}
