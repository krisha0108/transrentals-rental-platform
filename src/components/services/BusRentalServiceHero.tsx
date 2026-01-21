'use client';

import React from 'react';
import { MapPin, Star, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { BusRentalBookingForm } from '@/components/booking/BusRentalBookingForm';

export function BusRentalServiceHero() {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-white to-yellow-50 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <motion.div className="absolute top-0 left-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <div className="container-custom relative py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-600/10 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Users className="w-4 h-4" /><span>Group Travel Solutions</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Bus Rental Services<br />
            <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              For Groups & Events
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Outstation trips and Local tours. Comfortable buses for 20-50 passengers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            {[
              { icon: Star, text: 'Comfortable Seats', color: 'text-amber-500' },
              { icon: Shield, text: 'Safe Travel', color: 'text-orange-600' },
              { icon: Users, text: 'Group Discounts', color: 'text-green-600' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <BusRentalBookingForm />
      </div>
    </section>
  );
}
