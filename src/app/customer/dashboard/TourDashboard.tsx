// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, MapPin, Clock, Users, Calendar, Loader2, Heart,
  ChevronRight, CheckCircle, AlertCircle, Hourglass,
  Play, Flag, XCircle, MessageSquare, IndianRupee, UserPlus,
  Building2, Tag, Mountain, Tent, Ship, Mail, ArrowRight,
  TreePine, Landmark, Bike, Waves, Snowflake, Search, X,
} from 'lucide-react';

// Same twelve statuses and the same labels as before. The marker is an icon
// again, the way the old view showed it — each one says what the state is
// rather than leaving the colour to carry all the meaning.
const STATUS_CONFIG: Record<string, { label: string; icon: any; text: string }> = {
  PENDING:           { label: 'Pending',         icon: Hourglass,      text: 'text-[#A16207]' },
  QUOTED:            { label: 'Quoted',          icon: MessageSquare,  text: 'text-[#1D4ED8]' },
  ACCEPTED:          { label: 'Accepted',        icon: CheckCircle,    text: 'text-[#056B3E]' },
  CANCELLED:         { label: 'Cancelled',       icon: XCircle,        text: 'text-[#DC2626]' },
  EXPIRED:           { label: 'Expired',         icon: AlertCircle,    text: 'text-[#78857C]' },
  PAYMENT_PENDING:   { label: 'Payment Pending', icon: IndianRupee,    text: 'text-[#A16207]' },
  PAYMENT_SUBMITTED: { label: 'Payment Review',  icon: Clock,          text: 'text-[#C2410C]' },
  CONFIRMED:         { label: 'Confirmed',       icon: CheckCircle,    text: 'text-[#056B3E]' },
  GUIDE_ASSIGNED:    { label: 'Guide Assigned',  icon: UserPlus,       text: 'text-[#1D4ED8]' },
  STARTED:           { label: 'Started',         icon: Play,           text: 'text-[#4338CA]' },
  COMPLETED:         { label: 'Completed',       icon: Flag,           text: 'text-[#78857C]' },
  DROPPED:           { label: 'Dropped',         icon: XCircle,        text: 'text-[#A6B1AA]' },
};

function fmt(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseImages(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

interface TourDashboardProps {
  customerId: string;
  /** The dashboard's view switch, rendered inside this hero. */
  viewSwitch?: React.ReactNode;
}

export default function TourDashboard({ customerId, viewSwitch }: TourDashboardProps) {
  const [tab, setTab] = useState<'requests' | 'bookings' | 'wishlist' | 'groups'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [groups, setGroups]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  const PER_PAGE = 6;

  // Punctuation is flattened on both sides, so a code copied off a card with
  // its separators still lands. Every term must match — search narrows.
  const flatten = (v: unknown) =>
    String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const terms = search.split(/\s+/).map(flatten).filter(Boolean);
  const searching = terms.length > 0;
  const keep = (parts: unknown[]) => {
    if (!searching) return true;
    const hay = flatten(parts.filter(Boolean).join(' '));
    return terms.every((t) => hay.includes(t));
  };

  // Matched against what each card prints, so the result agrees with the screen.
  const fRequests = requests.filter((r: any) =>
    keep([r.listing?.title, r.listing?.category?.name, r.listing?.mainLocation?.name, r.status, r.bookingFor]));
  const fBookings = bookings.filter((b: any) =>
    keep([b.quoteRequest?.listing?.title, b.quoteRequest?.listing?.category?.name,
          b.quoteRequest?.listing?.mainLocation?.name, b.bookingId, b.status, b.quote?.vendor?.businessName]));
  const fWishlists = wishlists.filter((w: any) =>
    keep([w.listing?.title, w.listing?.category?.name, w.listing?.mainLocation?.name,
          w.listing?.vendor?.businessName, w.listing?.duration]));
  const fGroups = groups.filter((g: any) => keep([g.name, g.groupCode]));

  const activeList: any[] =
    tab === 'requests' ? fRequests : tab === 'bookings' ? fBookings : tab === 'wishlist' ? fWishlists : fGroups;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PER_PAGE));
  const paged = (arr: any[]) => arr.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // A narrowed list left on page 4 would render blank, so both reset the paging.
  useEffect(() => { setPage(1); }, [tab, search]);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/customer/wander-quote-requests?customer_id=${customerId}`).then(r => r.json()),
      fetch(`/api/customer/wander-bookings?customer_id=${customerId}`).then(r => r.json()),
      fetch(`/api/wander/wishlist?customerId=${customerId}`).then(r => r.json()),
      fetch(`/api/customer/wander-groups?customer_id=${customerId}`).then(r => r.json()),
    ]).then(([reqData, bookData, wishData, grpData]) => {
      setRequests(reqData.requests || []);
      setBookings(bookData.bookings || []);
      setWishlists(wishData.wishlists || []);
      setGroups(grpData.groups || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  // Stats
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const quotedRequests = requests.filter(r => r.status === 'QUOTED').length;
  const activeBookings = bookings.filter(b => ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#09B368]" />
      </div>
    );
  }

  const TABS = [
    { key: 'requests', label: 'Quote requests', count: fRequests.length,  icon: MessageSquare, tint: 'text-[#B4700F]', bar: 'bg-[#B4700F]' },
    { key: 'bookings', label: 'My bookings',    count: fBookings.length,  icon: Calendar,      tint: 'text-[#09B368]', bar: 'bg-[#09B368]' },
    // the heart and the user-plus are the marks the old view used here
    { key: 'wishlist', label: 'Saved',          count: fWishlists.length, icon: Heart,         tint: 'text-[#BE123C]', bar: 'bg-[#BE123C]' },
    { key: 'groups',   label: 'Groups',         count: fGroups.length,    icon: UserPlus,      tint: 'text-[#0B7C74]', bar: 'bg-[#0B7C74]' },
  ] as const;

  const HERO_STATS = [
    { label: 'Pending requests', value: pendingRequests,   caption: 'Awaiting quotes',      icon: Hourglass },
    { label: 'Quotes received',  value: quotedRequests,    caption: 'Vendors responded',    icon: MessageSquare },
    { label: 'Active tours',     value: activeBookings,    caption: 'Confirmed & running',  icon: Play },
    { label: 'Completed',        value: completedBookings, caption: 'Trips finished',       icon: Flag },
  ];

  // One vehicle-free trail: four travel marks walking the route, one per pass.
  const TREK = [Mountain, Tent, Ship, Compass];

  // The soonest trip still ahead, drawn from the same requests and bookings —
  // no new fetch, just the earliest future travelDate of the two lists.
  const nextTrip = [
    ...bookings.map((b: any) => ({ date: b.travelDate, place: b.quoteRequest?.listing?.mainLocation?.name })),
    ...requests.map((r: any) => ({ date: r.travelDate, place: r.listing?.mainLocation?.name })),
  ]
    .filter((x) => x.date && new Date(x.date).getTime() >= Date.now() - 864e5)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Same gutter maths as the bookings hero, so both panels start their content
  // on the page's content column even though they run edge to edge.
  const GUTTER = { paddingLeft: 'max(24px, calc((100vw - 1240px) / 2))' } as const;
  const GUTTER_R = { paddingRight: 'max(24px, calc((100vw - 1240px) / 2))' } as const;

  return (
    <>
      <style>{`
        /* Four 24s slots inside one 96s loop — each mark crosses during its own
           slot and stays hidden for the other three. */
        @keyframes trtTrek{
          0%{transform:translateX(-40px);opacity:0}
          2%{opacity:1}
          23%{opacity:1}
          25%{transform:translateX(100cqw);opacity:0}
          25.01%{transform:translateX(-40px);opacity:0}
          100%{transform:translateX(-40px);opacity:0}}
        .trt-trek{animation:trtTrek 144s linear infinite backwards}
        .trt-lane{container-type:inline-size}
        /* the same perforated seam the bookings hero uses, notches and all */
        .trt-perf{background:repeating-linear-gradient(180deg,rgba(255,255,255,.26) 0 6px,transparent 6px 12px)}
        .trt-perf::before,.trt-perf::after{content:"";position:absolute;left:-9px;width:18px;height:18px;border-radius:9999px;background:#fff}
        .trt-perf::before{top:-9px}
        .trt-perf::after{bottom:-9px}
        @keyframes trtPan{to{background-position:-40px -40px}}
        .trt-grid{animation:trtPan 26s linear infinite}
        @keyframes trtRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .trt-rise{animation:trtRise .66s cubic-bezier(.2,.9,.25,1) var(--d,0s) both}
        @keyframes trtDash{to{background-position-x:-14px}}
        .trt-dash{animation:trtDash 1.6s linear infinite}
        @media (prefers-reduced-motion: reduce){
          .trt-trek{animation:none;opacity:0}
          .trt-trek:first-of-type{opacity:1}
          .trt-grid,.trt-rise,.trt-dash{animation:none}
        }
      `}</style>

      {/* ══════════════ HERO — full-bleed, same frame as the bookings hero ══════════════ */}
      <div className="relative mt-8 grid grid-cols-1 overflow-hidden bg-gradient-to-br from-[#022B1A] via-[#045030] to-[#09B368] text-white lg:grid-cols-[0.74fr_auto_1.26fr]">
        {/* drifting grid */}
        <div className="trt-grid pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* key light from the top right, and a soft floor shadow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(760px 340px at 88% -25%, rgba(255,255,255,.20), transparent 62%), radial-gradient(520px 260px at 8% 130%, rgba(1,35,20,.55), transparent 60%)' }} />
        {/* glow blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#09B368]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#056040]/40 blur-2xl" />
        {/* lit top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* ── the trail along the bottom ── */}
        <div className="trt-lane pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[44px] overflow-hidden">
          {/* waymarks, drifting faster than the grid for depth */}
          <div className="absolute inset-x-0 bottom-[22px] h-4"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.16) 0 1px, transparent 1px 110px)',
              WebkitMaskImage: 'linear-gradient(transparent 10%, #000 90%)',
              maskImage: 'linear-gradient(transparent 10%, #000 90%)',
            }} />
          {/* the ground */}
          <div className="absolute inset-x-0 bottom-0 h-[22px] border-t border-white/[0.18] bg-[#01230F]/55" />
          {/* the route itself */}
          <div className="trt-dash absolute inset-x-0 bottom-[10px] h-[2px]"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.42) 0 8px, transparent 8px 14px)' }} />
          {/* waypoints */}
          {['13%', '54%', '81%'].map((left) => (
            <span key={left} className="absolute bottom-[7px] h-2 w-2 rounded-full border-2 border-white/70 bg-[#04321F]" style={{ left }} />
          ))}
          {/* one mark per pass, cycling through all four */}
          {TREK.map((Icon, i) => (
            <span
              key={i}
              className="trt-trek absolute bottom-[18px] left-0 text-[#E4FBEF] drop-shadow-[0_3px_6px_rgba(0,0,0,.45)]"
              style={{ animationDelay: `${i * 36}s` }}
              aria-hidden
            >
              <Icon className="h-[26px] w-[26px]" />
            </span>
          ))}
        </div>

        <div className="relative z-10 flex items-center pb-[58px] pr-6 pt-8 lg:pr-[46px]" style={GUTTER}>
          <div className="trt-rise min-w-0">
            <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/[0.55]">
              <span className="h-px w-6 bg-white/30" />
              Where to next
            </p>
            <h1 className="quote-serif mt-1.5 text-[36px] font-medium leading-[1] tracking-[-0.02em] [text-shadow:0_2px_20px_rgba(0,0,0,.28)] sm:text-[42px]">
              Your tours
            </h1>
            <p className="mt-1.5 text-[12.5px] tracking-[0.02em] text-white/[0.55]">Curated experiences from verified operators</p>
            {viewSwitch}

            {/* the left half was empty; this is the one thing worth knowing */}
            {nextTrip && (
              <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.08] px-3.5 py-2 text-[11.5px] text-white/[0.72] backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5 flex-none text-white/[0.55]" />
                <span className="font-semibold text-white/[0.9]">Next departure</span>
                <span className="h-3 w-px bg-white/25" />
                <span className="tabular-nums">{fmt(nextTrip.date)}</span>
                {nextTrip.place && (
                  <>
                    <span className="h-3 w-px bg-white/25" />
                    <span>{nextTrip.place}</span>
                  </>
                )}
              </p>
            )}

          </div>
        </div>

        <div className="trt-perf relative z-10 hidden w-px lg:block" />

        <div className="relative z-10 flex items-center pb-[58px] pl-6 pt-8 lg:pl-10" style={GUTTER_R}>
          <div className="trt-rise grid w-full grid-cols-2 gap-3 lg:grid-cols-4" style={{ ['--d' as any]: '.12s' }}>
            {HERO_STATS.map(({ label, value, caption, icon: Icon }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3 pb-2.5 pt-2.5 backdrop-blur-sm sm:px-4 sm:pb-3 sm:pt-3"
              >
                {/* lit top edge, same trick as the panel itself */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                <div className="flex items-center gap-2">
                  <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-lg border border-white/20 bg-white/[0.14]">
                    <Icon className="h-3 w-3" />
                  </span>
                  <p className="min-w-0 text-[9px] uppercase leading-[1.4] tracking-[0.08em] text-white/[0.66] sm:tracking-[0.16em]">{label}</p>
                </div>
                <p className="quote-serif mt-1.5 text-[26px] font-medium leading-none tabular-nums [text-shadow:0_2px_14px_rgba(0,0,0,.25)] sm:mt-2 sm:text-[32px]">
                  {value}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-white/[0.5] sm:mt-1.5">{caption}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ TRIPS & REQUESTS ══════════════ */}
      <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-14 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#A6B1AA]">Your travel</p>
            <h2 className="quote-serif mt-2 text-[34px] font-medium leading-none sm:text-[40px]">Trips &amp; requests</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-[13px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A6B1AA]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trips..."
                aria-label="Search trips and requests"
                className="w-[210px] rounded-full border border-[#D4DFD8] bg-white py-2 pl-9 pr-8 text-[12px] text-[#0B1610] transition placeholder:text-[#A6B1AA] focus:border-[#B4700F] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-[11px] top-1/2 -translate-y-1/2 text-[#A6B1AA] transition hover:text-[#0B1610]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* was a faint link buried in the hero; out here it can be the real CTA */}
            <Link
              href="/wander"
              className="group/cta inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D9930F] to-[#B4700F] px-[18px] py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(180,112,15,.85)] transition hover:-translate-y-0.5"
            >
              <Compass className="h-3.5 w-3.5" />
              Explore all tours
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-[3px]" />
            </Link>
          </div>
        </div>

        {/* one strip, a column per tab — counts carried by the display face */}
        <div className="mb-8 mt-[22px] grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E7EEE9] sm:grid-cols-4">
          {TABS.map((t, idx) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative border-[#E7EEE9] px-3 py-3 text-left transition sm:px-4 ${
                  idx % 2 === 0 ? 'border-r' : ''
                } sm:border-r sm:[&:nth-child(4)]:border-r-0 ${
                  idx < 2 ? 'border-b sm:border-b-0' : ''
                } ${on ? 'bg-[#F4F8F5]' : 'bg-white hover:bg-[#FAFCFB]'}`}
              >
                <span className="flex items-center gap-2">
                  {React.createElement(t.icon, {
                    // the heart fills when Saved is the open tab, as it did before
                    className: `h-[13px] w-[13px] flex-none ${t.tint}${on && t.key === 'wishlist' ? ' fill-current' : ''}`,
                  })}
                  <span className={`min-w-0 text-[9.5px] uppercase tracking-[0.06em] sm:tracking-[0.16em] ${
                    on ? 'font-semibold text-[#0B1610]' : 'font-medium text-[#A6B1AA]'
                  }`}>
                    {t.label}
                  </span>
                </span>
                <span className={`quote-serif mt-1 block text-[24px] font-medium leading-none tabular-nums ${
                  on ? 'text-[#0B1610]' : 'text-[#78857C]'
                }`}>
                  {t.count}
                </span>
                {on && <span className={`absolute inset-x-0 bottom-0 h-[2px] ${t.bar}`} />}
              </button>
            );
          })}
        </div>

        {/* ── QUOTE REQUESTS ── */}
        {tab === 'requests' && (
          fRequests.length === 0 ? (
            searching ? <NoMatches query={search.trim()} onClear={() => setSearch('')} />
              : <EmptyState message="No tour quote requests yet" sub="Browse tours and request quotes to get started!" link="/wander" linkText="Explore Tours" accent="amber" />
          ) : (
            <>
              <SectionCap label="Out for quotes" />
              {paged(fRequests).map((req: any, i: number) => {
                const listing = req.listing;
                const images = parseImages(listing?.images);
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                const quoteCount = req.quotes?.length || 0;
                const lowestQuote = quoteCount > 0 ? req.quotes[0] : null;

                return (
                  <Link key={req.id} href={`/customer/wander-quotes/${req.id}`} className={`${PASS} before:bg-[#B4700F]`}>
                    <Shot src={images[0]} tone={i % 3} seq={String(i + 1).padStart(2, '0')} />

                    <div className="flex min-w-0 flex-col justify-center px-6 py-5">
                      {listing?.category && (
                        <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">
                          <CategoryMark icon={listing.category.icon} name={listing.category.name} />
                          {listing.category.name}
                        </span>
                      )}
                      <h3 className="quote-serif mt-2 truncate text-[26px] font-medium leading-[1.1] tracking-[-0.02em] text-[#0B1610] transition group-hover:text-[#056B3E] sm:text-[31px]">
                        {listing?.title || 'Tour Request'}
                        {req.bookingFor === 'COMPANY' && (
                          <span className="ml-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#C3D6F5] bg-[#E7EFFD] px-2.5 py-[3px] align-middle text-[9px] font-bold uppercase tracking-[0.12em] text-[#1D4ED8]">
                            <Building2 className="h-[10px] w-[10px]" /> Company
                          </span>
                        )}
                      </h3>
                      <Itin
                        location={listing?.mainLocation?.name}
                        date={fmt(req.travelDate)}
                        party={`${req.groupSize} travellers`}
                      />
                    </div>

                    <div className={STUB}>
                      <span className={NOTCH_A} />
                      <span className={NOTCH_B} />
                      <p className={`flex items-center gap-2.5 text-[11.5px] font-semibold ${sc.text}`}>
                        {React.createElement(sc.icon, { className: 'h-[14px] w-[14px] flex-none' })} {sc.label}
                      </p>
                      {quoteCount > 0 ? (
                        <>
                          <p className="quote-serif mt-4 text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[#0B1610]">
                            ₹{Number(lowestQuote.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="mt-1.5 text-[10.5px] text-[#A6B1AA]">
                            Lowest of {quoteCount} quote{quoteCount > 1 ? 's' : ''}
                          </p>
                        </>
                      ) : (
                        <p className="quote-serif mt-4 text-[18px] italic text-[#78857C]">Waiting for quotes...</p>
                      )}
                      <p className={GO}>
                        {quoteCount > 0 ? 'Compare' : 'View request'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>
                  </Link>
                );
              })}

            </>
          )
        )}

        {/* ── MY BOOKINGS ── */}
        {tab === 'bookings' && (
          fBookings.length === 0 ? (
            searching ? <NoMatches query={search.trim()} onClear={() => setSearch('')} />
              : <EmptyState message="No tour bookings yet" sub="Accept a quote to create your first booking" accent="green" />
          ) : (
            <>
              <SectionCap label="Confirmed with an operator" />
              {paged(fBookings).map((booking: any, i: number) => {
                const listing = booking.quoteRequest?.listing;
                const images = parseImages(listing?.images);
                const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
                const vendor = booking.quote?.vendor;
                const done = booking.status === 'COMPLETED';

                return (
                  <Link
                    key={booking.id}
                    href={`/customer/wander-quotes/${booking.quoteRequestId}`}
                    className={`${PASS} before:bg-[#09B368]${done ? ' opacity-[0.78]' : ''}`}
                  >
                    <Shot src={images[0]} tone={done ? 3 : i % 3} />

                    <div className="flex min-w-0 flex-col justify-center px-6 py-5">
                      {vendor?.businessName && (
                        <span className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${done ? 'text-[#78857C]' : 'text-[#6D28D9]'}`}>
                          Operated by {vendor.businessName}
                        </span>
                      )}
                      <h3 className="quote-serif mt-2 truncate text-[26px] font-medium leading-[1.1] tracking-[-0.02em] text-[#0B1610] transition group-hover:text-[#056B3E] sm:text-[31px]">
                        {listing?.title || 'Tour Booking'}
                      </h3>
                      <Itin
                        location={listing?.mainLocation?.name}
                        date={fmt(booking.travelDate)}
                        dateLabel={done ? 'Departed' : 'Departs'}
                        party={`${booking.groupSize} travellers`}
                      />
                      <Journey status={booking.status} />
                    </div>

                    <div className={STUB}>
                      <span className={NOTCH_A} />
                      <span className={NOTCH_B} />
                      {booking.bookingId && (
                        <p className="mb-2.5 font-mono text-[10.5px] tracking-[0.08em] text-[#A6B1AA]">{booking.bookingId}</p>
                      )}
                      <p className={`flex items-center gap-2.5 text-[11.5px] font-semibold ${sc.text}`}>
                        {React.createElement(sc.icon, { className: 'h-[14px] w-[14px] flex-none' })} {sc.label}
                      </p>
                      <p className="quote-serif mt-4 flex items-center text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[#0B1610]">
                        <IndianRupee className="h-[22px] w-[22px]" />
                        {Number(booking.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1.5 text-[10.5px] text-[#A6B1AA]">Total</p>
                      <p className={GO}>Open booking <ArrowRight className="h-3.5 w-3.5" /></p>
                    </div>
                  </Link>
                );
              })}
            </>
          )
        )}

        {/* ── SAVED ── */}
        {tab === 'wishlist' && (
          fWishlists.length === 0 ? (
            searching ? <NoMatches query={search.trim()} onClear={() => setSearch('')} />
              : <EmptyState message="No saved tours yet" sub="Tap the heart icon on any tour to save it here" link="/wander" linkText="Explore Tours" accent="rose" />
          ) : (
            <>
              <SectionCap label="Kept for later" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paged(fWishlists).map((w: any, i: number) => {
                  const listing = w.listing;
                  if (!listing) return null;
                  const images = parseImages(listing.images);
                  return (
                    <Link
                      key={w.id}
                      href={`/wander/${listing.slug || listing.id}`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-[20px] border border-[#E7EEE9] transition-all duration-300 hover:-translate-y-1 hover:border-[#9FD8BE] hover:shadow-[0_26px_54px_-24px_rgba(4,50,31,.34)] before:pointer-events-none before:absolute before:inset-y-5 before:left-[9px] before:z-10 before:w-[3px] before:rounded-full before:origin-center before:scale-y-0 before:bg-[#BE123C] before:transition-transform before:duration-200 hover:before:scale-y-100"
                    >
                      <ShotFill src={images[0]} tone={i % 3} />
                      {/* the scrim lifts the text off the picture */}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 via-white/[0.82] to-white [background-position:0_0] [background-size:100%_100%]"
                        style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0) 26%, rgba(255,255,255,.82) 58%, #fff 88%)' }} />
                      <span className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full border border-[#FBD0DC] bg-white/90 text-[#BE123C] transition duration-300 group-hover:scale-110 group-hover:bg-white">
                        <Heart className="h-[15px] w-[15px] fill-current" />
                      </span>

                      <div className="absolute inset-x-5 bottom-5">
                        {listing.category && (
                          <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">
                            <CategoryMark icon={listing.category.icon} name={listing.category.name} />
                            {listing.category.name}
                          </span>
                        )}
                        <h4 className="quote-serif mt-2 text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#0B1610] transition group-hover:text-[#056B3E]">
                          {listing.title}
                        </h4>
                        <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E7EEE9] pt-2.5 text-[11px] text-[#46524A]">
                          {listing.mainLocation?.name && (
                            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {listing.mainLocation.name}</span>
                          )}
                          {listing.duration && (
                            <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {listing.duration}</span>
                          )}
                        </p>
                        {listing.vendor?.businessName && (
                          <p className="mt-1.5 text-[10.5px] text-[#A6B1AA]">{listing.vendor.businessName}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )
        )}

        {/* ── GROUPS ── */}
        {tab === 'groups' && (
          fGroups.length === 0 ? (
            searching ? <NoMatches query={search.trim()} onClear={() => setSearch('')} />
              : <EmptyState message="No group trips yet" sub='Go to a tour page and click "Plan with Friends" to create your first group' link="/wander" linkText="Explore Tours" accent="teal" />
          ) : (
            <>
              <SectionCap label="Planning together" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {paged(fGroups).map((g: any) => {
                  const planningTrips  = (g.trips || []).filter((t: any) => t.status === 'PLANNING').length;
                  const submittedTrips = (g.trips || []).filter((t: any) => t.status === 'SUBMITTED').length;
                  const members = g.members || [];
                  return (
                    <Link
                      key={g.id}
                      href={`/wander/group/${g.groupCode}`}
                      className="group relative block overflow-hidden rounded-[20px] border border-[#BFE7E2] bg-white py-6 pl-[26px] pr-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#69C6BD] hover:shadow-[0_26px_54px_-24px_rgba(4,48,44,.34)] before:pointer-events-none before:absolute before:inset-y-5 before:left-[9px] before:z-10 before:w-[3px] before:rounded-full before:origin-center before:scale-y-0 before:bg-[#0B7C74] before:transition-transform before:duration-200 hover:before:scale-y-100"
                    >
                      <span className="pointer-events-none absolute -right-[46px] -top-[46px] h-[170px] w-[170px] rounded-full border border-[#BFE7E2] transition-all duration-500 group-hover:scale-110 group-hover:border-[#69C6BD]" />
                      <span className="pointer-events-none absolute -right-4 -top-4 h-[110px] w-[110px] rounded-full border border-[#BFE7E2] transition-all duration-500 group-hover:scale-110 group-hover:border-[#69C6BD]" />

                      <h4 className="quote-serif relative truncate text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] transition group-hover:text-[#056B3E]">
                        {g.name}
                      </h4>
                      <span className="relative mt-2 inline-block rounded-lg border border-dashed border-[#BFE7E2] bg-[#F0FDFA] px-3 py-1.5 font-mono text-[12px] tracking-[0.14em] text-[#0B7C74] transition-colors duration-300 group-hover:border-[#69C6BD] group-hover:bg-[#DCF5F1]">
                        {g.groupCode}
                      </span>

                      <Faces members={members} />

                      <div className="relative mt-[18px] flex flex-wrap items-center gap-2 border-t border-[#E7EEE9] pt-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F8F5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#78857C]">
                          <Users className="h-[11px] w-[11px]" /> {members.length} members
                        </span>
                        {planningTrips > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF8EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#B4700F]">
                            <Calendar className="h-[11px] w-[11px]" /> {planningTrips} planning
                          </span>
                        )}
                        {submittedTrips > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8F1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[#056B3E]">
                            <CheckCircle className="h-[11px] w-[11px]" /> {submittedTrips} submitted
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )
        )}

        {activeList.length > 0 && (
          <div className="flex items-center justify-between py-[26px] text-[12px] text-[#78857C]">
            <span className="tabular-nums">
              Page {page} of {totalPages} · showing {paged(activeList).length} of {activeList.length}
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`rounded-full border px-[18px] py-2 text-[12px] font-semibold transition ${page === 1 ? 'cursor-not-allowed border-[#E7EEE9] text-[#D4DFD8]' : 'border-[#D4DFD8] text-[#46524A] hover:border-[#B4700F] hover:text-[#B4700F]'}`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`rounded-full border px-[18px] py-2 text-[12px] font-semibold transition ${page === totalPages ? 'cursor-not-allowed border-[#E7EEE9] text-[#D4DFD8]' : 'border-[#D4DFD8] text-[#46524A] hover:border-[#B4700F] hover:text-[#B4700F]'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── shared class strings for the boarding-pass card ───────────────────── */

/** Image | itinerary | stub. Stacks to one column below lg. */
const PASS =
  // pl-[22px] is the gutter the accent line sits in
  'group relative mb-5 grid grid-cols-1 overflow-hidden rounded-[20px] border border-[#E7EEE9] bg-white pl-[22px] ' +
  'transition-all duration-300 hover:-translate-y-1 hover:border-[#9FD8BE] ' +
  'hover:shadow-[0_26px_54px_-24px_rgba(4,50,31,.34)] ' +
  // the inside line: a 3px bar wipes down the gutter on hover, clear of the photo
  'before:pointer-events-none before:absolute before:inset-y-5 before:left-[9px] before:z-10 before:w-[3px] ' +
  'before:rounded-full before:origin-center before:scale-y-0 ' +
  'before:transition-transform before:duration-200 hover:before:scale-y-100 ' +
  'lg:grid-cols-[236px_minmax(0,1fr)_208px]';

/** The tear-off panel. Its dashed rule runs down the seam (across it on mobile). */
const STUB =
  'relative flex flex-col justify-center bg-[#F4F8F5] px-6 py-5 transition-colors duration-300 ' +
  'group-hover:bg-[#EAF8F1] ' +
  'before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-[repeating-linear-gradient(90deg,#D4DFD8_0_5px,transparent_5px_11px)] ' +
  'lg:pl-7 lg:before:inset-x-auto lg:before:inset-y-5 lg:before:left-0 lg:before:h-auto lg:before:w-px ' +
  'lg:before:bg-[repeating-linear-gradient(to_bottom,#D4DFD8_0_5px,transparent_5px_11px)]';

/** The punched hole at each end of the perforation; the card clips it in half. */
/**
 * The punched hole at each end of the perforation. The seam runs across the top
 * of the stub on mobile and down its left edge from lg, so the pair has to
 * move with it — otherwise both holes stack on one side and the ticket breaks.
 */
const NOTCH_BASE =
  'pointer-events-none absolute h-3.5 w-3.5 rounded-full border border-[#E7EEE9] bg-white';
const NOTCH_A = `${NOTCH_BASE} -top-2 -left-2 lg:top-[-7px] lg:left-[-7px]`;
const NOTCH_B = `${NOTCH_BASE} -top-2 -right-2 lg:right-auto lg:top-auto lg:bottom-[-7px] lg:left-[-7px]`;

const GO =
  'mt-[18px] flex items-center gap-[7px] text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#A6B1AA] ' +
  'transition-all group-hover:gap-[11px] group-hover:text-[#056B3E]';

/** Small caps rule above a tab's list, the same device the dashboard uses. */
function SectionCap({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3.5">
      <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#A6B1AA]">{label}</span>
      <span className="h-px flex-1 bg-[#E7EEE9]" />
    </div>
  );
}

/** Three washes so a run of cards has rhythm when listings have no photo. */
const TONES = [
  { bg: 'from-[#E4F6EE] via-[#D3EEE0] to-[#C4E7D6]', line: 'rgba(5,107,62,.16)',  ink: 'rgba(4,50,31,.34)',  mark: 'rgba(4,50,31,.28)' },
  { bg: 'from-[#E7F1FD] via-[#D8E7F8] to-[#CBDDF2]', line: 'rgba(29,78,216,.15)', ink: 'rgba(18,42,94,.34)', mark: 'rgba(18,42,94,.26)' },
  { bg: 'from-[#FDF3DC] via-[#F7E7C4] to-[#EFDCB0]', line: 'rgba(180,112,15,.16)', ink: 'rgba(61,36,8,.34)', mark: 'rgba(61,36,8,.26)' },
  { bg: 'from-[#EEF2F0] via-[#E2E9E5] to-[#D6E0DA]', line: 'rgba(11,22,16,.12)',  ink: 'rgba(11,22,16,.34)', mark: 'rgba(11,22,16,.22)' },
];

/** Contour lines, drawn inline so the slot reads as a place even with no photo. */
function Contours({ stroke }: { stroke: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 260 180">
      <g fill="none" stroke={stroke} strokeWidth="1">
        <path d="M-20 150 C 40 108, 96 168, 150 124 S 250 78, 300 116" />
        <path d="M-20 124 C 44 84, 100 142, 154 98 S 252 54, 300 92" />
        <path d="M-20 98 C 48 60, 104 116, 158 72 S 254 30, 300 68" />
        <path d="M-20 72 C 52 36, 108 90, 162 46 S 256 6, 300 44" />
        <path d="M-20 46 C 56 12, 112 64, 166 20 S 258 -18, 300 20" />
        <path d="M-20 176 C 36 134, 92 194, 146 150 S 248 104, 300 142" />
      </g>
    </svg>
  );
}

/** The pass's picture panel: the listing photo, or a contoured wash in its place. */
function Shot({ src, tone = 0, seq, code }: { src?: string; tone?: number; seq?: string; code?: string }) {
  const t = TONES[tone] || TONES[0];
  return (
    <div className={`relative h-[150px] overflow-hidden rounded-l-[10px] bg-gradient-to-br ${t.bg} lg:h-auto`}>
      {/* Absolute, so a tall portrait photo fills the panel instead of
          stretching the whole card to its intrinsic height. */}
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <>
          <Contours stroke={t.line} />
          <span className="absolute bottom-4 left-5" style={{ color: t.mark }}>
            <Compass className="h-[30px] w-[30px]" />
          </span>
        </>
      )}
      {/* The wash only blends the drawn placeholder into the card. A real photo
          is left alone — a white veil over it just reads as blur. */}
      {!src && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white/55 lg:bg-gradient-to-r" />
      )}
      {/* The sequence number is decoration, so it only appears on the drawn
          placeholder — it never sits on top of a real photo. */}
      {seq && !src && (
        <span className="quote-serif absolute left-5 top-4 text-[16px] italic" style={{ color: t.ink }}>{seq}</span>
      )}
      {/* The booking number is data, so it always shows. Over a photo it gets a
          solid ground rather than a blur, which would smear the picture. */}
      {code && (
        <span
          className={`absolute left-4 top-3 font-mono text-[11px] tracking-[0.1em] ${
            src ? 'rounded-md bg-[#04150E]/70 px-2 py-1 text-white' : 'left-5 top-4'
          }`}
          style={src ? undefined : { color: t.ink }}
        >
          {code}
        </span>
      )}
    </div>
  );
}

/** Same picture panel, filling a wishlist tile. */
function ShotFill({ src, tone = 0 }: { src?: string; tone?: number }) {
  const t = TONES[tone] || TONES[0];
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${t.bg}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      ) : <Contours stroke={t.line} />}
    </div>
  );
}

/** The itinerary strip: a labelled field per fact, only where the fact exists. */
function Itin({ location, date, dateLabel = 'Departs', party }: { location?: string; date?: string; dateLabel?: string; party?: string }) {
  const F = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className="min-w-0">
      <p className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-[#A6B1AA]">{k}</p>
      <p className="mt-[3px] flex items-center gap-[7px] text-[12.5px] text-[#46524A]">{children}</p>
    </div>
  );
  return (
    <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-[#E7EEE9] pt-3 transition-colors duration-300 group-hover:border-[#C6E7D8] sm:gap-x-6">
      {location && <F k="Region"><MapPin className="hidden h-3 w-3 flex-none sm:block" /> {location}</F>}
      {date && <F k={dateLabel}><Calendar className="hidden h-3 w-3 flex-none sm:block" /> <span className="tabular-nums">{date}</span></F>}
      {party && <F k="Party"><Users className="hidden h-3 w-3 flex-none sm:block" /> <span className="tabular-nums">{party}</span></F>}
    </div>
  );
}

/**
 * The four-step journey track, replacing the old coloured strip on the
 * thumbnail. Only drawn for statuses that sit on the track — a cancelled or
 * expired booking has no position on it, so it shows nothing.
 */
const JOURNEY = ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'COMPLETED'];
const JOURNEY_LABELS = ['Confirmed', 'Guide assigned', 'Started', 'Completed'];

function Journey({ status }: { status: string }) {
  const at = JOURNEY.indexOf(status);
  if (at < 0) return null;
  return (
    <div className="mt-3 flex items-center pr-4">
      {JOURNEY_LABELS.map((label, i) => {
        const done = i < at || (i === at && status === 'COMPLETED');
        const now = i === at && status !== 'COMPLETED';
        return (
          <div key={label} className={`flex items-center gap-2.5 ${i === JOURNEY_LABELS.length - 1 ? 'flex-none' : 'flex-1'}`}>
            <span className={`h-[7px] w-[7px] flex-none rounded-full ${
              done ? 'bg-[#09B368]' : now ? 'bg-[#B4700F] ring-4 ring-[#B4700F]/[0.14]' : 'bg-[#D4DFD8]'
            }`} />
            <span className={`whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-[0.14em] ${
              done || now ? 'text-[#46524A]' : 'text-[#A6B1AA]'
            }`}>
              {label}
            </span>
            {i < JOURNEY_LABELS.length - 1 && (
              <span className={`mx-2.5 h-px flex-1 ${done ? 'bg-[#C6E7D8]' : 'bg-[#D4DFD8]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Stacked member circles. The initial is used only when the member record
 * actually carries a name — otherwise the circle shows a generic mark rather
 * than inventing one.
 */
function Faces({ members }: { members: any[] }) {
  if (!members.length) return null;
  const shown = members.slice(0, 4);
  const rest = members.length - shown.length;
  return (
    <div className="relative mt-[18px] flex items-center">
      {shown.map((m: any, i: number) => {
        const name = (m?.name || m?.customer?.name || m?.customerName || '').trim();
        const initial = name ? name.charAt(0).toUpperCase() : '';
        return (
          <span
            key={m?.id ?? i}
            className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#09B368] to-[#056040] text-white ${i > 0 ? '-ml-2.5' : ''}`}
          >
            {initial
              ? <span className="quote-serif text-[15px] font-semibold">{initial}</span>
              : <Users className="h-3.5 w-3.5" />}
          </span>
        );
      })}
      {rest > 0 && (
        <span className="-ml-2.5 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#F4F8F5] text-[10px] font-bold text-[#78857C]">
          +{rest}
        </span>
      )}
    </div>
  );
}

/**
 * The category mark. Categories carry an emoji in the database; this maps that
 * — and the category name — onto a drawn icon, so the row stays in the same
 * stroke language as the rest of the page. First match wins; a category we
 * don't recognise gets a tag.
 */
const CATEGORY_ICONS: Array<[RegExp, any]> = [
  [/trek|hike|hiking|mountain|himalay|peak|summit|valley|\u{1F3D4}|\u{26F0}|\u{1F97E}/u, Mountain],
  [/snow|ski|winter|glacier|\u{2744}|\u{1F3BF}|\u{26F7}/u, Snowflake],
  [/desert|dune|camp|camping|glamp|\u{26FA}|\u{1F3D5}|\u{1F42A}/u, Tent],
  [/backwater|houseboat|boat|cruise|ferry|sail|\u{26F5}|\u{1F6A2}|\u{1F6F6}/u, Ship],
  [/beach|island|sea|ocean|coast|lagoon|\u{1F3DD}|\u{1F30A}|\u{1F3D6}/u, Waves],
  [/wildlife|safari|jungle|forest|national park|nature|\u{1F332}|\u{1F333}|\u{1F405}/u, TreePine],
  [/heritage|temple|fort|palace|historic|culture|monument|\u{1F3DB}|\u{1F6D5}|\u{1F3F0}/u, Landmark],
  [/city|urban|metro|\u{1F3D9}|\u{1F306}/u, Building2],
  [/road ?trip|drive|bike|cycl|motor|\u{1F697}|\u{1F3CD}|\u{1F6B2}/u, Bike],
  [/map|explore|travel|tour|trip|journey|\u{1F5FA}|\u{1F9ED}|\u{2708}/u, Compass],
];

function CategoryMark({ icon, name }: { icon?: string | null; name?: string | null }) {
  const hay = `${name || ''} ${icon || ''}`.toLowerCase();
  const hit = CATEGORY_ICONS.find(([re]) => re.test(hay));
  const Icon = hit ? hit[1] : Tag;
  return <Icon className="h-[11px] w-[11px] flex-none" />;
}

/**
 * Empty state, built like the dashboard's own: a hairline, a centred mark, a
 * serif line and the way out. No panel and no background — the two empty
 * states already on this dashboard don't have one either.
 */
const EMPTY_TONE = {
  green: { mark: 'text-[#09B368]', cta: 'bg-[#056B3E] hover:bg-[#09B368]', icon: Compass },
  amber: { mark: 'text-[#B4700F]', cta: 'bg-[#B4700F] hover:bg-[#96600C]', icon: Hourglass },
  rose:  { mark: 'text-[#BE123C]', cta: 'bg-[#BE123C] hover:bg-[#9F0F33]', icon: Heart },
  teal:  { mark: 'text-[#0B7C74]', cta: 'bg-[#0B7C74] hover:bg-[#09635D]', icon: UserPlus },
};

function NoMatches({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 border-t border-[#E7EEE9] py-20">
      <Search className="h-7 w-7 text-[#A6B1AA]" />
      <p className="quote-serif text-[24px] font-medium text-[#0B1610]">No matches</p>
      <p className="max-w-xs text-center text-xs text-[#A6B1AA]">
        Nothing here matches &ldquo;{query}&rdquo;. Try a tour name, destination or operator.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#D4DFD8] bg-white px-5 py-2.5 text-xs font-semibold text-[#46524A] transition hover:border-[#B4700F] hover:text-[#B4700F]"
      >
        <X className="h-3.5 w-3.5" /> Clear search
      </button>
    </div>
  );
}

function EmptyState({ message, sub, link, linkText, accent = 'green' }: { message: string; sub: string; link?: string; linkText?: string; accent?: 'green' | 'amber' | 'rose' | 'teal' }) {
  const t = EMPTY_TONE[accent];
  const Icon = t.icon;
  return (
    <div className="flex flex-col items-center gap-3 border-t border-[#E7EEE9] py-20">
      <Icon className={`h-7 w-7 ${t.mark}`} />
      <p className="quote-serif text-[24px] font-medium text-[#0B1610]">{message}</p>
      <p className="max-w-xs text-center text-xs text-[#A6B1AA]">{sub}</p>
      {link && (
        <Link href={link} className={`mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition ${t.cta}`}>
          <Compass className="h-3.5 w-3.5" /> {linkText}
        </Link>
      )}
    </div>
  );
}
