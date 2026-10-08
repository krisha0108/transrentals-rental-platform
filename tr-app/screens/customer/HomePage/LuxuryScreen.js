
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
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from '../../../components/SafeModal';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel, getEarliestPickup, clampPickup } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

// ---- UI data (unchanged) ----
const luxuryTypes = [
  { id: 'wedding',   name: 'Wedding',   sub: 'Baraat, vidai, reception', icon: require('../../../assets/wedding-car.png') },
  { id: 'personal',  name: 'Personal',  sub: 'City ride, events',        icon: require('../../../assets/avatar.png') },
  { id: 'corporate', name: 'Corporate', sub: 'Client pickup, hotel',     icon: require('../../../assets/corporate.png') },
];

const luxuryPackages = [
  { id: 'local',      name: 'Local 4hr / 40km', meta: 'For shoot • local events',    icon: require('../../../assets/place.png') },
  { id: 'outstation', name: 'Outstation',       meta: 'Weddings • nearby cities',    icon: require('../../../assets/travel.png') },
  { id: 'airport',    name: 'Airport pickup',   meta: 'Flight sync • waiting ok',    icon: require('../../../assets/airport.png') },
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
  { question: 'Do I get a uniformed chauffeur?', answer: 'Yes, for luxury & wedding bookings we provide a professional, well–dressed chauffeur with proper etiquette.' },
  { question: 'Can I decorate the car for baraat / vidai?', answer: 'Yes. You can mention décor in “Other details”. Décor cost depends on city & vendor.' },
  { question: 'Is airport pickup included?', answer: 'Yes, choose “Airport” package. Share flight details in notes to avoid waiting charges.' },
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
  outstation: '3',
  airport: '4',
};

export default function LuxuryScreen() {
  const navigation = useNavigation();

  // UI
  const [showBookingAlert, setShowBookingAlert] = useState(false);
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
  const [vehicleCategory, setVehicleCategory] = useState(null);           // Premium Sedan | Luxury SUV | Vintage
  const [needDecoration, setNeedDecoration] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dates
  const [startDate, setStartDate] = useState(() => getEarliestPickup());
  const [returnDate, setReturnDate] = useState(() => new Date(getEarliestPickup().getTime() + 2 * 60 * 60 * 1000));

  // ANDROID date/time picker controls
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [androidPickingTarget, setAndroidPickingTarget] = useState('start');

  // iOS pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

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
    minimumDate: target === 'start' ? getMinBookingDate() : startDate,
    onChange: (event, date) => {
      if (event.type === 'dismissed' || !date) {
        return;
      }

      // merge selected date with existing time
      if (target === 'start') {
        // Keep the chosen time unless it is now too soon on the new date.
        const merged = clampPickup(new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ));
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
              // Too close to now for a driver to reach: snap to the earliest slot.
              const earliest = getEarliestPickup();
              setStartDate(earliest);
              if (returnDate < earliest) {
                setReturnDate(new Date(earliest.getTime() + 2 * 60 * 60 * 1000));
              }
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
        // Keep the chosen time unless it is now too soon on the new date.
        const merged = clampPickup(new Date(
          newStart.getFullYear(),
          newStart.getMonth(),
          newStart.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ));
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
        if (isPickupTooSoon(upd)) {
          // Too close to now for a driver to reach: snap to the earliest slot.
          const earliest = getEarliestPickup();
          setStartDate(earliest);
          if (returnDate < earliest) {
            setReturnDate(new Date(earliest.getTime() + 2 * 60 * 60 * 1000));
          }
          setShowBookingAlert(true);
          setAndroidPickerVisible(false);
          return;
        }
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
        luxury_type: luxuryTypeId,
        package: packageId,
        total_passangers: 4,
        vehicleCategory: vehicleCategory || null,
        vehicleCategoryName: vehicleCategory || null,
        pickupAddress: pickupAddress.trim() || null,
        needDecoration,
        occasionType: selectedLuxuryType,
        other_info: (otherDetails || '').trim(),
      };

      const headers = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const response = await bookingService.createLuxuryBooking(payload);

      if (response.success || response.booking) {
        navigation.replace('BookingConfirmation', {
          booking_id: response.booking?.bookingNumber || response.booking?.id || response.booking_id || 'unknown'
        });
      } else if (response.status) {
        alert('Luxury booking submitted ✅');
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
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Luxury Car Rental</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => {
          if (!dropdownTouching.current) setShowSuggestions(false);
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* FORM CARD */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Book premium chauffeur</Text>
              <Text style={styles.formDesc}>One quick form, get luxury car quotes.</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </View>
          </View>

          {/* LOCATION BLOCK */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Pickup (Hotel, Airport, City…)</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color="#0F172A" />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup location"
                placeholderTextColor="#94A3B8"
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
                  <Ionicons name="close-circle" size={24} color="#CBD5F5" />
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
            <Text style={[styles.smallLabel, { marginTop: 14 }]}>Drop / Venue (optional)</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
              <Ionicons name="flag-outline" size={18} color="#0F172A" />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Wedding venue, office, airport…"
                placeholderTextColor="#94A3B8"
                style={styles.locationInput}
              />
            </TouchableOpacity>
          </View>

          {/* DATES */}
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
                  <Ionicons name="calendar-outline" size={16} color="#0F172A" />
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
                  <Ionicons name="calendar-outline" size={16} color="#0F172A" />
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
                  if (isPickupTooSoon(selectedDate)) {
                    // Too close to now for a driver to reach: snap to the earliest slot.
                    const earliest = getEarliestPickup();
                    setStartDate(earliest);
                    if (returnDate < earliest) {
                      setReturnDate(new Date(earliest.getTime() + 2 * 60 * 60 * 1000));
                    }
                    setShowBookingAlert(true);
                    return;
                  }
                  setStartDate(selectedDate);
                  if (returnDate < selectedDate) {
                    setReturnDate(new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000));
                  }
                }}
                minimumDate={getMinBookingDate()}
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
          <Text style={[styles.label, { marginTop: 16, marginBottom: 10 }]}>Booking for</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
            {luxuryTypes.map((t) => {
              const active = selectedLuxuryType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedLuxuryType(t.id)}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={styles.typeIconWrap}>
                    <Image source={t.icon} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeName, active && styles.typeNameActive]}>{t.name}</Text>
                    <Text style={[styles.typeSub, active && styles.typeSubActive]}>{t.sub}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color={GREEN} /> : <Ionicons name="ellipse-outline" size={18} color="#CBD5F5" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PACKAGE */}
          <Text style={[styles.label, { marginTop: 16 }]}>Package</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 6 }}
            contentContainerStyle={{ paddingRight: 10, gap: 10 }}
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
                    <View style={[styles.packageIconWrap, active && { backgroundColor: 'rgba(9,179,104,0.12)' }]}>
                      <Image source={p.icon} style={{ width: 26, height: 26, resizeMode: 'contain' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.packageName, active && styles.packageNameActive]}>{p.name}</Text>
                      <Text style={[styles.packageMeta, active && styles.packageMetaActive]}>{p.meta}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={active ? '#0F172A' : '#CBD5F5'} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* VEHICLE CATEGORY */}
          <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Vehicle category</Text>
          <View style={styles.vehicleCatRow}>
            {[
              { id: 'Premium Sedan', icon: 'car-sport-outline', sub: 'Mercedes, BMW, Audi' },
              { id: 'Luxury SUV',    icon: 'car-outline',        sub: 'Range Rover, GLC' },
              { id: 'Vintage',       icon: 'speedometer-outline',sub: 'Rolls-Royce, Jag' },
            ].map((c) => {
              const active = vehicleCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setVehicleCategory(active ? null : c.id)}
                  activeOpacity={0.85}
                  style={[styles.vehicleCatChip, active && styles.vehicleCatChipActive]}
                >
                  <Ionicons name={c.icon} size={16} color={active ? GREEN : '#64748B'} />
                  <Text style={[styles.vehicleCatText, active && styles.vehicleCatTextActive]}>{c.id}</Text>
                  <Text style={styles.vehicleCatSub}>{c.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PICKUP ADDRESS */}
          <Text style={[styles.label, { marginTop: 16, marginBottom: 6 }]}>Pickup address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Building, street, landmark…"
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, fontSize: 13, color: '#0F172A' }}
              multiline
            />
          </View>

          {/* DECORATION TOGGLE */}
          <TouchableOpacity
            onPress={() => setNeedDecoration(!needDecoration)}
            activeOpacity={0.8}
            style={styles.decorRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.decorLabel}>Car decoration needed?</Text>
              <Text style={styles.decorSub}>Flowers, ribbon, baraat décor, etc.</Text>
            </View>
            <View style={[styles.toggleTrack, needDecoration && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, needDecoration && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {/* OTHER DETAILS */}
          <Text style={[styles.label, { marginTop: 16 }]}>Other details (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Example: White BMW with ribbon décor, 2 hrs buffer, 2 pickup points…"
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <TouchableOpacity style={[styles.submitBtn, isSubmitting && { opacity: 0.4 }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
          </TouchableOpacity>
        </View>

        {/* LUXURY FLEET */}
        <View style={styles.groupCard}>
          <Text style={styles.sectionTitleInside}>Popular luxury fleet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
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
          <Text style={styles.sectionTitleInside}>Popular cities</Text>
          <View style={styles.cityWrap}>
            {['Ahmedabad','Bangalore','Mumbai','Udaipur','Jaipur','Pune','Chennai','Hyderabad','Goa','Delhi'].map((c, i) => (
              <View key={i} style={styles.cityChip}>
                <Ionicons name="location-outline" size={14} color={GREEN} />
                <Text style={styles.cityText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ DARK */}
        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about luxury car rental</Text>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqHead} onPress={() => toggleFAQ(idx)}>
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#E2E8F0" />
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* PHONE MODAL */}
      <Modal visible={isPhoneModal} transparent animationType="fade" onRequestClose={() => setIsPhoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Phone required</Text>
            <Text style={styles.modalBody}>Add your phone number once and book faster next time.</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setIsPhoneModal(false);
                navigation.navigate('EditProfileScreen');
              }}
            >
              <Text style={styles.modalBtnText}>Go to Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPhoneModal(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: '#94A3B8' }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    marginTop: 10,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  formDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  securePill: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 25,
  },
  securePillText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  locationBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
    padding: 12,
    marginBottom: 12,
  },
  smallLabel: { fontSize: 11.5, color: '#94A3B8', marginBottom: 4 },
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
  locationInput: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 6 },
  suggestionBox: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    zIndex: 99,
    elevation: 10,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderColor: '#EDF2F7',
  },
  suggestionText: { color: '#0F172A' },
  noResult: { padding: 10, textAlign: 'center', color: '#94A3B8' },

  dateRow: { flexDirection: 'row', gap: 12 },
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
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  dateSubText: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

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
  iosButton: { backgroundColor: '#09B368', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  iosButtonText: { color: '#fff', fontWeight: '600' },

  label: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 5 },

  // booking for (horizontal)
  typeCard: {
    width: width * 0.7,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(9,179,104,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  typeIconWrap: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  typeName: { fontSize: 14.5, fontWeight: '600', color: '#0F172A' },
  typeNameActive: { color: '#055F3B' },
  typeSub: { fontSize: 11.5, color: '#94A3B8', marginTop: 2 },
  typeSubActive: { color: '#0F172A' },

  // packages (redesigned)
  packageCard: {
    width: width * 0.72,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  packageCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(9,179,104,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  packageLeft: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  packageIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  packageNameActive: { color: '#055F3B' },
  packageMeta: { fontSize: 11.5, color: '#94A3B8' },
  packageMetaActive: { color: '#0F172A' },

  vehicleCatRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  vehicleCatChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
    borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent',
  },
  vehicleCatChipActive: { backgroundColor: '#F0FDF4', borderColor: GREEN },
  vehicleCatText: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 4, textAlign: 'center' },
  vehicleCatTextActive: { color: '#16A34A' },
  vehicleCatSub: { fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2 },

  addressRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)', padding: 10, minHeight: 50,
  },

  decorRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)', padding: 12, marginTop: 12,
  },
  decorLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  decorSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  toggleTrack: {
    width: 42, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleTrackOn: { backgroundColor: GREEN },
  toggleThumb: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

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
  submitBtn: { marginTop: 15, backgroundColor: GREEN, borderRadius: 999, paddingVertical: 11, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  groupCard: { backgroundColor: '#FFFFFF', marginHorizontal: 14, marginTop: 16, borderRadius: 20, padding: 14 },
  sectionTitleInside: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  luxuryCard: { width: 120, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 10, alignItems: 'center' },
  luxuryImg: { width: 70, height: 40, resizeMode: 'contain' },
  luxuryName: { marginTop: 6, fontSize: 13, fontWeight: '600', color: '#0F172A', textAlign: 'center' },

  cityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(9,179,104,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  cityText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },

  // faq (dark)
  faqSec: { backgroundColor: '#0F172A', marginTop: 16, padding: 16, paddingBottom: 26 },
  faqTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  faqItem: { borderBottomColor: 'rgba(226,232,240,0.1)', borderBottomWidth: 1, paddingVertical: 10 },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { color: '#FFFFFF', fontSize: 14, flex: 1, marginRight: 10 },
  faqA: { color: '#CBD5F5', fontSize: 12.5, marginTop: 6, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 300, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  modalBody: { textAlign: 'center', color: '#94A3B8', fontSize: 12.5, marginBottom: 14 },
  modalBtn: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});
