'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  FileText,
  Loader2,
  CheckCircle,
  ArrowRight,
  Shield,
  TrendingUp,
  IndianRupee,
  Star,
  Zap,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

const BENEFITS = [
  { icon: IndianRupee, text: 'Earn ₹50,000+ per month', color: 'text-green-600 bg-green-50' },
  { icon: TrendingUp, text: 'Access 1 Lakh+ customers', color: 'text-blue-600 bg-blue-50' },
  { icon: Zap, text: 'Get bookings within 24 hrs', color: 'text-amber-600 bg-amber-50' },
  { icon: Star, text: '0% commission on earnings', color: 'text-purple-600 bg-purple-50' },
];

const STEPS_AFTER = [
  { step: '01', title: 'Fill this 2-min form', desc: 'Basic info + business address' },
  { step: '02', title: 'Upload documents', desc: 'Business license & vehicle RC' },
  { step: '03', title: 'Get verified in 24 hrs', desc: 'Our team reviews your profile' },
  { step: '04', title: 'Start receiving bookings', desc: 'Earn from day one' },
];

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    if (pw.length < 8) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
    return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
  };

  const pwStrength = passwordStrength(formData.password);

  const validateStep1 = () => {
    if (!formData.businessName.trim()) { setError('Business name is required'); return false; }
    if (!formData.ownerName.trim()) { setError('Owner name is required'); return false; }
    if (!formData.email.trim()) { setError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email'); return false; }
    if (!formData.phone.trim()) { setError('Phone number is required'); return false; }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) { setError('Please enter a valid 10-digit phone number'); return false; }
    if (!formData.password) { setError('Password is required'); return false; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address.trim()) { setError('Business address is required'); return false; }
    if (!formData.city.trim()) { setError('City is required'); return false; }
    if (!formData.state) { setError('Please select your state'); return false; }
    if (!formData.pincode.trim()) { setError('Pincode is required'); return false; }
    if (!/^\d{6}$/.test(formData.pincode)) { setError('Please enter a valid 6-digit pincode'); return false; }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          businessName: formData.businessName,
          businessType: formData.businessType || null,
          ownerName: formData.ownerName,
          gstNumber: formData.gstNumber || null,
          panNumber: formData.panNumber || null,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/vendor/login'), 4000);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Link href="/" className="inline-block mb-6">
            <img src="/assets/logo-trans.png" alt="TransRentals" className="h-10 mx-auto" />
          </Link>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
          <p className="text-gray-600 mb-2">Your vendor account is created successfully.</p>
          <p className="text-sm text-gray-500 mb-6">
            Log in and upload your documents to get verified within 24 hours — then start earning!
          </p>
          <div className="space-y-2 mb-6">
            {STEPS_AFTER.slice(1).map((s) => (
              <div key={s.step} className="flex items-center gap-3 text-left bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-xs font-bold text-blue-600 shrink-0">{s.step}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/vendor/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold w-full justify-center"
          >
            Go to Vendor Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-3">Redirecting automatically in a few seconds…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/Logo-favicon.png" alt="TransRentals" className="h-8 w-8" />
            <img src="/assets/logo-trans.png" alt="TransRentals" className="h-7 hidden sm:block" />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 hidden sm:inline">Takes only</span>
            <span className="font-semibold text-green-600">2 minutes</span>
            <span className="text-gray-300 mx-1">|</span>
            <Link href="/vendor/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero headline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" />
            Free to Join — No Commission — No Hidden Charges
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Turn Your Fleet into a<br />
            <span className="text-blue-600">Revenue Machine</span>
          </h1>
          <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
            Join 10,000+ vendors across 150+ cities earning consistently on TransRentals. Set up your profile in 2 minutes.
          </p>
        </div>

        {/* Benefit pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {BENEFITS.map(({ icon: Icon, text, color }) => (
            <div key={text} className={`flex items-center gap-2 rounded-xl px-3 py-3 ${color.split(' ')[1]} border border-gray-100`}>
              <Icon className={`w-5 h-5 shrink-0 ${color.split(' ')[0]}`} />
              <span className="text-xs font-semibold text-gray-700 leading-tight">{text}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left - How it works */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">How it works</h3>
              <div className="space-y-4">
                {STEPS_AFTER.map((s, i) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i === 0 ? <Zap className="w-4 h-4" /> : s.step}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${i === 0 ? 'text-blue-700' : 'text-gray-800'}`}>{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini testimonial */}
              <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "I listed my 3 bikes on TransRentals and started getting bookings within the first week. Best decision for my business."
                </p>
                <p className="text-xs font-semibold text-gray-800 mt-2">— Rajesh K., Bike Rental, Pune</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-extrabold text-blue-600">10K+</div>
                  <div className="text-xs text-gray-500">Vendors</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-extrabold text-green-600">150+</div>
                  <div className="text-xs text-gray-500">Cities</div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-extrabold text-purple-600">24/7</div>
                  <div className="text-xs text-gray-500">Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
              {/* Progress steps */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold uppercase tracking-wide ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Step 1</p>
                    <p className="text-xs text-gray-500">Account & Contact</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Step 2</p>
                    <p className="text-xs text-gray-500">Business Address</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full mb-6">
                <div
                  className="h-1.5 bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Business Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="e.g. Raj Bike Rentals"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Business Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Business Type
                        </label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
                        >
                          <option value="">Select (optional)</option>
                          {businessTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Owner Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Owner / Contact Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Business Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@business.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-gray-500">+91</span>
                            <span className="text-gray-300">|</span>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9737965551"
                            maxLength={10}
                            className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 8 characters"
                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            required
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pwStrength && (
                          <div className="mt-1.5 space-y-1">
                            <div className="h-1 bg-gray-100 rounded-full">
                              <div className={`h-1 rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                            </div>
                            <p className={`text-xs font-medium ${
                              pwStrength.label === 'Weak' ? 'text-red-500' :
                              pwStrength.label === 'Fair' ? 'text-amber-500' :
                              pwStrength.label === 'Good' ? 'text-blue-500' : 'text-green-500'
                            }`}>{pwStrength.label} password</p>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                              formData.confirmPassword && formData.confirmPassword !== formData.password
                                ? 'border-red-300 bg-red-50'
                                : formData.confirmPassword && formData.confirmPassword === formData.password
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200'
                            }`}
                            required
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {formData.confirmPassword && formData.confirmPassword === formData.password && (
                            <CheckCircle className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                    >
                      Next Step for Becoming a Vendor <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      By continuing, you agree to our{' '}
                      <Link href="/terms" className="text-blue-500 hover:underline">Terms</Link> &{' '}
                      <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
                    </p>
                  </div>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                      <span>We need your business address to match you with customers in your area and send payments.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* GST */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          GST Number
                          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={handleChange}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uppercase"
                          />
                        </div>
                      </div>

                      {/* PAN */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          PAN Number
                          <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                            placeholder="AAAAA0000A"
                            maxLength={10}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uppercase"
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Business Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Shop / Office no., Street name, Landmark"
                            rows={2}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                            required
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. Ahmedabad"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
                          required
                        >
                          <option value="">Select State</option>
                          {states.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="380001"
                          maxLength={6}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition font-semibold text-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating your account…
                          </>
                        ) : (
                          <>
                            Next Step for Becoming a Vendor <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Secured</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Data Protected</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Free to join</span>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-5 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/vendor/login" className="text-blue-600 font-semibold hover:underline">
                  Login here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="bg-white border-t border-gray-200 py-4 mt-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Secured</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit Encryption</span>
          </div>
          <span>&copy; {new Date().getFullYear()} TransRentals. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
