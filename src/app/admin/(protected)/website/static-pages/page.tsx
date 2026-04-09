'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, ExternalLink, Check, RotateCcw, ChevronDown, ChevronUp,
  Globe, FileText, Car, Bike, Bus, Truck, Package, Wrench, Crown, CarTaxiFront, Link as LinkIcon,
} from 'lucide-react';

// ── Sub-service page groups ────────────────────────────────────────────────────
const SUB_SERVICE_GROUPS = [
  {
    name: 'Bike Rental',
    icon: 'Bike',
    color: 'blue',
    slugs: [
      'bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent', 'ktm-on-rent',
      'pulsar-on-rent', 'apache-on-rent', 'splendor-on-rent', 'himalayan-on-rent',
      'monthly-bike-rental', 'electric-scooter-rental',
      'bike-tours', 'bike-tours/leh-ladakh', 'bike-tours/spiti-valley',
      'bike-tours/rajasthan', 'bike-tours/goa', 'bike-trips/ladakh',
    ],
  },
  {
    name: 'Self-Drive Car Rental',
    icon: 'Car',
    color: 'purple',
    slugs: [
      'self-drive-car-rentals', 'hourly-car-rental',
      'self-drive-suv-rental', 'self-drive-sedan-rental', 'self-drive-hatchback-rental',
      'swift-on-rent', 'creta-on-rent', 'innova-on-rent', 'fortuner-on-rent',
      'seltos-on-rent', 'xuv700-on-rent', 'scorpio-on-rent',
    ],
  },
  {
    name: 'Car Rental with Driver',
    icon: 'CarTaxiFront',
    color: 'emerald',
    slugs: [
      'car-rental', 'chauffeur-service', 'airport-transfer', 'local-taxi',
      'outstation-cab', 'outstation-car-rental', 'one-way-car-rental',
      'monthly-car-rental', 'corporate-car-rental',
    ],
  },
  {
    name: 'Luxury Car Rental',
    icon: 'Crown',
    color: 'amber',
    slugs: [
      'luxury-car-rental', 'wedding-car-rental', 'sports-car-rental', 'vintage-car-rental',
    ],
  },
  {
    name: 'Bus Rental',
    icon: 'Bus',
    color: 'orange',
    slugs: [
      'bus-rental', 'tempo-traveller', 'wedding-bus-rental', 'corporate-bus-rental',
      '12-seater-tempo-traveller', '17-seater-tempo-traveller',
      '20-seater-tempo-traveller', '26-seater-bus',
    ],
  },
  {
    name: 'Truck & Tempo',
    icon: 'Truck',
    color: 'red',
    slugs: ['mini-truck-rental', 'transporter', 'trailer-on-rent'],
  },
  {
    name: 'Packers & Movers',
    icon: 'Package',
    color: 'pink',
    slugs: ['packers-and-movers'],
  },
  {
    name: 'Equipment Rental',
    icon: 'Wrench',
    color: 'cyan',
    slugs: [
      'equipment-rental', 'jcb-on-rent', 'crane-on-rent',
      'hydra-on-rent', 'excavator-on-rent', 'generator-on-rent',
    ],
  },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700',    border: 'border-blue-200' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700',  border: 'border-purple-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-200' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700',  border: 'border-orange-200' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     badge: 'bg-red-100 text-red-700',     border: 'border-red-200' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700',    border: 'border-pink-200' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700',    border: 'border-cyan-200' },
};

// ── Icon map ───────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Car: <Car className="w-5 h-5" />,
  Bike: <Bike className="w-5 h-5" />,
  CarTaxiFront: <CarTaxiFront className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
  Bus: <Bus className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceStat {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  locationCount: number;
  routeCount: number;
  airportCount: number;
  total: number;
}

interface OverviewData {
  totalPages: number;
  totalServicePages: number;
  staticCount: number;
  services: ServiceStat[];
}

interface StaticPageRow {
  pageId: string;
  url: string;
  label?: string;
  templateTitle: string;
  templateDescription: string;
  templateKeywords: string;
  override: { metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null } | null;
}

interface EditState {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

// ── Static page row ────────────────────────────────────────────────────────────
function StaticPageRow({ row, onSave, onReset }: {
  row: StaticPageRow;
  onSave: (pageId: string, data: EditState) => Promise<void>;
  onReset: (pageId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState>({
    metaTitle: row.override?.metaTitle || row.templateTitle,
    metaDescription: row.override?.metaDescription || row.templateDescription,
    metaKeywords: row.override?.metaKeywords || row.templateKeywords,
  });

  const hasOverride = !!row.override;
  const displayTitle = row.override?.metaTitle || row.templateTitle || row.label || row.pageId;

  const handleSave = async () => {
    setSaving(true);
    await onSave(row.pageId, edit);
    setSaving(false);
    setOpen(false);
  };

  const handleReset = async () => {
    if (!confirm('Remove custom meta and revert to template?')) return;
    setSaving(true);
    await onReset(row.pageId);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className={`border rounded-lg mb-2 ${hasOverride ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => {
          setEdit({
            metaTitle: row.override?.metaTitle || row.templateTitle,
            metaDescription: row.override?.metaDescription || row.templateDescription,
            metaKeywords: row.override?.metaKeywords || row.templateKeywords,
          });
          setOpen(!open);
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasOverride && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Custom</span>
            )}
            <span className="font-medium text-gray-900 text-sm truncate">{displayTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400 truncate">{row.url}</span>
            {row.label && <span className="text-xs text-gray-400">• {row.label}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://transrentals.in${row.url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {hasOverride && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-1">
              <p className="font-medium text-gray-600">Template (default):</p>
              <p>Title: {row.templateTitle}</p>
              <p>Desc: {row.templateDescription}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Meta Title <span className="text-gray-400">({edit.metaTitle.length}/70)</span>
            </label>
            <input
              value={edit.metaTitle}
              onChange={(e) => setEdit({ ...edit, metaTitle: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                edit.metaTitle.length > 70 ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Meta Description <span className="text-gray-400">({edit.metaDescription.length}/160)</span>
            </label>
            <textarea
              value={edit.metaDescription}
              onChange={(e) => setEdit({ ...edit, metaDescription: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                edit.metaDescription.length > 160 ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
            <input
              value={edit.metaKeywords}
              onChange={(e) => setEdit({ ...edit, metaKeywords: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Google Preview</p>
            <p className="text-blue-700 text-sm font-medium leading-tight line-clamp-1">{edit.metaTitle || row.templateTitle}</p>
            <p className="text-green-700 text-xs mt-0.5">transrentals.in{row.url}</p>
            <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{edit.metaDescription || row.templateDescription}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              {hasOverride && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Revert to template
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service card ───────────────────────────────────────────────────────────────
function ServiceCard({ service }: { service: ServiceStat }) {
  const icon = ICON_MAP[service.icon || ''] || <Car className="w-5 h-5" />;
  return (
    <Link
      href={`/admin/services/${service.slug}/pages`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
          {icon}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition" />
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{service.name}</p>
      <p className="text-2xl font-bold text-gray-900">{service.total.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-0.5">pages</p>
      {(service.routeCount > 0 || service.airportCount > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
          {service.locationCount > 0 && (
            <p className="text-xs text-gray-500">{service.locationCount} location pages</p>
          )}
          {service.routeCount > 0 && (
            <p className="text-xs text-gray-500">{service.routeCount} route pages</p>
          )}
          {service.airportCount > 0 && (
            <p className="text-xs text-gray-500">{service.airportCount} airport pages</p>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Inner component (needs useSearchParams) ────────────────────────────────────
function SEODashboardInner() {
  const searchParams = useSearchParams();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [staticPages, setStaticPages] = useState<StaticPageRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') || '');

  useEffect(() => {
    fetch('/api/admin/seo/overview')
      .then((r) => r.json())
      .then((d) => setOverview(d))
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  }, []);

  const fetchStatic = useCallback(async () => {
    setLoadingStatic(true);
    try {
      const res = await fetch('/api/admin/services/static/location-pages?type=static');
      if (res.ok) {
        const data = await res.json();
        setStaticPages(data.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatic(false);
    }
  }, []);

  useEffect(() => { fetchStatic(); }, [fetchStatic]);

  const handleSave = async (pageId: string, data: EditState) => {
    await fetch('/api/admin/seo/page-meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, ...data }),
    });
    fetchStatic();
  };

  const handleReset = async (pageId: string) => {
    await fetch(`/api/admin/seo/page-meta?pageId=${encodeURIComponent(pageId)}`, { method: 'DELETE' });
    fetchStatic();
  };

  const filteredStatic = staticPages.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.label || '').toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      (p.override?.metaTitle || p.templateTitle).toLowerCase().includes(q)
    );
  });

  const customStaticCount = staticPages.filter((p) => p.override).length;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">
          All indexable pages across services and static site. Manage meta title, description & keywords.
        </p>
      </div>

      {/* Total stat */}
      {loadingOverview ? (
        <div className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
      ) : overview && (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-sm font-medium text-blue-100 mb-1">Total indexable pages</p>
          <p className="text-5xl font-bold">{overview.totalPages.toLocaleString()}</p>
          <div className="flex items-center gap-6 mt-3 text-sm text-blue-100">
            <span>{overview.totalServicePages.toLocaleString()} service pages</span>
            <span>•</span>
            <span>{overview.staticCount} static pages</span>
          </div>
        </div>
      )}

      {/* Service cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Services
          {overview && <span className="text-xs font-normal text-gray-400 ml-1">({overview.services.length})</span>}
        </h2>
        {loadingOverview ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {overview?.services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </div>

      {/* Static pages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Static Pages
            <span className="text-xs font-normal text-gray-400">({staticPages.length})</span>
            {customStaticCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {customStaticCount} custom
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">
            <span className="text-blue-600">Blue</span> = custom override &nbsp;|&nbsp; White = template
          </p>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search static pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loadingStatic ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredStatic.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pages found</div>
        ) : (
          <div>
            {filteredStatic.map((row) => (
              <StaticPageRow key={row.pageId} row={row} onSave={handleSave} onReset={handleReset} />
            ))}
          </div>
        )}
      </div>

      {/* Sub-service pages */}
      <SubServicePages search={search} />
    </div>
  );
}

// ── Sub-service pages section ─────────────────────────────────────────────────
function SubServicePages({ search }: { search: string }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const total = SUB_SERVICE_GROUPS.reduce((acc, g) => acc + g.slugs.length, 0);
  const q = search.toLowerCase();

  // Filter groups based on search
  const filteredGroups = SUB_SERVICE_GROUPS.map((g) => ({
    ...g,
    filtered: q
      ? g.slugs.filter((s) => s.includes(q) || g.name.toLowerCase().includes(q))
      : [...g.slugs],
  })).filter((g) => g.filtered.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          Sub-Service Pages
          <span className="text-xs font-normal text-gray-400">({total} URLs)</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allOpen = SUB_SERVICE_GROUPS.every((g) => openGroups[g.name]);
              const next: Record<string, boolean> = {};
              SUB_SERVICE_GROUPS.forEach((g) => { next[g.name] = !allOpen; });
              setOpenGroups(next);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 transition"
          >
            {SUB_SERVICE_GROUPS.every((g) => openGroups[g.name]) ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredGroups.map((group) => {
          const colors = COLOR_MAP[group.color];
          const isOpen = openGroups[group.name] || (q.length > 0);
          const icon = ICON_MAP[group.icon] || <Car className="w-4 h-4" />;

          return (
            <div key={group.name} className={`border ${colors.border} rounded-xl overflow-hidden`}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${colors.bg} hover:brightness-95 transition text-left`}
              >
                <div className={`w-7 h-7 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text}`}>
                  {icon}
                </div>
                <span className={`font-semibold text-sm ${colors.text}`}>{group.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                  {group.filtered.length}
                </span>
                <span className="ml-auto">
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </span>
              </button>

              {/* Slug rows */}
              {isOpen && (
                <div className="divide-y divide-gray-100 bg-white">
                  {group.filtered.map((slug) => {
                    const url = `/${slug}`;
                    const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={slug} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">{url}</p>
                        </div>
                        <a
                          href={`https://transrentals.in${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 text-gray-400 hover:text-blue-600 transition rounded-md hover:bg-blue-50"
                          title={`Open ${url}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SEODashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <SEODashboardInner />
    </Suspense>
  );
}
