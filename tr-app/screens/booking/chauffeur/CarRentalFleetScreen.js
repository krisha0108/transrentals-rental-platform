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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';
import { BASE_URL } from '../../api';

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

  // Payment details
  const [bankDetails, setBankDetails] = useState(null);

  // Booking confirmation tracking
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  // Step management
  const [step, setStep] = useState(1); // 1: Trip details, 2: Select vehicle, 3: Confirm

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
      if (step === 4 && bookingConfirmed) {
        // After booking confirmation, redirect to booking details
        navigation.navigate('BookingConfirmation', {
          booking_id: confirmedBookingId,
          bookingType: 'chauffeur',
        });
        return true;
      } else if (step > 1) {
        // Go to previous step
        setStep(step - 1);
        return true;
      }
      // On step 1, allow default back behavior
      return false;
    });

    return () => backHandler.remove();
  }, [step, bookingConfirmed, confirmedBookingId, navigation]);

  const loadInitialData = async () => {
    try {
      const [customerData, locationsRes, categoriesRes, bankDetailsRes] = await Promise.all([
        AsyncStorage.getItem('customer'),
        locationService.getLocations(),
        bookingService.getChauffeurVehicleCategories(),
        fetch(`${BASE_URL}/api/payment-details?service=car-rental`).then(r => r.json()),
      ]);

      if (customerData) setCustomer(JSON.parse(customerData));

      if (locationsRes.success) {
        const locs = locationsRes.locations || [];
        setAllLocations(locs);
        setAirports(locs.filter(l => l.type === 'airport'));
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
      // Fetch all packages and filter/group them locally if needed
      // To match web, we don't pass locationId here if we want global ones
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
        advancePaid: Math.round((vehiclePrice?.totalBeforeGst || 0) * 0.2),
        paymentMethod: 'UPI',
        transactionId: utr,
        paymentStatus: 'pending_verification',
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
        setBookingConfirmed(true);
        setConfirmedBookingId(response.booking?.id || 'unknown');

        Alert.alert(
          'Booking Confirmed!',
          'Your booking has been successfully created.',
          [
            {
              text: 'View Booking',
              onPress: () => navigation.navigate('BookingConfirmation', {
                booking_id: response.booking?.id || 'unknown',
                bookingType: 'chauffeur',
              }),
            },
          ]
        );
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

    return (
      <View style={[styles.inputGroup, { zIndex: isFrom ? 20 : 10, elevation: isFrom ? 20 : 10 }]}>
        <Text style={styles.inputLabel}>
          {isFrom ? 'From' : 'To'} {showAirports ? '(Airport)' : '(City)'}
        </Text>
        <TouchableOpacity style={styles.locationRow} activeOpacity={0.9}>
          <Ionicons
            name={showAirports ? 'airplane-outline' : 'location-outline'}
            size={18}
            color="#0F172A"
          />
          <TextInput
            style={styles.locationInput}
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
              <Ionicons name="close-circle" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showSuggestions && (
          <View style={styles.suggestionsBox}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {filteredLocations(query, showAirports).map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.suggestionItem}
                  onPress={() => handleLocationSelect(loc, target)}
                >
                  <Ionicons
                    name={loc.type === 'airport' ? 'airplane-outline' : 'location'}
                    size={16}
                    color="#64748B"
                  />
                  <Text style={styles.suggestionText}>{loc.name}</Text>
                  {loc.code && <Text style={styles.suggestionCode}>{loc.code}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
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

        {vehicle.exampleVehicles && (
          <Text style={styles.vehicleExamples}>
            Example: {
              Array.isArray(vehicle.exampleVehicles)
                ? vehicle.exampleVehicles.join(', ')
                : vehicle.exampleVehicles
            }
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
                <Text style={styles.priceUnit}> / total</Text>
              </View>
              <Text style={styles.inclusiveLabel}>All inclusive</Text>
            </>
          ) : (
            <View style={styles.unavailableBadge}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.unavailableText}>Route Not Available</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={28} color={BRAND_TEAL} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Hero Section Wrapper for Trip Type */}
      <View style={styles.heroWrapper}>
        <Text style={styles.heroTitle}>Where are you going?</Text>
        <Text style={styles.heroSubtitle}>Select your trip type and pickup details</Text>

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
                  <Icon name={type.icon} size={18} color={isActive ? '#fff' : BRAND_TEAL} />
                </View>
                <Text style={[styles.tripTypeLabel, isActive && styles.tripTypeLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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

      {/* Location Inputs */}
      <View style={styles.locationsSection}>
        {renderLocationInput('from')}
        {tripType !== 'local' && renderLocationInput('to')}
      </View>

      {/* Package Selector (for local trips) */}
      {tripType === 'local' && localPackages.length > 0 && renderPackageSelector()}

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

      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.stepInfoBox}>
        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        <Text style={styles.sectionSubtitle}>
          {tripType === 'local' ? `${selectedPackage?.hours}hr / ${selectedPackage?.kms}km` : `${fromLocation?.name} to ${toLocation?.name}`}
        </Text>
      </View>

      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {loadingPrices ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND_TEAL} />
            <Text style={styles.loadingText}>Fetching best prices...</Text>
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {vehicleCategories.filter(v => v.isActive).map(renderVehicleCard)}
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

      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const [utr, setUtr] = useState('');

  const handlePayVia = (app) => {
    const advanceAmount = Math.round((pricing[selectedVehicle?.id]?.totalBeforeGst || 0) * 0.2);
    const upiId = bankDetails?.upiId || 'transrentals@kotak';
    const payeeName = bankDetails?.accountHolderName || 'TransRentals';

    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${advanceAmount}&cu=INR`;

    let appUrl = '';
    switch(app) {
      case 'gpay':
        appUrl = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${advanceAmount}&cu=INR`;
        break;
      case 'phonepe':
        appUrl = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${advanceAmount}&cu=INR`;
        break;
      case 'paytm':
        appUrl = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${advanceAmount}&cu=INR`;
        break;
      default:
        appUrl = upiUrl;
    }

    Linking.canOpenURL(appUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(appUrl);
        } else {
          // Fallback to generic UPI
          return Linking.openURL(upiUrl);
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Unable to open payment app. Please pay manually using UPI ID.');
        console.log('Payment app error:', err);
      });
  };

  const renderStep4 = () => {
    const advanceAmount = Math.round((pricing[selectedVehicle?.id]?.totalBeforeGst || 0) * 0.2);
    const upiId = bankDetails?.upiId || 'transrentals@kotak';
    const qrCodeUrl = bankDetails?.upiQrCode
      ? `${BASE_URL}${bankDetails.upiQrCode}`
      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=TransRentals&am=${advanceAmount}`;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Advance Payment</Text>
          <Text style={styles.paymentSubtitle}>Please pay the advance amount using UPI</Text>

          <View style={styles.advanceRow}>
            <Text style={styles.advanceLabel}>Advance to Pay (20%):</Text>
            <Text style={styles.advanceValue}>
              ₹{advanceAmount.toLocaleString()}
            </Text>
          </View>

          {/* Pay Via Buttons */}
          <View style={styles.payViaSection}>
            <Text style={styles.payViaTitle}>Pay via</Text>
            <View style={styles.payViaButtons}>
              <TouchableOpacity style={styles.payViaBtn} onPress={() => handlePayVia('gpay')}>
                <Image
                  source={require('../../../assets/google-logo.png')}
                  style={styles.payViaIcon}
                  resizeMode="contain"
                />
                <Text style={styles.payViaBtnText}>Google Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.payViaBtn} onPress={() => handlePayVia('phonepe')}>
                <Image
                  source={require('../../../assets/phonepe.png')}
                  style={styles.payViaIcon}
                  resizeMode="contain"
                />
                <Text style={styles.payViaBtnText}>PhonePe</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.payViaBtn} onPress={() => handlePayVia('paytm')}>
                <Image
                  source={require('../../../assets/paytm.jpg')}
                  style={styles.payViaIcon}
                  resizeMode="contain"
                />
                <Text style={styles.payViaBtnText}>Paytm</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerWithText}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SCAN QR CODE</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrImage}
            />
            <Text style={styles.upiId}>UPI ID: {upiId}</Text>
          </View>

          <View style={styles.utrSection}>
            <Text style={styles.inputLabel}>Enter UTR / Transaction ID</Text>
            <TextInput
              style={styles.utrInput}
              value={utr}
              onChangeText={setUtr}
              placeholder="e.g. 123456789012"
              keyboardType="number-pad"
            />
            <Text style={styles.utrHint}>Please enter the 12-digit UTR number after payment</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  };


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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 4 && bookingConfirmed) {
              // After booking confirmation, redirect to booking details
              navigation.navigate('BookingConfirmation', {
                booking_id: confirmedBookingId,
                bookingType: 'chauffeur',
              });
            } else if (step > 1) {
              // Go to previous step
              setStep(step - 1);
            } else {
              // On step 1, go back to previous screen
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Car Rental' : step === 2 ? 'Select Vehicle' : step === 3 ? 'Confirm Booking' : 'Payment'}
        </Text>
        <View style={{ width: 40 }} />
          <TouchableOpacity
                  onPress={() => navigation.navigate('MyCarBookings')}
                  style={styles.myBookingsBtn}
                >
                  <Ionicons name="document-text-outline" size={20} color={GREEN} />
                </TouchableOpacity>
      </View>

      {/* Steps Indicator */}
      <View style={styles.stepsRow}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              {step > s ? (
                <Icon name="check" size={14} color="#fff" />
              ) : (
                <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {s === 1 ? 'Details' : s === 2 ? 'Vehicle' : s === 3 ? 'Confirm' : 'Payment'}
            </Text>
          </View>
        ))}
      </View>

      {/* Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
          onPress={() => {
            if (step === 3) setStep(4);
            else if (step === 4) handleBooking();
            else handleNext();
          }}
          disabled={submitting || loadingPrices}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === 3 ? 'Proceed to Payment' : step === 4 ? 'Confirm & Book' : 'Continue'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    gap: 32,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: GREEN },
  stepNumber: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontSize: 12, color: '#94A3B8' },
  stepLabelActive: { color: GREEN, fontWeight: '600' },

  // Content
  stepContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },

  // Hero
  heroWrapper: {
    backgroundColor: BRAND_TEAL,
    marginHorizontal: -16,
    marginTop: -16,
    padding: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },

  // Trip Type
  tripTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tripTypeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tripTypeCardActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tripTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTypeIconActive: { backgroundColor: BRAND_TEAL },
  tripTypeLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  tripTypeLabelActive: { color: BRAND_TEAL },

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
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  vehicleCardSelected: {
    borderColor: BRAND_TEAL,
    borderWidth: 2,
    backgroundColor: 'rgba(9, 179, 104, 0.02)',
  },
  vehicleCardUnavailable: {
    opacity: 0.5,
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleImageWrap: {
    width: 100,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginRight: 16,
  },
  vehicleImage: { width: 90, height: 60 },
  vehicleMainInfo: { flex: 1 },
  vehicleName: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 2 },
  vehicleType: { fontSize: 12, color: BRAND_TEAL, fontWeight: '700', textTransform: 'uppercase' },

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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currency: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  vehiclePrice: { fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY },
  priceUnit: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },

  inclusiveLabel: {
    fontSize: 11,
    color: BRAND_TEAL,
    fontWeight: '700',
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
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

  selectedBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 15, elevation: 4 },

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
  // Payment Card
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  paymentTitle: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 4 },
  paymentSubtitle: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 },

  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 179, 104, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  advanceLabel: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  advanceValue: { fontSize: 20, fontWeight: '800', color: BRAND_TEAL },

  // Pay Via Section
  payViaSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  payViaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  payViaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  payViaBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: BRAND_TEAL,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  payViaIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  payViaBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },

  // Divider with text
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },

  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  upiId: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  utrSection: {
    marginTop: 8,
  },
  utrInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    marginTop: 8,
  },
  utrHint: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
