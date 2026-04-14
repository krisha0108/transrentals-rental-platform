'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MyProfileRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const vendorId = session?.user?.id;
    if (vendorId) {
      router.replace(`/vendor/social/profile/${vendorId}`);
    } else {
      router.replace('/vendor/social');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <p className="text-sm text-gray-500 font-medium">Redirecting to your profile...</p>
    </div>
  );
}
