import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DateTimePicker from '@react-native-community/datetimepicker';
import fleetService from '../../services/fleetService';
import api, { BASE_URL } from '../../api';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';

/* ── Premium Dark Teal Design System ── */
const TEAL_DEEP = '#064E3B';
const TEAL_MID = '#065F46';
const TEAL = '#10B981';
const TEAL_LIGHT = '#D1FAE5';
const BG = '#F0FDF4';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';
const TEXT_MUTED = '#94A3B8';
const BORDER = '#E2E8F0';
const DIVIDER = '#F1F5F9';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
  android: { elevation: 6 },
});
const SHADOW_TEAL = Platform.select({
  ios: { shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 12 },
  android: { elevation: 8 },
});

const SelfDriveFleetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // StatusBar management
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

  // Get params from navigation (from SelfDriveScreen)
  const locationId = route.params?.locationId;
  const locationName = route.params?.locationName || '';
  const passedPickupDate = route.params?.pickupDate;
  const passedDropDate = route.params?.dropDate;

  const [showBookingAlert, setShowBookingAlert] = useState(false);

  // Dates
  const [pickupDate, setPickupDate] = useState(() => passedPickupDate ? new Date(passedPickupDate) : new Date());
  const [dropDate, setDropDate] = useState(() => {
    if (passedDropDate) return new Date(passedDropDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

  // Date picker state (Android)
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [datePickerTarget, setDatePickerTarget] = useState('pickup');

  // State for cars
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // State for filters
  const [filters, setFilters] = useState({
    category: null,
    brand: null,
    sort: 'price_low',
    minPrice: null,
    maxPrice: null,
    transmission: null,
    fuelType: null,
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000 },
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');

  // State for booking modal
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // State for B2B (Personal vs Company)
  const [bookingType, setBookingType] = useState('personal'); // 'personal' or 'company'
  const [numberOfVehicles, setNumberOfVehicles] = useState('1');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);

  // State for home delivery
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');

  // State for phone collection
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Check if customer is B2B approved
  useEffect(() => {
    const checkB2B = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customer');
        if (customerData) {
          const customer = JSON.parse(customerData);
          if (customer.isB2B && customer.b2bStatus === 'APPROVED') {
            setIsB2BCustomer(true);
          }
        }
      } catch (e) {}
    };
    checkB2B();
  }, []);

  // Fetch cars on mount
  useEffect(() => {
    if (locationId) {
      fetchCars();
    } else {
      setError('Location not provided');
      setLoading(false);
    }
  }, [locationId]);

  const fetchCars = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fleetService.getSelfDriveCarsByLocation(locationId, filters);

      if (response?.cars) {
        setCars(response.cars);
        setAvailableFilters(response.filters || availableFilters);
      } else {
        setCars([]);
      }
    } catch (err) {
      console.log('Error fetching cars:', err);
      setError(err.response?.data?.error || 'Failed to fetch cars. Please try again.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCars();
    setRefreshing(false);
  }, [locationId, filters]);

  const applyFilters = () => {
    setShowFilterModal(false);
    fetchCars();
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: null,
      brand: null,
      sort: 'price_low',
      minPrice: null,
      maxPrice: null,
      transmission: null,
      fuelType: null,
    };
    setFilters(clearedFilters);
  };

  const openBookingModal = (car) => {
    if (isPickupTooSoon(pickupDate)) {
      setShowBookingAlert(true);
      return;
    }
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  const calculateDays = () => {
    const start = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const end = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate());
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const calculateTotalPrice = (car) => {
    const days = calculateDays();
    const baseTotal = car.lowestPrice * days;
    let discount = 0;
    let discountLabel = '';

    if (days >= 28 && car.monthlyDiscount > 0) {
      discount = car.monthlyDiscount;
      discountLabel = `${car.monthlyDiscount}% monthly discount`;
    } else if (days >= 7 && car.weeklyDiscount > 0) {
      discount = car.weeklyDiscount;
      discountLabel = `${car.weeklyDiscount}% weekly discount`;
    }

    const discountAmount = Math.round(baseTotal * discount / 100);
    const finalPrice = baseTotal - discountAmount;

    return { baseTotal, finalPrice, discountAmount, discountLabel, discount };
  };

  const handleRequestQuote = async () => {
    if (!selectedCar) {
      Alert.alert('Error', 'Please select a car');
      return;
    }

    setBookingLoading(true);

    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const customerData = await AsyncStorage.getItem('customer');
      const customer = customerData ? JSON.parse(customerData) : {};

      if (!customerId) {
        Alert.alert('Login Required', 'Please login to continue');
        navigation.navigate('Login');
        setBookingLoading(false);
        return;
      }

      // Check if phone number is missing
      if (!customer.phone || customer.phone.trim() === '') {
        setBookingLoading(false);
        setShowPhoneModal(true);
        return;
      }

      // Create Quote Request
      const quoteRequestData = {
        customerId,
        customerName: customer.name || '',
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        vehicleModelId: selectedCar.id,
        vehicleModelName: selectedCar.name,
        vehicleBrand: selectedCar.brandName,
        vehicleCategory: selectedCar.categoryId || '',
        vehicleCategoryName: selectedCar.categoryName || '',
        transmission: selectedCar.transmission,
        fuelType: selectedCar.fuelType,
        minSeats: selectedCar.seatingCapacity,
        locationId: locationId,
        locationName: locationName,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime: pickupDate.toTimeString().slice(0, 5),
        dropDate: dropDate.toISOString().split('T')[0],
        dropTime: dropDate.toTimeString().slice(0, 5),
        budgetMin: selectedCar.lowestPrice || null,
        budgetMax: selectedCar.highestPrice || null,
        isDeliveryRequested,
        pickupAddress: isDeliveryRequested ? pickupAddress : null,
        customerNotes: '',
      };

      // Add B2B fields if booking type is company
      if (bookingType === 'company' && isB2BCustomer) {
        quoteRequestData.isB2B = true;
        quoteRequestData.numberOfVehicles = numberOfVehicles || '1';
        quoteRequestData.numberOfPersons = numberOfPersons || null;
      }

      const response = await fleetService.createSelfDriveQuoteRequest(quoteRequestData);

      if (response?.success || response?.quoteRequest || response?.booking) {
        setShowBookingModal(false);
        setIsDeliveryRequested(false);
        setPickupAddress('');
        setBookingType('personal');
        setNumberOfVehicles('1');
        setNumberOfPersons('');

        // B2B flow → navigate to B2B booking detail
        if (response?.isB2B && response?.booking) {
          navigation.navigate('B2BBookingDetail', {
            bookingId: response.booking.id,
          });
        } else {
          // Regular flow → booking confirmation
          navigation.navigate('BookingConfirmation', {
            booking_id: response?.quoteRequest?.requestNumber || response?.quoteRequest?.id || 'TRX-' + Date.now(),
            service_name: 'Self Drive Car',
            service_type: 'self-drive',
          });
        }
      }
    } catch (err) {
      console.log('Quote request error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setBookingLoading(false);
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
      const customerId = await AsyncStorage.getItem('customer_id');

      // Update phone via API
      const response = await api.put('/customer/profile', {
        customerId,
        phone: phoneNumber.trim(),
      });

      if (response.data.success) {
        // Update local storage
        const customerData = await AsyncStorage.getItem('customer');
        const customer = customerData ? JSON.parse(customerData) : {};
        customer.phone = phoneNumber.trim();
        await AsyncStorage.setItem('customer', JSON.stringify(customer));

        // Close phone modal and proceed with booking
        setShowPhoneModal(false);
        setPhoneNumber('');

        // Retry booking
        handleRequestQuote();
      }
    } catch (error) {
      console.log('Phone update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update phone number. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openDatePicker = (target) => {
    setDatePickerTarget(target);
    setDatePickerMode('date');
    setDatePickerVisible(true);
  };

  const onDatePickerChange = (event, selected) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }
    if (!selected) {
      setDatePickerVisible(false);
      return;
    }

    if (datePickerMode === 'date') {
      // Date selected, now ask for time
      const current = datePickerTarget === 'pickup' ? pickupDate : dropDate;
      const merged = new Date(
        selected.getFullYear(), selected.getMonth(), selected.getDate(),
        current.getHours(), current.getMinutes()
      );
      if (datePickerTarget === 'pickup') {
        setPickupDate(merged);
        if (dropDate <= merged) {
          const newDrop = new Date(merged);
          newDrop.setDate(newDrop.getDate() + 1);
          setDropDate(newDrop);
        }
      } else {
        if (merged > pickupDate) {
          setDropDate(merged);
        } else {
          Alert.alert('Invalid Date', 'Drop date must be after pickup date');
          setDatePickerVisible(false);
          return;
        }
      }
      setDatePickerMode('time');
      setDatePickerVisible(true);
      return;
    }

    if (datePickerMode === 'time') {
      if (datePickerTarget === 'pickup') {
        const upd = new Date(pickupDate);
        upd.setHours(selected.getHours(), selected.getMinutes());
        if (isPickupTooSoon(upd)) {
          setDatePickerVisible(false);
          setShowBookingAlert(true);
          return;
        }
        setPickupDate(upd);
        if (dropDate <= upd) {
          const newDrop = new Date(upd);
          newDrop.setDate(newDrop.getDate() + 1);
          setDropDate(newDrop);
        }
      } else {
        const upd = new Date(dropDate);
        upd.setHours(selected.getHours(), selected.getMinutes());
        setDropDate(upd);
      }
      setDatePickerVisible(false);
    }
  };

  // Extract unique transmission and fuel types from loaded cars for filter options
  const availableTransmissions = [...new Set(cars.map(c => c.transmission).filter(Boolean))];
  const availableFuelTypes = [...new Set(cars.map(c => c.fuelType).filter(Boolean))];

  // Filter cars based on search query + client-side filters (transmission, fuelType)
  const filteredCars = cars.filter(car => {
    // Transmission filter
    if (filters.transmission && car.transmission !== filters.transmission) return false;
    // Fuel type filter
    if (filters.fuelType && car.fuelType !== filters.fuelType) return false;
    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (car.name || '').toLowerCase();
    const brand = (car.brandName || '').toLowerCase();
    const category = (car.categoryName || '').toLowerCase();
    return name.includes(q) || brand.includes(q) || category.includes(q);
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const renderCarCard = ({ item }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => openBookingModal(item)}
      activeOpacity={0.85}
    >
      <View style={styles.carImageContainer}>
        {item.sideImage ? (
          <Image
            source={{ uri: getImageUrl(item.sideImage) }}
            style={styles.carImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <View style={styles.noImageIconWrap}>
              <Ionicons name="car-sport" size={wp('12%')} color={TEXT_MUTED} />
            </View>
          </View>
        )}
        {item.vendorCount > 1 && (
          <View style={styles.vendorBadge}>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.vendorBadgeGradient}
            >
              <Ionicons name="people" size={wp('3%')} color="#fff" />
              <Text style={styles.vendorBadgeText}>{item.vendorCount} Vendors</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.carInfo}>
        <Text style={styles.carBrand}>{item.brandName}</Text>
        <Text style={styles.carName}>{item.name}</Text>

        <View style={styles.carSpecs}>
          {item.seatingCapacity && (
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Ionicons name="people-outline" size={wp('3.2%')} color={TEAL} />
              </View>
              <Text style={styles.specText}>{item.seatingCapacity} Seats</Text>
            </View>
          )}
          {item.transmission && (
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Ionicons name="cog-outline" size={wp('3.2%')} color={TEAL} />
              </View>
              <Text style={styles.specText}>{item.transmission}</Text>
            </View>
          )}
          {item.fuelType && (
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Ionicons name="water-outline" size={wp('3.2%')} color={TEAL} />
              </View>
              <Text style={styles.specText}>{item.fuelType}</Text>
            </View>
          )}
        </View>

        {(() => {
          const p = calculateTotalPrice(item);
          return (
            <View style={{ marginTop: hp('1.5%'), paddingTop: hp('1.5%'), borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              {/* Price Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: wp('2.8%'), color: TEXT_MUTED, fontWeight: '500' }}>
                    {calculateDays()} day{calculateDays() > 1 ? 's' : ''} · &#8377;{item.lowestPrice}/day
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  {p.discount > 0 && (
                    <Text style={{ fontSize: wp('3.2%'), color: TEXT_MUTED, textDecorationLine: 'line-through', marginRight: wp('1.5%') }}>
                      &#8377;{p.baseTotal.toLocaleString('en-IN')}
                    </Text>
                  )}
                  <Text style={{ fontSize: wp('3.8%'), fontWeight: '800', color: TEAL }}>&#8377;</Text>
                  <Text style={{ fontSize: wp('5.2%'), fontWeight: '900', color: TEAL }}>{p.finalPrice.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              {/* Discount Badge */}
              {p.discount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('0.8%'), backgroundColor: '#F0FDF4', borderRadius: wp('2%'), paddingHorizontal: wp('2.5%'), paddingVertical: hp('0.5%'), alignSelf: 'flex-end' }}>
                  <Ionicons name="pricetag" size={wp('3%')} color="#16A34A" style={{ marginRight: wp('1%') }} />
                  <Text style={{ fontSize: wp('2.7%'), color: '#16A34A', fontWeight: '700' }}>
                    {p.discountLabel} · Save &#8377;{p.discountAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}

        <TouchableOpacity
          style={styles.bookBtnWrap}
          onPress={() => openBookingModal(item)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[TEAL_MID, TEAL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtn}
          >
            <Ionicons name="document-text-outline" size={wp('4%')} color="#fff" />
            <Text style={styles.bookBtnText}>Request Quote</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          {/* Accent stripe */}
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.modalAccentStripe} />

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Ionicons name="options" size={wp('4.5%')} color={TEAL} />
              </View>
              <Text style={styles.modalTitle}>Filters</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowFilterModal(false)}
            >
              <Ionicons name="close" size={wp('5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Sort */}
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterOptions}>
              {[
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
                { value: 'name', label: 'Name' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    filters.sort === option.value && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, sort: option.value })}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.sort === option.value && styles.filterChipTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Categories */}
            {availableFilters.categories?.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !filters.category && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, category: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      !filters.category && styles.filterChipTextActive,
                    ]}>All</Text>
                  </TouchableOpacity>
                  {availableFilters.categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.filterChip,
                        filters.category === cat.slug && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, category: cat.slug })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.category === cat.slug && styles.filterChipTextActive,
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Brands */}
            {availableFilters.brands?.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Brand</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !filters.brand && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, brand: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      !filters.brand && styles.filterChipTextActive,
                    ]}>All</Text>
                  </TouchableOpacity>
                  {availableFilters.brands.map(brand => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.filterChip,
                        filters.brand === brand.slug && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, brand: brand.slug })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.brand === brand.slug && styles.filterChipTextActive,
                      ]}>
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Transmission */}
            {availableTransmissions.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Transmission</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !filters.transmission && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, transmission: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      !filters.transmission && styles.filterChipTextActive,
                    ]}>All</Text>
                  </TouchableOpacity>
                  {availableTransmissions.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.filterChip,
                        filters.transmission === t && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, transmission: t })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.transmission === t && styles.filterChipTextActive,
                      ]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Fuel Type */}
            {availableFuelTypes.length > 0 && (
              <>
                <Text style={styles.filterLabel}>Fuel Type</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      !filters.fuelType && styles.filterChipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, fuelType: null })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      !filters.fuelType && styles.filterChipTextActive,
                    ]}>All</Text>
                  </TouchableOpacity>
                  {availableFuelTypes.map(ft => (
                    <TouchableOpacity
                      key={ft}
                      style={[
                        styles.filterChip,
                        filters.fuelType === ft && styles.filterChipActive,
                      ]}
                      onPress={() => setFilters({ ...filters, fuelType: ft })}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.fuelType === ft && styles.filterChipTextActive,
                      ]}>
                        {ft}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtnWrap} onPress={applyFilters}>
              <LinearGradient
                colors={[TEAL_MID, TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPhoneModal = () => (
    <Modal
      visible={showPhoneModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPhoneModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.phoneModal}>
          {/* Accent stripe */}
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.modalAccentStripe} />

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Ionicons name="call" size={wp('4.5%')} color={TEAL} />
              </View>
              <Text style={styles.modalTitle}>Add Phone Number</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPhoneModal(false)}
            >
              <Ionicons name="close" size={wp('5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.phoneModalContent}>
            <View style={styles.phoneIconCircle}>
              <LinearGradient
                colors={[TEAL_DEEP, TEAL_MID]}
                style={styles.phoneIconGradient}
              >
                <Ionicons name="call-outline" size={wp('8%')} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.phoneModalText}>
              We need your phone number to process your booking request and send you quotes from vendors.
            </Text>

            <View style={styles.phoneInputGroup}>
              <View style={styles.phoneInputIcon}>
                <Ionicons name="call" size={wp('4.5%')} color={TEAL} />
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter your 10-digit phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={TEXT_MUTED}
                autoFocus={true}
              />
            </View>

            <TouchableOpacity
              style={[styles.phoneSubmitBtnWrap, phoneLoading && styles.disabledBtn]}
              onPress={handlePhoneSubmit}
              disabled={phoneLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={phoneLoading ? [TEXT_MUTED, TEXT_MUTED] : [TEAL_MID, TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.phoneSubmitBtn}
              >
                {phoneLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.phoneSubmitBtnText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBookingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bookingModal}>
          {/* Accent stripe */}
          <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.modalAccentStripe} />

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Ionicons name="document-text" size={wp('4.5%')} color={TEAL} />
              </View>
              <Text style={styles.modalTitle}>Request Quote</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowBookingModal(false)}
            >
              <Ionicons name="close" size={wp('5%')} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingContent} showsVerticalScrollIndicator={false}>
            {/* Car Image */}
            <View style={styles.bookingCarImage}>
              {selectedCar?.sideImage ? (
                <Image
                  source={{ uri: getImageUrl(selectedCar.sideImage) }}
                  style={styles.modalCarImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <View style={styles.noImageIconWrap}>
                    <Ionicons name="car-sport" size={wp('16%')} color={TEXT_MUTED} />
                  </View>
                </View>
              )}
            </View>

            {/* Car Details */}
            <View style={styles.bookingDetails}>
              <Text style={{ fontSize: wp('3%'), color: TEXT_MUTED, fontWeight: '500', marginBottom: hp('0.2%') }}>{selectedCar?.brandName}</Text>
              <Text style={styles.bookingCarName}>
                {selectedCar?.name}
              </Text>

              <View style={styles.carSpecsRow}>
                {selectedCar?.seatingCapacity && (
                  <View style={styles.specBadge}>
                    <Ionicons name="people" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedCar.seatingCapacity} Seats</Text>
                  </View>
                )}
                {selectedCar?.transmission && (
                  <View style={styles.specBadge}>
                    <Ionicons name="cog" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedCar.transmission}</Text>
                  </View>
                )}
                {selectedCar?.fuelType && (
                  <View style={styles.specBadge}>
                    <Ionicons name="water" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedCar.fuelType}</Text>
                  </View>
                )}
              </View>

              <View style={styles.bookingDateRow}>
                <View style={styles.bookingDateItem}>
                  <View style={styles.dateIconCircle}>
                    <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
                  </View>
                  <Text style={styles.bookingDateLabel}>Pickup</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(pickupDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{formatTime(pickupDate)}</Text>
                </View>
                <View style={styles.dateArrowWrap}>
                  <Ionicons name="arrow-forward" size={wp('4.5%')} color={TEAL} />
                </View>
                <View style={styles.bookingDateItem}>
                  <View style={[styles.dateIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="calendar-outline" size={wp('4%')} color="#EF4444" />
                  </View>
                  <Text style={styles.bookingDateLabel}>Drop</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(dropDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{formatTime(dropDate)}</Text>
                </View>
              </View>

              <View style={styles.durationBox}>
                <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.durationText}>
                  {calculateDays()} Day{calculateDays() > 1 ? 's' : ''} Rental
                </Text>
              </View>
            </View>

            {/* Personal or Company - only shown for B2B approved customers */}
            {isB2BCustomer && (
              <View style={styles.bookingTypeSection}>
                <Text style={styles.sectionTitle}>Booking For</Text>
                <View style={styles.bookingTypeToggle}>
                  <TouchableOpacity
                    style={[styles.bookingTypeBtn, bookingType === 'personal' && styles.bookingTypeBtnActive]}
                    onPress={() => setBookingType('personal')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person" size={wp('4%')} color={bookingType === 'personal' ? '#fff' : TEAL_MID} />
                    <Text style={[styles.bookingTypeBtnText, bookingType === 'personal' && styles.bookingTypeBtnTextActive]}>Personal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bookingTypeBtn, bookingType === 'company' && styles.bookingTypeBtnActive]}
                    onPress={() => setBookingType('company')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="business" size={wp('4%')} color={bookingType === 'company' ? '#fff' : TEAL_MID} />
                    <Text style={[styles.bookingTypeBtnText, bookingType === 'company' && styles.bookingTypeBtnTextActive]}>For Company</Text>
                  </TouchableOpacity>
                </View>

                {bookingType === 'company' && (
                  <View style={styles.b2bFields}>
                    <View style={styles.b2bFieldRow}>
                      <View style={styles.b2bField}>
                        <Text style={styles.b2bFieldLabel}>
                          <Ionicons name="car-sport" size={wp('3%')} color={TEAL_MID} /> Number of Vehicles *
                        </Text>
                        <View style={styles.b2bInputWrap}>
                          <TouchableOpacity
                            style={styles.b2bStepBtn}
                            onPress={() => {
                              const v = Math.max(1, parseInt(numberOfVehicles || '1') - 1);
                              setNumberOfVehicles(String(v));
                            }}
                          >
                            <Ionicons name="remove" size={wp('4%')} color={TEAL_MID} />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.b2bInput}
                            value={numberOfVehicles}
                            onChangeText={(t) => setNumberOfVehicles(t.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            textAlign="center"
                            maxLength={3}
                          />
                          <TouchableOpacity
                            style={styles.b2bStepBtn}
                            onPress={() => {
                              const v = Math.min(500, parseInt(numberOfVehicles || '1') + 1);
                              setNumberOfVehicles(String(v));
                            }}
                          >
                            <Ionicons name="add" size={wp('4%')} color={TEAL_MID} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.b2bField}>
                        <Text style={styles.b2bFieldLabel}>
                          <Ionicons name="people" size={wp('3%')} color={TEAL_MID} /> No. of Persons
                        </Text>
                        <View style={styles.b2bInputWrap}>
                          <TextInput
                            style={[styles.b2bInput, { flex: 1 }]}
                            value={numberOfPersons}
                            onChangeText={(t) => setNumberOfPersons(t.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            placeholder="Optional"
                            placeholderTextColor={TEXT_MUTED}
                            textAlign="center"
                            maxLength={4}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.b2bInfoPill}>
                      <Ionicons name="information-circle" size={wp('3.5%')} color={TEAL_MID} />
                      <Text style={styles.b2bInfoText}>Company booking - post-paid billing, no advance required</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Home Delivery Option */}
            <View style={styles.deliverySection}>
              <Text style={styles.sectionTitle}>Delivery Option</Text>
              <TouchableOpacity
                style={styles.deliveryCheckRow}
                onPress={() => setIsDeliveryRequested(!isDeliveryRequested)}
                activeOpacity={0.7}
              >
                <View style={[styles.deliveryCheckbox, isDeliveryRequested && styles.deliveryCheckboxChecked]}>
                  {isDeliveryRequested && (
                    <Ionicons name="checkmark" size={wp('3.5%')} color="#fff" />
                  )}
                </View>
                <Ionicons name="car-outline" size={wp('4.5%')} color={TEAL_MID} />
                <Text style={styles.deliveryCheckText}>Request home delivery</Text>
              </TouchableOpacity>

              {isDeliveryRequested && (
                <View style={styles.deliveryAddressWrap}>
                  <Text style={styles.deliveryAddressLabel}>
                    <Ionicons name="location-outline" size={wp('3.5%')} color={TEXT_SECONDARY} /> Delivery Address
                  </Text>
                  <TextInput
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    placeholder="Enter your delivery address..."
                    placeholderTextColor={TEXT_MUTED}
                    style={styles.deliveryAddressInput}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}
            </View>

            {/* Pricing Info */}
            <View style={styles.pricingInfo}>
              <Text style={styles.sectionTitle}>Estimated Price</Text>
              {(() => {
                const p = selectedCar ? calculateTotalPrice(selectedCar) : null;
                if (!p) return null;
                return (
                  <View style={styles.priceRangeBox}>
                    <LinearGradient
                      colors={[TEAL_DEEP, TEAL_MID]}
                      style={styles.priceRangeGradient}
                    >
                      <Text style={styles.priceStartingLabel}>Starting from</Text>
                      <Text style={styles.priceRangeText}>
                        &#8377;{p.finalPrice.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.priceNote}>for {calculateDays()} day{calculateDays() > 1 ? 's' : ''} (&#8377;{selectedCar.lowestPrice}/day)</Text>
                      {p.discount > 0 && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: wp('2%'), paddingHorizontal: wp('3%'), paddingVertical: hp('0.4%'), marginTop: hp('0.5%') }}>
                          <Text style={{ color: '#fff', fontSize: wp('2.8%'), fontWeight: '600', textAlign: 'center' }}>
                            {p.discountLabel} — You save &#8377;{p.discountAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                );
              })()}
              <View style={styles.vendorCountWrap}>
                <Ionicons name="people-circle-outline" size={wp('4.5%')} color={TEAL} />
                <Text style={styles.vendorCountText}>
                  {selectedCar?.vendorCount} vendor{selectedCar?.vendorCount > 1 ? 's' : ''} available
                </Text>
              </View>
            </View>

            {/* How it works */}
            <View style={styles.howItWorks}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.stepItem}>
                <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </LinearGradient>
                <Text style={styles.stepText}>Submit your request for this car</Text>
              </View>
              <View style={styles.stepItem}>
                <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </LinearGradient>
                <Text style={styles.stepText}>Vendors send you their best quotes</Text>
              </View>
              <View style={styles.stepItem}>
                <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </LinearGradient>
                <Text style={styles.stepText}>Compare & accept the best offer</Text>
              </View>
              <View style={styles.stepItem}>
                <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </LinearGradient>
                <Text style={styles.stepText}>{bookingType === 'company' ? 'Accept quote & get vehicles assigned' : 'Pay advance & confirm your booking'}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={[styles.confirmBookingBtnWrap, bookingLoading && styles.disabledBtn]}
              onPress={handleRequestQuote}
              disabled={bookingLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={bookingLoading ? [TEXT_MUTED, TEXT_MUTED] : [TEAL_MID, TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBookingBtn}
              >
                {bookingLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={bookingType === 'company' ? 'business-outline' : 'send-outline'} size={wp('4.5%')} color="#fff" />
                    <Text style={styles.confirmBookingBtnText}>
                      {bookingType === 'company'
                        ? `Request B2B Quote (${numberOfVehicles} Vehicle${parseInt(numberOfVehicles) > 1 ? 's' : ''})`
                        : 'Request Quotes from Vendors'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />

      {/* Header with Dark Teal Gradient */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { top: -wp('8%'), right: -wp('5%'), width: wp('26%'), height: wp('26%') }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -wp('4%'), left: -wp('4%'), width: wp('16%'), height: wp('16%') }]} pointerEvents="none" />

        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={wp('5.5%')} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Self Drive Cars</Text>
            <Text style={styles.headerSubtitle}>{locationName}</Text>
          </View>
          <TouchableOpacity
            style={styles.filterHeaderBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={wp('5%')} color="#FFF" />
            {(filters.category || filters.brand || filters.transmission || filters.fuelType) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[filters.category, filters.brand, filters.transmission, filters.fuelType].filter(Boolean).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Date Summary — Tap to change */}
      <View style={styles.dateSummary}>
        <View style={styles.dateSummaryCard}>
          <TouchableOpacity style={styles.dateSummaryItem} onPress={() => openDatePicker('pickup')} activeOpacity={0.7}>
            <View style={styles.dateSummaryIconWrap}>
              <Ionicons name="calendar" size={wp('3.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.dateSummaryLabel}>Pickup</Text>
              <Text style={styles.dateSummaryText}>{formatDate(pickupDate)}</Text>
              <Text style={{ fontSize: wp('2.5%'), color: TEAL, fontWeight: '600', marginTop: hp('0.2%') }}>Tap to change</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dateSummaryArrow}>
            <Ionicons name="arrow-forward" size={wp('4%')} color={TEAL} />
          </View>

          <TouchableOpacity style={styles.dateSummaryItem} onPress={() => openDatePicker('drop')} activeOpacity={0.7}>
            <View style={[styles.dateSummaryIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="calendar" size={wp('3.5%')} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.dateSummaryLabel}>Drop</Text>
              <Text style={styles.dateSummaryText}>{formatDate(dropDate)}</Text>
              <Text style={{ fontSize: wp('2.5%'), color: TEAL, fontWeight: '600', marginTop: hp('0.2%') }}>Tap to change</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>{calculateDays()} Day{calculateDays() > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {!loading && !error && cars.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={wp('4.5%')} color={TEAL} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by car name or category..."
              placeholderTextColor={TEXT_MUTED}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={wp('4.5%')} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loadingText}>Finding best cars for you...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="alert-circle" size={wp('6%')} color="#EF4444" />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtnWrap} onPress={fetchCars}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.retryBtn}
              >
                <Ionicons name="refresh" size={wp('4%')} color="#fff" />
                <Text style={styles.retryBtnText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && cars.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={wp('14%')} color={TEXT_MUTED} />
            </View>
            <Text style={styles.emptyTitle}>No Cars Available</Text>
            <Text style={styles.emptyText}>
              No self-drive cars are available at {locationName}. Try a different location.
            </Text>
          </View>
        )}

        {!loading && cars.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredCars.length} Car{filteredCars.length !== 1 ? 's' : ''} {searchQuery.trim() ? 'Found' : 'Available'}
              </Text>
              <View style={styles.resultsAccent} />
            </View>
            <FlatList
              data={filteredCars}
              renderItem={renderCarCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.carsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[TEAL]}
                  tintColor={TEAL}
                />
              }
            />
          </>
        )}
      </View>

      {renderFilterModal()}
      {renderBookingModal()}
      {renderPhoneModal()}

      {/* Android Date/Time Picker */}
      {datePickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={datePickerTarget === 'pickup' ? pickupDate : dropDate}
          mode={datePickerMode}
          display="default"
          onChange={onDatePickerChange}
          minimumDate={datePickerTarget === 'pickup' ? getMinBookingDate() : pickupDate}
        />
      )}
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
    </SafeAreaView>
  );
};

/* ═══════════════════════════════════════════════════════════
   STYLES -- Premium Dark Teal Design System
   ═══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ── Header ── */
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('1%'),
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.75)',
    marginTop: hp('0.3%'),
  },
  filterHeaderBtn: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterBadge: {
    position: 'absolute',
    top: -wp('1%'),
    right: -wp('1%'),
    backgroundColor: '#EF4444',
    borderRadius: wp('2.5%'),
    minWidth: wp('4.5%'),
    height: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('1%'),
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: wp('2.5%'),
    fontWeight: '700',
  },

  /* ── Date Summary ── */
  dateSummary: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  dateSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    ...SHADOW_SM,
  },
  dateSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateSummaryIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSummaryLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateSummaryText: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateSummaryArrow: {
    marginHorizontal: wp('3%'),
  },
  daysBadge: {
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('3%'),
    marginLeft: wp('2%'),
  },
  daysBadgeText: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    fontWeight: '700',
  },

  /* ── Search Bar ── */
  searchContainer: {
    paddingHorizontal: wp('4%'),
    marginTop: hp('0.5%'),
    marginBottom: hp('0.5%'),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: Platform.OS === 'ios' ? hp('1.8%') : hp('1.2%'),
    minHeight: hp('6.5%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp('2.5%'),
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
    paddingVertical: hp('0.8%'),
  },

  /* ── Results ── */
  resultsContainer: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: TEAL,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  resultsCount: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  resultsAccent: {
    flex: 1,
    height: 2,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 1,
  },
  carsList: {
    paddingBottom: hp('3%'),
  },

  /* ── Car Card ── */
  carCard: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    marginBottom: hp('2%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_MD,
  },
  carImageContainer: {
    height: hp('22%'),
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DIVIDER,
  },
  noImageIconWrap: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorBadge: {
    position: 'absolute',
    top: wp('3%'),
    right: wp('3%'),
  },
  vendorBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('3%'),
  },
  vendorBadgeText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontWeight: '700',
  },
  carInfo: {
    padding: wp('4%'),
  },
  carBrand: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  carName: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: hp('0.3%'),
  },
  carSpecs: {
    flexDirection: 'row',
    marginTop: hp('1.2%'),
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  specIconWrap: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specText: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1.5%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  priceLabel: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  priceValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEAL,
  },
  price: {
    fontSize: wp('5.5%'),
    fontWeight: '900',
    color: TEAL,
  },
  priceUnit: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  bookBtnWrap: {
    marginTop: hp('1.5%'),
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  bookBtn: {
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.6%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('2%'),
    ...SHADOW_TEAL,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Empty State ── */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
  },
  emptyIconCircle: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    backgroundColor: DIVIDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  emptyTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: hp('1%'),
  },
  emptyText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: hp('1%'),
    paddingHorizontal: wp('10%'),
    lineHeight: wp('5.2%'),
  },

  /* ── Error ── */
  errorBox: {
    alignItems: 'center',
    backgroundColor: CARD,
    padding: wp('6%'),
    borderRadius: wp('5%'),
    marginTop: hp('3%'),
    borderWidth: 1,
    borderColor: '#FECACA',
    ...SHADOW_SM,
  },
  errorIconCircle: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  errorText: {
    color: '#DC2626',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    lineHeight: wp('5%'),
    fontWeight: '500',
  },
  retryBtnWrap: {
    marginTop: hp('2%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },

  /* ── Modal Shared ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalAccentStripe: {
    height: hp('0.5%'),
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  modalTitleIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  modalCloseBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: DIVIDER,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Filter Modal ── */
  filterModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '70%',
    overflow: 'hidden',
  },
  filterContent: {
    padding: wp('5%'),
  },
  filterLabel: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: hp('1%'),
    marginTop: hp('2%'),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  filterChip: {
    backgroundColor: DIVIDER,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
  },
  filterChipText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: TEAL_MID,
    fontWeight: '700',
  },
  filterActions: {
    flexDirection: 'row',
    padding: wp('4%'),
    gap: wp('2.5%'),
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: CARD,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: wp('3.5%'),
    backgroundColor: CARD,
  },
  clearBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  applyBtnWrap: {
    flex: 2,
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  applyBtn: {
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    borderRadius: wp('3.5%'),
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.8%'),
  },

  /* ── Booking Modal ── */
  bookingModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  bookingContent: {
    padding: wp('5%'),
    flexShrink: 1,
  },
  bookingCarImage: {
    height: hp('22%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCarImage: {
    width: '100%',
    height: '100%',
  },
  bookingDetails: {
    marginBottom: hp('2%'),
  },
  bookingCarName: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  carSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('4%'),
    gap: wp('1.5%'),
  },
  specBadgeText: {
    fontSize: wp('3%'),
    color: TEAL_MID,
    fontWeight: '600',
  },
  bookingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  bookingDateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  dateArrowWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingDateLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingDateValue: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
  },
  bookingTimeValue: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
    fontWeight: '500',
  },
  durationBox: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    padding: wp('3%'),
    marginTop: hp('1.5%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('1.5%'),
  },
  durationText: {
    color: TEAL_MID,
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  // Booking Type (Personal / Company)
  bookingTypeSection: {
    backgroundColor: CARD,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  bookingTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: wp('3%'),
    padding: wp('1%'),
    gap: wp('1%'),
  },
  bookingTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.2%'),
    borderRadius: wp('2.5%'),
    gap: wp('1.5%'),
  },
  bookingTypeBtnActive: {
    backgroundColor: TEAL_MID,
    ...SHADOW_SM,
  },
  bookingTypeBtnText: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEAL_MID,
  },
  bookingTypeBtnTextActive: {
    color: '#fff',
  },
  b2bFields: {
    marginTop: hp('1.5%'),
  },
  b2bFieldRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  b2bField: {
    flex: 1,
  },
  b2bFieldLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: hp('0.5%'),
  },
  b2bInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    minHeight: hp('5.5%'),
    overflow: 'hidden',
  },
  b2bStepBtn: {
    width: wp('10%'),
    height: hp('5.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
  },
  b2bInput: {
    flex: 1,
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.8%'),
    textAlign: 'center',
  },
  b2bInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    marginTop: hp('1.2%'),
  },
  b2bInfoText: {
    fontSize: wp('2.8%'),
    color: TEAL_DEEP,
    fontWeight: '500',
    flex: 1,
  },

  deliverySection: {
    backgroundColor: CARD,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  deliveryCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
  },
  deliveryCheckbox: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('1.5%'),
    borderWidth: 2,
    borderColor: TEXT_MUTED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryCheckboxChecked: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  deliveryCheckText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  deliveryAddressWrap: {
    marginTop: hp('1.2%'),
  },
  deliveryAddressLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
    marginBottom: hp('0.5%'),
  },
  deliveryAddressInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    textAlignVertical: 'top',
    minHeight: hp('7%'),
  },
  pricingInfo: {
    backgroundColor: CARD,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  priceRangeBox: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
  },
  priceRangeGradient: {
    alignItems: 'center',
    paddingVertical: hp('2%'),
    borderRadius: wp('3.5%'),
  },
  priceStartingLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: hp('0.3%'),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priceRangeText: {
    fontSize: wp('6%'),
    fontWeight: '900',
    color: '#FFFFFF',
  },
  priceNote: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.75)',
    marginTop: hp('0.3%'),
    fontWeight: '500',
  },
  vendorCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
  },
  vendorCountText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  howItWorks: {
    backgroundColor: CARD,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_SM,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('3%'),
  },
  stepNumber: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_TEAL,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
    lineHeight: wp('5%'),
  },
  bookingActions: {
    padding: wp('4%'),
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    backgroundColor: CARD,
  },
  confirmBookingBtnWrap: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  confirmBookingBtn: {
    borderRadius: wp('3.5%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp('2%'),
    ...SHADOW_TEAL,
  },
  confirmBookingBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  /* ── Phone Modal ── */
  phoneModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '70%',
    width: '100%',
    overflow: 'hidden',
  },
  phoneModalContent: {
    padding: wp('6%'),
    alignItems: 'center',
  },
  phoneIconCircle: {
    marginBottom: hp('2%'),
  },
  phoneIconGradient: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  phoneModalText: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: hp('3%'),
    lineHeight: wp('5.5%'),
    fontWeight: '500',
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('2.5%'),
    width: '100%',
    borderWidth: 1.5,
    borderColor: BORDER,
    minHeight: hp('6.5%'),
    gap: wp('2.5%'),
  },
  phoneInputIcon: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('4%'),
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  phoneSubmitBtnWrap: {
    width: '100%',
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  phoneSubmitBtn: {
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
    ...SHADOW_TEAL,
  },
  phoneSubmitBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default SelfDriveFleetScreen;
