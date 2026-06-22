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
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui/toast';
import Link from 'next/link';
import { TravelAgentVerificationContext } from '@/contexts/TravelAgentVerificationContext';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
              profileComplete: !!(data.gstNumber && data.address && data.city),
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
        <div className="min-h-screen bg-[#f5f6fa]">
          <TravelAgentSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            agentStatus={agentStatus ?? undefined}
          />

          <div className="lg:pl-64">
            <div className="lg:hidden sticky top-0 z-30 bg-[#f5f6fa]/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white rounded-xl transition"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {!isApproved && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800 truncate">
                    <span className="font-bold">Soft Access Mode</span>
                    <span className="hidden sm:inline">
                      {' '}
                      — manage your own data freely. Public lead-capture & customer-facing booking
                      links unlock after verification.
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Get Verified <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Incomplete step alerts — shown until resolved */}
            {!statusLoading && verificationCounts.bankAccounts === 0 && (
              <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-800">
                    <span className="font-bold">Bank details missing</span>
                    <span className="hidden sm:inline"> — add your bank account to receive payouts from bookings.</span>
                  </p>
                </div>
                <Link
                  href="/travel-agent/bank-details"
                  className="shrink-0 text-xs font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 border border-red-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Add Now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {!statusLoading && verificationCounts.docs === 0 && (
              <div className="bg-orange-50 border-b border-orange-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <p className="text-sm text-orange-800">
                    <span className="font-bold">Address proof not uploaded</span>
                    <span className="hidden sm:inline"> — upload your identity & address documents to complete verification.</span>
                  </p>
                </div>
                <Link
                  href="/travel-agent/documents"
                  className="shrink-0 text-xs font-bold text-orange-700 hover:text-orange-900 bg-orange-100 hover:bg-orange-200 border border-orange-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  Upload Now <ArrowRight className="w-3 h-3" />
                </Link>
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
        </div>
      </ToastProvider>
    </TravelAgentVerificationContext.Provider>
  );
}
