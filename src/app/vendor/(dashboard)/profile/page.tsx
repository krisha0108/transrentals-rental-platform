'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Landmark,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VendorMediaPicker from '@/components/vendor/VendorMediaPicker';
import ProfileShareCard from '@/components/profile/ProfileShareCard';

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

export default function VendorProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
  }, []);

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
        // Clear sidebar logo cache so it picks up the new logo
        try { sessionStorage.removeItem('vendor_logo_cache'); } catch { /* ignore */ }
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
      <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
        <div className="w-full space-y-5">
          {/* Skeleton header */}
          <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
          {/* Skeleton cards */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(j => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.18; }
          50% { transform: translateY(-18px) scale(1.12); opacity: 0.32; }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.14; }
          50% { transform: translateY(14px) scale(1.08); opacity: 0.28; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes bubble-rise-1 {
          0% { transform: translateY(0) scale(0.7); opacity: 0.5; }
          100% { transform: translateY(-80px) scale(1.1); opacity: 0; }
        }
        @keyframes bubble-rise-2 {
          0% { transform: translateY(0) scale(0.5); opacity: 0.4; }
          100% { transform: translateY(-60px) scale(0.9); opacity: 0; }
        }
        @keyframes bubble-drift {
          0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0.35; }
          100% { transform: translateY(-70px) translateX(20px) scale(1); opacity: 0; }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 15px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 30px rgba(16,185,129,0.4); }
        }
      `}</style>

      <div className="w-full space-y-5">
        {/* Alive Emerald Header */}
        <div className="relative bg-emerald-600 rounded-2xl px-5 sm:px-6 py-4 sm:py-5 overflow-hidden shadow-xl" style={{ animation: 'scale-in 0.5s ease-out, glow-emerald 2.5s ease-in-out infinite' }}>
          {/* Multi-layer radial bg */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.6)_0%,_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.3)_0%,_transparent_50%)]"></div>

          {/* Floating rings */}
          <div className="absolute -top-8 -right-8 w-32 h-32 border-[3px] border-white/10 rounded-full" style={{ animation: 'float-slow 6s ease-in-out infinite' }}></div>
          <div className="absolute top-12 -right-4 w-20 h-20 border-2 border-white/10 rounded-full" style={{ animation: 'float-rev 5s ease-in-out infinite' }}></div>
          <div className="absolute -bottom-6 left-16 w-24 h-24 border-2 border-white/10 rounded-full" style={{ animation: 'float-slow 7s ease-in-out infinite 1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-14 h-14 border border-white/5 rounded-full" style={{ animation: 'float-rev 8s ease-in-out infinite 0.5s' }}></div>

          {/* Sparkle dots */}
          <div className="absolute top-4 right-20 w-1.5 h-1.5 bg-white rounded-full" style={{ animation: 'sparkle 3s ease-in-out infinite' }}></div>
          <div className="absolute top-10 right-36 w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.8s' }}></div>
          <div className="absolute bottom-6 right-28 w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 4s ease-in-out infinite 1.5s' }}></div>
          <div className="absolute top-1/2 left-[45%] w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 3.5s ease-in-out infinite 2s' }}></div>

          {/* Rising bubbles */}
          <div className="absolute bottom-0 left-[15%] w-2.5 h-2.5 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 4s ease-in-out infinite' }}></div>
          <div className="absolute bottom-0 left-[35%] w-2 h-2 rounded-full bg-white/25" style={{ animation: 'bubble-rise-2 5s ease-in-out 0.8s infinite' }}></div>
          <div className="absolute bottom-0 left-[55%] w-1.5 h-1.5 rounded-full bg-white/15" style={{ animation: 'bubble-drift 6s ease-in-out 1.5s infinite' }}></div>
          <div className="absolute bottom-0 left-[70%] w-2 h-2 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 4.5s ease-in-out 0.5s infinite' }}></div>
          <div className="absolute bottom-0 left-[85%] w-3 h-3 rounded-full bg-white/10" style={{ animation: 'bubble-drift 7s ease-in-out 1s infinite' }}></div>

          {/* Shimmer sweep */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer-sweep 4s ease-in-out infinite' }}></div>
          </div>

          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="group relative z-10 mb-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div style={{ animation: 'slide-in-left 0.6s ease-out' }}>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm">
                Business Profile
              </h1>
              <p className="text-white/60 text-xs mt-0.5 font-medium" style={{ animation: 'slide-in-left 0.6s ease-out 0.1s both' }}>
                Manage your business information
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.vid && (
                <div className="px-4 py-2 rounded-xl text-xs font-bold bg-white/25 backdrop-blur-sm text-white border border-white/30 shadow-lg tracking-widest"
                  style={{ animation: 'bounce-in 0.7s ease-out 0.2s both' }}>
                  {profile.vid.toUpperCase()}
                </div>
              )}
              <div className="px-4 py-2 rounded-xl text-xs font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20 shadow-lg"
                style={{ animation: 'bounce-in 0.7s ease-out 0.3s both' }}>
                Status: {profile?.status?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium" style={{ animation: 'fade-up 0.4s ease-out' }}>
            <CheckCircle className="w-5 h-5" />
            Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium" style={{ animation: 'fade-up 0.4s ease-out' }}>
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="mb-5">
          <ProfileShareCard kind="vendor" showVisibility={false} showSlug={false} />
        </div>

        <form onSubmit={handleSubmit} className="columns-1 lg:columns-2 gap-5 space-y-5">
          {/* Business Information */}
          <div className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6" style={{ animation: 'fade-up 0.5s ease-out 0.15s both' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Business Information</h2>
            </div>

            {/* Business Logo */}
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
                <label className={labelClass}>
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Select Type</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Business Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe your business..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6" style={{ animation: 'fade-up 0.5s ease-out 0.25s both' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileText className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Tax Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className={`${inputClass} uppercase`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="AAAAA1234A"
                  maxLength={10}
                  className={`${inputClass} uppercase`}
                />
              </div>
            </div>
          </div>

          {/* Contact Information - Read Only */}
          <div className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6" style={{ animation: 'fade-up 0.5s ease-out 0.35s both' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Email
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  {profile?.email}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Phone
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  {profile?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6" style={{ animation: 'fade-up 0.5s ease-out 0.45s both' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Business Address</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Street Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter your full address"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="break-inside-avoid bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 sm:p-6" style={{ animation: 'fade-up 0.5s ease-out 0.55s both' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Landmark className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="Name as per bank account"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., State Bank of India"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                  className={`${inputClass} uppercase`}
                />
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

        </form>
      </div>

      {/* Sticky footer save button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => { const form = document.querySelector('form'); form?.requestSubmit(); }}
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
