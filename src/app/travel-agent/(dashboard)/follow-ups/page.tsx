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
  PartyPopper,
} from 'lucide-react';
import { useTravelAgentPageHeader } from '@/hooks/useTravelAgentPageHeader';

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  tripType: string | null;
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

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-cyan-100 text-cyan-700',
  INTERESTED: 'bg-emerald-100 text-emerald-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  NEGOTIATING: 'bg-indigo-100 text-indigo-700',
  BOOKED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
  COLD: 'bg-gray-100 text-gray-700',
};

// "3 days overdue" / "Today, 2:30 PM" / "Tomorrow, 10:00 AM" / "Thu, 10:00 AM"
// — far easier to scan at a glance than a raw toLocaleString() timestamp.
function formatFollowUp(dateStr: string): { text: string; overdue: boolean } {
  const d = new Date(dateStr);
  const now = new Date();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayDiff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  );

  if (dayDiff < 0) {
    const days = Math.abs(dayDiff);
    return { text: `${days} day${days !== 1 ? 's' : ''} overdue`, overdue: true };
  }
  if (dayDiff === 0) return { text: `Today, ${time}`, overdue: d.getTime() < now.getTime() };
  if (dayDiff === 1) return { text: `Tomorrow, ${time}`, overdue: false };
  if (dayDiff < 7) return { text: `${d.toLocaleDateString('en-IN', { weekday: 'short' })}, ${time}`, overdue: false };
  return { text: `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`, overdue: false };
}

export default function FollowUpsPage() {
  const [buckets, setBuckets] = useState<Buckets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/travel-agent/follow-ups');
        if (res.ok) setBuckets(await res.json());
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalForHeader = buckets ? buckets.counts.overdue + buckets.counts.today + buckets.counts.upcoming : 0;
  useTravelAgentPageHeader(
    'Follow-Ups',
    !buckets ? undefined : totalForHeader > 0 ? `${totalForHeader} lead${totalForHeader !== 1 ? 's' : ''} needing your attention` : 'Stay on top of every lead',
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !buckets) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-sm font-semibold text-gray-700">Could not load follow-ups</p>
        <p className="text-xs text-gray-400 mt-1">Please refresh the page to try again.</p>
      </div>
    );
  }

  const total = totalForHeader;

  return (
    <div className="space-y-6">
      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <PartyPopper className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-bold text-gray-900">You're all caught up!</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            No follow-ups are due right now. New ones will show up here as you work your leads.
          </p>
          <Link
            href="/travel-agent/leads"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:underline mt-3"
          >
            View all leads <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard color="red" label="Overdue" value={buckets.counts.overdue} icon={AlertTriangle} href="#overdue" />
            <SummaryCard color="amber" label="Today" value={buckets.counts.today} icon={Clock} href="#today" />
            <SummaryCard color="blue" label="This Week" value={buckets.counts.upcoming} icon={Calendar} href="#upcoming" />
          </div>

          <Bucket id="overdue" title="Overdue" subtitle="Past their follow-up date" leads={buckets.overdue} icon={AlertTriangle} color="red" />
          <Bucket id="today" title="Today" subtitle="Due today" leads={buckets.today} icon={Clock} color="amber" />
          <Bucket id="upcoming" title="This Week" subtitle="Next 7 days" leads={buckets.upcoming} icon={Calendar} color="blue" />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  color,
  label,
  value,
  icon: Icon,
  href,
}: {
  color: 'red' | 'amber' | 'blue';
  label: string;
  value: number;
  icon: any;
  href: string;
}) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-200 border-t-red-400',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 border-t-amber-400',
    blue: 'bg-blue-50 text-blue-600 border-blue-200 border-t-blue-400',
  };
  return (
    <a href={href} className={`block rounded-2xl border border-t-[3px] p-4 hover:shadow-md transition-shadow ${colors[color]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </a>
  );
}

function Bucket({
  id,
  title,
  subtitle,
  leads,
  icon: Icon,
  color,
}: {
  id: string;
  title: string;
  subtitle: string;
  leads: Lead[];
  icon: any;
  color: 'red' | 'amber' | 'blue';
}) {
  if (leads.length === 0) return null; // no need to show an empty bucket once at least one has content

  const badgeColors = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <section id={id} className="scroll-mt-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${badgeColors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-gray-400">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {leads.map((lead) => {
          const { text: followUpText, overdue } = lead.nextFollowUp
            ? formatFollowUp(lead.nextFollowUp)
            : { text: '', overdue: false };
          return (
            <Link
              key={lead.id}
              href={`/travel-agent/leads/${lead.id}`}
              className={`flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOTS[lead.priority] || PRIORITY_DOTS.COLD}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">{lead.customerName}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${STATUS_COLORS[lead.status] || STATUS_COLORS.COLD}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {[lead.tripType?.replace(/_/g, ' '), lead.destination].filter(Boolean).join(' · ') || lead.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${lead.customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  title={`Call ${lead.customerPhone}`}
                  className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <p className={`text-xs font-semibold text-right whitespace-nowrap ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {followUpText}
                </p>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
