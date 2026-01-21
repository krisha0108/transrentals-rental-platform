'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Square,
  CheckSquare,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  flowType: string;
  other_services: Service[]; // API returns 'other_services' not 'children'
}

export default function RequestServicePage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [experience, setExperience] = useState('');

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

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getServiceStatus = (serviceId: string) => {
    if (approvedServiceIds.includes(serviceId)) return 'approved';
    if (pendingRequestIds.includes(serviceId)) return 'pending';
    return 'available';
  };

  const toggleServiceSelection = (serviceId: string) => {
    const status = getServiceStatus(serviceId);
    if (status !== 'available') return;

    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectAllSubServices = (parentService: Service) => {
    const children = parentService.other_services || [];
    const availableChildren = children.filter(
      (child) => getServiceStatus(child.id) === 'available'
    );
    const allSelected = availableChildren.every((child) =>
      selectedServices.includes(child.id)
    );

    if (allSelected) {
      // Deselect all
      setSelectedServices((prev) =>
        prev.filter((id) => !availableChildren.map((c) => c.id).includes(id))
      );
    } else {
      // Select all available
      setSelectedServices((prev) => [
        ...prev.filter((id) => !availableChildren.map((c) => c.id).includes(id)),
        ...availableChildren.map((c) => c.id),
      ]);
    }
  };

  const handleBulkRequest = async () => {
    if (selectedServices.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds: selectedServices,
          message,
          experience,
        }),
      });

      if (res.ok) {
        alert(`Successfully requested ${selectedServices.length} service(s)!`);
        setSelectedServices([]);
        setShowConfirmModal(false);
        setMessage('');
        setExperience('');
        router.push('/vendor/services');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit requests');
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('Failed to submit requests');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = search
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.other_services || []).some((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          )
      )
    : services;

  // Get selected service names for display
  const getSelectedServiceNames = () => {
    const names: string[] = [];
    services.forEach((parent) => {
      (parent.other_services || []).forEach((child) => {
        if (selectedServices.includes(child.id)) {
          names.push(`${child.name} (${parent.name})`);
        }
      });
      if (selectedServices.includes(parent.id)) {
        names.push(parent.name);
      }
    });
    return names;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Services</h1>
            <p className="text-gray-600">Select services you want to offer</p>
          </div>
        </div>
        {selectedServices.length > 0 && (
          <Button onClick={() => setShowConfirmModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request Selected ({selectedServices.length})
          </Button>
        )}
      </div>

      {/* Search & Selection Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-700 font-medium">
              {selectedServices.length} service(s) selected
            </span>
            <button
              onClick={() => setSelectedServices([])}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => {
            const isExpanded = expandedServices.includes(service.id);
            const children = service.other_services || [];
            const hasChildren = children.length > 0;
            const availableChildren = children.filter(
              (c) => getServiceStatus(c.id) === 'available'
            );
            const selectedChildrenCount = children.filter((c) =>
              selectedServices.includes(c.id)
            ).length;
            const allChildrenSelected =
              availableChildren.length > 0 &&
              availableChildren.every((c) => selectedServices.includes(c.id));

            // For services without children, check parent status
            const parentStatus = getServiceStatus(service.id);
            const isParentSelected = selectedServices.includes(service.id);

            return (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Service Header */}
                {hasChildren ? (
                  // Services with sub-services - parent is also selectable
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Parent Service Checkbox */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleServiceSelection(service.id);
                          }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition ${
                            parentStatus === 'approved'
                              ? 'bg-green-100 cursor-not-allowed'
                              : parentStatus === 'pending'
                              ? 'bg-yellow-100 cursor-not-allowed'
                              : isParentSelected
                              ? 'bg-blue-500'
                              : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:opacity-80'
                          }`}
                        >
                          {parentStatus === 'approved' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : parentStatus === 'pending' ? (
                            <Clock className="w-6 h-6 text-yellow-600" />
                          ) : isParentSelected ? (
                            <CheckSquare className="w-6 h-6 text-white" />
                          ) : (
                            <Layers className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {parentStatus === 'approved' ? (
                              <span className="text-green-600">Parent service approved</span>
                            ) : parentStatus === 'pending' ? (
                              <span className="text-yellow-600">Parent request pending</span>
                            ) : isParentSelected ? (
                              <span className="text-blue-600">Parent service selected</span>
                            ) : (
                              <span>Click icon to request parent service</span>
                            )}
                            <span className="mx-2">•</span>
                            {children.length} sub-services
                            {selectedChildrenCount > 0 && (
                              <span className="ml-1 text-blue-600">
                                ({selectedChildrenCount} selected)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {availableChildren.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllSubServices(service);
                            }}
                          >
                            {allChildrenSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        )}
                        <button
                          onClick={() => toggleExpand(service.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Info box about parent vs sub-service */}
                    {!isExpanded && children.length > 0 && (
                      <div className="mt-3 ml-16 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <strong>Tip:</strong> Request parent service ({service.name}) for all types,
                        or expand to select specific categories like {children.slice(0, 2).map(c => c.name).join(', ')}, etc.
                      </div>
                    )}
                  </div>
                ) : (
                  // Services without sub-services - directly selectable
                  <div
                    className={`p-4 flex items-center justify-between transition-all ${
                      parentStatus === 'approved'
                        ? 'bg-green-50 cursor-not-allowed'
                        : parentStatus === 'pending'
                        ? 'bg-yellow-50 cursor-not-allowed'
                        : isParentSelected
                        ? 'bg-blue-50 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => toggleServiceSelection(service.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        parentStatus === 'approved'
                          ? 'bg-green-100'
                          : parentStatus === 'pending'
                          ? 'bg-yellow-100'
                          : isParentSelected
                          ? 'bg-blue-100'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {parentStatus === 'approved' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : parentStatus === 'pending' ? (
                          <Clock className="w-6 h-6 text-yellow-600" />
                        ) : isParentSelected ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Layers className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {parentStatus === 'approved'
                            ? 'Already approved'
                            : parentStatus === 'pending'
                            ? 'Request pending'
                            : isParentSelected
                            ? 'Selected'
                            : 'Click to select'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-0.5">
                      {parentStatus === 'approved' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : parentStatus === 'pending' ? (
                        <Clock className="w-6 h-6 text-yellow-500" />
                      ) : isParentSelected ? (
                        <CheckSquare className="w-6 h-6 text-blue-500" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-services */}
                {hasChildren && isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {children.map((child) => {
                        const status = getServiceStatus(child.id);
                        const isSelected = selectedServices.includes(child.id);

                        return (
                          <div
                            key={child.id}
                            onClick={() => toggleServiceSelection(child.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              status === 'approved'
                                ? 'bg-green-50 border-green-200 cursor-not-allowed'
                                : status === 'pending'
                                ? 'bg-yellow-50 border-yellow-200 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-50 border-blue-500 cursor-pointer'
                                : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {status === 'approved' ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : status === 'pending' ? (
                                  <Clock className="w-5 h-5 text-yellow-500" />
                                ) : isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {child.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {status === 'approved'
                                    ? 'Already approved'
                                    : status === 'pending'
                                    ? 'Request pending'
                                    : 'Click to select'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {selectedServices.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            size="lg"
            onClick={() => setShowConfirmModal(true)}
            className="rounded-full shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Request ({selectedServices.length})
          </Button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Request {selectedServices.length} Service(s)
            </h2>

            {/* Selected Services List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Services:
              </label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {getSelectedServiceNames().map((name, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
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
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkRequest} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
