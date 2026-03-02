// BusRentalScreen.js — Premium Dark Teal Design
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { locationService, bookingService } from '../../services';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

const BUS_TYPES = [
  { id: '20seater', name: '20 Seater', img: require('../../../assets/20Seaterr.png') },
  { id: '25seater', name: '25 Seater', img: require('../../../assets/25Seater.png') },
  { id: '29seater', name: '29 Seater', img: require('../../../assets/29Seater.png') },
  { id: '36seater', name: '36 Seater', img: require('../../../assets/36Seater.png') },
  { id: '41seater', name: '41 Seater', img: require('../../../assets/41Seater.png') },
  { id: '45seater', name: '45 Seater', img: require('../../../assets/45Seater.png') },
  { id: '49seater', name: '49 Seater', img: require('../../../assets/49Seater.png') },
  { id: '56seater', name: '56 Seater', img: require('../../../assets/56Seater.png') },
];

const BUS_CATEGORIES = [
  {
    name: 'Tempo Traveler',
    image: require('../../../assets/TempoTravelerHome.png'),
  },
  {
    name: 'Wedding Bus',
    image: require('../../../assets/WeddingBusHome.png'),
  },
  {
    name: 'Mini Bus',
    image: require('../../../assets/MiniBusHome.png'),
  },
];

const faqs = [
  {
    question: 'Can I customize my bus rental journey with multiple pickup and drop-off points?',
    answer: "Yes, with TransRentals, you can tailor your trip by specifying multiple pickup and drop-off points to accommodate your group's needs.",
  },
  {
    question: 'Are the bus operators on TransRentals verified?',
    answer: 'TransRentals partners with verified service providers, ensuring you receive reliable and trustworthy bus rental services.',
  },
  {
    question: 'Can I cancel or modify my bus rental booking with TransRentals?',
    answer: "Yes, you can modify or cancel your bus rental booking with TransRentals. However, cancellation charges may apply, depending on the service provider's cancellation policy.",
  },
  {
    question: 'What types of buses can I rent through TransRentals?',
    answer: 'TransRentals offers a variety of buses, including AC, Non-AC, Seater, and Sleeper options. You can choose from 20-seater to 56-seater buses and luxurious coaches.',
  },
];

const quoteData = [
  {
    id: '1',
    number: '1',
    heading: 'Enquire',
    body: `Post your requirement on our website or mobile app, providing all necessary details such as bus type, travel dates, and pickup and drop-off locations.`,
  },
  {
    id: '2',
    number: '2',
    heading: 'Get Quote',
    body: `Multiple bus vendors send you their best price & bus options based on your requirements.`,
  },
  {
    id: '3',
    number: '3',
    heading: 'Book',
    body: `Compare the quotes and choose the one that best suits your needs, then confirm your booking by paying the required booking amount.`,
  },
];

export default function BusRentalScreen() {
  const navigation = useNavigation();

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [customerData, setCustomerData] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [tripType, setTripType] = useState('outstation'); // outstation | local
  const [destination, setDestination] = useState('');
  const [busType, setBusType] = useState('20seater');
  const [totalPassengers, setTotalPassengers] = useState('');
  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 4 * 60 * 60 * 1000),
  );

  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [androidPickingTarget, setAndroidPickingTarget] = useState('start');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

  const dropdownRef = useRef(null);

  /* ── StatusBar management ── */
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
    (async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) setCustomerData(JSON.parse(data));
    })();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getBusLocations();
      if (response.success && response.locations) {
        setAllLocations(response.locations);
      }
    } catch (err) {
      console.log('location error', err?.response?.data || err);
    }
  };

  const textSafe = (t) => (t || '').toLowerCase();

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(textSafe(query)),
      )
    : allLocations.slice(0, 35);

  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(text);
    setPickupLocationId(null);
    setShowSuggestions(true);
  };

  const handleLocationSelect = (loc) => {
    setPickupLocation(loc.name);
    setPickupLocationId(loc.id);
    setQuery('');
    setShowSuggestions(false);
  };

  const handleOutsideClick = () => {
    setShowSuggestions(false);
  };

  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  const openAndroidPicker = (target) => {
    const currentValue = target === 'start' ? startDate : returnDate;

    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      minimumDate: target === 'start' ? new Date() : startDate,
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) {
          return;
        }

        if (target === 'start') {
          const merged = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            startDate.getHours(),
            startDate.getMinutes(),
          );
          setStartDate(merged);

          if (returnDate < merged) {
            setReturnDate(new Date(merged.getTime() + 2 * 60 * 60 * 1000));
          }

          DateTimePickerAndroid.open({
            value: merged,
            mode: 'time',
            is24Hour: false,
            onChange: (event2, time) => {
              if (event2.type === 'dismissed' || !time) return;
              const final = new Date(merged);
              final.setHours(time.getHours());
              final.setMinutes(time.getMinutes());
              setStartDate(final);

              if (returnDate < final) {
                setReturnDate(new Date(final.getTime() + 2 * 60 * 60 * 1000));
              }
            },
          });
        } else {
          const merged = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            returnDate.getHours(),
            returnDate.getMinutes(),
          );
          setReturnDate(merged);

          DateTimePickerAndroid.open({
            value: merged,
            mode: 'time',
            is24Hour: false,
            onChange: (event2, time) => {
              if (event2.type === 'dismissed' || !time) return;
              const final = new Date(merged);
              final.setHours(time.getHours());
              final.setMinutes(time.getMinutes());
              setReturnDate(final);
            },
          });
        }
      },
    });
  };

  const onAndroidChange = (event, selected) => {
    if (event.type === 'dismissed') {
      setAndroidPickerVisible(false);
      return;
    }
    if (!selected) {
      setAndroidPickerVisible(false);
      return;
    }

    if (androidPickerMode === 'date') {
      if (androidPickingTarget === 'start') {
        const newStart = new Date(selected);
        const merged = new Date(
          newStart.getFullYear(),
          newStart.getMonth(),
          newStart.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        );
        setStartDate(merged);
        if (returnDate < merged) {
          setReturnDate(new Date(merged.getTime() + 4 * 60 * 60 * 1000));
        }
      } else {
        const newEndDate = new Date(selected);
        const merged = new Date(
          newEndDate.getFullYear(),
          newEndDate.getMonth(),
          newEndDate.getDate(),
          returnDate.getHours(),
          returnDate.getMinutes(),
        );
        setReturnDate(merged);
      }
      setAndroidPickerMode('time');
      setAndroidPickerVisible(true);
      return;
    }

    if (androidPickerMode === 'time') {
      if (androidPickingTarget === 'start') {
        const upd = new Date(startDate);
        upd.setHours(selected.getHours());
        upd.setMinutes(selected.getMinutes());
        setStartDate(upd);
        if (returnDate < upd) {
          setReturnDate(new Date(upd.getTime() + 4 * 60 * 60 * 1000));
        }
      } else {
        const upd = new Date(returnDate);
        upd.setHours(selected.getHours());
        upd.setMinutes(selected.getMinutes());
        setReturnDate(upd);
      }
      setAndroidPickerVisible(false);
    }
  };

  const onStartDateChangeIOS = (event, selectedDate) => {
    if (!selectedDate) return;
    setStartDate(selectedDate);
    if (returnDate < selectedDate) {
      setReturnDate(new Date(selectedDate.getTime() + 4 * 60 * 60 * 1000));
    }
  };
  const onReturnDateChangeIOS = (event, selectedDate) => {
    if (!selectedDate) return;
    setReturnDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!pickupLocation) {
      alert('Please select pickup city');
      return;
    }
    if (!destination) {
      alert('Please enter destination');
      return;
    }
    if (!busType) {
      alert('Please select bus type');
      return;
    }
    if (!totalPassengers) {
      alert('Please enter number of passengers');
      return;
    }

    if (customerData && !customerData.phone) {
      setIsPhoneModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const token = await AsyncStorage.getItem('token');

      let finalLocationId = pickupLocationId;
      if (!finalLocationId && pickupLocation) {
        const match = allLocations.find(
          (l) => l.name?.toLowerCase() === pickupLocation?.toLowerCase(),
        );
        if (match) {
          finalLocationId = match.id;
        } else {
          alert('📍 Location Notice\n\nThis location is not currently available for bus rental services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
        }
      }

      const payload = {
        customer_id: customerId ?? '',
        service_id: 5,
        service_name: 'Bus Rental',
        location_id: finalLocationId,
        location_name: pickupLocation,
        destination: destination,
        journey_datetime: startDate.toISOString(),
        return_datetime: tripType === 'outstation' ? returnDate.toISOString() : null,
        total_passangers: Number(totalPassengers),
        bus_type: busType,
        trip_type: tripType,
        other_info: otherDetails?.trim() || '',
      };

      console.log('Bus booking payload:', payload);

      const response = await bookingService.createBusQuoteRequest(payload);

      if (response.success || response.booking) {
        alert('Bus booking submitted ✅');
        setDestination('');
        setOtherDetails('');
        setTotalPassengers('');
      } else {
        alert('Booking could not be submitted. Check required fields.');
      }
    } catch (err) {
      console.log('bus booking err', err?.response?.data || err?.message || err);
      alert(
        err?.response?.data?.message ||
          'Failed to submit booking. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setActiveQuoteIndex(index);
      },
    },
  );

  const renderQuoteItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [10, 0, 10],
    });

    return (
      <Animated.View
        style={[
          styles.quoteCard,
          {
            width: width - wp('12%'),
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <View style={styles.quoteTextWrapperMain}>
          <LinearGradient
            colors={[TEAL_MID, TEAL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteNumberCircle}
          >
            <Text style={styles.quoteNumber}>{item.number}</Text>
          </LinearGradient>
          <Text style={styles.quoteHeading}>{item.heading}</Text>
        </View>
        <View style={styles.quoteBodyMain}>
          <Text style={styles.quoteBody}>{item.body}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── Premium Gradient Header ── */}
      <View style={styles.headerClip}>
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
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Bus Rental</Text>
            <View style={{ width: wp('10%') }} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* form card */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Plan your bus journey</Text>
              <Text style={styles.formDesc}>
                Fill this form once, get multiple quotes from bus operators.
              </Text>
            </View>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.securePill}
            >
              <Ionicons name="shield-checkmark" size={wp('3.5%')} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </LinearGradient>
          </View>

          {/* Trip type */}
          <Text style={styles.label}>Trip type</Text>
          <View style={styles.tripTypeBar}>
            {[
              { id: 'local', label: 'Local', sub: 'Within city travel' },
              { id: 'outstation', label: 'Outstation', sub: 'Intercity travel' },
            ].map((item) => {
              const active = tripType === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setTripType(item.id)}
                  activeOpacity={0.9}
                  style={[styles.tripTypeTab, active && styles.tripTypeTabActive]}
                >
                  <View style={[styles.tripTypeIconCircle, active && styles.tripTypeIconCircleActive]}>
                    <Ionicons
                      name={item.id === 'local' ? 'navigate' : 'map'}
                      size={wp('3.8%')}
                      color={active ? CARD : TEAL_MID}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tripTypeTitle,
                      active && styles.tripTypeTitleActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.tripTypeSub}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location block */}
          <View style={styles.locationBlock}>
            {/* FROM */}
            <Text style={styles.smallLabel}>
              From (Area, Street or Landmark)
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.locationRow}
            >
              <View style={styles.locationIconCircle}>
                <Ionicons name="location-outline" size={wp('4%')} color={TEAL} />
              </View>
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup location"
                placeholderTextColor={TEXT_MUTED}
                style={styles.locationInput}
                onFocus={() => setShowSuggestions(true)}
              />
              {pickupLocation ? (
                <TouchableOpacity
                  onPress={() => {
                    setPickupLocation('');
                    setPickupLocationId(null);
                    setQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            {/* suggestions with overlay */}
            {showSuggestions && (
              <>
                <Pressable
                  style={styles.overlay}
                  onPress={handleOutsideClick}
                />

                <View style={styles.suggestionBox} ref={dropdownRef}>
                  <ScrollView
                    style={styles.suggestionScrollView}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.suggestionScrollContent}
                  >
                    {filteredLocations.length ? (
                      filteredLocations.map((loc) => (
                        <TouchableOpacity
                          key={loc.id}
                          style={styles.suggestionItem}
                          onPress={() => handleLocationSelect(loc)}
                        >
                          <View style={styles.suggestionDot} />
                          <Text style={styles.suggestionText}>{loc.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResult}>No location found</Text>
                    )}
                  </ScrollView>
                </View>
              </>
            )}

            {/* TO */}
            <Text style={[styles.smallLabel, { marginTop: hp('1.5%') }]}>
              To (Area, Street or Landmark)
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.locationRow}
            >
              <View style={styles.locationIconCircle}>
                <Ionicons name="flag-outline" size={wp('4%')} color={TEAL} />
              </View>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Enter drop location"
                placeholderTextColor={TEXT_MUTED}
                style={styles.locationInput}
              />
            </TouchableOpacity>
          </View>

          {/* DATE ROW */}
          <View style={styles.dateRow}>
            {/* TRIP START CARD */}
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidPicker('start');
                } else {
                  setShowStartDatePicker(true);
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.dateLabel}>TRIP START</Text>
              <View style={styles.dateContent}>
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dateIconWrap}
                >
                  <Ionicons name="calendar-outline" size={wp('3.8%')} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {startDate.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {startDate.toLocaleDateString('en-US', { weekday: 'short' })}{' '}
                    •{' '}
                    {startDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* TRIP END CARD */}
            {tripType === 'outstation' ? (
              <TouchableOpacity
                style={styles.dateCard}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    openAndroidPicker('end');
                  } else {
                    setShowReturnDatePicker(true);
                  }
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.dateLabel}>TRIP END</Text>
                <View style={styles.dateContent}>
                  <LinearGradient
                    colors={[TEAL_MID, TEAL]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dateIconWrap}
                  >
                    <Ionicons name="calendar-outline" size={wp('3.8%')} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateMainText}>
                      {returnDate.toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.dateSubText}>
                      {returnDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                      })}{' '}
                      •{' '}
                      {returnDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>

          {/* iOS pickers */}
          {showStartDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={onStartDateChangeIOS}
                minimumDate={new Date()}
              />
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity
                  style={styles.iosButton}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <Text style={styles.iosButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showReturnDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker
                value={returnDate}
                mode="datetime"
                display="spinner"
                onChange={onReturnDateChangeIOS}
                minimumDate={startDate}
              />
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity
                  style={styles.iosButton}
                  onPress={() => setShowReturnDatePicker(false)}
                >
                  <Text style={styles.iosButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bus type */}
          <Text style={[styles.label, { marginTop: hp('2%') }]}>Bus type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: hp('0.8%') }}
          >
            {BUS_TYPES.map((bus, idx) => {
              const active = busType === bus.id;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.busChip, active && styles.busChipActive]}
                  onPress={() => setBusType(bus.id)}
                  activeOpacity={0.85}
                >
                  {active && (
                    <View style={styles.busChipActiveBadge}>
                      <Ionicons name="checkmark" size={wp('3%')} color="#FFFFFF" />
                    </View>
                  )}
                  <Image source={bus.img} style={styles.busChipImg} />
                  <Text
                    style={[
                      styles.busChipText,
                      active && styles.busChipTextActive,
                    ]}
                  >
                    {bus.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* passengers */}
          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Total passengers
          </Text>
          <View style={styles.inputPill}>
            <View style={styles.inputIconCircle}>
              <Ionicons name="people-outline" size={wp('3.8%')} color={TEAL} />
            </View>
            <TextInput
              value={totalPassengers}
              onChangeText={setTotalPassengers}
              placeholder="e.g. 40"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="numeric"
              style={styles.inputText}
            />
          </View>

          {/* other details */}
          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Other details
          </Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Example: 40 passengers, 2 big luggage compartments, AC required, need experienced driver."
            placeholderTextColor={TEXT_MUTED}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtnWrap, isSubmitting && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Booking Request</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.faqSec}>
          <View style={styles.faqHeaderRow}>
            <View style={styles.faqIconCircle}>
              <Ionicons name="help-circle-outline" size={wp('5%')} color={TEAL} />
            </View>
            <Text style={styles.faqTitle}>FAQs about bus rental</Text>
          </View>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => toggleFAQ(idx)}
                >
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <View style={[styles.faqChevronCircle, open && styles.faqChevronCircleOpen]}>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={wp('3.5%')}
                      color={open ? '#FFFFFF' : TEAL_LIGHT}
                    />
                  </View>
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>

        <View style={{ height: hp('3%') }} />
      </ScrollView>

      {/* PHONE MODAL */}
      <Modal
        visible={isPhoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalIconCircle}
            >
              <Ionicons name="call-outline" size={wp('6%')} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Phone required</Text>
            <Text style={styles.modalBody}>
              Add your phone number once and book faster next time.
            </Text>
            <TouchableOpacity
              style={styles.modalBtnWrap}
              onPress={() => {
                setIsPhoneModal(false);
                navigation.navigate('EditProfileScreen');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPhoneModal(false)}
              style={{ marginTop: hp('1.2%') }}
            >
              <Text style={{ color: TEXT_MUTED, fontSize: wp('3.5%') }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ANDROID PICKER */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    backgroundColor: 'transparent',
  },

  /* ── Header ── */
  headerClip: {
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  decoCircle1: {
    position: 'absolute',
    width: wp('35%'),
    height: wp('35%'),
    borderRadius: wp('17.5%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    left: wp('5%'),
  },
  decoCircle3: {
    position: 'absolute',
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: wp('2%'),
    left: wp('30%'),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
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
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* ── Form Card ── */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('5.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  formTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  formDesc: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('1%'),
  },
  securePill: {
    borderRadius: wp('5%'),
    paddingHorizontal: wp('2.5%'),
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

  /* ── Labels ── */
  label: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
  },

  /* ── Trip Type ── */
  tripTypeBar: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
    gap: wp('1.5%'),
    padding: wp('1%'),
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('2.5%'),
    minHeight: hp('8.5%'),
    justifyContent: 'center',
    borderRadius: wp('3%'),
  },
  tripTypeTabActive: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: `${TEAL}40`,
    ...SHADOW_SM,
  },
  tripTypeIconCircle: {
    width: wp('6.5%'),
    height: wp('6.5%'),
    borderRadius: wp('3.25%'),
    backgroundColor: `${TEAL}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  tripTypeIconCircleActive: {
    backgroundColor: TEAL,
  },
  tripTypeTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  tripTypeTitleActive: {
    color: TEAL_DEEP,
  },
  tripTypeSub: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },

  /* ── Location ── */
  locationBlock: {
    backgroundColor: '#F8FAF9',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: `${TEAL}12`,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    position: 'relative',
  },
  smallLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.5%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: `${TEAL}20`,
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  locationIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: `${TEAL}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.6%'),
  },

  /* ── Overlay & Suggestions ── */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  suggestionBox: {
    position: 'absolute',
    top: hp('10%'),
    left: wp('3%'),
    right: wp('3%'),
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: `${TEAL}20`,
    zIndex: 999,
    maxHeight: hp('28%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  suggestionScrollView: {
    width: '100%',
    maxHeight: hp('28%'),
  },
  suggestionScrollContent: {
    paddingVertical: hp('0.6%'),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.1%'),
    borderBottomWidth: 0.5,
    borderColor: '#EDF2F7',
    gap: wp('2.5%'),
  },
  suggestionDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: TEAL,
    opacity: 0.5,
  },
  suggestionText: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.5%'),
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  /* ── Date Row ── */
  dateRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: `${TEAL}18`,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    ...SHADOW_SM,
  },
  dateLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEAL_MID,
    textTransform: 'uppercase',
    marginBottom: hp('0.6%'),
    letterSpacing: 0.6,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateIconWrap: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('2.2%'),
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
    marginTop: hp('0.1%'),
  },

  /* ── iOS Pickers ── */
  iosDatePickerContainer: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginTop: hp('1%'),
    padding: wp('2.5%'),
    borderWidth: 1,
    borderColor: `${TEAL}15`,
    ...SHADOW_SM,
  },
  iosButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: hp('1%'),
  },
  iosButton: {
    backgroundColor: TEAL,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
  },
  iosButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.5%'),
  },

  /* ── Input Pill ── */
  inputPill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF9',
    borderRadius: wp('3%'),
    borderColor: `${TEAL}12`,
    borderWidth: 1,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    gap: wp('2%'),
    minHeight: hp('6.5%'),
    alignItems: 'center',
  },
  inputIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: `${TEAL}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.3%'),
  },

  /* ── Bus Chips ── */
  busChip: {
    width: wp('33%'),
    backgroundColor: '#F8FAF9',
    borderRadius: wp('3.5%'),
    padding: wp('2%'),
    marginRight: wp('2.5%'),
    alignItems: 'center',
    gap: hp('0.6%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  busChipActive: {
    backgroundColor: CARD,
    borderColor: `${TEAL}50`,
    ...SHADOW_SM,
  },
  busChipActiveBadge: {
    position: 'absolute',
    top: wp('1.5%'),
    right: wp('1.5%'),
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  busChipImg: {
    width: wp('18%'),
    height: hp('5.5%'),
    resizeMode: 'contain',
  },
  busChipText: {
    fontSize: wp('3.2%'),
    textAlign: 'center',
    color: TEXT_SECONDARY,
  },
  busChipTextActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  /* ── Text Area ── */
  textArea: {
    backgroundColor: '#F8FAF9',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: `${TEAL}12`,
    minHeight: hp('10%'),
    padding: wp('3%'),
    textAlignVertical: 'top',
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
  },

  /* ── Submit Button ── */
  submitBtnWrap: {
    marginTop: hp('2%'),
    borderRadius: wp('8%'),
    overflow: 'hidden',
  },
  submitBtn: {
    borderRadius: wp('8%'),
    paddingVertical: hp('1.6%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Quote / How It Works ── */
  quoteTitle: {
    marginTop: hp('2.5%'),
    marginLeft: wp('5%'),
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  quoteTextWrapperMain: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  quoteCard: {
    marginHorizontal: wp('5%'),
    marginTop: hp('1.2%'),
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('5%'),
    ...SHADOW_MD,
  },
  quoteNumberCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  quoteNumber: {
    fontWeight: '800',
    fontSize: wp('5%'),
    color: '#FFFFFF',
  },
  quoteHeading: {
    fontWeight: '700',
    fontSize: wp('4.2%'),
    color: TEXT_PRIMARY,
  },
  quoteBody: {
    fontWeight: '400',
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    lineHeight: hp('2.4%'),
    textAlign: 'center',
    marginTop: hp('1%'),
  },
  quoteBodyMain: { width: '100%' },
  paginationDots: {
    marginTop: hp('1.5%'),
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  dot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: '#D9D9D9',
    marginHorizontal: wp('1.2%'),
  },
  activeDot: {
    backgroundColor: TEAL,
  },

  /* ── FAQ Section ── */
  faqSec: {
    backgroundColor: TEAL_DEEP,
    marginTop: hp('2.5%'),
    marginHorizontal: wp('3.5%'),
    borderRadius: wp('5%'),
    padding: wp('4%'),
    ...SHADOW_MD,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
  },
  faqIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: wp('4.3%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  faqItem: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    paddingVertical: hp('1.2%'),
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    flex: 1,
    marginRight: wp('2.5%'),
    lineHeight: hp('2.5%'),
  },
  faqChevronCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqChevronCircleOpen: {
    backgroundColor: TEAL,
  },
  faqA: {
    color: TEAL_LIGHT,
    fontSize: wp('3.2%'),
    marginTop: hp('0.8%'),
    lineHeight: hp('2.3%'),
    opacity: 0.9,
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,78,59,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: wp('80%'),
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    padding: wp('5%'),
    alignItems: 'center',
    ...SHADOW_MD,
  },
  modalIconCircle: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  modalTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  modalBody: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontSize: wp('3.2%'),
    marginBottom: hp('2%'),
    lineHeight: hp('2.2%'),
  },
  modalBtnWrap: {
    borderRadius: wp('8%'),
    overflow: 'hidden',
    width: '100%',
  },
  modalBtn: {
    borderRadius: wp('8%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
});
