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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import fleetService from '../../services/fleetService';
import api, { BASE_URL } from '../../api';

const SelfDriveFleetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get params from navigation (from SelfDriveScreen)
  const locationId = route.params?.locationId;
  const locationName = route.params?.locationName || '';
  const passedPickupDate = route.params?.pickupDate;
  const passedDropDate = route.params?.dropDate;

  // Dates
  const [pickupDate] = useState(() => passedPickupDate ? new Date(passedPickupDate) : new Date());
  const [dropDate] = useState(() => {
    if (passedDropDate) return new Date(passedDropDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

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
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 10000 },
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for booking modal
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // State for phone collection
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

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
    setFilters({
      category: null,
      brand: null,
      sort: 'price_low',
      minPrice: null,
      maxPrice: null,
    });
  };

  const openBookingModal = (car) => {
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  const calculateDays = () => {
    const diffTime = Math.abs(dropDate - pickupDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
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
        customerNotes: '',
      };

      const response = await fleetService.createSelfDriveQuoteRequest(quoteRequestData);

      if (response?.success || response?.quoteRequest) {
        setShowBookingModal(false);
        navigation.navigate('BookingConfirmation', {
          booking_id: response?.quoteRequest?.id || 'TRX-' + Date.now(),
          service_name: 'Self Drive Car',
          service_type: 'self-drive',
        });
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const renderCarCard = ({ item }) => (
    <TouchableOpacity
      style={styles.carCard}
      onPress={() => openBookingModal(item)}
      activeOpacity={0.7}
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
            <Ionicons name="car-sport" size={60} color="#ccc" />
          </View>
        )}
        {item.vendorCount > 1 && (
          <View style={styles.vendorBadge}>
            <Text style={styles.vendorBadgeText}>{item.vendorCount} Vendors</Text>
          </View>
        )}
      </View>

      <View style={styles.carInfo}>
        <Text style={styles.carBrand}>{item.brandName}</Text>
        <Text style={styles.carName}>{item.name}</Text>

        <View style={styles.carSpecs}>
          {item.seatingCapacity && (
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.seatingCapacity} Seats</Text>
            </View>
          )}
          {item.transmission && (
            <View style={styles.specItem}>
              <Ionicons name="cog-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.transmission}</Text>
            </View>
          )}
          {item.fuelType && (
            <View style={styles.specItem}>
              <Ionicons name="water-outline" size={14} color="#666" />
              <Text style={styles.specText}>{item.fuelType}</Text>
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
          <Text style={styles.bookBtnText}>Request Quote</Text>
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
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={"#888"}
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
            <Text style={styles.modalTitle}>Request Quote</Text>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingContent}>
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
                  <Ionicons name="car-sport" size={80} color="#ccc" />
                </View>
              )}
            </View>

            {/* Car Details */}
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingCarName}>
                {selectedCar?.brandName} {selectedCar?.name}
              </Text>

              <View style={styles.carSpecsRow}>
                {selectedCar?.seatingCapacity && (
                  <View style={styles.specBadge}>
                    <Ionicons name="people" size={14} color="#09B368" />
                    <Text style={styles.specBadgeText}>{selectedCar.seatingCapacity} Seats</Text>
                  </View>
                )}
                {selectedCar?.transmission && (
                  <View style={styles.specBadge}>
                    <Ionicons name="cog" size={14} color="#09B368" />
                    <Text style={styles.specBadgeText}>{selectedCar.transmission}</Text>
                  </View>
                )}
                {selectedCar?.fuelType && (
                  <View style={styles.specBadge}>
                    <Ionicons name="water" size={14} color="#09B368" />
                    <Text style={styles.specBadgeText}>{selectedCar.fuelType}</Text>
                  </View>
                )}
              </View>

              <View style={styles.bookingDateRow}>
                <View style={styles.bookingDateItem}>
                  <Ionicons name="calendar-outline" size={18} color="#09B368" />
                  <Text style={styles.bookingDateLabel}>Pickup</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(pickupDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{formatTime(pickupDate)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#999" />
                <View style={styles.bookingDateItem}>
                  <Ionicons name="calendar-outline" size={18} color="#e74c3c" />
                  <Text style={styles.bookingDateLabel}>Drop</Text>
                  <Text style={styles.bookingDateValue}>{formatDate(dropDate)}</Text>
                  <Text style={styles.bookingTimeValue}>{formatTime(dropDate)}</Text>
                </View>
              </View>

              <View style={styles.durationBox}>
                <Text style={styles.durationText}>
                  {calculateDays()} Day{calculateDays() > 1 ? 's' : ''} Rental
                </Text>
              </View>
            </View>

            {/* Pricing Info */}
            <View style={styles.pricingInfo}>
              <Text style={styles.sectionTitle}>Estimated Price Range</Text>
              <View style={styles.priceRangeBox}>
                <Text style={styles.priceRangeText}>
                  ₹{selectedCar?.lowestPrice * calculateDays()} - ₹{selectedCar?.highestPrice * calculateDays()}
                </Text>
                <Text style={styles.priceNote}>for {calculateDays()} day{calculateDays() > 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.vendorCountText}>
                {selectedCar?.vendorCount} vendor{selectedCar?.vendorCount > 1 ? 's' : ''} available
              </Text>
            </View>

            {/* How it works */}
            <View style={styles.howItWorks}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Submit your request for this car</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Vendors send you their best quotes</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>Compare & accept the best offer</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                <Text style={styles.stepText}>Pay advance & confirm your booking</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bookingActions}>
            <TouchableOpacity
              style={[styles.confirmBookingBtn, bookingLoading && styles.disabledBtn]}
              onPress={handleRequestQuote}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBookingBtnText}>Request Quotes from Vendors</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Self Drive Cars</Text>
          <Text style={styles.headerSubtitle}>{locationName}</Text>
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Date Summary */}
      <View style={styles.dateSummary}>
        <View style={styles.dateSummaryItem}>
          <Ionicons name="calendar" size={16} color="#09B368" />
          <Text style={styles.dateSummaryText}>{formatDate(pickupDate)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#999" />
        <View style={styles.dateSummaryItem}>
          <Ionicons name="calendar" size={16} color="#e74c3c" />
          <Text style={styles.dateSummaryText}>{formatDate(dropDate)}</Text>
        </View>
        <View style={styles.daysBadge}>
          <Text style={styles.daysBadgeText}>{calculateDays()} Day{calculateDays() > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#09B368" />
            <Text style={styles.loadingText}>Loading cars...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchCars}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && cars.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={80} color="#ddd" />
            <Text style={styles.emptyTitle}>No Cars Available</Text>
            <Text style={styles.emptyText}>
              No self-drive cars are available at {locationName}. Try a different location.
            </Text>
          </View>
        )}

        {!loading && cars.length > 0 && (
          <>
            <Text style={styles.resultsCount}>
              {cars.length} Car{cars.length > 1 ? 's' : ''} Available
            </Text>
            <FlatList
              data={cars}
              renderItem={renderCarCard}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.carsList}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filterBtn: {
    padding: 4,
  },
  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  dateSummaryText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
  },
  daysBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  daysBadgeText: {
    fontSize: 12,
    color: '#09B368',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  carsList: {
    paddingBottom: 20,
  },
  carCard: {
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
  carImageContainer: {
    height: 160,
    backgroundColor: '#f8f8f8',
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
  carInfo: {
    padding: 14,
  },
  carBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  carName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  carSpecs: {
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
    alignItems: 'center',
    backgroundColor: '#fdecea',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
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
  bookingCarImage: {
    height: 180,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalCarImage: {
    width: '100%',
    height: '100%',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  bookingCarName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  carSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specBadgeText: {
    fontSize: 12,
    color: '#09B368',
    marginLeft: 4,
    fontWeight: '500',
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
    marginBottom: 12,
  },
  pricingInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRangeBox: {
    alignItems: 'center',
    marginBottom: 8,
  },
  priceRangeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09B368',
  },
  priceNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  vendorCountText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#09B368',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
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
  disabledBtn: {
    backgroundColor: '#ccc',
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
});

export default SelfDriveFleetScreen;
