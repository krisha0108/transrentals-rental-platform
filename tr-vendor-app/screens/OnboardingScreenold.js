import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
const { width, height } = Dimensions.get('window');
const slides = [
  { image: require('../assets/vendor-slide-1.png') },
  { image: require('../assets/vendor-slide-2.png') },
  { image: require('../assets/vendor-slide-3.png') },
  { image: require('../assets/vendor-slide-4.png') },
];
export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigation.replace('VendorLoginScreen');
    }
  };
  // Function to request notification permission
  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
      } else {
        Alert.alert('Notification permission denied');
      }
    } else {
      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.log('Notification permission granted');
      } else {
        Alert.alert('Notification permission denied');
      }
    }
  };
  // Request permission when the first slide is active
  useEffect(() => {
    if (current === 0) {
      const requestPermission = async () => {
        await requestNotificationPermission();
      };
      requestPermission();
    }
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [current]);
  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace('VendorLoginScreen')}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image
          source={slides[current].image}
          style={styles.image}
          resizeMode="cover"
        />
  
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, current === index && styles.dotActive]}
            />
          ))}
        </View>
        <View style={styles.nextButtonWrapper}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {current === slides.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: height * 0.05,
    right: width * 0.05,
    zIndex: 1,
  },
  skipText: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: '#404040',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.08,
  },
 image: {
  width: width,
  height: height,
  position: 'absolute',
  top: 0,
  left: 0,
},
 pagination: {
  position: 'absolute',
  bottom: height * 0.11, // 15% from bottom
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'center',
  gap: width * 0.02,
  zIndex: 2,
},
  dot: {
    height: 9,
    width: 9,
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
  },
  dotActive: {
    width: 36,
    backgroundColor: '#28A745',
  },
  nextButtonWrapper: {
  position: 'absolute',
  bottom: height * 0.04, // 7% from bottom
  left: 0,
  left: 250,
  alignItems: 'center',
  zIndex: 2,
},
  nextButton: {
    backgroundColor: '#28A745',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.08,
    borderRadius: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: width * 0.05,
    fontWeight: '600',
  },
});
