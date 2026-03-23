import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'web-stories');

    try {
      const allFiles = await readdir(uploadDir);
      const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

      const withStats = await Promise.all(
        imageFiles.map(async f => {
          const s = await stat(path.join(uploadDir, f));
          return { name: f, mtime: s.mtime.getTime() };
        })
      );

      withStats.sort((a, b) => b.mtime - a.mtime);
      const files = withStats.map(f => `/uploads/web-stories/${f.name}`);

      return NextResponse.json({ files });
    } catch {
      return NextResponse.json({ files: [] });
    }
  } catch {
    return NextResponse.json({ files: [] });
  }
}
