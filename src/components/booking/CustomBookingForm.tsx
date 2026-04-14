'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Car,
  Bike,
  Bus,
  Truck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  Building2,
  Heart,
  Cake,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Edit3,
} from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useBookingSubmission } from './useBookingSubmission';

// Types
interface ServiceItem {
  id: string;
  serviceType: 'bike' | 'car' | 'bus' | 'truck';
  subType: string;
  vehicleCount: number;
  peopleCount: number;
  pickupLocation: string;
  pickupLocationId: string;
  dropLocation: string;
  pickupTime: string;
  notes: string;
}

interface DayBooking {
  id: string;
  date: string;
  services: ServiceItem[];
}

interface FormData {
  occasionType: string;
  occasionName: string;
  totalDays: number;
  totalPeople: number;
  startDate: string;
  endDate: string;
  baseLocation: string;
  baseLocationId: string;
  days: DayBooking[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequirements: string;
}

// Service options
const SERVICE_TYPES = {
  bike: {
    label: 'Bike Rental',
    icon: Bike,
    color: 'bg-orange-500',
    subTypes: [
      { id: 'regular', name: 'Regular Bike', price: 499 },
      { id: 'activa', name: 'Activa / Scooter', price: 399 },
      { id: 'royal-enfield', name: 'Royal Enfield', price: 899 },
      { id: 'sports', name: 'Sports Bike', price: 1299 },
    ],
  },
  car: {
    label: 'Car Rental',
    icon: Car,
    color: 'bg-blue-500',
    subTypes: [
      { id: 'hatchback', name: 'Hatchback (5 seater)', price: 999, seats: 5 },
      { id: 'sedan', name: 'Sedan (5 seater)', price: 1499, seats: 5 },
      { id: 'suv', name: 'SUV (7 seater)', price: 2499, seats: 7 },
      { id: 'luxury', name: 'Luxury Car', price: 4999, seats: 5 },
      { id: 'muv', name: 'MUV / Innova (7 seater)', price: 2999, seats: 7 },
      { id: 'vintage', name: 'Vintage Car', price: 7999, seats: 4 },
    ],
  },
  bus: {
    label: 'Bus Rental',
    icon: Bus,
    color: 'bg-green-500',
    subTypes: [
      { id: 'tempo-12', name: 'Tempo Traveller (12 seater)', price: 3499, seats: 12 },
      { id: 'tempo-17', name: 'Tempo Traveller (17 seater)', price: 4499, seats: 17 },
      { id: 'tempo-26', name: 'Tempo Traveller (26 seater)', price: 5999, seats: 26 },
      { id: 'mini-bus', name: 'Mini Bus (35 seater)', price: 7999, seats: 35 },
      { id: 'luxury-bus', name: 'Luxury Bus (45 seater)', price: 12999, seats: 45 },
    ],
  },
  truck: {
    label: 'Truck / Logistics',
    icon: Truck,
    color: 'bg-purple-500',
    subTypes: [
      { id: 'pickup', name: 'Pickup Van', price: 1499 },
      { id: 'mini-truck', name: 'Mini Truck (Tata Ace)', price: 1999 },
      { id: 'canter', name: 'Canter', price: 3499 },
      { id: 'container', name: 'Container Truck', price: 7999 },
    ],
  },
};

const OCCASION_TYPES = [
  { id: 'wedding', name: 'Wedding', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50' },
  { id: 'corporate', name: 'Corporate Event', icon: Building2, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { id: 'birthday', name: 'Birthday Party', icon: Cake, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { id: 'party', name: 'Party / Get-together', icon: PartyPopper, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { id: 'tour', name: 'Group Tour', icon: MapPin, color: 'text-green-500', bgColor: 'bg-green-50' },
  { id: 'other', name: 'Other Event', icon: Sparkles, color: 'text-gray-500', bgColor: 'bg-gray-50' },
];

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getDaysBetween = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  while (startDate <= endDate) {
    dates.push(startDate.toISOString().split('T')[0]);
    startDate.setDate(startDate.getDate() + 1);
  }
  return dates;
};

const getServicePrice = (serviceType: string, subType: string): number => {
  const service = SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES];
  const sub = service?.subTypes.find(s => s.id === subType);
  return sub?.price || 0;
};

// Create empty service
const createEmptyService = (): ServiceItem => ({
  id: generateId(),
  serviceType: 'car',
  subType: 'sedan',
  vehicleCount: 1,
  peopleCount: 4,
  pickupLocation: '',
  pickupLocationId: '',
  dropLocation: '',
  pickupTime: '09:00',
  notes: '',
});

// Create empty day booking
const createDayBooking = (date: string): DayBooking => ({
  id: generateId(),
  date,
  services: [createEmptyService()],
});

export function CustomBookingForm() {
  const { submitBooking, isSubmitting, error: submitError } = useBookingSubmission('custom', 'CustomBookingForm');
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    occasionType: '',
    occasionName: '',
    totalDays: 1,
    totalPeople: 10,
    startDate: '',
    endDate: '',
    baseLocation: '',
    baseLocationId: '',
    days: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequirements: '',
  });

  // Initialize days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dates = getDaysBetween(formData.startDate, formData.endDate);
      const existingDays = formData.days;

      const newDays = dates.map(date => {
        const existing = existingDays.find(d => d.date === date);
        return existing || createDayBooking(date);
      });

      setFormData(prev => ({ ...prev, days: newDays, totalDays: dates.length }));
      if (newDays.length > 0 && expandedDays.length === 0) {
        setExpandedDays([newDays[0].id]);
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Calculate totals
  const calculateTotals = () => {
    let totalVehicles = 0;
    let totalServices = 0;
    let estimatedCost = 0;
    let totalPeopleCapacity = 0;

    formData.days.forEach(day => {
      day.services.forEach(service => {
        totalVehicles += service.vehicleCount;
        totalServices += 1;
        const pricePerVehicle = getServicePrice(service.serviceType, service.subType);
        estimatedCost += pricePerVehicle * service.vehicleCount;
        totalPeopleCapacity += service.peopleCount * service.vehicleCount;
      });
    });

    return { totalVehicles, totalServices, estimatedCost, totalPeopleCapacity };
  };

  // Handlers
  const toggleDay = (dayId: string) => {
    setExpandedDays(prev =>
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
    );
  };

  const addServiceToDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, services: [...day.services, createEmptyService()] }
          : day
      ),
    }));
  };

  const removeServiceFromDay = (dayId: string, serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, services: day.services.filter(s => s.id !== serviceId) }
          : day
      ),
    }));
  };

  const updateService = (dayId: string, serviceId: string, updates: Partial<ServiceItem>) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              services: day.services.map(s =>
                s.id === serviceId ? { ...s, ...updates } : s
              ),
            }
          : day
      ),
    }));
  };

  const copyDayServices = (fromDayId: string, toDayId: string) => {
    const fromDay = formData.days.find(d => d.id === fromDayId);
    if (!fromDay) return;

    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === toDayId
          ? { ...day, services: fromDay.services.map(s => ({ ...s, id: generateId() })) }
          : day
      ),
    }));
  };

  const handleSubmit = async () => {
    // Validate phone
    const phoneDigits = formData.customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      alert('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    const totals = calculateTotals();

    const bookingPayload = {
      bookingType: 'custom-bulk',
      customerInfo: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      },
      bookingData: {
        service_id: 99, // Custom booking service ID
        service_name: 'Custom Bulk Booking',
        occasion_type: formData.occasionType,
        occasion_name: formData.occasionName,
        total_days: formData.totalDays,
        total_people: formData.totalPeople,
        start_date: formData.startDate,
        end_date: formData.endDate,
        base_location: formData.baseLocation,
        base_location_id: formData.baseLocationId,
        total_vehicles: totals.totalVehicles,
        total_services: totals.totalServices,
        estimated_cost: totals.estimatedCost,
        special_requirements: formData.specialRequirements,
        days: formData.days.map(day => ({
          date: day.date,
          services: day.services.map(service => ({
            service_type: service.serviceType,
            sub_type: service.subType,
            vehicle_count: service.vehicleCount,
            people_count: service.peopleCount,
            pickup_location: service.pickupLocation,
            pickup_location_id: service.pickupLocationId,
            drop_location: service.dropLocation,
            pickup_time: service.pickupTime,
            notes: service.notes,
          })),
        })),
      },
    };

    await submitBooking(bookingPayload.customerInfo, bookingPayload.bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.occasionType && formData.startDate && formData.endDate && formData.baseLocationId;
    }
    if (currentStep === 2) {
      return formData.days.length > 0 && formData.days.every(day => day.services.length > 0);
    }
    if (currentStep === 3) {
      return formData.customerName && formData.customerEmail && formData.customerPhone;
    }
    return false;
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Event Details'}
                  {step === 2 && 'Day-wise Services'}
                  {step === 3 && 'Contact Info'}
                  {step === 4 && 'Review & Book'}
                </span>
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Event Details */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PartyPopper className="w-6 h-6 text-purple-500" />
                Event Details
              </h2>

              {/* Occasion Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What's the occasion? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {OCCASION_TYPES.map((occasion) => {
                    const Icon = occasion.icon;
                    return (
                      <button
                        key={occasion.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, occasionType: occasion.id }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.occasionType === occasion.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${occasion.color}`} />
                        <span className="text-sm font-medium">{occasion.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occasion Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.occasionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, occasionName: e.target.value }))}
                  placeholder="e.g., Sharma Wedding, Annual Sales Meet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Range */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: prev.endDate && prev.endDate < e.target.value ? e.target.value : prev.endDate
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Base Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Location / City *
                </label>
                <LocationAutocomplete
                  value={formData.baseLocation}
                  locationId={formData.baseLocationId}
                  onChange={(id, name) => setFormData(prev => ({
                    ...prev,
                    baseLocation: name,
                    baseLocationId: id
                  }))}
                  placeholder="Search city..."
                />
              </div>

              {/* Estimated People */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Total Guests/People
                </label>
                <input
                  type="number"
                  value={formData.totalPeople}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPeople: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Day-wise Services */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-4">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                Plan Your {formData.totalDays}-Day Event
              </h2>
              <p className="text-gray-600">
                Add vehicles and services for each day. You can have multiple services per day.
              </p>
            </div>

            {formData.days.map((day, dayIndex) => (
              <div key={day.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">D{dayIndex + 1}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">Day {dayIndex + 1}</h3>
                      <p className="text-sm text-gray-500">{formatDate(day.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {day.services.length} service{day.services.length !== 1 ? 's' : ''}
                    </span>
                    {expandedDays.includes(day.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Day Content */}
                <AnimatePresence>
                  {expandedDays.includes(day.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-6 space-y-4">
                        {/* Copy from previous day */}
                        {dayIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => copyDayServices(formData.days[dayIndex - 1].id, day.id)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
                          >
                            <Copy className="w-4 h-4" />
                            Copy services from Day {dayIndex}
                          </button>
                        )}

                        {/* Services */}
                        {day.services.map((service, serviceIndex) => (
                          <div key={service.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-700">
                                Service {serviceIndex + 1}
                              </h4>
                              {day.services.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeServiceFromDay(day.id, service.id)}
                                  className="text-red-500 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Service Type */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Service Type
                                </label>
                                <select
                                  value={service.serviceType}
                                  onChange={(e) => {
                                    const newType = e.target.value as keyof typeof SERVICE_TYPES;
                                    updateService(day.id, service.id, {
                                      serviceType: newType,
                                      subType: SERVICE_TYPES[newType].subTypes[0].id,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                                    <option key={key} value={key}>{value.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Sub Type */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Vehicle Type
                                </label>
                                <select
                                  value={service.subType}
                                  onChange={(e) => updateService(day.id, service.id, { subType: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  {SERVICE_TYPES[service.serviceType as keyof typeof SERVICE_TYPES].subTypes.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.name} - ₹{sub.price}/day
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Vehicle Count */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  No. of Vehicles
                                </label>
                                <input
                                  type="number"
                                  value={service.vehicleCount}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    vehicleCount: parseInt(e.target.value) || 1
                                  })}
                                  min="1"
                                  max="50"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* People Count */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  People per Vehicle
                                </label>
                                <input
                                  type="number"
                                  value={service.peopleCount}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    peopleCount: parseInt(e.target.value) || 1
                                  })}
                                  min="1"
                                  max="50"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                              {/* Pickup Location */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Pickup Location
                                </label>
                                <input
                                  type="text"
                                  value={service.pickupLocation}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    pickupLocation: e.target.value
                                  })}
                                  placeholder="Enter pickup point"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Drop Location */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Drop Location
                                </label>
                                <input
                                  type="text"
                                  value={service.dropLocation}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    dropLocation: e.target.value
                                  })}
                                  placeholder="Enter drop point"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Pickup Time */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Pickup Time
                                </label>
                                <input
                                  type="time"
                                  value={service.pickupTime}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    pickupTime: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-4">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Special Notes (optional)
                              </label>
                              <input
                                type="text"
                                value={service.notes}
                                onChange={(e) => updateService(day.id, service.id, { notes: e.target.value })}
                                placeholder="Any special requirements for this service..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Service Cost */}
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {service.vehicleCount} × ₹{getServicePrice(service.serviceType, service.subType)}/vehicle
                              </span>
                              <span className="font-semibold text-blue-600">
                                ₹{getServicePrice(service.serviceType, service.subType) * service.vehicleCount}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Add Service Button */}
                        <button
                          type="button"
                          onClick={() => addServiceToDay(day.id)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Another Service
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {/* Step 3: Contact Info */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-500" />
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setFormData(prev => ({ ...prev, customerPhone: val }));
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements (optional)
                  </label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any special requirements, decorations, preferences..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Book */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Review Your Booking
              </h2>

              {/* Event Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    OCCASION_TYPES.find(o => o.id === formData.occasionType)?.bgColor || 'bg-gray-100'
                  }`}>
                    {(() => {
                      const Icon = OCCASION_TYPES.find(o => o.id === formData.occasionType)?.icon || Sparkles;
                      return <Icon className={`w-6 h-6 ${
                        OCCASION_TYPES.find(o => o.id === formData.occasionType)?.color || 'text-gray-500'
                      }`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {formData.occasionName || OCCASION_TYPES.find(o => o.id === formData.occasionType)?.name}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(formData.startDate)} - {formatDate(formData.endDate)} ({formData.totalDays} days)
                    </p>
                    <p className="text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {formData.baseLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{formData.totalDays}</div>
                  <div className="text-sm text-gray-500">Days</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{totals.totalVehicles}</div>
                  <div className="text-sm text-gray-500">Vehicles</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{totals.totalServices}</div>
                  <div className="text-sm text-gray-500">Services</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">{totals.totalPeopleCapacity}</div>
                  <div className="text-sm text-gray-500">Capacity</div>
                </div>
              </div>

              {/* Day-wise Summary */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-700">Day-wise Breakdown</h4>
                {formData.days.map((day, idx) => (
                  <div key={day.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Day {idx + 1} - {formatDate(day.date)}</span>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(2); setExpandedDays([day.id]); }}
                        className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <div className="space-y-1">
                      {day.services.map((service, sIdx) => {
                        const serviceConfig = SERVICE_TYPES[service.serviceType as keyof typeof SERVICE_TYPES];
                        const subType = serviceConfig.subTypes.find(s => s.id === service.subType);
                        return (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {service.vehicleCount}x {subType?.name}
                              {service.pickupLocation && ` (${service.pickupLocation})`}
                            </span>
                            <span className="font-medium">
                              ₹{(subType?.price || 0) * service.vehicleCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Contact Details</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium">{formData.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{formData.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <span className="font-medium">{formData.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-100">Estimated Total</p>
                    <p className="text-3xl font-bold">₹{totals.estimatedCost.toLocaleString()}</p>
                    <p className="text-green-100 text-sm mt-1">* Final pricing may vary based on actual requirements</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">You'll receive</p>
                    <p className="font-semibold">Detailed quotation</p>
                    <p className="text-green-100 text-sm">within 2 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{submitError}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Summary Bar */}
      {currentStep === 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totals.totalVehicles}</div>
                <div className="text-xs text-gray-500">Vehicles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.totalServices}</div>
                <div className="text-xs text-gray-500">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{totals.estimatedCost.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Est. Total</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceed()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 2 && (
        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Booking Request
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spacer for floating bar */}
      {currentStep === 2 && <div className="h-24" />}
    </div>
  );
}
