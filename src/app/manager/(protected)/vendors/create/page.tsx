'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, Mail, Phone, Lock, MapPin, Loader2,
  CheckCircle, ArrowLeft, Eye, EyeOff, ArrowRight, PhoneCall,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

const businessTypes = [
  'Sole Proprietor',
  'Partnership Firm',
  'Private Limited Company',
  'Limited Liability Partnership (LLP)',
  'Public Limited Company',
  'One Person Company (OPC)',
  'Other',
];

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh',
];

function ManagerCreateVendorPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callReportId = searchParams.get('callReportId') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ businessName: string; vid: string | null; linked: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    businessName: searchParams.get('businessName') || '',
    businessType: '',
    ownerName: searchParams.get('ownerName') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    password: '',
    address: searchParams.get('address') || '',
    city: searchParams.get('city') || '',
    state: '',
    pincode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let out = '';
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setFormData((prev) => ({ ...prev, password: out }));
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.ownerName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError('Business name, owner name, email, phone, and password are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!formData.city.trim() || !formData.state) {
      setError('City and state are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/manager/vendors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType || null,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          address: formData.address || null,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Awaited, not fired and forgotten. If this link-back is lost the
        // vendor exists but the call report still reads as an open lead, so
        // it keeps offering "Ready to Become Vendor" — and the next click
        // creates the same vendor a second time. Better to say it failed.
        let linked = false;
        if (callReportId) {
          try {
            const linkRes = await fetch(`/api/manager/call-reports/${callReportId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ vendorId: data.vendor.id, status: 'VENDOR_CREATED' }),
            });
            linked = linkRes.ok;
          } catch {
            linked = false;
          }
        }
        setSuccess({ businessName: data.vendor.businessName, vid: data.vendor.vid, linked });
      } else {
        setError(data.error || 'Failed to create vendor');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Header goes into the shared sticky bar, which was otherwise rendering empty.
  useManagerPageHeader(
    'Create Vendor',
    'Onboard a vendor on their behalf. This will be tracked against your account.',
    undefined,
    <Link
      key="back"
      href={callReportId ? '/manager/call-reports' : '/manager/vendors'}
      title="Back"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>,
  );

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Vendor Created</h1>
          <p className="text-gray-600 mb-1">
            <span className="font-medium">{success.businessName}</span> has been added
            {success.vid && <> as <span className="font-mono font-semibold text-green-700">{success.vid.toUpperCase()}</span></>}.
          </p>
          <p className="text-sm text-gray-500 mb-1">
            Share the login email/password with the vendor so they can log in and upload documents.
          </p>
          {callReportId && (
            success.linked ? (
              <p className="text-xs text-emerald-600 font-medium mb-5">Linked back to the call report — its status is now &quot;Vendor Created&quot;.</p>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3 py-2 font-medium mb-5">
                The vendor was created, but the call report could not be updated. Open that report and set its status to
                &quot;Vendor Created&quot; so nobody creates this vendor again.
              </p>
            )
          )}
          {!callReportId && <div className="mb-6" />}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => { setSuccess(null); setFormData({ businessName: '', businessType: '', ownerName: '', email: '', phone: '', password: '', address: '', city: '', state: '', pincode: '' }); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Create Another
            </button>
            {callReportId ? (
              <button
                onClick={() => router.push('/manager/call-reports')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Back to Call Reports
              </button>
            ) : (
              <button
                onClick={() => router.push('/manager/vendors')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Back to Vendors
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {callReportId && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium">
          <PhoneCall className="w-4 h-4 flex-shrink-0" /> Prefilled from a call report. Add the vendor's email and set a password to finish onboarding.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                placeholder="e.g. Raj Bike Rentals"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Business Type</label>
            <select name="businessType" value={formData.businessType} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-700">
              <option value="">Select (optional)</option>
              {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Owner / Contact Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange}
                placeholder="Owner's full name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="vendor@business.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="9737965551" maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="Min 8 characters"
                className="w-full pl-10 pr-20 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button type="button" onClick={generatePassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 px-2 py-1 rounded">
                Generate
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea name="address" value={formData.address} onChange={handleChange}
                placeholder="Shop / Office no., Street name, Landmark" rows={2}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
            <input type="text" name="city" value={formData.city} onChange={handleChange}
              placeholder="e.g. Ahmedabad"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
            <select name="state" value={formData.state} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-700">
              <option value="">Select State</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
              placeholder="380001" maxLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href={callReportId ? '/manager/call-reports' : '/manager/vendors'} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create Vendor <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ManagerCreateVendorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    }>
      <ManagerCreateVendorPageInner />
    </Suspense>
  );
}
