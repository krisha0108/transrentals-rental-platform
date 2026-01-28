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
  RefreshControl
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import VendorCard from '../../components/VendorCard'; // update path accordingly
import Geolocation from 'react-native-geolocation-service';
import api, { BASE_URL } from '../api';
import { bookingService, notificationService, profileService, fleetService } from '../services';
// SPIN AND WIN - COMMENTED OUT
// import SpinAndWinModal from './SpinAndWinModal';
// import AnimatedSpinFab from './AnimatedSpinFab';
// import { useRoute } from '@react-navigation/native';




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
  },
  {
    id: '3',
    label: 'Luxury Car',
    sub: 'Luxury & \nUrgent',
    image: require('../../assets/luxury_car.png'),
    screen: 'LuxuryCarRental',
  },
  {
    id: '4',
    label: 'Self-Drive',
    sub: 'Cars & \nSUVs',
    image: require('../../assets/self_drives.png'),
    screen: 'SelfDriveScreen',
  },
  {
    id: '5',
    label: 'Bus',
    sub: '12-50 Seater',
    image: require('../../assets/bus.png'),
    screen: 'BusRentalFleetScreen',
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
  // SPIN AND WIN - COMMENTED OUT
  // const route = useRoute();
  // const { openSpinModal } = route.params || {};
  // useEffect(() => {
  //   if (openSpinModal) {
  //     setSpinOpen(true);
  //   }
  // }, [openSpinModal]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation();
  // VENDOR SPOTLIGHT - REMOVED
  // const [vendors, setVendors] = useState([]);
  const [userName, setUserName] = useState('');
  const [customerImage, setCustomerImage] = useState(null);

  const { width: winWidth } = useWindowDimensions();
  // const [spinOpen, setSpinOpen] = useState(false); // SPIN AND WIN COMMENTED OUT

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

  // ────── ANIMATIONS ──────
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerScale = scrollY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.93], extrapolate: 'clamp' });
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
  }, []);

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
      console.log('[fetchUnreadNotificationCount] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
        console.log('[fetchUnreadNotificationCount] No customer data found');
        setUnreadCount(0);
        return;
      }

      const customer = JSON.parse(customerData);
      const customerId = customer?.id;
      if (!customerId) {
        console.log('[fetchUnreadNotificationCount] No customer ID found');
        setUnreadCount(0);
        return;
      }

      // Use notification service or set to 0 if not available
      try {
        const response = await notificationService.getUnreadCount(customerId);
        const count = response?.total_unread ?? 0;
        setUnreadCount(count);
        console.log(`[fetchUnreadNotificationCount] Success: ${count} unread notifications`);
      } catch (e) {
        // Notification endpoint may not exist, just set to 0
        console.log('[fetchUnreadNotificationCount] Service error, setting to 0:', e.message);
        setUnreadCount(0);
      }
    } catch (err) {
      console.log('[fetchUnreadNotificationCount] Error:', err.message);
      setUnreadCount(0);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('[fetchDashboardStats] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
        console.log('[fetchDashboardStats] No customer data in AsyncStorage');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
        return;
      }

      const customer = JSON.parse(customerData);
      const identifier = customer?.id || customer?.email || customer?.phone;
      if (!identifier) {
        console.log('[fetchDashboardStats] No valid customer identifier found');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
        return;
      }

      console.log('[fetchDashboardStats] Requesting stats with identifier:', identifier);

      // Use the correct customer stats endpoint
      const response = await api.get('/customer/stats', {
        params: {
          identifier: customer?.email || customer?.phone,
          customer_id: customer?.id
        }
      });

      console.log('[fetchDashboardStats] Response:', response.data);

      if (response.data?.success) {
        const stats = response.data.stats || {};
        // Calculate active bookings (open + confirmed + ongoing)
        const activeCount = (stats.open || 0) + (stats.confirmed || 0) + (stats.ongoing || 0);
        setDashboardStats({
          active_bookings: activeCount,
          total_earnings: 0,
        });
        console.log(`[fetchDashboardStats] Success: ${activeCount} active bookings`);
      } else {
        console.warn('[fetchDashboardStats] API returned success: false');
        setDashboardStats({ active_bookings: 0, total_earnings: 0 });
      }
    } catch (err) {
      console.log('[fetchDashboardStats] Error:', err.message);
      if (err.response) {
        console.log('[fetchDashboardStats] Error Response:', err.response.data);
      }
      setDashboardStats({ active_bookings: 0, total_earnings: 0 });
    }
  };
  // BACKR FUNCTIONALITY - COMMENTED OUT
  // const fetchBackrStats = async () => {
  //   try {
  //     const customerData = await AsyncStorage.getItem('customer');
  //     if (!customerData) return;
  //     const customer = JSON.parse(customerData);
  //     // same as BackrTokensScreen
  //     const response = await api.get('/backr', { params: { customer_id: customer.id } });
  //     // response.data.tokens.earned_tokens is what you want
  //     const earned = response.data?.tokens?.earned_tokens ?? 0;
  //     console.log(':dart: backr for dashboard:', earned);
  //     setDashboardStats(prev => ({
  //       ...prev,
  //       total_earnings: earned,   // :point_left: put token earnings here
  //     }));
  //   } catch (e) {
  //     console.log('backr fetch for dashboard failed', e.message);
  //   }
  // };

  const requestLocationPermission = async () => {
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
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await api.get('/geocode', { params: { lat: latitude, lon: longitude } });
      if (response.data.success) {
        setLocation(`${response.data.city}, ${response.data.state}`);
      }
    } catch (error) {
      console.log('Error getting address', error);
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
          console.log('Backend update error:', err);
        }
      },
      (error) => {
        console.log('Location fetch error:', error);
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
      console.log('[fetchRecentQuotes] Starting...');
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) {
        console.log('[fetchRecentQuotes] No customer data found');
        setRecentQuotes([]);
        return;
      }

      const customer = JSON.parse(customerData);
      const identifier = customer?.id || customer?.email || customer?.phone;
      if (!identifier) {
        console.log('[fetchRecentQuotes] No valid customer identifier found');
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

      console.log('[fetchRecentQuotes] Response:', response.data);

      if (response.data?.success) {
        // Filter for quote requests and take recent ones
        const quotes = (response.data.bookings || [])
          .filter(b => b.is_quote_request)
          .slice(0, 5)
          .map(q => ({
            id: q.id,
            service_name: q.service_name,
            location: q.location_name || '',
            destination: q.destination || '',
            date: q.journey_datetime,
            status: q.status,
          }));
        setRecentQuotes(quotes);
        console.log(`[fetchRecentQuotes] Success: ${quotes.length} quotes found`);
      } else {
        console.warn('[fetchRecentQuotes] API returned success: false');
        setRecentQuotes([]);
      }
    } catch (error) {
      console.log('[fetchRecentQuotes] Error:', error.message);
      if (error.response) {
        console.log('[fetchRecentQuotes] Error Response:', error.response.data);
      }
      setRecentQuotes([]);
    }
  };


  // ────── LIFECYCLE ──────
  useEffect(() => {
    // Fade-in the whole screen
    Animated.timing(fabAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Slide-up modal (initial hidden position)
    Animated.spring(modalSlide, { toValue: 0, friction: 8, useNativeDriver: true }).start();

    initApp();

    (async () => {
      const granted = await requestLocationPermission();
      setLocationPermissionGranted(granted);
      if (granted) {
        getCurrentLocation();
      }
    })();

  }, []);

  const fetchUpcomingBookings = async () => {
    console.log('[fetchUpcomingBookings] Starting...');

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

      console.log('[fetchUpcomingBookings] Response received');

      if (response.data?.success) {
        const bookings = response.data.bookings || [];
        console.log(`[fetchUpcomingBookings] Bookings received: ${bookings.length}`);

        const formatted = bookings.slice(0, 5).map(b => ({
          id: b.id?.toString() || b.booking_number,
          from: b.location_name || 'N/A',
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
        }));

        setUpcomingTrips(formatted);
        console.log('[fetchUpcomingBookings] Upcoming trips set successfully.');
      } else {
        console.warn('[fetchUpcomingBookings] API returned success: false');
      }
    } catch (error) {
      console.log('[fetchUpcomingBookings] Error:', error.message);
      if (error.response) {
        console.log('[fetchUpcomingBookings] Error Response:', error.response.data);
      }
    }
  };
  const handleRefresh = async () => {
    console.log('[handleRefresh] Starting refresh...');
    setIsRefreshing(true);
    try {
      // Refresh fast-changing data with proper error handling
      await Promise.allSettled([
        fetchDashboardStats(),
        fetchUpcomingBookings(),
        fetchRecentQuotes(),
        fetchUnreadNotificationCount(),
      ]);
      console.log('[handleRefresh] Refresh completed successfully');
    } catch (e) {
      console.log('[handleRefresh] Error:', e.message);
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
      }

      // Run all fetch functions in parallel with proper error handling
      await Promise.allSettled([
        fetchDashboardStats(),
        fetchUpcomingBookings(),
        fetchRecentQuotes(),
        fetchUnreadNotificationCount(),
      ]);

      console.log('[initApp] All data fetched successfully');
    } catch (error) {
      console.log('[initApp] Error:', error.message);
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
  const BookingCard = ({ item }) => (
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

  const QuickStats = () => (
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{dashboardStats.active_bookings}</Text>
        <Text style={styles.statLabel}>Active Bookings</Text>
      </View>
      {/* BACKR FUNCTIONALITY COMMENTED OUT */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('BackrTokensScreen')}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {Number(dashboardStats.total_earnings || 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.statLabel}>Backr Earned</Text>
        </View>
      </TouchableOpacity> */}

      <View style={styles.statBox}>
        <Text style={styles.statValue}>{upcomingTrips.length}</Text>
        <Text style={styles.statLabel}>Upcoming Trips</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statValue}>{recentQuotes.length}</Text>
        <Text style={styles.statLabel}>Active Quotes</Text>
      </View>
    </View>
  );

  const HowItWorksSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How TransRentals Works</Text>
      <View style={styles.howItWorksContainer}>
        {HOW_IT_WORKS.map((step, index) => (
          <View key={step.step} style={styles.howStepCard}>
            {/* Step Number with Gradient */}
            <LinearGradient
              colors={['#09B368', '#07A55E']}
              style={styles.stepNumberCircle}
            >
              <Text style={styles.stepNumber}>{step.step}</Text>
            </LinearGradient>

            {/* Step Content */}
            <View style={styles.stepContent}>

              <View style={styles.stepIconTitleRow}>
                <View style={styles.stepIconContainer}>
                  <Icon name={step.icon} size={wp('5%')} color="#09B368" />
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
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
            <Icon name={tip.icon} size={wp('6%')} color={GOLD} />
            <Text style={styles.tipText}>{tip.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ────── MAIN RETURN ──────
  const showSkeleton = isLoading || isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      {/* SPIN AND WIN FAB - COMMENTED OUT */}
      {/* <AnimatedSpinFab onPress={() => setSpinOpen(true)} /> */}


      <StatusBar barStyle="light-content" backgroundColor="#1C1C1C" />

      {/* FIXED ANIMATED HEADER - REDESIGNED */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        {/* Top Row - Profile & Notification */}
        <View style={styles.headerTopRow}>
          {/* Profile Section */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SettingScreen')}
            style={styles.profileSection}
            activeOpacity={0.8}
          >
            {customerImage ? (
              <Image source={{ uri: customerImage }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Icon name="user" size={20} color={BRAND_TEAL} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.greetingLabel}>Welcome back,</Text>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {userName}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.notificationIconWrapper}>
              <Icon name="bell" size={20} color={TEXT_PRIMARY} />
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
            <View style={styles.locationIconWrapper}>
              <Icon name="map-pin" size={14} color={BRAND_TEAL} />
            </View>
            <Text style={styles.locationLabel} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
      </Animated.View>
      {showSkeleton ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: hp('16%'), paddingBottom: hp('12%') }}
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
          <View style={styles.statsRow}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.statBox}>
                <Animated.View style={[styles.skeletonStatValue, { opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonStatLabel, { opacity: skeletonOpacity }]} />
              </View>
            ))}
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
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: hp('16%'), paddingBottom: hp('2%') }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[BRAND_TEAL]}
              tintColor={BRAND_TEAL}
              // 👇 push it a bit down, since you have a fixed header
              progressViewOffset={hp('8%')}
            />
          }
        >

          {/* CATEGORIES GRID */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.id} style={styles.catTile} onPress={() => {
                  if (c.screen) {
                    navigation.navigate(c.screen);
                  } else {
                    Alert.alert('Coming Soon', `We're still working on ${c.label} rentals.`);
                  }
                }}>
                  <View style={styles.catImageBox}>
                    <Image source={c.image} style={styles.catImage} resizeMode="contain" />
                  </View>
                  <Text style={styles.catLabel}>{c.label}</Text>
                  <Text style={styles.catSub}>{c.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* QUICK STATS */}
          <QuickStats />

          {/* UPCOMING BOOKINGS SECTION - Only show when there are bookings */}
          {upcomingTrips.length > 0 && (
            <View style={styles.section}>
              <View style={styles.actHeader}>
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              <View>
                {upcomingTrips.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.upcomingCard}
                    onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
                  >
                    <View style={styles.upcomingLeft}>
                      <View style={styles.upcomingIconBox}>
                        <Icon name="calendar" size={wp('5.5%')} color={BRAND_TEAL} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.upcomingRoute}>{item.from} → {item.to}</Text>
                        <View style={styles.upcomingMeta}>
                          <Icon name="clock" size={14} color={TEXT_SECONDARY} />
                          <Text style={styles.upcomingDate}>{item.date}</Text>
                          <Text style={styles.upcomingDivider}>•</Text>
                          <Text style={styles.upcomingType}>{item.type}</Text>
                        </View>
                        <View style={styles.upcomingFooter}>
                          <Icon name="check-circle" size={16} color={BRAND_TEAL} />
                          <Text style={styles.upcomingStatus}>{item.status}</Text>
                        </View>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={BRAND_TEAL} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ACTIVE QUOTES SECTION */}
          {recentQuotes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.actHeader}>
                <Text style={styles.sectionTitle}>Active Quotes</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentQuotes.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quoteCard}
                  onPress={() => navigation.navigate('ViewQuote', { quoteId: item.id })}
                >
                  <View style={styles.quoteLeft}>
                    <View style={styles.quoteIconBox}>
                      <Icon name="file-text" size={wp('5.5%')} color={GOLD} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteServiceName}>{item.service_name}</Text>
                      <Text style={styles.quoteRouteTxt}>{item.location} → {item.destination || 'Multiple'}</Text>
                      <View style={styles.quoteMeta}>
                        <Icon name="calendar" size={14} color={TEXT_SECONDARY} />
                        <Text style={styles.quoteDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                        <View style={styles.quoteStatusBadge}>
                          <Text style={styles.quoteStatusText}>{item.status}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color={GOLD} />
                </TouchableOpacity>
              ))}
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

          <View style={{ height: hp('12%') }} />
        </Animated.ScrollView>
      )}
      {/* FAB */}


      {/* BOTTOM NAV */}




      <View style={styles.bottomNav}>
        {[
          { icon: 'home', label: 'Home', active: true, screen: null },
          { icon: 'book-open', label: 'Bookings', screen: 'MyBookings' },
          { icon: 'bell', label: 'Notifications', screen: 'Notifications' },
          { icon: 'user', label: 'Profile', screen: 'Profile' },
        ].map((n, i) => (
          <TouchableOpacity
            key={i}
            style={n.active ? styles.navActive : styles.navItem}
            onPress={() => n.screen && navigation.navigate(n.screen)}
          >
            <Icon name={n.icon} size={wp('6.5%')} color={n.active ? BRAND_TEAL : TEXT_SECONDARY} />
            <Text style={n.active ? styles.navActiveTxt : styles.navTxt}>{n.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* REQUIREMENT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: modalSlide }] }]}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>{selectedCategory?.label || 'New Rental'}</Text>
                <Text style={styles.modalSub}>Request quotes for {selectedCategory?.sub || 'any service'}</Text>
              </View>
              <TouchableOpacity onPress={closeModal}><Icon name="x" size={wp('7%')} color="#999" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: hp('3%') }}>
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

            <TouchableOpacity style={styles.postBtn} onPress={postRequirement}>
              <Text style={styles.postBtnTxt}>Get Custom Quotes</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* SPIN AND WIN MODAL - COMMENTED OUT */}
      {/* <SpinAndWinModal
        visible={spinOpen}
        onClose={() => setSpinOpen(false)}
        customerId={customerId}
        prizes={[5, 2, 10, 100, 50, 20, 15, 25]} // customize
      /> */}

    </SafeAreaView>
  );
}

/* ────────────────────── STYLES (Responsive) ────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header (Modern Redesigned)
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    zIndex: 10,
    paddingTop: Platform.select({
      ios: hp('6%'),
      android: (StatusBar.currentHeight ?? 0) + hp('2%')
    }),
    paddingHorizontal: wp('4.5%'),
    paddingBottom: hp('2%'),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  // Header Top Row (Profile + Notification)
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },

  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    borderWidth: 2.5,
    borderColor: BRAND_TEAL_LIGHT,
    backgroundColor: '#F9FAFB',
  },
  profileAvatarPlaceholder: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: BRAND_TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND_TEAL + '30',
  },
  profileInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  greetingLabel: {
    fontSize: wp('3%'),
    color: TEXT_LIGHT,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: hp('0.2%'),
  },
  userName: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },

  // Notification Button
  notificationBtn: {
    marginLeft: wp('3%'),
  },
  notificationIconWrapper: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: CARD,
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
    backgroundColor: BG,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  locationIconWrapper: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: BRAND_TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },
  locationLabel: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
    maxWidth: wp('70%'),
  },
  // Stories
  storiesWrap: { paddingLeft: wp('4%') },
  storiesScroll: { paddingRight: wp('8%') },
  storyAdd: { alignItems: 'center', marginRight: wp('4%') },
  storyRing: { width: wp('21%'), height: wp('21%'), borderRadius: wp('50%'), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: "#35ad31ff", backgroundColor: '#fff' },
  storyItem: { alignItems: 'center', marginRight: wp('4%'), },
  storyLabel: { marginTop: hp('0.5%'), fontSize: wp('3.5%'), color: TEXT_SECONDARY, fontWeight: '500' },

  // Section generic (Premium)
  section: {
    marginTop: hp('2.5%'),
    paddingHorizontal: wp('5%'),
  },
  sectionTitle: {
    fontSize: wp('5.2%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.8%'),
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: wp('3.8%'),
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
  upcomingCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: wp('4.5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: BRAND_TEAL,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_TEAL,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  upcomingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
  },
  upcomingIconBox: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: 14,
    backgroundColor: BRAND_TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND_TEAL + '30',
  },
  upcomingRoute: {
    fontSize: wp('4.4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.6%'),
    letterSpacing: -0.3,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  upcomingDate: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('1%'),
  },
  upcomingDivider: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginHorizontal: wp('2%'),
  },
  upcomingType: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  upcomingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingStatus: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: BRAND_TEAL,
    marginLeft: wp('1%'),
  },

  // Quote Cards (Premium Design)
  quoteCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: wp('4.5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: GOLD,
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quoteLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
  },
  quoteIconBox: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: 14,
    backgroundColor: GOLD_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOLD + '30',
  },
  quoteServiceName: {
    fontSize: wp('4.4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.4%'),
    letterSpacing: -0.3,
  },
  quoteRouteTxt: {
    fontSize: wp('3.6%'),
    color: TEXT_SECONDARY,
    marginBottom: hp('0.5%'),
  },
  quoteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteDate: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    marginLeft: wp('1%'),
    marginRight: wp('2%'),
  },
  quoteStatusBadge: {
    backgroundColor: GOLD + '20',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: 8,
  },
  quoteStatusText: {
    fontSize: wp('3%'),
    color: GOLD,
    fontWeight: '600',
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
    fontSize: wp('3.4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  catSub: {
    fontSize: wp('2.6%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
    textAlign: 'center',
    lineHeight: hp('1.8%'),
  },
  catImageBox: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
    backgroundColor: CARD,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  catImage: {
    width: '85%',
    height: '85%',
    borderRadius: 12,
  },
  // Vendor Spotlight
  vendorCard: { width: CARD_WIDTH, height: hp('18%'), marginRight: wp('4%'), borderRadius: 16, overflow: 'hidden', elevation: 4, marginBottom: hp('1%') },
  vendorGrad: { flex: 1, padding: wp('4%'), justifyContent: 'space-between' },
  vendorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD + '20', borderRadius: 12, paddingHorizontal: wp('2%'), paddingVertical: hp('0.4%') },
  ratingTxt: { marginLeft: wp('1%'), fontSize: wp('3%'), fontWeight: '600', color: GOLD },
  vendorName: { fontSize: wp('4.2%'), fontWeight: 'bold', color: TEXT_PRIMARY },
  vendorVeh: { fontSize: wp('3%'), color: TEXT_SECONDARY },

  // Quick Stats (Premium Design with Shadows)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: CARD,
    paddingVertical: hp('2%'),
    borderRadius: 16,
    marginHorizontal: wp('1.5%'),
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statValue: {
    fontSize: wp('6.5%'),
    fontWeight: '800',
    color: BRAND_TEAL,
    marginBottom: hp('0.3%'),
  },
  statLabel: {
    fontSize: wp('3%'),
    color: TEXT_SECONDARY,
    marginTop: hp('0.3%'),
    textAlign: 'center',
    fontWeight: '500',
  },

  // Activity (Premium Headers)
  actHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
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
  tipBox: { width: wp('44%'), backgroundColor: CARD, borderRadius: 14, padding: wp('4%'), alignItems: 'center', marginBottom: hp('2%'), elevation: 2 },
  tipText: { marginTop: hp('1%'), fontSize: wp('3.6%'), color: TEXT_PRIMARY, textAlign: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: hp('10%'), alignSelf: 'center' },
  fabBtn: { backgroundColor: BRAND_TEAL, flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('6%'), paddingVertical: hp('1.8%'), borderRadius: 40, elevation: 8 },
  fabTxt: { color: '#fff', fontSize: wp('4.2%'), fontWeight: 'bold', marginLeft: wp('2%') },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: CARD, paddingVertical: hp('1.5%'), justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? hp('4%') : hp('1.5%') },
  navActive: { alignItems: 'center' },
  navItem: { alignItems: 'center' },
  navActiveTxt: { color: BRAND_TEAL, fontSize: wp('3%'), marginTop: hp('0.4%'), fontWeight: '700' },
  navTxt: { color: TEXT_SECONDARY, fontSize: wp('3%'), marginTop: hp('0.4%') },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: wp('6%'), maxHeight: hp('85%') },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp('2%') },
  modalTitle: { fontSize: wp('5.5%'), fontWeight: 'bold', color: TEXT_PRIMARY },
  modalSub: { fontSize: wp('3.8%'), color: TEXT_SECONDARY, marginTop: hp('0.5%') },
  inputGroup: { marginBottom: hp('2.5%') },
  label: { fontSize: wp('3.8%'), fontWeight: '600', color: TEXT_PRIMARY, marginBottom: hp('1%') },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#f9f9f9', paddingHorizontal: wp('3%') },
  input: { flex: 1, paddingVertical: hp('1.8%'), fontSize: wp('4%'), color: TEXT_PRIMARY },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: wp('4%'), backgroundColor: '#f9f9f9' },
  dropdownTxt: { fontSize: wp('4%'), color: TEXT_PRIMARY },
  dateBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BRAND_TEAL, borderRadius: 12, padding: wp('4%'), backgroundColor: BRAND_TEAL + '10' },
  dateTxt: { marginLeft: wp('2%'), fontSize: wp('4%'), color: TEXT_PRIMARY, fontWeight: '600' },
  postBtn: { backgroundColor: BRAND_TEAL, paddingVertical: hp('2.2%'), borderRadius: 16, alignItems: 'center', marginTop: hp('1%') },
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

  stepNumberCircle: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
    zIndex: 2,
    elevation: 5,
    shadowColor: '#09B368',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  stepNumber: {
    color: '#FFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },

  stepContent: {
    flex: 1,
    backgroundColor: CARD,
    padding: wp('3%'),
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    fontSize: wp('4.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,

  },

  stepDescription: {
    marginTop: hp('1%'),
    fontSize: wp('3.6%'),
    color: TEXT_SECONDARY,
    lineHeight: hp('2.5%'),
  },

  connectingLine: {
    position: 'absolute',
    top: wp('10%'),
    left: wp('4.5%'),
    width: 2,
    height: '120%',
    backgroundColor: 'rgba(9, 179, 104, 0.2)',
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
    borderRadius: 16,
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
    borderRadius: 20,
    backgroundColor: CARD,
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: BRAND_TEAL_LIGHT,
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
    borderRadius: 20,
    backgroundColor: CARD,
    marginBottom: hp('1.8%'),
    borderLeftWidth: 5,
    borderLeftColor: GOLD_LIGHT,
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
});