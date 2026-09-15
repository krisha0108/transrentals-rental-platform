'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface AnalyticsErrorProps {
  /** What failed, e.g. "traffic analytics". Used to build the heading. */
  subject?: string;
  /** The underlying error text, shown verbatim so the cause is never hidden. */
  message?: string | null;
  /** Re-runs the page's fetch. */
  onRetry?: () => void;
}

/**
 * Shown when an analytics page cannot load real data.
 *
 * These pages used to fall back to generated placeholder numbers, which made a broken
 * API or an empty table look like healthy traffic. Showing the failure instead is the
 * whole point of this component — never render sample data in its place.
 */
export function AnalyticsError({ subject = 'analytics', message, onRetry }: AnalyticsErrorProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-red-100 bg-red-50/60 p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
          Couldn&apos;t load {subject}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          No data is shown because the request failed. Nothing here is estimated or filled in.
        </p>
        {message && (
          <p className="mt-3 break-words rounded-lg bg-white/70 px-3 py-2 font-mono text-xs text-red-700">
            {message}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

interface AnalyticsEmptyProps {
  /** What has no rows yet, e.g. "backlinks". */
  subject?: string;
  /** Why it is empty / what to do about it. */
  hint?: string;
}

/**
 * Shown when the request succeeded but the underlying table has no rows yet.
 * Distinct from AnalyticsError: nothing is broken, there is simply nothing to show.
 */
export function AnalyticsEmpty({ subject = 'data', hint }: AnalyticsEmptyProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Database className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">No {subject} yet</h2>
        <p className="mt-2 text-sm text-gray-600">
          {hint ?? 'Once tracking data starts coming in, it will appear here.'}
        </p>
      </div>
    </div>
  );
}
