'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Phone, MapPin, Calendar, Car, CheckCircle, Clock,
  XCircle, AlertCircle, Loader2, MessageSquare, ArrowRight,
  Banknote, RefreshCw, Share2, Copy, Check,
  UserCircle2, Truck, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import LiveMap from '@/components/tracking/LiveMap';

interface LiveLocation {
  lat: number; lng: number; heading: number | null; updatedAt: string | null;
}
interface AssignedDriver {
  id: string; name: string; phone: string; profilePhoto: string | null;
  slug?: string | null;
  liveLocation?: LiveLocation | null;
}
interface AssignedVehicle {
  id: string; vehicleName: string | null; registrationNumber: string | null;
  color: string | null; fuelType: string | null; seatingCapacity: number | null;
  images: string[];
}
interface Booking {
  bookingNumber: string;
  status: string;
  serviceType: string;
  vehicleType: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  notes: string | null;
  paymentStatus: string;
  totalAmount: number | null;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  assignedDriver: AssignedDriver | null;
  assignedVehicle: AssignedVehicle | null;
  vendor: {
    businessName: string;
    city: string | null;
    phone: string | null;
    logo: string | null;
    slug: string | null;
  };
}

const SERVICE_LABELS: Record<string, string> = {
  bike:             '🏍️ Bike Rental',
  bus:              '🚌 Bus & Tempo',
  'car-with-driver':'🚗 Car with Driver',
  'self-drive':     '🚙 Self-Drive Car',
  luxury:           '✨ Luxury Car',
  transporter:      '🚛 Transporter',
  'packers-movers': '📦 Packers & Movers',
  equipment:        '🔧 Equipment Rental',
  general:          '📋 General',
};

const EXTRA_KEYS: Record<string, { icon: string; label: string }> = {
  'Use Type':   { icon: '🏭', label: 'Use Type' },
  'Goods':      { icon: '📦', label: 'Goods' },
  'Weight':     { icon: '⚖️', label: 'Weight' },
  'Trip':       { icon: '🗺️', label: 'Trip Type' },
  'Time':       { icon: '⏰', label: 'Pickup Time' },
  'Passengers': { icon: '👥', label: 'Passengers' },
  'Helmets':    { icon: '⛑️', label: 'Helmets' },
  'Occasion':   { icon: '✨', label: 'Occasion' },
  'License':    { icon: '🪪', label: 'License' },
  'Duration':   { icon: '📅', label: 'Duration' },
  'Units':      { icon: '🔢', label: 'Units' },
  'Load':       { icon: '📦', label: 'Load Info' },
};
function parseNotes(raw: string | null): { extras: Record<string, string>; freeText: string } {
  if (!raw) return { extras: {}, freeText: '' };
  const lines = raw.split('\n');
  const extras: Record<string, string> = {};
  const freeLines: string[] = [];
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match && EXTRA_KEYS[match[1].trim()]) {
      extras[match[1].trim()] = match[2].trim();
    } else {
      freeLines.push(line);
    }
  }
  return { extras, freeText: freeLines.join('\n').trim() };
}

const PAYMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Payment Pending',   color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  partial:     { label: 'Advance Paid',      color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  collected:   { label: 'Fully Paid',        color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  link_sent:   { label: 'Payment Link Sent', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  paid_online: { label: 'Paid Online',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  waived:      { label: 'Payment Waived',    color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
};

// Timeline steps
const TIMELINE = [
  { key: 'inquiry',     label: 'Request Received',   desc: 'Your booking request was submitted',       icon: '📋' },
  { key: 'confirmed',   label: 'Booking Confirmed',  desc: 'Vendor has confirmed your booking',        icon: '✅' },
  { key: 'in_progress', label: 'Trip in Progress',   desc: 'Your trip has started',                   icon: '🚀' },
  { key: 'completed',   label: 'Trip Completed',     desc: 'Your trip has been completed',             icon: '🎉' },
];

const STATUS_ORDER = ['inquiry', 'confirmed', 'in_progress', 'completed'];

function getStepState(stepKey: string, currentStatus: string): 'done' | 'active' | 'pending' {
  if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
    return stepKey === 'inquiry' ? 'done' : 'pending';
  }
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

const styles = `
  @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-ring { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.6);opacity:0} }
  .fa{animation:floatA 7s ease-in-out infinite}
  .fb{animation:floatB 10s ease-in-out infinite;animation-delay:-4s}
  .fade-up{animation:fadeUp .45s ease-out forwards}
  .pulse-ring::after{content:'';position:absolute;inset:0;border-radius:9999px;border:2px solid currentColor;animation:pulse-ring 1.5s ease-out infinite}
`;

export default function BookingTrackPage() {
  const params = useParams();
  const bookingNumber = params.bookingNumber as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<{ imgs: string[]; idx: number } | null>(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://transrentals.in/track/${bookingNumber}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking ${bookingNumber}`,
          text: `Track my booking with ${booking?.vendor.businessName ?? 'vendor'} — Ref: ${bookingNumber}`,
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const fetchBooking = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/public/booking-track/${bookingNumber}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Not found');
      setBooking(data.booking);
      setLastRefreshed(new Date());
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [bookingNumber]);

  // While the driver is sharing a live location, quietly refresh so the map
  // marker keeps moving without a full-page reload.
  const isLiveTracking = !!booking?.assignedDriver?.liveLocation;
  useEffect(() => {
    if (!isLiveTracking) return;
    const t = setInterval(() => fetchBooking(true), 7000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveTracking, bookingNumber]);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const initials = booking?.vendor.businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '';

  const isCancelled = booking?.status === 'cancelled' || booking?.status === 'rejected';

  const waBtn = 'flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366]/80 hover:bg-[#25D366] text-white text-sm font-semibold transition active:scale-95';
  const waSvg = <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;

  return (
    <div className="min-h-screen relative bg-[#0F0F1A] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Background orbs */}
      <div className="fa pointer-events-none fixed -top-20 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="fb pointer-events-none fixed bottom-10 -right-16 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="fc pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 blur-3xl" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 px-4 py-8 lg:py-12 max-w-5xl mx-auto">

        {/* ── Top header bar ── */}
        <div className="fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white/60 text-xs mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live Booking Tracker
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Track Your Booking</h1>
            <p className="text-white/40 text-sm mt-1">
              Ref: <span className="text-white/70 font-mono font-semibold tracking-wider">{bookingNumber}</span>
            </p>
          </div>
          {!loading && booking && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Share button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Link Copied!' : 'Share'}
              </button>
              {/* Refresh button */}
              <button onClick={() => fetchBooking()} className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white text-sm px-4 py-2 rounded-xl transition">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="text-white/30 text-xs hidden sm:inline">· {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-white/40 text-sm">Fetching booking details…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="fade-up max-w-sm mx-auto bg-white/5 border border-red-500/20 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-white font-bold text-lg mb-2">Booking Not Found</h2>
            <p className="text-white/50 text-sm">No booking found with reference <span className="font-mono text-white/70">{bookingNumber}</span></p>
          </div>
        )}

        {/* ── Main content: 2-col on desktop ── */}
        {!loading && booking && (
          <div className="fade-up lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

            {/* ════ LEFT COLUMN (sticky on desktop) ════ */}
            <div className="space-y-4 lg:sticky lg:top-8">

              {/* Cancelled banner */}
              {isCancelled && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-300 font-semibold text-sm">Booking {booking.status === 'cancelled' ? 'Cancelled' : 'Rejected'}</p>
                    <p className="text-red-400/70 text-xs mt-0.5">Contact the vendor for details</p>
                  </div>
                </div>
              )}

              {/* Vendor card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Your Vendor</h3>
                <div className="flex items-center gap-3 mb-5">
                  {booking.vendor.logo
                    ? <img src={booking.vendor.logo} alt={booking.vendor.businessName} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 shrink-0" />
                    : <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">{initials}</div>
                  }
                  <div>
                    <p className="text-white font-bold leading-tight">{booking.vendor.businessName}</p>
                    {booking.vendor.city && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {booking.vendor.city}
                      </p>
                    )}
                  </div>
                </div>
                {booking.vendor.phone && (
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${booking.vendor.phone}`} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition active:scale-95">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                    <a href={`https://wa.me/${booking.vendor.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={waBtn}>
                      {waSvg} WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Payment card */}
              {(() => {
                const pm = PAYMENT_LABELS[booking.paymentStatus] ?? { label: booking.paymentStatus, color: 'text-gray-400', bg: '' };
                const isGreen  = booking.paymentStatus === 'collected' || booking.paymentStatus === 'paid_online';
                const isOrange = booking.paymentStatus === 'pending';
                const textColor = isGreen ? 'text-emerald-400' : isOrange ? 'text-orange-400' : 'text-yellow-400';
                // Parse Prisma Decimal → Number
                const totalAmt  = Number(booking.totalAmount || 0);
                const paidAmt   = Number(booking.paidAmount  || 0);
                // Use paidAmt as fallback display when totalAmt not set
                const displayAmt = totalAmt > 0 ? totalAmt : paidAmt;
                const dueAmt    = totalAmt > 0 ? totalAmt - paidAmt : 0;
                const pct       = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;
                return (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest">Payment</h3>
                      {/* Status badge — small, secondary */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 ${textColor}`}>
                        {pm.label}
                      </span>
                    </div>

                    {/* Amount — the hero */}
                    {displayAmt > 0 ? (
                      <p className="text-3xl font-bold text-white mb-1">
                        ₹{displayAmt.toLocaleString('en-IN')}
                      </p>
                    ) : null}

                    {/* Progress bar for partial */}
                    {booking.paymentStatus === 'partial' && totalAmt > 0 && (
                      <>
                        <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-yellow-400">Paid ₹{paidAmt.toLocaleString('en-IN')}</span>
                          <span className="text-white/50">Due ₹{dueAmt.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Footer (desktop only) */}
              <p className="hidden lg:block text-center text-white/20 text-xs pt-2">
                Powered by <a href="https://transrentals.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40">TransRentals</a>
              </p>
            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div className="space-y-4">

              {/* Status Timeline */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Booking Status</h3>
                <div>
                  {TIMELINE.map((step, i) => {
                    const state = getStepState(step.key, booking.status);
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 font-bold ${
                            state === 'done'   ? 'bg-green-500 text-white' :
                            state === 'active' ? 'bg-violet-500 text-white pulse-ring' :
                                                'bg-white/8 text-white/20'
                          }`}>
                            {state === 'done' ? '✓' : step.icon}
                          </div>
                          {i < TIMELINE.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[32px] my-1 ${state === 'done' ? 'bg-green-500/40' : 'bg-white/8'}`} />
                          )}
                        </div>
                        <div className={`pb-8 pt-2 flex-1 ${i === TIMELINE.length - 1 ? 'pb-0' : ''}`}>
                          <p className={`font-bold ${
                            state === 'done'   ? 'text-green-300' :
                            state === 'active' ? 'text-white text-base' :
                                                'text-white/25'
                          }`}>{step.label}</p>
                          <p className={`text-sm mt-0.5 ${state === 'pending' ? 'text-white/15' : 'text-white/45'}`}>{step.desc}</p>
                          {state === 'active' && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs bg-violet-500/20 text-violet-300 border border-violet-500/20 rounded-full px-2.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                              Current status
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Assigned Driver card ── */}
              {booking.assignedDriver && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
                  <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Your Driver</h3>
                  <div className="flex items-center gap-3 mb-4">
                    {booking.assignedDriver.profilePhoto
                      ? <img src={booking.assignedDriver.profilePhoto} alt={booking.assignedDriver.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10 shrink-0" />
                      : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {booking.assignedDriver.name.charAt(0).toUpperCase()}
                        </div>
                      )
                    }
                    <div>
                      {booking.assignedDriver.slug ? (
                        <a href={`/captain/${booking.assignedDriver.slug}`} className="text-white font-bold leading-tight hover:underline">
                          {booking.assignedDriver.name}
                        </a>
                      ) : (
                        <p className="text-white font-bold leading-tight">{booking.assignedDriver.name}</p>
                      )}
                      <p className="text-white/40 text-xs mt-0.5">{booking.assignedDriver.phone}</p>
                    </div>
                  </div>

                  {/* ── Live location map (only while driver is sharing on an active trip) ── */}
                  {booking.assignedDriver.liveLocation && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live location
                        </span>
                        <span className="text-white/30 text-[11px]">
                          {booking.assignedDriver.liveLocation.updatedAt
                            ? `Updated ${new Date(booking.assignedDriver.liveLocation.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                            : ''}
                        </span>
                      </div>
                      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 h-56">
                        <LiveMap
                          markers={[{
                            id: booking.assignedDriver.id,
                            lat: booking.assignedDriver.liveLocation.lat,
                            lng: booking.assignedDriver.liveLocation.lng,
                            heading: booking.assignedDriver.liveLocation.heading,
                            color: '#10b981',
                            label: booking.assignedDriver.name,
                            sublabel: 'On the way',
                            icon: 'driver',
                            pulse: true,
                            photo: booking.assignedDriver.profilePhoto,
                          }]}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${booking.assignedDriver.phone}`}
                       className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition active:scale-95">
                      <Phone className="w-4 h-4" /> Call Driver
                    </a>
                    <a href={`https://wa.me/${booking.assignedDriver.phone.replace(/\D/g,'')}`}
                       target="_blank" rel="noopener noreferrer"
                       className={waBtn}>
                      {waSvg} WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* ── Assigned Vehicle card ── */}
              {booking.assignedVehicle && (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                  {/* Image gallery — shown only when images exist */}
                  {booking.assignedVehicle.images.length > 0 && (
                    <div className="relative">
                      {/* Primary image */}
                      <div
                        className="relative w-full h-48 cursor-pointer overflow-hidden"
                        onClick={() => setLightbox({ imgs: booking.assignedVehicle!.images, idx: 0 })}
                      >
                        <img
                          src={booking.assignedVehicle.images[0]}
                          alt={booking.assignedVehicle.vehicleName ?? 'Vehicle'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {booking.assignedVehicle.images.length > 1 && (
                          <span className="absolute bottom-3 right-3 text-xs font-bold bg-black/50 text-white/80 rounded-full px-2.5 py-1 backdrop-blur-sm">
                            +{booking.assignedVehicle.images.length - 1} more
                          </span>
                        )}
                      </div>
                      {/* Thumbnail strip */}
                      {booking.assignedVehicle.images.length > 1 && (
                        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto">
                          {booking.assignedVehicle.images.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setLightbox({ imgs: booking.assignedVehicle!.images, idx: i })}
                              className="shrink-0 w-14 h-10 rounded-lg overflow-hidden ring-1 ring-white/10 hover:ring-violet-400 transition"
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info section */}
                  <div className="p-5">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Your Vehicle</h3>
                    <div className="flex items-center gap-3">
                      {booking.assignedVehicle.images.length === 0 && (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-bold leading-tight">{booking.assignedVehicle.vehicleName ?? 'Vehicle'}</p>
                        {booking.assignedVehicle.registrationNumber && (
                          <p className="text-white/60 text-sm font-mono mt-0.5">{booking.assignedVehicle.registrationNumber}</p>
                        )}
                      </div>
                    </div>
                    {(booking.assignedVehicle.color || booking.assignedVehicle.fuelType || booking.assignedVehicle.seatingCapacity) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.assignedVehicle.color && (
                          <span className="text-xs bg-white/8 text-white/60 rounded-full px-2.5 py-1">{booking.assignedVehicle.color}</span>
                        )}
                        {booking.assignedVehicle.fuelType && (
                          <span className="text-xs bg-white/8 text-white/60 rounded-full px-2.5 py-1">{booking.assignedVehicle.fuelType}</span>
                        )}
                        {booking.assignedVehicle.seatingCapacity && (
                          <span className="text-xs bg-white/8 text-white/60 rounded-full px-2.5 py-1">{booking.assignedVehicle.seatingCapacity} Seats</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Details */}
              {(() => {
                const { extras, freeText } = parseNotes(booking.notes);
                const extraEntries = Object.entries(extras);
                return (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-5">Trip Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Service */}
                      <div className="flex items-start gap-3 bg-white/3 rounded-2xl p-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Service</p>
                          <p className="text-white text-sm font-semibold mt-0.5">{SERVICE_LABELS[booking.serviceType] ?? booking.serviceType}</p>
                          {booking.vehicleType && <p className="text-white/60 text-xs mt-0.5">{booking.vehicleType}</p>}
                        </div>
                      </div>

                      {/* Dates */}
                      {(booking.pickupDate || booking.returnDate) && (
                        <div className="flex items-start gap-3 bg-white/3 rounded-2xl p-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Dates</p>
                            {booking.pickupDate && <p className="text-white text-sm font-semibold mt-0.5">{formatDate(booking.pickupDate)}</p>}
                            {booking.returnDate && <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1"><ArrowRight className="w-3 h-3" />{formatDate(booking.returnDate)}</p>}
                          </div>
                        </div>
                      )}

                      {/* Structured extras chips */}
                      {extraEntries.length > 0 && (
                        <div className="sm:col-span-2 flex flex-wrap gap-2">
                          {extraEntries.map(([key, val]) => {
                            const cfg = EXTRA_KEYS[key];
                            return (
                              <span key={key} className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/80">
                                <span>{cfg.icon}</span>
                                <span className="text-white/40 font-normal">{cfg.label}:</span>
                                {val}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Pickup / Drop */}
                      {booking.pickupLocation && (
                        <div className="flex items-start gap-3 bg-white/3 rounded-2xl p-3 sm:col-span-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Pickup Location</p>
                            <p className="text-white text-sm font-semibold mt-0.5">{booking.pickupLocation}</p>
                            {booking.dropLocation && (
                              <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> Drop: {booking.dropLocation}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Free-text customer note */}
                      {freeText && (
                        <div className="flex items-start gap-3 bg-white/3 rounded-2xl p-3 sm:col-span-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white/40 text-xs">Your Note</p>
                            <p className="text-white/70 text-sm mt-0.5 whitespace-pre-line">{freeText}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Mobile footer */}
              <p className="lg:hidden text-center text-white/20 text-xs pb-2">
                Powered by <a href="https://transrentals.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40">TransRentals</a>
              </p>
            </div>

          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Close
            </button>
            {/* Main image */}
            <img
              src={lightbox.imgs[lightbox.idx]}
              alt=""
              className="w-full max-h-[70vh] object-contain rounded-2xl"
            />
            {/* Nav arrows */}
            {lightbox.imgs.length > 1 && (
              <>
                <button
                  onClick={() => setLightbox(l => l && l.idx > 0 ? { ...l, idx: l.idx - 1 } : l)}
                  disabled={lightbox.idx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightbox(l => l && l.idx < l.imgs.length - 1 ? { ...l, idx: l.idx + 1 } : l)}
                  disabled={lightbox.idx === lightbox.imgs.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {/* Dot indicators */}
            {lightbox.imgs.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {lightbox.imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(l => l ? { ...l, idx: i } : l)}
                    className={`w-2 h-2 rounded-full transition ${i === lightbox.idx ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
