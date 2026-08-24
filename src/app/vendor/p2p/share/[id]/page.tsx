'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  IndianRupee,
  Truck,
  Package,
  Users,
  Star,
  ArrowRight,
} from 'lucide-react';

interface Vendor {
  id: string;
  businessName: string;
  city: string | null;
  logo: string | null;
  phone: string;
  rating: number | null;
  totalRatings: number;
}

interface ShareResponse {
  type: 'vehicle' | 'booking';
  posting: any;
}

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const fmtPrice = (v?: number | null) =>
  v != null && v > 0 ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

export default function P2PSharePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<ShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/p2p/share/${id}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          const j = await res.json().catch(() => ({}));
          setError(j.error || 'This posting is unavailable.');
        }
      } catch {
        setError('Could not load this posting.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Posting Unavailable</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { type, posting } = data;
  const vendor: Vendor = posting.vendor;
  const isVehicle = type === 'vehicle';
  const isActive = posting.status === 'ACTIVE';

  const phoneDigits = (vendor.phone || '').replace(/\D/g, '');
  const waNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  const dateValue = isVehicle ? posting.departureDate : posting.tripDate;
  const timeValue = isVehicle ? posting.departureTime : posting.tripTime;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              {vendor.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo} alt={vendor.businessName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {isVehicle ? <Truck className="w-6 h-6 text-white" /> : <Package className="w-6 h-6 text-white" />}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs text-emerald-100 font-medium">Shared by</p>
                <p className="font-bold truncate">{vendor.businessName}</p>
                <div className="flex items-center gap-2 text-xs text-emerald-100 mt-0.5">
                  {vendor.city && <span>{vendor.city}</span>}
                  {vendor.rating != null && vendor.totalRatings > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {vendor.rating.toFixed(1)} ({vendor.totalRatings})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">
                {isVehicle ? 'Vehicle Available' : 'Booking Available'}
              </span>
              {posting.postingNumber && (
                <span className="font-mono text-xs bg-white/20 px-2 py-1 rounded-full">#{posting.postingNumber}</span>
              )}
            </div>
          </div>

          {/* Inactive banner */}
          {!isActive && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              This posting is no longer active.
            </div>
          )}

          {/* Title */}
          <div className="px-6 pt-5">
            <h1 className="text-2xl font-bold text-gray-900">
              {isVehicle ? posting.vehicleName : posting.serviceType}
              {isVehicle && posting.vehicleNumber ? ` (${posting.vehicleNumber})` : ''}
            </h1>
            {!isVehicle && posting.vehicleRequired && (
              <p className="text-gray-600 mt-0.5">{posting.vehicleRequired}</p>
            )}
          </div>

          {/* Route */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 text-gray-900">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{posting.fromCity}</span>
              {posting.toCity && (
                <>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{posting.toCity}</span>
                </>
              )}
            </div>
          </div>

          {/* Key details grid */}
          <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {dateValue && (
              <Detail icon={<Calendar className="w-4 h-4" />} label={isVehicle ? 'Departure' : 'Trip Date'} value={fmtDate(dateValue)} />
            )}
            {timeValue && <Detail icon={<Clock className="w-4 h-4" />} label="Time" value={timeValue} />}

            {isVehicle ? (
              <>
                {posting.capacity && <Detail icon={<Truck className="w-4 h-4" />} label="Capacity" value={posting.capacity} />}
                {posting.priceFullLoad != null && (
                  <Detail icon={<IndianRupee className="w-4 h-4" />} label="Full Load" value={fmtPrice(posting.priceFullLoad)} />
                )}
                {posting.acceptsPartLoad && posting.pricePartLoad != null && (
                  <Detail icon={<IndianRupee className="w-4 h-4" />} label="Part Load" value={fmtPrice(posting.pricePartLoad)} />
                )}
                {posting.totalSeats != null && (
                  <Detail icon={<Users className="w-4 h-4" />} label="Seats" value={`${posting.availableSeats ?? posting.totalSeats}/${posting.totalSeats}`} />
                )}
              </>
            ) : (
              <>
                {posting.passengers != null && (
                  <Detail icon={<Users className="w-4 h-4" />} label="Passengers" value={String(posting.passengers)} />
                )}
                {(posting.partnerEarning != null || posting.customerBudget != null) && (
                  <Detail
                    icon={<IndianRupee className="w-4 h-4" />}
                    label={posting.partnerEarning != null ? 'Earn' : 'Budget'}
                    value={fmtPrice(posting.partnerEarning ?? posting.customerBudget)}
                  />
                )}
                {posting.estimatedWeight && (
                  <Detail icon={<Package className="w-4 h-4" />} label="Weight" value={posting.estimatedWeight} />
                )}
              </>
            )}
          </div>

          {/* Notes */}
          {posting.notes && (
            <div className="px-6 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{posting.notes}</p>
            </div>
          )}

          {/* Contact actions */}
          <div className="px-6 py-5 bg-emerald-50/50 border-t border-emerald-100 flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${vendor.phone}`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                  `Hi, I'm interested in your P2P posting #${posting.postingNumber} (${posting.fromCity}${posting.toCity ? ` → ${posting.toCity}` : ''}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold py-3 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Powered by <span className="font-semibold text-emerald-700">TransRentals</span> Partner Network
        </p>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-gray-500 uppercase font-semibold tracking-wide">
        <span className="text-emerald-600">{icon}</span>
        {label}
      </p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
