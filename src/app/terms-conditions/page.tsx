import type { Metadata } from 'next';
import { CheckCircle, Shield, Truck, AlertTriangle, Users, MessageCircle } from 'lucide-react';

const FLOW_STEPS = [
  {
    title: 'Agreement kick-off',
    detail: 'Every booking begins with a transparent summary of what you pay for, including insurance, taxes, add-ons, and vendor notes.',
  },
  {
    title: 'Verification & confirmation',
    detail: 'Share ID, trip, and contact details so we can confirm the booking and send a secure OTP/booking code.',
  },
  {
    title: 'Ride completion',
    detail: 'Inspect the vehicle, follow local safety rules, and return it with the agreed fuel and cleanliness levels to avoid additional charges.',
  },
  {
    title: 'Post-ride resolution',
    detail: 'Any disputes get routed via SmartShivi support. We resolve them within 48 hours or escalate to arbitration if needed.',
  },
];

const COMMITMENTS = [
  {
    icon: Shield,
    title: 'Transparent pricing',
    text: 'We show base fares, convenience charges, taxes, and optional services before you pay.',
  },
  {
    icon: Truck,
    title: 'Vendor responsibility',
    text: 'Vendors deliver safe, insured vehicles with clear policies on damage, cancellations, and extras.',
  },
  {
    icon: AlertTriangle,
    title: 'Safety first',
    text: 'Follow helmets, seat belts, and traffic rules. Off-road or negligent use may lead to damage fees.',
  },
];

const RIGHTS = [
  'Request data access, corrections, or deletion by emailing privacy@transrentals.in.',
  'Opt out of marketing and notifications through your dashboard or support.',
  'Escalate unresolved disputes to arbitration or local authorities per Indian law.',
];

export const metadata: Metadata = {
  title: 'Terms & Conditions | TransRentals',
  description:
    'TransRentals terms of use for renting bikes, cars, buses, trucks, and equipment in India.',
};

export default function TermsConditionsPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <header className="grid gap-6 rounded-[36px] border border-white bg-gradient-to-br via-white to-white p-8 shadow-[0_30px_70px_rgba(15,23,42,0.15)] md:grid-cols-[2fr,1fr]">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
              Terms & Conditions
            </p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">
              Clear rules for every ride
            </h1>
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">
              Rent bikes, cars, buses, trucks, or equipment with confidence. These terms map how we match you with
              verified vendors, secure payments, and keep support on speed dial.
            </p>
          </div>
          {/* <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Updated</p>
              <p className="text-xl font-semibold text-slate-900">April 2025</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Coverage</p>
              <p className="text-xl font-semibold text-slate-900">500+ Cities</p>
            </div>
          </div> */}
        </header>

        <section className="space-y-6">
          <div className="text-sm uppercase tracking-[0.4em] text-slate-400">Process outline</div>
          <div className="grid gap-5 md:grid-cols-2">
            {FLOW_STEPS.map((step, index) => (
              <article
                key={step.title}
                className="flex gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {COMMITMENTS.map((commitment) => (
            <article
              key={commitment.title}
              className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                <commitment.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{commitment.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{commitment.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-primary/30 bg-gradient-to-br from-white p-8 text-slate-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Your rights & support</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">Stay informed</span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {RIGHTS.map((right) => (
              <p key={right} className="text-sm text-slate-700 leading-relaxed">
                {right}
              </p>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/40 bg-white/80 p-6">
            <div className="flex items-center gap-3 text-sm font-semibold text-primary">
              <MessageCircle className="h-5 w-5" />
              <span>Need help?</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              SmartShivi and helpline support stay live 24x7. Raise disputes within 48 hours for the quickest resolution.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <Users className="h-5 w-5 text-primary" />
              <span>Vendor obligations</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Vendors must deliver insured, audited vehicles, disclose any extras, and honor damage/cancellation guidelines. Failure to comply gives us the right to switch vendors or cancel the booking.
            </p>
          </div>
          <div className="rounded-[28px] border border-primary/40 bg-gradient-to-br from-primary/5 to-white p-6 text-slate-900 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              <CheckCircle className="h-5 w-5" />
              <span>Acceptance</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Continuing to use TransRentals indicates acceptance of the current terms, the privacy policy, and the cancellation/refund policies referenced throughout the booking flow.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
