'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Sparkles, CheckCircle, User, AlertTriangle, Calendar, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocations } from './useLocations';
import { useServices } from './useServices';
import { ALL_VEHICLES, getVehicleImage, VEHICLE_IMAGES, DEFAULT_VEHICLE_IMAGES, getVehicleByName } from '@/data/fleet';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  WHATSAPP_NUMBER_DIGITS,
  WHATSAPP_NUMBER_DISPLAY,
} from '@/lib/contact';
import { getFlowType, FlowType, isCarWithDriverServiceType } from './serviceConfigs';

interface Message {
  id: string;
  type: 'user' | 'shivi';
  content: string;
  timestamp: Date;
  options?: { label: string; action: string; value?: string }[];
  inputType?: 'text' | 'date' | 'datetime-local' | 'tel' | 'email' | 'password';
  placeholder?: string;
  image?: string; // Optional vehicle image URL
}

interface ChatBookingHeroProps {
  serviceType: string;
  serviceName: string;
  vehicleModelName?: string; // Specific model name (e.g. "Seltos", "KTM") for model-specific pages
  defaultLocation?: string;
  vehicleName?: string;
  subServices?: { label: string; value: string }[];
  hideHeader?: boolean;
}

export function ChatBookingHero({
  serviceType,
  serviceName,
  vehicleModelName,
  defaultLocation,
  vehicleName,
  subServices,
  hideHeader = false
}: ChatBookingHeroProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dateError, setDateError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bookingData, setBookingData] = useState<any>({
    serviceType,
    serviceName,
    pickupLocation: defaultLocation || '',
    fleet: vehicleName || '',
  });
  const [currentStep, setCurrentStep] = useState('');
  const [vehicleConfirmed, setVehicleConfirmed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInCustomer, setLoggedInCustomer] = useState<any>(null);
  const [isB2B, setIsB2B] = useState(false);
  const [hourInput, setHourInput] = useState('09');
  const [minInput, setMinInput] = useState('00');
  const [calView, setCalView] = useState<{ y: number; m: number }>(() => {
    const d = new Date(); d.setMonth(d.getMonth());
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const hourFocused = useRef(false);
  const minFocused = useRef(false);

  const B2B_SERVICES = ['car', 'self-drive', 'bus'];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greetingShownRef = useRef(false);

  const { locations } = useLocations();
  const { services } = useServices();

  // Sync hour/minute display inputs from inputValue (only when not focused)
  useEffect(() => {
    const t = inputValue.split('T')[1];
    if (!t) return;
    const [h24n, mn] = t.split(':').map(Number);
    if (!hourFocused.current) {
      const h12 = (h24n ?? 9) === 0 ? 12 : (h24n ?? 9) > 12 ? (h24n ?? 9) - 12 : (h24n ?? 9);
      setHourInput(String(h12).padStart(2, '0'));
    }
    if (!minFocused.current) {
      setMinInput(String(mn ?? 0).padStart(2, '0'));
    }
  }, [inputValue]);

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const customerData = localStorage.getItem('customer');
      if (token && customerData) {
        try {
          const customer = JSON.parse(customerData);
          setIsLoggedIn(true);
          setLoggedInCustomer(customer);
          // Strip travel-agent shadow placeholder phone (`ta-<id>`) — invalid
          // for booking validation. The profile-API call below will heal it
          // by fetching the agent's real phone if available.
          const safePhone =
            typeof customer.phone === 'string' && customer.phone.startsWith('ta-')
              ? ''
              : (customer.phone || '');
          // Pre-fill booking data with customer info
          setBookingData((prev: any) => ({
            ...prev,
            name: customer.name || '',
            email: customer.email || '',
            phone: safePhone,
          }));
          // Check B2B status + auto-heal phone if user is a travel agent
          // whose shadow customer carries a placeholder phone.
          const params = new URLSearchParams();
          if (customer.id) params.set('customer_id', String(customer.id));
          if (customer.email) params.set('email', customer.email);
          if (params.toString()) {
            fetch(`/api/customer/b2b-status?${params.toString()}`)
              .then(res => res.json())
              .then(data => { if (data.isB2B) setIsB2B(true); })
              .catch(() => {});
          }
          if (customer.id) {
            fetch(`/api/customer/profile?customer_id=${customer.id}`)
              .then(r => r.json())
              .then(d => {
                const agentPhone = d?.customers?.linkedAgentPhone || null;
                if (agentPhone) {
                  setBookingData((prev: any) => ({
                    ...prev,
                    phone: prev.phone || agentPhone,
                  }));
                  // Also patch localStorage for other pages.
                  try {
                    const stored = JSON.parse(localStorage.getItem('customer') || '{}');
                    if (typeof stored.phone !== 'string' || stored.phone.startsWith('ta-')) {
                      localStorage.setItem('customer', JSON.stringify({ ...stored, phone: agentPhone }));
                    }
                  } catch { /* ignore */ }
                }
              })
              .catch(() => {});
          }
        } catch (e) {
          console.error('Failed to parse customer data:', e);
        }
      }
    }
  }, []);

  // God-level: Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // God-level: Intelligent phone validation
  const validatePhone = (phone: string): { valid: boolean; message?: string } => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return { valid: false, message: "Phone number is too short. Please enter 10 digits 📱" };
    }
    if (cleaned.length === 10 && !['6', '7', '8', '9'].includes(cleaned[0])) {
      return { valid: false, message: "Indian mobile numbers start with 6, 7, 8, or 9 📱" };
    }
    return { valid: true };
  };

  // God-level: Intelligent email validation
  const validateEmail = (email: string): { valid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Please enter a valid email (e.g., name@example.com) 📧" };
    }
    return { valid: true };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest', // Prevents whole page from scrolling
      inline: 'nearest'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Prevent infinite loop - only show greeting once
    if (greetingShownRef.current) return;
    greetingShownRef.current = true;

    // God-level: Show smart greeting with time-based personalization - Professional version
    setIsTyping(true);
    setTimeout(() => {
      const greeting = getTimeBasedGreeting();
      const greetingMessage: Message = {
        id: Date.now().toString(),
        type: 'shivi',
        content: `${greeting}! I'm Shivi, your ${serviceName} booking assistant.\n\nReady to find the perfect ${serviceName.toLowerCase()}? Book now and earn Backr Tokens on trip completion.\n\nPro Tip: Download our app for exclusive deals and faster bookings.\n\nType anything to begin.`,
        timestamp: new Date(),
        inputType: 'text',
        placeholder: 'Type your message...',
      };
      setMessages([greetingMessage]);
      setIsTyping(false);
      setCurrentStep('waiting-for-user');

      // Auto-focus input so user can start typing
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 300);
  }, [serviceName]);

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
    delay: number = 800,
    inputType?: 'text' | 'date' | 'datetime-local' | 'tel' | 'email' | 'password',
    placeholder?: string,
    image?: string
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
        image,
      };
      setMessages((prev) => [...prev, message]);
      setIsTyping(false);

      // Auto-focus input if expecting text input
      if (inputType && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, delay);
  };

  // Helper to get vehicle image by name
  const getVehicleImageByName = (name: string): string | undefined => {
    // Try to find vehicle in fleet data by name
    const vehicle = ALL_VEHICLES.find(v =>
      v.name.toLowerCase() === name.toLowerCase() ||
      v.slug === name.toLowerCase().replace(/\s+/g, '-')
    );
    if (vehicle) {
      return getVehicleImage(vehicle);
    }
    // Fallback - try to match by slug in VEHICLE_IMAGES
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return VEHICLE_IMAGES[slug as keyof typeof VEHICLE_IMAGES];
  };

  const askForLocation = (forceShowList: boolean = false) => {
    setIsTyping(true);
    setTimeout(() => {
      // Show more locations from database (up to 20)
      const locationOptions = locations.slice(0, 20).map(loc => ({
        label: `📍 ${loc.name}`,
        action: 'select-location',
        value: loc.name,
      }));

      // Add search option at the end
      if (locations.length > 20) {
        locationOptions.push({
          label: '🔍 Search for Other City',
          action: 'search-location',
          value: '',
        });
      }

      // Show list directly if forced or no default location
      if (forceShowList || !defaultLocation) {
        addShiviMessage(
          `Which city do you need the service in?\n\n${locations.length > 20 ? `(Showing top 20 of ${locations.length} cities)` : `(${locations.length} cities available)`}`,
          locationOptions,
          0
        );
      } else {
        // Show confirmation if default location exists
        addShiviMessage(
          `I see you're looking for service in ${defaultLocation}. Is this correct?`,
          [
            { label: '✅ Yes, ' + defaultLocation, action: 'confirm-location', value: defaultLocation },
            { label: '📍 Different City', action: 'change-location', value: '' },
          ],
          0
        );
      }
      setCurrentStep('location');
    }, 800);
  };

  const askForLocationSearch = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        `🔍 Search for your city\n\nType the name of your city below:`,
        undefined,
        0,
        'text',
        'e.g., Jaipur, Hyderabad, etc.'
      );
      setCurrentStep('location-search');
    }, 800);
  };

  const askForPickupDateTime = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'When do you need the service? 📅⏰\n(Select your pickup date and time)\n\nNote: You cannot select past dates',
        undefined,
        0,
        'datetime-local',
        'Select date & time'
      );
      setCurrentStep('pickup-datetime');
      // Pre-fill with tomorrow at 09:00 AM as a sensible default
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setInputValue(`${tomorrow.toISOString().split('T')[0]}T09:00`);
    }, 800);
  };

  const askForReturnDateTime = (pickupDt?: string) => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'When will you return the vehicle? 📅⏰\n(Select your return date and time)\n\nNote: Return date must be after start date',
        undefined,
        0,
        'datetime-local',
        'Select return date & time'
      );
      setCurrentStep('return-datetime');
      // Pre-fill return: pickup date + 1 day at 06:00 PM
      const base = pickupDt ? new Date(pickupDt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const returnDt = new Date(base.getTime() + 24 * 60 * 60 * 1000);
      setInputValue(`${returnDt.toISOString().split('T')[0]}T18:00`);
    }, 800);
  };

  const askForDuration = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Select Duration ⏱️\n\nHow long do you need the vehicle?',
        [
          { label: '⏰ Hourly', action: 'select-duration', value: '1' },
          { label: '📅 Daily', action: 'select-duration', value: '2' },
          { label: '📅 Weekly', action: 'select-duration', value: '3' },
          { label: '📅 Monthly', action: 'select-duration', value: '4' },
        ],
        0
      );
      setCurrentStep('duration');
    }, 800);
  };

  const askForCarTripType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of car rental do you need? 🚗',
        [
          { label: '🔄 Round Trip', action: 'select-trip-type', value: 'roundtrip' },
          { label: '✈️ Airport Taxi', action: 'select-trip-type', value: 'airport' },
          { label: '➡️ One-Way', action: 'select-trip-type', value: 'oneway' },
        ],
        0
      );
      setCurrentStep('trip-type');
    }, 800);
  };

  const askForBusTripType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What service do you need? 🚌',
        [
          { label: '🛣️ Outstation', action: 'select-bus-trip-type', value: 'outstation' },
          { label: '🏙️ Local', action: 'select-bus-trip-type', value: 'local' },
        ],
        0
      );
      setCurrentStep('bus-trip-type');
    }, 800);
  };

  const askForTruckMode = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is this for personal or commercial use? 🚚',
        [
          { label: '🏠 Personal Use', action: 'select-truck-mode', value: '1' },
          { label: '🏭 Commercial Use', action: 'select-truck-mode', value: '2' },
        ],
        0
      );
      setCurrentStep('truck-mode');
    }, 800);
  };

  const askForTruckType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of truck do you need? 🚚',
        [
          { label: '🚚 Tata Ace', action: 'select-truck-type', value: '14' },
          { label: '🚚 Tata 407 (2.5 MT)', action: 'select-truck-type', value: '12' },
          { label: '🚚 Canter 17ft (4 wheel)', action: 'select-truck-type', value: '2' },
          { label: '🚚 Truck 9MT (6 Wheel)', action: 'select-truck-type', value: '13' },
          { label: '🚛 More Options...', action: 'show-more-trucks', value: 'more' },
        ],
        0
      );
      setCurrentStep('truck-type');
    }, 800);
  };

  const askForMoreTruckTypes = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Select your truck type: 🚛',
        [
          { label: '🚚 Truck 16MT (10 Wheel)', action: 'select-truck-type', value: '11' },
          { label: '🚚 Truck 20MT (12 Wheel)', action: 'select-truck-type', value: '9' },
          { label: '🚛 Truck 25MT (14 Wheel)', action: 'select-truck-type', value: '10' },
          { label: '🚛 Semi Low Bed Trailer', action: 'select-truck-type', value: '8' },
          { label: '🚚 LCV', action: 'select-truck-type', value: '7' },
        ],
        0
      );
      setCurrentStep('truck-type-more');
    }, 800);
  };

  const askForTruckGoodsType = (isCommercial: boolean = false) => {
    setIsTyping(true);
    const goodsOptions = isCommercial ? [
      { label: '🏗️ Building Materials', action: 'select-goods-type', value: '1' },
      { label: '⚙️ Industrial Equipment', action: 'select-goods-type', value: '13' },
      { label: '🔩 Iron/Steel Material', action: 'select-goods-type', value: '14' },
      { label: '📦 Container', action: 'select-goods-type', value: '6' },
      { label: '📋 More Options...', action: 'show-more-goods', value: 'more' },
    ] : [
      { label: '🏠 Household Goods', action: 'select-goods-type', value: '12' },
      { label: '🪑 Furniture & Wood', action: 'select-goods-type', value: '11' },
      { label: '📺 Electronics', action: 'select-goods-type', value: '8' },
      { label: '🚗 Vehicles/Automobiles', action: 'select-goods-type', value: '28' },
      { label: '📋 More Options...', action: 'show-more-goods', value: 'more' },
    ];
    setTimeout(() => {
      addShiviMessage(
        'What type of goods are you transporting? 📦',
        goodsOptions,
        0
      );
      setCurrentStep('goods-type');
    }, 800);
  };

  const askForMoreGoodsTypes = (isCommercial: boolean = false) => {
    setIsTyping(true);
    const moreGoodsOptions = isCommercial ? [
      { label: '🧱 Cement', action: 'select-goods-type', value: '3' },
      { label: '⚗️ Chemical', action: 'select-goods-type', value: '4' },
      { label: '🏭 Machineries', action: 'select-goods-type', value: '16' },
      { label: '🛢️ Liquid/Oil Drums', action: 'select-goods-type', value: '15' },
      { label: '📦 Other Goods', action: 'select-goods-type', value: '20' },
    ] : [
      { label: '📚 Books/Paper Rolls', action: 'select-goods-type', value: '21' },
      { label: '🌾 Crop/Agriculture', action: 'select-goods-type', value: '23' },
      { label: '👕 Textiles', action: 'select-goods-type', value: '26' },
      { label: '🔧 Scrap', action: 'select-goods-type', value: '24' },
      { label: '📦 Others', action: 'select-goods-type', value: '29' },
    ];
    setTimeout(() => {
      addShiviMessage(
        'More goods options:',
        moreGoodsOptions,
        0
      );
      setCurrentStep('goods-type-more');
    }, 800);
  };

  const askForWeight = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the approximate weight of your goods? ⚖️\n(Enter the weight value)',
        undefined,
        0,
        'text',
        'e.g., 500, 1000, 2500'
      );
      setCurrentStep('weight');
    }, 800);
  };

  const askForWeightUnit = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What unit is the weight in? ⚖️',
        [
          { label: '📦 KG (Kilograms)', action: 'select-weight-unit', value: '1' },
          { label: '🚚 TON (Metric Tons)', action: 'select-weight-unit', value: '2' },
        ],
        0
      );
      setCurrentStep('weight-unit');
    }, 800);
  };

  // Self-Drive specific questions
  const askForSelfDriveCarType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of car would you like? 🚗',
        [
          { label: '🚗 Hatchback', action: 'select-selfdrive-car-type', value: '1' },
          { label: '🚙 Sedan', action: 'select-selfdrive-car-type', value: '2' },
          { label: '🚐 MUV', action: 'select-selfdrive-car-type', value: '3' },
          { label: '🚙 SUV', action: 'select-selfdrive-car-type', value: '4' },
        ],
        0
      );
      setCurrentStep('selfdrive-car-type');
    }, 800);
  };

  const askForTransmission = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Which transmission do you prefer? ⚙️',
        [
          { label: '⚙️ Automatic', action: 'select-transmission', value: '1' },
          { label: '🔧 Manual', action: 'select-transmission', value: '2' },
        ],
        0
      );
      setCurrentStep('transmission');
    }, 800);
  };

  const askForFuelType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What fuel type do you prefer? ⛽',
        [
          { label: '⛽ Diesel', action: 'select-fuel-type', value: '1' },
          { label: '⛽ Petrol', action: 'select-fuel-type', value: '2' },
          { label: '🔋 Electric', action: 'select-fuel-type', value: '3' },
          { label: '💨 CNG', action: 'select-fuel-type', value: '4' },
        ],
        0
      );
      setCurrentStep('fuel-type');
    }, 800);
  };

  const askForDoorstepDelivery = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Would you like doorstep delivery? 🚗',
        [
          { label: '✅ Yes, deliver to my location', action: 'select-doorstep', value: '1' },
          { label: '❌ No, I will pick up', action: 'select-doorstep', value: '0' },
        ],
        0
      );
      setCurrentStep('doorstep-delivery');
    }, 800);
  };

  // Luxury Car specific questions
  const askForLuxuryType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the occasion? 💎',
        [
          { label: '💒 Wedding', action: 'select-luxury-type', value: '1' },
          { label: '👤 Personal', action: 'select-luxury-type', value: '2' },
          { label: '💼 Corporate', action: 'select-luxury-type', value: '3' },
        ],
        0
      );
      setCurrentStep('luxury-type');
    }, 800);
  };

  const askForLuxuryPackage = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Select your package 📦',
        [
          { label: '🏙️ Local (8hr/80km)', action: 'select-luxury-package', value: '1' },
          { label: '🛣️ Outstation Trip', action: 'select-luxury-package', value: '3' },
          { label: '✈️ Airport Transfer', action: 'select-luxury-package', value: '4' },
        ],
        0
      );
      setCurrentStep('luxury-package');
    }, 800);
  };

  const askForShiftingType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of shifting do you need? 🏠',
        [
          { label: '🏠 Home Shifting', action: 'select-shifting-type', value: 'Home' },
          { label: '🏢 Office Shifting', action: 'select-shifting-type', value: 'Office' },
          { label: '🚗 Vehicle Transport', action: 'select-shifting-type', value: 'Vehicle' },
        ],
        0
      );
      setCurrentStep('shifting-type');
    }, 800);
  };

  // Equipment rental specific questions
  const askForEquipmentType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of equipment do you need? 🏗️',
        [
          { label: '🏗️ Grove crane', action: 'select-equipment-type', value: '1' },
          { label: '🚚 Truck mounted crane', action: 'select-equipment-type', value: '2' },
          { label: '🏗️ Tower crane', action: 'select-equipment-type', value: '3' },
          { label: '🏗️ Telescopic crane', action: 'select-equipment-type', value: '4' },
          { label: '📋 More Equipment...', action: 'show-more-equipment', value: 'more' },
        ],
        0
      );
      setCurrentStep('equipment-type');
    }, 800);
  };

  const askForMoreEquipmentTypes = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Select your equipment type: 🏗️',
        [
          { label: '🏗️ Rough terrain crane', action: 'select-equipment-type', value: '5' },
          { label: '🏗️ Overhead crane', action: 'select-equipment-type', value: '6' },
          { label: '🚜 Bulldozer', action: 'select-equipment-type', value: '7' },
          { label: '🚛 Dumper', action: 'select-equipment-type', value: '8' },
          { label: '📋 More...', action: 'show-more-equipment-2', value: 'more2' },
        ],
        0
      );
      setCurrentStep('equipment-type-more');
    }, 800);
  };

  const askForMoreEquipmentTypes2 = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'More equipment options: 🏗️',
        [
          { label: '🚜 Loader', action: 'select-equipment-type', value: '9' },
          { label: '🚧 Excavators', action: 'select-equipment-type', value: '10' },
          { label: '🚜 Backhoe loader', action: 'select-equipment-type', value: '11' },
        ],
        0
      );
      setCurrentStep('equipment-type-more-2');
    }, 800);
  };

  const askForJobDuration = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'How long do you need the equipment? ⏱️',
        [
          { label: '📅 1 to 5 Days', action: 'select-job-duration', value: '1' },
          { label: '📆 6 to 15 Days', action: 'select-job-duration', value: '2' },
          { label: '🗓️ 16 to 30 Days', action: 'select-job-duration', value: '3' },
          { label: '📊 More than 30 Days', action: 'select-job-duration', value: '4' },
        ],
        0
      );
      setCurrentStep('job-duration');
    }, 800);
  };

  const askForNumberOfEquipment = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'How many equipment units do you need? 🔢\n(Enter the number)',
        undefined,
        0,
        'text',
        'e.g., 1, 2, 3'
      );
      setCurrentStep('no-of-equipment');
    }, 800);
  };

  const askForHomeShiftingSize = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the size of your home? 🏠',
        [
          { label: '1 BHK', action: 'select-home-size', value: 'BHK_1' },
          { label: '2 BHK', action: 'select-home-size', value: 'BHK_2' },
          { label: '3 BHK', action: 'select-home-size', value: 'BHK_3' },
          { label: '4+ BHK / Villa', action: 'select-home-size', value: 'BHK_More_THAN_4' },
        ],
        0
      );
      setCurrentStep('home-size');
    }, 800);
  };

  // ============================================================
  // PACKERS & MOVERS — Extended quotation field helpers
  // ============================================================

  const askForShiftingScope = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the scope of your move? 🌍',
        [
          { label: '🏙️ Local (within city)', action: 'select-shifting-scope', value: 'LOCAL' },
          { label: '🛣️ Domestic (within state)', action: 'select-shifting-scope', value: 'DOMESTIC' },
          { label: '🚛 Intercity (between states)', action: 'select-shifting-scope', value: 'INTERCITY' },
        ],
        0
      );
      setCurrentStep('shifting-scope');
    }, 800);
  };

  const askForOfficeSize = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the size of your office? 🏢',
        [
          { label: '1-10 Employees', action: 'select-office-size', value: 'UPTO_10_EMPLOYEES' },
          { label: '11-50 Employees', action: 'select-office-size', value: 'UPTO_50_EMPLOYEES' },
          { label: '51-100 Employees', action: 'select-office-size', value: 'UPTO_100_EMPLOYEES' },
          { label: '100+ Employees', action: 'select-office-size', value: 'MORE_THAN_100_EMPLOYEES' },
        ],
        0
      );
      setCurrentStep('office-size');
    }, 800);
  };

  const askForVehicleSubType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of vehicle do you need to transport? 🚗',
        [
          { label: '🚗 Car', action: 'select-vehicle-subtype', value: 'CAR' },
          { label: '🏍️ Bike', action: 'select-vehicle-subtype', value: 'BIKE' },
          { label: '🚗🏍️ Both Car & Bike', action: 'select-vehicle-subtype', value: 'BOTH' },
        ],
        0
      );
      setCurrentStep('vehicle-subtype');
    }, 800);
  };

  const askForPickupPincode = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "What's your pickup area pincode? 📮 (6 digits)",
        undefined,
        0,
        'text',
        'e.g., 110001'
      );
      setCurrentStep('pickup-pincode');
    }, 800);
  };

  const askForDropPincode = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "What's your drop area pincode? 📮 (6 digits)",
        undefined,
        0,
        'text',
        'e.g., 400001'
      );
      setCurrentStep('drop-pincode');
    }, 800);
  };

  const askForPickupFloor = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Which floor at pickup? 🏢\n(Enter 0 for ground floor)',
        [
          { label: '⏭️ Skip', action: 'skip-pickup-floor', value: '' },
        ],
        0,
        'text',
        'e.g., 0, 1, 2, 5'
      );
      setCurrentStep('pickup-floor');
    }, 800);
  };

  const askForPickupLift = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is there a lift/elevator at pickup? 🛗',
        [
          { label: '✅ Yes, lift available', action: 'confirm-pickup-lift', value: 'yes' },
          { label: '❌ No lift', action: 'confirm-pickup-lift', value: 'no' },
        ],
        0
      );
      setCurrentStep('pickup-lift');
    }, 800);
  };

  const askForDropFloor = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Which floor at drop? 🏢\n(Enter 0 for ground floor)',
        [
          { label: '⏭️ Skip', action: 'skip-drop-floor', value: '' },
        ],
        0,
        'text',
        'e.g., 0, 1, 2, 5'
      );
      setCurrentStep('drop-floor');
    }, 800);
  };

  const askForDropLift = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is there a lift/elevator at drop? 🛗',
        [
          { label: '✅ Yes, lift available', action: 'confirm-drop-lift', value: 'yes' },
          { label: '❌ No lift', action: 'confirm-drop-lift', value: 'no' },
        ],
        0
      );
      setCurrentStep('drop-lift');
    }, 800);
  };

  const askForExpectedDelivery = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'When do you need delivery by? 📦\n(e.g., "2 days", "next week", or a specific date)',
        [
          { label: '⏭️ Skip', action: 'skip-expected-delivery', value: '' },
        ],
        0,
        'text',
        'e.g., 2 days, 2026-05-10'
      );
      setCurrentStep('expected-delivery');
    }, 800);
  };

  const askForDeliveryTime = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Preferred delivery time? 🕐',
        [
          { label: '🌅 Morning (8 AM – 12 PM)', action: 'select-delivery-time', value: 'MORNING' },
          { label: '☀️ Afternoon (12 PM – 4 PM)', action: 'select-delivery-time', value: 'AFTERNOON' },
          { label: '🌆 Evening (4 PM – 8 PM)', action: 'select-delivery-time', value: 'EVENING' },
          { label: '🌙 Anytime', action: 'select-delivery-time', value: 'ANYTIME' },
          { label: '⏭️ Skip', action: 'skip-delivery-time', value: '' },
        ],
        0
      );
      setCurrentStep('delivery-time');
    }, 800);
  };

  const askForInventoryList = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Briefly list main items / rooms 📝\nTap items below to add (you can pick many), or type your own. This helps vendors quote accurately.',
        [
          { label: '🛏️ Bedroom set', action: 'add-inventory-item', value: 'Bedroom set' },
          { label: '🍳 Kitchen items', action: 'add-inventory-item', value: 'Kitchen items' },
          { label: '🛋️ Sofa', action: 'add-inventory-item', value: 'Sofa' },
          { label: '🪑 Dining set', action: 'add-inventory-item', value: 'Dining set' },
          { label: '🧊 Fridge', action: 'add-inventory-item', value: 'Fridge' },
          { label: '🚪 Almirah / Wardrobe', action: 'add-inventory-item', value: 'Almirah / Wardrobe' },
          { label: '📺 TV', action: 'add-inventory-item', value: 'TV' },
          { label: '🧺 Washing machine', action: 'add-inventory-item', value: 'Washing machine' },
          { label: '⏭️ Skip', action: 'skip-inventory-list', value: '' },
        ],
        0,
        'text',
        'e.g., 2 BHK + sofa + fridge + 3 almirahs'
      );
      setCurrentStep('inventory-list');
    }, 800);
  };

  const askForEstimatedWeight = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Approximate total weight / volume? ⚖️',
        [
          { label: '🪶 Light (< 500 kg)', action: 'select-estimated-weight', value: '300' },
          { label: '📦 Medium (500 – 1500 kg)', action: 'select-estimated-weight', value: '1000' },
          { label: '🏋️ Heavy (1500 – 3000 kg)', action: 'select-estimated-weight', value: '2500' },
          { label: '🚛 Very Heavy (> 3000 kg)', action: 'select-estimated-weight', value: '4000' },
          { label: '⏭️ Skip', action: 'skip-estimated-weight', value: '' },
        ],
        0
      );
      setCurrentStep('estimated-weight');
    }, 800);
  };

  const askForHeavyItems = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you have any heavy items? 🏋️\n(e.g., piano, safe, large appliances)',
        [
          { label: '✅ Yes', action: 'confirm-heavy-items', value: 'yes' },
          { label: '❌ No', action: 'confirm-heavy-items', value: 'no' },
        ],
        0
      );
      setCurrentStep('heavy-items-yn');
    }, 800);
  };

  const askForHeavyItemsDesc = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Please describe the heavy items 📝',
        [
          { label: '⏭️ Skip', action: 'skip-heavy-items-desc', value: '' },
        ],
        0,
        'text',
        'e.g., 1 piano, 1 large safe'
      );
      setCurrentStep('heavy-items-desc');
    }, 800);
  };

  const askForFragileItems = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you have any fragile items? 🔮\n(e.g., glassware, artwork, electronics)',
        [
          { label: '✅ Yes', action: 'confirm-fragile-items', value: 'yes' },
          { label: '❌ No', action: 'confirm-fragile-items', value: 'no' },
        ],
        0
      );
      setCurrentStep('fragile-items-yn');
    }, 800);
  };

  const askForPackingItemsDetails = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Tell us about your items in one go 📦\nBoxes/cartons, bags/suitcases, and fragile items (TV, glassware, etc.). Tap to add or type.',
        [
          { label: '📦 5-10 boxes', action: 'add-packing-detail', value: '5-10 boxes' },
          { label: '📦 10-30 boxes', action: 'add-packing-detail', value: '10-30 boxes' },
          { label: '🎒 1-2 bags', action: 'add-packing-detail', value: '1-2 bags' },
          { label: '🎒 3-5 bags', action: 'add-packing-detail', value: '3-5 bags' },
          { label: '🪟 Fragile: TV / glassware', action: 'add-packing-detail', value: 'Fragile: TV / glassware' },
          { label: '⏭️ Skip', action: 'skip-packing-details', value: '' },
        ],
        0,
        'text',
        'e.g., 15 boxes, 5 bags, LED TV'
      );
      setCurrentStep('packing-items-details');
    }, 800);
  };

  const askForNeedPacking = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need packing service? 📦',
        [
          { label: '✅ Yes, please pack', action: 'confirm-need-packing', value: 'yes' },
          { label: "❌ No, I'll pack myself", action: 'confirm-need-packing', value: 'no' },
        ],
        0
      );
      setCurrentStep('need-packing');
    }, 800);
  };

  const askForNeedLoading = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need loading help? 💪',
        [
          { label: '✅ Yes', action: 'confirm-need-loading', value: 'yes' },
          { label: '❌ No', action: 'confirm-need-loading', value: 'no' },
        ],
        0
      );
      setCurrentStep('need-loading');
    }, 800);
  };

  const askForNeedUnloading = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need unloading help? 💪',
        [
          { label: '✅ Yes', action: 'confirm-need-unloading', value: 'yes' },
          { label: '❌ No', action: 'confirm-need-unloading', value: 'no' },
        ],
        0
      );
      setCurrentStep('need-unloading');
    }, 800);
  };

  const askForLabourCount = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'How many labour workers do you need? 👷',
        [
          { label: '⏭️ Skip / Vendor decides', action: 'skip-labour-count', value: '' },
        ],
        0,
        'text',
        'e.g., 2, 4, 6'
      );
      setCurrentStep('labour-count');
    }, 800);
  };

  const askForVehicleTypeRequirement = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of truck do you prefer? 🚛',
        [
          { label: '🚚 Shared truck (cheaper)', action: 'select-vehicle-type-req', value: 'SHARED' },
          { label: '🚛 Dedicated truck', action: 'select-vehicle-type-req', value: 'DEDICATED' },
        ],
        0
      );
      setCurrentStep('vehicle-type-req');
    }, 800);
  };

  const askForPartLoad = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Are you OK with part-load (sharing truck space)? 📦',
        [
          { label: '✅ Yes, part load OK', action: 'select-part-load', value: 'yes' },
          { label: '❌ No, full load only', action: 'select-part-load', value: 'no' },
        ],
        0
      );
      setCurrentStep('part-load');
    }, 800);
  };

  const askForNeedInsurance = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need transit insurance for your goods? 🛡️',
        [
          { label: '✅ Yes', action: 'confirm-need-insurance', value: 'yes' },
          { label: '❌ No', action: 'confirm-need-insurance', value: 'no' },
        ],
        0
      );
      setCurrentStep('need-insurance');
    }, 800);
  };

  const askForInsuranceValue = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What is the estimated value of goods to insure? 💰\n(in ₹)',
        [
          { label: '⏭️ Skip', action: 'skip-insurance-value', value: '' },
        ],
        0,
        'text',
        'e.g., 500000'
      );
      setCurrentStep('insurance-value');
    }, 800);
  };

  const askForPOD = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need Proof of Delivery (POD)? 📋',
        [
          { label: '✅ Yes', action: 'confirm-requires-pod', value: 'yes' },
          { label: '❌ No', action: 'confirm-requires-pod', value: 'no' },
        ],
        0
      );
      setCurrentStep('requires-pod');
    }, 800);
  };

  const askForReceiverName = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "Who will receive the goods at the destination? 👤\n(Receiver's full name)",
        [
          { label: '⏭️ Skip', action: 'skip-receiver-name', value: '' },
        ],
        0,
        'text',
        'Receiver name'
      );
      setCurrentStep('receiver-name');
    }, 800);
  };

  const askForReceiverPhone = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "Receiver's phone number? 📱",
        [
          { label: '⏭️ Skip', action: 'skip-receiver-phone', value: '' },
        ],
        0,
        'tel',
        'e.g., 9876543210'
      );
      setCurrentStep('receiver-phone');
    }, 800);
  };

  const askForMultipleStops = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Will the truck need to stop at multiple locations? 🛑',
        [
          { label: '✅ Yes', action: 'confirm-multiple-stops', value: 'yes' },
          { label: '❌ No', action: 'confirm-multiple-stops', value: 'no' },
        ],
        0
      );
      setCurrentStep('multiple-stops-yn');
    }, 800);
  };

  const askForMultipleStopsDesc = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Please describe the additional stops 📝',
        [
          { label: '⏭️ Skip', action: 'skip-multiple-stops-desc', value: '' },
        ],
        0,
        'text',
        'e.g., 1 pickup at office, 1 drop at storage'
      );
      setCurrentStep('multiple-stops-desc');
    }, 800);
  };

  // After receiver phone (intercity) or skipping it, continue to multiple-stops.
  const proceedAfterReceiver = () => {
    askForMultipleStops();
  };

  // After multiple stops chain → existing additional-details flow
  const proceedAfterPackersExtras = () => {
    askForAdditionalDetails();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Truck rental extended quotation helpers (mirror packers approach)
  // ─────────────────────────────────────────────────────────────────────────
  const askForTruckBodyType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of truck body do you need? 🚚',
        [
          { label: '🛻 Open', action: 'select-truck-body-type', value: 'OPEN' },
          { label: '🚚 Closed Body', action: 'select-truck-body-type', value: 'CLOSED_BODY' },
          { label: '📦 Container', action: 'select-truck-body-type', value: 'CONTAINER' },
          { label: '🚛 Trailer', action: 'select-truck-body-type', value: 'TRAILER' },
          { label: '🚐 LCV', action: 'select-truck-body-type', value: 'LCV' },
          { label: '❄️ Refrigerated', action: 'select-truck-body-type', value: 'REFRIGERATED' },
          { label: '🛏️ Flatbed', action: 'select-truck-body-type', value: 'FLATBED' },
          { label: '📋 Other', action: 'select-truck-body-type', value: 'OTHER' },
        ],
        0
      );
      setCurrentStep('truck-body-type');
    }, 800);
  };

  const askForMaterialDetails = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Specific items being transported? 📦\nTap one or more items below (they’ll add to your message), edit if needed, then press Send.',
        [
          { label: '📦 5-10 boxes', action: 'add-material-detail', value: '5-10 boxes' },
          { label: '📦 10-30 boxes', action: 'add-material-detail', value: '10-30 boxes' },
          { label: '🛏️ Bed + cupboard', action: 'add-material-detail', value: 'Bed + cupboard' },
          { label: '🛋️ Sofa set + dining', action: 'add-material-detail', value: 'Sofa set + dining' },
          { label: '🏠 Full house (1 BHK)', action: 'add-material-detail', value: 'Full house (1 BHK)' },
        ],
        0,
        'text',
        'e.g., 10 boxes, 2 beds, 1 sofa'
      );
      setCurrentStep('material-details');
    }, 800);
  };

  const askForEstimatedVolume = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Approximate volume? 📐',
        [
          { label: '🪶 Light (small load)', action: 'select-truck-volume', value: 'LIGHT' },
          { label: '📦 Medium (canter-load)', action: 'select-truck-volume', value: 'MEDIUM' },
          { label: '🚛 Large (truck-load)', action: 'select-truck-volume', value: 'LARGE' },
          { label: '⏭️ Skip', action: 'skip-truck-volume', value: '' },
        ],
        0
      );
      setCurrentStep('truck-estimated-volume');
    }, 800);
  };

  const askForTruckPickupPincode = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "What's your pickup area pincode? 📮 (6 digits)",
        [
          { label: '⏭️ Skip', action: 'skip-truck-pickup-pincode', value: '' },
        ],
        0,
        'text',
        'e.g., 110001'
      );
      setCurrentStep('truck-pickup-pincode');
    }, 800);
  };

  const askForTruckDropPincode = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "What's your drop area pincode? 📮 (6 digits)",
        [
          { label: '⏭️ Skip', action: 'skip-truck-drop-pincode', value: '' },
        ],
        0,
        'text',
        'e.g., 400001'
      );
      setCurrentStep('truck-drop-pincode');
    }, 800);
  };

  const askForTruckPickupFloor = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Which floor at pickup? 🏢\nTap a number or type a higher one',
        [
          { label: '🏠 Ground (0)', action: 'select-truck-pickup-floor', value: '0' },
          { label: '1️⃣ 1st Floor', action: 'select-truck-pickup-floor', value: '1' },
          { label: '2️⃣ 2nd Floor', action: 'select-truck-pickup-floor', value: '2' },
          { label: '3️⃣ 3rd Floor', action: 'select-truck-pickup-floor', value: '3' },
          { label: '4️⃣ 4th Floor', action: 'select-truck-pickup-floor', value: '4' },
          { label: '🏢 5th & Above (type number)', action: 'noop', value: '' },
        ],
        0,
        'text',
        'e.g., 5, 6, 10'
      );
      setCurrentStep('truck-pickup-floor');
    }, 800);
  };

  const askForTruckPickupLift = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is there a lift/elevator at pickup? 🛗',
        [
          { label: '✅ Yes, lift available', action: 'confirm-truck-pickup-lift', value: 'yes' },
          { label: '❌ No lift', action: 'confirm-truck-pickup-lift', value: 'no' },
        ],
        0
      );
      setCurrentStep('truck-pickup-lift');
    }, 800);
  };

  const askForTruckDropFloor = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Which floor at drop? 🏢\nTap a number or type a higher one',
        [
          { label: '🏠 Ground (0)', action: 'select-truck-drop-floor', value: '0' },
          { label: '1️⃣ 1st Floor', action: 'select-truck-drop-floor', value: '1' },
          { label: '2️⃣ 2nd Floor', action: 'select-truck-drop-floor', value: '2' },
          { label: '3️⃣ 3rd Floor', action: 'select-truck-drop-floor', value: '3' },
          { label: '4️⃣ 4th Floor', action: 'select-truck-drop-floor', value: '4' },
          { label: '🏢 5th & Above (type number)', action: 'noop', value: '' },
        ],
        0,
        'text',
        'e.g., 5, 6, 10'
      );
      setCurrentStep('truck-drop-floor');
    }, 800);
  };

  const askForTruckDropLift = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is there a lift/elevator at drop? 🛗',
        [
          { label: '✅ Yes, lift available', action: 'confirm-truck-drop-lift', value: 'yes' },
          { label: '❌ No lift', action: 'confirm-truck-drop-lift', value: 'no' },
        ],
        0
      );
      setCurrentStep('truck-drop-lift');
    }, 800);
  };

  const askForExpectedTruckDelivery = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'When do you need delivery by? 📦\n(e.g., "2 days", "next week", or a specific date)',
        [
          { label: '⏭️ Skip', action: 'skip-truck-expected-delivery', value: '' },
        ],
        0,
        'text',
        'e.g., 2 days, 2026-05-10'
      );
      setCurrentStep('truck-expected-delivery');
    }, 800);
  };

  const askForTruckDeliveryTime = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Preferred delivery time? 🕐',
        [
          { label: '🌅 Morning (8 AM – 12 PM)', action: 'select-truck-delivery-time', value: 'MORNING' },
          { label: '☀️ Afternoon (12 PM – 4 PM)', action: 'select-truck-delivery-time', value: 'AFTERNOON' },
          { label: '🌆 Evening (4 PM – 8 PM)', action: 'select-truck-delivery-time', value: 'EVENING' },
          { label: '🌙 Anytime', action: 'select-truck-delivery-time', value: 'ANYTIME' },
          { label: '⏭️ Skip', action: 'skip-truck-delivery-time', value: '' },
        ],
        0
      );
      setCurrentStep('truck-delivery-time');
    }, 800);
  };

  const askForTripDirection = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is this a one-way trip or round trip? 🛣️',
        [
          { label: '➡️ One Way', action: 'select-trip-direction', value: 'ONE_WAY' },
          { label: '🔄 Round Trip', action: 'select-trip-direction', value: 'ROUND_TRIP' },
        ],
        0
      );
      setCurrentStep('trip-direction');
    }, 800);
  };

  const askForLoadingHelp = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Need loading & unloading help? 💪',
        [
          { label: '✅ Yes', action: 'confirm-loading-help', value: 'yes' },
          { label: '❌ No', action: 'confirm-loading-help', value: 'no' },
        ],
        0
      );
      setCurrentStep('loading-help');
    }, 800);
  };

  const askForTruckLabourCount = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'How many labourers do you need? 👷',
        [
          { label: '⏭️ Skip / Vendor decides', action: 'skip-truck-labour-count', value: '' },
        ],
        0,
        'text',
        'e.g., 2, 4, 6'
      );
      setCurrentStep('truck-labour-count');
    }, 800);
  };

  const askForTruckMultipleStops = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Will the truck need to stop at multiple locations? 🛑',
        [
          { label: '✅ Yes', action: 'confirm-truck-multiple-stops', value: 'yes' },
          { label: '❌ No', action: 'confirm-truck-multiple-stops', value: 'no' },
        ],
        0
      );
      setCurrentStep('truck-multiple-stops-yn');
    }, 800);
  };

  const askForTruckMultipleStopsDesc = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Please describe the additional stops 📝',
        [
          { label: '⏭️ Skip', action: 'skip-truck-multiple-stops-desc', value: '' },
        ],
        0,
        'text',
        'e.g., 1 pickup at warehouse, 1 drop at storage'
      );
      setCurrentStep('truck-multiple-stops-desc');
    }, 800);
  };

  const askForTruckReceiverName = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "Who will receive the goods at the destination? 👤\n(Receiver's full name)",
        [
          { label: '⏭️ Skip', action: 'skip-truck-receiver-name', value: '' },
        ],
        0,
        'text',
        'Receiver name'
      );
      setCurrentStep('truck-receiver-name');
    }, 800);
  };

  const askForTruckReceiverPhone = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        "Receiver's phone number? 📱",
        [
          { label: '⏭️ Skip', action: 'skip-truck-receiver-phone', value: '' },
        ],
        0,
        'tel',
        'e.g., 9876543210'
      );
      setCurrentStep('truck-receiver-phone');
    }, 800);
  };

  const askForTruckPOD = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Do you need Proof of Delivery (POD)? 📋',
        [
          { label: '✅ Yes', action: 'confirm-truck-pod', value: 'yes' },
          { label: '❌ No', action: 'confirm-truck-pod', value: 'no' },
        ],
        0
      );
      setCurrentStep('truck-pod');
    }, 800);
  };

  const askForAirportOption = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Select Airport Booking Type ✈️',
        [
          { label: '🛫 Drop to Airport', action: 'select-airport-option', value: 'drop' },
          { label: '🛬 Pick up from Airport', action: 'select-airport-option', value: 'pickup' },
        ],
        0
      );
      setCurrentStep('airport-option');
    }, 800);
  };

  const askForCarType = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What type of vehicle do you prefer? 🚙',
        [
          { label: '🚗 Hatchback (4 seaters)', action: 'select-car-type', value: 'hatchback' },
          { label: '🚙 Sedan (4-5 seaters)', action: 'select-car-type', value: 'sedan' },
          { label: '🚐 MUV (6-7 seaters)', action: 'select-car-type', value: 'muv' },
          { label: '🚙 SUV (6-7 seaters)', action: 'select-car-type', value: 'suv' },
          { label: '💎 Luxury', action: 'select-car-type', value: 'luxury' },
        ],
        0
      );
      setCurrentStep('car-type');
    }, 800);
  };

  const askForPassengers = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'How many passengers? 👥\n(Enter number of passengers)',
        undefined,
        0,
        'text',
        'e.g., 4'
      );
      setCurrentStep('passengers');
    }, 800);
  };

  const askForVehicleConfirmation = () => {
    setIsTyping(true);
    setTimeout(() => {
      // Get vehicle image for display
      const vehicleImage = vehicleName ? getVehicleImageByName(vehicleName) : undefined;

      addShiviMessage(
        `You've selected ${vehicleName}. Is this correct?`,
        [
          { label: `✅ Yes, ${vehicleName}`, action: 'confirm-vehicle', value: vehicleName },
          { label: '🔄 Different Vehicle', action: 'change-vehicle', value: '' },
        ],
        0,
        undefined,
        undefined,
        vehicleImage
      );
      setCurrentStep('vehicle-confirmation');
    }, 800);
  };

  // Show available vehicles from fleet for user to choose
  const askForVehicleSelection = () => {
    setIsTyping(true);
    setTimeout(() => {
      // Get the current vehicle's category to show similar vehicles
      const currentVehicle = vehicleName ? getVehicleByName(vehicleName) : null;
      const category = currentVehicle?.category || 'car';

      // Get vehicles from the same category
      const categoryVehicles = ALL_VEHICLES.filter(v => v.category === category).slice(0, 8);

      const vehicleOptions = categoryVehicles.map(v => ({
        label: `🚗 ${v.name}`,
        action: 'select-fleet-vehicle',
        value: v.name,
      }));

      // Add option to see all categories
      vehicleOptions.push({
        label: '📋 Show All Vehicles',
        action: 'show-all-vehicles',
        value: '',
      });

      addShiviMessage(
        `Choose a different vehicle from our fleet:\n\n${category.charAt(0).toUpperCase() + category.slice(1)}s available:`,
        vehicleOptions,
        0
      );
      setCurrentStep('vehicle-selection');
    }, 800);
  };

  const askForDestination = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Where will you be traveling to? 🗺️\n(Enter your destination city/area)',
        undefined,
        0,
        'text',
        'Enter destination city/area (e.g., Gandhinagar, Kutch)'
      );
      setCurrentStep('destination');
    }, 800);
  };

  const askForBikePickupAddress = () => {
    setIsTyping(true);
    setTimeout(() => {
      const profileAddress = loggedInCustomer?.address || '';
      // Pre-fill the input with the customer's profile address (if any) — they can edit.
      setInputValue(profileAddress);
      const helper = profileAddress
        ? '(Pre-filled from your profile — edit if needed for this booking)'
        : '(Building, Street, Area, Landmark)';
      addShiviMessage(
        `📍 Please confirm your pickup address\n${helper}`,
        undefined,
        0,
        'text',
        'e.g., A-204, Sunset Apartments, MG Road'
      );
      setCurrentStep('bike-pickup-address');
    }, 800);
  };

  const askForPickupFullAddress = () => {
    setIsTyping(true);
    setTimeout(() => {
      const cityHint = bookingData.pickupLocation ? ` in ${bookingData.pickupLocation}` : '';
      addShiviMessage(
        `📍 Please share the full pickup address${cityHint}\n(Building, Street, Area, Landmark)`,
        undefined,
        0,
        'text',
        'e.g., A-204, Sunset Apartments, MG Road, Near City Mall'
      );
      setCurrentStep('pickup-full-address');
    }, 800);
  };

  const askForDestinationFullAddress = () => {
    setIsTyping(true);
    setTimeout(() => {
      const cityHint = bookingData.destination ? ` in ${bookingData.destination}` : '';
      addShiviMessage(
        `📍 Please share the full destination address${cityHint}\n(Building, Street, Area, Landmark)`,
        undefined,
        0,
        'text',
        'e.g., B-12, Park Street, Sector 17, Near Metro Station'
      );
      setCurrentStep('destination-full-address');
    }, 800);
  };

  // Routing logic after destination (city or full address) is captured
  const proceedAfterDestination = () => {
    const isLuxuryService = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
    const isCarService = isCarWithDriverServiceType(serviceType) && !isLuxuryService;
    const isSelfDriveService = serviceType.includes('selfdrive') || serviceType.includes('self-drive');
    const isBikeService = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
    const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
    const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');

    const fleetVehicleName = bookingData.fleet || vehicleName;
    const selectedFleetVehicle = fleetVehicleName ? getVehicleByName(fleetVehicleName) : null;
    const isFleetCar = selectedFleetVehicle?.category === 'car';
    const isFleetBus = selectedFleetVehicle?.category === 'bus';

    if (isBikeService) {
      if (bookingData.bikeDuration) {
        if (!bookingData.pickupFullAddress) askForBikePickupAddress();
        else askForPickupDateTime();
      } else askForDuration();
    } else if (isBusService || isFleetBus) {
      askForPassengers();
    } else if (isTruckService) {
      askForPickupDateTime();
    } else if (isLuxuryService || isSelfDriveService) {
      askForPickupDateTime();
    } else if (isCarService || isFleetCar) {
      if (!bookingData.subService && !isFleetCar) askForCarType();
      else askForPassengers();
    } else {
      askForPickupDateTime();
    }
  };

  const askForContactInfo = () => {
    // Check if user is already logged in with customer data
    if (isLoggedIn && loggedInCustomer?.name && loggedInCustomer?.email && loggedInCustomer?.phone) {
      // Customer is logged in with complete data, skip to additional details
      setBookingData((prev: any) => ({
        ...prev,
        name: loggedInCustomer.name,
        email: loggedInCustomer.email,
        phone: loggedInCustomer.phone,
      }));
      askForAdditionalDetails();
      return;
    }

    // Ask for name
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What\'s your name? 👤',
        undefined,
        0,
        'text',
        'Enter your full name'
      );
      setCurrentStep('name');
    }, 800);
  };

  const askForPhone = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'What\'s your phone number? 📱',
        undefined,
        0,
        'tel',
        CONTACT_PHONE
      );
      setCurrentStep('phone');
    }, 800);
  };

  const askForEmail = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'And your email address? 📧',
        undefined,
        0,
        'email',
        'your@email.com'
      );
      setCurrentStep('email');
    }, 800);
  };

  const askForAdditionalDetails = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Any special requirements or additional details? 📝\n(e.g., decorations, specific vehicle preferences, timing requirements)\n\nType your requirements or click "Skip" to continue.',
        [
          { label: '⏭️ Skip', action: 'skip-additional-details', value: '' },
        ],
        0,
        'text',
        'Enter any special requirements (optional)'
      );
      setCurrentStep('additional-details');
    }, 800);
  };

  const askForBookingPurpose = () => {
    setIsTyping(true);
    setTimeout(() => {
      addShiviMessage(
        'Is this booking for personal use or for your company/organization? 🏢',
        [
          { label: '👤 Personal', action: 'booking-purpose', value: 'personal' },
          { label: '🏢 Company / Corporate', action: 'booking-purpose', value: 'company' },
        ],
        0
      );
      setCurrentStep('booking-purpose');
    }, 800);
  };

  const showSummary = () => {
    // God-level: Enhanced summary with better formatting
    const firstName = bookingData.name?.split(' ')[0] || 'there';
    const durationLabels: Record<string, string> = {
      '1': 'Daily',
      '2': 'Weekly',
      '3': 'Monthly',
      '4': 'Custom'
    };
    const tripTypeLabels: Record<string, string> = {
      'roundtrip': 'Round Trip',
      'airport': 'Airport Taxi',
      'oneway': 'One-Way'
    };
    const carTypeLabels: Record<string, string> = {
      'hatchback': 'Hatchback',
      'sedan': 'Sedan',
      'muv': 'MUV',
      'suv': 'SUV',
      'luxury': 'Luxury'
    };
    const airportLabels: Record<string, string> = {
      'drop': 'Drop to Airport',
      'pickup': 'Pick up from Airport'
    };

    const isBikeService = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
    const isLuxuryService = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
    const isCarService = isCarWithDriverServiceType(serviceType) && !isLuxuryService;
    const isSelfDriveService = serviceType.includes('selfdrive') || serviceType.includes('self-drive');
    const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
    const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
    const isPackersService = serviceType.includes('packers') || serviceType.includes('movers');
    const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb');

    // Self-drive labels
    const selfDriveCarTypeLabels: Record<string, string> = {
      '1': 'Hatchback',
      '2': 'Sedan',
      '3': 'MUV',
      '4': 'SUV'
    };
    const transmissionLabels: Record<string, string> = {
      '1': 'Automatic',
      '2': 'Manual'
    };
    const fuelTypeLabels: Record<string, string> = {
      '1': 'Diesel',
      '2': 'Petrol',
      '3': 'Electric',
      '4': 'CNG'
    };
    // Luxury labels
    const luxuryTypeLabels: Record<string, string> = {
      '1': 'Wedding',
      '2': 'Personal',
      '3': 'Corporate'
    };
    const luxuryPackageLabels: Record<string, string> = {
      '1': 'Local (8hr/80km)',
      '3': 'Outstation Trip',
      '4': 'Airport Transfer'
    };
    const busTripTypeLabels: Record<string, string> = {
      'outstation': 'Outstation',
      'local': 'Local'
    };
    const goodsTypeLabels: Record<string, string> = {
      'household': 'Household Goods',
      'commercial': 'Industrial/Commercial',
      'furniture': 'Furniture & Wood',
      'other': 'Other Goods'
    };
    const shiftingTypeLabels: Record<string, string> = {
      'Home': 'Home Shifting',
      'Office': 'Office Shifting',
      'Vehicle': 'Vehicle Transport'
    };
    const homeSizeLabels: Record<string, string> = {
      'BHK_1': '1 BHK',
      'BHK_2': '2 BHK',
      'BHK_3': '3 BHK',
      'BHK_More_THAN_4': '4+ BHK / Villa'
    };

    // Format datetime for display
    const formatDateTime = (dt: string) => {
      if (!dt) return 'N/A';
      try {
        return new Date(dt).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch {
        return dt;
      }
    };

    let summary = `🎯 Perfect ${firstName}! Here's what we have:\n\n` +
      `🚗 Service: ${bookingData.serviceName}\n`;

    // Car-specific fields
    if (isCarService) {
      if (bookingData.tripType) {
        summary += `📌 Trip Type: ${tripTypeLabels[bookingData.tripType] || bookingData.tripType}\n`;
      }
      if (bookingData.airportOption) {
        summary += `✈️ Airport: ${airportLabels[bookingData.airportOption] || bookingData.airportOption}\n`;
      }
      // Show car type - either from carType field or subService
      const carType = bookingData.carType || bookingData.subService;
      if (carType) {
        summary += `🚙 Vehicle: ${carTypeLabels[carType.toLowerCase()] || carType}\n`;
      }
      if (bookingData.passengers) {
        summary += `👥 Passengers: ${bookingData.passengers}\n`;
      }
    }

    // Bus-specific fields
    if (isBusService) {
      if (bookingData.busTripType) {
        summary += `📌 Trip Type: ${busTripTypeLabels[bookingData.busTripType] || bookingData.busTripType}\n`;
      }
      if (bookingData.subService) {
        summary += `🚌 Bus Type: ${bookingData.subService}\n`;
      }
      if (bookingData.passengers) {
        summary += `👥 Passengers: ${bookingData.passengers}\n`;
      }
    }

    // Truck-specific fields
    if (isTruckService) {
      const truckModeLabels: Record<string, string> = {
        '1': 'Personal',
        '2': 'Commercial'
      };
      if (bookingData.truckMode) {
        summary += `📋 Mode: ${truckModeLabels[bookingData.truckMode] || bookingData.truckMode}\n`;
      }
      if (bookingData.truckTypeName) {
        summary += `🚚 Truck Type: ${bookingData.truckTypeName}\n`;
      }
      if (bookingData.goodsTypeName) {
        summary += `📦 Goods Type: ${bookingData.goodsTypeName}\n`;
      }
      if (bookingData.weightVal && bookingData.weightUnitName) {
        summary += `⚖️ Weight: ${bookingData.weightVal} ${bookingData.weightUnitName}\n`;
      }
    }

    // Packers & Movers specific fields
    if (isPackersService) {
      if (bookingData.shiftingType) {
        summary += `📦 Shifting Type: ${shiftingTypeLabels[bookingData.shiftingType] || bookingData.shiftingType}\n`;
      }
      if (bookingData.homeShifting) {
        summary += `🏠 Home Size: ${homeSizeLabels[bookingData.homeShifting] || bookingData.homeShifting}\n`;
      }
    }

    // Equipment-specific fields
    if (isEquipmentService) {
      const jobDurationLabels: Record<string, string> = {
        '1': '1 to 5 Days',
        '2': '6 to 15 Days',
        '3': '16 to 30 Days',
        '4': 'More than 30 Days'
      };
      if (bookingData.machineTypeName) {
        summary += `🏗️ Equipment Type: ${bookingData.machineTypeName}\n`;
      }
      if (bookingData.jobDuration) {
        summary += `⏱️ Duration: ${jobDurationLabels[bookingData.jobDuration] || bookingData.jobDurationName || bookingData.jobDuration}\n`;
      }
      if (bookingData.noOfEquipments) {
        summary += `🔢 Quantity: ${bookingData.noOfEquipments}\n`;
      }
    }

    // Bike-specific fields
    if (isBikeService && bookingData.subService) {
      summary += `📌 Type: ${bookingData.subService}\n`;
    }

    // Self-Drive specific fields
    if (isSelfDriveService) {
      if (bookingData.selfDriveCarType) {
        summary += `🚗 Car Type: ${selfDriveCarTypeLabels[bookingData.selfDriveCarType] || bookingData.selfDriveCarType}\n`;
      }
      if (bookingData.transmission) {
        summary += `⚙️ Transmission: ${transmissionLabels[bookingData.transmission] || bookingData.transmission}\n`;
      }
      if (bookingData.fuelType) {
        summary += `⛽ Fuel Type: ${fuelTypeLabels[bookingData.fuelType] || bookingData.fuelType}\n`;
      }
      if (bookingData.doorstepDelivery !== undefined) {
        summary += `🚗 Doorstep Delivery: ${bookingData.doorstepDelivery === '1' ? 'Yes' : 'No'}\n`;
      }
    }

    // Luxury Car specific fields
    if (isLuxuryService) {
      if (bookingData.luxuryType) {
        summary += `💎 Occasion: ${luxuryTypeLabels[bookingData.luxuryType] || bookingData.luxuryType}\n`;
      }
      if (bookingData.luxuryPackage) {
        summary += `📦 Package: ${luxuryPackageLabels[bookingData.luxuryPackage] || bookingData.luxuryPackage}\n`;
      }
    }

    summary += `📍 Pickup Location: ${bookingData.pickupLocation}\n` +
      `🗺️ Destination: ${bookingData.destination}\n`;

    if (isBikeService && bookingData.bikeDuration) {
      summary += `⏱️ Duration: ${durationLabels[bookingData.bikeDuration] || bookingData.bikeDuration}\n`;
    }

    // Show pickup date & time
    summary += `📅 Start: ${formatDateTime(bookingData.pickupDateTime)}\n`;

    // Show return date & time if available
    if (bookingData.returnDateTime) {
      summary += `📅 Return: ${formatDateTime(bookingData.returnDateTime)}\n`;
    }

    summary += `\n👤 Contact Details:\n` +
      `• Name: ${bookingData.name}\n` +
      `• Phone: ${bookingData.phone}\n` +
      `• Email: ${bookingData.email}\n`;

    // Show additional details if provided
    if (bookingData.additionalDetails) {
      summary += `\n📝 Special Requirements:\n${bookingData.additionalDetails}\n`;
    }

    summary += `\n✨ You'll receive quotes from 3-5 verified vendors within 10 minutes!`;

    addShiviMessage(summary, [
      { label: '✅ Confirm & Get Best Quotes', action: 'submit', value: '' },
      { label: '✏️ Edit Details', action: 'restart', value: '' },
    ]);
    setCurrentStep('summary');
  };

  // Helper function to show booking success message
  const showBookingSuccessMessage = (firstName: string, bookingId: string, redirectTo?: string) => {
    addShiviMessage(
      `Booking Confirmed, ${firstName}!\n\n` +
      `Booking ID: #${bookingId}\n\n` +
      `What's Next:\n` +
      `• 3-5 verified vendors will send quotes (within 10 minutes)\n` +
      `• Compare prices and choose the best one\n` +
      `• Get confirmation via WhatsApp and email\n\n` +
      `EARN BACKR TOKENS:\n` +
      `• Earn up to 100 Backr Tokens on trip completion\n` +
      `• 1 Token = ₹1 | Use on any booking | Never expire\n\n` +
      `Thank you for choosing TransRentals.`,
      [
        { label: 'Download App', action: 'download-app', value: '' },
        { label: 'Track on Dashboard', action: 'dashboard', value: '/customer/dashboard' },
        { label: 'Book Another', action: 'restart', value: '' },
      ],
      1500
    );
    setCurrentStep('completed');
  };

  // Handle customer login after booking
  const handleCustomerLogin = async (password: string) => {
    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: bookingData.email,
          password,
        }),
      });
      const data = await response.json();

      if (data.status === 'success' && data.token) {
        // Store token and customer data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        // Update state
        setIsLoggedIn(true);
        setLoggedInCustomer(data.customers);

        // Show success message
        const firstName = bookingData.name?.split(' ')[0] || 'Guest';
        addShiviMessage(
          `Welcome back, ${firstName}! You're now logged in.\n\n` +
          `You can now track all your bookings from your dashboard.`,
          [
            { label: 'Go to Dashboard', action: 'dashboard', value: '/customer/dashboard' },
            { label: 'Book Another', action: 'restart', value: '' },
          ],
          1000
        );
        setCurrentStep('completed');
      } else {
        addShiviMessage(
          `Incorrect password. Please try again.`,
          [
            { label: 'Skip Login', action: 'skip-login', value: '' },
          ],
          800,
          'password',
          'Enter your password'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      addShiviMessage(
        `Something went wrong. Please try again or skip login.`,
        [
          { label: 'Skip Login', action: 'skip-login', value: '' },
        ],
        800
      );
    }
  };

  // Handle password creation after booking
  const handleCreatePassword = async (password: string) => {
    if (password.length < 6) {
      addShiviMessage(
        `Password must be at least 6 characters. Please try again.`,
        [],
        800,
        'password',
        'Create a password (min 6 chars)'
      );
      return;
    }

    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-password',
          email: bookingData.email,
          password,
          customerId: bookingData.customerId,
        }),
      });
      const data = await response.json();

      if (data.status === 'success' && data.token) {
        // Store token and customer data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));

        // Update state
        setIsLoggedIn(true);
        setLoggedInCustomer(data.customers);

        // Show success message
        const firstName = bookingData.name?.split(' ')[0] || 'Guest';
        addShiviMessage(
          `Account created successfully, ${firstName}!\n\n` +
          `You can now track all your bookings from your dashboard.\n\n` +
          `Your login email: ${bookingData.email}`,
          [
            { label: 'Go to Dashboard', action: 'dashboard', value: '/customer/dashboard' },
            { label: 'Book Another', action: 'restart', value: '' },
          ],
          1000
        );
        setCurrentStep('completed');
      } else {
        addShiviMessage(
          `${data.message || 'Failed to create password. Please try again.'}`,
          [
            { label: 'Skip', action: 'skip-login', value: '' },
          ],
          800,
          'password',
          'Create a password'
        );
      }
    } catch (error) {
      console.error('Create password error:', error);
      addShiviMessage(
        `Something went wrong. Please try again or skip.`,
        [
          { label: 'Skip', action: 'skip-login', value: '' },
        ],
        800
      );
    }
  };

  const handleB2BBusSubmit = async () => {
    addShiviMessage(
      '🏢 Processing your corporate booking request...',
      undefined,
      500
    );

    try {
      // Check if customer is logged in and B2B approved (or a linked travel
      // agent — they're allowed to make Corporate bookings on their agency's
      // behalf even though they aren't a regular B2B account).
      const customerData = loggedInCustomer;
      const isLinkedTravelAgent = !!customerData?.linkedTravelAgentId;
      const isApprovedB2B =
        customerData?.isB2B && customerData?.b2bStatus === 'APPROVED';
      if (!customerData || (!isApprovedB2B && !isLinkedTravelAgent)) {
        // Not a B2B customer - show message and redirect to B2B registration or submit as regular
        addShiviMessage(
          '⚠️ Corporate bookings require a B2B account.\n\n' +
          'Your request has been submitted as a regular booking. To access B2B features:\n\n' +
          '1. Register/Login as a customer\n' +
          '2. Apply for B2B access from your dashboard\n' +
          '3. Once approved, you can create corporate bookings\n\n' +
          'Meanwhile, we\'ll process this as a standard quote request.',
          undefined,
          1000
        );
        // Fall back to normal submission
        setTimeout(() => showSummary(), 1500);
        return;
      }

      // Parse dates
      const scheduledDate = bookingData.pickupDateTime ? new Date(bookingData.pickupDateTime).toISOString().split('T')[0] : '';
      const scheduledTime = bookingData.pickupDateTime ? new Date(bookingData.pickupDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      const returnDate = bookingData.returnDateTime ? new Date(bookingData.returnDateTime).toISOString().split('T')[0] : null;
      const returnTime = bookingData.returnDateTime ? new Date(bookingData.returnDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : null;

      // Detect the service so we route the b2b row with the correct
      // serviceType + display labels. Defaults to 'bus' for unknown types.
      const stLower = (serviceType || '').toLowerCase();
      let b2bServiceType: string;
      let b2bServiceDisplay: string;
      let b2bServiceEmoji: string;
      if (stLower.includes('bike') || stLower.includes('activa') || stLower.includes('royal-enfield')) {
        b2bServiceType = 'bike';        b2bServiceDisplay = 'Bike Rental';
        b2bServiceEmoji = '🏍️';
      } else if (stLower.includes('truck') || stLower.includes('transport')) {
        b2bServiceType = 'truck';
        b2bServiceDisplay = 'Truck Rental';
        b2bServiceEmoji = '🚚';
      } else if (stLower.includes('packer') || stLower.includes('mover')) {
        b2bServiceType = 'packers';
        b2bServiceDisplay = 'Packers & Movers';
        b2bServiceEmoji = '📦';
      } else if (stLower.includes('equipment') || stLower.includes('crane') || stLower.includes('jcb')) {
        b2bServiceType = 'equipment';
        b2bServiceDisplay = 'Equipment Rental';
        b2bServiceEmoji = '🏗️';
      } else if (stLower.includes('luxury')) {
        b2bServiceType = 'luxury';
        b2bServiceDisplay = 'Luxury Car';
        b2bServiceEmoji = '✨';
      } else if (stLower.includes('self-drive') || stLower.includes('self_drive') || stLower.includes('selfdrive')) {
        b2bServiceType = 'self-drive';
        b2bServiceDisplay = 'Self-Drive Car';
        b2bServiceEmoji = '🚗';
      } else if (stLower.includes('car') || stLower.includes('cab')) {
        b2bServiceType = 'car';
        b2bServiceDisplay = 'Car Rental';
        b2bServiceEmoji = '🚗';
      } else {
        b2bServiceType = 'bus';
        b2bServiceDisplay = 'Bus Rental';
        b2bServiceEmoji = '🚌';
      }
      const isBikeServiceB2B = b2bServiceType === 'bike';

      // Determine trip type
      const tripType = bookingData.busTripType === 'local' ? 'HOURLY' :
        (returnDate ? 'ROUND_TRIP' : 'ONE_WAY');

      const b2bPayload: any = {
        customerId: String(customerData.id),
        serviceType: b2bServiceType,
        vehiclesRequired: parseInt(bookingData.vehiclesRequired) || 1,
        passengerCount: parseInt(bookingData.passengers) || 1,
        vehicleCategory: bookingData.subService || 'standard',
        pickupLocation: bookingData.pickupLocation || '',
        dropLocation: bookingData.destination || '',
        tripType,
        scheduledDate,
        scheduledTime,
        returnDate,
        returnTime,
        specialNotes: bookingData.additionalDetails || '',
      };
      // Travel-agent COMPANY booking — backend uses this to tag the b2b row
      // with travelAgentId + bookingMode='COMPANY' (no agency-side B2B check).
      if (isLinkedTravelAgent) {
        b2bPayload.taBookingMode = 'COMPANY';
      }

      const response = await fetch('/api/b2b/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b2bPayload),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const firstName = bookingData.name?.split(' ')[0] || customerData.name?.split(' ')[0] || 'there';
        addShiviMessage(
          `🎉 Corporate Booking Created, ${firstName}!\n\n` +
          `📋 Booking ID: ${result.booking.bookingNumber}\n` +
          `${b2bServiceEmoji} Service: ${b2bServiceDisplay}\n` +
          (isBikeServiceB2B ? '' : `👥 Passengers: ${bookingData.passengers}\n`) +
          `📍 ${bookingData.pickupLocation}${bookingData.destination ? ' → ' + bookingData.destination : ''}\n\n` +
          `Your request is now live! Vendors will send their quotes shortly.\n\n` +
          `Track your booking on the B2B Dashboard.`,
          [
            { label: '📊 Go to B2B Dashboard', action: 'dashboard', value: '/customer/dashboard' },
            { label: '📋 View Booking', action: 'dashboard', value: `/customer/b2b-bookings/${result.booking.id}` },
            { label: '🔄 New Booking', action: 'restart', value: '' },
          ],
          1000
        );
        setCurrentStep('completed');
      } else {
        throw new Error(result.error || 'Failed to create B2B booking');
      }
    } catch (error: any) {
      console.error('B2B Submit Error:', error);
      addShiviMessage(
        `❌ ${error.message || 'Something went wrong.'}\n\nLet me submit this as a regular quote request instead.`,
        undefined,
        800
      );
      // Fallback to normal flow
      setTimeout(() => showSummary(), 1500);
    }
  };

  const handleSubmit = async () => {
    addUserMessage('Confirm & Get Best Quotes');

    // God-level: Better loading message
    addShiviMessage(
      '✨ Processing your request...\n\nFinding the best vendors for you! 🔍',
      undefined,
      500
    );

    try {
      // Check fleet vehicle category first
      const fleetVehicleName = bookingData.fleet || vehicleName;
      const selectedFleetVehicle = fleetVehicleName ? getVehicleByName(fleetVehicleName) : null;
      const isFleetBike = selectedFleetVehicle?.category === 'bike';
      const isFleetCar = selectedFleetVehicle?.category === 'car';
      const isFleetBus = selectedFleetVehicle?.category === 'bus';

      const isSelfDriveService = serviceType.includes('selfdrive') || serviceType.includes('self-drive');
      const isLuxuryService = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
      const isCarService = (isCarWithDriverServiceType(serviceType) && !isLuxuryService) || isFleetCar;
      const isBikeService = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield') || isFleetBike;
      const isBusService = serviceType.includes('bus') || serviceType.includes('tempo') || isFleetBus;
      const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      const isPackersService = serviceType.includes('packers') || serviceType.includes('movers');
      const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb');

      // Determine service ID dynamically from database
      const getServiceId = () => {
        let matchServiceName = '';

        if (isBikeService) {
          matchServiceName = 'Bike Rental';
        } else if (isBusService) {
          matchServiceName = 'Bus Rental';
        } else if (isTruckService) {
          matchServiceName = 'Transporter';
        } else if (isPackersService) {
          matchServiceName = 'Packers & Movers';
        } else if (isEquipmentService) {
          matchServiceName = 'Equipment';
        } else if (isSelfDriveService) {
          matchServiceName = 'Selfdrive Car';
        } else if (isLuxuryService) {
          matchServiceName = 'Luxury Car';
        } else if (isCarService) {
          // Car service names based on trip type
          if (bookingData.tripType === 'roundtrip') matchServiceName = 'Round Trip Car';
          else if (bookingData.tripType === 'oneway') matchServiceName = 'One-Way Car';
          else if (bookingData.tripType === 'airport') matchServiceName = 'Airport Taxi';
          else matchServiceName = 'Round Trip Car';
        }

        // Debug: Log available services
        console.log('Chat - Available services:', services.length, 'services');

        // Find matching service from database with flexible matching
        const service = services.find(s => {
          const sName = s.name.toLowerCase();
          if (isBikeService) {
            return (
              sName.includes('bike') ||
              sName === 'bike rental' ||
              sName === 'bike on rent' ||
              sName.includes('two wheeler')
            );
          } else if (isBusService) {
            return (
              sName.includes('bus') ||
              sName === 'bus rental' ||
              sName.includes('tempo')
            );
          } else if (isTruckService) {
            return (
              sName.includes('truck') ||
              sName.includes('transporter') ||
              sName.includes('trailer')
            );
          } else if (isPackersService) {
            return (
              sName.includes('packers') ||
              sName.includes('movers') ||
              sName.includes('shifting')
            );
          } else if (isEquipmentService) {
            return (
              sName.includes('equipment') ||
              sName.includes('jcb') ||
              sName.includes('crane') ||
              sName.includes('excavator')
            );
          } else if (isCarService) {
            const target = matchServiceName.toLowerCase();
            return (
              sName.includes(target) ||
              sName === target ||
              (matchServiceName.includes('Round Trip') && (sName.includes('round') || sName.includes('roundtrip'))) ||
              (matchServiceName.includes('One-Way') && (sName.includes('oneway') || sName.includes('one way') || sName.includes('one-way'))) ||
              (matchServiceName.includes('Airport') && (sName.includes('airport') || sName.includes('cab')))
            );
          }
          return false;
        });

        console.log('Chat - Matched service:', service, 'for', matchServiceName);

        // Fallback IDs: Bike = 2, Round Trip = 3, One-Way = 4, Airport = 3, Bus = 6, Truck = 7, Packers = 9, Equipment = 8
        let fallbackId = 2;
        if (isBikeService) fallbackId = 2;
        else if (isBusService) fallbackId = 6;
        else if (isTruckService) fallbackId = 7;
        else if (isPackersService) fallbackId = 9;
        else if (isEquipmentService) fallbackId = 8;
        else if (isCarService) fallbackId = bookingData.tripType === 'oneway' ? 4 : 3;

        // Return both ID and name from database
        return {
          id: service?.id || fallbackId,
          name: service?.name || matchServiceName
        };
      };

      const serviceData = getServiceId();
      const serviceId = serviceData.id;
      const actualServiceName = serviceData.name;

      // Find location ID
      const location = locations.find(loc =>
        loc.name.toLowerCase() === bookingData.pickupLocation?.toLowerCase()
      );

      // Map bike type based on sub-service or fleet vehicle type
      // API values: 1=Sport, 2=Scooter, 3=Cruiser, 4=Street, 5=Adventure, 6=Dirt
      const getBikeType = () => {
        // For fleet bikes, derive type from vehicle data
        if (isFleetBike && selectedFleetVehicle) {
          const vehicleType = selectedFleetVehicle.type?.toLowerCase() || '';
          const vehicleName = selectedFleetVehicle.name?.toLowerCase() || '';

          // Map fleet vehicle type to API bike_type
          if (vehicleType.includes('scooter') || vehicleName.includes('activa') || vehicleName.includes('jupiter') || vehicleName.includes('access')) return '2';
          if (vehicleType.includes('cruiser') || vehicleName.includes('royal') || vehicleName.includes('enfield') || vehicleName.includes('bullet')) return '3';
          if (vehicleType.includes('sport') || vehicleName.includes('ktm') || vehicleName.includes('duke') || vehicleName.includes('pulsar')) return '1';
          if (vehicleType.includes('adventure') || vehicleName.includes('himalayan')) return '5';
          if (vehicleType.includes('street') || vehicleName.includes('splendor') || vehicleName.includes('commuter')) return '4';
          if (vehicleType.includes('dirt') || vehicleType.includes('off-road')) return '6';
          return '2'; // Default to scooter for fleet bikes
        }

        // Original subService-based logic
        const subService = bookingData.subService?.toLowerCase() || '';
        if (subService.includes('regular')) return '1';
        if (subService.includes('activa') || subService.includes('scooter')) return '2';
        if (subService.includes('royal') || subService.includes('enfield')) return '3';
        if (subService.includes('sports')) return '4';
        if (subService.includes('ktm')) return '5';
        if (subService.includes('premium')) return '6';
        return '1'; // Default
      };

      // Determine booking type for unified API
      let bookingType = 'bike';
      if (isBusService) {
        bookingType = bookingData.busTripType === 'local' ? 'bus-local' : 'bus-outstation';
      } else if (isTruckService) {
        if (serviceType.includes('trailer')) bookingType = 'trailer';
        else if (serviceType.includes('mini-truck')) bookingType = 'truck-personal';
        else bookingType = bookingData.truckMode === '2' ? 'truck-commercial' : 'truck-personal';
      } else if (isPackersService) {
        const shiftType = (bookingData.shiftingType || 'home').toLowerCase();
        bookingType = `packers-${shiftType}`;
      } else if (isEquipmentService) {
        bookingType = 'equipment';
      } else if (isLuxuryService) {
        // BROWSE_FIRST: luxury → quote request (vendors send quotes)
        bookingType = 'luxury-quote-request';
      } else if (isSelfDriveService) {
        // BROWSE_FIRST: self-drive → quote request (vendors send quotes)
        bookingType = 'selfdrive-quote-request';
      } else if (isCarService) {
        // TRIP_FIRST: only car-with-driver gets direct booking
        if (bookingData.tripType === 'roundtrip') bookingType = 'car-roundtrip';
        else if (bookingData.tripType === 'oneway') bookingType = 'car-oneway';
        else if (bookingData.tripType === 'airport') bookingType = 'car-airport';
        else bookingType = 'car-roundtrip';
      } else if (isBikeService) {
        // BROWSE_FIRST: bike → quote request (vendors send quotes)
        bookingType = 'bike-quote-request';
      }

      // Helper to format datetime for API (YYYY-MM-DD HH:mm:ss format)
      const formatDateTimeForAPI = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch {
          return dateStr;
        }
      };

      // Clean phone number (digits only)
      const cleanPhone = (bookingData.phone || '').replace(/\D/g, '');

      // Prepare booking payload
      let webBookingPayload: any = {
        service_id: serviceId,
        service_name: actualServiceName,
        // Specific vehicle model name for model-specific pages (e.g. "Seltos", "KTM")
        vehicle_model_name: vehicleModelName || '',
        location_id: location?.id || 1,
        location_name: bookingData.pickupLocation || '',
        pickup_full_address: bookingData.pickupFullAddress || '',
        destination: bookingData.destination || bookingData.pickupLocation || '', // Use pickup if no destination
        destination_full_address: bookingData.destinationFullAddress || '',
        journey_datetime: formatDateTimeForAPI(bookingData.pickupDateTime) || formatDateTimeForAPI(new Date().toISOString()),
        // Customer info - directly in payload for web API
        name: bookingData.name || '',
        email: bookingData.email || '',
        phone: cleanPhone,
        // Fleet/vehicle name from fleet page
        fleet: bookingData.fleet || '',
      };

      // Only add return_datetime if it exists (don't send null)
      if (bookingData.returnDateTime) {
        webBookingPayload.return_datetime = formatDateTimeForAPI(bookingData.returnDateTime);
      }

      // Add bike-specific fields
      if (isBikeService) {
        webBookingPayload.bike_duration = bookingData.bikeDuration || '1';
        webBookingPayload.bike_type = getBikeType();
        // Include fleet vehicle name in other_info for fleet bikes
        if (isFleetBike && selectedFleetVehicle) {
          webBookingPayload.other_info = `Fleet Vehicle: ${selectedFleetVehicle.name}`;
        } else {
          webBookingPayload.other_info = bookingData.subService ? `Bike Type: ${bookingData.subService}` : '';
        }
      }

      // Add car-specific fields
      if (isCarService) {
        webBookingPayload.trip_type = bookingData.tripType === 'roundtrip' ? '3' :
          bookingData.tripType === 'oneway' ? '1' : '2';

        // Map car type to numeric values expected by database
        // 1 = Sedan, 2 = SUV, 3 = Hatchback, 4 = MUV, 5 = Luxury
        const getCarTypeNumber = (carType: string) => {
          const type = (carType || bookingData.subService || '').toLowerCase();
          if (type.includes('sedan')) return '2';
          if (type.includes('suv')) return '4';
          if (type.includes('hatchback')) return '1';
          if (type.includes('muv')) return '3';
          if (type.includes('luxury')) return '5';
          return '2'; // Default to sedan
        };

        webBookingPayload.car_type = getCarTypeNumber(bookingData.carType);
        webBookingPayload.total_passangers = parseInt(bookingData.passengers) || 1;
        if (bookingData.airportOption) {
          webBookingPayload.airport_option = bookingData.airportOption;
        }
        webBookingPayload.other_info = '';
      }

      // Add bus-specific fields
      if (isBusService) {
        // location_type: 1 = Outstation, 2 = Local
        webBookingPayload.location_type = bookingData.busTripType === 'outstation' ? '1' : '2';
        webBookingPayload.total_passangers = parseInt(bookingData.passengers) || 1;
        webBookingPayload.other_info = bookingData.subService ? `Bus Type: ${bookingData.subService}` : '';
      }

      // Add truck-specific fields
      if (isTruckService) {
        webBookingPayload.truck_mode = bookingData.truckMode || '1';
        webBookingPayload.truck_type = bookingData.truckType || '14';
        webBookingPayload.truck_type_name = bookingData.truckTypeName || null;

        // Set goods type based on mode (commercial or personal)
        if (bookingData.truckMode === '2') {
          webBookingPayload.commercial_good_type = bookingData.goodsType || '12';
        } else {
          webBookingPayload.personal_good_type = bookingData.goodsType || '12';
        }
        webBookingPayload.goods_type_name = bookingData.goodsTypeName || null;

        // Weight fields - weight_val is the value, weight is the unit (1=KG, 2=TON)
        webBookingPayload.weight_val = bookingData.weightVal || '';
        webBookingPayload.weight = bookingData.weightUnit || '1';
        webBookingPayload.weight_unit_name = bookingData.weightUnitName || 'KG';

        webBookingPayload.return_datetime = bookingData.returnDateTime || null;

        // ── New extended truck quotation fields ──
        webBookingPayload.truck_body_type = bookingData.truckBodyType || null;
        webBookingPayload.material_details = bookingData.materialDetails || null;
        webBookingPayload.truck_estimated_volume = bookingData.truckEstimatedVolume || null;
        webBookingPayload.truck_pickup_pincode = bookingData.truckPickupPincode || null;
        webBookingPayload.truck_drop_pincode = bookingData.truckDropPincode || null;
        webBookingPayload.truck_pickup_floor =
          bookingData.truckPickupFloor != null ? parseInt(bookingData.truckPickupFloor) : null;
        webBookingPayload.has_truck_pickup_lift = bookingData.hasTruckPickupLift === true;
        webBookingPayload.truck_drop_floor =
          bookingData.truckDropFloor != null ? parseInt(bookingData.truckDropFloor) : null;
        webBookingPayload.has_truck_drop_lift = bookingData.hasTruckDropLift === true;
        webBookingPayload.truck_expected_delivery_date = bookingData.truckExpectedDelivery || null;
        webBookingPayload.truck_expected_delivery_time = bookingData.truckDeliveryTime || null;
        webBookingPayload.trip_direction = bookingData.tripDirection || 'ONE_WAY';
        webBookingPayload.requires_labour = bookingData.requiresLabour === true;
        webBookingPayload.truck_labour_count =
          bookingData.truckLabourCount != null ? parseInt(bookingData.truckLabourCount) : null;
        webBookingPayload.truck_has_multiple_stops = bookingData.truckHasMultipleStops === true;
        webBookingPayload.truck_multiple_stops_details = bookingData.truckMultipleStopsDetails || null;
        webBookingPayload.truck_receiver_name = bookingData.truckReceiverName || null;
        webBookingPayload.truck_receiver_phone = bookingData.truckReceiverPhone || null;
        webBookingPayload.truck_requires_pod = bookingData.truckRequiresPOD === true;

        webBookingPayload.other_info = `Truck: ${bookingData.truckTypeName || 'N/A'}, Goods: ${bookingData.goodsTypeName || 'N/A'}, Weight: ${bookingData.weightVal || 'N/A'} ${bookingData.weightUnitName || 'KG'}`;
      }

      // Add packers & movers specific fields (extended quotation form)
      if (isPackersService) {
        webBookingPayload.shifting_type = bookingData.shiftingType || 'Home';
        webBookingPayload.shifting_scope = bookingData.shiftingScope || 'LOCAL';
        if (bookingData.shiftingType === 'Home') {
          webBookingPayload.home_shifting = bookingData.homeShifting || 'BHK_2';
        } else if (bookingData.shiftingType === 'Office') {
          webBookingPayload.office_shifting = bookingData.officeSize || 'UPTO_10_EMPLOYEES';
        } else if (bookingData.shiftingType === 'Vehicle') {
          webBookingPayload.vehicle_shifting = bookingData.vehicleSubtype || 'CAR';
        }
        webBookingPayload.pickup_pincode = bookingData.pickupPincode || null;
        webBookingPayload.drop_pincode = bookingData.dropPincode || null;
        webBookingPayload.expected_delivery_date = bookingData.expectedDeliveryDate || null;
        webBookingPayload.expected_delivery_time = bookingData.expectedDeliveryTime || null;
        webBookingPayload.inventory_list = bookingData.inventoryList || null;
        webBookingPayload.estimated_weight = bookingData.estimatedWeight != null ? parseFloat(bookingData.estimatedWeight) : null;
        webBookingPayload.pickup_floor = bookingData.pickupFloor != null ? parseInt(bookingData.pickupFloor) : null;
        webBookingPayload.has_pickup_lift = bookingData.hasPickupLift === true;
        webBookingPayload.drop_floor = bookingData.dropFloor != null ? parseInt(bookingData.dropFloor) : null;
        webBookingPayload.has_drop_lift = bookingData.hasDropLift === true;
        webBookingPayload.has_heavy_items = bookingData.hasHeavyItems === true;
        webBookingPayload.heavy_items_desc = bookingData.heavyItemsDesc || null;
        webBookingPayload.has_fragile_items = bookingData.hasFragileItems === true;
        webBookingPayload.fragile_items_desc = bookingData.fragileItemsDesc || null;
        webBookingPayload.boxes_count = bookingData.boxesCount != null ? parseInt(bookingData.boxesCount) : null;
        webBookingPayload.bags_count = bookingData.bagsCount != null ? parseInt(bookingData.bagsCount) : null;
        webBookingPayload.need_packing = bookingData.needPacking !== false;
        webBookingPayload.need_loading = bookingData.needLoading !== false;
        webBookingPayload.need_unloading = bookingData.needUnloading !== false;
        webBookingPayload.labour_count = bookingData.labourCount != null ? parseInt(bookingData.labourCount) : null;
        webBookingPayload.vehicle_type_req = bookingData.vehicleTypeReq || 'DEDICATED';
        webBookingPayload.part_load_accepted = bookingData.partLoadAccepted === true;
        webBookingPayload.need_insurance = bookingData.needInsurance === true;
        webBookingPayload.insurance_value = bookingData.insuranceValue != null ? parseFloat(bookingData.insuranceValue) : null;
        webBookingPayload.requires_pod = bookingData.requiresPOD === true;
        webBookingPayload.receiver_name = bookingData.receiverName || null;
        webBookingPayload.receiver_phone = bookingData.receiverPhone || null;
        webBookingPayload.has_multiple_stops = bookingData.hasMultipleStops === true;
        webBookingPayload.multiple_stops_details = bookingData.multipleStopsDetails || null;
        webBookingPayload.other_info = `Scope: ${bookingData.shiftingScope || 'LOCAL'}, Type: ${bookingData.shiftingType || 'Home'}`;
      }

      // Add equipment rental specific fields
      if (isEquipmentService) {
        webBookingPayload.machine_type = bookingData.machineType || '1';
        webBookingPayload.job_duration = bookingData.jobDuration || '1';
        webBookingPayload.no_of_equipments = bookingData.noOfEquipments || '1';
        webBookingPayload.other_info = bookingData.additionalDetails || `Equipment: ${bookingData.machineTypeName || 'N/A'}, Duration: ${bookingData.jobDurationName || 'N/A'}`;
      }

      // Add luxury car specific fields
      if (isLuxuryService) {
        webBookingPayload.luxury_type = bookingData.luxuryType || '2'; // Default to Personal
        webBookingPayload.package = bookingData.luxuryPackage || '1'; // Default to Local
        webBookingPayload.other_info = bookingData.additionalDetails || '';
      }

      // Add self-drive car specific fields
      if (isSelfDriveService) {
        webBookingPayload.car_type = bookingData.selfDriveCarType || '1';
        webBookingPayload.transmission = bookingData.transmission || '2';
        webBookingPayload.fuel_type = bookingData.fuelType || '2';
        webBookingPayload.doorstep_delivery = bookingData.doorstepDelivery || '0';
        webBookingPayload.other_info = bookingData.additionalDetails || '';
      }

      // Forward the user's Personal / Company choice + vehicle count so the
      // backend can route travel-agent COMPANY bookings into b2b_bookings.
      if (bookingData.bookingPurpose) {
        webBookingPayload.bookingPurpose = bookingData.bookingPurpose;
        webBookingPayload.taBookingMode =
          bookingData.bookingPurpose === 'company' ? 'COMPANY' : 'PERSONAL';
      }
      if (bookingData.numberOfVehicles) {
        webBookingPayload.numberOfVehicles = bookingData.numberOfVehicles;
      }

      // Prepare unified booking payload for local API
      const unifiedPayload = {
        bookingType,
        customerInfo: {
          name: bookingData.name || '',
          email: bookingData.email || '',
          phone: cleanPhone,
        },
        bookingData: webBookingPayload,
      };

      // Debug: Log the payload being sent
      console.log('=== BOOKING API REQUEST (Local) ===');
      console.log('Booking Type:', bookingType);
      console.log('PAYLOAD:', JSON.stringify(unifiedPayload, null, 2));
      console.log('===================================');

      // Submit to local Next.js API (stores in local Prisma database)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(unifiedPayload),
      });

      const result = await response.json();
      console.log('=== BOOKING API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('============================');

      if (!response.ok) {
        console.error('=== API VALIDATION ERRORS ===');
        console.error(JSON.stringify(result, null, 2));
        console.error('=============================');
        throw new Error(result.message || `Validation failed (${response.status})`);
      }

      if (!result.success && !result.booking_id && !result.request_id) {
        throw new Error(result.message || 'Booking failed');
      }

      const firstName = bookingData.name?.split(' ')[0] || 'Guest';
      const bookingId = result.booking_number || result.request_number || result.booking_id || 'TR' + Math.floor(Math.random() * 100000);
      const customerData = result.customer;

      // Store booking data for later use
      setBookingData((prev: any) => ({
        ...prev,
        lastBookingId: bookingId,
        lastBookingRedirect: result.redirect_to,
        customerId: customerData?.id,
      }));

      // If already logged in, show success directly
      if (isLoggedIn) {
        showBookingSuccessMessage(firstName, bookingId, result.redirect_to);
        return;
      }

      // Check if customer exists and has password
      try {
        const checkRes = await fetch('/api/customer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-exists',
            email: bookingData.email,
          }),
        });
        const checkData = await checkRes.json();

        if (checkData.status === 'success' && checkData.exists) {
          if (checkData.customer?.hasPassword) {
            // Customer has password - ask to login
            addShiviMessage(
              `Booking Created, ${firstName}!\n\n` +
              `Booking ID: #${bookingId}\n\n` +
              `I see you already have an account with us. Please enter your password to login and track your booking on your dashboard.`,
              [],
              1000,
              'password',
              'Enter your password'
            );
            setCurrentStep('awaiting-login-password');
          } else {
            // Customer exists but no password - ask to create
            addShiviMessage(
              `Booking Created, ${firstName}!\n\n` +
              `Booking ID: #${bookingId}\n\n` +
              `Create a password to access your dashboard and track all your bookings in one place.\n\n` +
              `Benefits of creating an account:\n` +
              `• Track all bookings on dashboard\n` +
              `• Get faster booking next time\n` +
              `• Earn and redeem Backr Tokens\n\n` +
              `Enter a password (min 6 characters):`,
              [],
              1000,
              'password',
              'Create a password'
            );
            setCurrentStep('awaiting-create-password');
          }
        } else {
          // No customer found (shouldn't happen as booking creates customer)
          showBookingSuccessMessage(firstName, bookingId, result.redirect_to);
        }
      } catch (authError) {
        console.error('Auth check error:', authError);
        // Fallback to success message if auth check fails
        showBookingSuccessMessage(firstName, bookingId, result.redirect_to);
      }
    } catch (error) {
      // Error handling - log for debugging
      console.error('Booking submission error:', error);
      console.error('Booking data:', bookingData);
      addShiviMessage(
        `Oops! Something went wrong. 😔\n\nPlease try again or contact us:\n📞 ${CONTACT_PHONE}\n📧 ${CONTACT_EMAIL}`,
        [
          { label: '🔄 Try Again', action: 'restart', value: '' },
        ],
        1000
      );
    }
  };

  const handleOptionClick = (action: string, value?: string) => {
    const isLuxuryServiceLocal = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
    const isCarService = isCarWithDriverServiceType(serviceType) && !isLuxuryServiceLocal;
    const isAirportService = serviceType === 'airport-transfer';

    if (action === 'select-subservice') {
      const selected = subServices?.find(s => s.value === value);
      if (selected) {
        addUserMessage(selected.label);
        setBookingData((prev: any) => ({
          ...prev,
          subService: selected.label,
          ...(isAirportService ? { tripType: 'airport' } : {}),
        }));
        if (isAirportService) {
          askForAirportOption();
        } else if (isCarService) {
          askForCarTripType();
        } else {
          askForLocation();
        }
      }
    } else if (action === 'select-trip-type') {
      const tripTypeLabels: Record<string, string> = {
        'roundtrip': 'Round Trip',
        'airport': 'Airport Taxi',
        'oneway': 'One-Way'
      };
      addUserMessage(tripTypeLabels[value || 'roundtrip']);
      setBookingData((prev: any) => ({ ...prev, tripType: value }));
      // For airport, ask for drop/pickup option
      if (value === 'airport') {
        askForAirportOption();
      } else {
        askForLocation();
      }
    } else if (action === 'select-airport-option') {
      const airportLabels: Record<string, string> = {
        'drop': 'Drop to Airport',
        'pickup': 'Pick up from Airport'
      };
      addUserMessage(airportLabels[value || 'drop']);
      setBookingData((prev: any) => ({ ...prev, airportOption: value }));
      askForLocation();
    } else if (action === 'select-bus-trip-type') {
      const busTripTypeLabels: Record<string, string> = {
        'outstation': 'Outstation',
        'local': 'Local'
      };
      addUserMessage(busTripTypeLabels[value || 'outstation']);
      setBookingData((prev: any) => ({ ...prev, busTripType: value }));
      askForLocation();
    } else if (action === 'select-truck-mode') {
      const truckModeLabels: Record<string, string> = {
        '1': 'Personal Use',
        '2': 'Commercial Use'
      };
      addUserMessage(truckModeLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, truckMode: value }));
      askForTruckBodyType();
    } else if (action === 'select-truck-body-type') {
      const bodyTypeLabels: Record<string, string> = {
        OPEN: 'Open',
        CLOSED_BODY: 'Closed Body',
        CONTAINER: 'Container',
        TRAILER: 'Trailer',
        LCV: 'LCV',
        REFRIGERATED: 'Refrigerated',
        FLATBED: 'Flatbed',
        OTHER: 'Other',
      };
      addUserMessage(bodyTypeLabels[value || 'OPEN']);
      setBookingData((prev: any) => ({ ...prev, truckBodyType: value || 'OPEN' }));
      askForTruckType();
    } else if (action === 'select-truck-type') {
      const truckTypeLabels: Record<string, string> = {
        '1': 'Canter Jumbo',
        '2': 'Canter 17ft (4 wheel)',
        '3': 'Canter 19ft (6 wheel)',
        '4': 'Canter 3MT (4 wheel)',
        '5': 'Canter Close Body 20ft',
        '6': 'Canter Close Body 24ft',
        '7': 'LCV',
        '8': 'Semi Low Bed Trailer',
        '9': 'Truck 20MT (12 Wheel)',
        '10': 'Truck 25MT (14 Wheel)',
        '11': 'Truck 16MT (10 Wheel)',
        '12': 'Tata 407 (2.5 MT)',
        '13': 'Truck 9MT (6 Wheel)',
        '14': 'Tata Ace'
      };
      addUserMessage(truckTypeLabels[value || '14']);
      setBookingData((prev: any) => ({ ...prev, truckType: value, truckTypeName: truckTypeLabels[value || '14'] }));
      const isCommercial = bookingData.truckMode === '2';
      askForTruckGoodsType(isCommercial);
    } else if (action === 'show-more-trucks') {
      addUserMessage('More Options...');
      askForMoreTruckTypes();
    } else if (action === 'select-goods-type') {
      const goodsTypeLabels: Record<string, string> = {
        '1': 'Building Materials',
        '2': 'Granites/Marbles',
        '3': 'Cement',
        '4': 'Chemical',
        '5': 'Coal & Ash',
        '6': 'Container',
        '7': 'Engineering Goods',
        '8': 'Electronics',
        '9': 'Fertilizer',
        '10': 'Fruits & Vegetables',
        '11': 'Furniture & Wood',
        '12': 'Household Goods',
        '13': 'Industrial Equipment',
        '14': 'Iron/Steel Material',
        '15': 'Liquid/Oil Drums',
        '16': 'Machineries',
        '17': 'Marble Slab/Block',
        '18': 'Medicines',
        '19': 'Packed Foods',
        '20': 'Plastic Pipes',
        '21': 'Books/Paper Rolls',
        '22': 'Plastic Granules',
        '23': 'Crop/Agriculture',
        '24': 'Scrap',
        '25': 'Stones/Tiles',
        '26': 'Textiles',
        '27': 'Tyres & Rubber',
        '28': 'Vehicles/Automobiles',
        '29': 'Others'
      };
      addUserMessage(goodsTypeLabels[value || '29']);
      setBookingData((prev: any) => ({ ...prev, goodsType: value, goodsTypeName: goodsTypeLabels[value || '29'] }));
      // Truck flow: goods-type → material-details → weight
      askForMaterialDetails();
    } else if (action === 'skip-material-details') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, materialDetails: null }));
      askForWeight();
    } else if (action === 'select-material-details') {
      addUserMessage(value || '');
      setBookingData((prev: any) => ({ ...prev, materialDetails: value }));
      askForWeight();
    } else if (action === 'add-material-detail') {
      // Append to input field — let the user keep adding items, edit, then press Send
      const next = (value || '').trim();
      if (!next) return;
      setInputValue((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return next;
        // Avoid duplicate adds of the exact same chip
        const existing = trimmed.split(',').map((s) => s.trim().toLowerCase());
        if (existing.includes(next.toLowerCase())) return prev;
        return `${trimmed}, ${next}`;
      });
      // Refocus the text input so the user can edit / continue typing
      if (inputRef.current) inputRef.current.focus();
    } else if (action === 'noop') {
      // hint-only button — no action; user types into the input instead
    } else if (action === 'select-weight-unit') {
      const weightUnitLabels: Record<string, string> = {
        '1': 'KG',
        '2': 'TON'
      };
      addUserMessage(weightUnitLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, weightUnit: value, weightUnitName: weightUnitLabels[value || '1'] }));
      // For trucks, ask estimated volume next; otherwise go to location
      const isTruckSvc = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      if (isTruckSvc) {
        askForEstimatedVolume();
      } else {
        askForLocation();
      }
    } else if (action === 'select-truck-volume') {
      const labels: Record<string, string> = {
        LIGHT: '🪶 Light (small load)',
        MEDIUM: '📦 Medium (canter-load)',
        LARGE: '🚛 Large (truck-load)',
      };
      addUserMessage(labels[value || 'MEDIUM']);
      setBookingData((prev: any) => ({ ...prev, truckEstimatedVolume: value || null }));
      askForLocation();
    } else if (action === 'skip-truck-volume') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckEstimatedVolume: null }));
      askForLocation();
    } else if (action === 'show-more-goods') {
      addUserMessage('More Options...');
      const isCommercial = bookingData.truckMode === '2';
      askForMoreGoodsTypes(isCommercial);
    } else if (action === 'select-shifting-scope') {
      const scopeLabels: Record<string, string> = {
        'LOCAL': 'Local (within city)',
        'DOMESTIC': 'Domestic (within state)',
        'INTERCITY': 'Intercity (between states)',
      };
      addUserMessage(scopeLabels[value || 'LOCAL']);
      setBookingData((prev: any) => ({ ...prev, shiftingScope: value || 'LOCAL' }));
      askForShiftingType();
    } else if (action === 'select-shifting-type') {
      const shiftingTypeLabels: Record<string, string> = {
        'Home': 'Home Shifting',
        'Office': 'Office Shifting',
        'Vehicle': 'Vehicle Transport'
      };
      addUserMessage(shiftingTypeLabels[value || 'Home']);
      setBookingData((prev: any) => ({ ...prev, shiftingType: value }));
      const isPackersServiceLocal = serviceType.includes('packers') || serviceType.includes('movers');
      if (value === 'Home') {
        askForHomeShiftingSize();
      } else if (value === 'Office' && isPackersServiceLocal) {
        askForOfficeSize();
      } else if (value === 'Vehicle' && isPackersServiceLocal) {
        askForVehicleSubType();
      } else {
        askForLocation();
      }
    } else if (action === 'select-office-size') {
      const officeSizeLabels: Record<string, string> = {
        'UPTO_10_EMPLOYEES': '1-10 Employees',
        'UPTO_50_EMPLOYEES': '11-50 Employees',
        'UPTO_100_EMPLOYEES': '51-100 Employees',
        'MORE_THAN_100_EMPLOYEES': '100+ Employees',
      };
      addUserMessage(officeSizeLabels[value || 'UPTO_10_EMPLOYEES']);
      setBookingData((prev: any) => ({ ...prev, officeSize: value }));
      askForLocation();
    } else if (action === 'select-vehicle-subtype') {
      const vehicleSubtypeLabels: Record<string, string> = {
        'CAR': 'Car',
        'BIKE': 'Bike',
        'BOTH': 'Car & Bike',
      };
      addUserMessage(vehicleSubtypeLabels[value || 'CAR']);
      setBookingData((prev: any) => ({ ...prev, vehicleSubtype: value }));
      askForLocation();
    } else if (action === 'select-home-size') {
      const homeSizeLabels: Record<string, string> = {
        'BHK_1': '1 BHK',
        'BHK_2': '2 BHK',
        'BHK_3': '3 BHK',
        'BHK_More_THAN_4': '4+ BHK / Villa'
      };
      addUserMessage(homeSizeLabels[value || 'BHK_2']);
      setBookingData((prev: any) => ({ ...prev, homeShifting: value }));
      askForLocation();
    } else if (action === 'confirm-pickup-lift') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, lift available' : 'No lift');
      setBookingData((prev: any) => ({ ...prev, hasPickupLift: yes }));
      // Continue packers flow → drop city via askForDestination
      askForDestination();
    } else if (action === 'confirm-drop-lift') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, lift available' : 'No lift');
      setBookingData((prev: any) => ({ ...prev, hasDropLift: yes }));
      // Continue packers flow → pickup-datetime
      askForPickupDateTime();
    } else if (action === 'skip-pickup-floor') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, pickupFloor: null }));
      askForPickupLift();
    } else if (action === 'skip-drop-floor') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, dropFloor: null }));
      askForDropLift();
    } else if (action === 'skip-expected-delivery') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, expectedDeliveryDate: null }));
      askForDeliveryTime();
    } else if (action === 'select-delivery-time') {
      const labels: Record<string, string> = {
        MORNING: '🌅 Morning (8 AM – 12 PM)',
        AFTERNOON: '☀️ Afternoon (12 PM – 4 PM)',
        EVENING: '🌆 Evening (4 PM – 8 PM)',
        ANYTIME: '🌙 Anytime',
      };
      addUserMessage(labels[value || 'ANYTIME']);
      setBookingData((prev: any) => ({ ...prev, expectedDeliveryTime: value || null }));
      askForInventoryList();
    } else if (action === 'skip-delivery-time') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, expectedDeliveryTime: null }));
      askForInventoryList();
    } else if (action === 'skip-inventory-list') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, inventoryList: null }));
      askForEstimatedWeight();
    } else if (action === 'add-inventory-item') {
      const next = (value || '').trim();
      if (!next) return;
      setInputValue((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return next;
        const existing = trimmed.split(',').map((s) => s.trim().toLowerCase());
        if (existing.includes(next.toLowerCase())) return prev;
        return `${trimmed}, ${next}`;
      });
      if (inputRef.current) inputRef.current.focus();
    } else if (action === 'select-estimated-weight') {
      const labels: Record<string, string> = {
        '300': '🪶 Light (< 500 kg)',
        '1000': '📦 Medium (500 – 1500 kg)',
        '2500': '🏋️ Heavy (1500 – 3000 kg)',
        '4000': '🚛 Very Heavy (> 3000 kg)',
      };
      addUserMessage(labels[value || '1000']);
      setBookingData((prev: any) => ({ ...prev, estimatedWeight: parseFloat(value || '0') }));
      askForHeavyItems();
    } else if (action === 'skip-estimated-weight') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, estimatedWeight: null }));
      askForHeavyItems();
    } else if (action === 'confirm-heavy-items') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, hasHeavyItems: yes }));
      if (yes) {
        askForHeavyItemsDesc();
      } else {
        askForFragileItems();
      }
    } else if (action === 'skip-heavy-items-desc') {
      addUserMessage('Skip');
      askForFragileItems();
    } else if (action === 'confirm-fragile-items') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, hasFragileItems: yes }));
      askForPackingItemsDetails();
    } else if (action === 'skip-packing-details') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, fragileItemsDesc: null, boxesCount: null, bagsCount: null }));
      askForNeedPacking();
    } else if (action === 'add-packing-detail') {
      const next = (value || '').trim();
      if (!next) return;
      setInputValue((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return next;
        const existing = trimmed.split(',').map((s) => s.trim().toLowerCase());
        if (existing.includes(next.toLowerCase())) return prev;
        return `${trimmed}, ${next}`;
      });
      if (inputRef.current) inputRef.current.focus();
    } else if (action === 'confirm-need-packing') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, please pack' : "No, I'll pack myself");
      setBookingData((prev: any) => ({ ...prev, needPacking: yes }));
      askForNeedLoading();
    } else if (action === 'confirm-need-loading') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, needLoading: yes }));
      askForNeedUnloading();
    } else if (action === 'confirm-need-unloading') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, needUnloading: yes }));
      askForLabourCount();
    } else if (action === 'skip-labour-count') {
      addUserMessage('Skip / Vendor decides');
      setBookingData((prev: any) => ({ ...prev, labourCount: null }));
      askForVehicleTypeRequirement();
    } else if (action === 'select-vehicle-type-req') {
      const vtypeLabels: Record<string, string> = {
        'SHARED': 'Shared truck',
        'DEDICATED': 'Dedicated truck',
      };
      addUserMessage(vtypeLabels[value || 'DEDICATED']);
      setBookingData((prev: any) => ({ ...prev, vehicleTypeReq: value || 'DEDICATED' }));
      askForPartLoad();
    } else if (action === 'select-part-load') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, part load OK' : 'No, full load only');
      setBookingData((prev: any) => ({ ...prev, partLoadAccepted: yes }));
      askForNeedInsurance();
    } else if (action === 'confirm-need-insurance') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, needInsurance: yes }));
      if (yes) {
        askForInsuranceValue();
      } else {
        askForPOD();
      }
    } else if (action === 'skip-insurance-value') {
      addUserMessage('Skip');
      askForPOD();
    } else if (action === 'confirm-requires-pod') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, requiresPOD: yes }));
      // For domestic & intercity moves (different city), ask receiver details next.
      // For local moves (same city), skip to multiple-stops.
      const scope = bookingData.shiftingScope;
      if (scope === 'INTERCITY' || scope === 'DOMESTIC') {
        askForReceiverName();
      } else {
        askForMultipleStops();
      }
    } else if (action === 'skip-receiver-name') {
      addUserMessage('Skip');
      askForReceiverPhone();
    } else if (action === 'skip-receiver-phone') {
      addUserMessage('Skip');
      proceedAfterReceiver();
    } else if (action === 'confirm-multiple-stops') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, hasMultipleStops: yes }));
      if (yes) {
        askForMultipleStopsDesc();
      } else {
        proceedAfterPackersExtras();
      }
    } else if (action === 'skip-multiple-stops-desc') {
      addUserMessage('Skip');
      proceedAfterPackersExtras();
    }
    // ─────────────── TRUCK-SPECIFIC HANDLERS ───────────────
    else if (action === 'skip-truck-pickup-pincode') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckPickupPincode: null }));
      askForTruckPickupFloor();
    } else if (action === 'skip-truck-pickup-floor') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckPickupFloor: null }));
      askForTruckPickupLift();
    } else if (action === 'select-truck-pickup-floor') {
      const floorLabel = value === '0' ? 'Ground (0)' : `${value === '1' ? '1st' : value === '2' ? '2nd' : value === '3' ? '3rd' : `${value}th`} Floor`;
      addUserMessage(floorLabel);
      setBookingData((prev: any) => ({ ...prev, truckPickupFloor: parseInt(value || '0') }));
      askForTruckPickupLift();
    } else if (action === 'confirm-truck-pickup-lift') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, lift available' : 'No lift');
      setBookingData((prev: any) => ({ ...prev, hasTruckPickupLift: yes }));
      askForDestination();
    } else if (action === 'skip-truck-pickup-lift') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, hasTruckPickupLift: null }));
      askForDestination();
    } else if (action === 'skip-truck-drop-pincode') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckDropPincode: null }));
      askForTruckDropFloor();
    } else if (action === 'skip-truck-drop-floor') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckDropFloor: null }));
      askForTruckDropLift();
    } else if (action === 'select-truck-drop-floor') {
      const floorLabel = value === '0' ? 'Ground (0)' : `${value === '1' ? '1st' : value === '2' ? '2nd' : value === '3' ? '3rd' : `${value}th`} Floor`;
      addUserMessage(floorLabel);
      setBookingData((prev: any) => ({ ...prev, truckDropFloor: parseInt(value || '0') }));
      askForTruckDropLift();
    } else if (action === 'confirm-truck-drop-lift') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes, lift available' : 'No lift');
      setBookingData((prev: any) => ({ ...prev, hasTruckDropLift: yes }));
      askForPickupDateTime();
    } else if (action === 'skip-truck-drop-lift') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, hasTruckDropLift: null }));
      askForPickupDateTime();
    } else if (action === 'skip-truck-expected-delivery') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckExpectedDelivery: null }));
      askForTruckDeliveryTime();
    } else if (action === 'select-truck-delivery-time') {
      const labels: Record<string, string> = {
        MORNING: '🌅 Morning (8 AM – 12 PM)',
        AFTERNOON: '☀️ Afternoon (12 PM – 4 PM)',
        EVENING: '🌆 Evening (4 PM – 8 PM)',
        ANYTIME: '🌙 Anytime',
      };
      addUserMessage(labels[value || 'ANYTIME']);
      setBookingData((prev: any) => ({ ...prev, truckDeliveryTime: value || null }));
      askForTripDirection();
    } else if (action === 'skip-truck-delivery-time') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, truckDeliveryTime: null }));
      askForTripDirection();
    } else if (action === 'select-trip-direction') {
      const labels: Record<string, string> = {
        ONE_WAY: '➡️ One Way',
        ROUND_TRIP: '🔄 Round Trip',
      };
      addUserMessage(labels[value || 'ONE_WAY']);
      setBookingData((prev: any) => ({ ...prev, tripDirection: value || 'ONE_WAY' }));
      askForLoadingHelp();
    } else if (action === 'confirm-loading-help') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, requiresLabour: yes }));
      if (yes) {
        askForTruckLabourCount();
      } else {
        askForTruckMultipleStops();
      }
    } else if (action === 'skip-truck-labour-count') {
      addUserMessage('Skip / Vendor decides');
      setBookingData((prev: any) => ({ ...prev, truckLabourCount: null }));
      askForTruckMultipleStops();
    } else if (action === 'confirm-truck-multiple-stops') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, truckHasMultipleStops: yes }));
      if (yes) {
        askForTruckMultipleStopsDesc();
      } else {
        askForTruckReceiverName();
      }
    } else if (action === 'skip-truck-multiple-stops-desc') {
      addUserMessage('Skip');
      askForTruckReceiverName();
    } else if (action === 'skip-truck-receiver-name') {
      addUserMessage('Skip');
      askForTruckReceiverPhone();
    } else if (action === 'skip-truck-receiver-phone') {
      addUserMessage('Skip');
      askForTruckPOD();
    } else if (action === 'confirm-truck-pod') {
      const yes = value === 'yes';
      addUserMessage(yes ? 'Yes' : 'No');
      setBookingData((prev: any) => ({ ...prev, truckRequiresPOD: yes }));
      askForAdditionalDetails();
    }
    else if (action === 'select-equipment-type') {
      // Equipment machine type selection
      const equipmentTypeLabels: Record<string, string> = {
        '1': 'Grove crane',
        '2': 'Truck mounted crane',
        '3': 'Tower crane',
        '4': 'Telescopic crane',
        '5': 'Rough terrain crane',
        '6': 'Overhead crane',
        '7': 'Bulldozer',
        '8': 'Dumper',
        '9': 'Loader',
        '10': 'Excavators',
        '11': 'Backhoe loader'
      };
      addUserMessage(equipmentTypeLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, machineType: value, machineTypeName: equipmentTypeLabels[value || '1'] }));
      askForJobDuration();
    } else if (action === 'show-more-equipment') {
      addUserMessage('More Equipment...');
      askForMoreEquipmentTypes();
    } else if (action === 'show-more-equipment-2') {
      addUserMessage('More...');
      askForMoreEquipmentTypes2();
    } else if (action === 'select-job-duration') {
      const jobDurationLabels: Record<string, string> = {
        '1': '1 to 5 Days',
        '2': '6 to 15 Days',
        '3': '16 to 30 Days',
        '4': 'More than 30 Days'
      };
      addUserMessage(jobDurationLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, jobDuration: value, jobDurationName: jobDurationLabels[value || '1'] }));
      askForNumberOfEquipment();
    } else if (action === 'select-selfdrive-car-type') {
      // Self-drive car type
      const selfDriveCarTypeLabels: Record<string, string> = {
        '1': 'Hatchback',
        '2': 'Sedan',
        '3': 'MUV',
        '4': 'SUV'
      };
      addUserMessage(selfDriveCarTypeLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, selfDriveCarType: value }));
      askForTransmission();
    } else if (action === 'select-transmission') {
      const transmissionLabels: Record<string, string> = {
        '1': 'Automatic',
        '2': 'Manual'
      };
      addUserMessage(transmissionLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, transmission: value }));
      askForFuelType();
    } else if (action === 'select-fuel-type') {
      const fuelTypeLabels: Record<string, string> = {
        '1': 'Diesel',
        '2': 'Petrol',
        '3': 'Electric',
        '4': 'CNG'
      };
      addUserMessage(fuelTypeLabels[value || '2']);
      setBookingData((prev: any) => ({ ...prev, fuelType: value }));
      askForDoorstepDelivery();
    } else if (action === 'select-doorstep') {
      addUserMessage(value === '1' ? 'Yes, deliver to my location' : 'No, I will pick up');
      setBookingData((prev: any) => ({ ...prev, doorstepDelivery: value }));
      askForLocation();
    } else if (action === 'select-luxury-type') {
      // Luxury car occasion type
      const luxuryTypeLabels: Record<string, string> = {
        '1': 'Wedding',
        '2': 'Personal',
        '3': 'Corporate'
      };
      addUserMessage(luxuryTypeLabels[value || '2']);
      setBookingData((prev: any) => ({ ...prev, luxuryType: value }));
      askForLuxuryPackage();
    } else if (action === 'select-luxury-package') {
      const luxuryPackageLabels: Record<string, string> = {
        '1': 'Local (8hr/80km)',
        '3': 'Outstation Trip',
        '4': 'Airport Transfer'
      };
      addUserMessage(luxuryPackageLabels[value || '1']);
      setBookingData((prev: any) => ({ ...prev, luxuryPackage: value }));
      askForLocation();
    } else if (action === 'select-car-type') {
      const carTypeLabels: Record<string, string> = {
        'hatchback': 'Hatchback',
        'sedan': 'Sedan',
        'muv': 'MUV',
        'suv': 'SUV',
        'luxury': 'Luxury'
      };
      addUserMessage(carTypeLabels[value || 'sedan']);
      setBookingData((prev: any) => ({ ...prev, carType: value }));
      askForPassengers();
    } else if (action === 'select-location' || action === 'confirm-location') {
      addUserMessage(value || '');
      setBookingData((prev: any) => ({ ...prev, pickupLocation: value }));
      // If vehicle name exists (from fleet page) and not yet confirmed, ask for vehicle confirmation
      if (vehicleName && !vehicleConfirmed) {
        askForVehicleConfirmation();
      } else {
        const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb');
        const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
        const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
        const isPackersService = serviceType.includes('packers') || serviceType.includes('movers');
        // For bus/transporter/packers/equipment, capture a full pickup address before
        // proceeding so vendors get an actionable location.
        if (isEquipmentService || isBusService || isTruckService || isPackersService) {
          askForPickupFullAddress();
        } else {
          askForDestination();
        }
      }
    } else if (action === 'confirm-vehicle') {
      addUserMessage(`Yes, ${vehicleName}`);
      // Mark vehicle as confirmed
      setVehicleConfirmed(true);

      // Check if the selected vehicle is a car from fleet
      const selectedVehicle = vehicleName ? getVehicleByName(vehicleName) : null;
      if (selectedVehicle?.category === 'car') {
        // For car vehicles from fleet, ask for trip type first
        askForCarTripType();
      } else if (selectedVehicle?.category === 'bus') {
        // For bus vehicles, ask for trip type
        askForBusTripType();
      } else if (selectedVehicle?.category === 'bike') {
        // For bike vehicles, ask for duration first (Hourly, Daily, Weekly, Monthly)
        askForDuration();
      } else {
        // For other vehicles, proceed to ask for location
        askForLocation();
      }
    } else if (action === 'change-vehicle') {
      addUserMessage('Different Vehicle');
      // Show other vehicle options from the same category
      askForVehicleSelection();
    } else if (action === 'select-fleet-vehicle') {
      addUserMessage(value || '');
      // Update the selected vehicle
      setBookingData((prev: any) => ({ ...prev, fleet: value }));
      setVehicleConfirmed(true);

      // Check if the new selected vehicle is a car, bus, or bike
      const selectedVehicle = value ? getVehicleByName(value) : null;
      if (selectedVehicle?.category === 'car') {
        // For car vehicles, ask for trip type first
        askForCarTripType();
      } else if (selectedVehicle?.category === 'bus') {
        // For bus vehicles, ask for bus trip type
        askForBusTripType();
      } else if (selectedVehicle?.category === 'bike') {
        // For bike vehicles, ask for duration first (Hourly, Daily, Weekly, Monthly)
        askForDuration();
      } else {
        // For other vehicles, proceed to location
        askForLocation();
      }
    } else if (action === 'show-all-vehicles') {
      addUserMessage('Show All Vehicles');
      setIsTyping(true);
      setTimeout(() => {
        // Show vehicles by category
        const bikes = ALL_VEHICLES.filter(v => v.category === 'bike').slice(0, 4);
        const cars = ALL_VEHICLES.filter(v => v.category === 'car').slice(0, 4);
        const buses = ALL_VEHICLES.filter(v => v.category === 'bus').slice(0, 4);

        const allOptions = [
          ...bikes.map(v => ({ label: `🏍️ ${v.name}`, action: 'select-fleet-vehicle', value: v.name })),
          ...cars.map(v => ({ label: `🚗 ${v.name}`, action: 'select-fleet-vehicle', value: v.name })),
          ...buses.map(v => ({ label: `🚌 ${v.name}`, action: 'select-fleet-vehicle', value: v.name })),
        ];

        addShiviMessage(
          'Choose from our complete fleet:\n\n🏍️ Bikes | 🚗 Cars | 🚌 Buses',
          allOptions,
          0
        );
        setCurrentStep('vehicle-selection');
      }, 800);
    } else if (action === 'select-duration') {
      const durationLabels: Record<string, string> = {
        '1': 'Hourly',
        '2': 'Daily',
        '3': 'Weekly',
        '4': 'Monthly'
      };
      addUserMessage(durationLabels[value || '2']);
      setBookingData((prev: any) => ({ ...prev, bikeDuration: value }));
      const isBikeServiceForFlow = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
      // After duration selection, check what's already set to avoid loops
      if (isBikeServiceForFlow && !bookingData.pickupFullAddress && bookingData.pickupLocation) {
        // For bike, capture full pickup address before pickup datetime
        askForBikePickupAddress();
      } else if (bookingData.destination) {
        // Destination already set, go to pickup datetime
        askForPickupDateTime();
      } else if (bookingData.pickupLocation) {
        // Location set but not destination, ask for destination
        askForDestination();
      } else {
        // Nothing set, ask for location first
        askForLocation();
      }
    } else if (action === 'change-location') {
      addUserMessage('Different City');
      askForLocation(true); // Force show full location list
    } else if (action === 'search-location') {
      addUserMessage('🔍 Search for Other City');
      askForLocationSearch();
    } else if (action === 'skip-additional-details') {
      addUserMessage('Skip');
      setBookingData((prev: any) => ({ ...prev, additionalDetails: '' }));
      // For bus + bike (B2B-fleet services available to everyone) AND
      // ALWAYS for travel agents (any service), ask Personal/Company so
      // corporate trips route into the b2b_bookings manager queue.
      const isBusForPurposeSkip = serviceType.includes('bus') || serviceType.includes('tempo');
      const isBikeForPurposeSkip = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
      const isAgentForPurpose = !!loggedInCustomer?.linkedTravelAgentId;
      if (isBusForPurposeSkip || isBikeForPurposeSkip || isAgentForPurpose) {
        askForBookingPurpose();
      } else {
        setIsTyping(true);
        setTimeout(() => showSummary(), 800);
      }
    } else if (action === 'booking-purpose') {
      const stP = (serviceType || '').toLowerCase();
      let countPrompt = 'How many vehicles do you need? 🚐\n(Enter number of vehicles required)';
      if (stP.includes('bike') || stP.includes('activa') || stP.includes('royal-enfield'))
        countPrompt = 'How many bikes/vehicles do you need? 🏍️\n(Enter number of vehicles required)';
      else if (stP.includes('truck') || stP.includes('transport'))
        countPrompt = 'How many trucks do you need? 🚚\n(Enter number of vehicles required)';
      else if (stP.includes('packer') || stP.includes('mover'))
        countPrompt = 'How many vehicles/loads do you need? 📦\n(Enter number required)';
      else if (stP.includes('equipment') || stP.includes('crane') || stP.includes('jcb'))
        countPrompt = 'How many machines do you need? 🏗️\n(Enter number required)';
      else if (stP.includes('luxury'))
        countPrompt = 'How many luxury cars do you need? ✨\n(Enter number required)';
      else if (stP.includes('self-drive') || stP.includes('self_drive') || stP.includes('selfdrive'))
        countPrompt = 'How many self-drive cars do you need? 🚗\n(Enter number required)';
      else if (stP.includes('car') || stP.includes('cab'))
        countPrompt = 'How many cars do you need? 🚗\n(Enter number required)';
      else
        countPrompt = 'How many buses/vehicles do you need? 🚌\n(Enter number of vehicles required)';

      if (value === 'company') {
        addUserMessage('Company / Corporate');
        setBookingData((prev: any) => ({ ...prev, bookingPurpose: 'company' }));
        // Ask for number of vehicles before submitting B2B booking
        addShiviMessage(countPrompt, undefined, 500, 'text', 'e.g., 1, 2, 3');
        setCurrentStep('b2b-vehicles');
      } else {
        addUserMessage('Personal');
        setBookingData((prev: any) => ({ ...prev, bookingPurpose: 'personal' }));
        setIsTyping(true);
        setTimeout(() => showSummary(), 800);
      }
    } else if (action === 'submit') {
      handleSubmit();
    } else if (action === 'restart') {
      window.location.reload();
    } else if (action === 'dashboard') {
      // Navigate to dashboard - use the redirect value if provided
      const redirectTo = value || bookingData.lastBookingRedirect || '/customer/dashboard';
      window.location.href = redirectTo;
    } else if (action === 'skip-login') {
      // Skip login/password creation and show success message
      addUserMessage('Skip');
      const firstName = bookingData.name?.split(' ')[0] || 'Guest';
      showBookingSuccessMessage(firstName, bookingData.lastBookingId || 'TR', bookingData.lastBookingRedirect);
    } else if (action === 'download-app') {
      addUserMessage('I want to download the app');
      addShiviMessage(
        "TransRentals App – Your Travel Companion\n\nWhy Download?\n\n• Instant Bookings – Book in 30 seconds\n• Earn Backr Tokens – Get rewards on every booking\n• Exclusive App-Only Deals – Save up to 30%\n• Real-Time Tracking – Track your rides live\n• 24/7 Chat Support – Direct help anytime\n• Welcome Bonus – Earn FREE Backr Tokens\n\nDownload the Android app:",
        [
          { label: 'Download Android App', action: 'app-android', value: '' },
          { label: 'Continue Browsing', action: 'restart', value: '' },
        ]
      );
    } else if (action === 'app-android') {
      addUserMessage('Download Android App');
      window.open('https://play.google.com/store/apps/details?id=com.transrentals', '_blank');
      addShiviMessage(
        'Opening Play Store...\n\nDownload the TransRentals app and earn FREE Backr Tokens!',
        [{ label: 'Book Another', action: 'restart', value: '' }],
        500
      );
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);

    if (currentStep === 'waiting-for-user') {
      // User typed something - start the booking flow based on FlowType
      setInputValue('');

      // Get flow type from service configuration
      const flowType: FlowType = getFlowType(serviceType);

      // Service type detection for specific handling
      const isLuxuryService = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
      const isSelfDriveService = serviceType.includes('selfdrive') || serviceType.includes('self-drive');
      const isBikeService = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('scooter') || serviceType.includes('royal-enfield') || serviceType.includes('ktm');
      const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
      const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      const isPackersService = serviceType.includes('packers') || serviceType.includes('movers');
      const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb') || serviceType.includes('crane') || serviceType.includes('excavator') || serviceType.includes('generator') || serviceType.includes('hydra');
      const isCarService = isCarWithDriverServiceType(serviceType) && !isSelfDriveService && !isLuxuryService;

      // If a specific vehicle was selected (from fleet page), ask for vehicle confirmation first
      if (vehicleName) {
        askForVehicleConfirmation();
        return;
      }

      // Route based on FlowType
      switch (flowType) {
        case 'BROWSE_FIRST':
          // BROWSE_FIRST: Ask vehicle type first → Then location → Then dates
          // Used for: Bike Rental, Self-Drive Cars
          if (isSelfDriveService) {
            askForSelfDriveCarType();
          } else if (isBikeService && subServices && subServices.length > 0) {
            // Show bike types to browse
            setTimeout(() => {
              addShiviMessage(
                `Great! Let's find the perfect ${serviceName.toLowerCase()} for you.\n\n🏍️ What type of bike are you looking for?`,
                subServices.map(s => ({ label: s.label, action: 'select-subservice', value: s.value })),
                800
              );
              setCurrentStep('select-subservice');
            }, 500);
          } else if (subServices && subServices.length > 0) {
            setTimeout(() => {
              addShiviMessage(
                `Great! Let's find the perfect ${serviceName.toLowerCase()} for you.\n\nWhat type do you prefer?`,
                subServices.map(s => ({ label: s.label, action: 'select-subservice', value: s.value })),
                800
              );
              setCurrentStep('select-subservice');
            }, 500);
          } else {
            askForLocation();
          }
          break;

        case 'TRIP_FIRST':
          // TRIP_FIRST: Ask trip type first → Then location → Then dates → Show options
          // Used for: Car with Driver, Luxury Cars, Airport Transfer
          if (isLuxuryService) {
            askForLuxuryType();
          } else if (isCarService) {
            askForCarTripType();
          } else if (subServices && subServices.length > 0) {
            setTimeout(() => {
              addShiviMessage(
                `Let's plan your trip!\n\nWhat type of ${serviceName.toLowerCase()} do you need?`,
                subServices.map(s => ({ label: s.label, action: 'select-subservice', value: s.value })),
                800
              );
              setCurrentStep('select-subservice');
            }, 500);
          } else {
            askForCarTripType();
          }
          break;

        case 'QUOTE_BASED':
          // QUOTE_BASED: Ask requirements first → Then location → Then dates → Get quotes
          // Used for: Bus, Truck, Packers, Equipment
          if (isBusService) {
            askForBusTripType();
          } else if (isTruckService) {
            askForTruckMode();
          } else if (isPackersService) {
            askForShiftingScope();
          } else if (isEquipmentService) {
            askForEquipmentType();
          } else if (subServices && subServices.length > 0) {
            setTimeout(() => {
              addShiviMessage(
                `Let's get you the best quotes!\n\nWhat type of ${serviceName.toLowerCase()} do you need?`,
                subServices.map(s => ({ label: s.label, action: 'select-subservice', value: s.value })),
                800
              );
              setCurrentStep('select-subservice');
            }, 500);
          } else {
            askForLocation();
          }
          break;

        default:
          // Fallback - ask for location
          askForLocation();
      }
    } else if (currentStep === 'location-search') {
      // Search through all locations
      const searchQuery = inputValue.toLowerCase().trim();
      const matchedLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery)
      );

      setInputValue('');

      if (matchedLocations.length === 0) {
        const locationOptions = locations.slice(0, 10).map(loc => ({
          label: `📍 ${loc.name}`,
          action: 'select-location',
          value: loc.name,
        }));
        // Add retry search option
        locationOptions.unshift({
          label: '🔍 Try Different Search',
          action: 'search-location',
          value: '',
        });
        addShiviMessage(
          `Sorry, I couldn't find any city matching "${inputValue}".\n\nPlease try again or choose from the list:`,
          locationOptions,
          500
        );
        setCurrentStep('location');
      } else if (matchedLocations.length === 1) {
        // Exact match - use it
        setBookingData((prev: any) => ({ ...prev, pickupLocation: matchedLocations[0].name }));
        addShiviMessage(`Great! ${matchedLocations[0].name} selected. 📍`, undefined, 500);
        askForDestination();
      } else {
        // Multiple matches - show them
        addShiviMessage(
          `I found ${matchedLocations.length} cities matching "${inputValue}":\n\nPlease select one:`,
          matchedLocations.slice(0, 10).map(loc => ({
            label: `📍 ${loc.name}`,
            action: 'select-location',
            value: loc.name,
          })),
          500
        );
        setCurrentStep('location');
      }
    } else if (currentStep === 'bike-pickup-address') {
      setBookingData((prev: any) => ({ ...prev, pickupFullAddress: inputValue }));
      askForPickupDateTime();
      setInputValue('');
      return;
    } else if (currentStep === 'pickup-full-address') {
      setBookingData((prev: any) => ({ ...prev, pickupFullAddress: inputValue }));
      const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb');
      const isBusLocal = (serviceType.includes('bus') || serviceType.includes('tempo')) && bookingData.busTripType === 'local';
      const isPackersServiceLocal = serviceType.includes('packers') || serviceType.includes('movers');
      const isTruckServiceLocal = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      if (isPackersServiceLocal) {
        // Packers: pickup-full-address → pickup-pincode → pickup-floor → pickup-lift → destination
        askForPickupPincode();
      } else if (isTruckServiceLocal) {
        // Truck: pickup-full-address → truck-pickup-pincode → truck-pickup-floor → truck-pickup-lift → destination
        askForTruckPickupPincode();
      } else if (isEquipmentService) {
        // Equipment doesn't need a destination — go straight to pickup date/time
        askForPickupDateTime();
      } else if (isBusLocal) {
        // Local bus trips treat pickup as the destination
        setBookingData((prev: any) => ({ ...prev, destination: inputValue }));
        askForPassengers();
      } else {
        askForDestination();
      }
      setInputValue('');
      return;
    } else if (currentStep === 'pickup-pincode') {
      const cleaned = inputValue.replace(/\D/g, '');
      if (cleaned.length !== 6) {
        addShiviMessage('Please enter a valid 6-digit pincode 📮', undefined, 500, 'text', 'e.g., 110001');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, pickupPincode: cleaned }));
      askForPickupFloor();
      setInputValue('');
      return;
    } else if (currentStep === 'pickup-floor') {
      const floor = parseInt(inputValue);
      if (isNaN(floor) || floor < 0) {
        addShiviMessage('Please enter a valid floor number (0 or higher) 🏢', undefined, 500, 'text', 'e.g., 0, 1, 2, 5');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, pickupFloor: floor }));
      askForPickupLift();
      setInputValue('');
      return;
    } else if (currentStep === 'drop-pincode') {
      const cleaned = inputValue.replace(/\D/g, '');
      if (cleaned.length !== 6) {
        addShiviMessage('Please enter a valid 6-digit pincode 📮', undefined, 500, 'text', 'e.g., 400001');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, dropPincode: cleaned }));
      askForDropFloor();
      setInputValue('');
      return;
    } else if (currentStep === 'drop-floor') {
      const floor = parseInt(inputValue);
      if (isNaN(floor) || floor < 0) {
        addShiviMessage('Please enter a valid floor number (0 or higher) 🏢', undefined, 500, 'text', 'e.g., 0, 1, 2, 5');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, dropFloor: floor }));
      askForDropLift();
      setInputValue('');
      return;
    } else if (currentStep === 'expected-delivery') {
      setBookingData((prev: any) => ({ ...prev, expectedDeliveryDate: inputValue }));
      askForDeliveryTime();
      setInputValue('');
      return;
    } else if (currentStep === 'inventory-list') {
      setBookingData((prev: any) => ({ ...prev, inventoryList: inputValue }));
      askForEstimatedWeight();
      setInputValue('');
      return;
    } else if (currentStep === 'heavy-items-desc') {
      setBookingData((prev: any) => ({ ...prev, heavyItemsDesc: inputValue }));
      askForFragileItems();
      setInputValue('');
      return;
    } else if (currentStep === 'packing-items-details') {
      const text = inputValue.trim();
      if (!text) {
        addShiviMessage(
          'Please add a quick option above or describe your items 📦',
          undefined,
          500,
          'text',
          'e.g., 15 boxes, 5 bags, LED TV',
        );
        setInputValue('');
        return;
      }
      // Parse approximate counts from free text — vendor still gets full description as a note
      const lower = text.toLowerCase();
      const boxesMatch = lower.match(/(\d+)\s*(?:-\s*\d+)?\s*box/);
      const bagsMatch = lower.match(/(\d+)\s*(?:-\s*\d+)?\s*(?:bag|suitcase)/);
      setBookingData((prev: any) => ({
        ...prev,
        fragileItemsDesc: text,
        boxesCount: boxesMatch ? parseInt(boxesMatch[1]) : null,
        bagsCount: bagsMatch ? parseInt(bagsMatch[1]) : null,
      }));
      askForNeedPacking();
      setInputValue('');
      return;
    } else if (currentStep === 'labour-count') {
      const n = parseInt(inputValue);
      if (isNaN(n) || n < 0) {
        addShiviMessage('Please enter a valid count (0 or higher) 👷', undefined, 500, 'text', 'e.g., 2, 4, 6');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, labourCount: n }));
      askForVehicleTypeRequirement();
      setInputValue('');
      return;
    } else if (currentStep === 'insurance-value') {
      const v = parseFloat(inputValue);
      if (isNaN(v) || v < 0) {
        addShiviMessage('Please enter a valid amount in ₹', undefined, 500, 'text', 'e.g., 500000');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, insuranceValue: v }));
      askForPOD();
      setInputValue('');
      return;
    } else if (currentStep === 'receiver-name') {
      setBookingData((prev: any) => ({ ...prev, receiverName: inputValue }));
      askForReceiverPhone();
      setInputValue('');
      return;
    } else if (currentStep === 'receiver-phone') {
      const validation = validatePhone(inputValue);
      if (!validation.valid) {
        addShiviMessage(validation.message!, undefined, 500, 'tel', 'e.g., 9876543210');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, receiverPhone: inputValue.replace(/\D/g, '') }));
      proceedAfterReceiver();
      setInputValue('');
      return;
    } else if (currentStep === 'multiple-stops-desc') {
      setBookingData((prev: any) => ({ ...prev, multipleStopsDetails: inputValue }));
      proceedAfterPackersExtras();
      setInputValue('');
      return;
    }
    // ─────────────── TRUCK-SPECIFIC TEXT INPUT HANDLERS ───────────────
    else if (currentStep === 'material-details') {
      if (!inputValue.trim()) {
        addShiviMessage(
          'Please describe what you’re moving — pick a quick option above or type your items 📦',
          undefined,
          500,
          'text',
          'e.g., 10 boxes, 2 beds, 1 sofa',
        );
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, materialDetails: inputValue.trim() }));
      askForWeight();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-pickup-pincode') {
      const cleaned = inputValue.replace(/\D/g, '');
      if (cleaned.length !== 6) {
        addShiviMessage('Please enter a valid 6-digit pincode 📮', undefined, 500, 'text', 'e.g., 110001');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckPickupPincode: cleaned }));
      askForTruckPickupFloor();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-pickup-floor') {
      const floor = parseInt(inputValue);
      if (isNaN(floor) || floor < 0) {
        addShiviMessage('Please enter a valid floor number (0 or higher) 🏢', undefined, 500, 'text', 'e.g., 0, 1, 2, 5');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckPickupFloor: floor }));
      askForTruckPickupLift();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-drop-pincode') {
      const cleaned = inputValue.replace(/\D/g, '');
      if (cleaned.length !== 6) {
        addShiviMessage('Please enter a valid 6-digit pincode 📮', undefined, 500, 'text', 'e.g., 400001');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckDropPincode: cleaned }));
      askForTruckDropFloor();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-drop-floor') {
      const floor = parseInt(inputValue);
      if (isNaN(floor) || floor < 0) {
        addShiviMessage('Please enter a valid floor number (0 or higher) 🏢', undefined, 500, 'text', 'e.g., 0, 1, 2, 5');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckDropFloor: floor }));
      askForTruckDropLift();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-expected-delivery') {
      setBookingData((prev: any) => ({ ...prev, truckExpectedDelivery: inputValue }));
      askForTruckDeliveryTime();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-labour-count') {
      const n = parseInt(inputValue);
      if (isNaN(n) || n < 0) {
        addShiviMessage('Please enter a valid count (0 or higher) 👷', undefined, 500, 'text', 'e.g., 2, 4, 6');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckLabourCount: n }));
      askForTruckMultipleStops();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-multiple-stops-desc') {
      setBookingData((prev: any) => ({ ...prev, truckMultipleStopsDetails: inputValue }));
      askForTruckReceiverName();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-receiver-name') {
      setBookingData((prev: any) => ({ ...prev, truckReceiverName: inputValue }));
      askForTruckReceiverPhone();
      setInputValue('');
      return;
    } else if (currentStep === 'truck-receiver-phone') {
      const validation = validatePhone(inputValue);
      if (!validation.valid) {
        addShiviMessage(validation.message!, undefined, 500, 'tel', 'e.g., 9876543210');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, truckReceiverPhone: inputValue.replace(/\D/g, '') }));
      askForTruckPOD();
      setInputValue('');
      return;
    } else if (currentStep === 'destination') {
      setBookingData((prev: any) => ({ ...prev, destination: inputValue }));
      const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
      const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      const isPackersService = serviceType.includes('packers') || serviceType.includes('movers');
      // For bus/transporter/packers — split destination into city/area + full address
      if (isBusService || isTruckService || isPackersService) {
        askForDestinationFullAddress();
        setInputValue('');
        return;
      }
      proceedAfterDestination();
      setInputValue('');
    } else if (currentStep === 'destination-full-address') {
      setBookingData((prev: any) => ({ ...prev, destinationFullAddress: inputValue }));
      const isPackersServiceLocal2 = serviceType.includes('packers') || serviceType.includes('movers');
      const isTruckServiceLocal2 = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      if (isPackersServiceLocal2) {
        // Packers: destination-full-address → drop-pincode → drop-floor → drop-lift → pickup-datetime
        askForDropPincode();
        setInputValue('');
        return;
      }
      if (isTruckServiceLocal2) {
        // Truck: destination-full-address → truck-drop-pincode → truck-drop-floor → truck-drop-lift → pickup-datetime
        askForTruckDropPincode();
        setInputValue('');
        return;
      }
      proceedAfterDestination();
      setInputValue('');
    } else if (currentStep === 'weight') {
      const weight = parseFloat(inputValue);
      if (isNaN(weight) || weight <= 0) {
        addShiviMessage('Please enter a valid weight (greater than 0) ⚖️', undefined, 500, 'text', 'e.g., 500, 1000, 2500');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, weightVal: inputValue }));
      askForWeightUnit();
      setInputValue('');
    } else if (currentStep === 'passengers') {
      const passengers = parseInt(inputValue);
      const isBusOrTempo = serviceType.includes('bus') || serviceType.includes('tempo');
      if (isNaN(passengers) || passengers < 1) {
        addShiviMessage('Please enter a valid number of passengers (at least 1) 👥', undefined, 500, 'text', 'e.g., 4');
        setInputValue('');
        return;
      }
      if (isBusOrTempo && passengers < 10) {
        addShiviMessage('For bus bookings, minimum 10 passengers are required 🚌', undefined, 500, 'text', 'e.g., 10, 15, 20');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, passengers: inputValue }));
      askForPickupDateTime();
      setInputValue('');
    } else if (currentStep === 'b2b-vehicles') {
      const numVehicles = parseInt(inputValue);
      if (isNaN(numVehicles) || numVehicles < 1) {
        addShiviMessage('Please enter a valid number of vehicles (at least 1) 🚌', undefined, 500, 'text', 'e.g., 1, 2, 3');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, vehiclesRequired: inputValue }));
      setInputValue('');
      handleB2BBusSubmit();
    } else if (currentStep === 'no-of-equipment') {
      const noOfEquipment = parseInt(inputValue);
      if (isNaN(noOfEquipment) || noOfEquipment < 1) {
        addShiviMessage('Please enter a valid number (at least 1) 🔢', undefined, 500, 'text', 'e.g., 1, 2, 3');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, noOfEquipments: inputValue }));
      askForLocation();
      setInputValue('');
    } else if (currentStep === 'pickup-datetime') {
      // Validate 12-hour advance booking
      const MIN_ADVANCE_HOURS = 12;
      const pickupDt = new Date(inputValue);
      const now = new Date();
      const diffHours = (pickupDt.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < MIN_ADVANCE_HOURS) {
        const earliest = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
        const fDate = earliest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const fTime = earliest.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        setDateError(`Booking requires at least ${MIN_ADVANCE_HOURS} hours advance notice. Earliest pickup: ${fDate}, ${fTime}.`);
        setTimeout(() => setDateError(''), 6000);
        // Re-show datetime picker so user can retry — pre-fill with earliest valid time
        addShiviMessage(
          'Please select a later date & time 📅',
          undefined, 300, 'datetime-local', 'Select date & time'
        );
        const earliestDt = new Date(Date.now() + 13 * 60 * 60 * 1000);
        const earliestH = earliestDt.getHours() < 6 ? 6 : earliestDt.getHours();
        setInputValue(`${earliestDt.toISOString().split('T')[0]}T${String(earliestH).padStart(2,'0')}:00`);
        return;
      }
      setDateError('');
      // Format datetime for display
      const formattedDateTime = new Date(inputValue).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      setBookingData((prev: any) => ({ ...prev, pickupDateTime: inputValue }));
      const isBikeService = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
      const isLuxuryService = serviceType.includes('luxury') || serviceType.includes('wedding-car') || serviceType.includes('vintage') || serviceType.includes('sports-car');
      const isCarService = isCarWithDriverServiceType(serviceType) && !isLuxuryService;
      const isSelfDriveService = serviceType.includes('selfdrive') || serviceType.includes('self-drive');
      const isBusService = serviceType.includes('bus') || serviceType.includes('tempo');
      const isTruckService = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');
      const isEquipmentService = serviceType.includes('equipment') || serviceType.includes('jcb');

      // Check if a fleet vehicle was selected (check both vehicleName prop and bookingData.fleet)
      const fleetVehicleName = bookingData.fleet || vehicleName;
      const selectedFleetVehicle = fleetVehicleName ? getVehicleByName(fleetVehicleName) : null;
      const isFleetCar = selectedFleetVehicle?.category === 'car';
      const isFleetBus = selectedFleetVehicle?.category === 'bus';
      const isFleetBike = selectedFleetVehicle?.category === 'bike';

      // For bike services, bus services, round trip car, fleet bikes, or outstation luxury/self-drive, ask for return datetime
      // Equipment services and truck/transporter services don't need return date
      const needsReturnDate = !isEquipmentService && !isTruckService && (isBikeService || isBusService || isFleetBus || isFleetBike ||
        (isCarService && bookingData.tripType === 'roundtrip') ||
        (isFleetCar && bookingData.tripType === 'roundtrip') || // Fleet car with round trip
        (isLuxuryService && bookingData.luxuryPackage === '3') || // Outstation luxury package
        isSelfDriveService); // Self-drive always needs return date

      const isPackersServiceForFlow = serviceType.includes('packers') || serviceType.includes('movers');
      const isTruckServiceForFlow = serviceType.includes('truck') || serviceType.includes('transporter') || serviceType.includes('trailer');

      if (needsReturnDate) {
        askForReturnDateTime(inputValue);
      } else if (isPackersServiceForFlow) {
        // Packers extended flow: pickup-datetime → expected-delivery → many quotation fields
        askForExpectedDelivery();
        setInputValue('');
      } else if (isTruckServiceForFlow) {
        // Truck extended flow: pickup-datetime → expected-delivery → delivery-time → trip-direction → ...
        askForExpectedTruckDelivery();
        setInputValue('');
      } else {
        askForContactInfo();
        setInputValue('');
      }
    } else if (currentStep === 'return-datetime') {
      setBookingData((prev: any) => ({ ...prev, returnDateTime: inputValue }));
      askForContactInfo();
      setInputValue('');
    } else if (currentStep === 'name') {
      setBookingData((prev: any) => ({ ...prev, name: inputValue }));
      askForPhone();
      setInputValue('');
    } else if (currentStep === 'phone') {
      // God-level: Validate phone before proceeding
      const validation = validatePhone(inputValue);
      if (!validation.valid) {
        addShiviMessage(validation.message!, undefined, 500, 'tel', CONTACT_PHONE);
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, phone: inputValue }));
      askForEmail();
      setInputValue('');
    } else if (currentStep === 'email') {
      // God-level: Validate email before proceeding
      const validation = validateEmail(inputValue);
      if (!validation.valid) {
        addShiviMessage(validation.message!, undefined, 500, 'email', 'your@email.com');
        setInputValue('');
        return;
      }
      setBookingData((prev: any) => ({ ...prev, email: inputValue }));
      setInputValue('');
      // Ask for additional details after email
      askForAdditionalDetails();
    } else if (currentStep === 'additional-details') {
      // Save additional details
      setBookingData((prev: any) => ({ ...prev, additionalDetails: inputValue }));
      setInputValue('');
      // For bus + bike (B2B-fleet services available to everyone) AND
      // ALWAYS for travel agents (any service), ask Personal/Company.
      const isBusForPurpose = serviceType.includes('bus') || serviceType.includes('tempo');
      const isBikeForPurpose = serviceType.includes('bike') || serviceType.includes('activa') || serviceType.includes('royal-enfield');
      const isAgentForPurpose = !!loggedInCustomer?.linkedTravelAgentId;
      if (isBusForPurpose || isBikeForPurpose || isAgentForPurpose) {
        askForBookingPurpose();
      } else {
        setIsTyping(true);
        setTimeout(() => showSummary(), 800);
      }
    } else if (currentStep === 'awaiting-login-password') {
      // Handle login password input
      setInputValue('');
      addUserMessage('••••••••'); // Don't show actual password
      handleCustomerLogin(inputValue);
    } else if (currentStep === 'awaiting-create-password') {
      // Handle create password input
      setInputValue('');
      addUserMessage('••••••••'); // Don't show actual password
      handleCreatePassword(inputValue);
    }
  };

  return (
    <section className={hideHeader ? "" : "relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 mt-4"}>
      <div className={hideHeader ? "" : "container-custom"}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          {!hideHeader && (
            <div className="text-center mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                Get {serviceName} Quotes
              </h1>
              <p className="text-xs text-gray-600">
                Chat with Shivi • Best prices from 500+ verified vendors
              </p>
            </div>
          )}

          {/* Chat Interface */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Shivi - Booking Assistant</h3>
                  <p className="text-xs text-white/80">Online • Instant response</p>
                </div>
              </div>
            </div>

            {/* B2B Non-Service Warning */}
            {isB2B && !B2B_SERVICES.includes(serviceType) && (
              <div className="flex items-start gap-3 bg-amber-50 border-b border-amber-200 px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Advance Payment Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    <strong>{serviceName}</strong> is not covered under your B2B agreement. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div className="h-[360px] overflow-y-auto p-4 space-y-3 bg-gray-50">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.type === 'shivi' && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-xs text-gray-500">Shivi</span>
                        </div>
                      )}

                      <div className={`rounded-xl px-3 py-2 ${message.type === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                        {/* Vehicle Image (if present) */}
                        {message.image && (
                          <div className="mb-2 relative w-full h-32 rounded-lg overflow-hidden">
                            <Image
                              src={message.image}
                              alt="Vehicle"
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-line text-xs leading-relaxed">{message.content}</p>
                      </div>

                      {/* Option Buttons */}
                      {message.options && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleOptionClick(option.action, option.value)}
                              className="px-3 py-1.5 bg-white border-2 border-primary/20 hover:border-primary text-xs font-medium text-gray-700 rounded-lg hover:bg-primary/5 transition-all"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-gray-500"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Shivi is typing...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Only show when expecting text input */}
            {messages[messages.length - 1]?.inputType && (
              messages[messages.length - 1]?.inputType === 'datetime-local' ? (
                /* Custom Date + Time picker for datetime-local */
                <div className="p-3 bg-white border-t border-gray-200 space-y-2">
                  {/* Date Validation Error */}
                  <AnimatePresence>
                    {dateError && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="flex-1 text-xs font-medium text-red-700 leading-relaxed">{dateError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* ── Unified Date + Time Picker ── */}
                  {(() => {
                    const isDisabled = currentStep === 'completed' || currentStep === 'summary';

                    // ── date helpers ──
                    const minDateStr = currentStep === 'return-datetime' && bookingData.pickupDateTime
                      ? bookingData.pickupDateTime.split('T')[0]
                      : new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0];

                    // ── time helpers ──
                    const rawT = inputValue.split('T')[1] || '09:00';
                    const [h24r, mR] = rawT.split(':').map(Number);
                    const h24 = isNaN(h24r) ? 9 : h24r;
                    const curMin = isNaN(mR) ? 0 : mR;
                    const curPeriod: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
                    const curH12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
                    const applyTime = (h12: number, min: number, period: 'AM' | 'PM') => {
                      let h = h12;
                      if (period === 'AM' && h12 === 12) h = 0;
                      else if (period === 'PM' && h12 !== 12) h = h12 + 12;
                      const d = inputValue.split('T')[0] || new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      setInputValue(`${d}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
                      setDateError('');
                    };

                    return (
                      <div className={`rounded-2xl border border-gray-200 overflow-hidden shadow-sm ${isDisabled ? 'opacity-50' : ''}`}>

                        {/* header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-gray-100">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary">
                            {currentStep === 'return-datetime' ? 'Return Date & Time' : 'Pickup Date & Time'}
                          </span>
                        </div>

                        {/* ── DATE INPUT ── */}
                        <div className="px-3 py-3 bg-white">
                          <input
                            type="date"
                            value={inputValue.split('T')[0] || ''}
                            min={minDateStr}
                            disabled={isDisabled}
                            onChange={(e) => {
                              const t = inputValue.split('T')[1] || '09:00';
                              setInputValue(`${e.target.value}T${t}`);
                              setDateError('');
                            }}
                            className="w-full h-10 px-3 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* ── TIME PICKER ── */}
                        <div className="border-t border-gray-100 bg-gray-50 px-3 py-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Time
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Hour */}
                            <div className={`flex items-center gap-1 bg-white rounded-xl border px-2 py-1.5 flex-1 transition-colors ${hourInput && (parseInt(hourInput) < 1 || parseInt(hourInput) > 12) ? 'border-red-400' : 'border-gray-200'}`}>
                              <button type="button" disabled={isDisabled}
                                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                onClick={() => applyTime(curH12 === 1 ? 12 : curH12 - 1, curMin, curPeriod)}>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <input type="text" value={hourInput} maxLength={2} disabled={isDisabled} placeholder="09"
                                onFocus={() => { hourFocused.current = true; setDateError(''); setHourInput(String(curH12)); }}
                                onBlur={() => {
                                  hourFocused.current = false;
                                  const n = parseInt(hourInput);
                                  if (isNaN(n) || n < 1 || n > 12) {
                                    setDateError('⏰ Hour must be between 1 and 12. Please enter a valid time.');
                                    setHourInput(String(curH12).padStart(2, '0'));
                                  } else {
                                    applyTime(n, curMin, curPeriod);
                                    setHourInput(String(n).padStart(2, '0'));
                                  }
                                }}
                                onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,2); setHourInput(v); const n = parseInt(v); if (n>=1&&n<=12) applyTime(n,curMin,curPeriod); }}
                                className="flex-1 text-center text-base font-bold text-gray-800 tabular-nums bg-transparent outline-none"
                              />
                              <button type="button" disabled={isDisabled}
                                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                onClick={() => applyTime(curH12 === 12 ? 1 : curH12 + 1, curMin, curPeriod)}>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            <span className="text-lg font-black text-gray-300 select-none">:</span>

                            {/* Minute */}
                            <div className={`flex items-center gap-1 bg-white rounded-xl border px-2 py-1.5 flex-1 transition-colors ${minInput && parseInt(minInput) > 59 ? 'border-red-400' : 'border-gray-200'}`}>
                              <button type="button" disabled={isDisabled}
                                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                onClick={() => applyTime(curH12, (curMin - 5 + 60) % 60, curPeriod)}>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <input type="text" value={minInput} maxLength={2} disabled={isDisabled} placeholder="00"
                                onFocus={() => { minFocused.current = true; setDateError(''); setMinInput(String(curMin)); }}
                                onBlur={() => {
                                  minFocused.current = false;
                                  const n = parseInt(minInput);
                                  if (isNaN(n) || n < 0 || n > 59) {
                                    setDateError('⏰ Minutes must be between 0 and 59. Please enter a valid time.');
                                    setMinInput(String(curMin).padStart(2, '0'));
                                  } else {
                                    applyTime(curH12, n, curPeriod);
                                    setMinInput(String(n).padStart(2, '0'));
                                  }
                                }}
                                onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,2); setMinInput(v); const n = parseInt(v); if (n>=0&&n<=59) applyTime(curH12,n,curPeriod); }}
                                className="flex-1 text-center text-base font-bold text-gray-800 tabular-nums bg-transparent outline-none"
                              />
                              <button type="button" disabled={isDisabled}
                                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                onClick={() => applyTime(curH12, (curMin + 5) % 60, curPeriod)}>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                            {/* AM / PM */}
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                              {(['AM', 'PM'] as const).map((p, i) => (
                                <button key={p} type="button" disabled={isDisabled}
                                  onClick={() => applyTime(curH12, curMin, p)}
                                  className={`w-10 py-1.5 text-xs font-bold transition-all ${i > 0 ? 'border-l border-gray-200' : ''} ${curPeriod === p ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:text-gray-700'}`}>
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      if (inputValue.includes('T') && inputValue.split('T')[0] && inputValue.split('T')[1]) {
                        handleInputSubmit({ preventDefault: () => {} } as React.FormEvent);
                      }
                    }}
                    disabled={!inputValue.includes('T') || !inputValue.split('T')[0] || !inputValue.split('T')[1] || currentStep === 'completed' || currentStep === 'summary'}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Confirm Date &amp; Time
                  </button>
                </div>
              ) : (
                /* Regular text/tel/email input */
                <form onSubmit={handleInputSubmit} className="p-3 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type={messages[messages.length - 1]?.inputType || 'text'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={messages[messages.length - 1]?.placeholder || 'Type your message...'}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={currentStep === 'completed' || currentStep === 'summary'}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || currentStep === 'completed' || currentStep === 'summary'}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
