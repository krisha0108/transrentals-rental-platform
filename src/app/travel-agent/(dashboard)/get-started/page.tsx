'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Building2,
  FileText,
  DollarSign,
  ArrowRight,
  Clock,
  Sparkles,
  Compass,
  Target,
  Link2,
  BookOpen,
  Loader2,
  Lock,
  Globe,
  ShieldCheck,
  HelpCircle,
  Car,
} from 'lucide-react';

interface AgentInfo {
  status: string;
  agencyName: string;
  ownerName: string;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  documentsCount: number;
  bankAccountsCount: number;
  leadsCount: number;
  toursCount: number;
  propertiesCount: number;
  bookingsCount: number;
}

const REQUIRED_DOCS_COUNT = 3; // GST + PAN + Address Proof

export default function TravelAgentGetStartedPage() {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/travel-agent/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAgent(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const isApproved = agent?.status === 'APPROVED';
  const profileDone = !!(agent?.gstNumber && agent?.address && agent?.city);
  const docsDone = (agent?.documentsCount ?? 0) >= REQUIRED_DOCS_COUNT;
  const bankDone = (agent?.bankAccountsCount ?? 0) > 0;
  const stepDoneCount = [profileDone, docsDone, bankDone].filter(Boolean).length;
  const onboardingPct = isApproved ? 100 : Math.round((stepDoneCount / 3) * 100);

  const steps = [
    {
      n: 1,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      ring: 'ring-blue-100',
      badge: 'bg-blue-100 text-blue-700',
      tip: 'bg-blue-50 text-blue-700',
      cta: 'bg-blue-600 hover:bg-blue-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Complete Your Agency Profile',
      sub: 'Address, GST, PAN, owner details',
      desc: 'Fill out your agency address, GST number, and contact details. This information appears on customer-facing booking pages.',
      tipText: 'GSTIN and a complete address are required for the next steps.',
      done: profileDone || isApproved,
      active: !profileDone && !isApproved,
      href: '/travel-agent/profile',
      label: profileDone ? 'View Profile' : 'Complete Profile',
    },
    {
      n: 2,
      icon: FileText,
      gradient: 'from-violet-500 to-violet-600',
      ring: 'ring-violet-100',
      badge: 'bg-violet-100 text-violet-700',
      tip: 'bg-violet-50 text-violet-700',
      cta: 'bg-violet-600 hover:bg-violet-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Upload KYC Documents',
      sub: 'GST Certificate, PAN, Address Proof',
      desc: 'Upload the 3 required KYC documents. Once verified by our team, your agency goes live with public-facing features.',
      tipText:
        'Use clear, readable scans (PDF / JPG / PNG, up to 10 MB each). Verification takes 24–48 hours.',
      done: docsDone || isApproved,
      active: profileDone && !docsDone && !isApproved,
      href: '/travel-agent/documents',
      label: docsDone ? 'View Documents' : 'Upload Now',
      progress: agent
        ? `${Math.min(agent.documentsCount, REQUIRED_DOCS_COUNT)} of ${REQUIRED_DOCS_COUNT} uploaded`
        : null,
    },
    {
      n: 3,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      ring: 'ring-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
      tip: 'bg-emerald-50 text-emerald-700',
      cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Add Bank Details',
      sub: 'For receiving customer payouts',
      desc: 'Add your agency bank account where customer payments will be settled. You can mark one as Primary and add backups.',
      tipText: 'Make sure the account holder name matches your agency name on record.',
      done: bankDone || isApproved,
      active: docsDone && !bankDone && !isApproved,
      href: '/travel-agent/bank-details',
      label: bankDone ? 'View Bank Details' : 'Add Now',
    },
  ];

  const featureCards = [
    {
      icon: Target,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Lead Management',
      desc: 'Capture, track and convert customer enquiries with a built-in pipeline.',
      href: '/travel-agent/leads',
    },
    {
      icon: Compass,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Tours',
      desc: 'List your tour packages — once approved, they go live on /wander.',
      href: '/travel-agent/tours',
    },
    {
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Properties',
      desc: 'Add your resorts, hotels or rooms for accommodation bookings.',
      href: '/travel-agent/properties',
    },
    {
      icon: Link2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Capture Links',
      desc: 'Share a public form link — customer fills it, lead lands in your dashboard.',
      href: '/travel-agent/capture-links',
      requiresApproval: true,
    },
    {
      icon: Car,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      title: 'Fleet',
      desc: 'List your vehicles and cabs for hire, with rates and availability.',
      href: '/travel-agent/fleet',
    },
    {
      icon: Globe,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Social',
      desc: 'Connect with other agents and vendors in the travel network.',
      href: '/travel-agent/social',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* ── Hero / Status banner ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 to-teal-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 60%), radial-gradient(circle at 80% 20%, #14b8a6 0%, transparent 50%)',
          }}
        />
        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-semibold tracking-widest uppercase">
                Welcome
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              {isApproved
                ? `You're verified, ${agent?.ownerName?.split(' ')[0] || 'Agent'}! 🎉`
                : `Welcome, ${agent?.ownerName?.split(' ')[0] || 'Agent'}!`}
            </h1>
            <p className="text-emerald-100 text-sm mt-1.5 max-w-md">
              {isApproved
                ? 'Your agency is live. Start adding tours, capturing leads, and managing bookings.'
                : 'Complete these 3 steps to get verified and unlock public-facing features.'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 border border-white/20 shrink-0 min-w-[160px]">
            <p className="text-xs uppercase tracking-wide text-emerald-200 mb-1 font-bold">
              Onboarding
            </p>
            <p className="text-3xl font-extrabold">
              {onboardingPct}
              <span className="text-emerald-300 text-base font-bold">%</span>
            </p>
            <p className="text-[10px] text-emerald-200 mt-0.5">
              {isApproved ? 'verified' : `${stepDoneCount} of 3 done`}
            </p>
          </div>
        </div>
        <div className="relative h-1 bg-white/10">
          <div
            className="absolute left-0 top-0 h-1 bg-emerald-400 transition-all duration-500"
            style={{ width: `${onboardingPct}%` }}
          />
        </div>
      </div>

      {/* ── Status pill row ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck
            className={`w-5 h-5 ${isApproved ? 'text-emerald-600' : 'text-amber-500'}`}
          />
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Account Status
            </p>
            <p className="text-sm font-bold text-gray-900">
              {agent?.status?.replace(/_/g, ' ') || 'Loading…'}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            isApproved
              ? 'bg-emerald-100 text-emerald-700'
              : agent?.status === 'UNDER_REVIEW'
                ? 'bg-blue-100 text-blue-700'
                : agent?.status === 'REJECTED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isApproved ? '✓ Verified' : 'Pending'}
        </span>
      </div>

      {/* ── 3-step onboarding ── */}
      {!isApproved && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Onboarding Checklist</h2>
            <p className="text-xs text-gray-500">Complete in order — each step unlocks the next</p>
          </div>
          <div className="space-y-3">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className={`bg-white border rounded-2xl p-5 transition-shadow ${
                    s.active
                      ? `${s.ring} ring-2 border-transparent shadow-lg`
                      : s.done
                        ? 'border-emerald-200'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step number / icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        s.done
                          ? 'bg-emerald-100'
                          : `bg-gradient-to-br ${s.gradient}`
                      }`}
                    >
                      {s.done ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${s.badge}`}>
                          Step {s.n}
                        </span>
                        {s.done && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            ✓ Done
                          </span>
                        )}
                        {s.active && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            Next up
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{s.desc}</p>
                      {s.progress && (
                        <p className="text-xs font-semibold text-violet-700 mt-2">{s.progress}</p>
                      )}
                      <div className={`mt-3 inline-flex text-xs items-start gap-1.5 rounded-lg px-3 py-2 ${s.tip}`}>
                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{s.tipText}</span>
                      </div>
                      <div className="mt-4">
                        <Link
                          href={s.href}
                          className={`inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-colors ${
                            s.done ? s.ctaDone : s.cta
                          }`}
                        >
                          {s.label} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── What's next: feature cards (always visible) ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            {isApproved ? 'What you can do' : 'Available now (soft-access)'}
          </h2>
          <p className="text-xs text-gray-500">
            {isApproved
              ? 'Everything is unlocked'
              : 'Manage your own data freely. Public features unlock after verification.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureCards.map((f) => {
            const Icon = f.icon;
            const locked = f.requiresApproval && !isApproved;
            return (
              <Link
                key={f.title}
                href={f.href}
                className={`group bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl p-5 transition-colors flex items-start gap-4 ${
                  locked ? 'opacity-70' : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{f.title}</p>
                    {locked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> KYC
                      </span>
                    )}
                    {!locked && f.requiresApproval && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Stats summary (for approved users) ── */}
      {isApproved && agent && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Leads" value={agent.leadsCount} />
          <StatBox label="Tours" value={agent.toursCount} />
          <StatBox label="Properties" value={agent.propertiesCount} />
          <StatBox label="Bookings" value={agent.bookingsCount} />
        </section>
      )}

      {/* ── Help / Support ── */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">Need help getting started?</p>
          <p className="text-xs text-gray-500 mt-1">
            Verification typically takes <strong>24–48 hours</strong> after you upload your KYC
            documents. Make sure scans are clear and details on documents match your agency profile.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/travel-agent/notifications"
              className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
            >
              <Clock className="w-3 h-3" /> View Notifications
            </Link>
            <a
              href="mailto:support@transrentals.in"
              className="text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
            >
              ✉️ Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
