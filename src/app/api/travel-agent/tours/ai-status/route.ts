import { NextRequest, NextResponse } from 'next/server';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getTravelAgentAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ available: false }, { status: 401 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ available: false, reason: 'API key not configured' });
  }

  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ available: false, reason: 'Balance check failed' });
    }

    const data = await res.json();
    // is_available = false means balance is 0
    const available = data?.is_available !== false;
    return NextResponse.json({ available });
  } catch {
    // Network error — assume available so button isn't blocked unnecessarily
    return NextResponse.json({ available: true });
  }
}
