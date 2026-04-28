import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email) return NextResponse.json({ inquiries: [] });

  try {
    const inquiries = await prisma.$queryRaw<any[]>`
      SELECT id, subject, message, status, resolution, resolvedAt, createdAt
      FROM contact_inquiries
      WHERE LOWER(email) = ${email}
      ORDER BY createdAt DESC
      LIMIT 10
    `;
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('[Customer Inquiries]', error);
    return NextResponse.json({ inquiries: [] });
  }
}
