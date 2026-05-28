'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  FileText,
  Eye,
  Clock,
  DollarSign,
  Plane,
  Car,
  Hotel,
  Users,
  Calendar,
  ChevronRight,
  Globe,
  IndianRupee,
  Star,
} from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  verifiedAt: string | null;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
}

interface Fleet {
  id: string;
  vehicleName: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  registrationNumber: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  chauffeurIncluded: boolean;
  chauffeurName: string | null;
  baseLocation: string | null;
  ratePerDay: number | null;
  ratePerKm: number | null;
  coverImage: string | null;
  isActive: boolean;
  isAvailable: boolean;
  totalTrips: number;
}

interface Tour {
  id: string;
  title: string;
  destination: string;
  category: string | null;
  durationDays: number;
  durationNights: number;
  priceType: string;
  basePrice: number | null;
  startingPrice: number | null;
  coverImage: string | null;
  status: string;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
}

interface Property {
  id: string;
  name: string;
  propertyType: string;
  city: string | null;
  state: string | null;
  totalRooms: number;
  startingPrice: number | null;
  coverImage: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalBookings: number;
  rating: number | null;
}

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  source: string;
  tripType: string | null;
  destination: string | null;
  travelDate: string | null;
  estimatedValue: number | null;
  quotedAmount: number | null;
  status: string;
  priority: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  bookingType: string;
  referenceTitle: string | null;
  travelDate: string | null;
  totalAmount: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface AgentDetail {
  id: string;
  agencyName: string;
  agencyType: string | null;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  description: string | null;
  website: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy: { name: string } | null;
  createdAt: string;
  documents: Document[];
  bankAccounts: BankAccount[];
  fleets: Fleet[];
  tours: Tour[];
  properties: Property[];
  leads: Lead[];
  bookings: Booking[];
  _count: { documents: number; bankAccounts: number; fleets: number; tours: number; properties: number; leads: number; bookings: number };
}

type TabKey = 'overview' | 'vehicles' | 'tours' | 'properties' | 'leads' | 'bookings' | 'documents' | 'banks';

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-purple-100 text-purple-800',
  BLOCKED: 'bg-gray-100 text-gray-800',
};

const inr = (n: number | null | undefined) =>
  n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const dateShort = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ManagerTravelAgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manager/travel-agents/${id}`, { cache: 'no-store' });
      if (res.ok) setAgent(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const performAction = async (action: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/manager/travel-agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (res.ok) {
        await load();
        setShowRejectForm(false);
        setRejectReason('');
      } else {
        const j = await res.json();
        alert(j.error || 'Action failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const verifyDocument = async (documentId: string, action: 'VERIFY' | 'REJECT', rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/manager/travel-agents/${id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action, rejectionReason }),
      });
      if (res.ok) await load();
      else {
        const j = await res.json();
        alert(j.error || 'Failed');
      }
    } catch {
      alert('Server error');
    }
  };

  // Tab definitions with badge counts — only built after agent loads.
  const tabs = useMemo(() => {
    if (!agent) return [] as { key: TabKey; label: string; count?: number; icon: any }[];
    return [
      { key: 'overview' as TabKey, label: 'Overview', icon: Building2 },
      { key: 'vehicles' as TabKey, label: 'Vehicles', count: agent._count.fleets, icon: Car },
      { key: 'tours' as TabKey, label: 'Tours', count: agent._count.tours, icon: Plane },
      { key: 'properties' as TabKey, label: 'Properties', count: agent._count.properties, icon: Hotel },
      { key: 'leads' as TabKey, label: 'Leads', count: agent._count.leads, icon: Users },
      { key: 'bookings' as TabKey, label: 'Bookings', count: agent._count.bookings, icon: Calendar },
      { key: 'documents' as TabKey, label: 'Documents', count: agent._count.documents, icon: FileText },
      { key: 'banks' as TabKey, label: 'Bank Accounts', count: agent._count.bankAccounts, icon: DollarSign },
    ];
  }, [agent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Travel agent not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/manager/travel-agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Travel Agents
      </Link>

      {/* Header with actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{agent.agencyName}</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {agent.ownerName} • {agent.agencyType || 'Agency'}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[agent.status] || 'bg-gray-100 text-gray-800'}`}
              >
                {agent.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Item icon={Mail} value={agent.email} />
              <Item icon={Phone} value={agent.phone} />
              {(agent.address || agent.city) && (
                <Item
                  icon={MapPin}
                  value={[agent.address, agent.city, agent.state, agent.pincode].filter(Boolean).join(', ')}
                />
              )}
              {agent.website && <Item icon={Globe} value={agent.website} />}
            </div>

            {(agent.gstNumber || agent.panNumber) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                {agent.gstNumber && <span>GST: <strong>{agent.gstNumber}</strong></span>}
                {agent.panNumber && <span>PAN: <strong>{agent.panNumber}</strong></span>}
              </div>
            )}

            {agent.rejectionReason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-700">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-1">{agent.rejectionReason}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {agent.status !== 'APPROVED' && (
              <button
                onClick={() => performAction('APPROVE')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
            )}
            {agent.status !== 'REJECTED' && (
              <button
                onClick={() => setShowRejectForm((v) => !v)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            )}
            {agent.status === 'APPROVED' && (
              <button
                onClick={() => performAction('SUSPEND')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" /> Suspend
              </button>
            )}
            {agent.status === 'SUSPENDED' && (
              <button
                onClick={() => performAction('UNSUSPEND')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                Unsuspend
              </button>
            )}
            {agent.status !== 'BLOCKED' && (
              <button
                onClick={() => performAction('BLOCK')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Block
              </button>
            )}
          </div>
        </div>

        {showRejectForm && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700 mb-2">Provide rejection reason</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Why is this application being rejected?"
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowRejectForm(false)} className="text-sm text-gray-600 px-3 py-1.5">
                Cancel
              </button>
              <button
                onClick={() => performAction('REJECT', rejectReason)}
                disabled={!rejectReason.trim() || actionLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat icon={Car} label="Vehicles" value={agent._count.fleets} />
        <Stat icon={Plane} label="Tours" value={agent._count.tours} />
        <Stat icon={Hotel} label="Properties" value={agent._count.properties} />
        <Stat icon={Users} label="Leads" value={agent._count.leads} />
        <Stat icon={Calendar} label="Bookings" value={agent._count.bookings} />
        <Stat icon={FileText} label="Documents" value={agent._count.documents} />
      </div>

      {/* Tab nav */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-thin">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium shrink-0 border-b-2 transition ${
                  active
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
                {t.count != null && (
                  <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full px-1.5 ${
                    active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === 'overview' && <OverviewTab agent={agent} />}
          {tab === 'vehicles' && <VehiclesTab fleets={agent.fleets} />}
          {tab === 'tours' && <ToursTab tours={agent.tours} />}
          {tab === 'properties' && <PropertiesTab properties={agent.properties} />}
          {tab === 'leads' && <LeadsTab leads={agent.leads} total={agent._count.leads} />}
          {tab === 'bookings' && <BookingsTab bookings={agent.bookings} total={agent._count.bookings} />}
          {tab === 'documents' && <DocumentsTab documents={agent.documents} onAction={verifyDocument} />}
          {tab === 'banks' && <BanksTab banks={agent.bankAccounts} />}
        </div>
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────── */

function OverviewTab({ agent }: { agent: AgentDetail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Box title="Business Info">
        <Row label="Owner" value={agent.ownerName} />
        <Row label="Agency Type" value={agent.agencyType || '—'} />
        <Row label="Registered On" value={dateShort(agent.createdAt)} />
        {agent.approvedAt && <Row label="Approved On" value={dateShort(agent.approvedAt)} />}
        {agent.approvedBy && <Row label="Approved By" value={agent.approvedBy.name} />}
      </Box>
      <Box title="Contact">
        <Row label="Email" value={agent.email} />
        <Row label="Phone" value={agent.phone} />
        {agent.website && <Row label="Website" value={agent.website} />}
        {(agent.address || agent.city) && (
          <Row label="Address" value={[agent.address, agent.city, agent.state, agent.pincode].filter(Boolean).join(', ')} />
        )}
      </Box>
      {agent.description && (
        <Box title="About" full>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{agent.description}</p>
        </Box>
      )}
    </div>
  );
}

function VehiclesTab({ fleets }: { fleets: Fleet[] }) {
  if (fleets.length === 0) return <Empty icon={Car} text="No vehicles added yet" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {fleets.map((f) => (
        <div key={f.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition">
          <div className="relative h-40 bg-gray-100">
            {f.coverImage ? (
              <img src={f.coverImage} alt={f.vehicleName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Car className="w-12 h-12" /></div>
            )}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Pill on={f.isActive} on_text="Active" off_text="Inactive" />
              {f.isActive && <Pill on={f.isAvailable} on_text="Available" off_text="Busy" />}
            </div>
          </div>
          <div className="p-4 space-y-1.5">
            <p className="font-semibold text-gray-900 truncate">{f.vehicleName}</p>
            <p className="text-xs text-gray-500">
              {[f.brand, f.model].filter(Boolean).join(' ')} • {f.vehicleType.replace(/_/g, ' ')}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 pt-1">
              {f.registrationNumber && <span className="font-mono">{f.registrationNumber}</span>}
              {f.seatingCapacity && <span>{f.seatingCapacity} seater</span>}
              {f.fuelType && <span>{f.fuelType}</span>}
              {f.transmission && <span>{f.transmission}</span>}
            </div>
            {(f.ratePerDay || f.ratePerKm) && (
              <div className="pt-2 flex items-center gap-3 text-xs text-gray-700">
                {f.ratePerDay != null && <span><IndianRupee className="w-3 h-3 inline" />{f.ratePerDay}/day</span>}
                {f.ratePerKm != null && <span><IndianRupee className="w-3 h-3 inline" />{f.ratePerKm}/km</span>}
              </div>
            )}
            <div className="pt-1.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100 mt-2">
              <span>{f.baseLocation || '—'}</span>
              <span>{f.totalTrips} trips</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToursTab({ tours }: { tours: Tour[] }) {
  if (tours.length === 0) return <Empty icon={Plane} text="No tours posted yet" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tours.map((t) => (
        <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition">
          <div className="relative h-40 bg-gray-100">
            {t.coverImage ? (
              <img src={t.coverImage} alt={t.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Plane className="w-12 h-12" /></div>
            )}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Pill on={t.isPublic} on_text="Public" off_text="Private" />
              <Pill on={t.isActive} on_text="Active" off_text="Inactive" />
            </div>
            <span className="absolute bottom-2 left-2 bg-white/95 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
              {t.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="p-4 space-y-1.5">
            <p className="font-semibold text-gray-900 truncate">{t.title}</p>
            <p className="text-xs text-gray-500 truncate">{t.destination} {t.category && `• ${t.category}`}</p>
            <p className="text-xs text-gray-600">
              {t.durationDays}D / {t.durationNights}N
            </p>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm font-bold text-emerald-700">
                {t.priceType === 'ON_REQUEST' ? 'On request' : inr(t.basePrice ?? t.startingPrice)}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                {t.rating != null && t.rating > 0 && (
                  <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500 text-amber-500" />{t.rating.toFixed(1)}</span>
                )}
                <span>{t.totalBookings} bk</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PropertiesTab({ properties }: { properties: Property[] }) {
  if (properties.length === 0) return <Empty icon={Hotel} text="No properties listed yet" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((p) => (
        <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition">
          <div className="relative h-40 bg-gray-100">
            {p.coverImage ? (
              <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Hotel className="w-12 h-12" /></div>
            )}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Pill on={p.isPublic} on_text="Public" off_text="Private" />
              <Pill on={p.isActive} on_text="Active" off_text="Inactive" />
            </div>
          </div>
          <div className="p-4 space-y-1.5">
            <p className="font-semibold text-gray-900 truncate">{p.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {p.propertyType.replace(/_/g, ' ')} {p.city && `• ${p.city}, ${p.state}`}
            </p>
            <p className="text-xs text-gray-600">{p.totalRooms} room{p.totalRooms !== 1 ? 's' : ''}</p>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm font-bold text-emerald-700">
                {p.startingPrice != null ? `${inr(p.startingPrice)}/night` : 'On request'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                {p.rating != null && p.rating > 0 && (
                  <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-500 text-amber-500" />{p.rating.toFixed(1)}</span>
                )}
                <span>{p.totalBookings} bk</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-indigo-100 text-indigo-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  NEGOTIATING: 'bg-amber-100 text-amber-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-gray-100 text-gray-600',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
};

function LeadsTab({ leads, total }: { leads: Lead[]; total: number }) {
  if (leads.length === 0) return <Empty icon={Users} text="No leads yet" />;
  return (
    <div>
      {total > leads.length && (
        <p className="text-xs text-gray-500 mb-3">Showing {leads.length} most recent of {total} total leads</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5">Customer</th>
              <th className="text-left px-4 py-2.5">Trip</th>
              <th className="text-left px-4 py-2.5">Travel Date</th>
              <th className="text-right px-4 py-2.5">Quoted</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-gray-900">{l.customerName}</p>
                  <p className="text-xs text-gray-500">{l.customerPhone}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs">{l.tripType || '—'}</p>
                  <p className="text-xs text-gray-500">{l.destination || '—'}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">{dateShort(l.travelDate)}</td>
                <td className="px-4 py-2.5 text-right text-xs text-gray-700">{inr(l.quotedAmount ?? l.estimatedValue)}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${LEAD_STATUS_COLOR[l.status] || 'bg-gray-100 text-gray-600'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{dateShort(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const BOOKING_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function BookingsTab({ bookings, total }: { bookings: Booking[]; total: number }) {
  if (bookings.length === 0) return <Empty icon={Calendar} text="No bookings yet" />;
  return (
    <div>
      {total > bookings.length && (
        <p className="text-xs text-gray-500 mb-3">Showing {bookings.length} most recent of {total} total bookings</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5">Booking</th>
              <th className="text-left px-4 py-2.5">Customer</th>
              <th className="text-left px-4 py-2.5">Travel Date</th>
              <th className="text-right px-4 py-2.5">Total / Paid</th>
              <th className="text-left px-4 py-2.5">Payment</th>
              <th className="text-left px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-gray-900 font-mono text-xs">{b.bookingNumber}</p>
                  <p className="text-xs text-gray-500">{b.bookingType} {b.referenceTitle && `• ${b.referenceTitle}`}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs">{b.customerName}</p>
                  <p className="text-xs text-gray-500">{b.customerPhone}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-700">{dateShort(b.travelDate)}</td>
                <td className="px-4 py-2.5 text-right">
                  <p className="text-xs font-semibold">{inr(b.totalAmount)}</p>
                  <p className="text-[10px] text-gray-500">paid {inr(b.paidAmount)}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                    {b.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${BOOKING_STATUS_COLOR[b.status] || 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab({
  documents,
  onAction,
}: {
  documents: Document[];
  onAction: (documentId: string, action: 'VERIFY' | 'REJECT', rejectionReason?: string) => void;
}) {
  if (documents.length === 0) return <Empty icon={FileText} text="No documents uploaded yet" />;
  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-start justify-between gap-3 p-4 border border-gray-200 rounded-xl">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{doc.documentName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {doc.documentType.replace(/_/g, ' ')} {doc.documentNumber && `• ${doc.documentNumber}`}
            </p>
            <a
              href={doc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              <Eye className="w-3 h-3" /> View File
            </a>
            {doc.rejectionReason && <p className="text-xs text-red-600 mt-2">{doc.rejectionReason}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                doc.status === 'VERIFIED'
                  ? 'bg-green-100 text-green-700'
                  : doc.status === 'REJECTED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {doc.status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : doc.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {doc.status}
            </span>
            {doc.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAction(doc.id, 'VERIFY')}
                  className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                >
                  Verify
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason?');
                    if (reason) onAction(doc.id, 'REJECT', reason);
                  }}
                  className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BanksTab({ banks }: { banks: BankAccount[] }) {
  if (banks.length === 0) return <Empty icon={DollarSign} text="No bank accounts added" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {banks.map((acc) => (
        <div key={acc.id} className="border border-gray-200 rounded-xl p-4 text-sm">
          <p className="font-bold text-gray-900">{acc.bankName}</p>
          <p className="text-xs text-gray-500 mt-1">{acc.accountHolderName}</p>
          <p className="text-xs text-gray-700 mt-2">
            ••••{acc.accountNumber.slice(-4)} • IFSC {acc.ifscCode}
          </p>
          {acc.isPrimary && (
            <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              PRIMARY
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────────────────── */

function Item({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function Box({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${full ? 'md:col-span-2' : ''}`}>
      <p className="text-xs font-bold uppercase text-gray-500 mb-2">{title}</p>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 text-right">{value}</span>
    </div>
  );
}

function Pill({ on, on_text, off_text }: { on: boolean; on_text: string; off_text: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${on ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
      {on ? on_text : off_text}
    </span>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
