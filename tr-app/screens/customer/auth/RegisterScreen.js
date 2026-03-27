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
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { authService } from '../../services';

const { width, height } = Dimensions.get('window');

// Simple responsive scaling
const responsiveScale = (size) => {
  const scaleFactor = width / 375; // Base width iPhone 6/7/8
  return size * scaleFactor;
};

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardAnimationComplete, setCardAnimationComplete] = useState(false);

  // COMPLETELY NEW ANIMATIONS
  const flipAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(300)).current; // Card slides up from bottom
  const typewriterAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const inputStaggerAnim = useRef(new Animated.Value(0)).current;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com',
      offlineAccess: true,
    });

    startAnimations();
  }, []);

  const startAnimations = () => {
    // Reset animations
    flipAnim.setValue(0);
    cardSlideAnim.setValue(300);
    typewriterAnim.setValue(0);
    particleAnim.setValue(0);
    inputStaggerAnim.setValue(0);

    // Card slide up animation - ONE TIME ONLY
    Animated.timing(cardSlideAnim, {
      toValue: 0,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setCardAnimationComplete(true); // Card animation complete - now fix it
    });

    // Flip animation for header - ONE TIME ONLY
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Wave animation for background elements - CONTINUOUS
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Glow animation for buttons - CONTINUOUS
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Typewriter effect for title - ONE TIME ONLY
    Animated.timing(typewriterAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Particle animation - ONE TIME ONLY
    setTimeout(() => {
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 300);

    // Input stagger animation - ONE TIME ONLY
    setTimeout(() => {
      Animated.timing(inputStaggerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 500);
  };

  // Flip interpolation
  const flipInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Wave interpolation
  const waveInterpolate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10]
  });

  // Glow interpolation
  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  // Card slide interpolation
  const cardSlideInterpolate = cardSlideAnim.interpolate({
    inputRange: [0, 300],
    outputRange: [0, 300]
  });

  // Typewriter interpolation
  const typewriterInterpolate = typewriterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  // Input stagger interpolation
  const getInputStaggerAnimation = (index) => {
    return {
      transform: [
        {
          translateX: inputStaggerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [index % 2 === 0 ? -50 : 50, 0]
          })
        }
      ],
      opacity: inputStaggerAnim
    };
  };

  // Direct registration without OTP
  const handleRegister = async () => {
    const { name, email, phone, password } = formData;
    if (!name || !email || !phone || !password) {
      return Alert.alert("Error", "All fields are required.");
    }
    setLoading(true);

    try {
      const response = await authService.register(name, email, phone, password);

      if (response.status === 'success') {
        // Save customer data
        await authService.saveCustomerData(response.customers, response.token);

        // Get and save FCM token
        try {
          const fcmToken = await messaging().getToken();
          await authService.saveFcmToken(response.customers.id, fcmToken);
        } catch (err) {
          // FCM token save failed silently
        }

        Alert.alert("Success", "Registration successful!");
        navigation.replace("CustomerDashboard");
      } else {
        Alert.alert("Error", response.message || "Registration failed");
      }
    } catch (err) {
      console.log("Register Error:", err.message || "Unknown error");
      const errorMessage = err.response?.data?.message || err.message || "Something went wrong.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Updated for new API
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const response = await authService.googleLogin(
        userInfo.data.idToken,
        userInfo.data.user.email,
        userInfo.data.user.name
      );

      if (response.status === 'success') {
        // Save customer data
        await authService.saveCustomerData(response.customers, response.token);

        // Get and save FCM token
        try {
          const fcmToken = await messaging().getToken();
          await authService.saveFcmToken(response.customers.id, fcmToken);
        } catch (err) {
          // FCM token save failed silently
        }

        Alert.alert("Success", "Register successful!");
        navigation.replace("CustomerDashboard");
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
          {/* ✅ Background Image - Scrollable */}
          <Image
            source={require("../../../assets/trlogin.png")}
            style={styles.bgImage}
            resizeMode="cover"
          />

          {/* ✅ Main Content Container */}
          <View style={styles.mainContainer}>
            {/* Animated Background Waves - CONTINUOUS ANIMATION */}
            <Animated.View 
              style={[
                styles.wave,
                styles.wave1,
                {
                  transform: [
                    { translateY: waveInterpolate }
                  ]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.wave,
                styles.wave2,
                {
                  transform: [
                    { translateY: Animated.multiply(waveInterpolate, -1) }
                  ]
                }
              ]} 
            />

            {/* Floating Particles - CONTINUOUS ANIMATION */}
            <Animated.View 
              style={[
                styles.particle,
                styles.particle1,
                {
                  opacity: particleAnim,
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.particle,
                styles.particle2,
                {
                  opacity: particleAnim,
                }
              ]} 
            />

            <View style={styles.container}>
              {/* Animated Header with Flip - ONE TIME ANIMATION */}
              <Animated.View 
                style={[
                  styles.header,
                  {
                    transform: [
                      { rotateY: flipInterpolate }
                    ]
                  }
                ]}
              >
                <Animated.Text 
                  style={[
                    styles.title,
                    {
                      opacity: typewriterInterpolate,
                      transform: [
                        {
                          scale: typewriterInterpolate.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  {/* Join Us */}
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.subtitle,
                    {
                      opacity: typewriterInterpolate
                    }
                  ]}
                >
                  {/* Create your account */}
                </Animated.Text>
              </Animated.View>

              {/* ✅ ANIMATED FORM CONTAINER - SLIDES UP THEN FIXED */}
              <Animated.View 
                style={[
                  styles.formContainer,
                  {
                    transform: [
                      { translateY: cardAnimationComplete ? 0 : cardSlideInterpolate }
                    ]
                  }
                ]}
              >
                {/* Name Input with Stagger Animation */}
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    getInputStaggerAnimation(0)
                  ]}
                >
                  <View style={styles.inputContainer}>
                    <Icon name="user" size={responsiveScale(20)} color="#666" style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Enter your full name" 
                      value={formData.name} 
                      onChangeText={(text) => handleChange('name', text)} 
                      style={styles.input} 
                      placeholderTextColor="#999"
                    />
                  </View>
                </Animated.View>

                {/* Email Input with Stagger Animation */}
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    getInputStaggerAnimation(1)
                  ]}
                >
                  <View style={styles.inputContainer}>
                    <Icon name="mail" size={responsiveScale(20)} color="#666" style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Enter your email" 
                      value={formData.email} 
                      keyboardType="email-address" 
                      onChangeText={(text) => handleChange('email', text)} 
                      style={styles.input} 
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                    />
                  </View>
                </Animated.View>

                {/* Phone Input with Stagger Animation */}
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    getInputStaggerAnimation(2)
                  ]}
                >
                  <View style={styles.inputContainer}>
                    <Icon name="phone" size={responsiveScale(20)} color="#666" style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Enter your phone number" 
                      value={formData.phone} 
                      keyboardType="phone-pad" 
                      onChangeText={(text) => handleChange('phone', text)} 
                      style={styles.input} 
                      placeholderTextColor="#999"
                    />
                  </View>
                </Animated.View>

                {/* Password Input with Stagger Animation */}
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    getInputStaggerAnimation(3)
                  ]}
                >
                  <View style={styles.inputContainer}>
                    <Icon name="lock" size={responsiveScale(20)} color="#666" style={styles.inputIcon} />
                    <TextInput 
                      placeholder="Create a password"
                      style={styles.input}
                      secureTextEntry={!passwordVisible} 
                      value={formData.password}
                      onChangeText={(text) => handleChange('password', text)} 
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={styles.eyeIcon}
                    >
                      <Icon 
                        name={passwordVisible ? "eye" : "eye-off"} 
                        size={responsiveScale(20)} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Register Button with Glow Animation */}
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    {
                      transform: [
                        {
                          scale: glowInterpolate.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.02]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      loading && { backgroundColor: '#A9A9A9' }
                    ]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.registerButtonText, { marginRight: responsiveScale(10) }]}>Creating Account...</Text>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    ) : (
                      <Text style={styles.registerButtonText}>Register</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider with Fade Animation */}
                <Animated.View 
                  style={[
                    styles.divider,
                    {
                      opacity: inputStaggerAnim
                    }
                  ]}
                >
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </Animated.View>

                {/* Google Button with Fade Animation */}
                {/* <Animated.View
                  style={{
                    opacity: inputStaggerAnim
                  }}
                >
                  <TouchableOpacity 
                    style={styles.googleButton} 
                    onPress={handleGoogleLogin}
                  >
                    <Image 
                      source={require('../../../assets/google-logo.png')}   
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </Animated.View> */}


{/* Google Button with Fade Animation */}
<Animated.View
  style={{
    opacity: inputStaggerAnim
  }}
>
  <TouchableOpacity 
    style={styles.googleButton}
    onPress={handleGoogleLogin}
  >

    {/* Google Icon (Left Logo) */}
    <Image
      source={require('../../../assets/google-logo.png')}
      style={{ 
        width: responsiveScale(25), 
        height: responsiveScale(25), 
        marginRight: responsiveScale(12),
      }}
    />

    {/* Text: Continue with */}
    <Text style={styles.googleText}>
      Continue with
    </Text>

    {/* Vertical Divider */}
    <View
      style={{
        width: responsiveScale(2),
        height: responsiveScale(25),
        backgroundColor: "#DDD",
        marginHorizontal: responsiveScale(12),
      }}
    />

    {/* Google Brand Image */}
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

                {/* Login Link with Fade Animation */}
                <Animated.View 
                  style={[
                    styles.loginContainer,
                    {
                      opacity: inputStaggerAnim
                    }
                  ]}
                >
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text
                      style={styles.loginLink}
                      onPress={() => navigation.navigate('Login')}
                    >
                      Log In
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal:10,
                      borderRadius: responsiveScale(14),
                      height: responsiveScale(50),
                      marginTop: responsiveScale(14),
                      backgroundColor: '#1E293B',
                      gap: responsiveScale(10),
                      elevation: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                    }}
                    onPress={() => navigation.navigate('B2BRegister')}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: responsiveScale(28),
                      height: responsiveScale(28),
                      borderRadius: responsiveScale(8),
                      backgroundColor: '#22C55E',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon name="briefcase" size={responsiveScale(14)} color="#fff" />
                    </View>
                    <Text style={{ fontSize: responsiveScale(15), fontWeight: '700', color: '#fff' }}>
                      B2B / Corporate Register
                    </Text>
                    <Icon name="chevron-right" size={responsiveScale(16)} color="#22C55E" />
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  // ✅ Background Image Style - Scrollable
  bgImage: {
    position: 'absolute',
    width: "100%",
    height: Math.max(height, 100), // Sufficient height for scrolling
    top: 0,
    left: 0,
    right: 0,
  },
  mainContainer: {
    flex: 1,
    minHeight: height, // ✅ Minimum height screen ke equal
  },
  container: {
    flex: 1,
    paddingHorizontal: responsiveScale(25),
    justifyContent: 'center',
    minHeight: height - responsiveScale(100), // ✅ Center content properly
  },
  wave: {
    position: 'absolute',
    width: width * 2,
    height: responsiveScale(200),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1000,
  },
  wave1: {
    top: responsiveScale(-50),
    left: -width * 0.5,
  },
  wave2: {
    bottom: responsiveScale(-50),
    right: -width * 0.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: responsiveScale(25),
  },
  particle1: {
    width: responsiveScale(50),
    height: responsiveScale(50),
    top: responsiveScale(100),
    left: responsiveScale(50),
  },
  particle2: {
    width: responsiveScale(30),
    height: responsiveScale(30),
    bottom: responsiveScale(150),
    right: responsiveScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: responsiveScale(40),
  },
  title: {
    fontSize: responsiveScale(42),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: responsiveScale(8),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: responsiveScale(16),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  formContainer: {
    backgroundColor: "#58565665",
    borderRadius: responsiveScale(25),
    padding: responsiveScale(25),
  },
  inputWrapper: {
    marginBottom: responsiveScale(20),
  },
  label: {
    fontSize: responsiveScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: responsiveScale(8),
    marginLeft: responsiveScale(5),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: responsiveScale(15),
    paddingHorizontal: responsiveScale(15),
    height: responsiveScale(55),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: responsiveScale(12),
  },
  input: {
    flex: 1,
    fontSize: responsiveScale(16),
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: responsiveScale(5),
  },
  buttonWrapper: {
    marginTop: responsiveScale(10),
    marginBottom: responsiveScale(20),
  },
  registerButton: {
    backgroundColor: '#22C55E',
    height: responsiveScale(55),
    borderRadius: responsiveScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: responsiveScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: responsiveScale(20),
    elevation: 8,
  },
  registerButtonText: {
    color: '#FFFF',
    fontSize: responsiveScale(20),
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: responsiveScale(10),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    color: '#ffff',
    fontWeight: '600',
    marginHorizontal: responsiveScale(15),
    fontSize: responsiveScale(14),
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: responsiveScale(55),
    borderRadius: responsiveScale(15),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: responsiveScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsiveScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: responsiveScale(5),
    elevation: 3,
      paddingVertical: responsiveScale(10),
  paddingHorizontal: responsiveScale(14),
  borderRadius: responsiveScale(10),
  },
  googleIcon: {
    width: responsiveScale(20),
    height: responsiveScale(20),
    marginRight: responsiveScale(10),
  },
  googleButtonText: {
    color: '#333',
    fontSize: responsiveScale(14),
    fontWeight: '800',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    color: '#ffff',
    fontSize: responsiveScale(15),
    fontWeight: '500',
  },
  loginLink: {
    color: '#fff',
    fontWeight: '700',
  },
});