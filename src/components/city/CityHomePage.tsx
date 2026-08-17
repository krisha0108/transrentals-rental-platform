'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { City, ALL_CITIES } from '@/data/indian-cities';
import { ALL_SERVICES, ServiceConfig } from '@/data/service-config';
import { CITY_SEO } from '@/data/city-seo-content';
import { useLocation } from '@/contexts/LocationContext';
import { parseSectionsConfig } from '@/lib/city-sections';
import {
  MapPin, ArrowRight, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Lightbulb, Car, Bike, Bus, Briefcase,
  Truck, Package, Plane, Users,
  Compass, Landmark, Utensils, Trees, Sparkles, Route,
  Calendar, ShieldCheck, Tag, HelpCircle,
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
const COLOR_CLASSES: Record<string, { bg: string; text: string; bar: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   bar: 'bg-blue-500'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  bar: 'bg-green-500'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-500'    },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   bar: 'bg-teal-500'   },
};

const CATEGORY_ORDER: Array<ServiceConfig['category']> = ['car', 'bike', 'bus', 'cab', 'commercial', 'moving'];

// Per-slug photo/art for the service card background — falls back to a
// muted category tint (via COLOR_CLASSES) when a service has no image yet.
const CATEGORY_IMAGES: Record<string, string> = {
  car:        '/images/fleet/range-rover.jpg',
  bike:       '/images/fleet/royal-enfield-classic-350.jpg',
  bus:        '/images/fleet/luxury-bus-45-seater.jpg',
  cab:        '/images/fleet/toyota-innova-crysta.jpg',
  commercial: '/images/fleet/force-traveller-12-seater.jpg',
  moving:     '/images/fleet/tempo-traveller-17-seater.jpg',
};

const SERVICE_IMAGES: Record<string, string> = {
  'car-rental':             '/images/services/car-rental.png',
  'luxury-car-rental':      '/images/services/luxury-car-rental.png',
  'wedding-car-rental':     '/images/services/wedding-car-rental.png',
  'outstation-car-rental':  '/images/services/outstation-car-rental.png',
  'bike-on-rent':           '/images/services/bike-on-rent.png',
  'royal-enfield-on-rent':  '/images/services/royal-enfield-on-rent.png',
  'activa-on-rent':         '/images/services/activa-on-rent.png',
  'bus-rental':             '/images/services/bus-rental.png',
  'tempo-traveller':        '/images/services/tempo-traveller.png',
  'corporate-bus-rental':   '/images/services/corporate-bus-rental.png',
  'wedding-bus-rental':     '/images/services/wedding-bus-rental.png',
  'airport-transfer':       '/images/services/airport-transfer.png',
  'local-taxi':             '/images/services/local-taxi.png',
  'chauffeur-service':      '/images/services/chauffeur-service.png',
  'mini-truck-rental':      '/images/services/mini-truck-rental.png',
  'transporter':            '/images/services/transporter.png',
  'trailer-on-rent':        '/images/services/trailer-on-rent.png',
  'jcb-on-rent':            '/images/services/jcb-on-rent.png',
  'equipment-rental':       '/images/services/equipment-rental.png',
};

const cardReveal = {
  hidden:  { opacity: 0, y: 18, scale: 0.97 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, delay: (i % 8) * 0.045, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
  return (
    <section className="relative overflow-hidden bg-slate-950 min-h-[440px] md:min-h-[480px] flex items-center">
      {/* full-bleed vehicle cluster photo behind everything */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero/city-vehicle-cluster.png')", backgroundPosition: 'center 40%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 from-5% via-slate-950/75 via-40% to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/40" />

      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute top-0 left-1/4 w-[520px] h-[520px] bg-primary-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[440px] h-[440px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="container-custom relative py-10 md:py-12 w-full">
        <div className="max-w-2xl">
          <nav className="flex items-center gap-2 text-white/50 text-sm pt-4 md:pt-6 mb-6">
            <Link href="/" className="hover:text-white transition-colors">India</Link>
            <span>/</span>
            <span className="text-white/70">{city.state}</span>
            <span>/</span>
            <span className="text-white/90 font-medium">{city.name}</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 text-sm font-semibold px-3.5 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />{city.name}, {city.state}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 text-sm font-semibold px-3.5 py-1.5 rounded-full">
                <Users className="w-3.5 h-3.5" />500+ Verified Vendors
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-[1.05]">
              {cmsData?.pageHeading || <>Vehicle Rentals<br />in <span className="text-primary-400">{city.name}</span></>}
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              {cmsData?.pageDescription ||
                (seoData?.intro ? seoData.intro.slice(0, 200) + '...'
                  : `From cars to bikes, tempo travellers to luxury buses — book anything, anytime in ${city.name} with trusted local vendors.`)}
            </p>
            {customContent && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 text-white/85 text-sm leading-relaxed mb-6">
                <CustomContent html={customContent} />
              </div>
            )}
            <Link
              href="#services"
              className="group inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              Explore Services <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {seoData?.stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 md:p-5 mt-8 md:mt-10"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-xl bg-white/10 text-primary-300 shrink-0"><Users className="w-5 h-5" /></span>
              <div>
                <p className="text-white/60 text-sm">Population</p>
                <p className="text-white font-bold text-base">{seoData.stats.population}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-xl bg-white/10 text-primary-300 shrink-0"><Plane className="w-5 h-5" /></span>
              <div>
                <p className="text-white/60 text-sm">Nearest Airport</p>
                <p className="text-white font-bold text-base">{seoData.stats.airport}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-xl bg-white/10 text-primary-300 shrink-0"><Briefcase className="w-5 h-5" /></span>
              <div>
                <p className="text-white/60 text-sm">Known For</p>
                <p className="text-white font-bold text-base">{seoData.stats.knownFor}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
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
  const [activeCat, setActiveCat] = useState<'all' | ServiceConfig['category']>('all');
  const filteredServices = activeCat === 'all'
    ? presentCategories.flatMap(cat => grouped[cat])
    : grouped[activeCat] || [];

  // Deep-link support: #services-bike opens the page with that tab pre-selected.
  useEffect(() => {
    const hash = window.location.hash.replace('#services-', '');
    if (hash && CATEGORY_ORDER.includes(hash as ServiceConfig['category'])) {
      setActiveCat(hash as ServiceConfig['category']);
    }
    // Only read the hash once on mount — `presentCategories` is a new array
    // every render, and depending on it here would re-run this effect (and
    // stomp on manual tab clicks) after every state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderServiceCard = (svc: ServiceConfig, i: number) => {
    const ov = getOverride(svc.slug);
    const name = ov?.customName || svc.name;
    const cfg = CATEGORY_CONFIG[svc.category];
    const colors = COLOR_CLASSES[cfg.color];
    const image = SERVICE_IMAGES[svc.slug] || CATEGORY_IMAGES[svc.category];
    return (
      <motion.div
        key={svc.slug}
        custom={i}
        variants={cardReveal}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <Link
          href={`/${svc.slug}/${city.slug}`}
          className="group relative block aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.5)] transition-shadow duration-300"
        >
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-115 transition-transform duration-500 ease-out"
              style={{ backgroundImage: `url('${image}')` }}
            />
          ) : (
            <div className={`absolute inset-0 ${colors.bg}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 group-hover:from-black/95 transition-colors duration-300" />
          <span className="absolute top-3 left-3 p-2 rounded-lg bg-white/15 backdrop-blur-md text-white [&>svg]:w-4 [&>svg]:h-4">
            {cfg.icon}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-bold text-white text-[15px] leading-snug mb-1.5 drop-shadow-sm">
              {name}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/65 truncate">{city.name}</p>
              <span className="w-7 h-7 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <section id="services" className="relative py-12 md:py-16 bg-gradient-to-b from-gray-50/80 to-white scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute -top-32 right-0 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />All Services
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Services Available in {city.name}
          </h2>
          <p className="text-gray-500">Compare verified vendors and book instantly — cars, bikes, buses & more.</p>
        </motion.div>

        {/* category filter — sliding pill indicator, same pattern as the state page */}
        <div className="flex flex-wrap gap-2 mb-10 pt-6 border-t border-gray-100">
          <button
            onClick={() => setActiveCat('all')}
            className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCat === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {activeCat === 'all' && (
              <motion.span layoutId="cityCatPill" className="absolute inset-0 bg-gray-900 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">All Services</span>
          </button>
          {presentCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {isActive && (
                  <motion.span layoutId="cityCatPill" className="absolute inset-0 bg-gray-900 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative flex items-center gap-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
                  {cfg.icon}
                  {cfg.label}
                  <span className={isActive ? 'text-white/70' : 'text-gray-400'}>{grouped[cat].length}</span>
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
          >
            {activeCat === 'all'
              ? presentCategories.map(cat => (
                  <React.Fragment key={cat}>
                    <div className="col-span-full flex items-center gap-2.5 mt-3 first:mt-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${COLOR_CLASSES[CATEGORY_CONFIG[cat].color].bar}`} />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{CATEGORY_CONFIG[cat].label}</span>
                      <span className="flex-1 h-px bg-gray-100" />
                    </div>
                    {grouped[cat].map((svc, i) => renderServiceCard(svc, i))}
                  </React.Fragment>
                ))
              : filteredServices.map((svc, i) => renderServiceCard(svc, i))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function RoutesSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  if (!seoData?.routes?.length && !customContent) return null;
  return (
    <section className="relative py-14 md:py-16 bg-gray-50/60 border-t border-gray-100 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 select-none hidden md:block bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url('/images/sections/routes-skyline-bg.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/40 to-gray-50/80 hidden md:block" />
      <div className="container-custom relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0"><Route className="w-5 h-5" /></span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Popular Routes from <span className="text-primary">{city.name}</span>
            </h2>
          </div>
          <p className="text-gray-500 text-sm">Top cities at your fingertips</p>
        </div>
        {customContent && <div className="mb-8 max-w-2xl mx-auto text-center"><CustomContent html={customContent} /></div>}
        {seoData?.routes?.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {seoData.routes.map((route: any) => (
              <div key={route.to} className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-14 h-14 rounded-xl shrink-0 bg-primary-50 ring-1 ring-inset ring-primary/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{city.name} → {route.to}</p>
                  {route.via && <p className="text-xs text-gray-400 truncate">via {route.via}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{route.distance}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3 h-3" />{route.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-9 text-center">
          <Link
            href={`/outstation-cab/${city.slug}`}
            className="group inline-flex items-center gap-2 bg-white border-2 border-primary/20 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
          >
            Explore More Destinations <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const ATTRACTION_CATEGORY_STYLE: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  'Heritage':          { icon: <Landmark className="w-4 h-4" />, bg: 'bg-primary-50', text: 'text-primary-700' },
  'Nature':            { icon: <Trees className="w-4 h-4" />,    bg: 'bg-primary-50', text: 'text-primary-700' },
  'Food & Shopping':   { icon: <Utensils className="w-4 h-4" />, bg: 'bg-amber-50',   text: 'text-amber-700'   },
  'Family & Leisure':  { icon: <Users className="w-4 h-4" />,    bg: 'bg-primary-50', text: 'text-primary-700' },
};

function ThingsToDoSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  const attractions = seoData?.thingsToDo as { name: string; category: string; description: string; distance?: string }[] | undefined;
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!attractions?.length && !customContent) return null;

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  return (
    <section className="py-14 md:py-16 bg-white border-t border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0"><Compass className="w-5 h-5" /></span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                Things to Do in <span className="text-primary">{city.name}</span>
              </h2>
            </div>
            <p className="text-gray-500 text-sm sm:ml-[52px]">Top attractions &amp; experiences</p>
          </div>
          {attractions && attractions.length > 3 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll left"
                className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll right"
                className="p-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {customContent && <div className="mb-6"><CustomContent html={customContent} /></div>}

        {attractions?.length ? (
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory">
            {attractions.map((spot) => {
              const style = ATTRACTION_CATEGORY_STYLE[spot.category] ?? { icon: <Landmark className="w-4 h-4" />, bg: 'bg-gray-100', text: 'text-gray-600' };
              return (
                <div
                  key={spot.name}
                  className="snap-start shrink-0 w-[210px] bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="h-28 bg-gradient-to-br from-primary-50 to-primary-100/70 flex items-center justify-center">
                    <span className="text-primary/70">{React.cloneElement(style.icon as React.ReactElement, { className: 'w-8 h-8' })}</span>
                  </div>
                  <div className="p-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${style.bg} ${style.text} px-2 py-0.5 rounded-full mb-2`}>
                      {style.icon}
                      {spot.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{spot.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2.5 line-clamp-2">{spot.description}</p>
                    {spot.distance && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{spot.distance}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-9 text-center">
          <button
            onClick={() => scroll('right')}
            className="group inline-flex items-center gap-2 bg-white border-2 border-primary/20 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
          >
            View More Attractions <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}

const STATE_LOCATIONS_MAP_BG: Record<string, string> = {
  Gujarat: '/images/sections/locations-gujarat-map-bg.png',
  Maharashtra: '/images/sections/locations-maharashtra-map-bg.png',
  Rajasthan: '/images/sections/locations-rajasthan-map-bg.png',
  Karnataka: '/images/sections/locations-karnataka-map-bg.png',
  'Uttar Pradesh': '/images/sections/locations-uttar-pradesh-map-bg.png',
  Uttarakhand: '/images/sections/locations-uttarakhand-map-bg.png',
  'Himachal Pradesh': '/images/sections/locations-himachal-pradesh-map-bg.png',
  Bihar: '/images/sections/locations-bihar-map-bg.png',
  'Madhya Pradesh': '/images/sections/locations-madhya-pradesh-map-bg.png',
  'West Bengal': '/images/sections/locations-west-bengal-map-bg.png',
  Kerala: '/images/sections/locations-kerala-map-bg.png',
  'Andhra Pradesh': '/images/sections/locations-andhra-pradesh-map-bg.png',
  Goa: '/images/sections/locations-goa-map-bg.png',
  Haryana: '/images/sections/locations-haryana-map-bg.png',
  'Tamil Nadu': '/images/sections/locations-tamil-nadu-map-bg.png',
  Punjab: '/images/sections/locations-punjab-map-bg.png',
  Assam: '/images/sections/locations-assam-map-bg.png',
  Odisha: '/images/sections/locations-odisha-map-bg.png',
  Chhattisgarh: '/images/sections/locations-chhattisgarh-map-bg.png',
  Jharkhand: '/images/sections/locations-jharkhand-map-bg.png',
  Telangana: '/images/sections/locations-telangana-map-bg.png',
  Sikkim: '/images/sections/locations-sikkim-map-bg.png',
  'Jammu and Kashmir': '/images/sections/locations-jammu-and-kashmir-map-bg.png',
  'Arunachal Pradesh': '/images/sections/locations-arunachal-pradesh-map-bg.png',
  Meghalaya: '/images/sections/locations-meghalaya-map-bg.png',
  Nagaland: '/images/sections/locations-nagaland-map-bg.png',
  'Andaman and Nicobar Islands': '/images/sections/locations-andaman-nicobar-map-bg.png',
  Ladakh: '/images/sections/locations-ladakh-map-bg.png',
  Manipur: '/images/sections/locations-manipur-map-bg.png',
  Mizoram: '/images/sections/locations-mizoram-map-bg.png',
  Tripura: '/images/sections/locations-tripura-map-bg.png',
  Lakshadweep: '/images/sections/locations-lakshadweep-map-bg.png',
  'Dadra and Nagar Haveli and Daman and Diu': '/images/sections/locations-dnh-dd-map-bg.png',
  Puducherry: '/images/sections/locations-puducherry-map-bg.png',
  Delhi: '/images/sections/locations-delhi-map-bg.png',
};

function LocationsSection({ city, nearbyCities, customContent }: { city: City; nearbyCities: City[]; customContent?: string }) {
  if (!nearbyCities.length && !customContent) return null;
  return (
    <section className="relative overflow-hidden py-10 md:py-14 bg-gray-50/80 border-t border-gray-100">
      {STATE_LOCATIONS_MAP_BG[city.state] ? (
        <div
          className="pointer-events-none absolute inset-0 select-none bg-cover bg-right"
          style={{ backgroundImage: `url('${STATE_LOCATIONS_MAP_BG[city.state]}')` }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute -top-16 right-0 w-80 h-80 bg-primary-100/50 rounded-full blur-[110px]" />
          <div className="absolute top-8 right-10 grid grid-cols-4 gap-2 opacity-40">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary-300" />
            ))}
          </div>
        </div>
      )}
      <div className="container-custom relative">
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">More Locations in {city.state}</h2>
          <span className="block w-10 h-1 rounded-full bg-primary mb-4" />
          {customContent
            ? <CustomContent html={customContent} />
            : <p className="text-gray-500 text-sm">We operate across all major cities and towns in {city.state}</p>}
        </div>

        {nearbyCities.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {nearbyCities.map(c => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group relative bg-white rounded-2xl border border-gray-100 pt-5 pb-5 px-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
                <p className="font-bold text-gray-900 mb-2">{c.name}</p>
                <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold">
                  View services <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/locations"
            className="group inline-flex items-center gap-2 bg-white border-2 border-primary/20 text-primary font-bold px-6 py-3 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
          >
            Explore All Locations <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SeoContentSection({ city, seoData, customContent }: { city: City; seoData: any; customContent?: string }) {
  const [tipsExpanded, setTipsExpanded] = useState(false);
  if (!seoData && !customContent) return null;
  return (
    <section className="py-10 md:py-12 bg-gray-50 border-t border-gray-100">
      <div className="container-custom max-w-4xl">
        <div className="flex items-start gap-5 mb-6">
          <span className="p-4 rounded-2xl bg-primary-50 text-primary shrink-0"><Car className="w-7 h-7" /></span>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight">
              Vehicle Rentals in {city.name} —<br /><span className="text-primary">Complete Guide</span>
            </h2>
            <span className="block w-10 h-1 rounded-full bg-primary mt-3" />
          </div>
        </div>
        {/* Custom content replaces the auto intro when set */}
        {customContent
          ? <div className="mb-8"><CustomContent html={customContent} /></div>
          : seoData?.intro && <p className="text-gray-600 leading-relaxed mb-8">{seoData.intro}</p>}
        {seoData?.stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="relative bg-white rounded-2xl border border-gray-100 border-l-4 border-l-primary px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0"><Users className="w-5 h-5" /></span>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wide">Population</p>
                  <p className="text-gray-900 font-bold text-base">{seoData.stats.population}</p>
                </div>
              </div>
              <span className="block h-px w-3/4 bg-primary-100" />
            </div>
            <div className="relative bg-white rounded-2xl border border-gray-100 border-l-4 border-l-primary px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0"><Briefcase className="w-5 h-5" /></span>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-wide">Known For</p>
                  <p className="text-gray-900 font-bold text-base">{seoData.stats.knownFor}</p>
                </div>
              </div>
              <span className="block h-px w-3/4 bg-primary-100" />
            </div>
            <div className="relative bg-white rounded-2xl border border-gray-100 border-l-4 border-l-amber-500 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 rounded-full bg-amber-50 text-amber-600 shrink-0"><Plane className="w-5 h-5" /></span>
                <div>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">Nearest Airport</p>
                  <p className="text-gray-900 font-bold text-base">{seoData.stats.airport}</p>
                </div>
              </div>
              <span className="block h-px w-3/4 bg-amber-100" />
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

interface FaqItem { q: string; a: string; icon?: React.ReactNode; }

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
      icon: <Car className="w-5 h-5" />,
    },
    {
      q: `How do I book a rental vehicle in ${city.name}?`,
      a: `Select the service above, choose your pickup location in ${city.name}, compare quotes from verified vendors, and book instantly.`,
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      q: `Are vendors in ${city.name} verified by TransRentals?`,
      a: `Yes. All vendors listed on TransRentals are verified for documents, vehicle condition, and service quality.`,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      q: `What is the cheapest vehicle rental available in ${city.name}?`,
      a: `Bike rentals start from ₹299/day and car rentals from ₹999/day in ${city.name}. Compare quotes for the best deal.`,
      icon: <Tag className="w-5 h-5" />,
    },
    {
      q: `Can I get an outstation cab from ${city.name}?`,
      a: `Yes. TransRentals offers outstation cabs, one-way cabs, and self-drive cars from ${city.name}. Book for popular routes like ${seoData?.routes?.[0] ? `${city.name} to ${seoData.routes[0].to}` : 'nearby cities'} and more.`,
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  return (
    <section className="py-10 md:py-12 bg-white border-t border-gray-100">
      <div className="container-custom max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0"><HelpCircle className="w-5 h-5" /></span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Frequently Asked Questions — <span className="text-primary">{city.name}</span>
            </h2>
          </div>
          <span className="block w-10 h-1 rounded-full bg-primary mx-auto" />
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-gray-50 open:bg-white rounded-2xl border border-gray-100 open:border-primary/20 open:shadow-sm group transition-colors">
              <summary className="px-4 md:px-5 py-4 cursor-pointer select-none list-none flex items-center gap-4">
                <span className="p-2.5 rounded-full bg-primary-50 text-primary shrink-0">
                  {faq.icon ?? <HelpCircle className="w-5 h-5" />}
                </span>
                <span className="w-px self-stretch bg-gray-200 shrink-0" />
                <span className="flex-1 font-semibold text-gray-900">{faq.q}</span>
                <span className="p-1.5 rounded-full bg-gray-100 text-gray-400 group-open:bg-primary-50 group-open:text-primary transition-colors shrink-0">
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </span>
              </summary>
              <p className="px-4 md:px-5 pb-4 pl-[68px] md:pl-[76px] text-gray-600 text-sm leading-relaxed">{faq.a}</p>
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
          <section key={id} className="py-10 bg-white border-t border-gray-100">
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
