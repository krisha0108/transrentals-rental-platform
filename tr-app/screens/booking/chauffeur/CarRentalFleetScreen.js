import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
  Linking,
  BackHandler,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';
import { BASE_URL } from '../../api';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
// Phase 7 — TA Personal/Company toggle (renders only for TA-linked customers).
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer } from '../../../utils/isTravelAgent';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BRAND_TEAL = '#09B368';
const GOLD = '#FFD700';
const BG = '#F8F9FA';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#64748B';

const TRIP_TYPES = [
  { id: 'local', label: 'Local', icon: 'map-pin', desc: 'City rides with packages' },
  { id: 'one_way', label: 'One-Way', icon: 'arrow-right', desc: 'Drop to destination' },
  { id: 'round_trip', label: 'Round Trip', icon: 'repeat', desc: 'To & back journey' },
  { id: 'airport', label: 'Airport', icon: 'navigation', desc: 'Pickup or drop' },
];

const AIRPORT_DIRECTIONS = [
  { id: 'pickup', label: 'Pickup from Airport', icon: 'airplane-arrival' },
  { id: 'drop', label: 'Drop to Airport', icon: 'airplane-departure' },
];

export default function CarRentalFleetScreen({ navigation, route }) {
  // Trip selection - use route params if provided, default to 'local'
  const initialTripType = route?.params?.tripType || 'local';
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [tripType, setTripType] = useState(initialTripType);
  const [airportDirection, setAirportDirection] = useState('pickup');

  // Locations
  const [allLocations, setAllLocations] = useState([]);
  const [airports, setAirports] = useState([]);
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [multiStops, setMultiStops] = useState([]);

  // Local packages
  const [localPackages, setLocalPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Dates
  const [pickupDate, setPickupDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('pickup');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Fleet & Pricing
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [pricing, setPricing] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customer 0
  const [customer, setCustomer] = useState(null);

  // B2B
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [bookingFor, setBookingFor] = useState('personal'); // 'personal' | 'company'
  // Phase 7 — TA Personal/Company state (separate from B2B above).
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');
  const [numberOfPersons, setNumberOfPersons] = useState('');

  // Step management
  const [step, setStep] = useState(1); // 1: Trip details, 2: Select vehicle, 3: Confirm

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (tripType === 'local' && fromLocation) {
      fetchLocalPackages(fromLocation.slug);
    }
  }, [tripType, fromLocation?.id]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep(step - 1);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [step]);

  const loadInitialData = async () => {
    try {
      const [customerData, locationsRes, categoriesRes] = await Promise.all([
        AsyncStorage.getItem('customer'),
        locationService.getLocations(),
        bookingService.getChauffeurVehicleCategories(),
      ]);

      if (customerData) {
        const parsed = JSON.parse(customerData);
        setCustomer(parsed);
        if (parsed.isB2B && parsed.b2bStatus === 'APPROVED') {
          setIsB2BCustomer(true);
        }
      }

      if (locationsRes.success) {
        const locs = locationsRes.locations || [];
        setAllLocations(locs);
        setAirports(locs.filter(l => l.type === 'airport'));
      }

      if (categoriesRes.success) {
        setVehicleCategories(categoriesRes.categories || []);
      }
    } catch (error) {
      console.log('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalPackages = async (locationSlug) => {
    setLoadingPackages(true);
    try {
      const params = locationSlug ? { locationSlug } : {};
      const res = await bookingService.getChauffeurLocalPackages(params);
      if (res.success) {
        setLocalPackages(res.packages || []);
        setSelectedPackage(null); // reset selection for new city
      }
    } catch (error) {
      console.log('Error fetching local packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchPricingForAllVehicles = async () => {
    if (vehicleCategories.length === 0) return;

    setLoadingPrices(true);
    const newPricing = {};

    try {
      await Promise.all(
        vehicleCategories.map(async (category) => {
          try {
            let params = {
              tripType,
              vehicleCategory: category.id,
              pickupTime,
            };

            if (tripType === 'local') {
              // For local, find the package matching selected hours/kms for this category
              const pkg = localPackages.find(p =>
                p.vehicleCategoryId === category.id &&
                p.hours === selectedPackage?.hours &&
                p.kms === selectedPackage?.kms
              );

              if (pkg) {
                params.packageId = pkg.id;
              } else {
                // Fallback to first available package for this category if preferred
                const catPkg = localPackages.find(p => p.vehicleCategoryId === category.id);
                if (catPkg) params.packageId = catPkg.id;
              }
            } else {
              // For outstation/airport
              const validStops = multiStops.filter(s => s.locationId);

              // Multi-stop pricing: calculate leg by leg
              if ((tripType === 'one_way' || tripType === 'round_trip') && validStops.length > 0 && toLocation?.id) {
                const allStops = [...validStops, { id: 'final', locationId: toLocation.id, name: toLocation.name }];
                const legPairs = [
                  { from: fromLocation?.id, to: allStops[0].locationId },
                  ...allStops.slice(0, -1).map((s, i) => ({
                    from: s.locationId,
                    to: allStops[i + 1].locationId,
                  })),
                ].filter(l => l.from && l.to);

                if (legPairs.length > 0) {
                  const legResults = await Promise.all(
                    legPairs.map(async (leg) => {
                      try {
                        const legRes = await bookingService.getChauffeurPricing({
                          tripType: 'one_way',
                          vehicleCategory: category.id,
                          from: leg.from,
                          to: leg.to,
                          startDate: pickupDate.toISOString().split('T')[0],
                          pickupTime,
                        });
                        return legRes.success ? legRes : null;
                      } catch { return null; }
                    })
                  );

                  const validLegs = legResults.filter(Boolean);
                  if (validLegs.length > 0) {
                    const totalKm = validLegs.reduce((sum, r) => sum + (r.pricing?.totalKm || r.route?.oneWayDistance || 0), 0);
                    // Calculate days based on actual hours (ceil(hours/24))
                    // e.g., 25 Mar 10PM → 28 Mar 10PM = 72hrs = 3 days
                    // Night bookings (10PM+) naturally don't count as full first day
                    let days = 1;
                    if (tripType === 'round_trip') {
                      const [h, m] = (pickupTime || '10:00').split(':').map(Number);
                      const pickupWithTime = new Date(pickupDate);
                      pickupWithTime.setHours(h, m, 0, 0);
                      const totalHours = (returnDate.getTime() - pickupWithTime.getTime()) / (1000 * 60 * 60);
                      const calcDays = Math.ceil(totalHours / 24);
                      if (calcDays > 1) days = calcDays;
                    }
                    const minKmPerDay = validLegs[0]?.calculation?.minKmPerDay || 300;
                    const chargeableKm = Math.max(totalKm, days * minKmPerDay);
                    const perKmRate = validLegs[0]?.pricing?.perKmRate || validLegs[0]?.calculation?.perKmRate || 0;
                    const driverAllowancePerDay = validLegs[0]?.pricing?.driverAllowance || 0;
                    const driverAllowance = driverAllowancePerDay * days;
                    const baseCharge = Math.round(chargeableKm * perKmRate);
                    const beforeGst = baseCharge + driverAllowance;
                    const gst = Math.round(beforeGst * 0.05);
                    // Build leg names for route breakdown
                    const legNames = legPairs.map(leg => {
                      const fromName = leg.from === fromLocation?.id ? fromLocation?.name : (multiStops.find(s => s.locationId === leg.from)?.name || allLocations.find(l => l.id === leg.from)?.name || '');
                      const toName = leg.to === toLocation?.id ? toLocation?.name : (multiStops.find(s => s.locationId === leg.to)?.name || allLocations.find(l => l.id === leg.to)?.name || '');
                      return { from: fromName, to: toName };
                    });

                    newPricing[category.id] = {
                      grandTotal: beforeGst + gst,
                      totalBeforeGst: beforeGst,
                      gst,
                      totalKm: chargeableKm,
                      actualKm: totalKm,
                      perKmRate,
                      driverAllowance,
                      driverAllowancePerDay,
                      days,
                      minKmPerDay,
                      legs: legNames,
                      isMultiStop: true,
                    };
                  }
                }
                return; // Skip normal pricing below
              }

              // Normal single-leg pricing
              params.from = fromLocation?.id;
              params.to = toLocation?.id;
              params.startDate = pickupDate.toISOString().split('T')[0];
              if (tripType === 'round_trip') {
                params.endDate = returnDate.toISOString().split('T')[0];
              }
            }

            const res = await bookingService.getChauffeurPricing(params);
            if (res.success) {
              newPricing[category.id] = res.pricing;
            }
          } catch (err) {
            console.log(`Pricing error for ${category.name}:`, err?.response?.data || err);
          }
        })
      );

      setPricing(newPricing);
    } catch (error) {
      console.log('Error fetching pricing:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleLocationSelect = (loc, target) => {
    if (target === 'from') {
      setFromLocation(loc);
      setFromQuery('');
      setShowFromSuggestions(false);
      if (tripType === 'one_way' || tripType === 'round_trip') {
        setToLocation(loc);
        setToQuery(loc.name);
      }
    } else {
      setToLocation(loc);
      setToQuery('');
      setShowToSuggestions(false);
    }
  };

  const addStop = () => {
    setMultiStops(prev => [...prev, { id: String(Date.now()), locationId: '', name: '', query: '', showSuggestions: false }]);
  };

  const removeStop = (stopId) => {
    setMultiStops(prev => prev.filter(s => s.id !== stopId));
  };

  const updateStopQuery = (stopId, text) => {
    setMultiStops(prev => prev.map(s => s.id === stopId ? { ...s, query: text, locationId: '', name: '', showSuggestions: true } : s));
  };

  const selectStopLocation = (stopId, loc) => {
    setMultiStops(prev => prev.map(s => s.id === stopId ? { ...s, locationId: loc.id, name: loc.name, query: loc.name, showSuggestions: false } : s));
  };

  // Haversine distance in km
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredLocations = (query, isAirport = false) => {
    const source = isAirport ? airports : allLocations;
    const trimmedQuery = (query || '').trim();
    let results;

    if (!trimmedQuery.length) {
      results = [...source];
    } else {
      results = source.filter(l =>
        l.name?.toLowerCase().includes(trimmedQuery.toLowerCase())
      );
    }

    // Sort by proximity to fromLocation if available
    if (fromLocation?.latitude && fromLocation?.longitude) {
      results = results.map(loc => ({
        ...loc,
        _distance: (loc.latitude && loc.longitude)
          ? Math.round(haversineKm(fromLocation.latitude, fromLocation.longitude, loc.latitude, loc.longitude))
          : 99999,
      })).sort((a, b) => a._distance - b._distance);
    }

    return results.slice(0, 15);
  };

  const openDatePicker = (target) => {
    setDatePickerTarget(target);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: target === 'pickup' ? pickupDate : returnDate,
        mode: 'date',
        minimumDate: target === 'pickup' ? getMinBookingDate() : pickupDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            if (target === 'pickup') {
              setPickupDate(date);
              if (returnDate < date) {
                setReturnDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
              }
              // Auto-open time picker after pickup date selection
              DateTimePickerAndroid.open({
                value: new Date(),
                mode: 'time',
                is24Hour: false,
                onChange: (eventTime, time) => {
                  if (eventTime.type === 'set' && time) {
                    const hours = time.getHours().toString().padStart(2, '0');
                    const mins = time.getMinutes().toString().padStart(2, '0');
                    const finalDateTime = new Date(date);
                    finalDateTime.setHours(parseInt(hours, 10));
                    finalDateTime.setMinutes(parseInt(mins, 10));
                    if (isPickupTooSoon(finalDateTime)) {
                      setShowBookingAlert(true);
                      return;
                    }
                    setPickupDate(finalDateTime);
                    setPickupTime(`${hours}:${mins}`);
                  }
                },
              });
            } else {
              setReturnDate(date);
            }
          }
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const openTimePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: new Date(),
        mode: 'time',
        is24Hour: false,
        onChange: (event, time) => {
          if (event.type === 'set' && time) {
            const hours = time.getHours().toString().padStart(2, '0');
            const mins = time.getMinutes().toString().padStart(2, '0');
            const finalDateTime = new Date(pickupDate);
            finalDateTime.setHours(parseInt(hours, 10));
            finalDateTime.setMinutes(parseInt(mins, 10));
            if (isPickupTooSoon(finalDateTime)) {
              setShowBookingAlert(true);
              return;
            }
            setPickupDate(finalDateTime);
            setPickupTime(`${hours}:${mins}`);
          }
        },
      });
    } else {
      setShowTimePicker(true);
    }
  };

  const validateStep1 = () => {
    if (tripType === 'local') {
      if (!fromLocation) {
        Alert.alert('Error', 'Please select pickup city');
        return false;
      }
      if (!selectedPackage) {
        Alert.alert('Error', 'Please select a package');
        return false;
      }
    } else {
      if (!fromLocation) {
        Alert.alert('Error', 'Please select pickup location');
        return false;
      }
      if (!toLocation) {
        Alert.alert('Error', 'Please select drop location');
        return false;
      }
    }

    // 12-hour advance booking validation
    const [hrs, mins] = (pickupTime || '10:00').split(':').map(Number);
    const finalDateTime = new Date(pickupDate);
    finalDateTime.setHours(hrs, mins, 0, 0);
    if (isPickupTooSoon(finalDateTime)) {
      setShowBookingAlert(true);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      await fetchPricingForAllVehicles();
      setStep(2);
    } else if (step === 2) {
      if (!selectedVehicle) {
        Alert.alert('Error', 'Please select a vehicle');
        return;
      }
      setStep(3);
    }
  };

  const handleBooking = async () => {
    if (!customer) {
      Alert.alert('Login Required', 'Please login to book');
      return;
    }

    setSubmitting(true);
    try {
      const vehiclePrice = pricing[selectedVehicle.id];
      const advanceAmount = Math.round((vehiclePrice?.totalBeforeGst || 0) * 0.2);

      const bookingData = {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        tripType,
        vehicleCategory: selectedVehicle.name,
        vehicleCategoryId: selectedVehicle.id,
        pickupCity: fromLocation?.name,
        pickupAddress: fromLocation?.name,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime,
        withAC: true,
        pickupLocationId: fromLocation?.id,
        baseFare: vehiclePrice?.totalBeforeGst || 0,
        gstAmount: 0,
        estimatedAmount: vehiclePrice?.totalBeforeGst || 0,
        advancePaid: 0,
        paymentStatus: 'pending',
        isB2B: bookingFor === 'company' && isB2BCustomer,
        numberOfVehicles: bookingFor === 'company' ? numberOfVehicles : undefined,
        numberOfPersons: bookingFor === 'company' && numberOfPersons ? numberOfPersons : undefined,
        // Phase 7 — TA fields. Backend (car-rental/bookings/route.ts:218) checks
        // linkedTravelAgentId + taBookingMode='COMPANY' to route into b2b_bookings.
        ...(isTravelAgentCustomer(customer) && {
          taBookingMode: taState.mode,
          // For TA COMPANY, override the B2B numberOfVehicles set above.
          numberOfVehicles: taState.mode === 'COMPANY'
            ? (parseInt(taState.vehicleCount) || 1)
            : 1,
          numberOfEmployees: taState.mode === 'COMPANY' && taState.employeeCount
            ? parseInt(taState.employeeCount)
            : null,
        }),
      };

      if (tripType === 'local') {
        bookingData.packageId = selectedPackage?.id;
        bookingData.packageName = selectedPackage?.name;
        bookingData.estimatedKm = selectedPackage?.kms;
        bookingData.estimatedHours = selectedPackage?.hours;
      } else {
        bookingData.dropCity = toLocation?.name;
        bookingData.dropAddress = toLocation?.name;
        if ((tripType === 'one_way' || tripType === 'round_trip') && multiStops.length > 0) {
          bookingData.intermediateStops = JSON.stringify(
            multiStops.filter(s => s.locationId || s.name).map(s => ({
              locationId: s.locationId,
              cityText: s.name || s.query,
            }))
          );
        }
        if (tripType === 'round_trip') {
          bookingData.returnDate = returnDate.toISOString().split('T')[0];
        }
        if (tripType === 'airport') {
          bookingData.airportType = airportDirection;
        }
      }

      const response = await bookingService.createChauffeurBooking(bookingData);

      if (response.success || response.booking) {
        const bookingDbId = response.booking?.id;
        const bookingNumber = response.booking?.bookingNumber || bookingDbId;

        // Reset B2B fields
        setBookingFor('personal');
        setNumberOfVehicles('1');
        setNumberOfPersons('');

        // Phase 7 — Travel-agent COMPANY booking (car-rental/bookings/route.ts:248)
        // creates a row in b2b_bookings. Skip payment + go straight to the B2B
        // detail screen (no upfront payment for TA company bookings).
        if (response.isTravelAgent && response.bookingMode === 'COMPANY' && bookingDbId) {
          navigation.navigate('B2BBookingDetail', { bookingId: bookingDbId });
        } else if (bookingFor === 'company' && isB2BCustomer) {
          // B2B company booking → post-paid, skip payment, go directly to confirmation
          navigation.navigate('BookingConfirmation', {
            booking_id: bookingNumber,
            bookingType: 'chauffeur',
          });
        } else {
          navigation.navigate('PaymentScreen', {
            bookingId: bookingDbId,
            bookingType: 'chauffeur',
            amount: advanceAmount,
            bookingNumber,
          });
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.log('Booking error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMultiStops = () => {
    if (tripType !== 'one_way' && tripType !== 'round_trip') return null;

    return (
      <View style={{ marginTop: 8 }}>
        {multiStops.map((stop, index) => (
          <View key={stop.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.inputLabel, { flex: 1, marginBottom: 0 }]}>Stop {index + 1}</Text>
              <TouchableOpacity onPress={() => removeStop(stop.id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="ellipse-outline" size={16} color="#F59E0B" />
              <TextInput
                style={styles.locationInput}
                value={stop.query || stop.name || ''}
                onChangeText={(text) => updateStopQuery(stop.id, text)}
                onFocus={() => setMultiStops(prev => prev.map(s => s.id === stop.id ? { ...s, showSuggestions: true } : s))}
                placeholder="Via city..."
                placeholderTextColor="#94A3B8"
              />
              {stop.name ? (
                <Ionicons name="checkmark-circle" size={18} color="#09B368" />
              ) : null}
            </View>
            {stop.showSuggestions && (() => {
              // Get previous stop or fromLocation for proximity
              const prevLoc = index === 0 ? fromLocation : (multiStops[index - 1]?.locationId ? allLocations.find(l => l.id === multiStops[index - 1].locationId) : fromLocation);
              const trimmedStopQuery = (stop.query || '').trim();
              let stopSuggestions = allLocations.filter(loc => {
                if (fromLocation && loc.id === fromLocation.id) return false;
                if (!trimmedStopQuery) return true;
                return loc.name.toLowerCase().includes(trimmedStopQuery.toLowerCase());
              });
              // Sort by proximity to previous stop
              if (prevLoc?.latitude && prevLoc?.longitude) {
                stopSuggestions = stopSuggestions.map(loc => ({
                  ...loc,
                  _distance: (loc.latitude && loc.longitude)
                    ? Math.round(haversineKm(prevLoc.latitude, prevLoc.longitude, loc.latitude, loc.longitude))
                    : 99999,
                })).sort((a, b) => a._distance - b._distance);
              }
              return stopSuggestions.length > 0 ? (
                <View style={styles.inlineSuggestions}>
                  {prevLoc?.latitude && !stop.query && (
                    <View style={styles.nearbyHeader}>
                      <Ionicons name="navigate-outline" size={12} color="#F59E0B" />
                      <Text style={styles.nearbyHeaderText}>Nearby to {prevLoc.name || 'pickup'}</Text>
                    </View>
                  )}
                  {stopSuggestions.slice(0, 8).map(loc => (
                    <TouchableOpacity
                      key={loc.id}
                      style={styles.suggestionItem}
                      onPress={() => selectStopLocation(stop.id, loc)}
                    >
                      <Ionicons name="location" size={16} color={typeof loc._distance === 'number' && loc._distance < 200 ? '#F59E0B' : '#64748B'} />
                      <Text style={[styles.suggestionText, { flex: 1 }]}>{loc.name}</Text>
                      {typeof loc._distance === 'number' && loc._distance < 5000 && (
                        <Text style={styles.distanceBadge}>~{loc._distance} km</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null;
            })()}
          </View>
        ))}

        <TouchableOpacity
          onPress={addStop}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 4,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
          <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Add Stop</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Same search/select logic as before — just a compact "route field" row
  // (label + value) instead of its own bordered box with a pin icon, since
  // the route-card's dot/line on the left now carries that meaning.
  const renderLocationField = (target, { isLast } = {}) => {
    const isFrom = target === 'from';
    const location = isFrom ? fromLocation : toLocation;
    const query = isFrom ? fromQuery : toQuery;
    const setQuery = isFrom ? setFromQuery : setToQuery;
    const showSuggestions = isFrom ? showFromSuggestions : showToSuggestions;
    const setShowSuggestions = isFrom ? setShowFromSuggestions : setShowToSuggestions;

    // Determine if this should show airports
    const showAirports = tripType === 'airport' && (
      (airportDirection === 'pickup' && isFrom) ||
      (airportDirection === 'drop' && !isFrom)
    );

    // Only run the filter/sort (it re-sorts the whole city list by distance)
    // when the dropdown is actually visible — this used to run on every
    // render of the step, even with the dropdown closed.
    const suggestions = showSuggestions ? filteredLocations(query, showAirports) : [];

    return (
      <View style={[styles.rfield, isLast && styles.rfieldLast]}>
        <Text style={styles.rfieldLabel}>
          {isFrom ? 'Pickup' : 'Drop'} {showAirports ? '· Airport' : ''}
        </Text>
        <View style={styles.rfieldInputRow}>
          <TextInput
            style={styles.rfieldInput}
            value={query || location?.name || ''}
            onChangeText={(text) => {
              setQuery(text);
              if (isFrom) setFromLocation(null);
              else setToLocation(null);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={showAirports ? 'Select airport' : 'Select city'}
            placeholderTextColor="#94A3B8"
          />
          {location && (
            <TouchableOpacity onPress={() => {
              if (isFrom) setFromLocation(null);
              else setToLocation(null);
            }}>
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.inlineSuggestions}>
            {!isFrom && fromLocation?.latitude && !query && (
              <View style={styles.nearbyHeader}>
                <Ionicons name="navigate-outline" size={12} color="#2563EB" />
                <Text style={styles.nearbyHeaderText}>Nearby cities first</Text>
              </View>
            )}
            {suggestions.slice(0, 8).map((loc, idx) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.suggestionItem}
                onPress={() => handleLocationSelect(loc, target)}
              >
                <Ionicons
                  name={loc.type === 'airport' ? 'airplane-outline' : 'location'}
                  size={16}
                  color={typeof loc._distance === 'number' && loc._distance < 200 ? '#2563EB' : '#64748B'}
                />
                <Text style={[styles.suggestionText, { flex: 1 }]}>{loc.name}</Text>
                {typeof loc._distance === 'number' && loc._distance < 5000 && (
                  <Text style={styles.distanceBadge}>~{loc._distance} km</Text>
                )}
                {loc.code ? <Text style={styles.suggestionCode}>{loc.code}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // New — swaps pickup/drop, used by the route-card's swap button.
  const swapLocations = () => {
    const prevFromLoc = fromLocation;
    const prevFromQuery = fromQuery;
    setFromLocation(toLocation);
    setFromQuery(toQuery);
    setToLocation(prevFromLoc);
    setToQuery(prevFromQuery);
  };

  const renderPackageSelector = () => {
    // Group packages by vehicle category
    const packagesByCategory = {};
    localPackages.forEach(pkg => {
      const catId = pkg.vehicleCategoryId;
      if (!packagesByCategory[catId]) packagesByCategory[catId] = [];
      packagesByCategory[catId].push(pkg);
    });

    // Get unique packages (one per hours/km combo)
    const uniquePackages = [];
    const seen = new Set();
    localPackages.forEach(pkg => {
      const key = `${pkg.hours}-${pkg.kms}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePackages.push(pkg);
      }
    });

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Select Package</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {uniquePackages.map((pkg) => {
            const isSelected = selectedPackage?.hours === pkg.hours && selectedPackage?.kms === pkg.kms;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageChip, isSelected && styles.packageChipSelected]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <Text style={[styles.packageName, isSelected && styles.packageNameSelected]}>
                  {pkg.hours}hr / {pkg.kms}km
                </Text>
                {pkg.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderVehicleCard = (vehicle) => {
    const vehiclePrice = pricing[vehicle.id];
    const isSelected = selectedVehicle?.id === vehicle.id;
    const isAvailable = vehiclePrice && vehiclePrice.totalBeforeGst > 0;

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[
          styles.vehicleCard,
          isSelected && styles.vehicleCardSelected,
          !isAvailable && styles.vehicleCardUnavailable
        ]}
        onPress={() => isAvailable && setSelectedVehicle(vehicle)}
        activeOpacity={isAvailable ? 0.9 : 1}
        disabled={!isAvailable}
      >
        <View style={styles.vehicleCardTop}>
          <View style={styles.vehicleImageWrap}>
            {vehicle.image ? (
              <Image
                source={{ uri: `${BASE_URL}${vehicle.image}` }}
                style={styles.vehicleImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons name="car" size={42} color="#CBD5E1" />
            )}
          </View>

          <View style={styles.vehicleMainInfo}>
            <Text style={styles.vehicleType}>{vehicle.name.includes('Sedan') ? 'Standard' : 'Premium'}</Text>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>

            <View style={styles.vehicleStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>{vehicle.seatingCapacity}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="briefcase-outline" size={14} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>{vehicle.luggageCapacity || '2-3'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="snow-outline" size={14} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>AC</Text>
              </View>
            </View>
          </View>
        </View>

        {vehicle.exampleVehicles && (Array.isArray(vehicle.exampleVehicles) ? vehicle.exampleVehicles : []).length > 0 && (
          <Text style={styles.vehicleExamples}>
            Example: {(Array.isArray(vehicle.exampleVehicles) ? vehicle.exampleVehicles : []).join(', ')}
          </Text>
        )}

        <View style={styles.vehicleFooter}>
          {isAvailable ? (
            <>
              <View style={styles.priceBadge}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.vehiclePrice}>
                  {vehiclePrice.totalBeforeGst?.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.inclusiveLabel}>
                {vehiclePrice.totalKm || 0} km · Incl. driver
              </Text>
            </>
          ) : (
            <View style={styles.unavailableBadge}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.unavailableText}>Route Not Available</Text>
            </View>
          )}
        </View>

        {/* Route Breakdown - show when selected */}
        {isSelected && isAvailable && (
          <View style={styles.breakdownWrap}>
            {/* Route legs */}
            {vehiclePrice.legs?.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownSectionTitle}>Route Breakdown</Text>
                {vehiclePrice.legs.map((leg, i) => (
                  <View key={i} style={styles.breakdownLegRow}>
                    <Ionicons name="arrow-forward" size={12} color={BRAND_TEAL} />
                    <Text style={styles.breakdownLegText}>{leg.from} → {leg.to}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Min km info */}
            {vehiclePrice.minKmPerDay && (
              <View style={styles.breakdownMinKm}>
                <Ionicons name="information-circle-outline" size={14} color="#F59E0B" />
                <Text style={styles.breakdownMinKmText}>
                  Minimum {vehiclePrice.totalKm} km charged for {vehiclePrice.days || 1} day{(vehiclePrice.days || 1) > 1 ? 's' : ''} ({vehiclePrice.minKmPerDay} km/day). Extra km beyond this will be charged at ₹{vehiclePrice.perKmRate}/km.
                </Text>
              </View>
            )}

            {/* Price breakdown */}
            <View style={styles.breakdownSection}>
              {typeof vehiclePrice.perKmRate === 'number' && vehiclePrice.perKmRate > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Distance ({vehiclePrice.totalKm} km × ₹{vehiclePrice.perKmRate}/km)</Text>
                  <Text style={styles.breakdownValue}>₹{(vehiclePrice.totalKm * vehiclePrice.perKmRate)?.toLocaleString()}</Text>
                </View>
              )}
              {vehiclePrice.driverAllowance > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Driver allowance {(vehiclePrice.days || 1) > 1
                      ? `(₹${vehiclePrice.driverAllowancePerDay || vehiclePrice.driverAllowance}/day × ${vehiclePrice.days}d)`
                      : `(${vehiclePrice.days || 1}d)`}
                  </Text>
                  <Text style={styles.breakdownValue}>₹{vehiclePrice.driverAllowance?.toLocaleString()}</Text>
                </View>
              )}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Toll/Parking</Text>
                <Text style={[styles.breakdownValue, { color: '#64748B' }]}>Extra (as applicable)</Text>
              </View>
              <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }]}>
                <Text style={[styles.breakdownLabel, { fontWeight: '700', color: '#0F172A' }]}>Total</Text>
                <Text style={[styles.breakdownValue, { fontWeight: '700', color: BRAND_TEAL }]}>₹{vehiclePrice.totalBeforeGst?.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.selectedBadgeText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} nestedScrollEnabled keyboardDismissMode="on-drag">
      {/* Trip type — small tabs instead of a colour hero + icon grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingRight: 16 }}>
        {TRIP_TYPES.map((type) => {
          const isActive = tripType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                setTripType(type.id);
                setFromLocation(null);
                setToLocation(null);
                setSelectedPackage(null);
                setMultiStops([]);
              }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Route card — pickup/drop as a dot-and-line "journey" instead of two
          separate boxed inputs, matching the approved mockup. */}
      <View style={styles.routeWrap}>
        <View style={styles.routeCard}>
          <View style={styles.routeTrack}>
            <View style={styles.routeDots}>
              <View style={styles.rdot} />
              {tripType !== 'local' && <View style={styles.rline} />}
              {tripType !== 'local' && <View style={[styles.rdot, styles.rdotHollow]} />}
            </View>
            <View style={styles.routeFields}>
              {renderLocationField('from', { isLast: tripType === 'local' })}
              {tripType !== 'local' && renderLocationField('to', { isLast: true })}
            </View>
          </View>
          {tripType !== 'local' && (
            <TouchableOpacity style={styles.swapBtn} onPress={swapLocations}>
              <Icon name="repeat" size={14} color={BRAND_TEAL} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Local trip note */}
      {tripType === 'local' && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8, padding: 10, marginHorizontal: 4, marginBottom: 8 }}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>⚠️</Text>
          <Text style={{ flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 }}>
            <Text style={{ fontWeight: '700' }}>Local packages are for within-city travel only.</Text>
            {' '}For travel to another city (e.g. Ahmedabad to Surat), please use the{' '}
            <Text style={{ fontWeight: '700' }}>Outstation</Text> tab.
          </Text>
        </View>
      )}

      {/* Airport Direction (only for airport trips) */}
      {tripType === 'airport' && (
        <View style={styles.airportDirectionWrap}>
          {AIRPORT_DIRECTIONS.map((dir) => (
            <TouchableOpacity
              key={dir.id}
              style={[
                styles.airportDirCard,
                airportDirection === dir.id && styles.airportDirCardActive,
              ]}
              onPress={() => setAirportDirection(dir.id)}
            >
              <MaterialCommunityIcons
                name={dir.icon}
                size={22}
                color={airportDirection === dir.id ? GREEN : '#64748B'}
              />
              <Text style={[
                styles.airportDirLabel,
                airportDirection === dir.id && styles.airportDirLabelActive,
              ]}>
                {dir.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Via Stops — same multi-stop UI/logic as before, now sits below the
          route card instead of being sandwiched between the two fields. */}
      {(tripType === 'one_way' || tripType === 'round_trip') && (
        <View style={styles.locationsSection}>
          {renderMultiStops()}
        </View>
      )}

      {/* Package Selector (for local trips) */}
      {tripType === 'local' && loadingPackages && (
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <ActivityIndicator size="small" color={BRAND_TEAL} />
        </View>
      )}
      {tripType === 'local' && !loadingPackages && localPackages.length > 0 && renderPackageSelector()}

      {/* Date & Time */}
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateCard} onPress={() => openDatePicker('pickup')}>
          <Text style={styles.dateLabel}>PICKUP DATE</Text>
          <View style={styles.dateContent}>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.dateValue}>
              {pickupDate.toLocaleDateString('en-US', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </Text>
          </View>
        </TouchableOpacity>

        {tripType === 'round_trip' && (
          <TouchableOpacity style={styles.dateCard} onPress={() => openDatePicker('return')}>
            <Text style={styles.dateLabel}>RETURN DATE</Text>
            <View style={styles.dateContent}>
              <Ionicons name="calendar-outline" size={16} color="#0F172A" />
              <Text style={styles.dateValue}>
                {returnDate.toLocaleDateString('en-US', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.timeCard} onPress={openTimePicker}>
          <Text style={styles.dateLabel}>TIME</Text>
          <View style={styles.dateContent}>
            <Ionicons name="time-outline" size={16} color="#0F172A" />
            <Text style={styles.dateValue}>{pickupTime}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* KM Approximation Note */}
      {(fromLocation || toLocation) && tripType !== 'local' && (
        <View style={[styles.kmNote, { marginTop: 12 }]}>
          <Ionicons name="information-circle" size={15} color="#F59E0B" />
          <Text style={styles.kmNoteText}>
            Distances shown (~km) are approximate and may vary from actual road distance. Final billing will be based on actual km travelled.
          </Text>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const getRouteDisplay = () => {
    if (tripType === 'local') return `${selectedPackage?.hours}hr / ${selectedPackage?.kms}km`;
    const stops = multiStops.filter(s => s.name);
    const parts = [fromLocation?.name];
    stops.forEach(s => parts.push(s.name));
    parts.push(toLocation?.name);
    return parts.filter(Boolean).join('  →  ');
  };

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.routeInfoBox}>
        <Text style={styles.routeInfoTitle}>Select Vehicle</Text>
        <View style={styles.routeDisplay}>
          <Ionicons name="navigate-outline" size={14} color={BRAND_TEAL} />
          <Text style={styles.routeDisplayText} numberOfLines={2}>{getRouteDisplay()}</Text>
        </View>
        <View style={styles.routeMeta}>
          <View style={styles.routeMetaItem}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.routeMetaText}>
              {pickupDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
            </Text>
          </View>
          <View style={styles.routeMetaItem}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.routeMetaText}>{pickupTime || '10:00'}</Text>
          </View>
          {tripType === 'round_trip' && (
            <View style={styles.routeMetaItem}>
              <Ionicons name="return-down-back-outline" size={13} color="#64748B" />
              <Text style={styles.routeMetaText}>
                Return: {returnDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
          {multiStops.filter(s => s.name).length > 0 && (
            <View style={styles.routeMetaItem}>
              <Ionicons name="git-branch-outline" size={13} color="#F59E0B" />
              <Text style={styles.routeMetaText}>{multiStops.filter(s => s.name).length} stop(s)</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {loadingPrices ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND_TEAL} />
            <Text style={styles.loadingText}>Fetching best prices...</Text>
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {vehicleCategories
              .filter(v => v.isActive)
              .sort((a, b) => {
                const aAvailable = pricing[a.id] && pricing[a.id].totalBeforeGst > 0 ? 1 : 0;
                const bAvailable = pricing[b.id] && pricing[b.id].totalBeforeGst > 0 ? 1 : 0;
                return bAvailable - aAvailable;
              })
              .map(renderVehicleCard)}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={[styles.vehicleImageWrap, { width: 60, height: 40, marginRight: 12 }]}>
            <MaterialCommunityIcons name="car-hatchback" size={32} color={BRAND_TEAL} />
          </View>
          <View>
            <Text style={styles.summaryTitle}>{selectedVehicle?.name}</Text>
            <Text style={styles.summaryLabel}>{selectedVehicle?.seatingCapacity} Seating Capacity</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Trip Type</Text>
          <Text style={styles.summaryValue}>{tripType.charAt(0).toUpperCase() + tripType.slice(1)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pickup</Text>
          <Text style={styles.summaryValue}>{fromLocation?.name}</Text>
        </View>
        {tripType !== 'local' && multiStops.filter(s => s.name).length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Via Stops</Text>
            <Text style={styles.summaryValue}>{multiStops.filter(s => s.name).map(s => s.name).join(' → ')}</Text>
          </View>
        )}
        {tripType !== 'local' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Drop</Text>
            <Text style={styles.summaryValue}>{toLocation?.name}</Text>
          </View>
        )}
        {tripType === 'local' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Package</Text>
            <Text style={styles.summaryValue}>{selectedPackage?.hours}hr / {selectedPackage?.kms}km</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date & Time</Text>
          <Text style={styles.summaryValue}>
            {pickupDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} | {pickupTime}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Fare</Text>
          <Text style={styles.totalValue}>₹{pricing[selectedVehicle?.id]?.totalBeforeGst?.toLocaleString() || '--'}</Text>
        </View>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Customer Details</Text>
        <View style={styles.contactRow}>
          <Ionicons name="person-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.contactValue}>{customer?.name}</Text>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.contactValue}>{customer?.phone}</Text>
        </View>
      </View>

      {/* Phase 7 — TA Personal/Company toggle (self-gated; only renders for TA). */}
      <TravelAgentBookingToggle value={taState} onChange={setTaState} />

      {/* B2B: Personal vs Company — only for approved B2B customers */}
      {isB2BCustomer && (
        <View style={styles.b2bSection}>
          <Text style={styles.contactTitle}>Booking For</Text>
          <View style={styles.b2bToggle}>
            <TouchableOpacity
              style={[styles.b2bBtn, bookingFor === 'personal' && styles.b2bBtnActive]}
              onPress={() => setBookingFor('personal')}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={16} color={bookingFor === 'personal' ? '#fff' : GREEN} />
              <Text style={[styles.b2bBtnText, bookingFor === 'personal' && styles.b2bBtnTextActive]}>Personal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.b2bBtn, bookingFor === 'company' && styles.b2bBtnActive]}
              onPress={() => setBookingFor('company')}
              activeOpacity={0.7}
            >
              <Ionicons name="business" size={16} color={bookingFor === 'company' ? '#fff' : GREEN} />
              <Text style={[styles.b2bBtnText, bookingFor === 'company' && styles.b2bBtnTextActive]}>For Company</Text>
            </TouchableOpacity>
          </View>

          {bookingFor === 'company' && (
            <View style={styles.b2bFieldsWrap}>
              <View style={styles.b2bFieldRow}>
                <View style={styles.b2bField}>
                  <Text style={styles.b2bFieldLabel}>No. of Vehicles *</Text>
                  <View style={styles.b2bInputWrap}>
                    <TouchableOpacity
                      style={styles.b2bStepBtn}
                      onPress={() => setNumberOfVehicles(String(Math.max(1, parseInt(numberOfVehicles || '1') - 1)))}
                    >
                      <Ionicons name="remove" size={16} color={GREEN} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.b2bInput}
                      value={numberOfVehicles}
                      onChangeText={(t) => setNumberOfVehicles(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      textAlign="center"
                      maxLength={3}
                    />
                    <TouchableOpacity
                      style={styles.b2bStepBtn}
                      onPress={() => setNumberOfVehicles(String(Math.min(500, parseInt(numberOfVehicles || '1') + 1)))}
                    >
                      <Ionicons name="add" size={16} color={GREEN} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.b2bField}>
                  <Text style={styles.b2bFieldLabel}>No. of Persons</Text>
                  <View style={styles.b2bInputWrap}>
                    <TextInput
                      style={[styles.b2bInput, { flex: 1 }]}
                      value={numberOfPersons}
                      onChangeText={(t) => setNumberOfPersons(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="Optional"
                      placeholderTextColor={TEXT_SECONDARY}
                      textAlign="center"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.b2bInfoPill}>
                <Ionicons name="information-circle" size={15} color={GREEN} />
                <Text style={styles.b2bInfoText}>Company booking — post-paid billing, no advance required</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );



  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      {/* Header — plain/white; the teal "hero" moment already lives in the
          Step 1 heroWrapper below, so the header stays quiet to not clash. */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Car Rental' : step === 2 ? 'Select Vehicle' : 'Confirm Booking'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyCarBookings')}
            style={styles.myBookingsBtn}
          >
            <Ionicons name="document-text-outline" size={18} color={BRAND_TEAL} />
          </TouchableOpacity>
        </View>

        {/* Steps Indicator */}
        <View style={styles.stepsRow}>
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  {step > s ? (
                    <Icon name="check" size={13} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                  {s === 1 ? 'Details' : s === 2 ? 'Vehicle' : 'Confirm'}
                </Text>
              </View>
              {s < 3 && <View style={[styles.stepConnector, step > s && styles.stepConnectorActive]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, (submitting || loadingPrices) && styles.nextBtnDisabled]}
          onPress={() => {
            if (step === 3) handleBooking();
            else handleNext();
          }}
          disabled={submitting || loadingPrices}
        >
          {submitting || loadingPrices ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === 3 ? (bookingFor === 'company' && isB2BCustomer ? 'Create Booking' : 'Proceed to Payment') : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* iOS Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContent}>
              <DateTimePicker
                value={datePickerTarget === 'pickup' ? pickupDate : returnDate}
                mode="date"
                display="spinner"
                minimumDate={datePickerTarget === 'pickup' ? getMinBookingDate() : pickupDate}
                onChange={(event, date) => {
                  if (date) {
                    if (datePickerTarget === 'pickup') {
                      setPickupDate(date);
                    } else {
                      setReturnDate(date);
                    }
                  }
                }}
              />
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.pickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerGradient: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myBookingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0F172A' },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  stepItem: { alignItems: 'center', width: 64 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepCircleActive: { backgroundColor: GREEN },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontSize: 10.5, color: '#94A3B8', fontWeight: '600' },
  stepLabelActive: { color: GREEN, fontWeight: '800' },
  stepConnector: {
    height: 1.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 13,
    marginHorizontal: -12,
  },
  stepConnectorActive: { backgroundColor: GREEN },

  // Content
  stepContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  routeInfoBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  routeInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  routeDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  routeDisplayText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    lineHeight: 18,
  },
  routeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Trip type tabs
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 14,
  },
  tab: {
    flexShrink: 0,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: BRAND_TEAL,
    borderColor: BRAND_TEAL,
  },
  tabText: { fontSize: 12.5, fontWeight: '700', color: TEXT_SECONDARY },
  tabTextActive: { color: '#fff' },

  // Route card — pickup/drop as a connected dot-and-line "journey"
  routeWrap: { marginBottom: 12 },
  routeCard: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  routeTrack: { flexDirection: 'row' },
  routeDots: { width: 18, alignItems: 'center', paddingTop: 6 },
  rdot: { width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND_TEAL, flexShrink: 0 },
  rdotHollow: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#94A3B8' },
  rline: { width: 1.5, flex: 1, minHeight: 20, backgroundColor: '#E2E8F0', marginVertical: 3 },
  routeFields: { flex: 1, marginLeft: 10 },
  rfield: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  rfieldLast: { borderBottomWidth: 0 },
  rfieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 2,
  },
  rfieldInputRow: { flexDirection: 'row', alignItems: 'center' },
  rfieldInput: { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, padding: 0 },
  swapBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EBFBF3',
    borderWidth: 1,
    borderColor: '#CFEFDD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Airport Direction
  airportDirectionWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  airportDirCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  airportDirCardActive: {
    borderColor: GREEN,
    backgroundColor: 'rgba(9, 179, 104, 0.05)',
  },
  airportDirLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  airportDirLabelActive: { color: GREEN },

  // Location Inputs
  locationsSection: { marginBottom: 16 },
  inputGroup: { marginBottom: 16, position: 'relative', zIndex: 10 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 50,
    gap: 10,
  },
  locationInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inlineSuggestions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  suggestionText: { flex: 1, fontSize: 14, color: '#0F172A' },
  suggestionCode: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  distanceBadge: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  nearbyHeaderText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Package Selector
  packageChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    alignItems: 'center',
  },
  packageChipSelected: {
    borderColor: GREEN,
    backgroundColor: 'rgba(9, 179, 104, 0.05)',
  },
  packageName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  packageNameSelected: { color: GREEN },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  popularText: { fontSize: 10, color: '#D97706', fontWeight: '600' },

  // Date/Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  timeCard: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  // Vehicle Cards
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: TEXT_SECONDARY },
  vehicleList: { gap: 16, padding: 16 },
  vehicleCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  vehicleCardSelected: {
    borderColor: BRAND_TEAL,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    elevation: 6,
    shadowOpacity: 0.1,
  },
  vehicleCardUnavailable: {
    opacity: 0.45,
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleImageWrap: {
    width: 90,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginRight: 14,
  },
  vehicleImage: { width: 80, height: 55 },
  vehicleMainInfo: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 2 },
  vehicleType: { fontSize: 11, color: BRAND_TEAL, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  vehicleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '500' },

  vehicleExamples: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },

  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currency: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  vehiclePrice: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY },
  priceUnit: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },

  inclusiveLabel: {
    fontSize: 11,
    color: BRAND_TEAL,
    fontWeight: '600',
    backgroundColor: 'rgba(9, 179, 104, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },

  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND_TEAL,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Route Breakdown
  breakdownWrap: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  breakdownSection: {
    marginBottom: 10,
  },
  breakdownSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  breakdownLegText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  breakdownMinKm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  breakdownMinKmText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceValue: { fontSize: 14, color: '#0F172A' },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalValue: { fontSize: 18, fontWeight: '700', color: GREEN },

  // Contact Card
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactValue: { fontSize: 14, color: '#64748B' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  kmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  kmNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Picker Modal
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerDoneBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  pickerDoneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // B2B Section
  b2bSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  b2bToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 10,
  },
  b2bBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  b2bBtnActive: {
    backgroundColor: GREEN,
    elevation: 2,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  b2bBtnText: { fontSize: 13, fontWeight: '600', color: GREEN },
  b2bBtnTextActive: { color: '#fff' },
  b2bFieldsWrap: { marginTop: 14 },
  b2bFieldRow: { flexDirection: 'row', gap: 12 },
  b2bField: { flex: 1 },
  b2bFieldLabel: { fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 6 },
  b2bInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(9,179,104,0.2)',
    overflow: 'hidden',
    minHeight: 44,
  },
  b2bStepBtn: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.08)',
  },
  b2bInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  b2bInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(9,179,104,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  b2bInfoText: { fontSize: 12, color: '#065f46', fontWeight: '500', flex: 1 },
});
