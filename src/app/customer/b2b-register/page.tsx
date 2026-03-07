// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Building2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

const BUSINESS_TYPES = [
  'IT / Software', 'Manufacturing', 'Logistics', 'Construction',
  'Healthcare', 'Education', 'Hospitality', 'Government',
  'BFSI', 'Retail', 'Other',
];

export default function B2BRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', gstin: '', businessType: '',
  });

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.phone || !form.password || !form.companyName) {
      setError('Please fill all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          isB2B: true,
          companyName: form.companyName,
          gstin: form.gstin,
          businessType: form.businessType,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCustomerId(data.customers.id);
        setStep('success');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-2">
            Your B2B account has been created. It is pending admin approval.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will be able to create bulk bookings once your account is approved. We'll notify you shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Your Customer ID</p>
            <p className="font-mono font-bold text-green-600">{customerId}</p>
          </div>
          <Link
            href={`/customer/b2b-bookings?customer_id=${customerId}`}
            className="inline-block w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Go to B2B Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">B2B Registration</h1>
            <p className="text-sm text-gray-500">Register your company for bulk transport bookings</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Section */}
          <div className="bg-green-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Company Details</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text" value={form.companyName}
                onChange={(e) => updateForm('companyName', e.target.value)}
                placeholder="e.g. Tata Motors Ltd"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN (optional)</label>
              <input
                type="text" value={form.gstin}
                onChange={(e) => updateForm('gstin', e.target.value.toUpperCase())}
                placeholder="e.g. 24AABCT1332E1ZH"
                maxLength={15}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={form.businessType}
                onChange={(e) => updateForm('businessType', e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Person Section */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-gray-700">Contact Person Details</span>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text" value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email" value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="e.g. rahul@company.com"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel" value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                  required minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <strong>How it works:</strong> After registration, admin will review and approve your B2B account.
            Once approved, you can create bulk transport bookings with post-paid billing.
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={submitting}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
            {submitting ? 'Registering...' : 'Register as B2B Customer'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already registered?{' '}
            <Link href="/customer/login" className="text-green-600 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
