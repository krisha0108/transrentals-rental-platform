'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, User, MapPinned,
  IdCard, Wallet, ShieldAlert, ChevronRight,
} from 'lucide-react';

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];

// Same DL validation as the registration form — kept in sync so a licence
// number is checked the same way whether it's entered at signup or added
// here later.
const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DN', 'DH', 'DL', 'GA', 'GJ',
  'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ',
  'NL', 'OD', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
];
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

const UPI_ID_REGEX = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;

function isValidUpiId(raw: string): boolean {
  return UPI_ID_REGEX.test(raw.trim());
}

// Same "receive to this UPI ID" QR the rest of the app already generates for
// UPI payments (src/components/bike/PaymentConfirmation.tsx) — no amount, so
// whoever scans it can pay any amount rather than a fixed one.
function buildUpiQrUrl(upiId: string, payeeName: string): string {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
}

function SectionCard({
  icon, iconColor, title, subtitle, badge, children,
}: {
  icon: ReactNode; iconColor: string; title: string; subtitle?: string; badge?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, required, optional, className = '', ...input
}: {
  label: string; required?: boolean; optional?: boolean; className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="text-gray-300 font-normal ml-1.5">(Optional)</span>}
      </label>
      <input
        {...input}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-green-500/40 focus:border-green-500 outline-none text-sm text-gray-900 transition"
      />
    </div>
  );
}

function Select({
  label, required, optional, className = '', children, ...select
}: {
  label: string; required?: boolean; optional?: boolean; className?: string; children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="text-gray-300 font-normal ml-1.5">(Optional)</span>}
      </label>
      <select
        {...select}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-green-500/40 focus:border-green-500 outline-none text-sm text-gray-900 transition"
      >
        {children}
      </select>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankDetailsComplete, setBankDetailsComplete] = useState(true);
  const [isOldLicense, setIsOldLicense] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // The offending field is usually further down the form than where Save
  // was clicked, so the error banner at the top needs to actually grab
  // attention — scrolled into view and focused, not just rendered.
  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    licenseNumber: '', licenseType: '', licenseExpiry: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', upiId: '',
    emergencyContact: '', emergencyPhone: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    fetch('/api/driver/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.driver) {
          const dr = d.driver;
          setForm({
            name: dr.name || '',
            address: dr.address || '',
            city: dr.city || '',
            state: dr.state || '',
            pincode: dr.pincode || '',
            licenseNumber: dr.licenseNumber || '',
            licenseType: dr.licenseType || '',
            licenseExpiry: dr.licenseExpiry ? dr.licenseExpiry.split('T')[0] : '',
            bankName: dr.bankName || '',
            accountHolderName: dr.accountHolderName || '',
            accountNumber: dr.accountNumber || '',
            ifscCode: dr.ifscCode || '',
            upiId: dr.upiId || '',
            emergencyContact: dr.emergencyContact || '',
            emergencyPhone: dr.emergencyPhone || '',
          });
          setBankDetailsComplete(dr.bankDetailsComplete !== false);
        } else {
          setError('Could not load your profile. Please refresh and try again.');
        }
      })
      .catch(() => setError('Could not load your profile. Please refresh and try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.licenseNumber.trim()) { setError('License number is required'); return; }
    if (isOldLicense) {
      if (form.licenseNumber.trim().length < 4) { setError('Enter your licence number exactly as printed on your card'); return; }
    } else {
      const dlError = validateDlNumber(form.licenseNumber);
      if (dlError) { setError(dlError); return; }
    }
    if (!form.licenseType) { setError('License type is required'); return; }
    if (!form.licenseExpiry) { setError('License expiry date is required'); return; }
    if (form.upiId && !isValidUpiId(form.upiId)) { setError('Enter a valid UPI ID (e.g. name@okhdfcbank)'); return; }
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const res = await fetch('/api/driver/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');
      setSuccess('Profile updated successfully');
      setTimeout(() => router.push('/driver/profile'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Keep your details current — vendors and support use this to reach you.</p>
        </div>
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="flex items-start gap-2.5 mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm outline-none focus:ring-2 focus:ring-red-400"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Row 1: Personal + License side by side */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            icon={<User className="w-5 h-5 text-green-600" />}
            iconColor="bg-green-50"
            title="Personal Info"
          >
            <Field label="Full Name" required value={form.name} onChange={e => set('name', e.target.value)} />
            <Field label="Address" optional value={form.address} onChange={e => set('address', e.target.value)} />
            <div className="grid grid-cols-3 gap-3.5">
              <Field label="City" optional value={form.city} onChange={e => set('city', e.target.value)} />
              <Field label="State" optional value={form.state} onChange={e => set('state', e.target.value)} />
              <Field label="Pincode" optional value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
            </div>
          </SectionCard>

          <SectionCard
            icon={<IdCard className="w-5 h-5 text-blue-600" />}
            iconColor="bg-blue-50"
            title="Driving License"
            subtitle="Shown to vendors before they assign you a trip"
          >
            <div className="grid grid-cols-2 gap-3.5">
              <Field
                label="License Number" required value={form.licenseNumber}
                onChange={e => set('licenseNumber', isOldLicense ? e.target.value.toUpperCase() : e.target.value.toUpperCase().replace(/[\s-]/g, ''))}
                placeholder={isOldLicense ? 'Enter it exactly as printed on your card' : 'e.g. DL0120110012345'}
                maxLength={isOldLicense ? 30 : 15}
              />
              <Select label="License Type" required value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
                <option value="">Select</option>
                {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <label className="flex items-center gap-2 -mt-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isOldLicense}
                onChange={e => { setIsOldLicense(e.target.checked); setError(''); }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              My licence was issued before 2011 (old paper/booklet format)
            </label>
            {isOldLicense ? (
              <p className="-mt-2 text-xs text-gray-400">No problem — just type it exactly as printed on your licence card. We&apos;ll verify it manually.</p>
            ) : (
              <p className="-mt-2 text-xs text-gray-400">
                15-character format only. Don&apos;t have this? Check the box above, or look your number up for free on{' '}
                <a href="https://parivahan.gov.in/" target="_blank" rel="noopener noreferrer" className="text-green-600 underline hover:text-green-700">
                  parivahan.gov.in
                </a>{' '}
                (Driving Licence → DL Search).
              </p>
            )}
            <Field label="License Expiry" required type="date" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
          </SectionCard>
        </div>

        {/* Row 2: Bank + Emergency side by side */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            icon={<Wallet className="w-5 h-5 text-amber-600" />}
            iconColor="bg-amber-50"
            title="Bank Details"
            subtitle="Where your trip earnings get paid out"
            badge={
              bankDetailsComplete ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" /> Needed for payouts
                </span>
              )
            }
          >
            <Field label="Bank Name" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. State Bank of India" />
            <Field label="Account Holder Name" value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} placeholder="As per bank records" />
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Account Number" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
              <Field label="IFSC Code" value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Field
                label="UPI ID" optional value={form.upiId}
                onChange={e => set('upiId', e.target.value.trim())}
                placeholder="e.g. yourname@okhdfcbank"
              />
              {isValidUpiId(form.upiId) && (
                <div className="mt-3 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildUpiQrUrl(form.upiId, form.name || 'TransRentals Driver')}
                    alt={`UPI QR code for ${form.upiId}`}
                    className="w-20 h-20 rounded-lg border border-gray-200 bg-white shrink-0"
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Scan to pay {form.upiId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Generated automatically from your UPI ID</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
            iconColor="bg-rose-50"
            title="Emergency Contact"
            subtitle="Who we call if something goes wrong on a trip"
          >
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Contact Name" optional value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
              <Field label="Contact Phone" optional value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
            </div>
          </SectionCard>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-600/20"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save Changes <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}
