'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, FileText, MapPin, Wrench, ArrowRight, Clock,
  Upload, Search, Send, ThumbsUp, Sparkles,
  Building2, Shield, Zap, Star, AlertCircle,
  HelpCircle, BookOpen, Lock, Car, Users, Wallet,
  ChevronRight, BarChart3, ArrowRightLeft, Compass, MessageSquare,
} from 'lucide-react';

interface VendorInfo {
  status: string;
  documentsCount: number;
  locationRequestsCount: number;
  serviceRequestsCount: number;
  businessName: string;
  ownerName: string;
}

export default function GetStartedPage() {
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendor/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setVendor(data); })
      .finally(() => setLoading(false));
  }, []);

  const isApproved  = vendor?.status === 'APPROVED';
  const docsDone    = (vendor?.documentsCount ?? 0) > 0;
  const locsDone    = (vendor?.locationRequestsCount ?? 0) > 0;
  const svcsDone    = (vendor?.serviceRequestsCount ?? 0) > 0;
  const doneCount   = [docsDone, locsDone, svcsDone].filter(Boolean).length;
  const pct         = isApproved ? 100 : Math.round((doneCount / 3) * 100);

  const steps = [
    {
      n: 1, icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      ring: 'ring-blue-100',
      badge: 'bg-blue-100 text-blue-700',
      tip: 'bg-blue-50 text-blue-700',
      cta: 'bg-blue-600 hover:bg-blue-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Upload Documents',
      sub: 'GST, PAN & business cert',
      desc: 'Upload your GST certificate, PAN card, and business registration. These verify your business identity with our team.',
      tip_text: 'Clear scans or photos (PDF or JPG). Text must be readable.',
      done: docsDone || isApproved,
      active: !docsDone && !isApproved,
      href: '/vendor/documents',
      label: docsDone ? 'View Documents' : 'Upload Now',
    },
    {
      n: 2, icon: MapPin,
      gradient: 'from-violet-500 to-violet-600',
      ring: 'ring-violet-100',
      badge: 'bg-violet-100 text-violet-700',
      tip: 'bg-violet-50 text-violet-700',
      cta: 'bg-violet-600 hover:bg-violet-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Request Locations',
      sub: 'Cities where you operate',
      desc: 'Tell us which cities you want to serve. You can request multiple locations and add more anytime after approval.',
      tip_text: 'Start with 2–3 cities where you already have vehicles or staff ready.',
      done: locsDone || isApproved,
      active: docsDone && !locsDone && !isApproved,
      href: '/vendor/locations/request',
      label: locsDone ? 'View Requests' : 'Request Now',
    },
    {
      n: 3, icon: Wrench,
      gradient: 'from-emerald-500 to-emerald-600',
      ring: 'ring-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
      tip: 'bg-emerald-50 text-emerald-700',
      cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      ctaDone: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      title: 'Request Services',
      sub: 'Bike, car, trucks & more',
      desc: 'Choose the services you want to offer — bike rentals, self-drive, car with driver, bus, packers, trucks, and more.',
      tip_text: 'Only request services you can fulfill right now. This speeds up approval.',
      done: svcsDone || isApproved,
      active: locsDone && !svcsDone && !isApproved,
      href: '/vendor/services/request',
      label: svcsDone ? 'View Requests' : 'Request Now',
    },
  ];

  const locationSteps = [
    { icon: Search,   color: 'bg-blue-500',    title: 'Open Location Request',     desc: 'Go to Services & Locations → Request Location in the sidebar.' },
    { icon: MapPin,   color: 'bg-violet-500',  title: 'Search & Select Cities',    desc: 'Search by city name and select all areas where you operate or plan to.' },
    { icon: Send,     color: 'bg-indigo-500',  title: 'Submit the Request',        desc: 'Admin reviews in 24–48 hrs. You\'ll get an email on approval.' },
    { icon: ThumbsUp, color: 'bg-emerald-500', title: 'Go Live in That City',      desc: 'Customers from approved cities can now find and book you instantly.' },
  ];

  const serviceSteps = [
    { icon: BookOpen,   color: 'bg-emerald-500', title: 'Open Service Request',   desc: 'Go to Services & Locations → Request Service in the sidebar.' },
    { icon: Search,     color: 'bg-teal-500',    title: 'Pick Your Services',     desc: 'Bike, Self-Drive, Car, Bus, Packers, Truck, Equipment, Luxury — choose all that apply.' },
    { icon: Building2,  color: 'bg-cyan-500',    title: 'Add Fleet & Experience', desc: 'Fleet size, years in business, certifications. More detail = faster approval.' },
    { icon: Send,       color: 'bg-blue-500',    title: 'Submit & Wait',          desc: 'Admin reviews within 24–48 hrs and notifies you via email.' },
    { icon: Zap,        color: 'bg-violet-500',  title: 'Start Getting Requests', desc: 'Customers searching in your city see your listing and send quote requests.' },
  ];

  const features = [
    { icon: '📥', title: 'Quote Requests',     desc: 'Receive and respond to customer trip requests with your pricing.' },
    { icon: '📅', title: 'Bookings',           desc: 'Accept and manage all confirmed bookings end-to-end.' },
    { icon: '🚗', title: 'Fleet Management',   desc: 'Add vehicles, set availability, upload documents.' },
    { icon: '👥', title: 'Staff & Drivers',    desc: 'Add drivers, track attendance, run payroll.' },
    { icon: '💰', title: 'Earnings & Payouts', desc: 'Track revenue and receive payouts directly to your bank.' },
    { icon: '🤝', title: 'P2P Marketplace',    desc: 'Share excess capacity and bookings with other vendors.' },
    { icon: '🗺️', title: 'Wander Tours',       desc: 'Create and sell curated travel packages to tourists.' },
    { icon: '🏢', title: 'B2B Corporate',      desc: 'Handle bulk corporate travel and long-term contracts.' },
    { icon: '📊', title: 'Analytics',          desc: 'Revenue trends, booking stats, and performance insights.' },
    { icon: '💬', title: 'Customer Chats',     desc: 'Communicate directly with customers from the dashboard.' },
    { icon: '🔗', title: 'Booking Links',      desc: 'Generate sharable links to take direct bookings anywhere.' },
    { icon: '🌐', title: 'Social Network',     desc: 'Connect with other vendors, share posts, grow your brand.' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ═══════════════════════════════════════════════
          HERO — full width
      ════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="relative px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">
                {isApproved ? 'Reference Guide' : 'Getting Started'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
              {isApproved ? 'How TransRentals Works' : 'Set Up Your Vendor Account'}
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xl">
              {isApproved
                ? 'A complete reference for managing services, locations, fleet, bookings, and more on TransRentals.'
                : 'Complete 3 quick steps to get verified and start receiving booking requests from customers across India.'}
            </p>
            {isApproved && (
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-4 py-2 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Account Verified & Active
              </div>
            )}
          </div>

          {/* Right: stats */}
          <div className="flex gap-4 shrink-0">
            {/* Progress ring */}
            {!isApproved && (
              <div className="flex flex-col items-center justify-center bg-white/10 border border-white/15 rounded-2xl px-8 py-6">
                <div className="relative w-24 h-24 mb-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke="url(#pg)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#6ee7b7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{pct}%</span>
                    <span className="text-[10px] text-blue-200">done</span>
                  </div>
                </div>
                <p className="text-xs text-blue-200 font-medium">{doneCount} of 3 steps complete</p>
              </div>
            )}

            {/* 3 quick stat pills */}
            <div className="flex flex-col gap-3 justify-center">
              {steps.map(s => (
                <div key={s.n} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${
                  s.done ? 'bg-emerald-500/15 border-emerald-400/30' : s.active ? 'bg-white/15 border-white/25' : 'bg-white/5 border-white/10'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    s.done ? 'bg-emerald-400' : s.active ? 'bg-white/30' : 'bg-white/10'
                  }`}>
                    {s.done
                      ? <CheckCircle2 className="w-3 h-3 text-white" />
                      : <span className="text-[9px] font-black text-white">{s.n}</span>
                    }
                  </div>
                  <span className={`text-xs font-semibold ${s.done ? 'text-emerald-300 line-through' : s.active ? 'text-white' : 'text-blue-300'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MAIN BODY — Left sticky panel + Right content
      ════════════════════════════════════════════════ */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT PANEL (sticky) ── */}
        <div className="w-72 xl:w-80 shrink-0 sticky top-6 space-y-4">

          {/* Verification card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-gray-800">
                {isApproved ? 'Verification Complete' : 'Verification Steps'}
              </span>
              {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
            </div>
            <div className="p-4 space-y-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.n}>
                    <div className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                      step.done   ? 'bg-emerald-50 border-emerald-200' :
                      step.active ? 'bg-blue-50 border-blue-200' :
                                   'bg-gray-50 border-gray-150 opacity-60'
                    }`}>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shrink-0`}>
                        {step.done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs font-bold truncate ${
                            step.done ? 'text-emerald-800' : step.active ? 'text-blue-800' : 'text-gray-500'
                          }`}>{step.title}</p>
                          {step.active && <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">NEXT</span>}
                          {step.done && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400">{step.sub}</p>
                      </div>
                    </div>
                    {/* Connector */}
                    {i < steps.length - 1 && (
                      <div className="ml-[22px] w-px h-2 bg-gray-200 mx-auto" />
                    )}
                  </div>
                );
              })}

              {!isApproved && (
                <Link
                  href={steps.find(s => !s.done)?.href ?? '/vendor/documents'}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-1"
                >
                  Continue Setup <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {!isApproved && doneCount === 3 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    <strong>Under review.</strong> Approval usually takes 1–2 business days.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-black text-gray-400 tracking-widest uppercase">Quick Links</span>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { icon: FileText,  href: '/vendor/documents',         label: 'My Documents',      color: 'text-blue-600 bg-blue-50' },
                { icon: MapPin,    href: '/vendor/locations/request',  label: 'Request Location',  color: 'text-violet-600 bg-violet-50' },
                { icon: Wrench,    href: '/vendor/services/request',   label: 'Request Service',   color: 'text-emerald-600 bg-emerald-50' },
                { icon: Car,       href: '/vendor/fleet',              label: 'Fleet Management',  color: 'text-orange-600 bg-orange-50' },
                { icon: Users,     href: '/vendor/staff',              label: 'Staff & Drivers',   color: 'text-pink-600 bg-pink-50' },
                { icon: HelpCircle,href: '/vendor/support',            label: 'Help & Support',    color: 'text-gray-600 bg-gray-100' },
              ].map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${link.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">{link.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-500" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Help card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">Need help?</p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Our support team responds within a few hours on business days.</p>
            <Link
              href="/vendor/support"
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl transition-colors"
            >
              Contact Support <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── How-to Guides — two columns side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Location guide */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Request Locations</p>
                    <p className="text-xs text-gray-400">How to get city access</p>
                  </div>
                </div>
                <Link href="/vendor/locations/request" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
                  Open <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="p-5 flex-1 space-y-3">
                {locationSteps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      {/* Step number + icon */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {i < locationSteps.length - 1 && <div className="w-px flex-1 bg-gray-150 mt-1 mb-0 min-h-[12px]" style={{ minHeight: 12, background: '#e5e7eb' }} />}
                      </div>
                      <div className="pb-3">
                        <span className="text-[9px] font-black text-gray-400 tracking-widest">STEP {i + 1}</span>
                        <p className="text-xs font-bold text-gray-900">{s.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    <strong>Tip:</strong> Request multiple cities at once. Start where you already have fleet or staff ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Service guide */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Request Services</p>
                    <p className="text-xs text-gray-400">How to get service approval</p>
                  </div>
                </div>
                <Link href="/vendor/services/request" className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors">
                  Open <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>

              <div className="p-5 flex-1 space-y-3">
                {serviceSteps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {i < serviceSteps.length - 1 && <div className="w-px mt-1 min-h-[12px]" style={{ minHeight: 12, background: '#e5e7eb' }} />}
                      </div>
                      <div className="pb-3">
                        <span className="text-[9px] font-black text-gray-400 tracking-widest">STEP {i + 1}</span>
                        <p className="text-xs font-bold text-gray-900">{s.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    <strong>Tip:</strong> Only request services you can fulfill right away. Quick responders rank higher in search.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── What unlocks — full width grid ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">What Unlocks After Approval</h2>
                <p className="text-xs text-gray-400">Everything you get access to once your account is verified</p>
              </div>
              {isApproved && (
                <span className="ml-auto text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full tracking-widest">
                  ALL UNLOCKED
                </span>
              )}
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {features.map(f => (
                <div
                  key={f.title}
                  className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
                    isApproved ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="absolute top-2.5 right-2.5">
                    {isApproved
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <Lock className="w-3 h-3 text-gray-300" />}
                  </div>
                  <span className="text-2xl mb-2">{f.icon}</span>
                  <p className={`text-xs font-bold mb-1 ${isApproved ? 'text-emerald-900' : 'text-gray-700'}`}>{f.title}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
