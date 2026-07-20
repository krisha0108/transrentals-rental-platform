'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Landmark,
  CreditCard,
  Shield,
  Zap,
  ExternalLink,
  Coins,
  Gift,
  TrendingUp,
} from 'lucide-react';
import VendorMediaPicker from '@/components/vendor/VendorMediaPicker';
import BackrCard from '@/components/backr/BackrCard';

interface VendorProfile {
  id: string;
  vid: string | null;
  email: string;
  phone: string;
  businessName: string;
  businessType: string | null;
  ownerName: string;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo: string | null;
  description: string | null;
  website: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
  status: string;
  createdAt: string;
}

const businessTypes = [
  'Sole Proprietor',
  'Partnership',
  'LLP',
  'Private Limited',
  'Public Limited',
  'Other',
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

function clearVendorProfileCache(session: ReturnType<typeof useSession>['data']) {
  const vendorId = (session?.user as any)?.id || (session?.user as any)?.email || 'unknown';
  try { sessionStorage.removeItem(`vendor_profile_cache_${vendorId}`); } catch { /* ignore */ }
}

export default function VendorProfilePage() {
  const { data: session } = useSession();
  const [isFlipped, setIsFlipped] = useState(false);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Contact change request state
  const [pendingContactReq, setPendingContactReq] = useState<{
    id: string; newEmail: string | null; newPhone: string | null;
  } | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ newEmail: '', newPhone: '' });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    ownerName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    logo: '',
    description: '',
    website: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchPendingContactReq();
  }, []);

  const fetchPendingContactReq = async () => {
    try {
      const res = await fetch('/api/vendor/contact-change-request');
      if (res.ok) {
        const data = await res.json();
        setPendingContactReq(data.request);
      }
    } catch {}
  };

  const handleContactChangeSubmit = async () => {
    setContactError('');
    setContactSuccess('');
    if (!contactForm.newEmail && !contactForm.newPhone) {
      setContactError('Enter at least new email or new phone');
      return;
    }
    setContactSaving(true);
    try {
      const res = await fetch('/api/vendor/contact-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: contactForm.newEmail || undefined, newPhone: contactForm.newPhone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setContactError(data.error || 'Failed to submit request'); return; }
      setPendingContactReq(data.request);
      setShowContactForm(false);
      setContactForm({ newEmail: '', newPhone: '' });
      setContactSuccess('Request submitted! Admin will review and update your contact info.');
    } catch { setContactError('Network error'); }
    finally { setContactSaving(false); }
  };

  const handleCancelContactReq = async () => {
    if (!pendingContactReq) return;
    try {
      await fetch(`/api/vendor/contact-change-request?id=${pendingContactReq.id}`, { method: 'DELETE' });
      setPendingContactReq(null);
      setContactSuccess('');
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/vendor/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          businessName: data.businessName || '',
          businessType: data.businessType || '',
          ownerName: data.ownerName || '',
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          logo: data.logo || '',
          description: data.description || '',
          website: data.website || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          accountHolderName: data.accountHolderName || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        try { sessionStorage.removeItem('vendor_logo_cache'); } catch { /* ignore */ }
        clearVendorProfileCache(session);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide";
  const selectClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-6 items-start">
          <div className="w-72 shrink-0 h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your TransRentals vendor identity</p>
        </div>
        <button
          type="button"
          onClick={() => { const form = document.querySelector('form'); form?.requestSubmit(); }}
          disabled={saving}
          className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            : <><Save className="w-4 h-4 mr-2" />Save Changes</>
          }
        </button>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-5 h-5" />
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* ── MAIN LAYOUT: ID card left, form right ─────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ══ VENDOR ID CARD — flip ═══════════════════════════════════════ */}
        {profile && (
          <div className="w-64 shrink-0 select-none" style={{ perspective: '1100px', height: '400px' }}>
            <div
              onClick={() => setIsFlipped(f => !f)}
              className="relative w-full h-full cursor-pointer"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4,0.2,0.2,1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >

              {/* ── FRONT ─────────────────────────────────────────────────── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                {/* full card gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700" />

                {/* decorative diagonal stripes */}
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                  backgroundSize: '12px 12px',
                }} />

                {/* decorative circle glow top-right */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl" />

                {/* content */}
                <div className="relative h-full flex flex-col">
                  {/* top bar */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <img src="/assets/logo-white.png" alt="TransRentals" className="h-5 object-contain" style={{ width: '95px' }} />
                    <span className="text-emerald-400/70 text-[8px] tracking-[0.2em] uppercase font-medium">Vendor Card</span>
                  </div>

                  {/* center hero */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                    {/* shield icon with rings */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-24 h-24 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute w-20 h-20 rounded-full border border-emerald-400/20" />
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 border border-emerald-400/40 flex items-center justify-center backdrop-blur-sm shadow-xl">
                        <Shield className="w-8 h-8 text-emerald-300" />
                      </div>
                    </div>

                    {/* text */}
                    <div className="text-center">
                      <p className="text-emerald-300/70 text-[9px] tracking-[0.25em] uppercase mb-1">TransRentals</p>
                      <h2 className="text-white font-black text-xl leading-tight tracking-wide">TRUSTED</h2>
                      <h2 className="text-white font-black text-xl leading-tight tracking-wide">VENDOR</h2>
                      <div className="mt-3 h-px w-10 bg-emerald-500/50 mx-auto" />
                      <p className="text-emerald-200 font-semibold text-sm mt-3 leading-tight px-2">{profile.businessName}</p>
                      {profile.vid && (
                        <p className="text-emerald-400 font-mono text-xs mt-1 tracking-widest">{profile.vid.toUpperCase()}</p>
                      )}
                    </div>

                    {/* verified pill */}
                    {profile.status === 'APPROVED' && (
                      <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-3 py-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-green-300 text-[10px] font-bold tracking-widest uppercase">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/30 text-[9px] tracking-wider">transrentals.in</span>
                    <span className="text-emerald-400/50 text-[9px] tracking-widest uppercase">Tap to flip</span>
                  </div>
                </div>
              </div>

              {/* ── BACK ──────────────────────────────────────────────────── */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-900 to-emerald-950" />
                <div className="relative h-full flex flex-col">

                  {/* top bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <img src="/assets/logo-white.png" alt="TransRentals" className="h-4 object-contain" style={{ width: '85px' }} />
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      profile.status === 'APPROVED'
                        ? 'bg-green-500/15 border-green-500/30 text-green-300'
                        : profile.status === 'PENDING'
                        ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300'
                        : 'bg-red-500/15 border-red-500/30 text-red-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        profile.status === 'APPROVED' ? 'bg-green-400 animate-pulse' : profile.status === 'PENDING' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      {profile.status}
                    </div>
                  </div>

                  {/* profile strip */}
                  <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-emerald-800/30">
                    {/* letter avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                      <span className="text-white text-xl font-black">{profile.businessName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-sm leading-tight truncate">{profile.businessName}</h3>
                      <p className="text-emerald-400 text-[11px] mt-0.5 truncate">{profile.ownerName}</p>
                      {profile.vid && (
                        <div className="inline-flex items-center gap-1 mt-1 bg-white/10 border border-white/15 rounded px-1.5 py-0.5">
                          <Shield className="w-2.5 h-2.5 text-emerald-300" />
                          <span className="text-white font-mono font-bold text-[10px] tracking-widest">{profile.vid.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* details */}
                  <div className="flex-1 px-4 py-3 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-emerald-500 text-[8px] uppercase tracking-widest font-semibold">GST No.</p>
                        <p className="text-white font-mono text-[11px] font-bold mt-0.5 truncate">{profile.gstNumber || '—'}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-emerald-500 text-[8px] uppercase tracking-widest font-semibold">Phone</p>
                        <p className="text-white text-[11px] font-bold mt-0.5">{profile.phone}</p>
                      </div>
                    </div>

                    <div className="h-px bg-white/8" />

                    {(profile.city || profile.state) && (
                      <div>
                        <p className="text-emerald-500 text-[8px] uppercase tracking-widest font-semibold">Location</p>
                        <p className="text-white text-[12px] font-semibold mt-0.5">{[profile.city, profile.state].filter(Boolean).join(', ')}</p>
                      </div>
                    )}

                    {profile.email && (
                      <div>
                        <p className="text-emerald-500 text-[8px] uppercase tracking-widest font-semibold">Email</p>
                        <p className="text-white text-[11px] mt-0.5 truncate">{profile.email}</p>
                      </div>
                    )}

                    {profile.businessType && (
                      <div>
                        <p className="text-emerald-500 text-[8px] uppercase tracking-widest font-semibold">Business Type</p>
                        <p className="text-white text-[11px] font-semibold mt-0.5">{profile.businessType}</p>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {profile.status === 'APPROVED'
                        ? <CheckCircle className="w-3 h-3 text-green-400" />
                        : <AlertCircle className="w-3 h-3 text-yellow-400" />
                      }
                      <span className="text-white/40 text-[9px]">
                        {profile.status === 'APPROVED' ? 'Verified Vendor' : 'Pending Approval'}
                      </span>
                    </div>
                    {profile.createdAt && (
                      <span className="text-white/25 text-[9px]">
                        Since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ RIGHT SIDE: form sections ════════════════════════════════════ */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">

          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Business Information</h2>
            </div>

            <div className="mb-5">
              <VendorMediaPicker
                value={formData.logo}
                onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                label="Business Logo"
                accept="image"
                folder="logos"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Business Name *</label>
                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Business Type</label>
                <select name="businessType" value={formData.businessType} onChange={handleChange} className={selectClass}>
                  <option value="">Select Type</option>
                  {businessTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Owner Name *</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Business Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe your business..." className={inputClass} />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileText className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Tax Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>GST Number</label>
                <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" maxLength={15} className={`${inputClass} uppercase`} />
              </div>
              <div>
                <label className={labelClass}>PAN Number</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="AAAAA1234A" maxLength={10} className={`${inputClass} uppercase`} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <User className="w-[18px] h-[18px] text-emerald-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Contact Information</h2>
              </div>
              {!pendingContactReq && !showContactForm && (
                <button
                  type="button"
                  onClick={() => { setShowContactForm(true); setContactError(''); setContactSuccess(''); }}
                  className="text-sm text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Request Change
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  {profile?.email}
                </div>
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  {profile?.phone}
                </div>
              </div>
            </div>

            {pendingContactReq && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Change Request Pending</p>
                    <p className="text-xs text-amber-700 mt-0.5">Your request is awaiting admin approval.</p>
                    <div className="mt-1.5 text-xs text-amber-900 space-y-0.5">
                      {pendingContactReq.newEmail && <p>New Email: <strong>{pendingContactReq.newEmail}</strong></p>}
                      {pendingContactReq.newPhone && <p>New Phone: <strong>{pendingContactReq.newPhone}</strong></p>}
                    </div>
                  </div>
                  <button type="button" onClick={handleCancelContactReq} className="text-xs text-red-500 hover:underline shrink-0 mt-0.5">Cancel</button>
                </div>
              </div>
            )}

            {contactSuccess && !pendingContactReq && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">{contactSuccess}</div>
            )}

            {showContactForm && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 mt-1">
                <p className="text-xs text-gray-500">Fill in the fields you want to change. Leave blank to keep current.</p>
                {contactError && <p className="text-xs text-red-600">{contactError}</p>}
                <div>
                  <label className={labelClass}>New Email</label>
                  <input type="email" value={contactForm.newEmail} onChange={e => setContactForm(p => ({ ...p, newEmail: e.target.value }))} placeholder={profile?.email} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div>
                  <label className={labelClass}>New Phone</label>
                  <input type="tel" value={contactForm.newPhone} onChange={e => setContactForm(p => ({ ...p, newPhone: e.target.value }))} placeholder={profile?.phone} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleContactChangeSubmit} disabled={contactSaving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                    {contactSaving ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button type="button" onClick={() => { setShowContactForm(false); setContactError(''); }} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Business Address */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Business Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Street Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} placeholder="Enter your full address" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <select name="state" value={formData.state} onChange={handleChange} className={selectClass}>
                  <option value="">Select State</option>
                  {indianStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6} pattern="[0-9]{6}" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Landmark className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Bank Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Account Holder Name</label>
                <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} placeholder="Name as per bank account" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g., State Bank of India" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="e.g., SBIN0001234" maxLength={11} className={`${inputClass} uppercase`} />
              </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Important</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Bank details are required for receiving payments from bookings.
                    Ensure all information is accurate to avoid payment delays.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── BACKR Rewards ── */}
          <BackrCard type="vendor" />

        </form>
      </div>

      {/* Sticky footer save button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { const form = document.querySelector('form'); form?.requestSubmit(); }}
            disabled={saving}
            className="inline-flex items-center px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200/50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
