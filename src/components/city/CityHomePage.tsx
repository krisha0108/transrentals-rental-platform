'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { City, ALL_CITIES } from '@/data/indian-cities';
import { ALL_SERVICES, ServiceConfig } from '@/data/service-config';
import { CITY_SEO } from '@/data/city-seo-content';
import { useLocation } from '@/contexts/LocationContext';
import { parseSectionsConfig } from '@/lib/city-sections';
import {
  MapPin, ArrowRight, Clock, ChevronDown, ChevronUp,
  Lightbulb, Car, Bike, Bus, Briefcase,
  Truck, Package, Plane, Users,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CmsData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  pageHeading?: string | null;
  pageDescription?: string | null;
  sectionsConfig?: string | null;
}

interface CityHomePageProps {
  city: City;
  cmsData?: CmsData | null;
}

// ── Category config ───────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNearbyCities(city: City, limit = 12): City[] {
  return ALL_CITIES
    .filter(c => c.stateCode === city.stateCode && c.slug !== city.slug)
    .sort((a, b) => a.tier - b.tier || b.priority - a.priority)
    .slice(0, limit);
}

function groupByCategory(services: ServiceConfig[]) {
  return services.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = [];
    acc[svc.category].push(svc);
    return acc;
  }, {} as Record<string, ServiceConfig[]>);
}

/** Renders admin-authored HTML safely inside a styled prose container. */
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

// ── Section components ────────────────────────────────────────────────────────

function HeroSection({ city, cmsData, seoData, customContent }: {
  city: City; cmsData?: CmsData | null; seoData: any; customContent?: string;
}) {
  return (
    <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
      <div className="container-custom py-14 md:py-20 relative">
        <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
          <Link href="/" className="hover:text-white transition-colors">India</Link>
          <span>/</span>
          <span className="text-white/80">{city.state}</span>
          <span>/</span>
          <span className="text-white font-medium">{city.name}</span>
        </nav>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
            <MapPin className="w-3.5 h-3.5" />{city.state}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {cmsData?.pageHeading || `Vehicle Rentals in ${city.name}`}
          </h1>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-6">
            {cmsData?.pageDescription ||
              (seoData?.intro ? seoData.intro.slice(0, 220) + '...'
                : `Book cars, bikes, buses & more in ${city.name}. Compare quotes from verified vendors.`)}
          </p>
          {customContent && (
            <div className="bg-white/10 rounded-xl p-4 text-white/90 text-sm leading-relaxed">
              <CustomContent html={customContent} />
            </div>
          )}
          {seoData?.stats && (
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-white text-sm">
                <Users className="w-4 h-4 opacity-70" /><span>{seoData.stats.population}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-white text-sm">
                <Plane className="w-4 h-4 opacity-70" /><span>{seoData.stats.airport}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-white text-sm">
                <Briefcase className="w-4 h-4 opacity-70" /><span>{seoData.stats.knownFor}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
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

function ServicesSection({ city, customContent }: { city: City; customContent?: string }) {
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
            Services Available in {city.name}
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
                        href={`/${svc.slug}/${city.slug}`}
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
                          Book now <ArrowRight className="w-3 h-3" />
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

function RoutesSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  if (!seoData?.routes?.length && !customContent) return null;
  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-6">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><MapPin className="w-5 h-5" /></span>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Popular Routes from {city.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">Top outstation & intercity routes</p>
          </div>
        </div>
        {customContent && <div className="mb-6"><CustomContent html={customContent} /></div>}
        {seoData?.routes?.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seoData.routes.map((route: any) => (
              <div key={route.to} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start justify-between hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-semibold text-gray-900">{city.name} → {route.to}</p>
                  {route.via && <p className="text-xs text-gray-400 mt-0.5">via {route.via}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-primary">{route.distance}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3 h-3" />{route.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href={`/outstation-cab/${city.slug}`} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm">
            Book Outstation Cab from {city.name} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function LocationsSection({ city, nearbyCities, customContent }: { city: City; nearbyCities: City[]; customContent?: string }) {
  if (!nearbyCities.length && !customContent) return null;
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container-custom">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-3">
            <MapPin className="w-4 h-4" />{city.state}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">More Locations in {city.state}</h2>
          {customContent
            ? <div className="mt-2"><CustomContent html={customContent} /></div>
            : <p className="text-gray-500 mt-1 text-sm">We operate across all major cities and towns in {city.state}</p>}
        </div>
        {nearbyCities.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {nearbyCities.map(c => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/30 rounded-xl px-4 py-3 transition-all duration-200"
              >
                <p className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />View services
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SeoContentSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  const [tipsExpanded, setTipsExpanded] = useState(false);
  if (!seoData && !customContent) return null;
  return (
    <section className="py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-custom max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Vehicle Rentals in {city.name} — Complete Guide
        </h2>
        {/* Custom content replaces the auto intro when set */}
        {customContent
          ? <div className="mb-6"><CustomContent html={customContent} /></div>
          : seoData?.intro && <p className="text-gray-600 leading-relaxed mb-6">{seoData.intro}</p>}
        {seoData?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl px-5 py-4">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Population</p>
              <p className="text-gray-900 font-bold">{seoData.stats.population}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-5 py-4">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Known For</p>
              <p className="text-gray-900 font-bold text-sm">{seoData.stats.knownFor}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-5 py-4">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Nearest Airport</p>
              <p className="text-gray-900 font-bold text-sm">{seoData.stats.airport}</p>
            </div>
          </div>
        )}
        {seoData?.tips?.length > 0 && (
          <div>
            <button
              onClick={() => setTipsExpanded(!tipsExpanded)}
              className="flex items-center gap-2 text-primary font-semibold hover:underline mb-4 focus:outline-none"
            >
              {tipsExpanded ? <><ChevronUp className="w-4 h-4" />Hide Tips</> : <><ChevronDown className="w-4 h-4" />Local Tips for {city.name}</>}
            </button>
            <div className={tipsExpanded ? 'block' : 'hidden'} aria-hidden={!tipsExpanded}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-gray-900">Tips for Renting in {city.name}</h3>
              </div>
              <ul className="space-y-3">
                {seoData.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
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

function FaqSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  const customFaqs = parseFaqJson(customContent);

  // Use custom FAQs if available, otherwise fall back to defaults
  const faqs: FaqItem[] = customFaqs ?? [
    {
      q: `Which vehicle rental services are available in ${city.name}?`,
      a: `TransRentals offers car rentals, self-drive cars, bike rentals, bus & tempo traveller rentals, luxury cars, airport transfers, outstation cabs, packers & movers, and more in ${city.name}.`,
    },
    {
      q: `How do I book a rental vehicle in ${city.name}?`,
      a: `Select the service above, choose your pickup location in ${city.name}, compare quotes from verified vendors, and book instantly.`,
    },
    {
      q: `Are vendors in ${city.name} verified by TransRentals?`,
      a: `Yes. All vendors listed on TransRentals are verified for documents, vehicle condition, and service quality.`,
    },
    {
      q: `What is the cheapest vehicle rental available in ${city.name}?`,
      a: `Bike rentals start from ₹299/day and car rentals from ₹999/day in ${city.name}. Compare quotes for the best deal.`,
    },
    {
      q: `Can I get an outstation cab from ${city.name}?`,
      a: `Yes. TransRentals offers outstation cabs, one-way cabs, and self-drive cars from ${city.name}. Book for popular routes like ${seoData?.routes?.[0] ? `${city.name} to ${seoData.routes[0].to}` : 'nearby cities'} and more.`,
    },
  ];

  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="container-custom max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Frequently Asked Questions — {city.name}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 group">
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

// ── Main component ────────────────────────────────────────────────────────────
export function CityHomePage({ city, cmsData }: CityHomePageProps) {
  const { setCity } = useLocation();

  useEffect(() => {
    setCity(city, 'url');
  }, [city, setCity]);

  const seoData = CITY_SEO[city.slug];
  const nearbyCities = getNearbyCities(city);
  const sections = parseSectionsConfig(cmsData?.sectionsConfig);

  const renderSection = (id: string, label: string, customContent?: string) => {
    switch (id) {
      case 'hero':        return <HeroSection        key="hero"        city={city} cmsData={cmsData} seoData={seoData} customContent={customContent} />;
      case 'services':    return <ServicesSection    key="services"    city={city} customContent={customContent} />;
      case 'routes':      return <RoutesSection      key="routes"      city={city} seoData={seoData} customContent={customContent} />;
      case 'locations':   return <LocationsSection   key="locations"   city={city} nearbyCities={nearbyCities} customContent={customContent} />;
      case 'seo_content': return <SeoContentSection  key="seo_content" city={city} seoData={seoData} customContent={customContent} />;
      case 'faq':         return <FaqSection         key="faq"         city={city} seoData={seoData} customContent={customContent} />;
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
