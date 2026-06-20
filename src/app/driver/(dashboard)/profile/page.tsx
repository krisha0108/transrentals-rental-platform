'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileShareCard from '@/components/profile/ProfileShareCard';
import {
  Phone, Mail, CreditCard, Car, Calendar, Building, LogOut,
  Loader2, AlertCircle, Pencil, Camera, Shield, CheckCircle,
  MapPin, Clock,
} from 'lucide-react';

interface Driver {
  id: string;
  did: string | null;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  status: string;
  joiningDate?: string;
  createdAt?: string;
  city?: string;
  state?: string;
  vendor?: { id: string; businessName: string };
}

export default function DriverProfilePage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/driver/auth/me');
      const data = await res.json();
      if (data.success) setDriver(data.driver);
    } catch {}
    finally { setIsLoading(false); }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/driver/profile/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && driver) setDriver({ ...driver, profilePhoto: data.url });
    } catch {}
    setUploadingPhoto(false);
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    try {
      await fetch('/api/driver/auth/logout', { method: 'POST' });
      localStorage.removeItem('driver-token');
      router.push('/driver/login');
    } catch {}
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  );

  if (!driver) return (
    <div className="text-center py-12 text-red-500">Failed to load profile</div>
  );

  const isActive = driver.status === 'ACTIVE';
  const licenseExpired = driver.licenseExpiry ? new Date(driver.licenseExpiry) < new Date() : false;
  const licenseExpiringSoon = !licenseExpired && driver.licenseExpiry
    ? new Date(driver.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;
  const joinDate = driver.joiningDate || driver.createdAt;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtMonth = (d: string) => new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your TransRentals driver identity</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/driver/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Pencil className="w-4 h-4" /> Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* ── LICENSE WARNING ─────────────────────────────────────────────── */}
      {(licenseExpired || licenseExpiringSoon) && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border ${licenseExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${licenseExpired ? 'text-red-500' : 'text-amber-500'}`} />
          <p className={`text-sm font-medium ${licenseExpired ? 'text-red-700' : 'text-amber-700'}`}>
            {licenseExpired
              ? 'Your driving license has expired — please renew immediately.'
              : 'Your driving license expires within 30 days — renew soon.'}
          </p>
        </div>
      )}

      {/* ── MAIN LAYOUT: ID card left, details right ────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ══ ID CARD (fixed width, portrait) ═══════════════════════════ */}
        <div className="w-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/20 select-none">

          {/* Card header */}
          <div className="bg-emerald-900 flex items-center justify-between px-4 py-3 gap-2">
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <img src="/assets/logo-white.png" alt="TransRentals" className="h-5 object-contain object-left" style={{ width: '100px' }} />
              <p className="text-emerald-400 text-[9px] tracking-widest uppercase leading-none whitespace-nowrap">Driver ID Card</p>
            </div>
            <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isActive ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {driver.status}
            </div>
          </div>

          {/* Photo area */}
          <div className="bg-gradient-to-b from-emerald-800 to-emerald-700 flex flex-col items-center py-6 gap-3">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-xl">
                {driver.profilePhoto
                  ? <img src={driver.profilePhoto} alt={driver.name} className="w-full h-full object-cover" />
                  : <span className="text-white text-5xl font-black">{driver.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border border-gray-100 hover:bg-gray-50 transition">
                {uploadingPhoto
                  ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  : <Camera className="w-4 h-4 text-emerald-600" />
                }
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ''; }} />
              </label>
            </div>
            <div className="text-center px-3">
              <h2 className="text-white font-black text-xl leading-tight">{driver.name}</h2>
              {driver.did && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-white font-mono font-bold text-sm tracking-widest">{driver.did}</span>
                </div>
              )}
              {driver.vendor && (
                <p className="text-emerald-300 text-xs mt-2 truncate px-2">{driver.vendor.businessName}</p>
              )}
            </div>
          </div>

          {/* License strip */}
          <div className="bg-emerald-700 px-4 py-3 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 text-[9px] uppercase tracking-widest">License No.</p>
                <p className="text-white font-mono font-bold text-sm mt-0.5">{driver.licenseNumber || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-[9px] uppercase tracking-widest">Type</p>
                <p className="text-white font-bold text-sm mt-0.5">{driver.licenseType || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-emerald-400 text-[9px] uppercase tracking-widest">Valid Until</p>
              <p className={`font-bold text-sm mt-0.5 ${licenseExpired ? 'text-red-300' : licenseExpiringSoon ? 'text-yellow-300' : 'text-white'}`}>
                {driver.licenseExpiry ? fmtDate(driver.licenseExpiry) : '—'}
              </p>
            </div>
          </div>

          {/* Card footer */}
          <div className="bg-emerald-950 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isActive
                ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                : <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              }
              <span className="text-white/50 text-[10px]">{isActive ? 'Verified Driver' : 'Inactive'}</span>
            </div>
            {joinDate && (
              <span className="text-white/30 text-[10px]">Since {fmtMonth(joinDate)}</span>
            )}
          </div>
        </div>

        {/* ══ RIGHT SIDE: detail cards ══════════════════════════════════ */}
        <div className="flex-1 space-y-4">

          {/* Row 1: Contact + License side by side */}
          <div className="grid grid-cols-2 gap-4">

            {/* Contact */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Phone Number</p>
                    <p className="font-semibold text-gray-900 font-mono">{driver.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400">Email Address</p>
                    <p className="font-semibold text-gray-900 truncate">{driver.email}</p>
                  </div>
                </div>
                {(driver.city || driver.state) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900">{[driver.city, driver.state].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Member Since</p>
                      <p className="font-semibold text-gray-900">{fmtDate(joinDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* License */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Driving License</h3>
              {driver.licenseNumber ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">License Number</p>
                      <p className="font-mono font-bold text-gray-900">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  {driver.licenseType && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">License Type</p>
                        <p className="font-semibold text-gray-900">{driver.licenseType}</p>
                      </div>
                    </div>
                  )}
                  {driver.licenseExpiry && (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${licenseExpired ? 'bg-red-50' : licenseExpiringSoon ? 'bg-amber-50' : 'bg-blue-50'}`}>
                        <Calendar className={`w-5 h-5 ${licenseExpired ? 'text-red-600' : licenseExpiringSoon ? 'text-amber-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Valid Until</p>
                        <p className={`font-semibold ${licenseExpired ? 'text-red-600' : licenseExpiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                          {fmtDate(driver.licenseExpiry)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                  <CreditCard className="w-10 h-10 mb-2" />
                  <p className="text-sm text-gray-400">No license on file</p>
                  <Link href="/driver/profile/edit" className="text-xs text-emerald-600 hover:underline mt-1">Add license →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Company (if vendor) + Public share */}
          <div className={`grid gap-4 ${driver.vendor ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {driver.vendor && (
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Company</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{driver.vendor.businessName}</p>
                    <p className="text-sm text-gray-400 mt-0.5">Your employing company</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Public Profile</h3>
              <ProfileShareCard kind="driver" showVisibility={false} showSlug={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
