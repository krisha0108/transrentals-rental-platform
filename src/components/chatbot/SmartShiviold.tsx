'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Calendar, MapPin, Phone, Mail, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocations } from '@/components/booking/useLocations';
import { useServices, Service } from '@/components/booking/useServices';
import { bookingService } from '@/lib/api/services/bookingService';

type BookingMeta = {
  bookingType: string;
  serviceId: number;
  serviceName: string;
  matchNames?: string[];
  extras?: Record<string, string | number>;
};

const serviceMatchers: { matches: (value: string) => boolean; meta: BookingMeta }[] = [
  {
    matches: (value) => /equipment|jcb/.test(value),
    meta: {
      bookingType: 'equipment',
      serviceId: 8,
      serviceName: 'Equipment',
      matchNames: ['equipment', 'jcb', 'excavator', 'crane'],
      extras: {
        machine_type: '1',
        job_duration: '1',
        no_of_equipments: '1',
        other_info: 'Equipment request',
      },
    },
  },
  {
    matches: (value) => /packers|movers/.test(value),
    meta: {
      bookingType: 'packers-home',
      serviceId: 9,
      serviceName: 'Packers & Movers',
      matchNames: ['packers', 'movers', 'shifting'],
      extras: {
        shifting_type: 'Home',
        other_info: 'Packers & Movers request',
      },
    },
  },
  {
    matches: (value) => /trailer/.test(value),
    meta: {
      bookingType: 'trailer',
      serviceId: 7,
      serviceName: 'Trailer',
      matchNames: ['trailer'],
      extras: {
        truck_mode: '1',
        truck_type: '14',
        other_info: 'Trailer request',
      },
    },
  },
  {
    matches: (value) => /truck|mini-truck|transporter/.test(value),
    meta: {
      bookingType: 'truck-personal',
      serviceId: 7,
      serviceName: 'Truck Rental',
      matchNames: ['truck', 'transporter'],
      extras: {
        truck_mode: '1',
        truck_type: '14',
        weight: '1',
        weight_val: '1',
        other_info: 'Truck rental request',
      },
    },
  },
  {
    matches: (value) => /bus|tempo/.test(value),
    meta: {
      bookingType: 'bus-outstation',
      serviceId: 6,
      serviceName: 'Bus Rental',
      matchNames: ['bus', 'tempo'],
      extras: {
        service_type: '1',
        total_passangers: 1,
        other_info: 'Bus rental request',
      },
    },
  },
  {
    matches: (value) => /luxury/.test(value),
    meta: {
      bookingType: 'luxury',
      serviceId: 5,
      serviceName: 'Luxury Car',
      matchNames: ['luxury', 'limo'],
      extras: {
        luxury_type: '2',
        package: '1',
        other_info: 'Luxury car request',
      },
    },
  },
  {
    matches: (value) => /self[- ]?drive/.test(value),
    meta: {
      bookingType: 'selfdrive',
      serviceId: 4,
      serviceName: 'Selfdrive Car',
      matchNames: ['selfdrive', 'self-drive'],
      extras: {
        car_type: '2',
        transmission: '2',
        fuel_type: '2',
        doorstep_delivery: '0',
        other_info: 'Self-drive request',
      },
    },
  },
  {
    matches: (value) => /one-way|oneway/.test(value),
    meta: {
      bookingType: 'car-oneway',
      serviceId: 4,
      serviceName: 'One Way Car',
      matchNames: ['one way', 'oneway'],
      extras: {
        trip_type: '1',
        car_type: '2',
        total_passangers: 1,
        other_info: 'One-way car rental',
      },
    },
  },
  {
    matches: (value) => /airport/.test(value),
    meta: {
      bookingType: 'car-airport',
      serviceId: 3,
      serviceName: 'Airport Taxi',
      matchNames: ['airport'],
      extras: {
        trip_type: '2',
        car_type: '2',
        airport_option: '1',
        total_passangers: 1,
        other_info: 'Airport transfer',
      },
    },
  },
  {
    matches: (value) => /taxi|chauffeur/.test(value),
    meta: {
      bookingType: 'car-oneway',
      serviceId: 4,
      serviceName: 'Taxi Service',
      matchNames: ['taxi', 'chauffeur'],
      extras: {
        trip_type: '1',
        car_type: '2',
        total_passangers: 1,
        other_info: 'Taxi service request',
      },
    },
  },
  {
    matches: (value) => /outstation/.test(value),
    meta: {
      bookingType: 'car-roundtrip',
      serviceId: 3,
      serviceName: 'Round Trip Car',
      matchNames: ['round trip', 'outstation'],
      extras: {
        trip_type: '3',
        car_type: '2',
        total_passangers: 1,
        other_info: 'Outstation car rental',
      },
    },
  },
  {
    matches: (value) => /car/.test(value),
    meta: {
      bookingType: 'car-roundtrip',
      serviceId: 3,
      serviceName: 'Car Rental',
      matchNames: ['car rental', 'car'],
      extras: {
        trip_type: '3',
        car_type: '2',
        total_passangers: 1,
        other_info: 'Car rental request',
      },
    },
  },
  {
    matches: (value) => /bike|activa|royal|scooter/.test(value),
    meta: {
      bookingType: 'bike',
      serviceId: 2,
      serviceName: 'Bike Rental',
      matchNames: ['bike rental', 'bike', 'scooter', 'activa'],
      extras: {
        bike_duration: '2',
        bike_type: '1',
        other_info: 'Bike rental request',
      },
    },
  },
];

const getBookingMeta = (serviceType?: string): BookingMeta => {
  const normalizedType = (serviceType || '').toLowerCase();

  for (const entry of serviceMatchers) {
    if (entry.matches(normalizedType)) {
      return entry.meta;
    }
  }

  // Fallback to bike rental
  return {
    bookingType: 'bike',
    serviceId: 2,
    serviceName: 'Bike Rental',
    extras: {
      bike_duration: '2',
      bike_type: '1',
      other_info: 'Bike rental request',
    },
  };
};

const resolveService = (
  meta: BookingMeta,
  services: Service[]
): { id: number; name: string } => {
  if (!services || services.length === 0) {
    return { id: meta.serviceId, name: meta.serviceName };
  }

  const targets = (meta.matchNames ?? [meta.serviceName]).map((name) =>
    name.toLowerCase()
  );

  const found = services.find((service) => {
    const normalized = (service.name || '').toLowerCase();
    return targets.some((target) => normalized.includes(target));
  });

  return { id: found?.id || meta.serviceId, name: found?.name || meta.serviceName };
};

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('09:00');
  const [calendarError, setCalendarError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { locations } = useLocations();
  const { services } = useServices();
  const isDateStep = ['pickup-date', 'return-date'].includes(bookingStep);
  const isTimeStep = ['pickup-time', 'return-time'].includes(bookingStep);
  const calendarMode: 'date' | 'time' | 'idle' = isDateStep
    ? 'date'
    : isTimeStep
      ? 'time'
      : 'idle';

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

    if (isReturning) {
      return `${greeting}! Welcome back to TransRentals.\n\nI'm Shivi, your personal booking assistant. Ready to book and earn more Backr Tokens?\n\nDownload our app for instant bookings and exclusive rewards.`;
    }

    return `${greeting}! I'm Shivi, your smart vehicle rental assistant.\n\nBook in under 2 minutes and earn Backr Tokens with every ride.\n\nDownload our app for exclusive deals and faster bookings.\n\nWhat brings you here today?`;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Save visit timestamp
      localStorage.setItem('shivi_last_visit', new Date().toISOString());

      // God-level: Smart greeting with context - Professional buttons
      addShiviMessage(
        getSmartGreeting(),
        [
          { label: 'Car Rental', action: 'start-booking', value: 'car' },
          { label: 'Bike Rental', action: 'start-booking', value: 'bike' },
          { label: 'Bus Rental', action: 'start-booking', value: 'bus' },
          { label: 'Truck Rental', action: 'start-booking', value: 'truck' },
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
      if (isDateStep) {
        setTempDate(
          bookingStep === 'pickup-date'
            ? bookingData.pickupDate || ''
            : bookingData.returnDate || ''
        );
      } else {
        setTempDate('');
      }

      if (isTimeStep) {
        setTempTime(
          bookingStep === 'pickup-time'
            ? bookingData.pickupTime || '09:00'
            : bookingData.returnTime || '09:00'
        );
      } else {
        setTempTime('09:00');
      }

      setCalendarError('');
    }
  }, [
    showDatePicker,
    bookingStep,
    bookingData.pickupDate,
    bookingData.returnDate,
    bookingData.pickupTime,
    bookingData.returnTime,
    isDateStep,
    isTimeStep,
  ]);

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
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
        id: Date.now().toString(),
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

    // Handle based on current booking step
    if (bookingStep === 'pickup-location') {
      await handlePickupLocation(inputValue);
    } else if (bookingStep === 'drop-location') {
      await handleDropLocation(inputValue);
    } else if (bookingStep === 'pickup-date') {
      await handlePickupDate(inputValue);
    } else if (bookingStep === 'pickup-time') {
      await handlePickupTime(normalizeTimeInput(inputValue));
    } else if (bookingStep === 'return-date') {
      await handleReturnDate(inputValue);
    } else if (bookingStep === 'return-time') {
      await handleReturnTime(normalizeTimeInput(inputValue));
    } else if (bookingStep === 'name') {
      await handleName(inputValue);
    } else if (bookingStep === 'phone') {
      await handlePhone(inputValue);
    } else if (bookingStep === 'email') {
      await handleEmail(inputValue);
    } else if (bookingStep === 'requirements') {
      await handleRequirements(inputValue);
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

  const normalizeTimeInput = (value: string) => {
    const trimmed = value.trim();
    const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHourMatch) {
      let hour = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const meridian = twelveHourMatch[3].toUpperCase();
      if (meridian === 'PM' && hour < 12) hour += 12;
      if (meridian === 'AM' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${minute}`;
    }

    const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourHourMatch) {
      const hour = Number(twentyFourHourMatch[1]);
      const minute = twentyFourHourMatch[2];
      if (hour >= 0 && hour < 24) {
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      }
    }

    return trimmed;
  };

  const handleCalendarToggle = () => {
    setShowDatePicker((prev) => !prev);
    setCalendarError('');
  };

  const handleCalendarConfirm = async () => {
    setCalendarError('');

    if (calendarMode === 'date') {
      if (!tempDate) {
        const label = bookingStep === 'pickup-date' ? 'pickup date' : 'return date';
        setCalendarError(`Please select a ${label}.`);
        return;
      }

      const validation = validateDate(tempDate);
      if (!validation.valid) {
        setCalendarError(validation.message ?? 'Please choose a valid date.');
        return;
      }

      addUserMessage(tempDate);
      if (bookingStep === 'pickup-date') {
        await handlePickupDate(tempDate);
      } else {
        await handleReturnDate(tempDate);
      }
    } else if (calendarMode === 'time') {
      if (!tempTime) {
        setCalendarError('Please select a time.');
        return;
      }

      const normalizedTime = normalizeTimeInput(tempTime);
      const displayTime = formatTimeLabel(normalizedTime) || normalizedTime;
      addUserMessage(displayTime);
      if (bookingStep === 'pickup-time') {
        await handlePickupTime(normalizedTime);
      } else {
        await handleReturnTime(normalizedTime);
      }
    } else {
      setCalendarError('Start a booking flow so I can capture dates and times.');
      return;
    }

    setShowDatePicker(false);
    setInputValue('');
  };

  const handleOptionClick = async (action: string, value?: string) => {
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
      await showBookingSummary();
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
          { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
          { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
          { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
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
      const normalizedTime = normalizeTimeInput(value || '');
      addUserMessage(formatTimeLabel(normalizedTime) || normalizedTime);
      await handlePickupTime(normalizedTime);
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
        "TransRentals App – Your Travel Companion\n\nWhy Download?\n\n• Instant Bookings – Book in 30 seconds\n• Earn Backr Tokens – Get rewards on every booking\n• Exclusive App-Only Deals – Save up to 30%\n• Real-Time Tracking – Track your rides live\n• 24/7 Chat Support – Direct help anytime\n• Welcome Bonus – 100 FREE Backr Tokens on signup\n\nAvailable on Android:",
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
        "Backr Tokens – Your Travel Rewards\n\nBackr is our loyalty token that you earn with every booking.\n\nHow to Earn:\n• 50 tokens per completed booking\n• 100 tokens on first booking\n• 25 bonus tokens via app\n• 200 tokens on referrals\n\nHow to Use:\n• 1 token = ₹1 discount\n• Minimum 100 tokens to redeem\n• Use on any service\n• Never expire\n\nSpecial Perks:\n• Priority customer support\n• Early access to new vehicles\n• Exclusive seasonal offers\n\nDownload our app to track your tokens.",
        [
          { label: 'Download App', action: 'download-app' },
          { label: 'Start Booking', action: 'show-booking-options' },
        ]
      );
    } else if (action === 'app-ios') {
      addUserMessage('Download iOS App');
      window.open('https://apps.apple.com/app/transrentals', '_blank');
      addShiviMessage(
        "Opening App Store...\n\nDownload the TransRentals app and get 100 FREE Backr Tokens.\n\nReady to book now?",
        [
          { label: 'Yes, Book Now', action: 'show-booking-options' },
          { label: 'Ask a Question', action: 'ask-question' },
        ]
      );
    } else if (action === 'app-android') {
      addUserMessage('Download Android App');
      window.open('https://play.google.com/store/apps/details?id=com.transrentals', '_blank');
      addShiviMessage(
        "Opening Play Store...\n\nDownload the TransRentals app and get 100 FREE Backr Tokens.\n\nReady to book now?",
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
    }
  };

  const startBooking = async (serviceType: string) => {
    const serviceNames: Record<string, string> = {
      car: 'Car',
      bike: 'Bike',
      bus: 'Bus',
      truck: 'Truck',
      equipment: 'Equipment',
    };

    addUserMessage(`${serviceNames[serviceType]} Rental`);

    setBookingData({ serviceType, serviceName: serviceNames[serviceType] });

    const article = serviceType === 'equipment' ? '' : 'a ';
    addShiviMessage(
      `Great choice! Let me help you book ${article}${serviceNames[serviceType].toLowerCase()}. 🎯\n\nWhat type of ${serviceNames[serviceType].toLowerCase()} do you need?`,
      getServiceTypeOptions(serviceType)
    );
  };

  const getServiceTypeOptions = (serviceType: string) => {
    const options: Record<string, any[]> = {
      car: [
        { label: '🚗 Round Trip / Outstation', action: 'select-service-type', value: 'outstation-car-rental' },
        { label: '🔄 One Way Car Rental', action: 'select-service-type', value: 'one-way-car-rental' },
        { label: '✈️ Airport Transfer', action: 'select-service-type', value: 'airport-transfer' },
        { label: '🚕 Local Taxi', action: 'select-service-type', value: 'local-taxi' },
        { label: '🔑 Self Drive Car', action: 'select-service-type', value: 'self-drive-car-rentals' },
        { label: '💎 Luxury Car Rental', action: 'select-service-type', value: 'luxury-car-rental' },
        { label: '🏎️ Sports Car Rental', action: 'select-service-type', value: 'sports-car-rental' },
        { label: '🎩 Vintage Car Rental', action: 'select-service-type', value: 'vintage-car-rental' },
        { label: '💼 Corporate Car Rental', action: 'select-service-type', value: 'corporate-car-rental' },
        { label: '💒 Wedding Car Rental', action: 'select-service-type', value: 'wedding-car-rental' },
        { label: '📅 Monthly Car Rental', action: 'select-service-type', value: 'monthly-car-rental' },
        { label: '👔 Chauffeur Service', action: 'select-service-type', value: 'chauffeur-service' },
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
    setBookingData((prev) => ({ ...prev, serviceType: subType }));

    // God-level: More engaging messaging with emoji and context
    addShiviMessage(
      "Perfect choice! 🎯\n\n📍 Which city would you like to pick up from?\n\n💡 We operate in 250+ cities across India!",
      locations.slice(0, 6).map((loc) => ({
        label: `${loc.name}`,
        action: 'select-location',
        value: loc.name,
      })),
      'text',
      'Type your city name...'
    );

    setBookingStep('pickup-location');
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 900);
  };

  const handlePickupLocation = async (location: string) => {
    const selectedLocation = locations.find((loc) =>
      loc.name.toLowerCase() === location.toLowerCase()
    );

    setBookingData((prev) => ({
      ...prev,
      pickupLocation: location,
      pickupLocationId: selectedLocation?.id.toString() || '',
    }));

    // Services that need drop location
    const needsDropLocation = bookingData.serviceType?.includes('one-way') ||
                              bookingData.serviceType?.includes('airport-transfer');

    if (needsDropLocation) {
      // God-level: Smart suggestions for popular routes from pickup location
      const smartSuggestions = getSmartLocationSuggestions(location);

      addShiviMessage(
        `Great! Pickup from ${location}. 🚗\n\n📍 Where would you like to drop off?\n\n${smartSuggestions[0].label.includes('Popular') ? '💡 Popular routes highlighted!' : ''}`,
        smartSuggestions,
        'text',
        'Type drop-off city...'
      );
      setBookingStep('drop-location');
      setTimeout(() => inputRef.current?.focus(), 900);
    } else {
      await askForPickupDate();
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

    // God-level: Calculate approximate distance for popular routes
    const pickupLoc = bookingData.pickupLocation;
    let distanceInfo = '';

    const roughDistances: Record<string, Record<string, number>> = {
      'Delhi': { 'Agra': 230, 'Jaipur': 280, 'Shimla': 350, 'Chandigarh': 250 },
      'Mumbai': { 'Pune': 150, 'Goa': 580, 'Nashik': 165 },
      'Bangalore': { 'Mysore': 150, 'Ooty': 270, 'Chennai': 350 },
    };

    if (pickupLoc && roughDistances[pickupLoc]?.[location]) {
      const distance = roughDistances[pickupLoc][location];
      distanceInfo = `\n\n🚗 Approx. ${distance}km • ${Math.ceil(distance / 60)}h drive`;
    }

    addShiviMessage(
      `Perfect! ${pickupLoc} → ${location} 🎯${distanceInfo}`,
      undefined
    );

    await askForPickupDate();
  };

  const skipDropLocation = async () => {
    addUserMessage('Same as pickup location');
    setBookingData((prev) => ({ ...prev, dropLocation: prev.pickupLocation }));
    await askForPickupDate();
  };

  const askForPickupDate = async () => {
    addShiviMessage(
      "📅 When do you need the vehicle?\n\nPlease enter pickup date (e.g., 2024-12-25):",
      [
        { label: '📅 Open calendar & choose date', action: 'open-calendar' },
      ],
      'date',
      'YYYY-MM-DD',
      'pickup-date'
    );
    setBookingStep('pickup-date');
  };

  const handlePickupDate = async (date: string) => {
    // God-level: Intelligent date validation
    const validation = validateDate(date);

    if (!validation.valid) {
      addShiviMessage(
        validation.message!,
        validation.suggestedDate ? [
          { label: `📅 Use Today`, action: 'use-suggested-date', value: new Date().toISOString().split('T')[0] },
          { label: `📅 Use Tomorrow`, action: 'use-suggested-date', value: validation.suggestedDate },
        ] : undefined,
        'date',
        'YYYY-MM-DD'
      );
      return;
    }

    setBookingData((prev) => ({ ...prev, pickupDate: date }));

    // God-level: Smart time suggestions based on date
    const selectedDate = new Date(date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      addShiviMessage(
        `Perfect! ${dayName}, ${date}.\n\nWhat time would you like to pick up?\n\nPopular times: 9 AM, 12 PM, 6 PM`,
        [
          { label: 'Morning (9 AM)', action: 'select-time', value: '09:00' },
          { label: 'Noon (12 PM)', action: 'select-time', value: '12:00' },
          { label: 'Evening (6 PM)', action: 'select-time', value: '18:00' },
          { label: 'Custom Time', action: 'custom-time' },
          { label: 'Use time selector', action: 'open-calendar', value: 'pickup-time' },
        ]
      );
    setBookingStep('pickup-time');
  };

  const handlePickupTime = async (time: string) => {
    const normalizedTime = normalizeTimeInput(time);
    setBookingData((prev) => ({ ...prev, pickupTime: normalizedTime }));

    // Services that DON'T need return date/time
    const oneWayServices = [
      'one-way',
      'airport-transfer',
      'local-taxi',
      'chauffeur-service'
    ];

    const needsReturnDate = !oneWayServices.some(service =>
      bookingData.serviceType?.includes(service)
    );

    if (needsReturnDate) {
    addShiviMessage(
      "📅 When would you like to return?\n\nPlease enter return date:",
      [
        { label: '📅 Open calendar & choose date', action: 'open-calendar', value: 'return-date' },
      ],
      'date',
      'YYYY-MM-DD',
      'return-date'
    );
      setBookingStep('return-date');
    } else {
      await askForContactDetails();
    }
  };

  const handleReturnDate = async (date: string) => {
    setBookingData((prev) => ({ ...prev, returnDate: date }));

    addShiviMessage(
      "🕐 Return time?\n\nPlease enter return time:",
      [
        { label: '🕓 Use time selector', action: 'open-calendar', value: 'return-time' },
      ],
      'text',
      'HH:MM AM/PM',
      'return-time'
    );
    setBookingStep('return-time');
  };

  const handleReturnTime = async (time: string) => {
    const normalizedTime = normalizeTimeInput(time);
    setBookingData((prev) => ({ ...prev, returnTime: normalizedTime }));
    await askForContactDetails();
  };

  const askForContactDetails = async () => {
    addShiviMessage(
      "Almost done! 👤 What's your name?\n\n🪙 FYI: You'll earn 50 Backr Tokens (₹50 value) when you complete this trip!",
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
      '+91 XXXXXXXXXX',
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
        '+91 XXXXXXXXXX'
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

    const summary = `
🎯 Almost Done! Here's your booking summary:

🚗 Service: ${serviceTypeName}
📍 From: ${bookingData.pickupLocation}${bookingData.dropLocation && bookingData.dropLocation !== bookingData.pickupLocation ? `\n📍 To: ${bookingData.dropLocation}` : ''}
📅 Pickup: ${bookingData.pickupDate} at ${bookingData.pickupTime}${bookingData.returnDate ? `\n📅 Return: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${tripDuration}

👤 Contact Details:
• Name: ${bookingData.name}
• Phone: ${bookingData.phone}
• Email: ${bookingData.email}${bookingData.requirements ? `\n\n📝 Special Requirements:\n${bookingData.requirements}` : ''}

✨ You'll receive quotations from multiple verified vendors!

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

  const submitBooking = async () => {
    addUserMessage('Yes, confirm booking');
    setIsSubmitting(true);

    try {
      // God-level: Smart API routing based on service type
      // For MVP/demo purposes, we'll use a simplified bike booking
      // Prepare customer info
      const customerInfo = {
        name: bookingData.name || '',
        email: bookingData.email || '',
        phone: bookingData.phone || '',
      };

      // Prepare journey datetime in ISO format
      const journeyDatetime = bookingData.pickupDate && bookingData.pickupTime
        ? `${bookingData.pickupDate}T${bookingData.pickupTime}:00`
        : new Date().toISOString();

      const returnDatetime = bookingData.returnDate && bookingData.returnTime
        ? `${bookingData.returnDate}T${bookingData.returnTime}:00`
        : undefined;

      const bookingMeta = getBookingMeta(bookingData.serviceType);
      const resolvedService = resolveService(bookingMeta, services);

      const locationId = parseInt(bookingData.pickupLocationId || '1', 10);
      const extras = { ...(bookingMeta.extras || {}) } as Record<string, string | number>;
      const templateOtherInfo = typeof extras.other_info === 'string' ? extras.other_info : '';
      delete extras.other_info;

      const bookingPayload = {
        customer_id: 0,
        service_id: resolvedService.id,
        service_name: resolvedService.name,
        location_id: Number.isNaN(locationId) ? 1 : locationId,
        location_name: bookingData.pickupLocation || '',
        destination: bookingData.dropLocation || bookingData.pickupLocation || '',
        journey_datetime: journeyDatetime,
        return_datetime: returnDatetime,
        ...extras,
        other_info: bookingData.requirements || templateOtherInfo || '',
      };

      // Use unified booking API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType: bookingMeta.bookingType,
          customerInfo,
          bookingData: bookingPayload,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Booking API failure', result);
        const errorMessage = result.errors?.length
          ? result.errors.map((err: any) => err?.message || JSON.stringify(err)).join(' | ')
          : result.message;
        throw new Error(errorMessage || 'Booking failed');
      }

      // God-level: Personalized success message with name
      const firstName = bookingData.name?.split(' ')[0] || 'there';
      const bookingId = result.booking_id || Date.now();

      // God-level: Save to local storage for returning user experience
      const bookingHistory = JSON.parse(localStorage.getItem('shivi_booking_count') || '0');
      localStorage.setItem('shivi_booking_count', (bookingHistory + 1).toString());

      const isFirstBooking = bookingHistory === 0;

      addShiviMessage(
        `Booking Confirmed, ${firstName}!\n\n${isFirstBooking ? 'Welcome to the TransRentals family. ' : ''}Your ${bookingData.serviceType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} booking has been confirmed.\n\nBooking ID: #${bookingId}\n\nWhat Happens Next:\n• Multiple verified vendors will send quotations (within 30 minutes)\n• Compare quotes and choose the best one\n• Get confirmation via email (${bookingData.email}) and SMS\n\nBACKR TOKENS REWARD:\n• Earn ${isFirstBooking ? '125' : '50'} Backr Tokens on trip completion\n${isFirstBooking ? '• BONUS: 100 tokens = ₹100 FREE on your next booking\n' : ''}• 1 Token = ₹1 | Redeem anytime | Never expire\n\nDOWNLOAD APP NOW:\n• Track bookings in real-time\n• Manage your ${isFirstBooking ? '125' : bookingHistory + 50} Backr Tokens\n• Get exclusive app-only deals (save up to 30%)\n• Get 100 FREE welcome tokens\n\n${isFirstBooking ? 'First booking special: Download app and get an extra 25 tokens.' : 'Download our app to unlock premium benefits.'}`,
        [
          { label: 'Download App (Get 100 Tokens)', action: 'download-app' },
          { label: 'View My Tokens', action: 'about-backr' },
          { label: 'Book Another', action: 'new-booking' },
        ]
      );

      setBookingStep('completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Booking failed';

      addShiviMessage(
        `Oops! ${errorMessage}\n\nDon't worry, your details are safe. Please try again, or if the problem persists:\n\nCall us: +91 97379 65551\nEmail: book@TransRentals.in\n\nWe're here to help 24/7!`,
        [
          { label: 'Try Again', action: 'confirm-booking' },
          { label: 'Go to Homepage', action: 'go-home' },
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
    addShiviMessage(
      "Hi! I'm Shivi 👋\n\nReady for your next booking? Earn more Backr Tokens! 🪙\n\nWhat would you like to rent?",
      [
        { label: '🚗 Car Rental', action: 'start-booking', value: 'car' },
        { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
        { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
        { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
        { label: '🏗️ Equipment Rental', action: 'start-booking', value: 'equipment' },
        { label: '📱 Download App', action: 'download-app' },
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

        // Increment use count
        fetch('/api/knowledge-base/search', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: topResult.id }),
        }).catch(() => {}); // Silent fail for tracking

        // Show the answer with booking options
        addShiviMessage(
          `${topResult.answer}\n\n💡 Can I help you with anything else?`,
          [
            { label: '🚗 Book Vehicle', action: 'show-booking-options' },
            { label: '❓ Ask Another Question', action: 'ask-question' },
          ]
        );
      } else {
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
          { label: '🏍️ Bike Rental', action: 'start-booking', value: 'bike' },
          { label: '🚌 Bus Rental', action: 'start-booking', value: 'bus' },
          { label: '🚚 Truck Rental', action: 'start-booking', value: 'truck' },
          { label: '🏗️ Equipment Rental', action: 'start-booking', value: 'equipment' },
          { label: '🚛 Trailer Rental', action: 'start-booking', value: 'trailer' },
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
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <MessageCircle className="w-8 h-8 text-white" />
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
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 48px)' }}
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
                onClick={() => setIsOpen(false)}
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
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
                  onChange={(e) => setInputValue(e.target.value)}
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
                    {calendarMode === 'idle' ? (
                      <p className="text-xs text-gray-600 mt-2">
                        Start a booking and tap a date or time prompt so I know what to show here.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 mt-2">
                        {calendarMode === 'date'
                          ? 'Choose the date you want to travel.'
                          : 'Pick the time you would like to depart.'}
                      </p>
                    )}
                  </div>
                  {calendarMode === 'date' && (
                    <div>
                      <label className="block text-xs text-gray-600">Date</label>
                      <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                  {calendarMode === 'time' && (
                    <div>
                      <label className="block text-xs text-gray-600">Time</label>
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
                      disabled={calendarMode === 'idle'}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${calendarMode === 'idle'
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
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
