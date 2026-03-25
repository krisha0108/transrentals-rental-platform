// BusRentalScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

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

  const [showBookingAlert, setShowBookingAlert] = useState(false);
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

  // Dropdown close handler के लिए ref
  const dropdownRef = useRef(null);

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

  // Dropdown बाहर click करने पर close करने का function
  const handleOutsideClick = () => {
    setShowSuggestions(false);
  };

  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

 const openAndroidPicker = (target) => {
  // target: 'start' | 'end'
  const currentValue = target === 'start' ? startDate : returnDate;

  // 1) open DATE
  DateTimePickerAndroid.open({
    value: currentValue,
    mode: 'date',
    minimumDate: target === 'start' ? getMinBookingDate() : startDate,
    onChange: (event, date) => {
      if (event.type === 'dismissed' || !date) {
        return;
      }

      // merge selected date with existing time
      if (target === 'start') {
        const merged = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        );
        setStartDate(merged);

        // make sure return is after start
        if (returnDate < merged) {
          setReturnDate(new Date(merged.getTime() + 2 * 60 * 60 * 1000));
        }

        // 2) now open TIME for start
        DateTimePickerAndroid.open({
          value: merged,
          mode: 'time',
          is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;
            const final = new Date(merged);
            final.setHours(time.getHours());
            final.setMinutes(time.getMinutes());

            if (isPickupTooSoon(final)) {
              setShowBookingAlert(true);
              return;
            }

            setStartDate(final);

            // again keep end after start
            if (returnDate < final) {
              setReturnDate(new Date(final.getTime() + 2 * 60 * 60 * 1000));
            }
          },
        });
      } else {
        // target === 'end'
        const merged = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          returnDate.getHours(),
          returnDate.getMinutes(),
        );
        setReturnDate(merged);

        // 2) now open TIME for end
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
        if (isPickupTooSoon(upd)) {
          setShowBookingAlert(true);
          setAndroidPickerVisible(false);
          return;
        }
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
    if (isPickupTooSoon(selectedDate)) {
      setShowBookingAlert(true);
      return;
    }
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
    if (parseInt(totalPassengers) < 10) {
      alert('Minimum 10 passengers required for bus booking');
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
          // Location not in admin-assigned list
          alert('📍 Location Notice\n\nThis location is not currently available for bus rental services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
          // Allow to continue with submission
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
            width: width - 45,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <View style={styles.quoteTextWrapperMain}>
          <View style={styles.quoteNumberCircle}>
            <Text style={styles.quoteNumber}>{item.number}</Text>
          </View>
          <Text style={styles.quoteHeading}>{item.heading}</Text>
        </View>
        <View style={styles.quoteBodyMain}>
          <Text style={styles.quoteBody}>{item.body}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bus Rental</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* form card */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Plan your bus journey</Text>
              <Text style={styles.formDesc}>
                Fill this form once, get multiple quotes from bus operators.
              </Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </View>
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
                  <View style={styles.tripTypeIconCircle}>
                    <Ionicons
                      name={item.id === 'local' ? 'navigate' : 'map'}
                      size={15}
                      color={active ? '#0F172A' : '#0F172A'}
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

          {/* Location block - MODIFIED WITH OVERLAY */}
          <View style={styles.locationBlock}>
            {/* FROM */}
            <Text style={styles.smallLabel}>
              From (Area, Street or Landmark)
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.locationRow}
            >
              <Ionicons name="location-outline" size={18} color="#0F172A" />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup location"
                placeholderTextColor="#94A3B8"
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
                  <Ionicons name="close-circle" size={24} color="#CBD5F5" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            {/* suggestions with overlay */}
            {showSuggestions && (
              <>
                {/* Overlay for outside click */}
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
            <Text style={[styles.smallLabel, { marginTop: 14 }]}>
              To (Area, Street or Landmark)
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.locationRow}
            >
              <Ionicons name="flag-outline" size={18} color="#0F172A" />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Enter drop location"
                placeholderTextColor="#94A3B8"
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
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                </View>
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
                  <View style={styles.dateIconWrap}>
                    <Ionicons name="calendar-outline" size={16} color="#0F172A" />
                  </View>
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
                minimumDate={getMinBookingDate()}
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
          <Text style={[styles.label, { marginTop: 16 }]}>Bus type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 6 }}
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
          <Text style={[styles.label, { marginTop: 16 }]}>
            Total passengers
          </Text>
          <View style={styles.inputPill}>
            <Ionicons name="people-outline" size={15} color="#64748B" />
            <TextInput
              value={totalPassengers}
              onChangeText={setTotalPassengers}
              placeholder="e.g. 40"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              style={styles.inputText}
            />
          </View>

          {/* other details */}
          <Text style={[styles.label, { marginTop: 16 }]}>
            Other details 
          </Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Example: 40 passengers, 2 big luggage compartments, AC required, need experienced driver."
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Booking Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about bus rental</Text>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => toggleFAQ(idx)}
                >
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#E2E8F0"
                  />
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
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
            <Text style={styles.modalTitle}>Phone required</Text>
            <Text style={styles.modalBody}>
              Add your phone number once and book faster next time.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setIsPhoneModal(false);
                navigation.navigate('EditProfileScreen');
              }}
            >
              <Text style={styles.modalBtnText}>Go to Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPhoneModal(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: '#94A3B8' }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ANDROID PICKER */}

      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { backgroundColor: 'transparent' },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 20,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  formDesc: { fontSize: 12, color: '#94A3B8', marginTop:10},
  securePill: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 25,
    marginLeft: -80,
  },
  securePillText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },

  tripTypeBar: {
    flexDirection: 'row',
    backgroundColor: '#EFF3F6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 70,
    justifyContent: 'center',
  },
  tripTypeTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(9,179,104,0.25)',
    borderRadius: 14,
    elevation: 1,
  },
  tripTypeIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(9,179,104,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  tripTypeTitleActive: {
    color: '#0F172A',
  },
  tripTypeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  locationBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
    padding: 12,
    marginBottom: 12,
    position: 'relative', // Important for overlay positioning
  },
  smallLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 12,
    minHeight: 54,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 6,
  },

  // NEW: Overlay style for outside click
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
    top: 90, // Adjust based on your layout
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    zIndex: 999,
    maxHeight: 220,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  suggestionScrollView: {
    width: '100%',
    maxHeight: 220,
  },
  suggestionScrollContent: {
    paddingVertical: 6,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderColor: '#EDF2F7',
  },
  suggestionText: { color: '#0F172A' },
  noResult: { padding: 10, textAlign: 'center', color: '#94A3B8' },

  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },

  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iosButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  iosButton: {
    backgroundColor: '#09B368',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iosButtonText: { color: '#fff', fontWeight: '600' },

  inputPill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderColor: 'rgba(15,23,42,0.05)',
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 6,
    gap: 6,
    minHeight: 56,
    alignItems: 'center',
  },
  inputText: { flex: 1, fontSize: 12.5, color: '#0F172A', paddingVertical: 2 },

  busChip: {
    width: 130,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  busChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(9,179,104,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  busChipImg: { width: 70, height: 45, resizeMode: 'contain' },
  busChipText: { fontSize: 13, textAlign: 'center', color: '#475569' },
  busChipTextActive: { color: '#0F172A', fontWeight: '600' },

  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    minHeight: 84,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 12.5,
  },
  submitBtn: {
    marginTop: 15,
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  quoteTitle: {
    marginTop: 20,
    marginLeft: 23,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  quoteTextWrapperMain: {
    width: '100%',
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: 10,
  },
  quoteCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 25,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3.55,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  quoteNumberCircle: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'absolute',
    opacity: 0.8,
    bottom: -70,
  },
  quoteNumber: { fontWeight: '700', fontSize: 100, color: '#DDF7E8' },
  quoteHeading: {
    fontWeight: '700',
    fontSize: 17,
    color: '#404040',
    marginLeft: 65,
    marginTop: 5,
  },
  quoteBody: {
    fontWeight: '400',
    fontSize: 15,
    color: '#4D4C4C',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  quoteBodyMain: { width: '100%' },
  paginationDots: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 5,
  },
  activeDot: { backgroundColor: '#2FCD72' },

  faqSec: { backgroundColor: '#0F172A', marginTop: 16, padding: 16 },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  faqItem: {
    borderBottomColor: 'rgba(226,232,240,0.1)',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: { color: '#FFFFFF', fontSize: 14, flex: 1, marginRight: 10 },
  faqA: { color: '#CBD5F5', fontSize: 12.5, marginTop: 6, lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  modalBody: { textAlign: 'center', color: '#94A3B8', fontSize: 12.5, marginBottom: 14 },
  modalBtn: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});