
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { locationService, bookingService } from '../../services';
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

const HOME_TYPES = [
  { label: '1 BHK', value: 'BHK_1', icon: 'home-outline' },
  { label: '2 BHK', value: 'BHK_2', icon: 'home-outline' },
  { label: '3 BHK', value: 'BHK_3', icon: 'home-outline' },
  { label: '4 BHK', value: 'BHK_4', icon: 'home-outline' },
  { label: 'More than 4 BHK', value: 'BHK_More_THAN_4', icon: 'home-outline' },
  { label: 'Villa', value: 'VILLA', icon: 'business-outline' },
];

const OFFICE_TYPES = [
  { label: 'Individual items', value: 'INDIVIDUAL_ITEMS', icon: 'cube-outline' },
  { label: 'Upto 10 Employees', value: 'UPTO_10_EMPLOYEES', icon: 'people-outline' },
  { label: 'Upto 20 Employees', value: 'UPTO_20_EMPLOYEES', icon: 'people-outline' },
  { label: 'More than 20', value: 'MORE_THAN_20_EMPLOYEES', icon: 'briefcase-outline' },
];

const VEHICLE_TYPES = [
  { label: 'Bike', value: 'BIKE', icon: 'bicycle-outline' },
  { label: 'Car', value: 'CAR', icon: 'car-outline' },
  { label: 'SUV', value: 'SUV', icon: 'car-sport-outline' },
];

const faqs = [
  {
    question: 'Do you provide packing also?',
    answer: 'Yes. Our partners provide packing, loading, unloading, and shifting.',
  },
  {
    question: 'Can I shift only a few items?',
    answer: 'Yes, choose Office \u2192 Individual items or add in notes.',
  },
  {
    question: 'Do I get multiple quotes?',
    answer: 'Yes. Fill once \u2192 vendors will send you quotes.',
  },
  {
    question: 'Can I book for future date?',
    answer: 'Yes. Select your moving date in the picker.',
  },
];

export default function PackerMoverScreen() {
  const navigation = useNavigation();

  const [activeType, setActiveType] = useState('home'); // home | office | vehicle
  const [customerData, setCustomerData] = useState(null);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);

  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [destination, setDestination] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [moveDate, setMoveDate] = useState(new Date());

  // android date+time flow
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [androidPickingTarget, setAndroidPickingTarget] = useState('start');

  const [selectedOption, setSelectedOption] = useState(null);
  const [otherDetails, setOtherDetails] = useState('');

  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedIndex, setExpandedIndex] = useState(null);

  /* ── StatusBar management ── */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
    }, [])
  );

  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('customer');
      if (c) {
        const cust = JSON.parse(c);
        setCustomerData(cust);
        if (cust.isB2B === true && cust.b2bStatus === 'APPROVED') setIsB2BCustomer(true);
      }
    })();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getPackersLocations();
      if (response.success && response.locations) {
        setAllLocations(response.locations);
      }
    } catch (e) {
      console.log('location fetch error', e?.response?.data || e);
    }
  };

  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(query.toLowerCase()),
      )
    : allLocations.slice(0, 35);

  const handlePickupInput = (text) => {
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

  const filteredDestLocations = destQuery.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(destQuery.toLowerCase()),
      )
    : allLocations.slice(0, 35);

  const handleDestInput = (text) => {
    setDestQuery(text);
    setDestination(text);
    setShowDestSuggestions(true);
  };

  const handleDestSelect = (loc) => {
    setDestination(loc.name);
    setDestQuery('');
    setShowDestSuggestions(false);
  };

  const openAndroidPicker = () => {
    // 1) open DATE first
    DateTimePickerAndroid.open({
      value: moveDate,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;

        // keep the old time, change only date
        const merged = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          moveDate.getHours(),
          moveDate.getMinutes(),
        );
        setMoveDate(merged);

        // 2) immediately open TIME
        DateTimePickerAndroid.open({
          value: merged,
          mode: 'time',
          is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;
            const final = new Date(merged);
            final.setHours(time.getHours());
            final.setMinutes(time.getMinutes());
            setMoveDate(final);
          },
        });
      },
    });
  };

  // options per tab
  const currentOptions =
    activeType === 'home'
      ? HOME_TYPES
      : activeType === 'office'
      ? OFFICE_TYPES
      : VEHICLE_TYPES;

  const getShiftingType = () => {
    if (activeType === 'home') return 'Home';
    if (activeType === 'office') return 'Office';
    return 'Vehicle';
  };

  const handleSubmit = async () => {
    if (!pickupLocation) {
      alert('Please select pickup location');
      return;
    }
    if (!destination) {
      alert('Please enter destination / new address');
      return;
    }
    if (!selectedOption) {
      alert('Please select shifting type');
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
          alert('Location Notice\n\nThis location is not currently available for packers & movers services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
          // Allow to continue with submission
        }
      }

      // Correct payload format matching database schema EXACTLY
      const payload = {
        customerId: customerId || null,
        customerName: customerData?.name || 'Customer',
        customerEmail: customerData?.email || 'book@transrentals.in',
        customerPhone: customerData?.phone || '',
        serviceType: activeType === 'home' ? 'home-intercity' : activeType === 'office' ? 'office' : 'vehicle',
        shiftingType: selectedOption?.value || selectedOption?.label,
        propertySize: selectedOption?.label || null,
        inventoryList: null,
        hasHeavyItems: false,
        heavyItemsDesc: null,
        hasFragileItems: false,
        fragileItemsDesc: null,
        hasVehicle: false,
        vehicleDetails: null,
        pickupCity: pickupLocation,
        pickupAddress: pickupLocation,
        pickupFloor: null,
        hasPickupLift: false,
        pickupParkingDist: null,
        dropCity: destination,
        dropAddress: destination,
        dropFloor: null,
        hasDropLift: false,
        dropParkingDist: null,
        preferredDate: moveDate.toISOString(),
        isFlexibleDate: false,
        flexibleDateRange: null,
        needPacking: true,
        needUnpacking: true,
        needStorage: false,
        storageDays: null,
        needInsurance: false,
        insuranceValue: null,
        requirements: otherDetails?.trim() || null,
        budgetMin: null,
        budgetMax: null,
      };

      console.log('Packers quote request payload', payload);

      const response = await bookingService.createPackersQuoteRequest(payload);

      // success
      if (response.success || response.quoteRequest) {
        // clear local
        setDestination('');
        setOtherDetails('');

        alert('Quote request submitted!\n\nVendors will send quotes within 24-48 hours.');
        navigation.navigate('MyPackersBookings');
      } else {
        alert('Request could not be submitted. Please try again.');
      }
    } catch (err) {
      console.log('pm submit err', err?.response?.data || err);
      alert('Error submitting booking. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropdownTouching = useRef(false);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── Premium Gradient Header ── */}
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Packers & Movers</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyPackersBookings')}
            style={styles.myBookingsBtn}
          >
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFFFFF" />
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
        contentContainerStyle={{ paddingBottom: hp('4%') }}
      >
        <View style={styles.formCard}>
          {/* header */}
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Plan your shifting</Text>
              <Text style={styles.formDesc}>
                One form \u2192 get multiple packers & movers quotes.
              </Text>
            </View>
          </View>

          {/* main type */}
          <Text style={styles.label}>What do you want to shift?</Text>
          <View style={styles.tripTypeBar}>
            {[
              { id: 'home', label: 'Home', sub: '1BHK • 2BHK • Villa', icon: 'home-outline' },
              { id: 'office', label: 'Office', sub: 'Small / Large office', icon: 'briefcase-outline' },
              { id: 'vehicle', label: 'Vehicle', sub: 'Bike / Car / SUV', icon: 'car-outline' },
            ].map((item) => {
              const active = activeType === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveType(item.id);
                    setSelectedOption(null);
                  }}
                  style={[styles.tripTypeTab, active && styles.tripTypeTabActive]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.tripTypeIconCircle, active && styles.tripTypeIconCircleActive]}>
                    <Ionicons name={item.icon} size={wp('3.8%')} color={active ? '#FFFFFF' : TEXT_SECONDARY} />
                  </View>
                  <Text style={[styles.tripTypeTitle, active && styles.tripTypeTitleActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.tripTypeSub, active && styles.tripTypeSubActive]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* pickup / destination */}
          <View style={styles.locationBlock}>
            {/* FROM */}
            <Text style={styles.smallLabel}>Pickup / Current address</Text>
            <View style={{ position: 'relative', zIndex: 99 }}>
              <View style={styles.locationRow}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="location-outline" size={wp('4%')} color={TEAL} />
                </View>
                <TextInput
                  value={query.length ? query : pickupLocation}
                  onChangeText={handlePickupInput}
                  placeholder="Enter pickup city / area"
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
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {showSuggestions && (
                <View style={styles.suggestionBox}>
                  <ScrollView
                    style={{ maxHeight: hp('28%') }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="always"
                    onTouchStart={() => (dropdownTouching.current = true)}
                    onTouchEnd={() => (dropdownTouching.current = false)}
                  >
                    {filteredLocations.length ? (
                      filteredLocations.map((loc) => (
                        <TouchableOpacity
                          key={loc.id}
                          onPress={() => handleLocationSelect(loc)}
                          style={styles.suggestionItem}
                        >
                          <Ionicons name="location-outline" size={wp('3.8%')} color={TEAL} style={{ marginRight: wp('2%') }} />
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

            {/* Connector line */}
            <View style={styles.connectorLine}>
              <View style={styles.connectorDot} />
              <View style={styles.connectorDot} />
              <View style={styles.connectorDot} />
            </View>

            {/* TO */}
            <Text style={styles.smallLabel}>
              Destination / New address
            </Text>
            <View style={{ position: 'relative', zIndex: 98 }}>
              <View style={styles.locationRow}>
                <View style={[styles.locationIconCircle, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                  <Ionicons name="flag-outline" size={wp('4%')} color="#EF4444" />
                </View>
                <TextInput
                  value={destQuery.length ? destQuery : destination}
                  onChangeText={handleDestInput}
                  placeholder="Enter destination city / area"
                  placeholderTextColor={TEXT_MUTED}
                  style={styles.locationInput}
                  onFocus={() => setShowDestSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestSuggestions(false), 150)}
                />
                {destination ? (
                  <TouchableOpacity
                    onPress={() => {
                      setDestination('');
                      setDestQuery('');
                      setShowDestSuggestions(false);
                    }}
                  >
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {showDestSuggestions && (
                <View style={styles.suggestionBox}>
                  <ScrollView
                    style={{ maxHeight: hp('28%') }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="always"
                  >
                    {filteredDestLocations.length ? (
                      filteredDestLocations.map((loc) => (
                        <TouchableOpacity
                          key={loc.id}
                          onPress={() => handleDestSelect(loc)}
                          style={styles.suggestionItem}
                        >
                          <Ionicons name="location-outline" size={wp('3.8%')} color="#EF4444" style={{ marginRight: wp('2%') }} />
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
          </View>

          {/* date row */}
          <View style={[styles.dateRow, { marginTop: hp('1.5%') }]}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') {
                  openAndroidPicker();
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.dateLabel}>SHIFTING DATE</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {moveDate.toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {moveDate.toLocaleDateString('en-US', { weekday: 'short' })}{' '}
                    {'•'}{' '}
                    {moveDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.dateEditBadge}>
                  <Ionicons name="create-outline" size={wp('3.5%')} color={TEAL} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* SUBTYPE horizontal pills */}
          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            {activeType === 'home'
              ? 'Select house size'
              : activeType === 'office'
              ? 'Select office size'
              : 'Select vehicle type'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subtypeScroll}
            contentContainerStyle={{ gap: wp('2.5%'), paddingRight: wp('2%') }}
          >
            {currentOptions.map((opt) => {
              const active = selectedOption?.value === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSelectedOption(opt)}
                  activeOpacity={0.85}
                  style={[styles.subtypeChip, active && styles.subtypeChipActive]}
                >
                  <View style={[styles.subtypeIconWrap, active && styles.subtypeIconWrapActive]}>
                    <Ionicons
                      name={opt.icon || 'cube-outline'}
                      size={wp('4%')}
                      color={active ? '#FFFFFF' : TEXT_SECONDARY}
                    />
                  </View>
                  <Text style={[styles.subtypeText, active && styles.subtypeTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? (
                    <View style={styles.subtypeTick}>
                      <Ionicons name="checkmark" size={wp('3%')} color="#FFFFFF" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* other details */}
          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Other details (floors, lift, fragile items…)
          </Text>
          <View style={styles.textAreaWrap}>
            <View style={styles.textAreaIconRow}>
              <Ionicons name="create-outline" size={wp('3.8%')} color={TEAL} />
              <Text style={styles.textAreaHint}>Additional notes</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={otherDetails}
              onChangeText={setOtherDetails}
              placeholder="Example: 3rd floor no lift, 2 cupboards, 1 TV, needs packing."
              placeholderTextColor={TEXT_MUTED}
              multiline
            />
          </View>

          {isB2BCustomer && (
            <View style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: wp('3%'), padding: wp('3.5%'), flexDirection: 'row', alignItems: 'flex-start', gap: wp('2.5%'), marginBottom: hp('1.5%') }}>
              <Ionicons name="alert-circle" size={wp('5%')} color="#EA580C" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: wp('3.3%'), fontWeight: '700', color: '#9A3412', marginBottom: 3 }}>Advance Payment Required</Text>
                <Text style={{ fontSize: wp('2.9%'), color: '#C2410C', lineHeight: wp('4.2%') }}>Packers & Movers is not covered under your B2B agreement. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.</Text>
              </View>
            </View>
          )}

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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={wp('4.5%')} color="#FFFFFF" style={{ marginRight: wp('2%') }} />
                  <Text style={styles.submitText}>Get Quotes from Vendors</Text>
                </>
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
            <Text style={styles.faqTitle}>FAQs about Packers & Movers</Text>
          </View>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => toggleFAQ(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <View style={[styles.faqChevronWrap, open && styles.faqChevronWrapOpen]}>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={wp('4%')}
                      color={open ? '#FFFFFF' : TEAL_LIGHT}
                    />
                  </View>
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* phone required modal */}
      <Modal
        visible={isPhoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="call-outline" size={wp('7%')} color={TEAL} />
            </View>
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
              style={{ marginTop: hp('1.5%') }}
            >
              <Text style={{ color: TEXT_MUTED, fontSize: wp('3.5%') }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* ── Header ── */
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
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -wp('15%'),
    right: -wp('10%'),
  },
  decoCircle2: {
    position: 'absolute',
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -wp('8%'),
    left: -wp('5%'),
  },
  decoCircle3: {
    position: 'absolute',
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: hp('2%'),
    left: wp('30%'),
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

  /* ── Form Card ── */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    borderRadius: wp('5.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginTop: hp('-0.5%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  formTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  formDesc: {
    fontSize: wp('3.1%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },

  /* ── Labels ── */
  label: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.8%'),
  },

  /* ── Shifting Type Tabs ── */
  tripTypeBar: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('1.8%'),
    padding: wp('1%'),
    gap: wp('1%'),
  },
  tripTypeTab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('2%'),
    minHeight: hp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('3.5%'),
  },
  tripTypeTabActive: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  tripTypeIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16,185,129,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  tripTypeIconCircleActive: {
    backgroundColor: TEAL,
  },
  tripTypeTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  tripTypeTitleActive: {
    color: TEAL_DEEP,
    fontWeight: '700',
  },
  tripTypeSub: {
    fontSize: wp('2.6%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
    textAlign: 'center',
  },
  tripTypeSubActive: {
    color: TEAL_MID,
  },

  /* ── Location Block ── */
  locationBlock: {
    backgroundColor: BG,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  smallLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.5%'),
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  locationIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: 'rgba(16,185,129,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.6%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.8%'),
  },
  connectorLine: {
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
    gap: hp('0.3%'),
  },
  connectorDot: {
    width: wp('1%'),
    height: wp('1%'),
    borderRadius: wp('0.5%'),
    backgroundColor: TEAL,
    opacity: 0.3,
  },

  /* ── Suggestions ── */
  suggestionBox: {
    position: 'absolute',
    top: hp('7%'),
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    zIndex: 99,
    ...SHADOW_MD,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 0.5,
    borderColor: BG,
  },
  suggestionText: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.4%'),
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  /* ── Date Card ── */
  dateRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    ...SHADOW_SM,
  },
  dateLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: TEAL,
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
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: 'rgba(16,185,129,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: wp('3.6%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateSubText: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.1%'),
  },
  dateEditBadge: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16,185,129,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Subtype Pills ── */
  subtypeScroll: {
    marginTop: hp('1%'),
    marginBottom: hp('2.5%'),
    paddingBottom: hp('0.5%'),
  },
  subtypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('8%'),
    borderWidth: 1.5,
    borderColor: BG,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  subtypeChipActive: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: TEAL,
  },
  subtypeIconWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtypeIconWrapActive: {
    backgroundColor: TEAL,
  },
  subtypeText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  subtypeTextActive: {
    fontWeight: '700',
    color: TEAL_DEEP,
  },
  subtypeTick: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Text Area ── */
  textAreaWrap: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  textAreaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingTop: hp('1%'),
  },
  textAreaHint: {
    fontSize: wp('2.8%'),
    color: TEAL,
    fontWeight: '600',
  },
  textArea: {
    minHeight: hp('10%'),
    paddingHorizontal: wp('3%'),
    paddingTop: hp('0.5%'),
    paddingBottom: hp('1%'),
    textAlignVertical: 'top',
    fontSize: wp('3.2%'),
    color: TEXT_PRIMARY,
  },

  /* ── Submit Button ── */
  submitBtnWrap: {
    marginTop: hp('2%'),
  },
  submitBtn: {
    borderRadius: wp('8%'),
    paddingVertical: hp('1.6%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── FAQ ── */
  faqSec: {
    backgroundColor: TEAL_DEEP,
    marginTop: hp('2%'),
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
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
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  faqItem: {
    borderBottomColor: 'rgba(16,185,129,0.15)',
    borderBottomWidth: 1,
    paddingVertical: hp('1.3%'),
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
    marginRight: wp('3%'),
    fontWeight: '500',
  },
  faqChevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqChevronWrapOpen: {
    backgroundColor: TEAL,
  },
  faqA: {
    color: TEAL_LIGHT,
    fontSize: wp('3.2%'),
    marginTop: hp('0.8%'),
    lineHeight: hp('2.5%'),
    paddingLeft: wp('1%'),
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,78,59,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: wp('78%'),
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    alignItems: 'center',
    ...SHADOW_MD,
  },
  modalIconCircle: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: 'rgba(16,185,129,0.08)',
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
    marginBottom: hp('2%'),
    lineHeight: hp('2.5%'),
  },
  modalBtnWrap: {
    width: '100%',
  },
  modalBtn: {
    borderRadius: wp('8%'),
    paddingVertical: hp('1.4%'),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: wp('3.6%'),
  },
});
