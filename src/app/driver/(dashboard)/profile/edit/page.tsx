'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, User, MapPinned,
  IdCard, Wallet, ShieldAlert, ChevronRight,
} from 'lucide-react';

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];

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
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm text-gray-900 transition"
      />
    </div>
  );
}

function Select({
  label, optional, className = '', children, ...select
}: {
  label: string; optional?: boolean; className?: string; children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
        {optional && <span className="text-gray-300 font-normal ml-1.5">(Optional)</span>}
      </label>
      <select
        {...select}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm text-gray-900 transition"
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

  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    licenseNumber: '', licenseType: '', licenseExpiry: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
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
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
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
        <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal */}
        <SectionCard
          icon={<User className="w-5 h-5 text-emerald-600" />}
          iconColor="bg-emerald-50"
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

        {/* License */}
        <SectionCard
          icon={<IdCard className="w-5 h-5 text-blue-600" />}
          iconColor="bg-blue-50"
          title="Driving License"
          subtitle="Shown to vendors before they assign you a trip"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="License Number" optional value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value.toUpperCase())} placeholder="e.g. DL0120110012345" />
            <Select label="License Type" optional value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
              <option value="">Select</option>
              {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Field label="License Expiry" optional type="date" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
        </SectionCard>

        {/* Bank */}
        <SectionCard
          icon={<Wallet className="w-5 h-5 text-amber-600" />}
          iconColor="bg-amber-50"
          title="Bank Details"
          subtitle="Where your trip earnings get paid out"
          badge={
            bankDetailsComplete ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
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
        </SectionCard>

        {/* Emergency */}
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

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save Changes <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}
