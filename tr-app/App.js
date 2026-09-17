import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Clipboard } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/customer/auth/LoginScreen';
import ForgotPasswordScreen from './screens/customer/auth/ForgotPasswordScreen';
import RegisterScreen from './screens/customer/auth/RegisterScreen';
import CustomerDashboard from './screens/customer/CustomerDashboard';
import NotificationScreen from './screens/customer/NotificationScreen';
import BookingDetailScreen from './screens/customer/booking/BookingDetailScreen';
import BikeBookingDetailScreen from './screens/customer/booking/BikeBookingDetailScreen';
import BusBookingDetailScreen from './screens/customer/booking/BusBookingDetailScreen';
import BusQuoteRequestDetailScreen from './screens/customer/booking/BusQuoteRequestDetailScreen';
import TruckBookingDetailScreen from './screens/customer/booking/TruckBookingDetailScreen';
import TruckQuoteRequestDetailScreen from './screens/customer/booking/TruckQuoteRequestDetailScreen';
import PackersBookingDetailScreen from './screens/customer/booking/PackersBookingDetailScreen';
import PackersQuoteRequestDetailScreen from './screens/customer/booking/PackersQuoteRequestDetailScreen';
import EquipmentBookingDetailScreen from './screens/customer/booking/EquipmentBookingDetailScreen';
import EquipmentQuoteRequestDetailScreen from './screens/customer/booking/EquipmentQuoteRequestDetailScreen';
import BookingChatScreen from './screens/customer/booking/BookingChatScreen';
import CustomBookingScreen from './screens/customer/booking/CustomBookingScreen';
import BulkBookingDetailScreen from './screens/customer/booking/BulkBookingDetailScreen';
import DriverChatListScreen from './screens/customer/booking/DriverChatListScreen';
import DriverChatScreen from './screens/customer/booking/DriverChatScreen';
import MyBikeBookingsScreen from './screens/customer/booking/MyBikeBookingsScreen';
import BikeQuoteRequestDetailScreen from './screens/customer/booking/BikeQuoteRequestDetailScreen';
import PaymentScreen from './screens/customer/booking/PaymentScreen';
// Self-Drive Flow Screens
import SelfDriveFleetScreen from './screens/customer/booking/SelfDriveFleetScreen';
import MySelfDriveBookingsScreen from './screens/customer/booking/MySelfDriveBookingsScreen';
import SelfDriveQuoteRequestDetailScreen from './screens/customer/booking/SelfDriveQuoteRequestDetailScreen';
import SelfDriveBookingDetailScreen from './screens/customer/booking/SelfDriveBookingDetailScreen';
// Other Service Booking Screens
import MyBusBookingsScreen from './screens/customer/booking/MyBusBookingsScreen';
import MyTruckBookingsScreen from './screens/customer/booking/MyTruckBookingsScreen';
import MyEquipmentBookingsScreen from './screens/customer/booking/MyEquipmentBookingsScreen';
import MyLuxuryBookingsScreen from './screens/customer/booking/MyLuxuryBookingsScreen';
import MyPackersBookingsScreen from './screens/customer/booking/MyPackersBookingsScreen';
import MyCarBookingsScreen from './screens/customer/booking/MyCarBookingsScreen';
// Review & Invoice Screens
import ReviewScreen from './screens/customer/booking/ReviewScreen';
import InvoiceScreen from './screens/customer/booking/InvoiceScreen';
import ChatScreen from './screens/customer/ChatScreen';
import BookingChatListScreen from './screens/customer/booking/ChatListScreen';
import BikeRentalScreen from './screens/customer/HomePage/BikeRentalScreen';
import CarRentalScreen from './screens/customer/HomePage/CarRentalScreen';
import BusRentalScreen from './screens/customer/HomePage/BusRentalScreen';
import TruckRentalScreen from './screens/customer/HomePage/TruckRentalScreen';
import EquipmentScreen from './screens/customer/HomePage/EquipmentScreen';
import PackerMoverScreen from './screens/customer/HomePage/PackerMoverScreen';
import SelfDriveScreen from './screens/customer/HomePage/SelfDriveScreen';
import LuxuryScreen from './screens/customer/HomePage/LuxuryScreen';
// Luxury Car Rental Screens
import LuxuryCarRentalScreen from './screens/customer/luxury/LuxuryCarRentalScreen';
import MyLuxuryQuotesScreen from './screens/customer/luxury/MyLuxuryQuotesScreen';
import LuxuryQuoteDetailScreen from './screens/customer/luxury/LuxuryQuoteDetailScreen';
import LuxuryBookingDetailScreen from './screens/customer/luxury/LuxuryBookingDetailScreen';
import ViewQuoteScreen from './screens/customer/quote/ViewQuoteScreen';
import MyBookingsScreen from './screens/customer/booking/MyBookingsScreen';
import BikeFleetScreen from './screens/booking/BikeFleetScreen';
import BookingConfirmationScreen from './screens/booking/BookingConfirmationScreen';
import ExpensesScreen from './screens/customer/ExpensesScreen';
import BusRentalFleetScreen from './screens/booking/bus/BusRentalFleetScreen';
import OutstationScreen from './screens/booking/bus/OutstationScreen';
import LocalScreen from './screens/booking/bus/LocalScreen';
// Chauffeur (Car Rental with Driver)
import CarRentalFleetScreen from './screens/booking/chauffeur/CarRentalFleetScreen';
import HomeBookingScreen from './screens/booking/PM/HomeBookingScreen';
import OfficeBookingScreen from './screens/booking/PM/OfficeBookingScreen';
import VehicleBookingScreen from './screens/booking/PM/VehicleBookingScreen';
import EditProfileScreen from './screens/customer/profile/EditProfileScreen';
import SettingScreen from './screens/customer/profile/SettingScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import HelpdeskScreen from './screens/customer/profile/HelpdeskScreen';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LogBox } from 'react-native';
import BackrTokensScreen from './screens/customer/BackrTokensScreen';
import TokenHistoryScreen from './screens/customer/TokenHistoryScreen';
import EarnBackrTasksScreen from './screens/customer/EarnBackrTasksScreen';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle, AndroidImportance, EventType } from '@notifee/react-native';
import { NotificationProvider, useInAppNotification } from './contexts/NotificationContext';
import { AppState } from 'react-native';
import { BASE_URL } from './screens/api';
// Wander Screens
import WanderScreen from './screens/customer/HomePage/WanderScreen';
import WanderListingDetailScreen from './screens/customer/wander/WanderListingDetailScreen';
import MyWanderBookingsScreen from './screens/customer/wander/MyWanderBookingsScreen';
import WanderQuoteDetailScreen from './screens/customer/wander/WanderQuoteDetailScreen';
import WanderGroupScreen from './screens/customer/wander/WanderGroupScreen';
import WanderGroupDetailScreen from './screens/customer/wander/WanderGroupDetailScreen';
// B2B Screens
import B2BRegisterScreen from './screens/b2b/B2BRegisterScreen';
import B2BDashboardScreen from './screens/b2b/B2BDashboardScreen';
import B2BCreateBookingScreen from './screens/b2b/B2BCreateBookingScreen';
import B2BBookingsListScreen from './screens/b2b/B2BBookingsListScreen';
import B2BBookingDetailScreen from './screens/b2b/B2BBookingDetailScreen';
import B2BOtpVerifyScreen from './screens/b2b/B2BOtpVerifyScreen';
import B2BChatScreen from './screens/b2b/B2BChatScreen';
import B2BInvoicesScreen from './screens/b2b/B2BInvoicesScreen';
import B2BInvoiceDetailScreen from './screens/b2b/B2BInvoiceDetailScreen';

let badgeCount = 0;
let pendingNotificationData = null; // Store notification data when app opens from background press
let onNotificationPressCallback = null; // Callback set by AppContent for navigation
LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);

// Notifee event handler for background actions
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // Handle notification press from background/killed state
  if (type === EventType.PRESS) {
    const data = {
      ...notification?.data,
      title: notification?.title,
      body: notification?.body,
    };
    // If app is running and callback is set, navigate immediately
    if (onNotificationPressCallback) {
      onNotificationPressCallback(data);
    } else {
      // App not yet ready, store for later
      pendingNotificationData = data;
    }
  }

  // Handle Copy OTP action
  if (pressAction?.id === 'copy_otp') {
    const messageBody = notification?.body || '';
    const otpMatch = messageBody.match(/\b\d{6}\b/);
    if (otpMatch) {
      Clipboard.setString(otpMatch[0]);
      console.log('✅ OTP copied to clipboard:', otpMatch[0]);

      // Show toast notification
      await notifee.displayNotification({
        title: '✅ OTP Copied!',
        body: `OTP ${otpMatch[0]} copied to clipboard`,
        android: {
          channelId: 'transrentals_notifications',
          smallIcon: 'ic_notification',
          largeIcon: require('./assets/logp-1.png'),
          color: '#4CAF50', // Green
          importance: AndroidImportance.LOW,
          autoCancel: true,
          timeoutAfter: 3000, // Auto dismiss after 3 seconds
        },
      });
    }
  }
});

// Background notification handler (must be outside component)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);

  const image = remoteMessage?.data?.image || remoteMessage?.notification?.android?.imageUrl || null;
  const notifType = remoteMessage?.data?.type || 'general';

  // Select channel based on notification type
  let channelId = 'default';
  if (notifType === 'quote') channelId = 'quote';
  else if (notifType === 'payment') channelId = 'payment';
  else if (notifType === 'booking') channelId = 'booking';

  console.log(`🔔 Using channel: ${channelId} for type: ${notifType}`);

  await notifee.displayNotification({
    id: remoteMessage.messageId,
    title: remoteMessage.notification?.title || 'New Message',
    body: remoteMessage.notification?.body || '',
    data: remoteMessage.data,
    android: {
      channelId: channelId, // Use correct channel for sound
      smallIcon: 'ic_notification',
      largeIcon: require('./assets/logp-1.png'),
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
      style: image && image !== 'null'
        ? {
            type: AndroidStyle.BIGPICTURE,
            picture: image,
          }
        : undefined,
    },
  });
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();  

function CustomerDashboardTab() {
  const [isB2B, setIsB2B] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('customer');
        if (raw) {
          const customer = JSON.parse(raw);
          setIsB2B(customer?.isB2B === true && customer?.b2bStatus === 'APPROVED');
        }
      } catch (e) {}
    })();
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'B2B') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          }
          return (
            <View style={styles.iconContainernavi}>
              {focused && <View style={styles.activeTabDiv} />}
              <Ionicons
                name={iconName}
                size={25}
                color={focused ? styles.iconFocusedColor.color : styles.iconDefaultColor.color}
              />
            </View>
          );
        },
        tabBarLabel: ({ focused }) => {
          return (
            <Text style={[styles.tabBarLabel, focused ? styles.tabBarLabelFocused : styles.tabBarLabelDefault]}>
              {route.name}
            </Text>
          );
        },
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          zIndex: 100,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.98)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarButton: (props) => (
          <TouchableOpacity {...props} style={[props.style, { overflow: 'hidden' }]} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={CustomerDashboard} />
      {isB2B && <Tab.Screen name="B2B" component={B2BDashboardScreen} />}
      <Tab.Screen name="Payments" component={ExpensesScreen} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} />
      <Tab.Screen name="Chat" component={BookingChatListScreen} />
    </Tab.Navigator>
  );
}

function SplashScreenWrapper() {
  const navigation = useNavigation();
  const handleFinish = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customer');  
      console.log(':key: Customer Data:', customerData); 
      if (customerData) {
        navigation.replace('CustomerDashboard');
      } else {
        navigation.replace('Onboarding');
      }
    } catch (error) {
      console.log("Session check error:", error);
      navigation.replace('Onboarding');
    }
  };
  return <SplashScreen onFinish={handleFinish} />;
}

// Main App Content with Navigation
function AppContent() {
  const navigation = useNavigation();
  const { showNotification } = useInAppNotification();
  const appState = React.useRef(AppState.currentState);

  useEffect(() => {
    async function setupNotifications() {
      console.log('Requesting permissions...');
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const status = await notifee.requestPermission();
        console.log('Android permission status:', status);
        if (!status) {
          Alert.alert('Notification permission denied');
          return;
        }
      } else {
        const authStatus = await messaging().requestPermission();
        console.log('iOS permission status:', authStatus);
        if (
          authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
          authStatus !== messaging.AuthorizationStatus.PROVISIONAL
        ) {
          Alert.alert('Notification permission denied');
          return;
        }
      }

      console.log('Creating notification channels...');

      // All channels use the same custom sound
      const customSound = 'notification_sound'; // Single sound file for all

      await notifee.createChannel({
        id: 'default',
        name: 'General Notifications',
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: customSound,
      });

      await notifee.createChannel({
        id: 'quote',
        name: 'Quote Notifications',
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: customSound, // Same sound
      });

      await notifee.createChannel({
        id: 'payment',
        name: 'Payment Notifications',
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: customSound, // Same sound
      });

      await notifee.createChannel({
        id: 'booking',
        name: 'Booking Notifications',
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: customSound, // Same sound
      });

      const fcmToken = await messaging().getToken();

      // ⭐ Save FCM token to backend
      try {
        const customerData = await AsyncStorage.getItem('customer');
        if (customerData) {
          const customer = JSON.parse(customerData);
          const response = await fetch(`${BASE_URL}/api/customer/fcm-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: customer.id,
              fcm_token: fcmToken,
            }),
          });
          const result = await response.json();
          if (!result.success) {
            console.error('❌ Failed to save FCM token:', result.message);
          }
        }
      } catch (error) {
        console.error('Error saving FCM token:', error);
      }

      // ⭐ Foreground message handler - Show IN-APP and ANDROID notification
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('📱 Foreground message received:', remoteMessage);
        badgeCount += 1;
        await notifee.setBadgeCount(badgeCount);

        // Check if user is actively on a chat screen — suppress custom in-app banner only
        let isOnChatScreen = false;
        try {
          const navState = navigation.getState();
          const activeRouteName = navState?.routes?.[navState.index]?.name;
          isOnChatScreen = activeRouteName === 'DriverChat' || activeRouteName === 'BookingChat';
        } catch (_) {}

        // Show in-app notification (faded overlay style)
        const notificationData = {
          title: remoteMessage.notification?.title || 'New Notification',
          body: remoteMessage.notification?.body || '',
          type: remoteMessage.data?.type || 'general',
          serviceType: remoteMessage.data?.serviceType,
          bookingId: remoteMessage.data?.bookingId,
          quoteId: remoteMessage.data?.quoteId,
          data: remoteMessage.data,
        };

        if (!isOnChatScreen) showNotification(notificationData);

        // ALSO display Android system notification using notifee
        try {
          const channelId = await notifee.createChannel({
            id: 'transrentals_notifications',
            name: 'TransRentals Notifications',
            sound: 'default',
            importance: AndroidImportance.HIGH,
          });

          // Extract OTP from message if present
          const messageBody = remoteMessage.notification?.body || '';
          const otpMatch = messageBody.match(/\b\d{6}\b/); // Find 6-digit OTP
          const otp = otpMatch ? otpMatch[0] : null;
          const notificationType = remoteMessage.data?.type || 'general';

          // Build notification config
          const displayBody = messageBody || remoteMessage.data?.body || 'You have a new notification';
          const notificationConfig = {
            title: remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification',
            body: displayBody,
            android: {
              channelId,
              smallIcon: 'ic_notification',
              largeIcon: require('./assets/logp-1.png'),
              importance: AndroidImportance.HIGH,
              color: '#FF6B35', // TransRentals brand color (orange)
              pressAction: {
                id: 'default',
              },
              // Use BigText style for better formatting
              style: {
                type: AndroidStyle.BIGTEXT,
                text: displayBody,
              },
            },
            data: remoteMessage.data,
          };

          // If OTP notification, add copy action button
          if (otp && (notificationType === 'otp' || notificationType === 'trip_end_otp')) {
            notificationConfig.android.actions = [
              {
                title: '📋 Copy OTP',
                pressAction: {
                  id: 'copy_otp',
                },
              },
            ];

            // Highlight OTP in bigger text
            notificationConfig.android.style.text = `🔑 Your OTP:\n\n${otp}\n\n${messageBody.replace(otp, '')}`;
          }

          await notifee.displayNotification(notificationConfig);
          console.log('✅ Android system notification displayed with enhanced styling');
        } catch (error) {
          console.error('❌ Failed to display Android notification:', error);
        }
      });

      // Helper: navigate to the right screen based on notification data
      const navigateFromNotification = (data) => {
        if (!data) {
          navigation.navigate('Notifications');
          return;
        }

        const title = (data.title || '').toLowerCase();
        const body = (data.body || '').toLowerCase();
        const notifType = (data.type || '').toLowerCase();
        let serviceType = data.serviceType || data.service_type;

        // Check if this is a Wander group notification
        if (notifType === 'group_chat' || notifType === 'group_respond' || notifType === 'group_submitted'
            || notifType === 'group_join' || notifType === 'group_quote_received') {
          const groupCode = data.groupCode || data.group_code;
          if (groupCode) {
            const initialTab = notifType === 'group_chat' ? 'chat' : 'trips';
            navigation.navigate('WanderGroupDetail', { groupCode, initialTab });
          } else {
            navigation.navigate('WanderGroup');
          }
          return;
        }

        // Driver chat notification — open DriverChat screen directly
        if (notifType === 'driver_chat' && data.conversationId) {
          navigation.navigate('DriverChat', {
            conversationId: data.conversationId,
            driverName: data.driverName || 'Driver',
          });
          return;
        }

        // Check if this is a chat notification
        if (notifType === 'chat' || data.screen === 'BookingChat' || data.screen === 'Chat') {
          const chatBookingId = data.bookingId || data.booking_id;
          if (chatBookingId && chatBookingId !== 'null' && chatBookingId.length >= 10) {
            navigation.navigate('BookingChat', {
              bookingId: chatBookingId,
              bookingType: data.bookingType || data.booking_type || '',
            });
          } else {
            navigation.navigate('CustomerDashboard', { screen: 'Chat' });
          }
          return;
        }

        // Check if this is a B2B notification
        const isB2BNotif = notifType.startsWith('b2b_') || data.screen === 'B2BBookingDetail'
          || title.includes('b2b') || body.includes('b2b');

        if (isB2BNotif) {
          const bookingId = data.bookingId || data.booking_id;
          if (bookingId && bookingId !== 'null' && bookingId.length >= 10) {
            navigation.navigate('B2BBookingDetail', { bookingId });
          } else {
            navigation.navigate('B2BDashboard');
          }
          return;
        }

        if (!serviceType || serviceType === 'general') {
          if (title.includes('bike') || body.includes('bike')) serviceType = 'bike';
          else if (title.includes('self-drive') || title.includes('self drive') || body.includes('self-drive')) serviceType = 'self-drive';
          else if (title.includes('luxury') || body.includes('luxury')) serviceType = 'luxury';
          else if (title.includes('bus') || body.includes('bus')) serviceType = 'bus';
          else if (title.includes('truck') || body.includes('truck')) serviceType = 'truck';
          else if (title.includes('equipment') || body.includes('equipment')) serviceType = 'equipment';
          else if (title.includes('packers') || title.includes('movers') || body.includes('packers') || body.includes('movers')) serviceType = 'packers';
          else if (title.includes('chauffeur') || title.includes('driver') || body.includes('chauffeur') || body.includes('driver assigned')) serviceType = 'car';
          else if (title.includes('car') || body.includes('car rental')) serviceType = 'car';
        }

        // Detect quote vs booking - backend sends type as 'new_quote', 'quote', 'new_booking', 'booking', etc.
        const isQuote = notifType.includes('quote') || (data.requestId && !data.bookingId);
        const requestId = data.requestId || data.request_id;
        const bookingId = data.bookingId || data.booking_id;

        // For quote notifications, use requestId; for bookings, use bookingId
        const itemId = isQuote ? requestId : bookingId;

        if (!itemId || itemId === 'null' || itemId.length < 10) {
          navigation.navigate('Notifications');
          return;
        }

        try {
          if (serviceType === 'self-drive') {
            navigation.navigate(isQuote ? 'SelfDriveQuoteRequestDetail' : 'SelfDriveBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'bike') {
            navigation.navigate(isQuote ? 'BikeQuoteRequestDetail' : 'BikeBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'luxury') {
            navigation.navigate(isQuote ? 'LuxuryQuoteDetail' : 'LuxuryBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'bus') {
            navigation.navigate(isQuote ? 'BusQuoteRequestDetail' : 'BusBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'truck') {
            navigation.navigate(isQuote ? 'TruckQuoteRequestDetail' : 'TruckBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'packers') {
            navigation.navigate(isQuote ? 'PackersQuoteRequestDetail' : 'PackersBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'equipment') {
            navigation.navigate(isQuote ? 'EquipmentQuoteRequestDetail' : 'EquipmentBookingDetail', isQuote ? { requestId: itemId } : { bookingId: itemId });
          } else if (serviceType === 'chauffeur-service' || serviceType === 'car') {
            navigation.navigate('BookingDetail', { bookingId: itemId, bookingType: 'car' });
          } else {
            navigation.navigate('Notifications');
          }
        } catch (error) {
          console.error('Notification navigation error:', error);
          navigation.navigate('Notifications');
        }
      };

      // Register callback so background event handler can trigger navigation
      onNotificationPressCallback = navigateFromNotification;

      // Handle notification opened app from background state (FCM)
      messaging().onNotificationOpenedApp(async remoteMessage => {
        console.log('Notification opened app from background:', remoteMessage);
        const data = {
          ...remoteMessage.data,
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
        };
        navigateFromNotification(data);
      });

      // Check if app was opened from a notification (killed state - FCM)
      messaging().getInitialNotification().then(async remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from killed state:', remoteMessage);
          const data = {
            ...remoteMessage.data,
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
          };
          // Small delay to let navigation mount
          setTimeout(() => navigateFromNotification(data), 1000);
        }
      });

      // Handle Notifee notification press (for notifications displayed via notifee - app in foreground)
      const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = {
            ...detail.notification?.data,
            title: detail.notification?.title,
            body: detail.notification?.body,
          };
          navigateFromNotification(data);
        }
      });

      // Check if app was opened by tapping a Notifee notification (killed state)
      notifee.getInitialNotification().then(initialNotification => {
        if (initialNotification) {
          console.log('Notifee initial notification:', initialNotification);
          const data = {
            ...initialNotification.notification?.data,
            title: initialNotification.notification?.title,
            body: initialNotification.notification?.body,
          };
          setTimeout(() => navigateFromNotification(data), 1000);
        }
      });

      // Fallback: check if pending data was stored by background event handler
      if (pendingNotificationData) {
        const data = pendingNotificationData;
        pendingNotificationData = null;
        setTimeout(() => navigateFromNotification(data), 1200);
      }

      return () => {
        unsubscribe();
        unsubscribeNotifee();
        onNotificationPressCallback = null;
      };
    }

    const unsubscribePromise = setupNotifications();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [showNotification, navigation]);

  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreenWrapper} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
         <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="BackrTokensScreen" component={BackrTokensScreen} />
        <Stack.Screen name="TokenHistoryScreen" component={TokenHistoryScreen} />
       <Stack.Screen name="EarnBackrTasksScreen" component={EarnBackrTasksScreen} />
        <Stack.Screen name="CustomerDashboard" component={CustomerDashboardTab} />
        <Stack.Screen name="Notifications" component={NotificationScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="BikeBookingDetail" component={BikeBookingDetailScreen} />
        <Stack.Screen name="BusBookingDetail" component={BusBookingDetailScreen} />
        <Stack.Screen name="BusQuoteRequestDetail" component={BusQuoteRequestDetailScreen} />
        <Stack.Screen name="TruckBookingDetail" component={TruckBookingDetailScreen} />
        <Stack.Screen name="TruckQuoteRequestDetail" component={TruckQuoteRequestDetailScreen} />
        <Stack.Screen name="PackersBookingDetail" component={PackersBookingDetailScreen} />
        <Stack.Screen name="PackersQuoteRequestDetail" component={PackersQuoteRequestDetailScreen} />
        <Stack.Screen name="EquipmentBookingDetail" component={EquipmentBookingDetailScreen} />
        <Stack.Screen name="EquipmentQuoteRequestDetail" component={EquipmentQuoteRequestDetailScreen} />
        <Stack.Screen name="BookingChat" component={BookingChatScreen} />
        <Stack.Screen name="CustomBooking" component={CustomBookingScreen} />
        <Stack.Screen name="BulkBookingDetail" component={BulkBookingDetailScreen} />
        <Stack.Screen name="DriverChatList" component={DriverChatListScreen} />
        <Stack.Screen name="DriverChat" component={DriverChatScreen} />
        <Stack.Screen name="MyBikeBookings" component={MyBikeBookingsScreen} />
        <Stack.Screen name="BikeQuoteRequestDetail" component={BikeQuoteRequestDetailScreen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        <Stack.Screen name="ViewQuote" component={ViewQuoteScreen} />
        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
        <Stack.Screen name="BikeFleetScreen" component={BikeFleetScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <Stack.Screen name="ExpensesScreen" component={ExpensesScreen} />
        <Stack.Screen name="BusRentalFleetScreen" component={BusRentalFleetScreen} />
        <Stack.Screen name="LocalScreen" component={LocalScreen} />
        <Stack.Screen name="OutstationScreen" component={OutstationScreen} />
        {/* Old truck booking screens removed - TruckRentalScreen uses modern API */}
        {/* Old luxury and standard car booking screens removed - LuxuryScreen and CarRentalFleetScreen use modern API */}
        <Stack.Screen name="Chatsvendor" component={ChatScreen} />
        <Stack.Screen name="HomeBookingScreen" component={HomeBookingScreen} />
        <Stack.Screen name="OfficeBookingScreen" component={OfficeBookingScreen} />
        <Stack.Screen name="VehicleBookingScreen" component={VehicleBookingScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="SettingScreen" component={SettingScreen} />
        <Stack.Screen name="BikeRentalScreen" component={BikeRentalScreen} />
        <Stack.Screen name="CarRentalScreen" component={CarRentalScreen} />
        <Stack.Screen name="CarRentalFleetScreen" component={CarRentalFleetScreen} />
        <Stack.Screen name="BusRentalScreen" component={BusRentalScreen} />
        <Stack.Screen name="TruckRentalScreen" component={TruckRentalScreen} />
        <Stack.Screen name="EquipmentScreen" component={EquipmentScreen} />
        <Stack.Screen name="PackerMoverScreen" component={PackerMoverScreen} />
        <Stack.Screen name="SelfDriveScreen" component={SelfDriveScreen} />
        <Stack.Screen name="SelfDriveFleetScreen" component={SelfDriveFleetScreen} />
        <Stack.Screen name="MySelfDriveBookings" component={MySelfDriveBookingsScreen} />
        <Stack.Screen name="SelfDriveQuoteRequestDetail" component={SelfDriveQuoteRequestDetailScreen} />
        <Stack.Screen name="SelfDriveBookingDetail" component={SelfDriveBookingDetailScreen} />
        <Stack.Screen name="MyBusBookings" component={MyBusBookingsScreen} />
        <Stack.Screen name="MyTruckBookings" component={MyTruckBookingsScreen} />
        <Stack.Screen name="MyEquipmentBookings" component={MyEquipmentBookingsScreen} />
        <Stack.Screen name="MyLuxuryBookings" component={MyLuxuryBookingsScreen} />
        <Stack.Screen name="MyPackersBookings" component={MyPackersBookingsScreen} />
        <Stack.Screen name="MyCarBookings" component={MyCarBookingsScreen} />
        <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
        <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
        <Stack.Screen name="LuxuryScreen" component={LuxuryScreen} />
        {/* Luxury Car Rental Screens */}
        <Stack.Screen name="LuxuryCarRental" component={LuxuryCarRentalScreen} />
        <Stack.Screen name="MyLuxuryQuotes" component={MyLuxuryQuotesScreen} />
        <Stack.Screen name="LuxuryQuoteDetail" component={LuxuryQuoteDetailScreen} />
        <Stack.Screen name="LuxuryBookingDetail" component={LuxuryBookingDetailScreen} />
        <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
<Stack.Screen name="HelpdeskScreen" component={HelpdeskScreen} />
        {/* B2B Screens */}
        <Stack.Screen name="B2BRegister" component={B2BRegisterScreen} />
        <Stack.Screen name="B2BDashboard" component={B2BDashboardScreen} />
        <Stack.Screen name="B2BCreateBooking" component={B2BCreateBookingScreen} />
        <Stack.Screen name="B2BBookingsList" component={B2BBookingsListScreen} />
        <Stack.Screen name="B2BBookingDetail" component={B2BBookingDetailScreen} />
        <Stack.Screen name="B2BOtpVerify" component={B2BOtpVerifyScreen} />
        <Stack.Screen name="B2BChat" component={B2BChatScreen} />
        <Stack.Screen name="B2BInvoices" component={B2BInvoicesScreen} />
        <Stack.Screen name="B2BInvoiceDetail" component={B2BInvoiceDetailScreen} />
        {/* Wander Screens */}
        <Stack.Screen name="WanderScreen" component={WanderScreen} />
        <Stack.Screen name="WanderListingDetail" component={WanderListingDetailScreen} />
        <Stack.Screen name="MyWanderBookings" component={MyWanderBookingsScreen} />
        <Stack.Screen name="WanderQuoteDetail" component={WanderQuoteDetailScreen} />
        <Stack.Screen name="WanderGroup" component={WanderGroupScreen} />
        <Stack.Screen name="WanderGroupDetail" component={WanderGroupDetailScreen} />

      </Stack.Navigator>
  );
}

// Wrapper to provide navigation to NotificationProvider
function AppWithNotifications() {
  const navigation = useNavigation();

  return (
    <NotificationProvider navigation={navigation}>
      <AppContent />
    </NotificationProvider>
  );
}

// Deep link config: transrentals://wander/group/GANG-XXXX → WanderGroupDetail
const linking = {
  prefixes: ['transrentals://'],
  config: {
    screens: {
      WanderGroupDetail: 'wander/group/:groupCode',
    },
  },
};

// Main App wrapper
export default function App() {
  return (
    <KeyboardProvider>
      <NavigationContainer linking={linking}>
        <AppWithNotifications />
      </NavigationContainer>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingBottom: 20,
    marginBottom: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  tabBarLabelFocused: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  tabBarLabelDefault: {
    color: '#9CA3AF',
  },
  iconFocusedColor: {
    color: '#09B368',
  },
  iconDefaultColor: {
    color: '#9CA3AF',
  },
  tabBarStyle: {
    paddingBottom: 20,
    height: '7%',
  },
  iconContainernavi: {
    alignItems: 'center',
    paddingTop: 4,
  },
  activeTabDiv: {
    width: 28,
    height: 3,
    marginTop: 0,
    backgroundColor: '#09B368',
    borderRadius: 1.5,
    marginBottom: 5,
  },
});
