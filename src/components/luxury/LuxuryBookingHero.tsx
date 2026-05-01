'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Clock,
  Plane,
  Navigation,
  ChevronRight,
  Shield,
  Star,
  Crown,
  ArrowRight,
  ArrowLeftRight,
  Wine,
  Briefcase,
  Users,
} from 'lucide-react';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect';

// City/Location interface
interface City {
  id: string;
  name: string;
  code: string | null;
  slug: string;
  type: string;
  displayName: string;
  state: string | null;
}

// Airport interface
interface Airport {
  id: string;
  name: string;
  code: string;
  slug: string;
  displayName: string;
  shortName: string;
  city: string | null;
  citySlug: string | null;
}

// Trip types
type TripType = 'local' | 'outstation' | 'airport';
type OutstationMode = 'one-way' | 'round-trip';
type AirportMode = 'pickup' | 'drop';

// Local packages for luxury
const LOCAL_PACKAGES = [
  { id: '4hr-40km', hours: 4, km: 40, label: '4 Hrs / 40 Km' },
  { id: '8hr-80km', hours: 8, km: 80, label: '8 Hrs / 80 Km' },
  { id: '12hr-120km', hours: 12, km: 120, label: '12 Hrs / 120 Km' },
];


// Popular routes
const POPULAR_ROUTES: Record<string, { to: string; distance: number }[]> = {
  delhi: [
    { to: 'Agra', distance: 230 },
    { to: 'Jaipur', distance: 280 },
    { to: 'Chandigarh', distance: 250 },
  ],
  mumbai: [
    { to: 'Pune', distance: 150 },
    { to: 'Lonavala', distance: 85 },
    { to: 'Goa', distance: 590 },
  ],
  bangalore: [
    { to: 'Mysore', distance: 150 },
    { to: 'Coorg', distance: 260 },
    { to: 'Ooty', distance: 280 },
  ],
};

interface LuxuryBookingHeroProps {
  city: string;
  citySlug: string;
}

export function LuxuryBookingHero({ city, citySlug }: LuxuryBookingHeroProps) {
  // Trip type state
  const [tripType, setTripType] = useState<TripType>('local');
  const [outstationMode, setOutstationMode] = useState<OutstationMode>('round-trip');
  const [airportMode, setAirportMode] = useState<AirportMode>('pickup');

  // Form state
  const [pickupCity, setPickupCity] = useState(city);
  const [dropCity, setDropCity] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [localPackage, setLocalPackage] = useState(LOCAL_PACKAGES[1].id);


  // City/Location specific
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [selectedPickupCityId, setSelectedPickupCityId] = useState<string>('');
  const [selectedDropCityId, setSelectedDropCityId] = useState<string>('');

  // Airport specific
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airportsLoading, setAirportsLoading] = useState(false);
  const [selectedAirportId, setSelectedAirportId] = useState<string>('');
  const [terminalAddress, setTerminalAddress] = useState('');


  // Set default dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    setReturnDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Fetch cities from luxury car rental service
  useEffect(() => {
    const fetchCities = async () => {
      setCitiesLoading(true);
      try {
        const res = await fetch('/api/services/luxury-car-rental/locations?limit=1000');
        if (res.ok) {
          const data = await res.json();
          // Filter CITY and VILLAGE type locations (both are valid pickup places)
          const cityLocations = (data.locations || []).filter((loc: City) => loc.type === 'CITY' || loc.type === 'VILLAGE');
          setCities(cityLocations);

          // Set default pickup city based on the city prop
          const defaultCity = cityLocations.find((c: City) =>
            c.name.toLowerCase() === city.toLowerCase() ||
            c.slug === citySlug
          );
          if (defaultCity) {
            setSelectedPickupCityId(defaultCity.id);
            setPickupCity(defaultCity.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, [city, citySlug]);

  // Fetch airports for airport transfers
  useEffect(() => {
    const fetchAirports = async () => {
      setAirportsLoading(true);
      try {
        const res = await fetch('/api/airports');
        if (res.ok) {
          const data = await res.json();
          setAirports(data.airports || []);
        }
      } catch (error) {
        console.error('Failed to fetch airports:', error);
      } finally {
        setAirportsLoading(false);
      }
    };
    fetchAirports();
  }, []);


  // Handle continue booking - go directly to book page
  const handleContinueBooking = () => {
    if (!pickupDate) {
      alert('Please select pickup date');
      return;
    }

    const params = new URLSearchParams({
      tripType,
      pickupCity,
      pickupDate,
      pickupTime,
    });

    if (selectedPickupCityId) {
      params.set('pickupCityId', selectedPickupCityId);
    }

    if (tripType === 'local') {
      params.set('package', localPackage);
    }
    if (tripType === 'outstation') {
      params.set('dropCity', dropCity);
      if (selectedDropCityId) params.set('dropCityId', selectedDropCityId);
      params.set('mode', outstationMode);
      if (returnDate) params.set('returnDate', returnDate);
    }
    if (tripType === 'airport') {
      params.set('airportMode', airportMode);
      if (selectedAirportId) {
        params.set('airportId', selectedAirportId);
        const airport = airports.find(a => a.id === selectedAirportId);
        if (airport) {
          params.set('airport', airport.displayName);
          params.set('airportCode', airport.code);
        }
      }
      params.set('terminalAddress', terminalAddress);
    }

    window.location.href = `/luxury-car-rental/${citySlug}/book?${params.toString()}`;
  };

  const popularRoutes = POPULAR_ROUTES[citySlug] || POPULAR_ROUTES['delhi'] || [];

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Gold accent pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gold gradient overlay */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-amber-900/20 to-transparent" />

      <div className="relative container-custom py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left - Hero Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 backdrop-blur-sm border border-amber-500/30 rounded-full px-4 py-2 mb-6"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Luxury Car Rental in {city}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Experience{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                Ultimate Luxury
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Premium chauffeur-driven luxury cars. Mercedes, BMW, Rolls Royce & more.
            </motion.p>

            {/* Premium features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8"
            >
              {[
                { icon: Shield, text: 'Professional Chauffeurs' },
                { icon: Crown, text: 'Premium Experience' },
                { icon: Star, text: '5★ Service' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2"
                >
                  <item.icon className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Popular Routes - For Outstation */}
            {tripType === 'outstation' && popularRoutes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8"
              >
                <p className="text-gray-400 mb-3 text-sm">Popular luxury routes from {city}:</p>
                <div className="flex flex-wrap gap-2">
                  {popularRoutes.map((route) => {
                    // Find matching city from the cities list
                    const matchingCity = cities.find(c => c.name.toLowerCase() === route.to.toLowerCase());
                    return (
                      <button
                        key={route.to}
                        onClick={() => {
                          if (matchingCity) {
                            setSelectedDropCityId(matchingCity.id);
                            setDropCity(matchingCity.name);
                          } else {
                            setDropCity(route.to);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition border ${
                          dropCity === route.to
                            ? 'bg-amber-500 text-black border-amber-500'
                            : 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                        }`}
                      >
                        {route.to} ({route.distance} km)
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Luxury amenities */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 hidden lg:block"
            >
              <p className="text-gray-400 text-sm mb-3">Included with every ride:</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Wine, text: 'Refreshments' },
                  { icon: Briefcase, text: 'Meet & Greet' },
                  { icon: Users, text: 'Uniformed Chauffeur' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-gray-400">
                    <item.icon className="w-4 h-4 text-amber-500/60" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
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
            <div className="flex border-b bg-gray-50">
              {[
                { id: 'local' as TripType, label: 'Local', icon: Navigation },
                { id: 'outstation' as TripType, label: 'Outstation', icon: MapPin },
                { id: 'airport' as TripType, label: 'Airport', icon: Plane },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTripType(tab.id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition ${
                    tripType === tab.id
                      ? 'text-amber-600 border-b-2 border-amber-500 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              <div className="space-y-4">
                    {/* LOCAL TRIP */}
                    {tripType === 'local' && (
                      <>
                        <SearchableSelect
                          label="City"
                          options={cities.map(c => ({
                            id: c.id,
                            label: c.name,
                            subtitle: c.state || undefined,
                          }))}
                          value={selectedPickupCityId}
                          onChange={(value) => {
                            setSelectedPickupCityId(value);
                            const loc = cities.find(c => c.id === value);
                            if (loc) setPickupCity(loc.name);
                          }}
                          placeholder="Select city"
                          icon={<MapPin className="w-5 h-5 text-gray-400" />}
                          loading={citiesLoading}
                          emptyMessage="No cities available"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
                          <div className="grid grid-cols-3 gap-2">
                            {LOCAL_PACKAGES.map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setLocalPackage(pkg.id)}
                                className={`p-3 rounded-lg border-2 text-center transition ${
                                  localPackage === pkg.id
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-200 hover:border-amber-200'
                                }`}
                              >
                                <div className="font-semibold text-gray-900">{pkg.hours} Hrs</div>
                                <div className="text-xs text-gray-500">{pkg.km} Km</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* OUTSTATION TRIP */}
                    {tripType === 'outstation' && (
                      <>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setOutstationMode('one-way')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'one-way' ? 'bg-white text-amber-600 shadow' : 'text-gray-600'
                            }`}
                          >
                            <ArrowRight className="w-4 h-4" />
                            One Way
                          </button>
                          <button
                            onClick={() => setOutstationMode('round-trip')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              outstationMode === 'round-trip' ? 'bg-white text-amber-600 shadow' : 'text-gray-600'
                            }`}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                            Round Trip
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* From City */}
                          <SearchableSelect
                            label="From City"
                            options={cities.map(c => ({
                              id: c.id,
                              label: c.name,
                              subtitle: c.state || undefined,
                            }))}
                            value={selectedPickupCityId}
                            onChange={(value) => {
                              setSelectedPickupCityId(value);
                              const loc = cities.find(c => c.id === value);
                              if (loc) setPickupCity(loc.name);
                            }}
                            placeholder="Select from city"
                            icon={<MapPin className="w-5 h-5 text-amber-500" />}
                            loading={citiesLoading}
                            emptyMessage="No cities available"
                          />

                          {/* To City */}
                          <SearchableSelect
                            label="To City"
                            options={cities.map(c => ({
                              id: c.id,
                              label: c.name,
                              subtitle: c.state || undefined,
                            }))}
                            value={selectedDropCityId}
                            onChange={(value) => {
                              setSelectedDropCityId(value);
                              const loc = cities.find(c => c.id === value);
                              if (loc) setDropCity(loc.name);
                            }}
                            placeholder="Select drop city"
                            icon={<MapPin className="w-5 h-5 text-red-500" />}
                            loading={citiesLoading}
                            emptyMessage="No cities available"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="date"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                          {outstationMode === 'round-trip' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="date"
                                  value={returnDate}
                                  onChange={(e) => setReturnDate(e.target.value)}
                                  min={pickupDate}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="time"
                                  value={pickupTime}
                                  onChange={(e) => setPickupTime(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {outstationMode === 'round-trip' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* AIRPORT TRANSFER */}
                    {tripType === 'airport' && (
                      <>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setAirportMode('pickup')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'pickup' ? 'bg-white text-amber-600 shadow' : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4" />
                            From Airport
                          </button>
                          <button
                            onClick={() => setAirportMode('drop')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                              airportMode === 'drop' ? 'bg-white text-amber-600 shadow' : 'text-gray-600'
                            }`}
                          >
                            <Plane className="w-4 h-4 rotate-45" />
                            To Airport
                          </button>
                        </div>

                        {/* Airport Selection */}
                        <SearchableSelect
                          label="Airport"
                          options={airports.map(a => ({
                            id: a.id,
                            label: a.displayName,
                            subtitle: a.city || undefined,
                          }))}
                          value={selectedAirportId}
                          onChange={(value) => setSelectedAirportId(value)}
                          placeholder="Select airport"
                          icon={<Plane className="w-5 h-5 text-amber-500" />}
                          loading={airportsLoading}
                          emptyMessage="No airports available"
                        />

                        {/* Address Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {airportMode === 'pickup' ? 'Drop Address' : 'Pickup Address'}
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={terminalAddress}
                              onChange={(e) => setTerminalAddress(e.target.value)}
                              placeholder={airportMode === 'pickup' ? 'Enter drop address' : 'Enter pickup address'}
                              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>

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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                {/* Continue Booking Button */}
                <button
                  onClick={handleContinueBooking}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  Continue Your Booking
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
