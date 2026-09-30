
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Platform, ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import Modal from '../../../components/SafeModal';
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
import { getMinBookingDate, isPickupTooSoon, getEarliestPickup, clampPickup } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
import {
  TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD,
} from '../../../theme';
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer } from '../../../utils/isTravelAgent';

const HOME_TYPES = [
  { label: '1 BHK',          value: 'BHK_1',          icon: 'home-outline' },
  { label: '2 BHK',          value: 'BHK_2',          icon: 'home-outline' },
  { label: '3 BHK',          value: 'BHK_3',          icon: 'home-outline' },
  { label: '4 BHK',          value: 'BHK_4',          icon: 'home-outline' },
  { label: 'More than 4 BHK',value: 'BHK_More_THAN_4',icon: 'home-outline' },
  { label: 'Villa',          value: 'VILLA',           icon: 'business-outline' },
];

const OFFICE_TYPES = [
  { label: '1–10 Employees',   value: 'UPTO_10_EMP',    icon: 'people-outline' },
  { label: '11–50 Employees',  value: '11_TO_50_EMP',   icon: 'people-outline' },
  { label: '51–100 Employees', value: '51_TO_100_EMP',  icon: 'briefcase-outline' },
  { label: '100+ Employees',   value: 'MORE_100_EMP',   icon: 'briefcase-outline' },
];

const VEHICLE_TYPES = [
  { label: 'Bike', value: 'BIKE', icon: 'bicycle-outline' },
  { label: 'Car',  value: 'CAR',  icon: 'car-outline' },
  { label: 'SUV',  value: 'SUV',  icon: 'car-sport-outline' },
];

const SHIFTING_ITEMS = [
  'Bedroom set', 'Kitchen items', 'Sofa', 'Dining set',
  'Fridge', 'Almirah / Wardrobe', 'TV', 'Washing machine',
];

const faqs = [
  { question: 'Do you provide packing also?', answer: 'Yes. Our partners provide packing, loading, unloading, and shifting.' },
  { question: 'Can I shift only a few items?', answer: 'Yes, choose Office → Individual items or add in notes.' },
  { question: 'Do I get multiple quotes?', answer: 'Yes. Fill once → vendors will send you quotes.' },
  { question: 'Can I book for future date?', answer: 'Yes. Select your moving date in the picker.' },
];

export default function PackerMoverScreen() {
  const navigation = useNavigation();

  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [activeType, setActiveType] = useState('home');
  const [customerData, setCustomerData] = useState(null);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);

  // ── location search ──
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destination, setDestination] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // ── core fields ──
  const [moveDate, setMoveDate] = useState(() => getEarliestPickup());
  const [selectedOption, setSelectedOption] = useState(null);
  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Phase 7 — TA Personal/Company toggle (self-gates on linkedTravelAgentId).
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  const [expandedIndex, setExpandedIndex] = useState(null);

  // ── shifting scope ──
  const [shiftingScope, setShiftingScope] = useState('LOCAL');

  // ── pickup details ──
  const [pickupFullAddress, setPickupFullAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupFloor, setPickupFloor] = useState('');
  const [hasPickupLift, setHasPickupLift] = useState(false);

  // ── destination details ──
  const [destFullAddress, setDestFullAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  const [dropFloor, setDropFloor] = useState('');
  const [hasDropLift, setHasDropLift] = useState(false);

  // ── delivery date / time ──
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(null);

  // ── items & inventory ──
  const [selectedItems, setSelectedItems] = useState([]);
  const [weightVolume, setWeightVolume] = useState(null);
  const [hasHeavyItems, setHasHeavyItems] = useState(false);
  const [heavyItemsDesc, setHeavyItemsDesc] = useState('');
  const [hasFragileItems, setHasFragileItems] = useState(false);
  const [inventoryDetails, setInventoryDetails] = useState('');

  // ── services ──
  const [needPacking, setNeedPacking] = useState(true);
  const [needLoading, setNeedLoading] = useState(true);
  const [needUnloading, setNeedUnloading] = useState(true);
  const [labourCount, setLabourCount] = useState('');

  // ── truck & load ──
  const [vehicleTypeShared, setVehicleTypeShared] = useState('DEDICATED');
  const [partLoadAccepted, setPartLoadAccepted] = useState(false);

  // ── insurance & POD ──
  const [needInsurance, setNeedInsurance] = useState(false);
  const [insuranceValue, setInsuranceValue] = useState('');
  const [requiresPOD, setRequiresPOD] = useState(false);

  // ── receiver ──
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  // ── multiple stops ──
  const [hasMultipleStops, setHasMultipleStops] = useState(false);
  const [multipleStopsDetails, setMultipleStopsDetails] = useState('');

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP);
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#FFFFFF');
      };
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
      if (response.success && response.locations) setAllLocations(response.locations);
    } catch (e) { console.log('location fetch error', e?.response?.data || e); }
  };

  const toggleFAQ = (i) => setExpandedIndex((prev) => (prev === i ? null : i));
  const toggleItem = (item) => setSelectedItems((prev) =>
    prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
  );

  const trimmedQuery = (query || '').trim();
  const filteredLocations = trimmedQuery.length
    ? allLocations.filter((l) => typeof l.name === 'string' && l.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : allLocations.slice(0, 35);

  const handlePickupInput = (text) => { setQuery(text); setPickupLocation(text); setPickupLocationId(null); setShowSuggestions(true); };
  const handleLocationSelect = (loc) => { setPickupLocation(loc.name); setPickupLocationId(loc.id); setQuery(''); setShowSuggestions(false); };

  const filteredDestLocations = destQuery.length
    ? allLocations.filter((l) => typeof l.name === 'string' && l.name.toLowerCase().includes(destQuery.toLowerCase()))
    : allLocations.slice(0, 35);

  const handleDestInput = (text) => { setDestQuery(text); setDestination(text); setShowDestSuggestions(true); };
  const handleDestSelect = (loc) => { setDestination(loc.name); setDestQuery(''); setShowDestSuggestions(false); };

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: moveDate, mode: 'date', minimumDate: getMinBookingDate(),
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;
        // Keep the chosen time unless it is now too soon on the new date.
        const merged = clampPickup(new Date(date.getFullYear(), date.getMonth(), date.getDate(), moveDate.getHours(), moveDate.getMinutes()));
        setMoveDate(merged);
        DateTimePickerAndroid.open({
          value: merged, mode: 'time', is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;
            const final = new Date(merged);
            final.setHours(time.getHours()); final.setMinutes(time.getMinutes());
            if (isPickupTooSoon(final)) {
              // Too close to now for a crew to reach: snap to the earliest slot.
              setMoveDate(getEarliestPickup());
              setShowBookingAlert(true);
              return;
            }
            setMoveDate(final);
          },
        });
      },
    });
  };

  const openAndroidDeliveryPicker = () => {
    const base = deliveryDate || new Date();
    DateTimePickerAndroid.open({
      value: base, mode: 'date', minimumDate: moveDate,
      onChange: (event, date) => {
        if (event.type === 'dismissed' || !date) return;
        const merged = new Date(date.getFullYear(), date.getMonth(), date.getDate(), base.getHours(), base.getMinutes());
        DateTimePickerAndroid.open({
          value: merged, mode: 'time', is24Hour: false,
          onChange: (event2, time) => {
            if (event2.type === 'dismissed' || !time) return;
            const final = new Date(merged);
            final.setHours(time.getHours()); final.setMinutes(time.getMinutes());
            setDeliveryDate(final);
          },
        });
      },
    });
  };

  const currentOptions = activeType === 'home' ? HOME_TYPES : activeType === 'office' ? OFFICE_TYPES : VEHICLE_TYPES;

  const handleSubmit = async () => {
    if (!pickupLocation) { alert('Please select pickup city'); return; }
    if (!destination) { alert('Please enter destination city'); return; }
    if (!selectedOption) { alert('Please select shifting type'); return; }
    if (customerData && !customerData.phone) { setIsPhoneModal(true); return; }

    setIsSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      let finalLocationId = pickupLocationId;
      if (!finalLocationId && pickupLocation) {
        const match = allLocations.find((l) => l.name?.toLowerCase() === pickupLocation?.toLowerCase());
        if (match) finalLocationId = match.id;
        else alert('Location Notice\n\nThis location is not currently available. You can still submit your request.');
      }

      const payload = {
        customerId: customerId || null,
        customerName: customerData?.name || 'Customer',
        customerEmail: customerData?.email || 'book@transrentals.in',
        customerPhone: customerData?.phone || '',
        serviceType: activeType === 'home' ? 'home-intercity' : activeType === 'office' ? 'office' : 'vehicle',
        shiftingType: selectedOption?.value || selectedOption?.label,
        propertySize: selectedOption?.label || null,
        shiftingScope,
        pickupCity: pickupLocation,
        pickupAddress: pickupFullAddress.trim() || pickupLocation,
        pickupPincode: pickupPincode.trim() || null,
        pickupFloor: pickupFloor.trim() || null,
        hasPickupLift,
        dropCity: destination,
        dropAddress: destFullAddress.trim() || destination,
        dropPincode: dropPincode.trim() || null,
        dropFloor: dropFloor.trim() || null,
        hasDropLift,
        preferredDate: moveDate.toISOString(),
        expectedDeliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
        deliveryTimeSlot: deliveryTimeSlot || null,
        inventoryList: selectedItems.length ? selectedItems.join(', ') : null,
        weightVolume: weightVolume || null,
        hasHeavyItems,
        heavyItemsDesc: hasHeavyItems ? (heavyItemsDesc.trim() || null) : null,
        hasFragileItems,
        inventoryDetails: inventoryDetails.trim() || null,
        needPacking,
        needUnpacking: needUnloading,
        needLoading,
        needUnloading,
        labourCount: labourCount ? parseInt(labourCount, 10) : null,
        vehicleType: vehicleTypeShared,
        partLoadAccepted,
        needInsurance,
        insuranceValue: needInsurance ? (insuranceValue.trim() || null) : null,
        requiresPOD,
        receiverName: receiverName.trim() || null,
        receiverPhone: receiverPhone.trim() || null,
        hasMultipleStops,
        multipleStopsDetails: hasMultipleStops ? (multipleStopsDetails.trim() || null) : null,
        needStorage: false,
        storageDays: null,
        isFlexibleDate: false,
        requirements: otherDetails?.trim() || null,
        budgetMin: null,
        budgetMax: null,
      };

      // Phase 7 — TA Personal/Company fields (only for travel-agent customers).
      if (isTravelAgentCustomer(customerData)) {
        payload.taBookingMode = taState.mode;
        payload.numberOfVehicles = taState.mode === 'COMPANY'
          ? (parseInt(taState.vehicleCount) || 1)
          : 1;
        payload.numberOfEmployees = taState.mode === 'COMPANY' && taState.employeeCount
          ? parseInt(taState.employeeCount)
          : null;
      }

      const response = await bookingService.createPackersQuoteRequest(payload);

      // TA COMPANY booking routes into b2b_bookings → open the B2B detail.
      if (response.bookingMode === 'COMPANY' && response.booking) {
        setDestination(''); setOtherDetails('');
        navigation.navigate('B2BBookingDetail', { bookingId: response.booking.id });
        return;
      }

      if (response.success || response.quoteRequest) {
        setDestination(''); setOtherDetails('');
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

  const renderToggle = (label, value, setter) => (
    <TouchableOpacity onPress={() => setter(!value)} activeOpacity={0.8} style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.decoCircle1} pointerEvents="none" />
        <View style={styles.decoCircle2} pointerEvents="none" />
        <View style={styles.decoCircle3} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Packers & Movers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyPackersBookings')} style={styles.myBookingsBtn}>
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false} nestedScrollEnabled keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => { if (!dropdownTouching.current) setShowSuggestions(false); }}
        contentContainerStyle={{ paddingBottom: hp('4%') }}
      >
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Plan your shifting</Text>
              <Text style={styles.formDesc}>One form → get multiple packers & movers quotes.</Text>
            </View>
          </View>

          {/* ── What to shift ── */}
          <Text style={styles.label}>What do you want to shift?</Text>
          <View style={styles.tripTypeBar}>
            {[
              { id: 'home', label: 'Home', sub: '1BHK • 2BHK • Villa', icon: 'home-outline' },
              { id: 'office', label: 'Office', sub: 'Small / Large office', icon: 'briefcase-outline' },
              { id: 'vehicle', label: 'Vehicle', sub: 'Bike / Car / SUV', icon: 'car-outline' },
            ].map((item) => {
              const active = activeType === item.id;
              return (
                <TouchableOpacity key={item.id} onPress={() => { setActiveType(item.id); setSelectedOption(null); }}
                  style={[styles.tripTypeTab, active && styles.tripTypeTabActive]} activeOpacity={0.9}>
                  <View style={[styles.tripTypeIconCircle, active && styles.tripTypeIconCircleActive]}>
                    <Ionicons name={item.icon} size={wp('3.8%')} color={active ? '#FFFFFF' : TEXT_SECONDARY} />
                  </View>
                  <Text style={[styles.tripTypeTitle, active && styles.tripTypeTitleActive]}>{item.label}</Text>
                  <Text style={[styles.tripTypeSub, active && styles.tripTypeSubActive]}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Shifting scope ── */}
          <Text style={styles.label}>Scope of move</Text>
          <View style={styles.scopeBar}>
            {[
              { id: 'LOCAL', label: 'Local', sub: 'Within city', icon: 'location-outline' },
              { id: 'DOMESTIC', label: 'Domestic', sub: 'Within state', icon: 'earth-outline' },
              { id: 'INTERCITY', label: 'Intercity', sub: 'Between states', icon: 'arrow-forward-circle-outline' },
            ].map((s) => {
              const active = shiftingScope === s.id;
              return (
                <TouchableOpacity key={s.id} onPress={() => setShiftingScope(s.id)}
                  style={[styles.scopeTab, active && styles.scopeTabActive]} activeOpacity={0.9}>
                  <Ionicons name={s.icon} size={wp('4%')} color={active ? TEAL : TEXT_MUTED} />
                  <Text style={[styles.scopeLabel, active && styles.scopeLabelActive]}>{s.label}</Text>
                  <Text style={styles.scopeSub}>{s.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Sub-type ── */}
          <Text style={styles.label}>
            {activeType === 'home' ? 'Select house size' : activeType === 'office' ? 'Select office size' : 'Select vehicle type'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subtypeScroll}
            contentContainerStyle={{ gap: wp('2.5%'), paddingRight: wp('2%') }}>
            {currentOptions.map((opt) => {
              const active = selectedOption?.value === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => setSelectedOption(opt)} activeOpacity={0.85}
                  style={[styles.subtypeChip, active && styles.subtypeChipActive]}>
                  <View style={[styles.subtypeIconWrap, active && styles.subtypeIconWrapActive]}>
                    <Ionicons name={opt.icon || 'cube-outline'} size={wp('4%')} color={active ? '#FFFFFF' : TEXT_SECONDARY} />
                  </View>
                  <Text style={[styles.subtypeText, active && styles.subtypeTextActive]}>{opt.label}</Text>
                  {active && <View style={styles.subtypeTick}><Ionicons name="checkmark" size={wp('3%')} color="#FFFFFF" /></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Pickup details ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="location-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Pickup details</Text>
            </View>

            {/* City autocomplete */}
            <Text style={styles.fieldLabel}>City / Area *</Text>
            <View style={{ position: 'relative', zIndex: 99 }}>
              <View style={styles.locationRow}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="location-outline" size={wp('4%')} color={TEAL} />
                </View>
                <TextInput value={query.length ? query : pickupLocation} onChangeText={handlePickupInput}
                  placeholder="Enter pickup city / area" placeholderTextColor={TEXT_MUTED} style={styles.locationInput}
                  onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} />
                {pickupLocation ? (
                  <TouchableOpacity onPress={() => { setPickupLocation(''); setPickupLocationId(null); setQuery(''); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {showSuggestions && (
                <View style={styles.suggestionBox}>
                  <ScrollView style={{ maxHeight: hp('25%') }} nestedScrollEnabled keyboardShouldPersistTaps="always"
                    onTouchStart={() => (dropdownTouching.current = true)} onTouchEnd={() => (dropdownTouching.current = false)}>
                    {filteredLocations.length ? filteredLocations.map((loc) => (
                      <TouchableOpacity key={loc.id} onPress={() => handleLocationSelect(loc)} style={styles.suggestionItem}>
                        <Ionicons name="location-outline" size={wp('3.8%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                        <Text style={styles.suggestionText}>{loc.name}</Text>
                      </TouchableOpacity>
                    )) : <Text style={styles.noResult}>No location found</Text>}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Full address */}
            <Text style={[styles.fieldLabel, { marginTop: hp('1.2%') }]}>Full address (building, street, landmark)</Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="home-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={pickupFullAddress} onChangeText={setPickupFullAddress}
                placeholder="e.g. 12, MG Road, near City Mall" placeholderTextColor={TEXT_MUTED}
                style={styles.fieldInput} multiline />
            </View>

            {/* Pincode + Floor row */}
            <View style={styles.twoColRow}>
              <View style={styles.twoColCell}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <View style={styles.textFieldRow}>
                  <Ionicons name="keypad-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
                  <TextInput value={pickupPincode} onChangeText={setPickupPincode}
                    placeholder="6 digits" placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric" maxLength={6} style={styles.fieldInput} />
                </View>
              </View>
              <View style={[styles.twoColCell, { marginLeft: wp('2%') }]}>
                <Text style={styles.fieldLabel}>Floor</Text>
                <View style={styles.textFieldRow}>
                  <Ionicons name="layers-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
                  <TextInput value={pickupFloor} onChangeText={setPickupFloor}
                    placeholder="0 = Ground" placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric" style={styles.fieldInput} />
                </View>
              </View>
            </View>

            {renderToggle('Lift available at pickup', hasPickupLift, setHasPickupLift)}
          </View>

          {/* ── Destination details ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <Ionicons name="flag-outline" size={wp('4%')} color="#EF4444" />
              </View>
              <Text style={styles.sectionTitle}>Destination details</Text>
            </View>

            {/* City autocomplete */}
            <Text style={styles.fieldLabel}>City / Area *</Text>
            <View style={{ position: 'relative', zIndex: 98 }}>
              <View style={styles.locationRow}>
                <View style={[styles.locationIconCircle, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                  <Ionicons name="flag-outline" size={wp('4%')} color="#EF4444" />
                </View>
                <TextInput value={destQuery.length ? destQuery : destination} onChangeText={handleDestInput}
                  placeholder="Enter destination city / area" placeholderTextColor={TEXT_MUTED} style={styles.locationInput}
                  onFocus={() => setShowDestSuggestions(true)} onBlur={() => setTimeout(() => setShowDestSuggestions(false), 150)} />
                {destination ? (
                  <TouchableOpacity onPress={() => { setDestination(''); setDestQuery(''); setShowDestSuggestions(false); }}>
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {showDestSuggestions && (
                <View style={styles.suggestionBox}>
                  <ScrollView style={{ maxHeight: hp('25%') }} nestedScrollEnabled keyboardShouldPersistTaps="always">
                    {filteredDestLocations.length ? filteredDestLocations.map((loc) => (
                      <TouchableOpacity key={loc.id} onPress={() => handleDestSelect(loc)} style={styles.suggestionItem}>
                        <Ionicons name="location-outline" size={wp('3.8%')} color="#EF4444" style={{ marginRight: wp('2%') }} />
                        <Text style={styles.suggestionText}>{loc.name}</Text>
                      </TouchableOpacity>
                    )) : <Text style={styles.noResult}>No location found</Text>}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Full address */}
            <Text style={[styles.fieldLabel, { marginTop: hp('1.2%') }]}>Full destination address</Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="business-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={destFullAddress} onChangeText={setDestFullAddress}
                placeholder="e.g. 45, Park Street, Sector 5" placeholderTextColor={TEXT_MUTED}
                style={styles.fieldInput} multiline />
            </View>

            {/* Pincode + Floor row */}
            <View style={styles.twoColRow}>
              <View style={styles.twoColCell}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <View style={styles.textFieldRow}>
                  <Ionicons name="keypad-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
                  <TextInput value={dropPincode} onChangeText={setDropPincode}
                    placeholder="6 digits" placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric" maxLength={6} style={styles.fieldInput} />
                </View>
              </View>
              <View style={[styles.twoColCell, { marginLeft: wp('2%') }]}>
                <Text style={styles.fieldLabel}>Floor</Text>
                <View style={styles.textFieldRow}>
                  <Ionicons name="layers-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
                  <TextInput value={dropFloor} onChangeText={setDropFloor}
                    placeholder="0 = Ground" placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric" style={styles.fieldInput} />
                </View>
              </View>
            </View>

            {renderToggle('Lift available at destination', hasDropLift, setHasDropLift)}
          </View>

          {/* ── Shifting date ── */}
          <Text style={styles.label}>Shifting date & time *</Text>
          <TouchableOpacity style={styles.dateCard}
            onPress={() => { if (Platform.OS === 'android') openAndroidPicker(); }} activeOpacity={0.9}>
            <Text style={styles.dateLabel}>SHIFTING DATE</Text>
            <View style={styles.dateContent}>
              <View style={styles.dateIconWrap}><Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateMainText}>{moveDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                <Text style={styles.dateSubText}>{moveDate.toLocaleDateString('en-US', { weekday: 'short' })} • {moveDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.dateEditBadge}><Ionicons name="create-outline" size={wp('3.5%')} color={TEAL} /></View>
            </View>
          </TouchableOpacity>

          {/* ── Expected delivery date ── */}
          <TouchableOpacity style={[styles.dateCard, { marginTop: hp('1%') }]}
            onPress={() => { if (Platform.OS === 'android') openAndroidDeliveryPicker(); else setShowDeliveryPicker(true); }} activeOpacity={0.9}>
            <Text style={styles.dateLabel}>EXPECTED DELIVERY DATE <Text style={{ color: TEXT_MUTED, fontWeight: '400' }}>(optional)</Text></Text>
            <View style={styles.dateContent}>
              <View style={[styles.dateIconWrap, { backgroundColor: 'rgba(99,102,241,0.08)' }]}>
                <Ionicons name="time-outline" size={wp('4%')} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                {deliveryDate ? (
                  <>
                    <Text style={styles.dateMainText}>{deliveryDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    <Text style={styles.dateSubText}>{deliveryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </>
                ) : (
                  <Text style={[styles.dateMainText, { color: TEXT_MUTED, fontWeight: '500' }]}>Tap to set expected delivery</Text>
                )}
              </View>
              {deliveryDate ? (
                <TouchableOpacity onPress={() => setDeliveryDate(null)}>
                  <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.dateEditBadge, { backgroundColor: 'rgba(99,102,241,0.08)' }]}>
                  <Ionicons name="add" size={wp('4%')} color="#6366F1" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          {showDeliveryPicker && Platform.OS === 'ios' && (
            <DateTimePicker value={deliveryDate || new Date()} mode="datetime" display="spinner" minimumDate={moveDate}
              onChange={(e, d) => { setShowDeliveryPicker(false); if (d) setDeliveryDate(d); }} />
          )}

          {/* ── Preferred delivery time slot ── */}
          {deliveryDate && (
            <>
              <Text style={[styles.label, { marginTop: hp('1.5%') }]}>Preferred delivery time</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'MORNING', label: 'Morning', sub: '8am–12pm' },
                  { id: 'AFTERNOON', label: 'Afternoon', sub: '12pm–4pm' },
                  { id: 'EVENING', label: 'Evening', sub: '4pm–8pm' },
                  { id: 'ANYTIME', label: 'Anytime', sub: '' },
                ].map((slot) => {
                  const active = deliveryTimeSlot === slot.id;
                  return (
                    <TouchableOpacity key={slot.id} onPress={() => setDeliveryTimeSlot(slot.id)}
                      style={[styles.chip, active && styles.chipActive]} activeOpacity={0.85}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{slot.label}</Text>
                      {slot.sub ? <Text style={styles.chipSub}>{slot.sub}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Items & Inventory ── */}
          <View style={[styles.sectionCard, { marginTop: hp('1.5%') }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="layers-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Items & inventory <Text style={styles.optionalTag}>(optional)</Text></Text>
            </View>

            <Text style={styles.fieldLabel}>Select items to shift</Text>
            <View style={styles.chipWrap}>
              {SHIFTING_ITEMS.map((item) => {
                const selected = selectedItems.includes(item);
                return (
                  <TouchableOpacity key={item} onPress={() => toggleItem(item)}
                    style={[styles.chip, selected && styles.chipActive]} activeOpacity={0.85}>
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: hp('1.2%') }]}>Approximate weight / volume</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'LIGHT', label: 'Light', sub: '< 500 kg' },
                { id: 'MEDIUM', label: 'Medium', sub: '500–1500 kg' },
                { id: 'HEAVY', label: 'Heavy', sub: '1500–3000 kg' },
                { id: 'VERY_HEAVY', label: 'Very Heavy', sub: '> 3000 kg' },
              ].map((w) => {
                const active = weightVolume === w.id;
                return (
                  <TouchableOpacity key={w.id} onPress={() => setWeightVolume(active ? null : w.id)}
                    style={[styles.chip, active && styles.chipActive]} activeOpacity={0.85}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{w.label}</Text>
                    <Text style={styles.chipSub}>{w.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {renderToggle('Has heavy items (piano, safe, large appliances)', hasHeavyItems, setHasHeavyItems)}
            {hasHeavyItems && (
              <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
                <TextInput value={heavyItemsDesc} onChangeText={setHeavyItemsDesc}
                  placeholder="Describe the heavy items" placeholderTextColor={TEXT_MUTED}
                  style={[styles.fieldInput, { flex: 1 }]} multiline />
              </View>
            )}

            {renderToggle('Has fragile items (glassware, artwork, electronics)', hasFragileItems, setHasFragileItems)}
            {hasFragileItems && (
              <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
                <TextInput value={inventoryDetails} onChangeText={setInventoryDetails}
                  placeholder="e.g. 10-30 boxes, 1-2 bags, TV / glassware" placeholderTextColor={TEXT_MUTED}
                  style={[styles.fieldInput, { flex: 1 }]} multiline />
              </View>
            )}
          </View>

          {/* ── Services ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="construct-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Services needed</Text>
            </View>
            {renderToggle('Packing service', needPacking, setNeedPacking)}
            {renderToggle('Loading help', needLoading, setNeedLoading)}
            {renderToggle('Unloading help', needUnloading, setNeedUnloading)}
            {(needLoading || needUnloading) && (
              <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
                <Ionicons name="person-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
                <TextInput value={labourCount} onChangeText={setLabourCount}
                  placeholder="Number of labour workers (optional)" placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric" style={styles.fieldInput} />
              </View>
            )}
          </View>

          {/* ── Truck & load preferences ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="cube-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Truck preference</Text>
            </View>
            <View style={styles.twoTabBar}>
              {[
                { id: 'DEDICATED', label: 'Dedicated', desc: 'Full truck for you', icon: 'lock-closed-outline' },
                { id: 'SHARED', label: 'Shared', desc: 'Part of shared load', icon: 'people-outline' },
              ].map((v) => {
                const active = vehicleTypeShared === v.id;
                return (
                  <TouchableOpacity key={v.id} onPress={() => setVehicleTypeShared(v.id)}
                    style={[styles.twoTab, active && styles.twoTabActive]} activeOpacity={0.85}>
                    <Ionicons name={v.icon} size={wp('4%')} color={active ? TEAL : TEXT_MUTED} />
                    <Text style={[styles.twoTabLabel, active && styles.twoTabLabelActive]}>{v.label}</Text>
                    <Text style={styles.twoTabDesc}>{v.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {renderToggle('Part-load acceptable (share truck space)', partLoadAccepted, setPartLoadAccepted)}
          </View>

          {/* ── Insurance & POD ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="shield-checkmark-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Insurance & delivery</Text>
            </View>
            {renderToggle('Transit insurance for goods', needInsurance, setNeedInsurance)}
            {needInsurance && (
              <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
                <Ionicons name="cash-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
                <TextInput value={insuranceValue} onChangeText={setInsuranceValue}
                  placeholder="Estimated goods value (₹)" placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric" style={styles.fieldInput} />
              </View>
            )}
            {renderToggle('Proof of delivery (POD) required', requiresPOD, setRequiresPOD)}
          </View>

          {/* ── Receiver details ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="person-add-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Receiver at destination <Text style={styles.optionalTag}>(optional)</Text></Text>
            </View>
            <View style={styles.textFieldRow}>
              <Ionicons name="person-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={receiverName} onChangeText={setReceiverName}
                placeholder="Receiver full name" placeholderTextColor={TEXT_MUTED} style={styles.fieldInput} />
            </View>
            <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
              <Ionicons name="call-outline" size={wp('3.8%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={receiverPhone} onChangeText={setReceiverPhone}
                placeholder="Receiver phone number" placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad" maxLength={10} style={styles.fieldInput} />
            </View>
          </View>

          {/* ── Multiple stops ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="git-branch-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Additional stops</Text>
            </View>
            {renderToggle('Truck needs to stop at multiple locations', hasMultipleStops, setHasMultipleStops)}
            {hasMultipleStops && (
              <View style={[styles.textFieldRow, { marginTop: hp('0.8%') }]}>
                <TextInput value={multipleStopsDetails} onChangeText={setMultipleStopsDetails}
                  placeholder="Describe stops (e.g. Stop 1: MG Road; Stop 2: Sector 5...)" placeholderTextColor={TEXT_MUTED}
                  style={[styles.fieldInput, { flex: 1 }]} multiline />
              </View>
            )}
          </View>

          {/* ── Other details ── */}
          <Text style={[styles.label, { marginTop: hp('1.5%') }]}>Additional notes</Text>
          <View style={styles.textAreaWrap}>
            <View style={styles.textAreaIconRow}>
              <Ionicons name="create-outline" size={wp('3.8%')} color={TEAL} />
              <Text style={styles.textAreaHint}>Special requirements</Text>
            </View>
            <TextInput style={styles.textArea} value={otherDetails} onChangeText={setOtherDetails}
              placeholder="Example: 3rd floor no lift, 2 cupboards, 1 TV, needs packing." placeholderTextColor={TEXT_MUTED} multiline />
          </View>

          {isB2BCustomer && (
            <View style={styles.b2bWarn}>
              <Ionicons name="alert-circle" size={wp('5%')} color="#EA580C" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.b2bWarnTitle}>Advance Payment Required</Text>
                <Text style={styles.b2bWarnBody}>Packers & Movers is not covered under your B2B agreement. Advance payment will be required before confirmation.</Text>
              </View>
            </View>
          )}

          {/* Phase 7 — Personal/Company toggle (renders only for TA customers) */}
          <TravelAgentBookingToggle value={taState} onChange={setTaState} />

          <TouchableOpacity style={[styles.submitBtnWrap, isSubmitting && { opacity: 0.4 }]}
            onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}>
            <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : (
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
            <View style={styles.faqIconCircle}><Ionicons name="help-circle-outline" size={wp('5%')} color={TEAL} /></View>
            <Text style={styles.faqTitle}>FAQs about Packers & Movers</Text>
          </View>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqHead} onPress={() => toggleFAQ(idx)} activeOpacity={0.8}>
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <View style={styles.faqChevronWrap}>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={wp('3.5%')} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Phone modal */}
      <Modal visible={isPhoneModal} transparent animationType="fade" onRequestClose={() => setIsPhoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}><Ionicons name="call-outline" size={wp('7%')} color={TEAL} /></View>
            <Text style={styles.modalTitle}>Phone required</Text>
            <Text style={styles.modalBody}>Add your phone number once and book faster next time.</Text>
            <TouchableOpacity style={styles.modalBtnWrap} onPress={() => { setIsPhoneModal(false); navigation.navigate('EditProfileScreen'); }} activeOpacity={0.85}>
              <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPhoneModal(false)} style={{ marginTop: hp('1.5%') }}>
              <Text style={{ color: TEXT_MUTED, fontSize: wp('3.5%') }}>Maybe later</Text>
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

  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2.5%'), paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'), borderBottomRightRadius: wp('6%'), overflow: 'hidden',
  },
  decoCircle1: { position: 'absolute', width: wp('40%'), height: wp('40%'), borderRadius: wp('20%'), backgroundColor: 'rgba(255,255,255,0.04)', top: -wp('15%'), right: -wp('10%') },
  decoCircle2: { position: 'absolute', width: wp('25%'), height: wp('25%'), borderRadius: wp('12.5%'), backgroundColor: 'rgba(255,255,255,0.03)', bottom: -wp('8%'), left: -wp('5%') },
  decoCircle3: { position: 'absolute', width: wp('15%'), height: wp('15%'), borderRadius: wp('7.5%'), backgroundColor: 'rgba(255,255,255,0.05)', top: hp('2%'), left: wp('30%') },
  headerRow: { zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: wp('4.6%'), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  myBookingsBtn: { width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  formCard: { backgroundColor: CARD, marginHorizontal: wp('3.5%'), borderRadius: wp('5.5%'), paddingVertical: hp('1.5%'), paddingHorizontal: wp('4%'), marginTop: hp('-0.5%'), ...SHADOW_MD },
  formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('1.5%') },
  formTitle: { fontSize: wp('4.8%'), fontWeight: '700', color: TEXT_PRIMARY },
  formDesc: { fontSize: wp('3.1%'), color: TEXT_MUTED, marginTop: hp('0.3%') },

  label: { fontSize: wp('3.8%'), fontWeight: '700', color: TEXT_PRIMARY, marginBottom: hp('0.8%') },

  // Shifting type tabs
  tripTypeBar: { flexDirection: 'row', backgroundColor: BG, borderRadius: wp('4%'), overflow: 'hidden', marginBottom: hp('1.8%'), padding: wp('1%'), gap: wp('1%') },
  tripTypeTab: { flex: 1, paddingVertical: hp('1.2%'), paddingHorizontal: wp('2%'), minHeight: hp('9%'), justifyContent: 'center', alignItems: 'center', borderRadius: wp('3.5%') },
  tripTypeTabActive: { backgroundColor: CARD, borderWidth: 1.5, borderColor: TEAL, ...SHADOW_SM },
  tripTypeIconCircle: { width: wp('7%'), height: wp('7%'), borderRadius: wp('3.5%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: hp('0.5%') },
  tripTypeIconCircleActive: { backgroundColor: TEAL },
  tripTypeTitle: { fontSize: wp('3.5%'), fontWeight: '600', color: TEXT_SECONDARY, textAlign: 'center' },
  tripTypeTitleActive: { color: TEAL_DEEP, fontWeight: '700' },
  tripTypeSub: { fontSize: wp('2.6%'), color: TEXT_MUTED, marginTop: hp('0.2%'), textAlign: 'center' },
  tripTypeSubActive: { color: TEAL_MID },

  // Shifting scope
  scopeBar: { flexDirection: 'row', backgroundColor: BG, borderRadius: wp('4%'), padding: wp('1%'), gap: wp('1%'), marginBottom: hp('1.8%') },
  scopeTab: { flex: 1, paddingVertical: hp('1%'), alignItems: 'center', borderRadius: wp('3%'), borderWidth: 1.5, borderColor: 'transparent' },
  scopeTabActive: { backgroundColor: CARD, borderColor: TEAL, ...SHADOW_SM },
  scopeLabel: { fontSize: wp('3.2%'), fontWeight: '600', color: TEXT_SECONDARY, marginTop: hp('0.3%') },
  scopeLabelActive: { color: TEAL_DEEP, fontWeight: '700' },
  scopeSub: { fontSize: wp('2.5%'), color: TEXT_MUTED, textAlign: 'center' },

  // Subtype chips
  subtypeScroll: { marginTop: hp('1%'), marginBottom: hp('2%'), paddingBottom: hp('0.5%') },
  subtypeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: wp('8%'), borderWidth: 1.5, borderColor: BG, paddingHorizontal: wp('3.5%'), paddingVertical: hp('1%'), gap: wp('2%'), ...SHADOW_SM },
  subtypeChipActive: { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: TEAL },
  subtypeIconWrap: { width: wp('7%'), height: wp('7%'), borderRadius: wp('3.5%'), backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  subtypeIconWrapActive: { backgroundColor: TEAL },
  subtypeText: { fontSize: wp('3.2%'), color: TEXT_SECONDARY },
  subtypeTextActive: { fontWeight: '700', color: TEAL_DEEP },
  subtypeTick: { width: wp('4.5%'), height: wp('4.5%'), borderRadius: wp('2.25%'), backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center' },

  // Section cards
  sectionCard: { backgroundColor: BG, borderRadius: wp('4%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)', padding: wp('3.5%'), marginBottom: hp('1.5%') },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: wp('2.5%'), marginBottom: hp('1.2%') },
  sectionIconCircle: { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: wp('3.8%'), fontWeight: '700', color: TEXT_PRIMARY, flex: 1 },
  optionalTag: { fontSize: wp('3%'), fontWeight: '400', color: TEXT_MUTED },

  // Field labels & inputs
  fieldLabel: { fontSize: wp('3.2%'), color: TEXT_SECONDARY, fontWeight: '500', marginBottom: hp('0.5%') },
  textFieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)', paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%'), ...SHADOW_SM },
  fieldInput: { flex: 1, fontSize: wp('3.5%'), color: TEXT_PRIMARY, paddingVertical: hp('0.4%') },
  twoColRow: { flexDirection: 'row', marginTop: hp('1.2%') },
  twoColCell: { flex: 1 },

  // Location row
  locationBlock: { backgroundColor: BG, borderRadius: wp('4%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)', padding: wp('3%'), marginBottom: hp('1.5%') },
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)', paddingHorizontal: wp('3%'), minHeight: hp('6.5%'), gap: wp('2%'), ...SHADOW_SM },
  locationIconCircle: { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center' },
  locationInput: { flex: 1, fontSize: wp('3.6%'), color: TEXT_PRIMARY, paddingVertical: hp('0.8%') },
  connectorLine: { alignItems: 'center', paddingVertical: hp('0.5%'), gap: hp('0.3%') },
  connectorDot: { width: wp('1%'), height: wp('1%'), borderRadius: wp('0.5%'), backgroundColor: TEAL, opacity: 0.3 },

  suggestionBox: { position: 'absolute', top: hp('7%'), left: 0, right: 0, backgroundColor: CARD, borderRadius: wp('3.5%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)', zIndex: 99, ...SHADOW_MD },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('3%'), paddingVertical: hp('1.2%'), borderBottomWidth: 0.5, borderColor: BG },
  suggestionText: { color: TEXT_PRIMARY, fontSize: wp('3.4%') },
  noResult: { padding: wp('3%'), textAlign: 'center', color: TEXT_MUTED, fontSize: wp('3.2%') },

  // Date
  dateCard: { backgroundColor: CARD, borderRadius: wp('3.5%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)', paddingHorizontal: wp('3%'), paddingVertical: hp('1%'), ...SHADOW_SM, marginBottom: hp('0.5%') },
  dateLabel: { fontSize: wp('2.8%'), fontWeight: '700', color: TEAL, textTransform: 'uppercase', marginBottom: hp('0.6%'), letterSpacing: 0.6 },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: wp('2%') },
  dateIconWrap: { width: wp('8%'), height: wp('8%'), borderRadius: wp('2.5%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center' },
  dateMainText: { fontSize: wp('3.6%'), fontWeight: '700', color: TEXT_PRIMARY },
  dateSubText: { fontSize: wp('2.8%'), color: TEXT_SECONDARY, marginTop: hp('0.1%') },
  dateEditBadge: { width: wp('7%'), height: wp('7%'), borderRadius: wp('3.5%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center' },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp('2%'), marginBottom: hp('0.5%') },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: wp('2%'), marginBottom: hp('0.8%') },
  chip: { paddingHorizontal: wp('3.5%'), paddingVertical: hp('0.8%'), borderRadius: wp('6%'), borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.15)', backgroundColor: CARD, alignItems: 'center', ...SHADOW_SM },
  chipActive: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: TEAL },
  chipText: { fontSize: wp('3.2%'), color: TEXT_SECONDARY, fontWeight: '500' },
  chipTextActive: { color: TEAL_DEEP, fontWeight: '700' },
  chipSub: { fontSize: wp('2.5%'), color: TEXT_MUTED, marginTop: hp('0.1%') },

  // Toggle rows
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: hp('0.9%'), borderBottomWidth: 0.5, borderBottomColor: 'rgba(16,185,129,0.08)' },
  toggleLabel: { fontSize: wp('3.4%'), color: TEXT_PRIMARY, flex: 1 },
  toggleTrack: { width: wp('11%'), height: wp('6%'), borderRadius: wp('3%'), backgroundColor: '#D1D5DB', justifyContent: 'center', paddingHorizontal: wp('0.8%') },
  toggleTrackOn: { backgroundColor: TEAL },
  toggleThumb: { width: wp('4.5%'), height: wp('4.5%'), borderRadius: wp('2.25%'), backgroundColor: '#FFFFFF', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Two-tab bar (SHARED/DEDICATED)
  twoTabBar: { flexDirection: 'row', gap: wp('2%'), marginBottom: hp('0.5%') },
  twoTab: { flex: 1, alignItems: 'center', paddingVertical: hp('1.2%'), borderRadius: wp('3%'), borderWidth: 1.5, borderColor: BG, backgroundColor: CARD, gap: hp('0.3%') },
  twoTabActive: { borderColor: TEAL, backgroundColor: 'rgba(16,185,129,0.05)' },
  twoTabLabel: { fontSize: wp('3.5%'), fontWeight: '600', color: TEXT_SECONDARY },
  twoTabLabelActive: { color: TEAL_DEEP },
  twoTabDesc: { fontSize: wp('2.6%'), color: TEXT_MUTED },

  // Text area
  textAreaWrap: { backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)', overflow: 'hidden', ...SHADOW_SM },
  textAreaIconRow: { flexDirection: 'row', alignItems: 'center', gap: wp('2%'), paddingHorizontal: wp('3%'), paddingTop: hp('1%') },
  textAreaHint: { fontSize: wp('2.8%'), color: TEAL, fontWeight: '600' },
  textArea: { minHeight: hp('10%'), paddingHorizontal: wp('3%'), paddingTop: hp('0.5%'), paddingBottom: hp('1%'), textAlignVertical: 'top', fontSize: wp('3.2%'), color: TEXT_PRIMARY },

  // B2B warning
  b2bWarn: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: wp('3%'), padding: wp('3.5%'), flexDirection: 'row', alignItems: 'flex-start', gap: wp('2.5%'), marginBottom: hp('1.5%'), marginTop: hp('1.5%') },
  b2bWarnTitle: { fontSize: wp('3.3%'), fontWeight: '700', color: '#9A3412', marginBottom: 3 },
  b2bWarnBody: { fontSize: wp('2.9%'), color: '#C2410C', lineHeight: wp('4.2%') },

  // Submit
  submitBtnWrap: { marginTop: hp('2%') },
  submitBtn: { borderRadius: wp('8%'), paddingVertical: hp('1.6%'), alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  submitText: { color: '#FFFFFF', fontSize: wp('3.8%'), fontWeight: '700', letterSpacing: 0.3 },

  // FAQ
  faqSec: { backgroundColor: TEAL_DEEP, marginHorizontal: wp('3.5%'), marginTop: hp('2%'), padding: wp('4%'), borderRadius: wp('5%') },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp('1.5%'), gap: wp('2.5%') },
  faqIconCircle: { width: wp('9%'), height: wp('9%'), borderRadius: wp('4.5%'), backgroundColor: 'rgba(16,185,129,0.15)', justifyContent: 'center', alignItems: 'center' },
  faqTitle: { fontSize: wp('4.5%'), fontWeight: '700', color: '#FFFFFF' },
  faqItem: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: wp('3%'), paddingHorizontal: wp('3.5%'), paddingVertical: hp('1.4%'), marginBottom: hp('1%') },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { color: '#FFFFFF', fontSize: wp('3.5%'), flex: 1, marginRight: wp('3%'), fontWeight: '500' },
  faqChevronWrap: { width: wp('5.5%'), height: wp('5.5%'), borderRadius: wp('2.75%'), backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  faqA: { color: TEAL_LIGHT, fontSize: wp('3.2%'), marginTop: hp('0.8%'), lineHeight: hp('2.5%'), paddingLeft: wp('1%') },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,78,59,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: wp('78%'), backgroundColor: CARD, borderRadius: wp('5%'), paddingVertical: hp('3%'), paddingHorizontal: wp('5%'), alignItems: 'center', ...SHADOW_MD },
  modalIconCircle: { width: wp('15%'), height: wp('15%'), borderRadius: wp('7.5%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: hp('1.5%') },
  modalTitle: { fontSize: wp('4.2%'), fontWeight: '700', color: TEXT_PRIMARY, marginBottom: hp('0.8%') },
  modalBody: { textAlign: 'center', color: TEXT_SECONDARY, fontSize: wp('3.2%'), marginBottom: hp('2%'), lineHeight: hp('2.5%') },
  modalBtnWrap: { width: '100%' },
  modalBtn: { borderRadius: wp('8%'), paddingVertical: hp('1.4%'), alignItems: 'center' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: wp('3.6%') },
});
