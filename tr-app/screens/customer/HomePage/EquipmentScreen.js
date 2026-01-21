
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { locationService, bookingService, fleetService } from '../../services';
import { Animated } from 'react-native';

const { width } = Dimensions.get('window');
const BG = '#F5F5F7';
const GREEN = '#09B368';

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
  { id: '1', label: '1–5 days' },
  { id: '2', label: '6–15 days' },
  { id: '3', label: '16–30 days' },
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
  const [customerData, setCustomerData] = useState(null);
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
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); // iOS only
  const [equipmentCount, setEquipmentCount] = useState('');
  const [otherDetails, setOtherDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // quote slider
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadCustomer();
    fetchLocations();
    fetchEquipment();
  }, []);

  const loadCustomer = async () => {
    const data = await AsyncStorage.getItem('customer');
    if (data) {
      setCustomerData(JSON.parse(data));
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
      a: 'Yes, tell the vendor – they will revise the quote.',
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
      minimumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'dismissed') return;
        const pickedDate = date || startDate;
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
        customerEmail: customerData?.email || 'customer@transrentals.in',
        customerPhone: customerData?.phone || '',
        companyName: null,
        equipmentCategory: selectedEquipment?.name || 'Construction Equipment',
        equipmentType: selectedEquipment?.name || 'Heavy Machinery',
        equipmentName: selectedEquipment?.name || null,
        quantity: parseInt(equipmentCount) || 1, // ✅ Int
        rentalDuration: 'daily',
        rentalDays: rentalDays, // ✅ Int
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deliveryCity: pickupLocation,
        deliveryAddress: pickupLocation, // ✅ Required field (String)
        siteType: 'construction',
        needOperator: false,
        needDelivery: true,
        needInstallation: false,
        requirements: otherDetails?.trim() || null,
        budgetMin: null,
        budgetMax: null,
      };

      console.log('Equipment quote request payload:', payload);

      const response = await bookingService.createEquipmentQuoteRequest(payload);

      if (response.success || response.quoteRequest) {
        alert('Quote request submitted! ✅\n\nVendors will send quotes within 24-48 hours.');
        navigation.navigate('MyEquipmentBookings');
      } else {
        alert('Request could not be submitted. Please try again.');
      }
    } catch (err) {
      console.log('equip submit err', err?.response?.data || err);
      alert('Booking failed. Please try again.');
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
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Equipment Rental</Text>
        <View style={{ width: 40 }} />
          <TouchableOpacity
          onPress={() => navigation.navigate('MyEquipmentBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}
    keyboardShouldPersistTaps="handled"  onScrollBeginDrag={() => {
    if (!dropdownTouching.current) setShowSuggestions(false);
  }}>
        {/* FORM CARD */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Post equipment requirement</Text>
              <Text style={styles.formDesc}>
                Fill once, verified vendors will send quotes.
              </Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="construct-outline" size={14} color="#fff" />
              <Text style={styles.securePillText}>Site job</Text>
            </View>
          </View>

          {/* LOCATION BLOCK */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Project / site location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color="#0F172A" />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleLocationInput}
                placeholder="Enter city / site / area"
                placeholderTextColor="#94A3B8"
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
                  <Ionicons name="close-circle" size={20} color="#CBD5F5" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* location suggestions */}
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
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(loc)}
                        activeOpacity={0.7}
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

            {/* quick cities */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
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
                <Ionicons name="calendar-outline" size={16} color="#0F172A" />
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
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* iOS inline picker only */}
          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="spinner"
              minimumDate={new Date()}
              onChange={(event, selected) => {
                if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                  return;
                }
                if (selected) setStartDate(selected);
                setShowDatePicker(false);
              }}
            />
          )}
 {/* EQUIPMENT TYPE — HORIZONTAL CHIPS */}
          <View style={{ marginTop: 16 }}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>Equipment type</Text>
              <Text style={styles.labelHint}>Crane, JCB, Excavator…</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
              style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
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
                      <View style={styles.equipChipIcon}>
                        <Ionicons
                          name="construct-outline"
                          size={16}
                          color={active ? '#055F3B' : '#0F172A'}
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
                          size={18}
                          color={GREEN}
                          style={{ marginLeft: 2 }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
          </View>

          {/* DURATION */}
          <View style={{ marginTop: 16 }}>
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
          <View style={{ marginTop: 16 }}>
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
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* OTHER DETAILS */}
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Other details</Text>
            <TextInput
              value={otherDetails}
              onChangeText={setOtherDetails}
              style={styles.textArea}
              multiline
              placeholder="Example: with operator, with fuel, 8hr shift, reach Bopal site…"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Get Quotes from Vendors</Text>
            )}
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
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#E2E8F0"
                  />
                </TouchableOpacity>
                {open ? <Text style={styles.faqA}>{f.a}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

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
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Please add your phone number first
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('EditProfileScreen');
              }}
            >
              <Text style={styles.modalBtnText}>Go to Profile</Text>
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
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
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
    marginTop: -8,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  formDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  securePill: {
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 11.5,
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
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.6,
    borderColor: '#E2E8F0',
    zIndex: 99,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 0.4,
    borderColor: '#EDF2F7',
  },
  suggestionText: {
    color: '#0F172A',
  },
  noResult: {
    padding: 10,
    textAlign: 'center',
    color: '#94A3B8',
  },
  cityChip: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.05)',
  },
  cityChipActive: {
    backgroundColor: 'rgba(9,179,104,0.12)',
    borderColor: 'rgba(9,179,104,0.5)',
  },
  cityChipImg: {
    width: 26,
    height: 26,
    borderRadius: 18,
  },
  cityChipText: {
    fontSize: 13,
    color: '#0F172A',
  },
  cityChipTextActive: {
    color: '#055F3B',
    fontWeight: '600',
  },
  dateCard: {
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
  },
  dateContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  labelHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // NEW EQUIP GRID
  equipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipChip: {
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  equipChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(9,179,104,0.38)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  equipChipIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipChipName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  equipChipNameActive: {
    color: '#055F3B',
  },
  equipChipSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  equipChipSubActive: {
    color: '#0F172A',
  },
  pillWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: 'rgba(9,179,104,0.14)',
    borderColor: 'rgba(9,179,104,0.4)',
  },
  pillText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#055F3B',
  },
  inputPlain: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    minHeight: 50,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 6,
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
    marginTop: 6,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 20,
    padding: 14,
  },
  sectionTitleInside: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  equipGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  equipBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  equipImg: {
    width: 70,
    height: 50,
  },
  equipBoxName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
  },
  quoteCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(9,179,104,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quoteCircleText: {
    fontWeight: '700',
    color: '#055F3B',
    fontSize: 16,
  },
  quoteHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  quoteBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
  },
  activeDot: {
    backgroundColor: GREEN,
    width: 18,
  },
  faqSec: {
    backgroundColor: '#0F172A',
    marginTop: 18,
    padding: 16,
    paddingBottom: 26,
  },
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
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    padding: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
    marginTop: 8,
  },
  modalBtn: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // NEW EQUIP CHIPS
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  equipChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(9,179,104,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  equipChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipChipText: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    maxWidth: 120,
  },
  equipChipTextActive: {
    color: '#055F3B',
  },

});
