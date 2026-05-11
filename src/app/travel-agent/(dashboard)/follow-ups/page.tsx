'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Calendar,
  Phone,
  AlertTriangle,
  Clock,
  ArrowRight,
  Inbox,
  CheckCircle2,
} from 'lucide-react';

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  destination: string | null;
  status: string;
  priority: string;
  nextFollowUp: string | null;
  travelDate: string | null;
}

interface Buckets {
  overdue: Lead[];
  today: Lead[];
  upcoming: Lead[];
  counts: { overdue: number; today: number; upcoming: number };
}

const PRIORITY_DOTS: Record<string, string> = {
  HOT: 'bg-red-500',
  WARM: 'bg-amber-500',
  COLD: 'bg-gray-400',
};

export default function FollowUpsPage() {
  const [buckets, setBuckets] = useState<Buckets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/travel-agent/follow-ups');
        if (res.ok) setBuckets(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const total = (buckets?.counts.overdue ?? 0) + (buckets?.counts.today ?? 0) + (buckets?.counts.upcoming ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="text-sm text-gray-500">{total} leads needing your attention</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard color="red" label="Overdue" value={buckets?.counts.overdue ?? 0} icon={AlertTriangle} />
        <SummaryCard color="amber" label="Today" value={buckets?.counts.today ?? 0} icon={Clock} />
        <SummaryCard color="blue" label="This Week" value={buckets?.counts.upcoming ?? 0} icon={Calendar} />
      </div>

      <Bucket
        title="Overdue"
        subtitle="Past their follow-up date"
        leads={buckets?.overdue || []}
        emptyText="Nothing overdue 🎉"
        iconColor="text-red-500"
      />

      <Bucket
        title="Today"
        subtitle="Due today"
        leads={buckets?.today || []}
        emptyText="No follow-ups for today"
        iconColor="text-amber-500"
      />

      <Bucket
        title="This Week"
        subtitle="Next 7 days"
        leads={buckets?.upcoming || []}
        emptyText="Nothing scheduled this week"
        iconColor="text-blue-500"
      />
    </div>
  );
}

function SummaryCard({
  color,
  label,
  value,
  icon: Icon,
}: {
  color: 'red' | 'amber' | 'blue';
  label: string;
  value: number;
  icon: any;
}) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  leads,
  emptyText,
  iconColor,
}: {
  title: string;
  subtitle: string;
  leads: Lead[];
  emptyText: string;
  iconColor: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="text-xs text-gray-500">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${iconColor}`} />
          <p className="text-sm text-gray-500">{emptyText}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/travel-agent/leads/${lead.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOTS[lead.priority]}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{lead.customerName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.customerPhone}
                    </span>
                    {lead.destination && <span className="truncate">→ {lead.destination}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <div className="text-right">
                  <p className="text-amber-700 font-semibold">
                    {lead.nextFollowUp && new Date(lead.nextFollowUp).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400">{lead.status.replace(/_/g, ' ')}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
