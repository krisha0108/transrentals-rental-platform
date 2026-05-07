import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import logger from '@/lib/security/logger';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Serve uploaded files via API route
// This is a fallback for hosting environments where public folder isn't served correctly
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Handle both array and promise params (Next.js 14+ compatibility)
    const pathParams = await Promise.resolve(params.path);
    const filePath = Array.isArray(pathParams) ? pathParams.join('/') : pathParams;
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);

    // Security: Prevent directory traversal
    if (filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!existsSync(fullPath)) {
      const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f1f5f9"/>
        <rect x="150" y="100" width="100" height="80" rx="8" fill="#cbd5e1"/>
        <circle cx="175" cy="125" r="12" fill="#94a3b8"/>
        <path d="M150 165 L175 140 L195 155 L215 135 L250 165Z" fill="#94a3b8"/>
      </svg>`;
      return new NextResponse(placeholder, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
      });
    }

    const file = await readFile(fullPath);

    // Determine content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    logger.error('Error serving file', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
