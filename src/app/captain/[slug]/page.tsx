'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, MapPin, Star, Car, Award, Calendar, ShieldCheck,
  Share2, BadgeCheck, Building2, IdCard, Briefcase,
} from 'lucide-react';
import TransRentalsTopBar from '@/components/profile/TransRentalsTopBar';

interface Driver {
  id: string; slug: string; type: 'employed' | 'independent'; name: string;
  profilePhoto: string | null; city: string | null; state: string | null;
  bio: string | null; yearsExperience: number | null; licenseType: string | null;
  memberSince: string; rating: number | null; totalRatings: number;
  vendor: { id: string; businessName: string; slug: string | null; logo: string | null; city: string | null } | null;
}
interface Vehicle { make: string; model: string; registrationNo: string | null; coverImage: string | null }
interface Stats { completedTrips: number }

export default function CaptainProfilePage() {
  const slug = useParams()?.slug as string | undefined;
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/captain/${slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Not found');
        return d;
      })
      .then((d) => { setDriver(d.driver); setVehicle(d.vehicle); setStats(d.stats); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: driver?.name, url }); return; } catch {} }
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>;
  }
  if (error || !driver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-800">Profile not available</h1>
          <p className="text-gray-500 mt-1">This driver page may have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TransRentals trust bar */}
      <TransRentalsTopBar label="Verified Driver" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-16 text-center">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur border-4 border-white/30 overflow-hidden mx-auto flex items-center justify-center">
              {driver.profilePhoto ? <img src={driver.profilePhoto} alt={driver.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-white/80">{driver.name.charAt(0)}</span>}
            </div>
            <span className="absolute bottom-1 right-1 bg-white rounded-full p-1"><BadgeCheck className="w-5 h-5 text-emerald-600" /></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-4">{driver.name}</h1>
          <p className="text-white/80 mt-1">Professional Driver{driver.type === 'employed' ? '' : ' · Independent'}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-white/90 flex-wrap">
            {(driver.city || driver.state) && (
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {[driver.city, driver.state].filter(Boolean).join(', ')}</span>
            )}
            {driver.rating != null && driver.totalRatings > 0 && (
              <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-300 text-yellow-300" /> {driver.rating.toFixed(1)} ({driver.totalRatings})</span>
            )}
          </div>
          <button onClick={share} className="mt-4 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-sm border border-white/20">
            <Share2 className="w-4 h-4" /> {copied ? 'Link copied!' : 'Share profile'}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="max-w-3xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { icon: Award, label: 'Trips done', value: stats?.completedTrips ?? 0 },
            { icon: Briefcase, label: 'Experience', value: driver.yearsExperience != null ? `${driver.yearsExperience} yr` : '—' },
            { icon: IdCard, label: 'License', value: driver.licenseType || '—' },
          ].map((s, i) => (
            <div key={i} className="p-4 text-center">
              <s.icon className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {driver.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{driver.bio}</p>
          </div>
        )}

        {/* Vendor / company */}
        {driver.vendor && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Drives with</h2>
            <Link
              href={driver.vendor.slug ? `/partner/${driver.vendor.slug}` : `/partner/${driver.vendor.id}`}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 -m-2 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {driver.vendor.logo ? <img src={driver.vendor.logo} alt={driver.vendor.businessName} className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{driver.vendor.businessName}</p>
                {driver.vendor.city && <p className="text-xs text-gray-500">{driver.vendor.city}</p>}
              </div>
              <span className="text-xs text-emerald-600 font-medium">View →</span>
            </Link>
          </div>
        )}

        {/* Vehicle */}
        {vehicle && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              {vehicle.coverImage ? <img src={vehicle.coverImage} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" /> : <Car className="w-12 h-12 text-gray-300" />}
            </div>
            <div className="p-5">
              <h2 className="font-semibold text-gray-900">{[vehicle.make, vehicle.model].filter(Boolean).join(' ')}</h2>
              {vehicle.registrationNo && <p className="text-sm text-gray-500 mt-0.5">{vehicle.registrationNo}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" /> On TransRentals since {new Date(driver.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="border-t border-gray-100 py-6 text-center">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">Powered by <span className="font-semibold text-gray-600">TransRentals</span></a>
      </div>
    </div>
  );
}
