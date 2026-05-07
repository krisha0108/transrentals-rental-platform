'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, DollarSign, Star } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string | null;
  upiId: string | null;
  isPrimary: boolean;
}

export default function TravelAgentBankDetailsPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'SAVINGS',
    branchName: '',
    upiId: '',
    isPrimary: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/travel-agent/bank-details');
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.accounts || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/travel-agent/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast({ type: 'success', title: 'Bank account added' });
        setForm({
          bankName: '',
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          accountType: 'SAVINGS',
          branchName: '',
          upiId: '',
          isPrimary: false,
        });
        setShowForm(false);
        await load();
      } else {
        const j = await res.json();
        showToast({ type: 'error', title: j.error || 'Failed to add account' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bank account?')) return;
    try {
      const res = await fetch(`/api/travel-agent/bank-details?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast({ type: 'success', title: 'Bank account removed' });
        await load();
      } else {
        showToast({ type: 'error', title: 'Failed to remove account' });
      }
    } catch {
      showToast({ type: 'error', title: 'Server error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Details</h1>
            <p className="text-sm text-gray-500">Manage payout accounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">New Bank Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank Name *" value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} required />
            <Field
              label="Account Holder Name *"
              value={form.accountHolderName}
              onChange={(v) => setForm({ ...form, accountHolderName: v })}
              required
            />
            <Field
              label="Account Number *"
              value={form.accountNumber}
              onChange={(v) => setForm({ ...form, accountNumber: v })}
              required
            />
            <Field
              label="IFSC Code *"
              value={form.ifscCode}
              onChange={(v) => setForm({ ...form, ifscCode: v.toUpperCase() })}
              required
              placeholder="HDFC0001234"
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Type</label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
              </select>
            </div>
            <Field label="Branch Name" value={form.branchName} onChange={(v) => setForm({ ...form, branchName: v })} />
            <Field label="UPI ID" value={form.upiId} onChange={(v) => setForm({ ...form, upiId: v })} placeholder="agency@upi" />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Set as primary payout account</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>Save Account</>
              )}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No bank accounts added yet</p>
          <p className="text-sm text-gray-400">Add at least one to receive customer payouts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{acc.bankName}</p>
                    {acc.isPrimary && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-amber-500" /> PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{acc.branchName || '—'}</p>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <Row k="Account Holder" v={acc.accountHolderName} />
                <Row k="Account Number" v={`••••${acc.accountNumber.slice(-4)}`} />
                <Row k="IFSC" v={acc.ifscCode} />
                <Row k="Type" v={acc.accountType} />
                {acc.upiId && <Row k="UPI" v={acc.upiId} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold text-gray-900">{v}</span>
    </div>
  );
}
