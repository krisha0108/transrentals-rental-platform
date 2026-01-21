import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { getSessionToken } from './api/client';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const [showSecondLogo, setShowSecondLogo] = useState(false);

  useEffect(() => {
    // First logo fade in
    Animated.timing(fadeAnim1, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // Then fade out
      Animated.timing(fadeAnim1, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setShowSecondLogo(true);
        // Second logo fade in
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          // Second logo fade out after delay
          setTimeout(() => {
            Animated.timing(fadeAnim2, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start(() => {
              // Call the onFinish callback from App.js which handles navigation
              if (onFinish) {
                onFinish();
              }
            });
          }, 2000);
        });
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/logo_tr_favicon.png')}
        style={[styles.logoFevicon, { opacity: fadeAnim1 }]}
        resizeMode="contain"
      />
      {showSecondLogo && (
        <Animated.Image
          source={require('../assets/mainaLogov.png')}
          style={[styles.logo, { opacity: fadeAnim2, position: 'absolute' }]}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFevicon: {
    width: '40%',
  },
  logo: {
    width: '80%',
    
  },
});

export default SplashScreen;
