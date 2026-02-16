import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/Feather';
import { authService } from '../../services';
import { LoginSuccessModal } from '../../../components/CustomModals';

const { width, height } = Dimensions.get('window');

// Simple responsive scaling
const responsiveScale = (size) => {
  const scaleFactor = width / 375; // Base width iPhone 6/7/8
  return size * scaleFactor;
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const inputSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.9)).current;

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // Start animations when component mounts
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Reset values
    fadeAnim.setValue(0);
    slideUpAnim.setValue(50);
    scaleAnim.setValue(0.8);
    bounceAnim.setValue(0);
    inputSlideAnim.setValue(30);
    buttonScaleAnim.setValue(0.9);

    // Main card animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // Input fields animation with delay
    setTimeout(() => {
      Animated.timing(inputSlideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 300);

    // Button animations with delay
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }, 600);
  };

  // Handle normal login - Updated for new API
  const handleLogin = async () => {
    if (!email || !password) {
      // Add shake animation for error
      const shakeAnim = new Animated.Value(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();

      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(email, password);

      if (response.status === 'success') {
        // Save customer data
        await authService.saveCustomerData(response.customers, response.token);

        // Get and save FCM token
        try {
          const fcmToken = await messaging().getToken();
          console.log('Got FCM token:', fcmToken);
          await authService.saveFcmToken(response.customers.id, fcmToken);
          console.log('FCM token sent to backend successfully');
        } catch (err) {
          console.log('Error sending FCM token to backend:', err.message);
        }

        setLoggedInUserName(response.customers.name || 'User');
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", response.message || "Login failed");
      }
    } catch (error) {
      console.log("Login Error:", error.message || "Unknown error");
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong during login.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login - Updated for new API
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google User Info:', userInfo);

      const response = await authService.googleLogin(
        userInfo.data.idToken,
        userInfo.data.user.email,
        userInfo.data.user.name
      );

      console.log('customerdata', response);

      if (response.status === 'success') {
        // Save customer data
        await authService.saveCustomerData(response.customers, response.token);

        // Get and save FCM token
        try {
          const fcmToken = await messaging().getToken();
          console.log('Got FCM token:', fcmToken);
          await authService.saveFcmToken(response.customers.id, fcmToken);
          console.log('FCM token sent to backend successfully');
        } catch (err) {
          console.log('Error sending FCM token to backend:', err.message);
        }

        setLoggedInUserName(response.customers.name || 'User');
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", response.message || "Google login failed");
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Error", "Sign-in was cancelled.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Error", "Google Sign-In is in progress.");
      } else {
        console.log("Google login failed:", error.message || error.code || "Unknown error");
        if (error.code === statusCodes.DEVELOPER_ERROR) {
          Alert.alert("Error", "Developer Error: Make sure your Google Play services and OAuth setup are correct.");
        } else {
          Alert.alert("Error", "Google login failed. Please try again.");
        }
      }
    }
  };

  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.replace("CustomerDashboard");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ Background Image - Same as before */}
          <Image
            source={require("../../../assets/trlogin.png")}
            style={styles.bgImage}
            resizeMode="cover"
          />
          
          {/* ✅ Main Content Container */}
          <View style={styles.mainContainer}>
            {/* ✅ Animated Login Card - EXACT SAME DESIGN */}
            <Animated.View 
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideUpAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* ✅ Animated Title */}
              <Animated.Text 
                style={[
                  styles.title,
                  {
                    transform: [{ translateX: inputSlideAnim }]
                  }
                ]}
              >
                Log in
              </Animated.Text>

              <View style={styles.form}>
                {/* ✅ Animated Email Input */}
                <Animated.View 
                  style={[
                    styles.inputBox,
                    {
                      transform: [{ translateX: inputSlideAnim }]
                    }
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#777"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Animated.View>

                {/* ✅ Animated Password Input */}
                <Animated.View 
                  style={[
                    styles.passwordBox,
                    {
                      transform: [{ translateX: inputSlideAnim }]
                    }
                  ]}
                >
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#777"
                    secureTextEntry={!passwordVisible}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  >
                    <Icon
                      name={passwordVisible ? "eye" : "eye-off"}
                      size={responsiveScale(20)}
                      color="#444"
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* ✅ Animated Forgot Password */}
                <Animated.View
                  style={{
                    transform: [{ translateX: inputSlideAnim }]
                  }}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("ForgotPassword")}
                  >
                    <Text style={styles.forgot}>Forgot Password?</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* ✅ Animated Login Button */}
                <Animated.View
                  style={{
                    transform: [
                      { scale: buttonScaleAnim },
                      { 
                        scale: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1]
                        })
                      }
                    ]
                  }}
                >
                  <TouchableOpacity
                    style={[styles.loginBtn, loading && { backgroundColor: '#A9A9A9' }]}
                    onPress={handleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.loginText, { marginRight: responsiveScale(10) }]}>Please wait</Text>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    ) : (
                      <Text style={styles.loginText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* ✅ Animated Google Button */}
                <Animated.View
                  style={{
                    transform: [
                      { scale: buttonScaleAnim },
                      { 
                        scale: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1]
                        })
                      }
                    ]
                  }}
                >
                  <TouchableOpacity 
                    style={styles.googleBtn} 
                    onPress={handleGoogleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    {/* Google Logo */}
                    <Image
                      source={require('../../../assets/google-logo.png')}
                      style={{ 
                        width: responsiveScale(30), 
                        height: responsiveScale(30), 
                        marginRight: responsiveScale(12) 
                      }}
                    />

                    {/* Left Text */}
                    <Text style={styles.googleText}>Continue with</Text>

                    {/* Vertical Divider */}
                    <View
                      style={{
                        width: responsiveScale(2),
                        height: responsiveScale(25),
                        backgroundColor: "#DDD",
                        marginHorizontal: responsiveScale(12),
                      }}
                    />

                    {/* Google Brand Text */}
                    <Image
                      source={require('../../../assets/google1.png')}
                      style={{ 
                        width: responsiveScale(55), 
                        height: responsiveScale(35), 
                        resizeMode: "contain" 
                      }}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* ✅ Animated Register */}
                <Animated.Text 
                  style={[
                    styles.registerText,
                    {
                      transform: [{ translateX: inputSlideAnim }]
                    }
                  ]}
                >
                  Don't have an account?
                  <Text
                    style={styles.registerLink}
                    onPress={() => navigation.navigate("Register")}
                  >
                    {" "}
                    Register
                  </Text>
                </Animated.Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <LoginSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        userName={loggedInUserName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#DCDCDC",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height, // ✅ Minimum height screen ke equal
  },
  mainContainer: {
    flex: 1,
    minHeight: height, // ✅ Minimum height screen ke equal
  },
  bgImage: {
    width: "100%",
    height: Math.max(height, 100), // Responsive height
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: responsiveScale(330), // 88% of base 375 = ~330, now responsive
    padding: responsiveScale(25),
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    borderRadius: 0,
    alignSelf: 'center',
    justifyContent: 'center',
    flex: 1,
    top: responsiveScale(160),
  },
  title: {
    fontSize: responsiveScale(30),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: responsiveScale(22),
    color: "#111",
  },
  inputBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: responsiveScale(12),
    marginBottom: responsiveScale(12),
    paddingHorizontal: responsiveScale(12),
    height: responsiveScale(50),
    justifyContent: "center",
  },
  passwordBox: {
    backgroundColor: "#F7F7F7",
    borderRadius: responsiveScale(12),
    marginBottom: responsiveScale(10),
    paddingHorizontal: responsiveScale(12),
    height: responsiveScale(50),
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    fontSize: responsiveScale(15),
    color: "#333",
  },
  forgot: {
    textAlign: "right",
    color: "#22C55E",
    fontWeight: "600",
    marginBottom: responsiveScale(18),
    fontSize: responsiveScale(14),
  },
  loginBtn: {
    backgroundColor: "#22C55E",
    height: responsiveScale(50),
    borderRadius: responsiveScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsiveScale(18),
  },
  loginText: {
    fontSize: responsiveScale(17),
    color: "#fff",
    fontWeight: "700",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: responsiveScale(48),
    backgroundColor: "#fff",
    borderRadius: responsiveScale(14),
    elevation: 4,
    marginBottom: responsiveScale(18),
  },
  googleText: {
    fontSize: responsiveScale(16),
    color: "#444",
    fontWeight: "600",
  },
  registerText: {
    textAlign: "center",
    color: "#555",
    fontSize: responsiveScale(14),
  },
  registerLink: {
    color: "#22C55E",
    fontWeight: "700",
  },
});