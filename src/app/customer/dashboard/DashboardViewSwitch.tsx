'use client';

import { Building2, Car, Compass } from 'lucide-react';

export type DashboardView = 'b2b' | 'personal' | 'tour';

/**
 * The dashboard's view switch.
 *
 * It lives inside the hero rather than in a strip above it, because the strip's
 * background changed with the customer: a travel agent has a near-black banner
 * above it, a pending B2B account an amber one, everyone else the plain white
 * header. Sitting on the hero, the control reads the same for all three — and it
 * no longer looks like a second row of site navigation.
 *
 * All three heroes (personal, tours, B2B) use the same emerald gradient, so one
 * treatment works everywhere.
 */
export default function DashboardViewSwitch({
  view,
  onChange,
  showB2B = false,
  personalLabel = 'My Bookings',
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
  showB2B?: boolean;
  personalLabel?: string;
}) {
  const tabs: { key: DashboardView; label: string; Icon: typeof Car }[] = [
    ...(showB2B ? [{ key: 'b2b' as const, label: 'B2B Dashboard', Icon: Building2 }] : []),
    { key: 'personal', label: personalLabel, Icon: Car },
    { key: 'tour', label: 'Tours', Icon: Compass },
  ];

  return (
    <div
      role="tablist"
      aria-label="Dashboard view"
      className="mt-4 inline-flex rounded-full border border-white/[0.18] bg-white/[0.08] p-[3px] backdrop-blur-sm"
    >
      {tabs.map(({ key, label, Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded-full px-[18px] py-2 text-[12.5px] transition ${
              active
                ? 'bg-white font-semibold text-[#04321F] shadow-[0_8px_18px_-10px_rgba(1,35,20,.9)]'
                : 'font-medium text-white/[0.6] hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
