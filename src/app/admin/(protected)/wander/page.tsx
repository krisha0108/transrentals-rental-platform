// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Layers, List, MessageSquare, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

export default function AdminWanderOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [listingsRes, quotesRes, catsRes] = await Promise.all([
          fetch('/api/admin/wander/listings?limit=1'),
          fetch('/api/admin/wander/quotes?limit=1'),
          fetch('/api/admin/wander/categories'),
        ]);
        const listingsData = await listingsRes.json();
        const quotesData = await quotesRes.json();
        const catsData = await catsRes.json();

        const [activeRes, pendingRes] = await Promise.all([
          fetch('/api/admin/wander/listings?status=active&limit=1'),
          fetch('/api/admin/wander/quotes?status=pending&limit=1'),
        ]);
        const activeData = await activeRes.json();
        const pendingData = await pendingRes.json();

        setStats({
          totalListings: listingsData.total || 0,
          activeListings: activeData.total || 0,
          totalCategories: Array.isArray(catsData) ? catsData.length : 0,
          totalQuotes: quotesData.total || 0,
          pendingQuotes: pendingData.total || 0,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Listings', value: stats?.totalListings, icon: List, color: 'indigo', href: '/admin/wander/listings' },
    { label: 'Active Listings', value: stats?.activeListings, icon: TrendingUp, color: 'emerald', href: '/admin/wander/listings?status=active' },
    { label: 'Categories', value: stats?.totalCategories, icon: Layers, color: 'purple', href: '/admin/wander/categories' },
    { label: 'Total Quote Requests', value: stats?.totalQuotes, icon: MessageSquare, color: 'blue', href: '/admin/wander/quotes' },
    { label: 'Pending Quotes', value: stats?.pendingQuotes, icon: Clock, color: 'amber', href: '/admin/wander/quotes?status=pending' },
  ];

  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const quickLinks = [
    { label: 'Manage Categories', desc: 'Add, edit, reorder tour categories', href: '/admin/wander/categories', icon: Layers, color: 'purple' },
    { label: 'Tour Experiences', desc: 'Define canonical experiences for vendor grouping', href: '/admin/wander/experiences', icon: Compass, color: 'indigo' },
    { label: 'All Listings', desc: 'View and manage all vendor tour listings', href: '/admin/wander/listings', icon: List, color: 'indigo' },
    { label: 'Quote Requests', desc: 'Monitor all customer quote requests', href: '/admin/wander/quotes', icon: MessageSquare, color: 'blue' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wander Tours</h1>
          <p className="text-sm text-gray-500">Tour marketplace management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '—' : (card.value ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 group-hover:text-indigo-600 transition">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Manage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[link.color]}`}>
                <link.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
