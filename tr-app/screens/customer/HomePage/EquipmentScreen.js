
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from '../../../components/SafeModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { locationService, bookingService, fleetService } from '../../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel, getEarliestPickup, clampPickup } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer } from '../../../utils/isTravelAgent';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

// quick cities
const QUICK_CITIES = [
  { id: 3, name: 'Ahmedabad', img: require('../../../assets/ahmedabad.png') },
  { id: 5, name: 'Bangalore', img: require('../../../assets/bangalore.png') },
  { id: 7, name: 'Udaipur', img: require('../../../assets/udaipur.png') },
  { id: 8, name: 'Goa', img: require('../../../assets/goa.png') },
  { id: 10, name: 'Hyderabad', img: require('../../../assets/hyderabad.png') },
  { id: 12, name: 'Mumbai', img: require('../../../assets/mumbai.png') },
  { id: 13, name: 'Delhi', img: require('../../../assets/delhi.png') },
  { id: 14, name: 'Jaipur', img: require('../../../assets/jaipur.png') },
];

const DURATIONS = [
  { id: '1', label: '1\u20135 days' },
  { id: '2', label: '6\u201315 days' },
  { id: '3', label: '16\u201330 days' },
  { id: '4', label: '30+ days' },
];

// fallback display cards if API is slow
const localEquipFallback = [
  { id: 1, name: 'Excavator' },
  { id: 2, name: 'Crane' },
  { id: 3, name: 'Loader' },
  { id: 4, name: 'Backhoe' },
  { id: 5, name: 'Boom lift' },
];

const quoteData = [
  {
    id: '1',
    number: '1',
    heading: 'Tell us your site',
    body: 'Location + date + machine type',
  },
  {
    id: '2',
    number: '2',
    heading: 'Get vendor quotes',
    body: 'Nearby excavator / crane owners will respond',
  },
  {
    id: '3',
    number: '3',
    heading: 'Confirm booking',
    body: 'Pick one, pay advance (if asked), job starts',
  },
];

export default function EquipmentScreen() {
  const navigation = useNavigation();

  // customer
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  // Phase 7 — Travel Agent Personal/Company booking mode
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  // remote
  const [allLocations, setAllLocations] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // form
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState(null); // object from API
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [startDate, setStartDate] = useState(() => getEarliestPickup());
  const [showDatePicker, setShowDatePicker] = useState(false); // iOS only
  const [equipmentCount, setEquipmentCount] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [needOperator, setNeedOperator] = useState(false);
  const [needDelivery, setNeedDelivery] = useState(true);
  const [otherDetails, setOtherDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '' });
  const [isModalVisible, setModalVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // quote slider
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

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
    }, [])
  );

  useEffect(() => {
    loadCustomer();
    fetchLocations();
    fetchEquipment();
  }, []);

  const loadCustomer = async () => {
    const data = await AsyncStorage.getItem('customer');
    if (data) {
      const c = JSON.parse(data);
      setCustomerData(c);
      if (c.isB2B === true && c.b2bStatus === 'APPROVED') setIsB2BCustomer(true);
    }
  };

  const faqList = [
    {
      q: 'Do I need to pay deposit?',
      a: 'Some vendors may ask for a refundable security deposit depending on the machine.',
    },
    {
      q: 'Can I get it at site?',
      a: 'Yes, mention exact site and vendor will confirm transport.',
    },
    {
      q: 'Can I extend?',
      a: 'Yes, tell the vendor \u2013 they will revise the quote.',
    },
  ];

  const fetchLocations = async () => {
    try {
      const response = await locationService.getEquipmentLocations();
      if (response.success && response.locations) {
        setAllLocations(response.locations);
      }
    } catch (err) {
      console.log('loc err', err?.response?.data || err);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fleetService.getEquipmentTypes();
      if (response.success && response.equipment_types) {
        setEquipmentTypes(response.equipment_types);
      } else {
        setEquipmentTypes(localEquipFallback);
      }
    } catch (err) {
      console.log('equip err', err?.response?.data || err);
      setEquipmentTypes(localEquipFallback);
    }
  };

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(query.toLowerCase()),
      )
    : allLocations.slice(0, 40);

  const handleLocationInput = (text) => {
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

  const handleQuickCity = (city) => {
    setPickupLocation(city.name);
    setPickupLocationId(city.id);
    setShowSuggestions(false);
  };

  // ANDROID SAFE PICKER
  const openAndroidDateTime = () => {
    // first open date
    DateTimePickerAndroid.open({
      value: startDate,
      mode: 'date',
      minimumDate: getMinBookingDate(),
      onChange: (event, date) => {
        if (event.type === 'dismissed') return;
        // Keep the chosen time unless it is now too soon on the new date.
        const pickedDate = date
          ? clampPickup(new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            startDate.getHours(),
            startDate.getMinutes(),
          ))
          : startDate;
        setStartDate(pickedDate);
        // now open time
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed') {
              setStartDate(pickedDate);
              return;
            }
            if (time) {
              const final = new Date(pickedDate);
              final.setHours(time.getHours());
              final.setMinutes(time.getMinutes());
              if (isPickupTooSoon(final)) {
                // Too close to now for a driver to reach: snap to the earliest slot.
                setStartDate(getEarliestPickup());
                setShowBookingAlert(true);
                return;
              }
              setStartDate(final);
            } else {
              setStartDate(pickedDate);
            }
          },
        });
      },
    });
  };

  const handleSubmit = async () => {
    if (!pickupLocation) {
      alert('Please select project / pickup location');
      return;
    }
    if (!selectedEquipment) {
      alert('Please select equipment type');
      return;
    }
    if (!selectedDuration) {
      alert('Please select duration');
      return;
    }
    if (!equipmentCount) {
      alert('Please enter no. of equipments');
      return;
    }

    // 12-hour advance booking validation
    if (isPickupTooSoon(startDate)) {
      setShowBookingAlert(true);
      return;
    }

    // Check if location is in admin-assigned list
    if (!pickupLocationId && pickupLocation) {
      const match = allLocations.find(
        (l) => l.name?.toLowerCase() === pickupLocation?.toLowerCase(),
      );
      if (!match) {
        alert('📍 Location Notice\n\nThis location is not currently available for equipment rental services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
        // Allow to continue with submission
      } else {
        setPickupLocationId(match.id);
      }
    }

    // customer exists but phone missing → go to profile
    if (customerData && !customerData.phone) {
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const token = await AsyncStorage.getItem('token');

      // Calculate rental days based on duration selection
      const getDaysFromDuration = (dur) => {
        if (dur === '1') return 5;  // 1-5 days → avg 5
        if (dur === '2') return 15; // 6-15 days → avg 15
        if (dur === '3') return 30; // 16-30 days → avg 30
        if (dur === '4') return 60; // 30+ days → 60
        return 1;
      };

      const rentalDays = getDaysFromDuration(selectedDuration);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + rentalDays);

      // Correct payload format matching database schema EXACTLY
      const payload = {
        customerId: customerId || null,
        customerName: customerData?.name || 'Customer',
        customerEmail: customerData?.email || 'book@transrentals.in',
        customerPhone: customerData?.phone || '',
        companyName: null,
        equipmentCategory: selectedEquipment?.name || 'Construction Equipment',
        equipmentType: selectedEquipment?.name || 'Heavy Machinery',
        equipmentName: selectedEquipment?.name || null,
        quantity: parseInt(equipmentCount) || 1,
        rentalDuration: 'daily',
        rentalDays: rentalDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deliveryCity: pickupLocation,
        deliveryAddress: siteAddress.trim() || pickupLocation,
        siteType: 'construction',
        needOperator,
        needDelivery,
        needInstallation: false,
        requirements: otherDetails?.trim() || null,
        budgetMin: null,
        budgetMax: null,
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

      console.log('Equipment quote request payload:', payload);

      const response = await bookingService.createEquipmentQuoteRequest(payload);

      if (response.success || response.quoteRequest) {
        setAlertModal({ visible: true, type: 'success', title: 'Request Submitted!', message: 'Your equipment rental request has been submitted. Vendors will send quotes within 24-48 hours.', onClose: () => navigation.navigate('MyEquipmentBookings') });
      } else {
        setAlertModal({ visible: true, type: 'error', title: 'Error', message: 'Request could not be submitted. Please try again.' });
      }
    } catch (err) {
      console.log('equip submit err', err?.response?.data || err);
      setAlertModal({ visible: true, type: 'error', title: 'Error', message: err?.response?.data?.message || 'Booking failed. Please try again.' });
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
        setActiveIndex(index);
      },
    },
  );
  const dropdownTouching = useRef(false);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── GRADIENT HEADER ── */}
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
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Equipment Rental</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyEquipmentBookings')}
            style={styles.myBookingsBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => {
          if (!dropdownTouching.current) setShowSuggestions(false);
        }}
        contentContainerStyle={{ paddingBottom: hp('8%') }}
      >
        {/* FORM CARD */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Post equipment requirement</Text>
              <Text style={styles.formDesc}>
                Fill once, verified vendors will send quotes.
              </Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="construct-outline" size={wp('3.5%')} color="#fff" />
              <Text style={styles.securePillText}>Site job</Text>
            </View>
          </View>

          {/* LOCATION BLOCK */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Project / site location</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location-outline" size={wp('4.2%')} color={TEAL} />
              </View>
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleLocationInput}
                placeholder="Enter city / site / area"
                placeholderTextColor={TEXT_MUTED}
                style={styles.locationInput}
              />
              {pickupLocation ? (
                <TouchableOpacity
                  onPress={() => {
                    setPickupLocation('');
                    setPickupLocationId(null);
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* location suggestions */}
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
                        activeOpacity={0.7}
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

            {/* quick cities */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: hp('1.2%') }}
            >
              {QUICK_CITIES.map((c) => {
                const active = pickupLocationId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => handleQuickCity(c)}
                    activeOpacity={0.7}
                  >
                    <Image source={c.img} style={styles.cityChipImg} />
                    <Text
                      style={[
                        styles.cityChipText,
                        active && styles.cityChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SITE ADDRESS */}
          <View style={{ marginBottom: hp('1.5%') }}>
            <Text style={styles.label}>Site address <Text style={{ fontSize: wp('3%'), fontWeight: '400', color: TEXT_MUTED }}>(optional)</Text></Text>
            <View style={[styles.inputPlain, { flexDirection: 'row', alignItems: 'center', minHeight: hp('6.5%'), paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%') }]}>
              <Ionicons name="location-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput
                value={siteAddress}
                onChangeText={setSiteAddress}
                placeholder="Building, street, landmark, site name..."
                placeholderTextColor={TEXT_MUTED}
                style={{ flex: 1, fontSize: wp('3.5%'), color: TEXT_PRIMARY }}
                multiline
              />
            </View>
          </View>

          {/* OPERATOR & DELIVERY TOGGLES */}
          <View style={styles.toggleCard}>
            <TouchableOpacity onPress={() => setNeedOperator(!needOperator)} activeOpacity={0.8} style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Need operator with equipment?</Text>
                <Text style={styles.toggleSub}>Skilled operator to run the machine</Text>
              </View>
              <View style={[styles.toggleTrack, needOperator && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, needOperator && styles.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNeedDelivery(!needDelivery)} activeOpacity={0.8} style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Need delivery to site?</Text>
                <Text style={styles.toggleSub}>Equipment transported to your location</Text>
              </View>
              <View style={[styles.toggleTrack, needDelivery && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, needDelivery && styles.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* DATE (platform safe) */}
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => {
              if (Platform.OS === 'android') {
                openAndroidDateTime();
              } else {
                setShowDatePicker(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dateLabel}>JOB START</Text>
            <View style={styles.dateContent}>
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateMainText}>
                  {startDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.dateSubText}>
                  {startDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={wp('4.5%')} color={TEXT_MUTED} />
            </View>
          </TouchableOpacity>

          {/* iOS inline picker only */}
          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="spinner"
              minimumDate={getMinBookingDate()}
              onChange={(event, selected) => {
                if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                  return;
                }
                if (selected) {
                  if (isPickupTooSoon(selected)) {
                    // Too close to now for a driver to reach: snap to the earliest slot.
                    setStartDate(getEarliestPickup());
                    setShowBookingAlert(true);
                    setShowDatePicker(false);
                    return;
                  }
                  setStartDate(selected);
                }
                setShowDatePicker(false);
              }}
            />
          )}

          {/* EQUIPMENT TYPE — HORIZONTAL CHIPS */}
          <View style={{ marginTop: hp('2%') }}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>Equipment type</Text>
              <Text style={styles.labelHint}>Crane, JCB, Excavator...</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: wp('2.5%'), paddingVertical: hp('0.5%'), paddingRight: wp('4%') }}
            >
              {(equipmentTypes.length ? equipmentTypes : localEquipFallback).map(
                (eq) => {
                  const active = selectedEquipment?.id === eq.id;
                  return (
                    <TouchableOpacity
                      key={eq.id}
                      onPress={() => setSelectedEquipment(eq)}
                      activeOpacity={0.85}
                      style={[
                        styles.equipChip,
                        active && styles.equipChipActive,
                      ]}
                    >
                      <View style={[styles.equipChipIcon, active && styles.equipChipIconActive]}>
                        <Ionicons
                          name="construct-outline"
                          size={wp('4%')}
                          color={active ? TEAL : TEXT_PRIMARY}
                        />
                      </View>
                      <Text
                        style={[
                          styles.equipChipText,
                          active && styles.equipChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {eq.name}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={wp('4.5%')}
                          color={TEAL}
                          style={{ marginLeft: wp('0.5%') }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
          </View>

          {/* DURATION */}
          <View style={{ marginTop: hp('2%') }}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.labelHint}>Approx. rental period</Text>
            </View>
            <View style={styles.pillWrap}>
              {DURATIONS.map((d) => {
                const active = selectedDuration === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setSelectedDuration(d.id)}
                    style={[styles.pill, active && styles.pillActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* NUMBER OF EQUIPMENTS */}
          <View style={{ marginTop: hp('2%') }}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>No. of equipments</Text>
              <Text style={styles.labelHint}>Example: 1 crane + 1 loader</Text>
            </View>
            <TextInput
              value={equipmentCount}
              onChangeText={setEquipmentCount}
              style={styles.inputPlain}
              keyboardType="number-pad"
              placeholder="Enter count"
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          {/* OTHER DETAILS */}
          <View style={{ marginTop: hp('2%') }}>
            <Text style={styles.label}>Other details</Text>
            <TextInput
              value={otherDetails}
              onChangeText={setOtherDetails}
              style={styles.textArea}
              multiline
              placeholder="Example: with operator, with fuel, 8hr shift, reach Bopal site..."
              placeholderTextColor={TEXT_MUTED}
            />
          </View>

          {/* B2B Notice */}
          {isB2BCustomer && (
            <View style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: wp('3%'), padding: wp('3.5%'), flexDirection: 'row', alignItems: 'flex-start', gap: wp('2.5%'), marginBottom: hp('1.5%') }}>
              <Ionicons name="alert-circle" size={wp('5%')} color="#EA580C" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: wp('3.3%'), fontWeight: '700', color: '#9A3412', marginBottom: 3 }}>Advance Payment Required</Text>
                <Text style={{ fontSize: wp('2.9%'), color: '#C2410C', lineHeight: wp('4.2%') }}>Equipment Rental is not covered under your B2B agreement. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.</Text>
              </View>
            </View>
          )}

          {/* Phase 7 — TA Personal/Company toggle (self-gated). */}
          <TravelAgentBookingToggle value={taState} onChange={setTaState} />

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtnWrap, isSubmitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Get Quotes from Vendors</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* EQUIPMENT SHOWCASE */}
        <View style={styles.groupCard}>
          <Text style={styles.sectionTitleInside}>Popular equipment rentals</Text>
          <View style={styles.equipGrid}>
            <View style={styles.equipBox}>
              <Image
                source={require('../../../assets/EarthMovers.png')}
                style={styles.equipImg}
                resizeMode="contain"
              />
              <Text style={styles.equipBoxName}>Earth Movers</Text>
            </View>
            <View style={styles.equipBox}>
              <Image
                source={require('../../../assets/CraneOnRent.png')}
                style={styles.equipImg}
                resizeMode="contain"
              />
              <Text style={styles.equipBoxName}>Crane on Rent</Text>
            </View>
          </View>
        </View>

        {/* FAQ DARK */}
        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about equipment rentals</Text>
          {faqList.map((f, idx) => {
            const open = expandedFaq === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => setExpandedFaq(open ? null : idx)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.faqQ}>{f.q}</Text>
                  <View style={styles.faqChevronCircle}>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={wp('3.5%')}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
                {open ? <Text style={styles.faqA}>{f.a}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* PHONE MISSING MODAL */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={wp('5.5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>

            <View style={styles.modalIconCircle}>
              <Ionicons name="call-outline" size={wp('6%')} color={TEAL} />
            </View>

            <Text style={styles.modalTitle}>
              Please add your phone number first
            </Text>
            <Text style={styles.modalSubText}>
              We need your phone number so vendors can reach you with quotes.
            </Text>

            <TouchableOpacity
              style={styles.modalBtnWrap}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('EditProfileScreen');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── HEADER ── */
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
  myBookingsBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── FORM CARD ── */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginTop: -hp('0.5%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
    alignItems: 'center',
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

  /* ── LOCATION ── */
  locationBlock: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  smallLabel: {
    fontSize: wp('2.9%'),
    color: TEAL_MID,
    fontWeight: '600',
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
    zIndex: 99,
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
    color: TEXT_PRIMARY,
    fontSize: wp('3.5%'),
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  /* ── CITY CHIPS ── */
  cityChip: {
    flexDirection: 'row',
    gap: wp('1.5%'),
    backgroundColor: CARD,
    borderRadius: wp('10%'),
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.7%'),
    alignItems: 'center',
    marginRight: wp('1.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    ...SHADOW_SM,
  },
  cityChipActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
  },
  cityChipImg: {
    width: wp('6.5%'),
    height: wp('6.5%'),
    borderRadius: wp('3.25%'),
  },
  cityChipText: {
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  cityChipTextActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  /* ── DATE CARD ── */
  dateCard: {
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
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
    gap: wp('2%'),
    alignItems: 'center',
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

  /* ── ROW HEAD / LABELS ── */
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.7%'),
  },
  label: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  labelHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
  },

  /* ── EQUIPMENT CHIPS ── */
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F3',
    borderRadius: wp('10%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3.5%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: wp('1.5%'),
  },
  equipChipActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  equipChipIcon: {
    width: wp('6.5%'),
    height: wp('6.5%'),
    borderRadius: wp('3.25%'),
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipChipIconActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  equipChipText: {
    fontSize: wp('3.4%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
    maxWidth: wp('40%'),
  },
  equipChipTextActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  /* ── DURATION PILLS ── */
  pillWrap: {
    flexDirection: 'row',
    gap: wp('2%'),
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    backgroundColor: '#F0F4F3',
    borderRadius: wp('10%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
  },
  pillText: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.2%'),
    fontWeight: '500',
  },
  pillTextActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },

  /* ── TOGGLE CARD ── */
  toggleCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: wp('3.5%'),
    marginBottom: hp('1.5%'),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(16,185,129,0.1)',
  },
  toggleLabel: { fontSize: wp('3.5%'), fontWeight: '600', color: TEXT_PRIMARY },
  toggleSub: { fontSize: wp('2.9%'), color: TEXT_MUTED, marginTop: 2 },
  toggleTrack: {
    width: wp('11%'), height: wp('6%'), borderRadius: wp('3%'),
    backgroundColor: '#D1D5DB', justifyContent: 'center', paddingHorizontal: wp('0.8%'),
  },
  toggleTrackOn: { backgroundColor: TEAL },
  toggleThumb: {
    width: wp('4.5%'), height: wp('4.5%'), borderRadius: wp('2.25%'),
    backgroundColor: '#FFFFFF', alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  /* ── INPUTS ── */
  inputPlain: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.1)',
    minHeight: hp('6%'),
    paddingHorizontal: wp('3%'),
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    marginTop: hp('0.7%'),
    ...SHADOW_SM,
  },
  textArea: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.1)',
    minHeight: hp('10%'),
    padding: wp('2.5%'),
    textAlignVertical: 'top',
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
    marginTop: hp('0.7%'),
    ...SHADOW_SM,
  },

  /* ── SUBMIT BUTTON ── */
  submitBtnWrap: {
    marginTop: hp('2%'),
    marginBottom: hp('0.8%'),
    borderRadius: wp('10%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  submitGradient: {
    borderRadius: wp('10%'),
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

  /* ── EQUIPMENT SHOWCASE ── */
  groupCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('5%'),
    padding: wp('3.5%'),
    ...SHADOW_SM,
  },
  sectionTitleInside: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.2%'),
  },
  equipGrid: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  equipBox: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  equipImg: {
    width: wp('18%'),
    height: hp('6%'),
  },
  equipBoxName: {
    marginTop: hp('1%'),
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  /* ── FAQ SECTION ── */
  faqSec: {
    backgroundColor: TEAL_DEEP,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2.2%'),
    padding: wp('4%'),
    borderRadius: wp('5%'),
  },
  faqTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('1.5%'),
  },
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.4%'),
    marginBottom: hp('1%'),
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
    fontWeight: '500',
  },
  faqChevronCircle: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  faqA: {
    color: TEAL_LIGHT,
    fontSize: wp('3.1%'),
    marginTop: hp('0.8%'),
    lineHeight: hp('2.4%'),
  },

  /* ── PHONE MODAL ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,78,59,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  modalContent: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    width: '100%',
    padding: wp('5%'),
    alignItems: 'center',
    ...SHADOW_MD,
  },
  closeButton: {
    position: 'absolute',
    top: hp('1.2%'),
    right: wp('3%'),
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F0F4F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconCircle: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    marginTop: hp('0.5%'),
  },
  modalTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  modalSubText: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: hp('2%'),
    lineHeight: hp('2.2%'),
  },
  modalBtnWrap: {
    width: '100%',
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
  },
  modalBtnGradient: {
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
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
