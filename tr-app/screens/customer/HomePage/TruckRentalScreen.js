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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { locationService, bookingService } from '../../services';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

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
  const dropdownRef = useRef(null);

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


const handleOutsideClick = () => {
  setShowSuggestions(false); 
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
        customerEmail: customerData?.email || 'customer@transrentals.in',
        customerPhone: customerData?.phone || '',
        serviceType: serviceType === 'personal' ? 'personal' : 'commercial',
        vehicleCategory: selectedTruckType,
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Truck Rental</Text>
        <View style={{ width: 40 }} />
          <TouchableOpacity
          onPress={() => navigation.navigate('MyTruckBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Book Your Truck</Text>
              <Text style={styles.formDesc}>
                Fill details once, get multiple quotes from vendors.
              </Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.securePillText}>Secure</Text>
            </View>
          </View>

          
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.serviceTypeBar}>
            <TouchableOpacity
              onPress={() => setServiceType('personal')}
              activeOpacity={0.9}
              style={[styles.serviceTypeTab, serviceType === 'personal' && styles.serviceTypeTabActive]}
            >
              <View style={styles.serviceTypeIconCircle}>
                <Ionicons name="person-outline" size={15} color="#0F172A" />
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
              <View style={styles.serviceTypeIconCircle}>
                <Ionicons name="business-outline" size={15} color="#0F172A" />
              </View>
              <Text style={[styles.serviceTypeTitle, serviceType === 'commercial' && styles.serviceTypeTitleActive]}>
                Commercial Use
              </Text>
              <Text style={styles.serviceTypeSub}>Business, Goods etc.</Text>
            </TouchableOpacity>
          </View>

          
<View style={styles.locationBlock}>
  
  <Text style={styles.smallLabel}>Pickup Location</Text>
  <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
    <Ionicons name="location-outline" size={18} color="#0F172A" />
    <TextInput
      value={query.length ? query : pickupLocation}
      onChangeText={handleInputChange}
      placeholder="Enter pickup location"
      placeholderTextColor="#94A3B8"
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
        <Ionicons name="close-circle" size={24} color="#CBD5F5" />
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

  
  <Text style={[styles.smallLabel, { marginTop: 14 }]}>Destination</Text>
  <TouchableOpacity activeOpacity={0.9} style={styles.locationRow}>
    <Ionicons name="flag-outline" size={18} color="#0F172A" />
    <TextInput
      value={destination}
      onChangeText={setDestination}
      placeholder="Enter destination location"
      placeholderTextColor="#94A3B8"
      style={styles.locationInput}
       onFocus={() => setShowSuggestions(true)}  
    />
  </TouchableOpacity>
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

   
          <Text style={[styles.label, { marginTop: 16 }]}>Select Truck Type</Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={[styles.dropdownButton, showTruckDropdown && styles.dropdownButtonActive]}
              onPress={() => setShowTruckDropdown(!showTruckDropdown)}
              activeOpacity={0.8}
            >
              <Text style={selectedTruckType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                {selectedTruckType || 'Select Truck Type'}
              </Text>
              <Ionicons
                name={showTruckDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
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
                      <Text style={styles.dropdownItemText}>{type.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

         
          <Text style={[styles.label, { marginTop: 16 }]}>
            Select Goods Type
          </Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={[styles.dropdownButton, showGoodsDropdown && styles.dropdownButtonActive]}
              onPress={() => setShowGoodsDropdown(!showGoodsDropdown)}
              activeOpacity={0.8}
            >
              <Text style={selectedGoodsType ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
                {selectedGoodsType || 'Select Goods Type'}
              </Text>
              <Ionicons
                name={showGoodsDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
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
                      <Text style={styles.dropdownItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

       
          <Text style={[styles.label, { marginTop: 16 }]}>
            Enter Weight
          </Text>
          <View style={styles.weightRow}>
            <View style={[styles.inputPill, { flex: 1 }]}>
              <Ionicons name="barbell-outline" size={15} color="#64748B" />
              <TextInput
                value={weightVal}
                onChangeText={setWeightVal}
                placeholder="Weight (e.g. 1500)"
                placeholderTextColor="#9CA3AF"
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

       
          <Text style={[styles.label, { marginTop: 16 }]}>
            Any Other Details
          </Text>
          <TextInput
            style={styles.textArea}
            value={otherDetails}
            onChangeText={setOtherDetails}
            placeholder="Additional info"
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

      
      <Modal
        visible={isPhoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Phone Number Required</Text>
            <Text style={styles.modalBody}>
              Please add your phone number to complete the booking process.
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
    marginTop: 10,
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
    marginLeft: -50,
  },
  securePillText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },

  serviceTypeBar: {
    flexDirection: 'row',
    backgroundColor: '#EFF3F6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  serviceTypeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 70,
    justifyContent: 'center',
  },
  serviceTypeTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(9,179,104,0.25)',
    borderRadius: 14,
    elevation: 1,
  },
  serviceTypeIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(9,179,104,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  serviceTypeTitleActive: {
    color: '#0F172A',
  },
  serviceTypeSub: {
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
      position: 'relative', 

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
    top: 90, 
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
suggestionText: { 
  color: '#0F172A',
  fontSize: 14,
},
noResult: { 
  padding: 10, 
  textAlign: 'center', 
  color: '#94A3B8',
  fontSize: 14,
},

  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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

  dropdownWrapper: {
    position: 'relative',
    marginBottom: 8,
    width: '100%',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 15,
    paddingVertical: 15,
    minHeight: 56,
  },
  dropdownButtonActive: {
    borderColor: GREEN,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownButtonPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 5,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  dropdownScrollView: {
    width: '100%',
    maxHeight: 200,
  },
  dropdownScrollContent: {
    paddingVertical: 5,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemActive: {
    backgroundColor: '#F8FAFC',
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
  inputText: { flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 2 },

  weightRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },

  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    minHeight: 84,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
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
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 998, 
},

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