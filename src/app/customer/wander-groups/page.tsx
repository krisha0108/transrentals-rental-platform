// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, MapPin, Loader2, ArrowRight, ChevronRight,
  MessageCircle, Compass, Globe,
} from 'lucide-react';
import CustomerHeader from '@/components/customer/CustomerHeader';

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CustomerWanderGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const str = localStorage.getItem('customer');
      if (!str) { router.push('/customer/login'); return; }
      const parsed = JSON.parse(str);
      const id = parsed?.id || parsed?.customer_id || parsed?.customerId;
      if (!id) { router.push('/customer/login'); return; }
      setCustomerId(id);
      fetch(`/api/customer/wander-groups?customer_id=${id}`)
        .then(r => r.json())
        .then(d => setGroups(d.groups || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } catch { router.push('/customer/login'); }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Wander</p>
              <h1 className="text-2xl font-black text-white">My Group Trips</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Plan trips with friends &amp; family</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Groups list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No group trips yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Browse tours, find something you love, and invite your friends to plan together.
            </p>
            <Link
              href="/wander"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-md shadow-emerald-500/20"
            >
              Explore Tours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group: any) => {
              const memberCount = group.members?.length ?? 0;
              const tripCount = group.trips?.length ?? 0;
              const latestTrip = group.trips?.[0];
              const listingTitle = latestTrip?.listing?.title;
              const location = latestTrip?.listing?.mainLocation?.name;

              return (
                <Link
                  key={group.id}
                  href={`/wander/group/${group.groupCode}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 text-2xl shadow-sm">
                        {group.emoji || '✈️'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-emerald-700 transition-colors">
                            {group.name}
                          </h3>
                          {group.hasUnread && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {memberCount} member{memberCount !== 1 ? 's' : ''}
                          </span>
                          {tripCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Compass className="w-3 h-3" /> {tripCount} tour{tripCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {location}
                            </span>
                          )}
                          <span className="text-gray-400">
                            {group.myRole === 'ADMIN' ? '👑 Admin' : '🙋 Member'}
                          </span>
                        </div>

                        {/* Latest tour */}
                        {listingTitle && (
                          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-indigo-100">
                            <Compass className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{listingTitle}</span>
                          </div>
                        )}
                      </div>

                      {/* Right arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Unread badge */}
                    {group.hasUnread && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                        <MessageCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600 font-medium">New messages in group chat</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
