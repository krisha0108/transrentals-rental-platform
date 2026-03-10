'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Plane,
  Navigation,
  ChevronRight,
  Shield,
  Star,
  Users,
  Fuel,
  Info,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { CarRentalBookingConfirmModal } from './CarRentalBookingConfirmModal';

// Trip types
type TripType = 'local' | 'outstation' | 'airport';
type OutstationMode = 'one-way' | 'round-trip';
type AirportMode = 'pickup' | 'drop';

// Types from API
interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  seatingCapacity: number;
  luggageCapacity: string | null;
  acType: string | null;
  fuelType: string | null;
  image: string | null;
  exampleVehicles: string[] | null;
  isActive: boolean;
}

interface LocalPackage {
  id: string;
  vehicleCategoryId: string;
  locationId: string | null;
  name: string;
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
  nightChargesApply: boolean;
  nightChargeAmount: number;
  isPopular: boolean;
  vehicleCategory: { id: string; name: string };
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface Airport {
  id: string;
  name: string;
  code: string;
  slug: string;
  displayName: string;
  shortName: string;
  city: string;
  cityId: string;
  coordinates: { lat: number; lng: number };
  description: string;
}

interface PricingResult {
  success: boolean;
  tripType: string;
  pricingMethod?: string;
  pricing: {
    grandTotal: number;
    totalBeforeGst: number;
    gst: number;
    baseKmCharge?: number;
    totalKm?: number;
    perKmRate?: number;
    driverAllowance?: number;
    nightCharge?: number;
    tollEstimate?: number;
    basePrice?: number;
    hours?: number;
    kms?: number;
    extraKmCharge?: number;
    extraHourCharge?: number;
  };
  calculation?: {
    days: number;
    actualKm: number;
    chargeableKm: number;
    perKmRate: number;
  };
  route?: {
    from: Location;
    to: Location;
    oneWayDistance: number;
  };
  routePackage?: {
    basePrice: number;
    estimatedKm: number;
  };
  inclusions?: {
    tollsIncluded: boolean;
    parkingIncluded: boolean;
  };
  error?: string;
}

interface CarRentalBookingHeroProps {
  city: string;
  citySlug: string;
  serviceSlug: 'car-rental' | 'luxury-car-rental';
  serviceTitle: string;
}

// Combo Input - allows both typing custom value and selecting from list
function ComboLocationInput({
  locations,
  value,
  textValue,
  onChange,
  onTextChange,
  placeholder = 'Type or select destination...',
  iconColor = 'text-gray-400',
  excludeId,
}: {
  locations: Location[];
  value: string;
  textValue: string;
  onChange: (location: Location | null, customText?: string) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
  iconColor?: string;
  excludeId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter locations based on text value and exclude ID
  const filteredLocations = locations.filter((loc) => {
    if (excludeId && loc.id === excludeId) return false;
    if (!textValue) return true;
    return loc.name.toLowerCase().includes(textValue.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onTextChange(newValue);
    setIsOpen(true);
    // Clear selected location when typing custom value
    if (value) {
      onChange(null, newValue);
    }
  };

  const handleSelectLocation = (loc: Location) => {
    onChange(loc);
    onTextChange(loc.name);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
        <input
          ref={inputRef}
          type="text"
          value={textValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
        />
        {textValue && (
          <button
            type="button"
            onClick={() => {
              onTextChange('');
              onChange(null, '');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {isOpen && filteredLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs text-gray-500">Select from list or type custom destination</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition ${
                    value === loc.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{loc.name}</span>
                  {value === loc.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Searchable Airport Dropdown Component
function SearchableAirportSelect({
  airports,
  value,
  onChange,
  placeholder = 'Search airport...',
}: {
  airports: Airport[];
  value: string;
  onChange: (airport: Airport) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected airport
  const selectedAirport = airports.find((a) => a.id === value);

  // Filter airports based on search query
  const filteredAirports = airports.filter((airport) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      airport.name.toLowerCase().includes(query) ||
      airport.code.toLowerCase().includes(query) ||
      airport.city?.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left"
      >
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
        <span className={selectedAirport ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedAirport
            ? `${selectedAirport.code} - ${selectedAirport.name}`
            : placeholder}
        </span>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, code or city..."
                  className="w-full pl-9 pr-8 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Airport List */}
            <div className="max-h-56 overflow-y-auto">
              {filteredAirports.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No airports found
                </div>
              ) : (
                filteredAirports.map((airport) => (
                  <button
                    key={airport.id}
                    type="button"
                    onClick={() => {
                      onChange(airport);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex items-start gap-3 transition ${
                      value === airport.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600">{airport.code}</span>
                        <span className="truncate">{airport.name}</span>
                      </div>
                      <div className="text-xs text-gray-500">{airport.city}</div>
                    </div>
                    {value === airport.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Searchable Location Dropdown Component
function SearchableLocationSelect({
  locations,
  value,
  onChange,
  placeholder = 'Search city...',
  iconColor = 'text-gray-400',
  excludeId,
}: {
  locations: Location[];
  value: string;
  onChange: (location: Location) => void;
  placeholder?: string;
  iconColor?: string;
  excludeId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected location name
  const selectedLocation = locations.find((l) => l.id === value);

  // Filter locations based on search query and exclude ID
  const filteredLocations = locations.filter((loc) => {
    if (excludeId && loc.id === excludeId) return false;
    if (!searchQuery) return true;
    return loc.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left"
      >
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${iconColor}`} />
        <span className={selectedLocation ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedLocation?.name || placeholder}
        </span>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className="w-full pl-9 pr-8 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Location List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No cities found
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onChange(loc);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 transition ${
                      value === loc.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{loc.name}</span>
                    {value === loc.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CarRentalBookingHero({
  city,
  citySlug,
  serviceSlug,
  serviceTitle,
}: CarRentalBookingHeroProps) {
  // Trip type state
  const [tripType, setTripType] = useState<TripType>('local');
  const [outstationMode, setOutstationMode] = useState<OutstationMode>('round-trip');
  const [airportMode, setAirportMode] = useState<AirportMode>('pickup');

  // Data from APIs
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [localPackages, setLocalPackages] = useState<LocalPackage[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [pickupCity, setPickupCity] = useState(city);
  const [pickupLocationId, setPickupLocationId] = useState<string>('');
  const [dropCity, setDropCity] = useState('');
  const [dropCityText, setDropCityText] = useState(''); // For combo input - allows custom text
  const [dropLocationId, setDropLocationId] = useState<string>('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Car selection state
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [showCarSelection, setShowCarSelection] = useState(false);
  const [carPrices, setCarPrices] = useState<Record<string, PricingResult>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Airport specific
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [dropAddress, setDropAddress] = useState('');

  // Determine API base path based on service
  const apiBasePath = serviceSlug === 'luxury-car-rental'
    ? '/api/admin/services/luxury-car-rental'
    : '/api/admin/services/car-rental';

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, packagesRes, locationsRes, airportsRes] = await Promise.all([
          fetch(`${apiBasePath}/vehicles`),
          fetch(`${apiBasePath}/packages`),
          fetch(`/api/services/${serviceSlug}/locations`),
          fetch(`/api/airports`), // Fetch all airports
        ]);

        const vehiclesData = await vehiclesRes.json();
        const packagesData = await packagesRes.json();
        const locationsData = await locationsRes.json();
        const airportsData = await airportsRes.json();

        if (vehiclesData.categories) {
          setVehicleCategories(
            vehiclesData.categories?.filter((c: VehicleCategory) => c.isActive) || []
          );
        }
        if (packagesData.packages) {
          setLocalPackages(packagesData.packages || []);
        }
        if (locationsData.success && locationsData.locations) {
          const locs = locationsData.locations || [];
          setLocations(locs);

          // Find current location by slug first, then by name
          let current = locs.find((l: Location) => l.slug === citySlug);
          if (!current) {
            // Try to find by name (case insensitive)
            current = locs.find((l: Location) =>
              l.name.toLowerCase() === city.toLowerCase()
            );
          }

          if (current) {
            setCurrentLocation(current);
            setPickupLocationId(current.id);
            setPickupCity(current.name);
          } else if (locs.length > 0) {
            // If no match found, select the first available location
            setCurrentLocation(locs[0]);
            setPickupLocationId(locs[0].id);
            setPickupCity(locs[0].name);
          }
        }
        // Set airports
        if (airportsData.success && airportsData.airports) {
          setAirports(airportsData.airports || []);
          // Auto-select first airport if available
          if (airportsData.airports.length > 0) {
            setSelectedAirportId(airportsData.airports[0].id);
            setSelectedAirport(airportsData.airports[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [citySlug, city, apiBasePath, serviceSlug]);

  // Set default dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setReturnDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Set default package when packages load
  useEffect(() => {
    if (localPackages.length > 0 && !selectedPackageId) {
      // Find 8hr package or first available
      const defaultPkg = localPackages.find((p) => p.hours === 8) || localPackages[0];
      if (defaultPkg) {
        setSelectedPackageId(defaultPkg.id);
      }
    }
  }, [localPackages, selectedPackageId]);

  // Get unique packages (grouped by hours/kms for display)
  const uniquePackages = localPackages.reduce((acc, pkg) => {
    const key = `${pkg.hours}-${pkg.kms}`;
    if (!acc.find((p) => `${p.hours}-${p.kms}` === key)) {
      acc.push(pkg);
    }
    return acc;
  }, [] as LocalPackage[]);

  // Fetch prices for all vehicle categories
  const fetchPrices = useCallback(async () => {
    if (vehicleCategories.length === 0) return;

    setLoadingPrices(true);
    const prices: Record<string, PricingResult> = {};

    try {
      await Promise.all(
        vehicleCategories.map(async (vehicle) => {
          try {
            let url = '/api/chauffeur-pricing?';
            const params = new URLSearchParams({
              vehicleCategory: vehicle.id,
              tripType:
                tripType === 'outstation'
                  ? outstationMode === 'one-way'
                    ? 'one_way'
                    : 'round_trip'
                  : tripType,
            });

            if (tripType === 'local' && selectedPackageId) {
              // Find the package for this vehicle category
              const pkg =
                localPackages.find(
                  (p) =>
                    p.vehicleCategoryId === vehicle.id &&
                    p.hours === localPackages.find((lp) => lp.id === selectedPackageId)?.hours &&
                    p.kms === localPackages.find((lp) => lp.id === selectedPackageId)?.kms
                ) || localPackages.find((p) => p.id === selectedPackageId);

              if (pkg) {
                params.set('packageId', pkg.id);
              }
            }

            if (tripType === 'outstation') {
              if (pickupLocationId) params.set('from', pickupLocationId);
              if (dropLocationId) params.set('to', dropLocationId);
              if (pickupDate) params.set('startDate', pickupDate);
              if (returnDate && outstationMode === 'round-trip') params.set('endDate', returnDate);
            }

            if (tripType === 'airport') {
              // For airport, set from/to based on mode
              if (airportMode === 'pickup') {
                // From Airport to City
                if (selectedAirportId) params.set('from', selectedAirportId);
                if (pickupLocationId) params.set('to', pickupLocationId);
              } else {
                // From City to Airport
                if (pickupLocationId) params.set('from', pickupLocationId);
                if (selectedAirportId) params.set('to', selectedAirportId);
              }
              params.set('tripType', 'airport');
              if (pickupDate) params.set('startDate', pickupDate);
            }

            if (pickupTime) params.set('pickupTime', pickupTime);

            const res = await fetch(url + params.toString());
            const data = await res.json();
            prices[vehicle.id] = data;
          } catch (err) {
            prices[vehicle.id] = {
              success: false,
              tripType,
              pricing: { grandTotal: 0, totalBeforeGst: 0, gst: 0 },
              error: 'Failed to fetch',
            };
          }
        })
      );
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    setCarPrices(prices);
    setLoadingPrices(false);
  }, [
    vehicleCategories,
    tripType,
    outstationMode,
    airportMode,
    selectedPackageId,
    localPackages,
    pickupLocationId,
    dropLocationId,
    selectedAirportId,
    pickupDate,
    returnDate,
    pickupTime,
  ]);

  // Handle search/proceed
  const handleSearch = () => {
    if (!pickupDate) {
      alert('Please select pickup date');
      return;
    }
    // For outstation, allow either selected location OR custom text
    if (tripType === 'outstation' && !dropLocationId && !dropCityText.trim()) {
      alert('Please enter or select destination city');
      return;
    }
    // For airport, require airport selection
    if (tripType === 'airport' && !selectedAirportId) {
      alert('Please select an airport');
      return;
    }
    setShowCarSelection(true);
    fetchPrices();
  };

  // Handle booking - Show confirmation modal
  const handleBook = (vehicleId: string) => {
    const vehicle = vehicleCategories.find((c) => c.id === vehicleId);
    const priceData = carPrices[vehicleId];

    if (!vehicle || !priceData?.success) return;

    // Get selected package details for local trips
    const selectedPackage = localPackages.find((p) => p.id === selectedPackageId);

    // Prepare booking details for the modal
    const details = {
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        seatingCapacity: vehicle.seatingCapacity,
        luggageCapacity: vehicle.luggageCapacity,
        acType: vehicle.acType,
        fuelType: vehicle.fuelType,
        image: vehicle.image,
        exampleVehicles: vehicle.exampleVehicles,
      },
      tripType,
      pickupCity,
      pickupCitySlug: citySlug,
      pickupLocationId,
      pickupDate,
      pickupTime,
      dropCity: dropCity || dropCityText,
      dropLocationId,
      returnDate,
      outstationMode,
      airportMode,
      // Airport details
      airportId: selectedAirportId,
      airportName: selectedAirport?.name,
      airportCode: selectedAirport?.code,
      dropAddress,
      packageId: selectedPackageId,
      packageName: selectedPackage?.name,
      packageHours: selectedPackage?.hours,
      packageKms: selectedPackage?.kms,
      pricing: priceData.pricing,
      serviceSlug,
    };

    setBookingDetails(details);
    setShowBookingModal(true);
  };

  // Get selected package details
  const selectedPackage = localPackages.find((p) => p.id === selectedPackageId);

  // Theme colors based on service
  const themeColors =
    serviceSlug === 'luxury-car-rental'
      ? {
          primary: 'amber',
          gradient: 'from-gray-900 via-gray-800 to-gray-900',
          accent: 'amber-400',
        }
      : {
          primary: 'blue',
          gradient: 'from-blue-900 via-blue-800 to-indigo-900',
          accent: 'blue-400',
        };

  if (loadingData) {
    return (
      <section
        className={`relative bg-gradient-to-br ${themeColors.gradient} text-white py-20`}
      >
        <div className="container-custom flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative bg-gradient-to-br ${themeColors.gradient} text-white overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative container-custom py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left - Hero Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6`}
            >
              <Car className={`w-4 h-4 text-${themeColors.accent}`} />
              <span className="text-sm font-medium">
                {serviceTitle} in {city}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Book Outstation, Local &{' '}
              <span className={`text-${themeColors.accent}`}>Airport Cabs</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              All-inclusive fares with fuel & driver. Transparent pricing, no hidden charges.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8"
            >
              {[
                { icon: Shield, text: 'Verified Drivers' },
                { icon: Fuel, text: 'Fuel Included' },
                { icon: Star, text: '4.8 Rating' },
              ].map((item) => (
                <div
                  key={item.text}
                  className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2`}
                >
                  <item.icon className={`w-4 h-4 text-${themeColors.accent}`} />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Trip type info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto lg:mx-0"
            >
              {tripType === 'local' && (
                <div className="text-sm text-blue-100">
                  <strong className="text-white">Local Trips:</strong> Perfect for city travel,
                  meetings, shopping. Extra charges apply beyond package limits.
                </div>
              )}
              {tripType === 'outstation' && (
                <div className="text-sm text-blue-100">
                  <strong className="text-white">
                    {outstationMode === 'round-trip' ? 'Round Trip:' : 'One Way:'}
                  </strong>{' '}
                  {outstationMode === 'round-trip'
                    ? 'Min 300 km/day. Driver allowance included. Best for multi-day trips.'
                    : 'Fixed fare for one-way drops. No return trip charges.'}
                </div>
              )}
              {tripType === 'airport' && (
                <div className="text-sm text-blue-100">
                  <strong className="text-white">Airport Transfer:</strong> Includes 45 min waiting
                  time. Meet & greet service available.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right - Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Trip Type Tabs */}
            <div className="flex border-b">
              {[
                { id: 'local' as TripType, label: 'Local', icon: Navigation },
                { id: 'outstation' as TripType, label: 'Outstation', icon: MapPin },
                { id: 'airport' as TripType, label: 'Airport', icon: Plane },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTripType(tab.id);
                    setShowCarSelection(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition ${
                    tripType === tab.id
                      ? `text-${themeColors.primary}-600 border-b-2 border-${themeColors.primary}-600 bg-${themeColors.primary}-50`
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {!showCarSelection ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* LOCAL TRIP */}
                    {tripType === 'local' && (
                      <>
                        {/* City */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <SearchableLocationSelect
                            locations={locations}
                            value={pickupLocationId}
                            onChange={(loc) => {
                              // Just update state - no page refresh
                              setPickupLocationId(loc.id);
                              setPickupCity(loc.name);
                              setCurrentLocation(loc);
                            }}
                            placeholder="Search city..."
                            iconColor="text-blue-500"
                          />
                        </div>

                        {/* Package Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Package
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {uniquePackages.slice(0, 3).map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setSelectedPackageId(pkg.id)}
                                className={`p-3 rounded-lg border-2 text-center transition ${
                                  selectedPackage?.hours === pkg.hours &&
                                  selectedPackage?.kms === pkg.kms
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-200'
                                }`}
                              >
                                <div className="font-semibold text-gray-900">{pkg.hours} Hrs</div>
                                <div className="text-xs text-gray-500">{pkg.kms} Km</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pickup Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pickup Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* OUTSTATION TRIP */}
                    {tripType === 'outstation' && (
                      <>
                        {/* One-way / Round-trip Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setOutstationMode('one-way')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'one-way'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <ArrowRight className="w-4 h-4" />
                            One Way
                          </button>
                          <button
                            onClick={() => setOutstationMode('round-trip')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'round-trip'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                            Round Trip
                          </button>
                        </div>

                        {/* From / To */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              From
                            </label>
                            <SearchableLocationSelect
                              locations={locations}
                              value={pickupLocationId}
                              onChange={(loc) => {
                                setPickupLocationId(loc.id);
                                setPickupCity(loc.name);
                              }}
                              placeholder="Search city..."
                              iconColor="text-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              To
                            </label>
                            <ComboLocationInput
                              locations={locations}
                              value={dropLocationId}
                              textValue={dropCityText}
                              onChange={(loc, customText) => {
                                if (loc) {
                                  setDropLocationId(loc.id);
                                  setDropCity(loc.name);
                                } else {
                                  setDropLocationId('');
                                  setDropCity(customText || '');
                                }
                              }}
                              onTextChange={(text) => setDropCityText(text)}
                              placeholder="Type or select destination..."
                              iconColor="text-red-500"
                              excludeId={pickupLocationId}
                            />
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pickup Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          {outstationMode === 'round-trip' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Date
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="date"
                                  value={returnDate}
                                  onChange={(e) => setReturnDate(e.target.value)}
                                  min={pickupDate || new Date().toISOString().split('T')[0]}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pickup Time
                              </label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="time"
                                  value={pickupTime}
                                  onChange={(e) => setPickupTime(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {outstationMode === 'round-trip' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pickup Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* AIRPORT TRANSFER */}
                    {tripType === 'airport' && (
                      <>
                        {/* Pickup / Drop Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setAirportMode('pickup')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'pickup'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4" />
                            From Airport
                          </button>
                          <button
                            onClick={() => setAirportMode('drop')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'drop'
                                ? 'bg-white text-blue-600 shadow'
                                : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4 rotate-45" />
                            To Airport
                          </button>
                        </div>

                        {/* Airport Selection - Searchable */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {airportMode === 'pickup' ? 'Pickup Airport' : 'Drop Airport'}
                          </label>
                          {airports.length > 0 ? (
                            <>
                              <SearchableAirportSelect
                                airports={airports}
                                value={selectedAirportId}
                                onChange={(airport) => {
                                  setSelectedAirportId(airport.id);
                                  setSelectedAirport(airport);
                                }}
                                placeholder="Search airport by name, code or city..."
                              />
                              {selectedAirport && (
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {selectedAirport.city} • {selectedAirport.description}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>No airports available. Please contact support.</span>
                            </div>
                          )}
                        </div>

                        {/* Drop/Pickup Location - City Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {airportMode === 'pickup' ? 'Drop Location' : 'Pickup Location'}
                          </label>
                          <SearchableLocationSelect
                            locations={locations}
                            value={pickupLocationId}
                            onChange={(loc) => {
                              setPickupLocationId(loc.id);
                              setPickupCity(loc.name);
                            }}
                            placeholder="Search city..."
                            iconColor="text-red-500"
                          />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {airportMode === 'pickup' ? 'Flight Arrival' : 'Pickup Date'}
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {airportMode === 'pickup' ? 'Arrival Time' : 'Pickup Time'}
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      Explore Cabs
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Info */}
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {tripType === 'local' &&
                          'Extra km and hour charges apply beyond package limits'}
                        {tripType === 'outstation' &&
                          outstationMode === 'round-trip' &&
                          'Min 300 km/day. Driver allowance included. Toll/parking extra'}
                        {tripType === 'outstation' &&
                          outstationMode === 'one-way' &&
                          'Fixed fare for one-way. Toll charges extra'}
                        {tripType === 'airport' && 'Includes 45 min waiting time at airport'}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  /* Car Selection */
                  <motion.div
                    key="cars"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Back Button */}
                    <button
                      onClick={() => setShowCarSelection(false)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      ← Modify Search
                    </button>

                    {/* Trip Summary */}
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-blue-800">
                        {tripType === 'airport' ? (
                          <Plane className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {tripType === 'local' &&
                            `${pickupCity} - ${selectedPackage?.hours || 8}hr/${selectedPackage?.kms || 80}km`}
                          {tripType === 'outstation' &&
                            `${pickupCity} → ${dropCity || dropCityText} (${outstationMode})`}
                          {tripType === 'airport' &&
                            (airportMode === 'pickup'
                              ? `${selectedAirport?.code || 'Airport'} → ${pickupCity}`
                              : `${pickupCity} → ${selectedAirport?.code || 'Airport'}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-blue-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pickupTime}
                        </span>
                      </div>
                    </div>

                    {/* Loading State */}
                    {loadingPrices && (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    )}

                    {/* Car Options */}
                    {!loadingPrices && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {vehicleCategories.map((vehicle) => {
                          const priceData = carPrices[vehicle.id];
                          const hasPrice =
                            priceData?.success && priceData.pricing?.grandTotal > 0;

                          return (
                            <div
                              key={vehicle.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                                selectedCar === vehicle.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : hasPrice
                                    ? 'border-gray-200 hover:border-blue-200'
                                    : 'border-gray-100 bg-gray-50 opacity-60'
                              }`}
                              onClick={() => hasPrice && setSelectedCar(vehicle.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {vehicle.image ? (
                                      <img
                                        src={vehicle.image}
                                        alt={vehicle.name}
                                        className="w-14 h-10 object-contain"
                                      />
                                    ) : (
                                      <Car className="w-8 h-8 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      {Array.isArray(vehicle.exampleVehicles)
                                        ? vehicle.exampleVehicles.slice(0, 3).join(', ')
                                        : typeof vehicle.exampleVehicles === 'string' && vehicle.exampleVehicles
                                        ? vehicle.exampleVehicles.split(',').slice(0, 3).map((v: string) => v.trim()).join(', ')
                                        : 'Swift, Dzire, Innova'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {vehicle.seatingCapacity}
                                      </span>
                                      <span>•</span>
                                      <span>{vehicle.acType || 'AC'}</span>
                                      <span>•</span>
                                      <span>{vehicle.luggageCapacity || '2 Bags'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {hasPrice ? (
                                    <>
                                      <div className="text-xl font-bold text-gray-900">
                                        ₹{priceData.pricing.grandTotal.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {tripType === 'local' && 'All inclusive'}
                                        {tripType === 'outstation' &&
                                          (priceData.pricingMethod === 'route_package'
                                            ? 'Fixed fare'
                                            : 'Incl. driver allowance')}
                                        {tripType === 'airport' && 'Fixed fare'}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>Not available</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {selectedCar === vehicle.id && hasPrice && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 pt-4 border-t border-blue-200"
                                >
                                  {/* Fare Breakdown */}
                                  <div className="text-xs space-y-1 text-gray-600 mb-4">
                                    {tripType === 'local' && priceData.pricing && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>
                                            Base fare ({selectedPackage?.hours}hr/
                                            {selectedPackage?.kms}km)
                                          </span>
                                          <span>
                                            ₹{priceData.pricing.totalBeforeGst?.toLocaleString()}
                                          </span>
                                        </div>
                                        {priceData.pricing.extraKmCharge && (
                                          <div className="flex justify-between text-gray-400">
                                            <span>Extra km charge</span>
                                            <span>₹{priceData.pricing.extraKmCharge}/km</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {tripType === 'outstation' && priceData.calculation && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>
                                            Distance ({priceData.calculation.chargeableKm} km × ₹
                                            {priceData.calculation.perKmRate})
                                          </span>
                                          <span>
                                            ₹{priceData.pricing.baseKmCharge?.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>
                                            Driver allowance ({priceData.calculation.days} day)
                                          </span>
                                          <span>
                                            ₹{priceData.pricing.driverAllowance?.toLocaleString()}
                                          </span>
                                        </div>
                                        {priceData.pricing.tollEstimate &&
                                          priceData.pricing.tollEstimate > 0 && (
                                            <div className="flex justify-between">
                                              <span>Toll estimate</span>
                                              <span>
                                                ₹{priceData.pricing.tollEstimate?.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                      </>
                                    )}
                                    {tripType === 'outstation' && priceData.routePackage && (
                                      <>
                                        <div className="flex justify-between">
                                          <span>
                                            Fixed route fare ({priceData.routePackage.estimatedKm}{' '}
                                            km)
                                          </span>
                                          <span>
                                            ₹{priceData.pricing.totalBeforeGst?.toLocaleString()}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    {!priceData.inclusions?.tollsIncluded && (
                                      <div className="flex justify-between text-amber-600">
                                        <span>Toll/Parking</span>
                                        <span>Extra (as applicable)</span>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleBook(vehicle.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Book {vehicle.name}
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <CarRentalBookingConfirmModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingDetails(null);
        }}
        bookingDetails={bookingDetails}
      />
    </section>
  );
}
