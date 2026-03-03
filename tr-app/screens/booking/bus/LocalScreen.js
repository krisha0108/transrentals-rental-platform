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
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../api';
import bookingService from '../../services/bookingService';

/* ── Color Palette ───────────────────────── */
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

/* ── Shadows ─────────────────────────────── */
const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.2%') },
    shadowOpacity: 0.06,
    shadowRadius: wp('1.5%'),
  },
  android: { elevation: 2 },
});

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.4%') },
    shadowOpacity: 0.1,
    shadowRadius: wp('3%'),
  },
  android: { elevation: 4 },
});

const SHADOW_LG = Platform.select({
  ios: {
    shadowColor: TEAL_DEEP,
    shadowOffset: { width: 0, height: hp('0.6%') },
    shadowOpacity: 0.18,
    shadowRadius: wp('4%'),
  },
  android: { elevation: 8 },
});

/* ── Step labels ─────────────────────────── */
const STEP_LABELS = ['Pickup', 'Drop', 'Start', 'Return', 'Pax', 'Details'];
const TOTAL_STEPS = 6;

/* ── Cities ──────────────────────────────── */
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

const LocalScreen = () => {
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  const [destination, setDestination] = useState('');
  // const [selectedVehicleTyes, setvehicleTypes] = useState(null);
  // const [selectedAirportType, setairportBookingType] = useState(null);
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
        city.name.toLowerCase().includes(text.toLowerCase())
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
    // if (step === 2 && !selectedAirportType) return alert('Please select airportBookingType');
    // if (step === 3 && !selectedVehicleTyes) return alert('Please select Vehicle Type');
    if (step === 2 && !startDate) return alert('Please select Date');
    if (step === 3 && !returnDate) return alert('Please select Date');
    if (step === 4 && !totalPassengers) return alert('Please enter the number of passengers');
    setStep(prev => Math.min(prev + 1, 5));
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
    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const customerStr = await AsyncStorage.getItem("customer");
      const customer = customerStr ? JSON.parse(customerStr) : null;

      if (!customer?.id) {
        alert("Please login first");
        setIsSubmitting(false);
        return;
      }

      const requestData = {
        customerId: customer.id,
        customerName: customer.name || customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        tripType: 'local',
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
        navigation.navigate("BookingConfirmation", {
          bookingType: 'bus',
          message: 'Your bus rental quote request has been submitted. Vendors will send you quotes shortly.'
        });
      } else {
        alert("Booking failed. Please try again.");
      }
    } catch (error) {
      console.error("Booking error:", error?.response?.data || error);
      alert(error?.response?.data?.error || "There was an error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step Indicator ────────────────────────── */
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorRow}>
      {STEP_LABELS.map((label, i) => {
        const isActive = i === step;
        const isDone = i < step;
        return (
          <View key={i} style={styles.stepIndicatorItem}>
            {/* Connector line before circle (skip first) */}
            {i > 0 && (
              <View
                style={[
                  styles.stepConnector,
                  (isDone || isActive) && styles.stepConnectorActive,
                ]}
              />
            )}
            {isActive ? (
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.stepCircle}
              >
                <Text style={styles.stepCircleTextActive}>{i + 1}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.stepCircle,
                  isDone
                    ? styles.stepCircleDone
                    : styles.stepCirclePending,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={wp('3.2%')} color={CARD} />
                ) : (
                  <Text style={styles.stepCircleTextPending}>{i + 1}</Text>
                )}
              </View>
            )}
            <Text
              style={[
                styles.stepLabel,
                (isActive || isDone) && styles.stepLabelActive,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  /* ── Bottom Buttons ────────────────────────── */
  const renderBottomButtons = ({ showBack = true, nextLabel = 'Next', onNext, isLoading = false }) => (
    <View style={styles.bottomRow}>
      {showBack ? (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={prevStep}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={wp('5%')} color={TEAL_MID} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={onNext}
        disabled={isLoading}
        activeOpacity={0.85}
        style={{ borderRadius: wp('3%'), ...SHADOW_MD }}
      >
        <LinearGradient
          colors={isLoading ? [TEXT_MUTED, TEXT_SECONDARY] : [TEAL_MID, TEAL]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextGradientBtn}
        >
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={CARD} />
              <Text style={styles.nextGradientBtnText}>Submitting...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.nextGradientBtnText}>{nextLabel}</Text>
              {nextLabel !== 'Submit' && (
                <Ionicons name="arrow-forward" size={wp('4.5%')} color={CARD} style={{ marginLeft: wp('1.5%') }} />
              )}
              {nextLabel === 'Submit' && (
                <Ionicons name="checkmark-circle" size={wp('4.5%')} color={CARD} style={{ marginLeft: wp('1.5%') }} />
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepContainer}>
              {/* Section label */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="location" size={wp('5%')} color={TEAL} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Pickup Location</Text>
                  <Text style={styles.sectionSubtitle}>Search or select your city</Text>
                </View>
              </View>

              {/* Search input */}
              <View style={styles.inputCard}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="search" size={wp('4%')} color={TEAL} />
                </View>
                <TextInput
                  style={styles.inputField}
                  placeholder="Type or select an option"
                  placeholderTextColor={TEXT_MUTED}
                  value={query.length > 0 ? query : pickupLocation}
                  onChangeText={handleInputChange}
                />
                {(query.length > 0 || pickupLocation.length > 0) && (
                  <TouchableOpacity
                    onPress={() => {
                      setQuery('');
                      setPickupLocation('');
                      setPickupLocationId(null);
                      setFilteredLocations(allLocations);
                    }}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestion dropdown */}
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
                        >
                          <Ionicons name="location-outline" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                          <Text style={styles.suggestionText}>{city.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResultText}>No location found</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* City grid */}
              <Text style={styles.gridLabel}>Popular Cities</Text>
              <View style={styles.gridContainer}>
                {cities.map((city) => {
                  const isSelected = city.id === pickupLocationId;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[styles.cityCard, isSelected && styles.cityCardSelected]}
                      onPress={() => handleLocationSelect(city)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <View style={styles.citySelectedBadge}>
                          <Ionicons name="checkmark-circle" size={wp('5%')} color={TEAL} />
                        </View>
                      )}
                      <Image source={city.img} style={styles.cityImage} />
                      <View style={styles.cityNameRow}>
                        <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                          {city.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {renderBottomButtons({ showBack: false, onNext: nextStep })}
            </View>
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="navigate" size={wp('5%')} color={TEAL} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Destination Location</Text>
                  <Text style={styles.sectionSubtitle}>Where are you headed?</Text>
                </View>
              </View>

              <View style={styles.inputCard}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="flag" size={wp('4%')} color={TEAL} />
                </View>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter destination"
                  placeholderTextColor={TEXT_MUTED}
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              {/* Illustration card */}
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={[TEAL_LIGHT, '#ECFDF5']}
                  style={styles.infoCardGradient}
                >
                  <Ionicons name="information-circle" size={wp('5.5%')} color={TEAL_MID} />
                  <Text style={styles.infoCardText}>
                    Enter a specific address or area name for better service.
                  </Text>
                </LinearGradient>
              </View>

              {renderBottomButtons({ onNext: nextStep })}
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="calendar" size={wp('5%')} color={TEAL} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Start Date & Time</Text>
                  <Text style={styles.sectionSubtitle}>When do you need the bus?</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={openStartDateTimePicker}
                style={styles.dateCard}
                activeOpacity={0.8}
              >
                <View style={styles.dateCardInner}>
                  <View style={styles.dateIconCircle}>
                    <Ionicons name="time" size={wp('6%')} color={TEAL} />
                  </View>
                  <View style={styles.dateTextCol}>
                    <Text style={styles.dateLabel}>Pickup Date & Time</Text>
                    <Text style={styles.dateValue}>{startDate.toLocaleString()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={wp('5%')} color={TEXT_MUTED} />
                </View>
              </TouchableOpacity>

              {renderBottomButtons({ onNext: nextStep })}
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="calendar-outline" size={wp('5%')} color={TEAL} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Return Date & Time</Text>
                  <Text style={styles.sectionSubtitle}>When should the bus return?</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={openReturnDateTimePicker}
                style={styles.dateCard}
                activeOpacity={0.8}
              >
                <View style={styles.dateCardInner}>
                  <View style={styles.dateIconCircle}>
                    <Ionicons name="return-down-back" size={wp('6%')} color={TEAL} />
                  </View>
                  <View style={styles.dateTextCol}>
                    <Text style={styles.dateLabel}>Return Date & Time</Text>
                    <Text style={styles.dateValue}>{returnDate.toLocaleString()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={wp('5%')} color={TEXT_MUTED} />
                </View>
              </TouchableOpacity>

              {renderBottomButtons({ onNext: nextStep })}
            </View>
          </ScrollView>
        );

      case 4:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="people" size={wp('5%')} color={TEAL} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Total Passengers</Text>
                  <Text style={styles.sectionSubtitle}>How many people will travel?</Text>
                </View>
              </View>

              {/* Passenger stepper */}
              <View style={styles.passengerCard}>
                <View style={styles.passengerCardInner}>
                  <View style={styles.passengerIconCol}>
                    <View style={styles.passengerIconCircle}>
                      <Ionicons name="people" size={wp('8%')} color={TEAL} />
                    </View>
                    <Text style={styles.passengerLabel}>Passengers</Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => {
                        const val = parseInt(totalPassengers) || 0;
                        if (val > 1) setTotalPassengers(String(val - 1));
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={wp('5.5%')} color={CARD} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
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
                        const val = parseInt(totalPassengers) || 0;
                        setTotalPassengers(String(val + 1));
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={wp('5.5%')} color={CARD} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {renderBottomButtons({ onNext: nextStep })}
            </View>
          </ScrollView>
        );

      case 5:
        return (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.stepContainer}>
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
                <View style={[styles.inputIconCircle, { marginTop: hp('0.4%') }]}>
                  <Ionicons name="chatbubble-ellipses" size={wp('4%')} color={TEAL} />
                </View>
                <TextInput
                  style={[styles.inputField, { height: hp('14%'), textAlignVertical: 'top' }]}
                  placeholder="Enter details like luggage, stops, AC preference..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  value={otherDetails}
                  onChangeText={setOtherDetails}
                />
              </View>

              {/* Summary card */}
              <View style={styles.summaryCard}>
                <LinearGradient
                  colors={[TEAL_DEEP, TEAL_MID]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryGradient}
                >
                  {/* Decorative circles */}
                  <View style={[styles.summaryDecor, { top: -wp('6%'), right: -wp('4%') }]} />
                  <View style={[styles.summaryDecor, { bottom: -wp('5%'), left: -wp('3%'), width: wp('16%'), height: wp('16%') }]} />

                  <Text style={styles.summaryTitle}>Booking Summary</Text>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Ionicons name="location" size={wp('4%')} color={TEAL_LIGHT} />
                    <Text style={styles.summaryLabel}>Pickup</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{pickupLocation || '--'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="navigate" size={wp('4%')} color={TEAL_LIGHT} />
                    <Text style={styles.summaryLabel}>Destination</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{destination || '--'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="calendar" size={wp('4%')} color={TEAL_LIGHT} />
                    <Text style={styles.summaryLabel}>Start</Text>
                    <Text style={styles.summaryValue}>{startDate.toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL_LIGHT} />
                    <Text style={styles.summaryLabel}>Return</Text>
                    <Text style={styles.summaryValue}>{returnDate.toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Ionicons name="people" size={wp('4%')} color={TEAL_LIGHT} />
                    <Text style={styles.summaryLabel}>Passengers</Text>
                    <Text style={styles.summaryValue}>{totalPassengers || '--'}</Text>
                  </View>
                </LinearGradient>
              </View>

              {renderBottomButtons({
                nextLabel: 'Submit',
                onNext: handleBookingSubmit,
                isLoading: isSubmitting,
              })}
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* ── Header ─────────────────────────────── */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={[styles.headerDecor, { top: -wp('8%'), right: -wp('5%'), width: wp('28%'), height: wp('28%') }]} />
        <View style={[styles.headerDecor, { bottom: -wp('10%'), left: -wp('8%'), width: wp('24%'), height: wp('24%') }]} />
        <View style={[styles.headerDecor, { top: wp('2%'), left: wp('30%'), width: wp('12%'), height: wp('12%'), opacity: 0.06 }]} />

        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={wp('5.5%')} color={CARD} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Local Bus Booking</Text>
            <Text style={styles.headerSubtitle}>Book a bus for local travel</Text>
          </View>
          <View style={styles.headerIconRight}>
            <Ionicons name="bus" size={wp('6%')} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      </LinearGradient>

      {/* ── Step Indicator ──────────────────────── */}
      <View style={styles.stepIndicatorContainer}>
        {renderStepIndicator()}
      </View>

      {/* ── Body ───────────────────────────────── */}
      <View style={styles.body}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  /* ── Layout ───────────────────────── */
  safeArea: {
    flex: 1,
    backgroundColor: TEAL_DEEP,
  },
  body: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2.5%'),
    paddingBottom: hp('4%'),
  },
  stepContainer: {
    flex: 1,
  },

  /* ── Header ───────────────────────── */
  header: {
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('5%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  headerTitle: {
    color: CARD,
    fontSize: wp('5.2%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: wp('3.2%'),
    marginTop: hp('0.3%'),
  },
  headerIconRight: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Step Indicator ────────────────── */
  stepIndicatorContainer: {
    backgroundColor: BG,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIndicatorItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: TEAL,
  },
  stepCirclePending: {
    backgroundColor: BORDER,
  },
  stepCircleTextActive: {
    color: CARD,
    fontSize: wp('3%'),
    fontWeight: '700',
  },
  stepCircleTextPending: {
    color: TEXT_MUTED,
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: wp('3.5%'),
    left: -wp('5%'),
    width: wp('10%'),
    height: hp('0.25%'),
    backgroundColor: BORDER,
    zIndex: -1,
  },
  stepConnectorActive: {
    backgroundColor: TEAL,
  },
  stepLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    marginTop: hp('0.4%'),
    fontWeight: '500',
  },
  stepLabelActive: {
    color: TEAL_MID,
    fontWeight: '700',
  },

  /* ── Section Headers ───────────────── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
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
    fontSize: wp('5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
  },

  /* ── Input Card ────────────────────── */
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  inputIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2.5%'),
  },
  inputField: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('1.4%'),
    fontWeight: '500',
  },
  clearBtn: {
    padding: wp('1%'),
  },

  /* ── Suggestion Dropdown ───────────── */
  suggestionWrapper: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginTop: -hp('1%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
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
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  suggestionText: {
    fontSize: wp('3.6%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  noResultText: {
    paddingVertical: hp('2%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.4%'),
  },

  /* ── Grid Label ────────────────────── */
  gridLabel: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: hp('1.2%'),
    marginTop: hp('0.5%'),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* ── City Grid ─────────────────────── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  cityCard: {
    width: wp('42%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  cityCardSelected: {
    borderColor: TEAL,
    borderWidth: 2,
    ...SHADOW_LG,
  },
  citySelectedBadge: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    zIndex: 2,
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    padding: wp('0.5%'),
    ...SHADOW_SM,
  },
  cityImage: {
    width: '100%',
    height: hp('11%'),
    resizeMode: 'cover',
  },
  cityNameRow: {
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('2%'),
    alignItems: 'center',
  },
  cityName: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  cityNameSelected: {
    color: TEAL_MID,
    fontWeight: '700',
  },

  /* ── Info Card ─────────────────────── */
  infoCard: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('2%'),
    ...SHADOW_SM,
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('3.5%'),
  },
  infoCardText: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    marginLeft: wp('2.5%'),
    fontWeight: '500',
    lineHeight: wp('4.5%'),
  },

  /* ── Date Card ─────────────────────── */
  dateCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  dateCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  dateIconCircle: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3.5%'),
  },
  dateTextCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp('0.3%'),
  },
  dateValue: {
    fontSize: wp('4%'),
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },

  /* ── Passenger Card ────────────────── */
  passengerCard: {
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  passengerCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2.5%'),
  },
  passengerIconCol: {
    alignItems: 'center',
  },
  passengerIconCircle: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: TEAL_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('0.5%'),
  },
  passengerLabel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stepperInput: {
    width: wp('16%'),
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: wp('2%'),
    borderBottomWidth: 2,
    borderBottomColor: BORDER,
    paddingVertical: hp('0.5%'),
  },

  /* ── Summary Card ──────────────────── */
  summaryCard: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('3%'),
    ...SHADOW_LG,
  },
  summaryGradient: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2.5%'),
    overflow: 'hidden',
  },
  summaryDecor: {
    position: 'absolute',
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  summaryTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: CARD,
    letterSpacing: 0.5,
    marginBottom: hp('1%'),
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: hp('1.2%'),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  summaryLabel: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.7)',
    marginLeft: wp('2%'),
    width: wp('22%'),
    fontWeight: '500',
  },
  summaryValue: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: CARD,
    fontWeight: '700',
    textAlign: 'right',
  },

  /* ── Bottom Buttons ────────────────── */
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('2%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
  },
  backBtnText: {
    color: TEAL_MID,
    fontSize: wp('3.5%'),
    fontWeight: '600',
    marginLeft: wp('1.5%'),
  },
  nextGradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('7%'),
    borderRadius: wp('3%'),
  },
  nextGradientBtnText: {
    color: CARD,
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
});

export default LocalScreen;
