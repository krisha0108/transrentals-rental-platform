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
  Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import VendorActivityTracker from './hooks/VendorActivityTracker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle, AndroidImportance, EventType } from '@notifee/react-native';
import axios from 'axios';
import { debugAuthState, getSessionToken, getVendorNotificationsUnreadCount, saveVendorFcmToken, setOnSessionExpired } from './screens/api/client';
import { saveTravelAgentFcmToken, getTravelAgentProfile } from './screens/api/travelAgentClient';
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

// Travel Agent — Auth, Dashboard, Onboarding, Placeholders (Phase 1)
import TravelAgentRegisterScreen from './screens/travel-agent/auth/TravelAgentRegisterScreen';
import TravelAgentForgotPasswordScreen from './screens/travel-agent/auth/TravelAgentForgotPasswordScreen';
import TravelAgentBottomNavigation from './screens/travel-agent/TravelAgentBottomNavigation';
// Phase 1 onboarding placeholders for TravelAgentDocuments + TravelAgentGetStarted
// were both upgraded to real screens (DocumentsScreen in P4, GetStartedScreen here).
import TAGetStartedScreen from './screens/travel-agent/onboarding/GetStartedScreen';
import TAAgencyProfileScreen from './screens/travel-agent/profile/AgencyProfileScreen';

// Travel Agent — Phase 2 (CRM Core: Leads + Pipeline + Follow-ups + Notifications)
import TAPipelineScreen from './screens/travel-agent/leads/PipelineScreen';
import TAFollowUpsScreen from './screens/travel-agent/leads/FollowUpsScreen';
import TAAddEditLeadScreen from './screens/travel-agent/leads/AddEditLeadScreen';
import TALeadDetailScreen from './screens/travel-agent/leads/LeadDetailScreen';
import TANotificationsScreen from './screens/travel-agent/notifications/NotificationsScreen';

// Travel Agent — Phase 3 (Bookings + Listings: Tours / Properties / Fleet / Quote Requests)
import TAAddEditBookingScreen from './screens/travel-agent/bookings/AddEditBookingScreen';
import TABookingDetailScreen from './screens/travel-agent/bookings/BookingDetailScreen';
import TASelfBookingDetailScreen from './screens/travel-agent/bookings/SelfBookingDetailScreen';
import TAToursListScreen from './screens/travel-agent/tours/ToursListScreen';
import TAAddEditTourScreen from './screens/travel-agent/tours/AddEditTourScreen';
import TATourPreviewScreen from './screens/travel-agent/tours/TourPreviewScreen';
import TATourQuoteRequestsScreen from './screens/travel-agent/tours/TourQuoteRequestsScreen';
import TAPropertiesListScreen from './screens/travel-agent/properties/PropertiesListScreen';
import TAAddEditPropertyScreen from './screens/travel-agent/properties/AddEditPropertyScreen';
import TAPropertyDetailScreen from './screens/travel-agent/properties/PropertyDetailScreen';
import TAFleetListScreen from './screens/travel-agent/fleet/FleetListScreen';
import TAAddEditFleetScreen from './screens/travel-agent/fleet/AddEditFleetScreen';
import TAFleetVehicleDetailScreen from './screens/travel-agent/fleet/FleetVehicleDetailScreen';
import TAFleetCalendarScreen from './screens/travel-agent/fleet/FleetCalendarScreen';
import TAFleetInsuranceScreen from './screens/travel-agent/fleet/FleetInsuranceScreen';

// Travel Agent — Phase 4 (Money + Docs: Earnings / Payments / Bank Details / Documents)
import TAEarningsScreen from './screens/travel-agent/earnings/EarningsScreen';
import TAPaymentsScreen from './screens/travel-agent/payments/PaymentsScreen';
import TABankDetailsListScreen from './screens/travel-agent/bank/BankDetailsListScreen';
import TAAddBankAccountScreen from './screens/travel-agent/bank/AddBankAccountScreen';
import TADocumentsScreen from './screens/travel-agent/documents/DocumentsScreen';

// Travel Agent — Phase 5 (Communications: Customer Chats + Capture Links)
import TAChatThreadScreen from './screens/travel-agent/chats/ChatThreadScreen';
import TACaptureLinksListScreen from './screens/travel-agent/capture-links/CaptureLinksListScreen';
import TAAddEditCaptureLinkScreen from './screens/travel-agent/capture-links/AddEditCaptureLinkScreen';

// Travel Agent — Phase 7 (Help & Support)
import TASupportScreen from './screens/travel-agent/support/TASupportScreen';
import TAHelpAssistantScreen from './screens/travel-agent/support/HelpAssistantScreen';

// Travel Agent — Phase 6 (Social Network: Feed / Create / Messages / Chat / Profile)
import TASocialFeedScreen from './screens/travel-agent/social/SocialFeedScreen';
import TACreatePostScreen from './screens/travel-agent/social/CreatePostScreen';
import TASocialMessagesListScreen from './screens/travel-agent/social/SocialMessagesListScreen';
import TASocialChatScreen from './screens/travel-agent/social/SocialChatScreen';
import TASocialProfileScreen from './screens/travel-agent/social/SocialProfileScreen';

// Dashboard
import DashboardScreen from './screens/vendor/dashboard/DashboardScreen';
import AllInquiriesScreen from './screens/vendor/dashboard/AllInquiriesScreen';
import AllBookingsScreen from './screens/vendor/dashboard/AllBookingsScreen';
import TrackingScreen from './screens/vendor/tracking/TrackingScreen';

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
import GetStartedScreen from './screens/vendor/get-started/GetStartedScreen';

// Earnings
import EarningsScreen from './screens/vendor/earnings/EarningsScreen';

// Reviews
import ReviewsScreen from './screens/vendor/reviews/ReviewsScreen';

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
import CustomizeBookingLinkScreen from './screens/vendor/booking-links/CustomizeBookingLinkScreen';
import BookingLinkQRScreen from './screens/vendor/booking-links/BookingLinkQRScreen';

// Financials
import FinancialsScreen from './screens/vendor/financials/FinancialsScreen';

// Social Network
import SocialFeedScreen from './screens/vendor/social/SocialFeedScreen';
import CreatePostScreen from './screens/vendor/social/CreatePostScreen';
import SocialProfileScreen from './screens/vendor/social/SocialProfileScreen';
import SocialMessagesScreen from './screens/vendor/social/SocialMessagesScreen';
import SocialChatScreen from './screens/vendor/social/SocialChatScreen';

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

// B2B Module
import B2BDashboardScreen from './screens/vendor/b2b/B2BDashboardScreen';
import B2BOpenBookingsScreen from './screens/vendor/b2b/B2BOpenBookingsScreen';
import B2BMyQuotesScreen from './screens/vendor/b2b/B2BMyQuotesScreen';
import B2BBookingDetailScreen from './screens/vendor/b2b/B2BBookingDetailScreen';
import B2BQuoteDetailScreen from './screens/vendor/b2b/B2BQuoteDetailScreen';
import B2BTripsScreen from './screens/vendor/b2b/B2BTripsScreen';
import B2BTripDetailScreen from './screens/vendor/b2b/B2BTripDetailScreen';
import AppEvents, { EVT_NEW_QUOTE } from './utils/AppEvents';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Color Constants
const C = {
  brand: '#047857',
  brandDark: '#064E3B',
  brandLight: '#D1FAE5',
  text: '#0F172A',
  muted: '#6B7280',
  bg: '#F0FDF9',
  surface: '#FFFFFF',
  gold: '#EAB308',
};

// Custom Tab Bar Component for premium look
function CustomTabBar({ state, descriptors, navigation }) {
  const { unreadCount } = React.useContext(NotifBadgeContext);
  const tabs = [
    { name: 'Dashboard', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { name: 'Bookings', icon: 'calendar', iconOutline: 'calendar-outline', label: 'Bookings' },
    { name: 'B2B', icon: 'business', iconOutline: 'business-outline', label: 'B2B' },
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
      <Tab.Screen name="B2B" component={B2BDashboardScreen} />
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

        // --- Travel Agent session takes precedence ---
        // Set by loginUnified/loginTravelAgentDirect on TA login. We check TA
        // first because a TA session never coexists with vendor data (each
        // login clears the opposite type), but defending in this order keeps
        // the routing deterministic.
        const travelAgentStr = await AsyncStorage.getItem('travel_agent');
        if (travelAgentStr) {
          try {
            let ta = JSON.parse(travelAgentStr);
            // Refresh the live status from the server so routing isn't driven by a
            // stale cache. e.g. after the agent uploads documents, the status flips
            // to UNDER_REVIEW and they should land on the dashboard, not Documents.
            try {
              const fresh = await getTravelAgentProfile();
              if (fresh?.status) {
                ta = { ...ta, ...fresh };
                await AsyncStorage.setItem('travel_agent', JSON.stringify(ta));
              }
            } catch (e) {
              // offline / fetch failed — fall back to the cached status
            }
            console.log('[App] 🧳 Travel Agent Status:', ta.status);
            if (ta.status === 'DOCUMENTS_PENDING') {
              console.log('[App] 📄 TA → Documents');
              navigation.replace('TravelAgentDocuments');
              return;
            }
            if (ta.status === 'REJECTED' || ta.status === 'SUSPENDED') {
              // Don't auto-login a blocked TA; bounce to login with a notice.
              console.log('[App] ⛔ TA blocked status, routing to login');
              navigation.replace('VendorLoginScreen');
              return;
            }
            console.log('[App] 🏠 TA → TravelAgentDashboard');
            navigation.replace('TravelAgentDashboard');
            return;
          } catch (e) {
            console.error('[App] ❌ Error parsing travel_agent:', e);
          }
        }

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

// ── Session expiry → back to login ───────────────────────────────────
// client.js drops the stored token whenever the API answers 401. Until now
// that left the app on whatever screen it was on with nothing to send: every
// later request went out unauthenticated and the screens filled with
// "Unauthorized" errors, which reads as a broken app rather than an expired
// login (tokens last 30 days, so this lands well after the user last signed
// in). Send them to the login screen and say why.
//
// reset(), not navigate() — the stack behind it belongs to a session that no
// longer exists, so Back must not lead into it.
let sessionExpiryNoticeShown = false;

setOnSessionExpired(() => {
  const nav = navigationRef.current;
  if (!isNavigationReadyRef.current || !nav) return;

  // A screen usually fires several requests at once, so one dead session
  // produces a burst of 401s. Only the first should reach the user.
  const current = nav.getCurrentRoute?.()?.name;
  if (current === 'VendorLoginScreen' || current === 'Splash' || current === 'Onboarding') return;

  nav.reset({ index: 0, routes: [{ name: 'VendorLoginScreen' }] });

  if (!sessionExpiryNoticeShown) {
    sessionExpiryNoticeShown = true;
    Alert.alert('Signed out', 'Your session has expired. Please sign in again.', [
      { text: 'OK', onPress: () => { sessionExpiryNoticeShown = false; } },
    ]);
  }
});

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
  // Travel-agent notification types are UPPERCASE (PAYMENT/CHAT/BOOKING/LEAD/
  // SYSTEM); map them onto the same channels vendors use so TAs get distinct
  // per-type sounds. LEAD/SYSTEM fall through to the default channel.
  if (type === 'payment_received' || type === 'payment' || type === 'advance_paid' || type === 'PAYMENT') {
    return { channelId: 'payment_channel', sound: 'payment' };
  }
  if (type === 'chat' || type === 'new_message' || type === 'CHAT') {
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
    type === 'quote_accepted' ||
    type === 'BOOKING'
  ) {
    return { channelId: 'booking_confirmed_channel', sound: 'booking_confirmed' };
  }
  return { channelId: 'default_v3', sound: 'notification_sound' };
}

// Travel-agent push routing. TA pushes carry `source: 'travel-agent'` and a
// web-style `link` (e.g. /travel-agent/leads/<id>); map that to the native TA
// screen. Detail screens all read their entity via route param `id`.
function navigateTravelAgent(data) {
  const nav = navigationRef.current;
  if (!nav) return true;

  const link = data.link || '';
  if (!link) {
    nav.navigate('TANotifications');
    return true;
  }

  // /travel-agent/leads/<id> → ['leads','<id>'];  /social/messages/<id> too.
  const parts = link.split('?')[0].replace(/^\/+/, '').split('/');
  const seg = parts[0] === 'travel-agent' ? parts.slice(1) : parts;
  const section = seg[0];

  switch (section) {
    case 'leads':
      if (seg[1]) nav.navigate('TALeadDetail', { id: seg[1] });
      else nav.navigate('TravelAgentDashboard', { screen: 'TALeads' });
      return true;
    case 'bookings':
      if (seg[1]) nav.navigate('TABookingDetail', { id: seg[1] });
      else nav.navigate('TravelAgentDashboard', { screen: 'TABookings' });
      return true;
    case 'chats':
      if (seg[1]) nav.navigate('TAChatThread', { id: seg[1] });
      else nav.navigate('TravelAgentDashboard', { screen: 'TAChats' });
      return true;
    case 'social':
      // /travel-agent/social/messages/<id>
      if (seg[1] === 'messages' && seg[2]) nav.navigate('TASocialChat', { id: seg[2] });
      else nav.navigate('TASocialFeed');
      return true;
    case 'documents':
      nav.navigate('TADocuments');
      return true;
    case 'profile':
      nav.navigate('TAProfile');
      return true;
    case 'dashboard':
      nav.navigate('TravelAgentDashboard');
      return true;
    default:
      nav.navigate('TANotifications');
      return true;
  }
}

function navigateByData(data) {
  if (!data || !navigationRef.current) return;

  // Travel-agent pushes route through their own screen map.
  if (data.source === 'travel-agent') {
    navigateTravelAgent(data);
    return;
  }

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

      // Skip the vendor unread-count endpoint when a Travel Agent is
      // logged in — same reason as the FCM skip (401 from wrong user type
      // would otherwise trip the global logout interceptor). TA badge is
      // handled separately by the TA bottom-nav.
      try {
        const taCached = await AsyncStorage.getItem('travel_agent');
        if (taCached) return;
      } catch {}

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
      // Increment badge locally — no server call
      setUnreadCount(prev => prev + 1);
      // If it's a new quote request, tell the dashboard to increment that service count
      if (remoteMessage?.data?.incrementQuote === 'true' && remoteMessage?.data?.serviceType) {
        // Normalize backend serviceType variants → dashboard keys
        const SERVICE_NORMALIZE = {
          'chauffeur': 'car', 'car-rental': 'car',
          'bus-rental': 'bus',
          'home-intercity': 'packers', 'full-service': 'packers',
          'intercity': 'truck', 'local-shifting': 'truck', 'commercial': 'truck',
        };
        const raw = remoteMessage.data.serviceType;
        const normalized = SERVICE_NORMALIZE[raw] || raw;
        AppEvents.emit(EVT_NEW_QUOTE, { serviceType: normalized });
      }
      const image =
        remoteMessage?.data?.image ||
        remoteMessage?.notification?.android?.imageUrl ||
        null;
      const notifType = remoteMessage?.data?.type || '';
      const { channelId, sound } = getNotifChannelForType(notifType);
      try {
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
      } catch (err) {
        // A malformed/oversized payload (e.g. bad imageUrl) shouldn't crash
        // the app for every user who receives this push while foregrounded.
        console.log('Failed to display foreground notification:', err);
      }
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

    // Detect session type. Travel agents get the FCM token sent to the
    // TA-side endpoint (/travel-agent/fcm-token); vendors go to the legacy
    // /vendor/fcm-token. Calling the wrong endpoint returns 401 which used
    // to trigger a global logout, so we MUST route correctly.
    let isTravelAgent = false;
    try {
      isTravelAgent = !!(await AsyncStorage.getItem('travel_agent'));
    } catch {}

    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    if (!fcmToken) return;

    try {
      if (isTravelAgent) {
        await saveTravelAgentFcmToken(fcmToken);
        console.log('[FCM] Token sent to backend (travel_agent)');
      } else {
        await saveVendorFcmToken(fcmToken);
        console.log('[FCM] Token sent to backend (vendor)');
      }
    } catch (error) {
      console.log('[FCM] Error sending FCM token:', error?.message);
    }
  }

  return (
    <NotifBadgeContext.Provider value={{ unreadCount, refreshBadge }}>
    {/* KeyboardProvider feeds keyboard position/height to the
        KeyboardAwareScrollViews in the forms. It has to sit above the
        navigator so every screen is inside it. */}
    <KeyboardProvider>
    <SafeAreaProvider>
    <VendorActivityTracker>
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

          {/* Travel Agent — Auth + Dashboard + Onboarding (Phase 1, Docs upgraded in P4) */}
          <Stack.Screen name="TravelAgentRegisterScreen" component={TravelAgentRegisterScreen} />
          <Stack.Screen name="TravelAgentForgotPasswordScreen" component={TravelAgentForgotPasswordScreen} />
          <Stack.Screen name="TravelAgentDashboard" component={TravelAgentBottomNavigation} />
          <Stack.Screen name="TravelAgentDocuments" component={TADocumentsScreen} />
          <Stack.Screen name="TravelAgentGetStarted" component={TAGetStartedScreen} />

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

            {/* Unified Inquiries inbox (mockup) */}
            <Stack.Screen name="AllInquiries" component={AllInquiriesScreen} />

            {/* Unified Bookings list (ongoing / completed) */}
            <Stack.Screen name="AllBookings" component={AllBookingsScreen} />

            {/* Live GPS tracking */}
            <Stack.Screen name="VendorTracking" component={TrackingScreen} />

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
            <Stack.Screen name="GetStartedScreen" component={GetStartedScreen} />

            {/* Earnings */}
            <Stack.Screen name="EarningsScreen" component={EarningsScreen} />

            {/* Reviews */}
            <Stack.Screen name="VendorReviews" component={ReviewsScreen} />

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
            <Stack.Screen name="CustomizeBookingLink" component={CustomizeBookingLinkScreen} />
            <Stack.Screen name="BookingLinkQR" component={BookingLinkQRScreen} />

            {/* Financials */}
            <Stack.Screen name="Financials" component={FinancialsScreen} />

            {/* Social Network */}
            <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
            <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
            <Stack.Screen name="SocialProfileScreen" component={SocialProfileScreen} />
            <Stack.Screen name="SocialMessagesScreen" component={SocialMessagesScreen} />
            <Stack.Screen name="SocialChatScreen" component={SocialChatScreen} />

            {/* P2P Marketplace */}
            <Stack.Screen name="P2PDashboard" component={P2PDashboardScreen} />
            <Stack.Screen name="BrowseVehiclesScreen" component={BrowseVehiclesScreen} />
            <Stack.Screen name="BrowseBookingsScreen" component={BrowseBookingsScreen} />
            <Stack.Screen name="PostVehicleScreen" component={PostVehicleScreen} />
            <Stack.Screen name="PostBookingScreen" component={PostBookingScreen} />
            <Stack.Screen name="MyPostingsScreen" component={MyPostingsScreen} />
            <Stack.Screen name="P2PActivityScreen" component={P2PActivityScreen} />

            {/* B2B Module */}
            <Stack.Screen name="B2BDashboard" component={B2BDashboardScreen} />
            <Stack.Screen name="B2BOpenBookings" component={B2BOpenBookingsScreen} />
            <Stack.Screen name="B2BMyQuotes" component={B2BMyQuotesScreen} />
            <Stack.Screen name="B2BBookingDetail" component={B2BBookingDetailScreen} />
            <Stack.Screen name="B2BQuoteDetail" component={B2BQuoteDetailScreen} />
            <Stack.Screen name="B2BTrips" component={B2BTripsScreen} />
            <Stack.Screen name="B2BTripDetail" component={B2BTripDetailScreen} />

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

            {/* Travel Agent — Phase 3 listings (real screens) */}
            <Stack.Screen name="TATours" component={TAToursListScreen} />
            <Stack.Screen name="TAAddEditTour" component={TAAddEditTourScreen} />
            <Stack.Screen name="TATourPreview" component={TATourPreviewScreen} />
            <Stack.Screen name="TAProperties" component={TAPropertiesListScreen} />
            <Stack.Screen name="TAPropertyDetail" component={TAPropertyDetailScreen} />
            <Stack.Screen name="TAAddEditProperty" component={TAAddEditPropertyScreen} />
            <Stack.Screen name="TAFleet" component={TAFleetListScreen} />
            <Stack.Screen name="TAFleetVehicleDetail" component={TAFleetVehicleDetailScreen} />
            <Stack.Screen name="TAAddEditFleet" component={TAAddEditFleetScreen} />
            <Stack.Screen name="TAFleetCalendar" component={TAFleetCalendarScreen} />
            <Stack.Screen name="TAFleetInsurance" component={TAFleetInsuranceScreen} />

            {/* Phase 3 Bookings add/edit + detail (list lives in the bottom-nav TABookings tab) */}
            <Stack.Screen name="TAAddEditBooking" component={TAAddEditBookingScreen} />
            <Stack.Screen name="TABookingDetail" component={TABookingDetailScreen} />
            <Stack.Screen name="TASelfBookingDetail" component={TASelfBookingDetailScreen} />

            {/* CRM (Phase 2 / 3 / 5) */}
            <Stack.Screen name="TAPipeline" component={TAPipelineScreen} />
            <Stack.Screen name="TAFollowUps" component={TAFollowUpsScreen} />
            <Stack.Screen name="TAAddEditLead" component={TAAddEditLeadScreen} />
            <Stack.Screen name="TALeadDetail" component={TALeadDetailScreen} />
            <Stack.Screen name="TACaptureLinks" component={TACaptureLinksListScreen} />
            <Stack.Screen name="TAAddEditCaptureLink" component={TAAddEditCaptureLinkScreen} />
            <Stack.Screen name="TAChatThread" component={TAChatThreadScreen} />
            <Stack.Screen name="TATourQuoteRequests" component={TATourQuoteRequestsScreen} />

            {/* Money + Docs (Phase 4) */}
            <Stack.Screen name="TAEarnings" component={TAEarningsScreen} />
            <Stack.Screen name="TAPayments" component={TAPaymentsScreen} />
            <Stack.Screen name="TABankDetails" component={TABankDetailsListScreen} />
            <Stack.Screen name="TAAddBankAccount" component={TAAddBankAccountScreen} />

            {/* Social Network (Phase 6) */}
            <Stack.Screen name="TASocialFeed" component={TASocialFeedScreen} />
            <Stack.Screen name="TACreatePost" component={TACreatePostScreen} />
            <Stack.Screen name="TASocialMessages" component={TASocialMessagesListScreen} />
            <Stack.Screen name="TASocialChat" component={TASocialChatScreen} />
            <Stack.Screen name="TASocialProfile" component={TASocialProfileScreen} />
            {/* TASocialSaved reuses the feed with the Saved tab pre-selected */}
            <Stack.Screen
              name="TASocialSaved"
              component={TASocialFeedScreen}
              initialParams={{ initialTab: "saved" }}
            />

            {/* Account */}
            <Stack.Screen name="TANotifications" component={TANotificationsScreen} />
            <Stack.Screen name="TADocuments" component={TADocumentsScreen} />
            <Stack.Screen name="TAProfile" component={TAAgencyProfileScreen} />
            <Stack.Screen name="TAGetStarted" component={TAGetStartedScreen} />
            <Stack.Screen name="TASupport" component={TASupportScreen} />
            <Stack.Screen name="TAHelpAssistant" component={TAHelpAssistantScreen} />

          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
      <OfflineBanner />
      <GlobalAlert />
    </VendorActivityTracker>
    </SafeAreaProvider>
    </KeyboardProvider>
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
