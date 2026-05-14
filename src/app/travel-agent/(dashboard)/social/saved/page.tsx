'use client';

// The main feed already exposes a "Saved" tab — just redirect here so any
// links to /travel-agent/social/saved land on the right view.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AgentSavedRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/travel-agent/social?tab=saved'); }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
    </div>
  );
}
