import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDriverToken } from '../api/client';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // After 2.5s, decide where to go
    const timer = setTimeout(async () => {
      try {
        const token = await getDriverToken();
        if (token) {
          // Already logged in — go straight to app
          navigation.replace('Main');
        } else {
          // Not logged in — always show onboarding first
          navigation.replace('Onboarding');
        }
      } catch {
        navigation.replace('Onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#064E3B', '#065F46', '#16A34A']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Background circles for depth */}
      <View style={styles.circleLg} />
      <View style={styles.circleSm} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            {/* Steering wheel icon using nested views */}
            <View style={styles.wheelHub} />
            <View style={styles.wheelSpoke1} />
            <View style={styles.wheelSpoke2} />
            <View style={styles.wheelSpoke3} />
          </View>
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>Driver App</Text>
        <Text style={styles.company}>by TransRentals</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your trips. Your earnings. Your way.
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        <LoadingDots />
      </Animated.View>

      {/* Bottom branding */}
      <View style={styles.bottom}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </LinearGradient>
  );
}

function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    function pulse(dot, delay) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }
    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // decorative circles
  circleLg: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -width * 0.5,
    right: -width * 0.3,
  },
  circleSm: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  // Logo
  logoWrap: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Steering wheel icon (custom drawn)
  wheelHub: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    position: 'absolute',
  },
  wheelSpoke1: {
    position: 'absolute',
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#16A34A',
    top: 10,
  },
  wheelSpoke2: {
    position: 'absolute',
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#16A34A',
    left: 26,
  },
  wheelSpoke3: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#16A34A',
    bottom: 12,
    transform: [{ rotate: '45deg' }],
  },
  // Text
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  company: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tagline: {
    marginTop: 16,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  // Loading
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  // Footer
  bottom: {
    position: 'absolute',
    bottom: 40,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
});
