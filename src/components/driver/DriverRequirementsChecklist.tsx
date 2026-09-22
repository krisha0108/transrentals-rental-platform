'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, IdCard, FileCheck2, Landmark, Car } from 'lucide-react';

/**
 * "What you need to get started", as something the driver can tick off.
 *
 * The static version listed the same items but gave no sense of progress, so a
 * driver had to hold the checklist in their head. Ticking the boxes turns the
 * section into a readiness check and puts the register CTA at the end of it,
 * which is the moment the driver actually knows they qualify.
 *
 * Nothing is stored or submitted — it is a self-check, so the state stays in
 * the component.
 */

const GROUPS = [
  {
    key: 'identity',
    title: 'Identity Documents',
    Icon: IdCard,
    items: [
      'Valid Aadhar Card (12-digit)',
      'PAN Card (for payment setup)',
      'Passport-size photograph',
      'Active mobile number',
    ],
  },
  {
    key: 'licence',
    title: 'Driving Licence',
    Icon: FileCheck2,
    items: [
      'Valid LMV / HMV / PSV licence',
      'Minimum 2 years driving experience',
      'Clean driving record',
      'Licence valid for at least 6 more months',
    ],
  },
  {
    key: 'bank',
    title: 'Bank Account',
    Icon: Landmark,
    items: [
      'Savings or current bank account',
      'IFSC code of your branch',
      'Account holder name matching Aadhar',
      'Account must be operational',
    ],
  },
  {
    key: 'vehicle',
    title: 'Your Vehicle',
    Icon: Car,
    items: [
      'Independent driver: own vehicle required',
      "Vendor's driver: vendor provides the vehicle",
      'Own vehicle needs valid RC & insurance',
      'Add your fleet from the driver app',
    ],
  },
] as const;

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);

export function DriverRequirementsChecklist() {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});

  const done = useMemo(() => Object.values(ticked).filter(Boolean).length, [ticked]);
  const pct = Math.round((done / TOTAL) * 100);
  const ready = done === TOTAL;

  const toggle = (id: string) =>
    setTicked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
      <div className="container-custom max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <Check className="w-3.5 h-3.5" />
            Before you register
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            What You Need to <span className="text-emerald-600">Get Started</span>
          </h2>
          <p className="mt-3 text-gray-500">
            Tick what you already have — it takes a minute and tells you if you are ready.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-2xl border-[1.5px] border-gray-100 bg-white shadow-sm px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-900">
              {ready ? "You're ready to register" : `${done} of ${TOTAL} ready`}
            </span>
            <span className="font-black tabular-nums text-emerald-600">{pct}%</span>
          </div>
          <div
            className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Requirements you have ready"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {GROUPS.map(({ key, title, Icon, items }) => (
            <div
              key={key}
              className="rounded-2xl border-[1.5px] border-gray-100 bg-white shadow-sm p-5 transition hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
              </div>

              <ul className="space-y-1">
                {items.map((item, i) => {
                  const id = `${key}-${i}`;
                  const on = !!ticked[id];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-pressed={on}
                        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50"
                      >
                        <span
                          className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${
                            on
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span
                          className={`text-[13px] leading-relaxed transition ${
                            on ? 'text-gray-400 line-through' : 'text-gray-600'
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/driver/register"
            className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold shadow-md transition-all duration-200 ${
              ready
                ? 'bg-emerald-600 text-white shadow-emerald-600/25 hover:-translate-y-0.5 hover:bg-emerald-700'
                : 'bg-gray-900 text-white hover:-translate-y-0.5 hover:bg-gray-800'
            }`}
          >
            {ready ? 'Register now — you qualify' : 'Register as Driver — it’s free'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            Missing something? You can still register and add documents later.
          </p>
        </div>
      </div>
    </section>
  );
}
