import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/admin/seo/state-page-overrides
 *  Returns all seo_meta rows whose servicePageId starts with "state:"
 *  as a map: { [pageId]: SeoOverride }
 */
export async function GET() {
  try {
    const rows = await prisma.seo_meta.findMany({
      where: { servicePageId: { startsWith: 'state:' } },
      select: {
        servicePageId: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        pageHeading: true,
        pageDescription: true,
        sectionsConfig: true,
      },
    });

    const overrides: Record<string, typeof rows[number]> = {};
    for (const row of rows) {
      overrides[row.servicePageId] = row;
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('[state-page-overrides GET]', error);
    return NextResponse.json({ overrides: {} });
  }
}
