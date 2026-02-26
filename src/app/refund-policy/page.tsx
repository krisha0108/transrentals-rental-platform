import type { Metadata } from 'next';
import {
  ShieldCheck,
  RefreshCw,
  CreditCard,
  MessageCircle,
  CalendarDays,
  Clock4,
} from 'lucide-react';

const REFUND_TRIGGERS = [
  {
    title: 'Customer cancellations',
    text: 'Automatic refund within the time window stated by the cancellation policy.',
    icon: ShieldCheck,
  },
  {
    title: 'Vendor disruptions',
    text: 'If a vendor cancels, we either rebook or refund you immediately with priority support.',
    icon: RefreshCw,
  },
  {
    title: 'Payment issues',
    text: 'Duplicates, failed transactions, or double charges are refunded after verification.',
    icon: CreditCard,
  },
];

const TIMELINE = [
  {
    title: 'Initiate',
    detail: 'Refund begins as soon as the booking is cancelled or the issue is validated.',
  },
  {
    title: 'Process',
    detail: 'We relay the refund request to your payment partner within 24 hours.',
  },
  {
    title: 'Confirm',
    detail: 'You receive a confirmation email with a reference ID and settlement ETA.',
  },
  {
    title: 'Complete',
    detail: 'Funds reach your card/UPI in 5-7 business days; wallets/net banking may take up to 10.',
  },
];

const CONTACT_ISSUES = [
  'Track refunds with your booking ID inside the dashboard or app.',
  'If the timeline slips, share the reference ID via SmartShivi or book@transrentals.in.',
  'Premium customers get a dedicated manager for faster reconciliation.',
];

export const metadata: Metadata = {
  title: 'Refund Policy | TransRentals',
  description:
    'Refund timelines, triggers, and support guidance for bookings across bikes, cars, buses, trucks, and equipment.',
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <section className="rounded-[40px] border border-white bg-gradient-to-br via-white to-white p-10 shadow-[0_35px_80px_rgba(15,23,42,0.12)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Refund policy
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Fast, transparent refunds
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
            Whether you cancel a bike, car, bus, truck, or equipment booking, we process refunds quickly and keep you informed with reference IDs and SmartShivi alerts.
          </p>
          {/* <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white bg-white/70 p-4 text-sm font-semibold text-slate-900 shadow-sm">
              <p>Transparent timelines</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">5-7 days</p>
            </article>
            <article className="rounded-2xl border border-white bg-white/70 p-4 text-sm font-semibold text-slate-900 shadow-sm">
              <p>Service scope</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">All vehicles</p>
            </article>
            <article className="rounded-2xl border border-white bg-white/70 p-4 text-sm font-semibold text-slate-900 shadow-sm">
              <p>Support</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SmartShivi & WhatsApp</p>
            </article>
          </div> */}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-primary">
            <span>Refund triggers</span>
            <span>What we cover</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {REFUND_TRIGGERS.map((trigger) => (
              <article
                key={trigger.title}
                className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                  <trigger.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{trigger.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{trigger.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-primary">
            <span>Refund timeline</span>
            <span>Step-by-step</span>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {TIMELINE.map((step, index) => (
              <article
                key={step.title}
                className="flex flex-col gap-2 rounded-[28px] border border-slate-200 bg-white p-5 text-sm shadow-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Step {index + 1}
                </span>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>Need help?</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Use SmartShivi or call the helpline with your booking ID to check the refund reference number.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {CONTACT_ISSUES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <Clock4 className="h-5 w-5 text-primary" />
              <span>Payment partners</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Cards and UPI usually take 5-7 business days; wallets and net banking may take up to 10 business days depending on your bank.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span className="rounded-full border border-slate-200 px-3 py-1 bg-white">Cards & UPI</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 bg-white">Wallets</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 bg-white">Bank transfers</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
