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
  StatusBar,
  Platform,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import fleetService from '../services/fleetService';
import locationService from '../services/locationService';
import api, { BASE_URL } from '../api';

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

const BikeFleetScreen = () => {
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

  // Get params from navigation (if coming from BikeBookingScreen or BikeRentalScreen)
  const passedLocation = route.params?.location || null;
  const passedLocationId = route.params?.locationId || null;
  const passedPickupDate = route.params?.pickupDate || null;
  const passedDropDate = route.params?.dropDate || null;

  // State for search
  const [locationQuery, setLocationQuery] = useState(passedLocation?.name || '');
  const [selectedLocation, setSelectedLocation] = useState(passedLocation);
  const [allLocations, setAllLocations] = useState([]);
  const [serviceLocationIds, setServiceLocationIds] = useState(new Set());
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationNotServed, setLocationNotServed] = useState(false);

  // State for dates - Use passed dates if available, otherwise default
  const [pickupDate, setPickupDate] = useState(() => {
    if (passedPickupDate) {
      return new Date(passedPickupDate);
    }
    return new Date();
  });
  const [dropDate, setDropDate] = useState(() => {
    if (passedDropDate) {
      return new Date(passedDropDate);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropTime, setDropTime] = useState('10:00');

  // State for bikes
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    category: null,
    brand: null,
    sort: 'price_low',
    minPrice: null,
    maxPrice: null,
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000 },
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for booking
  const [selectedBike, setSelectedBike] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // State for phone collection
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);

  // Check B2B status on mount
  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const c = JSON.parse(data);
        if (c.isB2B === true && c.b2bStatus === 'APPROVED') setIsB2BCustomer(true);
      }
    })();
  }, []);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Auto-search if location is passed
  useEffect(() => {
    if (passedLocation && passedLocationId) {
      setSelectedLocation({ id: passedLocationId, name: passedLocation.name || passedLocation, slug: passedLocation.slug });
      setLocationQuery(passedLocation.name || passedLocation);
      handleSearch(passedLocation.slug || passedLocation.name || passedLocation);
    }
  }, [passedLocation, passedLocationId]);

  const fetchLocations = async () => {
    try {
      const [allRes, serviceRes] = await Promise.all([
        locationService.getLocations(),
        locationService.getLocations('CITY', false, 'bike-on-rent'),
      ]);
      if (allRes?.locations) {
        setAllLocations(allRes.locations);
      }
      if (serviceRes?.locations) {
        setServiceLocationIds(new Set(serviceRes.locations.map(l => l.id)));
      }
    } catch (err) {
      console.log('Error fetching locations:', err);
    }
  };

  const handleLocationInput = (text) => {
    setLocationQuery(text);
    setSelectedLocation(null);

    if (text.length > 0) {
      const filtered = allLocations.filter(loc =>
        loc.name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowLocationDropdown(true);
    } else {
      setFilteredLocations(allLocations);
      setShowLocationDropdown(false);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setLocationQuery(location.name);
    setShowLocationDropdown(false);
    if (serviceLocationIds.size > 0 && !serviceLocationIds.has(location.id)) {
      setLocationNotServed(true);
    } else {
      setLocationNotServed(false);
    }
  };

  const openPickupDatePicker = () => {
    DateTimePickerAndroid.open({
      value: pickupDate,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          setPickupDate(date);
          // If drop date is before pickup, adjust it
          if (dropDate <= date) {
            const newDrop = new Date(date);
            newDrop.setDate(newDrop.getDate() + 1);
            setDropDate(newDrop);
          }
          // Open time picker
          DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'time',
            is24Hour: true,
            onChange: (evt, time) => {
              if (evt.type === 'set' && time) {
                const hours = time.getHours().toString().padStart(2, '0');
                const mins = time.getMinutes().toString().padStart(2, '0');
                setPickupTime(`${hours}:${mins}`);
              }
            },
          });
        }
      },
    });
  };

  const openDropDatePicker = () => {
    DateTimePickerAndroid.open({
      value: dropDate,
      mode: 'date',
      minimumDate: pickupDate,
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          setDropDate(date);
          // Open time picker
          DateTimePickerAndroid.open({
            value: new Date(),
            mode: 'time',
            is24Hour: true,
            onChange: (evt, time) => {
              if (evt.type === 'set' && time) {
                const hours = time.getHours().toString().padStart(2, '0');
                const mins = time.getMinutes().toString().padStart(2, '0');
                setDropTime(`${hours}:${mins}`);
              }
            },
          });
        }
      },
    });
  };

  const handleSearch = async (locationSlugOverride = null) => {
    const locationToSearch = locationSlugOverride || selectedLocation?.slug || selectedLocation?.name;

    if (!locationToSearch) {
      setError('Please select a location');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fleetService.getBikesByLocation(locationToSearch, filters);

      if (response?.bikes) {
        setBikes(response.bikes);
        setAvailableFilters(response.filters || availableFilters);
      } else {
        setBikes([]);
      }
    } catch (err) {
      console.log('Error fetching bikes:', err);
      setError(err.response?.data?.error || 'Failed to fetch bikes. Please try again.');
      setBikes([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!selectedLocation) return;
    setRefreshing(true);
    await handleSearch();
    setRefreshing(false);
  }, [selectedLocation, filters]);

  const applyFilters = () => {
    setShowFilterModal(false);
    handleSearch();
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      brand: null,
      sort: 'price_low',
      minPrice: null,
      maxPrice: null,
    });
  };

  const openBookingModal = (bike) => {
    setSelectedBike(bike);
    setSelectedVendor(bike.vendorPrices?.[0] || null); // Select cheapest by default
    setShowBookingModal(true);
  };

  const calculateDays = () => {
    const diffTime = Math.abs(dropDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  };

  const handleBooking = async () => {
    if (!selectedBike) {
      alert('Please select a bike');
      return;
    }

    setBookingLoading(true);

    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const customerData = await AsyncStorage.getItem('customer');
      const customer = customerData ? JSON.parse(customerData) : {};

      if (!customerId) {
        alert('Please login to continue');
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

      // Create Quote Request (broadcast to all vendors)
      const quoteRequestData = {
        customerId,
        customerName: customer.name || '',
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        vehicleModelId: selectedBike.id,
        vehicleModelName: selectedBike.name,
        vehicleBrand: selectedBike.brandName,
        vehicleCategory: selectedBike.categorySlug || '',
        vehicleCategoryName: selectedBike.categoryName || '',
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime: pickupTime,
        dropDate: dropDate.toISOString().split('T')[0],
        dropTime: dropTime,
        helmetsRequired: 1,
        budgetMin: selectedBike.lowestPrice || null,
        budgetMax: selectedBike.lowestPrice ? selectedBike.lowestPrice * 1.5 : null,
        customerNotes: '',
      };

      const response = await fleetService.createBikeQuoteRequest(quoteRequestData);

      if (response?.success || response?.quoteRequest) {
        setShowBookingModal(false);
        navigation.navigate('BookingConfirmation', {
          booking_id: response?.quoteRequest?.requestNumber || response?.quoteRequest?.id || 'TRX-' + Date.now(),
          service_name: 'Bike Rental',
          service_type: 'bike',
        });
      }
    } catch (err) {
      console.log('Quote request error:', err);
      alert(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      alert('Please enter a valid phone number');
      return;
    }

    // Validate phone number (basic validation for 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      alert('Please enter a valid 10-digit phone number');
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
        handleBooking();
      }
    } catch (error) {
      console.error('Phone update error:', error);
      alert(error.response?.data?.error || 'Failed to update phone number. Please try again.');
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const renderBikeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bikeCard}
      onPress={() => openBookingModal(item)}
      activeOpacity={0.85}
    >
      <View style={styles.bikeImageContainer}>
        {item.sideImage ? (
          <Image
            source={{ uri: getImageUrl(item.sideImage) }}
            style={styles.bikeImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <View style={styles.noImageIconWrap}>
              <Ionicons name="bicycle" size={wp('12%')} color={TEXT_MUTED} />
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

      <View style={styles.bikeInfo}>
        <Text style={styles.bikeBrand}>{item.brandName}</Text>
        <Text style={styles.bikeName} numberOfLines={2}>{item.name}</Text>

        <View style={styles.bikeSpecs}>
          {item.engineCC && (
            <View style={styles.specItem}>
              <View style={styles.specIconWrap}>
                <Ionicons name="speedometer-outline" size={wp('3.2%')} color={TEAL} />
              </View>
              <Text style={styles.specText}>{item.engineCC}cc</Text>
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

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <View style={styles.priceValueWrap}>
            <Text style={styles.priceCurrency}>&#8377;</Text>
            <Text style={styles.price}>{item.lowestPrice}</Text>
            <Text style={styles.priceUnit}>/day</Text>
          </View>
        </View>

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
            <Text style={styles.bookBtnText}>View & Book</Text>
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
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
                maxLength={10}
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
            {/* Bike Image */}
            <View style={styles.bookingBikeImage}>
              {selectedBike?.sideImage ? (
                <Image
                  source={{ uri: getImageUrl(selectedBike.sideImage) }}
                  style={styles.modalBikeImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <View style={styles.noImageIconWrap}>
                    <Ionicons name="bicycle" size={wp('16%')} color={TEXT_MUTED} />
                  </View>
                </View>
              )}
            </View>

            {/* Bike Details */}
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingBikeName}>
                {selectedBike?.brandName} {selectedBike?.name}
              </Text>

              {/* Bike Specifications */}
              <View style={styles.bikeSpecsRow}>
                {selectedBike?.engineCC && (
                  <View style={styles.specBadge}>
                    <Ionicons name="speedometer" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedBike.engineCC}cc</Text>
                  </View>
                )}
                {selectedBike?.fuelType && (
                  <View style={styles.specBadge}>
                    <Ionicons name="water" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedBike.fuelType}</Text>
                  </View>
                )}
                {selectedBike?.transmission && (
                  <View style={styles.specBadge}>
                    <Ionicons name="cog" size={wp('3.2%')} color={TEAL_MID} />
                    <Text style={styles.specBadgeText}>{selectedBike.transmission}</Text>
                  </View>
                )}
              </View>

              {/* Rental Duration */}
              <View style={styles.bookingDateRow}>
                <View style={styles.bookingDateItem}>
                  <View style={styles.dateIconCircle}>
                    <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
                  </View>
                  <Text style={styles.bookingDateLabel}>Pickup</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(pickupDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{pickupTime}</Text>
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
                  <Text style={styles.bookingTimeValue}>{dropTime}</Text>
                </View>
              </View>

              <View style={styles.durationBox}>
                <Ionicons name="time-outline" size={wp('4%')} color={TEAL_MID} />
                <Text style={styles.durationText}>
                  {calculateDays()} Day{calculateDays() > 1 ? 's' : ''} Rental
                </Text>
              </View>
            </View>

            {/* Pricing Info */}
            <View style={styles.pricingInfo}>
              <Text style={styles.sectionTitle}>Estimated Price</Text>
              <View style={styles.priceRangeBox}>
                <LinearGradient
                  colors={[TEAL_DEEP, TEAL_MID]}
                  style={styles.priceRangeGradient}
                >
                  <Text style={styles.priceStartingLabel}>Starting from</Text>
                  <Text style={styles.priceRangeText}>
                    &#8377;{(selectedBike?.lowestPrice * calculateDays()).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.priceNote}>for {calculateDays()} day{calculateDays() > 1 ? 's' : ''}</Text>
                </LinearGradient>
              </View>
              <View style={styles.vendorCountWrap}>
                <Ionicons name="people-circle-outline" size={wp('4.5%')} color={TEAL} />
                <Text style={styles.vendorCountText}>
                  {selectedBike?.vendorCount || 0} vendor{selectedBike?.vendorCount > 1 ? 's' : ''} available
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
                <Text style={styles.stepText}>Submit your request for this bike</Text>
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
                <Text style={styles.stepText}>Pay advance & confirm your booking</Text>
              </View>
            </View>
          </ScrollView>

          {isB2BCustomer && (
            <View style={{ marginHorizontal: wp('4%'), marginBottom: hp('1.5%'), backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: wp('3%'), padding: wp('3.5%'), flexDirection: 'row', alignItems: 'flex-start', gap: wp('2.5%') }}>
              <Ionicons name="alert-circle" size={wp('5%')} color="#EA580C" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: wp('3.3%'), fontWeight: '700', color: '#9A3412', marginBottom: 3 }}>Advance Payment Required</Text>
                <Text style={{ fontSize: wp('2.9%'), color: '#C2410C', lineHeight: wp('4.2%') }}>Bike Rental is not covered under your B2B agreement. This booking will not be counted as a B2B booking — advance payment will be required before confirmation.</Text>
              </View>
            </View>
          )}

          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={[styles.confirmBookingBtnWrap, bookingLoading && styles.disabledBtn]}
              onPress={handleBooking}
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
                    <Ionicons name="send-outline" size={wp('4.5%')} color="#fff" />
                    <Text style={styles.confirmBookingBtnText}>Request Quotes from All Vendors</Text>
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
            <Text style={styles.headerTitle}>Rent a Bike</Text>
            {selectedLocation?.name && (
              <Text style={styles.headerSubtitle}>{selectedLocation.name}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterHeaderBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.searchSection}>
        {/* Location Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputIconWrap}>
            <Ionicons name="location" size={wp('4%')} color={TEAL} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Select pickup location"
            value={locationQuery}
            onChangeText={handleLocationInput}
            onFocus={() => setShowLocationDropdown(true)}
            placeholderTextColor={TEXT_MUTED}
          />
        </View>

        {/* Location Dropdown */}
        {showLocationDropdown && filteredLocations.length > 0 && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {filteredLocations.slice(0, 10).map(loc => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.dropdownItem}
                  onPress={() => selectLocation(loc)}
                >
                  <View style={styles.dropdownIconWrap}>
                    <Ionicons name="location" size={wp('3.5%')} color={TEAL} />
                  </View>
                  <Text style={styles.dropdownText}>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location not served message */}
        {locationNotServed && (
          <View style={styles.notServedBanner}>
            <Ionicons name="information-circle" size={wp('4.5%')} color="#D97706" />
            <Text style={styles.notServedText}>We are not currently providing our services in this location.</Text>
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBox} onPress={openPickupDatePicker}>
            <View style={styles.dateIconWrap}>
              <Ionicons name="calendar" size={wp('3.5%')} color={TEAL} />
            </View>
            <View style={styles.dateTextWrap}>
              <Text style={styles.dateLabel}>Pickup</Text>
              <Text style={styles.dateValue}>{formatDate(pickupDate)}</Text>
              <Text style={styles.timeValue}>{pickupTime}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dateArrowSmall}>
            <Ionicons name="arrow-forward" size={wp('4%')} color={TEAL} />
          </View>

          <TouchableOpacity style={styles.dateBox} onPress={openDropDatePicker}>
            <View style={[styles.dateIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="calendar" size={wp('3.5%')} color="#EF4444" />
            </View>
            <View style={styles.dateTextWrap}>
              <Text style={styles.dateLabel}>Drop</Text>
              <Text style={styles.dateValue}>{formatDate(dropDate)}</Text>
              <Text style={styles.timeValue}>{dropTime}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchBtnWrap, loading && styles.disabledBtn]}
          onPress={() => handleSearch()}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? [TEXT_MUTED, TEXT_MUTED] : [TEAL_MID, TEAL]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={wp('4.5%')} color="#fff" />
                <Text style={styles.searchBtnText}>Search Bikes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {error && (
          <View style={styles.errorBox}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="alert-circle" size={wp('6%')} color="#EF4444" />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtnWrap} onPress={() => handleSearch()}>
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

        {!hasSearched && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <LinearGradient
                colors={[TEAL_DEEP, TEAL_MID]}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="bicycle-outline" size={wp('12%')} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Find Your Perfect Ride</Text>
            <Text style={styles.emptyText}>
              Select a location and dates to browse available bikes
            </Text>
          </View>
        )}

        {hasSearched && bikes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <LinearGradient
                colors={[TEAL_DEEP, TEAL_MID]}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="sad-outline" size={wp('12%')} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No Bikes Found</Text>
            <Text style={styles.emptyText}>
              Try a different location or adjust your filters
            </Text>
          </View>
        )}

        {bikes.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {bikes.length} Bike{bikes.length > 1 ? 's' : ''} Available
              </Text>
              <View style={styles.resultsAccent} />
            </View>
            <FlatList
              data={bikes}
              renderItem={renderBikeCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.bikesList}
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
    </SafeAreaView>
  );
};

/* ===================================================================
   STYLES -- Premium Dark Teal Design System
   =================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* -- Header -- */
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

  /* -- Search Section -- */
  searchSection: {
    backgroundColor: CARD,
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('5%'),
    ...SHADOW_MD,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    minHeight: hp('6.5%'),
    gap: wp('2.5%'),
  },
  inputIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: hp('8%'),
    left: wp('4%'),
    right: wp('4%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    ...SHADOW_MD,
    zIndex: 100,
    maxHeight: hp('25%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  dropdownScroll: {
    maxHeight: hp('25%'),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    gap: wp('2.5%'),
  },
  dropdownIconWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    padding: wp('3%'),
    borderWidth: 1.5,
    borderColor: BORDER,
    gap: wp('2.5%'),
  },
  dateIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTextWrap: {
    flex: 1,
  },
  dateLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: hp('0.2%'),
  },
  timeValue: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
    fontWeight: '500',
  },
  dateArrowSmall: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnWrap: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  searchBtn: {
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    ...SHADOW_TEAL,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* -- Results -- */
  resultsContainer: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    marginTop: hp('1%'),
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
  bikesList: {
    paddingBottom: hp('3%'),
  },

  /* -- Bike Card -- */
  bikeCard: {
    backgroundColor: CARD,
    borderRadius: wp('5%'),
    marginBottom: hp('2%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    ...SHADOW_MD,
  },
  bikeImageContainer: {
    height: hp('22%'),
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  bikeImage: {
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
  bikeInfo: {
    padding: wp('4%'),
  },
  bikeBrand: {
    fontSize: wp('2.8%'),
    color: TEAL_MID,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  bikeName: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: hp('0.3%'),
  },
  bikeSpecs: {
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

  /* -- Empty State -- */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('8%'),
  },
  emptyIconCircle: {
    marginBottom: hp('2%'),
  },
  emptyIconGradient: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: TEAL_DEEP, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
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

  /* -- Error -- */
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

  /* -- Modal Shared -- */
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

  /* -- Filter Modal -- */
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

  /* -- Booking Modal -- */
  bookingModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  bookingContent: {
    padding: wp('5%'),
  },
  bookingBikeImage: {
    height: hp('22%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalBikeImage: {
    width: '100%',
    height: '100%',
  },
  bookingDetails: {
    marginBottom: hp('2%'),
  },
  bookingBikeName: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  bikeSpecsRow: {
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

  /* -- Phone Modal -- */
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
  disabledBtn: {
    opacity: 0.6,
  },
  notServedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: wp('3%'),
    marginBottom: hp('1%'),
  },
  notServedText: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: '#92400E',
    fontWeight: '500',
    lineHeight: wp('4.5%'),
  },
});

export default BikeFleetScreen;
