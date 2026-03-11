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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
            <p className="text-gray-600">Request new services or remove ones you no longer offer</p>
          </div>
        </div>
        {selectedServices.length > 0 && (
          <Button onClick={() => setShowConfirmModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request Selected ({selectedServices.length})
          </Button>
        )}
      </div>

      {/* Search + Select All */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {availableCount > 0 && (
            <Button variant="outline" onClick={handleSelectAll} className="shrink-0">
              <CheckCheck className="w-4 h-4 mr-2" />
              {allAvailableSelected ? 'Deselect All' : `Select All (${availableCount})`}
            </Button>
          )}
        </div>

        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-700 font-medium text-sm">
              {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedServices([])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Services List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl shadow-sm border text-gray-400">
          <Layers className="w-8 h-8 mb-2" />
          <p className="text-sm">No services found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => {
            const status = getServiceStatus(service.id);
            const isSelected = selectedServices.includes(service.id);
            const subCount = (service.other_services || []).length;

            return (
              <div
                key={service.id}
                onClick={() => toggleServiceSelection(service.id)}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  status === 'approved'
                    ? 'border-green-200 bg-green-50 cursor-default'
                    : status === 'pending'
                    ? 'border-yellow-200 bg-yellow-50 cursor-default'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                    : 'border-transparent hover:border-blue-200 cursor-pointer'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Checkbox / Status icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    status === 'approved' ? 'bg-green-100'
                    : status === 'pending' ? 'bg-yellow-100'
                    : isSelected ? 'bg-blue-500'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : status === 'pending' ? <Clock className="w-5 h-5 text-yellow-600" />
                    : isSelected ? <CheckSquare className="w-5 h-5 text-white" />
                    : <Square className="w-5 h-5 text-white" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
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
                        <span className="text-xs font-semibold text-blue-600">Selected</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {status === 'pending' && (
                      <button
                        onClick={(e) => openRemoveModal(e, service.id, service.name, 'request')}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Withdraw Request
                      </button>
                    )}
                    {status === 'approved' && (
                      <button
                        onClick={(e) => openRemoveModal(e, service.id, service.name, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition"
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
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button size="lg" onClick={() => setShowConfirmModal(true)} className="rounded-full shadow-lg">
            <Send className="w-5 h-5 mr-2" />
            Request ({selectedServices.length})
          </Button>
        </div>
      )}

      {/* ── Request Confirm Modal ───────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Request {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Services:</label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {getSelectedServiceNames().map((name, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to offer these services? (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your business..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your experience (Optional)
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="How many years of experience? Fleet size?"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                <Button onClick={handleBulkRequest} disabled={submitting}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                    : <><Send className="w-4 h-4 mr-2" />Submit Request</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove / Withdraw Confirm Modal ─────────────────────────── */}
      {removeModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
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
              <Button variant="outline" onClick={() => setRemoveModal(null)} disabled={removing}>
                Cancel
              </Button>
              <Button
                onClick={handleRemoveConfirm}
                disabled={removing}
                className={removeModal.type === 'approved' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
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
  );
}
