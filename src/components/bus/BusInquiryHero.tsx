'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Users,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  User,
  Navigation,
  Building,
  Heart,
  Briefcase,
  GraduationCap,
  Map,
  Star,
  Shield,
  CheckCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { BUS_CATEGORIES, BUS_TRIP_TYPES, getBusCategory } from '@/lib/bus-categories';

interface BusInquiryHeroProps {
  location?: string;
  locationSlug?: string;
}

const TRIP_TYPE_ICONS: Record<string, any> = {
  local: MapPin,
  outstation: Navigation,
  pilgrimage: Building,
  'tour-package': Map,
  corporate: Briefcase,
  wedding: Heart,
  school: GraduationCap,
};

export function BusInquiryHero({ location = 'India', locationSlug }: BusInquiryHeroProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [tripType, setTripType] = useState('outstation');
  const [vehicleCategory, setVehicleCategory] = useState('');
  const [passengers, setPassengers] = useState('');
  const [pickupCity, setPickupCity] = useState(location === 'India' ? '' : location);
  const [dropCity, setDropCity] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('06:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('18:00');
  const [routeDetails, setRouteDetails] = useState('');
  const [requirements, setRequirements] = useState('');
  const [needAC, setNeedAC] = useState(true);
  const [needLuxury, setNeedLuxury] = useState(false);

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Travel Agent flow
  const [isTravelAgent, setIsTravelAgent] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [taBookingMode, setTaBookingMode] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');

  // Auto-detect logged-in customer + travel-agent link from localStorage,
  // and verify against the profile API (handles stale localStorage).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedCustomer = localStorage.getItem('customer');
    if (!storedCustomer) return;
    try {
      const customer = JSON.parse(storedCustomer);
      if (customer.name) setCustomerName(customer.name);
      if (customer.email) setCustomerEmail(customer.email);
      // Strip TA shadow placeholder phone — auto-healed below.
      if (customer.phone && !String(customer.phone).startsWith('ta-')) {
        setCustomerPhone(customer.phone);
      }
      if (customer.linkedTravelAgentId) {
        setIsTravelAgent(true);
        setAgentName(customer.name || '');
      }
      if (customer.id) {
        fetch(`/api/customer/profile?customer_id=${customer.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.customers?.linkedTravelAgentId) {
              setIsTravelAgent(true);
              setAgentName(d.customers.name || customer.name || '');
              const agentPhone = d?.customers?.linkedAgentPhone || null;
              if (agentPhone) {
                setCustomerPhone(prev => prev || agentPhone);
              }
              try {
                const merged: any = {
                  ...customer,
                  linkedTravelAgentId: d.customers.linkedTravelAgentId,
                };
                if (agentPhone && (typeof customer.phone !== 'string' || customer.phone.startsWith('ta-'))) {
                  merged.phone = agentPhone;
                }
                localStorage.setItem('customer', JSON.stringify(merged));
              } catch { /* ignore */ }
            }
          })
          .catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  // UI State
  const [step, setStep] = useState(1); // 1: Trip Details, 2: Vehicle & Contact

  const selectedCategory = getBusCategory(vehicleCategory);
  const minDate = new Date().toISOString().split('T')[0];

  const calculateDuration = () => {
    if (!pickupDate || !returnDate) return null;
    const start = new Date(`${pickupDate}T${pickupTime || '00:00'}`);
    const end = new Date(`${returnDate}T${returnTime || '00:00'}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`);
    return { label: parts.join(' '), totalHours, days };
  };

  const duration = calculateDuration();

  // Filter categories based on passenger count
  const getFilteredCategories = () => {
    const count = parseInt(passengers) || 0;
    if (count === 0) return BUS_CATEGORIES;
    return BUS_CATEGORIES.filter(
      (c) => count >= c.seatingCapacity.min - 2 && count <= c.seatingCapacity.max + 5
    );
  };

  const handleSubmit = async () => {
    if (!vehicleCategory || !passengers || !customerName || !customerPhone || !pickupDate) {
      alert('Please fill in all required fields');
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      alert('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: any = {
        tripType,
        vehicle_category: vehicleCategory,
        vehicleCategoryName: selectedCategory?.name || vehicleCategory,
        passengers: parseInt(passengers),
        pickupCity,
        dropCity: dropCity || undefined,
        pickupDate,
        pickupTime,
        returnDate: returnDate || undefined,
        returnTime: returnDate ? returnTime : undefined,
        tripDays: duration ? Math.max(1, duration.days + (duration.totalHours % 24 > 0 ? 1 : 0)) : 1,
        routeDetails: routeDetails || undefined,
        requirements: requirements || undefined,
        needAC,
        needLuxury,
        customerName,
        customerPhone,
        customerEmail,
        locationSlug,
      };

      // Travel-agent: route into b2b_bookings via taBookingMode
      if (isTravelAgent) {
        requestData.taBookingMode = taBookingMode;
        requestData.numberOfVehicles =
          taBookingMode === 'COMPANY' ? parseInt(numberOfVehicles) || 1 : 1;
      }

      const response = await fetch('/api/bus-quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccess(true);
        // TA flow returns redirect_to (manager queue tracking page); regular
        // flow uses customer/bus-quotes path
        const target = result.redirect_to
          ? result.redirect_to
          : `/customer/bus-quotes/${result.request?.id}`;
        setTimeout(() => {
          router.push(target);
        }, 2000);
      } else {
        alert(result.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-orange-900 via-red-900 to-orange-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative Bus Icon */}
      <div className="absolute top-10 right-10 opacity-10">
        <Bus className="w-48 h-48" />
      </div>

      <div className="container-custom py-12 md:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Content */}
          <div className="lg:pr-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm text-orange-200 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-orange-500/30"
            >
              <MapPin className="w-4 h-4" />
              {location}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              <span className="text-white">Bus & Tempo Traveller</span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Rental in {location}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-orange-100 mb-8 max-w-xl"
            >
              Get quotes from verified bus & tempo traveller operators. Compare prices and book the best deal for your group travel.
            </motion.p>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm">Verified Operators</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm">Best Price Guarantee</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm">12-52 Seater Options</span>
              </div>
            </motion.div>

            {/* Vehicle Categories Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:block"
            >
              <p className="text-orange-200 text-sm mb-3">Popular Vehicle Types:</p>
              <div className="flex flex-wrap gap-2">
                {BUS_CATEGORIES.filter((c) => c.popular).map((cat) => (
                  <div
                    key={cat.id}
                    className="px-3 py-1.5 bg-white/10 rounded-lg text-sm"
                  >
                    {cat.shortName}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right - Inquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-50 flex items-center justify-center"
                >
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                    <p className="text-gray-600 mb-4">
                      Vendors will send you quotes shortly. Redirecting...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Send className="w-5 h-5" />
                Get Free Quotes
              </h2>
              <p className="text-orange-100 text-sm">Compare prices from multiple operators</p>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  step === 1 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-xs">1</span>
                Trip Details
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => step === 2 && setStep(2)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  step === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-xs">2</span>
                Vehicle & Contact
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Trip Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BUS_TRIP_TYPES.slice(0, 6).map((type) => {
                          const Icon = TRIP_TYPE_ICONS[type.id] || MapPin;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setTripType(type.id)}
                              className={`p-3 rounded-xl border-2 text-left transition ${
                                tripType === type.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <Icon className={`w-5 h-5 mb-1 ${tripType === type.id ? 'text-orange-600' : 'text-gray-400'}`} />
                              <div className="font-medium text-sm text-gray-900">{type.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Route */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From City *</label>
                        <input
                          type="text"
                          value={pickupCity}
                          onChange={(e) => setPickupCity(e.target.value)}
                          placeholder="Pickup city"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To City</label>
                        <input
                          type="text"
                          value={dropCity}
                          onChange={(e) => setDropCity(e.target.value)}
                          placeholder="Destination city"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          min={minDate}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={pickupDate || minDate}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Duration Display */}
                    {duration && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-sm text-orange-800 font-medium">Duration: {duration.label}</span>
                      </div>
                    )}

                    {/* Route Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Route Details / Stops (Optional)
                      </label>
                      <textarea
                        value={routeDetails}
                        onChange={(e) => setRouteDetails(e.target.value)}
                        placeholder="E.g., Delhi → Jaipur → Udaipur → Jodhpur → Delhi"
                        rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!pickupCity || !pickupDate}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Passengers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Passengers *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={passengers}
                          onChange={(e) => setPassengers(e.target.value)}
                          placeholder="E.g., 20"
                          min="1"
                          max="60"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Vehicle Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Type *
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                        {getFilteredCategories().map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setVehicleCategory(cat.id)}
                            className={`p-3 rounded-xl border-2 text-left transition flex items-center gap-3 ${
                              vehicleCategory === cat.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <Bus className={`w-8 h-8 ${vehicleCategory === cat.id ? 'text-orange-600' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">{cat.name}</div>
                              <div className="text-xs text-gray-500">
                                {cat.seatingCapacity.min}-{cat.seatingCapacity.max} seats • {cat.features.slice(0, 2).join(', ')}
                              </div>
                            </div>
                            {vehicleCategory === cat.id && (
                              <CheckCircle className="w-5 h-5 text-orange-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={needAC}
                          onChange={(e) => setNeedAC(e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">AC Required</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={needLuxury}
                          onChange={(e) => setNeedLuxury(e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Luxury Vehicle</span>
                      </label>
                    </div>

                    {/* Special Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requirements (Optional)
                      </label>
                      <textarea
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Any specific requirements..."
                        rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>

                    {/* ── Travel Agent mode (only when linked) ── */}
                    {isTravelAgent && (
                      <div className="border-t pt-4">
                        <div className="bg-gradient-to-br from-indigo-50 via-emerald-50 to-teal-50 border border-indigo-200 rounded-lg p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <p className="text-sm font-bold text-indigo-900">
                              Travel Agent — {agentName || 'request to manager (no advance)'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setTaBookingMode('PERSONAL')}
                              className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition ${
                                taBookingMode === 'PERSONAL'
                                  ? 'bg-white border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                                  : 'bg-white/60 border-gray-200 text-gray-600 hover:border-indigo-300'
                              }`}
                            >
                              👤 Personal
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaBookingMode('COMPANY')}
                              className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition ${
                                taBookingMode === 'COMPANY'
                                  ? 'bg-white border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                                  : 'bg-white/60 border-gray-200 text-gray-600 hover:border-indigo-300'
                              }`}
                            >
                              🏢 Company
                            </button>
                          </div>
                          {taBookingMode === 'COMPANY' && (
                            <div>
                              <label className="block text-xs font-semibold text-indigo-900 mb-1">
                                # of Vehicles *
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={numberOfVehicles}
                                onChange={(e) => setNumberOfVehicles(e.target.value)}
                                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 bg-white text-gray-900"
                                required
                              />
                              <p className="text-[10px] text-indigo-700 mt-1">
                                Manager will quote, monthly invoiced. No advance.
                              </p>
                            </div>
                          )}
                          {taBookingMode === 'PERSONAL' && (
                            <p className="text-[11px] text-indigo-700">
                              Personal booking — single vehicle, manager review, quote sent. No advance.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Your Contact Details</p>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-3">
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Your Name *"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 10) setCustomerPhone(val);
                            }}
                            placeholder="Phone *"
                            maxLength={10}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !vehicleCategory || !passengers || !customerName || !customerPhone}
                        className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            Submitting...
                          </>
                        ) : isTravelAgent ? (
                          <>
                            <Send className="w-5 h-5" />
                            Submit Request to Manager
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Get Free Quotes
                          </>
                        )}
                      </button>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-gray-500 text-center">
                      You&apos;ll receive quotes from verified operators within minutes
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
