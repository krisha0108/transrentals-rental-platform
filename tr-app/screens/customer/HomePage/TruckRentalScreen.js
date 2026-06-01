import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Modal, Platform, Dimensions, Animated, ActivityIndicator, Pressable, StatusBar,
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
import { getMinBookingDate, isPickupTooSoon } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer } from '../../../utils/isTravelAgent';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

const truckBodyTypesList = [
  { name: 'Open',         id: 'OPEN',         icon: 'apps-outline' },
  { name: 'Closed Body',  id: 'CLOSED_BODY',  icon: 'cube-outline' },
  { name: 'Container',    id: 'CONTAINER',    icon: 'archive-outline' },
  { name: 'Trailer',      id: 'TRAILER',      icon: 'car-outline' },
  { name: 'LCV',          id: 'LCV',          icon: 'bus-outline' },
  { name: 'Refrigerated', id: 'REFRIGERATED', icon: 'snow-outline' },
  { name: 'Flatbed',      id: 'FLATBED',      icon: 'remove-outline' },
  { name: 'Other',        id: 'OTHER',        icon: 'ellipsis-horizontal-outline' },
];

const truckTypesList = [
  { name: 'Tata Ace (Mini / 0.75 MT)', id: 1 },
  { name: 'Tata 407 (2.5 MT / 4 Wheels)', id: 2 },
  { name: 'Canter 3MT / 4 Wheel', id: 3 },
  { name: 'Canter 17ft / 4 Wheel', id: 4 },
  { name: 'Canter 19ft / 6 Wheel', id: 5 },
  { name: 'Canter Close Body 20ft', id: 6 },
  { name: 'Canter Close Body 24ft', id: 7 },
  { name: 'Canter Jumbo', id: 8 },
  { name: 'LCV (Light Commercial Vehicle)', id: 9 },
  { name: 'Truck 9MT / 6 Wheel', id: 10 },
  { name: 'Truck 16MT / 10 Wheel', id: 11 },
  { name: 'Truck 20MT / 12 Wheel', id: 12 },
  { name: 'Truck 25MT / 14 Wheel', id: 13 },
  { name: 'Semi Low Bed Trailer', id: 14 },
];

const goodsTypesList = [
  'Household goods', 'Building materials', 'Furniture & Wood products',
  'Electronics / Consumer durable', 'Medicines', 'Fruits & Vegetables',
  'Iron / Steel material', 'Cement', 'Chemical', 'Fertilizer',
  'Packed foods', 'Machineries', 'Industrial Equipments',
  'Granites / Marbles', 'Liquid / Oil drums', 'Textiles',
  'Vehicles / Automobiles', 'Scrap', 'Agriculture products', 'Others',
];

const faqs = [
  { question: 'What types of trucks can I hire from TransRentals?', answer: 'We offer mini trucks, pickup trucks, trailers, heavy-duty trucks, and specialized vehicles for all your transportation needs.' },
  { question: 'Can I hire a truck with a driver?', answer: 'Yes, we provide professional and licensed truck drivers for those who need assistance with driving the truck.' },
  { question: 'How can I book a truck online?', answer: 'Simply fill out the booking form with your requirements - pickup location, destination, truck type, goods details, and we will connect you with the best vendors.' },
  { question: 'What is the minimum booking duration?', answer: 'You can book trucks for both short-term (few hours) and long-term requirements with flexible rental options.' },
];

export default function TruckRentalScreen() {
  const navigation = useNavigation();

  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const [customerData, setCustomerData] = useState(null);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  // Phase 7 — Travel Agent Personal/Company booking mode
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [serviceType, setServiceType] = useState('personal');
  const [destination, setDestination] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const [selectedBodyType, setSelectedBodyType] = useState(null);

  const [tripDirection, setTripDirection] = useState('ONE_WAY');

  // Pickup details
  const [pickupFullAddress, setPickupFullAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');

  // Destination details
  const [dropFullAddress, setDropFullAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');

  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [selectedTruckType, setSelectedTruckType] = useState(null);
  const [selectedTruckTypeId, setSelectedTruckTypeId] = useState(null);

  const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
  const [selectedGoodsType, setSelectedGoodsType] = useState(null);

  // What items to transport
  const [itemsDescription, setItemsDescription] = useState('');

  // Multiple stops
  const [hasMultipleStops, setHasMultipleStops] = useState(false);
  const [multipleStopsDetails, setMultipleStopsDetails] = useState('');

  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '' });

  const [startDate, setStartDate] = useState(new Date());
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP);
    }, [])
  );

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const c = JSON.parse(data);
        setCustomerData(c);
        if (c.isB2B === true && c.b2bStatus === 'APPROVED') setIsB2BCustomer(true);
      }
    })();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getTruckLocations();
      if (response.success && response.locations) setAllLocations(response.locations);
    } catch (err) { console.log('location error', err?.response?.data || err); }
  };

  const textSafe = (t) => (t || '').trim().toLowerCase();
  const filteredLocations = (query || '').trim().length
    ? allLocations.filter((l) => typeof l.name === 'string' && l.name.toLowerCase().includes(textSafe(query)))
    : allLocations.slice(0, 35);
  const filteredDestinations = (destinationQuery || '').trim().length
    ? allLocations.filter((l) => typeof l.name === 'string' && l.name.toLowerCase().includes(textSafe(destinationQuery)))
    : allLocations.slice(0, 35);

  const handleInputChange = (text) => { setQuery(text); setPickupLocation(text); setPickupLocationId(null); setShowSuggestions(true); };
  const handleLocationSelect = (loc) => { setPickupLocation(loc.name); setPickupLocationId(loc.id); setQuery(''); setShowSuggestions(false); };
  const handleDestinationInputChange = (text) => { setDestinationQuery(text); setDestination(text); setShowDestinationSuggestions(text.length > 0); };
  const handleDestinationSelect = (loc) => { setDestination(loc.name); setDestinationQuery(''); setShowDestinationSuggestions(false); };
  const handleDestinationBlur = () => { setTimeout(() => { setShowDestinationSuggestions(false); setDestinationQuery(''); }, 200); };

  const toggleFAQ = (i) => setExpandedIndex((prev) => (prev === i ? null : i));

  const openAndroidPicker = () => { setAndroidPickerMode('date'); setAndroidPickerVisible(true); };
  const onAndroidChange = (event, selected) => {
    if (event.type === 'dismissed') { setAndroidPickerVisible(false); return; }
    if (!selected) { setAndroidPickerVisible(false); return; }
    if (androidPickerMode === 'date') {
      const merged = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), startDate.getHours(), startDate.getMinutes());
      setStartDate(merged); setAndroidPickerMode('time'); setAndroidPickerVisible(true); return;
    }
    if (androidPickerMode === 'time') {
      const upd = new Date(startDate); upd.setHours(selected.getHours()); upd.setMinutes(selected.getMinutes());
      if (isPickupTooSoon(upd)) { setShowBookingAlert(true); setAndroidPickerVisible(false); return; }
      setStartDate(upd); setAndroidPickerVisible(false);
    }
  };
  const onStartDateChangeIOS = (event, selectedDate) => {
    if (!selectedDate) return;
    if (isPickupTooSoon(selectedDate)) { setShowBookingAlert(true); return; }
    setStartDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!pickupLocation) { alert('Please select pickup location'); return; }
    if (!destination) { alert('Please enter destination'); return; }
    if (!selectedTruckTypeId) { alert('Please select truck type'); return; }
    if (!selectedGoodsType) { alert('Please select goods type'); return; }
    if (isPickupTooSoon(startDate)) { setShowBookingAlert(true); return; }
    if (customerData && !customerData.phone) { setIsPhoneModal(true); return; }

    setIsSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      let finalLocationId = pickupLocationId;
      if (!finalLocationId && pickupLocation) {
        const match = allLocations.find((l) => l.name?.toLowerCase() === pickupLocation?.toLowerCase());
        if (match) finalLocationId = match.id;
      }

      const requirementsLines = [
        itemsDescription.trim() ? `Items: ${itemsDescription.trim()}` : null,
        hasMultipleStops && multipleStopsDetails.trim() ? `Multiple stops: ${multipleStopsDetails.trim()}` : null,
        otherDetails.trim() || null,
      ].filter(Boolean).join('\n');

      const payload = {
        customerId: customerId || null,
        customerName: customerData?.name || 'Customer',
        customerEmail: customerData?.email || 'book@transrentals.in',
        customerPhone: customerData?.phone || '',
        serviceType: serviceType === 'personal' ? 'personal' : 'commercial',
        vehicleCategory: selectedTruckType,
        vehicleCategoryName: selectedTruckType,
        truckBodyType: selectedBodyType || null,
        tripDirection,
        pickupCity: pickupLocation,
        pickupAddress: pickupFullAddress.trim() || pickupLocation,
        pickupPincode: pickupPincode.trim() || null,
        dropCity: destination,
        dropAddress: dropFullAddress.trim() || destination,
        dropPincode: dropPincode.trim() || null,
        pickupDate: startDate.toISOString(),
        pickupTime: startDate.toTimeString().slice(0, 5),
        goodsType: selectedGoodsType,
        hasMultipleStops,
        multipleStopsDetails: hasMultipleStops ? (multipleStopsDetails.trim() || null) : null,
        requirements: requirementsLines || null,
        locationId: finalLocationId || null,
        source: 'app',
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

      const response = await bookingService.createTruckQuoteRequest(payload);
      if (response.success || response.quoteRequest) {
        setAlertModal({
          visible: true, type: 'success',
          title: 'Request Submitted!',
          message: 'Your truck booking request has been submitted. Vendors will send quotes within 24-48 hours.',
          onClose: () => navigation.navigate('MyTruckBookings'),
        });
      } else {
        setAlertModal({ visible: true, type: 'error', title: 'Error', message: 'Request could not be submitted. Please try again.' });
      }
    } catch (err) {
      console.log('truck booking err', err?.response?.data || err?.message || err);
      setAlertModal({ visible: true, type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to submit booking. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <View style={styles.decorCircle1} /><View style={styles.decorCircle2} /><View style={styles.decorCircle3} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Truck Rental</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyTruckBookings')} style={styles.myBookingsBtn}>
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Book Your Truck</Text>
              <Text style={styles.formDesc}>Fill details once, get multiple quotes from vendors.</Text>
            </View>
            <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.securePill}>
              <Ionicons name="shield-checkmark" size={wp('3.2%')} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </LinearGradient>
          </View>

          {/* ── Service Type ── */}
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.serviceTypeBar}>
            <TouchableOpacity onPress={() => setServiceType('personal')} activeOpacity={0.9}
              style={[styles.serviceTypeTab, serviceType === 'personal' && styles.serviceTypeTabActive]}>
              <View style={[styles.serviceTypeIconCircle, serviceType === 'personal' && styles.serviceTypeIconCircleActive]}>
                <Ionicons name="person-outline" size={wp('3.8%')} color={serviceType === 'personal' ? '#FFFFFF' : TEXT_SECONDARY} />
              </View>
              <Text style={[styles.serviceTypeTitle, serviceType === 'personal' && styles.serviceTypeTitleActive]}>Personal Use</Text>
              <Text style={styles.serviceTypeSub}>Household, Moving etc.</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setServiceType('commercial')} activeOpacity={0.9}
              style={[styles.serviceTypeTab, serviceType === 'commercial' && styles.serviceTypeTabActive]}>
              <View style={[styles.serviceTypeIconCircle, serviceType === 'commercial' && styles.serviceTypeIconCircleActive]}>
                <Ionicons name="business-outline" size={wp('3.8%')} color={serviceType === 'commercial' ? '#FFFFFF' : TEXT_SECONDARY} />
              </View>
              <Text style={[styles.serviceTypeTitle, serviceType === 'commercial' && styles.serviceTypeTitleActive]}>Commercial Use</Text>
              <Text style={styles.serviceTypeSub}>Business, Goods etc.</Text>
            </TouchableOpacity>
          </View>

          {/* ── Truck body type ── */}
          <Text style={styles.label}>Truck Body Type <Text style={styles.optLabel}>(optional)</Text></Text>
          <View style={styles.bodyTypeGrid}>
            {truckBodyTypesList.map((bt) => {
              const active = selectedBodyType === bt.id;
              return (
                <TouchableOpacity key={bt.id} onPress={() => setSelectedBodyType(active ? null : bt.id)}
                  style={[styles.bodyTypeChip, active && styles.bodyTypeChipActive]} activeOpacity={0.85}>
                  <Ionicons name={bt.icon} size={wp('4%')} color={active ? TEAL : TEXT_MUTED} />
                  <Text style={[styles.bodyTypeText, active && styles.bodyTypeTextActive]}>{bt.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Pickup Section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="location-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Pickup Details</Text>
            </View>

            <Text style={styles.fieldLabel}>City / Area *</Text>
            <View style={[styles.locationBlock, { marginBottom: hp('1.2%') }]}>
              <View style={styles.locationLabelRow}>
                <View style={styles.tealIconCircle}><Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} /></View>
                <Text style={styles.smallLabel}>Pickup Location</Text>
              </View>
              <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
                <TextInput value={query.length ? query : pickupLocation} onChangeText={handleInputChange}
                  placeholder="Enter pickup city" placeholderTextColor={TEXT_MUTED} style={styles.locationInput} />
                {pickupLocation ? (
                  <TouchableOpacity onPress={() => { setPickupLocation(''); setPickupLocationId(null); setQuery(''); }}>
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
              {showSuggestions && (
                <>
                  <Pressable style={styles.overlay} onPress={() => setShowSuggestions(false)} />
                  <View style={styles.suggestionBox}>
                    <ScrollView style={styles.suggestionScrollView} nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={styles.suggestionScrollContent}>
                      {filteredLocations.length ? filteredLocations.map((loc) => (
                        <TouchableOpacity key={loc.id} style={styles.suggestionItem} onPress={() => handleLocationSelect(loc)}>
                          <Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                          <Text style={styles.suggestionText}>{loc.name}</Text>
                        </TouchableOpacity>
                      )) : <Text style={styles.noResult}>No location found</Text>}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.fieldLabel}>Full Address <Text style={styles.optLabel}>(optional)</Text></Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="home-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={pickupFullAddress} onChangeText={setPickupFullAddress}
                placeholder="Building, street, area, landmark" placeholderTextColor={TEXT_MUTED}
                style={styles.fieldInput} multiline />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: hp('1%') }]}>Pincode <Text style={styles.optLabel}>(optional)</Text></Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="keypad-outline" size={wp('3.5%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
              <TextInput value={pickupPincode} onChangeText={setPickupPincode} placeholder="6-digit pincode"
                placeholderTextColor={TEXT_MUTED} keyboardType="numeric" maxLength={6} style={styles.fieldInput} />
            </View>
          </View>

          {/* ── Destination Section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <Ionicons name="flag-outline" size={wp('4%')} color="#EF4444" />
              </View>
              <Text style={styles.sectionTitle}>Destination Details</Text>
            </View>

            <Text style={styles.fieldLabel}>City / Area *</Text>
            <View style={[styles.locationBlock, { marginBottom: hp('1.2%') }]}>
              <View style={styles.locationLabelRow}>
                <View style={[styles.tealIconCircle, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                  <Ionicons name="flag-outline" size={wp('3.5%')} color="#EF4444" />
                </View>
                <Text style={styles.smallLabel}>Destination</Text>
              </View>
              <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
                <TextInput value={destinationQuery.length ? destinationQuery : destination}
                  onChangeText={handleDestinationInputChange} onBlur={handleDestinationBlur}
                  placeholder="Enter destination city" placeholderTextColor={TEXT_MUTED} style={styles.locationInput} />
                {destination ? (
                  <TouchableOpacity onPress={() => { setDestination(''); setDestinationQuery(''); }}>
                    <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
              {showDestinationSuggestions && destinationQuery && (
                <>
                  <Pressable style={styles.overlay} onPress={() => { setShowDestinationSuggestions(false); setDestinationQuery(''); }} />
                  <View style={styles.suggestionBox}>
                    <ScrollView style={styles.suggestionScrollView} nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={styles.suggestionScrollContent}>
                      {filteredDestinations.length > 0 ? filteredDestinations.map((loc, index) => (
                        <TouchableOpacity key={loc.id || index} style={styles.suggestionItem} onPress={() => handleDestinationSelect(loc)}>
                          <Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                          <Text style={styles.suggestionText}>{loc.name}</Text>
                        </TouchableOpacity>
                      )) : <Text style={styles.noResult}>No location found</Text>}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.fieldLabel}>Full Address <Text style={styles.optLabel}>(optional)</Text></Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="business-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
              <TextInput value={dropFullAddress} onChangeText={setDropFullAddress}
                placeholder="Building, street, area, landmark" placeholderTextColor={TEXT_MUTED}
                style={styles.fieldInput} multiline />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: hp('1%') }]}>Pincode <Text style={styles.optLabel}>(optional)</Text></Text>
            <View style={styles.textFieldRow}>
              <Ionicons name="keypad-outline" size={wp('3.5%')} color={TEXT_MUTED} style={{ marginRight: wp('1.5%') }} />
              <TextInput value={dropPincode} onChangeText={setDropPincode} placeholder="6-digit pincode"
                placeholderTextColor={TEXT_MUTED} keyboardType="numeric" maxLength={6} style={styles.fieldInput} />
            </View>
          </View>

          {/* ── Trip direction ── */}
          <Text style={styles.label}>Trip Type</Text>
          <View style={styles.twoTabBar}>
            {[
              { id: 'ONE_WAY', label: 'One Way', icon: 'arrow-forward-outline' },
              { id: 'ROUND_TRIP', label: 'Round Trip', icon: 'refresh-outline' },
            ].map((t) => {
              const active = tripDirection === t.id;
              return (
                <TouchableOpacity key={t.id} onPress={() => setTripDirection(t.id)}
                  style={[styles.twoTab, active && styles.twoTabActive]} activeOpacity={0.85}>
                  <Ionicons name={t.icon} size={wp('4%')} color={active ? TEAL : TEXT_MUTED} />
                  <Text style={[styles.twoTabLabel, active && styles.twoTabLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Pickup date ── */}
          <Text style={styles.label}>Pickup Date & Time</Text>
          <TouchableOpacity style={styles.dateCard}
            onPress={() => { if (Platform.OS === 'android') openAndroidPicker(); else setShowStartDatePicker(true); }} activeOpacity={0.9}>
            <View style={styles.dateContent}>
              <View style={styles.dateIconWrap}><Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateMainText}>{startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                <Text style={styles.dateSubText}>{startDate.toLocaleDateString('en-US', { weekday: 'short' })} • {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={styles.dateEditBadge}><Ionicons name="pencil-outline" size={wp('3%')} color={TEAL} /></View>
            </View>
          </TouchableOpacity>
          {showStartDatePicker && Platform.OS === 'ios' && (
            <View style={styles.iosDatePickerContainer}>
              <DateTimePicker value={startDate} mode="datetime" display="spinner" onChange={onStartDateChangeIOS} minimumDate={getMinBookingDate()} />
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity style={styles.iosButton} onPress={() => setShowStartDatePicker(false)}>
                  <Text style={styles.iosButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Truck type ── */}
          <Text style={[styles.label, { marginTop: hp('1.5%') }]}>Select Truck Type *</Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity style={[styles.dropdownButton, showTruckDropdown && styles.dropdownButtonActive]}
              onPress={() => { setShowTruckDropdown(!showTruckDropdown); setShowGoodsDropdown(false); }} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.tealIconCircleSm}><Ionicons name="bus-outline" size={wp('3.5%')} color={TEAL} /></View>
                <Text style={selectedTruckType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                  {selectedTruckType || 'Select Truck Type'}
                </Text>
              </View>
              <Ionicons name={showTruckDropdown ? 'chevron-up' : 'chevron-down'} size={wp('4.5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
            {showTruckDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled persistentScrollbar contentContainerStyle={styles.dropdownScrollContent}>
                  {truckTypesList.map((type) => (
                    <TouchableOpacity key={type.id} style={[styles.dropdownItem, selectedTruckTypeId === type.id && styles.dropdownItemActive]}
                      onPress={() => { setSelectedTruckType(type.name); setSelectedTruckTypeId(type.id); setShowTruckDropdown(false); }}>
                      {selectedTruckTypeId === type.id && <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2%') }} />}
                      <Text style={[styles.dropdownItemText, selectedTruckTypeId === type.id && { color: TEAL_MID, fontWeight: '600' }]}>{type.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ── Goods type ── */}
          <Text style={[styles.label, { marginTop: hp('1.5%') }]}>Type of Goods *</Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity style={[styles.dropdownButton, showGoodsDropdown && styles.dropdownButtonActive]}
              onPress={() => { setShowGoodsDropdown(!showGoodsDropdown); setShowTruckDropdown(false); }} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.tealIconCircleSm}><Ionicons name="cube-outline" size={wp('3.5%')} color={TEAL} /></View>
                <Text style={selectedGoodsType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                  {selectedGoodsType || 'Select Goods Type'}
                </Text>
              </View>
              <Ionicons name={showGoodsDropdown ? 'chevron-up' : 'chevron-down'} size={wp('4.5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
            {showGoodsDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled persistentScrollbar contentContainerStyle={styles.dropdownScrollContent}>
                  {goodsTypesList.map((item) => (
                    <TouchableOpacity key={item} style={[styles.dropdownItem, selectedGoodsType === item && styles.dropdownItemActive]}
                      onPress={() => { setSelectedGoodsType(item); setShowGoodsDropdown(false); }}>
                      {selectedGoodsType === item && <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2%') }} />}
                      <Text style={[styles.dropdownItemText, selectedGoodsType === item && { color: TEAL_MID, fontWeight: '600' }]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ── Items to transport ── */}
          <Text style={[styles.label, { marginTop: hp('1.5%') }]}>Items to Transport <Text style={styles.optLabel}>(optional)</Text></Text>
          <View style={styles.textFieldRow}>
            <Ionicons name="list-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
            <TextInput value={itemsDescription} onChangeText={setItemsDescription}
              placeholder="E.g. 2 sofas, 1 bed, 10 boxes of clothes, refrigerator..."
              placeholderTextColor={TEXT_MUTED} style={[styles.fieldInput, { minHeight: hp('6%') }]} multiline />
          </View>

          {/* ── Multiple stops ── */}
          <View style={[styles.sectionCard, { marginTop: hp('1.5%') }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}><Ionicons name="git-branch-outline" size={wp('4%')} color={TEAL} /></View>
              <Text style={styles.sectionTitle}>Multiple Stops</Text>
            </View>
            {renderToggle('Truck needs to stop at multiple locations', hasMultipleStops, setHasMultipleStops)}
            {hasMultipleStops && (
              <View style={[styles.textFieldRow, { marginTop: hp('1%') }]}>
                <TextInput value={multipleStopsDetails} onChangeText={setMultipleStopsDetails}
                  placeholder="E.g. Stop 1: MG Road; Stop 2: Sector 5..."
                  placeholderTextColor={TEXT_MUTED} style={[styles.fieldInput, { flex: 1 }]} multiline />
              </View>
            )}
          </View>

          {/* ── Other details ── */}
          <Text style={[styles.label, { marginTop: hp('0.5%') }]}>Any Other Requirements <Text style={styles.optLabel}>(optional)</Text></Text>
          <TextInput style={styles.textArea} value={otherDetails} onChangeText={setOtherDetails}
            placeholder="Special handling, timing preferences, any other info..." placeholderTextColor={TEXT_MUTED} multiline />

          {isB2BCustomer && (
            <View style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: wp('3%'), padding: wp('3.5%'), flexDirection: 'row', alignItems: 'flex-start', gap: wp('2.5%'), marginBottom: hp('1.5%'), marginTop: hp('1.5%') }}>
              <Ionicons name="alert-circle" size={wp('5%')} color="#EA580C" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: wp('3.3%'), fontWeight: '700', color: '#9A3412', marginBottom: 3 }}>Advance Payment Required</Text>
                <Text style={{ fontSize: wp('2.9%'), color: '#C2410C', lineHeight: wp('4.2%') }}>Truck Rental is not covered under your B2B agreement. Advance payment will be required before confirmation.</Text>
              </View>
            </View>
          )}

          {/* Phase 7 — TA Personal/Company toggle (self-gated). */}
          <TravelAgentBookingToggle value={taState} onChange={setTaState} />

          <TouchableOpacity style={[styles.submitBtnWrap, isSubmitting && { opacity: 0.4 }]}
            onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}>
            <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Get Quotes from Vendors</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about Truck Rental</Text>
          {faqs.map((item, idx) => {
            const open = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqHead} onPress={() => toggleFAQ(idx)}>
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={wp('4.5%')} color="#E2E8F0" />
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={isPhoneModal} transparent animationType="fade" onRequestClose={() => setIsPhoneModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}><Ionicons name="call-outline" size={wp('7%')} color={TEAL} /></View>
            <Text style={styles.modalTitle}>Phone Number Required</Text>
            <Text style={styles.modalBody}>Please add your phone number to complete the booking process.</Text>
            <TouchableOpacity style={styles.modalBtnWrap} onPress={() => { setIsPhoneModal(false); navigation.navigate('EditProfileScreen'); }}>
              <LinearGradient colors={[TEAL_MID, TEAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Go to Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPhoneModal(false)} style={{ marginTop: hp('1.2%') }}>
              <Text style={{ color: TEXT_MUTED, fontSize: wp('3.5%') }}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {androidPickerVisible && Platform.OS === 'android' && (
        <DateTimePicker value={startDate} mode={androidPickerMode} display="default" onChange={onAndroidChange} minimumDate={getMinBookingDate()} />
      )}
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />

      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={[styles.alertIconCircle, alertModal.type === 'success' ? { backgroundColor: TEAL_LIGHT } : { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name={alertModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={wp('12%')} color={alertModal.type === 'success' ? TEAL : '#EF4444'} />
            </View>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <TouchableOpacity style={styles.alertBtn} activeOpacity={0.8}
              onPress={() => { const cb = alertModal.onClose; setAlertModal({ visible: false, type: '', title: '', message: '' }); if (cb) cb(); }}>
              <LinearGradient colors={alertModal.type === 'success' ? [TEAL, '#059669'] : ['#EF4444', '#DC2626']} style={styles.alertBtnGradient}>
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
  safe: { flex: 1, backgroundColor: BG },
  container: { backgroundColor: 'transparent' },

  headerGradient: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8, paddingBottom: hp('2.5%'), paddingHorizontal: wp('4%'), borderBottomLeftRadius: wp('6%'), borderBottomRightRadius: wp('6%'), overflow: 'hidden' },
  decorCircle1: { position: 'absolute', width: wp('35%'), height: wp('35%'), borderRadius: wp('17.5%'), backgroundColor: 'rgba(255,255,255,0.06)', top: -wp('10%'), right: -wp('8%') },
  decorCircle2: { position: 'absolute', width: wp('25%'), height: wp('25%'), borderRadius: wp('12.5%'), backgroundColor: 'rgba(255,255,255,0.04)', bottom: -wp('5%'), left: -wp('5%') },
  decorCircle3: { position: 'absolute', width: wp('15%'), height: wp('15%'), borderRadius: wp('7.5%'), backgroundColor: 'rgba(255,255,255,0.05)', top: hp('2%'), left: wp('30%') },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: wp('4.8%'), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  myBookingsBtn: { width: wp('10%'), height: wp('10%'), borderRadius: wp('5%'), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  formCard: { backgroundColor: CARD, marginHorizontal: wp('3.5%'), marginTop: hp('1.5%'), borderRadius: wp('5.5%'), paddingVertical: hp('1.5%'), paddingHorizontal: wp('4%'), ...SHADOW_SM },
  formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('1%') },
  formTitle: { fontSize: wp('4.5%'), fontWeight: '700', color: TEXT_PRIMARY },
  formDesc: { fontSize: wp('3%'), color: TEXT_MUTED, marginTop: hp('0.3%') },
  securePill: { borderRadius: wp('10%'), paddingHorizontal: wp('3%'), paddingVertical: hp('0.5%'), flexDirection: 'row', alignItems: 'center', gap: wp('1%') },
  securePillText: { color: '#fff', fontSize: wp('3%'), fontWeight: '600' },

  label: { fontSize: wp('3.8%'), fontWeight: '700', color: TEXT_PRIMARY, marginBottom: hp('0.6%') },
  optLabel: { fontSize: wp('3%'), fontWeight: '400', color: TEXT_MUTED },

  serviceTypeBar: { flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: wp('3.5%'), overflow: 'hidden', marginBottom: hp('1.8%'), padding: wp('1%') },
  serviceTypeTab: { flex: 1, paddingVertical: hp('1.2%'), paddingHorizontal: wp('2.5%'), minHeight: hp('8.5%'), justifyContent: 'center', borderRadius: wp('3%') },
  serviceTypeTabActive: { backgroundColor: CARD, borderWidth: 1.5, borderColor: TEAL, ...SHADOW_SM },
  serviceTypeIconCircle: { width: wp('6.5%'), height: wp('6.5%'), borderRadius: wp('3.25%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center', marginBottom: hp('0.5%') },
  serviceTypeIconCircleActive: { backgroundColor: TEAL },
  serviceTypeTitle: { fontSize: wp('3.8%'), fontWeight: '600', color: TEXT_PRIMARY },
  serviceTypeTitleActive: { color: TEAL_MID },
  serviceTypeSub: { fontSize: wp('2.8%'), color: TEXT_MUTED, marginTop: hp('0.2%') },

  bodyTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp('2%'), marginBottom: hp('1.8%') },
  bodyTypeChip: { flexDirection: 'row', alignItems: 'center', gap: wp('1.5%'), paddingHorizontal: wp('3%'), paddingVertical: hp('0.9%'), borderRadius: wp('6%'), borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.15)', backgroundColor: CARD, ...SHADOW_SM },
  bodyTypeChipActive: { borderColor: TEAL, backgroundColor: 'rgba(16,185,129,0.08)' },
  bodyTypeText: { fontSize: wp('3.2%'), color: TEXT_SECONDARY, fontWeight: '500' },
  bodyTypeTextActive: { color: TEAL_DEEP, fontWeight: '700' },

  sectionCard: { backgroundColor: '#F8FAFB', borderRadius: wp('4%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)', padding: wp('3.5%'), marginBottom: hp('1.5%') },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: wp('2.5%'), marginBottom: hp('1.2%') },
  sectionIconCircle: { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: wp('3.8%'), fontWeight: '700', color: TEXT_PRIMARY, flex: 1 },

  fieldLabel: { fontSize: wp('3.2%'), color: TEXT_SECONDARY, fontWeight: '500', marginBottom: hp('0.5%') },
  textFieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%'), ...SHADOW_SM },
  fieldInput: { flex: 1, fontSize: wp('3.5%'), color: TEXT_PRIMARY, paddingVertical: hp('0.4%') },

  locationBlock: { backgroundColor: '#F8FAFB', borderRadius: wp('4%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)', padding: wp('3%'), position: 'relative' },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp('0.5%'), gap: wp('2%') },
  tealIconCircle: { width: wp('7%'), height: wp('7%'), borderRadius: wp('3.5%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center' },
  tealIconCircleSm: { width: wp('6.5%'), height: wp('6.5%'), borderRadius: wp('3.25%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center', marginRight: wp('2.5%') },
  smallLabel: { fontSize: wp('3.3%'), color: TEXT_SECONDARY, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', paddingHorizontal: wp('3%'), minHeight: hp('6.5%'), gap: wp('2%') },
  locationInput: { flex: 1, fontSize: wp('3.8%'), color: TEXT_PRIMARY, paddingVertical: hp('0.7%') },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  suggestionBox: { position: 'absolute', top: hp('10%'), left: wp('3%'), right: wp('3%'), backgroundColor: CARD, borderRadius: wp('3.5%'), borderWidth: 0.5, borderColor: '#E2E8F0', zIndex: 999, maxHeight: hp('28%'), overflow: 'hidden', ...SHADOW_MD },
  suggestionScrollView: { width: '100%', maxHeight: hp('28%') },
  suggestionScrollContent: { paddingVertical: hp('0.7%') },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('3%'), paddingVertical: hp('1.1%'), borderBottomWidth: 0.5, borderColor: '#EDF2F7' },
  suggestionText: { color: TEXT_PRIMARY, fontSize: wp('3.5%') },
  noResult: { padding: wp('3%'), textAlign: 'center', color: TEXT_MUTED, fontSize: wp('3.5%') },

  twoTabBar: { flexDirection: 'row', gap: wp('2%'), marginBottom: hp('1.5%') },
  twoTab: { flex: 1, alignItems: 'center', paddingVertical: hp('1.2%'), borderRadius: wp('3%'), borderWidth: 1.5, borderColor: 'rgba(148,163,184,0.2)', backgroundColor: CARD, gap: hp('0.3%') },
  twoTabActive: { borderColor: TEAL, backgroundColor: 'rgba(16,185,129,0.05)' },
  twoTabLabel: { fontSize: wp('3.5%'), fontWeight: '600', color: TEXT_SECONDARY },
  twoTabLabelActive: { color: TEAL_DEEP },

  dateCard: { backgroundColor: CARD, borderRadius: wp('3.5%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)', paddingHorizontal: wp('3%'), paddingVertical: hp('1.5%'), ...SHADOW_SM, marginBottom: hp('0.5%') },
  dateContent: { flexDirection: 'row', alignItems: 'center', gap: wp('2.5%') },
  dateIconWrap: { width: wp('9%'), height: wp('9%'), borderRadius: wp('3%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center' },
  dateMainText: { fontSize: wp('3.6%'), fontWeight: '700', color: TEXT_PRIMARY },
  dateSubText: { fontSize: wp('2.8%'), color: TEXT_MUTED, marginTop: hp('0.15%') },
  dateEditBadge: { width: wp('7%'), height: wp('7%'), borderRadius: wp('3.5%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center' },

  iosDatePickerContainer: { backgroundColor: CARD, borderRadius: wp('3%'), marginTop: hp('1%'), padding: wp('2.5%'), ...SHADOW_SM },
  iosButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: hp('1%'), borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: hp('1%') },
  iosButton: { backgroundColor: TEAL, paddingHorizontal: wp('4%'), paddingVertical: hp('0.8%'), borderRadius: wp('2%') },
  iosButtonText: { color: '#fff', fontWeight: '600', fontSize: wp('3.5%') },

  dropdownWrapper: { position: 'relative', marginBottom: hp('1%'), width: '100%' },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFB', borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', paddingHorizontal: wp('3%'), paddingVertical: hp('1.5%'), minHeight: hp('7%') },
  dropdownButtonActive: { borderColor: TEAL, borderWidth: 1.5, backgroundColor: CARD },
  dropdownButtonText: { fontSize: wp('3.5%'), color: TEXT_PRIMARY },
  dropdownButtonPlaceholder: { fontSize: wp('3.5%'), color: TEXT_MUTED },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: CARD, borderRadius: wp('3%'), borderWidth: 1, borderColor: '#E2E8F0', marginTop: hp('0.6%'), maxHeight: hp('25%'), zIndex: 1000, ...SHADOW_MD },
  dropdownScrollView: { width: '100%', maxHeight: hp('25%') },
  dropdownScrollContent: { paddingVertical: hp('0.6%') },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('4%'), paddingVertical: hp('1.5%'), borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: CARD },
  dropdownItemActive: { backgroundColor: TEAL_LIGHT },
  dropdownItemText: { fontSize: wp('3.5%'), color: TEXT_PRIMARY },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: hp('0.9%') },
  toggleLabel: { fontSize: wp('3.4%'), color: TEXT_PRIMARY, flex: 1 },
  toggleTrack: { width: wp('11%'), height: wp('6%'), borderRadius: wp('3%'), backgroundColor: '#D1D5DB', justifyContent: 'center', paddingHorizontal: wp('0.8%') },
  toggleTrackOn: { backgroundColor: TEAL },
  toggleThumb: { width: wp('4.5%'), height: wp('4.5%'), borderRadius: wp('2.25%'), backgroundColor: '#FFFFFF', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  textArea: { backgroundColor: '#F8FAFB', borderRadius: wp('3%'), borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)', minHeight: hp('10%'), padding: wp('3%'), textAlignVertical: 'top', fontSize: wp('3.5%'), color: TEXT_PRIMARY, marginBottom: hp('1%') },

  submitBtnWrap: { marginTop: hp('2%'), borderRadius: wp('10%'), overflow: 'hidden' },
  submitBtn: { borderRadius: wp('10%'), paddingVertical: hp('1.6%'), alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: wp('3.8%'), fontWeight: '700', letterSpacing: 0.3 },

  faqSec: { backgroundColor: TEAL_DEEP, marginTop: hp('2%'), padding: wp('4%'), borderTopLeftRadius: wp('5%'), borderTopRightRadius: wp('5%') },
  faqTitle: { fontSize: wp('4.5%'), fontWeight: '700', color: '#FFFFFF', marginBottom: hp('1.5%') },
  faqItem: { borderBottomColor: 'rgba(255,255,255,0.1)', borderBottomWidth: 1, paddingVertical: hp('1.2%') },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { color: '#FFFFFF', fontSize: wp('3.5%'), flex: 1, marginRight: wp('3%'), fontWeight: '500' },
  faqA: { color: TEAL_LIGHT, fontSize: wp('3.2%'), marginTop: hp('0.8%'), lineHeight: hp('2.5%') },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: wp('80%'), backgroundColor: CARD, borderRadius: wp('5%'), padding: wp('6%'), alignItems: 'center', ...SHADOW_MD },
  modalIconWrap: { width: wp('15%'), height: wp('15%'), borderRadius: wp('7.5%'), backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center', marginBottom: hp('1.5%') },
  modalTitle: { fontSize: wp('4.2%'), fontWeight: '700', color: TEXT_PRIMARY, marginBottom: hp('0.8%') },
  modalBody: { textAlign: 'center', color: TEXT_SECONDARY, fontSize: wp('3.2%'), marginBottom: hp('2%'), lineHeight: hp('2.5%') },
  modalBtnWrap: { width: '100%', borderRadius: wp('8%'), overflow: 'hidden' },
  modalBtn: { borderRadius: wp('8%'), paddingVertical: hp('1.4%'), alignItems: 'center' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: wp('3.6%') },

  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { width: wp('80%'), backgroundColor: CARD, borderRadius: wp('5%'), padding: wp('6%'), alignItems: 'center', ...SHADOW_MD },
  alertIconCircle: { width: wp('20%'), height: wp('20%'), borderRadius: wp('10%'), justifyContent: 'center', alignItems: 'center', marginBottom: hp('2%') },
  alertTitle: { fontSize: wp('4.5%'), fontWeight: '700', color: TEXT_PRIMARY, marginBottom: hp('1%'), textAlign: 'center' },
  alertMessage: { fontSize: wp('3.5%'), color: TEXT_SECONDARY, textAlign: 'center', lineHeight: hp('2.5%'), marginBottom: hp('2.5%') },
  alertBtn: { width: '100%', borderRadius: wp('8%'), overflow: 'hidden' },
  alertBtnGradient: { paddingVertical: hp('1.6%'), alignItems: 'center', borderRadius: wp('8%') },
  alertBtnText: { color: '#FFFFFF', fontSize: wp('4%'), fontWeight: '700' },
});
