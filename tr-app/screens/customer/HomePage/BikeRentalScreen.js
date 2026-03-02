
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { locationService } from '../../services';
import {
  TEAL_DEEP,
  TEAL_MID,
  TEAL,
  TEAL_LIGHT,
  BG,
  CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SHADOW_SM,
  SHADOW_MD,
} from '../../../theme';

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
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [pickupLocationSlug, setPickupLocationSlug] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Date states
  const [pickupDate, setPickupDate] = useState(new Date());
  const [dropDate, setDropDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow

  // iOS picker visibility
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropDatePicker, setShowDropDatePicker] = useState(false);

  // FAQ
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Animation ref (kept for dropdown touch tracking)
  const dropdownTouching = useRef(false);

  /* -- StatusBar management -- */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, []),
  );

  useEffect(() => {
    fetchLocations();
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

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(query.toLowerCase()),
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
      minimumDate: target === 'pickup' ? new Date() : pickupDate,
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;

        // After selecting date, open time picker
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;

            const finalDate = new Date(date);
            finalDate.setHours(time.getHours());
            finalDate.setMinutes(time.getMinutes());

            if (target === 'pickup') {
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* GRADIENT HEADER */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={styles.decoCircle1} pointerEvents="none" />
        <View style={styles.decoCircle2} pointerEvents="none" />
        <View style={styles.decoCircle3} pointerEvents="none" />

        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Bike Rental</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyBikeBookings')}
            style={styles.bookingsBtn}
          >
            <Ionicons name="list" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          if (!dropdownTouching.current) setShowSuggestions(false);
        }}
      >
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[TEAL_DEEP, '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroGlow} />
            <View style={styles.heroContent}>
              <View style={styles.heroPillWrap}>
                <LinearGradient
                  colors={['rgba(16,185,129,0.25)', 'rgba(16,185,129,0.1)']}
                  style={styles.heroPill}
                >
                  <Ionicons name="bicycle" size={wp('3%')} color={TEAL} />
                  <Text style={styles.heroPillText}>Self-drive  ·  Delivery  ·  Hourly</Text>
                </LinearGradient>
              </View>
              <Text style={styles.heroHeading}>Find Your Perfect Ride</Text>
              <Text style={styles.heroSub}>
                Browse bikes from verified vendors, compare prices & book instantly
              </Text>
            </View>
            <Image
              source={require('../../../assets/BikeHome.png')}
              style={styles.heroImg}
            />
          </LinearGradient>
        </View>

        {/* SEARCH CARD */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Search Bikes</Text>
              <Text style={styles.formDesc}>Find & compare bikes near you</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="bicycle" size={wp('3.5%')} color="#fff" />
              <Text style={styles.securePillText}>Bike</Text>
            </View>
          </View>

          {/* LOCATION INPUT */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Pickup Location</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location" size={wp('4.2%')} color={TEAL} />
              </View>
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter city or area"
                placeholderTextColor={TEXT_MUTED}
                style={styles.locationInput}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
                  <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Location Suggestions */}
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                <ScrollView
                  style={{ maxHeight: hp('26%') }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="always"
                  onTouchStart={() => (dropdownTouching.current = true)}
                  onTouchEnd={() => (dropdownTouching.current = false)}
                >
                  {filteredLocations.length ? (
                    filteredLocations.map((loc) => (
                      <TouchableOpacity
                        key={loc.id}
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Ionicons name="navigate-outline" size={wp('3.8%')} color={TEAL} style={{ marginRight: wp('2%') }} />
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
                  activeOpacity={0.7}
                >
                  <View style={styles.cityIconCircle}>
                    <Ionicons name="location" size={wp('2.8%')} color={TEAL} />
                  </View>
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
          <View style={styles.dateRow}>
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
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>PICKUP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>{formatDate(pickupDate)}</Text>
                  <Text style={styles.dateSubText}>{formatTime(pickupDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Drop Date */}
            <TouchableOpacity
              style={[styles.dateCard, { marginRight: 0, marginLeft: wp('2%') }]}
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidPicker('drop');
                } else {
                  setShowDropDatePicker(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>DROP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>{formatDate(dropDate)}</Text>
                  <Text style={styles.dateSubText}>{formatTime(dropDate)}</Text>
                </View>
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
                minimumDate={new Date()}
              />
              <TouchableOpacity
                style={styles.iosBtnWrap}
                onPress={() => setShowPickupDatePicker(false)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.iosBtnGradient}
                >
                  <Text style={styles.iosBtnText}>Done</Text>
                </LinearGradient>
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
                style={styles.iosBtnWrap}
                onPress={() => setShowDropDatePicker(false)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.iosBtnGradient}
                >
                  <Text style={styles.iosBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* EXPLORE BUTTON */}
          <TouchableOpacity style={styles.exploreBtnWrap} onPress={handleExplore} activeOpacity={0.85}>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreBtnGradient}
            >
              <Ionicons name="search" size={wp('5%')} color="#fff" />
              <Text style={styles.exploreBtnText}>Explore Available Bikes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* MY BOOKINGS QUICK ACCESS */}
        <TouchableOpacity
          style={styles.myBookingsCard}
          onPress={() => navigation.navigate('MyBikeBookings')}
          activeOpacity={0.8}
        >
          <View style={styles.myBookingsLeft}>
            <View style={styles.myBookingsIcon}>
              <Ionicons name="bicycle" size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.myBookingsTitle}>My Bike Bookings</Text>
              <Text style={styles.myBookingsDesc}>View your quote requests & bookings</Text>
            </View>
          </View>
          <View style={styles.myBookingsArrow}>
            <Ionicons name="chevron-forward" size={wp('4%')} color={TEAL} />
          </View>
        </TouchableOpacity>

        {/* HOW IT WORKS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.stepCircle}
              >
                <Ionicons name="search" size={wp('5%')} color="#fff" />
              </LinearGradient>
              <Text style={styles.stepTitle}>Search</Text>
              <Text style={styles.stepDesc}>Find bikes in your city</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepItem}>
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.stepCircle}
              >
                <Ionicons name="bicycle" size={wp('5%')} color="#fff" />
              </LinearGradient>
              <Text style={styles.stepTitle}>Select</Text>
              <Text style={styles.stepDesc}>Choose your bike</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepItem}>
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                style={styles.stepCircle}
              >
                <Ionicons name="checkmark-circle" size={wp('5%')} color="#fff" />
              </LinearGradient>
              <Text style={styles.stepTitle}>Book</Text>
              <Text style={styles.stepDesc}>Request & ride</Text>
            </View>
          </View>
        </View>

        {/* WHY TRANSRENTALS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why TransRentals?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={wp('5.5%')} color={TEAL} />
              </View>
              <Text style={styles.featureTitle}>Verified Vendors</Text>
              <Text style={styles.featureDesc}>All partners are verified</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="pricetags" size={wp('5.5%')} color={TEAL} />
              </View>
              <Text style={styles.featureTitle}>Best Prices</Text>
              <Text style={styles.featureDesc}>Compare & choose</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="time" size={wp('5.5%')} color={TEAL} />
              </View>
              <Text style={styles.featureTitle}>Flexible Duration</Text>
              <Text style={styles.featureDesc}>Hourly to monthly</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="location" size={wp('5.5%')} color={TEAL} />
              </View>
              <Text style={styles.featureTitle}>Doorstep Delivery</Text>
              <Text style={styles.featureDesc}>Get bike at your location</Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <Ionicons name="help-circle-outline" size={wp('5.5%')} color={TEAL} />
            <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          </View>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            const isLast = idx === faqs.length - 1;
            return (
              <View key={idx} style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => toggleFAQ(idx)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <View style={styles.faqChevronWrap}>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={wp('3.5%')}
                      color={TEAL}
                    />
                  </View>
                </TouchableOpacity>
                {open && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>

        {/* BOTTOM CTA */}
        <TouchableOpacity
          onPress={() => navigation.navigate('MyBikeBookings')}
          activeOpacity={0.85}
          style={styles.bottomCTAWrap}
        >
          <LinearGradient
            colors={[TEAL_MID, TEAL_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomCTA}
          >
            <View style={styles.ctaDecoCircle} />
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconWrap}>
                <Ionicons name="bicycle" size={wp('5.5%')} color={TEAL_DEEP} />
              </View>
              <View style={styles.ctaTextWrap}>
                <Text style={styles.ctaTitle}>View My Bookings</Text>
                <Text style={styles.ctaSubtitle}>Track your bike rental requests</Text>
              </View>
            </View>
            <View style={styles.ctaArrowWrap}>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: hp('5%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* -- HEADER -- */
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    top: -hp('4%'),
    right: -wp('8%'),
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -hp('3%'),
    left: -wp('10%'),
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoCircle3: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('25%'),
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: wp('4.6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bookingsBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* -- HERO SECTION -- */
  heroSection: {
    marginHorizontal: wp('3.5%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('1.5%'),
    borderRadius: wp('5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  heroGradient: {
    borderRadius: wp('5%'),
    overflow: 'hidden',
    minHeight: hp('22%'),
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -hp('3%'),
    right: -wp('8%'),
    width: wp('40%'),
    height: wp('40%'),
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: wp('20%'),
  },
  heroContent: {
    position: 'absolute',
    left: wp('5%'),
    top: hp('2.5%'),
    width: wp('55%'),
  },
  heroPillWrap: {
    alignSelf: 'flex-start',
    marginBottom: hp('1%'),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('10%'),
    gap: wp('1.5%'),
  },
  heroPillText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontWeight: '600',
  },
  heroHeading: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: '#fff',
    lineHeight: wp('7%'),
  },
  heroSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.8%'),
    lineHeight: wp('4.5%'),
  },
  heroImg: {
    position: 'absolute',
    right: -wp('3%'),
    bottom: -hp('1%'),
    width: wp('42%'),
    height: hp('17%'),
    resizeMode: 'contain',
  },

  /* -- FORM CARD -- */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  formTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  formDesc: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  securePill: {
    backgroundColor: TEAL,
    borderRadius: wp('10%'),
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  securePillText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  /* -- LOCATION -- */
  locationBlock: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    zIndex: 100,
  },
  smallLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: TEAL_MID,
    marginBottom: hp('0.5%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  locationIconCircle: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.8%'),
  },
  suggestionBox: {
    position: 'absolute',
    top: hp('11%'),
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    zIndex: 999,
    ...SHADOW_MD,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.1%'),
    borderBottomWidth: 0.5,
    borderColor: '#F0F4F3',
  },
  suggestionText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  /* -- POPULAR CITIES -- */
  popularCitiesSection: {
    marginBottom: hp('1.5%'),
  },
  popularLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: TEAL_MID,
    marginBottom: hp('0.8%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  citiesRow: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('10%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    gap: wp('1.5%'),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityChipActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: TEAL,
  },
  cityIconCircle: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityChipText: {
    fontSize: wp('3%'),
    color: TEAL_DEEP,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: TEAL,
    fontWeight: '700',
  },

  /* -- DATE ROW -- */
  dateRow: {
    flexDirection: 'row',
    marginBottom: hp('1.5%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginRight: wp('2%'),
    ...SHADOW_SM,
  },
  dateLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '700',
    color: TEAL_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp('0.7%'),
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateSubText: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },

  /* -- iOS PICKER -- */
  iosPickerContainer: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
    padding: wp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  iosBtnWrap: {
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    marginTop: hp('0.8%'),
  },
  iosBtnGradient: {
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
  },
  iosBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },

  /* -- EXPLORE BUTTON -- */
  exploreBtnWrap: {
    marginTop: hp('0.5%'),
    borderRadius: wp('10%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  exploreBtnGradient: {
    borderRadius: wp('10%'),
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* -- MY BOOKINGS CARD -- */
  myBookingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  myBookingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myBookingsIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  myBookingsTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  myBookingsDesc: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  myBookingsArrow: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* -- SECTION CARD -- */
  sectionCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.2%'),
    letterSpacing: 0.2,
  },

  /* -- HOW IT WORKS -- */
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
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  stepTitle: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  stepDesc: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  stepLine: {
    width: wp('6%'),
    height: 2,
    backgroundColor: TEAL_LIGHT,
    marginTop: wp('6%'),
  },

  /* -- WHY SECTION -- */
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2.5%'),
  },
  featureCard: {
    width: wp('40%'),
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  featureIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  featureTitle: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  /* -- FAQ SECTION -- */
  faqSection: {
    backgroundColor: TEAL_DEEP,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    ...SHADOW_MD,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  faqSectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: hp('1.5%'),
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: wp('2.5%'),
  },
  faqChevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqAnswer: {
    marginTop: hp('1%'),
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: wp('5%'),
  },

  /* -- BOTTOM CTA -- */
  bottomCTAWrap: {
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4.5%'),
    overflow: 'hidden',
  },
  ctaDecoCircle: {
    position: 'absolute',
    top: -wp('4%'),
    right: -wp('3%'),
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    flex: 1,
  },
  ctaIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  ctaArrowWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
