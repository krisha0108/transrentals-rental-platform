
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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { locationService, bookingService } from '../../services';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

// ---- UI data (unchanged) ----
const luxuryTypes = [
  { id: 'wedding',   name: 'Wedding',   sub: 'Baraat, vidai, reception', icon: require('../../../assets/wedding-car.png') },
  { id: 'personal',  name: 'Personal',  sub: 'City ride, events',        icon: require('../../../assets/avatar.png') },
  { id: 'corporate', name: 'Corporate', sub: 'Client pickup, hotel',     icon: require('../../../assets/corporate.png') },
];

const luxuryPackages = [
  { id: 'local',      name: 'Local 4hr / 40km', meta: 'For shoot \u2022 local events',    icon: require('../../../assets/place.png') },
  { id: 'outstation', name: 'Outstation',       meta: 'Weddings \u2022 nearby cities',    icon: require('../../../assets/travel.png') },
  { id: 'airport',    name: 'Airport pickup',   meta: 'Flight sync \u2022 waiting ok',    icon: require('../../../assets/airport.png') },
];

const luxuryFleet = [
  { id: '1', name: 'Mercedes',    image: require('../../../assets/Mercedes.png') },
  { id: '2', name: 'BMW',         image: require('../../../assets/BMW.png') },
  { id: '3', name: 'Audi',        image: require('../../../assets/Audi.png') },
  { id: '4', name: 'Jaguar',      image: require('../../../assets/Jaguar.png') },
  { id: '5', name: 'Range Rover', image: require('../../../assets/rangerover.png') },
  { id: '6', name: 'Rolls-Royce', image: require('../../../assets/Rolls-Royce.png') },
];

const faqs = [
  { question: 'Do I get a uniformed chauffeur?', answer: 'Yes, for luxury & wedding bookings we provide a professional, well\u2013dressed chauffeur with proper etiquette.' },
  { question: 'Can I decorate the car for baraat / vidai?', answer: 'Yes. You can mention d\u00e9cor in "Other details". D\u00e9cor cost depends on city & vendor.' },
  { question: 'Is airport pickup included?', answer: 'Yes, choose "Airport" package. Share flight details in notes to avoid waiting charges.' },
  { question: 'Can I use the same car for full day?', answer: 'Yes, pick Local 4hr/40km / 8hr/80km or mention your custom time. Vendor will quote.' },
];

// ---- IMPORTANT: Map UI slugs to the numeric IDs your old working API expects ----
const LUXURY_TYPE_ID_MAP = {
  wedding: '1',
  personal: '2',
  corporate: '3',
};

const PACKAGE_ID_MAP = {
  local: '1',
  outstation: '2',
  airport: '3',
};

export default function LuxuryScreen() {
  const navigation = useNavigation();

  // UI
  const [expandedIndex, setExpandedIndex] = useState(null);

  // data
  const [customerData, setCustomerData] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // booking selections (keep slugs in UI)
  const [selectedLuxuryType, setSelectedLuxuryType] = useState('wedding'); // slug
  const [selectedPackage, setSelectedPackage] = useState('local');         // slug
  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dates
  const [startDate, setStartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));

  // ANDROID date/time picker controls
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [androidPickingTarget, setAndroidPickingTarget] = useState('start');

  // iOS pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

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
    (async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) setCustomerData(JSON.parse(data));
    })();
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

  const textSafe = (t) => (t || '').toLowerCase();

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) => typeof l.name === 'string' && l.name.toLowerCase().includes(textSafe(query)),
      )
    : allLocations.slice(0, 35);

  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(text);
    setPickupLocationId(null); // force user to choose a suggestion so we have ID
    setShowSuggestions(true);
  };

  const handleLocationSelect = (loc) => {
    setPickupLocation(loc.name);
    setPickupLocationId(loc.id);
    setQuery('');
    setShowSuggestions(false);
  };

 const openAndroidPicker = (target) => {
  // target: 'start' | 'end'
  const currentValue = target === 'start' ? startDate : returnDate;

  // 1) open DATE
  DateTimePickerAndroid.open({
    value: currentValue,
    mode: 'date',
    minimumDate: target === 'start' ? new Date() : startDate,
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
          setReturnDate(new Date(merged.getTime() + 2 * 60 * 60 * 1000));
        }
      } else {
        const newEnd = new Date(selected);
        const merged = new Date(
          newEnd.getFullYear(),
          newEnd.getMonth(),
          newEnd.getDate(),
          returnDate.getHours(),
          returnDate.getMinutes(),
        );
        setReturnDate(merged);
      }
      setAndroidPickerMode('time');
      setAndroidPickerVisible(true);
      return;
    }

    // time picked
    if (androidPickerMode === 'time') {
      if (androidPickingTarget === 'start') {
        const upd = new Date(startDate);
        upd.setHours(selected.getHours());
        upd.setMinutes(selected.getMinutes());
        setStartDate(upd);
        if (returnDate < upd) {
          setReturnDate(new Date(upd.getTime() + 2 * 60 * 60 * 1000));
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

  // iOS
  const onReturnDateChangeIOS = (event, selectedDate) => {
    if (!selectedDate) return;
    setReturnDate(selectedDate);
  };

  // ---- SUBMIT (now matches your old working payload exactly) ----
  const handleSubmit = async () => {
    if (!pickupLocation) {
      alert('Please select pickup city');
      return;
    }
    if (!pickupLocationId) {
      alert('Please choose a pickup location from suggestions (we need the Location ID).');
      return;
    }
    if (!selectedLuxuryType) {
      alert('Please select booking purpose');
      return;
    }
    if (!selectedPackage) {
      alert('Please select package');
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

      // Map UI slugs -> numeric IDs expected by backend (same as OLD file)
      const luxuryTypeId = LUXURY_TYPE_ID_MAP[selectedLuxuryType]; // '1' | '2' | '3'
      const packageId = PACKAGE_ID_MAP[selectedPackage];            // '1' | '2' | '3'

      const payload = {
        customer_id: customerId ?? '',
        service_id: 2,
        service_name: 'Luxury Car',
        location_id: pickupLocationId,
        location_name: pickupLocation,
        destination,
        journey_datetime: startDate.toISOString(),
        return_datetime: returnDate?.toISOString() ?? null,
        luxury_type: luxuryTypeId,   // numeric ID (same as old working screen)
        package: packageId,          // numeric ID (same as old working screen)
        total_passangers: 4,         // optional (kept from old screen)
        other_info: (otherDetails || '').trim(),
      };

      const headers = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const response = await bookingService.createLuxuryBooking(payload);

      if (response.success || response.booking) {
        navigation.replace('BookingConfirmation', {
          booking_id: response.booking?.id || response.booking_id || 'unknown'
        });
      } else if (response.status) {
        alert('Luxury booking submitted \u2705');
      } else {
        alert('Booking could not be submitted. Check required fields.');
      }
    } catch (err) {
      console.log('luxury booking error', err?.response?.data || err);
      alert(err?.response?.data?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropdownTouching = useRef(false);

  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* GRADIENT HEADER */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.headerGrad}>
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { top: hp('3%'), left: wp('25%'), width: 40, height: 40 }]} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Luxury Car Rental</Text>
            <Text style={styles.headerSub}>Premium chauffeur-driven experience</Text>
          </View>
          <View style={{ width: wp('9%') }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          if (!dropdownTouching.current) setShowSuggestions(false);
        }}
      >
        {/* FORM CARD */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Book premium chauffeur</Text>
              <Text style={styles.formDesc}>One quick form, get luxury car quotes.</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </View>
          </View>

          {/* LOCATION SECTION */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="location" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionLabel}>Pickup & Drop</Text>
          </View>

          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Pickup (Hotel, Airport, City...)</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={TEAL_MID} />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup location"
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
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            {/* suggestions */}
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                <ScrollView
                  style={{ maxHeight: 210 }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="always"
                  onTouchStart={() => (dropdownTouching.current = true)}
                  onTouchEnd={() => (dropdownTouching.current = false)}
                >
                  {filteredLocations.length ? (
                    filteredLocations.map((loc) => (
                      <TouchableOpacity key={loc.id} style={styles.suggestionItem} onPress={() => handleLocationSelect(loc)}>
                        <Ionicons name="location-outline" size={16} color={TEAL} style={{ marginRight: wp('2%') }} />
                        <Text style={styles.suggestionText}>{loc.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResult}>No location found</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* destination */}
            <Text style={[styles.smallLabel, { marginTop: hp('1.5%') }]}>Drop / Venue (optional)</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
              <Ionicons name="flag-outline" size={18} color={TEAL_MID} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Wedding venue, office, airport..."
                placeholderTextColor={TEXT_MUTED}
                style={styles.locationInput}
              />
            </TouchableOpacity>
          </View>

          {/* DATES SECTION */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="calendar" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionLabel}>Trip Dates</Text>
          </View>

          <View style={styles.dateRow}>
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
                  <Ionicons name="calendar-outline" size={16} color={TEAL_MID} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {startDate.toLocaleDateString('en-US', { weekday: 'short' })} •{' '}
                    {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

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
                  <Ionicons name="calendar-outline" size={16} color={TEAL_MID} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {returnDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {returnDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* iOS pickers */}
          {showStartDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (!selectedDate) return;
                  setStartDate(selectedDate);
                  if (returnDate < selectedDate) {
                    setReturnDate(new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000));
                  }
                }}
                minimumDate={new Date()}
              />
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity style={styles.iosButton} onPress={() => setShowStartDatePicker(false)}>
                  <Text style={styles.iosButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showReturnDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker value={returnDate} mode="datetime" display="spinner" onChange={onReturnDateChangeIOS} minimumDate={startDate} />
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity style={styles.iosButton} onPress={() => setShowReturnDatePicker(false)}>
                  <Text style={styles.iosButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* LUXURY TYPE */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="car-sport" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionLabel}>Booking for</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: wp('2%') }}>
            {luxuryTypes.map((t) => {
              const active = selectedLuxuryType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedLuxuryType(t.id)}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                    <Image source={t.icon} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeName, active && styles.typeNameActive]}>{t.name}</Text>
                    <Text style={[styles.typeSub, active && styles.typeSubActive]}>{t.sub}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={TEAL} /> : <Ionicons name="ellipse-outline" size={18} color={TEXT_MUTED} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PACKAGE */}
          <View style={[styles.sectionHeader, { marginTop: hp('2%') }]}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="pricetag" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionLabel}>Package</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: hp('0.5%') }}
            contentContainerStyle={{ paddingRight: wp('3%'), gap: wp('2.5%') }}
          >
            {luxuryPackages.map((p) => {
              const active = selectedPackage === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPackage(p.id)}
                  style={[styles.packageCard, active && styles.packageCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={styles.packageLeft}>
                    <View style={[styles.packageIconWrap, active && styles.packageIconWrapActive]}>
                      <Image source={p.icon} style={{ width: 26, height: 26, resizeMode: 'contain' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.packageName, active && styles.packageNameActive]}>{p.name}</Text>
                      <Text style={[styles.packageMeta, active && styles.packageMetaActive]}>{p.meta}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={active ? TEAL_MID : TEXT_MUTED} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* OTHER DETAILS */}
          <View style={[styles.sectionHeader, { marginTop: hp('2%') }]}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="create" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionLabel}>Other details (car colour, decor...)</Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Example: White BMW with ribbon decor, 2 hrs buffer, 2 pickup points..."
            placeholderTextColor={TEXT_MUTED}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[TEAL_MID, '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: wp('2%') }} />
                  <Text style={styles.submitText}>Submit Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* LUXURY FLEET */}
        <View style={styles.groupCard}>
          <View style={styles.groupCardHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="diamond" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitleInside}>Popular luxury fleet</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: wp('2.5%'), paddingRight: wp('2%') }}>
            {luxuryFleet.map((car) => (
              <View key={car.id} style={styles.luxuryCard}>
                <Image source={car.image} style={styles.luxuryImg} />
                <Text style={styles.luxuryName}>{car.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* POPULAR CITIES */}
        <View style={styles.groupCard}>
          <View style={styles.groupCardHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="globe" size={wp('4%')} color={TEAL_MID} />
            </View>
            <Text style={styles.sectionTitleInside}>Popular cities</Text>
          </View>
          <View style={styles.cityWrap}>
            {['Ahmedabad','Bangalore','Mumbai','Udaipur','Jaipur','Pune','Chennai','Hyderabad','Goa','Delhi'].map((c, i) => (
              <View key={i} style={styles.cityChip}>
                <Ionicons name="location-outline" size={14} color={TEAL} />
                <Text style={styles.cityText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ SECTION */}
        <View style={styles.faqSec}>
          <View style={styles.faqTitleRow}>
            <View style={styles.faqIconCircle}>
              <Ionicons name="help-circle" size={wp('5%')} color={TEAL_MID} />
            </View>
            <Text style={styles.faqTitle}>FAQs about luxury car rental</Text>
          </View>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={[styles.faqItem, open && styles.faqItemActive]}>
                <TouchableOpacity style={styles.faqHead} onPress={() => toggleFAQ(idx)}>
                  <Text style={[styles.faqQ, open && styles.faqQActive]}>{item.question}</Text>
                  <View style={[styles.faqChevronWrap, open && styles.faqChevronWrapActive]}>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={open ? TEAL_MID : TEXT_MUTED} />
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
      <Modal visible={isPhoneModal} transparent animationType="fade" onRequestClose={() => setIsPhoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="call" size={wp('7%')} color={TEAL_MID} />
            </View>
            <Text style={styles.modalTitle}>Phone required</Text>
            <Text style={styles.modalBody}>Add your phone number once and book faster next time.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setIsPhoneModal(false);
                navigation.navigate('EditProfileScreen');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[TEAL_MID, '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPhoneModal(false)} style={{ marginTop: hp('1.2%') }}>
              <Text style={{ color: TEXT_MUTED, fontSize: wp('3.3%'), fontWeight: '500' }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + hp('1%') : hp('1%'),
    paddingBottom: hp('2.5%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },

  scrollBody: { flex: 1 },

  // Form Card
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  formTitle: {
    fontSize: wp('4.2%'),
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
    borderRadius: 999,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  securePillText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontWeight: '600',
  },

  // Section headers (icon circle + label)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginTop: hp('1.8%'),
    marginBottom: hp('1%'),
  },
  sectionIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Location
  locationBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: wp('3%'),
    marginBottom: hp('0.5%'),
  },
  smallLabel: {
    fontSize: wp('2.9%'),
    color: TEXT_MUTED,
    marginBottom: hp('0.5%'),
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp('3%'),
    minHeight: hp('6%'),
    gap: wp('2%'),
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.5%'),
  },
  suggestionBox: {
    position: 'absolute',
    top: hp('11%'),
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 99,
    ...SHADOW_MD,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.1%'),
    borderBottomWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  suggestionText: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.3%'),
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  // Dates
  dateRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
  },
  dateLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEAL_MID,
    textTransform: 'uppercase',
    marginBottom: hp('0.6%'),
    letterSpacing: 0.5,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateIconWrap: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateSubText: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
  },

  // iOS date picker
  iosDatePickerContainer: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginTop: hp('1%'),
    padding: wp('2.5%'),
    ...SHADOW_SM,
  },
  iosButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: hp('1%'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: hp('1%'),
  },
  iosButton: {
    backgroundColor: TEAL_MID,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
  },
  iosButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.3%'),
  },

  // Booking type cards (horizontal)
  typeCard: {
    width: wp('65%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    padding: wp('2.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp('2.5%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeCardActive: {
    backgroundColor: CARD,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  typeIconWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  typeIconWrapActive: {
    backgroundColor: TEAL_LIGHT,
  },
  typeName: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  typeNameActive: {
    color: TEAL_MID,
  },
  typeSub: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },
  typeSubActive: {
    color: TEXT_SECONDARY,
  },

  // Package cards
  packageCard: {
    width: wp('65%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    padding: wp('3%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  packageCardActive: {
    backgroundColor: CARD,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  packageLeft: {
    flexDirection: 'row',
    gap: wp('2.5%'),
    alignItems: 'center',
    flex: 1,
  },
  packageIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageIconWrapActive: {
    backgroundColor: TEAL_LIGHT,
  },
  packageName: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  packageNameActive: {
    color: TEAL_MID,
  },
  packageMeta: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
  },
  packageMetaActive: {
    color: TEXT_SECONDARY,
  },

  // Text area
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: hp('10%'),
    padding: wp('3%'),
    textAlignVertical: 'top',
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
  },

  // Submit button
  submitBtn: {
    marginTop: hp('2%'),
    borderRadius: 999,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.6%'),
    borderRadius: 999,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Group cards (fleet, cities)
  groupCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('5%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  sectionTitleInside: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  // Fleet cards
  luxuryCard: {
    width: wp('28%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    padding: wp('2.5%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  luxuryImg: {
    width: wp('18%'),
    height: hp('5%'),
    resizeMode: 'contain',
  },
  luxuryName: {
    marginTop: hp('0.8%'),
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },

  // City chips
  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  cityChip: {
    flexDirection: 'row',
    gap: wp('1%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: 999,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    alignItems: 'center',
  },
  cityText: {
    fontSize: wp('3.2%'),
    color: TEAL_MID,
    fontWeight: '600',
  },

  // FAQ section
  faqSec: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('5%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  faqTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  faqIconCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  faqItem: {
    borderRadius: wp('3%'),
    backgroundColor: '#F8FAFC',
    marginBottom: hp('1%'),
    padding: wp('3.5%'),
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  faqItemActive: {
    backgroundColor: TEAL_LIGHT,
    borderLeftColor: TEAL_MID,
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.3%'),
    fontWeight: '600',
    flex: 1,
    marginRight: wp('2%'),
  },
  faqQActive: {
    color: TEAL_MID,
  },
  faqChevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqChevronWrapActive: {
    backgroundColor: 'rgba(6,95,70,0.12)',
  },
  faqA: {
    color: TEXT_SECONDARY,
    fontSize: wp('3%'),
    marginTop: hp('0.8%'),
    lineHeight: wp('4.5%'),
  },

  // Phone Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: wp('80%'),
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    padding: wp('6%'),
    alignItems: 'center',
    ...SHADOW_MD,
  },
  modalIconCircle: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  modalTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },
  modalBody: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontSize: wp('3.2%'),
    lineHeight: wp('4.8%'),
    marginBottom: hp('2%'),
  },
  modalBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  modalBtnGradient: {
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
});
