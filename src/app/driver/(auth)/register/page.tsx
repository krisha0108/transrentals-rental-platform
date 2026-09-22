'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, User, Phone, Mail, Lock, Eye, EyeOff, ChevronRight, ChevronLeft, Loader2, FileText, CreditCard } from 'lucide-react';

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];
const STEPS = ['Personal Info', 'License & Docs', 'Bank Details'];

// Latest date of birth that still makes someone 18 today — used as the date
// input's `max` so the picker itself can't offer an under-18 date.
function getMaxDobForAge18(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function isAtLeast18(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 18;
}

// Valid Indian state/UT codes used in the computerized DL number's first two
// letters (same codes as vehicle registration). Merged/renamed UTs (DD+DN
// now DH, OR now OD) both still appear on real licenses depending on when it
// was issued, so both are kept.
const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DN', 'DH', 'DL', 'GA', 'GJ',
  'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ',
  'NL', 'OD', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
];

// Computerized DL format since ~2011: 2-letter state code + 2-digit RTO code
// + 4-digit year of issue + 7-digit serial = 15 characters. A driver whose
// physical card still shows an older format has this number in their Sarathi
// record already — they just need to look it up, not "convert" anything.
const DL_NUMBER_REGEX = /^([A-Z]{2})(\d{2})(\d{4})(\d{7})$/;

function validateDlNumber(raw: string): string | null {
  const value = raw.trim().toUpperCase();
  const match = DL_NUMBER_REGEX.exec(value);
  if (!match) {
    return 'Enter a valid 15-character DL number (e.g. DL0120110012345), or check "issued before 2011" below if yours is an older licence.';
  }
  const [, stateCode, , yearStr] = match;
  if (!INDIAN_STATE_CODES.includes(stateCode)) {
    return `"${stateCode}" isn't a recognized state/UT code`;
  }
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  if (year < 1950 || year > currentYear) {
    return `License issue year (${year}) looks invalid`;
  }
  return null;
}

export default function DriverRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOldLicense, setIsOldLicense] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    name: '', phone: '', email: '', password: '',
    dateOfBirth: '', address: '', city: '', state: '', pincode: '',
    // Step 2
    aadharNumber: '', licenseNumber: '', licenseType: '', licenseExpiry: '',
    emergencyContact: '', emergencyPhone: '',
    // Step 3
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return 'Name is required';
      if (!form.phone.trim() || form.phone.length < 10) return 'Valid phone number is required';
      if (!form.email.trim()) return 'Email is required';
      if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.dateOfBirth && !isAtLeast18(form.dateOfBirth)) return 'You must be at least 18 years old to register as a driver';
      if (!form.licenseNumber.trim()) return 'License number is required';
      if (isOldLicense) {
        if (form.licenseNumber.trim().length < 4) return 'Enter your licence number exactly as printed on your card';
      } else {
        const dlError = validateDlNumber(form.licenseNumber);
        if (dlError) return dlError;
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isOldLicense }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Registration failed');
      if (data.token) localStorage.setItem('driver-token', data.token);
      router.push('/driver');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-3">
            <Car className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join as Driver</h1>
          <p className="text-emerald-100 text-sm mt-1">Register to start accepting trips</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`ml-1.5 text-xs font-medium hidden sm:block ${i === step ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-2 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Step 1: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" /> Personal Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input className={inputClass} placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Phone *</label>
                    <input className={inputClass} placeholder="10-digit mobile" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={10} />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input type="date" className={inputClass} value={form.dateOfBirth} max={getMaxDobForAge18()} onChange={e => set('dateOfBirth', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="email" className={`${inputClass} pl-9`} placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-9 pr-10`} placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>License Number *</label>
                  <input
                    className={inputClass}
                    placeholder={isOldLicense ? 'Enter it exactly as printed on your card' : 'e.g. DL0120110012345'}
                    value={form.licenseNumber}
                    onChange={e => set('licenseNumber', isOldLicense ? e.target.value.toUpperCase() : e.target.value.toUpperCase().replace(/[\s-]/g, ''))}
                    maxLength={isOldLicense ? 30 : 15}
                  />
                  <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOldLicense}
                      onChange={e => { setIsOldLicense(e.target.checked); setError(''); }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    My licence was issued before 2011 (old paper/booklet format)
                  </label>
                  {isOldLicense ? (
                    <p className="text-xs text-gray-500 mt-1">No problem — just type it exactly as printed on your licence card. We'll verify it manually.</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      15-character format only. Don't have this? Check the box above, or look your number up for free on{' '}
                      <a href="https://parivahan.gov.in/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline hover:text-emerald-700">
                        parivahan.gov.in
                      </a>{' '}
                      (Driving Licence → DL Search).
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input className={inputClass} placeholder="Street address" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>City</label>
                    <input className={inputClass} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input className={inputClass} placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input className={inputClass} placeholder="000000" value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: License & Documents */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> License & Documents</h2>
                <p className="text-xs text-gray-500 mt-1">Optional — you can skip this and add it later from your profile.</p>
              </div>
              <div>
                <label className={labelClass}>Aadhar Number</label>
                <input className={inputClass} placeholder="12-digit Aadhar number" value={form.aadharNumber} onChange={e => set('aadharNumber', e.target.value)} maxLength={12} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>License Type</label>
                  <select className={inputClass} value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
                    <option value="">Select type</option>
                    {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>License Expiry Date</label>
                  <input type="date" className={inputClass} value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Contact Name</label>
                    <input className={inputClass} placeholder="Name" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input className={inputClass} placeholder="Phone" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600" /> Bank Details</h2>
              <p className="text-sm text-gray-500">Optional — used to process your earnings payments. You can skip this and add it later from your profile.</p>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input className={inputClass} placeholder="e.g. State Bank of India" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Account Holder Name</label>
                <input className={inputClass} placeholder="As per bank records" value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input className={inputClass} placeholder="Bank account number" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>IFSC Code</label>
                <input className={inputClass} placeholder="e.g. SBIN0001234" value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => { setStep(s => s - 1); setError(''); }} className="flex items-center gap-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <>
                {step === 1 && (
                  <button onClick={() => { setStep(s => s + 1); setError(''); }} className="px-4 py-3 text-gray-500 font-medium text-sm hover:text-gray-700 transition">
                    Skip for now
                  </button>
                )}
                <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-3 text-gray-500 font-medium text-sm hover:text-gray-700 transition disabled:opacity-50">
                  Skip &amp; finish
                </button>
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : 'Complete Registration'}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <Link href="/driver/login" className="text-emerald-600 font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
