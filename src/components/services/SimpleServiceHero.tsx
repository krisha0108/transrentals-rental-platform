'use client';

import React from 'react';
import { MapPin, Star, Shield, Zap, Clock, Users, Truck, Package } from 'lucide-react';
import { motion } from 'framer-motion';

import { formatPriceHighlight } from '@/lib/utils';

// Icon mapping
const iconMap = {
  star: Star,
  shield: Shield,
  zap: Zap,
  clock: Clock,
  users: Users,
  truck: Truck,
  package: Package,
  'map-pin': MapPin,
};

type FeatureIcon = 'star' | 'shield' | 'zap' | 'clock' | 'users' | 'truck' | 'package' | 'map-pin';

interface SimpleServiceHeroProps {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  features?: { icon: FeatureIcon; text: string; color: string }[];
  stats?: { value: string; label: string }[];
  gradientFrom?: string;
  gradientTo?: string;
  gradientAccent?: string;
  citiesCount?: string;
}

export function SimpleServiceHero({
  badge,
  title,
  titleHighlight,
  description,
  features = [
    { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
    { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
    { icon: 'zap', text: 'Quick Booking', color: 'text-green-600' },
  ],
  stats,
  gradientFrom = 'blue-50',
  gradientTo = 'green-50',
  gradientAccent = 'from-primary to-green-600',
  citiesCount,
}: SimpleServiceHeroProps) {
  return (
    <section className={`relative bg-gradient-to-br from-${gradientFrom} via-white to-${gradientTo} overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container-custom relative py-12 md:py-16">
        {/* Header Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>{formatPriceHighlight(citiesCount ? `Available in ${citiesCount} Cities` : badge)}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {title}
            <br />
            <span className={`bg-gradient-to-r ${gradientAccent} bg-clip-text text-transparent`}>
              {formatPriceHighlight(titleHighlight)}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {description}
          </p>

          {/* Quick Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            {features.map((feature) => {
              const IconComponent = iconMap[feature.icon] || Star;
              return (
                <div key={feature.text} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md ${feature.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center p-4 bg-white rounded-xl shadow-lg"
                >
                  <div className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${gradientAccent} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SimpleServiceHero;
