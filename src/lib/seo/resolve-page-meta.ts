import { prisma } from '@/lib/db/prisma';

interface SeoOverride {
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
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
      where: { pageId },
      select: { metaTitle: true, metaDescription: true, metaKeywords: true },
    });
    return override ?? null;
  } catch {
    return null;
  }
}
