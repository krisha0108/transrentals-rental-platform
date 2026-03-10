import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle, AndroidImportance, EventType } from '@notifee/react-native';
import axios from 'axios';
import { debugAuthState, getSessionToken, getVendorNotificationsUnreadCount, saveVendorFcmToken } from './screens/api/client';
import OfflineBanner from './components/OfflineBanner';
import GlobalAlert from './components/GlobalAlert';
import { NotifBadgeContext } from './contexts/NotifBadgeContext';

// Screens
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';

// Auth Screens
import VendorLoginScreen from './screens/vendor/auth/VendorLoginScreen';
import VendorRegisterScreen from './screens/vendor/auth/VendorRegisterScreen';
import ForgotPasswordScreen from './screens/vendor/auth/ForgotPasswordScreen';
import NotVerifiedModal from './screens/vendor/auth/NotVerifiedModal';

// Dashboard
import DashboardScreen from './screens/vendor/dashboard/DashboardScreen';

// Profile & Settings
import ProfileScreen from './screens/vendor/profile/ProfileScreen';

// Documents, Services, Locations
import VendorDocumentsScreen from './screens/vendor/documents/VendorDocumentsScreen';
import VendorServicesScreen from './screens/vendor/services/VendorServicesScreen';
import VendorLocationsScreen from './screens/vendor/locations/VendorLocationsScreen';

// Chat
import ChatListScreen from './screens/vendor/chat/ChatListScreen';
import ChatScreen from './screens/vendor/chat/ChatScreen';

// Notifications
import NotificationsScreen from './screens/vendor/notifications/NotificationsScreen';

// Fleet
import FleetListScreen from './screens/vendor/fleet/FleetListScreen';
import FleetDocumentsScreen from './screens/vendor/fleet/FleetDocumentsScreen';
import FuelTrackingScreen from './screens/vendor/fleet/FuelTrackingScreen';
import IncidentsScreen from './screens/vendor/fleet/IncidentsScreen';
import ServiceMaintenanceScreen from './screens/vendor/fleet/ServiceMaintenanceScreen';

// Staff
import StaffListScreen from './screens/vendor/staff/StaffListScreen';

// Bookings (Main tab - shows all bookings)
import BookingsListScreen from './screens/vendor/bookings/BookingsListScreen';

// Fleet Detail Screens
import VehicleDetailScreen from './screens/vendor/fleet/VehicleDetailScreen';
import AddVehicleScreen from './screens/vendor/fleet/AddVehicleScreen';

// Staff Detail Screens
import StaffDetailScreen from './screens/vendor/staff/StaffDetailScreen';
import AddStaffScreen from './screens/vendor/staff/AddStaffScreen';
import StaffAttendanceScreen from './screens/vendor/staff/StaffAttendanceScreen';
import StaffPayrollScreen from './screens/vendor/staff/StaffPayrollScreen';

// Profile Detail Screens
import BankDetailsScreen from './screens/vendor/profile/BankDetailsScreen';
import BusinessProfileScreen from './screens/vendor/profile/BusinessProfileScreen';
import HelpSupportScreen from './screens/vendor/profile/HelpSupportScreen';
import AboutUsScreen from './screens/vendor/profile/AboutUsScreen';

// Earnings
import EarningsScreen from './screens/vendor/earnings/EarningsScreen';

// Templates
import TemplatesListScreen from './screens/vendor/templates/TemplatesListScreen';
import CreateBusTemplateScreen from './screens/vendor/templates/CreateBusTemplateScreen';
import CreateTruckTemplateScreen from './screens/vendor/templates/CreateTruckTemplateScreen';
import CreateEquipmentTemplateScreen from './screens/vendor/templates/CreateEquipmentTemplateScreen';
import CreateLuxuryTemplateScreen from './screens/vendor/templates/CreateLuxuryTemplateScreen';
import CreatePackersTemplateScreen from './screens/vendor/templates/CreatePackersTemplateScreen';

// Service Home Screens
import BikeHomeScreen from './screens/vendor/services/bike/BikeHomeScreen';
import SelfDriveHomeScreen from './screens/vendor/services/self-drive/SelfDriveHomeScreen';
import CarRentalHomeScreen from './screens/vendor/services/car-rental/CarRentalHomeScreen';
import LuxuryHomeScreen from './screens/vendor/services/luxury/LuxuryHomeScreen';
import BusHomeScreen from './screens/vendor/services/bus/BusHomeScreen';
import TruckHomeScreen from './screens/vendor/services/truck/TruckHomeScreen';
import PackersHomeScreen from './screens/vendor/services/packers/PackersHomeScreen';
import EquipmentHomeScreen from './screens/vendor/services/equipment/EquipmentHomeScreen';

// Service-Specific Booking Screens
import CarRentalBookingsScreen from './screens/vendor/services/car-rental/CarRentalBookingsScreen';
import CarRentalBookingDetailScreen from './screens/vendor/services/car-rental/CarRentalBookingDetailScreen';
import CarRentalCompletedTodayScreen from './screens/vendor/services/car-rental/CarRentalCompletedTodayScreen';
import EquipmentBookingsScreen from './screens/vendor/services/equipment/EquipmentBookingsScreen';
import EquipmentBookingDetailScreen from './screens/vendor/services/equipment/EquipmentBookingDetailScreen';
import BikeBookingsScreen from './screens/vendor/services/bike/BikeBookingsScreen';
import BikeBookingDetailScreen from './screens/vendor/services/bike/BikeBookingDetailScreen';
import BusBookingsScreen from './screens/vendor/services/bus/BusBookingsScreen';
import BusBookingDetailScreen from './screens/vendor/services/bus/BusBookingDetailScreen';
import TruckBookingsScreen from './screens/vendor/services/truck/TruckBookingsScreen';
import TruckBookingDetailScreen from './screens/vendor/services/truck/TruckBookingDetailScreen';
import LuxuryBookingsScreen from './screens/vendor/services/luxury/LuxuryBookingsScreen';
import LuxuryBookingDetailScreen from './screens/vendor/services/luxury/LuxuryBookingDetailScreen';
import PackersBookingsScreen from './screens/vendor/services/packers/PackersBookingsScreen';
import PackersBookingDetailScreen from './screens/vendor/services/packers/PackersBookingDetailScreen';
import SelfDriveBookingsScreen from './screens/vendor/services/self-drive/SelfDriveBookingsScreen';
import SelfDriveBookingDetailScreen from './screens/vendor/services/self-drive/SelfDriveBookingDetailScreen';

// Direct Bookings
import DirectBookingsScreen from './screens/vendor/direct-bookings/DirectBookingsScreen';
import AddDirectBookingScreen from './screens/vendor/direct-bookings/AddDirectBookingScreen';
import DirectBookingDetailScreen from './screens/vendor/direct-bookings/DirectBookingDetailScreen';

// Booking Links
import BookingLinksScreen from './screens/vendor/booking-links/BookingLinksScreen';

// Financials
import FinancialsScreen from './screens/vendor/financials/FinancialsScreen';

// P2P Marketplace
import P2PDashboardScreen from './screens/vendor/p2p/P2PDashboardScreen';
import BrowseVehiclesScreen from './screens/vendor/p2p/BrowseVehiclesScreen';
import BrowseBookingsScreen from './screens/vendor/p2p/BrowseBookingsScreen';
import PostVehicleScreen from './screens/vendor/p2p/PostVehicleScreen';
import PostBookingScreen from './screens/vendor/p2p/PostBookingScreen';
import MyPostingsScreen from './screens/vendor/p2p/MyPostingsScreen';
import P2PActivityScreen from './screens/vendor/p2p/P2PActivityScreen';

// Service-Specific Quote Screens
import BikeMyQuotesScreen from './screens/vendor/services/bike/BikeMyQuotesScreen';
import BikeQuoteDetailScreen from './screens/vendor/services/bike/BikeQuoteDetailScreen';
import BikeQuoteRequestsScreen from './screens/vendor/services/bike/BikeQuoteRequestsScreen';
import BikeQuoteRequestDetailScreen from './screens/vendor/services/bike/BikeQuoteRequestDetailScreen';
import BikeSendQuoteScreen from './screens/vendor/services/bike/BikeSendQuoteScreen';
import BikeTemplatesScreen from './screens/vendor/services/bike/BikeTemplatesScreen';
import BikeCreateTemplateScreen from './screens/vendor/services/bike/BikeCreateTemplateScreen';
import BikeEditTemplateScreen from './screens/vendor/services/bike/BikeEditTemplateScreen';

import BusMyQuotesScreen from './screens/vendor/services/bus/BusMyQuotesScreen';
import BusQuoteDetailScreen from './screens/vendor/services/bus/BusQuoteDetailScreen';
import BusQuoteRequestsScreen from './screens/vendor/services/bus/BusQuoteRequestsScreen';
import BusQuoteRequestDetailScreen from './screens/vendor/services/bus/BusQuoteRequestDetailScreen';
import BusSendQuoteScreen from './screens/vendor/services/bus/BusSendQuoteScreen';
import BusTemplatesScreen from './screens/vendor/services/bus/BusTemplatesScreen';
import BusCreateTemplateScreen from './screens/vendor/services/bus/BusCreateTemplateScreen';
import BusEditTemplateScreen from './screens/vendor/services/bus/BusEditTemplateScreen';

import TruckMyQuotesScreen from './screens/vendor/services/truck/TruckMyQuotesScreen';
import TruckQuoteDetailScreen from './screens/vendor/services/truck/TruckQuoteDetailScreen';
import TruckQuoteRequestsScreen from './screens/vendor/services/truck/TruckQuoteRequestsScreen';
import TruckQuoteRequestDetailScreen from './screens/vendor/services/truck/TruckQuoteRequestDetailScreen';
import TruckSendQuoteScreen from './screens/vendor/services/truck/TruckSendQuoteScreen';
import TruckTemplatesScreen from './screens/vendor/services/truck/TruckTemplatesScreen';
import TruckCreateTemplateScreen from './screens/vendor/services/truck/TruckCreateTemplateScreen';
import TruckEditTemplateScreen from './screens/vendor/services/truck/TruckEditTemplateScreen';

import LuxuryMyQuotesScreen from './screens/vendor/services/luxury/LuxuryMyQuotesScreen';
import LuxuryQuoteDetailScreen from './screens/vendor/services/luxury/LuxuryQuoteDetailScreen';
import LuxuryQuoteRequestsScreen from './screens/vendor/services/luxury/LuxuryQuoteRequestsScreen';
import LuxuryQuoteRequestDetailScreen from './screens/vendor/services/luxury/LuxuryQuoteRequestDetailScreen';
import LuxurySendQuoteScreen from './screens/vendor/services/luxury/LuxurySendQuoteScreen';
import LuxuryTemplatesScreen from './screens/vendor/services/luxury/LuxuryTemplatesScreen';
import LuxuryCreateTemplateScreen from './screens/vendor/services/luxury/LuxuryCreateTemplateScreen';
import LuxuryEditTemplateScreen from './screens/vendor/services/luxury/LuxuryEditTemplateScreen';

import PackersMyQuotesScreen from './screens/vendor/services/packers/PackersMyQuotesScreen';
import PackersQuoteDetailScreen from './screens/vendor/services/packers/PackersQuoteDetailScreen';
import PackersQuoteRequestsScreen from './screens/vendor/services/packers/PackersQuoteRequestsScreen';
import PackersQuoteRequestDetailScreen from './screens/vendor/services/packers/PackersQuoteRequestDetailScreen';
import PackersSendQuoteScreen from './screens/vendor/services/packers/PackersSendQuoteScreen';
import PackersTemplatesScreen from './screens/vendor/services/packers/PackersTemplatesScreen';
import PackersCreateTemplateScreen from './screens/vendor/services/packers/PackersCreateTemplateScreen';
import PackersEditTemplateScreen from './screens/vendor/services/packers/PackersEditTemplateScreen';
import EquipmentTemplatesScreen from './screens/vendor/services/equipment/EquipmentTemplatesScreen';
import EquipmentCreateTemplateScreen from './screens/vendor/services/equipment/EquipmentCreateTemplateScreen';
import EquipmentEditTemplateScreen from './screens/vendor/services/equipment/EquipmentEditTemplateScreen';

import EquipmentMyQuotesScreen from './screens/vendor/services/equipment/EquipmentMyQuotesScreen';
import EquipmentQuoteDetailScreen from './screens/vendor/services/equipment/EquipmentQuoteDetailScreen';
import EquipmentQuoteRequestsScreen from './screens/vendor/services/equipment/EquipmentQuoteRequestsScreen';
import EquipmentQuoteRequestDetailScreen from './screens/vendor/services/equipment/EquipmentQuoteRequestDetailScreen';
import EquipmentSendQuoteScreen from './screens/vendor/services/equipment/EquipmentSendQuoteScreen';

import SelfDriveMyQuotesScreen from './screens/vendor/services/self-drive/SelfDriveMyQuotesScreen';
import SelfDriveQuoteDetailScreen from './screens/vendor/services/self-drive/SelfDriveQuoteDetailScreen';
import SelfDriveQuoteRequestsScreen from './screens/vendor/services/self-drive/SelfDriveQuoteRequestsScreen';
import SelfDriveQuoteRequestDetailScreen from './screens/vendor/services/self-drive/SelfDriveQuoteRequestDetailScreen';
import SelfDriveSendQuoteScreen from './screens/vendor/services/self-drive/SelfDriveSendQuoteScreen';
import SelfDriveTemplatesScreen from './screens/vendor/services/self-drive/SelfDriveTemplatesScreen';
import SelfDriveCreateTemplateScreen from './screens/vendor/services/self-drive/SelfDriveCreateTemplateScreen';
import SelfDriveEditTemplateScreen from './screens/vendor/services/self-drive/SelfDriveEditTemplateScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Color Constants
const C = {
  brand: '#22C55E',
  brandDark: '#16A34A',
  brandLight: '#DCFCE7',
  text: '#0F172A',
  muted: '#6B7280',
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  gold: '#EAB308',
};

// Custom Tab Bar Component for premium look
function CustomTabBar({ state, descriptors, navigation }) {
  const { unreadCount } = React.useContext(NotifBadgeContext);
  const tabs = [
    { name: 'Dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { name: 'Bookings', icon: 'calendar', iconOutline: 'calendar-outline', label: 'Bookings' },
    { name: 'Fleet', icon: 'car-sport', iconOutline: 'car-sport-outline', label: 'Fleet' },
    { name: 'Chats', icon: 'chatbubble-ellipses', iconOutline: 'chatbubble-ellipses-outline', label: 'Chats' },
    { name: 'Profile', icon: 'person-circle', iconOutline: 'person-circle-outline', label: 'Profile' },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = tabs[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {/* Active indicator line */}
              {isFocused && <View style={styles.activeIndicator} />}

              {/* Icon container with glow effect */}
              <View style={[styles.iconBox, isFocused && styles.iconBoxActive]}>
                <Ionicons
                  name={isFocused ? tab.icon : tab.iconOutline}
                  size={isFocused ? 24 : 22}
                  color={isFocused ? '#fff' : C.muted}
                />
                {/* Unread notification badge on Dashboard tab */}
                {index === 0 && unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>

              {/* Dot indicator for active state */}
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Enhanced Bottom Tab Navigator with 5 tabs
function VendorBottomNavigation() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={BookingsListScreen} />
      <Tab.Screen name="Fleet" component={FleetListScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Splash Screen Wrapper
function SplashScreenWrapper() {
  const navigation = useNavigation();

  const handleFinish = async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[App] 🔍 SPLASH SCREEN - Checking authentication...');

      // Check all possible token storage keys
      const sessionToken = await AsyncStorage.getItem('nextauth_session_token');
      const vendorToken = await AsyncStorage.getItem('vendor_token');
      const vendorStr = await AsyncStorage.getItem('vendor');
      const vendorId = await AsyncStorage.getItem('vendor_id');

      console.log('[App] 📦 Storage Check:');
      console.log('  - nextauth_session_token:', sessionToken ? `${sessionToken.substring(0, 30)}...` : 'NULL');
      console.log('  - vendor_token:', vendorToken ? 'EXISTS' : 'NULL');
      console.log('  - vendor data:', vendorStr ? 'EXISTS' : 'NULL');
      console.log('  - vendor_id:', vendorId || 'NULL');

      // Use proper auth function to load token
      const token = await getSessionToken();
      console.log('[App] 🔑 getSessionToken() result:', token ? `${token.substring(0, 30)}...` : 'NULL');

      // Debug full auth state
      const authState = await debugAuthState();
      console.log('[App] 📊 Auth State:', authState);

      if (token && token.length > 0) {
        console.log('[App] ✅ Token found! User is authenticated');

        if (vendorStr) {
          try {
            const vendor = JSON.parse(vendorStr);
            console.log('[App] 👤 Vendor Status:', vendor.status);
            console.log('[App] 👤 Vendor ID:', vendor.id);
            console.log('[App] 👤 Vendor Email:', vendor.email);

            if (vendor.status === 'DOCUMENTS_PENDING') {
              console.log('[App] 📄 Redirecting to Documents...');
              navigation.replace('VendorDocuments');
              return;
            }
            if (vendor.status === 'SERVICES_PENDING') {
              console.log('[App] 🔧 Redirecting to Services...');
              navigation.replace('VendorServices');
              return;
            }
            if (vendor.status === 'LOCATIONS_PENDING') {
              console.log('[App] 📍 Redirecting to Locations...');
              navigation.replace('VendorLocations');
              return;
            }
          } catch (e) {
            console.error('[App] ❌ Error parsing vendor:', e);
          }
        }

        console.log('[App] 🏠 Redirecting to Dashboard...');
        navigation.replace('VendorDashboard');
        return;
      }

      console.log('[App] ⚠️ No token found - going to onboarding');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      navigation.replace('Onboarding');
    } catch (error) {
      console.error('[App] 💥 Session check error:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      navigation.replace('Onboarding');
    }
  };

  return <SplashScreen onFinish={handleFinish} />;
}

// Bump this version whenever you add/change notification sounds
// This forces channels to be deleted and recreated with new sounds
const NOTIF_CHANNEL_VERSION = '4';

// Notification Channel Setup
async function createNotificationChannels() {
  try {
    const storedVersion = await AsyncStorage.getItem('notif_channel_version');
    if (storedVersion === NOTIF_CHANNEL_VERSION) return; // already up to date

    // Delete old channels so Android picks up new sounds
    const channelIds = [
      'default_v3',
      'payment_channel',
      'chat_channel',
      'trip_complete_channel',
      'trip_started_channel',
      'booking_confirmed_channel',
    ];
    await Promise.all(channelIds.map((id) => notifee.deleteChannel(id).catch(() => {})));

    // Recreate all channels with correct sounds
    await notifee.createChannel({
      id: 'default_v3',
      name: 'Quote Requests',
      importance: AndroidImportance.HIGH,
      sound: 'notification_sound',
    });
    await notifee.createChannel({
      id: 'payment_channel',
      name: 'Payment Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'payment',
    });
    await notifee.createChannel({
      id: 'chat_channel',
      name: 'Chat Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'chat',
    });
    await notifee.createChannel({
      id: 'trip_complete_channel',
      name: 'Trip Complete',
      importance: AndroidImportance.HIGH,
      sound: 'trip_completed',
    });
    await notifee.createChannel({
      id: 'trip_started_channel',
      name: 'Trip Started',
      importance: AndroidImportance.HIGH,
      sound: 'trip_started',
    });
    await notifee.createChannel({
      id: 'booking_confirmed_channel',
      name: 'Booking Confirmed',
      importance: AndroidImportance.HIGH,
      sound: 'booking_confirmed',
    });

    await AsyncStorage.setItem('notif_channel_version', NOTIF_CHANNEL_VERSION);
    console.log('[Channels] Notification channels created/updated successfully');
  } catch (err) {
    console.error('[Channels] Failed to create notification channels:', err);
  }
}

// Navigation ref for notification handling
const navigationRef = React.createRef();
const isNavigationReadyRef = React.createRef();
const pendingNavigateDataRef = React.createRef();

const QUOTE_SCREEN_MAP = {
  bike: 'BikeQuoteRequestDetail',
  bus: 'BusQuoteRequestDetail',
  truck: 'TruckQuoteRequestDetail',
  luxury: 'LuxuryQuoteRequestDetail',
  packers: 'PackersQuoteRequestDetail',
  equipment: 'EquipmentQuoteRequestDetail',
  'self-drive': 'SelfDriveQuoteRequestDetail',
};

const BOOKING_DETAIL_SCREEN_MAP = {
  bike: 'BikeBookingDetail',
  car: 'CarRentalBookingDetail',
  chauffeur: 'CarRentalBookingDetail',
  'chauffeur-service': 'CarRentalBookingDetail',
  'self-drive': 'SelfDriveBookingDetail',
  bus: 'BusBookingDetail',
  'bus-rental': 'BusBookingDetail',
  truck: 'TruckBookingDetail',
  'truck-rental': 'TruckBookingDetail',
  luxury: 'LuxuryBookingDetail',
  'luxury-car-rental': 'LuxuryBookingDetail',
  packers: 'PackersBookingDetail',
  'packers-and-movers': 'PackersBookingDetail',
  equipment: 'EquipmentBookingDetail',
  'equipment-rental': 'EquipmentBookingDetail',
};

function getNotifChannelForType(type) {
  if (type === 'payment_received' || type === 'payment' || type === 'advance_paid') {
    return { channelId: 'payment_channel', sound: 'payment' };
  }
  if (type === 'chat' || type === 'new_message') {
    return { channelId: 'chat_channel', sound: 'chat' };
  }
  if (type === 'trip_started') {
    return { channelId: 'trip_started_channel', sound: 'trip_started' };
  }
  if (type === 'trip_complete' || type === 'trip_completed') {
    return { channelId: 'trip_complete_channel', sound: 'trip_completed' };
  }
  if (
    type === 'booking_confirmed' ||
    type === 'booking_assigned' ||
    type === 'booking_accepted' ||
    type === 'quote_accepted'
  ) {
    return { channelId: 'booking_confirmed_channel', sound: 'booking_confirmed' };
  }
  return { channelId: 'default_v3', sound: 'notification_sound' };
}

function navigateByData(data) {
  if (!data || !navigationRef.current) return;

  const screen = data.screen;
  const bookingId = data.booking_id || data.bookingId;

  // Payment / booking confirmed → service-specific booking detail
  if ((screen === 'BookingDetail' || screen === 'ViewBookingScreen') && bookingId) {
    const serviceScreen = BOOKING_DETAIL_SCREEN_MAP[data.serviceType];
    if (serviceScreen) {
      navigationRef.current.navigate(serviceScreen, { bookingId });
      return;
    }
  }
  // Chat notification → open chat screen
  if ((screen === 'ChatDetail' || screen === 'ChatScreen') && bookingId) {
    navigationRef.current.navigate('ChatScreen', { bookingId });
    return;
  }
  // Quote request → service-specific quote detail
  if (screen === 'QuoteRequestDetail' && data.serviceType && data.requestId) {
    const screenName = QUOTE_SCREEN_MAP[data.serviceType];
    if (screenName) {
      navigationRef.current.navigate(screenName, { requestId: data.requestId });
      return;
    }
  }
  console.log('[Nav] Unknown screen for navigation:', screen, data);
}

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshBadge = React.useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) return; // not logged in yet — skip
      const res = await getVendorNotificationsUnreadCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch {
      // silently ignore — not critical
    }
  }, []);

  useEffect(() => {
    createNotificationChannels();
    checkNotificationPermission();
    refreshBadge();

    // Handle foreground notifications
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground Message:', remoteMessage);
      refreshBadge();
      const image =
        remoteMessage?.data?.image ||
        remoteMessage?.notification?.android?.imageUrl ||
        null;
      const notifType = remoteMessage?.data?.type || '';
      const { channelId, sound } = getNotifChannelForType(notifType);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Message',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage?.data || {},
        ios: { sound: 'default' },
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound,
          smallIcon: 'ic_notification',
          pressAction: { id: 'default' },
          style:
            image && image !== 'null'
              ? {
                  type: AndroidStyle.BIGPICTURE,
                  picture: image,
                }
              : undefined,
        },
      });
    });

    // Handle notification opened from background
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened (background):', remoteMessage);
      navigateByData(remoteMessage?.data);
    });

    // Handle notification opened from quit (cold start)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Initial notification (quit):', remoteMessage);
          navigateByData(remoteMessage?.data);
        }
      });

    // Notifee foreground press events
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        navigateByData(detail?.notification?.data);
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOpened();
      unsubscribeNotifee();
    };
  }, [refreshBadge]);

  async function checkNotificationPermission() {
    const authStatus = await messaging().requestPermission();
    if (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    ) {
      setPermissionGranted(true);
      console.log('Notification permission granted');
      await getTokenAndSend();
    } else {
      setPermissionGranted(false);
      console.log('Notification permission denied');
    }
  }

  async function getTokenAndSend() {
    const token = await getSessionToken();
    if (!token) return; // not logged in yet — skip
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    if (fcmToken) {
      try {
        await saveVendorFcmToken(fcmToken);
        console.log('FCM token sent to backend');
      } catch (error) {
        console.log('Error sending FCM token:', error.message);
      }
    }
  }

  return (
    <NotifBadgeContext.Provider value={{ unreadCount, refreshBadge }}>
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          isNavigationReadyRef.current = true;
          if (pendingNavigateDataRef.current) {
            const d = pendingNavigateDataRef.current;
            pendingNavigateDataRef.current = null;
            navigateByData(d);
          }
        }}
      >
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          {/* Auth Flow */}
          <Stack.Screen name="Splash" component={SplashScreenWrapper} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="VendorLoginScreen" component={VendorLoginScreen} />
          <Stack.Screen name="VendorRegisterScreen" component={VendorRegisterScreen} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
          <Stack.Screen name="NotVerifiedModal" component={NotVerifiedModal} />

          {/* Main App (Bottom Tabs) */}
          <Stack.Screen name="VendorDashboard" component={VendorBottomNavigation} />

          {/* Onboarding Screens */}
          <Stack.Screen name="VendorDocuments" component={VendorDocumentsScreen} />
          <Stack.Screen name="VendorServices" component={VendorServicesScreen} />
          <Stack.Screen name="VendorLocations" component={VendorLocationsScreen} />

          {/* Modal Screens */}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            {/* Profile & Settings */}
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />

            {/* Chat */}
            <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />

            {/* Fleet */}
            <Stack.Screen name="FleetListScreen" component={FleetListScreen} />

            {/* Staff */}
            <Stack.Screen name="StaffListScreen" component={StaffListScreen} />

            {/* Old wrapper screens removed - now using service-specific screens */}

            {/* Quote Requests - now service-specific */}
            {/* Main Bookings Tab Screen (shows all bookings) */}
            <Stack.Screen name="BookingsListScreen" component={BookingsListScreen} />

            {/* Fleet Screens */}
            <Stack.Screen name="VehicleDetailScreen" component={VehicleDetailScreen} />
            <Stack.Screen name="AddVehicleScreen" component={AddVehicleScreen} />
            <Stack.Screen name="FleetDocumentsScreen" component={FleetDocumentsScreen} />
            <Stack.Screen name="FuelTrackingScreen" component={FuelTrackingScreen} />
            <Stack.Screen name="IncidentsScreen" component={IncidentsScreen} />
            <Stack.Screen name="ServiceMaintenanceScreen" component={ServiceMaintenanceScreen} />

            {/* Staff Screens */}
            <Stack.Screen name="StaffDetailScreen" component={StaffDetailScreen} />
            <Stack.Screen name="AddStaffScreen" component={AddStaffScreen} />
            <Stack.Screen name="StaffAttendanceScreen" component={StaffAttendanceScreen} />
            <Stack.Screen name="StaffPayrollScreen" component={StaffPayrollScreen} />

            {/* Profile Screens */}
            <Stack.Screen name="BankDetailsScreen" component={BankDetailsScreen} />
            <Stack.Screen name="BusinessProfileScreen" component={BusinessProfileScreen} />
            <Stack.Screen name="HelpSupportScreen" component={HelpSupportScreen} />
            <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />

            {/* Earnings */}
            <Stack.Screen name="EarningsScreen" component={EarningsScreen} />

            {/* Templates */}
            <Stack.Screen name="TemplatesListScreen" component={TemplatesListScreen} />
            <Stack.Screen name="CreateBusTemplateScreen" component={CreateBusTemplateScreen} />
            <Stack.Screen name="CreateTruckTemplateScreen" component={CreateTruckTemplateScreen} />
            <Stack.Screen name="CreateEquipmentTemplateScreen" component={CreateEquipmentTemplateScreen} />
            <Stack.Screen name="CreateLuxuryTemplateScreen" component={CreateLuxuryTemplateScreen} />
            <Stack.Screen name="CreatePackersTemplateScreen" component={CreatePackersTemplateScreen} />

            {/* Service Home Screens */}
            <Stack.Screen name="BikeHomeScreen" component={BikeHomeScreen} />
            <Stack.Screen name="SelfDriveHomeScreen" component={SelfDriveHomeScreen} />
            <Stack.Screen name="CarRentalHomeScreen" component={CarRentalHomeScreen} />
            <Stack.Screen name="LuxuryHomeScreen" component={LuxuryHomeScreen} />
            <Stack.Screen name="BusHomeScreen" component={BusHomeScreen} />
            <Stack.Screen name="TruckHomeScreen" component={TruckHomeScreen} />
            <Stack.Screen name="PackersHomeScreen" component={PackersHomeScreen} />
            <Stack.Screen name="EquipmentHomeScreen" component={EquipmentHomeScreen} />

            {/* Service-Specific Booking Screens */}
            <Stack.Screen name="CarRentalBookings" component={CarRentalBookingsScreen} />
            <Stack.Screen name="CarRentalBookingDetail" component={CarRentalBookingDetailScreen} />
            <Stack.Screen name="CarRentalCompletedToday" component={CarRentalCompletedTodayScreen} />
            <Stack.Screen name="EquipmentBookings" component={EquipmentBookingsScreen} />
            <Stack.Screen name="EquipmentBookingDetail" component={EquipmentBookingDetailScreen} />
            <Stack.Screen name="BikeBookings" component={BikeBookingsScreen} />
            <Stack.Screen name="BikeBookingDetail" component={BikeBookingDetailScreen} />
            <Stack.Screen name="BusBookings" component={BusBookingsScreen} />
            <Stack.Screen name="BusBookingDetail" component={BusBookingDetailScreen} />
            <Stack.Screen name="TruckBookings" component={TruckBookingsScreen} />
            <Stack.Screen name="TruckBookingDetail" component={TruckBookingDetailScreen} />
            <Stack.Screen name="LuxuryBookings" component={LuxuryBookingsScreen} />
            <Stack.Screen name="LuxuryBookingDetail" component={LuxuryBookingDetailScreen} />
            <Stack.Screen name="PackersBookings" component={PackersBookingsScreen} />
            <Stack.Screen name="PackersBookingDetail" component={PackersBookingDetailScreen} />
            <Stack.Screen name="SelfDriveBookings" component={SelfDriveBookingsScreen} />
            <Stack.Screen name="SelfDriveBookingDetail" component={SelfDriveBookingDetailScreen} />

            {/* Direct Bookings */}
            <Stack.Screen name="DirectBookings" component={DirectBookingsScreen} />
            <Stack.Screen name="AddDirectBooking" component={AddDirectBookingScreen} />
            <Stack.Screen name="DirectBookingDetail" component={DirectBookingDetailScreen} />

            {/* Booking Links */}
            <Stack.Screen name="BookingLinks" component={BookingLinksScreen} />

            {/* Financials */}
            <Stack.Screen name="Financials" component={FinancialsScreen} />

            {/* P2P Marketplace */}
            <Stack.Screen name="P2PDashboard" component={P2PDashboardScreen} />
            <Stack.Screen name="BrowseVehiclesScreen" component={BrowseVehiclesScreen} />
            <Stack.Screen name="BrowseBookingsScreen" component={BrowseBookingsScreen} />
            <Stack.Screen name="PostVehicleScreen" component={PostVehicleScreen} />
            <Stack.Screen name="PostBookingScreen" component={PostBookingScreen} />
            <Stack.Screen name="MyPostingsScreen" component={MyPostingsScreen} />
            <Stack.Screen name="P2PActivityScreen" component={P2PActivityScreen} />

            {/* Service-Specific Quote Screens */}
            {/* Bike */}
            <Stack.Screen name="BikeMyQuotes" component={BikeMyQuotesScreen} />
            <Stack.Screen name="BikeQuoteDetail" component={BikeQuoteDetailScreen} />
            <Stack.Screen name="BikeQuoteRequests" component={BikeQuoteRequestsScreen} />
            <Stack.Screen name="BikeQuoteRequestDetail" component={BikeQuoteRequestDetailScreen} />
            <Stack.Screen name="BikeSendQuote" component={BikeSendQuoteScreen} />
            <Stack.Screen name="BikeTemplates" component={BikeTemplatesScreen} />
            <Stack.Screen name="BikeCreateTemplate" component={BikeCreateTemplateScreen} />
            <Stack.Screen name="BikeEditTemplate" component={BikeEditTemplateScreen} />

            {/* Bus */}
            <Stack.Screen name="BusMyQuotes" component={BusMyQuotesScreen} />
            <Stack.Screen name="BusQuoteDetail" component={BusQuoteDetailScreen} />
            <Stack.Screen name="BusQuoteRequests" component={BusQuoteRequestsScreen} />
            <Stack.Screen name="BusQuoteRequestDetail" component={BusQuoteRequestDetailScreen} />
            <Stack.Screen name="BusSendQuote" component={BusSendQuoteScreen} />
            <Stack.Screen name="BusTemplates" component={BusTemplatesScreen} />
            <Stack.Screen name="BusCreateTemplate" component={BusCreateTemplateScreen} />
            <Stack.Screen name="BusEditTemplate" component={BusEditTemplateScreen} />

            {/* Truck */}
            <Stack.Screen name="TruckMyQuotes" component={TruckMyQuotesScreen} />
            <Stack.Screen name="TruckQuoteDetail" component={TruckQuoteDetailScreen} />
            <Stack.Screen name="TruckQuoteRequests" component={TruckQuoteRequestsScreen} />
            <Stack.Screen name="TruckQuoteRequestDetail" component={TruckQuoteRequestDetailScreen} />
            <Stack.Screen name="TruckSendQuote" component={TruckSendQuoteScreen} />
            <Stack.Screen name="TruckTemplates" component={TruckTemplatesScreen} />
            <Stack.Screen name="TruckCreateTemplate" component={TruckCreateTemplateScreen} />
            <Stack.Screen name="TruckEditTemplate" component={TruckEditTemplateScreen} />

            {/* Luxury */}
            <Stack.Screen name="LuxuryMyQuotes" component={LuxuryMyQuotesScreen} />
            <Stack.Screen name="LuxuryQuoteDetail" component={LuxuryQuoteDetailScreen} />
            <Stack.Screen name="LuxuryQuoteRequests" component={LuxuryQuoteRequestsScreen} />
            <Stack.Screen name="LuxuryQuoteRequestDetail" component={LuxuryQuoteRequestDetailScreen} />
            <Stack.Screen name="LuxurySendQuote" component={LuxurySendQuoteScreen} />
            <Stack.Screen name="LuxuryTemplates" component={LuxuryTemplatesScreen} />
            <Stack.Screen name="LuxuryCreateTemplate" component={LuxuryCreateTemplateScreen} />
            <Stack.Screen name="LuxuryEditTemplate" component={LuxuryEditTemplateScreen} />

            {/* Packers */}
            <Stack.Screen name="PackersMyQuotes" component={PackersMyQuotesScreen} />
            <Stack.Screen name="PackersQuoteDetail" component={PackersQuoteDetailScreen} />
            <Stack.Screen name="PackersQuoteRequests" component={PackersQuoteRequestsScreen} />
            <Stack.Screen name="PackersQuoteRequestDetail" component={PackersQuoteRequestDetailScreen} />
            <Stack.Screen name="PackersSendQuote" component={PackersSendQuoteScreen} />
            <Stack.Screen name="PackersTemplates" component={PackersTemplatesScreen} />
            <Stack.Screen name="PackersCreateTemplate" component={PackersCreateTemplateScreen} />
            <Stack.Screen name="PackersEditTemplate" component={PackersEditTemplateScreen} />

            {/* Equipment */}
            <Stack.Screen name="EquipmentMyQuotes" component={EquipmentMyQuotesScreen} />
            <Stack.Screen name="EquipmentQuoteDetail" component={EquipmentQuoteDetailScreen} />
            <Stack.Screen name="EquipmentQuoteRequests" component={EquipmentQuoteRequestsScreen} />
            <Stack.Screen name="EquipmentQuoteRequestDetail" component={EquipmentQuoteRequestDetailScreen} />
            <Stack.Screen name="EquipmentSendQuote" component={EquipmentSendQuoteScreen} />
            <Stack.Screen name="EquipmentTemplates" component={EquipmentTemplatesScreen} />
            <Stack.Screen name="EquipmentCreateTemplate" component={EquipmentCreateTemplateScreen} />
            <Stack.Screen name="EquipmentEditTemplate" component={EquipmentEditTemplateScreen} />

            {/* Self Drive */}
            <Stack.Screen name="SelfDriveMyQuotes" component={SelfDriveMyQuotesScreen} />
            <Stack.Screen name="SelfDriveQuoteDetail" component={SelfDriveQuoteDetailScreen} />
            <Stack.Screen name="SelfDriveQuoteRequests" component={SelfDriveQuoteRequestsScreen} />
            <Stack.Screen name="SelfDriveQuoteRequestDetail" component={SelfDriveQuoteRequestDetailScreen} />
            <Stack.Screen name="SelfDriveSendQuote" component={SelfDriveSendQuoteScreen} />
            <Stack.Screen name="SelfDriveTemplates" component={SelfDriveTemplatesScreen} />
            <Stack.Screen name="SelfDriveCreateTemplate" component={SelfDriveCreateTemplateScreen} />
            <Stack.Screen name="SelfDriveEditTemplate" component={SelfDriveEditTemplateScreen} />

          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
      <OfflineBanner />
      <GlobalAlert />
    </SafeAreaProvider>
    </NotifBadgeContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Premium Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    // Premium shadow effect
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
    // Subtle border
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: C.brand,
    borderRadius: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBoxActive: {
    backgroundColor: C.brand,
    // Glow effect
    shadowColor: C.brand,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    // Slight scale effect handled by icon size
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: C.muted,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: C.brand,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.brand,
    marginTop: 3,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});
