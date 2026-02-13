import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Clipboard } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/customer/auth/LoginScreen';
import ForgotPasswordScreen from './screens/customer/auth/ForgotPasswordScreen';
import RegisterScreen from './screens/customer/auth/RegisterScreen';
import OtpScreen from './screens/customer/auth/OtpScreen';
import LoginOtpScreen from './screens/customer/auth/LoginOtpScreen';
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
import ChatBookingsScreen from './screens/customer/ChatBookingsScreen';
import BookingVendorsScreen from './screens/customer/BookingVendorsScreen';
import ChatScreen from './screens/customer/ChatScreen';
import BookingChatListScreen from './screens/customer/booking/ChatListScreen';
import BikeRentalScreen from './screens/customer/HomePage/BikeRentalScreen';
import CarRentalScreen from './screens/customer/HomePage/CarRentalScreen';
import BusRentalScreen from './screens/customer/HomePage/BusRentalScreen';
import TruckRentalScreen from './screens/customer/HomePage/TruckRentalScreen';
import EquipmentScreen from './screens/customer/HomePage/EquipmentScreen';
import PackerMoverScreen from './screens/customer/HomePage/PackerMoverScreen';
import AirportScreen from './screens/customer/HomePage/AirportScreen';
import SelfDriveScreen from './screens/customer/HomePage/SelfDriveScreen';
import LuxuryScreen from './screens/customer/HomePage/LuxuryScreen';
// Luxury Car Rental Screens
import LuxuryCarRentalScreen from './screens/customer/luxury/LuxuryCarRentalScreen';
import MyLuxuryQuotesScreen from './screens/customer/luxury/MyLuxuryQuotesScreen';
import LuxuryQuoteDetailScreen from './screens/customer/luxury/LuxuryQuoteDetailScreen';
import LuxuryBookingDetailScreen from './screens/customer/luxury/LuxuryBookingDetailScreen';
import OnewayScreenHome from './screens/customer/HomePage/OnewayScreenHome';
import ViewQuoteScreen from './screens/customer/quote/ViewQuoteScreen';
import MyBookingsScreen from './screens/customer/booking/MyBookingsScreen';
import BikeBookingScreen from './screens/booking/BikeBookingScreen';
import BikeFleetScreen from './screens/booking/BikeFleetScreen';
import BookingConfirmationScreen from './screens/booking/BookingConfirmationScreen';
import ExpensesScreen from './screens/customer/ExpensesScreen';
import BusBookingScreen from './screens/booking/bus/BusBookingScreen';
import BusRentalFleetScreen from './screens/booking/bus/BusRentalFleetScreen';
import OutstationScreen from './screens/booking/bus/OutstationScreen';
// Old truck booking screens removed - TruckRentalScreen uses modern API
// import TruckBookingScreen from './screens/booking/truck/TruckBookingScreen';
// import CommercialBookingScreen from './screens/booking/truck/CommercialBookingScreen';
// import PersonalBookingScreen from './screens/booking/truck/PersonalBookingScreen';
import LocalScreen from './screens/booking/bus/LocalScreen';
import EquipmentBookingScreen from './screens/booking/equipment/EquipmentBookingScreen';
// Old luxury and standard car booking screens removed - LuxuryScreen and CarRentalFleetScreen use modern API
// import LuxuryCarBookingScreen from './screens/booking/luxuryCar/LuxuryCarBookingScreen';
// import StandardCarBookingScreen from './screens/booking/StandardCar/StandardCarBookingScreen';
// import RoundTripBookingScreen from './screens/booking/StandardCar/RoundTripBookingScreen';
// import OneWayBookingScreen from './screens/booking/StandardCar/OneWayBookingScreen';
// import AirportBookingScreen from './screens/booking/StandardCar/AirportBookingScreen';
import SelfDriveBookingScreen from './screens/booking/selfdrive/SelfDriveBookingScreen';
import PackersMoversBookingScreen from './screens/booking/PM/PackersMoversBookingScreen';
// Chauffeur (Car Rental with Driver)
import CarRentalFleetScreen from './screens/booking/chauffeur/CarRentalFleetScreen';
import HomeBookingScreen from './screens/booking/PM/HomeBookingScreen';
import OfficeBookingScreen from './screens/booking/PM/OfficeBookingScreen';
import VehicleBookingScreen from './screens/booking/PM/VehicleBookingScreen';
import ChatListScreen from './screens/customer/chat/ChatListScreen';
import ChatDetailScreen from './screens/customer/chat/ChatDetailScreen';
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
import ServiceDetails from './screens/customer/ServiceDetails';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle,AndroidImportance } from '@notifee/react-native';
import { NotificationProvider, useInAppNotification } from './contexts/NotificationContext';
import { AppState } from 'react-native';
import { BASE_URL } from './screens/api';

let badgeCount = 0;
LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);

// Notifee event handler for notification actions (Copy OTP button)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

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
          elevation: 10,
          position: 'absolute', 
          bottom: 0,  
          left: 0,
          right: 0,
        },
        tabBarButton: (props) => (
          <TouchableOpacity {...props} style={[props.style, { overflow: 'hidden' }]} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={CustomerDashboard} />
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

      console.log('✅ All notification channels created with same custom sound');

      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

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
          if (result.success) {
            console.log('✅ FCM token saved to backend');
          } else {
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

        showNotification(notificationData);

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
          const notificationConfig = {
            title: remoteMessage.notification?.title || 'New Notification',
            body: messageBody,
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
                text: messageBody,
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

      // Handle notification opened app from background state
      messaging().onNotificationOpenedApp(async remoteMessage => {
        console.log('🔔 Notification opened app from background:', remoteMessage);
        // Navigation will be handled by NotificationScreen logic
      });

      // Check if app was opened from a notification (killed state)
      messaging().getInitialNotification().then(async remoteMessage => {
        if (remoteMessage) {
          console.log('💀 Notification opened app from killed state:', remoteMessage);
          // Navigation will be handled by NotificationScreen logic
        }
      });

      return unsubscribe;
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
        <Stack.Screen name="MyBikeBookings" component={MyBikeBookingsScreen} />
        <Stack.Screen name="BikeQuoteRequestDetail" component={BikeQuoteRequestDetailScreen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        <Stack.Screen name="ViewQuote" component={ViewQuoteScreen} />
        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
        <Stack.Screen name="BikeBookingScreen" component={BikeBookingScreen} />
        <Stack.Screen name="BikeFleetScreen" component={BikeFleetScreen} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="LoginOtpScreen" component={LoginOtpScreen} />
        <Stack.Screen name="ExpensesScreen" component={ExpensesScreen} />
        <Stack.Screen name="BusBookingScreen" component={BusBookingScreen} />
        <Stack.Screen name="BusRentalFleetScreen" component={BusRentalFleetScreen} />
        <Stack.Screen name="LocalScreen" component={LocalScreen} />
        <Stack.Screen name="OutstationScreen" component={OutstationScreen} />
        {/* Old truck booking screens removed - TruckRentalScreen uses modern API */}
        <Stack.Screen name="EquipmentBookingScreen" component={EquipmentBookingScreen} />
        {/* Old luxury and standard car booking screens removed - LuxuryScreen and CarRentalFleetScreen use modern API */}
        <Stack.Screen name="Chatsvendor" component={ChatScreen} />
        <Stack.Screen name="BookingVendors" component={BookingVendorsScreen} />
        <Stack.Screen name="ChatBookings" component={ChatBookingsScreen} />
        {/* Old individual trip booking screens removed - CarRentalFleetScreen handles all trip types */}
        <Stack.Screen name="SelfDriveBookingScreen" component={SelfDriveBookingScreen} />
        <Stack.Screen name="PackersMoversBookingScreen" component={PackersMoversBookingScreen} />
        <Stack.Screen name="HomeBookingScreen" component={HomeBookingScreen} />
        <Stack.Screen name="OfficeBookingScreen" component={OfficeBookingScreen} />
        <Stack.Screen name="VehicleBookingScreen" component={VehicleBookingScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="SettingScreen" component={SettingScreen} />
        <Stack.Screen name="BikeRentalScreen" component={BikeRentalScreen} />
        <Stack.Screen name="CarRentalScreen" component={CarRentalScreen} />
        <Stack.Screen name="CarRentalFleetScreen" component={CarRentalFleetScreen} />
        <Stack.Screen name="BusRentalScreen" component={BusRentalScreen} />
        <Stack.Screen name="TruckRentalScreen" component={TruckRentalScreen} />
        <Stack.Screen name="EquipmentScreen" component={EquipmentScreen} />
        <Stack.Screen name="PackerMoverScreen" component={PackerMoverScreen} />
        <Stack.Screen name="AirportScreen" component={AirportScreen} />
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
        <Stack.Screen name="OnewayScreenHome" component={OnewayScreenHome} />
        <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
<Stack.Screen name="HelpdeskScreen" component={HelpdeskScreen} />
<Stack.Screen name="ServiceDetails" component={ServiceDetails} options={{ title: "Service Details" }}/>


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

// Main App wrapper
export default function App() {
  return (
    <NavigationContainer>
      <AppWithNotifications />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingBottom: 20,
    marginBottom: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarLabelFocused: {
    color: '#000',
  },
  tabBarLabelDefault: {
    color: '#000',
  },
  iconFocusedColor: {
    color: '#404040',
  },
  iconDefaultColor: {
    color: '#757575',
  },
  tabBarStyle: {
    paddingBottom: 20,
    height: '7%',
  },
  iconContainernavi: {
    alignItems: 'center',
  },
  activeTabDiv: {
    width: 35,
    height: 4,
    marginTop: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 1.5,
    marginBottom: 5,
  },
});
// import React, { useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';

// import SplashScreen from './screens/SplashScreen';
// import OnboardingScreen from './screens/OnboardingScreen';
// import LoginScreen from './screens/customer/auth/LoginScreen';
// import ForgotPasswordScreen from './screens/customer/auth/ForgotPasswordScreen';

// import RegisterScreen from './screens/customer/auth/RegisterScreen';
// import OtpScreen from './screens/customer/auth/OtpScreen';
// import LoginOtpScreen from './screens/customer/auth/LoginOtpScreen';
// import CustomerDashboard from './screens/customer/CustomerDashboard';
// import NotificationScreen from './screens/customer/NotificationScreen';
// import BookingDetailScreen from './screens/customer/booking/BookingDetailScreen';
// import ChatBookingsScreen from './screens/customer/ChatBookingsScreen';
// import BookingVendorsScreen from './screens/customer/BookingVendorsScreen';
// import ChatScreen from './screens/customer/ChatScreen';
// import BikeRentalScreen from './screens/customer/HomePage/BikeRentalScreen';
// import CarRentalScreen from './screens/customer/HomePage/CarRentalScreen';
// import BusRentalScreen from './screens/customer/HomePage/BusRentalScreen';
// import TruckRentalScreen from './screens/customer/HomePage/TruckRentalScreen';
// import EquipmentScreen from './screens/customer/HomePage/EquipmentScreen';
// import PackerMoverScreen from './screens/customer/HomePage/PackerMoverScreen';
// import AirportScreen from './screens/customer/HomePage/AirportScreen';
// import SelfDriveScreen from './screens/customer/HomePage/SelfDriveScreen';
// import LuxuryScreen from './screens/customer/HomePage/LuxuryScreen';
// import OnewayScreenHome from './screens/customer/HomePage/OnewayScreenHome';
// import ViewQuoteScreen from './screens/customer/quote/ViewQuoteScreen';
// import MyBookingsScreen from './screens/customer/booking/MyBookingsScreen';
// import BikeBookingScreen from './screens/booking/BikeBookingScreen';
// import BookingConfirmationScreen from './screens/booking/BookingConfirmationScreen';
// import VendorLoginScreen from './screens/vendor/auth/LoginScreen';
// import VendorRegisterScreen from './screens/vendor/auth/RegisterScreen';
// import VendorDashboardScreen from './screens/vendor/DashboardScreen';
// import ExpensesScreen from './screens/customer/ExpensesScreen';
// import BusBookingScreen from './screens/booking/bus/BusBookingScreen';
// import OutstationScreen from './screens/booking/bus/OutstationScreen';
// import TruckBookingScreen from './screens/booking/truck/TruckBookingScreen';
// import CommercialBookingScreen from './screens/booking/truck/CommercialBookingScreen';
// import PersonalBookingScreen from './screens/booking/truck/PersonalBookingScreen';
// import LocalScreen from './screens/booking/bus/LocalScreen';
// import EquipmentBookingScreen from './screens/booking/equipment/EquipmentBookingScreen';
// import LuxuryCarBookingScreen from './screens/booking/luxuryCar/LuxuryCarBookingScreen';
// import StandardCarBookingScreen from './screens/booking/StandardCar/StandardCarBookingScreen';

// import RoundTripBookingScreen from './screens/booking/StandardCar/RoundTripBookingScreen';
// import OneWayBookingScreen from './screens/booking/StandardCar/OneWayBookingScreen';
// import AirportBookingScreen from './screens/booking/StandardCar/AirportBookingScreen';
// import SelfDriveBookingScreen from './screens/booking/selfdrive/SelfDriveBookingScreen';
// import PackersMoversBookingScreen from './screens/booking/PM/PackersMoversBookingScreen';
// import HomeBookingScreen from './screens/booking/PM/HomeBookingScreen';
// import OfficeBookingScreen from './screens/booking/PM/OfficeBookingScreen';
// import VehicleBookingScreen from './screens/booking/PM/VehicleBookingScreen';
// import ChatListScreen from './screens/customer/chat/ChatListScreen';
// import ChatDetailScreen from './screens/customer/chat/ChatDetailScreen';
// import EditProfileScreen from './screens/customer/profile/EditProfileScreen';
// import SettingScreen from './screens/customer/profile/SettingScreen';
// import AboutUsScreen from './screens/AboutUsScreen';
// import HelpdeskScreen from './screens/customer/profile/HelpdeskScreen';
// import Ionicons from 'react-native-vector-icons/Ionicons'; 
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { LogBox } from 'react-native';

// import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidStyle,AndroidImportance } from '@notifee/react-native';
// let badgeCount = 0;

// LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);

// // Background notification handler (must be outside component)
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   const { title, body, image } = remoteMessage.data;
//   // console.log('Background message received:', remoteMessage);

//  await notifee.displayNotification({
//     title,
//     body,
//     android: {
//       channelId: 'default',
//       smallIcon: 'ic_launcher',
//       importance: AndroidImportance.HIGH,
//       sound: 'default',
//       style: image && image !== 'null'
//   ? {
//       type: AndroidStyle.BIGPICTURE,
//       picture: image,
//     }
//   : undefined,
//     },
//   });
// });

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();  

// function CustomerDashboardTab() {
//   return (
//     <Tab.Navigator
//       initialRouteName="Home"
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused }) => {
//           let iconName;
//           if (route.name === 'Home') {
//             iconName = focused ? 'home' : 'home-outline';
//           } else if (route.name === 'Payments') {
//             iconName = focused ? 'card' : 'card-outline';
//           } else if (route.name === 'Bookings') {
//             iconName = focused ? 'add-circle' : 'add-circle-outline';
//           } else if (route.name === 'Chat') {
//             iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
//           }
//           return (
//             <View style={styles.iconContainernavi}>
//               {focused && <View style={styles.activeTabDiv} />} 
//               <Ionicons
//                 name={iconName}
//                 size={25}
//                 color={focused ? styles.iconFocusedColor.color : styles.iconDefaultColor.color}
//               />
//             </View>
//           );
//         },
//         tabBarLabel: ({ focused }) => {
//           return (
//             <Text style={[styles.tabBarLabel, focused ? styles.tabBarLabelFocused : styles.tabBarLabelDefault]}>
//               {route.name}
//             </Text>
//           );
//         },
//         headerShown: false,
//         tabBarStyle: {
//           height: 70,  
//           paddingBottom: 10,  
//           zIndex: 100,
//           elevation: 10,
//           position: 'absolute', 
//           bottom: 0,  
//           left: 0,
//           right: 0,
//         },
//         tabBarButton: (props) => (
//           <TouchableOpacity {...props} style={[props.style, { overflow: 'hidden' }]} />
//         ),
//       })}
//     >
//       <Tab.Screen name="Home" component={CustomerDashboard} />
//       <Tab.Screen name="Payments" component={ExpensesScreen} />
//       <Tab.Screen name="Bookings" component={MyBookingsScreen} />
//       <Tab.Screen name="Chat" component={ChatBookingsScreen} />
//     </Tab.Navigator>
//   );
// }

// function SplashScreenWrapper() {
//   const navigation = useNavigation();
//   const handleFinish = async () => {
//     try {
//       const customerData = await AsyncStorage.getItem('customer');  
//       console.log(':key: Customer Data:', customerData); 
//       if (customerData) {
//         navigation.replace('CustomerDashboard');
//       } else {
//         navigation.replace('Onboarding');
//       }
//     } catch (error) {
//       console.log("Session check error:", error);
//       navigation.replace('Onboarding');
//     }
//   };
//   return <SplashScreen onFinish={handleFinish} />;
// }

// export default function App() {
//   useEffect(() => {
//     async function setupNotifications() {
//       console.log('Requesting permissions...');
//       if (Platform.OS === 'android' && Platform.Version >= 33) {
//         const status = await notifee.requestPermission();
//         console.log('Android permission status:', status);
//         if (!status) {
//           Alert.alert('Notification permission denied');
//           return;
//         }
//       } else {
//         const authStatus = await messaging().requestPermission();
//         console.log('iOS permission status:', authStatus);
//         if (
//           authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
//           authStatus !== messaging.AuthorizationStatus.PROVISIONAL
//         ) {
//           Alert.alert('Notification permission denied');
//           return;
//         }
//       }
// console.log('Creating channel...');
//       await notifee.createChannel({
//         id: 'default',
//         name: 'Default Channel',
//         importance: AndroidImportance.HIGH,
//         badge: true,
//       });
//       const fcmToken = await messaging().getToken();
//       console.log('FCM Token:', fcmToken);
//       // TODO: Send this token to your backend here
//      const unsubscribe = messaging().onMessage(async remoteMessage => {
//   console.log('Received foreground message:', remoteMessage);
// badgeCount += 1; // increase badge count
//   await notifee.setBadgeCount(badgeCount); // :white_check_mark: set on icon
//   const { title, body, image } = remoteMessage.data;
//   await notifee.displayNotification({
//     title: title,
//     body: body,
//     android: {
//       channelId: 'default',
//       smallIcon: 'ic_launcher',
//       badgeIconType: 1,
//       importance: AndroidImportance.HIGH,
//       style: image && image !== 'null'
//   ? {
//       type: AndroidStyle.BIGPICTURE,
//       picture: image,
//     }
//   : undefined,
//     },
//   });
// });
//       return unsubscribe;
//     }
// const testBadge = async () => {
//     await notifee.setBadgeCount(5);
//   };
//   testBadge();

//     const unsubscribePromise = setupNotifications();

//     return () => {
//       unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
//     };
//   }, []);

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Splash" component={SplashScreenWrapper} />
//         <Stack.Screen name="Onboarding" component={OnboardingScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
// <Stack.Screen name="Notifications" component={NotificationScreen} />
//         <Stack.Screen name="Register" component={RegisterScreen} />
//         <Stack.Screen name="CustomerDashboard" component={CustomerDashboardTab} />
//         <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
//         <Stack.Screen name="ViewQuote" component={ViewQuoteScreen} />
//         <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
//         <Stack.Screen name="BikeBookingScreen" component={BikeBookingScreen} />
//         <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
//         <Stack.Screen name="VendorLogin" component={VendorLoginScreen} />
//         <Stack.Screen name="VendorRegister" component={VendorRegisterScreen} />
//         <Stack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
//         <Stack.Screen name="OtpScreen" component={OtpScreen} />
//         <Stack.Screen name="LoginOtpScreen" component={LoginOtpScreen} />
//         <Stack.Screen name="ExpensesScreen" component={ExpensesScreen} />
//         <Stack.Screen name="BusBookingScreen" component={BusBookingScreen} />
//         <Stack.Screen name="LocalScreen" component={LocalScreen} />
//         <Stack.Screen name="OutstationScreen" component={OutstationScreen} />
//         <Stack.Screen name="TruckBookingScreen" component={TruckBookingScreen} />
//         <Stack.Screen name="CommercialBookingScreen" component={CommercialBookingScreen} />
//         <Stack.Screen name="PersonalBookingScreen" component={PersonalBookingScreen} />
//         <Stack.Screen name="EquipmentBookingScreen" component={EquipmentBookingScreen} />
//         <Stack.Screen name="LuxuryCarBookingScreen" component={LuxuryCarBookingScreen} />
//         <Stack.Screen name="StandardCarBookingScreen" component={StandardCarBookingScreen} />
//         <Stack.Screen name="Chatsvendor" component={ChatScreen} />
//         <Stack.Screen name="BookingVendors" component={BookingVendorsScreen} />
//         <Stack.Screen name="ChatBookings" component={ChatBookingsScreen} />
//         <Stack.Screen name="RoundTripBookingScreen" component={RoundTripBookingScreen} />
//         <Stack.Screen name="OneWayBookingScreen" component={OneWayBookingScreen} />
//         <Stack.Screen name="AirportBookingScreen" component={AirportBookingScreen} />
//         <Stack.Screen name="SelfDriveBookingScreen" component={SelfDriveBookingScreen} />
//         <Stack.Screen name="PackersMoversBookingScreen" component={PackersMoversBookingScreen} />
//         <Stack.Screen name="HomeBookingScreen" component={HomeBookingScreen} />
//         <Stack.Screen name="OfficeBookingScreen" component={OfficeBookingScreen} />
//         <Stack.Screen name="VehicleBookingScreen" component={VehicleBookingScreen} />
//         <Stack.Screen name="ChatList" component={ChatListScreen} />
//         <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
//         <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
//         <Stack.Screen name="SettingScreen" component={SettingScreen} />
//         <Stack.Screen name="BikeRentalScreen" component={BikeRentalScreen} />
//         <Stack.Screen name="CarRentalScreen" component={CarRentalScreen} />
//         <Stack.Screen name="BusRentalScreen" component={BusRentalScreen} />
//         <Stack.Screen name="TruckRentalScreen" component={TruckRentalScreen} />
//         <Stack.Screen name="EquipmentScreen" component={EquipmentScreen} />
//         <Stack.Screen name="PackerMoverScreen" component={PackerMoverScreen} />
//         <Stack.Screen name="AirportScreen" component={AirportScreen} />
//         <Stack.Screen name="SelfDriveScreen" component={SelfDriveScreen} />
//         <Stack.Screen name="LuxuryScreen" component={LuxuryScreen} />
//         <Stack.Screen name="OnewayScreenHome" component={OnewayScreenHome} />
//         <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
// <Stack.Screen name="HelpdeskScreen" component={HelpdeskScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   tabBar: {
//     paddingBottom: 20,
//     marginBottom: 10,
//   },
//   tabBarLabel: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginTop: 4,
//   },
//   tabBarLabelFocused: {
//     color: '#000',
//   },
//   tabBarLabelDefault: {
//     color: '#000',
//   },
//   iconFocusedColor: {
//     color: '#404040',
//   },
//   iconDefaultColor: {
//     color: '#757575',
//   },
//   tabBarStyle: {
//     paddingBottom: 20,
//     height: '7%',
//   },
//   iconContainernavi: {
//     alignItems: 'center',
//   },
//   activeTabDiv: {
//     width: 35,
//     height: 4,
//     marginTop: 0,
//     backgroundColor: '#4CAF50',
//     borderRadius: 1.5,
//     marginBottom: 5,
//   },
// });
