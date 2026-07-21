'use client';

import { useState } from 'react';
import {
  CheckCircle2, FileText, MapPin, Wrench, Clock, ArrowRight,
  Mail, ChevronRight, Lock, Eye, Users, Truck,
  IndianRupee, X, TrendingUp, Zap, AlertCircle, Package,
} from 'lucide-react';
import Link from 'next/link';

interface VendorOnboardingProps {
  vendorStatus: string;
  documentsCount: number;
  locationRequestsCount: number;
  serviceRequestsCount: number;
}

// Static KPI color maps (avoids Tailwind purge issues with dynamic class names)
const KPI_COLORS: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-500'    },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-500'  },
  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500'   },
};

const FEATURE_COLORS: Record<string, { bg: string; icon: string }> = {
  blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600'    },
  violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600'  },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
};

// Fake preview bookings to create urgency
const PREVIEW_BOOKINGS = [
  { id: 'BK001', emoji: '🚗', service: 'Car Rental',      customer: 'Rahul S.', amount: '₹4,200', date: 'Today, 2:30 PM',  location: 'Connaught Place, Delhi',  status: 'NEW',     statusColor: 'bg-blue-100 text-blue-700'   },
  { id: 'BK002', emoji: '🏍️', service: 'Bike Rental',    customer: 'Priya M.', amount: '₹1,800', date: 'Today, 11:00 AM', location: 'Bandra West, Mumbai',     status: 'NEW',     statusColor: 'bg-blue-100 text-blue-700'   },
  { id: 'BK003', emoji: '🚚', service: 'Truck Transport', customer: 'Amit K.', amount: '₹8,500', date: 'Yesterday',        location: 'Koramangala, Bangalore',  status: 'PENDING', statusColor: 'bg-amber-100 text-amber-700' },
];
const LOCKED_COUNT = 9;

// ── Lock Popup ──
function LockPopup({ steps, onClose }: { steps: any[]; onClose: () => void }) {
  const currentStep = steps.find(s => s.status === 'active') || steps[0];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">Verification Required</h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          This action is locked until your account is verified. Complete onboarding and our team will approve you within 1–2 business days.
        </p>

        <div className="space-y-2.5 mb-5">
          {steps.map(step => (
            <div key={step.id} className="flex items-center gap-3">
              {step.status === 'done'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${step.status === 'active' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {step.status === 'active' && <div className="w-full h-full rounded-full scale-50 bg-blue-500" />}
                  </div>
              }
              <span className={`text-sm ${
                step.status === 'done'   ? 'text-gray-400 line-through' :
                step.status === 'active' ? 'text-blue-700 font-semibold' :
                'text-gray-400'
              }`}>{step.title}</span>
              {step.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
            </div>
          ))}
        </div>

        {currentStep && (
          <Link
            href={currentStep.action.href}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
          >
            {currentStep.action.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VendorOnboarding({
  vendorStatus,
  documentsCount,
  locationRequestsCount,
  serviceRequestsCount,
}: VendorOnboardingProps) {
  const [showLockPopup, setShowLockPopup] = useState(false);

  const steps = [
    {
      id: 'documents',
      step: 1,
      icon: FileText,
      title: 'Upload Documents',
      shortTitle: 'Documents',
      action: { label: documentsCount > 0 ? 'View Documents' : 'Upload Now', href: '/vendor/documents' },
      status: (documentsCount > 0 ? 'done' : 'active') as 'done' | 'active' | 'locked',
    },
    {
      id: 'locations',
      step: 2,
      icon: MapPin,
      title: 'Request Locations',
      shortTitle: 'Locations',
      action: { label: locationRequestsCount > 0 ? 'View Requests' : 'Request Now', href: '/vendor/locations' },
      status: (locationRequestsCount > 0 ? 'done' : documentsCount > 0 ? 'active' : 'locked') as 'done' | 'active' | 'locked',
    },
    {
      id: 'services',
      step: 3,
      icon: Wrench,
      title: 'Request Services',
      shortTitle: 'Services',
      action: { label: serviceRequestsCount > 0 ? 'View Requests' : 'Request Now', href: '/vendor/services' },
      status: (serviceRequestsCount > 0 ? 'done' : locationRequestsCount > 0 ? 'active' : 'locked') as 'done' | 'active' | 'locked',
    },
  ];

  const completedCount = steps.filter(s => s.status === 'done').length;
  const progressPct    = (completedCount / steps.length) * 100;
  const allDone        = completedCount === steps.length;
  const activeStep     = steps.find(s => s.status === 'active') || steps[0];

  return (
    <div className="space-y-5">

      {showLockPopup && <LockPopup steps={steps} onClose={() => setShowLockPopup(false)} />}

      {/* ──────────────── 1. ONBOARDING PROGRESS STRIP ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Blue header bar */}
        <div className={`px-5 py-3 ${allDone ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {allDone
                ? <Clock className="w-4 h-4 text-white/90" />
                : <AlertCircle className="w-4 h-4 text-blue-200" />
              }
              <span className="text-sm font-bold text-white">
                {allDone ? 'All steps done — account is under review' : 'Complete verification to unlock full access'}
              </span>
            </div>
            <span className="text-xs font-bold text-white/70 shrink-0">{completedCount}/3 done</span>
          </div>
          {!allDone && (
            <p className="text-xs text-blue-100/90 mt-1 pl-6">
              Finish all 3 steps — Documents, Locations &amp; Services — to become an <span className="font-semibold text-white">official TransRentals vendor</span>.
            </p>
          )}
        </div>

        <div className="px-5 py-4">
          {/* Step pills */}
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((step, idx) => {
              const isDone    = step.status === 'done';
              const isActive  = step.status === 'active';
              const isLastStep = idx === steps.length - 1;
              return (
                <div key={step.id} className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className={`relative flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border text-xs font-semibold min-w-0 ${
                    isDone   ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    isActive ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-200' :
                               'bg-gray-50 border-gray-200 text-gray-400'
                  }`}>
                    {isDone
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`} />
                    }
                    <span className="truncate">{step.shortTitle}</span>
                    {isLastStep && !isDone && (
                      <span className={`absolute -top-2 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        Final Step
                      </span>
                    )}
                  </div>
                  {idx < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Progress bar + continue CTA */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(progressPct)}% complete</p>
            </div>
            {!allDone && (
              <Link
                href={activeStep.action.href}
                className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                {activeStep.id === 'services' ? 'Finish Final Step' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {!allDone && activeStep.id === 'services' && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3 flex items-center gap-1.5">
              🎉 This is your final step — complete it and become an <span className="font-semibold">official TransRentals vendor</span>!
            </p>
          )}
        </div>
      </div>

      {/* ──────────────── 2. URGENCY BANNER ──────────────── */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-md shadow-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {LOCKED_COUNT} booking requests are waiting for you!
            </p>
            <p className="text-orange-100 text-xs mt-0.5">Complete verification to start accepting and earning.</p>
          </div>
        </div>
        <button
          onClick={() => setShowLockPopup(true)}
          className="shrink-0 flex items-center gap-1.5 bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" /> Unlock
        </button>
      </div>

      {/* ──────────────── 3. LOCKED KPI CARDS ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: 'Monthly Revenue', icon: IndianRupee, color: 'emerald' },
          { label: 'Total Bookings',  icon: Package,    color: 'blue'    },
          { label: 'Services',        icon: Wrench,     color: 'violet'  },
          { label: 'Locations',       icon: MapPin,     color: 'amber'   },
        ] as const).map(({ label, icon: Icon, color }) => {
          const c = KPI_COLORS[color];
          return (
            <button
              key={label}
              onClick={() => setShowLockPopup(true)}
              className="relative bg-white rounded-2xl p-4 border border-gray-200 text-left group hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
            >
              {/* Hover reveal */}
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl z-10">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                  <Lock className="w-3.5 h-3.5" /> Unlock
                </span>
              </div>
              <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${c.icon}`} />
              </div>
              <p className="text-xl font-extrabold text-gray-200 blur-sm select-none">—</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <Lock className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-200" />
            </button>
          );
        })}
      </div>

      {/* ──────────────── 4. BOOKINGS PREVIEW ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Booking Requests</h3>
            <p className="text-xs text-gray-400 mt-0.5">Preview only — actions locked until verified</p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
            {LOCKED_COUNT} waiting
          </span>
        </div>

        {/* 3 visible preview rows */}
        <div className="divide-y divide-gray-50">
          {PREVIEW_BOOKINGS.map(booking => (
            <div key={booking.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-base shrink-0">
                {booking.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 truncate">{booking.service}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${booking.statusColor}`}>{booking.status}</span>
                </div>
                <p className="text-xs text-gray-400">{booking.customer} · {booking.date}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {booking.location}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-800 shrink-0">{booking.amount}</p>
              {/* Locked action button */}
              <button
                onClick={() => setShowLockPopup(true)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Eye className="w-3 h-3" /> View
              </button>
            </div>
          ))}
        </div>

        {/* Blurred locked rows + unlock CTA */}
        <div className="relative">
          <div className="pointer-events-none select-none">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4" style={{ opacity: i === 0 ? 0.35 : 0.15, filter: 'blur(2px)' }}>
                <div className={`w-9 h-9 rounded-xl ${i === 0 ? 'bg-purple-50' : 'bg-teal-50'} shrink-0`} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-7 w-14 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setShowLockPopup(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-colors"
            >
              <Lock className="w-4 h-4" />
              Unlock {LOCKED_COUNT - PREVIEW_BOOKINGS.length} more bookings
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────── 5. FEATURE PREVIEW CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          {
            icon: Truck,
            color: 'blue',
            title: 'Fleet Management',
            description: 'Add vehicles, set pricing, manage availability and documents.',
            features: ['Add vehicles', 'Set availability', 'Upload documents'],
          },
          {
            icon: Users,
            color: 'violet',
            title: 'Staff Management',
            description: 'Add drivers and staff, manage shifts and attendance.',
            features: ['Add drivers', 'Track attendance', 'Assign bookings'],
          },
          {
            icon: TrendingUp,
            color: 'emerald',
            title: 'Earnings & Analytics',
            description: 'Track revenue, service-wise breakdown, and monthly trends.',
            features: ['Revenue charts', 'Top services', 'Growth trends'],
          },
        ] as const).map(({ icon: Icon, color, title, description, features }) => {
          const c = FEATURE_COLORS[color];
          return (
            <button
              key={title}
              onClick={() => setShowLockPopup(true)}
              className="relative bg-white rounded-2xl border border-gray-200 p-5 text-left group hover:border-blue-200 hover:shadow-md transition-all overflow-hidden"
            >
              <Lock className="absolute top-4 right-4 w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
              <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5 pr-6">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
              <div className="space-y-1.5">
                {features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Verify to unlock this feature
              </p>
            </button>
          );
        })}
      </div>

      {/* ──────────────── 6. UNDER REVIEW NOTICE (when all steps done) ──────────────── */}
      {allDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Account is under review — we'll notify you by email</p>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Our team is reviewing your documents, locations, and service requests. Approval usually takes 1–2 business days.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Documents submitted', 'Locations requested', 'Services requested'].map(item => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-amber-600" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── 7. HELP STRIP ──────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Need help with onboarding?</p>
            <p className="text-xs text-gray-500">Our team responds within a few hours on business days.</p>
          </div>
        </div>
        <Link
          href="/vendor/support"
          className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
        >
          Contact Support <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
