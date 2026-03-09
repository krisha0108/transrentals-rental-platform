'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Mail, Phone, MessageSquare, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useCustomerAuth } from '@/hooks/useCustomer';

const SHIFTING_TYPES = [
  { id: 'home', name: 'Home', icon: '🏠', description: 'Household shifting' },
  { id: 'office', name: 'Office', icon: '🏢', description: 'Office relocation' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗', description: 'Vehicle transport' },
];

const HOME_TYPES = [
  { id: '1bhk', name: '1 BHK', icon: '🏠' },
  { id: '2bhk', name: '2 BHK', icon: '🏠' },
  { id: '3bhk', name: '3 BHK', icon: '🏡' },
  { id: '4bhk', name: '4 BHK', icon: '🏡' },
  { id: '4bhk+', name: 'More Than 4 BHK', icon: '🏘️' },
  { id: 'villa', name: 'Villa', icon: '🏰' },
];

const OFFICE_TYPES = [
  { id: 'individual', name: 'Individual Items', icon: '📦' },
  { id: 'upto10', name: 'Up to 10 Employees', icon: '👥' },
  { id: 'upto20', name: 'Up to 20 Employees', icon: '👥' },
  { id: 'more20', name: 'More than 20 Employees', icon: '👥' },
];

const VEHICLE_TYPES = [
  { id: 'bike', name: 'Bike', icon: '🏍️' },
  { id: 'car', name: 'Car', icon: '🚗' },
  { id: 'suv', name: 'SUV', icon: '🚙' },
];

export function PackersMoversBookingForm() {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isB2B, setIsB2B] = useState(false);
  const [formData, setFormData] = useState({
    shiftingType: '',
    pickupLocationId: '',
    pickupLocation: '',
    destinationId: '',
    destination: '',
    specificType: '',
    startDate: '',
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });
  const [dateError, setDateError] = useState('');

  // Pre-fill user data if logged in & check B2B status
  useEffect(() => {
    if (isAuthenticated && customer) {
      setFormData(prev => ({
        ...prev,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
      }));
      const params = new URLSearchParams();
      if (customer.id) params.set('customer_id', String(customer.id));
      if (customer.email) params.set('email', customer.email);
      if (params.toString()) {
        fetch(`/api/customer/b2b-status?${params.toString()}`)
          .then(res => res.json())
          .then(data => { if (data.isB2B) setIsB2B(true); })
          .catch(() => {});
      }
    }
  }, [isAuthenticated, customer]);

  // Determine booking type based on shifting type
  const getBookingType = () => {
    if (formData.shiftingType === 'home') return 'packers-home';
    if (formData.shiftingType === 'office') return 'packers-office';
    if (formData.shiftingType === 'vehicle') return 'packers-vehicle';
    return 'packers-home';
  };

  const bookingType = getBookingType();
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission(bookingType);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const validateDate = () => {
    if (!formData.startDate) {
      setDateError('');
      return true;
    }
    const selected = new Date(formData.startDate);
    selected.setHours(0, 0, 0, 0);
    const today = new Date(getTodayDate());
    if (selected < today) {
      setDateError('Start date cannot be earlier than today.');
      return false;
    }
    setDateError('');
    return true;
  };

  useEffect(() => {
    validateDate();
  }, [formData.startDate]);

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
    const bookingData = {
      service_id: 9,
      service_name: "Packers & Movers",
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      destination: formData.destination,
      journey_datetime: `${formData.startDate}T00:00:00`,
      shifting_type: formData.shiftingType === 'home' ? 'Home' : formData.shiftingType === 'office' ? 'Office' : 'Vehicle',
      specific_type: formData.specificType,
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.shiftingType && formData.pickupLocationId && formData.destination;
    if (currentStep === 2) return formData.specificType && formData.startDate && !dateError;
    return formData.name && formData.email && formData.phone;
  };

  const getSpecificTypeOptions = () => {
    if (formData.shiftingType === 'home') return HOME_TYPES;
    if (formData.shiftingType === 'office') return OFFICE_TYPES;
    if (formData.shiftingType === 'vehicle') return VEHICLE_TYPES;
    return [];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
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
                {step === 1 ? 'Type & Location' : step === 2 ? 'Details & Date' : 'Contact Info'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isB2B && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Advance Payment Required</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Packers & Movers is <strong>not covered under your B2B agreement</strong>. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">What are you shifting?</h3>
              <p className="text-gray-600">Select shifting type and locations</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Shifting Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {SHIFTING_TYPES.map((type) => (
                  <button key={type.id} type="button" onClick={() => {
                    updateFormData('shiftingType', type.id);
                    updateFormData('specificType', '');
                  }}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.shiftingType === type.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>
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
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Shifting details</h3>
              <p className="text-gray-600">Select size and date</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {formData.shiftingType === 'home' && 'Property Size *'}
                {formData.shiftingType === 'office' && 'Office Size *'}
                {formData.shiftingType === 'vehicle' && 'Vehicle Type *'}
              </label>
              <div className={`grid ${getSpecificTypeOptions().length > 4 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
                {getSpecificTypeOptions().map((option) => (
                  <button key={option.id} type="button" onClick={() => updateFormData('specificType', option.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.specificType === option.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{option.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />Start Date *
              </label>
              <input type="date" value={formData.startDate} onChange={(e) => updateFormData('startDate', e.target.value)}
                min={getTodayDate()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
              <p className="text-xs text-gray-500 mt-1">Cannot select a past date</p>
              {dateError && (
                <p className="text-sm text-red-600">{dateError}</p>
              )}
            </div>
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
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-2" />Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your full name" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`} required />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2"><Mail className="w-4 h-4 inline mr-2" />Email Address *</label>
                <input type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your.email@example.com" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`} required />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4 inline mr-2" />Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+91 9737965551" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none ${isAuthenticated ? 'bg-green-50 border-green-200' : 'border-gray-200'
                    }`} required />
              </div>
              <div className="text-center">
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
