import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import bookingService from '../../services/bookingService';
import locationService from '../../services/locationService';
import api from '../../api';

// --- PREMIUM DARK TEAL DESIGN SYSTEM ---
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

const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 3,
  },
});

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 6,
  },
});

const SHADOW_LG = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  android: {
    elevation: 10,
  },
});

const TRIP_TYPES = [
  {
    id: 'outstation',
    label: 'Outstation',
    icon: 'navigate-outline',
    desc: 'Intercity travel',
    color: '#3B82F6',
  },
  {
    id: 'local',
    label: 'Local',
    icon: 'location-outline',
    desc: 'Within city',
    color: '#10B981',
  },
  {
    id: 'pilgrimage',
    label: 'Pilgrimage',
    icon: 'star-outline',
    desc: 'Religious tours',
    color: '#F59E0B',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    icon: 'heart-outline',
    desc: 'Special occasions',
    color: '#EC4899',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    icon: 'briefcase-outline',
    desc: 'Business travel',
    color: '#8B5CF6',
  },
  {
    id: 'school',
    label: 'School Trip',
    icon: 'school-outline',
    desc: 'Educational tours',
    color: '#EF4444',
  },
];

export default function BusRentalFleetScreen() {
  const navigation = useNavigation();

  // Current step in the flow
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(7);

  // Form data
  const [tripType, setTripType] = useState('');
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [passengers, setPassengers] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnDate, setReturnDate] = useState(new Date());
  const [returnTime, setReturnTime] = useState('10:00 AM');
  const [requirements, setRequirements] = useState('');
  const [needAC, setNeedAC] = useState(true);
  const [needLuxury, setNeedLuxury] = useState(false);
  const [needSleeper, setNeedSleeper] = useState(false);

  // Location search
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);

  // Submission
  const [customer, setCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRequestId, setConfirmedRequestId] = useState(null);
  const [b2bBookingResponse, setB2bBookingResponse] = useState(null);

  // B2B booking
  const [bookingType, setBookingType] = useState('personal'); // 'personal' or 'company'
  const [numberOfBuses, setNumberOfBuses] = useState('1');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);

  // Phone collection
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // StatusBar management
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(TEAL_DEEP);
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      };
    }, [])
  );

  useEffect(() => {
    loadCustomer();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [step]);

  useEffect(() => {
    // Update total steps based on trip type
    if (tripType === 'local') {
      setTotalSteps(6); // No destination needed
    } else {
      setTotalSteps(7);
    }
  }, [tripType]);

  const loadCustomer = async () => {
    const customerData = await AsyncStorage.getItem('customer');
    if (customerData) {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
      if (parsed.isB2B && parsed.b2bStatus === 'APPROVED') {
        setIsB2BCustomer(true);
      }
    }
  };

  const handleBackPress = () => {
    if (step === 8) {
      // On confirmation screen, go to dashboard
      navigation.navigate('CustomerDashboard');
      return true;
    } else if (step > 1) {
      setStep(step - 1);
      return true;
    }
    navigation.goBack();
    return true;
  };

  // Location search with debounce
  useEffect(() => {
    if (fromSearch.length >= 2) {
      const timer = setTimeout(() => searchLocations('from', fromSearch), 300);
      return () => clearTimeout(timer);
    } else {
      setFromResults([]);
    }
  }, [fromSearch]);

  useEffect(() => {
    if (toSearch.length >= 2) {
      const timer = setTimeout(() => searchLocations('to', toSearch), 300);
      return () => clearTimeout(timer);
    } else {
      setToResults([]);
    }
  }, [toSearch]);

  const searchLocations = async (type, query) => {
    if (type === 'from') setSearchingFrom(true);
    else setSearchingTo(true);

    try {
      // Use bus-specific location search
      const response = await locationService.searchBusLocations(query);

      if (response.success) {
        const locations = response.locations || [];
        if (type === 'from') {
          setFromResults(locations);
        } else {
          setToResults(locations);
        }

        // Show message if no locations found
        if (locations.length === 0 && query.length >= 2) {
          Alert.alert(
            'Location Not Available',
            'This location is not currently available for bus rental service. We will be available soon in more locations.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error searching bus locations:', error);
      Alert.alert(
        'Error',
        'Failed to search locations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (type === 'from') setSearchingFrom(false);
      else setSearchingTo(false);
    }
  };

  const selectLocation = (type, location) => {
    if (type === 'from') {
      setFromLocation(location);
      setFromSearch(location.name);
      setFromResults([]);
    } else {
      setToLocation(location);
      setToSearch(location.name);
      setToResults([]);
    }
  };

  const openDatePicker = (type) => {
    const currentDate = type === 'pickup' ? pickupDate : returnDate;
    // For return date, minimum date should be pickup date
    // For pickup date, minimum date should be today
    const minDate = type === 'return' ? pickupDate : new Date();

    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          if (type === 'pickup') {
            setPickupDate(selectedDate);
            // If pickup date is after current return date, update return date too
            if (selectedDate > returnDate) {
              setReturnDate(selectedDate);
            }
          } else {
            setReturnDate(selectedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: false,
      minimumDate: minDate,
    });
  };

  const openTimePicker = (type) => {
    const currentDate = type === 'pickup' ? pickupDate : returnDate;
    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          const hours = selectedDate.getHours();
          const minutes = selectedDate.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = hours % 12 || 12;
          const formattedMinutes = minutes.toString().padStart(2, '0');
          const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

          if (type === 'pickup') {
            setPickupTime(timeString);
          } else {
            setReturnTime(timeString);
          }
        }
      },
      mode: 'time',
      is24Hour: false,
    });
  };

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !tripType) {
      Alert.alert('Required', 'Please select a trip type');
      return;
    }
    if (step === 2 && !fromLocation && !fromSearch.trim()) {
      Alert.alert('Required', 'Please enter pickup location');
      return;
    }
    if (step === 3 && !toLocation && !toSearch.trim()) {
      Alert.alert('Required', 'Please enter drop location');
      return;
    }
    if (step === 4 && (!passengers || parseInt(passengers) < 1)) {
      Alert.alert('Required', 'Please enter number of passengers');
      return;
    }

    // Move to next step
    if (step === 7) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!customer) {
      Alert.alert('Login Required', 'Please login to submit quote request');
      return;
    }

    // Check if phone number is missing
    if (!customer.phone || customer.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    setSubmitting(true);
    try {
      let tripDays = 1;
      if (returnDate && pickupDate && tripType !== 'local') {
        const diff = returnDate.getTime() - pickupDate.getTime();
        tripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const requestData = {
        customerId: customer.id,
        customerName: customer.name || customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        tripType,
        vehicleCategory: null,
        vehicleCategoryName: 'Standard Bus',
        passengers: parseInt(passengers),
        pickupCity: fromLocation?.name || fromSearch || null,
        pickupAddress: fromLocation?.name || fromSearch || null,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime,
        dropCity: toLocation?.name || toSearch || null,
        dropAddress: toLocation?.name || toSearch || null,
        returnDate: returnDate ? returnDate.toISOString().split('T')[0] : null,
        returnTime: returnTime || null,
        tripDays,
        requirements: requirements || null,
        needAC,
        needLuxury,
        needSleeper,
        budgetMin: null,
        budgetMax: null,
      };

      // Add B2B fields if company booking
      if (bookingType === 'company' && isB2BCustomer) {
        requestData.isB2B = true;
        requestData.numberOfVehicles = numberOfBuses || '1';
        requestData.numberOfPersons = numberOfPersons || null;
      }

      const response = await bookingService.createBusQuoteRequest(requestData);

      if (response.success || response.quoteRequest || response.id) {
        // B2B booking goes to B2BBookingDetail
        if (response.isB2B && response.booking) {
          setB2bBookingResponse(response.booking);
          setConfirmedRequestId(response.booking.bookingNumber || response.booking.id);
          setStep(8);
          return;
        }
        setConfirmedRequestId(response.quoteRequest?.id || response.id || 'unknown');
        setStep(8); // Confirmation step
      }
    } catch (error) {
      console.error('Quote request error:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
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
        customerId: customer.id,
        phone: phoneNumber.trim(),
      });

      if (response.data.success) {
        // Update local storage and state
        const updatedCustomer = { ...customer, phone: phoneNumber.trim() };
        setCustomer(updatedCustomer);
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

  // ========== RENDER HELPERS ==========

  // Decorative circles for gradient headers
  const renderDecoCircles = () => (
    <>
      <View style={styles.decoCircle1} pointerEvents="none" />
      <View style={styles.decoCircle2} pointerEvents="none" />
      <View style={styles.decoCircle3} pointerEvents="none" />
    </>
  );

  // STEP 1: Trip Type Selection
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Premium hero header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={styles.stepHeroIconWrap}>
          <Ionicons name="bus" size={wp('5.5%')} color="#fff" />
        </View>
        <Text style={styles.stepHeroTitle}>What service do you need?</Text>
        <Text style={styles.stepHeroSubtitle}>Choose your trip type</Text>
      </LinearGradient>

      <View style={styles.tripTypeGrid}>
        {TRIP_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.tripTypeCard,
              tripType === type.id && { ...styles.tripTypeCardActive, borderColor: type.color },
            ]}
            onPress={() => setTripType(type.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.tripTypeIcon,
                { backgroundColor: tripType === type.id ? type.color : type.color + '15' },
              ]}
            >
              <Ionicons
                name={type.icon}
                size={wp('5%')}
                color={tripType === type.id ? '#fff' : type.color}
              />
            </View>
            <Text style={[styles.tripTypeLabel, tripType === type.id && { color: type.color }]}>
              {type.label}
            </Text>
            <Text style={styles.tripTypeDesc}>{type.desc}</Text>
            {tripType === type.id && (
              <View style={[styles.checkmark, { backgroundColor: type.color }]}>
                <Ionicons name="checkmark" size={wp('3.5%')} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // STEP 2: Pickup Location
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={styles.stepHeroIconWrap}>
          <Ionicons name="location" size={wp('8%')} color="#fff" />
        </View>
        <Text style={styles.stepHeroTitle}>Where will you start your journey?</Text>
        <Text style={styles.stepHeroSubtitle}>Enter pickup location or select from suggestions</Text>
      </LinearGradient>

      <View style={styles.inputContainer}>
        <View style={styles.searchBox}>
          <View style={styles.searchIconCircle}>
            <Ionicons name="search-outline" size={wp('4.5%')} color={TEAL} />
          </View>
          <TextInput
            style={styles.searchInput}
            value={fromSearch}
            onChangeText={setFromSearch}
            placeholder="Type pickup city or place name..."
            placeholderTextColor={TEXT_MUTED}
          />
          {searchingFrom && <ActivityIndicator size="small" color={TEAL} />}
          {fromSearch && !fromLocation && (
            <TouchableOpacity onPress={() => setFromSearch('')}>
              <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {fromResults.length > 0 && !fromLocation && (
          <View style={styles.dropdown}>
            {fromResults.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.dropdownItem}
                onPress={() => selectLocation('from', loc)}
              >
                <View style={styles.dropdownIconCircle}>
                  <Ionicons name="location-outline" size={wp('4%')} color={TEAL} />
                </View>
                <Text style={styles.dropdownText}>{loc.name}</Text>
                <Ionicons name="chevron-forward" size={wp('4%')} color={TEXT_MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {fromLocation && (
          <View style={styles.selectedLocation}>
            <View style={styles.selectedLocationIcon}>
              <Ionicons name="checkmark-circle" size={wp('5.5%')} color={TEAL} />
            </View>
            <Text style={styles.selectedLocationText}>{fromLocation.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setFromLocation(null);
                setFromSearch('');
                setFromResults([]);
              }}
              style={styles.selectedLocationClear}
            >
              <Ionicons name="close-circle" size={wp('5%')} color={TEAL} />
            </TouchableOpacity>
          </View>
        )}

        {fromSearch && !fromLocation && fromResults.length === 0 && !searchingFrom && (
          <View style={styles.manualEntryHint}>
            <Ionicons name="information-circle" size={wp('4.5%')} color={TEAL} />
            <Text style={styles.manualEntryText}>
              You can continue with "{fromSearch}" as your pickup location
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // STEP 3: Drop Location
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={[styles.stepHeroIconWrap, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
          <Ionicons name="flag" size={wp('8%')} color="#FCA5A5" />
        </View>
        <Text style={styles.stepHeroTitle}>Where will you be traveling to?</Text>
        <Text style={styles.stepHeroSubtitle}>Enter destination or select from suggestions</Text>
      </LinearGradient>

      <View style={styles.inputContainer}>
        <View style={styles.searchBox}>
          <View style={[styles.searchIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="search-outline" size={wp('4.5%')} color="#EF4444" />
          </View>
          <TextInput
            style={styles.searchInput}
            value={toSearch}
            onChangeText={setToSearch}
            placeholder="Type destination city or place name..."
            placeholderTextColor={TEXT_MUTED}
          />
          {searchingTo && <ActivityIndicator size="small" color={TEAL} />}
          {toSearch && !toLocation && (
            <TouchableOpacity onPress={() => setToSearch('')}>
              <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {toResults.length > 0 && !toLocation && (
          <View style={styles.dropdown}>
            {toResults.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.dropdownItem}
                onPress={() => selectLocation('to', loc)}
              >
                <View style={[styles.dropdownIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="location-outline" size={wp('4%')} color="#EF4444" />
                </View>
                <Text style={styles.dropdownText}>{loc.name}</Text>
                <Ionicons name="chevron-forward" size={wp('4%')} color={TEXT_MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {toLocation && (
          <View style={[styles.selectedLocation, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <View style={styles.selectedLocationIcon}>
              <Ionicons name="checkmark-circle" size={wp('5.5%')} color="#EF4444" />
            </View>
            <Text style={[styles.selectedLocationText, { color: '#EF4444' }]}>{toLocation.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setToLocation(null);
                setToSearch('');
                setToResults([]);
              }}
              style={styles.selectedLocationClear}
            >
              <Ionicons name="close-circle" size={wp('5%')} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {toSearch && !toLocation && toResults.length === 0 && !searchingTo && (
          <View style={styles.manualEntryHint}>
            <Ionicons name="information-circle" size={wp('4.5%')} color={TEAL} />
            <Text style={styles.manualEntryText}>
              You can continue with "{toSearch}" as your destination
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // STEP 4: Passengers
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={styles.stepHeroIconWrap}>
          <Ionicons name="people" size={wp('8%')} color="#fff" />
        </View>
        <Text style={styles.stepHeroTitle}>How many passengers?</Text>
        <Text style={styles.stepHeroSubtitle}>Enter total number of travelers</Text>
      </LinearGradient>

      <View style={styles.passengerCard}>
        <View style={styles.passengerInputContainer}>
          <TouchableOpacity
            style={styles.passengerButton}
            onPress={() => setPassengers(Math.max(1, parseInt(passengers || 0) - 1).toString())}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              style={styles.passengerBtnGradient}
            >
              <Ionicons name="remove" size={wp('6%')} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.passengerDisplay}>
            <TextInput
              style={styles.passengerInput}
              value={passengers}
              onChangeText={setPassengers}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={TEXT_MUTED}
              maxLength={3}
            />
            <Text style={styles.passengerLabel}>Passengers</Text>
          </View>

          <TouchableOpacity
            style={styles.passengerButton}
            onPress={() => setPassengers((parseInt(passengers || 0) + 1).toString())}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              style={styles.passengerBtnGradient}
            >
              <Ionicons name="add" size={wp('6%')} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick select options */}
      <View style={styles.quickSelectContainer}>
        <Text style={styles.quickSelectLabel}>Quick Select:</Text>
        <View style={styles.quickSelectButtons}>
          {[10, 20, 30, 40, 50].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.quickSelectBtn,
                passengers === count.toString() && styles.quickSelectBtnActive,
              ]}
              onPress={() => setPassengers(count.toString())}
              activeOpacity={0.7}
            >
              {passengers === count.toString() ? (
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  style={styles.quickSelectBtnGradientInner}
                >
                  <Text style={styles.quickSelectBtnTextActive}>{count}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.quickSelectBtnText}>{count}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // STEP 5: Pickup Date/Time
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={styles.stepHeroIconWrap}>
          <Ionicons name="calendar" size={wp('8%')} color="#fff" />
        </View>
        <Text style={styles.stepHeroTitle}>When do you need the service?</Text>
        <Text style={styles.stepHeroSubtitle}>Select your pickup date and time</Text>
      </LinearGradient>

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openDatePicker('pickup')} activeOpacity={0.7}>
          <View style={styles.dateTimeIcon}>
            <Ionicons name="calendar-outline" size={wp('6%')} color={TEAL} />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Pickup Date</Text>
            <Text style={styles.dateTimeValue}>
              {pickupDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dateTimeChevron}>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEXT_MUTED} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openTimePicker('pickup')} activeOpacity={0.7}>
          <View style={styles.dateTimeIcon}>
            <Ionicons name="time-outline" size={wp('6%')} color={TEAL} />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Pickup Time</Text>
            <Text style={styles.dateTimeValue}>{pickupTime}</Text>
          </View>
          <View style={styles.dateTimeChevron}>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEXT_MUTED} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <View style={styles.noteIconCircle}>
          <Ionicons name="information-circle-outline" size={wp('4.5%')} color="#F59E0B" />
        </View>
        <Text style={styles.noteText}>Note: You cannot select past dates</Text>
      </View>
    </View>
  );

  // STEP 6: Return Date/Time (for non-local)
  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={[styles.stepHeroIconWrap, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
          <Ionicons name="calendar" size={wp('8%')} color="#FCA5A5" />
        </View>
        <Text style={styles.stepHeroTitle}>When will you return?</Text>
        <Text style={styles.stepHeroSubtitle}>Select your return date and time</Text>
      </LinearGradient>

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openDatePicker('return')} activeOpacity={0.7}>
          <View style={[styles.dateTimeIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="calendar-outline" size={wp('6%')} color="#EF4444" />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Return Date</Text>
            <Text style={styles.dateTimeValue}>
              {returnDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dateTimeChevron}>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEXT_MUTED} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openTimePicker('return')} activeOpacity={0.7}>
          <View style={[styles.dateTimeIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="time-outline" size={wp('6%')} color="#EF4444" />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Return Time</Text>
            <Text style={styles.dateTimeValue}>{returnTime}</Text>
          </View>
          <View style={styles.dateTimeChevron}>
            <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEXT_MUTED} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <View style={styles.noteIconCircle}>
          <Ionicons name="information-circle-outline" size={wp('4.5%')} color="#F59E0B" />
        </View>
        <Text style={styles.noteText}>Note: Return date must be after pickup date</Text>
      </View>
    </View>
  );

  // STEP 7: Special Requirements
  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepHero}
      >
        {renderDecoCircles()}
        <View style={styles.stepHeroIconWrap}>
          <Ionicons name="list" size={wp('8%')} color="#fff" />
        </View>
        <Text style={styles.stepHeroTitle}>Any special requirements?</Text>
        <Text style={styles.stepHeroSubtitle}>Add any special requests or preferences</Text>
      </LinearGradient>

      {/* B2B Booking Type Toggle */}
      {isB2BCustomer && (
        <View style={styles.b2bSection}>
          <Text style={styles.b2bSectionLabel}>Booking For</Text>
          <View style={styles.b2bToggleRow}>
            <TouchableOpacity
              style={[styles.b2bToggleBtn, bookingType === 'personal' && styles.b2bToggleBtnActive]}
              onPress={() => setBookingType('personal')}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={wp('4%')} color={bookingType === 'personal' ? '#fff' : TEAL_MID} />
              <Text style={[styles.b2bToggleBtnText, bookingType === 'personal' && styles.b2bToggleBtnTextActive]}>Personal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.b2bToggleBtn, bookingType === 'company' && styles.b2bToggleBtnActive]}
              onPress={() => setBookingType('company')}
              activeOpacity={0.7}
            >
              <Ionicons name="business" size={wp('4%')} color={bookingType === 'company' ? '#fff' : TEAL_MID} />
              <Text style={[styles.b2bToggleBtnText, bookingType === 'company' && styles.b2bToggleBtnTextActive]}>For Company</Text>
            </TouchableOpacity>
          </View>

          {bookingType === 'company' && (
            <View style={styles.b2bFields}>
              {/* Number of Buses */}
              <View style={styles.b2bFieldRow}>
                <Text style={styles.b2bFieldLabel}>Number of Buses</Text>
                <View style={styles.b2bStepperRow}>
                  <TouchableOpacity
                    style={styles.b2bStepBtn}
                    onPress={() => {
                      const v = Math.max(1, parseInt(numberOfBuses || '1') - 1);
                      setNumberOfBuses(String(v));
                    }}
                  >
                    <Ionicons name="remove" size={wp('4.5%')} color={TEAL_MID} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.b2bStepInput}
                    value={numberOfBuses}
                    onChangeText={(t) => setNumberOfBuses(t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.b2bStepBtn}
                    onPress={() => {
                      const v = Math.min(100, parseInt(numberOfBuses || '1') + 1);
                      setNumberOfBuses(String(v));
                    }}
                  >
                    <Ionicons name="add" size={wp('4.5%')} color={TEAL_MID} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Number of Persons (optional) */}
              <View style={styles.b2bFieldRow}>
                <Text style={styles.b2bFieldLabel}>Total Persons (optional)</Text>
                <TextInput
                  style={styles.b2bPersonsInput}
                  value={numberOfPersons}
                  onChangeText={(t) => setNumberOfPersons(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="e.g. 200"
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>

              <View style={styles.b2bInfoPill}>
                <Ionicons name="information-circle" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.b2bInfoPillText}>
                  B2B booking: Vendors will send quotes. Post-trip corporate billing.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.preferencesContainer}>
        <TouchableOpacity
          style={[styles.preferenceCard, needAC && styles.preferenceCardActive]}
          onPress={() => setNeedAC(!needAC)}
          activeOpacity={0.7}
        >
          <View style={[styles.prefIconCircle, needAC && { backgroundColor: TEAL_LIGHT }]}>
            <Ionicons
              name={needAC ? 'snow' : 'snow-outline'}
              size={wp('6.5%')}
              color={needAC ? TEAL : TEXT_SECONDARY}
            />
          </View>
          <Text style={[styles.preferenceText, needAC && styles.preferenceTextActive]}>
            AC Required
          </Text>
          {needAC && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={wp('4.5%')} color={TEAL} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.preferenceCard, needLuxury && styles.preferenceCardActive]}
          onPress={() => setNeedLuxury(!needLuxury)}
          activeOpacity={0.7}
        >
          <View style={[styles.prefIconCircle, needLuxury && { backgroundColor: TEAL_LIGHT }]}>
            <Ionicons
              name={needLuxury ? 'diamond' : 'diamond-outline'}
              size={wp('6.5%')}
              color={needLuxury ? TEAL : TEXT_SECONDARY}
            />
          </View>
          <Text style={[styles.preferenceText, needLuxury && styles.preferenceTextActive]}>
            Luxury Bus
          </Text>
          {needLuxury && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={wp('4.5%')} color={TEAL} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.preferenceCard, needSleeper && styles.preferenceCardActive]}
          onPress={() => setNeedSleeper(!needSleeper)}
          activeOpacity={0.7}
        >
          <View style={[styles.prefIconCircle, needSleeper && { backgroundColor: TEAL_LIGHT }]}>
            <Ionicons
              name={needSleeper ? 'bed' : 'bed-outline'}
              size={wp('6.5%')}
              color={needSleeper ? TEAL : TEXT_SECONDARY}
            />
          </View>
          <Text style={[styles.preferenceText, needSleeper && styles.preferenceTextActive]}>
            Sleeper Bus
          </Text>
          {needSleeper && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={wp('4.5%')} color={TEAL} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.textInputContainer}>
        <Text style={styles.textInputLabel}>Additional Requirements</Text>
        <TextInput
          style={styles.textArea}
          value={requirements}
          onChangeText={setRequirements}
          placeholder="E.g., decorations, specific timing requirements, etc..."
          placeholderTextColor={TEXT_MUTED}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setRequirements('');
          setNeedAC(true);
          setNeedLuxury(false);
          setNeedSleeper(false);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.skipButtonText}>Skip & Use Defaults</Text>
      </TouchableOpacity>
    </View>
  );

  // STEP 8: Confirmation
  const renderStep8 = () => {
    const isB2B = !!b2bBookingResponse;

    return (
      <View style={styles.confirmationContainer}>
        <LinearGradient
          colors={[TEAL_MID, TEAL]}
          style={styles.successCircle}
        >
          <Ionicons name="checkmark" size={wp('14%')} color="#fff" />
        </LinearGradient>

        <Text style={styles.confirmTitle}>
          {isB2B ? 'B2B Booking Created!' : 'Quote Request Submitted!'}
        </Text>
        <Text style={styles.confirmSubtitle}>
          {isB2B
            ? `Your B2B bus booking for ${numberOfBuses} bus${parseInt(numberOfBuses) > 1 ? 'es' : ''} has been created. Vendors will be notified and send quotes.`
            : "Your bus rental quote request has been sent to verified vendors. You'll receive competitive quotes within 24-48 hours."}
        </Text>

        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name={isB2B ? 'business-outline' : 'document-text-outline'} size={wp('5%')} color={TEAL} />
            </View>
            <View style={{ flex: 1, marginLeft: wp('3%') }}>
              <Text style={styles.confirmLabel}>{isB2B ? 'Booking Number' : 'Request ID'}</Text>
              <Text style={styles.confirmValue}>
                {isB2B ? b2bBookingResponse.bookingNumber : `#${confirmedRequestId}`}
              </Text>
            </View>
          </View>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="bus-outline" size={wp('5%')} color={TEAL} />
            </View>
            <View style={{ flex: 1, marginLeft: wp('3%') }}>
              <Text style={styles.confirmLabel}>Trip Type</Text>
              <Text style={styles.confirmValue}>
                {tripType.charAt(0).toUpperCase() + tripType.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="people-outline" size={wp('5%')} color={TEAL} />
            </View>
            <View style={{ flex: 1, marginLeft: wp('3%') }}>
              <Text style={styles.confirmLabel}>{isB2B ? 'Buses Required' : 'Passengers'}</Text>
              <Text style={styles.confirmValue}>
                {isB2B ? `${numberOfBuses} bus${parseInt(numberOfBuses) > 1 ? 'es' : ''}` : `${passengers} people`}
              </Text>
            </View>
          </View>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="calendar-outline" size={wp('5%')} color={TEAL} />
            </View>
            <View style={{ flex: 1, marginLeft: wp('3%') }}>
              <Text style={styles.confirmLabel}>Journey Date</Text>
              <Text style={styles.confirmValue}>
                {pickupDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (isB2B) {
              navigation.navigate('B2BBookingDetail', { bookingId: b2bBookingResponse.id });
            } else {
              navigation.navigate('BusQuoteRequestDetail', { requestId: confirmedRequestId });
            }
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[TEAL_MID, TEAL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>
              {isB2B ? 'View B2B Booking' : 'View Quote Request'}
            </Text>
            <Ionicons name="arrow-forward" size={wp('5%')} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('CustomerDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={wp('5%')} color={TEAL} />
          <Text style={styles.secondaryBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ========== STEP INDICATOR ==========
  const renderStepIndicator = () => {
    if (step >= 8) return null;
    const stepsArr = [];
    for (let i = 1; i <= totalSteps; i++) {
      stepsArr.push(i);
    }
    return (
      <View style={styles.stepIndicatorWrap}>
        {stepsArr.map((s, idx) => (
          <React.Fragment key={s}>
            {s <= step ? (
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotCurrent,
                ]}
              >
                {s < step ? (
                  <Ionicons name="checkmark" size={wp('2.8%')} color="#fff" />
                ) : (
                  <Text style={styles.stepDotText}>{s}</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.stepDotInactive}>
                <Text style={styles.stepDotTextInactive}>{s}</Text>
              </View>
            )}
            {idx < stepsArr.length - 1 && (
              <View style={[styles.stepConnector, s < step && styles.stepConnectorActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // ========== MAIN RETURN ==========
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Premium Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {renderDecoCircles()}
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bus Rental</Text>
          {step < 8 && (
            <Text style={styles.headerSubtitle}>
              Step {step} of {totalSteps}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBusBookings')}
          style={styles.myBookingsBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={wp('5%')} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}
        {step === 8 && renderStep8()}
      </ScrollView>

      {/* Next Button */}
      {step < 8 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={submitting ? [TEXT_MUTED, TEXT_MUTED] : [TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step === 7
                      ? (bookingType === 'company'
                        ? `Request B2B Quote (${numberOfBuses} Bus${parseInt(numberOfBuses) > 1 ? 'es' : ''})`
                        : 'Submit Request')
                      : 'Continue'}
                  </Text>
                  <Ionicons name="arrow-forward" size={wp('5%')} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Phone Collection Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.phoneModal}>
            <View style={styles.phoneModalHandle} />
            <View style={styles.phoneModalHeader}>
              <Text style={styles.phoneModalTitle}>Add Phone Number</Text>
              <TouchableOpacity
                onPress={() => setShowPhoneModal(false)}
                style={styles.phoneModalClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={wp('5.5%')} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.phoneModalContent}>
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.phoneIconCircle}
              >
                <Ionicons name="call-outline" size={wp('8%')} color="#fff" />
              </LinearGradient>
              <Text style={styles.phoneModalText}>
                We need your phone number to process your booking request and send you quotes from vendors.
              </Text>

              <View style={styles.phoneInputGroup}>
                <View style={styles.phoneInputIcon}>
                  <Ionicons name="call" size={wp('4.5%')} color={TEAL} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.phoneSubmitBtn, phoneLoading && styles.phoneSubmitBtnDisabled]}
                onPress={handlePhoneSubmit}
                disabled={phoneLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={phoneLoading ? [TEXT_MUTED, TEXT_MUTED] : [TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.phoneSubmitGradient}
                >
                  {phoneLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.phoneSubmitBtnText}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // --- Decorative circles ---
  decoCircle1: {
    position: 'absolute',
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -wp('10%'),
    right: -wp('8%'),
  },
  decoCircle2: {
    position: 'absolute',
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('5%'),
    left: -wp('5%'),
  },
  decoCircle3: {
    position: 'absolute',
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: wp('2%'),
    left: wp('20%'),
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('0.5%') : hp('1%'),
    paddingBottom: hp('1.5%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.2%'),
  },
  myBookingsBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // --- Step Indicator ---
  stepIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: CARD,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepDot: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCurrent: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
  },
  stepDotInactive: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  stepDotText: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#fff',
  },
  stepDotTextInactive: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  stepConnector: {
    flex: 1,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginHorizontal: wp('0.5%'),
  },
  stepConnectorActive: {
    borderTopColor: TEAL,
  },

  // --- Content ---
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: hp('2%'),
  },
  stepContainer: {
    flex: 1,
  },

  // --- Step Hero ---
  stepHero: {
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    marginBottom: hp('1.5%'),
  },
  stepHeroIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  stepHeroTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp('0.3%'),
  },
  stepHeroSubtitle: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // --- Trip Type Grid ---
  tripTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    rowGap: hp('1.2%'),
  },
  tripTypeCard: {
    width: wp('44%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    position: 'relative',
    ...SHADOW_SM,
  },
  tripTypeCardActive: {
    backgroundColor: '#F0FDF4',
  },
  tripTypeIcon: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.6%'),
  },
  tripTypeLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.2%'),
  },
  tripTypeDesc: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Location Input ---
  inputContainer: {
    paddingHorizontal: wp('4%'),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    borderWidth: 1,
    borderColor: BORDER,
    gap: wp('2.5%'),
    ...SHADOW_SM,
  },
  searchIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.5%'),
  },
  dropdown: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginTop: hp('1%'),
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: hp('30%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: wp('3%'),
  },
  dropdownIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    flex: 1,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('4%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    gap: wp('3%'),
    borderWidth: 1.5,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  selectedLocationIcon: {
    // wrapper for icon alignment
  },
  selectedLocationText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEAL_DEEP,
    flex: 1,
  },
  selectedLocationClear: {
    marginLeft: 'auto',
  },
  manualEntryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3.5%'),
    marginTop: hp('1.2%'),
    gap: wp('2%'),
    borderWidth: 1,
    borderColor: TEAL,
  },
  manualEntryText: {
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    flex: 1,
  },

  // --- Passengers ---
  passengerCard: {
    marginHorizontal: wp('4%'),
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('4%'),
    ...SHADOW_MD,
  },
  passengerInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('6%'),
  },
  passengerButton: {
    // wrapper
  },
  passengerBtnGradient: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  passengerDisplay: {
    alignItems: 'center',
  },
  passengerInput: {
    fontSize: wp('14%'),
    fontWeight: '700',
    color: TEAL,
    textAlign: 'center',
    minWidth: wp('25%'),
  },
  passengerLabel: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
  },
  quickSelectContainer: {
    marginTop: hp('3%'),
    paddingHorizontal: wp('4%'),
  },
  quickSelectLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: hp('1.2%'),
    textAlign: 'center',
  },
  quickSelectButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('2.5%'),
  },
  quickSelectBtn: {
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    minWidth: wp('13%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  quickSelectBtnActive: {
    borderColor: TEAL,
    borderWidth: 0,
  },
  quickSelectBtnGradientInner: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  quickSelectBtnText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
  },
  quickSelectBtnTextActive: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#fff',
  },

  // --- Date Time ---
  dateTimeContainer: {
    gap: hp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  dateTimeIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: wp('3.2%'),
    color: TEAL,
    fontWeight: '600',
    marginBottom: hp('0.3%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeValue: {
    fontSize: wp('4.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  dateTimeChevron: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    marginHorizontal: wp('4%'),
    gap: wp('2.5%'),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noteIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteText: {
    fontSize: wp('3.2%'),
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
  },

  // --- Preferences ---
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    gap: hp('1%'),
  },
  preferenceCard: {
    width: wp('28%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BORDER,
    position: 'relative',
    ...SHADOW_SM,
  },
  preferenceCardActive: {
    borderColor: TEAL,
    backgroundColor: '#F0FDF4',
  },
  prefIconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  preferenceText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  preferenceTextActive: {
    color: TEAL_DEEP,
  },
  preferenceCheck: {
    position: 'absolute',
    top: wp('1.5%'),
    right: wp('1.5%'),
  },
  textInputContainer: {
    marginTop: hp('2.5%'),
    paddingHorizontal: wp('4%'),
  },
  textInputLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: hp('1%'),
  },
  textArea: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: hp('14%'),
    ...SHADOW_SM,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: hp('2%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: BG,
  },
  skipButtonText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },

  // --- B2B Section ---
  b2bSection: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  b2bSectionLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1%'),
  },
  b2bToggleRow: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: wp('3%'),
    padding: wp('1%'),
    gap: wp('1%'),
  },
  b2bToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    gap: wp('1.5%'),
  },
  b2bToggleBtnActive: {
    backgroundColor: TEAL_MID,
  },
  b2bToggleBtnText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  b2bToggleBtnTextActive: {
    color: '#fff',
  },
  b2bFields: {
    marginTop: hp('1.5%'),
    gap: hp('1.2%'),
  },
  b2bFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  b2bFieldLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    flex: 1,
  },
  b2bStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  b2bStepBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b2bStepInput: {
    width: wp('14%'),
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: TEAL,
    paddingVertical: hp('0.5%'),
  },
  b2bPersonsInput: {
    width: wp('30%'),
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: wp('2%'),
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('3%'),
  },
  b2bInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    marginTop: hp('0.5%'),
  },
  b2bInfoPillText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '500',
    flex: 1,
  },

  // --- Confirmation ---
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
    paddingHorizontal: wp('5%'),
  },
  successCircle: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
    ...SHADOW_LG,
  },
  confirmTitle: {
    fontSize: wp('6.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  confirmSubtitle: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: hp('2.8%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('3%'),
  },
  confirmCard: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    width: '100%',
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_MD,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
  },
  confirmIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: hp('0.3%'),
  },
  confirmLabel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.2%'),
  },
  confirmValue: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.2%'),
    ...SHADOW_MD,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    gap: wp('2%'),
  },
  primaryBtnText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    width: '100%',
    gap: wp('2%'),
    borderWidth: 2,
    borderColor: TEAL,
  },
  secondaryBtnText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEAL_DEEP,
  },

  // --- Footer ---
  footer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextButton: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    gap: wp('2%'),
  },
  nextButtonText: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#fff',
  },

  // --- Phone Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  phoneModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '70%',
    width: '100%',
  },
  phoneModalHandle: {
    width: wp('10%'),
    height: hp('0.5%'),
    backgroundColor: '#D1D5DB',
    borderRadius: hp('0.25%'),
    alignSelf: 'center',
    marginTop: hp('1%'),
  },
  phoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  phoneModalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  phoneModalClose: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneModalContent: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('3%'),
    alignItems: 'center',
  },
  phoneIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  phoneModalText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('2.5%'),
    lineHeight: hp('2.8%'),
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('2.5%'),
    width: '100%',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  phoneInputIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },
  phoneInput: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    paddingHorizontal: wp('2%'),
    fontSize: wp('4%'),
    color: TEXT_PRIMARY,
  },
  phoneSubmitBtn: {
    width: '100%',
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  phoneSubmitBtnDisabled: {
    opacity: 0.6,
  },
  phoneSubmitGradient: {
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneSubmitBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
  },
});
