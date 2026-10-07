'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  Bed,
  Bath,
  Users,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  Send,
  CalendarDays,
  Wifi,
  Snowflake,
  Flame,
  Droplet,
  Tv,
  Shirt,
  Wind,
  Waves,
  Dumbbell,
  UtensilsCrossed,
  Flower2,
  Building2,
  Trees,
  Presentation,
  Sofa,
  Car,
  Accessibility,
  BatteryCharging,
  Video,
  HeartPulse,
  AlertTriangle,
  Lock,
  Coffee,
  Wine,
  Microwave,
  Refrigerator,
  ChefHat,
  Mountain,
  Baby,
  Bike,
  Palmtree,
  ArrowUpDown,
  type LucideIcon,
} from 'lucide-react';
import { AMENITY_LABEL_MAP, CANCELLATION_POLICIES } from '@/lib/property-amenities';
import { useCustomerAuth } from '@/hooks/useCustomer';

/** "• Daily breakfast\n• Airport pickup" style free text → clean bullet list. */
function parseLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi, ac: Snowflake, heating: Flame, hot_water: Droplet, tv: Tv, washer: Shirt, iron: Shirt, hair_dryer: Wind,
  pool: Waves, gym: Dumbbell, restaurant: UtensilsCrossed, spa: Flower2, rooftop: Building2, garden: Trees, conference_room: Presentation, lounge: Sofa,
  free_parking: Car, paid_parking: Car, elevator: ArrowUpDown, wheelchair: Accessibility, '24h_checkin': Clock, ev_charger: BatteryCharging,
  cctv: Video, fire_extinguisher: Flame, first_aid: HeartPulse, security_guard: Shield, smoke_alarm: AlertTriangle, safe_locker: Lock,
  breakfast: Coffee, all_meals: UtensilsCrossed, minibar: Wine, coffee_tea: Coffee, microwave: Microwave, fridge: Refrigerator, kitchen: ChefHat,
  bonfire: Flame, bbq: Flame, adventure: Mountain, kids_play: Baby, cycling: Bike, beach_access: Palmtree,
};

interface Property {
  id: string;
  slug: string | null;
  name: string;
  propertyType: string;
  description: string | null;
  highlights: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  landmark: string | null;
  totalRooms: number;
  bedroomsCount: number | null;
  bathroomsCount: number | null;
  maxGuests: number | null;
  startingPrice: number | null;
  minNights: number | null;
  maxNights: number | null;
  cancellationPolicy: string | null;
  amenities: string[];
  inclusions: string | null;
  exclusions: string | null;
  rules: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  coverImage: string | null;
  galleryImages: string[];
  rating: number | null;
  totalRatings: number;
}

interface PropertyReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Agency {
  id: string;
  slug: string;
  agencyName: string;
  ownerName: string;
  logo: string | null;
  phone: string;
  email: string;
  isVerified: boolean;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESORT: 'Resort',
  HOTEL: 'Hotel',
  HOMESTAY: 'Homestay',
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  GUEST_HOUSE: 'Guest House',
  HOSTEL: 'Hostel',
  ROOMS: 'Rooms',
  OTHER: 'Other',
};

export default function PropertyDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const { slug, id } = params;
  const [property, setProperty] = useState<Property | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { customer } = useCustomerAuth();

  const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '', guests: '', message: '' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setEnquiry((p) => ({ ...p, name: p.name || customer.name || '', phone: p.phone || customer.phone || '', email: p.email || customer.email || '' }));
  }, [customer]);

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setEnquiryError('');

    if (enquiry.name.trim().length < 2) {
      setEnquiryError('Please enter your name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(enquiry.phone)) {
      setEnquiryError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (enquiry.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email.trim())) {
      setEnquiryError('Please enter a valid email address.');
      return;
    }

    setEnquirySubmitting(true);
    try {
      const res = await fetch(`/api/travel-agent/properties/${property.id}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...enquiry,
          checkInDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
          checkOutDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
          customerId: customer?.id,
        }),
      });
      const j = await res.json();
      if (res.ok) {
        setEnquirySent(true);
      } else {
        setEnquiryError(j.error || 'Could not send your enquiry.');
      }
    } catch {
      setEnquiryError('Network error. Please try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/agent/${slug}`);
        if (!res.ok) {
          const j = await res.json();
          setError(j.error || 'Could not load property');
          return;
        }
        const json = await res.json();
        setAgency(json.agency);
        const found = (json.properties as Property[]).find(
          (p) => p.id === id || p.slug === id,
        );
        if (!found) {
          setError('Property not found');
          return;
        }
        setProperty(found);
      } catch {
        setError('Could not load property');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  useEffect(() => {
    if (!property?.id) return;
    fetch(`/api/travel-agent/properties/${property.id}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setReviews(json?.reviews || []))
      .catch(() => {});
  }, [property?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Bed className="w-7 h-7 text-white animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 absolute -inset-2 animate-spin text-emerald-500/40" />
        </div>
        <p className="mt-6 text-sm font-semibold text-emerald-800">Preparing your stay...</p>
      </div>
    );
  }

  if (error || !property || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 text-sm">{error || 'This stay is not available.'}</p>
          <Link
            href={`/agent/${slug}`}
            className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline"
          >
            ← Back to agency
          </Link>
        </div>
      </div>
    );
  }

  const images = [
    ...(property.coverImage ? [property.coverImage] : []),
    ...(property.galleryImages || []),
  ];
  const hasImages = images.length > 0;
  const whatsappUrl = `https://wa.me/91${String(agency.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    `Hi ${agency.agencyName}, I'm interested in "${property.name}" listed on your TransRentals page.`,
  )}`;
  const nights =
    dateRange?.from && dateRange?.to
      ? Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000))
      : null;

  const renderBookingCard = () => (
    <div className="rounded-2xl border border-gray-200 shadow-lg shadow-gray-900/5 p-5">
      {enquirySent ? (
        <div className="text-center py-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="font-bold text-gray-900">Enquiry sent!</p>
          <p className="text-sm text-gray-600 mt-1">{agency.agencyName} will get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={submitEnquiry}>
          {property.startingPrice && (
            <p className="mb-3">
              <span className="text-2xl font-extrabold text-gray-900">₹{property.startingPrice.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500"> / night</span>
            </p>
          )}

          {enquiryError && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{enquiryError}</p>
          )}

          {/* Date range trigger — opens the calendar popover below */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className="grid grid-cols-2 w-full rounded-xl border border-gray-300 overflow-hidden text-left hover:border-gray-400 transition"
            >
              <span className="px-3.5 py-2.5 border-r border-gray-300">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Check-in</span>
                <span className="block text-sm font-semibold text-gray-900">
                  {dateRange?.from ? format(dateRange.from, 'd MMM yyyy') : 'Add date'}
                </span>
              </span>
              <span className="px-3.5 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Checkout</span>
                <span className="block text-sm font-semibold text-gray-900">
                  {dateRange?.to ? format(dateRange.to, 'd MMM yyyy') : 'Add date'}
                </span>
              </span>
            </button>

            {calendarOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setCalendarOpen(false)} />
                <div
                  className="absolute left-0 right-0 sm:left-auto sm:right-auto top-full mt-2 z-30 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 w-[320px]"
                  style={{
                    '--rdp-accent-color': '#059669',
                    '--rdp-accent-background-color': '#d1fae5',
                    '--rdp-range_middle-background-color': '#d1fae5',
                    '--rdp-range_middle-color': '#065f46',
                    '--rdp-day-width': '36px',
                    '--rdp-day-height': '36px',
                    '--rdp-day_button-width': '36px',
                    '--rdp-day_button-height': '36px',
                  } as React.CSSProperties}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900 inline-flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-emerald-600" /> Pick your dates
                    </p>
                    <button type="button" onClick={() => setCalendarOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <DayPicker
                    mode="range"
                    numberOfMonths={1}
                    selected={dateRange}
                    onSelect={setDateRange}
                    defaultMonth={dateRange?.from ?? new Date()}
                    disabled={{ before: new Date() }}
                  />
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setDateRange(undefined)}
                      className="text-sm font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(false)}
                      className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-gray-300 px-3.5 py-2.5 mt-3">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Guests {property.maxGuests ? <span className="normal-case font-medium text-gray-400">· max {property.maxGuests}</span> : null}
            </label>
            <input
              type="number"
              min={1}
              max={property.maxGuests ?? undefined}
              placeholder="1 guest"
              value={enquiry.guests}
              onChange={(e) => {
                const raw = e.target.value;
                const capped = property.maxGuests && raw ? String(Math.min(Number(raw), property.maxGuests)) : raw;
                setEnquiry((p) => ({ ...p, guests: capped }));
              }}
              className="w-full border-0 p-0 text-sm font-semibold text-gray-900 outline-none focus:ring-0"
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 mt-3">
            <input required type="text" minLength={2} placeholder="Your name *" value={enquiry.name}
              onChange={(e) => setEnquiry((p) => ({ ...p, name: e.target.value }))}
              className={enqInp} />
            <input required type="tel" inputMode="numeric" placeholder="10-digit phone number *"
              maxLength={10} pattern="[6-9][0-9]{9}" value={enquiry.phone}
              onChange={(e) => setEnquiry((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              className={enqInp} />
            <input type="email" placeholder="Email (optional)" value={enquiry.email}
              onChange={(e) => setEnquiry((p) => ({ ...p, email: e.target.value }))}
              className={enqInp} />
            <textarea rows={2} placeholder="Anything else the agent should know? (optional)" value={enquiry.message}
              onChange={(e) => setEnquiry((p) => ({ ...p, message: e.target.value }))}
              className={`${enqInp} resize-none`} />
          </div>

          <button type="submit" disabled={enquirySubmitting}
            className="mt-3.5 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-3 rounded-xl shadow">
            {enquirySubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Enquiry</>}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            You won&apos;t be charged — {agency.agencyName} will contact you directly.
            {nights && property.startingPrice && (
              <> &nbsp;·&nbsp; Est. ₹{(property.startingPrice * nights).toLocaleString('en-IN')} for {nights} night{nights !== 1 ? 's' : ''}</>
            )}
          </p>
        </form>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
        <a href={`tel:${agency.phone}`} title="Call" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 border border-gray-200 rounded-lg py-2">
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 border border-gray-200 rounded-lg py-2">
          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
        </a>
        <a href={`mailto:${agency.email}`} title="Email" className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-700 border border-gray-200 rounded-lg py-2">
          <Mail className="w-3.5 h-3.5" /> Email
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-10">
      {/* Top bar with back link */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/agent/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {agency.agencyName}
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Curated Stay
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Gallery — Airbnb-style 1 large + 4 small grid */}
        <section className="relative grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[260px] sm:h-[420px]">
          {hasImages ? (
            <>
              <button
                type="button"
                onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
                className="col-span-4 row-span-2 sm:col-span-2 sm:row-span-2 cursor-zoom-in bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt={property.name} className="w-full h-full object-cover" />
              </button>
              {images.slice(1, 5).map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => { setActiveImage(i + 1); setLightboxOpen(true); }}
                  className="hidden sm:block relative cursor-zoom-in bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${property.name} ${i + 2}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </>
          ) : (
            <div className="col-span-4 row-span-2 flex items-center justify-center text-7xl bg-gradient-to-br from-amber-100 via-rose-100 to-emerald-100">🏨</div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="bg-white/95 backdrop-blur text-gray-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow uppercase tracking-wide">
              {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
            </span>
          </div>
          {hasImages && (
            <button
              type="button"
              onClick={() => { setActiveImage(0); setLightboxOpen(true); }}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-gray-50"
            >
              <Expand className="w-3.5 h-3.5" /> Show all photos
            </button>
          )}
        </section>

        <div className="mt-8 lg:grid lg:grid-cols-[1fr_380px] lg:gap-14 lg:items-start">
          {/* ── left column — one continuous flow with hairline dividers, Airbnb-style ── */}
          <div className="min-w-0 divide-y divide-gray-200">
            {/* Title + quick facts */}
            <div className="pb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 capitalize">{property.name}</h1>
              {(property.city || property.address) && (
                <p className="mt-1.5 text-sm text-gray-600 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    {property.address && `${property.address}, `}
                    {property.city}
                    {property.state && `, ${property.state}`}
                    {property.landmark && ` · Near ${property.landmark}`}
                  </span>
                </p>
              )}
              {property.rating ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {property.rating.toFixed(1)}
                  {property.totalRatings > 0 && <span className="text-gray-500 font-medium">· {property.totalRatings} review{property.totalRatings !== 1 ? 's' : ''}</span>}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1.5"><Bed className="w-4 h-4 text-gray-400" /> {property.totalRooms} room{property.totalRooms !== 1 ? 's' : ''}</span>
                {!!property.bedroomsCount && <span className="inline-flex items-center gap-1.5"><Bed className="w-4 h-4 text-gray-400" /> {property.bedroomsCount} bedroom{property.bedroomsCount !== 1 ? 's' : ''}</span>}
                {!!property.bathroomsCount && <span className="inline-flex items-center gap-1.5"><Bath className="w-4 h-4 text-gray-400" /> {property.bathroomsCount} bathroom{property.bathroomsCount !== 1 ? 's' : ''}</span>}
                {!!property.maxGuests && <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> Up to {property.maxGuests} guests</span>}
              </div>
            </div>

            {/* Mobile booking card — sidebar is lg-only, so it lives inline here on small screens */}
            <div className="lg:hidden py-6">{renderBookingCard()}</div>

            {/* Hosted by */}
            <div className="py-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {agency.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agency.logo} alt={agency.agencyName} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold">
                    {agency.agencyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900 capitalize inline-flex items-center gap-1.5">
                    Hosted by {agency.agencyName}
                    {agency.isVerified && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">by {agency.ownerName}</p>
                </div>
              </div>
              <Link href={`/agent/${slug}`} className="text-xs font-bold text-emerald-700 hover:underline whitespace-nowrap">
                View profile →
              </Link>
            </div>

            {/* Description */}
            {property.description && (
              <div className="py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About this stay</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Highlights */}
            {parseLines(property.highlights).length > 0 && (
              <div className="py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Highlights</h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {parseLines(property.highlights).map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amenities — icon + label, Airbnb-style */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">What this place offers</h2>
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {property.amenities.map((a, i) => {
                    const isCustom = a.startsWith('custom:');
                    const label = isCustom ? a.slice(7) : AMENITY_LABEL_MAP[a] || a;
                    const Icon = isCustom ? Sparkles : AMENITY_ICON_MAP[a] || CheckCircle2;
                    return (
                      <div key={`${a}-${i}`} className="flex items-center gap-3 text-sm text-gray-700">
                        <Icon className="w-5 h-5 text-gray-500 shrink-0" /> {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inclusions / Exclusions */}
            {(parseLines(property.inclusions).length > 0 || parseLines(property.exclusions).length > 0) && (
              <div className="py-6 grid gap-6 sm:grid-cols-2">
                {parseLines(property.inclusions).length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What&apos;s included
                    </h2>
                    <ul className="space-y-1.5">
                      {parseLines(property.inclusions).map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {parseLines(property.exclusions).length > 0 && (
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-500" /> Not included
                    </h2>
                    <ul className="space-y-1.5">
                      {parseLines(property.exclusions).map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Rules, cancellation policy, check-in/out, nights */}
            {(parseLines(property.rules).length > 0 ||
              property.cancellationPolicy ||
              property.checkInTime ||
              property.checkOutTime ||
              property.minNights ||
              property.maxNights) && (
              <div className="py-6 space-y-5">
                <h2 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" /> Rules &amp; Policies
                </h2>

                <div className="flex flex-wrap gap-3">
                  {property.checkInTime && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Check-in</p>
                        <p className="text-sm font-bold text-gray-800">{property.checkInTime}</p>
                      </div>
                    </div>
                  )}
                  {property.checkOutTime && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Check-out</p>
                        <p className="text-sm font-bold text-gray-800">{property.checkOutTime}</p>
                      </div>
                    </div>
                  )}
                  {(property.minNights || property.maxNights) && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                      <Bed className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Stay length</p>
                        <p className="text-sm font-bold text-gray-800">
                          {property.minNights ? `${property.minNights}+ night${property.minNights !== 1 ? 's' : ''}` : 'No minimum'}
                          {property.maxNights ? `, up to ${property.maxNights}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {property.cancellationPolicy && (() => {
                  const cp = CANCELLATION_POLICIES.find((c) => c.value === property.cancellationPolicy);
                  return (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-amber-800">
                        Cancellation policy — {cp?.label || property.cancellationPolicy}
                      </p>
                      {cp?.description && <p className="text-xs text-amber-700 mt-0.5">{cp.description}</p>}
                    </div>
                  );
                })()}

                {parseLines(property.rules).length > 0 && (
                  <ul className="space-y-1.5">
                    {parseLines(property.rules).map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Shield className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> {l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {property.rating ? property.rating.toFixed(1) : '—'} · {property.totalRatings} review
                  {property.totalRatings !== 1 ? 's' : ''}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900">{r.customerName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {r.comment && <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="pt-6 text-xs text-gray-400">
              <Link href="/" className="font-bold text-emerald-600 hover:underline">TransRentals</Link>
              {' • '}Listed by {agency.agencyName}
            </p>
          </div>

          {/* ── right column — sticky booking card, desktop only ── */}
          <aside className="hidden lg:block lg:sticky lg:top-24">{renderBookingCard()}</aside>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3 z-20">
        <div className="flex items-center gap-2">
          <a href={`tel:${agency.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-bold text-sm px-3 py-3 rounded-xl">
            <Phone className="w-4 h-4" /> Call
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600 text-white font-bold text-sm px-3 py-3 rounded-xl">
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>

      {/* Full-size image lightbox */}
      {lightboxOpen && hasImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5" aria-label="Previous image">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button type="button" onClick={() => setActiveImage((i) => (i + 1) % images.length)} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5" aria-label="Next image">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[activeImage]} alt={property.name} className="max-w-[92vw] max-h-[86vh] object-contain" />
          {images.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">
              {activeImage + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const enqInp =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white';
