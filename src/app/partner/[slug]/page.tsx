'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2, AlertCircle, Building2, MapPin, Phone, Globe, Star, Car, Users,
  Fuel, CheckCircle2, ShieldCheck, MessageSquare, Share2, Award, Briefcase, Calendar,
  Lock, Headphones, BadgeCheck,
} from 'lucide-react';
import TransRentalsTopBar from '@/components/profile/TransRentalsTopBar';
import ImageSlider from '@/components/profile/ImageSlider';

interface Vendor {
  id: string; slug: string; businessName: string; businessType: string | null;
  ownerName: string; logo: string | null; description: string | null; website: string | null;
  phone: string; email: string; city: string | null; state: string | null; address: string | null;
  status: string; isVerified: boolean; rating: number | null; totalRatings: number;
  memberSince: string; memberSinceMonths: number;
}
interface Fleet {
  id: string; vehicleName: string | null; brand: string | null; serviceType: string | null;
  color: string | null; fuelType: string | null; transmission: string | null;
  seatingCapacity: number | null; luggageCapacity: number | null; yearOfManufacture: number | null;
  chauffeurIncluded: boolean; baseLocation: string | null; rating: number | null; images: string[];
}
interface Stats { fleetCount: number; servicesCount: number; completedTrips: number }

export default function PartnerProfilePage() {
  const slug = useParams()?.slug as string | undefined;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [fleet, setFleet] = useState<Fleet[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/partner/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Not found');
        return d;
      })
      .then((d) => { setVendor(d.vendor); setFleet(d.fleet); setServices(d.services); setStats(d.stats); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: vendor?.businessName, url }); return; } catch {} }
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>;
  }
  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-800">Profile not available</h1>
          <p className="text-gray-500 mt-1">This rental partner page may have been removed.</p>
        </div>
      </div>
    );
  }

  const waNumber = vendor.phone.replace(/\D/g, '').replace(/^0+/, '');
  const waLink = `https://wa.me/${waNumber.length === 10 ? '91' + waNumber : waNumber}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-gray-50 to-gray-50">
      {/* TransRentals trust bar */}
      <TransRentalsTopBar label="Verified Rental Partner" />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 text-white">
        {/* decorative glow */}
        <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 w-52 h-52 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-20">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center overflow-hidden shrink-0 border border-white/20 shadow-xl shadow-emerald-950/20">
              {vendor.logo ? <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-white/70" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{vendor.businessName}</h1>
                {vendor.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-white/15 text-emerald-50 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/25">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-emerald-100/80 mt-1.5">{vendor.businessType || 'Rental Partner'} · {vendor.ownerName}</p>
              <div className="flex items-center gap-x-4 gap-y-2 mt-3.5 text-sm text-emerald-50/90 flex-wrap">
                {(vendor.city || vendor.state) && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-300" /> {[vendor.city, vendor.state].filter(Boolean).join(', ')}</span>
                )}
                {vendor.rating != null && vendor.totalRatings > 0 && (
                  <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-300 text-amber-300" /> {vendor.rating.toFixed(1)} ({vendor.totalRatings})</span>
                )}
                <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-300" /> {vendor.memberSinceMonths}+ months on TransRentals</span>
              </div>
            </div>
            <button onClick={share} className="hidden sm:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl text-sm font-medium border border-white/20 transition-colors">
              <Share2 className="w-4 h-4" /> {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-emerald-900/5 border border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { icon: Car, label: 'Vehicles', value: stats?.fleetCount ?? 0 },
            { icon: Briefcase, label: 'Services', value: stats?.servicesCount ?? 0 },
            { icon: Award, label: 'Trips done', value: stats?.completedTrips ?? 0 },
          ].map((s, i) => (
            <div key={i} className="p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <s.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TransRentals trust strip */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-3">Why book through TransRentals</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BadgeCheck, title: 'Verified partner', desc: 'Onboarded & documents checked by TransRentals' },
              { icon: Lock, title: 'Secure & private', desc: 'Your contact details stay protected' },
              { icon: Headphones, title: 'TransRentals support', desc: 'We step in if anything goes wrong' },
              { icon: ShieldCheck, title: 'Trusted network', desc: "Part of India's rental marketplace" },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* About + contact */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">About</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{vendor.description || `${vendor.businessName} is a trusted rental partner on TransRentals.`}</p>
            {services.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {services.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {s}
                  </span>
                ))}
              </div>
            )}
            {vendor.address && (
              <p className="mt-4 text-sm text-gray-500 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" /> {vendor.address}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">Get in touch</h2>
            </div>
            <a href={`tel:${vendor.phone}`} className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors shadow-sm shadow-emerald-600/20">
              <Phone className="w-4 h-4" /> Call now
            </a>
            <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1fae57] text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold transition-colors">
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
          </div>
        </div>

        {/* Fleet */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900">Vehicles <span className="text-gray-400 font-medium">({fleet.length})</span></h2>
          </div>
          {fleet.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">No vehicles listed yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fleet.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <ImageSlider images={f.images} alt={f.vehicleName || 'Vehicle'} heightClass="h-44" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{f.vehicleName || f.serviceType || 'Vehicle'}</h3>
                      {f.rating != null && <span className="inline-flex items-center gap-0.5 text-xs text-gray-600 shrink-0"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {f.rating.toFixed(1)}</span>}
                    </div>
                    {f.vehicleName && f.serviceType && <p className="text-xs font-medium text-emerald-600 mt-0.5">{f.serviceType}</p>}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
                      {f.seatingCapacity != null && <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {f.seatingCapacity}</span>}
                      {f.fuelType && <span className="inline-flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> {f.fuelType}</span>}
                      {f.chauffeurIncluded && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Driver incl.</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-6 text-center bg-white/60">
        <a href="/" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">Powered by <span className="font-semibold text-emerald-700">TransRentals</span></a>
      </div>
    </div>
  );
}
