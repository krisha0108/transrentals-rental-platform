import { prisma } from '@/lib/db/prisma';

interface SeoOverride {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  pageHeading: string | null;
  pageDescription: string | null;
}

/**
 * Looks up seo_meta table for a DB override for the given pageId.
 * Returns null if not found or if DB lookup fails — pages should always
 * fall back to their hardcoded template when this returns null.
 *
 * Never throws.
 */
export async function resolvePageMeta(pageId: string): Promise<SeoOverride | null> {
  try {
    const override = await prisma.seo_meta.findUnique({
      where: { servicePageId: pageId },
      select: { metaTitle: true, metaDescription: true, metaKeywords: true, pageHeading: true, pageDescription: true },
    });
    return override ?? null;
  } catch {
    return null;
  }
}
