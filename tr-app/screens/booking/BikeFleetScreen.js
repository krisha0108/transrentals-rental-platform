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
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import fleetService from '../services/fleetService';
import locationService from '../services/locationService';
import api, { BASE_URL } from '../api';

const BikeFleetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get params from navigation (if coming from BikeBookingScreen or BikeRentalScreen)
  const passedLocation = route.params?.location || null;
  const passedLocationId = route.params?.locationId || null;
  const passedPickupDate = route.params?.pickupDate || null;
  const passedDropDate = route.params?.dropDate || null;

  // State for search
  const [locationQuery, setLocationQuery] = useState(passedLocation?.name || '');
  const [selectedLocation, setSelectedLocation] = useState(passedLocation);
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

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
      const response = await locationService.getLocations();
      if (response?.locations) {
        setAllLocations(response.locations);
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
        alert('Request submitted successfully! Vendors will send you quotes soon.');
        navigation.navigate('MyBikeBookings');
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
      activeOpacity={0.7}
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
            <Ionicons name="bicycle" size={60} color="#ccc" />
          </View>
        )}
        {item.vendorCount > 1 && (
          <View style={styles.vendorBadge}>
            <Text style={styles.vendorBadgeText}>{item.vendorCount} Vendors</Text>
          </View>
        )}
      </View>

      <View style={styles.bikeInfo}>
        <Text style={styles.bikeBrand}>{item.brandName}</Text>
        <Text style={styles.bikeName}>{item.name}</Text>

        <View style={styles.bikeSpecs}>
          {item.engineCC && (
            <View style={styles.specItem}>
              <Ionicons name="speedometer-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.engineCC}cc</Text>
            </View>
          )}
          {item.fuelType && (
            <View style={styles.specItem}>
              <Ionicons name="water-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.fuelType}</Text>
            </View>
          )}
          {item.transmission && (
            <View style={styles.specItem}>
              <Ionicons name="cog-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.transmission}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>₹{item.lowestPrice}/day</Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => openBookingModal(item)}
        >
          <Text style={styles.bookBtnText}>View & Book</Text>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
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
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Phone Number</Text>
            <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.phoneModalContent}>
            <Ionicons name="call-outline" size={60} color="#09B368" style={styles.phoneIcon} />
            <Text style={styles.phoneModalText}>
              We need your phone number to process your booking request and send you quotes from vendors.
            </Text>

            <View style={styles.phoneInputGroup}>
              <Ionicons name="call" size={20} color="#09B368" />
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter your 10-digit phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor={"#888"}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus={true}
              />
            </View>

            <TouchableOpacity
              style={[styles.phoneSubmitBtn, phoneLoading && styles.disabledBtn]}
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book {selectedBike?.name}</Text>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingContent}>
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
                  <Ionicons name="bicycle" size={80} color="#ccc" />
                </View>
              )}
            </View>

            {/* Bike Details */}
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingBikeName}>
                {selectedBike?.brandName} {selectedBike?.name}
              </Text>

              <View style={styles.bookingDateRow}>
                <View style={styles.bookingDateItem}>
                  <Ionicons name="calendar-outline" size={18} color="#09B368" />
                  <Text style={styles.bookingDateLabel}>Pickup</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(pickupDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{pickupTime}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#999" />
                <View style={styles.bookingDateItem}>
                  <Ionicons name="calendar-outline" size={18} color="#e74c3c" />
                  <Text style={styles.bookingDateLabel}>Drop</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(dropDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{dropTime}</Text>
                </View>
              </View>

              <View style={styles.durationBox}>
                <Text style={styles.durationText}>
                  {calculateDays()} Day{calculateDays() > 1 ? 's' : ''} Rental
                </Text>
              </View>
            </View>

            {/* Vendor Selection */}
            <Text style={styles.sectionTitle}>Select Vendor</Text>
            {selectedBike?.vendorPrices?.map((vendor, index) => (
              <TouchableOpacity
                key={vendor.vendorId}
                style={[
                  styles.vendorCard,
                  selectedVendor?.vendorId === vendor.vendorId && styles.vendorCardSelected,
                ]}
                onPress={() => setSelectedVendor(vendor)}
              >
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{vendor.vendorName}</Text>
                  {vendor.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#09B368" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                  {vendor.rating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#f39c12" />
                      <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.vendorPriceInfo}>
                  <Text style={styles.vendorPrice}>₹{vendor.dailyRate}/day</Text>
                  {vendor.deposit > 0 && (
                    <Text style={styles.depositText}>+ ₹{vendor.deposit} deposit</Text>
                  )}
                </View>
                {index === 0 && (
                  <View style={styles.lowestPriceBadge}>
                    <Text style={styles.lowestPriceText}>Lowest Price</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Price Breakdown */}
            {selectedVendor && (
              <View style={styles.priceBreakdown}>
                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.priceRow2}>
                  <Text style={styles.priceLabel2}>
                    ₹{selectedVendor.dailyRate} x {calculateDays()} days
                  </Text>
                  <Text style={styles.priceValue}>
                    ₹{selectedVendor.dailyRate * calculateDays()}
                  </Text>
                </View>
                {selectedVendor.deposit > 0 && (
                  <View style={styles.priceRow2}>
                    <Text style={styles.priceLabel2}>Security Deposit (Refundable)</Text>
                    <Text style={styles.priceValue}>₹{selectedVendor.deposit}</Text>
                  </View>
                )}
                <View style={[styles.priceRow2, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₹{Math.round(
                      selectedVendor.dailyRate * calculateDays() +
                      (selectedVendor.deposit || 0)
                    )}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.bookingActions}>
            <Text style={styles.quoteHint}>
              Vendors will send you quotes. You can compare and choose the best one.
            </Text>
            <TouchableOpacity
              style={[styles.confirmBookingBtn, bookingLoading && styles.disabledBtn]}
              onPress={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBookingBtnText}>Request Quotes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent a Bike</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        {/* Location Input */}
        <View style={styles.inputGroup}>
          <Ionicons name="location-outline" size={20} color="#09B368" />
          <TextInput
            style={styles.input}
            placeholder="Select pickup location"
            value={locationQuery}
            onChangeText={handleLocationInput}
            onFocus={() => setShowLocationDropdown(true)}
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
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.dropdownText}>{loc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBox} onPress={openPickupDatePicker}>
            <Ionicons name="calendar-outline" size={18} color="#09B368" />
            <View>
              <Text style={styles.dateLabel}>Pickup</Text>
              <Text style={styles.dateValue}>{formatDate(pickupDate)}</Text>
              <Text style={styles.timeValue}>{pickupTime}</Text>
            </View>
          </TouchableOpacity>

          <Ionicons name="arrow-forward" size={20} color="#999" />

          <TouchableOpacity style={styles.dateBox} onPress={openDropDatePicker}>
            <Ionicons name="calendar-outline" size={18} color="#e74c3c" />
            <View>
              <Text style={styles.dateLabel}>Drop</Text>
              <Text style={styles.dateValue}>{formatDate(dropDate)}</Text>
              <Text style={styles.timeValue}>{dropTime}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, loading && styles.disabledBtn]}
          onPress={() => handleSearch()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchBtnText}>Search Bikes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!hasSearched && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>Find Your Perfect Ride</Text>
            <Text style={styles.emptyText}>
              Select a location and dates to browse available bikes
            </Text>
          </View>
        )}

        {hasSearched && bikes.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>No Bikes Found</Text>
            <Text style={styles.emptyText}>
              Try a different location or adjust your filters
            </Text>
          </View>
        )}

        {bikes.length > 0 && (
          <>
            <Text style={styles.resultsCount}>
              {bikes.length} Bike{bikes.length > 1 ? 's' : ''} Available
            </Text>
            <FlatList
              data={bikes}
              renderItem={renderBikeCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.bikesList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterBtn: {
    padding: 4,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09B368',
    borderRadius: 10,
    paddingVertical: 14,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bikesList: {
    paddingBottom: 20,
  },
  bikeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bikeImageContainer: {
    height: 160,
    backgroundColor: '#f8f8f8',
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
    backgroundColor: '#f0f0f0',
  },
  vendorBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#09B368',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vendorBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bikeInfo: {
    padding: 14,
  },
  bikeBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  bikeSpecs: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  specText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09B368',
  },
  bookBtn: {
    backgroundColor: '#09B368',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#09B368',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  clearBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#09B368',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Booking Modal
  bookingModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  bookingContent: {
    padding: 16,
  },
  bookingBikeImage: {
    height: 180,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalBikeImage: {
    width: '100%',
    height: '100%',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  bookingBikeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  bookingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
  },
  bookingDateItem: {
    alignItems: 'center',
  },
  bookingDateLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  bookingDateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  bookingTimeValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  durationBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  durationText: {
    color: '#09B368',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  vendorCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  vendorCardSelected: {
    borderColor: '#09B368',
    backgroundColor: '#e8f5e9',
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 11,
    color: '#09B368',
    marginLeft: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#f39c12',
    marginLeft: 2,
  },
  vendorPriceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09B368',
  },
  depositText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  lowestPriceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#09B368',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lowestPriceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  priceBreakdown: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  priceRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel2: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09B368',
  },
  bookingActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmBookingBtn: {
    backgroundColor: '#09B368',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBookingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  phoneModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    width: '100%',
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  phoneSubmitBtn: {
    backgroundColor: '#09B368',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  phoneSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

export default BikeFleetScreen;
