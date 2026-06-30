'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function BackrCallbackPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const linked = searchParams.get('backr_linked');
    const redirectTo = searchParams.get('redirectTo') || '/customer/dashboard';
    if (linked === '1') {
      setStatus('success');
      const t = setTimeout(() => router.push(redirectTo), 2500);
      return () => clearTimeout(t);
    } else {
      setStatus('error');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">BACKR Connected ✓</h2>
            <p className="text-sm text-gray-500 mb-5">
              Your BACKR wallet is now linked. You'll earn BACKR tokens on every completed booking.
            </p>
            <p className="text-xs text-gray-400">Redirecting to dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Connection Failed</h2>
            <p className="text-sm text-gray-500 mb-5">
              Something went wrong linking your BACKR wallet. Please try again from your dashboard.
            </p>
            <Link href="/customer/dashboard"
              className="inline-flex items-center justify-center w-full py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition">
              Back to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
