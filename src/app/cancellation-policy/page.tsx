import type { Metadata } from 'next';
import { Clock4, ShieldCheck, ArrowRightCircle, MessageCircle, RefreshCw } from 'lucide-react';

const POLICY_STEPS = [
  {
    title: 'Plan ahead',
    detail: 'Cancel more than 48 hours before pickup and receive a full refund.',
  },
  {
    title: 'Last-minute',
    detail: 'Cancel between 24-48 hours and 25% is retained to cover vendor prep.',
  },
  {
    title: 'Same-day & no-show',
    detail: 'Within 24 hours we may retain up to 50% or label it a no-show.',
  },
];

const VEHICLE_TIERS = [
  {
    icon: ShieldCheck,
    title: 'Premium & luxury',
    detail: '72-hour notice, 40% fee for chauffeur/logistics readiness.',
  },
  {
    icon: RefreshCw,
    title: 'Buses & trucks',
    detail: '72-hour notice with tiered vendor fees that are disclosed pre-payment.',
  },
  {
    icon: Clock4,
    title: 'Cars & bikes',
    detail: '48-hour free window, 25% fee 24–48 hrs, 30% for bikes after 24 hrs.',
  },
];

const SUPPORT_POINTS = [
  'Cancel via dashboard, SmartShivis or using your booking ID.',
  'We confirm within minutes and immediately notify the vendor.',
  'Refunds follow the standard timeline detailed in the refund policy.',
];

export const metadata: Metadata = {
  title: 'Cancellation Policy | TransRentals',
  description:
    'Cancellation windows, vehicle-specific fees, and support steps for TransRentals bike, car, bus, truck, and equipment bookings.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <section className="rounded-[36px] border border-white bg-gradient-to-br via-white to-white p-10 shadow-[0_35px_80px_rgba(15,23,42,0.12)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Cancellation policy
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Transparent windows, clear fees
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
            Take control of your bookings across 150+ cities. We explain timelines, vehicle-specific penalties, and how our support team assists when you need to cancel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              48h free cancellation
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              SmartShivi help
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Vendor penalties visible
            </span>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-primary">
            <span>Cancellation timeline</span>
            <span>Action</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {POLICY_STEPS.map((step, index) => (
              <article
                key={step.title}
                className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 text-sm shadow-sm transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Step {index + 1}
                  </div>
                  <ArrowRightCircle className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
                <p className="text-slate-600 leading-snug">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-primary">
            <span>Vehicle-specific rules</span>
            <span>Vendor details</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {VEHICLE_TIERS.map((tier) => (
              <article
                key={tier.title}
                className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm hover:border-primary hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                  <tier.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{tier.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{tier.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Need support?</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              SmartShivi or your dashboard handles cancellations. Share your booking ID, expected pickup, and reason.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {SUPPORT_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-primary/30 bg-gradient-to-br from-primary/10 to-white p-6 text-slate-900 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              <ShieldCheck className="h-5 w-5" />
              <span>Refund link</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Once your cancellation is accepted, we trigger the refund per your original payment method. See our refund policy for exact timelines.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">
              Smart tracking, instant alerts
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
