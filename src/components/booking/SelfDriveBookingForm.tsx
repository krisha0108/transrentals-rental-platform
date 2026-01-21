'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useCustomerAuth } from '@/hooks/useCustomer';

// Vehicle types with IDs matching backend (1-4)
const VEHICLE_TYPES = [
  { id: '1', name: 'Hatchback', icon: '🚗', description: 'Compact & efficient' },
  { id: '2', name: 'Sedan', icon: '🚙', description: 'Comfortable rides' },
  { id: '3', name: 'MUV', icon: '🚐', description: 'Spacious family car' },
  { id: '4', name: 'SUV', icon: '🚙', description: 'Powerful & spacious' },
];

// Transmission types with IDs matching backend (1=Automatic, 2=Manual)
const TRANSMISSION_TYPES = [
  { id: '1', name: 'Automatic', icon: '⚙️', description: 'Easy driving' },
  { id: '2', name: 'Manual', icon: '🔧', description: 'Full control' },
];

// Fuel types with IDs matching backend (1=Diesel, 2=Petrol, 3=Electric, 4=CNG)
const FUEL_TYPES = [
  { id: '1', name: 'Diesel', icon: '⛽' },
  { id: '2', name: 'Petrol', icon: '⛽' },
  { id: '3', name: 'Electric', icon: '🔋' },
  { id: '4', name: 'CNG', icon: '💨' },
];

export function SelfDriveBookingForm() {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocationId: '',
    pickupLocation: '',
    destinationId: '',
    destination: '',
    vehicleType: '',
    transmission: '',
    fuelType: '',
    doorstepDelivery: '',
    startDate: '',
    startTime: '',
    returnDate: '',
    returnTime: '',
    passengers: '',
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });
  const [dateError, setDateError] = useState('');

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

  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission('selfdrive');

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

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinReturnDate = () => {
    return formData.startDate || getTodayDate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Prepare customer info
    const customerInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    // Prepare booking data matching backend API structure
    // Backend expects: car_type (1-4), transmission (1-2), fuel_type (1-4), is_doorstep_delivery (0-1)
    const bookingData = {
      service_id: 4,
      service_name: "Selfdrive Car",
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      destination: formData.destination,
      journey_datetime: `${formData.startDate}T${formData.startTime}:00`,
      return_datetime: formData.returnDate ? `${formData.returnDate}T${formData.returnTime}:00` : null,
      car_type: formData.vehicleType,
      transmission: formData.transmission,
      fuel_type: formData.fuelType,
      is_doorstep_delivery: formData.doorstepDelivery === 'yes' ? '1' : '0',
      total_passangers: formData.passengers ? parseInt(formData.passengers) : null,
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const validateDateRange = () => {
    if (!formData.startDate || !formData.startTime || !formData.returnDate) {
      setDateError('');
      return true;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
    const returnTime = formData.returnTime || formData.startTime;
    const returnDateTime = new Date(`${formData.returnDate}T${returnTime}:00`);

    if (returnDateTime < startDateTime) {
      setDateError('Return date/time must be the same or after the start date/time.');
      return false;
    }

    setDateError('');
    return true;
  };

  useEffect(() => {
    validateDateRange();
  }, [formData.startDate, formData.startTime, formData.returnDate, formData.returnTime]);

  const canProceed = () => {
    if (currentStep === 1) return formData.pickupLocationId && formData.destination;
    if (currentStep === 2) {
      return (
        formData.vehicleType &&
        formData.transmission &&
        formData.fuelType &&
        formData.doorstepDelivery &&
        formData.startDate &&
        formData.startTime &&
        !dateError
      );
    }
    return formData.name && formData.email && formData.phone;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
        <div className={`absolute top-5 left-0 h-1 bg-primary transition-all -z-10`} style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>

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
                {step === 1 ? 'Location' : step === 2 ? 'Vehicle Details' : 'Contact Info'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Where do you need the car?</h3>
              <p className="text-gray-600">Tell us your pickup and drop-off locations</p>
            </div>
            <div className="space-y-4">
              <LocationAutocomplete
                value={formData.pickupLocation}
                locationId={formData.pickupLocationId}
                onChange={handlePickupLocationChange}
                label="Pick-up Location"
                placeholder="Type to search pickup location..."
                required
              />
              <LocationAutocomplete
                value={formData.destination}
                locationId={formData.destinationId}
                onChange={handleDestinationChange}
                label="Destination"
                placeholder="Type destination or search..."
                required
                allowCustom={true}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose your car</h3>
              <p className="text-gray-600">Select vehicle specifications</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLE_TYPES.map((vehicle) => (
                  <button key={vehicle.id} type="button" onClick={() => updateFormData('vehicleType', vehicle.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.vehicleType === vehicle.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                    }`}>
                    <div className="text-2xl mb-2">{vehicle.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{vehicle.name}</div>
                    <div className="text-xs text-gray-500">{vehicle.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Transmission *</label>
              <div className="grid grid-cols-2 gap-3">
                {TRANSMISSION_TYPES.map((trans) => (
                  <button key={trans.id} type="button" onClick={() => updateFormData('transmission', trans.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.transmission === trans.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                    }`}>
                    <div className="text-2xl mb-2">{trans.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{trans.name}</div>
                    <div className="text-xs text-gray-500">{trans.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Fuel Type *</label>
              <div className="grid grid-cols-4 gap-3">
                {FUEL_TYPES.map((fuel) => (
                  <button key={fuel.id} type="button" onClick={() => updateFormData('fuelType', fuel.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.fuelType === fuel.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                    }`}>
                    <div className="text-2xl mb-2">{fuel.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{fuel.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Doorstep Delivery *</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'yes', name: 'Yes', icon: '✅' }, { id: 'no', name: 'No', icon: '❌' }].map((option) => (
                  <button key={option.id} type="button" onClick={() => updateFormData('doorstepDelivery', option.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.doorstepDelivery === option.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                    }`}>
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{option.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Start Date *</label>
                <input type="date" value={formData.startDate} onChange={(e) => updateFormData('startDate', e.target.value)}
                  min={getTodayDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
                <p className="text-xs text-gray-500 mt-1">Cannot pick past dates</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4 inline mr-2" />Start Time *</label>
                <input type="time" value={formData.startTime} onChange={(e) => updateFormData('startTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Return Date</label>
                <input type="date" value={formData.returnDate} onChange={(e) => updateFormData('returnDate', e.target.value)}
                  min={getMinReturnDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" />
                <p className="text-xs text-gray-500 mt-1">Return cannot be earlier than start date</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4 inline mr-2" />Return Time</label>
                <input type="time" value={formData.returnTime} onChange={(e) => updateFormData('returnTime', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" />
                <p className="text-xs text-gray-500 mt-1">Return cannot be earlier than start date</p>
              </div>
            </div>
            {dateError && (
              <p className="text-sm text-red-600">{dateError}</p>
            )}
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h3>
              <p className="text-gray-600">
                {isAuthenticated ? (
                  <>
                    Welcome back, <span className="font-semibold text-primary">{customer?.name}</span>!
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-2" />Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your full name" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Mail className="w-4 h-4 inline mr-2" />Email Address *</label>
                <input type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4 inline mr-2" />Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+91 98765 43210" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${
                    isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                  }`} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><MessageSquare className="w-4 h-4 inline mr-2" />Additional Details</label>
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
