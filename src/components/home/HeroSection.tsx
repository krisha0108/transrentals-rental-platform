'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Star, Users, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useServices } from '@/components/booking/useServices';

// Vehicle categories with database matching
const VEHICLE_CATEGORIES_BASE = [
  {
    id: 'bike',
    name: 'Bike Rental',
    dbNames: ['Bike Rental', 'Bike on Rent', 'Two Wheeler'], // Database name variations
    icon: '🏍️',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    description: 'Two-wheelers for every need',
    serviceUrl: '/bike-on-rent',
    popular: true,
  },
  {
    id: 'car',
    name: 'Car Rental',
    dbNames: ['Car Rental', 'Cab Rental', 'Round Trip Car', 'Round Trip'], // Database name variations
    icon: '🚗',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    description: 'Comfortable rides for trips',
    serviceUrl: '/car-rental',
    popular: true,
  },
  {
    id: 'bus',
    name: 'Bus Rental',
    dbNames: ['Bus Rental', 'Bus', 'Coach Rental'], // Database name variations
    icon: '🚌',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    description: 'Group travel solutions',
    serviceUrl: '/bus-rental',
  },
  {
    id: 'truck',
    name: 'Truck Rental',
    dbNames: ['Truck Rental', 'Truck', 'Transporter', 'Goods Transport'], // Database name variations
    icon: '🚚',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
    description: 'Heavy-duty transport',
    serviceUrl: '/transporter',
  },
  {
    id: 'equipment',
    name: 'Equipment Rental',
    dbNames: ['Equipment Rental', 'Equipment', 'Machinery Rental'], // Database name variations
    icon: '🏗️',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
    description: 'Construction equipment',
    serviceUrl: '/equipment-rental',
  },
];

const LIVE_STATS = [
  { value: '2.5K+', label: 'Inquiries Today', icon: '📋' },
  { value: '500+', label: 'Active Vendors', icon: '🏪' },
  { value: '150+', label: 'Cities', icon: '📍' },
];

export function HeroSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { services } = useServices();

  // Match frontend categories with database services to get service_id
  const VEHICLE_CATEGORIES = useMemo(() => {
    const categories = VEHICLE_CATEGORIES_BASE.map(category => {
      // Find matching service from database
      const dbService = services.find(service => {
        const serviceName = service.name.toLowerCase();
        return category.dbNames.some(dbName =>
          serviceName.includes(dbName.toLowerCase()) ||
          dbName.toLowerCase().includes(serviceName)
        );
      });

      const result = {
        ...category,
        serviceId: dbService?.id || null, // Add database service ID
      };

      // Debug logging
      if (dbService) {
        console.log(`✅ Matched "${category.name}" with DB service "${dbService.name}" (ID: ${dbService.id})`);
      } else {
        console.warn(`⚠️ No DB match found for "${category.name}"`, { searchedNames: category.dbNames });
      }

      return result;
    });

    return categories;
  }, [services]);

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container-custom relative py-16">
        {/* Stats */}
        <div className="flex justify-center gap-6 mb-8">
          {LIVE_STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <span className="text-xl">{stat.icon}</span>
              <div>
                <div className="text-sm font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">India's #1 Vehicle Rental Marketplace</span>
          </div>

          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Get Best Quotes for
            <br />
            <span className="text-primary">Any Vehicle, Instantly</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Compare quotes from 500+ verified vendors across 150+ cities
          </p>

          <div className="flex justify-center flex-wrap gap-4">
            {[
              { icon: CheckCircle2, text: 'Free Quotes', color: 'text-emerald-600' },
              { icon: Star, text: '4.8/5 Rating', color: 'text-amber-500' },
              { icon: Users, text: '50K+ Happy Customers', color: 'text-blue-600' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md", badge.color)}>
                  <badge.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Select Your Vehicle Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {VEHICLE_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(category.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => window.location.href = category.serviceUrl}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 p-6",
                  category.borderColor,
                  hoveredCard === category.id ? "shadow-2xl scale-105 -translate-y-2" : "shadow-lg"
                )}
              >
                {category.popular && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                )}
                <div className={cn("absolute inset-0 opacity-40", category.bgColor)} />
                <div className="relative text-center space-y-4">
                  <motion.div
                    animate={{ scale: hoveredCard === category.id ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-6xl"
                  >
                    {category.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <Button className={cn("w-full bg-gradient-to-r text-white font-semibold", category.color)}>
                    Get Quotes
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
