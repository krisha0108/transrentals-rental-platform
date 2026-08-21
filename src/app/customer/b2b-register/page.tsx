// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Building2, ArrowLeft, CheckCircle, Check,
  Eye, EyeOff, Mail, Phone, Lock, User, MapPin,
  Hash, Briefcase, ChevronRight, Users, ShieldCheck,
  BarChart3, Tag, Headphones,
} from 'lucide-react';

const BUSINESS_TYPES = [
  'IT / Software', 'Manufacturing', 'Logistics', 'Construction',
  'Healthcare', 'Education', 'Hospitality', 'Government',
  'BFSI', 'Retail', 'Other',
];

const FEATURES = [
  { Icon: Users, title: 'Dedicated Corporate Support', desc: 'Get a dedicated account manager and priority support.' },
  { Icon: ShieldCheck, title: 'Secure & Compliant', desc: 'Enterprise grade security to keep your data protected.' },
  { Icon: BarChart3, title: 'Fleet Management', desc: 'Real-time tracking, detailed analytics and performance insights.' },
  { Icon: Tag, title: 'Exclusive Benefits', desc: 'Special pricing, flexible plans and customized solutions.' },
];

const STATS = [
  { Icon: Users, value: '5000+', label: 'Businesses Trust Us' },
  { Icon: Headphones, value: '24/7', label: 'Support' },
  { Icon: MapPin, value: '500+', label: 'Cities Covered' },
  { Icon: ShieldCheck, value: '99.9%', label: 'Uptime & Secure' },
];

const inputCls = 'w-full px-3.5 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#09B368]/40 focus:border-[#09B368]/60 focus:outline-none text-sm bg-white/5 text-white placeholder-white/30 transition-colors b2b-dark-input';
const labelCls = 'block text-xs font-semibold text-white/45 mb-1.5 uppercase tracking-wide';

export default function B2BRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formStep, setFormStep] = useState<1 | 2>(1);
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

  function goToFormStep2() {
    if (!form.companyName || !form.companyAddress) {
      setError('Please fill all required fields');
      return;
    }
    setError('');
    setFormStep(2);
  }

  const FORM_STEPS = [
    { n: 1, label: 'Company Details' },
    { n: 2, label: 'Contact Person' },
  ] as const;

  const FormProgress = () => (
    <div className="flex items-center mb-6">
      {FORM_STEPS.map((s, idx) => (
        <div key={s.n} className={`flex items-center ${idx < FORM_STEPS.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                formStep === s.n
                  ? 'bg-[#09B368] text-white'
                  : formStep > s.n
                  ? 'bg-[#09B368]/20 text-[#3ddc8f]'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {formStep > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${formStep >= s.n ? 'text-white/80' : 'text-white/30'}`}>
              {s.label}
            </span>
          </div>
          {idx < FORM_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${formStep > s.n ? 'bg-[#09B368]/50' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );

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
    if (!/^\d{10}$/.test(form.phone) || !/^[6-9]/.test(form.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
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

  // Shared background wrapper — used for the success screen only
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
    <div className="min-h-screen w-full relative overflow-hidden flex items-start justify-center py-6 px-4 lg:px-6">
      {/* Single full-bleed background image, shared across the whole page */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/sections/b2b-register-bg2.png')" }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full max-w-[1520px] flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-0">

        {/* ── Left: brand / feature content — sits directly on the shared bg image ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="hidden lg:flex flex-col flex-1 py-6 pr-10 xl:pr-16 text-left"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Image src="/assets/Logo-favicon.png" alt="TransRentals" width={38} height={38} className="rounded-xl shrink-0" />
            <Image src="/assets/logo-tr-1.png" alt="TransRentals" width={160} height={30} className="object-contain h-6 w-auto" />
          </div>

          {/* Badge */}
          <div className="mt-9 inline-flex w-fit items-center gap-2 bg-[#09B368]/10 border border-[#09B368]/25 rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#09B368]" />
            <span className="text-[11px] font-bold text-[#078F53] tracking-wide uppercase">B2B Partner Program</span>
          </div>

          {/* Headline */}
          <h1 className="mt-5 text-4xl xl:text-[2.5rem] font-black text-gray-900 leading-[1.12]">
            Stronger <span className="text-[#09B368]">Partnerships.</span><br />
            Seamless <span className="text-[#09B368]">Logistics.</span>
          </h1>
          <p className="mt-4 text-gray-600 text-sm max-w-sm leading-relaxed">
            Join hundreds of businesses who trust TransRentals for their bulk transport bookings.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3.5 max-w-sm">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-white/80 backdrop-blur-sm border border-white/70 rounded-xl px-3.5 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#09B368]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#09B368]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mobile-only compact header (left branding is desktop-only) */}
        <div className="flex lg:hidden flex-col items-start text-left pt-2">
          <div className="flex items-center gap-2">
            <Image src="/assets/Logo-favicon.png" alt="TransRentals" width={34} height={34} className="rounded-lg shrink-0" />
            <Image src="/assets/logo-tr-1.png" alt="TransRentals" width={150} height={28} className="object-contain h-5 w-auto" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900 leading-tight">
            Stronger <span className="text-[#09B368]">Partnerships.</span> Seamless <span className="text-[#09B368]">Logistics.</span>
          </h1>
        </div>

        {/* ── Right: dark form card, floating on the same bg image ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative flex-1 lg:max-w-[640px] py-10"
        >
          {/* Seam badge — the pre-made partner badge cutout, sitting flush against the card's left edge (xl only) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
            className="hidden xl:block absolute -left-[108px] top-10 z-20 w-[132px]"
          >
            {/* Pulsing glow — traces the badge's own silhouette (a blurred copy of itself) */}
            <motion.div
              className="absolute inset-0 scale-110"
              style={{ filter: 'blur(16px) brightness(1.5) saturate(1.6)' }}
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image
                src="/images/sections/b2b-partner-badge-trimmed.png"
                alt=""
                width={360}
                height={1774}
                className="w-full h-auto"
                aria-hidden="true"
              />
            </motion.div>

            <Image
              src="/images/sections/b2b-partner-badge-trimmed.png"
              alt="Partner with TransRentals"
              width={360}
              height={1774}
              className="relative w-full h-auto"
              style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))' }}
            />
          </motion.div>

          {/* Rotating gradient ring — animated card border, with a soft ambient glow bleeding behind it */}
          <div className="relative">
            <motion.div
              className="absolute -inset-3 rounded-[2.5rem] bg-[#09B368]/20 blur-3xl pointer-events-none"
              animate={{ opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative rounded-3xl p-[1.5px] overflow-hidden">
              <motion.div
                className="absolute -inset-[75%]"
                style={{ background: 'conic-gradient(from 0deg, transparent 0%, #3ddc8f 10%, transparent 22%, transparent 78%, #09B368 90%, transparent 100%)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              />

          <div className="relative bg-[#0B1712] rounded-3xl overflow-hidden border border-white/5"
            style={{ boxShadow: '0 35px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

            {/* Card header */}
            <div className="px-7 pt-7 pb-5 border-b border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#09B368]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#3ddc8f]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">B2B Corporate Registration</h1>
                <p className="text-xs text-white/50 mt-0.5">Register your company for bulk transport bookings</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-7 py-5">
                <FormProgress />

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={formStep}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                {formStep === 1 && (
                <>
                {/* ── Step 1: Company Details ── */}
                <div>
                  <div className="space-y-3.5">
                    <div>
                      <label className={labelCls}>Company Name <span className="text-red-400 normal-case font-normal">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input type="text" value={form.companyName}
                          onChange={(e) => updateForm('companyName', e.target.value)}
                          placeholder="e.g. Tata Motors Ltd"
                          className={`${inputCls} pl-10`} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className={labelCls}>GSTIN <span className="text-white/30 normal-case font-normal">(optional)</span></label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input type="text" value={form.gstin}
                            onChange={(e) => updateForm('gstin', e.target.value.toUpperCase())}
                            placeholder="24AABCT1332E1ZH" maxLength={15}
                            className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Business Type</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                          <select value={form.businessType}
                            onChange={(e) => updateForm('businessType', e.target.value)}
                            className={`${inputCls} pl-10 appearance-none`}>
                            <option value="" className="bg-[#0B1712]">Select type</option>
                            {BUSINESS_TYPES.map(t => <option key={t} value={t} className="bg-[#0B1712]">{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Company Address <span className="text-red-400 normal-case font-normal">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
                        <textarea value={form.companyAddress}
                          onChange={(e) => updateForm('companyAddress', e.target.value)}
                          placeholder="e.g. 123, Industrial Area, Sector 5, Mumbai"
                          rows={2}
                          className={`${inputCls} pl-10 resize-none`} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className={labelCls}>Company Phone <span className="text-white/30 normal-case font-normal">(optional)</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input type="tel" value={form.companyPhone}
                            onChange={(e) => updateForm('companyPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Company Email <span className="text-white/30 normal-case font-normal">(optional)</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input type="email" value={form.companyEmail}
                            onChange={(e) => updateForm('companyEmail', e.target.value)}
                            placeholder="info@company.com"
                            className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </>
                )}

                {formStep === 2 && (
                <>
                {/* ── Step 2: Contact Person ── */}
                <div>
                  <div className="space-y-3.5">
                    <div>
                      <label className={labelCls}>Full Name <span className="text-red-400 normal-case font-normal">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
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
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input type="email" value={form.email}
                            onChange={(e) => updateForm('email', e.target.value)}
                            placeholder="rahul@company.com"
                            className={`${inputCls} pl-10`} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Phone <span className="text-red-400 normal-case font-normal">*</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
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
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input type={showPassword ? 'text' : 'password'} value={form.password}
                          onChange={(e) => updateForm('password', e.target.value)}
                          placeholder="Minimum 6 characters"
                          className={`${inputCls} pl-10 pr-11`} required minLength={6} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-6 flex gap-3 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">i</span>
                  </div>
                  <p className="leading-snug">After registration, admin will review and approve your B2B account. Once approved, you can create bulk transport bookings with post-paid billing.</p>
                </div>
                </>
                )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Card footer */}
              <div className="px-7 pb-6 pt-1 space-y-3 border-t border-white/10">
                {formStep === 1 && (
                  <button type="button" onClick={goToFormStep2}
                    className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-[#09B368]/25"
                    style={{ background: 'linear-gradient(90deg, #078F53 0%, #09B368 55%, #3ddc8f 100%)' }}>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {formStep === 2 && (
                  <div className="flex gap-2.5">
                    <button type="button" onClick={() => { setError(''); setFormStep(1); }}
                      className="px-4 py-3 border border-white/15 rounded-xl font-semibold text-white/60 hover:bg-white/5 transition-colors text-sm">
                      Back
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition shadow-lg shadow-[#09B368]/25"
                      style={{ background: 'linear-gradient(90deg, #078F53 0%, #09B368 55%, #3ddc8f 100%)' }}>
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Registering...</>
                        : <><Building2 className="w-4 h-4" />Register B2B Account</>}
                    </button>
                  </div>
                )}
                <p className="text-center text-xs text-white/40">
                  Already registered?{' '}
                  <Link href="/customer/login" className="text-[#3ddc8f] hover:text-[#09B368] font-semibold transition-colors">Sign in</Link>
                </p>
              </div>
            </form>
          </div>
            </div>
          </div>

          {/* Trust stats bar */}
          <div className="mt-5 bg-white rounded-2xl px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.12)' }}>
            {STATS.map(({ Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#09B368]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[#09B368]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
