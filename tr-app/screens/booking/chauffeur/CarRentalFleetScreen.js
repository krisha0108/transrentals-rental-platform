import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { locationService, bookingService } from '../../services';
import b2bService from '../../services/b2bService';
import { BASE_URL } from '../../api';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 360;

/* ── Premium Dark Teal Design System ── */
const TEAL_DEEP = '#064E3B';
const TEAL_MID = '#065F46';
const TEAL = '#10B981';
const TEAL_LIGHT = '#D1FAE5';
const BG = '#F5F7FA';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';
const DIVIDER = '#F3F4F6';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 14 },
  android: { elevation: 6 },
});
const SHADOW_LG = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 20 },
  android: { elevation: 10 },
});
const SHADOW_TEAL = Platform.select({
  ios: { shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 12 },
  android: { elevation: 8 },
});

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
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customer
  const [customer, setCustomer] = useState(null);

  // B2B booking
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState('personal'); // 'personal' | 'company'
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');
  const [numberOfPersons, setNumberOfPersons] = useState('');

  // Custom Alert Modal
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '', onClose: null });
  const showAlert = (type, title, message, onClose = null) => {
    setAlertModal({ visible: true, type, title, message, onClose });
  };
  const closeAlert = () => {
    const cb = alertModal.onClose;
    setAlertModal({ visible: false, type: '', title: '', message: '', onClose: null });
    if (cb) cb();
  };

  // Payment details
  const [bankDetails, setBankDetails] = useState(null);

  // Booking confirmation tracking
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  // Step management
  const [step, setStep] = useState(1); // 1: Trip details, 2: Select vehicle, 3: Confirm

  // Search & Filter for Step 2
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(null);
  const [acFilter, setAcFilter] = useState(null); // null = All, 'AC', 'Non-AC'
  const [seaterFilter, setSeaterFilter] = useState(null); // null = All, or a number
  const [priceSortOrder, setPriceSortOrder] = useState(null);

  // ScrollView ref for keyboard handling
  const scrollViewRef = useRef(null);
  const fromInputRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (tripType === 'local' && fromLocation && localPackages.length === 0) {
      fetchLocalPackages();
    }
  }, [tripType, fromLocation]);

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
  }, [step, navigation]);

  const loadInitialData = async () => {
    try {
      const [customerData, locationsRes, categoriesRes, bankDetailsRes] = await Promise.all([
        AsyncStorage.getItem('customer'),
        locationService.getLocations('CITY', true),
        bookingService.getChauffeurVehicleCategories(),
        fetch(`${BASE_URL}/api/payment-details?service=car-rental`).then(r => r.json()),
      ]);

      if (customerData) {
        const cust = JSON.parse(customerData);
        setCustomer(cust);
        if (cust?.isB2B && cust?.b2bStatus === 'APPROVED') {
          setIsB2BCustomer(true);
        }
      }

      if (locationsRes.success) {
        const locs = locationsRes.locations || [];
        setAllLocations(locs);
        setAirports(locs.filter(l => l.type === 'AIRPORT' || l.isAirport));
      }

      if (categoriesRes.success) {
        setVehicleCategories(categoriesRes.categories || []);
      }

      if (bankDetailsRes.success && bankDetailsRes.primaryAccount) {
        setBankDetails(bankDetailsRes.primaryAccount);
      }
    } catch (error) {
      console.log('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalPackages = async () => {
    try {
      const res = await bookingService.getChauffeurLocalPackages();
      if (res.success) {
        setLocalPackages(res.packages || []);
      }
    } catch (error) {
      console.log('Error fetching local packages:', error);
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
              const pkg = localPackages.find(p =>
                p.vehicleCategoryId === category.id &&
                p.hours === selectedPackage?.hours &&
                p.kms === selectedPackage?.kms
              );

              if (pkg) {
                params.packageId = pkg.id;
              } else {
                const catPkg = localPackages.find(p => p.vehicleCategoryId === category.id);
                if (catPkg) params.packageId = catPkg.id;
              }
            } else {
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
    } else {
      setToLocation(loc);
      setToQuery('');
      setShowToSuggestions(false);
    }
  };

  const filteredLocations = (query, isAirport = false) => {
    const source = isAirport ? airports : allLocations;
    if (!query.length) return source.slice(0, 20);
    return source.filter(l =>
      l.name?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20);
  };

  const openDatePicker = (target) => {
    setDatePickerTarget(target);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: target === 'pickup' ? pickupDate : returnDate,
        mode: 'date',
        minimumDate: target === 'pickup' ? new Date() : pickupDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            if (target === 'pickup') {
              setPickupDate(date);
              if (returnDate < date) {
                setReturnDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
              }
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
        showAlert('error', 'Error', 'Please select pickup city');
        return false;
      }
      if (!selectedPackage) {
        showAlert('error', 'Error', 'Please select a package');
        return false;
      }
    } else {
      if (!fromLocation) {
        showAlert('error', 'Error', 'Please select pickup location');
        return false;
      }
      if (!toLocation) {
        showAlert('error', 'Error', 'Please select drop location');
        return false;
      }
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
        showAlert('error', 'Error', 'Please select a vehicle');
        return;
      }
      setStep(3);
    }
  };

  const handleBooking = async () => {
    if (!customer) {
      showAlert('error', 'Login Required', 'Please login to book');
      return;
    }

    // B2B company booking validation
    if (bookingPurpose === 'company') {
      const numVehicles = parseInt(numberOfVehicles);
      if (!numVehicles || numVehicles < 1 || numVehicles > 500) {
        showAlert('error', 'Error', 'Please enter valid number of vehicles (1-500)');
        return;
      }
    }

    setSubmitting(true);
    try {
      // B2B Company Booking Flow
      if (bookingPurpose === 'company' && isB2BCustomer) {
        const b2bData = {
          customerId: customer.id,
          serviceType: 'car',
          vehiclesRequired: parseInt(numberOfVehicles),
          passengerCount: numberOfPersons ? parseInt(numberOfPersons) : null,
          vehicleCategory: selectedVehicle?.name,
          pickupLocation: fromLocation?.name,
          dropLocation: tripType !== 'local' ? toLocation?.name : null,
          tripType: tripType === 'local' ? 'HOURLY' : tripType === 'one_way' ? 'ONE_WAY' : 'ROUND_TRIP',
          scheduledDate: pickupDate.toISOString().split('T')[0],
          scheduledTime: pickupTime,
          returnDate: tripType === 'round_trip' ? returnDate.toISOString().split('T')[0] : null,
          returnTime: tripType === 'round_trip' ? pickupTime : null,
        };

        const response = await b2bService.createBooking(b2bData);

        if (response.status === 'success' || response.booking) {
          showAlert('success', 'B2B Booking Created!', `Your booking ${response.booking?.bookingNumber || ''} has been submitted. Vendors will send quotes soon.`, () => navigation.replace('B2BDashboard'));
        } else {
          showAlert('error', 'Error', response.error || response.message || 'Failed to create B2B booking');
        }
        return;
      }

      // Regular Personal Booking Flow
      const vehiclePrice = pricing[selectedVehicle.id];

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
      };

      if (tripType === 'local') {
        bookingData.packageId = selectedPackage?.id;
        bookingData.packageName = selectedPackage?.name;
        bookingData.estimatedKm = selectedPackage?.kms;
        bookingData.estimatedHours = selectedPackage?.hours;
      } else {
        bookingData.dropCity = toLocation?.name;
        bookingData.dropAddress = toLocation?.name;
        if (tripType === 'round_trip') {
          bookingData.returnDate = returnDate.toISOString().split('T')[0];
        }
        if (tripType === 'airport') {
          bookingData.airportType = airportDirection;
        }
      }

      const response = await bookingService.createChauffeurBooking(bookingData);

      if (response.success || response.booking) {
        const bookingId = response.booking?.id || 'unknown';
        const advanceAmount = Math.round((vehiclePrice?.totalBeforeGst || 0) * 0.2);

        // Navigate to PaymentScreen for Razorpay payment
        navigation.replace('PaymentScreen', {
          bookingId,
          bookingType: 'chauffeur',
          amount: advanceAmount,
        });
      } else {
        showAlert('error', 'Error', response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.log('Booking error:', error);
      showAlert('error', 'Error', error?.response?.data?.message || error?.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render: Location Input ─── */
  const renderLocationInput = (target) => {
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

    const handleFocus = () => {
      setShowSuggestions(true);
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: isFrom ? width * 0.65 : width * 0.85, animated: true });
        }
      }, 100);
    };

    return (
      <View style={[styles.inputGroup, { zIndex: isFrom ? 20 : 10, elevation: isFrom ? 20 : 10 }]}>
        <Text style={styles.inputLabel}>
          {isFrom ? 'From' : 'To'} {showAirports ? '(Airport)' : '(City)'}
        </Text>
        <TouchableOpacity style={styles.locationRow} activeOpacity={0.9}>
          <View style={styles.locationIconWrap}>
            <Ionicons
              name={showAirports ? 'airplane-outline' : 'location-outline'}
              size={wp('4.2%')}
              color={TEAL}
            />
          </View>
          <TextInput
            ref={isFrom ? fromInputRef : null}
            style={styles.locationInput}
            value={query || location?.name || ''}
            onChangeText={(text) => {
              setQuery(text);
              if (isFrom) setFromLocation(null);
              else setToLocation(null);
              setShowSuggestions(true);
            }}
            onFocus={handleFocus}
            placeholder={showAirports ? 'Select airport' : 'Select city'}
            placeholderTextColor={TEXT_MUTED}
          />
          {location && (
            <TouchableOpacity onPress={() => {
              if (isFrom) setFromLocation(null);
              else setToLocation(null);
            }}>
              <Ionicons name="close-circle" size={wp('5%')} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showSuggestions && (
          <View
            style={styles.suggestionsBox}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.setNativeProps({ scrollEnabled: false });
              }
            }}
            onResponderRelease={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.setNativeProps({ scrollEnabled: true });
              }
            }}
            onResponderTerminate={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.setNativeProps({ scrollEnabled: true });
              }
            }}
          >
            <ScrollView
              style={{ maxHeight: height * 0.35 }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
              bounces={false}
            >
              {filteredLocations(query, showAirports).map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.suggestionItem}
                  onPress={() => handleLocationSelect(loc, target)}
                >
                  <Ionicons
                    name={loc.type === 'AIRPORT' || loc.isAirport ? 'airplane-outline' : 'location'}
                    size={wp('4%')}
                    color={TEXT_SECONDARY}
                  />
                  <Text style={styles.suggestionText}>{loc.displayName || loc.name}</Text>
                  {loc.code && <Text style={styles.suggestionCode}>{loc.code}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  /* ─── Render: Package Selector ─── */
  const renderPackageSelector = () => {
    const packagesByCategory = {};
    localPackages.forEach(pkg => {
      const catId = pkg.vehicleCategoryId;
      if (!packagesByCategory[catId]) packagesByCategory[catId] = [];
      packagesByCategory[catId].push(pkg);
    });

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

  /* ─── Filtered Vehicles (Step 2) ─── */
  const filteredVehicles = useMemo(() => {
    let vehicles = vehicleCategories.filter(v => v.isActive);

    if (vehicleSearchQuery.trim()) {
      const q = vehicleSearchQuery.trim().toLowerCase();
      vehicles = vehicles.filter(v => {
        const name = (v.name || '').toLowerCase();
        let exVeh = v.exampleVehicles;
        if (typeof exVeh === 'string') { try { exVeh = JSON.parse(exVeh); } catch(e) {} }
        const examples = Array.isArray(exVeh)
          ? exVeh.join(' ').toLowerCase()
          : (typeof exVeh === 'string' ? exVeh : '').toLowerCase();
        return name.includes(q) || examples.includes(q);
      });
    }

    if (vehicleTypeFilter) {
      vehicles = vehicles.filter(v => {
        const isStandard = v.name.includes('Sedan');
        return vehicleTypeFilter === 'Standard' ? isStandard : !isStandard;
      });
    }

    if (acFilter) {
      vehicles = vehicles.filter(v => {
        const isAC = v.acAvailable !== false; // default to AC if not specified
        return acFilter === 'AC' ? isAC : !isAC;
      });
    }

    if (seaterFilter) {
      vehicles = vehicles.filter(v => v.seatingCapacity === seaterFilter);
    }

    vehicles.sort((a, b) => {
      const aAvailable = pricing[a.id] && pricing[a.id].totalBeforeGst > 0;
      const bAvailable = pricing[b.id] && pricing[b.id].totalBeforeGst > 0;
      if (aAvailable && !bAvailable) return -1;
      if (!aAvailable && bAvailable) return 1;
      if (priceSortOrder && aAvailable && bAvailable) {
        const aPrice = pricing[a.id].totalBeforeGst;
        const bPrice = pricing[b.id].totalBeforeGst;
        if (priceSortOrder === 'low_to_high') return aPrice - bPrice;
        if (priceSortOrder === 'high_to_low') return bPrice - aPrice;
      }
      return 0;
    });

    return vehicles;
  }, [vehicleCategories, vehicleSearchQuery, vehicleTypeFilter, acFilter, seaterFilter, priceSortOrder, pricing]);

  /* ─── Render: Vehicle Card ─── */
  const [failedImages, setFailedImages] = useState({});
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpand = (vehicleId) => {
    setExpandedCards(prev => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  const renderVehicleCard = (vehicle) => {
    const vehiclePrice = pricing[vehicle.id];
    const isSelected = selectedVehicle?.id === vehicle.id;
    const isAvailable = vehiclePrice && vehiclePrice.totalBeforeGst > 0;
    const imageUrl = vehicle.image ? `${BASE_URL}${vehicle.image}` : null;
    const showImage = imageUrl && !failedImages[vehicle.id];
    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[
          styles.vehicleCard,
          isSelected && styles.vehicleCardSelected,
          !isAvailable && styles.vehicleCardUnavailable
        ]}
        onPress={() => isAvailable && setSelectedVehicle(isSelected ? null : vehicle)}
        activeOpacity={isAvailable ? 0.9 : 1}
        disabled={!isAvailable}
      >
        <View style={styles.vehicleCardTop}>
          <View style={[styles.vehicleImageWrap, isSelected && styles.vehicleImageWrapSelected]}>
            {showImage ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vehicleImage}
                resizeMode="contain"
                onError={() => setFailedImages(prev => ({ ...prev, [vehicle.id]: true }))}
              />
            ) : (
              <MaterialCommunityIcons name="car" size={wp('10%')} color="#CBD5E1" />
            )}
          </View>

          <View style={styles.vehicleMainInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>{vehicle.name}</Text>
              <View style={[styles.vehicleTypeBadge, vehicle.name.includes('Sedan') ? styles.badgeStandard : styles.badgePremium]}>
                <Text style={[styles.vehicleType, vehicle.name.includes('Sedan') ? styles.badgeStandardText : styles.badgePremiumText]}>
                  {vehicle.name.includes('Sedan') ? 'Standard' : 'Premium'}
                </Text>
              </View>
            </View>

            <View style={styles.vehicleStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>{vehicle.seatingCapacity}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="briefcase-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>{vehicle.luggageCapacity || '2-3'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="snow-outline" size={wp('3.5%')} color={TEXT_SECONDARY} />
                <Text style={styles.statText}>AC</Text>
              </View>
            </View>
          </View>
        </View>

        {vehicle.exampleVehicles && (() => {
          let examples = vehicle.exampleVehicles;
          if (typeof examples === 'string') {
            try { examples = JSON.parse(examples); } catch (e) { /* use as-is */ }
          }
          const text = Array.isArray(examples)
            ? examples.filter(e => typeof e === 'string' && e.trim()).join(', ')
            : (typeof examples === 'string' ? examples : '');
          return text ? (
            <Text style={styles.vehicleExamples}>{text}</Text>
          ) : null;
        })()}

        <View style={styles.vehicleFooter}>
          {isAvailable ? (
            <View style={{ flex: 1 }}>
              <View style={styles.priceRow}>
                <View style={styles.priceBadge}>
                  <Text style={[styles.currency, isSelected && styles.currencySelected]}>&#8377;</Text>
                  <Text style={[styles.vehiclePrice, isSelected && styles.vehiclePriceSelected]}>
                    {vehiclePrice.totalBeforeGst?.toLocaleString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('2%') }}>
                  <View style={styles.inclusiveBadge}>
                    <Ionicons name="checkmark-circle" size={wp('3.5%')} color={TEAL} />
                    <Text style={styles.inclusiveLabel}>All inclusive</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation && e.stopPropagation(); toggleCardExpand(vehicle.id); }}
                    style={styles.detailsToggle}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={expandedCards[vehicle.id] ? 'chevron-up' : 'chevron-down'}
                      size={wp('4%')}
                      color={TEAL_MID}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expandable Pricing Details */}
              {expandedCards[vehicle.id] && (
                <View style={styles.pricingDetails}>
                  {vehiclePrice.packageName && (
                    <View style={styles.pricingDetailRow}>
                      <Text style={styles.pricingDetailLabel}>Base fare ({vehiclePrice.hours}hr/{vehiclePrice.kms}km)</Text>
                      <Text style={styles.pricingDetailValue}>₹{vehiclePrice.basePrice?.toLocaleString() || vehiclePrice.totalBeforeGst?.toLocaleString()}</Text>
                    </View>
                  )}
                  {!vehiclePrice.packageName && vehiclePrice.baseKmCharge > 0 && (
                    <View style={styles.pricingDetailRow}>
                      <Text style={styles.pricingDetailLabel}>Base fare</Text>
                      <Text style={styles.pricingDetailValue}>₹{vehiclePrice.baseKmCharge?.toLocaleString()}</Text>
                    </View>
                  )}
                  {vehiclePrice.extraKmCharge > 0 && (
                    <View style={styles.pricingDetailRow}>
                      <Text style={styles.pricingDetailLabel}>Extra km charge</Text>
                      <Text style={styles.pricingDetailValue}>₹{vehiclePrice.extraKmCharge}/km</Text>
                    </View>
                  )}
                  {vehiclePrice.extraHourCharge > 0 && (
                    <View style={styles.pricingDetailRow}>
                      <Text style={styles.pricingDetailLabel}>Extra hour charge</Text>
                      <Text style={styles.pricingDetailValue}>₹{vehiclePrice.extraHourCharge}/hr</Text>
                    </View>
                  )}
                  {(vehiclePrice.perKmRate > 0 && !vehiclePrice.packageName) && (
                    <View style={styles.pricingDetailRow}>
                      <Text style={styles.pricingDetailLabel}>Per km rate</Text>
                      <Text style={styles.pricingDetailValue}>₹{vehiclePrice.perKmRate}/km</Text>
                    </View>
                  )}
                  <View style={styles.pricingDetailRow}>
                    <Text style={styles.pricingDetailLabel}>Toll/Parking</Text>
                    <Text style={styles.pricingDetailValue}>
                      {vehiclePrice.tollEstimate > 0 || vehiclePrice.tollsEstimate > 0
                        ? `₹${(vehiclePrice.tollEstimate || vehiclePrice.tollsEstimate)?.toLocaleString()}`
                        : 'Extra (as applicable)'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.unavailableBadge}>
              <Ionicons name="close-circle" size={wp('4%')} color="#EF4444" />
              <Text style={styles.unavailableText}>Route Not Available</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <LinearGradient colors={[TEAL, TEAL_MID]} style={styles.selectedBadgeGradient}>
              <Icon name="check" size={wp('4%')} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /* ─── Render: Step 1 — Trip Details ─── */
  const renderStep1 = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.stepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: hp('3%') }}
    >
      {/* Hero Section with Dark Teal Gradient */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrapper}
      >
        <View style={[styles.heroDecoCircle, { top: -wp('8%'), right: -wp('5%'), width: wp('25%'), height: wp('25%') }]} />
        <View style={[styles.heroDecoCircle, { bottom: -wp('4%'), left: -wp('4%'), width: wp('16%'), height: wp('16%') }]} />

        <Text style={styles.heroTitle}>Select Trip Type</Text>
        <Text style={styles.heroSubtitle}>Choose your preferred travel style</Text>

        <View style={styles.tripTypeGrid}>
          {TRIP_TYPES.map((type) => {
            const isActive = tripType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.tripTypeCard, isActive && styles.tripTypeCardActive]}
                onPress={() => {
                  setTripType(type.id);
                  setFromLocation(null);
                  setToLocation(null);
                  setSelectedPackage(null);
                }}
              >
                <View style={[styles.tripTypeIcon, isActive && styles.tripTypeIconActive]}>
                  <Icon name={type.icon} size={wp('4%')} color={isActive ? '#fff' : TEAL} />
                </View>
                <Text style={[styles.tripTypeLabel, isActive && styles.tripTypeLabelActive]}>
                  {type.label}
                </Text>
                <Text style={[styles.tripTypeDesc, isActive && styles.tripTypeDescActive]}>
                  {type.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

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
                size={wp('5.5%')}
                color={airportDirection === dir.id ? TEAL : TEXT_SECONDARY}
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

      {/* Location Inputs */}
      <View style={styles.locationsSection}>
        {renderLocationInput('from')}
        {tripType !== 'local' && renderLocationInput('to')}
      </View>

      {/* Package Selector (for local trips) */}
      {tripType === 'local' && localPackages.length > 0 && renderPackageSelector()}

      {/* Date & Time */}
      {tripType === 'round_trip' ? (
        <>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateCard} onPress={() => openDatePicker('pickup')}>
              <Text style={styles.dateLabel}>PICKUP DATE</Text>
              <View style={styles.dateContent}>
                <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.dateValue}>
                  {pickupDate.toLocaleDateString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateCard} onPress={() => openDatePicker('return')}>
              <Text style={styles.dateLabel}>RETURN DATE</Text>
              <View style={styles.dateContent}>
                <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.dateValue}>
                  {returnDate.toLocaleDateString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateCard} onPress={openTimePicker}>
              <Text style={styles.dateLabel}>PICKUP TIME</Text>
              <View style={styles.dateContent}>
                <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.dateValue}>{pickupTime}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.dateTimeRow}>
          <TouchableOpacity style={styles.dateCard} onPress={() => openDatePicker('pickup')}>
            <Text style={styles.dateLabel}>PICKUP DATE</Text>
            <View style={styles.dateContent}>
              <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
              <Text style={styles.dateValue}>
                {pickupDate.toLocaleDateString('en-US', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.timeCard} onPress={openTimePicker}>
            <Text style={styles.dateLabel}>TIME</Text>
            <View style={styles.dateContent}>
              <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
              <Text style={styles.dateValue}>{pickupTime}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  /* ─── Render: Step 2 — Vehicle Selection ─── */
  const renderStep2 = () => (
    <View style={{ flex: 1 }}>

      {/* Search Bar + Filter Button */}
      {!loadingPrices && vehicleCategories.filter(v => v.isActive).length > 0 && (
        <View style={styles.searchFilterRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={wp('4.5%')} color={TEAL} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicles..."
              placeholderTextColor={TEXT_MUTED}
              value={vehicleSearchQuery}
              onChangeText={setVehicleSearchQuery}
              returnKeyType="search"
            />
            {vehicleSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setVehicleSearchQuery('')}>
                <Ionicons name="close-circle" size={wp('4.5%')} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterButton, (vehicleTypeFilter || acFilter || seaterFilter || priceSortOrder) && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={wp('5%')} color={(vehicleTypeFilter || acFilter || seaterFilter || priceSortOrder) ? '#fff' : TEAL} />
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filters */}
      {(vehicleTypeFilter || acFilter || seaterFilter || priceSortOrder) && !loadingPrices && (
        <View style={styles.activeFiltersRow}>
          {vehicleTypeFilter && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{vehicleTypeFilter}</Text>
              <TouchableOpacity onPress={() => setVehicleTypeFilter(null)}>
                <Ionicons name="close-circle" size={wp('3.5%')} color={TEAL_MID} />
              </TouchableOpacity>
            </View>
          )}
          {acFilter && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{acFilter}</Text>
              <TouchableOpacity onPress={() => setAcFilter(null)}>
                <Ionicons name="close-circle" size={wp('3.5%')} color={TEAL_MID} />
              </TouchableOpacity>
            </View>
          )}
          {seaterFilter && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{seaterFilter} Seater</Text>
              <TouchableOpacity onPress={() => setSeaterFilter(null)}>
                <Ionicons name="close-circle" size={wp('3.5%')} color={TEAL_MID} />
              </TouchableOpacity>
            </View>
          )}
          {priceSortOrder && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {priceSortOrder === 'low_to_high' ? 'Price: Low to High' : 'Price: High to Low'}
              </Text>
              <TouchableOpacity onPress={() => setPriceSortOrder(null)}>
                <Ionicons name="close-circle" size={wp('3.5%')} color={TEAL_MID} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={styles.stepContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp('3%') }}
        keyboardShouldPersistTaps="handled"
      >
        {loadingPrices ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loadingText}>Fetching best prices...</Text>
          </View>
        ) : filteredVehicles.length === 0 ? (
          <View style={styles.emptySearchWrap}>
            <Ionicons name="car-outline" size={wp('12%')} color={TEXT_MUTED} />
            <Text style={styles.emptySearchTitle}>No vehicles found</Text>
            <Text style={styles.emptySearchSubtitle}>Try adjusting your search or filters</Text>
            <TouchableOpacity
              style={styles.clearAllFiltersBtn}
              onPress={() => { setVehicleSearchQuery(''); setVehicleTypeFilter(null); setAcFilter(null); setSeaterFilter(null); setPriceSortOrder(null); }}
            >
              <Text style={styles.clearAllFiltersBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {filteredVehicles.map(renderVehicleCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );

  /* ─── Render: Step 3 — Confirmation ─── */
  const renderStep3 = () => (
    <ScrollView
      style={styles.stepContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: hp('3%') }}
    >
      <View style={styles.summaryCard}>
        {/* Teal Accent Stripe */}
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.summaryAccentStripe} />

        <View style={styles.summaryHeader}>
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.summaryVehicleIcon}>
            <MaterialCommunityIcons name="car-hatchback" size={wp('7%')} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{selectedVehicle?.name}</Text>
            <Text style={styles.summaryLabel}>{selectedVehicle?.seatingCapacity} Seating Capacity</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Trip Type</Text>
          <Text style={styles.summaryValue}>{tripType.charAt(0).toUpperCase() + tripType.slice(1)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowAlt]}>
          <Text style={styles.summaryLabel}>Pickup</Text>
          <Text style={styles.summaryValue}>{fromLocation?.name}</Text>
        </View>
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
        <View style={[styles.summaryRow, styles.summaryRowAlt]}>
          <Text style={styles.summaryLabel}>Date & Time</Text>
          <Text style={styles.summaryValue}>
            {pickupDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} | {pickupTime}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        {/* Gradient Total Fare */}
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.totalFareGradient}>
          <Text style={styles.totalLabelWhite}>Total Fare</Text>
          <Text style={styles.totalValueWhite}>&#8377;{pricing[selectedVehicle?.id]?.totalBeforeGst?.toLocaleString() || '--'}</Text>
        </LinearGradient>

        {/* Advance Payment Info */}
        <View style={styles.advancePaymentBox}>
          <View style={styles.advancePaymentRow}>
            <View style={styles.advanceIconCircle}>
              <Ionicons name="wallet-outline" size={wp('4.5%')} color={TEAL} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.advanceLabel}>Advance Payment (20%)</Text>
              <Text style={styles.advanceHint}>Pay now to confirm your booking</Text>
            </View>
            <Text style={styles.advanceAmount}>
              &#8377;{Math.round((pricing[selectedVehicle?.id]?.totalBeforeGst || 0) * 0.2).toLocaleString()}
            </Text>
          </View>
          <View style={styles.advanceDivider} />
          <View style={styles.advancePaymentRow}>
            <View style={[styles.advanceIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={wp('4.5%')} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.advanceLabel}>Remaining Balance</Text>
              <Text style={styles.advanceHint}>Pay later before trip starts</Text>
            </View>
            <Text style={[styles.advanceAmount, { color: TEXT_SECONDARY }]}>
              &#8377;{Math.round((pricing[selectedVehicle?.id]?.totalBeforeGst || 0) * 0.8).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* B2B Booking Purpose */}
      {isB2BCustomer && (
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Booking Purpose</Text>
          <View style={styles.b2bPurposeRow}>
            <TouchableOpacity
              style={[styles.b2bPurposeBtn, bookingPurpose === 'personal' && styles.b2bPurposeBtnActive]}
              onPress={() => setBookingPurpose('personal')}
            >
              <Ionicons name="person-outline" size={wp('5%')} color={bookingPurpose === 'personal' ? '#fff' : TEAL} />
              <Text style={[styles.b2bPurposeBtnText, bookingPurpose === 'personal' && styles.b2bPurposeBtnTextActive]}>Personal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.b2bPurposeBtn, bookingPurpose === 'company' && styles.b2bPurposeBtnActive]}
              onPress={() => setBookingPurpose('company')}
            >
              <Ionicons name="briefcase-outline" size={wp('5%')} color={bookingPurpose === 'company' ? '#fff' : TEAL} />
              <Text style={[styles.b2bPurposeBtnText, bookingPurpose === 'company' && styles.b2bPurposeBtnTextActive]}>Company</Text>
            </TouchableOpacity>
          </View>

          {bookingPurpose === 'company' && (
            <View style={{ marginTop: hp('1.5%') }}>
              <View style={styles.b2bInputRow}>
                <View style={styles.b2bInputGroup}>
                  <Text style={styles.contactFieldLabel}>No. of Vehicles *</Text>
                  <TextInput
                    style={styles.b2bInput}
                    value={numberOfVehicles}
                    onChangeText={(t) => setNumberOfVehicles(t.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    placeholder="e.g. 5"
                    placeholderTextColor={TEXT_MUTED}
                  />
                </View>
                <View style={styles.b2bInputGroup}>
                  <Text style={styles.contactFieldLabel}>No. of Persons</Text>
                  <TextInput
                    style={styles.b2bInput}
                    value={numberOfPersons}
                    onChangeText={(t) => setNumberOfPersons(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    placeholder="e.g. 20"
                    placeholderTextColor={TEXT_MUTED}
                  />
                </View>
              </View>
              <View style={styles.b2bInfoBox}>
                <Ionicons name="information-circle-outline" size={wp('4%')} color={TEAL} />
                <Text style={styles.b2bInfoText}>
                  This will be a B2B corporate booking. Vendors will send quotes. Post-trip billing applies.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Customer Details</Text>
        <View style={styles.contactRow}>
          <View style={styles.contactIconCircle}>
            <Ionicons name="person-outline" size={wp('4%')} color={TEAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactFieldLabel}>Name</Text>
            <Text style={styles.contactValue}>{customer?.name}</Text>
          </View>
        </View>
        <View style={styles.contactRow}>
          <View style={styles.contactIconCircle}>
            <Ionicons name="call-outline" size={wp('4%')} color={TEAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactFieldLabel}>Phone</Text>
            <Text style={styles.contactValue}>{customer?.phone}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Render: Filter Modal ─── */
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModal}>
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.filterModalAccent} />

          <View style={styles.filterModalHeader}>
            <View style={styles.filterModalTitleRow}>
              <View style={styles.filterModalIcon}>
                <Ionicons name="options" size={wp('4.5%')} color={TEAL} />
              </View>
              <Text style={styles.filterModalTitle}>Filters</Text>
            </View>
            <TouchableOpacity style={styles.filterModalCloseBtn} onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={wp('5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Vehicle Type</Text>
            <View style={styles.filterOptions}>
              {[{ value: null, label: 'All' }, { value: 'Standard', label: 'Standard' }, { value: 'Premium', label: 'Premium' }].map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.filterChip, vehicleTypeFilter === option.value && styles.filterChipActive]}
                  onPress={() => setVehicleTypeFilter(option.value)}
                >
                  <Text style={[styles.filterChipText, vehicleTypeFilter === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>AC / Non-AC</Text>
            <View style={styles.filterOptions}>
              {[{ value: null, label: 'All' }, { value: 'AC', label: 'AC' }, { value: 'Non-AC', label: 'Non-AC' }].map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.filterChip, acFilter === option.value && styles.filterChipActive]}
                  onPress={() => setAcFilter(option.value)}
                >
                  <Text style={[styles.filterChipText, acFilter === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Seater</Text>
            <View style={styles.filterOptions}>
              {[{ value: null, label: 'All' }, { value: 4, label: '4 Seater' }, { value: 5, label: '5 Seater' }, { value: 7, label: '7 Seater' }].map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.filterChip, seaterFilter === option.value && styles.filterChipActive]}
                  onPress={() => setSeaterFilter(option.value)}
                >
                  <Text style={[styles.filterChipText, seaterFilter === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort By Price</Text>
            <View style={styles.filterOptions}>
              {[{ value: null, label: 'Default' }, { value: 'low_to_high', label: 'Low to High' }, { value: 'high_to_low', label: 'High to Low' }].map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.filterChip, priceSortOrder === option.value && styles.filterChipActive]}
                  onPress={() => setPriceSortOrder(option.value)}
                >
                  <Text style={[styles.filterChipText, priceSortOrder === option.value && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterModalActions}>
            <TouchableOpacity
              style={styles.filterClearBtn}
              onPress={() => { setVehicleTypeFilter(null); setAcFilter(null); setSeaterFilter(null); setPriceSortOrder(null); }}
            >
              <Text style={styles.filterClearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterApplyBtnWrap} onPress={() => setShowFilterModal(false)}>
              <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterApplyBtn}>
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* ─── Main Return ─── */
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Header with Dark Teal Gradient */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.decoCircle, { top: -wp('8%'), right: -wp('5%'), width: wp('26%'), height: wp('26%') }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -wp('4%'), left: -wp('4%'), width: wp('16%'), height: wp('16%') }]} pointerEvents="none" />
        <View style={styles.headerInner}>
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
            <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Car Rental' : step === 2 ? 'Select Vehicle' : 'Confirm Booking'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyCarBookings')}
            style={styles.headerIconBtn}
          >
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Steps Indicator with Connectors */}
      <View style={styles.stepsRow}>
        {[1, 2, 3].map((s, index) => (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              {step >= s ? (
                <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.stepCircleActive}>
                  {step > s ? (
                    <Icon name="check" size={wp('3.5%')} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNumber, styles.stepNumberActive]}>{s}</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{s}</Text>
                </View>
              )}
              <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                {s === 1 ? 'Details' : s === 2 ? 'Vehicle' : 'Confirm'}
              </Text>
            </View>
            {index < 2 && <View style={[styles.stepConnector, step > s && styles.stepConnectorActive]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Content + Bottom Bar in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={{ flex: 1 }}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>

        {/* Bottom Button with Gradient */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtnWrap, submitting && styles.nextBtnDisabled]}
            onPress={() => {
              if (step === 3) handleBooking();
              else handleNext();
            }}
            disabled={submitting || loadingPrices}
          >
            <LinearGradient
              colors={submitting ? ['#94A3B8', '#94A3B8'] : [TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextBtnText}>
                  {step === 3 ? (bookingPurpose === 'company' ? 'Submit B2B Booking' : 'Confirm & Pay') : 'Continue'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* iOS Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContent}>
              <DateTimePicker
                value={datePickerTarget === 'pickup' ? pickupDate : returnDate}
                mode="date"
                display="spinner"
                minimumDate={datePickerTarget === 'pickup' ? new Date() : pickupDate}
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

      {/* Vehicle Filter Modal */}
      {renderFilterModal()}

      {/* Custom Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={[styles.alertIconCircle, { backgroundColor: alertModal.type === 'success' ? '#D1FAE5' : '#FEE2E2' }]}>
              <Ionicons
                name={alertModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={wp('10%')}
                color={alertModal.type === 'success' ? TEAL : '#EF4444'}
              />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: alertModal.type === 'success' ? TEAL : '#EF4444' }]}
              onPress={closeAlert}
              activeOpacity={0.8}
            >
              <Text style={styles.alertBtnText}>{alertModal.type === 'success' ? 'Continue' : 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES — Premium Dark Teal Design System
   ═══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },

  /* ── Header ── */
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  headerIconBtn: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  /* ── Step Indicator ── */
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    backgroundColor: CARD,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  stepCircleActive: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.3%'),
  },
  stepNumber: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: wp('2.4%'),
    color: TEXT_MUTED,
  },
  stepLabelActive: {
    color: TEAL,
    fontWeight: '600',
  },
  stepConnector: {
    width: wp('10%'),
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    marginHorizontal: wp('1.5%'),
  },
  stepConnectorActive: {
    backgroundColor: TEAL,
  },

  /* ── Content ── */
  stepContent: {
    flex: 1,
    padding: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.4%'),
  },
  sectionSubtitle: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginBottom: 0,
  },

  /* ── Step 2 Info Box ── */
  stepInfoBox: {
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    overflow: 'hidden',
  },
  stepInfoAccent: {
    height: 3,
    backgroundColor: TEAL,
  },
  stepInfoContent: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.6%'),
  },

  /* ── Hero — Dark Teal Gradient ── */
  heroWrapper: {
    marginHorizontal: -wp('4%'),
    marginTop: -wp('4%'),
    paddingTop: hp('3%'),
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('3.5%'),
    borderBottomLeftRadius: wp('7%'),
    borderBottomRightRadius: wp('7%'),
    marginBottom: hp('3%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  heroDecoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroTitle: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: '#fff',
    marginBottom: hp('0.5%'),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.75)',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },

  /* ── Trip Type — Glassmorphic Cards on Teal ── */
  tripTypeGrid: {
    flexDirection: 'row',
    gap: isSmallScreen ? wp('1.5%') : wp('2.5%'),
  },
  tripTypeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp('4%'),
    padding: wp('2.5%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tripTypeCardActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
    transform: [{ scale: 1.02 }],
  },
  tripTypeIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.7%'),
  },
  tripTypeIconActive: {
    backgroundColor: TEAL,
    ...SHADOW_TEAL,
  },
  tripTypeLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#fff',
  },
  tripTypeLabelActive: {
    color: TEAL_MID,
  },
  tripTypeDesc: {
    fontSize: wp('2.3%'),
    color: 'rgba(255,255,255,0.55)',
    marginTop: hp('0.3%'),
    textAlign: 'center',
  },
  tripTypeDescActive: {
    color: TEXT_SECONDARY,
  },

  /* ── Airport Direction Cards ── */
  airportDirectionWrap: {
    flexDirection: 'row',
    gap: wp('2.5%'),
    marginBottom: hp('2.5%'),
  },
  airportDirCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  airportDirCardActive: {
    borderColor: TEAL,
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    ...Platform.select({
      ios: { shadowColor: TEAL, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  airportDirLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  airportDirLabelActive: {
    color: TEAL_MID,
    fontWeight: '600',
  },

  /* ── Location Inputs ── */
  locationsSection: {
    marginBottom: hp('2%'),
    zIndex: 30,
    elevation: 30,
    overflow: 'visible',
  },
  inputGroup: {
    marginBottom: hp('2%'),
    position: 'relative',
    zIndex: 10,
  },
  inputLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: hp('0.8%'),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2.5%'),
    ...SHADOW_SM,
  },
  locationIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: hp('0.5%'),
    zIndex: 999,
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    gap: wp('2.5%'),
  },
  suggestionText: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  suggestionCode: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('1.5%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
    overflow: 'hidden',
  },

  /* ── Package Selector ── */
  packageChip: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.8%'),
    backgroundColor: CARD,
    borderRadius: wp('6%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    marginRight: wp('2.5%'),
    alignItems: 'center',
    minWidth: wp('28%'),
  
  },
  packageChipSelected: {
    borderColor: TEAL,
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  
  },
  packageName: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  packageNameSelected: {
    color: TEAL_MID,
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp('1.5%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
    marginTop: hp('0.5%'),
  },
  popularText: {
    fontSize: wp('2.5%'),
    color: '#D97706',
    fontWeight: '600',
  },

  /* ── Date / Time Cards ── */
  dateTimeRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
    marginBottom: hp('2%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: wp('2%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: wp('3.5%'),
    ...SHADOW_SM,
  },
  timeCard: {
    width: wp('26%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: wp('3.5%'),
    ...SHADOW_SM,
  },
  dateLabel: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    color: TEAL,
    textTransform: 'uppercase',
    marginBottom: hp('0.7%'),
    letterSpacing: 0.8,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  dateValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  /* ── Vehicle Cards ── */
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
  },
  loadingText: {
    marginTop: hp('1.5%'),
    color: TEAL,
    fontSize: wp('3.8%'),
    fontWeight: '600',
  },
  vehicleList: {
    gap: hp('2%'),
    padding: wp('4%'),
  },
  vehicleCard: {
    backgroundColor: CARD,
    borderRadius: wp('5.5%'),
    padding: wp('4.5%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  vehicleCardSelected: {
    borderColor: TEAL,
    borderWidth: 1.5,
    backgroundColor: CARD,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  vehicleCardUnavailable: {
    opacity: 0.5,
    backgroundColor: BG,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    flexWrap: 'wrap',
    marginBottom: hp('0.7%'),
  },
  vehicleTypeBadge: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.25%'),
    borderRadius: wp('1.5%'),
  },
  badgeStandard: {
    backgroundColor: TEAL_LIGHT,
  },
  badgePremium: {
    backgroundColor: '#FEF3C7',
  },
  badgeStandardText: {
    color: TEAL_MID,
  },
  badgePremiumText: {
    color: '#D97706',
  },
  vehicleImageWrap: {
    width: wp('26%'),
    height: wp('18%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    marginRight: wp('4%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  vehicleImageWrapSelected: {
    borderColor: TEAL,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  vehicleImage: {
    width: wp('22%'),
    height: wp('15%'),
  },
  vehicleMainInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  vehicleNameSelected: {
    color: TEAL_DEEP,
  },
  vehicleType: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  vehicleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    marginTop: hp('1%'),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  statText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  vehicleExamples: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    backgroundColor: DIVIDER,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginTop: hp('1.5%'),
  },

  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: hp('2%'),
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsToggle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricingDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginTop: hp('1.2%'),
  },
  pricingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  pricingDetailLabel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  pricingDetailValue: {
    fontSize: wp('3%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currency: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL,
  },
  currencySelected: {
    color: TEAL_DEEP,
  },
  vehiclePrice: {
    fontSize: wp('6.2%'),
    fontWeight: '900',
    color: TEAL,
  },
  vehiclePriceSelected: {
    color: TEAL_DEEP,
  },
  priceUnit: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  inclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('2.5%'),
    gap: wp('1%'),
  },
  inclusiveLabel: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    fontWeight: '700',
  },

  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('2%'),
  },
  unavailableText: {
    fontSize: wp('3%'),
    color: '#EF4444',
    fontWeight: '600',
  },

  selectedBadge: {
    position: 'absolute',
    top: -hp('1%'),
    right: wp('3.5%'),
  },
  selectedBadgeGradient: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    ...SHADOW_TEAL,
  },

  /* ── Summary Card (Step 3) ── */
  summaryCard: {
    backgroundColor: CARD,
    borderRadius: wp('5.5%'),
    marginBottom: hp('2%'),
    borderWidth: 0,
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  summaryAccentStripe: {
    height: hp('0.5%'),
    width: '100%',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2.5%'),
  },
  summaryVehicleIcon: {
    width: wp('13%'),
    height: wp('13%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('4%'),
    marginRight: wp('3%'),
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  summaryTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: DIVIDER,
    marginVertical: hp('1.5%'),
    marginHorizontal: wp('5%'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
  },
  summaryRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  summaryLabel: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  totalFareGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.2%'),
  },
  totalLabelWhite: {
    fontSize: wp('4%'),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  totalValueWhite: {
    fontSize: wp('6%'),
    fontWeight: '900',
    color: '#fff',
  },

  /* ── Advance Payment ── */
  advancePaymentBox: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('1%'),
    backgroundColor: '#F0FDF4',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: TEAL_LIGHT,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  advancePaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    paddingVertical: hp('0.8%'),
  },
  advanceIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  advanceLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  advanceHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },
  advanceAmount: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEAL_DEEP,
  },
  advanceDivider: {
    height: 1,
    backgroundColor: TEAL_LIGHT,
    marginVertical: hp('0.8%'),
    marginLeft: wp('13%'),
  },

  /* ── Contact Card ── */
  contactCard: {
    backgroundColor: CARD,
    borderRadius: wp('5.5%'),
    padding: wp('5%'),
    borderWidth: 0,
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  contactTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3.5%'),
    padding: wp('3.5%'),
    borderRadius: wp('3.5%'),
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#FAFBFC',
  },
  contactIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactFieldLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  /* ── Custom Alert Modal ── */
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('8%'),
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    padding: wp('7%'),
    width: '100%',
    alignItems: 'center',
    ...SHADOW_LG,
  },
  alertIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  alertTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: hp('0.8%'),
  },
  alertMessage: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5.2%'),
    marginBottom: hp('2.5%'),
  },
  alertBtn: {
    width: '100%',
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  alertBtnText: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#fff',
  },

  /* ── B2B Booking Purpose ── */
  b2bPurposeRow: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginTop: hp('1%'),
  },
  b2bPurposeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: TEAL,
    backgroundColor: '#fff',
  },
  b2bPurposeBtnActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  b2bPurposeBtnText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEAL,
  },
  b2bPurposeBtnTextActive: {
    color: '#fff',
  },
  b2bInputRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  b2bInputGroup: {
    flex: 1,
  },
  b2bInput: {
    marginTop: hp('0.5%'),
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
  },
  b2bInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2%'),
    marginTop: hp('1.5%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('3%'),
  },
  b2bInfoText: {
    flex: 1,
    fontSize: wp('3%'),
    color: TEAL_DEEP,
    lineHeight: wp('4.5%'),
  },

  /* ── Bottom Bar ── */
  bottomBar: {
    backgroundColor: CARD,
    padding: wp('4%'),
    borderTopWidth: 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.10, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  nextBtnWrap: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
  },
  nextBtn: {
    borderRadius: wp('4%'),
    paddingVertical: hp('2.1%'),
    alignItems: 'center',
    ...SHADOW_TEAL,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: wp('4.3%'),
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* ── Picker Modal ── */
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContent: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    padding: wp('6%'),
  },
  pickerDoneBtn: {
    backgroundColor: TEAL,
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    marginTop: hp('1.2%'),
  },
  pickerDoneBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
  },

  /* ── Search & Filter (Step 2) ── */
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    gap: wp('2.5%'),
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: Platform.OS === 'ios' ? hp('1.5%') : hp('0.8%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp('2.5%'),
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
    paddingVertical: hp('0.8%'),
  },
  filterButton: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('3%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterButtonActive: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    gap: wp('2%'),
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('4%'),
    gap: wp('1.5%'),
    borderWidth: 1,
    borderColor: TEAL,
  },
  activeFilterText: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  emptySearchWrap: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('6%'),
  },
  emptySearchTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('2%'),
  },
  emptySearchSubtitle: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  clearAllFiltersBtn: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.2%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: TEAL,
  },
  clearAllFiltersBtnText: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEAL_MID,
  },

  /* ── Filter Modal ── */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '70%',
    overflow: 'hidden',
  },
  filterModalAccent: {
    height: hp('0.5%'),
    width: '100%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  filterModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  filterModalIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  filterModalCloseBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: DIVIDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    padding: wp('5%'),
  },
  filterLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: hp('1%'),
    marginTop: hp('2%'),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  filterChip: {
    backgroundColor: DIVIDER,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
  },
  filterChipText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: TEAL_MID,
    fontWeight: '700',
  },
  filterModalActions: {
    flexDirection: 'row',
    padding: wp('4%'),
    gap: wp('2.5%'),
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: CARD,
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: wp('3.5%'),
    backgroundColor: CARD,
  },
  filterClearBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  filterApplyBtnWrap: {
    flex: 2,
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  filterApplyBtn: {
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    borderRadius: wp('3.5%'),
  },
  filterApplyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.8%'),
  },
});
