import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../api';
import bookingService from '../../services/bookingService';

/* ── Design System ─────────────────────────── */
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
    shadowOffset: { width: 0, height: wp('0.5%') },
    shadowOpacity: 0.08,
    shadowRadius: wp('2%'),
  },
  android: { elevation: 3 },
});

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: wp('1%') },
    shadowOpacity: 0.12,
    shadowRadius: wp('3%'),
  },
  android: { elevation: 6 },
});

const SHADOW_LG = Platform.select({
  ios: {
    shadowColor: TEAL_DEEP,
    shadowOffset: { width: 0, height: wp('1.5%') },
    shadowOpacity: 0.18,
    shadowRadius: wp('4%'),
  },
  android: { elevation: 10 },
});

const STEP_LABELS = [
  'Pickup',
  'Destination',
  'Start Date',
  'Return Date',
  'Passengers',
  'Details',
];

const cities = [
  { id: 3, name: 'Ahmedabad', img: require('../../../assets/ahmedabad.png') },
  { id: 5, name: 'Bangalore', img: require('../../../assets/bangalore.png') },
  { id: 7, name: 'Udaipur', img: require('../../../assets/udaipur.png') },
  { id: 8, name: 'Goa', img: require('../../../assets/goa.png') },
  { id: 10, name: 'Hyderabad', img: require('../../../assets/hyderabad.png') },
  { id: 13, name: 'Delhi', img: require('../../../assets/delhi.png') },
  { id: 12, name: 'Mumbai', img: require('../../../assets/mumbai.png') },
  { id: 14, name: 'Jaipur', img: require('../../../assets/jaipur.png') },
];

// Function to get today's date formatted as "YYYY-MM-DD"
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};

const OutstationScreen = () => {
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  const [returnDate, setReturnDate] = useState(new Date()); // Date object for Return Date
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState('');  // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const navigation = useNavigation();
  const [totalPassengers, setTotalPassengers] = useState('');
  const route = useRoute();  // Use this to access route params
  const [selectedService, setSelectedService] = useState(route.params?.service || null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      if (res.data.success || res.data.status) {
        const locs = res.data.locations || res.data.data || [];
        setAllLocations(locs);
        setFilteredLocations(locs);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Handle input change and filter locations dynamically
  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(''); // Reset pickupLocation when typing starts
    if (text.length === 0) {
      // If the query is empty, show all locations
      setFilteredLocations(allLocations);
      setShowNoResults(false);
    } else {
      // Filter locations that match the query
      const filtered = allLocations.filter((city) =>
        city.name.toLowerCase().includes(text.trim().toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowNoResults(filtered.length === 0); // Show "No results" if no matching locations
    }
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setPickupLocation(location.name);  // Set pickup location name
    setPickupLocationId(location.id);  // Set pickup location ID
    setQuery('');  // Clear query after selecting location
  };

  const nextStep = () => {
    if (step === 0 && (!pickupLocation || !pickupLocationId)) return alert('Please select a pickup location');
    if (step === 1 && !destination) return alert('Please enter destination');
    if (step === 2 && !startDate) return alert('Please select Date');
    if (step === 3 && !returnDate) return alert('Please select Date');
    // if (step === 2 && !selectedVehicleTyes) return alert('Please select Vehicle Type');
    if (step === 4 && !totalPassengers) return alert('Please enter the number of passengers');
    // if (step === 3 && !selectedBikeType) return alert('Please select bike type');
    setStep(prev => Math.min(prev + 1, 7));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  // Open the Start Date and Time picker
  const openStartDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: startDate,
      mode: 'date', // Date picker first
      is24Hour: true,
      minDate: getTodayDate(), // Disable past dates
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;
        // Check if the selected date is in the past, reset to today if so
        if (date < getTodayDate()) {
          alert("You cannot select past dates. Selecting today instead.");
          setStartDate(getTodayDate());
          return;
        }
        setStartDate(date); // Set the selected date
        // Open time picker after selecting date
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (eventTime, time) => {
            if (eventTime.type === 'dismissed' || !time) return;
            const finalDateTime = new Date(date);
            finalDateTime.setHours(time.getHours());
            finalDateTime.setMinutes(time.getMinutes());
            setStartDate(finalDateTime); // Set final date and time
          },
        });
      },
    });
  };

  // Open the Return Date and Time picker
  const openReturnDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: returnDate,
      mode: 'date',
      is24Hour: true,
      minDate: getTodayDate(),
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;
        // Check if the selected date is in the past, reset to today if so
        if (date < getTodayDate()) {
          alert("You cannot select past dates. Selecting today instead.");
          setReturnDate(getTodayDate());
          return;
        }
        setReturnDate(date);
        // Open time picker after selecting date
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (eventTime, time) => {
            if (eventTime.type === 'dismissed' || !time) return;
            const finalDateTime = new Date(date);
            finalDateTime.setHours(time.getHours());
            finalDateTime.setMinutes(time.getMinutes());
            setReturnDate(finalDateTime);
          },
        });
      },
    });
  };

  const handleBookingSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const customerStr = await AsyncStorage.getItem("customer");
      const customer = customerStr ? JSON.parse(customerStr) : null;

      if (!customer?.id) {
        alert('Please login first');
        setIsSubmitting(false);
        return;
      }

      const requestData = {
        customerId: customer.id,
        customerName: customer.name || customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        tripType: 'outstation',
        busType: 'standard',
        passengerCount: parseInt(totalPassengers) || 1,
        pickupCity: pickupLocation,
        pickupAddress: pickupLocation,
        pickupDate: startDate.toISOString().split('T')[0],
        pickupTime: startDate.toTimeString().split(' ')[0].slice(0, 5),
        dropCity: destination,
        dropAddress: destination,
        returnDate: returnDate.toISOString().split('T')[0],
        returnTime: returnDate.toTimeString().split(' ')[0].slice(0, 5),
        requirements: otherDetails,
      };

      const response = await bookingService.createBusQuoteRequest(requestData);

      if (response.success || response.id || response.quoteRequest) {
        navigation.navigate('BookingConfirmation', {
          booking_id: response?.quoteRequest?.requestNumber || response?.quoteRequest?.id || response?.id,
          bookingType: 'bus',
          service_name: 'Bus Rental',
          service_type: 'bus',
          message: 'Your bus rental quote request has been submitted. Vendors will send you quotes shortly.'
        });
      } else {
        alert('Booking failed. Please try again.');
      }
    } catch (error) {
      console.error("Booking error:", error?.response?.data || error);
      alert(error?.response?.data?.error || 'There was an error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Header ──────────────────────────────── */
  const renderHeader = () => (
    <LinearGradient
      colors={[TEAL_DEEP, TEAL_MID, '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* Decorative circles */}
      <View style={[styles.decoCircle, styles.decoCircle1]} pointerEvents="none" />
      <View style={[styles.decoCircle, styles.decoCircle2]} pointerEvents="none" />
      <View style={[styles.decoCircle, styles.decoCircle3]} pointerEvents="none" />

      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Outstation Bus</Text>
          <Text style={styles.headerSubtitle}>Book your intercity journey</Text>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="bus" size={wp('7%')} color="rgba(255,255,255,0.25)" />
        </View>
      </View>
    </LinearGradient>
  );

  /* ── Step Indicator ──────────────────────── */
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorRow}>
      {STEP_LABELS.map((label, i) => {
        const isActive = i === step;
        const isDone = i < step;
        return (
          <View key={i} style={styles.stepItem}>
            {isActive ? (
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.stepCircleActive}
              >
                <Text style={styles.stepNumActive}>{i + 1}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.stepCircle,
                  isDone && styles.stepCircleDone,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={wp('3%')} color="#fff" />
                ) : (
                  <Text style={styles.stepNum}>{i + 1}</Text>
                )}
              </View>
            )}
            <Text
              style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isDone && styles.stepLabelDone,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {i < STEP_LABELS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  isDone && styles.stepLineDone,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  /* ── Navigation Buttons ──────────────────── */
  const renderNavButtons = (showBack = true, nextLabel = 'Next', onNext = nextStep, loading = false) => (
    <View style={styles.navRow}>
      {showBack && step > 0 ? (
        <TouchableOpacity
          style={styles.backNavBtn}
          onPress={prevStep}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={wp('4.5%')} color={TEAL_MID} />
          <Text style={styles.backNavText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onNext}
        disabled={loading}
        style={{ borderRadius: wp('3%'), ...SHADOW_MD }}
      >
        <LinearGradient
          colors={loading ? [TEXT_MUTED, TEXT_SECONDARY] : [TEAL_MID, TEAL]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextGradBtn}
        >
          {loading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.nextGradText}>Submitting...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.nextGradText}>{nextLabel}</Text>
              {nextLabel !== 'Submit' && (
                <Ionicons name="arrow-forward" size={wp('4.5%')} color="#fff" style={{ marginLeft: wp('1.5%') }} />
              )}
              {nextLabel === 'Submit' && (
                <Ionicons name="checkmark-circle" size={wp('4.5%')} color="#fff" style={{ marginLeft: wp('1.5%') }} />
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  /* ── Steps ───────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="location" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Pickup Location</Text>
                <Text style={styles.sectionSubtitle}>Search or select a city below</Text>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.inputCard}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="search" size={wp('4.5%')} color={TEAL} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Type city name..."
                placeholderTextColor={TEXT_MUTED}
                value={query.length > 0 ? query : pickupLocation}
                onChangeText={handleInputChange}
              />
              {(query.length > 0 || pickupLocation.length > 0) && (
                <TouchableOpacity
                  onPress={() => { setQuery(''); setPickupLocation(''); setPickupLocationId(null); }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions dropdown */}
            {query.length > 0 && (
              <View style={styles.suggestionWrapper}>
                <ScrollView
                  style={styles.suggestionBox}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {filteredLocations.length > 0 ? (
                    filteredLocations.slice(0, 500).map((city) => (
                      <TouchableOpacity
                        key={city.id}
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(city)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="location-outline" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2.5%') }} />
                        <Text style={styles.suggestionText}>{city.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noResultWrap}>
                      <Ionicons name="alert-circle-outline" size={wp('5%')} color={TEXT_MUTED} />
                      <Text style={styles.noResultText}>No location found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* City Grid */}
            <Text style={styles.gridHeading}>Popular Cities</Text>
            <View style={styles.gridContainer}>
              {cities.map((city) => {
                const isSelected = city.id === pickupLocationId;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityBox, isSelected && styles.cityBoxSelected]}
                    onPress={() => handleLocationSelect(city)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.cityCheckBadge}>
                        <Ionicons name="checkmark-circle" size={wp('5%')} color={TEAL} />
                      </View>
                    )}
                    <Image source={city.img} style={styles.cityImage} />
                    <View style={styles.cityNameWrap}>
                      <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>{city.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {renderNavButtons(false, 'Next')}
            <View style={{ height: hp('3%') }} />
          </ScrollView>
        );

      case 1:
        return (
          <View style={styles.stepBody}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="flag" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Destination</Text>
                <Text style={styles.sectionSubtitle}>Where do you want to go?</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.inputIconWrap}>
                <Ionicons name="navigate" size={wp('4.5%')} color={TEAL} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Enter destination city"
                placeholderTextColor={TEXT_MUTED}
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            {/* Route summary mini card */}
            {pickupLocation ? (
              <View style={styles.routeSummaryCard}>
                <View style={styles.routeRow}>
                  <View style={styles.routeDotGreen} />
                  <Text style={styles.routeText}>{pickupLocation}</Text>
                </View>
                <View style={styles.routeDash} />
                <View style={styles.routeRow}>
                  <View style={styles.routeDotTeal} />
                  <Text style={styles.routeText}>{destination || 'Destination'}</Text>
                </View>
              </View>
            ) : null}

            {renderNavButtons(true, 'Next')}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepBody}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="calendar" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Start Date & Time</Text>
                <Text style={styles.sectionSubtitle}>When do you want to depart?</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openStartDateTimePicker}
              style={styles.datePickerCard}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconCircle}>
                <Ionicons name="calendar-outline" size={wp('6%')} color={TEAL} />
              </View>
              <View style={styles.dateTextWrap}>
                <Text style={styles.dateLabel}>Departure</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={wp('5%')} color={TEXT_MUTED} />
            </TouchableOpacity>

            {renderNavButtons(true, 'Next')}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepBody}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="return-down-back" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Return Date & Time</Text>
                <Text style={styles.sectionSubtitle}>When do you want to return?</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openReturnDateTimePicker}
              style={styles.datePickerCard}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconCircle}>
                <Ionicons name="calendar-outline" size={wp('6%')} color={TEAL} />
              </View>
              <View style={styles.dateTextWrap}>
                <Text style={styles.dateLabel}>Return</Text>
                <Text style={styles.dateValue}>{returnDate.toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={wp('5%')} color={TEXT_MUTED} />
            </TouchableOpacity>

            {renderNavButtons(true, 'Next')}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepBody}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="people" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Total Passengers</Text>
                <Text style={styles.sectionSubtitle}>How many travellers?</Text>
              </View>
            </View>

            <View style={styles.passengerCard}>
              <View style={styles.passengerIconCircle}>
                <Ionicons name="people-outline" size={wp('8%')} color={TEAL} />
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const val = Math.max(1, (parseInt(totalPassengers) || 1) - 1);
                    setTotalPassengers(String(val));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={wp('5%')} color="#fff" />
                </TouchableOpacity>
                <TextInput
                  style={styles.passengerInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={TEXT_MUTED}
                  value={totalPassengers}
                  onChangeText={setTotalPassengers}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const val = (parseInt(totalPassengers) || 0) + 1;
                    setTotalPassengers(String(val));
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={wp('5%')} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.passengerHint}>Tap the buttons or type a number</Text>
            </View>

            {renderNavButtons(true, 'Next')}
          </View>
        );

      case 5:
        return (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="document-text" size={wp('5%')} color={TEAL} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Additional Details</Text>
                <Text style={styles.sectionSubtitle}>Any special requirements?</Text>
              </View>
            </View>

            <View style={[styles.inputCard, { alignItems: 'flex-start', minHeight: hp('15%') }]}>
              <View style={[styles.inputIconWrap, { marginTop: hp('0.5%') }]}>
                <Ionicons name="create-outline" size={wp('4.5%')} color={TEAL} />
              </View>
              <TextInput
                style={[styles.inputField, { minHeight: hp('14%'), textAlignVertical: 'top' }]}
                placeholder="Enter any details, preferences, or requirements..."
                placeholderTextColor={TEXT_MUTED}
                multiline
                value={otherDetails}
                onChangeText={setOtherDetails}
              />
            </View>

            {/* Booking Summary Card */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={[TEAL_DEEP, TEAL_MID]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.summaryHeader}
              >
                <Ionicons name="receipt-outline" size={wp('4.5%')} color="#fff" />
                <Text style={styles.summaryHeaderText}>Booking Summary</Text>
              </LinearGradient>
              <View style={styles.summaryBody}>
                <SummaryRow icon="location" label="Pickup" value={pickupLocation || '-'} />
                <SummaryRow icon="flag" label="Destination" value={destination || '-'} />
                <SummaryRow icon="calendar" label="Start" value={startDate.toLocaleString()} />
                <SummaryRow icon="return-down-back" label="Return" value={returnDate.toLocaleString()} />
                <SummaryRow icon="people" label="Passengers" value={totalPassengers || '-'} last />
              </View>
            </View>

            {renderNavButtons(true, 'Submit', handleBookingSubmit, isSubmitting)}
            <View style={{ height: hp('3%') }} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
      {renderHeader()}
      {renderStepIndicator()}
      {renderStep()}
    </SafeAreaView>
  );
};

/* ── Summary Row Component ─────────────────── */
const SummaryRow = ({ icon, label, value, last }) => (
  <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
    <View style={styles.summaryRowLeft}>
      <Ionicons name={icon} size={wp('4%')} color={TEAL} />
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
    <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
  </View>
);

/* ── Styles ────────────────────────────────── */
const styles = StyleSheet.create({
  /* Container */
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Header */
  header: {
    paddingTop: hp('2%'),
    paddingBottom: hp('3%'),
    paddingHorizontal: wp('5%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  headerIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle1: {
    width: wp('35%'),
    height: wp('35%'),
    top: -wp('12%'),
    right: -wp('8%'),
  },
  decoCircle2: {
    width: wp('20%'),
    height: wp('20%'),
    bottom: -wp('5%'),
    left: wp('10%'),
  },
  decoCircle3: {
    width: wp('14%'),
    height: wp('14%'),
    top: wp('2%'),
    left: -wp('5%'),
  },

  /* Step Indicator */
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.8%'),
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: -hp('1.5%'),
    borderRadius: wp('4%'),
    ...SHADOW_SM,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  stepCircleDone: {
    backgroundColor: TEAL,
  },
  stepNum: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  stepNumActive: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#fff',
  },
  stepLabel: {
    fontSize: wp('2.3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.4%'),
    textAlign: 'center',
  },
  stepLabelActive: {
    color: TEAL_MID,
    fontWeight: '600',
  },
  stepLabelDone: {
    color: TEAL,
  },
  stepLine: {
    position: 'absolute',
    top: wp('3.5%'),
    right: -wp('4%'),
    width: wp('8%'),
    height: wp('0.5%'),
    backgroundColor: BORDER,
    borderRadius: wp('0.25%'),
  },
  stepLineDone: {
    backgroundColor: TEAL,
  },

  /* Scroll + Step Body */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  stepBody: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  sectionIconCircle: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
  },

  /* Input Card */
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.3%'),
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  inputIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  inputField: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('1.5%'),
  },
  clearBtn: {
    padding: wp('1%'),
  },

  /* Suggestions */
  suggestionWrapper: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginTop: -hp('0.5%'),
    marginBottom: hp('1.5%'),
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    ...SHADOW_MD,
    zIndex: 10,
  },
  suggestionBox: {
    maxHeight: hp('25%'),
    paddingVertical: hp('0.5%'),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: wp('0.2%'),
    borderBottomColor: BORDER,
  },
  suggestionText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  noResultWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
  },
  noResultText: {
    fontSize: wp('3.3%'),
    color: TEXT_MUTED,
    marginLeft: wp('2%'),
  },

  /* City Grid */
  gridHeading: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: hp('1.2%'),
    marginTop: hp('1%'),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  cityBox: {
    width: wp('42%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
    backgroundColor: CARD,
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  cityBoxSelected: {
    borderColor: TEAL,
    borderWidth: wp('0.6%'),
    ...SHADOW_LG,
  },
  cityCheckBadge: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    zIndex: 5,
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    ...SHADOW_SM,
  },
  cityImage: {
    width: '100%',
    height: hp('11%'),
    resizeMode: 'cover',
  },
  cityNameWrap: {
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('2%'),
    alignItems: 'center',
  },
  cityName: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  cityNameSelected: {
    color: TEAL_MID,
    fontWeight: '700',
  },

  /* Route Summary Mini Card */
  routeSummaryCard: {
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDotGreen: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: TEAL,
    marginRight: wp('3%'),
  },
  routeDotTeal: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: TEAL_DEEP,
    marginRight: wp('3%'),
  },
  routeText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  routeDash: {
    width: wp('0.5%'),
    height: hp('2%'),
    backgroundColor: BORDER,
    marginLeft: wp('1%'),
    marginVertical: hp('0.5%'),
    borderRadius: wp('0.25%'),
  },

  /* Date Picker Card */
  datePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('4.5%'),
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  dateIconCircle: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
  },
  dateTextWrap: {
    flex: 1,
  },
  dateLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL_MID,
    textTransform: 'uppercase',
    letterSpacing: wp('0.2%'),
  },
  dateValue: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: hp('0.3%'),
  },

  /* Passenger Card */
  passengerCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('5%'),
    alignItems: 'center',
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  passengerIconCircle: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1%'),
  },
  stepperBtn: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  passengerInput: {
    width: wp('20%'),
    fontSize: wp('6%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginHorizontal: wp('4%'),
    borderBottomWidth: wp('0.5%'),
    borderBottomColor: BORDER,
    paddingVertical: hp('0.5%'),
  },
  passengerHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.5%'),
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('2.5%'),
    borderWidth: wp('0.3%'),
    borderColor: BORDER,
    ...SHADOW_MD,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('4%'),
  },
  summaryHeaderText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: '#fff',
    marginLeft: wp('2%'),
  },
  summaryBody: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.5%'),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1.2%'),
  },
  summaryRowBorder: {
    borderBottomWidth: wp('0.2%'),
    borderBottomColor: BORDER,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('2.5%'),
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    maxWidth: wp('50%'),
  },

  /* Navigation Buttons */
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('2%'),
    paddingBottom: hp('1%'),
  },
  backNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
  },
  backNavText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEAL_MID,
    marginLeft: wp('1.5%'),
  },
  nextGradBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('7%'),
    borderRadius: wp('3%'),
  },
  nextGradText: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: '#fff',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OutstationScreen;
