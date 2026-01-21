import type { Metadata } from 'next';
import {
  ShieldCheck,
  Lock,
  Shield,
  MessageCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    title: 'Data minimised',
    detail: 'We only collect what is required for identity, payment, and rental logistics.',
    icon: ShieldCheck,
  },
  {
    title: 'Transparent sharing',
    detail: 'Only verified vendors, payment processors, and regulators see your details when legally needed.',
    icon: Lock,
  },
  {
    title: 'Secure storage',
    detail: 'Access-controlled vaults, encryption, and regular audits keep your information safe.',
    icon: Shield,
  },
];

const TIMELINE_STEPS = [
  {
    title: 'Information collected',
    description:
      'Name, contact, location, identity documents, booking preferences, communication history, and payment metadata.',
    badge: 'Collect',
    icon: Info,
  },
  {
    title: 'Use & processing',
    description:
      'Share details with riders, vendors, and partners to confirm bookings, coordinate drivers, and provide support.',
    badge: 'Use',
    icon: ShieldCheck,
  },
  {
    title: 'Sharing & retention',
    description:
      'Vendors, payment gateways, and compliance bodies only receive the minimum fields. We delete historic data once obligations end.',
    badge: 'Share',
    icon: Shield,
  },
];

const RIGHTS = [
  {
    title: 'Access & portability',
    body: 'Request a copy of your profile or booking history from support.',
  },
  {
    title: 'Correction & deletion',
    body: 'Ask us to fix, anonymize, or delete data that is outdated or inaccurate.',
  },
  {
    title: 'Opt-outs',
    body: 'Disable marketing emails or communications through your dashboard or by emailing privacy@transrentals.in.',
  },
];

export const metadata: Metadata = {
  title: 'Privacy Policy | TransRentals',
  description:
    'TransRentals protects the information of customers booking bikes, cars, buses, trucks and equipment in 150+ cities.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <section className="rounded-[36px] mt-3 border border-white bg-gradient-to-br via-white to-white p-6 md:p-6 shadow-[0_35px_80px_rgba(15,23,42,0.12)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Privacy Policy
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Your privacy, safeguarded
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
            TransRentals operates in over 150+ Indian cities. We only collect what is necessary to
            complete a rental, keep you informed, and comply with local regulations. Every interaction
            is secured with industry-standard encryption and transparent policies.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Last updated April 2025
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              150+ Cities
            </span>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr,0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="uppercase tracking-[0.3em] text-xs text-slate-400">How we manage data</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              From collection to deletion
            </h2>
            <div className="mt-8 space-y-10">
              {TIMELINE_STEPS.map((step, index) => (
                <div key={step.title} className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <step.icon className="h-6 w-6" />
                    </span>
                    {index !== TIMELINE_STEPS.length - 1 && (
                      <span className="mt-2 h-full w-px bg-slate-200" />
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {step.badge}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Your rights
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Control and transparency
              </h3>
              <div className="mt-6 space-y-4">
                {RIGHTS.map((right) => (
                  <div key={right.title}>
                    <p className="text-sm font-semibold text-slate-900">{right.title}</p>
                    <p className="text-sm text-slate-600">{right.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-primary/40 bg-gradient-to-br from-primary/5 to-white p-6 text-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Need help?</p>
                  <p className="text-sm text-slate-600">Email book@transrentals.in</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Our privacy team answers requests within 48 hours and shares clear next steps.
                You can also visit your dashboard to manage newsletter or SMS preferences.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
