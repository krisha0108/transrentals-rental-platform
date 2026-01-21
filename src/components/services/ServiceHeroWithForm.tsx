'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Star, Shield, Zap, Clock, Users, Truck, Package } from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamically import forms to avoid loading all at once
const BikeBookingForm = dynamic(() => import('@/components/booking/BikeBookingForm').then(m => ({ default: m.BikeBookingForm })), { ssr: false });
const SelfDriveBookingForm = dynamic(() => import('@/components/booking/SelfDriveBookingForm').then(m => ({ default: m.SelfDriveBookingForm })), { ssr: false });
const CarRentalBookingForm = dynamic(() => import('@/components/booking/CarRentalBookingForm').then(m => ({ default: m.CarRentalBookingForm })), { ssr: false });
const LuxuryCarBookingForm = dynamic(() => import('@/components/booking/LuxuryCarBookingForm').then(m => ({ default: m.LuxuryCarBookingForm })), { ssr: false });
const BusRentalBookingForm = dynamic(() => import('@/components/booking/BusRentalBookingForm').then(m => ({ default: m.BusRentalBookingForm })), { ssr: false });
const TruckRentalBookingForm = dynamic(() => import('@/components/booking/TruckRentalBookingForm').then(m => ({ default: m.TruckRentalBookingForm })), { ssr: false });
const PackersMoversBookingForm = dynamic(() => import('@/components/booking/PackersMoversBookingForm').then(m => ({ default: m.PackersMoversBookingForm })), { ssr: false });
const EquipmentRentalBookingForm = dynamic(() => import('@/components/booking/EquipmentRentalBookingForm').then(m => ({ default: m.EquipmentRentalBookingForm })), { ssr: false });

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

// Service configurations for hero display
const SERVICE_HERO_CONFIGS: Record<string, {
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  citiesCount: string;
  gradient: { from: string; to: string; accent: string };
  stats: { value: string; label: string }[];
  features: { icon: keyof typeof iconMap; text: string; color: string }[];
}> = {
  'bike-on-rent': {
    badge: 'Bike Rental Services',
    title: 'Rent a Bike for Your',
    titleHighlight: 'Next Adventure',
    description: 'Choose from 500+ bikes including Royal Enfield, KTM, Honda, Yamaha and more. Get instant quotes from verified vendors.',
    citiesCount: '150+',
    gradient: { from: 'blue-50', to: 'green-50', accent: 'from-primary to-green-600' },
    stats: [
      { value: '500+', label: 'Bikes Available' },
      { value: '150+', label: 'Cities Covered' },
      { value: '50K+', label: 'Happy Customers' },
    ],
    features: [
      { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Verified Vendors', color: 'text-blue-600' },
      { icon: 'zap', text: 'Instant Quotes', color: 'text-green-600' },
    ],
  },
  'self-drive-car-rentals': {
    badge: 'Self Drive Car Rental',
    title: 'Drive Your Own',
    titleHighlight: 'Adventure Awaits',
    description: 'Rent self-drive cars across India. No driver needed. Complete freedom and privacy. Hatchbacks, sedans, SUVs available.',
    citiesCount: '250+',
    gradient: { from: 'blue-50', to: 'cyan-50', accent: 'from-blue-600 to-cyan-600' },
    stats: [
      { value: '800+', label: 'Cars Available' },
      { value: '250+', label: 'Cities Covered' },
      { value: '75K+', label: 'Happy Customers' },
    ],
    features: [
      { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Well Maintained', color: 'text-blue-600' },
      { icon: 'zap', text: 'Instant Booking', color: 'text-green-600' },
    ],
  },
  'car-rental': {
    badge: 'Car Rental with Driver',
    title: 'Book Your Car Rental',
    titleHighlight: 'Starting @₹999/Day',
    description: 'Choose from Airport Taxi, Round Trip, or One-Way rentals. Get instant quotes from verified vendors across 250+ cities.',
    citiesCount: '250+',
    gradient: { from: 'blue-50', to: 'indigo-50', accent: 'from-blue-600 to-indigo-600' },
    stats: [
      { value: '1000+', label: 'Cars Available' },
      { value: '250+', label: 'Cities Covered' },
      { value: '100K+', label: 'Happy Customers' },
    ],
    features: [
      { icon: 'star', text: '4.8/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Verified Drivers', color: 'text-blue-600' },
      { icon: 'zap', text: 'Instant Quotes', color: 'text-green-600' },
    ],
  },
  'luxury-car-rental': {
    badge: 'Premium Collection',
    title: 'Luxury & Exotic',
    titleHighlight: 'Car Rental',
    description: 'Experience the extraordinary. BMW, Mercedes, Ferrari, Lamborghini, Rolls-Royce. Make every moment unforgettable.',
    citiesCount: '50+',
    gradient: { from: 'purple-50', to: 'amber-50', accent: 'from-purple-600 to-amber-500' },
    stats: [
      { value: '100+', label: 'Luxury Cars' },
      { value: '50+', label: 'Cities Covered' },
      { value: '10K+', label: 'Premium Rides' },
    ],
    features: [
      { icon: 'star', text: '4.9/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Fully Insured', color: 'text-green-600' },
      { icon: 'zap', text: '20+ Exotic Cars', color: 'text-purple-600' },
    ],
  },
  'bus-rental': {
    badge: 'Bus & Tempo Traveller',
    title: 'Bus Rental',
    titleHighlight: 'For Every Occasion',
    description: 'Hire buses and tempo travellers for pilgrimages, weddings, corporate events. Get multiple quotes from verified operators.',
    citiesCount: '100+',
    gradient: { from: 'orange-50', to: 'red-50', accent: 'from-orange-500 to-red-500' },
    stats: [
      { value: '5000+', label: 'Trips Completed' },
      { value: '500+', label: 'Verified Operators' },
      { value: '50+', label: 'Cities Served' },
    ],
    features: [
      { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Verified Operators', color: 'text-blue-600' },
      { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
    ],
  },
  'transporter': {
    badge: 'Truck Rental & Transport',
    title: 'Transporter Services',
    titleHighlight: 'Starting @₹3999/Day',
    description: 'Professional truck rental and transport services. 7-ton to 32-ton trucks available. GPS tracking, verified drivers.',
    citiesCount: '200+',
    gradient: { from: 'slate-50', to: 'blue-50', accent: 'from-slate-600 to-blue-600' },
    stats: [
      { value: '2000+', label: 'Trucks Available' },
      { value: '200+', label: 'Cities Covered' },
      { value: '50K+', label: 'Shipments Done' },
    ],
    features: [
      { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Verified Transporters', color: 'text-blue-600' },
      { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
    ],
  },
  'packers-and-movers': {
    badge: 'Packers & Movers',
    title: 'Professional Relocation',
    titleHighlight: 'Starting @₹4999',
    description: 'Home shifting, office relocation, vehicle transport. Insured and reliable packers & movers across India.',
    citiesCount: '150+',
    gradient: { from: 'emerald-50', to: 'teal-50', accent: 'from-emerald-600 to-teal-600' },
    stats: [
      { value: '25K+', label: 'Moves Completed' },
      { value: '150+', label: 'Cities Covered' },
      { value: '98%', label: 'Satisfaction Rate' },
    ],
    features: [
      { icon: 'star', text: '4.7/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'Insured Moving', color: 'text-blue-600' },
      { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
    ],
  },
  'equipment-rental': {
    badge: 'Equipment Rental',
    title: 'Construction Equipment',
    titleHighlight: 'Starting @₹1499/Day',
    description: 'Rent JCB, cranes, excavators, generators, and more. Professional operators available. Get quotes now!',
    citiesCount: '100+',
    gradient: { from: 'yellow-50', to: 'orange-50', accent: 'from-yellow-600 to-orange-600' },
    stats: [
      { value: '500+', label: 'Equipment Units' },
      { value: '100+', label: 'Cities Covered' },
      { value: '10K+', label: 'Projects Done' },
    ],
    features: [
      { icon: 'star', text: '4.6/5 Rating', color: 'text-amber-500' },
      { icon: 'shield', text: 'With Operators', color: 'text-blue-600' },
      { icon: 'zap', text: 'Multiple Quotes', color: 'text-green-600' },
    ],
  },
};

// Map service type to form component
const getFormComponent = (serviceType: string) => {
  switch (serviceType) {
    case 'bike-on-rent':
      return BikeBookingForm;
    case 'self-drive-car-rentals':
      return SelfDriveBookingForm;
    case 'car-rental':
      return CarRentalBookingForm;
    case 'luxury-car-rental':
      return LuxuryCarBookingForm;
    case 'bus-rental':
      return BusRentalBookingForm;
    case 'transporter':
      return TruckRentalBookingForm;
    case 'packers-and-movers':
      return PackersMoversBookingForm;
    case 'equipment-rental':
      return EquipmentRentalBookingForm;
    default:
      return null;
  }
};

// Icon type for features - common icons used across all services
type FeatureIcon = 'star' | 'shield' | 'zap';

interface ServiceHeroWithFormProps {
  serviceType: string;
  // Optional overrides
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  features?: { icon: FeatureIcon; text: string; color: string }[];
  stats?: { value: string; label: string }[];
}

export function ServiceHeroWithForm({
  serviceType,
  badge: badgeOverride,
  title: titleOverride,
  titleHighlight: titleHighlightOverride,
  description: descriptionOverride,
  features: featuresOverride,
  stats: statsOverride,
}: ServiceHeroWithFormProps) {
  const config = SERVICE_HERO_CONFIGS[serviceType] || SERVICE_HERO_CONFIGS['car-rental'];

  const badge = badgeOverride || config.badge;
  const title = titleOverride || config.title;
  const titleHighlight = titleHighlightOverride || config.titleHighlight;
  const description = descriptionOverride || config.description;
  const features = featuresOverride || config.features;
  const stats = statsOverride || config.stats;
  const gradient = config.gradient;
  const citiesCount = config.citiesCount;

  const FormComponent = getFormComponent(serviceType);

  return (
    <section className={`relative bg-gradient-to-br from-${gradient.from} via-white to-${gradient.to} overflow-hidden`}>
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
            <span>Available in {citiesCount} Cities Across India</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {title}
            <br />
            <span className={`bg-gradient-to-r ${gradient.accent} bg-clip-text text-transparent`}>
              {titleHighlight}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {description}
          </p>

          {/* Quick Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
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
        </div>

        {/* Booking Form */}
        {FormComponent && <FormComponent />}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="text-center p-6 bg-white rounded-xl shadow-lg"
            >
              <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${gradient.accent} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServiceHeroWithForm;
