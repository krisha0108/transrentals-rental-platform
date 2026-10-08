'use client';

import React, { useState, useEffect } from 'react';
import { TravelAgentSidebar } from './TravelAgentSidebar';
import {
  Menu,
  Loader2,
  Lock,
  CheckCircle2,
  ArrowRight,
  X,
  FileText,
  Building2,
  DollarSign,
  Bell,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast';
import Link from 'next/link';
import { TravelAgentVerificationContext } from '@/contexts/TravelAgentVerificationContext';
import { HelpBotWidget } from '../HelpBotWidget';
import { TravelAgentPageHeaderProvider, useTravelAgentPageHeaderContext } from '@/hooks/useTravelAgentPageHeader';

interface TravelAgentLayoutProps {
  children: React.ReactNode;
}

// Verification modal — shows steps to unlock full features
function VerificationModal({
  onClose,
  docs,
  bankAccounts,
  profileComplete,
}: {
  onClose: () => void;
  docs: number;
  bankAccounts: number;
  profileComplete: boolean;
}) {
  const steps = [
    {
      icon: Building2,
      title: 'Complete Profile',
      desc: 'Agency address, GST/PAN, owner details',
      done: profileComplete,
      href: '/travel-agent/profile',
      label: profileComplete ? 'View Profile' : 'Complete Now',
    },
    {
      icon: FileText,
      title: 'Upload Documents',
      desc: 'GST, PAN, agency registration',
      done: docs > 0,
      href: '/travel-agent/documents',
      label: docs > 0 ? 'View Documents' : 'Upload Now',
    },
    {
      icon: DollarSign,
      title: 'Add Bank Details',
      desc: 'For receiving customer payouts',
      done: bankAccounts > 0,
      href: '/travel-agent/bank-details',
      label: bankAccounts > 0 ? 'View Details' : 'Add Now',
    },
  ];

  const nextStep = steps.find((s) => !s.done);
  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Get Verified</h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Complete {3 - completedCount} more step
                  {3 - completedCount !== 1 ? 's' : ''} to unlock all features
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-emerald-100 mb-1.5">
              <span>{completedCount} of 3 steps completed</span>
              <span className="font-bold text-white">
                {Math.round((completedCount / 3) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isNext = !step.done && steps.slice(0, idx).every((s) => s.done);
            return (
              <div
                key={step.title}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                  step.done
                    ? 'bg-emerald-50 border-emerald-200'
                    : isNext
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    step.done
                      ? 'bg-emerald-100'
                      : isNext
                        ? 'bg-emerald-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Icon
                      className={`w-4 h-4 ${
                        isNext ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      step.done
                        ? 'text-emerald-800 line-through'
                        : isNext
                          ? 'text-emerald-800'
                          : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                </div>
                {step.done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {isNext && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    NEXT
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          {nextStep ? (
            <Link
              href={nextStep.href}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl transition-colors"
            >
              {nextStep.label} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-center text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl py-3 px-4">
              All steps done — your account is{' '}
              <strong className="text-amber-700">under review</strong>. Approval takes 1–2 business
              days.
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3"
          >
            Continue exploring in soft-access mode
          </button>
        </div>
      </div>
    </div>
  );
}

// Shared sticky top bar — every page registers its title via
// useTravelAgentPageHeader() instead of rendering its own header block, so
// the title style (and the notification bell next to it) stays identical
// across the whole travel-agent side. Mirrors the manager layout's top bar.
function TravelAgentTopBar({
  onOpenSidebar,
  unreadNotifCount,
}: {
  onOpenSidebar: () => void;
  unreadNotifCount: number;
}) {
  const { header } = useTravelAgentPageHeaderContext();

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        {header?.leading}
        {header && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{header.title}</h1>
            {header.subtitle && (
              <p className="text-xs text-gray-500 truncate hidden sm:block">{header.subtitle}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {header?.action}
        <Link href="/travel-agent/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
              {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

export function TravelAgentLayout({ children }: TravelAgentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [verificationCounts, setVerificationCounts] = useState({
    docs: 0,
    bankAccounts: 0,
    profileComplete: false,
  });
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Drives the bell on the mobile sticky header — the sidebar's own copy of
  // this badge is hidden behind the hamburger menu until it's opened, so
  // mobile needs its own always-visible indicator (same split as vendor's layout).
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/travel-agent/notifications/unread-count', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadNotifCount(Number(data?.count) || 0);
      } catch { /* network blip — keep last value */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/travel-agent/profile');
          if (res.ok) {
            const data = await res.json();
            setAgentStatus(data.status);
            setVerificationCounts({
              docs: data.documentsCount || 0,
              bankAccounts: data.bankAccountsCount || 0,
              // GST is intentionally excluded — it's an optional field on the
              // profile page (no asterisk) and already null for most agents,
              // while agencyName/ownerName/address/city are all required and
              // collected at registration, so requiring GST here permanently
              // stuck the "Profile" step at incomplete for agents who'd
              // already filled in everything the form actually asks for.
              profileComplete: !!(data.agencyName && data.ownerName && data.address && data.city),
            });
          } else {
            setAgentStatus((session?.user as any)?.status || null);
          }
        } catch {
          setAgentStatus((session?.user as any)?.status || null);
        } finally {
          setStatusLoading(false);
        }
      }
    };
    fetchAgentStatus();
  }, [status, session]);

  const isApproved = agentStatus === 'APPROVED';

  const contextValue = {
    isApproved,
    travelAgentStatus: agentStatus,
    openVerificationModal: () => setShowVerificationModal(true),
  };

  if (status === 'loading' || (status === 'authenticated' && statusLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/travel-agent/login');
    return null;
  }

  return (
    <TravelAgentVerificationContext.Provider value={contextValue}>
      <ToastProvider>
        <TravelAgentPageHeaderProvider>
        <div className="min-h-screen bg-[#f5f6fa]">
          <TravelAgentSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            agentStatus={agentStatus ?? undefined}
          />

          <div className="lg:pl-64">
            <TravelAgentTopBar onOpenSidebar={() => setSidebarOpen(true)} unreadNotifCount={unreadNotifCount} />

            {/* Single combined verification banner — replaces what used to be
                three separately-stacked full-width strips (Soft Access Mode +
                Bank details + Documents) saying overlapping things. Hidden on
                the profile page itself, same as the vendor layout hides its
                own address banner on /vendor/profile — you're already there
                to fix it, the banner is just noise on that page. */}
            {!isApproved && !statusLoading && pathname !== '/travel-agent/profile' && (
              <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-amber-900">
                        Complete verification to unlock full access
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 hidden sm:block">
                        Public lead-capture & customer-facing booking links unlock once approved.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden md:flex items-center gap-1.5">
                      {!verificationCounts.profileComplete && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-white/70 border border-amber-200 px-2 py-1 rounded-full">
                          <Building2 className="w-3 h-3" /> Profile
                        </span>
                      )}
                      {verificationCounts.docs === 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-white/70 border border-amber-200 px-2 py-1 rounded-full">
                          <FileText className="w-3 h-3" /> Documents
                        </span>
                      )}
                      {verificationCounts.bankAccounts === 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-white/70 border border-amber-200 px-2 py-1 rounded-full">
                          <DollarSign className="w-3 h-3" /> Bank Details
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowVerificationModal(true)}
                      className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      Get Verified <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <main className="p-4 lg:p-6">{children}</main>
          </div>

          {showVerificationModal && (
            <VerificationModal
              onClose={() => setShowVerificationModal(false)}
              docs={verificationCounts.docs}
              bankAccounts={verificationCounts.bankAccounts}
              profileComplete={verificationCounts.profileComplete}
            />
          )}

          <HelpBotWidget />
        </div>
        </TravelAgentPageHeaderProvider>
      </ToastProvider>
    </TravelAgentVerificationContext.Provider>
  );
}
