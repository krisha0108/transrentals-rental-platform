'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    question: 'How do I book a vehicle or equipment?',
    answer:
      'Choose your vehicle type, trip dates, and city from the homepage. We cover 150+ cities, so simply enter pickup/drop, verify your ID, and pay securely to get instant confirmation.',
  },
  {
    question: 'Which documents are required?',
    answer:
      'A government-issued photo ID (Aadhaar, Passport, or Driving Licence) plus a selfie are enough for standard rentals. Trucks, buses, or equipment may require additional business documents, which we highlight before payment.',
  },
  {
    question: 'How do I cancel or modify a booking?',
    answer:
      'Modify or cancel up to 48 hours before pickup via your dashboard or by calling 9737965551. We email the updated charges, and any penalties follow the published cancellation policy.',
  },
  {
    question: 'What if the vehicle or vendor is unavailable?',
    answer:
      'We either assign another verified vendor in the same city or refund you per the refund policy. Contact us at 9737965551 immediately and we will re-route the replacement.',
  },
  {
    question: 'How do payments and refunds work?',
    answer:
      'Pay with cards, UPI, or wallets. Vendors receive payment after your trip, and refunds process instantly once a cancellation is confirmed—expect a 5-7 business day window for cards/UPI.',
  },
  {
    question: 'How can I reach support while on the move?',
    answer:
      'Call or WhatsApp us at 9737965551 for immediate help. Premium services add a dedicated booking manager, and every support channel spans our 150+ city network.',
  },
];

export function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedFAQ = FAQ_ITEMS[activeIndex];

  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <header className="space-y-3 rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 md:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Need clarity?
          </p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            TransRentals FAQs
          </h1>
          <p className="max-w-3xl text-base text-slate-600 leading-relaxed">
            Every question about renting bikes, cars, buses, trucks, or equipment is covered here.
            Select a question to reveal the answer without losing focus from the rest of the page.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Cities', value: '150+' },
              { label: 'Support', value: '24/7' },
              { label: 'Vendors', value: 'Verified' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-center shadow-sm backdrop-blur"
              >
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr,1.3fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tap to reveal</p>
            </div>
            <div className="relative mt-6 border-l border-dashed border-slate-200 pl-8">
              {FAQ_ITEMS.map((faq, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    aria-current={isActive ? 'true' : 'false'}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      'mb-6 flex w-full flex-col items-start gap-2 rounded-2xl border border-transparent px-4 py-3 text-left transition duration-200',
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-slate-900 shadow-[0_10px_25px_rgba(59,130,246,0.15)]'
                        : 'hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Q {index + 1}
                        </p>
                        <p className="mt-1 text-base font-semibold leading-tight">
                          {faq.question}
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-5 w-5 text-slate-400 transition-transform duration-200',
                          isActive && 'rotate-90 text-primary'
                        )}
                      />
                    </div>
                    <p className="text-sm text-slate-500">
                      {isActive ? 'Selected' : 'Tap to view answer'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Answer</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900 leading-snug">
                “{selectedFAQ.question}”
              </h3>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">{selectedFAQ.answer}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Quick tip</p>
                  <p>Keep your ID and ride plan ready to speed up verification.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Support</p>
                  <p>Call / WhatsApp <strong>9737965551</strong> — helpline live across India.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-primary/40 bg-gradient-to-b from-primary/5 to-white p-6 text-slate-700 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Ride confident
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Every vendor must pass insurance, driver background, and hygiene checks before listing with TransRentals.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Verified</span>
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Transparent</span>
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Connected</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
