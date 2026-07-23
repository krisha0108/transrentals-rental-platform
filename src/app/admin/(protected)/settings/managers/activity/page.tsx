'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, CheckCircle2, Store, ArrowLeft, Shield, Loader2 } from 'lucide-react';

interface ActorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface VendorEvent {
  id: string;
  vid: string | null;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  date: string | null;
  by: ActorInfo | null;
}

interface ManagerSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  created: number;
  approved: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-purple-100 text-purple-800',
  BLOCKED: 'bg-gray-100 text-gray-800',
};

export default function ManagerActivityPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ManagerSummary[]>([]);
  const [created, setCreated] = useState<VendorEvent[]>([]);
  const [approved, setApproved] = useState<VendorEvent[]>([]);
  const [tab, setTab] = useState<'created' | 'approved'>('created');

  useEffect(() => {
    fetch('/api/admin/managers/activity')
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary || []);
        setCreated(data.created || []);
        setApproved(data.approved || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const rows = tab === 'created' ? created : approved;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings/managers" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Activity</h1>
          <p className="text-gray-500 mt-1">Track which manager created or approved which vendor</p>
        </div>
      </div>

      {/* Per-manager summary */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Summary by Manager</h2>
        </div>
        {summary.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No manager-attributed vendor activity yet.
          </div>
        ) : (
          <div className="divide-y">
            {summary.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email} · {m.role}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <UserPlus className="w-4 h-4" /> {m.created} created
                  </span>
                  <span className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 className="w-4 h-4" /> {m.approved} approved
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'created', label: 'Vendors Created', icon: UserPlus, count: created.length },
            { id: 'approved', label: 'Vendors Approved', icon: CheckCircle2, count: approved.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'created' | 'approved')}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{t.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Store className="w-10 h-10 mb-3 text-gray-300" />
            <p>No {tab === 'created' ? 'manager-created' : 'manager-approved'} vendors yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">{tab === 'created' ? 'Created By' : 'Approved By'}</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{v.businessName}</p>
                      <p className="text-sm text-gray-500">{v.ownerName}{v.vid ? ` · ${v.vid.toUpperCase()}` : ''}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{v.email}</p>
                      <p>{v.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[v.status] || 'bg-gray-100 text-gray-800'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {v.by ? (
                        <>
                          <p className="font-medium">{v.by.name}</p>
                          <p className="text-xs text-gray-500">{v.by.role}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(v.date)}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/vendors/${v.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
