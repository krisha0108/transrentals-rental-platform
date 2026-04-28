'use client';

import { motion } from 'framer-motion';
import { Mountain, Star, Shield, Phone, ArrowRight, Clock, Users, MapPin, Bike } from 'lucide-react';

interface BikeTourHeroProps {
  badge: string;
  title: string;
  price: string;
  description: string;
  gradient: string;
  accentColor: string;
  stats: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[];
  features: { text: string }[];
  ctaPhone?: string;
  ctaLabel?: string;
}

export function BikeTourHero({
  badge,
  title,
  price,
  description,
  gradient,
  accentColor,
  stats,
  features,
  ctaPhone = '918000000000',
  ctaLabel = 'Call to Book',
}: BikeTourHeroProps) {
  return (
    <section className={`relative bg-gradient-to-br ${gradient} text-white overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mountain" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 60 L30 10 L60 40 L90 5 L120 60 Z" fill="white" fillOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mountain)" />
        </svg>
      </div>

      <div className="relative container-custom py-14 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — Title & CTA */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5"
            >
              <Bike className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide">{badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4"
            >
              {title}
            </motion.h1>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-5 py-2 mb-5 text-xl font-bold`}
            >
              {price}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/85 text-lg leading-relaxed mb-8 max-w-lg"
            >
              {description}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href={`https://wa.me/${ctaPhone}?text=Hi, I'm interested in the ${title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Phone className="w-5 h-5" />
                {ctaLabel}
              </a>
              <a
                href="#itinerary"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition"
              >
                View Itinerary
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>

          {/* Right — Stats & Trust */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex flex-col gap-2"
                >
                  <s.icon className="w-6 h-6 text-white/70" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Features / Trust Badges */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">What's Included</p>
              <div className="grid grid-cols-2 gap-2">
                {features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
