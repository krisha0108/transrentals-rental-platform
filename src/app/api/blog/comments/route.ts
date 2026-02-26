import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Fetch comments for a post (stub — comments not implemented yet)
export async function GET(request: NextRequest) {
  return NextResponse.json({ comments: [] });
}

// POST - Submit a comment (stub — comments not implemented yet)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Comment submitted! It will appear after review.',
  });
}
