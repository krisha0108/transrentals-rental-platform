
// import React from 'react';
// import { SafeAreaView, Text, TouchableOpacity,ImageBackground, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';  // Import useNavigation for navigation
// import FastImage from 'react-native-fast-image';
// export default function BookingConfirmationScreen() {
//   const navigation = useNavigation(); // Get the navigation prop
//   // Function to navigate to the Dashboard
//   const navigateToDashboard = () => {
//     navigation.navigate('CustomerDashboard'); // Navigate to the Customer Dashboard
//   };
//   return (
//     <SafeAreaView style={styles.container}>
//        <FastImage
//         source={require('../../assets/bookingConfirmmm.gif')}  // local gif file
//         style={styles.background}
//         resizeMode={FastImage.resizeMode.contain}
//       >
//         <TouchableOpacity style={styles.dashboardButton} onPress={navigateToDashboard}>
//           <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
//         </TouchableOpacity>
//       </FastImage>
//     </SafeAreaView>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//    background: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//    margin: 20,
//   },
//   text: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   dashboardButton: {
//     position: 'absolute',
//     backgroundColor: '#09B368',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//     marginTop: 20,
//     bottom: 100,
//   },
//   dashboardButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const BG = '#F5F5F7';
const GREEN = '#09B368';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // params coming from booking screens
  const bookingId = route?.params?.booking_id || 'TRX-24835';

  // these can come from different booking screens
  const rawServiceName = route?.params?.service_name;     // e.g. "Luxury Car"
  const serviceType    = route?.params?.service_type;     // e.g. "car", "bike"
  const shiftingType   = route?.params?.shifting_type;    // e.g. "Home", "Office", "Vehicle"
  const vehicleType    = route?.params?.vehicle_type;     // e.g. "SUV", "Sedan"

  // 1) figure out FINAL NAME
  // priority: explicit service_name → shifting_type → vehicle_type → fallback
  let finalServiceName =
    rawServiceName ||
    shiftingType ||
    vehicleType ||
    'Packers & Movers';

  // normalize a bit
  const lower = finalServiceName.toLowerCase();

  // 2) pick icon based on service
  const getIconForService = () => {
    // packers / movers
    if (lower.includes('packer') || lower.includes('mover') || lower.includes('shift')) {
      return 'cube-outline';
    }
    // cars
    if (lower.includes('car') || lower.includes('sedan') || lower.includes('hatch') || serviceType === 'car') {
      return 'car-outline';
    }
    // bikes
    if (lower.includes('bike') || serviceType === 'bike') {
      return 'bicycle-outline';
    }
    // trucks / tempo
    if (lower.includes('truck') || lower.includes('tempo') || lower.includes('pickup')) {
      return 'trailers-outline';
    }
    // buses
    if (lower.includes('bus')) {
      return 'bus-outline';
    }
    // equipment
    if (lower.includes('equipment') || lower.includes('jcb') || lower.includes('crane')) {
      return 'construct-outline';
    }
    // office shifting
    if (lower.includes('office')) {
      return 'briefcase-outline';
    }
    // default
    return 'cube-outline';
  };

  const finalIcon = getIconForService();

  // animations
  const sheetY = useRef(new Animated.Value(120)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const bgFade = useRef(new Animated.Value(0)).current;
  const confettiFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 → pulse + confetti
    Animated.parallel([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(confettiFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2 → card + buttons + glow together (faster)
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          damping: 12,
          stiffness: 120,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(bgFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [pulse, sheetY, btnFade, bgFade, confettiFade]);

  const scaleCircle = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const bgOpacity = bgFade.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  const goDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CustomerDashboard' }],
    });
  };

  const goBookingDetails = () => {
    // Navigate based on service type
    if (lower.includes('bike') || serviceType === 'bike') {
      navigation.navigate('MyBikeBookings');
    } else {
      navigation.navigate('MyBookings');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Animated background gradients */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgBurst,
          {
            opacity: bgOpacity,
            transform: [{ scale: 1.15 }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bgBurst2,
          {
            opacity: bgOpacity,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation & Title */}
        <View style={styles.centerWrap}>
          <Animated.View
            style={[
              styles.successOuter,
              {
                transform: [{ scale: scaleCircle }],
              },
            ]}
          >
            <View style={styles.successInner}>
              <Ionicons name="checkmark-circle" size={64} color="#fff" />
            </View>
          </Animated.View>

          {/* Confetti particles */}
          <Animated.View
            style={[
              styles.confettiContainer,
              { opacity: confettiFade }
            ]}
          >
            <View style={[styles.confetti, { top: 20, left: 40, backgroundColor: '#FFD700' }]} />
            <View style={[styles.confetti, { top: 40, right: 50, backgroundColor: '#FF69B4' }]} />
            <View style={[styles.confetti, { top: 60, left: 60, backgroundColor: '#00CED1' }]} />
            <View style={[styles.confetti, { top: 30, right: 40, backgroundColor: '#FF6347' }]} />
            <View style={[styles.confetti, { top: 70, left: 100, backgroundColor: '#9370DB' }]} />
            <View style={[styles.confetti, { top: 50, right: 80, backgroundColor: '#32CD32' }]} />
          </Animated.View>

          <Text style={styles.title}>Booking Created Successfully!</Text>
          <View style={styles.bookingIdBox}>
            <Ionicons name={finalIcon} size={16} color={GREEN} />
            <Text style={styles.bookingIdText}>Booking ID: {bookingId}</Text>
          </View>
        </View>

        {/* Info Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          <View style={styles.cardIconRow}>
            <View style={styles.cardIconCircle}>
              <Ionicons name="information-circle" size={28} color={GREEN} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>What happens next?</Text>
              <Text style={styles.cardSub}>
                Vendors near you will send quotes. Compare and choose the best one!
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotDone]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Request Sent</Text>
                <Text style={styles.stepSub}>Notified nearby vendors</Text>
              </View>
            </View>
            <View style={styles.stepLine} />

            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotActive]}>
                <View style={styles.dotPulse} />
                <Text style={styles.dotText}>2</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Receive Quotes</Text>
                <Text style={styles.stepSub}>Compare prices & details</Text>
              </View>
            </View>
            <View style={styles.stepLine} />

            <View style={styles.stepRow}>
              <View style={[styles.dot, styles.dotMuted]}>
                <Text style={styles.dotTextMuted}>3</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Confirm & Enjoy</Text>
                <Text style={styles.stepSub}>Book and get ready for your ride</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Options */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: btnFade,
              transform: [
                {
                  translateY: btnFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.actionTitle}>What would you like to do?</Text>

          {/* Option Cards */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={goBookingDetails}
              activeOpacity={0.85}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name="receipt-outline" size={28} color={GREEN} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>View Booking</Text>
                <Text style={styles.optionDesc}>Check quotes & details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={goDashboard}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconCircle, styles.optionIconCircle2]}>
                <Ionicons name="home-outline" size={28} color="#6366F1" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Go to Dashboard</Text>
                <Text style={styles.optionDesc}>Browse more services</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Help Note */}
        <Animated.View style={[styles.helpNote, { opacity: btnFade }]}>
          <View style={styles.helpIconCircle}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>Pro Tip: </Text>
            Respond to vendor calls quickly to secure the best rates and availability.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  bgBurst: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(9,179,104,0.08)',
    borderRadius: 999,
  },
  bgBurst2: {
    position: 'absolute',
    top: 100,
    right: -80,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: 999,
  },
  centerWrap: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  successOuter: {
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(9,179,104,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successInner: {
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  bookingIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(9,179,104,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 12,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: GREEN,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardIconRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  cardIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  timeline: {
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: {
    backgroundColor: GREEN,
  },
  dotActive: {
    backgroundColor: 'rgba(9,179,104,0.15)',
    borderWidth: 2,
    borderColor: GREEN,
    position: 'relative',
  },
  dotPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(9,179,104,0.2)',
  },
  dotMuted: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  dotText: {
    color: GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  dotTextMuted: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  stepTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  stepSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  stepLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginLeft: 15,
    marginVertical: 4,
  },
  actionSection: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  optionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconCircle2: {
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  helpNote: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  helpIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF9C3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    flex: 1,
    fontSize: 12.5,
    color: '#92400E',
    lineHeight: 18,
  },
  helpBold: {
    fontWeight: '700',
    color: '#78350F',
  },
});
