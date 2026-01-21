'use client';

import React from 'react';
import { MapPin, Star, Shield, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { TruckRentalBookingForm } from '@/components/booking/TruckRentalBookingForm';

export function TruckRentalServiceHero() {
  return (
    <section className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <motion.div className="absolute top-0 left-0 w-96 h-96 bg-gray-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <div className="container-custom relative py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-900/10 text-gray-900 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Truck className="w-4 h-4" /><span>Reliable Transport Solutions</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Truck Rental & Transport<br />
            <span className="bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              For All Your Cargo Needs
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            14 types of trucks available. Personal & Commercial transport. Safe & reliable delivery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            {[
              { icon: Star, text: 'Verified Drivers', color: 'text-amber-500' },
              { icon: Shield, text: 'Insured Transport', color: 'text-blue-600' },
              { icon: Truck, text: 'On-Time Delivery', color: 'text-green-600' },
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
        <TruckRentalBookingForm />
      </div>
    </section>
  );
}
