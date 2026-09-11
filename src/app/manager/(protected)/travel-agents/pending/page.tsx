'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plane,
  Clock,
  FileText,
  Eye,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useManagerPageHeader } from '@/hooks/useManagerPageHeader';

interface TravelAgent {
  id: string;
  agencyName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  city: string | null;
  state: string | null;
  createdAt: string;
  _count: { documents: number; leads: number; tours: number; properties: number; bookings: number };
}

export default function ManagerPendingTravelAgentsPage() {
  const [agents, setAgents] = useState<TravelAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch each pending status separately so we can group them
        const statuses = ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'];
        const results = await Promise.all(
          statuses.map((s) =>
            fetch(`/api/manager/travel-agents?status=${s}&limit=100`).then((r) => r.json()),
          ),
        );
        const merged: TravelAgent[] = [];
        for (const r of results) {
          if (r?.travelAgents) merged.push(...r.travelAgents);
        }
        merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        setAgents(merged);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Header goes into the shared sticky bar, which was otherwise rendering empty.
  useManagerPageHeader(
    'Pending Approvals',
    `${agents.length} awaiting review`,
    undefined,
    <Link
      key="back"
      href="/manager/travel-agents"
      title="All travel agents"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 text-gray-600"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>,
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No travel agents pending approval 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{a.agencyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {a.ownerName} • {a.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.phone} {a.city && `• ${a.city}, ${a.state}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {a.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <Box icon={FileText} value={a._count.documents} label="Docs" />
                <Box icon={Plane} value={a._count.tours} label="Tours" />
                <Box icon={Plane} value={a._count.bookings} label="Bookings" />
              </div>

              <Link
                href={`/manager/travel-agents/${a.id}`}
                className="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Review Application
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Box({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2">
      <div className="flex items-center justify-center gap-1 text-gray-700">
        <Icon className="w-3.5 h-3.5" />
        <span className="font-bold">{value}</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
