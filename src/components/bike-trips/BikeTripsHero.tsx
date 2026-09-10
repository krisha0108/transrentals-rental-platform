'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bike, Mountain, MapPin, Star, ShieldCheck, ArrowRight, Check } from 'lucide-react';

const STATS = [
  { icon: Bike, value: '50+', label: 'Bikes Available' },
  { icon: MapPin, value: '15+', label: 'Pickup Cities' },
  { icon: Star, value: '4.8/5', label: 'Rider Rating' },
  { icon: ShieldCheck, value: 'Included', label: 'Insurance' },
];

const FEATURES = [
  'Royal Enfield', 'One-Way Drops', 'Full Insurance', 'Riding Gear', 'Tool Kit', 'Permit Help',
];

export function BikeTripsHero() {
  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white overflow-hidden">
      {/* Layered mountain silhouette motif */}
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 w-full text-emerald-950/40"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path d="M0 200 L0 120 L150 40 L300 110 L420 20 L600 100 L750 30 L900 110 L1050 50 L1200 120 L1200 200 Z" fill="currentColor" />
      </svg>
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 w-full text-black/25"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
      >
        <path d="M0 160 L0 90 L200 30 L380 100 L560 10 L760 90 L960 40 L1200 100 L1200 160 Z" fill="currentColor" />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(680px 420px at 12% 0%, rgba(16,185,129,.25), transparent 65%)' }}
      />

      <div className="relative container-custom py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* LEFT — Title & CTA */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5"
            >
              <Mountain className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-semibold tracking-wide">Adventure Awaits</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-4"
            >
              Bike Trip Rentals
              <br />
              <span className="text-emerald-300">Across India</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-lg leading-relaxed mb-7 max-w-lg"
            >
              Rent bikes for epic road trips. Ladakh, Spiti, Rajasthan, Goa — Royal Enfield, one-way drops, and full gear, all sorted.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-x-5 gap-y-2 mb-8"
            >
              {FEATURES.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-[13.5px] text-white/85">
                  <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  {f}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <a
                href="#trips"
                className="inline-flex items-center gap-2 bg-white text-emerald-800 font-bold px-7 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                View Trip Destinations
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>

          {/* RIGHT — Stats */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex flex-col gap-2"
              >
                <s.icon className="w-6 h-6 text-emerald-300" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-white/70">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
