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
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { locationService, bookingService } from '../../services';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM, SHADOW_MD } from '../../../theme';

const { width } = Dimensions.get('window');

const truckTypesList = [
  { name: 'Canter Jumbo', id: 1 },
  { name: 'Canters 17feet / 4 wheel', id: 2 },
  { name: 'Canters 19feet / 6 wheel', id: 3 },
  { name: 'Canters 3MT / 4 wheel', id: 4 },
  { name: 'Canters Close Body 20 Feet', id: 5 },
  { name: 'Canters Close Body 24 Feet', id: 6 },
  { name: 'LCV (Light Commercial Vehicle)', id: 7 },
  { name: 'Semi Low Bed Trailer', id: 8 },
  { name: 'Truck 20MT / 12 Wheel', id: 9 },
  { name: 'Truck 25MT / 14 Wheel', id: 10 },
  { name: 'Truck 16MT / 10 Wheel', id: 11 },
  { name: 'Tata 407 2.5 MT / 4 Wheels', id: 12 },
  { name: 'Truck 9MT / 6 Wheel', id: 13 },
  { name: 'Tata Ace', id: 14 },
];

const personalGoodsTypesList = [
  { name: 'Building materials', id: 1 },
  { name: 'Granites / Marbles', id: 2 },
  { name: 'Cement', id: 3 },
  { name: 'Chemical', id: 4 },
  { name: 'Coal & Ash', id: 5 },
  { name: 'Container', id: 6 },
  { name: 'Engineering goods', id: 7 },
  { name: 'Electronics / Consumer durable', id: 8 },
  { name: 'Fertilizer', id: 9 },
  { name: 'Fruits & Vegetables', id: 10 },
  { name: 'Furniture & Wood products', id: 11 },
  { name: 'Household goods', id: 12 },
  { name: 'Industrial Equipments', id: 13 },
  { name: 'Iron / Steel material', id: 14 },
  { name: 'Liquid / Oil drums', id: 15 },
  { name: 'Machineries', id: 16 },
  { name: 'Marble Slab / Block', id: 17 },
  { name: 'Medicines', id: 18 },
  { name: 'Packed foods', id: 19 },
  { name: 'Plastic Pipes', id: 20 },
];

const commercialGoodsTypesList = [
  { name: 'Building materials', id: 1 },
  { name: 'Granites / Marbles', id: 2 },
  { name: 'Cement', id: 3 },
  { name: 'Chemical', id: 4 },
  { name: 'Coal & Ash', id: 5 },
  { name: 'Container', id: 6 },
  { name: 'Engineering goods', id: 7 },
  { name: 'Electronics / Consumer durable', id: 8 },
  { name: 'Fertilizer', id: 9 },
  { name: 'Fruits & Vegetables', id: 10 },
  { name: 'Furniture & Wood products', id: 11 },
  { name: 'Household goods', id: 12 },
  { name: 'Industrial Equipments', id: 13 },
  { name: 'Iron / Steel material', id: 14 },
  { name: 'Liquid / Oil drums', id: 15 },
  { name: 'Machineries', id: 16 },
  { name: 'Marble Slab / Block', id: 17 },
  { name: 'Medicines', id: 18 },
  { name: 'Packed foods', id: 19 },
  { name: 'Plastic Pipes', id: 20 },
  { name: 'Books / Paper rolls', id: 21 },
  { name: 'Plastic granules / Industrial goods', id: 22 },
  { name: 'Crop / Agriculture products', id: 23 },
  { name: 'Scrap', id: 24 },
  { name: 'Scones / Tiles', id: 25 },
  { name: 'Textiles', id: 26 },
  { name: 'Tyres & Rubber products', id: 27 },
  { name: 'Vehicles / Automobiles', id: 28 },
  { name: 'Others', id: 29 },
];

const faqs = [
  {
    question: 'What types of trucks can I hire from TransRentals?',
    answer: 'We offer mini trucks, pickup trucks, trailers, heavy-duty trucks, and specialized vehicles for all your transportation needs.',
  },
  {
    question: 'Can I hire a truck with a driver?',
    answer: 'Yes, we provide professional and licensed truck drivers for those who need assistance with driving the truck.',
  },
  {
    question: 'How can I book a truck online?',
    answer: 'Simply fill out the booking form with your requirements - pickup location, destination, truck type, goods details, and we will connect you with the best vendors.',
  },
  {
    question: 'What is the minimum booking duration?',
    answer: 'You can book trucks for both short-term (few hours) and long-term requirements with flexible rental options.',
  },
];

const quoteData = [
  {
    id: '1',
    number: '1',
    heading: 'Enquire',
    body: `Tell us your truck requirements - type, goods, weight, pickup & destination.`,
  },
  {
    id: '2',
    number: '2',
    heading: 'Get Quote',
    body: `Multiple truck vendors send you their best price & vehicle options.`,
  },
  {
    id: '3',
    number: '3',
    heading: 'Book',
    body: `Choose the best quote, confirm booking and your truck is arranged.`,
  },
];

export default function TruckRentalScreen() {
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

  const [serviceType, setServiceType] = useState('personal');
  const [destination, setDestination] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const destinationDropdownRef = useRef(null);

  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [selectedTruckType, setSelectedTruckType] = useState(null);
  const [selectedTruckTypeId, setSelectedTruckTypeId] = useState(null);


  const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
  const [selectedGoodsType, setSelectedGoodsType] = useState(null);
  const [selectedGoodsTypeId, setSelectedGoodsTypeId] = useState(null);

  const [weightVal, setWeightVal] = useState('');
  const [weightUnit, setWeightUnit] = useState('KG');
  const [otherDetails, setOtherDetails] = useState('');
  const [isPhoneModal, setIsPhoneModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);


  const getCurrentGoodsTypes = () => {
    return serviceType === 'personal' ? personalGoodsTypesList : commercialGoodsTypesList;
  };

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
      const data = await AsyncStorage.getItem('customer');
      if (data) setCustomerData(JSON.parse(data));
    })();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getTruckLocations();
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

  const filteredDestinations = destinationQuery.length
    ? allLocations.filter(
        (l) =>
          typeof l.name === 'string' &&
          l.name.toLowerCase().includes(textSafe(destinationQuery)),
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

  const handleDestinationInputChange = (text) => {
    setDestinationQuery(text);
    setDestination(text);
    setShowDestinationSuggestions(text.length > 0);
  };

  const handleDestinationSelect = (loc) => {
    setDestination(loc.name);
    setDestinationQuery('');
    setShowDestinationSuggestions(false);
  };

  const handleDestinationBlur = () => {
    // When user finishes typing, hide suggestions and keep the typed value
    setTimeout(() => {
      setShowDestinationSuggestions(false);
      setDestinationQuery('');
    }, 200); // Small delay to allow dropdown click to register
  };


const handleOutsideClick = () => {
  setShowSuggestions(false);
};

const handleDestinationOutsideClick = () => {
  setShowDestinationSuggestions(false);
};
  const toggleFAQ = (i) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  const openAndroidPicker = () => {
    setAndroidPickerMode('date');
    setAndroidPickerVisible(true);
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
      const newStart = new Date(selected);
      const merged = new Date(
        newStart.getFullYear(),
        newStart.getMonth(),
        newStart.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      );
      setStartDate(merged);
      setAndroidPickerMode('time');
      setAndroidPickerVisible(true);
      return;
    }

    if (androidPickerMode === 'time') {
      const upd = new Date(startDate);
      upd.setHours(selected.getHours());
      upd.setMinutes(selected.getMinutes());
      setStartDate(upd);
      setAndroidPickerVisible(false);
    }
  };

  const onStartDateChangeIOS = (event, selectedDate) => {
    if (!selectedDate) return;
    setStartDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!pickupLocation) {
      alert('Please select pickup location');
      return;
    }
    if (!destination) {
      alert('Please enter destination');
      return;
    }
    if (!selectedTruckTypeId) {
      alert('Please select truck type');
      return;
    }
    if (!selectedGoodsTypeId) {
      alert('Please select goods type');
      return;
    }
    if (!weightVal) {
      alert('Please enter weight');
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
          alert('📍 Location Notice\n\nThis location is not currently available for truck services. Our team will be expanding to this area soon!\n\nYou can still submit your request and we\'ll notify you once we\'re available in your area.');
          // Allow to continue with submission
        }
      }

      // Convert weight to proper format based on unit
      let weightInKg = parseFloat(weightVal);
      if (weightUnit === 'MT') {
        weightInKg = weightInKg * 1000; // Convert MT to KG
      } else if (weightUnit === 'TON') {
        weightInKg = weightInKg * 1000; // Convert Ton to KG
      }

      // Correct payload format matching database schema EXACTLY
      const payload = {
        customerId: customerId || null,
        customerName: customerData?.name || 'Customer',
        customerEmail: customerData?.email || 'book@transrentals.in',
        customerPhone: customerData?.phone || '',
        serviceType: serviceType === 'personal' ? 'personal' : 'commercial',
        vehicle_category: selectedTruckType,
        vehicleCategoryName: selectedTruckType,
        goodsType: selectedGoodsType,
        goodsDescription: otherDetails?.trim() || null,
        estimatedWeight: weightInKg, // ✅ Float (number in KG)
        estimatedVolume: null, // Can add volume field later
        requiresLabour: false,
        labourCount: null,
        pickupCity: pickupLocation,
        pickupAddress: null,
        pickupFloor: null,
        hasPickupLift: false,
        dropCity: destination,
        dropAddress: null,
        dropFloor: null,
        hasDropLift: false,
        estimatedDistance: null,
        pickupDate: startDate.toISOString(),
        pickupTime: startDate.toTimeString().slice(0, 5),
        isFlexibleDate: false,
        requirements: otherDetails?.trim() || null,
        needInsurance: false,
        needPackaging: false,
        budgetMin: null,
        budgetMax: null,
      };

      console.log('Truck quote request payload:', payload);

      const response = await bookingService.createTruckQuoteRequest(payload);

      if (response.success || response.quoteRequest) {
        alert('Quote request submitted! ✅\n\nVendors will send quotes within 24-48 hours.');
        navigation.navigate('MyTruckBookings');
      } else {
        alert('Request could not be submitted. Please try again.');
      }
    } catch (err) {
      console.log('truck booking err', err?.response?.data || err?.message || err);
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Truck Rental</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyTruckBookings')}
            style={styles.myBookingsBtn}
          >
            <Ionicons name="document-text-outline" size={wp('5%')} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Book Your Truck</Text>
              <Text style={styles.formDesc}>
                Fill details once, get multiple quotes from vendors.
              </Text>
            </View>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.securePill}
            >
              <Ionicons name="shield-checkmark" size={wp('3.2%')} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </LinearGradient>
          </View>


          <Text style={styles.label}>Service Type</Text>
          <View style={styles.serviceTypeBar}>
            <TouchableOpacity
              onPress={() => setServiceType('personal')}
              activeOpacity={0.9}
              style={[styles.serviceTypeTab, serviceType === 'personal' && styles.serviceTypeTabActive]}
            >
              <View style={[styles.serviceTypeIconCircle, serviceType === 'personal' && styles.serviceTypeIconCircleActive]}>
                <Ionicons name="person-outline" size={wp('3.8%')} color={serviceType === 'personal' ? '#FFFFFF' : TEXT_SECONDARY} />
              </View>
              <Text style={[styles.serviceTypeTitle, serviceType === 'personal' && styles.serviceTypeTitleActive]}>
                Personal Use
              </Text>
              <Text style={styles.serviceTypeSub}>Household, Moving etc.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setServiceType('commercial')}
              activeOpacity={0.9}
              style={[styles.serviceTypeTab, serviceType === 'commercial' && styles.serviceTypeTabActive]}
            >
              <View style={[styles.serviceTypeIconCircle, serviceType === 'commercial' && styles.serviceTypeIconCircleActive]}>
                <Ionicons name="business-outline" size={wp('3.8%')} color={serviceType === 'commercial' ? '#FFFFFF' : TEXT_SECONDARY} />
              </View>
              <Text style={[styles.serviceTypeTitle, serviceType === 'commercial' && styles.serviceTypeTitleActive]}>
                Commercial Use
              </Text>
              <Text style={styles.serviceTypeSub}>Business, Goods etc.</Text>
            </TouchableOpacity>
          </View>


{/* Pickup Location Block */}
<View style={styles.locationBlock}>
  <View style={styles.locationLabelRow}>
    <View style={styles.tealIconCircle}>
      <Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} />
    </View>
    <Text style={styles.smallLabel}>Pickup Location</Text>
  </View>
  <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
    <TextInput
      value={query.length ? query : pickupLocation}
      onChangeText={handleInputChange}
      placeholder="Enter pickup location"
      placeholderTextColor={TEXT_MUTED}
      style={styles.locationInput}
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
                <Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} style={{ marginRight: wp('2%') }} />
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
</View>

{/* Destination Block - Separate container */}
<View style={styles.locationBlock}>
  <View style={styles.locationLabelRow}>
    <View style={styles.tealIconCircle}>
      <Ionicons name="flag-outline" size={wp('3.5%')} color={TEAL} />
    </View>
    <Text style={styles.smallLabel}>Destination</Text>
  </View>
  <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
    <TextInput
      value={destinationQuery.length ? destinationQuery : destination}
      onChangeText={handleDestinationInputChange}
      onBlur={handleDestinationBlur}
      placeholder="Enter destination location"
      placeholderTextColor={TEXT_MUTED}
      style={styles.locationInput}
    />
    {destination ? (
      <TouchableOpacity
        onPress={() => {
          setDestination('');
          setDestinationQuery('');
        }}
      >
        <Ionicons name="close-circle" size={wp('5.5%')} color={TEXT_MUTED} />
      </TouchableOpacity>
    ) : null}
  </TouchableOpacity>

  {/* Destination Suggestions Dropdown */}
  {showDestinationSuggestions && destinationQuery && (
    <>
      <Pressable
        style={styles.overlay}
        onPress={handleDestinationOutsideClick}
      />

      <View style={styles.suggestionBox} ref={destinationDropdownRef}>
        <ScrollView
          style={styles.suggestionScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.suggestionScrollContent}
        >
          {filteredDestinations.length > 0 ? (
            filteredDestinations.map((loc, index) => (
              <TouchableOpacity
                key={loc.id || index}
                style={styles.suggestionItem}
                onPress={() => handleDestinationSelect(loc)}
              >
                <Ionicons name="location-outline" size={wp('3.5%')} color={TEAL} style={{ marginRight: wp('2%') }} />
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
</View>


          <Text style={styles.label}>Pickup Date & Time</Text>
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => {
              if (Platform.OS === 'android') {
                openAndroidPicker();
              } else {
                setShowStartDatePicker(true);
              }
            }}
            activeOpacity={0.9}
          >
            <View style={styles.dateContent}>
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
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
              <View style={styles.dateEditBadge}>
                <Ionicons name="pencil-outline" size={wp('3%')} color={TEAL} />
              </View>
            </View>
          </TouchableOpacity>


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


          <Text style={[styles.label, { marginTop: hp('2%') }]}>Select Truck Type</Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={[styles.dropdownButton, showTruckDropdown && styles.dropdownButtonActive]}
              onPress={() => setShowTruckDropdown(!showTruckDropdown)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.tealIconCircleSm}>
                  <Ionicons name="bus-outline" size={wp('3.5%')} color={TEAL} />
                </View>
                <Text style={selectedTruckType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                  {selectedTruckType || 'Select Truck Type'}
                </Text>
              </View>
              <Ionicons
                name={showTruckDropdown ? 'chevron-up' : 'chevron-down'}
                size={wp('4.5%')}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>

            {showTruckDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {truckTypesList.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.dropdownItem,
                        selectedTruckTypeId === type.id && styles.dropdownItemActive
                      ]}
                      onPress={() => {
                        setSelectedTruckType(type.name);
                        setSelectedTruckTypeId(type.id);
                        setShowTruckDropdown(false);
                      }}
                    >
                      {selectedTruckTypeId === type.id && (
                        <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                      )}
                      <Text style={[styles.dropdownItemText, selectedTruckTypeId === type.id && { color: TEAL_MID, fontWeight: '600' }]}>{type.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>


          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Select Goods Type
          </Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={[styles.dropdownButton, showGoodsDropdown && styles.dropdownButtonActive]}
              onPress={() => setShowGoodsDropdown(!showGoodsDropdown)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.tealIconCircleSm}>
                  <Ionicons name="cube-outline" size={wp('3.5%')} color={TEAL} />
                </View>
                <Text style={selectedGoodsType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                  {selectedGoodsType || 'Select Goods Type'}
                </Text>
              </View>
              <Ionicons
                name={showGoodsDropdown ? 'chevron-up' : 'chevron-down'}
                size={wp('4.5%')}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>

            {showGoodsDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {getCurrentGoodsTypes().map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        selectedGoodsTypeId === item.id && styles.dropdownItemActive
                      ]}
                      onPress={() => {
                        setSelectedGoodsType(item.name);
                        setSelectedGoodsTypeId(item.id);
                        setShowGoodsDropdown(false);
                      }}
                    >
                      {selectedGoodsTypeId === item.id && (
                        <Ionicons name="checkmark-circle" size={wp('4%')} color={TEAL} style={{ marginRight: wp('2%') }} />
                      )}
                      <Text style={[styles.dropdownItemText, selectedGoodsTypeId === item.id && { color: TEAL_MID, fontWeight: '600' }]}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>


          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Enter Weight
          </Text>
          <View style={styles.weightRow}>
            <View style={[styles.inputPill, { flex: 1 }]}>
              <View style={styles.tealIconCircleSm}>
                <Ionicons name="barbell-outline" size={wp('3.5%')} color={TEAL} />
              </View>
              <TextInput
                value={weightVal}
                onChangeText={setWeightVal}
                placeholder="Weight (e.g. 1500)"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="numeric"
                style={styles.inputText}
              />
            </View>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[
                  styles.unitBtn,
                  weightUnit === 'KG' && styles.unitBtnActive,
                ]}
                onPress={() => setWeightUnit('KG')}
              >
                <Text
                  style={[
                    styles.unitText,
                    weightUnit === 'KG' && styles.unitTextActive,
                  ]}
                >
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitBtn,
                  weightUnit === 'TON' && styles.unitBtnActive,
                ]}
                onPress={() => setWeightUnit('TON')}
              >
                <Text
                  style={[
                    styles.unitText,
                    weightUnit === 'TON' && styles.unitTextActive,
                  ]}
                >
                  TON
                </Text>
              </TouchableOpacity>
            </View>
          </View>


          <Text style={[styles.label, { marginTop: hp('2%') }]}>
            Any Other Details
          </Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Additional info"
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
                <Text style={styles.submitText}>Get Quotes from Vendors</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>


        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>FAQs about Truck Rental</Text>
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
                    size={wp('4.5%')}
                    color="#E2E8F0"
                  />
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>


      <Modal
        visible={isPhoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="call-outline" size={wp('7%')} color={TEAL} />
            </View>
            <Text style={styles.modalTitle}>Phone Number Required</Text>
            <Text style={styles.modalBody}>
              Please add your phone number to complete the booking process.
            </Text>
            <TouchableOpacity
              style={styles.modalBtnWrap}
              onPress={() => {
                setIsPhoneModal(false);
                navigation.navigate('EditProfileScreen');
              }}
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


      {androidPickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={startDate}
          mode={androidPickerMode}
          display="default"
          onChange={onAndroidChange}
          minimumDate={new Date()}
        />
      )}
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

  /* ─── Premium Gradient Header ─── */
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: wp('35%'),
    height: wp('35%'),
    borderRadius: wp('17.5%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -wp('10%'),
    right: -wp('8%'),
  },
  decorCircle2: {
    position: 'absolute',
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('5%'),
    left: -wp('5%'),
  },
  decorCircle3: {
    position: 'absolute',
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: hp('2%'),
    left: wp('30%'),
  },
  headerContent: {
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
    fontSize: wp('4.8%'),
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

  /* ─── Form Card ─── */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('5.5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    ...SHADOW_SM,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: hp('0.3%'),
  },
  securePill: {
    borderRadius: wp('10%'),
    paddingHorizontal: wp('3%'),
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

  /* ─── Labels ─── */
  label: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.6%'),
  },

  /* ─── Service Type Toggle ─── */
  serviceTypeBar: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('1.8%'),
    padding: wp('1%'),
  },
  serviceTypeTab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('2.5%'),
    minHeight: hp('8.5%'),
    justifyContent: 'center',
    borderRadius: wp('3%'),
  },
  serviceTypeTabActive: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: TEAL,
    ...SHADOW_SM,
  },
  serviceTypeIconCircle: {
    width: wp('6.5%'),
    height: wp('6.5%'),
    borderRadius: wp('3.25%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  serviceTypeIconCircleActive: {
    backgroundColor: TEAL,
  },
  serviceTypeTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  serviceTypeTitleActive: {
    color: TEAL_MID,
  },
  serviceTypeSub: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },

  /* ─── Location Blocks ─── */
  locationBlock: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    position: 'relative',
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
    gap: wp('2%'),
  },
  tealIconCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tealIconCircleSm: {
    width: wp('6.5%'),
    height: wp('6.5%'),
    borderRadius: wp('3.25%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  smallLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2%'),
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.7%'),
  },

  /* ─── Suggestion Dropdown ─── */
  suggestionBox: {
    position: 'absolute',
    top: hp('10%'),
    left: wp('3%'),
    right: wp('3%'),
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
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
    paddingVertical: hp('0.7%'),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.1%'),
    borderBottomWidth: 0.5,
    borderColor: '#EDF2F7',
  },
  suggestionText: {
    color: TEXT_PRIMARY,
    fontSize: wp('3.5%'),
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.5%'),
  },

  /* ─── Date Card ─── */
  dateCard: {
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    ...SHADOW_SM,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  dateIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
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
    color: TEXT_MUTED,
    marginTop: hp('0.15%'),
  },
  dateEditBadge: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── Dropdown Selectors ─── */
  dropdownWrapper: {
    position: 'relative',
    marginBottom: hp('1%'),
    width: '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    minHeight: hp('7%'),
  },
  dropdownButtonActive: {
    borderColor: TEAL,
    borderWidth: 1.5,
    backgroundColor: CARD,
  },
  dropdownButtonText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  dropdownButtonPlaceholder: {
    fontSize: wp('3.5%'),
    color: TEXT_MUTED,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: hp('0.6%'),
    maxHeight: hp('25%'),
    zIndex: 1000,
    ...SHADOW_MD,
  },
  dropdownScrollView: {
    width: '100%',
    maxHeight: hp('25%'),
  },
  dropdownScrollContent: {
    paddingVertical: hp('0.6%'),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: CARD,
  },
  dropdownItemActive: {
    backgroundColor: TEAL_LIGHT,
  },
  dropdownItemText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },

  /* ─── iOS Date Picker ─── */
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

  /* ─── Weight Input ─── */
  inputPill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    gap: wp('1.5%'),
    minHeight: hp('7%'),
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.3%'),
  },
  weightRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
    alignItems: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: wp('2.5%'),
    padding: wp('0.5%'),
  },
  unitBtn: {
    paddingHorizontal: wp('3.2%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
  },
  unitBtnActive: {
    backgroundColor: CARD,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  unitText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  unitTextActive: {
    color: TEAL_MID,
    fontWeight: '700',
  },

  /* ─── Text Area ─── */
  textArea: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    minHeight: hp('10%'),
    padding: wp('3%'),
    textAlignVertical: 'top',
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },

  /* ─── Submit Button ─── */
  submitBtnWrap: {
    marginTop: hp('2%'),
    borderRadius: wp('10%'),
    overflow: 'hidden',
  },
  submitBtn: {
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

  /* ─── Quote Cards ─── */
  quoteTitle: {
    marginTop: hp('2.5%'),
    marginLeft: wp('6%'),
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  quoteTextWrapperMain: {
    width: '100%',
    flexDirection: 'row',
    alignContent: 'center',
    marginBottom: hp('1.2%'),
  },
  quoteCard: {
    marginHorizontal: wp('5%'),
    marginTop: hp('1.2%'),
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    ...SHADOW_MD,
  },
  quoteNumberCircle: {
    width: wp('15%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2.5%'),
    position: 'absolute',
    opacity: 0.8,
    bottom: hp('-8%'),
  },
  quoteNumber: {
    fontWeight: '700',
    fontSize: wp('25%'),
    color: TEAL_LIGHT,
  },
  quoteHeading: {
    fontWeight: '700',
    fontSize: wp('4.3%'),
    color: TEXT_PRIMARY,
    marginLeft: wp('16%'),
    marginTop: hp('0.6%'),
  },
  quoteBody: {
    fontWeight: '400',
    fontSize: wp('3.8%'),
    color: TEXT_SECONDARY,
    lineHeight: hp('2.3%'),
    textAlign: 'center',
    marginTop: hp('1.2%'),
  },
  quoteBodyMain: { width: '100%' },
  paginationDots: {
    marginTop: hp('1.8%'),
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('2.5%'),
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

  /* ─── FAQ Section ─── */
  faqSec: {
    backgroundColor: TEAL_DEEP,
    marginTop: hp('2%'),
    padding: wp('4%'),
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
  },
  faqTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp('1.5%'),
  },
  faqItem: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    fontWeight: '500',
  },
  faqA: {
    color: 'rgba(209,250,229,0.8)',
    fontSize: wp('3.2%'),
    marginTop: hp('0.7%'),
    lineHeight: hp('2.2%'),
  },

  /* ─── Overlay ─── */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },

  /* ─── Modal ─── */
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
  modalIconWrap: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  modalTitle: {
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.7%'),
  },
  modalBody: {
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontSize: wp('3.2%'),
    marginBottom: hp('2%'),
    lineHeight: hp('2.2%'),
  },
  modalBtnWrap: {
    borderRadius: wp('10%'),
    overflow: 'hidden',
    width: '100%',
  },
  modalBtn: {
    borderRadius: wp('10%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.3%'),
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.8%'),
  },
});
