
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Dimensions,
  Animated,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { locationService } from '../../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel, getEarliestPickup, clampPickup, toTimeString, combineDateAndTime } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

// Popular cities for quick selection
const popularCities = [
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bangalore', slug: 'bangalore' },
  { name: 'Goa', slug: 'goa' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Udaipur', slug: 'udaipur' },
  { name: 'Chennai', slug: 'chennai' },
];

// FAQ
const faqs = [
  {
    question: 'How can I book a bike rental?',
    answer: 'Search your city → Browse available bikes → Select one → Request quote → Vendor confirms.',
  },
  {
    question: 'What types of bikes are available?',
    answer: 'Scooters, commuters, sports, cruisers, ADV, dirt bikes. Availability depends on your city.',
  },
  {
    question: 'Do I need a valid driving license?',
    answer: 'Yes, original DL is mandatory at pickup.',
  },
  {
    question: 'Is fuel included?',
    answer: 'Generally no. Fuel is per usage. Check with vendor.',
  },
];

export default function BikeRentalScreen() {
  const navigation = useNavigation();

  // Location states
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [pickupLocationSlug, setPickupLocationSlug] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Date states
  const [pickupDate, setPickupDate] = useState(() => getEarliestPickup());
  const [dropDate, setDropDate] = useState(() => new Date(getEarliestPickup().getTime() + 24 * 60 * 60 * 1000)); // Day after pickup

  // iOS picker visibility
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropDatePicker, setShowDropDatePicker] = useState(false);

  // FAQ
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Animation
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLocations();
    // Animate hero section
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      if (response.success && response.locations) {
        setAllLocations(response.locations);
      }
    } catch (err) {
      console.log('location error', err?.response?.data || err);
    }
  };

  const trimmedQuery = (query || '').trim();
  const filteredLocations = trimmedQuery.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : allLocations.slice(0, 20);

  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(text);
    setPickupLocationId(null);
    setPickupLocationSlug('');
    setShowSuggestions(true);
  };

  const handleLocationSelect = (loc) => {
    setPickupLocation(loc.name);
    setPickupLocationId(loc.id);
    setPickupLocationSlug(loc.slug || loc.name.toLowerCase().replace(/\s+/g, '-'));
    setQuery('');
    setShowSuggestions(false);
  };

  const handleCityQuickSelect = (city) => {
    const match = allLocations.find(
      (l) => l.name.toLowerCase() === city.name.toLowerCase()
    );
    if (match) {
      handleLocationSelect(match);
    } else {
      setPickupLocation(city.name);
      setPickupLocationSlug(city.slug);
      setShowSuggestions(false);
    }
  };

  // Android date picker
  const openAndroidPicker = (target) => {
    const currentValue = target === 'pickup' ? pickupDate : dropDate;

    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      minimumDate: target === 'pickup' ? getMinBookingDate() : pickupDate,
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;

        let timeValue = combineDateAndTime(date, toTimeString(currentValue));
        if (target === 'pickup') {
          // Keep the chosen time unless it is now too soon on the new date.
          timeValue = clampPickup(timeValue);
          setPickupDate(timeValue);
          if (dropDate <= timeValue) {
            setDropDate(new Date(timeValue.getTime() + 24 * 60 * 60 * 1000));
          }
        }

        // After selecting date, open time picker
        DateTimePickerAndroid.open({
          value: timeValue,
          mode: 'time',
          is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;

            const finalDate = new Date(date);
            finalDate.setHours(time.getHours());
            finalDate.setMinutes(time.getMinutes());

            if (target === 'pickup') {
              if (isPickupTooSoon(finalDate)) {
                // Too close to now for a driver to reach: snap to the earliest slot.
                const earliest = getEarliestPickup();
                setPickupDate(earliest);
                if (dropDate <= earliest) {
                  setDropDate(new Date(earliest.getTime() + 24 * 60 * 60 * 1000));
                }
                setShowBookingAlert(true);
                return;
              }
              setPickupDate(finalDate);
              // Ensure drop date is after pickup
              if (dropDate <= finalDate) {
                setDropDate(new Date(finalDate.getTime() + 24 * 60 * 60 * 1000));
              }
            } else {
              setDropDate(finalDate);
            }
          },
        });
      },
    });
  };

  // iOS date change handlers
  const onPickupDateChange = (event, selectedDate) => {
    if (selectedDate) {
      if (isPickupTooSoon(selectedDate)) {
        // Too close to now for a driver to reach: snap to the earliest slot.
        const earliest = getEarliestPickup();
        setPickupDate(earliest);
        if (dropDate <= earliest) {
          setDropDate(new Date(earliest.getTime() + 24 * 60 * 60 * 1000));
        }
        setShowBookingAlert(true);
        return;
      }
      setPickupDate(selectedDate);
      if (dropDate <= selectedDate) {
        setDropDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
      }
    }
  };

  const onDropDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDropDate(selectedDate);
    }
  };

  const handleExplore = () => {
    if (!pickupLocation) {
      alert('Please select a pickup location');
      return;
    }

    // 12-hour advance booking validation
    if (isPickupTooSoon(pickupDate)) {
      setShowBookingAlert(true);
      return;
    }

    navigation.navigate('BikeFleetScreen', {
      location: {
        id: pickupLocationId,
        name: pickupLocation,
        slug: pickupLocationSlug || pickupLocation.toLowerCase().replace(/\s+/g, '-'),
      },
      locationId: pickupLocationId,
      pickupDate: pickupDate.toISOString(),
      dropDate: dropDate.toISOString(),
    });
  };

  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bike Rental</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBikeBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >
        {/* HERO SECTION */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroGradient}>
            <View style={styles.heroGlow} />
            <View style={styles.heroContent}>
              <Text style={styles.heroPill}>Self-drive • Delivery • Hourly</Text>
              <Text style={styles.heroHeading}>Find Your Perfect Ride</Text>
              <Text style={styles.heroSub}>
                Browse bikes from verified vendors, compare prices & book instantly
              </Text>
            </View>
            <Image
              source={require('../../../assets/BikeHome.png')}
              style={styles.heroImg}
            />
          </View>
        </Animated.View>

        {/* SEARCH CARD */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search Bikes</Text>

          {/* LOCATION INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pickup Location</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={20} color={GREEN} />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter city or area"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
                onFocus={() => setShowSuggestions(true)}
              />
              {pickupLocation ? (
                <TouchableOpacity
                  onPress={() => {
                    setPickupLocation('');
                    setPickupLocationId(null);
                    setPickupLocationSlug('');
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                >
                  <Ionicons name="close-circle" size={22} color="#CBD5E1" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Location Suggestions */}
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                <ScrollView
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredLocations.length ? (
                    filteredLocations.map((loc) => (
                      <TouchableOpacity
                        key={loc.id}
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Ionicons name="location" size={16} color={GREEN} />
                        <Text style={styles.suggestionText}>{loc.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResult}>No location found</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* POPULAR CITIES */}
          <View style={styles.popularCitiesSection}>
            <Text style={styles.popularLabel}>Popular Cities</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.citiesRow}
            >
              {popularCities.map((city, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.cityChip,
                    pickupLocation === city.name && styles.cityChipActive,
                  ]}
                  onPress={() => handleCityQuickSelect(city)}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      pickupLocation === city.name && styles.cityChipTextActive,
                    ]}
                  >
                    {city.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* DATE TIME ROW */}
          <View style={styles.dateTimeRow}>
            {/* Pickup Date */}
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidPicker('pickup');
                } else {
                  setShowPickupDatePicker(true);
                }
              }}
            >
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={GREEN} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>PICKUP</Text>
                <Text style={styles.dateValue}>{formatDate(pickupDate)}</Text>
                <Text style={styles.timeValue}>{formatTime(pickupDate)}</Text>
              </View>
            </TouchableOpacity>

            {/* Arrow */}
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={20} color="#94A3B8" />
            </View>

            {/* Drop Date */}
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidPicker('drop');
                } else {
                  setShowDropDatePicker(true);
                }
              }}
            >
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={GREEN} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>DROP</Text>
                <Text style={styles.dateValue}>{formatDate(dropDate)}</Text>
                <Text style={styles.timeValue}>{formatTime(dropDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* iOS Date Pickers */}
          {showPickupDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                value={pickupDate}
                mode="datetime"
                display="spinner"
                onChange={onPickupDateChange}
                minimumDate={getMinBookingDate()}
              />
              <TouchableOpacity
                style={styles.iosDoneBtn}
                onPress={() => setShowPickupDatePicker(false)}
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {showDropDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                value={dropDate}
                mode="datetime"
                display="spinner"
                onChange={onDropDateChange}
                minimumDate={pickupDate}
              />
              <TouchableOpacity
                style={styles.iosDoneBtn}
                onPress={() => setShowDropDatePicker(false)}
              >
                <Text style={styles.iosDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EXPLORE BUTTON */}
          <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.exploreBtnText}>Explore Available Bikes</Text>
          </TouchableOpacity>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="search" size={22} color="#fff" />
              </View>
              <Text style={styles.stepTitle}>Search</Text>
              <Text style={styles.stepDesc}>Find bikes in your city</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="bicycle" size={22} color="#fff" />
              </View>
              <Text style={styles.stepTitle}>Select</Text>
              <Text style={styles.stepDesc}>Choose your bike</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              </View>
              <Text style={styles.stepTitle}>Book</Text>
              <Text style={styles.stepDesc}>Request & ride</Text>
            </View>
          </View>
        </View>

        {/* WHY TRANSRENTALS */}
        <View style={styles.whySection}>
          <Text style={styles.sectionTitle}>Why TransRentals?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color={GREEN} />
              </View>
              <Text style={styles.featureTitle}>Verified Vendors</Text>
              <Text style={styles.featureDesc}>All partners are verified</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="pricetags" size={24} color={GREEN} />
              </View>
              <Text style={styles.featureTitle}>Best Prices</Text>
              <Text style={styles.featureDesc}>Compare & choose</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="time" size={24} color={GREEN} />
              </View>
              <Text style={styles.featureTitle}>Flexible Duration</Text>
              <Text style={styles.featureDesc}>Hourly to monthly</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="location" size={24} color={GREEN} />
              </View>
              <Text style={styles.featureTitle}>Doorstep Delivery</Text>
              <Text style={styles.featureDesc}>Get bike at your location</Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqItem}
                onPress={() => toggleFAQ(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#E2E8F0"
                  />
                </View>
                {open && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      </KeyboardAvoidingView>
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1 },

  // Top Bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  myBookingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Section
  heroSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  heroGradient: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(9,179,104,0.3)',
    borderRadius: 999,
  },
  heroContent: {
    position: 'absolute',
    left: 20,
    top: 24,
    width: width * 0.55,
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 30,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 18,
  },
  heroImg: {
    position: 'absolute',
    right: -15,
    bottom: -10,
    width: 170,
    height: 140,
    resizeMode: 'contain',
  },

  // Search Card
  searchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 100,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  suggestionBox: {
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: { color: '#0F172A', fontSize: 14 },
  noResult: { padding: 16, textAlign: 'center', color: '#94A3B8' },

  // Popular Cities
  popularCitiesSection: {
    marginBottom: 16,
  },
  popularLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
  },
  citiesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityChipActive: {
    backgroundColor: 'rgba(9,179,104,0.1)',
    borderColor: GREEN,
  },
  cityChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  cityChipTextActive: {
    color: GREEN,
    fontWeight: '600',
  },

  // Date Time
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  timeValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  arrowWrap: {
    paddingHorizontal: 8,
  },

  // iOS Picker
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  iosDoneText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Explore Button
  exploreBtn: {
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // How It Works
  howItWorks: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 24,
  },

  // Why Section
  whySection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // FAQ
  faqSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
  },
  faqSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 10,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
  },
});
