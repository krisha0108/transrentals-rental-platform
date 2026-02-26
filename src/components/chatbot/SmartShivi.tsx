'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocations } from '@/components/booking/useLocations';
import { bookingService } from '@/lib/api/services/bookingService';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { usePathname, useRouter } from 'next/navigation';
import { trackChatInteraction, updateChatOutcome } from '@/components/analytics/VisitorTracker';

interface Message {
  id: string;
  type: 'user' | 'shivi';
  content: string;
  timestamp: Date;
  options?: { label: string; action: string; value?: string }[];
  inputType?: 'text' | 'date' | 'datetime' | 'tel' | 'email' | 'location';
  placeholder?: string;
  waitingFor?: string;
}

interface BookingData {
  serviceType?: string;
  serviceName?: string;
  pickupLocation?: string;
  pickupLocationId?: string;
  dropLocation?: string;
  dropLocationId?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  name?: string;
  phone?: string;
  email?: string;
  requirements?: string;
  // God-level context fields
  tripPurpose?: string;
  groupSize?: string;
  budget?: string;
  // Fleet selection fields
  selectedVehicleId?: string;
  selectedVehicleName?: string;
  selectedVendorId?: string;
  selectedVendorFleetId?: string;
  selectedDailyRate?: number;
  selectedDeposit?: number;
  // Car rental specific fields
  carTripType?: 'local' | 'outstation' | 'airport';
  carMode?: 'one-way' | 'round-trip' | 'pickup' | 'drop';
  selectedCarCategoryId?: string;
  selectedCarCategoryName?: string;
  selectedPackageId?: string;
  selectedPackageName?: string;
  carEstimatedPrice?: number;
  airportId?: string;
  airportName?: string;
  // Self-Drive specific fields
  selfDriveVehicleType?: string; // Hatchback, Sedan, MUV, SUV
  selfDriveTransmission?: string; // Automatic, Manual
  selfDriveFuelType?: string; // Diesel, Petrol, Electric, CNG
  selfDriveDoorstep?: boolean;
  // Luxury specific fields
  luxuryVehicleCategory?: string; // Premium Sedan, Luxury SUV, etc.
  luxuryTripType?: 'local' | 'outstation' | 'airport';
  luxuryMode?: 'one-way' | 'round-trip' | 'pickup' | 'drop';
  luxuryVehiclePreference?: string; // Mercedes E-Class, BMW 5 Series, etc.
  luxuryOccasion?: string; // Wedding, Corporate, etc.
  luxuryNeedDecoration?: boolean;
  luxuryPickupAddress?: string;
  luxurySpecialRequests?: string;
  // Packers & Movers specific fields
  packersShiftingType?: 'home' | 'office' | 'vehicle';
  packersPropertySize?: string; // 1bhk, 2bhk, villa, etc.
  packersPickupAddress?: string;
  packersDropAddress?: string;
}

// Fleet vehicle interface for Bike/Self-Drive
interface FleetVehicle {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  brandLogo?: string;
  categoryName?: string;
  sideImage?: string;
  fuelType?: string;
  transmission?: string;
  lowestPrice: number;
  vendorCount: number;
  vendorPrices: {
    vendorId: string;
    vendorName: string;
    vendorFleetId: string;
    dailyRate: number;
    deposit: number;
    isVerified: boolean;
    rating?: number;
  }[];
}

// Car rental vehicle category interface
interface CarCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  capacity: number;
  luggageCapacity?: number;
  features?: string[];
  isActive: boolean;
}

// Car rental local package interface
interface LocalPackage {
  id: string;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  vehicleCategoryId: string;
  locationId: string;
}

// Car rental pricing result interface
interface CarPricing {
  categoryId: string;
  categoryName: string;
  grandTotal: number;
  totalBeforeGst: number;
  gst: number;
  basePrice?: number;
  perKmRate?: number;
  driverAllowance?: number;
  nightCharge?: number;
  tollEstimate?: number;
  packageName?: string;
  hours?: number;
  kms?: number;
}

// Airport interface
interface Airport {
  id: string;
  name: string;
  code: string;
  slug: string;
  displayName: string;
  shortName: string;
  city: string;
  cityId: string;
}

interface ConversationContext {
  userIntent?: string;
  previousBookings?: number;
  preferredLocations?: string[];
  lastInteraction?: Date;
  conversationTone?: 'formal' | 'casual' | 'excited';
}

export function SmartShivi() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [bookingStep, setBookingStep] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({});
  const [quickActionsShown, setQuickActionsShown] = useState(false);
  const [availableFleet, setAvailableFleet] = useState<FleetVehicle[]>([]);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  // Car rental states
  const [carCategories, setCarCategories] = useState<CarCategory[]>([]);
  const [localPackages, setLocalPackages] = useState<LocalPackage[]>([]);
  const [carPricingList, setCarPricingList] = useState<CarPricing[]>([]);
  const [isLoadingCarPricing, setIsLoadingCarPricing] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('09:00');
  const [calendarError, setCalendarError] = useState('');
  const [calendarMode, setCalendarMode] = useState<'date' | 'time' | 'datetime'>('datetime');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const chatStartTimeRef = useRef<number>(0);
  const messageIdRef = useRef<number>(0);

  // Ref to track current service type (avoids stale closure issues)
  const currentServiceTypeRef = useRef<string>('');

  const { locations } = useLocations();
  const { customer } = useCustomerAuth();
  const router = useRouter();

  // BROWSE_FIRST services - redirect to fleet pages after getting location + dates
  const BROWSE_FIRST_SERVICES = ['self-drive-car-rentals', 'self-drive-rental', 'bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent'];

  // Extract city and service from current URL
  const getPageContext = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    let detectedCity = '';
    let detectedService = '';

    // Check for service pages with city: /self-drive-car-rentals/mumbai or /bike-on-rent/mumbai/bikes
    if (pathParts[0] === 'self-drive-car-rentals' && pathParts[1] && pathParts[1] !== 'cars') {
      detectedService = 'self-drive-car-rentals';
      detectedCity = pathParts[1].replace(/-/g, ' ');
    } else if (pathParts[0] === 'bike-on-rent' && pathParts[1] && pathParts[1] !== 'bikes') {
      detectedService = 'bike-on-rent';
      detectedCity = pathParts[1].replace(/-/g, ' ');
    } else if (pathParts[0] === 'car-rental' && pathParts[1]) {
      detectedService = 'outstation-car-rental';
      detectedCity = pathParts[1].replace(/-/g, ' ');
    }

    // Capitalize city name
    if (detectedCity) {
      detectedCity = detectedCity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    return { detectedCity, detectedService };
  };

  const pageContext = getPageContext();

  // Track chat opened
  const trackChatOpened = async () => {
    chatStartTimeRef.current = Date.now();
    await trackChatInteraction({
      interactionType: 'CHAT_OPENED',
      pagePath: pathname,
      pageTitle: document.title,
    });
  };

  // Track chat closed
  const trackChatClosed = async () => {
    const responseTime = chatStartTimeRef.current > 0 ? Date.now() - chatStartTimeRef.current : undefined;
    await trackChatInteraction({
      interactionType: 'CHAT_CLOSED',
      pagePath: pathname,
      pageTitle: document.title,
      responseTime,
      outcome: bookingStep === 'completed' ? 'BOOKING_SUBMITTED' : messages.length > 2 ? 'ABANDONED' : 'ABANDONED',
    });
  };

  // Track user message
  const trackUserMessage = async (message: string, step?: string) => {
    await trackChatInteraction({
      interactionType: 'MESSAGE_SENT',
      userMessage: message,
      pagePath: pathname,
      pageTitle: document.title,
      serviceType: bookingData.serviceType,
      serviceName: bookingData.serviceName,
      bookingStep: step || bookingStep,
    });
  };

  // Track option selection
  const trackOptionSelected = async (action: string, value?: string) => {
    await trackChatInteraction({
      interactionType: 'OPTION_SELECTED',
      userMessage: `${action}${value ? `: ${value}` : ''}`,
      pagePath: pathname,
      pageTitle: document.title,
      serviceType: bookingData.serviceType,
      serviceName: bookingData.serviceName,
      bookingStep,
    });
  };

  // Track booking started
  const trackBookingStarted = async (serviceType: string) => {
    await trackChatInteraction({
      interactionType: 'BOOKING_STARTED',
      pagePath: pathname,
      pageTitle: document.title,
      serviceType,
      bookingStep: 'service-selection',
    });
  };

  // Track booking completed
  const trackBookingCompleted = async () => {
    await trackChatInteraction({
      interactionType: 'BOOKING_COMPLETED',
      pagePath: pathname,
      pageTitle: document.title,
      serviceType: bookingData.serviceType,
      serviceName: bookingData.serviceName,
      bookingStep: 'completed',
      outcome: 'BOOKING_SUBMITTED',
    });
    // Update overall chat outcome
    await updateChatOutcome('BOOKING_SUBMITTED');
  };

  // Track KB query
  const trackKBQuery = async (query: string, articleId?: string, matchScore?: number) => {
    await trackChatInteraction({
      interactionType: 'KB_QUERY',
      pagePath: pathname,
      pageTitle: document.title,
      kbSearchQuery: query,
      kbArticleId: articleId,
      kbMatchScore: matchScore,
    });
  };

  // God-level: Get user's time of day for personalized greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // God-level: Detect if user is returning visitor
  const isReturningUser = () => {
    return localStorage.getItem('shivi_last_visit') !== null;
  };

  // God-level: Smart greeting based on context - Professional version
  const getSmartGreeting = () => {
    const greeting = getTimeBasedGreeting();
    const isReturning = isReturningUser();
    const firstName = customer?.name?.split(' ')[0]?.trim();
    const nameSuffix = firstName ? `, ${firstName}` : '';

    if (isReturning) {
      return `${greeting}${nameSuffix}! Welcome back to TransRentals.\n\nI'm Shivi, your personal booking assistant. Ready to book and earn more Backr Tokens?\n\nDownload our app for instant bookings and exclusive rewards.`;
    }

    return `${greeting}${nameSuffix}! I'm Shivi, your smart vehicle rental assistant.\n\nBook in under 2 minutes and earn Backr Tokens with every ride.\n\nDownload our app for exclusive deals and faster bookings.\n\nWhat brings you here today?`;
  };

  // God-level: Intelligent phone validation - Professional version
  const validatePhone = (phone: string): { valid: boolean; message?: string } => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      return { valid: false, message: "Phone number is too short. Please enter a valid 10-digit number." };
    }
    if (cleaned.length > 10 && !cleaned.startsWith('91')) {
      return { valid: false, message: "Please enter a valid Indian mobile number (10 digits)." };
    }
    if (cleaned.length === 10 && !['6', '7', '8', '9'].includes(cleaned[0])) {
      return { valid: false, message: "Indian mobile numbers must start with 6, 7, 8, or 9." };
    }

    return { valid: true };
  };

  // God-level: Intelligent email validation - Professional version
  const validateEmail = (email: string): { valid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, message: "Please enter a valid email address (e.g., name@example.com)." };
    }

    const commonTypos = ['gmial.com', 'gmai.com', 'yahooo.com', 'outlok.com'];
    const domain = email.split('@')[1];

    if (commonTypos.includes(domain)) {
      return { valid: false, message: "Did you mean gmail.com, yahoo.com, or outlook.com? Please check the spelling." };
    }

    return { valid: true };
  };

  // God-level: Intelligent date validation
  const validateDate = (dateStr: string): { valid: boolean; message?: string; suggestedDate?: string } => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      return { valid: false, message: "I couldn't understand that date. Please use format: YYYY-MM-DD (e.g., 2024-12-25) 📅" };
    }

    if (date < today) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        valid: false,
        message: "That date is in the past! The earliest I can book is today 📅",
        suggestedDate: tomorrow.toISOString().split('T')[0]
      };
    }

    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 6);

    if (date > maxDate) {
      return { valid: false, message: "I can only book up to 6 months in advance. Please choose a closer date 📅" };
    }

    return { valid: true };
  };

  // God-level: Smart location suggestions based on popular routes
  const getSmartLocationSuggestions = (currentLocation?: string) => {
    const popularRoutes: Record<string, string[]> = {
      'Delhi': ['Agra', 'Jaipur', 'Shimla', 'Chandigarh', 'Dehradun'],
      'Mumbai': ['Pune', 'Goa', 'Nashik', 'Lonavala', 'Mahabaleshwar'],
      'Bangalore': ['Mysore', 'Ooty', 'Coorg', 'Chennai', 'Hampi'],
      'Chennai': ['Pondicherry', 'Bangalore', 'Tirupati', 'Coimbatore', 'Madurai'],
      'Kolkata': ['Darjeeling', 'Puri', 'Digha', 'Siliguri', 'Gangtok'],
    };

    if (currentLocation && popularRoutes[currentLocation]) {
      return popularRoutes[currentLocation].map(city => ({
        label: `${city} (Popular from ${currentLocation})`,
        action: 'select-location',
        value: city,
      }));
    }

    return locations.slice(0, 5).map(loc => ({
      label: loc.name,
      action: 'select-location',
      value: loc.name,
    }));
  };

  // Get filtered locations based on search query
  const getFilteredLocations = (query: string) => {
    if (!query || query.length < 2) {
      // Show popular/first 8 locations if no search
      return locations.slice(0, 8);
    }

    const searchLower = query.toLowerCase();
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(searchLower) ||
      loc.slug?.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Show max 10 matching results
  };

  // Update location options dynamically when user types
  const updateLocationOptions = (query: string) => {
    if (bookingStep !== 'pickup-location' && bookingStep !== 'drop-location') return;

    const filteredLocs = getFilteredLocations(query);
    if (filteredLocs.length > 0 && query.length >= 2) {
      // Update the last message with filtered options
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.type === 'shivi') {
          lastMessage.options = filteredLocs.map(loc => ({
            label: loc.name,
            action: 'select-location',
            value: loc.name,
          }));
        }
        return newMessages;
      });
    }
  };

  // Fetch available fleet for Bike/Self-Drive services
  const fetchFleetForLocation = async (locationName: string, serviceType: string): Promise<FleetVehicle[]> => {
    try {
      setIsLoadingFleet(true);
      const locationSlug = locationName.toLowerCase().replace(/\s+/g, '-');

      let apiUrl = '';
      if (['bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent'].includes(serviceType)) {
        apiUrl = `/api/bikes/${locationSlug}`;
      } else if (['self-drive-car-rentals', 'self-drive-rental'].includes(serviceType)) {
        apiUrl = `/api/self-drive-cars/${locationSlug}`;
      }

      if (!apiUrl) return [];

      const response = await fetch(apiUrl);
      if (!response.ok) return [];

      const data = await response.json();

      // Map bikes or cars to FleetVehicle format
      const vehicles = data.bikes || data.cars || [];
      return vehicles.map((v: any) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        brandName: v.brandName,
        brandLogo: v.brandLogo,
        categoryName: v.categoryName,
        sideImage: v.sideImage,
        fuelType: v.fuelType,
        transmission: v.transmission,
        lowestPrice: v.lowestPrice,
        vendorCount: v.vendorCount,
        vendorPrices: v.vendorPrices || [],
      }));
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
      return [];
    } finally {
      setIsLoadingFleet(false);
    }
  };

  // Fetch car categories for car rental
  const fetchCarCategories = async (): Promise<CarCategory[]> => {
    try {
      const response = await fetch('/api/admin/services/car-rental/vehicles');
      if (!response.ok) return [];
      const data = await response.json();
      return data.vehicles || data.categories || [];
    } catch (error) {
      console.error('Failed to fetch car categories:', error);
      return [];
    }
  };

  // Fetch local packages for a location
  const fetchLocalPackages = async (locationId: string): Promise<LocalPackage[]> => {
    try {
      const response = await fetch(`/api/admin/services/car-rental/packages?locationId=${locationId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.packages || [];
    } catch (error) {
      console.error('Failed to fetch local packages:', error);
      return [];
    }
  };

  // Fetch airports
  const fetchAirports = async (): Promise<Airport[]> => {
    try {
      const response = await fetch('/api/airports');
      if (!response.ok) return [];
      const data = await response.json();
      if (data.success && data.airports) {
        setAirports(data.airports);
        return data.airports;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch airports:', error);
      return [];
    }
  };

  // Fetch pricing for car rental based on trip type
  const fetchCarPricing = async (
    tripType: 'local' | 'outstation' | 'airport',
    categories: CarCategory[],
    params: {
      fromLocationId?: string;
      toLocationId?: string;
      packageId?: string;
      pickupTime?: string;
      startDate?: string;
      endDate?: string;
      mode?: 'one-way' | 'round-trip' | 'pickup' | 'drop';
    }
  ): Promise<CarPricing[]> => {
    setIsLoadingCarPricing(true);
    const pricingResults: CarPricing[] = [];

    try {
      for (const category of categories) {
        try {
          const queryParams = new URLSearchParams({
            vehicleCategory: category.id,
            tripType: tripType === 'outstation' ? (params.mode === 'one-way' ? 'one_way' : 'round_trip') : tripType,
          });

          if (params.fromLocationId) queryParams.set('from', params.fromLocationId);
          if (params.toLocationId) queryParams.set('to', params.toLocationId);
          if (params.packageId) queryParams.set('packageId', params.packageId);
          if (params.pickupTime) queryParams.set('pickupTime', params.pickupTime);
          if (params.startDate) queryParams.set('startDate', params.startDate);
          if (params.endDate) queryParams.set('endDate', params.endDate);

          console.log(`[Pricing] Fetching for ${category.name}: /api/chauffeur-pricing?${queryParams}`);
          const response = await fetch(`/api/chauffeur-pricing?${queryParams}`);
          const data = await response.json();

          console.log(`[Pricing] Response for ${category.name}:`, data);

          if (data.success && data.pricing && data.pricing.grandTotal > 0) {
            pricingResults.push({
              categoryId: category.id,
              categoryName: category.name,
              grandTotal: data.pricing.grandTotal,
              totalBeforeGst: data.pricing.totalBeforeGst,
              gst: data.pricing.gst,
              basePrice: data.pricing.basePrice,
              perKmRate: data.pricing.perKmRate || data.calculation?.perKmRate,
              driverAllowance: data.pricing.driverAllowance,
              nightCharge: data.pricing.nightCharge || data.pricing.nightSurcharge,
              tollEstimate: data.pricing.tollsEstimate || data.pricing.tollEstimate,
              packageName: data.pricing.packageName,
              hours: data.pricing.hours,
              kms: data.pricing.kms,
            });
          } else {
            console.log(`[Pricing] No valid pricing for ${category.name}:`, data.error || 'No price');
          }
        } catch (err) {
          // Skip categories with no pricing configured
          console.error(`[Pricing] Error fetching for ${category.name}:`, err);
        }
      }

      setCarPricingList(pricingResults);
      return pricingResults;
    } catch (error) {
      console.error('Failed to fetch car pricing:', error);
      return [];
    } finally {
      setIsLoadingCarPricing(false);
    }
  };

  // Show car category options with pricing
  const showCarCategoryOptions = (categories: CarCategory[], pricing: CarPricing[]) => {
    setBookingStep('select-car-category');

    // Create a map of categoryId to pricing
    const pricingMap = new Map(pricing.map(p => [p.categoryId, p]));

    // Sort categories: those with prices first, sorted by price
    const sortedCategories = [...categories].sort((a, b) => {
      const priceA = pricingMap.get(a.id)?.grandTotal || Infinity;
      const priceB = pricingMap.get(b.id)?.grandTotal || Infinity;
      return priceA - priceB;
    });

    // Build options - show all categories, price or "Not available"
    const categoryOptions = sortedCategories
      .filter(cat => {
        const priceData = pricingMap.get(cat.id);
        // Only show categories WITH pricing for selection
        return priceData && priceData.grandTotal > 0;
      })
      .map(cat => {
        const priceData = pricingMap.get(cat.id);
        return {
          label: `${cat.name} (${cat.capacity} seater) - ₹${priceData!.grandTotal.toLocaleString()}`,
          action: 'select-car-category',
          value: JSON.stringify({
            categoryId: cat.id,
            categoryName: cat.name,
            grandTotal: priceData!.grandTotal,
            packageName: priceData?.packageName,
          }),
        };
      });

    if (categoryOptions.length === 0) {
      // No pricing configured for this route
      addShiviMessage(
        "😔 Pricing is not yet configured for this route.\n\nOur team is working on it. Please try a different route or contact us.",
        [
          { label: '📍 Try Different Route', action: 'new-booking' },
          { label: '📞 Call +91 97379 65551', action: 'ask-question' },
        ]
      );
      return;
    }

    const tripTypeLabel = bookingData.carTripType === 'local' ? 'Local Trip' :
      bookingData.carTripType === 'airport' ? 'Airport Transfer' : 'Outstation Trip';

    const packageInfo = bookingData.selectedPackageName ? ` (${bookingData.selectedPackageName})` : '';

    addShiviMessage(
      `🚗 ${tripTypeLabel}${packageInfo}\n\n📍 ${bookingData.pickupLocation}${bookingData.dropLocation && bookingData.dropLocation !== bookingData.pickupLocation ? ` → ${bookingData.dropLocation}` : ''}\n📅 ${bookingData.pickupDate} at ${bookingData.pickupTime}\n\nSelect your car (prices include driver & fuel):`,
      categoryOptions
    );
  };

  // Handle car category selection
  const handleCarCategorySelection = async (selectionJson: string) => {
    try {
      const selection = JSON.parse(selectionJson);

      setBookingData(prev => ({
        ...prev,
        selectedCarCategoryId: selection.categoryId,
        selectedCarCategoryName: selection.categoryName,
        carEstimatedPrice: selection.grandTotal,
        selectedPackageName: selection.packageName || undefined,
      }));

      addUserMessage(`${selection.categoryName} - ₹${selection.grandTotal.toLocaleString()}`);

      // Show booking summary with price
      const tripTypeLabel = bookingData.carTripType === 'local' ? 'Local Trip' :
        bookingData.carTripType === 'airport' ? 'Airport Transfer' : 'Outstation Trip';

      addShiviMessage(
        `Excellent choice! 🎉\n\n🚗 ${selection.categoryName}\n📍 ${tripTypeLabel}\n💰 Estimated: ₹${selection.grandTotal.toLocaleString()}\n\nNow let me get your contact details to confirm the booking.`,
        undefined
      );

      // Move to contact details
      await askForContactDetails();
    } catch (error) {
      console.error('Failed to parse car category selection:', error);
      addShiviMessage("Something went wrong. Please try again.", [
        { label: 'Try Again', action: 'new-booking' },
      ]);
    }
  };

  // Handle car trip type selection (local/outstation/airport)
  const handleCarTripTypeSelection = async (tripType: 'local' | 'outstation' | 'airport') => {
    const tripLabels = {
      local: 'Local (Hourly Package)',
      outstation: 'Outstation Trip',
      airport: 'Airport Transfer',
    };

    addUserMessage(tripLabels[tripType]);
    setBookingData(prev => ({
      ...prev,
      carTripType: tripType,
      serviceType: tripType === 'airport' ? 'airport-transfer' :
        tripType === 'local' ? 'local-taxi' : 'outstation-car-rental',
    }));
    currentServiceTypeRef.current = tripType === 'airport' ? 'airport-transfer' :
      tripType === 'local' ? 'local-taxi' : 'outstation-car-rental';

    if (tripType === 'outstation') {
      // Ask for one-way or round-trip
      addShiviMessage(
        "How would you like to travel?",
        [
          { label: '🔄 Round Trip', action: 'select-car-mode', value: 'round-trip' },
          { label: '➡️ One Way', action: 'select-car-mode', value: 'one-way' },
        ]
      );
    } else if (tripType === 'airport') {
      // Ask for pickup or drop
      addShiviMessage(
        "What type of airport transfer do you need?",
        [
          { label: '🛬 Airport Pickup (Airport → City)', action: 'select-car-mode', value: 'pickup' },
          { label: '🛫 Airport Drop (City → Airport)', action: 'select-car-mode', value: 'drop' },
        ]
      );
    } else {
      // Local - ask for city directly
      setBookingData(prev => ({ ...prev, carMode: 'round-trip' }));
      addShiviMessage(
        "📍 Which city do you need a car?\n\n💡 Type to search or select below",
        locations.slice(0, 8).map(loc => ({
          label: loc.name,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search city...'
      );
      setBookingStep('pickup-location');
    }
  };

  // Handle car mode selection (one-way/round-trip or pickup/drop)
  const handleCarModeSelection = async (mode: 'one-way' | 'round-trip' | 'pickup' | 'drop') => {
    const modeLabels = {
      'one-way': 'One Way',
      'round-trip': 'Round Trip',
      'pickup': 'Airport Pickup',
      'drop': 'Airport Drop',
    };

    addUserMessage(modeLabels[mode]);
    setBookingData(prev => ({ ...prev, carMode: mode }));

    if (bookingData.carTripType === 'airport') {
      // For airport, first ask to select airport
      addShiviMessage(
        "🔍 Loading airports...",
        undefined
      );

      // Fetch airports
      const airportList = airports.length > 0 ? airports : await fetchAirports();

      if (airportList.length === 0) {
        addShiviMessage(
          "😔 No airports available. Please contact us for airport transfers.",
          [
            { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            { label: '🔄 Try Again', action: 'new-booking' },
          ]
        );
        return;
      }

      // Show airport options
      const airportOptions = airportList.slice(0, 6).map(apt => ({
        label: `✈️ ${apt.displayName || apt.name} (${apt.code})`,
        action: 'select-airport',
        value: JSON.stringify({
          id: apt.id,
          name: apt.name,
          code: apt.code,
          displayName: apt.displayName || apt.name,
          cityId: apt.cityId,
          city: apt.city,
        }),
      }));

      addShiviMessage(
        `✈️ Select the airport:`,
        airportOptions
      );
      setBookingStep('select-airport');
    } else {
      // For outstation, ask for pickup city
      addShiviMessage(
        "📍 Which city are you travelling from?\n\n💡 Type to search or select below",
        locations.slice(0, 8).map(loc => ({
          label: loc.name,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search pickup city...'
      );
      setBookingStep('pickup-location');
    }
  };

  // Handle airport selection for airport transfers
  const handleAirportSelection = async (airportJson: string) => {
    try {
      const airport = JSON.parse(airportJson);

      addUserMessage(`✈️ ${airport.displayName} (${airport.code})`);

      // Store airport info (don't set as pickupLocation yet - that needs to be a valid city)
      setBookingData(prev => ({
        ...prev,
        airportId: airport.id,
        airportName: airport.displayName || airport.name,
      }));

      const mode = bookingData.carMode;

      if (mode === 'pickup') {
        // Airport Pickup: Airport → City
        // Don't set pickupLocation to airport - we'll set it to city in handleAirportDestination
        addShiviMessage(
          `📍 Where do you want to go?\n\n💡 Select your destination city`,
          locations.slice(0, 8).map(loc => ({
            label: loc.name,
            action: 'select-airport-destination',
            value: loc.name,
          })),
          'text',
          '🔍 Search destination...'
        );
        setBookingStep('airport-destination');
      } else {
        // Airport Drop: City → Airport
        // Store airport as drop destination (for display)
        setBookingData(prev => ({
          ...prev,
          dropLocation: airport.displayName || airport.name,
          dropLocationId: airport.id,
        }));

        addShiviMessage(
          `📍 Where should we pick you up?\n\n💡 Select your pickup city`,
          locations.slice(0, 8).map(loc => ({
            label: loc.name,
            action: 'select-airport-pickup',
            value: loc.name,
          })),
          'text',
          '🔍 Search pickup location...'
        );
        setBookingStep('airport-pickup');
      }
    } catch (error) {
      console.error('Failed to parse airport selection:', error);
      addShiviMessage("Something went wrong. Please try again.", [
        { label: '🔄 Try Again', action: 'new-booking' },
      ]);
    }
  };

  // Handle airport destination city selection (for pickup mode)
  // Airport Pickup: Airport → City
  // For booking API: pickupCity should be the CITY (not airport) because API validates against Location table
  const handleAirportDestination = async (cityName: string) => {
    const selectedLocation = locations.find(loc =>
      loc.name.toLowerCase() === cityName.toLowerCase()
    );

    addUserMessage(cityName);

    // For airport pickup: city is the destination, but we need city in pickupCity for API
    // Store: pickupLocation = city (for API), dropLocation = airport name (for display)
    setBookingData(prev => ({
      ...prev,
      // For API: use city as pickup (API needs valid Location)
      pickupLocation: cityName,
      pickupLocationId: selectedLocation?.id?.toString() || '',
      // For display: airport is where we're coming from
      dropLocation: prev.airportName || 'Airport',
      // Keep airport ID for pricing API
      // airportId is already set
    }));

    const airportName = bookingData.airportName || 'Airport';

    // Now ask for date/time
    addShiviMessage(
      `✈️ ${airportName} → ${cityName} ✓\n\n📅 When is your flight arriving?`,
      [
        { label: '📅 Select Date & Time', action: 'open-calendar', value: 'pickup-date' },
      ],
      'text',
      'Click above to select date & time',
      'pickup-date'
    );
    setCalendarMode('datetime');
    setBookingStep('pickup-date');
    setShowDatePicker(true);
  };

  // Handle airport pickup city selection (for drop mode)
  const handleAirportPickup = async (cityName: string) => {
    const selectedLocation = locations.find(loc =>
      loc.name.toLowerCase() === cityName.toLowerCase()
    );

    addUserMessage(cityName);

    setBookingData(prev => ({
      ...prev,
      pickupLocation: cityName,
      pickupLocationId: selectedLocation?.id?.toString() || '',
    }));

    // Now ask for date/time
    addShiviMessage(
      `${cityName} → ✈️ ${bookingData.airportName} ✓\n\n📅 When do you need the cab?`,
      [
        { label: '📅 Select Date & Time', action: 'open-calendar', value: 'pickup-date' },
      ],
      'text',
      'Click above to select date & time',
      'pickup-date'
    );
    setCalendarMode('datetime');
    setBookingStep('pickup-date');
    setShowDatePicker(true);
  };

  // Handle local package selection
  const handleLocalPackageSelection = async (packageJson: string) => {
    try {
      const pkg = JSON.parse(packageJson);

      setBookingData(prev => ({
        ...prev,
        selectedPackageId: pkg.id,
        selectedPackageName: `${pkg.hours}hrs/${pkg.kms}km`,
      }));

      addUserMessage(`${pkg.hours} Hours / ${pkg.kms} Km`);

      // Now fetch pricing for all categories with this package
      addShiviMessage(
        "🔍 Finding best prices for you...",
        undefined
      );

      const categories = await fetchCarCategories();
      if (categories.length === 0) {
        addShiviMessage(
          "😔 No cars available. Please try again later or contact us.",
          [
            { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            { label: '🔄 Try Again', action: 'new-booking' },
          ]
        );
        return;
      }

      setCarCategories(categories);

      // Fetch pricing for each category with selected package
      const pricing = await fetchCarPricing('local', categories, {
        packageId: pkg.id,
        fromLocationId: bookingData.pickupLocationId,
        pickupTime: convertTo24Hour(bookingData.pickupTime || '09:00'),
      });

      showCarCategoryOptions(categories, pricing);
    } catch (error) {
      console.error('Failed to parse package selection:', error);
      addShiviMessage("Something went wrong. Please try again.", [
        { label: '🔄 Try Again', action: 'new-booking' },
      ]);
    }
  };

  // ============ PACKERS & MOVERS HANDLERS ============

  // Handle packers shifting type selection (home/office/vehicle)
  const handlePackersTypeSelection = async (shiftingType: 'home' | 'office' | 'vehicle') => {
    const typeLabels = {
      home: '🏠 Home Shifting',
      office: '🏢 Office Shifting',
      vehicle: '🚗 Vehicle Transport',
    };

    addUserMessage(typeLabels[shiftingType]);
    setBookingData(prev => ({ ...prev, packersShiftingType: shiftingType }));

    // Ask for pickup city
    addShiviMessage(
      "📍 Where are you shifting from?\n\nSelect your current city:",
      locations.slice(0, 8).map(loc => ({
        label: loc.name,
        action: 'select-location',
        value: loc.name,
      })),
      'text',
      '🔍 Search city...'
    );
    setBookingStep('pickup-location');
  };

  // Handle packers property/vehicle size selection
  const handlePackersSizeSelection = async (size: string) => {
    addUserMessage(size);
    setBookingData(prev => ({ ...prev, packersPropertySize: size }));

    // Ask for date
    addShiviMessage(
      "📅 When do you want to shift?",
      [
        { label: '📅 Select Date', action: 'open-calendar', value: 'pickup-date' },
      ],
      'text',
      'Click above to select date',
      'pickup-date'
    );
    setCalendarMode('date');
    setBookingStep('pickup-date');
    setShowDatePicker(true);
  };

  // ============ LUXURY CAR HANDLERS ============

  // Handle luxury car trip type selection
  const handleLuxuryTripTypeSelection = async (tripType: 'local' | 'outstation' | 'airport') => {
    const tripLabels = {
      local: 'Local (Hourly Package)',
      outstation: 'Outstation Trip',
      airport: 'Airport Transfer',
    };

    addUserMessage(tripLabels[tripType]);
    setBookingData(prev => ({
      ...prev,
      luxuryTripType: tripType,
      serviceType: tripType === 'airport' ? 'luxury-airport-transfer' :
        tripType === 'local' ? 'luxury-local' : 'luxury-outstation',
    }));
    currentServiceTypeRef.current = tripType === 'airport' ? 'luxury-airport-transfer' :
      tripType === 'local' ? 'luxury-local' : 'luxury-outstation';

    if (tripType === 'outstation') {
      // Ask for one-way or round-trip
      addShiviMessage(
        "How would you like to travel?",
        [
          { label: '🔄 Round Trip', action: 'select-luxury-mode', value: 'round-trip' },
          { label: '➡️ One Way', action: 'select-luxury-mode', value: 'one-way' },
        ]
      );
    } else if (tripType === 'airport') {
      // Ask for pickup or drop
      addShiviMessage(
        "What type of airport transfer?",
        [
          { label: '🛬 Airport Pickup', action: 'select-luxury-mode', value: 'pickup' },
          { label: '🛫 Airport Drop', action: 'select-luxury-mode', value: 'drop' },
        ]
      );
    } else {
      // Local - ask for city directly
      setBookingData(prev => ({ ...prev, luxuryMode: 'round-trip' }));
      addShiviMessage(
        "📍 Which city do you need a luxury car?",
        locations.slice(0, 8).map(loc => ({
          label: loc.name,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search city...'
      );
      setBookingStep('pickup-location');
    }
  };

  // Handle luxury car mode selection (one-way/round-trip or pickup/drop)
  const handleLuxuryModeSelection = async (mode: 'one-way' | 'round-trip' | 'pickup' | 'drop') => {
    const modeLabels = {
      'one-way': 'One Way',
      'round-trip': 'Round Trip',
      'pickup': 'Airport Pickup',
      'drop': 'Airport Drop',
    };

    addUserMessage(modeLabels[mode]);
    setBookingData(prev => ({ ...prev, luxuryMode: mode }));

    if (bookingData.luxuryTripType === 'airport') {
      // Fetch airports for airport transfer
      addShiviMessage("🔍 Loading airports...", undefined);

      const airportList = airports.length > 0 ? airports : await fetchAirports();

      if (airportList.length === 0) {
        addShiviMessage(
          "😔 No airports available. Please contact us.",
          [
            { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            { label: '🔄 Try Again', action: 'new-booking' },
          ]
        );
        return;
      }

      // Show airport options
      const airportOptions = airportList.slice(0, 6).map(apt => ({
        label: `✈️ ${apt.displayName || apt.name} (${apt.code})`,
        action: 'select-airport',
        value: JSON.stringify({
          id: apt.id,
          name: apt.name,
          code: apt.code,
          displayName: apt.displayName || apt.name,
          cityId: apt.cityId,
          city: apt.city,
        }),
      }));

      addShiviMessage(`✈️ Select the airport:`, airportOptions);
      setBookingStep('select-airport');
    } else {
      // Outstation - ask for pickup city
      addShiviMessage(
        "📍 Which city are you travelling from?",
        locations.slice(0, 8).map(loc => ({
          label: loc.name,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search pickup city...'
      );
      setBookingStep('pickup-location');
    }
  };

  // Handle luxury vehicle category selection
  const handleLuxuryCategorySelection = async (categoryJson: string) => {
    try {
      const category = JSON.parse(categoryJson);

      setBookingData(prev => ({
        ...prev,
        luxuryVehicleCategory: category.name,
        selectedCarCategoryId: category.id,
        selectedCarCategoryName: category.name,
      }));

      addUserMessage(`${category.name}`);

      // Ask for vehicle preference
      await askForLuxuryVehiclePreference();
    } catch (error) {
      console.error('Failed to parse luxury category:', error);
      addShiviMessage("Something went wrong. Please try again.", [
        { label: '🔄 Try Again', action: 'new-booking' },
      ]);
    }
  };

  // Ask for luxury vehicle category
  const askForLuxuryVehicleCategory = async () => {
    addShiviMessage(
      "👑 What type of luxury vehicle do you prefer?",
      [
        { label: '🚗 Premium Sedan', action: 'select-luxury-category', value: JSON.stringify({ id: 'premium-sedan', name: 'Premium Sedan' }) },
        { label: '🚙 Luxury SUV', action: 'select-luxury-category', value: JSON.stringify({ id: 'luxury-suv', name: 'Luxury SUV' }) },
        { label: '🏎️ Sports Car', action: 'select-luxury-category', value: JSON.stringify({ id: 'sports-car', name: 'Sports Car' }) },
        { label: '🚐 Luxury Van', action: 'select-luxury-category', value: JSON.stringify({ id: 'luxury-van', name: 'Luxury Van' }) },
      ]
    );
    setBookingStep('luxury-category');
  };

  // Ask for luxury vehicle preference (specific model)
  const askForLuxuryVehiclePreference = async () => {
    const category = bookingData.luxuryVehicleCategory || 'Premium Sedan';

    // Different models based on category
    const modelOptions: Record<string, { label: string; value: string }[]> = {
      'Premium Sedan': [
        { label: 'Mercedes E-Class', value: 'Mercedes E-Class' },
        { label: 'BMW 5 Series', value: 'BMW 5 Series' },
        { label: 'Audi A6', value: 'Audi A6' },
        { label: 'Jaguar XF', value: 'Jaguar XF' },
      ],
      'Luxury SUV': [
        { label: 'Mercedes GLS', value: 'Mercedes GLS' },
        { label: 'BMW X5', value: 'BMW X5' },
        { label: 'Audi Q7', value: 'Audi Q7' },
        { label: 'Range Rover', value: 'Range Rover' },
      ],
      'Sports Car': [
        { label: 'Porsche 911', value: 'Porsche 911' },
        { label: 'Ferrari', value: 'Ferrari' },
        { label: 'Lamborghini', value: 'Lamborghini' },
        { label: 'BMW M4', value: 'BMW M4' },
      ],
      'Luxury Van': [
        { label: 'Mercedes V-Class', value: 'Mercedes V-Class' },
        { label: 'Toyota Vellfire', value: 'Toyota Vellfire' },
        { label: 'Mercedes Sprinter', value: 'Mercedes Sprinter' },
      ],
    };

    const models = modelOptions[category] || modelOptions['Premium Sedan'];

    addShiviMessage(
      `🚗 Preferred ${category} model?\n\n(Optional - Skip if you don't have a preference)`,
      [
        ...models.map(m => ({
          label: m.label,
          action: 'select-luxury-preference',
          value: m.value,
        })),
        { label: '⏭️ Skip - Any Available', action: 'select-luxury-preference', value: 'any' },
      ]
    );
    setBookingStep('luxury-preference');
  };

  // Handle luxury vehicle preference selection
  const handleLuxuryVehiclePreference = async (preference: string) => {
    if (preference !== 'any') {
      addUserMessage(preference);
      setBookingData(prev => ({ ...prev, luxuryVehiclePreference: preference }));
    } else {
      addUserMessage('Any Available');
    }

    // Ask for occasion
    await askForLuxuryOccasion();
  };

  // Ask for luxury occasion
  const askForLuxuryOccasion = async () => {
    addShiviMessage(
      "🎉 What's the occasion?\n\n(Optional - Helps us serve you better)",
      [
        { label: '💒 Wedding', action: 'select-luxury-occasion', value: 'Wedding' },
        { label: '💼 Corporate', action: 'select-luxury-occasion', value: 'Corporate' },
        { label: '✈️ Airport Transfer', action: 'select-luxury-occasion', value: 'Airport Transfer' },
        { label: '🎉 Party/Event', action: 'select-luxury-occasion', value: 'Party/Event' },
        { label: '💝 Romantic Date', action: 'select-luxury-occasion', value: 'Romantic Date' },
        { label: '📸 Photoshoot', action: 'select-luxury-occasion', value: 'Photoshoot' },
        { label: '⏭️ Skip', action: 'select-luxury-occasion', value: 'skip' },
      ]
    );
    setBookingStep('luxury-occasion');
  };

  // Handle luxury occasion selection
  const handleLuxuryOccasion = async (occasion: string) => {
    if (occasion !== 'skip') {
      addUserMessage(occasion);
      setBookingData(prev => ({ ...prev, luxuryOccasion: occasion }));
    } else {
      addUserMessage('Skipped');
    }

    // Ask for decoration
    await askForLuxuryDecoration();
  };

  // Ask for car decoration
  const askForLuxuryDecoration = async () => {
    addShiviMessage(
      "🎀 Do you need car decoration?",
      [
        { label: '✅ Yes, I need decoration', action: 'select-luxury-decoration', value: 'yes' },
        { label: '❌ No decoration needed', action: 'select-luxury-decoration', value: 'no' },
      ]
    );
    setBookingStep('luxury-decoration');
  };

  // Handle luxury decoration selection
  const handleLuxuryDecoration = async (needDecoration: string) => {
    const needs = needDecoration === 'yes';
    addUserMessage(needs ? 'Yes, I need decoration' : 'No decoration needed');
    setBookingData(prev => ({ ...prev, luxuryNeedDecoration: needs }));

    // Ask for pickup address
    await askForLuxuryPickupAddress();
  };

  // Ask for pickup address
  const askForLuxuryPickupAddress = async () => {
    addShiviMessage(
      "📍 Please enter the complete pickup address with landmark:",
      undefined,
      'text',
      'Enter pickup address (e.g., 123 Main Street, Near City Mall)'
    );
    setBookingStep('luxury-pickup-address');
  };

  // Handle luxury pickup address
  const handleLuxuryPickupAddress = async (address: string) => {
    addUserMessage(address);
    setBookingData(prev => ({ ...prev, luxuryPickupAddress: address }));

    // Ask for contact details with special requirements
    await askForContactDetails();
  };

  // Show fleet vehicles in chat
  const showFleetOptions = (vehicles: FleetVehicle[]) => {
    if (vehicles.length === 0) {
      addShiviMessage(
        "Sorry, no vehicles available at this location for the selected dates. 😔\n\nWould you like to try a different location or dates?",
        [
          { label: '📍 Change Location', action: 'new-booking' },
          { label: '📅 Change Dates', action: 'open-calendar', value: 'pickup-date' },
        ]
      );
      return;
    }

    setAvailableFleet(vehicles);
    setBookingStep('select-vehicle');

    // Show top 5 vehicles with prices
    const topVehicles = vehicles.slice(0, 5);
    const vehicleOptions = topVehicles.map(v => ({
      label: `${v.brandName} ${v.name} - ₹${v.lowestPrice}/day`,
      action: 'select-vehicle',
      value: v.id,
    }));

    // Calculate total days for pricing info
    let totalDays = 1;
    if (bookingData.pickupDate && bookingData.returnDate) {
      const pickup = new Date(bookingData.pickupDate);
      const returnDate = new Date(bookingData.returnDate);
      totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const serviceLabel = BROWSE_FIRST_SERVICES.includes(currentServiceTypeRef.current) &&
      currentServiceTypeRef.current.includes('bike') ? 'bikes' : 'cars';

    addShiviMessage(
      `🚗 Found ${vehicles.length} ${serviceLabel} available!\n\n📅 Duration: ${totalDays} day${totalDays > 1 ? 's' : ''}\n\nSelect a vehicle to see vendor prices:`,
      [
        ...vehicleOptions,
        ...(vehicles.length > 5 ? [{ label: `View all ${vehicles.length} options...`, action: 'show-all-vehicles' }] : []),
      ]
    );
  };

  // Handle vehicle selection - show vendor prices
  const handleVehicleSelection = async (vehicleId: string) => {
    const vehicle = availableFleet.find(v => v.id === vehicleId);
    if (!vehicle) return;

    addUserMessage(`${vehicle.brandName} ${vehicle.name}`);

    // Calculate total for display
    let totalDays = 1;
    if (bookingData.pickupDate && bookingData.returnDate) {
      const pickup = new Date(bookingData.pickupDate);
      const returnDate = new Date(bookingData.returnDate);
      totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
    }

    if (vehicle.vendorPrices.length === 0) {
      addShiviMessage(
        "No vendors available for this vehicle. Please select another.",
        availableFleet.slice(0, 5).map(v => ({
          label: `${v.brandName} ${v.name} - ₹${v.lowestPrice}/day`,
          action: 'select-vehicle',
          value: v.id,
        }))
      );
      return;
    }

    // Show vendor prices for this vehicle
    setBookingStep('select-vendor');

    const vendorOptions = vehicle.vendorPrices.slice(0, 4).map(vp => {
      const total = vp.dailyRate * totalDays;
      const gst = Math.round(total * 0.18);
      const grandTotal = total + gst;
      return {
        label: `${vp.vendorName} - ₹${vp.dailyRate}/day (Total: ₹${grandTotal})${vp.isVerified ? ' ✓' : ''}`,
        action: 'select-vendor-price',
        value: JSON.stringify({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brandName} ${vehicle.name}`,
          vendorId: vp.vendorId,
          vendorFleetId: vp.vendorFleetId,
          dailyRate: vp.dailyRate,
          deposit: vp.deposit,
        }),
      };
    });

    addShiviMessage(
      `${vehicle.brandName} ${vehicle.name}\n\n📅 ${totalDays} day${totalDays > 1 ? 's' : ''}\n\nSelect a vendor:`,
      [
        ...vendorOptions,
        { label: '← Back to vehicles', action: 'back-to-vehicles' },
      ]
    );
  };

  // Handle vendor price selection
  const handleVendorPriceSelection = async (selectionJson: string) => {
    try {
      const selection = JSON.parse(selectionJson);

      setBookingData(prev => ({
        ...prev,
        selectedVehicleId: selection.vehicleId,
        selectedVehicleName: selection.vehicleName,
        selectedVendorId: selection.vendorId,
        selectedVendorFleetId: selection.vendorFleetId,
        selectedDailyRate: selection.dailyRate,
        selectedDeposit: selection.deposit,
      }));

      addUserMessage(`Selected: ${selection.vehicleName} @ ₹${selection.dailyRate}/day`);

      // Calculate totals for display
      let totalDays = 1;
      if (bookingData.pickupDate && bookingData.returnDate) {
        const pickup = new Date(bookingData.pickupDate);
        const returnDate = new Date(bookingData.returnDate);
        totalDays = Math.max(1, Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
      }

      const totalAmount = selection.dailyRate * totalDays;
      const grandTotal = totalAmount + (selection.deposit || 0);
      const advanceAmount = Math.round(totalAmount * 0.3);

      addShiviMessage(
        `Excellent choice! 🎉\n\n🚗 ${selection.vehicleName}\n📅 ${totalDays} day${totalDays > 1 ? 's' : ''}\n\n💰 Price Breakdown:\n• Daily Rate: ₹${selection.dailyRate}\n• Rental Amount: ₹${totalAmount}\n• Security Deposit: ₹${selection.deposit || 0}\n• Grand Total: ₹${grandTotal}\n\n💳 Advance Payment: ₹${advanceAmount} (30%)\n\nNow let me get your contact details to confirm the booking.`,
        undefined
      );

      // Move to contact details
      await askForContactDetails();
    } catch (error) {
      console.error('Failed to parse vendor selection:', error);
      addShiviMessage("Something went wrong. Please try again.", [
        { label: 'Try Again', action: 'back-to-vehicles' },
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Track chat opened
      trackChatOpened();

      // Save visit timestamp
      localStorage.setItem('shivi_last_visit', new Date().toISOString());

      // God-level: Smart greeting with context - Professional buttons
      addShiviMessage(
        getSmartGreeting(),
        [
          { label: 'Car Rental', action: 'start-booking', value: 'car' },
          { label: 'Self-Drive Car', action: 'start-booking', value: 'selfdrive' },
          { label: 'Luxury Car', action: 'start-booking', value: 'luxury' },
          { label: 'Bike Rental', action: 'start-booking', value: 'bike' },
          { label: 'Bus Rental', action: 'start-booking', value: 'bus' },
          { label: 'Truck Rental', action: 'start-booking', value: 'truck' },
          { label: 'Packers & Movers', action: 'start-booking', value: 'packers' },
          { label: 'Equipment Rental', action: 'start-booking', value: 'equipment' },
          { label: 'Download App', action: 'download-app' },
          { label: 'About Backr Tokens', action: 'about-backr' },
        ]
      );

      // Auto-focus input for better UX
      setTimeout(() => inputRef.current?.focus(), 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showDatePicker) {
      setTempDate(bookingData.pickupDate || bookingData.returnDate || '');
      setTempTime(bookingData.pickupTime || bookingData.returnTime || '09:00');
      setCalendarError('');
    }
  }, [
    showDatePicker,
    bookingData.pickupDate,
    bookingData.returnDate,
    bookingData.pickupTime,
    bookingData.returnTime,
  ]);

  useEffect(() => {
    if (!customer) return;

    setBookingData((prev) => {
      const updates: Partial<BookingData> = {};
      if (!prev.name && customer.name) updates.name = customer.name;
      if (!prev.email && customer.email) updates.email = customer.email;
      if (!prev.phone && customer.phone) updates.phone = customer.phone;
      if (!Object.keys(updates).length) return prev;
      return { ...prev, ...updates };
    });
  }, [customer]);

  const generateMessageId = () => `${Date.now()}-${++messageIdRef.current}`;

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addShiviMessage = (
    content: string,
    options?: { label: string; action: string; value?: string }[],
    inputType?: 'text' | 'date' | 'datetime' | 'tel' | 'email' | 'location',
    placeholder?: string,
    waitingFor?: string
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      const message: Message = {
        id: generateMessageId(),
        type: 'shivi',
        content,
        timestamp: new Date(),
        options,
        inputType,
        placeholder,
        waitingFor,
      };
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    }, 800);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);

    // Track user message
    trackUserMessage(inputValue, bookingStep);

    // Handle based on current booking step
    if (bookingStep === 'pickup-location') {
      await handlePickupLocation(inputValue);
    } else if (bookingStep === 'drop-location') {
      await handleDropLocation(inputValue);
    } else if (bookingStep === 'pickup-date') {
      await handlePickupDate(inputValue);
    } else if (bookingStep === 'pickup-time') {
      await handlePickupTime(inputValue);
    } else if (bookingStep === 'return-date') {
      await handleReturnDate(inputValue);
    } else if (bookingStep === 'return-time') {
      await handleReturnTime(inputValue);
    } else if (bookingStep === 'name') {
      await handleName(inputValue);
    } else if (bookingStep === 'phone') {
      await handlePhone(inputValue);
    } else if (bookingStep === 'email') {
      await handleEmail(inputValue);
    } else if (bookingStep === 'requirements') {
      await handleRequirements(inputValue);
    } else if (bookingStep === 'luxury-pickup-address') {
      await handleLuxuryPickupAddress(inputValue);
    } else {
      // If not in a booking flow, check knowledge base
      await searchKnowledgeBase(inputValue);
    }

    setInputValue('');
  };

  const formatTimeLabel = (value: string) => {
    if (!value) return '';
    try {
      const date = new Date(`1970-01-01T${value}`);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return value;
    }
  };

  const handleCalendarToggle = () => {
    const mode = bookingStep?.includes('date')
      ? 'date'
      : bookingStep?.includes('time')
        ? 'time'
        : 'datetime';
    setCalendarMode(mode);
    setShowDatePicker((prev) => !prev);
    setCalendarError('');
  };

  const handleCalendarConfirm = async () => {
    setCalendarError('');

    if (!bookingStep) {
      setCalendarError('Start a booking flow so I can capture dates and times.');
      return;
    }

    const dateSteps = ['pickup-date', 'return-date'];
    const timeSteps = ['pickup-time', 'return-time'];

    if (dateSteps.includes(bookingStep)) {
      if (!tempDate) {
        setCalendarError('Please select a date.');
        return;
      }

      const validation = validateDate(tempDate);
      if (!validation.valid) {
        setCalendarError(validation.message ?? 'Please choose a valid date.');
        return;
      }

      if (bookingStep === 'return-date' && bookingData.pickupDate && tempDate < bookingData.pickupDate) {
        setCalendarError('Return date must be on or after your pickup date.');
        return;
      }

      setBookingData((prev) => ({
        ...prev,
        pickupDate: bookingStep === 'pickup-date' ? tempDate : prev.pickupDate,
        returnDate: bookingStep === 'return-date' ? tempDate : prev.returnDate,
      }));

      const nextStep = bookingStep === 'pickup-date' ? 'pickup-time' : 'return-time';
      setTempTime('09:00');
      setCalendarMode('time');
      setBookingStep(nextStep);
      addShiviMessage(
        nextStep === 'pickup-time'
          ? 'Great! Now pick your pickup time.'
          : 'Perfect! Please choose the return time.',
        undefined,
        'text',
        'Select a time',
        nextStep
      );
      setShowDatePicker(true);
      return;
    }

    if (timeSteps.includes(bookingStep)) {
      if (!tempTime) {
        setCalendarError('Please select a time.');
        return;
      }

      const formattedTime = formatTimeLabel(tempTime) || tempTime;
      setShowDatePicker(false);
      setInputValue('');

      if (bookingStep === 'pickup-time') {
        await handlePickupDateTime(bookingData.pickupDate || tempDate, formattedTime);
      } else {
        await handleReturnDateTime(bookingData.returnDate || tempDate, formattedTime);
      }
      return;
    }

    setCalendarError('Start a booking flow so I can capture dates and times.');
  };

  const handleOptionClick = async (action: string, value?: string) => {
    // Track option selection
    trackOptionSelected(action, value);

    if (action === 'start-booking') {
      await startBooking(value!);
    } else if (action === 'select-service-type') {
      await selectServiceType(value!);
    } else if (action === 'select-location') {
      if (bookingStep === 'pickup-location') {
        await handlePickupLocation(value!);
      } else if (bookingStep === 'drop-location') {
        await handleDropLocation(value!);
      }
    } else if (action === 'skip-drop') {
      await skipDropLocation();
    } else if (action === 'add-requirements') {
      await askForRequirements();
    } else if (action === 'skip-requirements') {
      await submitBooking();
    } else if (action === 'confirm-booking') {
      await submitBooking();
    } else if (action === 'new-booking') {
      resetBooking();
    } else if (action === 'show-booking-options') {
      addUserMessage('I want to book a vehicle');
      addShiviMessage(
        "Great! What would you like to rent?",
        [
          { label: '🚗 Car Rental', action: 'start-booking', value: 'car' },
          { label: '🚙 Self-Drive Car', action: 'start-booking', value: 'selfdrive' },
          { label: '👑 Luxury Car', action: 'start-booking', value: 'luxury' },
          { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
          { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
          { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
          { label: '📦 Packers & Movers', action: 'start-booking', value: 'packers' },
          { label: '🏗️ Equipment Rental', action: 'start-booking', value: 'equipment' },
        ]
      );
    } else if (action === 'ask-question') {
      addUserMessage('I have another question');
      addShiviMessage(
        "Sure! What would you like to know? Just type your question below.",
        undefined,
        'text',
        'Type your question...'
      );
    } else if (action === 'ask-pricing') {
      addUserMessage('Tell me about pricing');
      await searchKnowledgeBase('pricing');
    } else if (action === 'ask-locations') {
      addUserMessage('Where do you operate?');
      await searchKnowledgeBase('locations cities where');
    } else if (action === 'select-time') {
      // God-level: Quick time selection
      addUserMessage(value!);
      await handlePickupTime(value!);
    } else if (action === 'custom-time') {
      // God-level: Custom time input
      addUserMessage('I want to enter a custom time');
      addShiviMessage(
        "Sure! Please enter your preferred pickup time:",
        undefined,
        'text',
        'e.g., 10:30 AM',
        'pickup-time'
      );
    } else if (action === 'use-suggested-date') {
      // God-level: Use AI-suggested date
      addUserMessage(value!);
      await handlePickupDate(value!);
    } else if (action === 'download-app') {
      // App download promotion - Professional version
      addUserMessage('Tell me about the app');
      addShiviMessage(
        "TransRentals App – Your Travel Companion\n\nWhy Download?\n\n• Instant Bookings – Book in 30 seconds\n• Earn Backr Tokens – Get rewards on every booking\n• Exclusive App-Only Deals – Save up to 30%\n• Real-Time Tracking – Track your rides live\n• 24/7 Chat Support – Direct help anytime\n• Welcome Bonus – Earn FREE Backr Tokens\n\nAvailable on Android:",
        [
          // { label: 'Download iOS App', action: 'app-ios' },
          { label: 'Download Android App', action: 'app-android' },
          { label: 'Continue Booking', action: 'show-booking-options' },
        ]
      );
    } else if (action === 'about-backr') {
      // Backr tokens explanation - Professional version
      addUserMessage('What are Backr Tokens?');
      addShiviMessage(
        "Backr Tokens – Your Travel Rewards\n\nBackr is our loyalty token that you earn with every booking.\n\nHow to Earn:\n• Up to 100 tokens per completed trip\n• Bonus tokens on referrals\n• Special rewards via app\n\nHow to Use:\n• 1 token = ₹1 discount\n• Use on any service\n• Tokens never expire\n\nSpecial Perks:\n• Priority customer support\n• Early access to new vehicles\n• Exclusive seasonal offers\n\nDownload our app to track your tokens.",
        [
          { label: 'Download App', action: 'download-app' },
          { label: 'Start Booking', action: 'show-booking-options' },
        ]
      );
    } else if (action === 'app-ios') {
      addUserMessage('Download iOS App');
      window.open('https://apps.apple.com/app/transrentals', '_blank');
      addShiviMessage(
        "Opening App Store...\n\nDownload the TransRentals app and earn FREE Backr Tokens!\n\nReady to book now?",
        [
          { label: 'Yes, Book Now', action: 'show-booking-options' },
          { label: 'Ask a Question', action: 'ask-question' },
        ]
      );
    } else if (action === 'app-android') {
      addUserMessage('Download Android App');
      const androidAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_ANDROID || 'https://play.google.com/store/apps/details?id=com.transrentals.customer';
      window.open(androidAppUrl, '_blank');
      addShiviMessage(
        "Opening Play Store...\n\nDownload the TransRentals app and earn FREE Backr Tokens!\n\nReady to book now?",
        [
          { label: 'Yes, Book Now', action: 'show-booking-options' },
          { label: 'Ask a Question', action: 'ask-question' },
        ]
      );
    } else if (action === 'go-home') {
      window.location.href = '/';
    } else if (action === 'open-calendar') {
      setCalendarError('');
      setShowDatePicker(true);
      if (value) {
        setBookingStep(value);
      }
    } else if (action === 'select-vehicle') {
      // Handle vehicle selection from fleet
      await handleVehicleSelection(value!);
    } else if (action === 'select-vendor-price') {
      // Handle vendor price selection
      await handleVendorPriceSelection(value!);
    } else if (action === 'back-to-vehicles') {
      // Go back to vehicle list
      addUserMessage('Back to vehicles');
      showFleetOptions(availableFleet);
    } else if (action === 'show-all-vehicles') {
      // Show all available vehicles
      addUserMessage('Show all vehicles');
      const allVehicleOptions = availableFleet.map(v => ({
        label: `${v.brandName} ${v.name} - ₹${v.lowestPrice}/day`,
        action: 'select-vehicle',
        value: v.id,
      }));
      addShiviMessage(
        `All ${availableFleet.length} vehicles available:`,
        allVehicleOptions
      );
    } else if (action === 'go-to-dashboard') {
      // Redirect to customer dashboard
      router.push('/customer/dashboard');
      setIsOpen(false);
    } else if (action === 'select-car-category') {
      // Handle car category selection
      await handleCarCategorySelection(value!);
    } else if (action === 'select-car-trip-type') {
      // Handle car rental trip type selection
      await handleCarTripTypeSelection(value as 'local' | 'outstation' | 'airport');
    } else if (action === 'select-car-mode') {
      // Handle car rental mode selection (one-way/round-trip or pickup/drop)
      await handleCarModeSelection(value as 'one-way' | 'round-trip' | 'pickup' | 'drop');
    } else if (action === 'select-local-package') {
      // Handle local package selection
      await handleLocalPackageSelection(value!);
    } else if (action === 'select-airport') {
      // Handle airport selection for airport transfers
      await handleAirportSelection(value!);
    } else if (action === 'select-airport-destination') {
      // Handle destination city selection after airport (pickup mode)
      await handleAirportDestination(value!);
    } else if (action === 'select-airport-pickup') {
      // Handle pickup city selection before airport (drop mode)
      await handleAirportPickup(value!);
    } else if (action === 'select-packers-type') {
      // Handle packers shifting type selection
      await handlePackersTypeSelection(value as 'home' | 'office' | 'vehicle');
    } else if (action === 'select-packers-size') {
      // Handle packers property/vehicle size selection
      await handlePackersSizeSelection(value!);
    } else if (action === 'select-luxury-trip-type') {
      // Handle luxury car trip type selection
      await handleLuxuryTripTypeSelection(value as 'local' | 'outstation' | 'airport');
    } else if (action === 'select-luxury-mode') {
      // Handle luxury car mode selection
      await handleLuxuryModeSelection(value as 'one-way' | 'round-trip' | 'pickup' | 'drop');
    } else if (action === 'select-luxury-category') {
      // Handle luxury vehicle category selection
      await handleLuxuryCategorySelection(value!);
    } else if (action === 'select-luxury-preference') {
      // Handle luxury vehicle preference (model) selection
      await handleLuxuryVehiclePreference(value!);
    } else if (action === 'select-luxury-occasion') {
      // Handle luxury occasion selection
      await handleLuxuryOccasion(value!);
    } else if (action === 'select-luxury-decoration') {
      // Handle luxury decoration selection
      await handleLuxuryDecoration(value!);
    }
  };

  const startBooking = async (serviceType: string) => {
    const serviceNames: Record<string, string> = {
      car: 'Car',
      bike: 'Bike',
      bus: 'Bus',
      truck: 'Truck',
      equipment: 'Equipment',
      selfdrive: 'Self-Drive Car',
      luxury: 'Luxury Car',
      packers: 'Packers & Movers',
    };

    addUserMessage(`${serviceNames[serviceType] || serviceType}`);

    // Track booking started
    trackBookingStarted(serviceType);

    setBookingData({ serviceType, serviceName: serviceNames[serviceType] });

    // Special handling for services that go directly to city selection
    if (serviceType === 'selfdrive') {
      // Self-Drive: City → Fleet Selection → Dates → Contact
      addShiviMessage(
        "🚙 Self-Drive Car - Drive Yourself!\n\n📍 Which city do you need the car?",
        locations.slice(0, 8).map((loc) => ({
          label: `${loc.name}`,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search city...'
      );
      currentServiceTypeRef.current = 'self-drive-rental';
      setBookingStep('pickup-location');
      return;
    }

    if (serviceType === 'packers') {
      // Packers: Shifting Type → From/To → Size → Date → Contact
      addShiviMessage(
        "📦 Packers & Movers\n\nWhat are you shifting?",
        [
          { label: '🏠 Home Shifting', action: 'select-packers-type', value: 'home' },
          { label: '🏢 Office Shifting', action: 'select-packers-type', value: 'office' },
          { label: '🚗 Vehicle Transport', action: 'select-packers-type', value: 'vehicle' },
        ]
      );
      currentServiceTypeRef.current = 'packers-and-movers';
      setBookingStep('packers-type');
      return;
    }

    if (serviceType === 'luxury') {
      // Luxury: Same as car but goes to luxury booking
      addShiviMessage(
        "👑 Luxury Car Rental\n\nWhat type of trip?",
        [
          { label: '🏙️ Local (Hourly Package)', action: 'select-luxury-trip-type', value: 'local' },
          { label: '🛣️ Outstation Trip', action: 'select-luxury-trip-type', value: 'outstation' },
          { label: '✈️ Airport Transfer', action: 'select-luxury-trip-type', value: 'airport' },
        ]
      );
      currentServiceTypeRef.current = 'luxury-car-rental';
      setBookingStep('luxury-trip-type');
      return;
    }

    const article = serviceType === 'equipment' ? '' : 'a ';
    addShiviMessage(
      `Great choice! Let me help you book ${article}${serviceNames[serviceType].toLowerCase()}. 🎯\n\nWhat type of ${serviceNames[serviceType].toLowerCase()} do you need?`,
      getServiceTypeOptions(serviceType)
    );
  };

  const getServiceTypeOptions = (serviceType: string) => {
    const options: Record<string, any[]> = {
      car: [
        { label: '🏙️ Local (Hourly Package)', action: 'select-car-trip-type', value: 'local' },
        { label: '🛣️ Outstation (One-Way/Round Trip)', action: 'select-car-trip-type', value: 'outstation' },
        { label: '✈️ Airport Transfer', action: 'select-car-trip-type', value: 'airport' },
      ],
      bike: [
        { label: '🏍️ Regular Bike', action: 'select-service-type', value: 'bike-on-rent' },
        { label: '🛵 Activa / Scooter', action: 'select-service-type', value: 'activa-on-rent' },
        { label: '👑 Royal Enfield', action: 'select-service-type', value: 'royal-enfield-on-rent' },
      ],
      bus: [
        { label: '🚌 Bus Rental', action: 'select-service-type', value: 'bus-rental' },
        { label: '🚐 Tempo Traveller', action: 'select-service-type', value: 'tempo-traveller' },
        { label: '💼 Corporate Bus Rental', action: 'select-service-type', value: 'corporate-bus-rental' },
        { label: '💒 Wedding Bus Rental', action: 'select-service-type', value: 'wedding-bus-rental' },
      ],
      truck: [
        { label: '🚚 Mini Truck Rental', action: 'select-service-type', value: 'mini-truck-rental' },
        { label: '📦 Packers and Movers', action: 'select-service-type', value: 'packers-and-movers' },
        { label: '🚛 Transporter', action: 'select-service-type', value: 'transporter' },
        { label: '🚛 Trailer Rental', action: 'select-service-type', value: 'trailer-on-rent' },
      ],
      equipment: [
        { label: '🏗️ Equipment Rental', action: 'select-service-type', value: 'equipment-rental' },
        { label: '🚜 JCB / Excavator', action: 'select-service-type', value: 'jcb-on-rent' },
      ],
    };

    return options[serviceType] || [];
  };

  const selectServiceType = async (subType: string) => {
    // Update serviceType with the full service name
    // Also update ref immediately (avoids stale closure issues)
    currentServiceTypeRef.current = subType;
    setBookingData((prev) => ({ ...prev, serviceType: subType }));

    // BROWSE_FIRST services: simpler flow - just city + dates, then redirect to fleet
    const isBrowseFirst = BROWSE_FIRST_SERVICES.includes(subType);

    // Check if we already know the city from page context
    if (pageContext.detectedCity && isBrowseFirst) {
      // Pre-fill city and skip to dates
      const city = pageContext.detectedCity;
      setBookingData((prev) => ({
        ...prev,
        pickupLocation: city,
        dropLocation: city
      }));

      addShiviMessage(
        `${city} ✓\n\n📅 When do you need it?`,
        [
          { label: 'Select Pickup Date', action: 'open-calendar', value: 'pickup-date' },
        ],
        'text',
        'Click above to select pickup date',
        'pickup-date'
      );
      setCalendarMode('date');
      setBookingStep('pickup-date');
      setShowDatePicker(true);
      return;
    }

    if (isBrowseFirst) {
      addShiviMessage(
        "Great! 📍 Which city?\n\n💡 Type to search or select below. I'll show vehicles after you pick dates!",
        locations.slice(0, 8).map((loc) => ({
          label: `${loc.name}`,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search city... (e.g., Delhi, Mumbai)'
      );
    } else {
      addShiviMessage(
        "Perfect choice! 🎯\n\n📍 Which city would you like to pick up from?\n\n💡 Type to search from 250+ cities!",
        locations.slice(0, 8).map((loc) => ({
          label: `${loc.name}`,
          action: 'select-location',
          value: loc.name,
        })),
        'text',
        '🔍 Search city... (e.g., Delhi, Mumbai)'
      );
    }

    setBookingStep('pickup-location');
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 900);
  };

  const handlePickupLocation = async (location: string) => {
    // Try exact match first
    let selectedLocation = locations.find((loc) =>
      loc.name.toLowerCase() === location.toLowerCase()
    );

    // If no exact match, try partial match (contains)
    if (!selectedLocation) {
      selectedLocation = locations.find((loc) =>
        loc.name.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes(loc.name.toLowerCase())
      );
    }

    // If still no match, try slug match
    if (!selectedLocation) {
      const locationSlug = location.toLowerCase().replace(/\s+/g, '-');
      selectedLocation = locations.find((loc) =>
        loc.slug === locationSlug || loc.slug?.includes(locationSlug)
      );
    }

    // Store both name and ID - API will also try to resolve by name if ID not found
    setBookingData((prev) => ({
      ...prev,
      pickupLocation: selectedLocation?.name || location,
      pickupLocationId: selectedLocation?.id?.toString() || '',
    }));

    // BROWSE_FIRST services OR Local taxi: skip drop location, go straight to pickup date
    const currentServiceType = currentServiceTypeRef.current;
    const isBrowseFirst = BROWSE_FIRST_SERVICES.includes(currentServiceType);
    const isLocalTaxi = currentServiceType === 'local-taxi';

    if (isBrowseFirst || isLocalTaxi) {
      // Same pickup and drop for self-drive/bike/local
      setBookingData((prev) => ({ ...prev, dropLocation: location }));
      addShiviMessage(
        `${location} ✓\n\n📅 When do you need the car?`,
        [
          { label: '📅 Select Date & Time', action: 'open-calendar', value: 'pickup-date' },
        ],
        'text',
        'Click above to select date & time',
        'pickup-date'
      );
      setCalendarMode('datetime');
      setBookingStep('pickup-date');
      setShowDatePicker(true);
    } else {
      // Outstation/Airport - ask for destination city
      const smartSuggestions = getSmartLocationSuggestions(location);

      addShiviMessage(
        `Great! Pickup from ${location}. 🚗\n\n📍 Where is your destination city?\n\n💡 Type to search or select below`,
        [
          ...smartSuggestions,
          { label: '📍 Same as pickup', action: 'skip-drop' },
        ],
        'text',
        '🔍 Search destination city...'
      );
      setBookingStep('drop-location');
      setTimeout(() => inputRef.current?.focus(), 900);
    }
  };

  const handleDropLocation = async (location: string) => {
    const selectedLocation = locations.find((loc) =>
      loc.name.toLowerCase() === location.toLowerCase()
    );

    setBookingData((prev) => ({
      ...prev,
      dropLocation: location,
      dropLocationId: selectedLocation?.id.toString() || '',
    }));

    const pickupLoc = bookingData.pickupLocation;
    const currentServiceType = currentServiceTypeRef.current;

    addShiviMessage(
      `Perfect! ${pickupLoc} → ${location} 🎯`,
      undefined
    );

    // For Packers & Movers, show property size options
    if (currentServiceType === 'packers-and-movers') {
      const shiftingType = bookingData.packersShiftingType;

      if (shiftingType === 'home') {
        addShiviMessage(
          "🏠 What's the size of your home?",
          [
            { label: '1 BHK', action: 'select-packers-size', value: '1 BHK' },
            { label: '2 BHK', action: 'select-packers-size', value: '2 BHK' },
            { label: '3 BHK', action: 'select-packers-size', value: '3 BHK' },
            { label: '4 BHK', action: 'select-packers-size', value: '4 BHK' },
            { label: '4+ BHK', action: 'select-packers-size', value: '4+ BHK' },
            { label: 'Villa', action: 'select-packers-size', value: 'Villa' },
          ]
        );
      } else if (shiftingType === 'office') {
        addShiviMessage(
          "🏢 What's the size of your office?",
          [
            { label: 'Individual Items', action: 'select-packers-size', value: 'Individual Items' },
            { label: 'Up to 10 Employees', action: 'select-packers-size', value: 'Up to 10 Employees' },
            { label: 'Up to 20 Employees', action: 'select-packers-size', value: 'Up to 20 Employees' },
            { label: 'More than 20', action: 'select-packers-size', value: 'More than 20 Employees' },
          ]
        );
      } else if (shiftingType === 'vehicle') {
        addShiviMessage(
          "🚗 What type of vehicle?",
          [
            { label: '🏍️ Bike', action: 'select-packers-size', value: 'Bike' },
            { label: '🚗 Car', action: 'select-packers-size', value: 'Car' },
            { label: '🚙 SUV', action: 'select-packers-size', value: 'SUV' },
          ]
        );
      }
      setBookingStep('packers-size');
      return;
    }

    await askForPickupDate();
  };

  const skipDropLocation = async () => {
    addUserMessage('Same as pickup location');
    setBookingData((prev) => ({ ...prev, dropLocation: prev.pickupLocation }));
    await askForPickupDate();
  };

  const askForPickupDate = async () => {
    addShiviMessage(
      "📅 When do you need the vehicle?\n\nSelect your pickup date:",
      [
        { label: 'Select Pickup Date', action: 'open-calendar', value: 'pickup-date' },
      ],
      'text',
      'Click above to select pickup date',
      'pickup-date'
    );
    setCalendarMode('date');
    setBookingStep('pickup-date');
    setShowDatePicker(true);
  };

  const askForReturnDate = async () => {
    addShiviMessage(
      "📅 When would you like to return the vehicle?\n\nSelect your return date:",
      [
        { label: 'Select Return Date', action: 'open-calendar', value: 'return-date' },
      ],
      'text',
      'Click above to select return date',
      'return-date'
    );
    setCalendarMode('date');
    setBookingStep('return-date');
    setShowDatePicker(true);
  };

  // Handle combined pickup date and time from calendar
  const handlePickupDateTime = async (date: string, time: string) => {
    const validation = validateDate(date);

    if (!validation.valid) {
      addShiviMessage(validation.message!);
      await askForPickupDate();
      return;
    }


    setBookingData((prev) => ({ ...prev, pickupDate: date, pickupTime: time }));

    const selectedDate = new Date(date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Use ref for current service type (avoids stale closure issues)
    const currentServiceType = currentServiceTypeRef.current;

    // Local taxi: Show hourly packages and car categories with prices
    if (currentServiceType === 'local-taxi') {
      addShiviMessage(
        `📅 ${dayName}, ${formattedDate} at ${time} ✓\n\n🔍 Loading hourly packages...`,
        undefined
      );

      // Fetch local packages for the location
      const packages = await fetchLocalPackages(bookingData.pickupLocationId || '');

      if (packages.length > 0) {
        setLocalPackages(packages);
        setBookingStep('select-local-package');

        // Get unique packages by hours/kms
        const uniquePackages = packages.reduce((acc, pkg) => {
          const key = `${pkg.hours}-${pkg.kms}`;
          if (!acc.find(p => `${p.hours}-${p.kms}` === key)) {
            acc.push(pkg);
          }
          return acc;
        }, [] as LocalPackage[]);

        const packageOptions = uniquePackages.slice(0, 4).map(pkg => ({
          label: `${pkg.hours} Hours / ${pkg.kms} Km`,
          action: 'select-local-package',
          value: JSON.stringify({
            id: pkg.id,
            name: pkg.name,
            hours: pkg.hours,
            kms: pkg.kms,
            basePrice: pkg.basePrice,
          }),
        }));

        addShiviMessage(
          `📦 Select an hourly package:\n\n(Extra km/hr charges apply beyond package limits)`,
          packageOptions
        );
      } else {
        // No packages - fetch categories and show with pricing
        addShiviMessage(
          "🔍 Finding available cars...",
          undefined
        );

        const categories = await fetchCarCategories();
        if (categories.length > 0) {
          setCarCategories(categories);

          const pricing = await fetchCarPricing('local', categories, {
            fromLocationId: bookingData.pickupLocationId,
            pickupTime: convertTo24Hour(time || '09:00'),
          });

          showCarCategoryOptions(categories, pricing);
        } else {
          addShiviMessage(
            "😔 No cars available for local trips in this city. Please contact us.",
            [
              { label: '📞 Call +91 97379 65551', action: 'ask-question' },
              { label: '🔄 Try Again', action: 'new-booking' },
            ]
          );
        }
      }
      return;
    }

    // Services that DON'T need return date/time
    const oneWayServices = [
      'one-way-car-rental',
      'airport-transfer',
      'chauffeur-service',
      'luxury-local',
      'luxury-airport-transfer',
      'packers-and-movers',
    ];

    // Quote-based services: go directly to contact details after date
    const quoteBased = [
      'luxury-local',
      'luxury-outstation',
      'luxury-airport-transfer',
      'packers-and-movers',
    ];

    // Check if this is a quote-based service
    if (quoteBased.includes(currentServiceType)) {
      addShiviMessage(
        `📅 ${dayName}, ${formattedDate} at ${time} ✓`,
        undefined
      );

      // For outstation luxury, ask for return date first
      if (currentServiceType === 'luxury-outstation' && bookingData.luxuryMode !== 'one-way') {
        await askForReturnDate();
      } else if (['luxury-local', 'luxury-outstation', 'luxury-airport-transfer'].includes(currentServiceType)) {
        // Luxury services: ask for vehicle category
        await askForLuxuryVehicleCategory();
      } else {
        // Go directly to contact details
        await askForContactDetails();
      }
      return;
    }

    const needsReturnDate = !oneWayServices.includes(currentServiceType);

    if (needsReturnDate) {
      addShiviMessage(
        `Pickup: ${dayName}, ${formattedDate} at ${time} ✓`,
        undefined
      );
      await askForReturnDate();
    } else {
      // One-way/Airport: Show car categories with pricing directly
      addShiviMessage(
        `📅 ${dayName}, ${formattedDate} at ${time} ✓\n\n🔍 Finding best prices...`,
        undefined
      );

      const categories = await fetchCarCategories();
      if (categories.length > 0) {
        setCarCategories(categories);

        const tripType = currentServiceType === 'airport-transfer' ? 'airport' : 'outstation';
        const pricing = await fetchCarPricing(tripType, categories, {
          fromLocationId: bookingData.pickupLocationId,
          toLocationId: bookingData.dropLocationId,
          pickupTime: convertTo24Hour(time || '09:00'),
          startDate: date,
          mode: bookingData.carMode,
        });

        showCarCategoryOptions(categories, pricing);
      } else {
        addShiviMessage(
          "😔 No cars available. Please contact us.",
          [
            { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            { label: '🔄 Try Again', action: 'new-booking' },
          ]
        );
      }
    }
  };

  // Handle combined return date and time from calendar
  const handleReturnDateTime = async (date: string, time: string) => {
    const validation = validateDate(date);

    if (!validation.valid) {
      addShiviMessage(validation.message!);
      await askForReturnDate();
      return;
    }


    // Validate return date is after pickup date
    if (bookingData.pickupDate && date < bookingData.pickupDate) {
      addShiviMessage(
        "Return date must be on or after your pickup date. Please select again."
      );
      await askForReturnDate();
      return;
    }


    setBookingData((prev) => ({ ...prev, returnDate: date, returnTime: time }));

    const selectedDate = new Date(date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // BROWSE_FIRST services: fetch and show fleet in chat
    const currentServiceType = currentServiceTypeRef.current;
    const isBrowseFirst = BROWSE_FIRST_SERVICES.includes(currentServiceType);

    // Quote-based services: go to vehicle category after return date
    const luxuryQuoteBased = ['luxury-outstation'];
    if (luxuryQuoteBased.includes(currentServiceType)) {
      addShiviMessage(
        `Return: ${dayName}, ${formattedDate} at ${time} ✓`,
        undefined
      );
      await askForLuxuryVehicleCategory();
      return;
    }

    if (isBrowseFirst) {
      addShiviMessage(
        `${dayName}, ${formattedDate} at ${time} ✓\n\n🔍 Searching for available vehicles...`,
        undefined
      );

      // Fetch fleet from API and show in chat
      const locationName = bookingData.pickupLocation || '';
      const fleet = await fetchFleetForLocation(locationName, currentServiceType);
      showFleetOptions(fleet);
    } else if (['outstation-car-rental', 'one-way-car-rental', 'airport-transfer'].includes(currentServiceType)) {
      // Car rental with driver - fetch pricing and show categories
      addShiviMessage(
        `${dayName}, ${formattedDate} at ${time} ✓\n\n🔍 Finding best prices for you...`,
        undefined
      );

      // Fetch car categories
      const categories = await fetchCarCategories();
      if (categories.length === 0) {
        addShiviMessage(
          "😔 No car categories available at the moment. Please try again later or contact us.",
          [
            { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            { label: '🔄 Try Again', action: 'new-booking' },
          ]
        );
        return;
      }

      setCarCategories(categories);

      // Determine trip type for pricing API
      const tripType = bookingData.carTripType || (currentServiceType === 'airport-transfer' ? 'airport' : 'outstation');

      // Fetch pricing for each category
      const pricing = await fetchCarPricing(tripType, categories, {
        fromLocationId: bookingData.pickupLocationId,
        toLocationId: bookingData.dropLocationId,
        pickupTime: convertTo24Hour(bookingData.pickupTime || time || '09:00'),
        startDate: bookingData.pickupDate,
        endDate: date,
        mode: bookingData.carMode,
      });

      // Show all categories with their prices (or not available)
      showCarCategoryOptions(categories, pricing);

    } else if (currentServiceType === 'local-taxi') {
      // Local trip - show packages first, then car categories with pricing
      addShiviMessage(
        `${dayName}, ${formattedDate} at ${time} ✓\n\n🔍 Loading hourly packages...`,
        undefined
      );

      // Fetch local packages for the location
      const packages = await fetchLocalPackages(bookingData.pickupLocationId || '');

      if (packages.length > 0) {
        setLocalPackages(packages);
        setBookingStep('select-local-package');

        // Get unique packages by hours/kms
        const uniquePackages = packages.reduce((acc, pkg) => {
          const key = `${pkg.hours}-${pkg.kms}`;
          if (!acc.find(p => `${p.hours}-${p.kms}` === key)) {
            acc.push(pkg);
          }
          return acc;
        }, [] as LocalPackage[]);

        const packageOptions = uniquePackages.slice(0, 4).map(pkg => ({
          label: `${pkg.hours} Hours / ${pkg.kms} Km`,
          action: 'select-local-package',
          value: JSON.stringify({
            id: pkg.id,
            name: pkg.name,
            hours: pkg.hours,
            kms: pkg.kms,
            basePrice: pkg.basePrice,
          }),
        }));

        addShiviMessage(
          `📦 Select an hourly package:\n\n(Extra km/hr charges apply beyond package limits)`,
          packageOptions
        );
      } else {
        // No packages configured - fetch categories and show with pricing
        addShiviMessage(
          "🔍 Finding available cars...",
          undefined
        );

        const categories = await fetchCarCategories();
        if (categories.length > 0) {
          setCarCategories(categories);

          // Try to get pricing even without package
          const pricing = await fetchCarPricing('local', categories, {
            fromLocationId: bookingData.pickupLocationId,
            pickupTime: convertTo24Hour(bookingData.pickupTime || time || '09:00'),
          });

          showCarCategoryOptions(categories, pricing);
        } else {
          addShiviMessage(
            "😔 No cars available for local trips in this city. Please try a different city or contact us.",
            [
              { label: '📍 Try Different City', action: 'new-booking' },
              { label: '📞 Call +91 97379 65551', action: 'ask-question' },
            ]
          );
        }
      }
    } else {
      addShiviMessage(
        `Return: ${dayName}, ${formattedDate} at ${time} ✅`,
        undefined
      );
      await askForContactDetails();
    }
  };

  // Legacy handlers for backward compatibility
  const handlePickupDate = async (date: string) => {
    await handlePickupDateTime(date, '09:00 AM');
  };

  const handlePickupTime = async (time: string) => {
    if (bookingData.pickupDate) {
      await handlePickupDateTime(bookingData.pickupDate, time);
    }
  };

  const handleReturnDate = async (date: string) => {
    await handleReturnDateTime(date, '09:00 AM');
  };

  const handleReturnTime = async (time: string) => {
    if (bookingData.returnDate) {
      await handleReturnDateTime(bookingData.returnDate, time);
    }
  };

  const askForContactDetails = async () => {
    // Pre-fill from customer data if available
    const prefilledName = bookingData.name?.trim() || customer?.name?.trim();
    const prefilledPhone = bookingData.phone?.trim() || customer?.phone?.trim();
    const prefilledEmail = bookingData.email?.trim() || customer?.email?.trim();

    // If customer is logged in, prefill all details
    if (prefilledName && prefilledPhone && prefilledEmail) {
      setBookingData((prev) => ({
        ...prev,
        name: prefilledName,
        phone: prefilledPhone,
        email: prefilledEmail,
      }));

      addShiviMessage(
        `Great news! I have your details:\n\n👤 ${prefilledName}\n📱 ${prefilledPhone}\n📧 ${prefilledEmail}\n\nAny special requirements? (child seat, GPS, diesel, etc.)`,
        [
          { label: '✅ No requirements, proceed', action: 'skip-requirements' },
          { label: '📝 Yes, add requirements', action: 'add-requirements' },
        ]
      );
      return;
    }

    const firstName = prefilledName?.split(' ')[0];
    if (prefilledName) {
      // Set name in bookingData
      setBookingData((prev) => ({ ...prev, name: prefilledName }));

      addShiviMessage(
        `Almost done${firstName ? `, ${firstName}` : ''}! I have your name. Now confirm your phone number.\n\n🪙 FYI: You can earn up to 100 Backr Tokens on trip completion!`,
        undefined,
        'tel',
        '+91 9737965551',
        'phone'
      );
      setBookingStep('phone');
      return;
    }

    addShiviMessage(
      "Almost done! 👤 What's your name?\n\n🪙 FYI: You can earn up to 100 Backr Tokens on trip completion!",
      undefined,
      'text',
      'Your full name',
      'name'
    );
    setBookingStep('name');
  };

  const handleName = async (name: string) => {
    setBookingData((prev) => ({ ...prev, name }));

    addShiviMessage(
      "📱 Your phone number?",
      undefined,
      'tel',
      '+91 9737965551',
      'phone'
    );
    setBookingStep('phone');
  };

  const handlePhone = async (phone: string) => {
    // God-level: Intelligent phone validation
    const validation = validatePhone(phone);

    if (!validation.valid) {
      addShiviMessage(
        validation.message!,
        undefined,
        'tel',
        '+91 9737965551'
      );
      return;
    }

    setBookingData((prev) => ({ ...prev, phone }));

    addShiviMessage(
      "Great! 📧 What's your email address?\n\n💡 We'll send booking confirmation here",
      undefined,
      'email',
      'your@email.com',
      'email'
    );
    setBookingStep('email');
  };

  const handleEmail = async (email: string) => {
    // God-level: Intelligent email validation
    const validation = validateEmail(email);

    if (!validation.valid) {
      addShiviMessage(
        validation.message!,
        undefined,
        'email',
        'your@email.com'
      );
      return;
    }

    setBookingData((prev) => ({ ...prev, email }));

    // God-level: Personalized closing with booking incentive
    addShiviMessage(
      "Perfect! 🎉 You're almost there!\n\nAny special requirements? (child seat, GPS, diesel, etc.)\n\n💡 Mentioning details helps vendors serve you better!",
      [
        { label: '✅ No requirements, proceed', action: 'skip-requirements' },
        { label: '📝 Yes, add requirements', action: 'add-requirements' },
      ]
    );
  };

  const askForRequirements = async () => {
    addUserMessage('I have some requirements');
    addShiviMessage(
      "Sure! Please tell me your requirements:",
      undefined,
      'text',
      'Type your requirements...',
      'requirements'
    );
    setBookingStep('requirements');
  };

  const handleRequirements = async (requirements: string) => {
    setBookingData((prev) => ({ ...prev, requirements }));
    await showBookingSummary();
  };

  const showBookingSummary = async () => {
    // Format service name nicely
    const serviceTypeName = bookingData.serviceType
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || bookingData.serviceName;

    // God-level: Calculate trip duration for better context
    let tripDuration = '';
    if (bookingData.pickupDate && bookingData.returnDate) {
      const pickup = new Date(bookingData.pickupDate);
      const returnDate = new Date(bookingData.returnDate);
      const days = Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
      tripDuration = `\n⏱️ Duration: ${days} day${days > 1 ? 's' : ''}`;
    }

    // Car rental specific details
    let carDetails = '';
    if (bookingData.selectedCarCategoryName) {
      carDetails = `\n🚗 Car: ${bookingData.selectedCarCategoryName}`;
      if (bookingData.selectedPackageName) {
        carDetails += ` (${bookingData.selectedPackageName})`;
      }
      if (bookingData.carEstimatedPrice) {
        carDetails += `\n💰 Estimated Price: ₹${bookingData.carEstimatedPrice.toLocaleString()}`;
      }
    }

    // Bike/Self-Drive details
    let vehicleDetails = '';
    if (bookingData.selectedVehicleName && !bookingData.selectedCarCategoryName) {
      vehicleDetails = `\n🏍️ Vehicle: ${bookingData.selectedVehicleName}`;
      if (bookingData.selectedDailyRate) {
        vehicleDetails += ` @ ₹${bookingData.selectedDailyRate}/day`;
      }
    }

    const resolvedSummaryName = (bookingData.name?.trim() || customer?.name?.trim()) ?? '';
    const summaryFirstName = resolvedSummaryName.split(' ')[0] || '';

    const hasPrice = bookingData.carEstimatedPrice || bookingData.selectedDailyRate;
    const vendorMsg = hasPrice
      ? '✨ Your booking will be confirmed shortly!'
      : '✨ You\'ll receive quotations from multiple verified vendors!';

    const summary = `
🎯 Almost Done${resolvedSummaryName ? `, ${summaryFirstName}` : ''}! Here's your booking summary:

🚗 Service: ${serviceTypeName}${carDetails}${vehicleDetails}
📍 From: ${bookingData.pickupLocation}${bookingData.dropLocation && bookingData.dropLocation !== bookingData.pickupLocation ? `\n📍 To: ${bookingData.dropLocation}` : ''}
📅 Pickup: ${bookingData.pickupDate} at ${bookingData.pickupTime}${bookingData.returnDate ? `\n📅 Return: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${tripDuration}

👤 Contact Details:
• Name: ${bookingData.name || customer?.name || 'N/A'}
• Phone: ${bookingData.phone}
• Email: ${bookingData.email}${bookingData.requirements ? `\n\n📝 Special Requirements:\n${bookingData.requirements}` : ''}

${vendorMsg}

Ready to confirm?
    `.trim();

    addShiviMessage(
      summary,
      [
        { label: '✅ Confirm & Book Now', action: 'confirm-booking' },
        { label: '✏️ Edit Details', action: 'new-booking' },
      ]
    );
  };

  // Helper function to convert 12-hour time format to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return '09:00';

    // If already in 24-hour format (e.g., "09:00" or "14:30"), return as is
    if (/^\d{2}:\d{2}$/.test(time12h)) {
      return time12h;
    }

    // Parse 12-hour format like "09:00 AM" or "06:00 PM"
    const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
      // Try to extract just the time portion
      const timeMatch = time12h.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      }
      return '09:00'; // Default fallback
    }

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Helper function to map service type to booking type for API
  const getBookingTypeFromService = (serviceType: string | undefined): string => {
    if (!serviceType) return 'bike';

    const serviceMapping: Record<string, string> = {
      // Bike services
      'bike-on-rent': 'bike',
      'activa-on-rent': 'bike',
      'royal-enfield-on-rent': 'bike',
      // Car services
      'outstation-car-rental': 'car-roundtrip',
      'one-way-car-rental': 'car-oneway',
      'airport-transfer': 'car-airport',
      'local-taxi': 'car-roundtrip',
      'self-drive-car-rentals': 'selfdrive',
      'luxury-car-rental': 'luxury',
      'sports-car-rental': 'luxury',
      'vintage-car-rental': 'luxury',
      'corporate-car-rental': 'car-roundtrip',
      'wedding-car-rental': 'luxury',
      'monthly-car-rental': 'selfdrive',
      'chauffeur-service': 'car-roundtrip',
      // Bus services
      'bus-rental': 'bus-outstation',
      'tempo-traveller': 'bus-outstation',
      'corporate-bus-rental': 'bus-outstation',
      'wedding-bus-rental': 'bus-outstation',
      // Truck services
      'mini-truck-rental': 'truck-personal',
      'packers-and-movers': 'packers-home',
      'transporter': 'truck-commercial',
      'trailer-on-rent': 'trailer',
      // Equipment services
      'equipment-rental': 'equipment',
      'jcb-on-rent': 'equipment',
    };

    return serviceMapping[serviceType] || 'bike';
  };

  // Helper function to get service ID based on booking type
  // Service IDs from database: 1=Bike, 2=Car Rental, 3=Luxury Car, 4=Selfdrive Car, 5=Bus Rental, 6=Truck Rental, 7=Packers and Movers, 8=Equipment
  const getServiceId = (bookingType: string): number => {
    const serviceIds: Record<string, number> = {
      'bike': 1,
      'car-roundtrip': 2,
      'car-oneway': 2,
      'car-airport': 2,
      'selfdrive': 4,
      'luxury': 3,
      'bus-outstation': 5,
      'bus-local': 5,
      'truck-personal': 6,
      'truck-commercial': 6,
      'equipment': 8,
      'packers-home': 7,
      'trailer': 6,
    };
    return serviceIds[bookingType] || 1;
  };

  const submitBooking = async () => {
    addUserMessage('Yes, confirm booking');

    // Validate customer details before submitting
    if (!bookingData.name || !bookingData.phone || !bookingData.email) {
      addShiviMessage(
        "Oops! I need your contact details first. Let me collect them.",
        undefined
      );
      await askForContactDetails();
      return;
    }

    setIsSubmitting(true);

    try {
      const currentServiceType = currentServiceTypeRef.current || bookingData.serviceType || '';
      const bookingType = getBookingTypeFromService(currentServiceType);

      // Convert times to 24-hour format
      const pickupTime24 = convertTo24Hour(bookingData.pickupTime || '09:00');
      const returnTime24 = convertTo24Hour(bookingData.returnTime || '18:00');

      let response: Response;
      let result: any;
      let bookingId = '';
      let dashboardUrl = '/customer/dashboard';

      // Route to correct API based on service type
      if (['bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent'].includes(currentServiceType)) {
        // BIKE RENTAL - Use /api/bike-quote-requests (quote flow)
        const bikeCategory = currentServiceType.includes('activa') ? 'Scooter' : currentServiceType.includes('royal') ? 'Cruiser' : 'Bike';
        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          vehicleModelId: bookingData.selectedVehicleId || null,
          vehicleModelName: bookingData.selectedVehicleName || null,
          vehicleBrand: bookingData.selectedVehicleBrand || null,
          vehicle_category: bikeCategory,
          vehicleCategoryName: bikeCategory,
          locationId: bookingData.pickupLocationId || null,
          locationName: bookingData.pickupLocation || '',
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          dropDate: bookingData.returnDate,
          dropTime: returnTime24,
          helmetsRequired: 1,
          customerNotes: bookingData.requirements || '',
        };

        response = await fetch('/api/bike-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.request?.requestNumber || '';
        dashboardUrl = '/customer/bike-quotes';

      } else if (['self-drive-car-rentals', 'self-drive-rental'].includes(currentServiceType)) {
        // SELF-DRIVE - Use /api/self-drive-quote-requests (quote flow)
        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          vehicleModelId: bookingData.selectedVehicleId || null,
          vehicleModelName: bookingData.selectedVehicleName || null,
          vehicleBrand: bookingData.selectedVehicleBrand || null,
          vehicle_category: bookingData.selectedVehicleCategory || null,
          vehicleCategoryName: bookingData.selectedVehicleCategoryName || null,
          locationId: bookingData.pickupLocationId || null,
          locationName: bookingData.pickupLocation || '',
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          dropDate: bookingData.returnDate,
          dropTime: returnTime24,
          customerNotes: bookingData.requirements || '',
        };

        response = await fetch('/api/self-drive-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.request?.requestNumber || '';
        dashboardUrl = '/customer/self-drive-quotes';

      } else if (['outstation-car-rental', 'one-way-car-rental', 'airport-transfer', 'local-taxi'].includes(currentServiceType)) {
        // CAR WITH DRIVER - Use /api/car-rental/bookings
        const tripTypeMap: Record<string, string> = {
          'outstation-car-rental': 'outstation',
          'one-way-car-rental': 'outstation',
          'airport-transfer': 'airport',
          'local-taxi': 'local',
        };

        // Use selected category or default to sedan
        const categoryId = bookingData.selectedCarCategoryId || 'sedan';
        const categoryName = bookingData.selectedCarCategoryName || 'Sedan';

        // Map car mode from our format to API format
        const modeMap: Record<string, string> = {
          'one-way': 'one-way',
          'round-trip': 'round-trip',
          'pickup': 'pickup',
          'drop': 'drop',
        };

        // For airport transfers, determine the correct pickup city
        // For airport pickup: user goes FROM airport TO city, so city is the destination but we need city for API validation
        // For airport drop: user goes FROM city TO airport, so city is the pickup
        const isAirportPickup = bookingData.carTripType === 'airport' && bookingData.carMode === 'pickup';

        const payload = {
          tripType: bookingData.carTripType || tripTypeMap[currentServiceType] || 'outstation',
          mode: bookingData.carMode ? modeMap[bookingData.carMode] : (currentServiceType === 'one-way-car-rental' ? 'one-way' : 'round-trip'),
          // For airport, also send airportMode which the API expects
          airportMode: bookingData.carTripType === 'airport' ? bookingData.carMode : undefined,
          carCategory: categoryId,
          carCategoryName: categoryName,
          // pickupCity must be a valid city from Location table
          pickupCity: bookingData.pickupLocation || '',
          pickupLocationId: bookingData.pickupLocationId || '',
          dropCity: bookingData.dropLocation || bookingData.pickupLocation || '',
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          returnDate: bookingData.returnDate || null,
          returnTime: returnTime24,
          customerName: bookingData.name || '',
          customerPhone: bookingData.phone || '',
          customerEmail: bookingData.email || '',
          customerNotes: bookingData.requirements || '',
          // Additional fields for pricing
          packageId: bookingData.selectedPackageId || null,
          packageName: bookingData.selectedPackageName || null,
          estimatedPrice: bookingData.carEstimatedPrice || null,
          airportId: bookingData.airportId || null,
          airportName: bookingData.airportName || null,
        };

        console.log('Car rental payload:', payload);
        console.log('Booking data:', bookingData);

        response = await fetch('/api/car-rental/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.booking?.bookingNumber || result.booking?.id || '';
        dashboardUrl = '/customer/car-bookings';

      } else if (['bus-rental', 'tempo-traveller', 'corporate-bus-rental', 'wedding-bus-rental'].includes(currentServiceType)) {
        // BUS - Use /api/bus-quote-requests
        const vehicleCategoryMap: Record<string, string> = {
          'tempo-traveller': 'tempo-traveller-17',
          'bus-rental': 'bus-45',
          'corporate-bus-rental': 'bus-45',
          'wedding-bus-rental': 'luxury-bus-45',
        };

        const passengersMap: Record<string, number> = {
          'tempo-traveller': 17,
          'bus-rental': 45,
          'corporate-bus-rental': 45,
          'wedding-bus-rental': 45,
        };

        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          tripType: currentServiceType.includes('wedding') ? 'wedding' : currentServiceType.includes('corporate') ? 'corporate' : 'outstation',
          vehicleCategory: vehicleCategoryMap[currentServiceType] || 'bus-45',
          vehicleCategoryName: currentServiceType === 'tempo-traveller' ? 'Tempo Traveller (17 Seater)' : 'Bus (45 Seater)',
          pickupCity: bookingData.pickupLocation || '',
          dropCity: bookingData.dropLocation || bookingData.pickupLocation || '',
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          returnDate: bookingData.returnDate || null,
          passengers: passengersMap[currentServiceType] || 45,
          requirements: bookingData.requirements || '',
        };

        console.log('Bus quote payload:', payload);

        response = await fetch('/api/bus-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.quoteRequest?.requestNumber || result.quoteRequest?.id || '';
        dashboardUrl = '/customer/bus-quotes';

      } else if (['mini-truck-rental', 'transporter', 'trailer-on-rent'].includes(currentServiceType)) {
        // TRUCK - Use /api/truck-quote-requests
        const vehicleCategoryMap: Record<string, string> = {
          'mini-truck-rental': 'mini-truck',
          'transporter': 'truck-14ft',
          'trailer-on-rent': 'trailer',
        };

        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          serviceType: currentServiceType === 'transporter' ? 'commercial' : 'intercity',
          vehicleCategory: vehicleCategoryMap[currentServiceType] || 'truck-14ft',
          vehicleCategoryName: currentServiceType === 'mini-truck-rental' ? 'Mini Truck' : currentServiceType === 'trailer-on-rent' ? 'Trailer' : 'Truck (14ft)',
          pickupCity: bookingData.pickupLocation || '',
          pickupAddress: bookingData.pickupLocation || '', // Using city as address for now
          dropCity: bookingData.dropLocation || bookingData.pickupLocation || '',
          dropAddress: bookingData.dropLocation || bookingData.pickupLocation || '',
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          goodsType: 'Household Items', // Default, user can specify in requirements
          requirements: bookingData.requirements || '',
        };

        console.log('Truck quote payload:', payload);

        response = await fetch('/api/truck-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.quoteRequest?.requestNumber || result.quoteRequest?.id || '';
        dashboardUrl = '/customer/truck-quotes';

      } else if (currentServiceType === 'packers-and-movers') {
        // PACKERS - Use /api/packers-quote-requests
        const shiftingTypeMap: Record<string, string> = {
          'home': 'Home',
          'office': 'Office',
          'vehicle': 'Vehicle',
        };

        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          shiftingType: shiftingTypeMap[bookingData.packersShiftingType || 'home'] || 'Home',
          serviceType: bookingData.packersShiftingType === 'vehicle' ? 'vehicle-transport' : 'home-intercity',
          propertySize: bookingData.packersPropertySize || '2BHK',
          pickupCity: bookingData.pickupLocation || '',
          pickupAddress: bookingData.packersPickupAddress || bookingData.pickupLocation || '',
          dropCity: bookingData.dropLocation || '',
          dropAddress: bookingData.packersDropAddress || bookingData.dropLocation || '',
          preferredDate: bookingData.pickupDate,
          isFlexibleDate: true,
          needPacking: true,
          needUnpacking: false,
          requirements: bookingData.requirements || '',
        };

        console.log('Packers quote payload:', payload);

        response = await fetch('/api/packers-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.quoteRequest?.requestNumber || result.quoteRequest?.id || '';
        dashboardUrl = '/customer/packers-quotes';

      } else if (['luxury-local', 'luxury-outstation', 'luxury-airport-transfer', 'luxury-car-rental'].includes(currentServiceType)) {
        // LUXURY CAR - Use /api/luxury-quote-requests (same as website)
        const tripTypeMap: Record<string, string> = {
          'luxury-local': 'local',
          'luxury-outstation': 'outstation',
          'luxury-airport-transfer': 'airport',
          'luxury-car-rental': 'outstation',
        };

        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          tripType: tripTypeMap[currentServiceType] || 'local',
          occasion: bookingData.luxuryOccasion || null,
          vehicleCategory: bookingData.luxuryVehicleCategory || 'Premium Sedan',
          vehicleCategoryName: bookingData.luxuryVehicleCategory || 'Premium Sedan',
          specificModel: bookingData.luxuryVehiclePreference || null,
          pickupCity: bookingData.pickupLocation || '',
          pickupAddress: bookingData.luxuryPickupAddress || null,
          dropCity: bookingData.dropLocation || null,
          pickupDate: bookingData.pickupDate,
          pickupTime: pickupTime24,
          returnDate: bookingData.returnDate || null,
          returnTime: returnTime24,
          needDecoration: bookingData.luxuryNeedDecoration || false,
          requirements: bookingData.luxurySpecialRequests || bookingData.requirements || null,
        };

        console.log('Luxury quote request payload:', payload);

        response = await fetch('/api/luxury-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.quoteRequest?.requestNumber || result.quoteRequest?.id || '';
        dashboardUrl = '/customer/luxury-quotes';

      } else if (['equipment-rental', 'jcb-on-rent'].includes(currentServiceType)) {
        // EQUIPMENT - Use /api/equipment-quote-requests
        // Calculate rental days
        let rentalDays = 1;
        if (bookingData.pickupDate && bookingData.returnDate) {
          const start = new Date(bookingData.pickupDate);
          const end = new Date(bookingData.returnDate);
          rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }

        const equipmentCategoryMap: Record<string, string> = {
          'jcb-on-rent': 'earthmoving',
          'equipment-rental': 'construction',
        };

        const equipmentTypeMap: Record<string, string> = {
          'jcb-on-rent': 'jcb',
          'equipment-rental': 'general',
        };

        const payload = {
          customerName: bookingData.name || '',
          customerEmail: bookingData.email || '',
          customerPhone: bookingData.phone || '',
          equipmentCategory: equipmentCategoryMap[currentServiceType] || 'construction',
          equipmentType: equipmentTypeMap[currentServiceType] || 'general',
          equipmentName: currentServiceType === 'jcb-on-rent' ? 'JCB Backhoe Loader' : 'Construction Equipment',
          quantity: 1,
          rentalDuration: 'daily',
          rentalDays: rentalDays,
          deliveryCity: bookingData.pickupLocation || '',
          deliveryAddress: bookingData.pickupLocation || '', // Using city as address
          siteType: 'construction',
          startDate: bookingData.pickupDate,
          endDate: bookingData.returnDate || bookingData.pickupDate,
          needOperator: true,
          needDelivery: true,
          requirements: bookingData.requirements || '',
        };

        console.log('Equipment quote payload:', payload);

        response = await fetch('/api/equipment-quote-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await response.json();
        bookingId = result.quoteRequest?.requestNumber || result.quoteRequest?.id || '';
        dashboardUrl = '/customer/equipment-quotes';

      } else {
        // Fallback to unified booking API
        const serviceId = getServiceId(bookingType);
        const basePayload = {
          customer_id: 0,
          service_id: serviceId,
          service_name: currentServiceType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Vehicle Rental',
          location_id: parseInt(bookingData.pickupLocationId || '1'),
          location_name: bookingData.pickupLocation || '',
          destination: bookingData.dropLocation || bookingData.pickupLocation || '',
          journey_datetime: `${bookingData.pickupDate}T${pickupTime24}:00`,
          return_datetime: bookingData.returnDate ? `${bookingData.returnDate}T${returnTime24}:00` : undefined,
          other_info: bookingData.requirements || '',
        };

        response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingType,
            customerInfo: { name: bookingData.name, email: bookingData.email, phone: bookingData.phone },
            bookingData: basePayload,
          }),
        });
        result = await response.json();
        bookingId = result.booking_id || '';
      }

      if (!response.ok || result.error) {
        const errorMsg = result.details || result.error || result.message || 'Booking failed';
        throw new Error(errorMsg);
      }

      // Track booking completed
      trackBookingCompleted();

      // Personalized success message
      const firstName = bookingData.name?.split(' ')[0] || 'there';
      const bookingHistory = JSON.parse(localStorage.getItem('shivi_booking_count') || '0');
      localStorage.setItem('shivi_booking_count', (bookingHistory + 1).toString());
      const isFirstBooking = bookingHistory === 0;

      // Determine message based on service type
      const isQuoteBased = ['bike-on-rent', 'activa-on-rent', 'royal-enfield-on-rent', 'self-drive-car-rentals', 'self-drive-rental', 'bus-rental', 'tempo-traveller', 'corporate-bus-rental', 'wedding-bus-rental', 'mini-truck-rental', 'transporter', 'trailer-on-rent', 'packers-and-movers', 'equipment-rental', 'jcb-on-rent'].includes(currentServiceType);

      const successMessage = isQuoteBased
        ? `Quote Request Submitted, ${firstName}!\n\n${isFirstBooking ? 'Welcome to TransRentals! ' : ''}Your request has been sent to verified vendors.\n\nRequest ID: #${bookingId}\n\nWhat Happens Next:\n• Vendors will send quotes within 30 minutes\n• Compare quotes and select the best one\n• Confirmation via email (${bookingData.email})\n\n🎯 Go to your dashboard to track quotes.`
        : `Booking Confirmed, ${firstName}!\n\n${isFirstBooking ? 'Welcome to TransRentals! ' : ''}Your ${bookingData.selectedVehicleName || currentServiceType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} booking is confirmed.\n\nBooking ID: #${bookingId}\n\nWhat Happens Next:\n• Complete advance payment to confirm\n• Get vendor confirmation via SMS/email\n• Pickup details will be shared\n\n🪙 Earn up to 100 Backr Tokens on trip completion!\n\n🎯 Go to your dashboard to manage booking.`;

      addShiviMessage(
        successMessage,
        [
          { label: '📊 Go to Dashboard', action: 'go-to-dashboard' },
          { label: '📱 Download App', action: 'download-app' },
          { label: '🔄 Book Another', action: 'new-booking' },
        ]
      );

      setBookingStep('completed');
    } catch (error: any) {
      console.error('Booking error:', error);
      addShiviMessage(
        `Oops! Something went wrong. 😔\n\nError: ${error.message || 'Unknown error'}\n\nPlease try again, or contact us:\n📞 +91 97379 65551\n📧 book@TransRentals.in`,
        [
          { label: '🔄 Try Again', action: 'confirm-booking' },
          { label: '🏠 Go to Homepage', action: 'go-home' },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setBookingData({});
    setBookingStep('');
    setMessages([]);
    setAvailableFleet([]); // Clear fleet data
    setCarCategories([]); // Clear car categories
    setLocalPackages([]); // Clear local packages
    setCarPricingList([]); // Clear car pricing
    currentServiceTypeRef.current = ''; // Reset service type ref
    addShiviMessage(
      "Hi! I'm Shivi 👋\n\nReady for your next booking? Earn more Backr Tokens! 🪙\n\nWhat would you like to rent?",
      [
        { label: '🚗 Car Rental', action: 'start-booking', value: 'car' },
        { label: '🚙 Self-Drive Car', action: 'start-booking', value: 'selfdrive' },
        { label: '👑 Luxury Car', action: 'start-booking', value: 'luxury' },
        { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
        { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
        { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
        { label: '📦 Packers & Movers', action: 'start-booking', value: 'packers' },
        { label: '🏗️ Equipment Rental', action: 'start-booking', value: 'equipment' },
      ]
    );
  };

  const searchKnowledgeBase = async (query: string) => {
    try {
      const response = await fetch('/api/knowledge-base/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error('Failed to search knowledge base');

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Found a match! Use the top result
        const topResult = data.results[0];

        // Track KB query with match
        trackKBQuery(query, topResult.id, topResult.score);

        // Increment use count
        fetch('/api/knowledge-base/search', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: topResult.id }),
        }).catch(() => { }); // Silent fail for tracking

        // Show the answer with booking options
        addShiviMessage(
          `${topResult.answer}\n\n💡 Can I help you with anything else?`,
          [
            { label: '🚗 Book Vehicle', action: 'show-booking-options' },
            { label: '❓ Ask Another Question', action: 'ask-question' },
          ]
        );
      } else {
        // Track KB query with no match
        trackKBQuery(query);

        // No match found, show general help
        addShiviMessage(
          "I'm not sure about that, but I can help you:\n\n• Book vehicles (Car, Bike, Bus, Truck, Equipment, Trailer)\n• Answer questions about our services\n• Provide pricing information\n• Help with locations and policies\n\nWhat would you like to know?",
          [
            { label: '🚗 Book Now', action: 'show-booking-options' },
            { label: '💰 Pricing Info', action: 'ask-pricing' },
            { label: '📍 Locations', action: 'ask-locations' },
          ]
        );
      }
    } catch (error) {
      // On error, fall back to booking options
      addShiviMessage(
        "I can help you book a vehicle! What would you like to rent?",
        [
          { label: '🚗 Car Rental', action: 'start-booking', value: 'car' },
          { label: '🚙 Self-Drive Car', action: 'start-booking', value: 'selfdrive' },
          { label: '👑 Luxury Car', action: 'start-booking', value: 'luxury' },
          { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
          { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
          { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
          { label: '📦 Packers & Movers', action: 'start-booking', value: 'packers' },
          { label: '🏗️ Equipment Rental', action: 'start-booking', value: 'equipment' },
        ]
      );
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <MessageCircle className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>

            <div className="absolute right-full mr-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Chat with Shivi 💬
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-20 right-2 lg:bottom-6 lg:right-6 z-50 w-[calc(100%-1rem)] max-w-md h-[calc(100vh-160px)] lg:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Shivi</h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Online - Book in chat!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  trackChatClosed();
                  setIsOpen(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white shadow-md border border-gray-100'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>

                    {/* Options */}
                    {message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option.action, option.value)}
                            className="w-full text-left px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-lg text-sm font-medium text-gray-900 transition border border-gray-200 hover:border-blue-300"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md rounded-2xl px-4 py-3 border border-gray-100">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitting Indicator */}
              {isSubmitting && (
                <div className="flex justify-center">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-3 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-900">Submitting your booking...</span>
                  </div>
                </div>
              )}

              {/* Fleet Loading Indicator */}
              {isLoadingFleet && (
                <div className="flex justify-center">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl px-6 py-3 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    <span className="text-sm font-medium text-green-900">Finding available vehicles...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 relative">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCalendarToggle}
                  className="w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                  aria-label="Open calendar picker"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // Update location options as user types
                    if (bookingStep === 'pickup-location' || bookingStep === 'drop-location') {
                      updateLocationOptions(e.target.value);
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    messages[messages.length - 1]?.placeholder ||
                    "Type your message..."
                  }
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSubmitting}
                  className="w-11 h-11 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {showDatePicker && (
                <div className="absolute bottom-24 right-0 z-50 w-full sm:w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Calendar quick select
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {calendarMode === 'time'
                        ? 'Choose a time'
                        : calendarMode === 'datetime'
                          ? 'Choose a date & time'
                          : 'Choose a date'}
                    </p>
                  </div>

                  {(calendarMode === 'date' || calendarMode === 'datetime') && (
                    <div>
                      <label className="block text-xs text-gray-600 mt-2">Date</label>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  {(calendarMode === 'time' || calendarMode === 'datetime') && (
                    <div>
                      <label className="block text-xs text-gray-600">
                        Time
                      </label>
                      <input
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  )}

                  {calendarError && (
                    <p className="text-xs text-red-600">{calendarError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCalendarConfirm}
                      className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      Use Selection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDatePicker(false);
                        setCalendarError('');
                      }}
                      className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
