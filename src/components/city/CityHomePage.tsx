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
  Compass, Landmark, Utensils, Trees, Sparkles, BadgeCheck,
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

// Muted per-category tint — used ONLY for the small icon badge, just enough
// to tell categories apart at a glance. Every bold element (headers, CTAs,
// prices) stays a single brand color throughout, so the grid reads as one
// cohesive, premium system instead of a rainbow of unrelated colors.
const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600'    },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600'   },
};

const CATEGORY_ORDER: Array<ServiceConfig['category']> = ['car', 'bike', 'bus', 'cab', 'commercial', 'moving'];

// Optional per-city hero background photo. Drop the file in /public/images/cities/
// (recommended: 2400×1000px, ~21:9, JPG/WebP under 400KB, main subject weighted
// to the right two-thirds of the frame since hero text sits on the left).
export const CITY_HERO_IMAGES: Record<string, string> = {
  ahmedabad: '/images/cities/ahmedabad-hero.jpg',
  bangalore: '/images/cities/bangalore-hero.webp',
  ghaziabad: '/images/cities/ghaziabad-hero.webp',
  mangalore: '/images/cities/mangalore-hero.webp',
  mumbai: '/images/cities/mumbai-hero.webp',
  gandhinagar: '/images/cities/gandhinagar-hero.webp',
  jaipur: '/images/cities/jaipur-hero.webp',
  pune: '/images/cities/pune-hero.webp',
  delhi: '/images/cities/delhi-hero.webp',
  noida: '/images/cities/noida-hero.webp',
  vadodara: '/images/cities/vadodara-hero.webp',
  rajkot: '/images/cities/rajkot-hero.webp',
  lucknow: '/images/cities/lucknow-hero.webp',
  thane: '/images/cities/thane-hero.webp',
  mysore: '/images/cities/mysore-hero.webp',
  agra: '/images/cities/agra-hero.webp',
  nagpur: '/images/cities/nagpur-hero.webp',
};

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
  const heroImage = CITY_HERO_IMAGES[city.slug];
  return (
    <section className="relative overflow-hidden bg-white">
      <div className={`relative overflow-hidden min-h-[440px] md:min-h-[520px] ${heroImage ? '' : 'bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500'}`}>
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`${city.name}, ${city.state}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-800/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-800/75 via-primary-700/35 to-transparent" />
          </>
        )}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
        {!heroImage && (
          <>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-primary-900/20 rounded-full blur-3xl" />
          </>
        )}
        <div className="container-custom pt-14 md:pt-20 pb-20 md:pb-28 relative">
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">India</Link>
            <span>/</span>
            <span className="text-white/80">{city.state}</span>
            <span>/</span>
            <span className="text-white font-medium">{city.name}</span>
          </nav>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5" />{city.state}
              </div>
              <div className="inline-flex items-center gap-2 bg-white text-primary-700 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />500+ Verified Vendors
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              {cmsData?.pageHeading || `Vehicle Rentals in ${city.name}`}
            </h1>
            <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-6">
              {cmsData?.pageDescription ||
                (seoData?.intro ? seoData.intro.slice(0, 220) + '...'
                  : `Book cars, bikes, buses & more in ${city.name}. Compare quotes from verified vendors.`)}
            </p>
            {customContent && (
              <div className="bg-white/10 rounded-xl p-4 text-white/90 text-sm leading-relaxed mb-2">
                <CustomContent html={customContent} />
              </div>
            )}
            <Link
              href="#services"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Explore Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {seoData?.stats && (
        <div className="container-custom relative -mt-10 md:-mt-12 z-10 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-6">
            <div className="flex items-center gap-3 px-2">
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0"><Users className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Population</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.population}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 sm:border-l sm:border-gray-100 sm:pl-6">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0"><Plane className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nearest Airport</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.airport}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 sm:border-l sm:border-gray-100 sm:pl-6">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0"><Briefcase className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Known For</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.knownFor}</p>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const presentCategories = CATEGORY_ORDER.filter(cat => grouped[cat]?.length);
  return (
    <section id="services" className="py-16 md:py-20 bg-gray-50/60 scroll-mt-20">
      <div className="container-custom">
        <div className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />All Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Services Available in {city.name}
          </h2>
          <p className="text-gray-500">Compare verified vendors and book instantly — cars, bikes, buses & more.</p>
        </div>

        {/* Category quick-nav */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 mb-12 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {presentCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const colors = COLOR_CLASSES[cfg.color];
            return (
              <a
                key={cat}
                href={`#services-${cat}`}
                className="flex items-center gap-2 shrink-0 bg-white text-gray-700 font-semibold text-sm pl-2 pr-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className={`p-1.5 rounded-full ${colors.bg} ${colors.text}`}>{cfg.icon}</span>
                {cfg.label}
                <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">{grouped[cat].length}</span>
              </a>
            );
          })}
        </div>

        <div className="space-y-8">
          {presentCategories.map(cat => {
            const services = grouped[cat];
            const cfg = CATEGORY_CONFIG[cat];
            const colors = COLOR_CLASSES[cfg.color];
            return (
              <div key={cat} id={`services-${cat}`} className="scroll-mt-24 rounded-3xl border border-gray-100 bg-white p-5 md:p-7 shadow-sm">
                <div className="relative overflow-hidden rounded-2xl mb-6 p-5 md:p-6 bg-gray-50 border border-gray-100">
                  <div className="relative flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3.5">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} shrink-0 ring-1 ring-inset ring-black/5`}>
                        {cfg.icon}
                      </span>
                      <div>
                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">{cfg.label}</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">{services.length} services available</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" />Verified Vendors
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {services.map(svc => {
                    const ov = getOverride(svc.slug);
                    const name = ov?.customName || svc.name;
                    return (
                      <Link
                        key={svc.slug}
                        href={`/${svc.slug}/${city.slug}`}
                        className="group relative flex flex-col items-center text-center bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 grow shrink-0 basis-[calc(50%-0.5rem)] sm:basis-[calc(33.333%-0.667rem)] lg:basis-[calc(25%-0.75rem)] max-w-[300px]"
                      >
                        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {cfg.icon}
                        </span>
                        <p className="font-bold text-gray-900 text-[15px] leading-snug mb-5">
                          {name}
                        </p>
                        <span className="mt-auto inline-flex items-center justify-center gap-1.5 w-full text-sm font-bold text-primary border-2 border-primary/20 rounded-xl py-2.5 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors duration-300">
                          Book Now <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
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
    <section className="py-16 md:py-20 bg-gray-50 border-t border-gray-100">
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
              <div key={route.to} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-start justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
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

const ATTRACTION_CATEGORY_ICON: Record<string, React.ReactNode> = {
  'Heritage':          <Landmark className="w-4 h-4" />,
  'Nature':            <Trees className="w-4 h-4" />,
  'Food & Shopping':   <Utensils className="w-4 h-4" />,
  'Family & Leisure':  <Sparkles className="w-4 h-4" />,
};

function ThingsToDoSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  const [expanded, setExpanded] = useState(false);
  const attractions = seoData?.thingsToDo as { name: string; category: string; description: string; distance?: string }[] | undefined;
  if (!attractions?.length && !customContent) return null;

  return (
    <section className="py-14 md:py-16 bg-white border-t border-gray-100">
      <div className="container-custom max-w-5xl">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-4 text-left group focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Things to Do in {city.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {expanded ? 'Top attractions & experiences' : `${attractions?.length ?? 0} curated spots — tap to explore`}
              </p>
            </div>
          </div>
          <span className="p-2 rounded-full bg-gray-50 text-gray-500 group-hover:bg-gray-100 transition-colors shrink-0">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {expanded && (
          <div className="mt-8">
            {customContent && <div className="mb-6"><CustomContent html={customContent} /></div>}
            {attractions?.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attractions.map((spot) => (
                  <div
                    key={spot.name}
                    className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:border-amber-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        {ATTRACTION_CATEGORY_ICON[spot.category] ?? <Landmark className="w-4 h-4" />}
                        {spot.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1.5">{spot.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{spot.description}</p>
                    {spot.distance && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{spot.distance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
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
                className="group bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/30 rounded-2xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5"
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
    <section className="py-16 md:py-20 bg-gray-50 border-t border-gray-100">
      <div className="container-custom max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Vehicle Rentals in {city.name} — Complete Guide
        </h2>
        {/* Custom content replaces the auto intro when set */}
        {customContent
          ? <div className="mb-8"><CustomContent html={customContent} /></div>
          : seoData?.intro && <p className="text-gray-600 leading-relaxed mb-8">{seoData.intro}</p>}
        {seoData?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0"><Users className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Population</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.population}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0"><Briefcase className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Known For</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.knownFor}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0"><Plane className="w-5 h-5" /></span>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nearest Airport</p>
                <p className="text-gray-900 font-bold text-sm md:text-base">{seoData.stats.airport}</p>
              </div>
            </div>
          </div>
        )}
        {seoData?.tips?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
            <button
              onClick={() => setTipsExpanded(!tipsExpanded)}
              aria-expanded={tipsExpanded}
              className="w-full flex items-center justify-between gap-4 text-left group focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </span>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Local Tips for {city.name}</h3>
              </div>
              <span className="p-2 rounded-full bg-gray-50 text-gray-500 group-hover:bg-gray-100 transition-colors shrink-0">
                {tipsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </span>
            </button>
            <div className={tipsExpanded ? 'block mt-5' : 'hidden'} aria-hidden={!tipsExpanded}>
              <ul className="space-y-3">
                {seoData.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
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
    <section className="py-16 md:py-20 bg-white border-t border-gray-100">
      <div className="container-custom max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Frequently Asked Questions — {city.name}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-gray-50 open:bg-white rounded-2xl border border-gray-100 open:border-primary/20 open:shadow-sm group transition-colors">
              <summary className="px-5 py-4 font-semibold text-gray-900 cursor-pointer select-none list-none flex justify-between items-center gap-4">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 group-open:text-primary transition-transform" />
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
      case 'things_to_do': return <ThingsToDoSection key="things_to_do" city={city} seoData={seoData} customContent={customContent} />;
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
