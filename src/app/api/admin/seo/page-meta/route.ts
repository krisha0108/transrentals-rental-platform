import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/** PATCH /api/admin/seo/page-meta — upsert meta override for any page */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, metaTitle, metaDescription, metaKeywords } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const existing = await prisma.seo_meta.findUnique({ where: { pageId } });

    let result;
    if (existing) {
      result = await prisma.seo_meta.update({
        where: { pageId },
        data: { metaTitle, metaDescription, metaKeywords },
      });
    } else {
      result = await prisma.seo_meta.create({
        data: {
          id: generateId(),
          pageId,
          metaTitle,
          metaDescription,
          metaKeywords,
        },
      });
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

    await prisma.seo_meta.deleteMany({ where: { pageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[seo/page-meta DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
