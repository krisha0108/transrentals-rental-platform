'use client';

import React, { useState, useEffect } from 'react';

// TypeScript declaration for debug flag
declare global {
  interface Window {
    servicesLogged?: boolean;
  }
}
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, ArrowRight, Check, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { useServices } from './useServices';

const TRIP_TYPES = [
  { id: 'airport', name: 'Airport Taxi', icon: '✈️', description: 'Airport pickup/drop' },
  { id: 'roundtrip', name: 'Round Trip', icon: '🔄', description: 'Return journey' },
  { id: 'oneway', name: 'One-Way', icon: '➡️', description: 'Single direction' },
];

const AIRPORT_TYPES = [
  { id: 'drop', name: 'Drop to Airport', icon: '🛫' },
  { id: 'pickup', name: 'Pick up from Airport', icon: '🛬' },
];

const VEHICLE_TYPES = [
  { id: 'hatchback', name: 'Hatchback', icon: '🚗', description: '4 seaters' },
  { id: 'sedan', name: 'Sedan', icon: '🚙', description: '4-5 seaters' },
  { id: 'muv', name: 'MUV', icon: '🚐', description: '6-7 seaters' },
  { id: 'suv', name: 'SUV', icon: '🚙', description: '6-7 seaters' },
  { id: 'luxury', name: 'Luxury', icon: '💎', description: 'Premium cars' },
];

export function CarRentalBookingForm() {
  const { customer, isAuthenticated } = useCustomerAuth();
  const { services } = useServices();
  const [currentStep, setCurrentStep] = useState(1);
  const [isB2B, setIsB2B] = useState(false);
  const [formData, setFormData] = useState({
    tripType: '',
    airportType: '',
    pickupLocationId: '',
    pickupLocation: '',
    destinationId: '',
    destination: '',
    vehicleType: '',
    startDate: '',
    startTime: '',
    returnDate: '',
    returnTime: '',
    passengers: '',
    numberOfVehicles: '',
    numberOfEmployees: '',
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });

  // Pre-fill user data if logged in & check B2B status
  useEffect(() => {
    if (isAuthenticated && customer) {
      setFormData(prev => ({
        ...prev,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
      }));
      // Check if customer is B2B approved
      const custId = customer.id;
      const custEmail = customer.email;
      const params = new URLSearchParams();
      if (custId) params.set('customer_id', String(custId));
      if (custEmail) params.set('email', custEmail);
      if (params.toString()) {
        fetch(`/api/customer/b2b-status?${params.toString()}`)
          .then(res => res.json())
          .then(data => {
            console.log('[B2B Check]', data);
            if (data.isB2B) setIsB2B(true);
          })
          .catch(err => console.error('[B2B Check Error]', err));
      }
    }
  }, [isAuthenticated, customer]);

  // Determine booking type and service_id based on trip type
  const getBookingTypeAndServiceId = () => {
    // Find service ID dynamically from database
    let serviceName = '';
    let bookingType = '';

    if (formData.tripType === 'roundtrip') {
      serviceName = 'Round Trip Car';
      bookingType = 'car-roundtrip';
    } else if (formData.tripType === 'oneway') {
      serviceName = 'One-Way Car';
      bookingType = 'car-oneway';
    } else if (formData.tripType === 'airport') {
      serviceName = 'Airport Taxi';
      bookingType = 'car-airport';
    } else {
      serviceName = 'Round Trip Car';
      bookingType = 'car-roundtrip';
    }

    // Debug: Log available services (only once when services are loaded)
    if (services.length > 0 && !window.servicesLogged) {
      console.log('Available services:', services);
      window.servicesLogged = true;
    }

    // Find matching service from database with flexible matching
    const service = services.find(s => {
      const name = s.name.toLowerCase();
      const target = serviceName.toLowerCase();
      return (
        name.includes(target) ||
        name === target ||
        (serviceName.includes('Round Trip') && (name.includes('round') || name.includes('roundtrip'))) ||
        (serviceName.includes('One-Way') && (name.includes('oneway') || name.includes('one way') || name.includes('one-way'))) ||
        (serviceName.includes('Airport') && (name.includes('airport') || name.includes('cab')))
      );
    });

    // Fallback service IDs: Round Trip = 3, One-Way = 4, Airport = 3
    const fallbackId = formData.tripType === 'oneway' ? 4 : 3;
    const serviceId = service?.id || fallbackId;

    console.log(`Car ${formData.tripType} - Matched service:`, service, 'Using ID:', serviceId);

    return { bookingType, serviceId, serviceName };
  };

  const { bookingType, serviceId, serviceName } = getBookingTypeAndServiceId();
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission(bookingType);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum return date (same as or after start date)
  const getMinReturnDate = () => {
    return formData.startDate || getTodayDate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { serviceId, serviceName } = getBookingTypeAndServiceId();

    // Validate phone
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    // Map car type to numeric values expected by database
    // 1 = Hatchback, 2 = Sedan, 3 = MUV, 4 = SUV, 5 = Luxury
    const getCarTypeNumber = (carType: string) => {
      const carTypeMap: Record<string, string> = {
        'hatchback': '1',
        'sedan': '2',
        'muv': '3',
        'suv': '4',
        'luxury': '5',
      };
      return carTypeMap[carType] || '2'; // Default to sedan
    };

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
      service_name: serviceName, // Dynamic service name
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      destination: formData.destination,
      journey_datetime: `${formData.startDate}T${formData.startTime}:00`,
      return_datetime: formData.returnDate && formData.returnTime ? `${formData.returnDate}T${formData.returnTime}:00` : undefined,
      trip_type: formData.tripType === 'roundtrip' ? '3' : formData.tripType === 'oneway' ? '1' : '2',
      car_type: getCarTypeNumber(formData.vehicleType), // Convert to numeric value
      airport_option: formData.airportType,
      total_passangers: parseInt(formData.passengers) || 1,
      other_info: formData.additionalDetails,
      // B2B fields
      ...(isB2B && {
        number_of_vehicles: parseInt(formData.numberOfVehicles) || 1,
        number_of_employees: parseInt(formData.numberOfEmployees) || 0,
        is_b2b: true,
      }),
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      // Destination text is required (not destination ID - users can type custom location)
      return formData.tripType && formData.pickupLocationId && formData.destination.trim() &&
        (formData.tripType !== 'airport' || formData.airportType);
    }
    if (currentStep === 2) {
      // For round trip, return date is also required
      const hasRequiredDates = formData.tripType === 'roundtrip'
        ? (formData.startDate && formData.startTime && formData.returnDate && formData.returnTime)
        : (formData.startDate && formData.startTime);
      return formData.vehicleType && hasRequiredDates && formData.passengers;
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
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${currentStep >= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              <span className={`text-sm mt-2 text-center ${currentStep >= step ? 'text-primary font-medium' : 'text-gray-500'}`}>
                {step === 1 ? 'Trip & Location' : step === 2 ? 'Vehicle & Date' : 'Contact Info'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Step 1: Trip Type & Location */}
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan your trip</h3>
              <p className="text-gray-600">Choose your trip type and locations</p>
            </div>

            {/* Trip Type */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Trip Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {TRIP_TYPES.map((trip) => (
                  <button key={trip.id} type="button" onClick={() => updateFormData('tripType', trip.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.tripType === trip.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{trip.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{trip.name}</div>
                    <div className="text-xs text-gray-500">{trip.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Airport Type (only for airport trips) */}
            {formData.tripType === 'airport' && (
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">Airport Service *</label>
                <div className="grid grid-cols-2 gap-3">
                  {AIRPORT_TYPES.map((type) => (
                    <button key={type.id} type="button" onClick={() => updateFormData('airportType', type.id)}
                      className={`p-4 border-2 rounded-xl text-center transition-all ${formData.airportType === type.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                        }`}>
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-semibold text-gray-900 text-sm">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <LocationAutocomplete
                value={formData.pickupLocation}
                locationId={formData.pickupLocationId}
                onChange={handlePickupLocationChange}
                label="Pick-up Location"
                placeholder="Type to search pickup location..."
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
                  placeholder="Enter your destination (e.g., Agra, Jaipur, etc.)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You can type any location</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Vehicle & Date */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose your vehicle</h3>
              <p className="text-gray-600">Select vehicle type and travel dates</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {VEHICLE_TYPES.map((vehicle) => (
                  <button key={vehicle.id} type="button" onClick={() => updateFormData('vehicleType', vehicle.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.vehicleType === vehicle.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{vehicle.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{vehicle.name}</div>
                    <div className="text-xs text-gray-500">{vehicle.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Cannot select past dates</p>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateFormData('startTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
              {formData.tripType === 'roundtrip' && (
                <>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />Return Date *
                    </label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => updateFormData('returnDate', e.target.value)}
                      min={getMinReturnDate()}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be same or after start date</p>
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />Return Time *
                    </label>
                    <input
                      type="time"
                      value={formData.returnTime}
                      onChange={(e) => updateFormData('returnTime', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />Total Passengers *
                </label>
                <input type="number" value={formData.passengers} onChange={(e) => updateFormData('passengers', e.target.value)}
                  placeholder="Number of passengers" min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
              </div>
            </div>

            {/* B2B Fields - Only visible for B2B customers */}
            {isB2B && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-teal-800 flex items-center gap-2">
                  <Users className="w-4 h-4" /> B2B Corporate Booking
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Vehicles *</label>
                    <input type="number" value={formData.numberOfVehicles} onChange={(e) => updateFormData('numberOfVehicles', e.target.
                    value)}
                      placeholder="e.g. 10" min="1" max="500" className="w-full text-gray-900 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                    <input type="number" value={formData.numberOfEmployees} onChange={(e) => updateFormData('numberOfEmployees', e.target.value)}
                      placeholder="e.g. 50" min="1" className="w-full text-gray-900 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none" />
                  </div>
                </div>
                <p className="text-xs text-teal-600">No payment required. Post-trip corporate billing.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Contact Info */}
        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
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
                  <User className="w-4 h-4 inline mr-2" />Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`}
                  required
                />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`}
                  required
                />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) updateFormData('phone', val);
                  }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`}
                  required
                />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />Additional Details (Optional)
                </label>
                <textarea value={formData.additionalDetails} onChange={(e) => updateFormData('additionalDetails', e.target.value)}
                  placeholder="Any special requirements?" rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none" />
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

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 && <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={isSubmitting}>Previous</Button>}
          <div className="ml-auto">
            {currentStep < 3 ? (
              <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="min-w-[120px]">
                Next<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={!canProceed() || isSubmitting} className="min-w-[200px]">
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
