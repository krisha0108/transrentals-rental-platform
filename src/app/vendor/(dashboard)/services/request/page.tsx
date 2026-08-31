'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  Square,
  CheckSquare,
  Send,
  Trash2,
  XCircle,
  AlertTriangle,
  Layers,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  flowType: string;
  other_services: Service[];
}

export default function RequestServicePage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [experience, setExperience] = useState('');
  const { hasAddress, openVerificationModal } = useVendorVerification();

  // Remove / Withdraw state
  const [removeModal, setRemoveModal] = useState<{
    open: boolean;
    serviceId: string;
    serviceName: string;
    type: 'request' | 'approved';
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/vendor/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.allServices || []);
        setApprovedServiceIds(data.approvedServiceIds || []);
        setPendingRequestIds(
          (data.requests || [])
            .filter((r: any) => r.status === 'PENDING')
            .map((r: any) => r.serviceId)
        );
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const getServiceStatus = (serviceId: string) => {
    if (approvedServiceIds.includes(serviceId)) return 'approved';
    if (pendingRequestIds.includes(serviceId)) return 'pending';
    return 'available';
  };

  const toggleServiceSelection = (serviceId: string) => {
    if (getServiceStatus(serviceId) !== 'available') return;
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Select all available parent services
  const handleSelectAll = () => {
    const availableIds = filteredServices
      .filter((s) => getServiceStatus(s.id) === 'available')
      .map((s) => s.id);
    const allSelected = availableIds.every((id) => selectedServices.includes(id));
    if (allSelected) {
      setSelectedServices((prev) => prev.filter((id) => !availableIds.includes(id)));
    } else {
      setSelectedServices((prev) => [...new Set([...prev, ...availableIds])]);
    }
  };

  const handleBulkRequest = async () => {
    if (selectedServices.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: selectedServices, message, experience }),
      });
      // Whether success or "already pending/approved" — close modal & refresh
      setShowConfirmModal(false);
      setSelectedServices([]);
      setMessage('');
      setExperience('');
      setLoading(true);
      await fetchServices();

      if (!res.ok) {
        const error = await res.json();
        const msg = error.error || '';
        // Only show alert for unexpected errors, not for "already pending/approved"
        if (!msg.toLowerCase().includes('already') && !msg.toLowerCase().includes('pending') && !msg.toLowerCase().includes('approved')) {
          alert(msg || 'Failed to submit requests');
        }
      }
    } catch {
      alert('Failed to submit requests');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeModal) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/vendor/services?serviceId=${removeModal.serviceId}&type=${removeModal.type}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setRemoveModal(null);
        await fetchServices();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove service');
      }
    } catch {
      alert('Failed to remove service');
    } finally {
      setRemoving(false);
    }
  };

  const openRemoveModal = (
    e: React.MouseEvent,
    serviceId: string,
    serviceName: string,
    type: 'request' | 'approved'
  ) => {
    e.stopPropagation();
    setRemoveModal({ open: true, serviceId, serviceName, type });
  };

  const filteredServices = search
    ? services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : services;

  const availableCount = filteredServices.filter((s) => getServiceStatus(s.id) === 'available').length;
  const allAvailableSelected =
    availableCount > 0 &&
    filteredServices
      .filter((s) => getServiceStatus(s.id) === 'available')
      .every((s) => selectedServices.includes(s.id));

  const getSelectedServiceNames = () =>
    services
      .filter((s) => selectedServices.includes(s.id))
      .map((s) => s.name);

  return (
    <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.08); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0; transform: translateY(20px) scale(0.6); }
          30% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-60px) scale(1.1); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0; transform: translateY(15px) scale(0.5); }
          40% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-50px) scale(0.9); }
        }
        @keyframes bubble-drift {
          0% { opacity: 0; transform: translate(0, 10px) scale(0.7); }
          35% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(15px, -40px) scale(1); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.15); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.3); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="w-full space-y-5">
        {/* Header — alive animated emerald */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 sm:px-6 py-4 sm:py-5"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857, #065f46, #059669)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 8s ease infinite',
          }}
        >
          {/* Filled floating bubbles (right side) */}
          <div className="absolute right-8 top-3 w-8 h-8 rounded-full bg-white/10" style={{ animation: 'float-slow 4s ease-in-out infinite' }} />
          <div className="absolute right-20 bottom-2 w-5 h-5 rounded-full bg-white/10" style={{ animation: 'float-rev 5s ease-in-out infinite' }} />
          <div className="absolute right-32 top-5 w-3 h-3 rounded-full bg-white/15" style={{ animation: 'float-slow 3.5s ease-in-out infinite 0.5s' }} />

          {/* Sparkle dots */}
          <div className="absolute right-14 top-2 w-1.5 h-1.5 rounded-full bg-white/60" style={{ animation: 'sparkle 2.5s ease-in-out infinite' }} />
          <div className="absolute right-28 bottom-3 w-1 h-1 rounded-full bg-white/50" style={{ animation: 'sparkle 3s ease-in-out infinite 0.8s' }} />
          <div className="absolute right-6 bottom-4 w-1 h-1 rounded-full bg-white/40" style={{ animation: 'sparkle 2s ease-in-out infinite 1.2s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-16 bottom-0 w-2 h-2 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 4s ease-out infinite' }} />
          <div className="absolute right-24 bottom-0 w-1.5 h-1.5 rounded-full bg-white/15" style={{ animation: 'bubble-rise-2 5s ease-out infinite 1s' }} />
          <div className="absolute right-10 bottom-0 w-2.5 h-2.5 rounded-full bg-white/10" style={{ animation: 'bubble-drift 4.5s ease-out infinite 0.5s' }} />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer-sweep 4s ease-in-out infinite' }} />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {/* Glassmorphic icon badge */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20"
                style={{ animation: 'bounce-in 0.7s ease-out' }}
              >
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div style={{ animation: 'slide-in-left 0.5s ease-out' }}>
                <h1 className="text-lg sm:text-xl font-bold text-white">Manage Services</h1>
                <p className="text-emerald-100 text-xs sm:text-sm">Request new services or remove ones you no longer offer</p>
              </div>
            </div>
            {selectedServices.length > 0 && (
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all hidden md:flex"
              >
                <Send className="w-4 h-4 mr-2" />
                Request Selected ({selectedServices.length})
              </Button>
            )}
          </div>
        </div>

        {/* Search + Select All */}
        <div
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3"
          style={{ animation: 'fade-up 0.5s ease-out 0.1s both' }}
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
              />
            </div>
            {availableCount > 0 && (
              <Button variant="outline" onClick={handleSelectAll} className="shrink-0 rounded-xl border-gray-200 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                <CheckCheck className="w-4 h-4 mr-2" />
                {allAvailableSelected ? 'Deselect All' : `Select All (${availableCount})`}
              </Button>
            )}
          </div>

          {selectedServices.length > 0 && (
            <div className="flex items-center justify-between bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 font-medium text-sm">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedServices([])}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Services List */}
        {loading ? (
          <div
            className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100"
            style={{ animation: 'fade-up 0.5s ease-out 0.2s both' }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center" style={{ animation: 'glow-emerald 2s ease-in-out infinite' }}>
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-48 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" style={{ animation: 'shimmer-sweep 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
              </div>
              <div className="h-3 w-32 bg-gray-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" style={{ animation: 'shimmer-sweep 1.5s ease-in-out infinite 0.3s', backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400"
            style={{ animation: 'fade-up 0.5s ease-out 0.2s both' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3" style={{ animation: 'float-slow 3s ease-in-out infinite' }}>
              <Layers className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-medium text-gray-500">No services found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service, index) => {
              const status = getServiceStatus(service.id);
              const isSelected = selectedServices.includes(service.id);
              const subCount = (service.other_services || []).length;

              return (
                <div
                  key={service.id}
                  onClick={() => toggleServiceSelection(service.id)}
                  className={`group relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 overflow-hidden ${
                    status === 'approved'
                      ? 'border-green-200 bg-green-50/50 cursor-default'
                      : status === 'pending'
                      ? 'border-yellow-200 bg-yellow-50/50 cursor-default'
                      : isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 cursor-pointer'
                      : 'border-transparent hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                  }`}
                  style={{ animation: `fade-up 0.4s ease-out ${0.15 + index * 0.06}s both` }}
                >
                  {/* Shimmer sweep on hover */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50/60 to-transparent" style={{ animation: 'shimmer-sweep 2s ease-in-out infinite' }} />
                  </div>

                  <div className="relative z-10 p-4 flex items-center gap-4">
                    {/* Checkbox / Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      status === 'approved' ? 'bg-green-100'
                      : status === 'pending' ? 'bg-yellow-100'
                      : isSelected ? 'bg-emerald-600 shadow-md shadow-emerald-200'
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200/50'
                    }`}>
                      {status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : status === 'pending' ? <Clock className="w-5 h-5 text-yellow-600" />
                      : isSelected ? <CheckSquare className="w-5 h-5 text-white" />
                      : <Square className="w-5 h-5 text-white" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {subCount > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {subCount} sub-service{subCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Approved</span>
                        )}
                        {status === 'pending' && (
                          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pending approval</span>
                        )}
                        {status === 'available' && !isSelected && (
                          <span className="text-xs text-gray-400">Click to select</span>
                        )}
                        {isSelected && (
                          <span className="text-xs font-semibold text-emerald-600">Selected</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {status === 'pending' && (
                        <button
                          onClick={(e) => openRemoveModal(e, service.id, service.name, 'request')}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-xl hover:bg-yellow-200 transition-all active:scale-[0.98]"
                        >
                          <XCircle className="w-4 h-4" />
                          Withdraw Request
                        </button>
                      )}
                      {status === 'approved' && (
                        <button
                          onClick={(e) => openRemoveModal(e, service.id, service.name, 'approved')}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-xl hover:bg-red-200 transition-all active:scale-[0.98]"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Service
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating button on mobile */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-6 right-6 md:hidden" style={{ animation: 'bounce-in 0.5s ease-out' }}>
            <Button
              size="lg"
              onClick={() => setShowConfirmModal(true)}
              className="rounded-full shadow-lg shadow-emerald-200/50 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <Send className="w-5 h-5 mr-2" />
              Request ({selectedServices.length})
            </Button>
          </div>
        )}

        {/* ── Request Confirm Modal ───────────────────────────────────── */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90dvh] overflow-y-auto shadow-2xl"
              style={{ animation: 'scale-in 0.3s ease-out' }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Request {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}
                </h2>
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">Selected Services</label>
                <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto border border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {getSelectedServiceNames().map((name, idx) => (
                      <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 block">
                    Why do you want to offer these services? (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your business..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 block">
                    Your experience (Optional)
                  </label>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="How many years of experience? Fleet size?"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="rounded-xl">Cancel</Button>
                  <Button
                    onClick={hasAddress ? handleBulkRequest : openVerificationModal}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 active:scale-[0.98] transition-all rounded-xl relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ animation: 'shimmer-sweep 2s ease-in-out infinite' }} />
                    <span className="relative z-10 flex items-center">
                      {submitting
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        : <><Send className="w-4 h-4 mr-2" />Submit Request</>}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Remove / Withdraw Confirm Modal ─────────────────────────── */}
        {removeModal?.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
              style={{ animation: 'scale-in 0.3s ease-out' }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  removeModal.type === 'approved' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`w-6 h-6 ${
                    removeModal.type === 'approved' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {removeModal.type === 'approved' ? 'Remove Service' : 'Withdraw Request'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {removeModal.type === 'approved'
                      ? <>Are you sure you want to remove <strong>{removeModal.serviceName}</strong>? You will stop receiving bookings for this service. You can request it again later.</>
                      : <>Are you sure you want to withdraw your request for <strong>{removeModal.serviceName}</strong>? The pending request will be cancelled.</>}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRemoveModal(null)} disabled={removing} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleRemoveConfirm}
                  disabled={removing}
                  className={`rounded-xl active:scale-[0.98] transition-all ${removeModal.type === 'approved' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  {removing
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    : removeModal.type === 'approved'
                    ? <><Trash2 className="w-4 h-4 mr-2" />Yes, Remove</>
                    : <><XCircle className="w-4 h-4 mr-2" />Yes, Withdraw</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
