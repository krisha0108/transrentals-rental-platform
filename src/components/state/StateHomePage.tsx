'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IndianState, ALL_CITIES, City } from '@/data/indian-cities';
import { ALL_SERVICES, ServiceConfig } from '@/data/service-config';
import { parseSectionsConfig } from '@/lib/city-sections';
import {
  MapPin, ArrowRight, ChevronDown,
  Car, Bike, Bus, Briefcase, Truck, Package, Plane,
} from 'lucide-react';

interface CmsData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  pageHeading?: string | null;
  pageDescription?: string | null;
  sectionsConfig?: string | null;
}

interface StateHomePageProps {
  state: IndianState;
  cmsData?: CmsData | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  car:        { label: 'Cars',            icon: <Car className="w-5 h-5" />,     color: 'blue'   },
  bike:       { label: 'Bikes',           icon: <Bike className="w-5 h-5" />,    color: 'green'  },
  bus:        { label: 'Buses & Vans',    icon: <Bus className="w-5 h-5" />,     color: 'purple' },
  cab:        { label: 'Cab & Transfers', icon: <Plane className="w-5 h-5" />,   color: 'orange' },
  commercial: { label: 'Commercial',      icon: <Truck className="w-5 h-5" />,   color: 'red'    },
  moving:     { label: 'Moving',          icon: <Package className="w-5 h-5" />, color: 'teal'   },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100 hover:border-blue-300'    },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100 hover:border-green-300'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100 hover:border-purple-300' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100 hover:border-orange-300' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100 hover:border-red-300'      },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100 hover:border-teal-300'    },
};

const CATEGORY_ORDER: Array<ServiceConfig['category']> = ['car', 'bike', 'bus', 'cab', 'commercial', 'moving'];

function groupByCategory(services: ServiceConfig[]) {
  return services.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {} as Record<string, ServiceConfig[]>);
}

function getCitiesInState(state: IndianState): City[] {
  return ALL_CITIES
    .filter(c => c.stateCode === state.code)
    .sort((a, b) => a.tier - b.tier || b.priority - a.priority);
}

interface ServiceVisibility {
  slug: string; visible: boolean;
  customName?: string; customPrice?: string; customPriceUnit?: string;
}

function parseServicesConfig(content?: string): ServiceVisibility[] | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed[0]?.slug !== undefined) return parsed;
  } catch {}
  return null;
}

function CustomContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed
        prose-headings:font-bold prose-headings:text-gray-900
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-li:my-0.5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface FaqItem { q: string; a: string; }

function parseFaqJson(content?: string): FaqItem[] | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.q) return parsed as FaqItem[];
  } catch {}
  return null;
}

// ── Section components ─────────────────────────────────────────────────────────

function HeroSection({ state, cmsData, customContent }: { state: IndianState; cmsData?: CmsData | null; customContent?: string }) {
  const citiesInState = getCitiesInState(state);
  return (
    <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
      <div className="container-custom py-14 md:py-20 relative">
        <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
          <Link href="/" className="hover:text-white transition-colors">India</Link>
          <span>/</span>
          <span className="text-white font-medium">{state.name}</span>
        </nav>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
            <MapPin className="w-3.5 h-3.5" />{state.code} · {citiesInState.length} cities
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {cmsData?.pageHeading || `Vehicle Rentals in ${state.name}`}
          </h1>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-6">
            {cmsData?.pageDescription ||
              `Book cars, bikes, buses & more across ${state.name}. Compare quotes from verified vendors across all cities.`}
          </p>
          {customContent && (
            <div className="bg-white/10 rounded-xl p-4 text-white/90 text-sm leading-relaxed">
              <CustomContent html={customContent} />
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

function ServicesSection({ state, customContent }: { state: IndianState; customContent?: string }) {
  const servicesCfg = parseServicesConfig(customContent);
  const visibleServices = servicesCfg
    ? ALL_SERVICES.filter(s => servicesCfg.find(c => c.slug === s.slug)?.visible !== false)
    : ALL_SERVICES;
  const grouped = groupByCategory(visibleServices);
  const getOverride = (slug: string) => servicesCfg?.find(c => c.slug === slug);

  return (
    <section className="py-14 bg-white">
      <div className="container-custom">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Services Available in {state.name}
          </h2>
          <p className="text-gray-500">Choose from our wide range of vehicle rental services</p>
        </div>
        <div className="space-y-10">
          {CATEGORY_ORDER.map(cat => {
            const services = grouped[cat];
            if (!services?.length) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const colors = COLOR_CLASSES[cfg.color];
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>{cfg.icon}</span>
                  <h3 className="text-xl font-bold text-gray-800">{cfg.label}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {services.map(svc => {
                    const ov = getOverride(svc.slug);
                    const name = ov?.customName || svc.name;
                    const price = ov?.customPrice || svc.startingPrice;
                    const unit = ov?.customPriceUnit !== undefined ? ov.customPriceUnit : svc.priceUnit;
                    return (
                      <Link
                        key={svc.slug}
                        href={`/${svc.slug}/${state.slug}`}
                        className={`group bg-white rounded-xl border ${colors.border} p-4 transition-all duration-200 hover:shadow-md`}
                      >
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors leading-snug mb-2">
                          {name}
                        </p>
                        {price && (
                          <p className="text-xs text-gray-500">
                            from <span className={`font-bold ${colors.text}`}>₹{price}</span>
                            {unit && <span className="text-gray-400">{unit}</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-primary transition-colors">
                          View in {state.name} <ArrowRight className="w-3 h-3" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CitiesSection({ state, cities, customContent }: { state: IndianState; cities: City[]; customContent?: string }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? cities : cities.slice(0, 24);

  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-custom">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-3">
            <MapPin className="w-4 h-4" />{state.name}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cities in {state.name}</h2>
          {customContent
            ? <div className="mt-2"><CustomContent html={customContent} /></div>
            : <p className="text-gray-500 mt-1 text-sm">We operate across {cities.length} cities and towns in {state.name}</p>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {displayed.map(c => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group bg-white hover:bg-primary/5 border border-gray-100 hover:border-primary/30 rounded-xl px-4 py-3 transition-all duration-200"
            >
              <p className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{c.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.tier === 1 ? 'Metro' : c.tier === 2 ? 'Tier 2' : 'Tier ' + c.tier}
              </p>
            </Link>
          ))}
        </div>
        {cities.length > 24 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-6 flex items-center gap-2 text-primary font-semibold hover:underline text-sm mx-auto"
          >
            {showAll ? 'Show less' : `Show all ${cities.length} cities`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </section>
  );
}

function SeoContentSection({ state, customContent }: { state: IndianState; customContent?: string }) {
  if (!customContent) return null;
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container-custom max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Vehicle Rentals in {state.name} — Complete Guide
        </h2>
        <CustomContent html={customContent} />
      </div>
    </section>
  );
}

function FaqSection({ state, customContent }: { state: IndianState; customContent?: string }) {
  const customFaqs = parseFaqJson(customContent);
  const faqs: FaqItem[] = customFaqs ?? [
    {
      q: `Which vehicle rental services are available in ${state.name}?`,
      a: `TransRentals offers car rentals, self-drive cars, bike rentals, bus & tempo traveller rentals, luxury cars, airport transfers, outstation cabs, packers & movers, and more across ${state.name}.`,
    },
    {
      q: `How do I book a rental vehicle in ${state.name}?`,
      a: `Select a service above, choose your pickup city in ${state.name}, compare quotes from verified vendors, and book instantly.`,
    },
    {
      q: `Are vendors in ${state.name} verified by TransRentals?`,
      a: `Yes. All vendors listed on TransRentals are verified for documents, vehicle condition, and service quality before being listed.`,
    },
    {
      q: `What is the cheapest vehicle rental in ${state.name}?`,
      a: `Bike rentals start from ₹299/day and car rentals from ₹999/day across ${state.name}. Compare quotes for the best deal.`,
    },
  ];

  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-custom max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Frequently Asked Questions — {state.name}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-100 group">
              <summary className="px-5 py-4 font-semibold text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StateHomePage({ state, cmsData }: StateHomePageProps) {
  const cities = getCitiesInState(state);
  const sections = parseSectionsConfig(cmsData?.sectionsConfig);

  const renderSection = (id: string, label: string, customContent?: string) => {
    switch (id) {
      case 'hero':        return <HeroSection        key="hero"        state={state} cmsData={cmsData} customContent={customContent} />;
      case 'services':    return <ServicesSection    key="services"    state={state} customContent={customContent} />;
      case 'routes':      return null; // no routes section for state pages
      case 'locations':   return <CitiesSection      key="locations"   state={state} cities={cities} customContent={customContent} />;
      case 'seo_content': return <SeoContentSection  key="seo_content" state={state} customContent={customContent} />;
      case 'faq':         return <FaqSection         key="faq"         state={state} customContent={customContent} />;
      default:
        if (!customContent) return null;
        return (
          <section key={id} className="py-14 bg-white border-t border-gray-100">
            <div className="container-custom max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{label}</h2>
              <CustomContent html={customContent} />
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {sections
        .filter(s => s.visible)
        .sort((a, b) => a.order - b.order)
        .map(s => renderSection(s.id, s.label, s.content || undefined))}
    </div>
  );
}
