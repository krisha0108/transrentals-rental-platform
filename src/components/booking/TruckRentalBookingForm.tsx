'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Mail, Phone, MessageSquare, ArrowRight, Check, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingSubmission } from './useBookingSubmission';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useCustomerAuth } from '@/hooks/useCustomer';

const TRUCK_MODES = [
  { id: 'personal', name: 'Personal', icon: '👤', description: 'Personal use' },
  { id: 'commercial', name: 'Commercial', icon: '🏢', description: 'Business use' },
];

// Truck types with IDs matching backend (1-14)
const TRUCK_TYPES = [
  { id: '1', name: 'Canter Jumbo' },
  { id: '2', name: 'Canters 17ft/4 wheel' },
  { id: '3', name: 'Canters 19ft/6 wheel' },
  { id: '4', name: 'Canters 3MT/4 wheel' },
  { id: '5', name: 'Canters Close Body 20ft' },
  { id: '6', name: 'Canters Close Body 24ft' },
  { id: '7', name: 'LCV' },
  { id: '8', name: 'Semi Low Bed Trailer' },
  { id: '9', name: 'Truck 20MT/12 Wheel' },
  { id: '10', name: 'Truck 25MT/14 Wheel' },
  { id: '11', name: 'Truck 16MT/10 Wheel' },
  { id: '12', name: 'Tata 407 2.5MT/4 Wheels' },
  { id: '13', name: 'Truck 9MT/6 Wheel' },
  { id: '14', name: 'Tata Ace' },
];

// Goods types with IDs matching backend (1-29)
const GOODS_TYPES = [
  { id: '1', name: 'Building materials' },
  { id: '2', name: 'Granites/Marbles' },
  { id: '3', name: 'Cement' },
  { id: '4', name: 'Chemical' },
  { id: '5', name: 'Coal & Ash' },
  { id: '6', name: 'Container' },
  { id: '7', name: 'Engineering goods' },
  { id: '8', name: 'Electronics/Consumer durables' },
  { id: '9', name: 'Fertilizer' },
  { id: '10', name: 'Fruits & Vegetables' },
  { id: '11', name: 'Furniture & Wood products' },
  { id: '12', name: 'Household goods' },
  { id: '13', name: 'Industrial Equipments' },
  { id: '14', name: 'Iron/Steel materials' },
  { id: '15', name: 'Liquid/Oil drums' },
  { id: '16', name: 'Machineries' },
  { id: '17', name: 'Marble Slab/Block' },
  { id: '18', name: 'Medicines' },
  { id: '19', name: 'Packed foods' },
  { id: '20', name: 'Plastic Pipes' },
  { id: '21', name: 'Books/Paper rolls' },
  { id: '22', name: 'Plastic granules/Industrial goods' },
  { id: '23', name: 'Crop/Agriculture products' },
  { id: '24', name: 'Scrap' },
  { id: '25', name: 'Stones/Tiles' },
  { id: '26', name: 'Textiles' },
  { id: '27', name: 'Tyres & Rubber products' },
  { id: '28', name: 'Vehicles/Automobiles' },
  { id: '29', name: 'Others' },
];

export function TruckRentalBookingForm() {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    mode: '',
    pickupLocationId: '',
    pickupLocation: '',
    destinationId: '',
    destination: '',
    truckType: '',
    goodType: '',
    weight: '',
    weightUnit: 'KG',
    startDate: '',
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

  // Determine booking type based on truck mode
  const getBookingType = () => {
    if (formData.mode === 'personal') return 'truck-personal';
    if (formData.mode === 'commercial') return 'truck-commercial';
    return 'truck-personal';
  };

  const bookingType = getBookingType();
  const { isSubmitting, error, submitBooking, setError } = useBookingSubmission(bookingType);

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
    // Backend expects: truck_type (1-14), personal_good_type or commercial_good_type (1-29),
    // weight_val (string value), weight (1=KG, 2=TON)
    const isPersonal = formData.mode === 'personal';
    const bookingData = {
      service_id: 7,
      service_name: "Truck Rental",
      location_id: parseInt(formData.pickupLocationId) || 1,
      location_name: formData.pickupLocation,
      destination: formData.destination,
      journey_datetime: `${formData.startDate}T00:00:00`,
      truck_mode: isPersonal ? '1' : '2',
      truck_type: formData.truckType,
      // Backend expects personal_good_type or commercial_good_type based on mode
      personal_good_type: isPersonal ? formData.goodType : null,
      commercial_good_type: !isPersonal ? formData.goodType : null,
      // Backend expects weight_val for value and weight for unit (1=KG, 2=TON)
      weight_val: formData.weight,
      weight: formData.weightUnit === 'KG' ? '1' : '2',
      other_info: formData.additionalDetails,
    };

    await submitBooking(customerInfo, bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.mode && formData.pickupLocationId && formData.destination;
    if (currentStep === 2) return (
      formData.truckType &&
      formData.goodType &&
      formData.weight &&
      formData.startDate &&
      !dateError
    );
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
                {step === 1 ? 'Mode & Location' : step === 2 ? 'Truck & Goods' : 'Contact Info'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan your transport</h3>
              <p className="text-gray-600">Select mode and locations</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Truck Mode *</label>
              <div className="grid grid-cols-2 gap-3">
                {TRUCK_MODES.map((mode) => (
                  <button key={mode.id} type="button" onClick={() => updateFormData('mode', mode.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${formData.mode === mode.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/50'
                      }`}>
                    <div className="text-2xl mb-2">{mode.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{mode.name}</div>
                    <div className="text-xs text-gray-500">{mode.description}</div>
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
                serviceSlug="transporter"
                allowCustom={false}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose truck & goods</h3>
              <p className="text-gray-600">Select truck type, goods, and weight</p>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Truck Type *</label>
              <select value={formData.truckType} onChange={(e) => updateFormData('truckType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required>
                <option value="">Select truck type</option>
                {TRUCK_TYPES.map((truck) => (
                  <option key={truck.id} value={truck.id}>{truck.name}</option>
                ))}
              </select>
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">Good Type *</label>
              <select value={formData.goodType} onChange={(e) => updateFormData('goodType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required>
                <option value="">Select goods type</option>
                {GOODS_TYPES.map((good) => (
                  <option key={good.id} value={good.id}>{good.name}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Weight className="w-4 h-4 inline mr-2" />Weight *
                </label>
                <input type="number" value={formData.weight} onChange={(e) => updateFormData('weight', e.target.value)}
                  placeholder="Enter weight" min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" required />
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <select value={formData.weightUnit} onChange={(e) => updateFormData('weightUnit', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none">
                  <option value="KG">KG</option>
                  <option value="TON">TON</option>
                </select>
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
