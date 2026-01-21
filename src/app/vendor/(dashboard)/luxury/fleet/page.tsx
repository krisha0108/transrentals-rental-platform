'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Redirect to main fleet management page
export default function LuxuryFleetPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendor/fleet?service=luxury');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to Fleet Management...</p>
      </div>
    </div>
  );
}
