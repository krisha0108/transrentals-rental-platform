'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Fraunces } from 'next/font/google';
import { IndianState, ALL_CITIES, City } from '@/data/indian-cities';
import { ALL_SERVICES, ServiceConfig } from '@/data/service-config';
import { parseSectionsConfig } from '@/lib/city-sections';
import {
  MapPin, ArrowRight, ChevronDown, Search,
  Car, Bike, Bus, Briefcase, Truck, Package, Plane,
  Shield, Zap, Lock, Headphones, Landmark, Star,
} from 'lucide-react';

// Premium serif display font — mirrors the /wander page's typography system
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700', '900'],
  display: 'swap',
});

const MotionLink = motion(Link);

function CountUp({ value, duration = 1200, suffix = '', decimals = 0 }: { value: number; duration?: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        started = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Number((eased * value).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration, decimals]);

  return <span ref={ref}>{display}{suffix}</span>;
}

const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardReveal = {
  hidden:  { opacity: 0, y: 18, scale: 0.97 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, delay: (i % 10) * 0.035, ease: [0.22, 1, 0.36, 1] },
  }),
};

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

const STATE_LANDMARK_IMAGES: Record<string, string> = {
  gujarat: '/images/states/gujarat-landmarks.png',
};

const CITY_ICONS: Record<string, string> = {
  ahmedabad: '/images/cities/ahmedabad.png',
  surat:     '/images/cities/surat.png',
  vadodara:  '/images/cities/vadodara.png',
  rajkot:    '/images/cities/rajkot.png',
  gandhinagar: '/images/cities/gandhinagar.png',
  somnath:   '/images/cities/somnath.png',
  dwarka:    '/images/cities/dwarka.png',
  gir:       '/images/cities/gir.png',
  kutch:     '/images/cities/kutch.png',
  'statue-of-unity': '/images/cities/statue-of-unity.png',
  bhavnagar: '/images/cities/bhavnagar.png',
  jamnagar:  '/images/cities/jamnagar.png',
  junagadh:  '/images/cities/junagadh.png',
  anand:     '/images/cities/anand.png',
  bharuch:   '/images/cities/bharuch.png',
  navsari:   '/images/cities/navsari.png',
  valsad:    '/images/cities/valsad.png',
  porbandar: '/images/cities/porbandar.png',
  veraval:   '/images/cities/veraval.png',
  bhuj:      '/images/cities/bhuj.png',
  diu:       '/images/cities/diu.png',
  saputara:  '/images/cities/saputara.png',
  morbi:     '/images/cities/morbi.png',
  mehsana:   '/images/cities/mehsana.png',
  nadiad:    '/images/cities/nadiad.png',
  surendranagar: '/images/cities/surendranagar.png',
  palanpur:  '/images/cities/palanpur.png',
  mumbai:        '/images/cities/mumbai.png',
  'navi-mumbai': '/images/cities/navi-mumbai.png',
  pune:          '/images/cities/pune.png',
  nagpur:        '/images/cities/nagpur.png',
  shirdi:        '/images/cities/shirdi.png',
  nashik:        '/images/cities/nashik.png',
  aurangabad:    '/images/cities/aurangabad.png',
  lonavala:      '/images/cities/lonavala.png',
  mahabaleshwar: '/images/cities/mahabaleshwar.png',
  alibaug:       '/images/cities/alibaug.png',
  ajanta:        '/images/cities/ajanta.png',
  ellora:        '/images/cities/ellora.png',
  solapur:       '/images/cities/solapur.png',
  kolhapur:      '/images/cities/kolhapur.png',
  panchgani:     '/images/cities/panchgani.png',
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100 hover:border-blue-300',   bar: 'bg-blue-500'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100 hover:border-green-300', bar: 'bg-green-500'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100 hover:border-purple-300', bar: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100 hover:border-orange-300', bar: 'bg-orange-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100 hover:border-red-300',     bar: 'bg-red-500'    },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100 hover:border-teal-300',   bar: 'bg-teal-500'   },
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
    <section className="relative bg-slate-950 overflow-hidden min-h-[600px] flex items-center">
      {/* fleet lineup photo — night skyline, real vehicles */}
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: "url('/images/hero/fleet-lineup-night.png')", backgroundPosition: 'center 35%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 from-5% via-slate-950/75 via-40% to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/40" />

      {/* decorative glow blobs — brand color accents over the photo */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[520px] h-[520px] bg-primary-500/15 rounded-full blur-[140px]"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[440px] h-[440px] bg-amber-500/10 rounded-full blur-[140px]"
          animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="container-custom relative py-16 md:py-20 w-full">
        <div className="max-w-2xl">
          <motion.nav
            initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="flex items-center gap-2 text-white/50 text-sm mb-6"
          >
            <Link href="/" className="hover:text-white transition-colors">India</Link>
            <span>/</span>
            <span className="text-white/85 font-semibold">{state.name}</span>
          </motion.nav>

          <motion.div
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs font-bold tracking-wide uppercase px-3.5 py-1.5 rounded-full mb-6"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-400" />
            </span>
            <MapPin className="w-3.5 h-3.5" /> {state.code} &middot; {citiesInState.length} Cities
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className={`${fraunces.className} text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.06] tracking-tight mb-5`}
          >
            {cmsData?.pageHeading || (
              <>
                Vehicle Rentals in{' '}
                <motion.span
                  className="bg-gradient-to-r from-primary-300 via-emerald-200 to-primary-300 bg-clip-text text-transparent bg-[length:200%_auto] inline-block"
                  animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  {state.name}
                </motion.span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl"
          >
            {cmsData?.pageDescription ||
              `Book cars, bikes, buses & more across ${state.name}. Compare quotes from verified vendors across all cities.`}
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="flex flex-wrap items-center gap-3 mb-9"
          >
            <motion.a href="#services"
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="group relative inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-6 py-3.5 rounded-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-12" />
              <span className="relative">Explore Services</span>
              <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
            </motion.a>
            <motion.a href="#cities"
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/15 text-white font-bold text-sm px-6 py-3.5 rounded-xl border border-white/20"
            >
              Browse Cities
            </motion.a>
          </motion.div>

          {customContent && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 text-white/85 text-sm leading-relaxed mb-8">
              <CustomContent html={customContent} />
            </div>
          )}

          <motion.div
            initial="hidden" animate="visible" custom={5} variants={fadeUp}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm border-t border-white/10 pt-6"
          >
            <div><span className="font-black text-white text-lg"><CountUp value={citiesInState.length} suffix="+" /></span><span className="text-white/50 ml-1.5">cities</span></div>
            <div><span className="font-black text-white text-lg"><CountUp value={CATEGORY_ORDER.length} /></span><span className="text-white/50 ml-1.5">categories</span></div>
            <div><span className="font-black text-white text-lg"><CountUp value={500} suffix="+" duration={1600} /></span><span className="text-white/50 ml-1.5">vendors</span></div>
            <div><span className="font-black text-white text-lg"><CountUp value={4.8} decimals={1} duration={1400} />★</span><span className="text-white/50 ml-1.5">rating</span></div>
          </motion.div>
        </div>
      </div>
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
  const availableCats = CATEGORY_ORDER.filter(cat => grouped[cat]?.length);
  const [activeCat, setActiveCat] = useState<'all' | ServiceConfig['category']>('all');
  const filteredServices = activeCat === 'all'
    ? availableCats.flatMap(cat => grouped[cat])
    : grouped[activeCat] || [];

  const renderServiceCard = (svc: ServiceConfig, i: number) => {
    const ov = getOverride(svc.slug);
    const name = ov?.customName || svc.name;
    const cfg = CATEGORY_CONFIG[svc.category];
    const typeLabel = svc.type === 'hub-based' ? 'Hub pickup' : 'Doorstep delivery';
    return (
      <MotionLink
        key={svc.slug}
        href={`/${svc.slug}/${state.slug}`}
        custom={i}
        variants={cardReveal}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="group relative block aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.5)] transition-shadow duration-300"
      >
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-115 transition-transform duration-500 ease-out"
          style={{ backgroundImage: `url('${SERVICE_IMAGES[svc.slug] || CATEGORY_IMAGES[svc.category]}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10 group-hover:from-black/95 transition-colors duration-300" />
        <span className="absolute top-3 left-3 p-2 rounded-lg bg-white/15 backdrop-blur-md text-white [&>svg]:w-4 [&>svg]:h-4">
          {cfg.icon}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-bold text-white text-[15px] leading-snug mb-1.5 drop-shadow-sm">
            {name}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/65 truncate">{typeLabel} &middot; {state.name}</p>
            <span className="w-7 h-7 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </MotionLink>
    );
  };

  return (
    <section id="services" className="py-20 md:py-28 bg-white scroll-mt-20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-4 max-w-3xl"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-3 block">What we offer</span>
          <h2 className={`${fraunces.className} text-3xl md:text-4xl lg:text-[2.5rem] font-black text-gray-900 tracking-tight mb-3`}>
            Services Available in {state.name}
          </h2>
          <p className="text-gray-500 text-lg">Choose from our wide range of vehicle rental services, all verified and ready to book.</p>
        </motion.div>

        {/* category filter — sliding pill indicator */}
        <div className="flex flex-wrap gap-2 mb-10 pt-6 border-t border-gray-100">
          <button
            onClick={() => setActiveCat('all')}
            className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeCat === 'all' ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {activeCat === 'all' && (
              <motion.span layoutId="svcCatPill" className="absolute inset-0 bg-gray-900 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">All Services</span>
          </button>
          {availableCats.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {isActive && (
                  <motion.span layoutId="svcCatPill" className="absolute inset-0 bg-gray-900 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative flex items-center gap-1.5 [&>svg]:w-3.5 [&>svg]:h-3.5">
                  {cfg.icon}
                  {cfg.label}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {activeCat === 'all'
              ? availableCats.map(cat => (
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

function TrustSection({ state }: { state: IndianState }) {
  const items = [
    { n: '01', Icon: Shield,     title: 'Verified & Insured', desc: `Every vendor in ${state.name} is document-verified — RC, insurance and license checked before listing.` },
    { n: '02', Icon: Zap,        title: 'Instant Quotes',     desc: 'Compare prices from multiple verified operators side by side, in minutes.' },
    { n: '03', Icon: Lock,       title: 'Zero Advance',       desc: 'Book now, pay later — no advance payment required to confirm your ride.' },
    { n: '04', Icon: Headphones, title: '24/7 Support',       desc: 'A dedicated support team for every booking, from pickup to drop-off.' },
  ];

  return (
    <section className="relative py-20 md:py-24 bg-slate-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>
      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mb-14 max-w-2xl"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-primary-400 mb-3 block">Why TransRentals</span>
          <h2 className={`${fraunces.className} text-3xl md:text-[2.75rem] font-black text-white tracking-tight`}>
            Built for trust, all across {state.name}
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative bg-white/[0.04] border border-white/10 rounded-3xl p-6 overflow-hidden backdrop-blur-sm"
            >
              <span className="absolute -bottom-3 -right-1 text-[92px] font-black text-white/[0.04] leading-none select-none">{item.n}</span>
              <div className="relative">
                <span className="inline-flex w-11 h-11 rounded-2xl bg-primary-500/15 text-primary-400 items-center justify-center mb-5">
                  <item.Icon className="w-5 h-5" />
                </span>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function tierBadge(tier: number): { label: string; cls: string } {
  if (tier === 1) return { label: 'Metro',       cls: 'bg-amber-50 text-amber-700 border-amber-100' };
  if (tier === 2) return { label: 'Tier 2',       cls: 'bg-blue-50 text-blue-700 border-blue-100'    };
  return              { label: `Tier ${tier}`, cls: 'bg-gray-50 text-gray-500 border-gray-100'    };
}

function CitiesSection({ state, cities, customContent }: { state: IndianState; cities: City[]; customContent?: string }) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery]     = useState('');

  const filtered = query.trim()
    ? cities.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : cities;
  const isSearching = !!query.trim();
  const displayed = isSearching || showAll ? filtered : filtered.slice(0, 24);
  const landmarkImg = STATE_LANDMARK_IMAGES[state.slug];

  return (
    <section id="cities" className="relative py-16 md:py-20 bg-white scroll-mt-20 overflow-hidden">
      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-10"
        >
          <div className="lg:w-[48%] shrink-0">
            <span className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              <span className="w-px h-3 bg-primary-200" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary-600">Where we operate</span>
            </span>
            <h2 className={`${fraunces.className} text-3xl md:text-4xl lg:text-[2.5rem] font-black text-gray-900 tracking-tight mb-2`}>Cities in {state.name}</h2>
            {customContent
              ? <div className="max-w-xl"><CustomContent html={customContent} /></div>
              : <p className="text-gray-500 text-lg">We operate across {cities.length} cities and towns in {state.name}</p>}
          </div>

          {landmarkImg && (
            <div
              className="hidden lg:block flex-1 h-56 bg-contain bg-no-repeat bg-center"
              style={{ backgroundImage: `url('${landmarkImg}')` }}
            />
          )}

          <div className="lg:w-72 shrink-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={`Search cities in ${state.name}…`}
                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
              <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <p className="font-black text-gray-900 text-sm">{cities.length} Cities</p>
                <p className="text-gray-400 text-xs">Across {state.name}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {displayed.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">No cities match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {displayed.map((c, i) => {
              const badge = tierBadge(c.tier);
              const featured = i === 0 && !isSearching;
              const cityIcon = CITY_ICONS[c.slug];
              return (
                <MotionLink
                  key={c.slug}
                  href={`/${c.slug}`}
                  custom={i}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.5 }}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className={`group relative overflow-hidden bg-white border rounded-xl px-4 py-4 flex flex-col items-center text-center hover:shadow-[0_16px_40px_-15px_rgba(9,179,104,0.3)] transition-colors ${
                    featured ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-100 hover:border-primary-200 hover:bg-primary-50/40'
                  }`}
                >
                  {featured && (
                    <span className="absolute top-0 right-0 w-7 h-7 bg-primary-500 text-white flex items-start justify-end p-1 [clip-path:polygon(100%_0,0_0,100%_100%)]">
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                  {cityIcon ? (
                    <span
                      className="w-20 h-14 mb-1.5 bg-contain bg-no-repeat bg-center"
                      style={{ backgroundImage: `url('${cityIcon}')` }}
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-gray-50 group-hover:bg-primary-100 text-gray-400 group-hover:text-primary-600 flex items-center justify-center mb-2.5 transition-colors">
                      <Landmark className="w-4 h-4" />
                    </span>
                  )}
                  <p className="font-bold text-sm text-gray-800 group-hover:text-primary-700 transition-colors mb-1.5">{c.name}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                </MotionLink>
              );
            })}
          </div>
        )}

        {!isSearching && cities.length > 24 && (
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAll(!showAll)}
            className="relative z-10 mt-8 flex items-center gap-2 text-primary-700 font-bold text-sm mx-auto bg-white border border-gray-200 px-5 py-2.5 rounded-full hover:border-primary-300 hover:shadow-sm transition-all"
          >
            {showAll ? 'Show less' : `Show all ${cities.length} cities`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </motion.button>
        )}
      </div>

      {/* decorative skyline silhouette strip */}
      <svg
        className="absolute bottom-0 left-0 w-full h-14 md:h-20 text-primary-900/[0.06] pointer-events-none"
        viewBox="0 0 1200 100" preserveAspectRatio="none" fill="currentColor"
      >
        <rect x="10" y="40" width="30" height="60" /><rect x="45" y="20" width="18" height="80" />
        <rect x="70" y="55" width="26" height="45" /><polygon points="110,60 122,25 134,60" />
        <rect x="150" y="35" width="22" height="65" /><rect x="180" y="50" width="34" height="50" />
        <circle cx="250" cy="45" r="16" /><rect x="242" y="45" width="16" height="55" />
        <rect x="290" y="15" width="20" height="85" /><rect x="320" y="45" width="28" height="55" />
        <rect x="360" y="30" width="24" height="70" /><rect x="400" y="55" width="40" height="45" />
        <rect x="460" y="20" width="18" height="80" /><rect x="490" y="40" width="30" height="60" />
        <polygon points="540,60 552,25 564,60" /><rect x="580" y="35" width="22" height="65" />
        <rect x="620" y="50" width="34" height="50" /><rect x="670" y="15" width="20" height="85" />
        <rect x="710" y="45" width="28" height="55" /><rect x="750" y="30" width="24" height="70" />
        <rect x="790" y="55" width="40" height="45" /><rect x="850" y="20" width="18" height="80" />
        <rect x="880" y="40" width="30" height="60" /><polygon points="930,60 942,25 954,60" />
        <rect x="970" y="35" width="22" height="65" /><rect x="1010" y="50" width="34" height="50" />
        <rect x="1060" y="15" width="20" height="85" /><rect x="1100" y="45" width="28" height="55" />
        <rect x="1140" y="30" width="24" height="70" /><rect x="1180" y="55" width="20" height="45" />
      </svg>
    </section>
  );
}

function defaultSeoContent(state: IndianState): string {
  const cityCount = getCitiesInState(state).length;
  return `
    <p>Looking for reliable vehicle rentals in ${state.name}? TransRentals connects you with verified vendors across ${state.name}, offering everything from self-drive cars and bikes to chauffeur-driven cabs, tempo travellers, and full-size buses. Whether you need a car for a quick city errand, a bike to explore at your own pace, or a bus for a large group outing, our platform makes it easy to compare prices and book instantly — no hidden charges and no advance payment required.</p>
    <p>Every vendor listed on TransRentals in ${state.name} goes through a strict verification process — registration certificates, insurance papers, and driving licenses are checked before a vehicle is added to our marketplace. This means you can book with confidence, knowing the vehicle and driver meet our safety standards.</p>
    <p>We currently cover ${cityCount}+ cities and towns across ${state.name}, from major metros to smaller towns, making it simple to find a rental near you regardless of where you're travelling. Prices are transparent and start as low as ₹299/day for two-wheelers and ₹999/day for cars, with instant quotes from multiple operators so you can pick the best deal for your trip.</p>
    <p>Ready to book? Choose a service above, select your city in ${state.name}, and get matched with verified vendors in minutes.</p>
  `;
}

// Accordion-style HTML block, closed by default — same open/close pattern as
// the FAQ section. Used for the SEO guide and for any custom section an admin
// adds, so long content doesn't dump onto the page by default.
function ExpandableContent({ html, readMoreLabel = 'Read more' }: { html: string; readMoreLabel?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-primary-700 font-bold text-sm hover:gap-3 transition-all"
      >
        {expanded ? 'Show less' : readMoreLabel}
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${expanded ? 'max-h-[3000px] mt-4' : 'max-h-0'}`}>
        <CustomContent html={html} />
      </div>
    </div>
  );
}

function SeoContentSection({ state, customContent }: { state: IndianState; customContent?: string }) {
  const html = customContent || defaultSeoContent(state);
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="container-custom max-w-4xl">
        <span className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-3 block">Guide</span>
        <h2 className={`${fraunces.className} text-2xl md:text-[2.75rem] font-black text-gray-900 tracking-tight mb-6`}>
          Vehicle Rentals in {state.name} — Complete Guide
        </h2>
        <ExpandableContent html={html} readMoreLabel="Read full guide" />
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
    <section className="py-16 md:py-20 bg-[#F1EEE8]/60 border-t border-gray-100">
      <div className="container-custom max-w-3xl">
        <span className="text-xs font-bold tracking-widest uppercase text-primary-600 mb-3 block">FAQs</span>
        <h2 className={`${fraunces.className} text-2xl md:text-[2.75rem] font-black text-gray-900 tracking-tight mb-10`}>
          Frequently Asked Questions — {state.name}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 group open:border-primary-200 open:shadow-sm transition-colors"
            >
              <summary className="px-5 py-4 font-bold text-gray-900 cursor-pointer select-none list-none flex justify-between items-center gap-4">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 group-open:text-primary-600 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </motion.details>
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
      case 'hero':
        return <HeroSection key="hero" state={state} cmsData={cmsData} customContent={customContent} />;
      case 'services':
        return (
          <React.Fragment key="services">
            <ServicesSection state={state} customContent={customContent} />
            <TrustSection state={state} />
          </React.Fragment>
        );
      case 'routes':      return null; // no routes section for state pages
      case 'locations':   return <CitiesSection      key="locations"   state={state} cities={cities} customContent={customContent} />;
      case 'seo_content': return <SeoContentSection  key="seo_content" state={state} customContent={customContent} />;
      case 'faq':         return <FaqSection         key="faq"         state={state} customContent={customContent} />;
      default:
        if (!customContent) return null;
        return (
          <section key={id} className="py-16 bg-white border-t border-gray-100">
            <div className="container-custom max-w-4xl">
              <h2 className={`${fraunces.className} text-2xl md:text-[2.75rem] font-black text-gray-900 tracking-tight mb-6`}>{label}</h2>
              <ExpandableContent html={customContent} />
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {sections
        .filter(s => s.visible)
        .sort((a, b) => a.order - b.order)
        .map(s => renderSection(s.id, s.label, s.content || undefined))}
    </div>
  );
}
