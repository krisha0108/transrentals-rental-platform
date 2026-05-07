'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  FileText,
  Eye,
  Clock,
  DollarSign,
  Plane,
} from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentNumber: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  verifiedAt: string | null;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
}

interface AgentDetail {
  id: string;
  agencyName: string;
  agencyType: string | null;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  description: string | null;
  website: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy: { name: string } | null;
  createdAt: string;
  documents: Document[];
  bankAccounts: BankAccount[];
  _count: { leads: number; tours: number; properties: number; bookings: number };
}

export default function AdminTravelAgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/travel-agents/${id}`);
      if (res.ok) setAgent(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const performAction = async (action: string, rejectionReason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/travel-agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (res.ok) {
        await load();
        setShowRejectForm(false);
        setRejectReason('');
      } else {
        const j = await res.json();
        alert(j.error || 'Action failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const verifyDocument = async (documentId: string, action: 'VERIFY' | 'REJECT', rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/admin/travel-agents/${id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action, rejectionReason }),
      });
      if (res.ok) {
        await load();
      } else {
        const j = await res.json();
        alert(j.error || 'Failed');
      }
    } catch {
      alert('Server error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Travel agent not found</p>
      </div>
    );
  }

  const statusBadgeClass: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    DOCUMENTS_PENDING: 'bg-orange-100 text-orange-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-purple-100 text-purple-800',
    BLOCKED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/travel-agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="w-4 h-4" /> All Travel Agents
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{agent.agencyName}</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {agent.ownerName} • {agent.agencyType || 'Agency'}
                </p>
              </div>
              <span
                className={`ml-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                  statusBadgeClass[agent.status]
                }`}
              >
                {agent.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Item icon={Mail} value={agent.email} />
              <Item icon={Phone} value={agent.phone} />
              {(agent.address || agent.city) && (
                <Item
                  icon={MapPin}
                  value={[agent.address, agent.city, agent.state, agent.pincode].filter(Boolean).join(', ')}
                />
              )}
              {agent.website && <Item icon={Building2} value={agent.website} />}
            </div>

            {(agent.gstNumber || agent.panNumber) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                {agent.gstNumber && <span>GST: <strong>{agent.gstNumber}</strong></span>}
                {agent.panNumber && <span>PAN: <strong>{agent.panNumber}</strong></span>}
              </div>
            )}

            {agent.rejectionReason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-700">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-1">{agent.rejectionReason}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {agent.status !== 'APPROVED' && (
              <button
                onClick={() => performAction('APPROVE')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
            )}
            {agent.status !== 'REJECTED' && (
              <button
                onClick={() => setShowRejectForm((v) => !v)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            )}
            {agent.status === 'APPROVED' && (
              <button
                onClick={() => performAction('SUSPEND')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" /> Suspend
              </button>
            )}
            {agent.status === 'SUSPENDED' && (
              <button
                onClick={() => performAction('UNSUSPEND')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                Unsuspend
              </button>
            )}
            {agent.status !== 'BLOCKED' && (
              <button
                onClick={() => performAction('BLOCK')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Block
              </button>
            )}
          </div>
        </div>

        {showRejectForm && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700 mb-2">Provide rejection reason</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Why is this application being rejected?"
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowRejectForm(false)}
                className="text-sm text-gray-600 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => performAction('REJECT', rejectReason)}
                disabled={!rejectReason.trim() || actionLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Plane} label="Leads" value={agent._count.leads} />
        <Stat icon={Plane} label="Tours" value={agent._count.tours} />
        <Stat icon={Building2} label="Properties" value={agent._count.properties} />
        <Stat icon={Plane} label="Bookings" value={agent._count.bookings} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" /> Documents ({agent.documents.length})
        </h2>
        {agent.documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {agent.documents.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between gap-3 p-4 border border-gray-200 rounded-xl">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{doc.documentName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.documentType.replace(/_/g, ' ')} {doc.documentNumber && `• ${doc.documentNumber}`}
                  </p>
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View File
                  </a>
                  {doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">{doc.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      doc.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-700'
                        : doc.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {doc.status === 'VERIFIED' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : doc.status === 'REJECTED' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {doc.status}
                  </span>
                  {doc.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyDocument(doc.id, 'VERIFY')}
                        className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason?');
                          if (reason) verifyDocument(doc.id, 'REJECT', reason);
                        }}
                        className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" /> Bank Accounts ({agent.bankAccounts.length})
        </h2>
        {agent.bankAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">No bank accounts added</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agent.bankAccounts.map((acc) => (
              <div key={acc.id} className="border border-gray-200 rounded-xl p-4 text-sm">
                <p className="font-bold text-gray-900">{acc.bankName}</p>
                <p className="text-xs text-gray-500 mt-1">{acc.accountHolderName}</p>
                <p className="text-xs text-gray-700 mt-2">
                  ••••{acc.accountNumber.slice(-4)} • IFSC {acc.ifscCode}
                </p>
                {acc.isPrimary && (
                  <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    PRIMARY
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span>{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
