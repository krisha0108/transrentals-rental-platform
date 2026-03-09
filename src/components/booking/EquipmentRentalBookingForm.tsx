'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Mail, Phone, MessageSquare, ArrowRight, Check, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';

// Machine types matching backend database values (1-11)
const EQUIPMENT_TYPES = [
  { id: '1', name: 'Grove crane', icon: '🏗️' },
  { id: '2', name: 'Truck mounted crane', icon: '🚚' },
  { id: '3', name: 'Tower crane', icon: '🏗️' },
  { id: '4', name: 'Telescopic crane', icon: '🏗️' },
  { id: '5', name: 'Rough terrain crane', icon: '🏗️' },
  { id: '6', name: 'Overhead crane', icon: '🏗️' },
  { id: '7', name: 'Bulldozer', icon: '🚜' },
  { id: '8', name: 'Dumper', icon: '🚛' },
  { id: '9', name: 'Loader', icon: '🚜' },
  { id: '10', name: 'Excavators', icon: '🚧' },
  { id: '11', name: 'Backhoe loader', icon: '🚜' },
];

// Job duration values matching backend (1, 2, 3, 4)
const JOB_DURATIONS = [
  { id: '1', name: '1 to 5 Days', icon: '📅', description: 'Short term' },
  { id: '2', name: '6 to 15 Days', icon: '📆', description: 'Medium term' },
  { id: '3', name: '16 to 30 Days', icon: '🗓️', description: 'Long term' },
  { id: '4', name: 'More than 30 Days', icon: '📊', description: 'Extended term' },
];

export function EquipmentRentalBookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<any>(null);
  const [isB2B, setIsB2B] = useState(false);
  const [formData, setFormData] = useState({
    pickupLocationId: '',
    pickupLocation: '',
    equipmentType: '',
    jobDuration: '',
    startDate: '',
    quantity: '',
    name: '',
    email: '',
    phone: '',
    additionalDetails: '',
  });
  const [dateError, setDateError] = useState('');

  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission('equipment');

  // Check if user is logged in and pre-fill contact details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const customerData = localStorage.getItem('customer');
      if (token && customerData) {
        try {
          const customer = JSON.parse(customerData);
          setIsLoggedIn(true);
          setLoggedInCustomer(customer);
          // Pre-fill form data with customer info
          setFormData(prev => ({
            ...prev,
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
          }));
          // Check B2B status
          const params = new URLSearchParams();
          if (customer.id) params.set('customer_id', String(customer.id));
          if (customer.email) params.set('email', customer.email);
          if (params.toString()) {
            fetch(`/api/customer/b2b-status?${params.toString()}`)
              .then(res => res.json())
              .then(data => { if (data.isB2B) setIsB2B(true); })
              .catch(() => {});
          }
        } catch (e) {
          console.error('Failed to parse customer data:', e);
        }
      }
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Prepare customer info
    const customerInfo = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    // Prepare booking data matching backend API structure (equipment.blade.php)
    const bookingData = {
      service_id: 8,  // Equipment service ID from blade.php
      service_name: "Equipment",
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      journey_datetime: `${formData.startDate}T10:00:00`,
      machine_type: formData.equipmentType,  // machine_type not equipment_type
      job_duration: formData.jobDuration,    // values: 1, 2, 3, 4
      no_of_equipments: formData.quantity,   // no_of_equipments not quantity
      other_info: formData.additionalDetails,
      // Pass logged-in customer's ID if available
      customer_id: isLoggedIn && loggedInCustomer?.id ? loggedInCustomer.id : 0,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.pickupLocationId && formData.equipmentType;
    if (currentStep === 2) return formData.jobDuration && formData.startDate && formData.quantity && !dateError;
    // For step 3: logged-in users have pre-filled data, so they can proceed
    if (isLoggedIn) return true;
    return formData.name && formData.email && formData.phone;
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
                {step === 1 ? 'Location & Equipment' : step === 2 ? 'Duration & Date' : 'Contact Info'}
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
              Equipment Rental is <strong>not covered under your B2B agreement</strong>. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Select your equipment</h3>
              <p className="text-gray-600">Choose location and equipment type</p>
            </div>

            <LocationAutocomplete
              value={formData.pickupLocation}
              locationId={formData.pickupLocationId}
              onChange={handlePickupLocationChange}
              label="Pick-up Location"
              placeholder="Type to search location..."
              required
            />

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Equipment Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EQUIPMENT_TYPES.map((equipment) => (
                  <button key={equipment.id} type="button" onClick={() => updateFormData('equipmentType', equipment.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.equipmentType === equipment.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{equipment.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{equipment.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Job details</h3>
              <p className="text-gray-600">Select duration and start date</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Job Duration *</label>
              <div className="grid grid-cols-2 gap-3">
                {JOB_DURATIONS.map((duration) => (
                  <button key={duration.id} type="button" onClick={() => updateFormData('jobDuration', duration.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.jobDuration === duration.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{duration.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{duration.name}</div>
                    <div className="text-xs text-gray-500">{duration.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Equipment *</label>
                <input type="number" value={formData.quantity} onChange={(e) => updateFormData('quantity', e.target.value)}
                  placeholder="Quantity" min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isLoggedIn ? 'Confirm your details' : 'Almost there!'}
              </h3>
              <p className="text-gray-600">
                {isLoggedIn ? 'Review your contact information' : 'We need your contact details to send you quotes'}
              </p>
            </div>

            {/* Logged-in user - Show confirmation */}
            {isLoggedIn && loggedInCustomer && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Logged in as</p>
                    <p className="text-green-700">{loggedInCustomer.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span>{formData.email || loggedInCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span>{formData.phone || loggedInCustomer.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Not logged in - Show input form */}
            {!isLoggedIn && (
              <div className="space-y-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-2" />Full Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter your full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2"><Mail className="w-4 h-4 inline mr-2" />Email Address *</label>
                  <input type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="your.email@example.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4 inline mr-2" />Phone Number *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+91 9737965551" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
                </div>
              </div>
            )}

            {/* Additional details - Show for both logged in and not logged in */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2"><MessageSquare className="w-4 h-4 inline mr-2" />Additional Details</label>
              <textarea value={formData.additionalDetails} onChange={(e) => updateFormData('additionalDetails', e.target.value)}
                placeholder="Any special requirements?" rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none" />
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
