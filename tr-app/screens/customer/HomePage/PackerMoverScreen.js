
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

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
    answer: 'Yes, choose Office → Individual items or add in notes.',
  },
  {
    question: 'Do I get multiple quotes?',
    answer: 'Yes. Fill once → vendors will send you quotes.',
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

  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [destination, setDestination] = useState('');
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

  useEffect(() => {
    (async () => {
      const c = await AsyncStorage.getItem('customer');
      if (c) setCustomerData(JSON.parse(c));
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
          alert('📍 Location Notice\n\nThis location is not currently available for packers & movers services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
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
        pickupAddress: pickupLocation, // ✅ Required field (String)
        pickupFloor: null,
        hasPickupLift: false,
        pickupParkingDist: null,
        dropCity: destination,
        dropAddress: destination, // ✅ Required field (String)
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

      console.log('📦 Packers quote request payload →', payload);

      const response = await bookingService.createPackersQuoteRequest(payload);

      // ✅ success
      if (response.success || response.quoteRequest) {
        // clear local
        setDestination('');
        setOtherDetails('');

        alert('Quote request submitted! ✅\n\nVendors will send quotes within 24-48 hours.');
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
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Packers & Movers</Text>
        <View style={{ width: 40 }} />
          <TouchableOpacity
          onPress={() => navigation.navigate('MyPackersBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

<ScrollView
  showsVerticalScrollIndicator={false}
  nestedScrollEnabled
  keyboardShouldPersistTaps="handled"
  onScrollBeginDrag={() => {
    if (!dropdownTouching.current) setShowSuggestions(false);
  }}
>


        <View style={styles.formCard}>
          {/* header */}
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Plan your shifting</Text>
              <Text style={styles.formDesc}>
                One form → get multiple packers & movers quotes.
              </Text>
            </View>
             {/* <View style={styles.securePill}>
                         <Ionicons name="construct-outline" size={14} color="#fff" />
                         <Text style={styles.securePillText}>Site job</Text>
                       </View> */}
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
                  <View style={styles.tripTypeIconCircle}>
                    <Ionicons name={item.icon} size={15} color="#0F172A" />
                  </View>
                  <Text style={[styles.tripTypeTitle, active && styles.tripTypeTitleActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.tripTypeSub}>{item.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* pickup / destination */}
          <View style={styles.locationBlock}>
            {/* FROM */}
            <Text style={styles.smallLabel}>Pickup / Current address</Text>
            <View style={{ position: 'relative' }}>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={18} color="#0F172A" />
                <TextInput
                  value={query.length ? query : pickupLocation}
                  onChangeText={handlePickupInput}
                  placeholder="Enter pickup city / area"
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
                    <Ionicons name="close-circle" size={22} color="#CBD5F5" />
                  </TouchableOpacity>
                ) : null}
              </View>

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
                        <TouchableOpacity
                          key={loc.id}
                          onPress={() => handleLocationSelect(loc)}
                          style={styles.suggestionItem}
                        >
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

            {/* TO */}
            <Text style={[styles.smallLabel, { marginTop: 14 }]}>
              Destination / New address
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="flag-outline" size={18} color="#0F172A" />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Enter destination city / area"
                placeholderTextColor="#94A3B8"
                style={styles.locationInput}
              />
            </View>
          </View>

          {/* date row */}
          <View style={[styles.dateRow, { marginTop: 12 }]}>
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
                  <Ionicons name="calendar-outline" size={16} color="#0F172A" />
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
                    •{' '}
                    {moveDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

         

          {/* SUBTYPE — horizontal pills */}
          <Text style={[styles.label, { marginTop: 16 }]}>
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
            contentContainerStyle={{ gap: 10, paddingRight: 8 }}
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
                  <View style={styles.subtypeIconWrap}>
                    <Ionicons
                      name={opt.icon || 'cube-outline'}
                      size={16}
                      color={active ? '#0F172A' : '#64748B'}
                    />
                  </View>
                  <Text style={[styles.subtypeText, active && styles.subtypeTextActive]}>
                    {opt.label}
                  </Text>
                  {active ? (
                    <View style={styles.subtypeTick}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* other details */}
          <Text style={[styles.label, { marginTop: 16 }]}>
            Other details (floors, lift, fragile items…)
          </Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Example: 3rd floor no lift, 2 cupboards, 1 TV, needs packing."
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
              <Text style={styles.submitText}>Get Quotes from Vendors</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about Packers & Movers</Text>
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

      {/* phone required modal */}
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
    marginTop: 6,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 20,
  },
  securePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
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
    minHeight: 72,
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
    backgroundColor: 'rgba(9,179,104,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripTypeTitle: {
    fontSize: 14.5,
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

suggestionBox: {
  position: 'absolute',
  top: 70,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  borderWidth: 0.6,
  borderColor: '#E2E8F0',
  zIndex: 99,
  elevation: 10, // 👈 add this
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
    gap: 8,
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

  subtypeScroll: {
    marginBottom: 4,
  },
  subtypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  subtypeChipActive: {
    backgroundColor: 'rgba(9,179,104,0.08)',
    borderColor: 'rgba(9,179,104,0.4)',
  },
  subtypeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtypeText: {
    fontSize: 13,
    color: '#0F172A',
  },
  subtypeTextActive: {
    fontWeight: '600',
  },
  subtypeTick: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },

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
