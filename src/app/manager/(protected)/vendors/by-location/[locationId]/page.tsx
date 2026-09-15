'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin, AlertCircle, ArrowLeft, CheckCircle2, XCircle, Phone, Mail, Store, Calendar,
  Bike, Key, Bus, Truck, Gem, Package, Wrench, Filter, X,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

interface VendorRow {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  approvalId: string;
  isActiveHere: boolean;
  approvedAt: string;
}

interface ServiceCoverageVendor {
  id: string;
  businessName: string;
}

interface ServiceCoverageRow {
  key: string;
  id: string;
  name: string;
  vendors: ServiceCoverageVendor[];
}

const SERVICE_ICON: Record<string, any> = {
  bike: Bike, 'self-drive': Key, bus: Bus, truck: Truck, luxury: Gem, packers: Package, equipment: Wrench,
};

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  DOCUMENTS_PENDING: 'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  BLOCKED: 'bg-red-50 text-red-700',
};

const AVATAR_COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#14B8A6', '#EC4899', '#F59E0B', '#0EA5E9'];
const colorFor = (seed: string) => AVATAR_COLORS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name: string) => name.trim().slice(0, 2).toUpperCase();

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(new Date(value));
};

export default function ManagerVendorsAtLocationPage() {
  const params = useParams<{ locationId: string }>();
  const locationId = params?.locationId;

  const [location, setLocation] = useState<{ id: string; name: string; type: string } | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [serviceCoverage, setServiceCoverage] = useState<ServiceCoverageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const vendorListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!locationId) return;
    (async () => {
      try {
        setError(null);
        const res = await fetch(`/api/manager/vendors/by-location/${locationId}`);
        const data = await res.json();
        if (data.success) {
          setLocation(data.location);
          setVendors(data.vendors || []);
          setServiceCoverage(data.serviceCoverage || []);
        } else {
          setError(data.error || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locationId]);

  const activeCount = vendors.filter((v) => v.isActiveHere).length;
  const selectedService = serviceCoverage.find((s) => s.id === selectedServiceId) || null;
  const selectedServiceVendorIds = new Set((selectedService?.vendors || []).map((v) => v.id));
  const displayedVendors = selectedService ? vendors.filter((v) => selectedServiceVendorIds.has(v.id)) : vendors;

  const selectService = (serviceId: string) => {
    setSelectedServiceId((prev) => (prev === serviceId ? null : serviceId));
    requestAnimationFrame(() => vendorListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Location name and Back go into the shared sticky bar; the hero card below
  // keeps its type label and stats but no longer repeats the title.
  useManagerPageHeader(
    location?.name || (isLoading ? 'Loading…' : 'Location'),
    'Vendors available to serve this location',
    undefined,
    <Link
      href="/manager/vendors/by-location"
      title="Back to locations"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>,
  );

  return (
    <div className="space-y-6 pb-10">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 10% 60%, #10b981 0%, transparent 50%), radial-gradient(circle at 90% 20%, #059669 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase">{location?.type || (isLoading ? 'Loading…' : '')}</span>
            </div>
            <p className="text-slate-400 text-sm">Vendors available to serve this location</p>
          </div>

          <div className="flex gap-3 flex-wrap shrink-0">
            {[
              { label: 'Total', value: vendors.length, color: 'bg-white/10 border-white/15 text-white' },
              { label: 'Active', value: activeCount, color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              { label: 'Inactive', value: vendors.length - activeCount, color: 'bg-red-500/20 border-red-400/30 text-red-300' },
            ].map((s) => (
              <div key={s.label} className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${s.color}`}>
                <span className="text-xl font-black">{isLoading ? '—' : s.value}</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 opacity-80">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ SERVICE COVERAGE ════════════════════════════════════════ */}
      {!isLoading && serviceCoverage.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
            <p className="text-sm font-semibold text-gray-800">Service Coverage</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Which services have an active vendor at {location?.name} — independent of location approval
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
            {serviceCoverage.map((s) => {
              const Icon = SERVICE_ICON[s.key] || Package;
              const covered = s.vendors.length > 0;
              const isSelected = selectedServiceId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => covered && selectService(s.id)}
                  className={`text-left p-4 transition-colors ${
                    isSelected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-500' : 'bg-white'
                  } ${!covered ? '!bg-red-50/40' : ''} ${covered ? 'cursor-pointer hover:bg-gray-50/80' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${covered ? 'bg-emerald-50 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    </div>
                    {covered ? (
                      <span className="text-xs font-bold text-emerald-700">{s.vendors.length}</span>
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {covered ? (
                    <p className="text-xs text-gray-500 truncate">
                      {s.vendors.map((v) => v.businessName).join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-red-600">No vendor for this service</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ VENDOR LIST ═════════════════════════════════════════════ */}
      <div ref={vendorListRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-6">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-gray-600 flex items-center gap-2">
            {selectedService && <Filter className="w-3.5 h-3.5 text-emerald-600" />}
            {isLoading
              ? 'Loading…'
              : displayedVendors.length === 0
              ? 'No approved vendors'
              : selectedService
              ? `${displayedVendors.length} vendor${displayedVendors.length === 1 ? '' : 's'} for ${selectedService.name}`
              : `${displayedVendors.length} vendor${displayedVendors.length === 1 ? '' : 's'} approved`}
          </p>
          {selectedService && (
            <button
              type="button"
              onClick={() => setSelectedServiceId(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-1 rounded-full"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                  <div className="h-2.5 w-56 bg-gray-50 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayedVendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <Store className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              {selectedService ? `No vendors offer ${selectedService.name} here` : 'No vendors are approved for this location yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayedVendors.map((v) => (
              <div
                key={v.approvalId}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${!v.isActiveHere ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: colorFor(v.businessName) }}
                  >
                    {initials(v.businessName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.businessName}</p>
                    <p className="text-xs text-gray-500">{v.ownerName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" /> {v.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" /> {v.phone}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" /> Approved {formatDate(v.approvedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-500'}`}>
                    {v.status}
                  </span>
                  {v.isActiveHere ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                  <Link
                    href={`/manager/vendors/${v.id}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 whitespace-nowrap ml-1"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
