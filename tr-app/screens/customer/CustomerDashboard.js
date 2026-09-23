/******************************************************************************************
 * CustomerDashboard.js – Aesthetic, Royal & Fully Responsive Dashboard
 *
 * Theme: Dark/Minimalist with Teal Green (#09B368) + Gold Accents
 ******************************************************************************************/

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  useWindowDimensions,
  PermissionsAndroid,
  Linking,
  RefreshControl,
  BackHandler,
  KeyboardAvoidingView
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import VendorCard from '../../components/VendorCard'; // update path accordingly
import Geolocation from 'react-native-geolocation-service';
import DeviceInfo from 'react-native-device-info';
import api, { BASE_URL } from '../api';
import { bookingService, notificationService, profileService, fleetService } from '../services';
import { LocationPermissionModal, ExitConfirmationModal } from '../../components/CustomModals';
// import SpinAndWinModal from './SpinAndWinModal';




// ────── COLORS (Premium Theme) ──────
const BRAND_TEAL = '#09B368';
const BRAND_TEAL_DARK = '#078A52';
const BRAND_TEAL_LIGHT = '#E8F8F2';
const GOLD = '#FFB800';
const GOLD_LIGHT = '#FFF4E0';
const RED = '#FF3B30';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#6B7280';
const TEXT_LIGHT = '#9CA3AF';
const BG = '#F5F7FA';
const CARD = '#FFFFFF';
const SHADOW_COLOR = '#000000';
const GREEN_GRADIENT_START = '#09B368';
const GREEN_GRADIENT_END = '#07A55E';
const CARD_BORDER = '#F0F2F5';

// ────── RESPONSIVE HELPERS ──────
const CARD_WIDTH = wp('42%');
const height = wp('100%');
const CATEGORY_TILE = (wp('100%') - wp('5%') * 2) / 4 - wp('2%');

// ────── MOCK DATA ──────

const CATEGORIES = [
  {
    id: '1',
    label: 'Bike',
    sub: 'Bikes & \n Scooters',
    image: require('../../assets/bike.png'),
    screen: 'BikeRentalScreen',
  },
  {
    id: '2',
    label: 'Standard Car',
    sub: 'Self Drive & \nChauffeur',
    image: require('../../assets/standard_car.png'),
    screen: 'CarRentalFleetScreen',
    b2bEligible: true,
  },
  {
    id: '3',
    label: 'Luxury Car',
    sub: 'Luxury & \nUrgent',
    image: require('../../assets/luxury_car.png'),
    screen: 'LuxuryCarRental',
    b2bEligible: true,
  },
  {
    id: '4',
    label: 'Self-Drive',
    sub: 'Cars & \nSUVs',
    image: require('../../assets/self_drives.png'),
    screen: 'SelfDriveScreen',
    b2bEligible: true,
  },
  {
    id: '5',
    label: 'Bus',
    sub: '12-50 Seater',
    image: require('../../assets/bus.png'),
    screen: 'BusRentalFleetScreen',
    b2bEligible: true,
  },
  {
    id: '6',
    label: 'Truck',
    sub: 'Movers & Logistics',
    image: require('../../assets/truck.png'),
    screen: 'TruckRentalScreen',
  },
  {
    id: '7',
    label: 'Equipment',
    sub: 'Crane, Loader, etc.',
    image: require('../../assets/equipment.png'),
    screen: 'EquipmentScreen',
  },
  {
    id: '8',
    label: 'Packers & Movers',
    sub: 'House & Office Shifting',
    image: require('../../assets/packers_movers.png'),
    screen: 'PackerMoverScreen',
  },
];
const TESTIMONIALS = [
  { id: 't1', name: 'Priya S.', text: 'Best rates & super-fast quotes! ⭐⭐⭐⭐⭐', avatar: require('../../assets/yashvi.png') },
  { id: 't2', name: 'Vikram R.', text: 'Luxury car on time for my wedding. Highly recommended.', avatar: require('../../assets/vanshaj.png') },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Post Requirement', icon: 'edit-3' },
  { step: '2', title: 'Receive Quotes', icon: 'message-square' },
  { step: '3', title: 'Book & Ride', icon: 'check-circle' },
];

export default function CustomerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // const [spinOpen, setSpinOpen] = useState(false);

  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [customerImage, setCustomerImage] = useState(null);
  const [isB2BCustomer, setIsB2BCustomer] = useState(false);
  const [companyName, setCompanyName] = useState('');
  // Phase 7 — TA-linked customer flag (controls the "Company Bookings" tile).
  const [isTravelAgent, setIsTravelAgent] = useState(false);
  const [agencyName, setAgencyName] = useState('');

  const { width: winWidth } = useWindowDimensions();

  // ────── STATE ──────
  const [location, setLocation] = useState('Detecting...');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  // ────── ANIMATIONS ──────
  const scrollY = useRef(new Animated.Value(0)).current;
  // Header shadow on scroll
  const headerElevation = scrollY.interpolate({ inputRange: [0, 30], outputRange: [0, 1], extrapolate: 'clamp' });
  const fabAnim = useRef(new Animated.Value(1)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;
  const skeletonAnim = useRef(new Animated.Value(0)).current;

  // Skeleton shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [skeletonAnim]);

  const skeletonOpacity = skeletonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const [dashboardStats, setDashboardStats] = useState({
    active_bookings: 0,
    total_earnings: 0,
  });
  const [customerId, setCustomerId] = useState(null);
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('customer');
      if (raw) {
        const customer = JSON.parse(raw);
        setCustomerId(customer?.id);
      }
    })();
  }, []);
  const fetchUnreadNotificationCount = async () => {
    try {
// console.log('[fetchUnreadNotificationCount] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
// console.log('[fetchUnreadNotificationCount] No customer data found');
        setUnreadCount(0);
        return;
      }

      const customer = JSON.parse(customerData);
      const customerId = customer?.id;
      if (!customerId) {
// console.log('[fetchUnreadNotificationCount] No customer ID found');
        setUnreadCount(0);
        return;
      }

      // Use notification service or set to 0 if not available
      try {
        const response = await notificationService.getUnreadCount(customerId);
        const count = response?.total_unread ?? 0;
        setUnreadCount(count);
// console.log(`[fetchUnreadNotificationCount] Success: ${count} unread notifications`);
      } catch (e) {
        // Notification endpoint may not exist, just set to 0
// console.log('[fetchUnreadNotificationCount] Service error, setting to 0:', e.message);
        setUnreadCount(0);
      }
    } catch (err) {
// console.log('[fetchUnreadNotificationCount] Error:', err.message);
      setUnreadCount(0);
    }
  };

  const fetchDashboardStats = async () => {
    try {
// console.log('[fetchDashboardStats] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
// console.log('[fetchDashboardStats] No customer data in AsyncStorage');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
        return;
      }

      const customer = JSON.parse(customerData);
      const identifier = customer?.id || customer?.email || customer?.phone;
      if (!identifier) {
// console.log('[fetchDashboardStats] No valid customer identifier found');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
        return;
      }

// console.log('[fetchDashboardStats] Requesting stats with identifier:', identifier);

      // Use the correct customer stats endpoint
      const response = await api.get('/customer/stats', {
        params: {
          identifier: customer?.email || customer?.phone,
          customer_id: customer?.id
        }
      });

// console.log('[fetchDashboardStats] Response:', response.data);

      if (response.data?.success) {
        const stats = response.data.stats || {};
        // Calculate active bookings (open + confirmed + ongoing)
        const activeCount = (stats.open || 0) + (stats.confirmed || 0) + (stats.ongoing || 0);
        setDashboardStats({
          active_bookings: activeCount,
          total_earnings: 0,
        });
// console.log(`[fetchDashboardStats] Success: ${activeCount} active bookings`);
      } else {
        console.warn('[fetchDashboardStats] API returned success: false');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
      }
    } catch (err) {
// console.log('[fetchDashboardStats] Error:', err.message);
      if (err.response) {
// console.log('[fetchDashboardStats] Error Response:', err.response.data);
      }
      setDashboardStats({ active_bookings: 0, total_earnings: 0 });
    }
  };
  /* const fetchBackrStats = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) return;
      const customer = JSON.parse(customerData);
      const response = await api.get('/backr', { params: { customer_id: customer.id } });
      const earned = response.data?.tokens?.earned_tokens ?? 0;
      setDashboardStats(prev => ({
        ...prev,
        total_earnings: earned,
      }));
    } catch (e) {
      console.log('backr fetch for dashboard failed', e.message);
    }
  }; */

  const requestLocationPermission = async () => {
    // Check if permission is already granted at OS level
    if (Platform.OS === 'android') {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (alreadyGranted) {
        setLocationPermissionGranted(true);
        getCurrentLocation();
        return;
      }
    }

    // Check if user previously dismissed our modal
    const dismissed = await AsyncStorage.getItem('locationPermissionDismissed');
    if (dismissed === 'true') {
      return; // Don't show modal again if user denied before
    }

    // Show custom modal only if permission not granted and not previously dismissed
    setShowLocationPermissionModal(true);
  };

  const handleLocationAllow = async () => {
    setShowLocationPermissionModal(false);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to show your current position.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setLocationPermissionGranted(true);
        getCurrentLocation();
      }
    } else {
      setLocationPermissionGranted(true);
      getCurrentLocation();
    }
  };

  const handleLocationDeny = () => {
    setShowLocationPermissionModal(false);
    setLocationPermissionGranted(false);
    // Remember that user dismissed, so we don't ask again
    AsyncStorage.setItem('locationPermissionDismissed', 'true');
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await api.get('/geocode', { params: { lat: latitude, lon: longitude } });
      if (response.data.success) {
        setLocation(`${response.data.city}, ${response.data.state}`);
      }
    } catch (error) {
// console.log('Error getting address', error);
      setLocation('Unknown');
    }
  };

  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCustomerLocation({ latitude, longitude });

        await getAddressFromCoords(latitude, longitude);

        // Optional: Update backend
        try {
          const customerId = await AsyncStorage.getItem('customer_id');
          if (customerId) {
            await api.post('/customer/location', {
              customer_id: customerId,
              latitude,
              longitude,
              city: location, // Use the location derived from getAddressFromCoords
            });

          }
        } catch (err) {
// console.log('Backend update error:', err);
        }
      },
      (error) => {
// console.log('Location fetch error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  // VENDOR SPOTLIGHT - REMOVED (fetchVendors not needed)
  // const fetchVendors = async () => {
  //   console.log('[fetchVendors] 🚀 Fetching featured vendors...');
  //   try {
  //     const response = await api.get('/vendors/featured');
  //     console.log('[fetchVendors] 📦 Raw Response:', response);
  //     const { data } = response;
  //     if (!data) {
  //       console.warn('[fetchVendors] ⚠️ No data returned from API.');
  //       return;
  //     }
  //     if (data.success && Array.isArray(data.vendors)) {
  //       console.log(`[fetchVendors] ✅ ${data.vendors.length} vendor(s) fetched successfully.`);
  //       setVendors(data.vendors);
  //       if (data.vendors.length > 0) {
  //         console.log('[fetchVendors] 🔍 First Vendor:', data.vendors[0]);
  //       }
  //     } else {
  //       console.warn('[fetchVendors] ❌ API responded but success flag is false or vendors is not an array.');
  //       console.log('[fetchVendors] 💬 Response:', data);
  //     }
  //   } catch (error) {
  //     console.log('[fetchVendors] 🛑 Error fetching vendors:', error.message);
  //     if (error.response) {
  //       console.log('[fetchVendors] 🔍 Error Response:', error.response.data);
  //     }
  //   }
  // };

  const fetchRecentQuotes = async () => {
    try {
// console.log('[fetchRecentQuotes] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
// console.log('[fetchRecentQuotes] No customer data found');
        setRecentQuotes([]);
        return;
      }

      const customer = JSON.parse(customerData);
      const identifier = customer?.id || customer?.email || customer?.phone;
      if (!identifier) {
// console.log('[fetchRecentQuotes] No valid customer identifier found');
        setRecentQuotes([]);
        return;
      }

      // Use the correct bookings endpoint to fetch open/quote requests
      const response = await api.get('/customer/bookings', {
        params: {
          identifier: customer?.email || customer?.phone,
          customer_id: customer?.id,
          status: 'Open'
        }
      });

// console.log('[fetchRecentQuotes] Response:', response.data);

      if (response.data?.success) {
        // Filter for quote requests and take recent ones
        const quotes = (response.data.bookings || [])
          .filter(b => b.is_quote_request)
          .slice(0, 5)
          .map(q => ({
            id: q.id,
            service_name: q.service_name,
            service_type: q.service_type || '',
            location: q.location_name || '',
            destination: q.destination || '',
            date: q.journey_datetime,
            status: q.status,
          }));
        setRecentQuotes(quotes);
// console.log(`[fetchRecentQuotes] Success: ${quotes.length} quotes found`);
      } else {
        console.warn('[fetchRecentQuotes] API returned success: false');
        setRecentQuotes([]);
      }
    } catch (error) {
// console.log('[fetchRecentQuotes] Error:', error.message);
      if (error.response) {
// console.log('[fetchRecentQuotes] Error Response:', error.response.data);
      }
      setRecentQuotes([]);
    }
  };


  // ────── CHECK FOR APP UPDATE ──────
  // Compare version strings (e.g. "3.2" < "3.3", "3.3.1" < "3.4")
  const isVersionLower = (current, latest) => {
    const c = current.split('.').map(Number);
    const l = latest.split('.').map(Number);
    const len = Math.max(c.length, l.length);
    for (let i = 0; i < len; i++) {
      const cv = c[i] || 0;
      const lv = l[i] || 0;
      if (cv < lv) return true;
      if (cv > lv) return false;
    }
    return false;
  };

  const checkForUpdate = async () => {
    try {
      const response = await api.get('/app-version');
      if (response.data?.success) {
        const { latestVersion, forceUpdate, updateMessage, playStoreUrl } = response.data;
        const currentVersion = DeviceInfo.getVersion();
        if (latestVersion && isVersionLower(currentVersion, latestVersion)) {
          setUpdateInfo({ latestVersion, forceUpdate, updateMessage, playStoreUrl });
          setShowUpdateModal(true);
        }
      }
    } catch (e) {
      // Silently fail — update check is non-critical
    }
  };

  // ────── LIFECYCLE ──────
  useEffect(() => {
    // Fade-in the whole screen
    Animated.timing(fabAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Slide-up modal (initial hidden position)
    Animated.spring(modalSlide, { toValue: 0, friction: 8, useNativeDriver: true }).start();

    initApp();

    // Request location permission
    requestLocationPermission();

    // Check for app updates
    checkForUpdate();

    // Intentional run-once-on-mount effect — initApp/requestLocationPermission/
    // checkForUpdate aren't memoized, so listing them would re-run this on
    // every render instead of just once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────── REFRESH NOTIFICATION COUNT ON SCREEN FOCUS ──────
  useFocusEffect(
    React.useCallback(() => {
      // Refresh notification count when screen comes into focus
      fetchUnreadNotificationCount();
    }, [])
  );

  // ────── PREVENT BACK NAVIGATION FROM CUSTOMER DASHBOARD ──────
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Show custom exit confirmation modal
        setShowExitModal(true);
        return true; // Prevent default back behavior
      };

      // Add event listener
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Cleanup function
      return () => backHandler.remove();
    }, [])
  );

  const fetchUpcomingBookings = async () => {
// console.log('[fetchUpcomingBookings] Starting...');

    try {
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
        console.warn('[fetchUpcomingBookings] No customer data found.');
        return;
      }

      const customer = JSON.parse(customerData);
      const identifier = customer?.id || customer?.email || customer?.phone;

      if (!identifier) {
        console.warn('[fetchUpcomingBookings] No identifier available.');
        return;
      }

      // Use the correct customer/bookings endpoint with Confirmed status
      const response = await api.get('/customer/bookings', {
        params: {
          identifier: customer?.email || customer?.phone,
          customer_id: customer?.id,
          status: 'Confirmed'
        }
      });

// console.log('[fetchUpcomingBookings] Response received');
// console.log('[fetchUpcomingBookings] 📦 Raw Response:', JSON.stringify(response.data, null, 2));

      if (response.data?.success) {
        const bookings = response.data.bookings || [];
// console.log(`[fetchUpcomingBookings] Bookings received: ${bookings.length}`);
// console.log('[fetchUpcomingBookings] 📋 All Bookings:', JSON.stringify(bookings, null, 2));

        const formatted = bookings.slice(0, 5).map((b, index) => {
          // console.log(`[fetchUpcomingBookings] 🔍 Booking ${index + 1}:`, b);

          return {
            id: b.id?.toString() || b.booking_number,
            from: b.location_name || b.locationName || b.location?.name || b.pickupAddress || 'N/A',
            to: b.destination || 'N/A',
            date: b.journey_datetime
              ? new Date(b.journey_datetime).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
              : 'N/A',
            status: b.service_name || 'Booking',
            driver: b.vendor?.name || 'Pending',
            type: b.service_type || 'Unknown',
          };
        });

// console.log('[fetchUpcomingBookings] 📦 Formatted Trips:', JSON.stringify(formatted, null, 2));
        setUpcomingTrips(formatted);
// console.log('[fetchUpcomingBookings] Upcoming trips set successfully.');
      } else {
        console.warn('[fetchUpcomingBookings] API returned success: false');
      }
    } catch (error) {
// console.log('[fetchUpcomingBookings] Error:', error.message);
      if (error.response) {
// console.log('[fetchUpcomingBookings] Error Response:', error.response.data);
      }
    }
  };
  const handleRefresh = async () => {
// console.log('[handleRefresh] Starting refresh...');
    setIsRefreshing(true);
    try {
      // Refresh fast-changing data with proper error handling
      await Promise.allSettled([
        fetchDashboardStats(),
        fetchUpcomingBookings(),
        fetchRecentQuotes(),
        fetchUnreadNotificationCount(),
      ]);
    } catch (e) {
// console.log('[handleRefresh] Error:', e.message);
    } finally {
      setIsRefreshing(false);
    }
  };
  // ────── APP INIT ──────
  const initApp = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      else setIsRefreshing(true);
      if (!isRefresh) {
        setLocation('');
        setFromLocation('');
      }

      // Fetch customer data first
      const customerData = await AsyncStorage.getItem('customer');
      if (customerData) {
        const customer = JSON.parse(customerData);
        setUserName(customer.name || 'User');
        if (customer.image) {
          setCustomerImage(`${BASE_URL}/uploads/profile_images/${customer.image}`);
        } else {
          setCustomerImage(null);
        }
        // Check B2B status
        setIsB2BCustomer(customer?.isB2B === true);
        setCompanyName(customer?.companyName || '');
        // Phase 7 — detect TA-linked shadow customer.
        setIsTravelAgent(!!customer?.linkedTravelAgentId);
        setAgencyName(customer?.agencyName || customer?.linkedTravelAgentName || '');
      }

      // Run all fetch functions in parallel with proper error handling
      await Promise.allSettled([
        fetchDashboardStats(),
        fetchUpcomingBookings(),
        fetchRecentQuotes(),
        fetchUnreadNotificationCount(),
      ]);

// console.log('[initApp] All data fetched successfully');
    } catch (error) {
// console.log('[initApp] Error:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // No need for hasActivity state anymore since we always show upcoming bookings section
  // ────── MODAL HANDLERS ──────
  // Keep JS-friendly signatures (no TS annotations inside .js file)
  const openModal = (cat) => { setSelectedCategory(cat); setModalVisible(true); };
  const closeModal = () => setModalVisible(false);
  const postRequirement = () => {
    Animated.sequence([
      Animated.spring(fabAnim, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      Alert.alert('Success', 'Requirement posted! Vendors will send quotes shortly.');
      closeModal();
      navigation.navigate('MyBookings');
    });
  };

  // ────── RENDER HELPERS ──────
  // Booking card used in the Activity list
  const BookingCard = ({ item, activeTab }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => {
        if (activeTab === 'Upcoming') {
          navigation.navigate('BookingDetail', { bookingId: item.id });
        } else if (activeTab === 'Quotes') {
          navigation.navigate('ViewQuote', { quoteId: item.id });
        }
      }}
      accessibilityLabel={`Booking ${item.from} to ${item.to}`}
    >
      <View style={styles.bookingLeft}>
        {activeTab === 'Quotes' ? (
          <>
            <Text style={styles.quotePrice}>{item.price}</Text>
            <Text style={styles.quoteVendor}>{item.vendor} • {item.vehicle}</Text>
            <Text style={styles.quoteRoute}>{item.from} → {item.to}</Text>
            <View style={styles.quoteFooter}>
              <Icon name="clock" size={14} color={GOLD} />
              {/* <Text style={styles.quoteRating}>{item.rating}</Text> */}
              <Text style={styles.quoteTime}>{item.time}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.bookingRoute}>{item.from} → {item.to}</Text>
            <Text style={styles.bookingSub}>{item.date} | {item.type}</Text>
            <View style={styles.statusRow}>
              <Icon name="check-circle" size={16} color={BRAND_TEAL} />
              <Text style={styles.bookingStatus}>{item.status}</Text>
            </View>
          </>
        )}
      </View>
      <Icon name="arrow-right" size={20} color={BRAND_TEAL} />
    </TouchableOpacity>
  );

  // Same 4 values/targets as before — just a quiet bordered strip instead
  // of a dark gradient "glass card".
  const QuickStats = () => (
    <View style={styles.statsStrip}>
      <TouchableOpacity
        style={styles.statsCol}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MyBookings', { filter: 'confirmed', timestamp: Date.now() })}
      >
        <Text style={styles.statsValue}>{dashboardStats.active_bookings}</Text>
        <Text style={styles.statsCaption}>Active{'\n'}Bookings</Text>
      </TouchableOpacity>

      <View style={styles.statsColDivider} />

      <TouchableOpacity
        style={styles.statsCol}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MyBookings', { filter: 'pending', timestamp: Date.now() })}
      >
        <Text style={styles.statsValue}>{upcomingTrips.length}</Text>
        <Text style={styles.statsCaption}>Upcoming{'\n'}Trips</Text>
      </TouchableOpacity>

      <View style={styles.statsColDivider} />

      <TouchableOpacity
        style={styles.statsCol}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MyBookings', { filter: 'pending', timestamp: Date.now() })}
      >
        <Text style={styles.statsValue}>{recentQuotes.length}</Text>
        <Text style={styles.statsCaption}>Active{'\n'}Quotes</Text>
      </TouchableOpacity>

      <View style={styles.statsColDivider} />

      <TouchableOpacity
        style={styles.statsCol}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MyWanderBookings')}
      >
        <Text style={styles.statsValue}>Tours</Text>
        <Text style={styles.statsCaption}>My{'\n'}Wander</Text>
      </TouchableOpacity>
    </View>
  );

  const HowItWorksSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How TransRentals Works</Text>
      <View style={styles.howItWorksContainer}>
        {HOW_IT_WORKS.map((step, index) => (
          <View key={step.step} style={styles.howStepCard}>
            <View style={styles.stepIconWrap}>
              <LinearGradient
                colors={[BRAND_TEAL_DARK, BRAND_TEAL]}
                style={styles.stepIconCircle}
              >
                <Icon name={step.icon} size={wp('4.5%')} color="#FFF" />
              </LinearGradient>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberBadgeText}>{step.step}</Text>
              </View>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>
                {getStepDescription(step.step)}
              </Text>
            </View>

            {/* Connecting Line (except for last step) */}
            {index < HOW_IT_WORKS.length - 1 && (
              <View style={styles.connectingLine} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  // Helper function for step descriptions
  const getStepDescription = (step) => {
    const descriptions = {
      '1': 'Tell us what you need - vehicle type, dates, and route',
      '2': 'Receive competitive quotes from verified vendors',
      '3': 'Compare, choose, and confirm your booking instantly'
    };
    return descriptions[step] || 'Simple and hassle-free process';
  };

  const TestimonialsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What Our Riders Say</Text>
      <FlatList
        data={TESTIMONIALS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingRight: wp('4%'), marginBottom: wp('2%'), }}
        renderItem={({ item }) => (
          <View style={styles.testimonialCard}>
            <Image source={item.avatar} style={styles.testAvatar} />
            <Text style={styles.testName}>{item.name}</Text>
            <Text style={styles.testText} numberOfLines={3}>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
  const SAFETY_TIPS = [
    { label: 'Verified Drivers', icon: 'user-check' },
    { label: 'Live Tracking', icon: 'map-pin' },
    { label: '24×7 Support', icon: 'headphones' },
    { label: 'Secure Payments', icon: 'lock' },
  ];

  const SafetyTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Safety First</Text>
      <View style={styles.tipsGrid}>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipBox}>
            <View style={styles.tipIconCircle}>
              <Icon name={tip.icon} size={wp('4.2%')} color={BRAND_TEAL_DARK} />
            </View>
            <Text style={styles.tipText}>{tip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ────── CATEGORY TILE (Frame Focus layout — same tap/B2B logic as before,
  // just addressed by label so it can be placed into a specific grid cell) ──────
  const getCat = (label) => CATEGORIES.find(c => c.label === label);

  const renderCatTile = (c, extraStyle) => {
    if (!c) return null;
    return (
      <TouchableOpacity
        key={c.id}
        style={[styles.catFrameCard, extraStyle, c.isB2B && styles.b2bTile]}
        activeOpacity={0.7}
        onPress={() => {
          if (c.screen) {
            navigation.navigate(c.screen);
          } else {
            Alert.alert('Coming Soon', `We're still working on ${c.label} rentals.`);
          }
        }}
      >
        {c.isB2B ? (
          <View style={[styles.catFrameImageWrap, styles.b2bImageBox]}>
            <Icon name="briefcase" size={wp('7%')} color="#fff" />
            <Text style={[styles.catFrameLabel, styles.catFrameLabelOnPhoto, styles.b2bLabel]}>{c.label}</Text>
            <View style={styles.b2bBadge}>
              <Text style={styles.b2bBadgeText}>Enterprise</Text>
            </View>
          </View>
        ) : (
          <View style={styles.catFrameImageWrap}>
            <Image source={c.image} style={styles.catFrameImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(10,20,16,0.05)', 'rgba(8,16,13,0.82)']}
              locations={[0, 0.35, 1]}
              style={styles.catFrameScrim}
            />
            {isB2BCustomer && c.b2bEligible && (
              <View style={styles.b2bEligibleDot}>
                <Text style={styles.b2bEligibleDotText}>B2B</Text>
              </View>
            )}
            <View style={styles.catFrameTextOnPhoto}>
              <Text style={styles.catFrameLabelOnPhoto}>{c.label}</Text>
              <Text style={styles.catFrameSubOnPhoto}>{c.sub}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ────── MAIN RETURN ──────
  const showSkeleton = isLoading || isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      {/* SPIN AND WIN FAB - COMMENTED OUT */}
      {/* <AnimatedSpinFab onPress={() => setSpinOpen(true)} /> */}


      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />

      {/* HEADER — in normal flow, not absolute */}
      <View style={styles.fixedHeader}>
        <LinearGradient colors={['#0A0A0B', '#0F1F19', '#123B2C']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.headerGradientBg}>

          {/* Top Row - Profile & Actions */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SettingScreen')}
              style={styles.profileSection}
              activeOpacity={0.8}
            >
              {customerImage ? (
                <Image source={{ uri: customerImage }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Icon name="user" size={18} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.greetingLabel}>Welcome back</Text>
                <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                  {userName}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <View style={styles.notificationIconWrapper}>
                <Icon name="bell" size={19} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Location Row */}
          {locationPermissionGranted && location && location !== 'Detecting...' && location !== 'Unknown' && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={13} color="#FFFFFF" />
              <Text style={styles.locationLabel} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
      {showSkeleton ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: hp('12%') }}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Skeleton */}
          <View style={styles.section}>
            <Animated.View style={[styles.skeletonTitle, { opacity: skeletonOpacity }]} />
            <View style={styles.catGrid}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={styles.catTile}>
                  <Animated.View style={[styles.skeletonCategoryBox, { opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonCategoryLabel, { opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonCategorySub, { opacity: skeletonOpacity }]} />
                </View>
              ))}
            </View>
          </View>

          {/* Stats Skeleton */}
          <View style={{ marginTop: hp('2%'), marginHorizontal: wp('4%') }}>
            <Animated.View style={[{
              height: hp('14%'), borderRadius: 24, backgroundColor: '#D1D5DB', opacity: skeletonOpacity,
            }]} />
          </View>

          {/* Bookings Skeleton */}
          <View style={styles.section}>
            <Animated.View style={[styles.skeletonTitle, { opacity: skeletonOpacity }]} />
            {[...Array(2)].map((_, i) => (
              <Animated.View key={i} style={[styles.skeletonBookingCard, { opacity: skeletonOpacity }]}>
                <Animated.View style={[styles.skeletonIconBox, { opacity: skeletonOpacity }]} />
                <View style={{ flex: 1, marginLeft: wp('3%') }}>
                  <Animated.View style={[styles.skeletonLine, { width: '80%', opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, { width: '60%', marginTop: hp('0.8%'), opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, { width: '40%', marginTop: hp('0.8%'), opacity: skeletonOpacity }]} />
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Quotes Skeleton */}
          <View style={styles.section}>
            <Animated.View style={[styles.skeletonTitle, { opacity: skeletonOpacity }]} />
            {[...Array(2)].map((_, i) => (
              <Animated.View key={i} style={[styles.skeletonQuoteCard, { opacity: skeletonOpacity }]}>
                <Animated.View style={[styles.skeletonIconBox, { opacity: skeletonOpacity, backgroundColor: GOLD_LIGHT }]} />
                <View style={{ flex: 1, marginLeft: wp('3%') }}>
                  <Animated.View style={[styles.skeletonLine, { width: '75%', opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, { width: '55%', marginTop: hp('0.8%'), opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, { width: '35%', marginTop: hp('0.8%'), opacity: skeletonOpacity }]} />
                </View>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: hp('2%') }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[BRAND_TEAL]}
              tintColor={BRAND_TEAL}
            />
          }
        >

          {/* Phase 7 — Travel-Agent banner: quick access to company bookings.
              Only rendered for TA-linked shadow customers (linkedTravelAgentId). */}
          {isTravelAgent && (
            <TouchableOpacity
              style={styles.taBanner}
              onPress={() => navigation.navigate('B2BBookingsList')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.taBannerInner}
              >
                <View style={styles.taBannerIcon}>
                  <Ionicons name="briefcase" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.taBannerTitle} numberOfLines={1}>
                    Travel Agent · {agencyName || 'Your Agency'}
                  </Text>
                  <Text style={styles.taBannerSub} numberOfLines={1}>
                    View company bookings & quotes from manager
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* CATEGORIES GRID — "Frame Focus" layout: same 8 categories, same
              tap/B2B logic (see renderCatTile above), Self-Drive given a
              wider "hero" cell instead of all 8 being identical small tiles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.catFrameGrid}>
              <View style={styles.catFrameRow}>
                {renderCatTile(getCat('Luxury Car'), styles.catFrameThird)}
                {renderCatTile(getCat('Bike'), styles.catFrameThird)}
                {renderCatTile(getCat('Standard Car'), styles.catFrameThird)}
              </View>
              <View style={styles.catFrameRow}>
                {renderCatTile(getCat('Truck'), styles.catFrameThird)}
                {renderCatTile(getCat('Self-Drive'), styles.catFrameWide)}
              </View>
              <View style={styles.catFrameRow}>
                {renderCatTile(getCat('Equipment'), styles.catFrameThird)}
                {renderCatTile(getCat('Bus'), styles.catFrameThird)}
                {renderCatTile(getCat('Packers & Movers'), styles.catFrameThird)}
              </View>
            </View>
          </View>

          {/* CUSTOM EVENT BOOKING + WANDER — same two entry points as before
              (CustomBooking / WanderScreen), now a side-by-side pair of quiet
              tinted cards instead of two full-width gradient banners. */}
          <View style={styles.exploreRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.exploreCard, styles.exploreCardPurple]}
              onPress={() => navigation.navigate('CustomBooking')}
            >
              <View style={[styles.exploreIconWrap, styles.exploreIconPurple]}>
                <Ionicons name="sparkles" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.exploreTitle}>Custom Event</Text>
              <Text style={styles.exploreSub}>Multi-day · one quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.exploreCard, styles.exploreCardTeal]}
              onPress={() => navigation.navigate('WanderScreen')}
            >
              <View style={[styles.exploreIconWrap, styles.exploreIconTeal]}>
                <Ionicons name="compass" size={18} color={BRAND_TEAL_DARK} />
              </View>
              <Text style={styles.exploreTitle}>Wander</Text>
              <Text style={styles.exploreSub}>Tours & experiences</Text>
            </TouchableOpacity>
          </View>

          {/* QUICK STATS */}
          <QuickStats />

          {/* UPCOMING BOOKINGS SECTION */}
          {upcomingTrips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.actHeader}>
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <TouchableOpacity style={styles.viewAllPill} onPress={() => navigation.navigate('MyBookings', { filter: 'confirmed', timestamp: Date.now() })}>
                  <Text style={styles.seeAll}>View All</Text>
                  <Icon name="chevron-right" size={14} color={BRAND_TEAL} />
                </TouchableOpacity>
              </View>

              <View style={styles.bookingsList}>
                {upcomingTrips.map(item => {
                  const typeKey = (item.type || '').toLowerCase();
                  const svcMeta = {
                    bike:        { icon: 'bicycle',    color: '#3B82F6', bg: '#EFF6FF' },
                    car:         { icon: 'car-sport',  color: '#8B5CF6', bg: '#F5F3FF' },
                    bus:         { icon: 'bus',        color: '#F59E0B', bg: '#FFFBEB' },
                    truck:       { icon: 'cube',       color: '#EF4444', bg: '#FEF2F2' },
                    'self-drive':{ icon: 'key',        color: '#0EA5E9', bg: '#F0F9FF' },
                    equipment:   { icon: 'construct',  color: '#06B6D4', bg: '#ECFEFF' },
                    packers:     { icon: 'archive',    color: '#EC4899', bg: '#FDF2F8' },
                    luxury:      { icon: 'diamond',    color: '#D97706', bg: '#FFFBEB' },
                  };
                  const m = svcMeta[typeKey] || { icon: 'calendar-outline', color: BRAND_TEAL, bg: '#ECFDF5' };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.upcomingCard}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
                    >
                      {/* Icon */}
                      <View style={[styles.upcomingIcon, { backgroundColor: m.bg }]}>
                        <Ionicons name={m.icon} size={20} color={m.color} />
                      </View>

                      {/* Content */}
                      <View style={styles.upcomingContent}>
                        <Text style={styles.upcomingRoute} numberOfLines={1}>
                          {typeKey === 'bike' || typeKey === 'car' || typeKey === 'self-drive'
                            ? item.from
                            : `${item.from} → ${item.to}`}
                        </Text>
                        <View style={styles.upcomingMetaRow}>
                          <Ionicons name="time-outline" size={13} color={TEXT_LIGHT} />
                          <Text style={styles.upcomingDate}>{item.date}</Text>
                          <View style={styles.upcomingDot} />
                          <Text style={[styles.upcomingTypeTxt, { color: m.color }]}>{item.type}</Text>
                        </View>
                        <View style={styles.upcomingBadgeRow}>
                          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.confirmedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text style={styles.confirmedTxt}>{item.status}</Text>
                          </LinearGradient>
                        </View>
                      </View>

                      {/* Arrow */}
                      <Ionicons name="chevron-forward" size={20} color={TEXT_LIGHT} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ACTIVE QUOTES SECTION */}
          {recentQuotes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.actHeader}>
                <Text style={styles.sectionTitle}>Active Quotes</Text>
                <TouchableOpacity style={styles.viewAllPill} onPress={() => navigation.navigate('MyBookings', { filter: 'pending', timestamp: Date.now() })}>
                  <Text style={styles.seeAll}>View All</Text>
                  <Icon name="chevron-right" size={14} color={BRAND_TEAL} />
                </TouchableOpacity>
              </View>

              <View style={styles.bookingsList}>
                {recentQuotes.map(item => {
                  const typeKey = (item.service_type || '').toLowerCase();
                  const nameKey = (item.service_name || '').toLowerCase();
                  const qSvcMeta = {
                    bike:        { icon: 'bicycle',    color: '#3B82F6', bg: '#EFF6FF' },
                    car:         { icon: 'car-sport',  color: '#8B5CF6', bg: '#F5F3FF' },
                    bus:         { icon: 'bus',        color: '#F59E0B', bg: '#FFFBEB' },
                    truck:       { icon: 'cube',       color: '#EF4444', bg: '#FEF2F2' },
                    transporter: { icon: 'cube',       color: '#EF4444', bg: '#FEF2F2' },
                    equipment:   { icon: 'construct',  color: '#06B6D4', bg: '#ECFEFF' },
                    packers:     { icon: 'archive',    color: '#EC4899', bg: '#FDF2F8' },
                    luxury:      { icon: 'diamond',    color: '#D97706', bg: '#FFFBEB' },
                  };
                  let qm = qSvcMeta[typeKey];
                  if (!qm && nameKey.includes('self-drive')) qm = { icon: 'key', color: '#0EA5E9', bg: '#F0F9FF' };
                  if (!qm && nameKey.includes('self drive')) qm = { icon: 'key', color: '#0EA5E9', bg: '#F0F9FF' };
                  if (!qm && nameKey.includes('luxury')) qm = { icon: 'diamond', color: '#D97706', bg: '#FFFBEB' };
                  if (!qm && nameKey.includes('packer')) qm = { icon: 'archive', color: '#EC4899', bg: '#FDF2F8' };
                  if (!qm) qm = { icon: 'document-text-outline', color: '#F59E0B', bg: '#FFFBEB' };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.quoteCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        const type = item.service_type?.toLowerCase();
                        const name = item.service_name?.toLowerCase() || '';
                        if (type === 'bike') navigation.navigate('BikeQuoteRequestDetail', { requestId: item.id });
                        else if (type === 'bus') navigation.navigate('BusQuoteRequestDetail', { requestId: item.id });
                        else if (type === 'truck' || type === 'transporter') navigation.navigate('TruckQuoteRequestDetail', { requestId: item.id });
                        else if (type === 'equipment') navigation.navigate('EquipmentQuoteRequestDetail', { requestId: item.id });
                        else if (type === 'packers' || name.includes('packer')) navigation.navigate('PackersQuoteRequestDetail', { requestId: item.id });
                        else if (name.includes('self-drive') || name.includes('self drive')) navigation.navigate('SelfDriveQuoteRequestDetail', { requestId: item.id });
                        else if (type === 'luxury' || name.includes('luxury')) navigation.navigate('LuxuryQuoteDetail', { requestId: item.id });
                        else navigation.navigate('BikeQuoteRequestDetail', { requestId: item.id });
                      }}
                    >
                      {/* Icon */}
                      <View style={[styles.upcomingIcon, { backgroundColor: qm.bg }]}>
                        <Ionicons name={qm.icon} size={20} color={qm.color} />
                      </View>

                      {/* Content */}
                      <View style={styles.upcomingContent}>
                        <Text style={styles.upcomingRoute} numberOfLines={1}>{item.service_name}</Text>
                        <View style={styles.upcomingMetaRow}>
                          <Ionicons name="location-outline" size={13} color={TEXT_LIGHT} />
                          <Text style={styles.upcomingDate} numberOfLines={1}>{item.location} → {item.destination || 'Multiple'}</Text>
                        </View>
                        <View style={styles.upcomingBadgeRow}>
                          <View style={styles.quoteMetaDate}>
                            <Ionicons name="calendar-outline" size={13} color={TEXT_SECONDARY} />
                            <Text style={styles.quoteMetaDateTxt}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                          </View>
                          <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.quoteBadge}>
                            <View style={styles.quotePulseDot} />
                            <Text style={styles.quoteBadgeTxt}>{item.status}</Text>
                          </LinearGradient>
                        </View>
                      </View>

                      {/* Arrow */}
                      <Ionicons name="chevron-forward" size={20} color={TEXT_LIGHT} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {/* HOW IT WORKS */}
          <HowItWorksSection />

          {/* POPULAR ROUTES */}
          {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Adventure Routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('4%') }}>
            {POPULAR_TRIPS.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={styles.popCard}
                onPress={() => openModal(CATEGORIES.find(c => c.label === t.category))}
              >
                <Image source={t.img} style={styles.popImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.popOverlay}>
                  <Text style={styles.popTag}>{t.tag}</Text>
                  <Text style={styles.popRoute}>{t.from} → {t.to}</Text>
                  <Text style={styles.popPrice}>{t.price} Onwards</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View> */}

          {/* TESTIMONIALS - REMOVED (Mock data) */}
          {/* <TestimonialsSection /> */}

          {/* SAFETY TIPS */}
          <SafetyTips />

          <View style={{ height: hp('10%') }} />
        </Animated.ScrollView>
      )}
      {/* FAB */}


      {/* BOTTOM NAV - Handled by App.js Tab.Navigator */}

      {/* REQUIREMENT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: modalSlide }] }]}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>{selectedCategory?.label || 'New Rental'}</Text>
                <Text style={styles.modalSub}>Request quotes for {selectedCategory?.sub || 'any service'}</Text>
              </View>
              <TouchableOpacity onPress={closeModal}><Icon name="x" size={wp('7%')} color="#999" /></TouchableOpacity>
            </View>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: hp('3%') }}>
              {/* Service Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Type</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => Alert.alert('Picker', 'Open service list')}>
                  <Text style={styles.dropdownTxt}>{selectedCategory?.label || 'Tap to select…'}</Text>
                  <Icon name="chevron-down" size={wp('5%')} color={TEXT_PRIMARY} />
                </TouchableOpacity>
              </View>

              {/* Pickup */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pickup Location</Text>
                <View style={styles.inputRow}>
                  <Icon name="map-pin" size={wp('5%')} color={BRAND_TEAL} />
                  <TextInput style={styles.input} placeholder="e.g., Koramangala, Bangalore" value={fromLocation} onChangeText={setFromLocation} />
                </View>
              </View>

              {/* Drop (optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Drop Location (optional)</Text>
                <View style={styles.inputRow}>
                  <Icon name="map" size={wp('5%')} color={TEXT_SECONDARY} />
                  <TextInput style={styles.input} placeholder="e.g., MG Road, Bangalore" value={toLocation} onChangeText={setToLocation} />
                </View>
              </View>

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pickup Date & Time</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
                  <Icon name="calendar" size={wp('5%')} color={BRAND_TEAL} />
                  <Text style={styles.dateTxt}>{pickupDate.toLocaleString()}</Text>
                </TouchableOpacity>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={pickupDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (d) setPickupDate(d);
                  }}
                />
              )}
            </ScrollView>

            <TouchableOpacity onPress={postRequirement} style={styles.postBtnWrap}>
              <LinearGradient colors={[GREEN_GRADIENT_START, GREEN_GRADIENT_END]} style={styles.postBtn}>
                <Text style={styles.postBtnTxt}>Get Custom Quotes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SPIN AND WIN MODAL - COMMENTED OUT */}
      {/* <SpinAndWinModal
        visible={spinOpen}
        onClose={() => setSpinOpen(false)}
        customerId={customerId}
        prizes={[5, 2, 10, 100, 50, 20, 15, 25]} // customize
      /> */}

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showLocationPermissionModal}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onExit={() => BackHandler.exitApp()}
      />

      {/* App Update Modal */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!updateInfo?.forceUpdate) setShowUpdateModal(false);
        }}
      >
        <View style={styles.updateOverlay}>
          <View style={styles.updateCard}>
            {/* Close Button (only if not force update) */}
            {!updateInfo?.forceUpdate && (
              <TouchableOpacity
                onPress={() => setShowUpdateModal(false)}
                style={styles.updateCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={wp('5.5%')} color="#64748B" />
              </TouchableOpacity>
            )}
            {/* Top Gradient Accent */}
            <LinearGradient
              colors={['#064E3B', '#065F46', '#047857']}
              style={styles.updateTopAccent}
            >
              <View style={styles.updateIconRing}>
                <Ionicons name="arrow-up-circle" size={wp('10%')} color="#FFFFFF" />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.updateBody}>
              <Text style={styles.updateTitle}>New Update Available!</Text>
              <Text style={styles.updateVersion}>
                Version {updateInfo?.latestVersion}
              </Text>
              <Text style={styles.updateMsg}>
                {updateInfo?.updateMessage || 'A new version is available with improvements and bug fixes.'}
              </Text>

              {/* Update Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (updateInfo?.playStoreUrl) {
                    Linking.openURL(updateInfo.playStoreUrl);
                  }
                }}
                style={styles.updateBtnWrap}
              >
                <LinearGradient
                  colors={['#065F46', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.updateBtn}
                >
                  <Ionicons name="download-outline" size={wp('5%')} color="#FFFFFF" />
                  <Text style={styles.updateBtnText}>Update Now</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Skip Button (only if not force update) */}
              {!updateInfo?.forceUpdate && (
                <TouchableOpacity
                  onPress={() => setShowUpdateModal(false)}
                  style={styles.skipBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ────────────────────── STYLES (Responsive) ────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header (Premium Dark Green) — normal flow, not absolute
  fixedHeader: {
    zIndex: 10,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#064E2B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerGradientBg: {
    paddingTop: Platform.select({
      ios: hp('4.2%'),
      android: (StatusBar.currentHeight ?? 0) + hp('1%')
    }),
    paddingHorizontal: wp('4.5%'),
    paddingBottom: hp('1.6%'),
  },

  // Header Top Row
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },

  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('4.75%'),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarPlaceholder: {
    width: wp('9.5%'),
    height: wp('9.5%'),
    borderRadius: wp('4.75%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  profileInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  greetingLabel: {
    fontSize: wp('2.6%'),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: hp('0.1%'),
  },
  userName: {
    fontSize: wp('4.3%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Notification Button
  notificationBtn: {
    marginLeft: wp('3%'),
  },
  notificationIconWrapper: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: RED,
    minWidth: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#12241D',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: wp('2.3%'),
    fontWeight: '700',
  },

  // Location Row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: hp('0.3%'),
    gap: wp('1.5%'),
  },
  locationLabel: {
    fontSize: wp('3.1%'),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    maxWidth: wp('65%'),
  },
  // B2B Header Button
  headerB2BButton: {
    marginTop: hp('0.8%'),
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerB2BGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    gap: wp('2.5%'),
  },
  headerB2BIconBox: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerB2BLabel: {
    fontSize: wp('3.3%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerB2BBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: wp('1.8%'),
    paddingVertical: hp('0.15%'),
    borderRadius: 6,
  },
  headerB2BBadgeText: {
    fontSize: wp('2.2%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerB2BCompany: {
    fontSize: wp('2.7%'),
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: hp('0.15%'),
  },
  headerB2BArrow: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stories
  storiesWrap: { paddingLeft: wp('4%') },
  storiesScroll: { paddingRight: wp('8%') },
  storyAdd: { alignItems: 'center', marginRight: wp('4%') },
  storyRing: { width: wp('21%'), height: wp('21%'), borderRadius: wp('50%'), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: "#35ad31ff", backgroundColor: '#fff' },
  storyItem: { alignItems: 'center', marginRight: wp('4%'), },
  storyLabel: { marginTop: hp('0.5%'), fontSize: wp('3.5%'), color: TEXT_SECONDARY, fontWeight: '500' },

  // Phase 7 — Travel-Agent banner (above categories) for TA shadow customers.
  taBanner: {
    marginHorizontal: wp('5%'),
    marginTop: hp('1.5%'),
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  taBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    gap: wp('3%'),
  },
  taBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taBannerTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  taBannerSub: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  // Section generic (Premium)
  section: {
    marginTop: hp('1.5%'),
    paddingHorizontal: wp('5%'),
  },
  sectionTitle: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: hp('0.5%'),
    marginBottom: hp('1.8%'),
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: wp('3.4%'),
    color: BRAND_TEAL,
    fontWeight: '700',
  },

  // Upcoming Bookings Cards
  emptyUpcoming: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
    backgroundColor: CARD,
    borderRadius: 16,
    marginTop: hp('1%'),
  },
  emptySubTxt: {
    marginTop: hp('0.5%'),
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
  },
  bookingsList: {
    gap: hp('1%'),
  },
  upcomingCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  upcomingAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  upcomingIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.8%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingRoute: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.4%'),
    letterSpacing: -0.2,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.2%'),
    marginBottom: hp('0.6%'),
  },
  upcomingDate: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  upcomingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TEXT_LIGHT,
  },
  upcomingTypeTxt: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  upcomingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.35%'),
    borderRadius: 10,
  },
  confirmedTxt: {
    fontSize: wp('3%'),
    fontWeight: '700',
    color: '#059669',
  },

  // Quote Cards – reuses upcomingCard styles + these extras
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  quoteMetaDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteMetaDateTxt: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  quoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.35%'),
    borderRadius: 10,
  },
  quotePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  quoteBadgeTxt: {
    fontSize: wp('2.8%'),
    color: '#92400E',
    fontWeight: '700',
  },

  quoteRoute: {
    fontSize: wp('3.8%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.5%'),
  },
  // Categories (Premium Design)
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: "center",
    alignItems: "center",
    marginTop: hp('1%'),
  },
  // "Frame Focus" category grid — 3 rows (3 / 1+wide / 3), Self-Drive gets
  // the double-width hero cell. Card styling only; tap/B2B logic lives in
  // renderCatTile() above and is unchanged from the old catGrid layout.
  catFrameGrid: {
    marginTop: hp('1%'),
    gap: wp('2.5%'),
  },
  catFrameRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
    // Every row shares one fixed height — only width changes between the
    // normal and wide (Self-Drive) cells, matching the mockup exactly
    // (aspectRatio per-cell was making the wide cell taller, not just wider).
    height: wp('27%'),
  },
  catFrameThird: {
    flex: 1,
  },
  catFrameWide: {
    flex: 2,
  },
  catFrameCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Photo fills the whole card; label/sub sit on top of it over a dark
  // gradient scrim (catFrameScrim), matching the "Frame Focus" mockup.
  catFrameImageWrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F7FA',
    overflow: 'hidden',
  },
  catFrameImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  catFrameScrim: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '60%',
  },
  catFrameTextOnPhoto: {
    position: 'absolute',
    left: wp('2%'), right: wp('2%'), bottom: hp('0.8%'),
  },
  catFrameLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: hp('0.6%'),
    letterSpacing: 0.2,
  },
  catFrameLabelOnPhoto: {
    fontSize: wp('3.1%'),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  catFrameSub: {
    fontSize: wp('2.3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.2%'),
    textAlign: 'center',
    lineHeight: hp('1.4%'),
  },
  catFrameSubOnPhoto: {
    fontSize: wp('2.3%'),
    color: '#A9F0D1',
    fontWeight: '700',
    marginTop: hp('0.15%'),
    lineHeight: hp('1.4%'),
  },
  catTile: {
    width: CATEGORY_TILE,
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  catIcon: {
    width: wp('12%'),
    height: wp('13%'),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
    ...Platform.select({
      ios: {
        shadowColor: BRAND_TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  catLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: hp('0.5%'),
    letterSpacing: 0.2,
  },
  catSub: {
    fontSize: wp('2.5%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
    textAlign: 'center',
    lineHeight: hp('1.6%'),
  },
  catImageBox: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  catImage: {
    width: '85%',
    height: '85%',
    borderRadius: 12,
  },
  // B2B Eligible Badge (on service cards)
  b2bEligibleDot: {
    position: 'absolute',
    top: -wp('1%'),
    right: -wp('1%'),
    backgroundColor: BRAND_TEAL,
    paddingHorizontal: wp('1.5%'),
    paddingVertical: wp('0.4%'),
    borderRadius: wp('1.5%'),
    zIndex: 10,
  },
  b2bEligibleDotText: {
    fontSize: wp('2%'),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // B2B Tile Styles
  b2bTile: {
    borderWidth: 1.5,
    borderColor: BRAND_TEAL,
    borderRadius: 16,
    backgroundColor: '#F0FFF8',
  },
  b2bImageBox: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: 20,
    backgroundColor: BRAND_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BRAND_TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  b2bLabel: {
    color: BRAND_TEAL_DARK,
  },
  b2bBadge: {
    marginTop: hp('0.4%'),
    backgroundColor: BRAND_TEAL,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.3%'),
    borderRadius: 10,
  },
  b2bBadgeText: {
    fontSize: wp('2.2%'),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Vendor Spotlight
  vendorCard: { width: CARD_WIDTH, height: hp('18%'), marginRight: wp('4%'), borderRadius: 16, overflow: 'hidden', elevation: 4, marginBottom: hp('1%') },
  vendorGrad: { flex: 1, padding: wp('4%'), justifyContent: 'space-between' },
  vendorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD + '20', borderRadius: 12, paddingHorizontal: wp('2%'), paddingVertical: hp('0.4%') },
  ratingTxt: { marginLeft: wp('1%'), fontSize: wp('3%'), fontWeight: '600', color: GOLD },
  vendorName: { fontSize: wp('4.2%'), fontWeight: 'bold', color: TEXT_PRIMARY },
  vendorVeh: { fontSize: wp('3%'), color: TEXT_SECONDARY },

  // Quick Stats – Glass Card
  statsStrip: {
    flexDirection: 'row',
    marginTop: hp('2%'),
    marginHorizontal: wp('4%'),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp('1.6%'),
  },
  statsColDivider: {
    width: 1,
    backgroundColor: CARD_BORDER,
  },
  statsValue: {
    fontSize: wp('4.6%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  statsCaption: {
    fontSize: wp('2.3%'),
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginTop: hp('0.3%'),
    lineHeight: wp('3%'),
  },
  statsGlassCard: {
    marginTop: hp('2%'),
    marginHorizontal: wp('4%'),
    borderRadius: 24,
    padding: wp('5%'),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#064E3B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  statsDecoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statsInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  statDivider: {
    width: 1,
    height: hp('7%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: wp('1%'),
  },
  statValue: {
    fontSize: wp('7%'),
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: hp('0.2%'),
  },
  statLabel: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Activity (Premium Headers)
  actHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: BRAND_TEAL + '12',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.7%'),
    borderRadius: 20,
  },
  segmentCtrl: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderRadius: 12, padding: wp('1%'), marginBottom: hp('2%') },
  segment: { flex: 1, alignItems: 'center', paddingVertical: hp('1%'), borderRadius: 10 },
  segmentActive: { backgroundColor: CARD, elevation: 2 },
  segmentTxt: { fontSize: wp('3.5%'), fontWeight: '600', color: TEXT_SECONDARY },
  segmentTxtActive: { color: TEXT_PRIMARY },

  bookingCard: { backgroundColor: CARD, borderRadius: 16, padding: wp('4%'), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp('1.5%'), elevation: 2 },
  bookingLeft: { flex: 1 },
  bookingRoute: { fontSize: wp('4%'), fontWeight: '700', color: TEXT_PRIMARY },
  bookingSub: { fontSize: wp('3%'), color: TEXT_SECONDARY, marginTop: hp('0.2%') },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: hp('0.5%') },
  bookingStatus: { fontSize: wp('3.5%'), fontWeight: '600', color: BRAND_TEAL, marginLeft: wp('1%') },

  quotePrice: { fontSize: wp('5%'), fontWeight: 'bold', color: RED },
  quoteVendor: { fontSize: wp('3.6%'), color: TEXT_PRIMARY, marginTop: hp('0.2%') },
  quoteFooter: { flexDirection: 'row', alignItems: 'center', marginTop: hp('0.5%') },
  quoteRating: { marginLeft: wp('1%'), fontSize: wp('3.4%'), color: TEXT_PRIMARY },
  quoteTime: { marginLeft: wp('1%'), fontSize: wp('3%'), color: TEXT_SECONDARY },

  empty: { alignItems: 'center', paddingVertical: hp('4%'), backgroundColor: CARD, borderRadius: 16, marginTop: hp('1%') },
  emptyTxt: { marginTop: hp('1%'), fontSize: wp('4%'), color: TEXT_SECONDARY },

  // How It Works
  howRow: { flexDirection: 'row', justifyContent: 'space-between' },
  howStep: { alignItems: 'center', flex: 1 },
  howIconWrap: { width: wp('14%'), height: wp('14%'), borderRadius: wp('7%'), backgroundColor: BRAND_TEAL + '15', justifyContent: 'center', alignItems: 'center', marginBottom: hp('1%') },
  howStepNum: { fontSize: wp('4%'), fontWeight: '800', color: BRAND_TEAL },
  howTitle: { fontSize: wp('3.4%'), color: TEXT_PRIMARY, textAlign: 'center', marginTop: hp('0.5%') },
  vendorImage: { width: '100%', height: hp('10%'), borderRadius: 12, marginBottom: hp('1%') },

  // Popular Routes
  popCard: { width: wp('70%'), height: hp('22%'), marginRight: wp('4%'), borderRadius: 18, overflow: 'hidden', elevation: 5 },
  popImg: { width: '100%', height: '100%' },
  popOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: wp('4%') },
  popTag: { color: GOLD, fontSize: wp('3%'), fontWeight: '700' },
  popRoute: { color: '#fff', fontSize: wp('4.5%'), fontWeight: 'bold' },
  popPrice: { color: '#eee', fontSize: wp('3.6%'), marginTop: hp('0.3%') },

  // Testimonials
  testimonialCard: { width: wp('60%'), backgroundColor: CARD, borderRadius: 16, padding: wp('4%'), marginRight: wp('4%'), elevation: 3 },
  testAvatar: { width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), marginBottom: hp('1%'), borderColor: "#d73636ff", borderWidth: 1 },
  testName: { fontSize: wp('3.8%'), fontWeight: '600', color: TEXT_PRIMARY },
  testText: { fontSize: wp('3.4%'), color: TEXT_SECONDARY, marginTop: hp('0.5%') },

  // Safety Tips
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tipBox: {
    width: wp('44%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  tipIconCircle: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: '#F0FFF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2.5%'),
  },
  tipText: { flex: 1, fontSize: wp('3%'), fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: 0.1 },

  // FAB
  fab: { position: 'absolute', bottom: hp('10%'), alignSelf: 'center' },
  fabBtn: { backgroundColor: BRAND_TEAL, flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('6%'), paddingVertical: hp('1.8%'), borderRadius: 40, elevation: 8 },
  fabTxt: { color: '#fff', fontSize: wp('4.2%'), fontWeight: 'bold', marginLeft: wp('2%') },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingVertical: hp('1.2%'),
    justifyContent: 'space-around',
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? hp('4%') : hp('1.2%'),
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  bottomNavGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  navItem: { alignItems: 'center' },
  navActiveTxt: { color: BRAND_TEAL, fontSize: wp('2.8%'), marginTop: hp('0.4%'), fontWeight: '800' },
  navActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND_TEAL, marginTop: 4 },
  navTxt: { color: TEXT_LIGHT, fontSize: wp('2.8%'), marginTop: hp('0.4%') },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: wp('6%'), maxHeight: hp('85%'), flexShrink: 1 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp('2%') },
  modalTitle: { fontSize: wp('5.5%'), fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  modalSub: { fontSize: wp('3.8%'), color: TEXT_SECONDARY, marginTop: hp('0.5%') },
  inputGroup: { marginBottom: hp('2.5%') },
  label: { fontSize: wp('3.8%'), fontWeight: '600', color: TEXT_PRIMARY, marginBottom: hp('1%') },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: CARD_BORDER, borderRadius: 14, backgroundColor: '#f9f9f9', paddingHorizontal: wp('3%') },
  input: { flex: 1, paddingVertical: hp('1.8%'), fontSize: wp('4%'), color: TEXT_PRIMARY },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: wp('4%'), backgroundColor: '#f9f9f9' },
  dropdownTxt: { fontSize: wp('4%'), color: TEXT_PRIMARY },
  dateBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BRAND_TEAL, borderRadius: 12, padding: wp('4%'), backgroundColor: BRAND_TEAL + '10' },
  dateTxt: { marginLeft: wp('2%'), fontSize: wp('4%'), color: TEXT_PRIMARY, fontWeight: '600' },
  postBtnWrap: { borderRadius: 18, overflow: 'hidden', marginTop: hp('1%') },
  postBtn: { paddingVertical: hp('2.2%'), borderRadius: 18, alignItems: 'center' },
  postBtnTxt: { color: '#fff', fontSize: wp('4.5%'), fontWeight: 'bold' },

  // Story Modal
  storyOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', position: 'absolute', top: Platform.select({ ios: hp('7%'), android: (StatusBar.currentHeight ?? 0) + hp('2%') }), left: wp('4%'), right: wp('4%') },
  progressBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 2, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  filled: { backgroundColor: '#fff' },
  storyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: Platform.select({ ios: hp('7%'), android: (StatusBar.currentHeight ?? 0) + hp('2%') }), left: wp('4%'), right: wp('4%') },
  storyUserRow: { flexDirection: 'row', alignItems: 'center' },
  storyAvatar: { width: wp('8%'), height: wp('8%'), borderRadius: wp('4%'), marginRight: wp('2%') },
  storyUser: { color: '#fff', fontWeight: 'bold', fontSize: wp('3.8%') },
  storyTitle: { position: 'absolute', bottom: hp('12%'), left: wp('6%'), right: wp('6%'), color: '#fff', fontSize: wp('6%'), fontWeight: '900', textAlign: 'center' },
  storyHalf: { flex: 1 },
  // Add these styles to your StyleSheet:

  howItWorksContainer: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('2%'),
  },

  howStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('3%'),
    position: 'relative',
  },

  stepIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    marginRight: wp('4%'),
    zIndex: 2,
  },

  stepIconCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepNumberBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: wp('4.2%'),
    height: wp('4.2%'),
    borderRadius: wp('2.1%'),
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: BRAND_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepNumberBadgeText: {
    color: BRAND_TEAL_DARK,
    fontSize: wp('2.4%'),
    fontWeight: 'bold',
  },

  stepContent: {
    flex: 1,
    paddingTop: wp('1%'),
  },

  stepIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  stepIconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('6%'),
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',

  },

  stepTitle: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,

  },

  stepDescription: {
    marginTop: hp('0.4%'),
    fontSize: wp('3.4%'),
    color: TEXT_SECONDARY,
    lineHeight: hp('2.3%'),
  },

  connectingLine: {
    position: 'absolute',
    top: wp('9%'),
    left: wp('4%'),
    width: 1,
    height: '110%',
    backgroundColor: CARD_BORDER,
    zIndex: 1,
  },

  getStartedButton: {
    marginTop: hp('3%'),
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#09B368',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2.2%'),
    paddingHorizontal: wp('6%'),
  },
  // Premium Skeleton Styles
  skeletonBase: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  skeletonTitle: {
    width: wp('45%'),
    height: hp('3%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: hp('1.8%'),
  },
  skeletonCategoryBox: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginBottom: hp('0.5%'),
  },
  skeletonCategoryLabel: {
    width: wp('15%'),
    height: hp('1.5%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: hp('0.5%'),
    alignSelf: 'center',
  },
  skeletonCategorySub: {
    width: wp('18%'),
    height: hp('1.2%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: hp('0.3%'),
    alignSelf: 'center',
  },
  skeletonStatValue: {
    width: wp('15%'),
    height: hp('3.5%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: hp('0.5%'),
  },
  skeletonStatLabel: {
    width: wp('18%'),
    height: hp('1.5%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: hp('0.3%'),
  },
  skeletonBookingCard: {
    minHeight: hp('11%'),
    borderRadius: 22,
    backgroundColor: CARD,
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: BRAND_TEAL + '30',
    padding: wp('4.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  skeletonQuoteCard: {
    minHeight: hp('11%'),
    borderRadius: 22,
    backgroundColor: CARD,
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: GOLD + '30',
    padding: wp('4.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  skeletonIconBox: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: 14,
    backgroundColor: BRAND_TEAL_LIGHT,
  },
  skeletonLine: {
    height: hp('1.5%'),
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  /* ── App Update Modal ── */
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  updateCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  updateCloseBtn: {
    position: 'absolute',
    top: wp('2.5%'),
    right: wp('2.5%'),
    zIndex: 10,
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateTopAccent: {
    alignItems: 'center',
    paddingVertical: wp('7%'),
  },
  updateIconRing: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBody: {
    paddingHorizontal: wp('6%'),
    paddingTop: wp('5%'),
    paddingBottom: wp('6%'),
    alignItems: 'center',
  },
  updateTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    textAlign: 'center',
  },
  updateVersion: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: BRAND_TEAL,
    marginBottom: wp('3%'),
  },
  updateMsg: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: wp('5%'),
    paddingHorizontal: wp('2%'),
  },
  updateBtnWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp('3.8%'),
    gap: 8,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    marginTop: wp('3%'),
    paddingVertical: wp('2.5%'),
    paddingHorizontal: wp('6%'),
  },
  skipBtnText: {
    fontSize: wp('3.3%'),
    color: TEXT_LIGHT,
    fontWeight: '600',
  },

  /* ── Wander Banner ── */
  exploreRow: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
  },
  exploreCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: wp('3.2%'),
    backgroundColor: CARD,
  },
  exploreCardPurple: {
    borderColor: '#EDE6FB',
    backgroundColor: '#F8F5FE',
  },
  exploreCardTeal: {
    borderColor: '#D9F2E6',
    backgroundColor: '#F3FBF7',
  },
  exploreIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.4%'),
  },
  exploreIconPurple: {
    backgroundColor: '#EDE6FB',
  },
  exploreIconTeal: {
    backgroundColor: '#D9F2E6',
  },
  exploreTitle: {
    fontSize: wp('3.4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  exploreSub: {
    fontSize: wp('2.7%'),
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  wanderBanner: {
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#064E3B', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  wanderBannerGrad: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: wp('4.5%'), paddingVertical: hp('1.8%'),
    overflow: 'hidden',
  },
  wanderDeco: {
    position: 'absolute', borderRadius: 999, backgroundColor: '#fff',
  },
  wanderBannerLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: wp('3%'),
  },
  wanderIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(52,211,153,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  wanderBannerTitle: {
    fontSize: wp('3.8%'), fontWeight: '800', color: '#fff', marginBottom: 3,
  },
  wanderBannerSub: {
    fontSize: wp('3%'), color: 'rgba(255,255,255,0.65)',
  },
  wanderViewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  wanderViewBtnText: {
    fontSize: wp('3.2%'), fontWeight: '700', color: '#34D399',
  },
});