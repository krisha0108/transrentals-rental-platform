import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Plane,
  Sparkles,
  Compass,
  Bed,
  Car,
  Target,
  Zap,
  Star,
  ShieldCheck,
  Share2,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Headphones,
  Globe,
  Award,
  ChevronRight,
  Building2,
  MapPin,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Travel Agents | Grow your travel agency with TransRentals',
  description:
    'Join 1000+ travel agents on TransRentals. Get a free public profile, list tours, stays and vehicles, capture leads, and turn them into bookings — all from one dashboard.',
};

const BENEFITS = [
  {
    icon: Globe,
    title: 'Free Public Profile',
    desc: 'Get a sharable page like /agent/your-name with logo, contact, tours and stays.',
  },
  {
    icon: Compass,
    title: 'List Unlimited Tours',
    desc: 'Showcase itineraries, durations, prices and gallery — visible to every visitor.',
  },
  {
    icon: Bed,
    title: 'Add Stays & Vehicles',
    desc: 'Hotels, homestays, sedans, tempo travellers — everything under one roof.',
  },
  {
    icon: Target,
    title: 'Capture Leads',
    desc: 'Custom shareable links collect enquiries directly into your dashboard.',
  },
  {
    icon: Zap,
    title: 'Quote in One Click',
    desc: 'Send branded quotes via WhatsApp; convert leads → bookings instantly.',
  },
  {
    icon: TrendingUp,
    title: 'Track Everything',
    desc: 'Pipeline, follow-ups, payments and reviews — neat numbers, no spreadsheets.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Sign up free',
    desc: '2-minute form. Just basic info — no card, no commitment.',
    icon: Plane,
  },
  {
    n: '02',
    title: 'Set up your profile',
    desc: 'Add logo, description, tours, stays and vehicles from the dashboard.',
    icon: Sparkles,
  },
  {
    n: '03',
    title: 'Share & start earning',
    desc: 'Send your profile link to customers, capture leads, close trips.',
    icon: TrendingUp,
  },
];

const STATS = [
  { value: '1000+', label: 'Travel agents onboarded' },
  { value: '150+', label: 'Cities across India' },
  { value: '0%', label: 'Listing fee — always free' },
  { value: '24/7', label: 'Customer support' },
];

const FAQS = [
  {
    q: 'Is it really free to join?',
    a: 'Yes — listing your agency, tours, stays and vehicles is completely free. We earn only when you transact bookings via our payment rails (optional).',
  },
  {
    q: 'How fast can I go live?',
    a: 'You can sign up and publish your first tour in under 10 minutes. Verification (the green "Verified Partner" badge) takes 24-48 hours after KYC upload.',
  },
  {
    q: 'Do I get a personal page?',
    a: 'Yes — every agent gets a public page like transrentals.in/agent/your-slug with profile, tours, stays, vehicles and direct call/WhatsApp buttons.',
  },
  {
    q: 'Can I bring my own customers?',
    a: 'Absolutely. Use TransRentals as your CRM — capture leads, send quotes, manage bookings. No platform commission on customers you bring.',
  },
  {
    q: 'What about payments?',
    a: 'Settle directly with the customer or use our managed payments with built-in escrow. Choose per booking — your call.',
  },
];

export default function TravelAgentsLandingPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-sky-600 via-emerald-700 to-teal-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #fbbf24 0%, transparent 35%), radial-gradient(circle at 85% 10%, #38bdf8 0%, transparent 40%), radial-gradient(circle at 70% 80%, #10b981 0%, transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute top-12 left-[5%] w-32 h-10 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-24 right-[8%] w-40 h-12 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 backdrop-blur border border-amber-300/40 text-amber-100 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                <Sparkles className="w-3 h-3" /> For Travel Agents
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Grow your travel <br />
                agency the smart way.
              </h1>
              <p className="text-lg text-emerald-50 mt-5 max-w-xl leading-relaxed">
                Join 1000+ travel agents already using TransRentals. Get a free public profile,
                list your tours and vehicles, capture leads, and turn them into bookings — all
                from one dashboard.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/travel-agent/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-amber-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                >
                  Join free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/travel-agent/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold text-base px-6 py-3.5 rounded-xl"
                >
                  Sign in
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-6 text-xs text-emerald-100">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> Free forever
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> No credit card
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" /> Live in 10 min
                </span>
              </div>
            </div>

            {/* Hero preview card */}
            <div className="lg:col-span-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-400/30 to-sky-400/30 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative bg-white rounded-3xl p-5 shadow-2xl text-gray-900 transform sm:rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-sm">Your Agency Name</p>
                      <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-2 h-2" /> VERIFIED
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> Your City, India
                    </p>
                  </div>
                  <Share2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <Compass className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <p className="text-lg font-extrabold text-emerald-700">12</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">
                      Tours
                    </p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-3 text-center">
                    <Bed className="w-4 h-4 mx-auto text-sky-600 mb-1" />
                    <p className="text-lg font-extrabold text-sky-700">5</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">
                      Stays
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <Car className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <p className="text-lg font-extrabold text-amber-700">8</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500">
                      Vehicles
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-gray-500 inline-flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  transrentals.in/agent/your-slug
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mountain divider */}
        <svg
          className="absolute bottom-0 left-0 w-full h-16 sm:h-24 text-white"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,120 L0,80 L120,40 L240,75 L360,30 L480,70 L600,20 L720,65 L840,35 L960,75 L1080,25 L1200,60 L1320,40 L1440,80 L1440,120 Z"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M0,120 L0,95 L100,70 L220,90 L340,55 L460,85 L580,50 L700,90 L820,60 L940,95 L1060,55 L1180,85 L1300,65 L1440,95 L1440,120 Z"
          />
        </svg>
      </section>

      {/* ── Stats strip ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-emerald-900/5 border border-emerald-100 px-4 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            <Star className="w-3 h-3" /> Why TransRentals
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Everything you need to run a travel agency
          </h2>
          <p className="text-gray-600 mt-3">
            Built for solo agents and growing agencies — replace 5 spreadsheets with one
            beautiful dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 rounded-2xl p-6 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                <b.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mt-4">{b.title}</h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gradient-to-b from-emerald-50/40 via-sky-50/40 to-amber-50/40 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Plane className="w-3 h-3" /> How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              From signup to first booking — in a day
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Connector line on desktop */}
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px border-t-2 border-dashed border-emerald-300"
              aria-hidden="true"
            />
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="relative bg-white rounded-2xl border border-emerald-100 p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg ring-4 ring-white">
                  <s.icon className="w-7 h-7" />
                </div>
                <p className="mt-4 inline-block text-[11px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Step {s.n}
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust band / live profile preview ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Globe className="w-3 h-3" /> Your shareable profile
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              A beautiful page customers actually want to share
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Every agent gets a polished public profile with hero, tours, stays, vehicles, and
              direct Call/WhatsApp buttons. No website needed — share one link and you&apos;re live.
            </p>
            <ul className="space-y-2.5 mt-6">
              {[
                'Share via WhatsApp, Instagram bio, business cards',
                'Mobile-first design that converts visitors into leads',
                'SEO-friendly URLs like /agent/your-name',
                'Verified badge after KYC for instant trust',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/travel-agent/register"
              className="inline-flex items-center gap-1.5 mt-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow"
            >
              Claim your profile <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Profile preview mock */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-amber-300/30 via-emerald-300/30 to-sky-300/30 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative bg-gradient-to-br from-sky-600 via-emerald-700 to-teal-900 rounded-3xl p-6 text-white shadow-2xl overflow-hidden">
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 15% 20%, #fbbf24 0%, transparent 35%), radial-gradient(circle at 85% 10%, #38bdf8 0%, transparent 40%)',
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED PARTNER
                  </span>
                  <h3 className="text-2xl font-extrabold mt-1">Your Agency</h3>
                  <p className="text-emerald-100 text-xs">Curated journeys by You</p>
                </div>
              </div>
              <div className="relative grid grid-cols-3 gap-2 mt-5">
                {[
                  { label: 'Tours', value: 12 },
                  { label: 'Stays', value: 5 },
                  { label: 'Vehicles', value: 8 },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white/15 backdrop-blur border border-white/30 rounded-xl px-3 py-3 text-center"
                  >
                    <p className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
                      {s.label}
                    </p>
                    <p className="text-2xl font-extrabold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white text-emerald-700 text-xs font-bold rounded-xl py-2 inline-flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </div>
                <div className="bg-white/15 backdrop-blur text-white text-xs font-bold rounded-xl py-2 inline-flex items-center justify-center gap-1.5 border border-white/30">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: 'Verified Partners', desc: 'KYC-checked agents' },
              { icon: Award, title: 'Hand-picked Trips', desc: 'Quality controlled' },
              { icon: Headphones, title: '24/7 Support', desc: 'Real humans, no bots' },
              { icon: IndianRupee, title: 'Free Forever', desc: 'No listing fee' },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.title}</p>
                  <p className="text-[11px] text-gray-500">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 transition-colors open:border-emerald-300"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-bold text-gray-900">
                <span>{f.q}</span>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-8 sm:p-14 text-white shadow-2xl shadow-orange-900/30">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 35%), radial-gradient(circle at 90% 10%, #ffffff 0%, transparent 30%)',
            }}
          />
          <div className="absolute -right-10 -top-10 text-white/10">
            <Plane className="w-56 h-56 -rotate-12" />
          </div>
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3" /> Ready to grow?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.1]">
              Your next 100 customers are already here.
            </h2>
            <p className="text-white/90 mt-4 text-lg">
              Sign up free in 2 minutes. List your first tour today, share your profile by
              evening — first lead by tomorrow.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/travel-agent/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-amber-50 font-extrabold text-base px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] transition-all"
              >
                Join free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/travel-agent/login"
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/40 text-white font-bold text-base px-6 py-3.5 rounded-xl"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
