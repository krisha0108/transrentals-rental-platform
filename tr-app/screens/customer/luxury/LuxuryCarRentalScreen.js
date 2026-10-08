import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from '../../../components/SafeModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../../api';
import b2bService from '../../services/b2bService';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel, getEarliestPickup, clampPickup, toTimeString, combineDateAndTime, toLocalDateString } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer } from '../../../utils/isTravelAgent';

const { width } = Dimensions.get('window');

export default function LuxuryCarRentalScreen() {
  const navigation = useNavigation();

  // Customer data
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '' });
  const [customerData, setCustomerData] = useState(null);
  // Phase 7 — Travel Agent Personal/Company booking mode
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState('personal'); // 'personal' | 'company'
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');
  const [numberOfPersons, setNumberOfPersons] = useState('');

  // Form state
  const [tripType, setTripType] = useState('local'); // local, outstation, airport
  const [occasion, setOccasion] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('sedan');
  const [specificModel, setSpecificModel] = useState('');
  const [passengers, setPassengers] = useState('4');

  // Route
  const [pickupCity, setPickupCity] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropCity, setDropCity] = useState('');
  const [dropAddress, setDropAddress] = useState('');

  // Dates & Time
  const [pickupDate, setPickupDate] = useState(() => getEarliestPickup());
  const [pickupTime, setPickupTime] = useState(() => toTimeString(getEarliestPickup()));
  const [returnDate, setReturnDate] = useState(null);
  const [returnTime, setReturnTime] = useState('10:00');
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);

  // Package (for local trips)
  const [packageType, setPackageType] = useState('4hrs-40km');

  // Requirements
  const [requirements, setRequirements] = useState('');
  const [needDecoration, setNeedDecoration] = useState(false);
  const [decorationType, setDecorationType] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [luxuryFleet, setLuxuryFleet] = useState([]);

  // Phone collection state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState('pickup'); // 'pickup' or 'drop'
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF', true);
        }
      };
    }, [])
  );

  useEffect(() => {
    loadCustomerData();
    fetchLuxuryFleet();
  }, []);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const c = JSON.parse(data);
        setCustomerData(c);
        if (c.isB2B === true && c.b2bStatus === 'APPROVED') setIsB2BCustomer(true);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const fetchLuxuryFleet = async () => {
    try {
      setFleetLoading(true);
      const response = await api.get('/customer/luxury-fleet', {
        params: { featured: true },
      });
      if (response.data.success) {
        setLuxuryFleet(response.data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching luxury fleet:', error);
    } finally {
      setFleetLoading(false);
    }
  };

  const fetchLocations = async (searchQuery = '') => {
    try {
      setLocationsLoading(true);
      const response = await api.get('/services/luxury-car-rental/locations', {
        params: { q: searchQuery, limit: 50 },
      });
      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  const openLocationPicker = (type) => {
    setLocationPickerType(type);
    setLocationSearch('');
    setShowLocationPicker(true);
    fetchLocations('');
  };

  const selectLocation = (location) => {
    if (locationPickerType === 'pickup') {
      setPickupCity(location.name);
    } else {
      setDropCity(location.name);
    }
    setShowLocationPicker(false);
  };

  const TRIP_TYPES = [
    { id: 'local', label: 'Local', icon: 'city', desc: '4-12 hours package' },
    { id: 'outstation', label: 'Outstation', icon: 'road-variant', desc: 'Multi-day trips' },
    { id: 'airport', label: 'Airport', icon: 'airplane', desc: 'Pick-up/Drop' },
  ];

  const OCCASIONS = [
    { id: 'wedding', label: 'Wedding', icon: 'ring' },
    { id: 'corporate', label: 'Corporate', icon: 'briefcase' },
    { id: 'party', label: 'Party', icon: 'party-popper' },
    { id: 'photoshoot', label: 'Photoshoot', icon: 'camera' },
    { id: 'airport', label: 'Airport Transfer', icon: 'airplane' },
    { id: 'date', label: 'Date Night', icon: 'heart' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal-circle' },
  ];

  const VEHICLE_CATEGORIES = [
    { id: 'sedan', label: 'Luxury Sedan', desc: 'BMW 5, Mercedes E-Class', icon: 'car-sports' },
    { id: 'suv', label: 'Luxury SUV', desc: 'BMW X5, Audi Q7', icon: 'car-estate' },
    { id: 'super', label: 'Super Luxury', desc: 'BMW 7, Mercedes S-Class', icon: 'car-luxury' },
    { id: 'exotic', label: 'Exotic Cars', desc: 'Ferrari, Lamborghini', icon: 'fire' },
  ];

  const PACKAGES = [
    { id: '4hrs-40km', label: '4 Hours / 40 KM' },
    { id: '8hrs-80km', label: '8 Hours / 80 KM' },
    { id: '12hrs-120km', label: '12 Hours / 120 KM' },
  ];

  const DECORATION_TYPES = [
    { id: 'floral', label: 'Floral Decoration', icon: 'flower' },
    { id: 'ribbon', label: 'Ribbon & Balloons', icon: 'balloon' },
    { id: 'premium', label: 'Premium Package', icon: 'star' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!customerData) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    // Check if phone number is missing
    if (!customerData.phone || customerData.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    if (!pickupCity.trim()) {
      Alert.alert('Error', 'Please enter pickup city');
      return;
    }

    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }

    if (tripType === 'outstation' && !dropCity.trim()) {
      Alert.alert('Error', 'Please enter drop city for outstation trip');
      return;
    }

    if (tripType === 'outstation' && !returnDate) {
      Alert.alert('Error', 'Please select return date for outstation trip');
      return;
    }

    // 12-hour advance booking validation
    const [pickupHours, pickupMins] = pickupTime.split(':').map(Number);
    const pickupDateTime = new Date(pickupDate);
    pickupDateTime.setHours(pickupHours, pickupMins, 0, 0);
    if (isPickupTooSoon(pickupDateTime)) {
      setShowBookingAlert(true);
      return;
    }

    // B2B company booking validation
    if (bookingPurpose === 'company') {
      const numVehicles = parseInt(numberOfVehicles);
      if (!numVehicles || numVehicles < 1 || numVehicles > 500) {
        Alert.alert('Error', 'Please enter valid number of vehicles (1-500)');
        return;
      }
    }

    try {
      setLoading(true);

      // B2B Company Booking Flow
      if (bookingPurpose === 'company' && isB2BCustomer) {
        const b2bData = {
          customerId: customerData.id,
          serviceType: 'luxury',
          vehiclesRequired: parseInt(numberOfVehicles),
          passengerCount: numberOfPersons ? parseInt(numberOfPersons) : (parseInt(passengers) || 4),
          vehicleCategory: VEHICLE_CATEGORIES.find(v => v.id === vehicleCategory)?.label || vehicleCategory,
          pickupLocation: pickupCity.trim(),
          dropLocation: tripType === 'outstation' ? dropCity.trim() : null,
          tripType: tripType === 'local' ? 'HOURLY' : tripType === 'outstation' ? 'ROUND_TRIP' : 'ONE_WAY',
          scheduledDate: toLocalDateString(pickupDate),
          scheduledTime: pickupTime,
          returnDate: returnDate ? toLocalDateString(returnDate) : null,
          returnTime: returnDate ? returnTime : null,
          specialNotes: JSON.stringify({
            occasion: occasion || null,
            specificModel: specificModel.trim() || null,
            packageType: tripType === 'local' ? packageType : null,
            needChauffeur: true,
            needDecoration,
            decorationType: needDecoration ? decorationType : null,
            pickupAddress: pickupAddress.trim() || null,
            dropAddress: tripType === 'outstation' ? dropAddress.trim() : null,
            requirements: requirements.trim() || null,
          }),
        };

        const response = await b2bService.createBooking(b2bData);

        if (response.status === 'success' || response.booking) {
          setAlertModal({ visible: true, type: 'success', title: 'B2B Booking Created!', message: `Your booking ${response.booking?.bookingNumber || ''} has been submitted. Vendors will send quotes soon.`, onClose: () => navigation.replace('B2BDashboard') });
        } else {
          setAlertModal({ visible: true, type: 'error', title: 'Error', message: response.error || response.message || 'Failed to create B2B booking' });
        }
        return;
      }

      const requestData = {
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerId: customerData.id,
        tripType,
        occasion: occasion || null,
        vehicle_category: vehicleCategory,
        vehicleCategoryName: VEHICLE_CATEGORIES.find(v => v.id === vehicleCategory)?.label,
        passengers: parseInt(passengers) || 4,
        specificModel: specificModel.trim() || null,
        pickupCity: pickupCity.trim(),
        pickupAddress: pickupAddress.trim(),
        dropCity: tripType === 'outstation' ? dropCity.trim() : null,
        dropAddress: tripType === 'outstation' ? dropAddress.trim() : null,
        pickupDate: pickupDate.toISOString(),
        pickupTime,
        returnDate: returnDate ? returnDate.toISOString() : null,
        returnTime: returnDate ? returnTime : null,
        packageType: tripType === 'local' ? packageType : null,
        requirements: requirements.trim() || null,
        needChauffeur: true,
        needDecoration,
        decorationType: needDecoration ? decorationType : null,
        source: 'app',
        // Phase 7 — TA fields (only when TA customer).
        ...(isTravelAgentCustomer(customerData) && {
          taBookingMode: taState.mode,
          numberOfVehicles: taState.mode === 'COMPANY'
            ? (parseInt(taState.vehicleCount) || 1)
            : 1,
          numberOfEmployees: taState.mode === 'COMPANY' && taState.employeeCount
            ? parseInt(taState.employeeCount)
            : null,
        }),
      };

      const response = await api.post('/customer/luxury-quote-requests', requestData);

      // TA COMPANY booking routes into b2b_bookings → open the B2B detail.
      if (response.data.bookingMode === 'COMPANY' && response.data.booking) {
        setAlertModal({ visible: true, type: 'success', title: 'Company Booking Created!', message: `Your company luxury booking ${response.data.booking.bookingNumber || ''} has been sent to your manager. Quote will be shared shortly.`, onClose: () => navigation.navigate('B2BBookingDetail', { bookingId: response.data.booking.id }) });
      } else if (response.data.success) {
        const newRequestId = response.data.quoteRequest?.id;
        setAlertModal({ visible: true, type: 'success', title: 'Request Submitted!', message: `Quote request submitted successfully!\n\nRequest Number: ${response.data.quoteRequest?.requestNumber || ''}\n\nVendors will send you quotes within 24-48 hours.`, onClose: () => navigation.navigate('LuxuryQuoteDetail', { requestId: newRequestId }) });
      }
    } catch (error) {
      console.error('Error submitting luxury quote request:', error);
      setAlertModal({ visible: true, type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to submit request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Validate phone number (basic validation for 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneLoading(true);

    try {
      // Update phone via API
      const response = await api.put('/customer/profile', {
        customerId: customerData.id,
        phone: phoneNumber.trim(),
      });

      if (response.data.success) {
        // Update local storage and state
        const updatedCustomer = { ...customerData, phone: phoneNumber.trim() };
        setCustomerData(updatedCustomer);
        await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));

        // Close phone modal and proceed with booking
        setShowPhoneModal(false);
        setPhoneNumber('');

        // Retry submission
        handleSubmit();
      }
    } catch (error) {
      console.error('Phone update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update phone number. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time) => {
    return time || '10:00';
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Static header — always visible, doesn't scroll away or fade in. */}
      <View style={styles.hero}>
        <LinearGradient
          colors={[TEAL_MID, TEAL]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroGradient}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroIconBtn}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.crownBadge}>
            <MaterialCommunityIcons name="crown-outline" size={wp('4.6%')} color="#F0D998" />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle} numberOfLines={1}>Luxury, chauffeur‑driven</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroSubtitle} numberOfLines={1}>BMW · Mercedes · Audi · Ferrari</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyLuxuryBookings')}
            style={styles.heroIconBtn}
          >
            <Ionicons name="document-text-outline" size={18} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Featured Fleet Preview */}
        {!fleetLoading && luxuryFleet.length > 0 && (
          <View style={styles.fleetSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <MaterialCommunityIcons name="car-luxury" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Premium Collection</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fleetScroll}>
              {luxuryFleet.slice(0, 5).map((vehicle) => (
                <View key={vehicle.id} style={styles.fleetCard}>
                  {vehicle.primaryImage ? (
                    <Image source={{ uri: vehicle.primaryImage }} style={styles.fleetImage} />
                  ) : (
                    <View style={[styles.fleetImage, styles.fleetPlaceholder]}>
                      <MaterialCommunityIcons name="car-luxury" size={wp('10%')} color={TEAL} />
                    </View>
                  )}
                  <View style={styles.fleetInfo}>
                    <Text style={styles.fleetName} numberOfLines={1}>{vehicle.name}</Text>
                    <Text style={styles.fleetPrice}>{'\u20B9'}{vehicle.price.toLocaleString('en-IN')}/day</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trip Type Selection */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="map-marker-path" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Select Trip Type</Text>
          </View>
          <View style={styles.tripTypeRow}>
            {TRIP_TYPES.map((type) => {
              const isActive = tripType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.tripTypeCard,
                    isActive && styles.tripTypeCardActive,
                  ]}
                  onPress={() => setTripType(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tripTypeIconWrap, isActive && styles.tripTypeIconWrapActive]}>
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={wp('5.5%')}
                      color={isActive ? '#FFFFFF' : TEXT_MUTED}
                    />
                  </View>
                  <Text style={[styles.tripTypeLabel, isActive && styles.tripTypeLabelActive]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.tripTypeDesc, isActive && styles.tripTypeDescActive]}>
                    {type.desc}
                  </Text>
                  {isActive && (
                    <View style={styles.tripTypeCheck}>
                      <Ionicons name="checkmark-circle" size={wp('4.5%')} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Occasion */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="party-popper" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Occasion (Optional)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                style={[styles.chip, occasion === occ.id && styles.chipActive]}
                onPress={() => setOccasion(occasion === occ.id ? '' : occ.id)}
              >
                <MaterialCommunityIcons
                  name={occ.icon}
                  size={wp('4%')}
                  color={occasion === occ.id ? '#FFF' : TEXT_SECONDARY}
                />
                <Text style={[styles.chipText, occasion === occ.id && styles.chipTextActive]}>
                  {occ.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Category */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="car-sports" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Vehicle Category</Text>
          </View>
          {VEHICLE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.vehicleCategoryCard,
                vehicleCategory === cat.id && styles.vehicleCategoryCardActive,
              ]}
              onPress={() => setVehicleCategory(cat.id)}
            >
              <View style={[styles.catIconCircle, vehicleCategory === cat.id && styles.catIconCircleActive]}>
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={wp('5.5%')}
                  color={vehicleCategory === cat.id ? '#FFF' : TEAL_MID}
                />
              </View>
              <View style={styles.vehicleCategoryInfo}>
                <Text style={[styles.vehicleCategoryLabel, vehicleCategory === cat.id && styles.vehicleCategoryLabelActive]}>
                  {cat.label}
                </Text>
                <Text style={styles.vehicleCategoryDesc}>{cat.desc}</Text>
              </View>
              {vehicleCategory === cat.id && (
                <MaterialCommunityIcons name="check-circle" size={wp('5.5%')} color={TEAL} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Specific Model Preference */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="car-info" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Specific Model (Optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g., BMW 7 Series, Mercedes S-Class"
            placeholderTextColor={TEXT_MUTED}
            value={specificModel}
            onChangeText={setSpecificModel}
          />
        </View>

        {/* Passengers */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="people" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Number of Passengers</Text>
          </View>
          <View style={styles.passengerRow}>
            {['2', '4', '6', '7+'].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.passengerBtn, passengers === count && styles.passengerBtnActive]}
                onPress={() => setPassengers(count)}
              >
                <Text style={[styles.passengerText, passengers === count && styles.passengerTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pickup Details */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="map-marker" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Pickup Details</Text>
          </View>
          <TouchableOpacity
            style={styles.input}
            onPress={() => openLocationPicker('pickup')}
          >
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker" size={wp('4.5%')} color={pickupCity ? TEAL_MID : TEXT_MUTED} />
              <Text style={[styles.inputText, !pickupCity && styles.placeholder]}>
                {pickupCity || 'Select Pickup City *'}
              </Text>
              <Ionicons name="chevron-down" size={wp('4.5%')} color={TEXT_MUTED} />
            </View>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Pickup Address (with landmark) *"
            placeholderTextColor={TEXT_MUTED}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Drop Details (for outstation) */}
        {tripType === 'outstation' && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <MaterialCommunityIcons name="map-marker-check" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Drop Details</Text>
            </View>
            <TouchableOpacity
              style={styles.input}
              onPress={() => openLocationPicker('drop')}
            >
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="map-marker" size={wp('4.5%')} color={dropCity ? TEAL_MID : TEXT_MUTED} />
                <Text style={[styles.inputText, !dropCity && styles.placeholder]}>
                  {dropCity || 'Select Drop City *'}
                </Text>
                <Ionicons name="chevron-down" size={wp('4.5%')} color={TEXT_MUTED} />
              </View>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Drop Address (with landmark)"
              placeholderTextColor={TEXT_MUTED}
              value={dropAddress}
              onChangeText={setDropAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="calendar" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowPickupDatePicker(true)}
            >
              <View style={styles.dateTimeIconCircle}>
                <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
              </View>
              <Text style={styles.dateTimeText}>{formatDate(pickupDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowPickupTimePicker(true)}
            >
              <View style={styles.dateTimeIconCircle}>
                <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
              </View>
              <Text style={styles.dateTimeText}>{formatTime(pickupTime)}</Text>
            </TouchableOpacity>
          </View>

          {showPickupDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display="default"
              minimumDate={getMinBookingDate()}
              onChange={(event, selectedDate) => {
                setShowPickupDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  // Keep the chosen time unless it is now too soon on the new date.
                  const pickup = clampPickup(combineDateAndTime(selectedDate, pickupTime));
                  setPickupDate(pickup);
                  setPickupTime(toTimeString(pickup));
                }
              }}
            />
          )}

          {showPickupTimePicker && (
            <DateTimePicker
              value={combineDateAndTime(pickupDate, pickupTime)}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowPickupTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  const chosen = combineDateAndTime(pickupDate, toTimeString(selectedTime));
                  if (isPickupTooSoon(chosen)) {
                    // Too close to now for a driver to reach: snap to the earliest slot.
                    const earliest = getEarliestPickup();
                    setPickupDate(earliest);
                    setPickupTime(toTimeString(earliest));
                    setShowBookingAlert(true);
                    return;
                  }
                  setPickupTime(toTimeString(selectedTime));
                }
              }}
            />
          )}
        </View>

        {/* Return Date & Time (for outstation/round trip) */}
        {tripType === 'outstation' && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="calendar" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Return Date & Time</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowReturnDatePicker(true)}
              >
                <View style={styles.dateTimeIconCircle}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_MID} />
                </View>
                <Text style={styles.dateTimeText}>{formatDate(returnDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowReturnTimePicker(true)}
              >
                <View style={styles.dateTimeIconCircle}>
                  <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
                </View>
                <Text style={styles.dateTimeText}>{formatTime(returnTime)}</Text>
              </TouchableOpacity>
            </View>

            {showReturnDatePicker && (
              <DateTimePicker
                value={returnDate || pickupDate}
                mode="date"
                display="default"
                minimumDate={pickupDate}
                onChange={(event, selectedDate) => {
                  setShowReturnDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setReturnDate(selectedDate);
                }}
              />
            )}

            {showReturnTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowReturnTimePicker(Platform.OS === 'ios');
                  if (selectedTime) {
                    const hours = selectedTime.getHours().toString().padStart(2, '0');
                    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                    setReturnTime(`${hours}:${minutes}`);
                  }
                }}
              />
            )}
          </View>
        )}

        {/* Package (for local trips) */}
        {tripType === 'local' && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <MaterialCommunityIcons name="package-variant" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Select Package</Text>
            </View>
            {PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  packageType === pkg.id && styles.packageCardActive,
                ]}
                onPress={() => setPackageType(pkg.id)}
              >
                <Text style={[styles.packageLabel, packageType === pkg.id && styles.packageLabelActive]}>
                  {pkg.label}
                </Text>
                {packageType === pkg.id && (
                  <MaterialCommunityIcons name="check-circle" size={wp('5%')} color={TEAL} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Decoration */}
        <View style={styles.formCard}>
          <View style={styles.decorationHeader}>
            <View style={[styles.sectionHeaderRow, { flex: 1, marginBottom: 0 }]}>
              <View style={styles.sectionIconCircle}>
                <MaterialCommunityIcons name="flower" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Car Decoration</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleSwitch}
              onPress={() => {
                setNeedDecoration(!needDecoration);
                if (!needDecoration) setDecorationType('');
              }}
            >
              <View style={[styles.toggleTrack, needDecoration && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, needDecoration && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {needDecoration && (
            <View style={styles.decorationOptions}>
              {DECORATION_TYPES.map((dec) => (
                <TouchableOpacity
                  key={dec.id}
                  style={[
                    styles.decorationCard,
                    decorationType === dec.id && styles.decorationCardActive,
                  ]}
                  onPress={() => setDecorationType(dec.id)}
                >
                  <View style={[styles.decoItemIcon, decorationType === dec.id && styles.decoItemIconActive]}>
                    <MaterialCommunityIcons
                      name={dec.icon}
                      size={wp('5%')}
                      color={decorationType === dec.id ? '#FFF' : TEAL_MID}
                    />
                  </View>
                  <Text style={[styles.decorationText, decorationType === dec.id && styles.decorationTextActive]}>
                    {dec.label}
                  </Text>
                  {decorationType === dec.id && (
                    <MaterialCommunityIcons name="check-circle" size={wp('5%')} color={TEAL} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Special Requirements */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="text-box-outline" size={wp('4.5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitle}>Special Requirements (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Any special requests or requirements..."
            placeholderTextColor={TEXT_MUTED}
            value={requirements}
            onChangeText={setRequirements}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* B2B Booking Purpose */}
        {isB2BCustomer && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="briefcase-outline" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <Text style={styles.sectionTitle}>Booking Purpose</Text>
            </View>
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
                    <Text style={styles.b2bFieldLabel}>No. of Vehicles *</Text>
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
                    <Text style={styles.b2bFieldLabel}>No. of Persons</Text>
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

        {/* Phase 7 — TA Personal/Company toggle (self-gated). */}
        <TravelAgentBookingToggle value={taState} onChange={setTaState} />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [TEXT_SECONDARY, TEXT_SECONDARY] : [TEAL_MID, '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={wp('5%')} color="#FFF" />
                <Text style={styles.submitText}>{bookingPurpose === 'company' ? 'Submit B2B Booking' : 'Request Quotes'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: hp('5%') }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            {/* Header */}
            <LinearGradient
              colors={[TEAL_DEEP, TEAL_MID, '#047857']}
              style={styles.locationModalHeader}
            >
              <Text style={styles.locationModalTitle}>
                {locationPickerType === 'pickup' ? 'Select Pickup City' : 'Select Drop City'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={wp('5%')} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Search */}
            <View style={styles.locationSearchContainer}>
              <Ionicons name="search" size={wp('4.5%')} color={TEXT_MUTED} />
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search city..."
                placeholderTextColor={TEXT_MUTED}
                value={locationSearch}
                onChangeText={(text) => {
                  setLocationSearch(text);
                  fetchLocations(text);
                }}
              />
            </View>

            {/* Locations List */}
            {locationsLoading ? (
              <View style={styles.locationLoadingContainer}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.locationLoadingText}>Loading locations...</Text>
              </View>
            ) : locations.length === 0 ? (
              <View style={styles.locationEmptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="map-marker-off" size={wp('10%')} color={TEAL_MID} />
                </View>
                <Text style={styles.locationEmptyText}>No locations available</Text>
                <Text style={styles.locationEmptySubtext}>
                  {locationSearch ? 'Try a different search term' : 'Please contact support'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationItem}
                    onPress={() => selectLocation(item)}
                  >
                    <View style={styles.locationItemIconCircle}>
                      <MaterialCommunityIcons name="map-marker" size={wp('4.5%')} color={TEAL_MID} />
                    </View>
                    <View style={styles.locationItemContent}>
                      <Text style={styles.locationItemName}>{item.displayName || item.name}</Text>
                      {item.state && (
                        <Text style={styles.locationItemState}>{item.state}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={wp('4%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.locationItemSeparator} />}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Phone Collection Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.phoneModal}>
            <LinearGradient
              colors={[TEAL_DEEP, TEAL_MID, '#047857']}
              style={styles.phoneModalHeader}
            >
              <Text style={styles.phoneModalTitle}>Add Phone Number</Text>
              <TouchableOpacity
                onPress={() => setShowPhoneModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={wp('5%')} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.phoneModalContent}>
              <View style={styles.phoneIconCircle}>
                <Ionicons name="call-outline" size={wp('8%')} color={TEAL_MID} />
              </View>
              <Text style={styles.phoneModalText}>
                We need your phone number to process your luxury car booking request and send you quotes from vendors.
              </Text>

              <View style={styles.phoneInputGroup}>
                <Ionicons name="call" size={wp('4.5%')} color={TEAL_MID} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>

              <TouchableOpacity
                style={[styles.phoneSubmitBtn, phoneLoading && styles.phoneSubmitBtnDisabled]}
                onPress={handlePhoneSubmit}
                disabled={phoneLoading}
              >
                <LinearGradient
                  colors={phoneLoading ? [TEXT_SECONDARY, TEXT_SECONDARY] : [TEAL_MID, '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.phoneSubmitGradient}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.phoneSubmitBtnText}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />

      {/* Custom Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={[styles.alertIconCircle, alertModal.type === 'success' ? { backgroundColor: TEAL_LIGHT } : { backgroundColor: '#FEE2E2' }]}>
              <Ionicons
                name={alertModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={wp('12%')}
                color={alertModal.type === 'success' ? TEAL : '#EF4444'}
              />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={styles.alertBtn}
              activeOpacity={0.8}
              onPress={() => {
                const cb = alertModal.onClose;
                setAlertModal({ visible: false, type: '', title: '', message: '' });
                if (cb) cb();
              }}
            >
              <LinearGradient
                colors={alertModal.type === 'success' ? [TEAL, '#059669'] : ['#EF4444', '#DC2626']}
                style={styles.alertBtnGradient}
              >
                <Text style={styles.alertBtnText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp('2%'),
  },

  // Hero
  hero: {
    marginBottom: hp('1%'),
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('2.2%') : hp('2.2%'),
    paddingBottom: hp('2.2%'),
    paddingHorizontal: wp('4.5%'),
    overflow: 'hidden',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroIconBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  crownBadge: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(240,217,152,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(240,217,152,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2.5%'),
  },
  heroTextCol: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  heroTitle: {
    fontSize: wp('4.3%'),
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  heroDivider: {
    width: wp('6%'),
    height: 1.5,
    backgroundColor: 'rgba(240,217,152,0.6)',
    marginTop: hp('0.5%'),
    marginBottom: hp('0.4%'),
  },
  heroSubtitle: {
    fontSize: wp('2.8%'),
    color: '#A9D9C4',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // Fleet Preview
  fleetSection: {
    marginBottom: hp('1.5%'),
    paddingVertical: hp('1.5%'),
  },
  fleetScroll: {
    paddingLeft: wp('4%'),
    marginTop: hp('0.5%'),
  },
  fleetCard: {
    width: wp('38%'),
    marginRight: wp('3%'),
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fleetImage: {
    width: '100%',
    height: hp('11%'),
    backgroundColor: '#F0F0F0',
  },
  fleetPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
  },
  fleetInfo: {
    padding: wp('2.5%'),
  },
  fleetName: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  fleetPrice: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '700',
  },

  // Form Card
  formCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('1.5%'),
    padding: wp('4%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF1F4',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
  },
  sectionIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flex: 1,
  },

  // Trip Type Cards
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  tripTypeRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
  },
  tripTypeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('2%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    position: 'relative',
  },
  tripTypeCardActive: {
    borderColor: TEAL_MID,
    backgroundColor: TEAL_MID,
  },
  tripTypeIconWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  tripTypeIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tripTypeLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
    textAlign: 'center',
  },
  tripTypeLabelActive: {
    color: '#FFFFFF',
  },
  tripTypeDesc: {
    fontSize: wp('2.4%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
    textAlign: 'center',
  },
  tripTypeDescActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  tripTypeCheck: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
  },

  // Chips (Occasion)
  chipRow: {
    marginHorizontal: -wp('1%'),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('6%'),
    marginRight: wp('2.5%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: wp('1.5%'),
  },
  chipActive: {
    backgroundColor: TEAL_MID,
    borderColor: TEAL_MID,
  },
  chipText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  chipTextActive: {
    color: '#FFF',
  },

  // Vehicle Category
  vehicleCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    padding: wp('3.5%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  vehicleCategoryCardActive: {
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
  },
  catIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIconCircleActive: {
    backgroundColor: TEAL_MID,
  },
  vehicleCategoryInfo: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  vehicleCategoryLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  vehicleCategoryLabelActive: {
    color: TEAL_DEEP,
  },
  vehicleCategoryDesc: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
  },

  // Inputs
  input: {
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('3.5%'),
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    marginBottom: hp('1%'),
  },
  inputMultiline: {
    minHeight: hp('10%'),
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  inputText: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  placeholder: {
    color: TEXT_MUTED,
  },

  // Passengers
  passengerRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
  },
  passengerBtn: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    backgroundColor: BG,
    borderRadius: wp('3%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  passengerBtnActive: {
    borderColor: TEAL_MID,
    backgroundColor: TEAL_MID,
  },
  passengerText: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  passengerTextActive: {
    color: '#FFF',
  },

  // Date/Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: wp('2%'),
  },
  dateTimeIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeText: {
    flex: 1,
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  // Package
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  packageCardActive: {
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
  },
  packageLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  packageLabelActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  // Decoration
  decorationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  toggleSwitch: {
    paddingVertical: wp('1%'),
    paddingLeft: wp('2%'),
  },
  toggleTrack: {
    width: wp('10%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: wp('0.4%'),
  },
  toggleTrackActive: {
    backgroundColor: TEAL,
  },
  toggleThumb: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  decorationOptions: {
    gap: hp('1%'),
  },
  decorationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3.5%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: wp('3%'),
  },
  decorationCardActive: {
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
  },
  decoItemIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decoItemIconActive: {
    backgroundColor: TEAL_MID,
  },
  decorationText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  decorationTextActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  // Submit Button
  submitBtn: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  submitBtnDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2.2%'),
    gap: wp('2%'),
  },
  submitText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Location Picker Modal
  locationModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'android' ? hp('2.5%') : 0,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
  },
  locationModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  modalCloseBtn: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    margin: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.3%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: wp('2.5%'),
  },
  locationSearchInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    padding: 0,
  },
  locationLoadingContainer: {
    padding: hp('5%'),
    alignItems: 'center',
  },
  locationLoadingText: {
    marginTop: hp('1.2%'),
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  locationEmptyContainer: {
    padding: hp('5%'),
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  locationEmptyText: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.5%'),
  },
  locationEmptySubtext: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.8%'),
    gap: wp('3%'),
  },
  locationItemIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationItemContent: {
    flex: 1,
  },
  locationItemName: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  locationItemState: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
  },
  locationItemSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: wp('5%'),
  },

  // Phone Modal
  phoneModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '70%',
    width: '100%',
    overflow: 'hidden',
  },
  phoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
  },
  phoneModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  phoneModalContent: {
    padding: wp('6%'),
    alignItems: 'center',
  },
  phoneIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  phoneModalText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('3%'),
    lineHeight: wp('5.2%'),
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    marginBottom: hp('2.5%'),
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('2%'),
    fontSize: wp('4%'),
    color: TEXT_PRIMARY,
  },
  phoneSubmitBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    width: '100%',
  },
  phoneSubmitBtnDisabled: {
    opacity: 0.6,
  },
  phoneSubmitGradient: {
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneSubmitBtnText: {
    color: '#FFF',
    fontSize: wp('4%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // B2B Booking Purpose
  b2bPurposeRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  b2bPurposeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: BG,
  },
  b2bPurposeBtnActive: {
    backgroundColor: TEAL_MID,
    borderColor: TEAL_MID,
  },
  b2bPurposeBtnText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
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
  b2bFieldLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: hp('0.5%'),
  },
  b2bInput: {
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  b2bInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('2.5%'),
    padding: wp('3%'),
    marginTop: hp('1.5%'),
  },
  b2bInfoText: {
    flex: 1,
    fontSize: wp('3%'),
    color: TEAL_DEEP,
    lineHeight: wp('4.2%'),
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: wp('5%'),
    paddingVertical: hp('3.5%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
    width: '100%',
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
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2.5%'),
  },
  alertBtn: {
    width: '100%',
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  alertBtnGradient: {
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderRadius: wp('3%'),
  },
  alertBtnText: {
    color: '#FFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
  },
});
