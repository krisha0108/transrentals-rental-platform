'use client';

// Full-page add/edit form for a vendor call report. Shared by the /new and
// /[id]/edit routes — pass a reportId to load and edit an existing row,
// omit it to create a new one.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Building2, User, Phone, MapPin,
  Home, FileText, Layers, Calendar, MessageSquare, ThumbsUp, ThumbsDown, Clock,
  PhoneOff, PhoneForwarded, Award, Store, Bell, Lightbulb, StickyNote, UserPlus,
  Mail, AlertTriangle, Briefcase,
} from 'lucide-react';
import { LocationStatePicker, type LocationOption } from './LocationStatePicker';
import { ServiceMultiSelect, type ServiceOption } from './ServiceMultiSelect';
import { SearchableSelect } from './SearchableSelect';

type CallReportStatus =
  | 'VENDOR_CREATED' | 'TRAVEL_AGENT_CREATED' | 'INTERESTED' | 'FOLLOW_UP' | 'NOT_INTERESTED'
  | 'NO_ANSWER' | 'CALLBACK_LATER' | 'WRONG_NUMBER' | 'CONVERTED';

const STATUS_META: Record<CallReportStatus, { label: string; icon: any }> = {
  FOLLOW_UP: { label: 'Follow-up', icon: Clock },
  INTERESTED: { label: 'Interested', icon: ThumbsUp },
  CALLBACK_LATER: { label: 'Callback Later', icon: PhoneForwarded },
  VENDOR_CREATED: { label: 'Vendor Created', icon: CheckCircle2 },
  TRAVEL_AGENT_CREATED: { label: 'Travel Agent Created', icon: Briefcase },
  CONVERTED: { label: 'Converted', icon: Award },
  NOT_INTERESTED: { label: 'Not Interested', icon: ThumbsDown },
  NO_ANSWER: { label: 'No Answer', icon: PhoneOff },
  WRONG_NUMBER: { label: 'Wrong Number', icon: XCircle },
};

const STATUS_ORDER: CallReportStatus[] = [
  'FOLLOW_UP', 'INTERESTED', 'CALLBACK_LATER', 'VENDOR_CREATED', 'TRAVEL_AGENT_CREATED', 'CONVERTED',
  'NOT_INTERESTED', 'NO_ANSWER', 'WRONG_NUMBER',
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type ContactType = 'VENDOR' | 'TRAVEL_AGENT';

interface FormState {
  vendorName: string;
  companyName: string;
  companyDetails: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  contactType: ContactType;
  serviceIds: string[];
  locationIds: string[];
  callDate: string;
  status: CallReportStatus;
  nextFollowUpDate: string;
  nextFollowUpTime: string;
  nextAction: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  vendorName: '', companyName: '', companyDetails: '', phone: '', email: '', address: '', city: '',
  contactType: 'VENDOR',
  serviceIds: [], locationIds: [], callDate: todayStr(), status: 'FOLLOW_UP',
  nextFollowUpDate: '', nextFollowUpTime: '', nextAction: '', notes: '',
};

interface DuplicateMatch {
  id: string;
  name: string;
  code: string | null;
  kind: 'vendor' | 'travel agent';
}

const FIELD_CLASS = 'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition';

export function CallReportForm({ reportId }: { reportId?: string }) {
  const router = useRouter();
  const isEdit = !!reportId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [linkedVendor, setLinkedVendor] = useState<{ id: string; businessName: string; vid: string | null } | null>(null);
  const [linkedTravelAgent, setLinkedTravelAgent] = useState<{ id: string; agencyName: string; tid: string | null } | null>(null);
  const [convertingToVendor, setConvertingToVendor] = useState(false);
  const [convertingToTravelAgent, setConvertingToTravelAgent] = useState(false);

  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    fetch('/api/services?parentsOnly=true')
      .then((r) => r.json())
      .then((d) => { if (d.success) setServices(d.services || []); })
      .catch(() => {});
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        // /api/locations nests the parent as `locations` (e.g. a city's
        // state) rather than a flat `state` string — flatten it here so the
        // picker can group by state. A union territory's "parent" is the
        // country, not a state, so it groups under its own name instead.
        const mapped = (d.locations || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          state: l.type === 'UNION_TERRITORY' ? l.name : (l.locations?.name || 'Other'),
        }));
        setLocations(mapped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/manager/call-reports/${reportId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.report) { setError('Call report not found'); return; }
        const r = d.report;
        setForm({
          vendorName: r.vendorName || '',
          companyName: r.companyName || '',
          companyDetails: r.companyDetails || '',
          phone: r.phone || '',
          email: r.email || '',
          address: r.address || '',
          city: r.city || '',
          contactType: r.contactType === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : 'VENDOR',
          serviceIds: (r.services || []).map((s: any) => s.id),
          locationIds: (r.locations || []).map((l: any) => l.id),
          callDate: (r.callDate || todayStr()).slice(0, 10),
          status: r.status,
          nextFollowUpDate: r.nextFollowUpDate ? r.nextFollowUpDate.slice(0, 10) : '',
          nextFollowUpTime: r.nextFollowUpTime || '',
          nextAction: r.nextAction || '',
          notes: r.notes || '',
        });
        setLinkedVendor(r.vendor || null);
        setLinkedTravelAgent(r.travelAgent || null);
      })
      .catch(() => setError('Failed to load call report'))
      .finally(() => setLoading(false));
  }, [reportId]);

  const [pendingAction, setPendingAction] = useState<'save' | 'vendor' | 'travel-agent' | null>(null);

  // Warns before logging a "new" lead that's actually already an onboarded
  // vendor or travel agent (matched by phone or email).
  const runDuplicateCheck = async (): Promise<DuplicateMatch[]> => {
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!phone && !email) return [];
    setCheckingDuplicate(true);
    try {
      const params = new URLSearchParams();
      if (phone) params.set('phone', phone);
      if (email) params.set('email', email);
      const res = await fetch(`/api/manager/call-reports/check-duplicate?${params.toString()}`);
      const data = await res.json();
      const matches: DuplicateMatch[] = [];
      if (data?.vendorMatch) {
        matches.push({ id: data.vendorMatch.id, name: data.vendorMatch.businessName, code: data.vendorMatch.vid, kind: 'vendor' });
      }
      if (data?.travelAgentMatch) {
        matches.push({ id: data.travelAgentMatch.id, name: data.travelAgentMatch.agencyName, code: data.travelAgentMatch.tid, kind: 'travel agent' });
      }
      return matches;
    } catch {
      return [];
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Shared by the plain Save button and "Ready to Become Vendor" — the
  // latter needs the saved report's id (a brand-new report has none yet)
  // before it can hand off to vendor creation. Returns 'duplicate' instead
  // of saving when phone/email already belongs to a vendor or travel agent,
  // unless the manager has explicitly confirmed via skipDuplicateCheck.
  const persistReport = async (skipDuplicateCheck = false): Promise<{ id: string } | 'duplicate' | null> => {
    if (!form.vendorName.trim()) {
      setError('Vendor name is required');
      return null;
    }
    if (!skipDuplicateCheck && !linkedVendor && !linkedTravelAgent) {
      const matches = await runDuplicateCheck();
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        return 'duplicate';
      }
    }
    setDuplicateMatches(null);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/manager/call-reports/${reportId}` : '/api/manager/call-reports', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: form.vendorName.trim(),
          companyName: form.companyName.trim() || null,
          companyDetails: form.companyDetails.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          contactType: form.contactType,
          serviceIds: form.serviceIds,
          locationIds: form.locationIds,
          callDate: form.callDate,
          status: form.status,
          nextFollowUpDate: form.nextFollowUpDate || null,
          nextFollowUpTime: form.nextFollowUpTime || null,
          nextAction: form.nextAction.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to save call report');
      return data.report;
    } catch (e: any) {
      setError(e?.message || 'Failed to save call report');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (force = false) => {
    const result = await persistReport(force);
    if (result === 'duplicate') { setPendingAction('save'); return; }
    if (result) router.push('/manager/call-reports');
  };

  const handleReadyToBecomeVendor = async (force = false) => {
    setConvertingToVendor(true);
    try {
      const result = await persistReport(force);
      if (result === 'duplicate') { setPendingAction('vendor'); return; }
      if (!result) return;
      const params = new URLSearchParams({
        businessName: form.companyName.trim() || form.vendorName.trim(),
        ownerName: form.vendorName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        callReportId: result.id,
      });
      router.push(`/manager/vendors/create?${params.toString()}`);
    } finally {
      setConvertingToVendor(false);
    }
  };

  const handleReadyToBecomeTravelAgent = async (force = false) => {
    setConvertingToTravelAgent(true);
    try {
      const result = await persistReport(force);
      if (result === 'duplicate') { setPendingAction('travel-agent'); return; }
      if (!result) return;
      const params = new URLSearchParams({
        agencyName: form.companyName.trim() || form.vendorName.trim(),
        ownerName: form.vendorName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        callReportId: result.id,
      });
      router.push(`/manager/travel-agents/create?${params.toString()}`);
    } finally {
      setConvertingToTravelAgent(false);
    }
  };

  const confirmSaveAnyway = () => {
    setDuplicateMatches(null);
    if (pendingAction === 'vendor') handleReadyToBecomeVendor(true);
    else if (pendingAction === 'travel-agent') handleReadyToBecomeTravelAgent(true);
    else handleSave(true);
    setPendingAction(null);
  };

  const dismissDuplicateWarning = () => {
    setDuplicateMatches(null);
    setPendingAction(null);
  };

  const selectedLocationNames = useMemo(
    () => locations.filter((l) => form.locationIds.includes(l.id)).map((l) => l.name),
    [locations, form.locationIds],
  );
  const selectedStateCount = useMemo(
    () => new Set(locations.filter((l) => form.locationIds.includes(l.id)).map((l) => l.state || 'Other')).size,
    [locations, form.locationIds],
  );
  const selectedServiceNames = useMemo(
    () => services.filter((s) => form.serviceIds.includes(s.id)).map((s) => s.name),
    [services, form.serviceIds],
  );
  const cityOptions = useMemo(() => {
    const byName = new Map<string, string | undefined>();
    locations.forEach((l) => { if (!byName.has(l.name)) byName.set(l.name, l.state); });
    return [...byName.entries()]
      .map(([name, state]) => ({ id: name, label: name, sublabel: state }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const StatusIcon = STATUS_META[form.status].icon;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/manager/call-reports" className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{isEdit ? 'Edit Call Report' : 'Add Call Report'}</h1>
            <p className="text-xs sm:text-sm text-gray-500">Log vendor interaction & onboarding details</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {linkedVendor ? (
            <Link
              href={`/manager/vendors/${linkedVendor.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50 transition"
            >
              <Store className="w-4 h-4" /> View Vendor
            </Link>
          ) : linkedTravelAgent ? (
            <Link
              href={`/manager/travel-agents/${linkedTravelAgent.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition"
            >
              <Briefcase className="w-4 h-4" /> View Travel Agent
            </Link>
          ) : form.contactType === 'VENDOR' ? (
            <button
              onClick={() => handleReadyToBecomeVendor()}
              disabled={saving || convertingToVendor || checkingDuplicate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-sky-600 text-sky-700 text-sm font-semibold hover:bg-sky-50 disabled:opacity-50 transition"
            >
              {convertingToVendor ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Ready to Become Vendor
            </button>
          ) : (
            <button
              onClick={() => handleReadyToBecomeTravelAgent()}
              disabled={saving || convertingToTravelAgent || checkingDuplicate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-indigo-600 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 disabled:opacity-50 transition"
            >
              {convertingToTravelAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Ready to Become Travel Agent
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || checkingDuplicate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 transition"
          >
            {(saving || checkingDuplicate) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Call Report
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {duplicateMatches && duplicateMatches.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900">This phone/email is already onboarded</p>
              <ul className="mt-1 space-y-0.5 text-amber-800">
                {duplicateMatches.map((m) => (
                  <li key={`${m.kind}-${m.id}`}>
                    Matches {m.kind} <span className="font-semibold">{m.name}</span>
                    {m.code ? ` (${m.code.toUpperCase()})` : ''}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={confirmSaveAnyway}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
                >
                  Save Anyway
                </button>
                <button
                  type="button"
                  onClick={dismissDuplicateWarning}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
                >
                  Let Me Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Main content */}
        <div className="space-y-5 min-w-0">
          {/* Contact & Company */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Contact & Company</h3>
                <p className="text-xs text-gray-400">Capture the vendor's basic business and contact information.</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">This contact is a</label>
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, contactType: 'VENDOR' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${form.contactType === 'VENDOR' ? 'bg-white shadow-sm text-emerald-700 border border-emerald-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Store className="w-3.5 h-3.5" /> Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, contactType: 'TRAVEL_AGENT' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${form.contactType === 'TRAVEL_AGENT' ? 'bg-white shadow-sm text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> Travel Agent
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-x-5 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vendor Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    placeholder="Contact person's name"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Sharma Travels Pvt Ltd"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                      setDuplicateMatches(null);
                    }}
                    placeholder="10-digit number"
                    maxLength={10}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      setDuplicateMatches(null);
                    }}
                    placeholder="vendor@business.com"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                <SearchableSelect
                  options={cityOptions}
                  value={form.city}
                  onChange={(city) => setForm({ ...form, city })}
                  placeholder="Select city..."
                  icon={MapPin}
                />
              </div>

              <div className="col-span-1 sm:col-span-2 2xl:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street / area"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 2xl:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Details</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <textarea
                    value={form.companyDetails}
                    onChange={(e) => setForm({ ...form, companyDetails: e.target.value })}
                    placeholder="We provide self-drive cars, tempo traveller and bus rental services..."
                    rows={2}
                    className={`${FIELD_CLASS} resize-none`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service & Location + Call Outcome */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            {/* Service & Location */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Service & Location</h3>
                  <p className="text-xs text-gray-400">Select the service and the areas the vendor operates in.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service(s) *</label>
                    <ServiceMultiSelect
                      options={services}
                      value={form.serviceIds}
                      onChange={(ids) => setForm({ ...form, serviceIds: ids })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Call Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={form.callDate}
                        max={todayStr()}
                        onChange={(e) => setForm({ ...form, callDate: e.target.value > todayStr() ? todayStr() : e.target.value })}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location(s) *</label>
                  <LocationStatePicker
                    options={locations}
                    value={form.locationIds}
                    onChange={(ids) => setForm({ ...form, locationIds: ids })}
                  />
                </div>
              </div>
            </div>

            {/* Call Outcome */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Call Outcome</h3>
                  <p className="text-xs text-gray-400">Update the call status and outcome.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Status *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STATUS_ORDER.map((s) => {
                      const meta = STATUS_META[s];
                      const Icon = meta.icon;
                      const isSelected = form.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, status: s })}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Follow-up</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={form.nextFollowUpDate}
                        onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Follow-up Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        value={form.nextFollowUpTime}
                        onChange={(e) => setForm({ ...form, nextFollowUpTime: e.target.value })}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Action</label>
                  <div className="relative">
                    <PhoneForwarded className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={form.nextAction}
                      onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                      placeholder="e.g. Call again & discuss vehicle listing"
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Notes</h3>
                <p className="text-xs text-gray-400">Add notes about your conversation.</p>
              </div>
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="What was discussed on the call..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition resize-none"
            />
          </div>

          {/* Bottom actions */}
          <div className="flex flex-wrap justify-between gap-2">
            <Link
              href="/manager/call-reports"
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || checkingDuplicate}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {(saving || checkingDuplicate) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Call Report
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Call Summary */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900">Call Summary</h3>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{form.vendorName || 'Vendor name'}</p>
                <p className="text-xs text-gray-500 truncate">{form.companyName || 'Company name'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-gray-600">
              {(form.city || form.address) && (
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {form.city || form.address}</p>
              )}
              {form.phone && (
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {form.phone}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-100/70 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <Layers className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Service{selectedServiceNames.length > 1 ? 's' : ''}</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedServiceNames.length ? selectedServiceNames.join(', ') : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Call Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(form.callDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Locations</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedLocationNames.length === 0 ? '—' : `${selectedLocationNames.length} Cities in ${selectedStateCount} States`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <StatusIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Status</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[11px] font-semibold">
                    {STATUS_META[form.status].label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next follow-up */}
          {form.nextFollowUpDate && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Next Follow-up</h3>
              </div>
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(form.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {form.nextFollowUpTime && (
                  <>
                    <Clock className="w-3.5 h-3.5 ml-1" />
                    {form.nextFollowUpTime}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Quick notes preview */}
          {form.notes.trim() && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-900">Quick Notes</h3>
              </div>
              <p className="text-sm text-purple-900 line-clamp-4">{form.notes}</p>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-bold text-gray-900">Tips</h3>
            </div>
            <p className="text-sm text-yellow-900">
              Mention fleet size, service area, pricing discussion and next action for better follow-up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
