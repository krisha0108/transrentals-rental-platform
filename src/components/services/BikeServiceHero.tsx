'use client';

import React, { useState } from 'react';
import { MapPin, Star, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { BikeBookingForm } from '@/components/booking/BikeBookingForm';

export function BikeServiceHero() {
  const [showForm, setShowForm] = useState(true);

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>Available in 500+ Cities Across India</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Rent a Bike for Your
            <br />
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Next Adventure
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose from 500+ bikes including Royal Enfield, KTM, Honda, Yamaha and more.
            Get instant quotes from verified vendors. Starting at just <span className="font-bold text-primary">₹399/day</span>
          </p>

          {/* Quick Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
            {[
              { icon: Star, text: '4.8/5 Rating', color: 'text-amber-500' },
              { icon: Shield, text: 'Verified Vendors', color: 'text-blue-600' },
              { icon: Zap, text: 'Instant Quotes', color: 'text-green-600' },
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

        {/* Booking Form */}
        <BikeBookingForm />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">500+</div>
            <div className="text-sm text-gray-600 mt-1">Bikes Available</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">500+</div>
            <div className="text-sm text-gray-600 mt-1">Cities Covered</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center p-6 bg-white rounded-xl shadow-lg"
          >
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">40K+</div>
            <div className="text-sm text-gray-600 mt-1">Happy Customers</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
