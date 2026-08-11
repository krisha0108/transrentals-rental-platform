'use client';

import React, { useState, useEffect } from 'react';
import { VendorSidebar } from './VendorSidebar';
import { Menu, Loader2, AlertTriangle, Lock, CheckCircle2, ArrowRight, X, FileText, MapPin, Wrench, Home } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast';
import { useVendorWebNotifications } from '@/hooks/useVendorWebNotifications';
import { useVendorActivityHeartbeat } from '@/hooks/useVendorActivityHeartbeat';
import Link from 'next/link';
import { VendorVerificationContext } from '@/contexts/VendorVerificationContext';

interface VendorLayoutProps {
  children: React.ReactNode;
}

// Pages non-approved vendors CAN'T visit at all → redirected to dashboard
const allowedPagesForPending = [
  '/vendor/dashboard',
  '/vendor/documents',
  '/vendor/profile',
  '/vendor/bank-details',
  '/vendor/notifications',
  '/vendor/notification-settings',
  '/vendor/support',
  '/vendor/settings',
  '/vendor/services/request',
  '/vendor/locations/request',
  '/vendor/services',
  '/vendor/locations',
  '/vendor/media',
  '/vendor/get-started',
  // Preview pages — fully navigable but actions locked
  '/vendor/fleet',
  '/vendor/staff',
  '/vendor/direct-bookings',
  '/vendor/booking-links',
  '/vendor/financials',
  '/vendor/b2b-bookings',
  '/vendor/p2p',
  '/vendor/social',
  '/vendor/wander',
];

// Subset of the above — show "preview mode" banner on these
const previewPages = [
  '/vendor/fleet',
  '/vendor/staff',
  '/vendor/direct-bookings',
  '/vendor/booking-links',
  '/vendor/financials',
  '/vendor/b2b-bookings',
  '/vendor/p2p',
  '/vendor/social',
  '/vendor/wander',
];

// ── Verification Modal ──
function VerificationModal({
  onClose,
  docs,
  locations,
  services,
  hasAddress,
}: {
  onClose: () => void;
  docs: number;
  locations: number;
  services: number;
  hasAddress: boolean;
}) {
  const steps = [
    {
      icon: Home,
      title: 'Add Business Address',
      desc: 'Your shop/office address',
      done: hasAddress,
      href: '/vendor/profile',
      label: hasAddress ? 'View Address' : 'Add Now',
    },
    {
      icon: FileText,
      title: 'Upload Documents',
      desc: 'GST, PAN, and business certificates',
      done: docs > 0,
      href: '/vendor/documents',
      label: docs > 0 ? 'View Documents' : 'Upload Now',
    },
    {
      icon: MapPin,
      title: 'Request Locations',
      desc: 'Areas where you want to operate',
      done: locations > 0,
      href: '/vendor/locations/request',
      label: locations > 0 ? 'View Requests' : 'Request Now',
    },
    {
      icon: Wrench,
      title: 'Request Services',
      desc: 'Services you want to offer',
      done: services > 0,
      href: '/vendor/services/request',
      label: services > 0 ? 'View Requests' : 'Request Now',
    },
  ];

  const nextStep = steps.find(s => !s.done);
  const completedCount = steps.filter(s => s.done).length;
  const totalSteps = steps.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Verification Required</h3>
                <p className="text-blue-200 text-xs mt-0.5">Complete {totalSteps - completedCount} more step{totalSteps - completedCount !== 1 ? 's' : ''} to unlock this action</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1.5">
              <span>{completedCount} of {totalSteps} steps completed</span>
              <span className="font-bold text-white">{Math.round((completedCount / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isNext = !step.done && steps.slice(0, idx).every(s => s.done);
            return (
              <div
                key={step.title}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                  step.done  ? 'bg-emerald-50 border-emerald-200' :
                  isNext     ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' :
                               'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  step.done  ? 'bg-emerald-100' :
                  isNext     ? 'bg-blue-100'    :
                               'bg-gray-100'
                }`}>
                  {step.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <Icon className={`w-4.5 h-4.5 ${isNext ? 'text-blue-600' : 'text-gray-400'} w-4 h-4`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'text-emerald-800 line-through' : isNext ? 'text-blue-800' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                </div>
                {step.done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {isNext && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">NEXT</span>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          {nextStep ? (
            <Link
              href={nextStep.href}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
            >
              {nextStep.label} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-center text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl py-3 px-4">
              All steps done — your account is <strong className="text-amber-700">under review</strong>. Approval takes 1–2 business days.
            </div>
          )}
          <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors">
            Continue exploring in preview mode
          </button>
        </div>
      </div>
    </div>
  );
}

export function VendorLayout({ children }: VendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [approvedServiceSlugs, setApprovedServiceSlugs] = useState<string[]>([]);
  const [onboardingCounts, setOnboardingCounts] = useState({ docs: 0, locations: 0, services: 0 });
  const [hasAddress, setHasAddress] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useVendorWebNotifications();
  useVendorActivityHeartbeat(status === 'authenticated');

  useEffect(() => {
    const vendorId = (session?.user as any)?.id || (session?.user as any)?.email || 'unknown';
    const CACHE_KEY = `vendor_profile_cache_${vendorId}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const fetchVendorStatus = async () => {
      if (status === 'authenticated') {
        // Try sessionStorage cache first
        try {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL) {
              setVendorStatus(data.status);
              setApprovedServiceIds(data.approvedServiceIds || []);
              setApprovedServiceSlugs(data.approvedServiceSlugs || []);
              setOnboardingCounts({
                docs:      data.documentsCount        || 0,
                locations: data.locationRequestsCount || 0,
                services:  data.serviceRequestsCount  || 0,
              });
              setHasAddress(!!(data.address && String(data.address).trim()));
              setStatusLoading(false);
              return;
            }
          }
        } catch {
          // sessionStorage not available — fall through to fetch
        }

        // Cache miss or expired — fetch from API
        try {
          const res = await fetch('/api/vendor/profile');
          if (res.ok) {
            const data = await res.json();
            setVendorStatus(data.status);
            setApprovedServiceIds(data.approvedServiceIds || []);
            setApprovedServiceSlugs(data.approvedServiceSlugs || []);
            setOnboardingCounts({
              docs:      data.documentsCount        || 0,
              locations: data.locationRequestsCount || 0,
              services:  data.serviceRequestsCount  || 0,
            });
            setHasAddress(!!(data.address && String(data.address).trim()));
            // Save to cache
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
            } catch { /* ignore quota errors */ }
          } else {
            setVendorStatus((session?.user as any)?.status);
          }
        } catch {
          setVendorStatus((session?.user as any)?.status);
        } finally {
          setStatusLoading(false);
        }
      }
    };
    fetchVendorStatus();
  }, [status, session]);

  const isApproved = vendorStatus === 'APPROVED';

  // Redirect non-approved vendors away from pages not in allowedPagesForPending
  useEffect(() => {
    if (status === 'authenticated' && !statusLoading && !isApproved && pathname) {
      const isAllowed = allowedPagesForPending.some(
        page => pathname === page || pathname.startsWith(page + '/')
      );
      if (!isAllowed) {
        setShowAccessDenied(true);
        const timer = setTimeout(() => router.push('/vendor/dashboard'), 2000);
        return () => clearTimeout(timer);
      } else {
        setShowAccessDenied(false);
      }
    }
  }, [pathname, isApproved, status, statusLoading, router]);

  const isOnPreviewPage = !isApproved && previewPages.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );

  const contextValue = {
    isApproved,
    vendorStatus,
    hasAddress,
    openVerificationModal: () => setShowVerificationModal(true),
  };

  if (status === 'loading' || (status === 'authenticated' && statusLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/vendor/login');
    return null;
  }

  if (showAccessDenied) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          vendorStatus={vendorStatus ?? undefined}
          approvedServiceIds={approvedServiceIds}
          approvedServiceSlugs={approvedServiceSlugs}
        />
        <div className="lg:pl-64">
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">
                This feature is only available for approved vendors. Please complete your verification first.
              </p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VendorVerificationContext.Provider value={contextValue}>
      <ToastProvider>
        <div className="min-h-screen bg-[#f5f6fa]">
          <VendorSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            vendorStatus={vendorStatus ?? undefined}
            approvedServiceIds={approvedServiceIds}
            approvedServiceSlugs={approvedServiceSlugs}
          />

          <div className="lg:pl-64">
            {/* Mobile menu button */}
            <div className="lg:hidden sticky top-0 z-30 bg-[#f5f6fa]/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white rounded-xl transition">
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* ── Missing Address Banner ── */}
            {!statusLoading && !hasAddress && pathname !== '/vendor/profile' && (
              <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Home className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-800 truncate">
                    <span className="font-bold">Business address missing</span>
                    <span className="hidden sm:inline"> — add it to complete your profile and upload documents</span>
                  </p>
                </div>
                <Link
                  href="/vendor/profile"
                  className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Add Address <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* ── Preview Mode Banner ── */}
            {isOnPreviewPage && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800 truncate">
                    <span className="font-bold">Preview Mode</span>
                    <span className="hidden sm:inline"> — you can explore freely, but creating or saving is locked until your account is verified</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Complete Verification <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            <main className="p-4 lg:p-6">
              {children}
            </main>
          </div>

          {/* Verification Modal */}
          {showVerificationModal && (
            <VerificationModal
              onClose={() => setShowVerificationModal(false)}
              docs={onboardingCounts.docs}
              locations={onboardingCounts.locations}
              services={onboardingCounts.services}
              hasAddress={hasAddress}
            />
          )}
        </div>
      </ToastProvider>
    </VendorVerificationContext.Provider>
  );
}
