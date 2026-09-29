import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  PhoneOff,
  KeyRound,
  FileCheck2,
  Receipt,
  UserCheck,
  LifeBuoy,
  Flag,
} from 'lucide-react';

// Public "Safety & Security" page, part of the same policy family as
// /privacy-policy and /terms-conditions and built on that page's shell
// (slate canvas, rounded hero, card grids) so the set reads as one.
// It is the long-form home of the payment-safety warning shown on quote
// detail pages and in the site-wide floating alert, which both link here.

const PROMISES = [
  {
    title: 'Every payment on record',
    detail:
      'Pay through TransRentals and the amount, the vendor and the booking are all recorded together. That record is what lets us step in if anything goes wrong.',
    icon: CreditCard,
  },
  {
    title: 'Conversations you can prove',
    detail:
      'TransRentals Chat keeps what was promised, quoted and agreed. A WhatsApp thread on a personal number proves nothing to anyone later.',
    icon: MessageSquare,
  },
  {
    title: 'Vendors we can reach',
    detail:
      'Vendors on the platform are verified and accountable to us. Someone who insists on being paid outside it is stepping away from that accountability.',
    icon: UserCheck,
  },
];

const GOLDEN_RULES = [
  {
    badge: 'Rule 01',
    title: 'Accept quotes and pay only on TransRentals',
    description:
      'Every payment — advance, balance or extra charge — belongs on the platform. For self-drive rentals and certain other services a vendor may ask for an advance where applicable; that too must be paid here, never by a direct transfer.',
    icon: CreditCard,
  },
  {
    badge: 'Rule 02',
    title: 'Keep the whole conversation in TransRentals Chat',
    description:
      'Please do not move the discussion to WhatsApp, a personal phone number, SMS or any other external channel — not for negotiating, not for sharing documents, and not for settling payment.',
    icon: MessageSquare,
  },
  {
    badge: 'Rule 03',
    title: 'Nothing extra until the handover is complete',
    description:
      'Until the vehicle or service has been formally handed over to you, kindly do not make any further or direct payment outside TransRentals, under any circumstances, however the request is worded.',
    icon: FileCheck2,
  },
  {
    badge: 'Rule 04',
    title: 'Your OTP and payment details stay with you',
    description:
      'No one from TransRentals or from a vendor will ever need your OTP, card number, CVV or UPI PIN. Anybody asking for them is attempting fraud, whatever name they use.',
    icon: KeyRound,
  },
];

const RED_FLAGS = [
  {
    title: 'Pay me directly, it will be cheaper',
    body: 'A discount offered for stepping off the platform is the single most common way customers are defrauded. The saving is the bait.',
  },
  {
    title: 'Send the advance to this UPI ID or QR code',
    body: 'A personal UPI ID, QR code or bank account shared over chat or a call is never a TransRentals payment channel.',
  },
  {
    title: 'Let us talk on WhatsApp instead',
    body: 'Moving the conversation off-platform removes the record. Please ask them to come back to TransRentals Chat.',
  },
  {
    title: 'Share the OTP to confirm your booking',
    body: 'Confirmation never needs an OTP read out to another person. Sharing it hands over your account or your money.',
  },
  {
    title: 'Your booking will be cancelled unless you pay now',
    body: 'Urgency and threats are pressure tactics. A genuine vendor is content to wait while you check inside the platform.',
  },
  {
    title: 'A caller who says they are from TransRentals support',
    body: 'We do not ask for payments over a phone call. Please end the call and raise a ticket through the Helpdesk instead.',
  },
];

const SAFE_STEPS = [
  {
    badge: 'Step 01',
    title: 'Raise your request',
    description:
      'Tell us the vehicle or service, the city and the dates. Your request reaches verified vendors for that category — you never have to find one yourself.',
    icon: Receipt,
  },
  {
    badge: 'Step 02',
    title: 'Compare the quotes you receive',
    description:
      'Quotes arrive on your request page with the price and inclusions visible side by side. Ask anything you need to in TransRentals Chat before deciding.',
    icon: MessageSquare,
  },
  {
    badge: 'Step 03',
    title: 'Accept and pay on the platform',
    description:
      'Accepting a quote and paying for it happen in the same place, so the booking and the money stay tied to each other in one record.',
    icon: ShieldCheck,
  },
  {
    badge: 'Step 04',
    title: 'Take the handover',
    description:
      'Check the vehicle or service at handover. Anything still owed is settled on the platform — not in cash on the spot, and not by transfer.',
    icon: FileCheck2,
  },
];

const IF_IT_GOES_WRONG = [
  {
    title: 'Stop, and do not pay',
    body: 'If a request feels wrong, it costs nothing to pause. Please decline politely and check inside the platform first.',
  },
  {
    title: 'Keep what you were sent',
    body: 'Hold on to the number, the UPI ID, the QR code or the screenshot. It is what lets us act on the vendor.',
  },
  {
    title: 'Report it to us',
    body: 'Raise a ticket on the Helpdesk with those details. Reporting early helps us protect the next customer as well as you.',
  },
];

export const metadata: Metadata = {
  title: 'Safety & Security | TransRentals',
  description:
    'How TransRentals keeps your payments and bookings safe — pay and communicate only on the platform, spot the warning signs of fraud, and know what to do if something feels wrong.',
};

export default function SafetySecurityPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        {/* Hero */}
        <section className="rounded-[36px] mt-3 border border-white bg-gradient-to-br via-white to-white p-6 md:p-6 shadow-[0_35px_80px_rgba(15,23,42,0.12)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Safety &amp; Security
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Your money and your booking, protected
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
            Almost every rental fraud in India begins the same way — someone persuades the customer
            to step outside the platform for a payment or a conversation. Keeping both on
            TransRentals is the one habit that protects you, and this page explains exactly what
            that means, what to watch for, and what to do if something feels wrong.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Applies to every service
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              500+ Cities
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Verified vendors only
            </span>
          </div>
        </section>

        {/* The one-line version */}
        <section className="relative overflow-hidden rounded-[32px] border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 md:p-8 shadow-sm">
          <div className="pointer-events-none absolute inset-0 animate-pulse rounded-[32px] border-2 border-red-400 motion-reduce:animate-none" />

          {/* Diagonal light sweep */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
            <div className="tr-safety-sweep absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-red-400 opacity-75 animate-ping motion-reduce:animate-none" />
              <span className="tr-safety-icon-breathe relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-red-900">
                Please keep every payment and conversation on TransRentals
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
                For your own protection, we request that every payment be made only on the
                TransRentals platform, and that every conversation with a vendor stay in
                TransRentals Chat. Where a payment is made outside the platform, TransRentals will
                not be able to take responsibility for any resulting fraud, loss, refund,
                cancellation, or dispute — not because we do not wish to help, but because there is
                no record of it for us to act on.
              </p>
            </div>
          </div>
        </section>

        {/* Why the platform protects you */}
        <section className="grid gap-6 sm:grid-cols-3">
          {PROMISES.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </section>

        {/* Golden rules + red flags */}
        <section className="grid gap-8 lg:grid-cols-[1fr,0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="uppercase tracking-[0.3em] text-xs text-slate-400">The four rules</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Follow these and you stay covered
            </h2>
            <div className="mt-8 space-y-10">
              {GOLDEN_RULES.map((rule, index) => (
                <div key={rule.title} className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <rule.icon className="h-6 w-6" />
                    </span>
                    {index !== GOLDEN_RULES.length - 1 && (
                      <span className="mt-2 h-full w-px bg-slate-200" />
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {rule.badge}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{rule.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">
                Warning signs
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Lines that should stop you
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                If you hear any of these, the answer is the same each time — decline, and report it.
              </p>
              <div className="mt-6 space-y-4">
                {RED_FLAGS.map((flag) => (
                  <div key={flag.title} className="flex gap-3">
                    <Flag className="mt-1 h-4 w-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">&ldquo;{flag.title}&rdquo;</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{flag.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <PhoneOff className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  If someone calls claiming to be a vendor
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                If anyone claiming to be a TransRentals vendor contacts you on WhatsApp or by phone
                and asks for a direct payment, please decline and ask them to communicate through
                the TransRentals platform instead. A genuine vendor will have no difficulty doing
                so — everything they need is already there.
              </p>
            </div>
          </div>
        </section>

        {/* A safe booking, step by step */}
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="uppercase tracking-[0.3em] text-xs text-slate-400">Start to finish</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            What a safe booking looks like
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAFE_STEPS.map((step) => (
              <article
                key={step.title}
                className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-6 transition hover:border-blue-200 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {step.badge}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{step.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Protecting your account + what to do */}
        <section className="grid gap-8 lg:grid-cols-[0.9fr,1fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Protecting your account</h2>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                Please never share your payment details or an OTP with anyone, and do not send a
                bank transfer or UPI payment to a vendor on the basis of an outside call or message.
              </p>
              <p>
                Open TransRentals from your own bookmark or the app rather than from a link in an
                unexpected message, and check that you are on the official site before entering
                anything.
              </p>
              <p>
                If you are signed in on a shared or public device, please sign out when you are
                done, and raise a ticket with us straight away if you notice a booking or a message
                you do not recognise.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">If something feels wrong</h2>
            </div>
            <div className="mt-6 space-y-5">
              {IF_IT_GOES_WRONG.map((item, index) => (
                <div key={item.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/customer/helpdesk"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Flag className="h-4 w-4" />
              Report it to TransRentals
            </Link>
          </div>
        </section>

        {/* Help */}
        <section className="rounded-[32px] border border-primary/40 bg-gradient-to-br from-primary/5 to-white p-6 md:p-8 text-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Not sure about something?</p>
              <p className="text-sm text-slate-600">Email chat@transrentals.in</p>
            </div>
          </div>
          <p className="mt-4 max-w-4xl text-sm text-slate-600 leading-relaxed">
            If a vendor insists on a direct payment, or asks you to move the conversation outside
            TransRentals, please tell us right away — even if you have not paid anything. You can
            also read our{' '}
            <Link
              href="/terms-conditions"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link
              href="/refund-policy"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Refund Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
