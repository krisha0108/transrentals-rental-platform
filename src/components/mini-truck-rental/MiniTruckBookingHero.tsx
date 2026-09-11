'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Truck,
  Navigation,
  UserCheck,
  ShieldCheck,
  Tag,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { TruckBookingWidget } from '@/components/services/ServiceHeroWithChat';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';

interface MiniTruckBookingHeroProps {
  city: string;
  citySlug: string;
  pageHeading?: string;
  pageDescription?: string;
  heroImage?: string;
}

const HERO_FEATURES = [
  { icon: Truck, text: '750kg–1 Ton Load', sub: 'Tata Ace & Pickup' },
  { icon: Navigation, text: 'GPS Tracked', sub: 'Live Updates' },
  { icon: UserCheck, text: 'Verified Vendors', sub: '& Drivers' },
  { icon: Tag, text: 'Hourly Booking', sub: 'Best Price' },
];

const HERO_STATS = [
  { icon: Users, value: '500+', label: 'Verified\nVendors' },
  { icon: CheckCircle2, value: '50K+', label: 'Happy\nCustomers' },
  { icon: Truck, value: '1000+', label: 'Trucks\nAvailable' },
  { icon: Clock, value: '24/7', label: 'Customer\nSupport' },
];

const FOOTER_STATS = [
  { icon: Tag, text: 'Best Price', sub: 'Guaranteed' },
  { icon: ShieldCheck, text: '500+ Verified', sub: 'Vendors' },
  { icon: Clock, text: '15 Min', sub: 'Callback' },
  { icon: UserCheck, text: '24/7', sub: 'Support' },
];

export function MiniTruckBookingHero({
  city,
  citySlug,
  pageHeading,
  pageDescription,
  heroImage = '/images/sections/transporter-hero-bg.png',
}: MiniTruckBookingHeroProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <section className="relative bg-slate-50 text-slate-900 overflow-hidden">
      <div className="absolute inset-0">
        <Image src={heroImage} alt="" fill priority className="object-cover object-[center_75%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/58 via-white/22 to-transparent" />
      </div>

      <div className="relative container-custom py-6 lg:py-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-20 items-start">
          {/* LEFT — Marketing content */}
          <div className="lg:pr-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2 mb-5 shadow-sm"
            >
              <Truck className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Mini Truck Rental in {city}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 leading-tight"
            >
              {pageHeading || (
                <>
                  Move Your Load in {city}
                  <br />
                  With <span className="text-green-600">Tata Ace &amp; More</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-slate-500 mb-5 max-w-md"
            >
              {pageDescription || `Affordable Tata Ace, Bolero Pickup and mini truck rental in ${city}. Ideal for house shifting, shop delivery, and local goods transport. Driver included.`}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg"
            >
              {HERO_STATS.map((stat) => (
                <div key={stat.value} className="flex flex-col items-start gap-1.5">
                  <stat.icon className="w-5 h-5 text-green-600" />
                  <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 leading-snug whitespace-pre-line">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Booking card (real quote form + AI assistant) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full lg:ml-auto lg:max-w-md flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-5 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-base">Book Your Mini Truck</div>
                  <div className="text-green-100 text-xs">Free quote &bull; No advance payment</div>
                </div>
              </div>
              {showChat ? (
                <button onClick={() => setShowChat(false)}
                  className="text-[11.5px] font-bold text-green-700 bg-white rounded-full px-3 py-1.5 hover:bg-green-50 transition-colors whitespace-nowrap">
                  ← New chat
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-white rounded-full px-2.5 py-1 whitespace-nowrap">
                  <Shield className="w-3.5 h-3.5" />
                  100% Secure
                </span>
              )}
            </div>

            {/* Body */}
            <div className="px-5 pt-3 pb-3">
              {showChat
                ? <DynamicChatBookingHero hideHeader serviceType="mini-truck-rental" />
                : <TruckBookingWidget cityName={city} serviceType="mini-truck-rental" />}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {FOOTER_STATS.map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="text-[11px] leading-tight text-slate-600">
                      <div className="font-semibold text-slate-900">{item.text}</div>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowChat(s => !s)}
                className="w-full flex items-center justify-center gap-1.5 text-[13px] font-bold text-green-700 hover:text-green-600 transition-colors whitespace-nowrap pt-1">
                {showChat ? '← Back to form' : <>Book with AI Assistant <ChevronRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
