'use client';

import React from 'react';
import { MapPin, Star, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';

interface ServiceHeroWithChatProps {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  serviceType?: string;
  features?: { icon: 'star' | 'shield' | 'zap'; text: string; color: string }[];
  gradientFrom?: string;
  gradientTo?: string;
}

export function ServiceHeroWithChat({
  badge,
  title,
  titleHighlight,
  description,
  serviceType,
  features = [
    { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
    { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
    { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
  ],
  gradientFrom = 'purple-50',
  gradientTo = 'blue-50',
}: ServiceHeroWithChatProps) {
  return (
    <section id="booking" className={`relative bg-gradient-to-br from-${gradientFrom} via-white to-${gradientTo} overflow-hidden`}>
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="container-custom relative py-12 md:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>{badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {title}<br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <DynamicChatBookingHero hideHeader serviceType={serviceType} />

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          {features.map((feature) => {
            const IconComponent = feature.icon === 'star' ? Star : feature.icon === 'shield' ? Shield : Zap;
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
      </div>
    </section>
  );
}
