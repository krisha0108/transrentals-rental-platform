'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Car,
  Truck,
  Bike,
  Package,
  Crown,
  Power,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string | null;
  other_services?: Service[];
}

interface ServiceRequest {
  id: string;
  serviceId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string | null;
  rejectionReason: string | null;
  createdAt: string;
  services: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function VendorServicesPage() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [approvedServiceIds, setApprovedServiceIds] = useState<string[]>([]);
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/vendor/services');
      if (res.ok) {
        const data = await res.json();
        setAllServices(data.allServices || []);
        setApprovedServiceIds(data.approvedServiceIds || []);
        setActiveServiceIds(data.activeServiceIds || []);
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceActive = async (serviceId: string, currentlyActive: boolean) => {
    setTogglingId(serviceId);
    setMessage(null);
    try {
      const res = currentlyActive
        ? await fetch(`/api/vendor/services?serviceId=${serviceId}&type=approved`, { method: 'DELETE' })
        : await fetch('/api/vendor/services', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceId }),
          });
      const data = await res.json();
      if (res.ok) {
        setActiveServiceIds((prev) =>
          currentlyActive ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
        );
        // VendorLayout caches approvedServiceIds in sessionStorage for 5min
        // and only re-fetches on [status, session] change — a service toggle
        // on this page doesn't touch either, so without this the sidebar
        // keeps showing pre-toggle service links for up to 5 minutes.
        // Clearing the cache + firing this event makes VendorLayout refetch
        // immediately (see its vendor-approved-services-changed listener).
        try {
          Object.keys(sessionStorage)
            .filter((k) => k.startsWith('vendor_profile_cache_'))
            .forEach((k) => sessionStorage.removeItem(k));
        } catch {
          // sessionStorage unavailable — non-fatal, the event below still fires
        }
        window.dispatchEvent(new Event('vendor-approved-services-changed'));
        setMessage({ type: 'success', text: data.message || 'Updated' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update service' });
      }
    } catch (error) {
      console.error('Failed to toggle service:', error);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setTogglingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Get approved services with details (active AND inactive — a deactivated
  // service stays visible here with a toggle to switch it back on).
  // `allServices` only contains top-level categories from the API — a
  // vendor can also be approved for a specific sub-service/vehicle type
  // (e.g. "Activa" under Bike Rental) without the parent category itself
  // being approved, so this flattens in every sub-service too. Without
  // this, an approved sub-service silently never showed up here at all
  // (only in the Service Requests history below, with no way to toggle it).
  const flatServices: (Service & { parentName?: string })[] = allServices.flatMap((s) => [
    s,
    ...(s.other_services || []).map((sub) => ({ ...sub, parentName: s.name })),
  ]);
  const approvedServices = flatServices.filter(s => approvedServiceIds.includes(s.id));

  // Get service icon based on slug
  const getServiceIcon = (slug: string) => {
    if (slug?.includes('car') || slug?.includes('chauffeur')) return <Car className="w-5 h-5" />;
    if (slug?.includes('truck') || slug?.includes('packers')) return <Truck className="w-5 h-5" />;
    if (slug?.includes('bike')) return <Bike className="w-5 h-5" />;
    if (slug?.includes('luxury')) return <Crown className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
      default:
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
    }
  };

  return (
    <div className="min-h-dvh bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
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
          50% { transform: translateY(-10px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0; transform: translateY(0) scale(0.3); }
          40% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-100px) scale(1); }
        }
        @keyframes bubble-drift {
          0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translate(20px, -60px) scale(1.1); }
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
          0%, 100% { box-shadow: 0 0 8px rgba(5, 150, 105, 0.2); }
          50% { box-shadow: 0 0 20px rgba(5, 150, 105, 0.4); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out both;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out both;
        }
        .animate-bounce-in {
          animation: bounce-in 0.7s ease-out both;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-rev {
          animation: float-rev 5s ease-in-out infinite;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out both;
        }
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full space-y-6">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-8 animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, #059669, #047857, #0d9488, #059669)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 8s ease infinite, fade-up 0.6s ease-out both',
          }}
        >
          {/* Filled floating bubbles */}
          <div className="absolute right-8 top-4 w-20 h-20 rounded-full bg-white/10" style={{ animation: 'float-slow 4s ease-in-out infinite' }} />
          <div className="absolute right-28 bottom-3 w-12 h-12 rounded-full bg-white/10" style={{ animation: 'float-rev 5s ease-in-out infinite' }} />
          <div className="absolute right-48 top-6 w-8 h-8 rounded-full bg-white/5" style={{ animation: 'float-slow 6s ease-in-out infinite 0.5s' }} />

          {/* Sparkle dots */}
          <div className="absolute right-16 top-8 w-2 h-2 rounded-full bg-white/60" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
          <div className="absolute right-36 bottom-6 w-1.5 h-1.5 rounded-full bg-white/50" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }} />
          <div className="absolute right-56 top-10 w-1 h-1 rounded-full bg-white/40" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-20 bottom-0 w-3 h-3 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 3s ease-out infinite' }} />
          <div className="absolute right-40 bottom-0 w-2 h-2 rounded-full bg-white/15" style={{ animation: 'bubble-rise-2 4s ease-out infinite 1s' }} />
          <div className="absolute right-52 bottom-0 w-2.5 h-2.5 rounded-full bg-white/10" style={{ animation: 'bubble-drift 3.5s ease-out infinite 0.5s' }} />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer-sweep 4s ease-in-out infinite' }} />
          </div>

          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Glassmorphic icon badge */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  animation: 'bounce-in 0.7s ease-out both',
                }}
              >
                <Layers className="w-7 h-7 text-white" />
              </div>
              <div className="animate-slide-in-left">
                <h1 className="text-2xl font-bold text-white">My Services</h1>
                <p className="text-emerald-100 text-sm mt-0.5">Services you are approved to offer</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchServices}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link href="/vendor/services/request">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-emerald-700 bg-white shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <Plus className="w-4 h-4" />
                  Request Service
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Toggle feedback banner */}
        {message && (
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}
            style={{ animation: 'fade-up 0.4s ease-out both' }}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <CheckCircle className="w-6 h-6" />,
              label: 'Approved',
              value: approvedServiceIds.length,
              color: 'emerald',
              gradient: 'from-emerald-500 to-teal-500',
              bg: 'bg-emerald-50',
              text: 'text-emerald-600',
              blob: 'bg-emerald-100',
            },
            {
              icon: <Clock className="w-6 h-6" />,
              label: 'Pending',
              value: requests.filter((r) => r.status === 'PENDING').length,
              color: 'amber',
              gradient: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50',
              text: 'text-amber-600',
              blob: 'bg-amber-100',
            },
            {
              icon: <XCircle className="w-6 h-6" />,
              label: 'Rejected',
              value: requests.filter((r) => r.status === 'REJECTED').length,
              color: 'red',
              gradient: 'from-red-500 to-rose-500',
              bg: 'bg-red-50',
              text: 'text-red-600',
              blob: 'bg-red-100',
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl cursor-default"
              style={{ animation: `fade-up 0.6s ease-out ${0.1 + i * 0.1}s both` }}
            >
              {/* Background blob */}
              <div className={`absolute -top-6 -right-6 w-24 h-24 ${stat.blob} rounded-full opacity-40 transition-transform duration-700 group-hover:scale-150`} />
              {/* Shimmer on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: 'shimmer-sweep 1.5s ease-in-out infinite' }} />
              </div>
              <div className="relative flex items-center gap-4">
                {/* Icon badge */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.text} transition-transform duration-300 group-hover:scale-110 origin-left`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Approved Services */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ animation: 'fade-up 0.6s ease-out 0.5s both' }}
        >
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-base font-bold text-gray-900">Approved Services</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded skeleton-shimmer" />
                      <div className="h-3 w-16 rounded skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : approvedServices.length === 0 ? (
            <div className="p-12 text-center">
              <div
                className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"
                style={{ animation: 'bounce-in 0.7s ease-out both' }}
              >
                <Layers className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No approved services yet</h3>
              <p className="text-sm text-gray-500 mb-5">Request services to start offering them</p>
              <Link href="/vendor/services/request">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-emerald-600 shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:scale-105">
                  <Plus className="w-4 h-4" />
                  Request Service
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {approvedServices.map((service, i) => {
                const isActive = activeServiceIds.includes(service.id);
                const isToggling = togglingId === service.id;
                return (
                  <div
                    key={service.id}
                    className={`group relative overflow-hidden p-4 border rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${
                      isActive ? 'border-gray-100 hover:border-emerald-200' : 'border-gray-100 bg-gray-50/60'
                    }`}
                    style={{
                      animation: `fade-up 0.5s ease-out ${0.6 + i * 0.08}s both`,
                    }}
                  >
                    {/* Shimmer on hover — active services only */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50/80 to-transparent" style={{ animation: 'shimmer-sweep 1.5s ease-in-out infinite' }} />
                        </div>
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: '0 0 0 1px rgba(5,150,105,0.2), 0 0 16px rgba(5,150,105,0.08)' }} />
                      </>
                    )}
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-500 flex-shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 group-hover:rotate-12 group-hover:scale-110'
                              : 'bg-gradient-to-br from-gray-300 to-gray-400'
                          }`}
                        >
                          {getServiceIcon(service.slug)}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {service.name}
                            {service.parentName && (
                              <span className="ml-1.5 text-[11px] font-normal text-gray-400 align-middle">· {service.parentName}</span>
                            )}
                          </h4>
                          {isActive ? (
                            <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              Active
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex rounded-full h-2 w-2 bg-gray-300" />
                              Inactive — no new leads
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => toggleServiceActive(service.id, isActive)}
                        disabled={isToggling}
                        title={isActive ? 'Deactivate — stop receiving new leads for this service' : 'Activate — start receiving new leads again'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isActive ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                        ) : (
                          <span
                            className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              isActive ? 'translate-x-[22px]' : 'translate-x-1'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending/Rejected Requests — APPROVED requests are deliberately
            excluded here since they're already shown above in "Approved
            Services" with live active/inactive status; repeating them here
            with just a static date was pure duplication and confusing. */}
        {(() => {
          const unresolvedRequests = requests.filter((r) => r.status !== 'APPROVED');
          if (unresolvedRequests.length === 0) return null;
          return (
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            style={{ animation: 'fade-up 0.6s ease-out 0.7s both' }}
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-base font-bold text-gray-900">Pending &amp; Rejected Requests</h3>
            </div>

            <div className="divide-y divide-gray-50">
              {unresolvedRequests.map((request, i) => (
                <div
                  key={request.id}
                  className="group p-4 sm:px-5 transition-colors duration-300 hover:bg-emerald-50/30"
                  style={{ animation: `fade-up 0.5s ease-out ${0.8 + i * 0.08}s both` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {getServiceIcon(request.services?.slug)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{request.services?.name || 'Unknown Service'}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-sm text-red-700">
                        <strong>Reason:</strong> {request.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
