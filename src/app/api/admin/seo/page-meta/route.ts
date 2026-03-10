import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { STATIC_PAGES } from '@/lib/seo/service-meta-templates';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * Converts a pageId to its public URL path so we can revalidate it.
 * Examples:
 *   "bike-on-rent:mumbai"          → "/bike-on-rent/mumbai"
 *   "one-way-cab:delhi-to-agra"    → "/one-way-cab/delhi-to-agra"
 *   "airport-transfer:bom-to-bkc"  → "/airport-transfer/bom-to-bkc"
 *   "static:homepage"              → "/"
 *   "static:about"                 → "/about"
 */
function pageIdToPath(pageId: string): string | null {
  const colonIdx = pageId.indexOf(':');
  if (colonIdx === -1) return null;

  const prefix = pageId.slice(0, colonIdx);
  const slug = pageId.slice(colonIdx + 1);

  if (prefix === 'static') {
    const page = STATIC_PAGES.find((p) => p.pageId === pageId);
    return page?.url ?? null;
  }

  return `/${prefix}/${slug}`;
}

/** PATCH /api/admin/seo/page-meta — upsert meta override for any page */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, metaTitle, metaDescription, metaKeywords, pageHeading, pageDescription } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const existing = await prisma.seo_meta.findUnique({ where: { servicePageId: pageId } });

    let result;
    if (existing) {
      result = await prisma.seo_meta.update({
        where: { servicePageId: pageId },
        data: { metaTitle, metaDescription, metaKeywords, pageHeading, pageDescription },
      });
    } else {
      result = await prisma.seo_meta.create({
        data: {
          id: generateId(),
          servicePageId: pageId,
          metaTitle,
          metaDescription,
          metaKeywords,
          pageHeading,
          pageDescription,
        },
      });
    }

    // Immediately revalidate the live page so changes reflect without waiting for cache expiry
    const path = pageIdToPath(pageId);
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[seo/page-meta PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/admin/seo/page-meta?pageId=xxx — remove override (revert to template) */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    await prisma.seo_meta.deleteMany({ where: { servicePageId: pageId } });

    // Revalidate the live page on revert too
    const path = pageIdToPath(pageId);
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[seo/page-meta DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
