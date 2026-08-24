'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function WanderListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Wander Listings Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
        There was an error loading your tour listings. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
        >
          Try Again
        </button>
        <Link
          href="/vendor/dashboard"
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
        >
          Dashboard
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-lg w-full">
          <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
        </div>
      )}
    </div>
  );
}
