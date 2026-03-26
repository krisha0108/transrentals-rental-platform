'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    licenseNumber: '', licenseType: '', licenseExpiry: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '',
    emergencyContact: '', emergencyPhone: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

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
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setError('');
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
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Personal Info</h2>
          <div>
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input className={inputClass} value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input className={inputClass} value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
            </div>
          </div>
        </div>

        {/* License */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">License</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>License Number</label>
              <input className={inputClass} value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>License Type</label>
              <select className={inputClass} value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
                <option value="">Select</option>
                {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>License Expiry</label>
            <input type="date" className={inputClass} value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
          </div>
        </div>

        {/* Bank */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Bank Details</h2>
          <div>
            <label className={labelClass}>Bank Name</label>
            <input className={inputClass} value={form.bankName} onChange={e => set('bankName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Account Holder Name</label>
            <input className={inputClass} value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Account Number</label>
              <input className={inputClass} value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>IFSC Code</label>
              <input className={inputClass} value={form.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contact Name</label>
              <input className={inputClass} value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input className={inputClass} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
