'use client';

import Image from 'next/image';
import {
  Bus,
  Clock,
  UserCheck,
  ShieldCheck,
  Tag,
  Users,
  CheckCircle2,
  Star,
  MapPin,
} from 'lucide-react';
import { BookingCard } from '@/components/services/ServiceHeroWithChat';

const HERO_FEATURES = [
  { icon: Clock, text: '4/8/12-Hour', sub: 'Packages' },
  { icon: UserCheck, text: 'Verified Operators', sub: 'Across India' },
  { icon: ShieldCheck, text: 'No Outstation', sub: 'Allowance' },
  { icon: Tag, text: 'Best Price', sub: 'Guaranteed' },
];

const HERO_STATS = [
  { icon: Users, value: '5,000+', label: 'Trips\nCompleted' },
  { icon: CheckCircle2, value: '500+', label: 'Verified\nOperators' },
  { icon: Star, value: '4.7★', label: 'Average\nRating' },
  { icon: MapPin, value: '50+', label: 'Cities\nServed' },
];

export function LocalBusRentalHero() {
  return (
    <section className="relative bg-slate-50 text-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/sections/bus-rental-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="relative container-custom pt-8 pb-8 lg:pt-20 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-20 items-start">
          {/* LEFT — Marketing content */}
          <div className="min-w-0 lg:pr-4">
            <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2 mb-5 shadow-sm">
              <Bus className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Hourly &amp; Half-Day Bus Hire</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">
              Local Bus Rental
              <br />
              <span className="text-green-600">Starting ₹2,999 for 4 Hours</span>
            </h1>

            <p className="text-sm text-slate-500 mb-5 max-w-md">
              Hire a bus or tempo traveller by the hour for local sightseeing, school trips, weddings, and same-city events. Driver included, no outstation charges.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {HERO_FEATURES.map((item) => (
                <div key={item.text} className="flex flex-col items-start gap-2">
                  <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-slate-600 leading-snug">
                    <div className="font-semibold text-slate-900">{item.text}</div>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col items-start gap-1.5">
                  <stat.icon className="w-5 h-5 text-green-600" />
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 leading-snug whitespace-pre-line">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Real working booking wizard (same widget used site-wide) */}
          <div className="lg:-mt-8">
            <BookingCard cityName="" serviceType="bus-rental" variant="bus" />
          </div>
        </div>
      </div>
    </section>
  );
}
