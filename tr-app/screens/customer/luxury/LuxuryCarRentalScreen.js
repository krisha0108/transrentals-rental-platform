import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api';

const { width } = Dimensions.get('window');
// Light Mode Colors
const AMBER = '#F59E0B';
const AMBER_DARK = '#D97706';
const AMBER_LIGHT = '#FEF3C7';
const GREEN = '#09B368';
const BG = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E5E7EB';

export default function LuxuryCarRentalScreen() {
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Customer data
  const [customerData, setCustomerData] = useState(null);

  // Form state
  const [tripType, setTripType] = useState('local'); // local, outstation, airport
  const [occasion, setOccasion] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('sedan');
  const [specificModel, setSpecificModel] = useState('');
  const [passengers, setPassengers] = useState('4');

  // Route
  const [pickupCity, setPickupCity] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropCity, setDropCity] = useState('');
  const [dropAddress, setDropAddress] = useState('');

  // Dates & Time
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState(null);
  const [returnTime, setReturnTime] = useState('10:00');
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showPickupTimePicker, setShowPickupTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);

  // Package (for local trips)
  const [packageType, setPackageType] = useState('4hrs-40km');

  // Requirements
  const [requirements, setRequirements] = useState('');
  const [needDecoration, setNeedDecoration] = useState(false);
  const [decorationType, setDecorationType] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [luxuryFleet, setLuxuryFleet] = useState([]);

  // Phone collection state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState('pickup'); // 'pickup' or 'drop'
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    loadCustomerData();
    fetchLuxuryFleet();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const fetchLuxuryFleet = async () => {
    try {
      setFleetLoading(true);
      const response = await api.get('/customer/luxury-fleet', {
        params: { featured: true },
      });
      if (response.data.success) {
        setLuxuryFleet(response.data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching luxury fleet:', error);
    } finally {
      setFleetLoading(false);
    }
  };

  const fetchLocations = async (searchQuery = '') => {
    try {
      setLocationsLoading(true);
      const response = await api.get('/services/luxury-car-rental/locations', {
        params: { q: searchQuery, limit: 50 },
      });
      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  const openLocationPicker = (type) => {
    setLocationPickerType(type);
    setLocationSearch('');
    setShowLocationPicker(true);
    fetchLocations('');
  };

  const selectLocation = (location) => {
    if (locationPickerType === 'pickup') {
      setPickupCity(location.name);
    } else {
      setDropCity(location.name);
    }
    setShowLocationPicker(false);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const TRIP_TYPES = [
    { id: 'local', label: 'Local', icon: 'city', desc: '4-12 hours package' },
    { id: 'outstation', label: 'Outstation', icon: 'road-variant', desc: 'Multi-day trips' },
    { id: 'airport', label: 'Airport', icon: 'airplane', desc: 'Pick-up/Drop' },
  ];

  const OCCASIONS = [
    { id: 'wedding', label: 'Wedding', icon: 'ring' },
    { id: 'corporate', label: 'Corporate', icon: 'briefcase' },
    { id: 'party', label: 'Party', icon: 'party-popper' },
    { id: 'photoshoot', label: 'Photoshoot', icon: 'camera' },
    { id: 'airport', label: 'Airport Transfer', icon: 'airplane' },
    { id: 'date', label: 'Date Night', icon: 'heart' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal-circle' },
  ];

  const VEHICLE_CATEGORIES = [
    { id: 'sedan', label: 'Luxury Sedan', desc: 'BMW 5, Mercedes E-Class', icon: 'car-sports' },
    { id: 'suv', label: 'Luxury SUV', desc: 'BMW X5, Audi Q7', icon: 'car-estate' },
    { id: 'super', label: 'Super Luxury', desc: 'BMW 7, Mercedes S-Class', icon: 'car-luxury' },
    { id: 'exotic', label: 'Exotic Cars', desc: 'Ferrari, Lamborghini', icon: 'fire' },
  ];

  const PACKAGES = [
    { id: '4hrs-40km', label: '4 Hours / 40 KM' },
    { id: '8hrs-80km', label: '8 Hours / 80 KM' },
    { id: '12hrs-120km', label: '12 Hours / 120 KM' },
  ];

  const DECORATION_TYPES = [
    { id: 'floral', label: 'Floral Decoration', icon: 'flower' },
    { id: 'ribbon', label: 'Ribbon & Balloons', icon: 'balloon' },
    { id: 'premium', label: 'Premium Package', icon: 'star' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!customerData) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    // Check if phone number is missing
    if (!customerData.phone || customerData.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    if (!pickupCity.trim()) {
      Alert.alert('Error', 'Please enter pickup city');
      return;
    }

    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }

    if (tripType === 'outstation' && !dropCity.trim()) {
      Alert.alert('Error', 'Please enter drop city for outstation trip');
      return;
    }

    if (tripType === 'outstation' && !returnDate) {
      Alert.alert('Error', 'Please select return date for outstation trip');
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerId: customerData.id,
        tripType,
        occasion: occasion || null,
        vehicleCategory,
        vehicleCategoryName: VEHICLE_CATEGORIES.find(v => v.id === vehicleCategory)?.label,
        passengers: parseInt(passengers) || 4,
        specificModel: specificModel.trim() || null,
        pickupCity: pickupCity.trim(),
        pickupAddress: pickupAddress.trim(),
        dropCity: tripType === 'outstation' ? dropCity.trim() : null,
        dropAddress: tripType === 'outstation' ? dropAddress.trim() : null,
        pickupDate: pickupDate.toISOString(),
        pickupTime,
        returnDate: returnDate ? returnDate.toISOString() : null,
        returnTime: returnDate ? returnTime : null,
        packageType: tripType === 'local' ? packageType : null,
        requirements: requirements.trim() || null,
        needChauffeur: true,
        needDecoration,
        decorationType: needDecoration ? decorationType : null,
      };

      const response = await api.post('/customer/luxury-quote-requests', requestData);

      if (response.data.success) {
        Alert.alert(
          'Success!',
          `Quote request submitted successfully!\n\nRequest Number: ${response.data.quoteRequest.requestNumber}\n\nVendors will send you quotes within 24-48 hours.`,
          [
            {
              text: 'View My Requests',
              onPress: () => navigation.navigate('MyLuxuryQuotes'),
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting luxury quote request:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Validate phone number (basic validation for 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneLoading(true);

    try {
      // Update phone via API
      const response = await api.put('/customer/profile', {
        customerId: customerData.id,
        phone: phoneNumber.trim(),
      });

      if (response.data.success) {
        // Update local storage and state
        const updatedCustomer = { ...customerData, phone: phoneNumber.trim() };
        setCustomerData(updatedCustomer);
        await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));

        // Close phone modal and proceed with booking
        setShowPhoneModal(false);
        setPhoneNumber('');

        // Retry submission
        handleSubmit();
      }
    } catch (error) {
      console.error('Phone update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update phone number. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time) => {
    return time || '10:00';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[AMBER, AMBER_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Luxury Car Rental</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#1F2937', '#374151', AMBER_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <MaterialCommunityIcons name="crown" size={48} color={AMBER} style={styles.crownIcon} />
            <Text style={styles.heroTitle}>Luxury Experience</Text>
            <Text style={styles.heroSubtitle}>BMW • Mercedes • Audi • Ferrari</Text>
              <TouchableOpacity
          onPress={() => navigation.navigate('MyLuxuryBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Featured Fleet Preview */}
        {!fleetLoading && luxuryFleet.length > 0 && (
          <View style={styles.fleetPreview}>
            <Text style={styles.sectionTitle}>Premium Collection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fleetScroll}>
              {luxuryFleet.slice(0, 5).map((vehicle) => (
                <View key={vehicle.id} style={styles.fleetCard}>
                  {vehicle.primaryImage ? (
                    <Image source={{ uri: vehicle.primaryImage }} style={styles.fleetImage} />
                  ) : (
                    <View style={[styles.fleetImage, styles.fleetPlaceholder]}>
                      <MaterialCommunityIcons name="car-luxury" size={40} color={AMBER} />
                    </View>
                  )}
                  <Text style={styles.fleetName} numberOfLines={1}>{vehicle.name}</Text>
                  <Text style={styles.fleetPrice}>₹{vehicle.price.toLocaleString('en-IN')}/day</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trip Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Trip Type</Text>
          <View style={styles.chipGrid}>
            {TRIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.tripTypeCard,
                  tripType === type.id && styles.tripTypeCardActive,
                ]}
                onPress={() => setTripType(type.id)}
              >
                <MaterialCommunityIcons
                  name={type.icon}
                  size={32}
                  color={tripType === type.id ? AMBER : TEXT_SECONDARY}
                />
                <Text style={[styles.tripTypeLabel, tripType === type.id && styles.tripTypeLabelActive]}>
                  {type.label}
                </Text>
                <Text style={styles.tripTypeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Occasion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occasion (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                style={[styles.chip, occasion === occ.id && styles.chipActive]}
                onPress={() => setOccasion(occasion === occ.id ? '' : occ.id)}
              >
                <MaterialCommunityIcons
                  name={occ.icon}
                  size={18}
                  color={occasion === occ.id ? AMBER_DARK : TEXT_SECONDARY}
                />
                <Text style={[styles.chipText, occasion === occ.id && styles.chipTextActive]}>
                  {occ.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Category</Text>
          {VEHICLE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.vehicleCategoryCard,
                vehicleCategory === cat.id && styles.vehicleCategoryCardActive,
              ]}
              onPress={() => setVehicleCategory(cat.id)}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={28}
                color={vehicleCategory === cat.id ? AMBER : TEXT_SECONDARY}
              />
              <View style={styles.vehicleCategoryInfo}>
                <Text style={[styles.vehicleCategoryLabel, vehicleCategory === cat.id && styles.vehicleCategoryLabelActive]}>
                  {cat.label}
                </Text>
                <Text style={styles.vehicleCategoryDesc}>{cat.desc}</Text>
              </View>
              {vehicleCategory === cat.id && (
                <MaterialCommunityIcons name="check-circle" size={24} color={AMBER} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Specific Model Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Model (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., BMW 7 Series, Mercedes S-Class"
            placeholderTextColor={TEXT_SECONDARY}
            value={specificModel}
            onChangeText={setSpecificModel}
          />
        </View>

        {/* Passengers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Passengers</Text>
          <View style={styles.passengerRow}>
            {['2', '4', '6', '7+'].map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.passengerBtn, passengers === count && styles.passengerBtnActive]}
                onPress={() => setPassengers(count)}
              >
                <Text style={[styles.passengerText, passengers === count && styles.passengerTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pickup Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Details</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => openLocationPicker('pickup')}
          >
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={pickupCity ? TEXT_PRIMARY : TEXT_SECONDARY} />
              <Text style={[styles.inputText, !pickupCity && styles.placeholder]}>
                {pickupCity || 'Select Pickup City *'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
            </View>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Pickup Address (with landmark) *"
            placeholderTextColor={TEXT_SECONDARY}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Drop Details (for outstation) */}
        {tripType === 'outstation' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Drop Details</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => openLocationPicker('drop')}
            >
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color={dropCity ? TEXT_PRIMARY : TEXT_SECONDARY} />
                <Text style={[styles.inputText, !dropCity && styles.placeholder]}>
                  {dropCity || 'Select Drop City *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
              </View>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Drop Address (with landmark)"
              placeholderTextColor={TEXT_SECONDARY}
              value={dropAddress}
              onChangeText={setDropAddress}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowPickupDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={AMBER} />
              <Text style={styles.dateTimeText}>{formatDate(pickupDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowPickupTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={AMBER} />
              <Text style={styles.dateTimeText}>{formatTime(pickupTime)}</Text>
            </TouchableOpacity>
          </View>

          {showPickupDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPickupDatePicker(Platform.OS === 'ios');
                if (selectedDate) setPickupDate(selectedDate);
              }}
            />
          )}

          {showPickupTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowPickupTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  const hours = selectedTime.getHours().toString().padStart(2, '0');
                  const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                  setPickupTime(`${hours}:${minutes}`);
                }
              }}
            />
          )}
        </View>

        {/* Return Date & Time (for outstation/round trip) */}
        {tripType === 'outstation' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Return Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowReturnDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={AMBER} />
                <Text style={styles.dateTimeText}>{formatDate(returnDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowReturnTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={AMBER} />
                <Text style={styles.dateTimeText}>{formatTime(returnTime)}</Text>
              </TouchableOpacity>
            </View>

            {showReturnDatePicker && (
              <DateTimePicker
                value={returnDate || pickupDate}
                mode="date"
                display="default"
                minimumDate={pickupDate}
                onChange={(event, selectedDate) => {
                  setShowReturnDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setReturnDate(selectedDate);
                }}
              />
            )}

            {showReturnTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowReturnTimePicker(Platform.OS === 'ios');
                  if (selectedTime) {
                    const hours = selectedTime.getHours().toString().padStart(2, '0');
                    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                    setReturnTime(`${hours}:${minutes}`);
                  }
                }}
              />
            )}
          </View>
        )}

        {/* Package (for local trips) */}
        {tripType === 'local' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Package</Text>
            {PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  packageType === pkg.id && styles.packageCardActive,
                ]}
                onPress={() => setPackageType(pkg.id)}
              >
                <Text style={[styles.packageLabel, packageType === pkg.id && styles.packageLabelActive]}>
                  {pkg.label}
                </Text>
                {packageType === pkg.id && (
                  <MaterialCommunityIcons name="check-circle" size={22} color={AMBER} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Decoration */}
        <View style={styles.section}>
          <View style={styles.decorationHeader}>
            <Text style={styles.sectionTitle}>Car Decoration</Text>
            <TouchableOpacity
              style={styles.toggleSwitch}
              onPress={() => {
                setNeedDecoration(!needDecoration);
                if (!needDecoration) setDecorationType('');
              }}
            >
              <View style={[styles.toggleTrack, needDecoration && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, needDecoration && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {needDecoration && (
            <View style={styles.decorationOptions}>
              {DECORATION_TYPES.map((dec) => (
                <TouchableOpacity
                  key={dec.id}
                  style={[
                    styles.decorationCard,
                    decorationType === dec.id && styles.decorationCardActive,
                  ]}
                  onPress={() => setDecorationType(dec.id)}
                >
                  <MaterialCommunityIcons
                    name={dec.icon}
                    size={24}
                    color={decorationType === dec.id ? AMBER : TEXT_SECONDARY}
                  />
                  <Text style={[styles.decorationText, decorationType === dec.id && styles.decorationTextActive]}>
                    {dec.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Special Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requirements (Optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Any special requests or requirements..."
            placeholderTextColor={TEXT_SECONDARY}
            value={requirements}
            onChangeText={setRequirements}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? [TEXT_SECONDARY, TEXT_SECONDARY] : [AMBER, AMBER_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color={TEXT_PRIMARY} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={22} color="#000" />
                <Text style={styles.submitText}>Request Quotes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            {/* Header */}
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>
                {locationPickerType === 'pickup' ? 'Select Pickup City' : 'Select Drop City'}
              </Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.locationSearchContainer}>
              <Ionicons name="search" size={20} color={TEXT_SECONDARY} />
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search city..."
                placeholderTextColor={TEXT_SECONDARY}
                value={locationSearch}
                onChangeText={(text) => {
                  setLocationSearch(text);
                  fetchLocations(text);
                }}
              />
            </View>

            {/* Locations List */}
            {locationsLoading ? (
              <View style={styles.locationLoadingContainer}>
                <ActivityIndicator size="large" color={AMBER} />
                <Text style={styles.locationLoadingText}>Loading locations...</Text>
              </View>
            ) : locations.length === 0 ? (
              <View style={styles.locationEmptyContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color={TEXT_SECONDARY} />
                <Text style={styles.locationEmptyText}>No locations available</Text>
                <Text style={styles.locationEmptySubtext}>
                  {locationSearch ? 'Try a different search term' : 'Please contact support'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationItem}
                    onPress={() => selectLocation(item)}
                  >
                    <MaterialCommunityIcons name="map-marker" size={22} color={AMBER} />
                    <View style={styles.locationItemContent}>
                      <Text style={styles.locationItemName}>{item.displayName || item.name}</Text>
                      {item.state && (
                        <Text style={styles.locationItemState}>{item.state}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={TEXT_SECONDARY} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.locationItemSeparator} />}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Phone Collection Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.phoneModal}>
            <View style={styles.phoneModalHeader}>
              <Text style={styles.phoneModalTitle}>Add Phone Number</Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.phoneModalContent}>
              <Ionicons name="call-outline" size={60} color={AMBER} style={styles.phoneIcon} />
              <Text style={styles.phoneModalText}>
                We need your phone number to process your luxury car booking request and send you quotes from vendors.
              </Text>

              <View style={styles.phoneInputGroup}>
                <Ionicons name="call" size={20} color={AMBER} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                  placeholderTextColor={TEXT_SECONDARY}
                />
              </View>

              <TouchableOpacity
                style={[styles.phoneSubmitBtn, phoneLoading && styles.phoneSubmitBtnDisabled]}
                onPress={handlePhoneSubmit}
                disabled={phoneLoading}
              >
                {phoneLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.phoneSubmitBtnText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    height: 200,
    marginBottom: 24,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownIcon: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  fleetPreview: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  fleetScroll: {
    paddingLeft: 20,
  },
  fleetCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fleetImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#E5E7EB',
  },
  fleetPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fleetName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  fleetPrice: {
    fontSize: 12,
    color: AMBER,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  tripTypeCard: {
    width: (width - 48) / 3,
    aspectRatio: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tripTypeCardActive: {
    borderColor: AMBER,
    backgroundColor: '#FEF3C7',
  },
  tripTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginTop: 8,
  },
  tripTypeLabelActive: {
    color: AMBER,
  },
  tripTypeDesc: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  chipRow: {
    paddingLeft: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  chipActive: {
    backgroundColor: AMBER + '20',
    borderColor: AMBER,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  chipTextActive: {
    color: AMBER,
  },
  vehicleCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCategoryCardActive: {
    borderColor: AMBER,
    backgroundColor: '#FEF3C7',
  },
  vehicleCategoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleCategoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  vehicleCategoryLabelActive: {
    color: AMBER,
  },
  vehicleCategoryDesc: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  input: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: TEXT_PRIMARY,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passengerRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  passengerBtn: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  passengerBtnActive: {
    borderColor: AMBER,
    backgroundColor: '#FEF3C7',
  },
  passengerText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  passengerTextActive: {
    color: AMBER,
  },
  dateTimeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardActive: {
    borderColor: AMBER,
    backgroundColor: '#FEF3C7',
  },
  packageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  packageLabelActive: {
    color: AMBER,
  },
  decorationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toggleSwitch: {
    padding: 4,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: AMBER,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TEXT_PRIMARY,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  decorationOptions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  decorationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  decorationCardActive: {
    borderColor: AMBER,
    backgroundColor: '#FEF3C7',
  },
  decorationText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  decorationTextActive: {
    color: AMBER,
  },
  submitBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  // Location Picker Styles
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  placeholder: {
    color: TEXT_SECONDARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModal: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_PRIMARY,
    padding: 0,
  },
  locationLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  locationLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  locationEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  locationEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginTop: 12,
  },
  locationEmptySubtext: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  locationItemContent: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  locationItemState: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  locationItemSeparator: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: 20,
  },
  phoneModal: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    width: '100%',
  },
  phoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  phoneModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  phoneModalContent: {
    padding: 24,
    alignItems: 'center',
  },
  phoneIcon: {
    marginBottom: 16,
  },
  phoneModalText: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  phoneSubmitBtn: {
    backgroundColor: AMBER,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  phoneSubmitBtnDisabled: {
    opacity: 0.6,
  },
  phoneSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
