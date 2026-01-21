'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, ArrowRight, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { useServices } from './useServices';

// Bike types from Trans_main
const BIKE_TYPES = [
  { id: 'sport', name: 'Sport Bike', icon: '🏍️', description: 'High performance' },
  { id: 'scooter', name: 'Scooter', icon: '🛵', description: 'Easy & convenient' },
  { id: 'cruiser', name: 'Cruiser', icon: '🏍️', description: 'Comfortable rides' },
  { id: 'street', name: 'Street/Naked', icon: '🏍️', description: 'Urban riding' },
  { id: 'adventure', name: 'Adventure Tourer', icon: '🏍️', description: 'Long distance' },
  { id: 'dirt', name: 'Dirt Bike', icon: '🏍️', description: 'Off-road ready' },
];

const RENTAL_DURATIONS = [
  { id: 'hourly', name: 'Hourly', icon: '⏱️' },
  { id: 'daily', name: 'Daily', icon: '📅' },
  { id: 'weekly', name: 'Weekly', icon: '📆' },
  { id: 'monthly', name: 'Monthly', icon: '🗓️' },
];

export function BikeBookingForm() {
  const { customer, isAuthenticated } = useCustomerAuth();
  const { services } = useServices();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocationId: '',
    pickupLocation: '',
    destinationId: '',
    destination: '',
    bikeType: '',
    duration: '',
    startDate: '',
    startTime: '',
    returnDate: '',
    returnTime: '',
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });

  const totalSteps = 3;
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission('bike');

  // Pre-fill user data if logged in
  useEffect(() => {
    if (isAuthenticated && customer) {
      setFormData(prev => ({
        ...prev,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
      }));
    }
  }, [isAuthenticated, customer]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum return date (same as or after start date)
  const getMinReturnDate = () => {
    return formData.startDate || getTodayDate();
  };

  // Map bike type to numeric values expected by database
  // 1 = Sport, 2 = Scooter, 3 = Cruiser, 4 = Street, 5 = Adventure, 6 = Dirt
  const getBikeTypeNumber = (bikeType: string) => {
    const bikeTypeMap: Record<string, string> = {
      'sport': '1',
      'scooter': '2',
      'cruiser': '3',
      'street': '4',
      'adventure': '5',
      'dirt': '6',
    };
    return bikeTypeMap[bikeType] || '1'; // Default to sport
  };

  // Map duration to numeric values expected by database
  // 1 = Hourly, 2 = Daily, 3 = Weekly, 4 = Monthly
  const getDurationNumber = (duration: string) => {
    const durationMap: Record<string, string> = {
      'hourly': '1',
      'daily': '2',
      'weekly': '3',
      'monthly': '4',
    };
    return durationMap[duration] || '2'; // Default to daily
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Find service ID dynamically from database based on service name
    const serviceName = "Bike Rental";

    // Debug: Log all available services
    console.log('Available services:', services);

    // Try multiple matching strategies for bike service
    const service = services.find(s => {
      const name = s.name.toLowerCase();
      return (
        name.includes('bike') ||
        name.includes('rental') && name.includes('bike') ||
        name === 'bike rental' ||
        name === 'bike on rent' ||
        name.includes('two wheeler')
      );
    });

    console.log('Matched bike service:', service);
    const serviceId = service?.id || 2; // Fallback to 2 if not found
    console.log('Using service_id:', serviceId);

    // Prepare customer info
    const customerInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    // Prepare booking data matching backend API structure (like customer app)
    const bookingData = {
      customer_id: customer?.id || 0, // Use logged-in customer ID or 0 for guest
      service_id: serviceId, // Dynamic service ID from database
      service_name: serviceName,
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      destination: formData.destination,
      journey_datetime: `${formData.startDate}T${formData.startTime}:00`,
      return_datetime: formData.returnDate && formData.returnTime ? `${formData.returnDate}T${formData.returnTime}:00` : undefined,
      bike_type: getBikeTypeNumber(formData.bikeType), // Convert to numeric value
      bike_duration: getDurationNumber(formData.duration), // Convert to numeric value
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const handlePickupLocationChange = (locationId: string, locationName: string) => {
    setFormData(prev => ({
      ...prev,
      pickupLocationId: locationId,
      pickupLocation: locationName,
    }));
  };

  const handleDestinationChange = (locationId: string, locationName: string) => {
    setFormData(prev => ({
      ...prev,
      destinationId: locationId,
      destination: locationName,
    }));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      // Destination text is required (not destination ID - users can type custom location)
      return formData.pickupLocationId && formData.destination.trim();
    }
    if (currentStep === 2) {
      return formData.bikeType && formData.duration && formData.startDate && formData.startTime;
    }
    return formData.name && formData.email && formData.phone;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8 relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
        <div className={`absolute top-5 left-0 h-1 bg-primary transition-all -z-10`}
             style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>

        {/* Steps */}
        <div className="flex items-start justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center" style={{ width: '33.33%' }}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              <span className={`text-sm mt-2 text-center ${currentStep >= step ? 'text-primary font-medium' : 'text-gray-500'}`}>
                {step === 1 ? 'Location' : step === 2 ? 'Bike & Duration' : 'Contact Info'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Step 1: Location */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Where do you need the bike?</h3>
              <p className="text-gray-600">Tell us your pickup and drop-off locations</p>
            </div>

            <div className="space-y-4">
              <LocationAutocomplete
                value={formData.pickupLocation}
                locationId={formData.pickupLocationId}
                onChange={handlePickupLocationChange}
                label="Pick-up Location"
                placeholder="Type to search location..."
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Destination
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => updateFormData('destination', e.target.value)}
                  placeholder="Enter your destination (e.g., Manali, Goa, etc.)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You can type any location</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Bike Type & Duration */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose your bike</h3>
              <p className="text-gray-600">Select bike type and rental duration</p>
            </div>

            {/* Bike Types */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Bike Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BIKE_TYPES.map((bike) => (
                  <button
                    key={bike.id}
                    type="button"
                    onClick={() => updateFormData('bikeType', bike.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.bikeType === bike.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{bike.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{bike.name}</div>
                    <div className="text-xs text-gray-500">{bike.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rental Duration */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Rental Duration *</label>
              <div className="grid grid-cols-4 gap-3">
                {RENTAL_DURATIONS.map((duration) => (
                  <button
                    key={duration.id}
                    type="button"
                    onClick={() => updateFormData('duration', duration.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.duration === duration.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{duration.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{duration.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateFormData('startTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Return Date
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => updateFormData('returnDate', e.target.value)}
                  min={getMinReturnDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Must be same or after start date</p>
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Return Time
                </label>
                <input
                  type="time"
                  value={formData.returnTime}
                  onChange={(e) => updateFormData('returnTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
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
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h3>
              <p className="text-gray-600">
                {isAuthenticated ? (
                  <>
                    Welcome back, <span className="font-semibold text-primary">{customer?.name}</span>! 👋
                  </>
                ) : (
                  'We need your contact details to send you quotes'
                )}
              </p>
              {isAuthenticated && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                  <Check className="w-4 h-4" />
                  <span>Logged in - Details auto-filled</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none transition-colors ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none transition-colors ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none transition-colors ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`}
                  required
                />
              </div>

              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Additional Details (Optional)
                </label>
                <textarea
                  value={formData.additionalDetails}
                  onChange={(e) => updateFormData('additionalDetails', e.target.value)}
                  placeholder="Any special requirements or questions?"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}

          <div className="ml-auto">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="min-w-[120px]"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canProceed() || isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Booking Request
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
