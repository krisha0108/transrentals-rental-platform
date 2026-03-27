// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2, Building2, ArrowLeft, CheckCircle,
  Eye, EyeOff, Mail, Phone, Lock, User, MapPin,
  Hash, Briefcase, ChevronRight,
} from 'lucide-react';

const BUSINESS_TYPES = [
  'IT / Software', 'Manufacturing', 'Logistics', 'Construction',
  'Healthcare', 'Education', 'Hospitality', 'Government',
  'BFSI', 'Retail', 'Other',
];

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

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
    companyAddress: '', companyPhone: '', companyEmail: '',
  });

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password || !form.companyName || !form.companyAddress) {
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
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          isB2B: true,
          companyName: form.companyName, gstin: form.gstin, businessType: form.businessType,
          companyAddress: form.companyAddress, companyPhone: form.companyPhone, companyEmail: form.companyEmail,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.token) localStorage.setItem('auth_token', data.token);
        if (data.customers) localStorage.setItem('customer', JSON.stringify(data.customers));
        setCustomerId(data.customers.id);
        setStep('success');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Shared background wrapper
  const PageBg = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{background: 'linear-gradient(140deg, #033D26 0%, #056040 30%, #078F53 65%, #09B368 100%)'}}>
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 65%)', transform: 'translate(-40%,-40%)'}} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%)', transform: 'translate(35%,35%)'}} />
      <div className="absolute inset-0 pointer-events-none"
        style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '56px 56px'}} />
      {/* Floating service pills */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { label: 'Corporate Travel', top: '10%', left: '3%', rotate: '-5deg' },
          { label: 'Fleet Management', top: '25%', right: '3%', rotate: '6deg' },
          { label: 'Bulk Bookings', bottom: '30%', left: '3%', rotate: '4deg' },
          { label: 'Post-paid Billing', bottom: '15%', right: '4%', rotate: '-4deg' },
        ].map(pill => (
          <div key={pill.label}
            style={{ top: pill.top, left: pill.left, right: pill.right, bottom: pill.bottom, transform: `rotate(${pill.rotate})` }}
            className="absolute flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="text-white/75 text-xs font-medium whitespace-nowrap">{pill.label}</span>
          </div>
        ))}
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );

  if (step === 'success') {
    return (
      <PageBg>
        <div className="max-w-[420px] mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-11 h-11 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center border border-white/25 backdrop-blur-sm shadow-lg">
              <Image src="/assets/Logo-favicon.png" alt="TR" width={34} height={34} className="object-contain" />
            </div>
            <span className="text-[1.6rem] font-bold text-white tracking-tight leading-none">
              Trans<span className="text-white/60">Rentals</span>
            </span>
          </div>
          {/* Success card */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow: '0 25px 60px rgba(0,0,0,0.25)'}}>
            <div className="bg-[#09B368] px-7 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
              <p className="text-white/75 text-sm mt-1">Your B2B account has been submitted</p>
            </div>
            <div className="px-7 py-6 text-center space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Your corporate account is now <strong>pending admin approval</strong>. You will be able to create bulk bookings once approved. We'll notify you shortly.
              </p>
              <div className="bg-[#09B368]/8 border border-[#09B368]/20 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Your Customer ID</p>
                <p className="font-mono font-bold text-[#09B368] text-lg">{customerId}</p>
              </div>
              <Link href={`/customer/b2b-bookings?customer_id=${customerId}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#09B368] text-white rounded-xl font-semibold hover:bg-[#078F53] transition text-sm shadow-sm shadow-[#09B368]/30">
                Go to B2B Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/customer/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </PageBg>
    );
  }

  return (
    <PageBg>
      <div className="max-w-[560px] mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <div className="w-11 h-11 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center border border-white/25 backdrop-blur-sm shadow-lg">
            <Image src="/assets/Logo-favicon.png" alt="TR" width={34} height={34} className="object-contain" />
          </div>
          <span className="text-[1.6rem] font-bold text-white tracking-tight leading-none">
            Trans<span className="text-white/60">Rentals</span>
          </span>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{boxShadow: '0 25px 60px rgba(0,0,0,0.25)'}}>

          {/* Card header */}
          <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#09B368]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-[#09B368]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">B2B Corporate Registration</h1>
              <p className="text-xs text-gray-500 mt-0.5">Register your company for bulk transport bookings</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-7 py-5 space-y-6">

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* ── Section 1: Company Details ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-[#09B368] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <span className="text-sm font-bold text-gray-900">Company Details</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className={labelCls}>Company Name <span className="text-red-400 normal-case font-normal">*</span></label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={form.companyName}
                        onChange={(e) => updateForm('companyName', e.target.value)}
                        placeholder="e.g. Tata Motors Ltd"
                        className={`${inputCls} pl-10`} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={labelCls}>GSTIN <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" value={form.gstin}
                          onChange={(e) => updateForm('gstin', e.target.value.toUpperCase())}
                          placeholder="24AABCT1332E1ZH" maxLength={15}
                          className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Business Type</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <select value={form.businessType}
                          onChange={(e) => updateForm('businessType', e.target.value)}
                          className={`${inputCls} pl-10 appearance-none`}>
                          <option value="">Select type</option>
                          {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Company Address <span className="text-red-400 normal-case font-normal">*</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <textarea value={form.companyAddress}
                        onChange={(e) => updateForm('companyAddress', e.target.value)}
                        placeholder="e.g. 123, Industrial Area, Sector 5, Mumbai"
                        rows={2}
                        className={`${inputCls} pl-10 resize-none`} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={labelCls}>Company Phone <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="tel" value={form.companyPhone}
                          onChange={(e) => updateForm('companyPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Company Email <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="email" value={form.companyEmail}
                          onChange={(e) => updateForm('companyEmail', e.target.value)}
                          placeholder="info@company.com"
                          className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Contact Person ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-[#09B368] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <span className="text-sm font-bold text-gray-900">Contact Person</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-400 normal-case font-normal">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={`${inputCls} pl-10`} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={labelCls}>Email <span className="text-red-400 normal-case font-normal">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="email" value={form.email}
                          onChange={(e) => updateForm('email', e.target.value)}
                          placeholder="rahul@company.com"
                          className={`${inputCls} pl-10`} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Phone <span className="text-red-400 normal-case font-normal">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="tel" value={form.phone}
                          onChange={(e) => updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className={`${inputCls} pl-10`} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Password <span className="text-red-400 normal-case font-normal">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={form.password}
                        onChange={(e) => updateForm('password', e.target.value)}
                        placeholder="Minimum 6 characters"
                        className={`${inputCls} pl-10 pr-11`} required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="flex gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">i</span>
                </div>
                <p className="leading-snug">After registration, admin will review and approve your B2B account. Once approved, you can create bulk transport bookings with post-paid billing.</p>
              </div>
            </div>

            {/* Card footer */}
            <div className="px-7 pb-6 pt-1 space-y-3 border-t border-gray-50">
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-[#09B368] text-white rounded-xl font-semibold hover:bg-[#078F53] disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition shadow-sm shadow-[#09B368]/30">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Registering...</>
                  : <><Building2 className="w-4 h-4" />Register B2B Account</>}
              </button>
              <p className="text-center text-xs text-gray-400">
                Already registered?{' '}
                <Link href="/customer/login" className="text-[#09B368] hover:text-[#078F53] font-semibold transition-colors">Sign in</Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-white/30 text-xs text-center mt-6">© 2025 TransRentals. All rights reserved.</p>
      </div>
    </PageBg>
  );
}
