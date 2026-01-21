import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { authService } from '../../services';

const { width, height } = Dimensions.get('window');

// Simple responsive scaling
const responsiveScale = (size) => {
  const scaleFactor = width / 375;
  return size * scaleFactor;
};

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // ✅ Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const stepAnim = useRef(new Animated.Value(1)).current;

  // ✅ Screen Fade + Slide animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Step transition animation
  const animateStep = () => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  // Updated for new API
  const sendOtp = async () => {
    if (!email) {
      return Alert.alert('Error', 'Please enter your email');
    }
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.status === 'success') {
        Alert.alert('OTP sent to your email.');
        animateStep();
        setStep(2);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Note: New API combines verify and reset in one step
  const verifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      return Alert.alert('Error', 'Please enter 4-digit OTP');
    }

    // In new API, we go directly to password reset step
    // OTP is verified when resetting password
    Alert.alert('OTP entered. Please set your new password.');
    animateStep();
    setStep(3);
  };

  // Updated for new API - combines OTP verification with password reset
  const resetPassword = async () => {
    if (!password || password !== confirmPassword) {
      return Alert.alert('Error', "Passwords don't match");
    }

    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    const enteredOtp = otp.join('');

    setLoading(true);
    try {
      const response = await authService.resetPassword(email, enteredOtp, password);
      if (response.status === 'success') {
        Alert.alert('Success', 'Password reset successfully!');
        navigation.replace('Login');
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
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
          <ImageBackground
            source={require("../../../assets/trlogin.png")}
            style={styles.bgImage}
            resizeMode="cover"
          >
            
            {/* ✅ Top Space - Scrolling ke liye space */}
            <View style={styles.topSpace} />

            {/* ✅ Animated Card */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Animated.View style={{ opacity: stepAnim }}>
                <Text style={styles.title}>Forgot Password</Text>

                {/* ✅ Loader */}
                {loading && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#22C55E" />
                  </View>
                )}

                {/* ✅ STEP 1 */}
                {step === 1 && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />

                    <TouchableOpacity 
                      style={[styles.button, loading && styles.buttonDisabled]} 
                      onPress={sendOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Send OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* ✅ STEP 2 */}
                {step === 2 && (
                  <>
                    <Text style={styles.label}>Enter OTP</Text>

                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <Animated.View
                          key={index}
                          style={{
                            transform: [
                              {
                                scale: stepAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.7, 1],
                                }),
                              },
                            ],
                          }}
                        >
                          <TextInput
                            ref={otpRefs[index]}
                            style={styles.otpBox}
                            keyboardType="numeric"
                            maxLength={1}
                            value={digit}
                            onChangeText={(value) =>
                              handleOtpChange(value, index)
                            }
                            editable={!loading}
                          />
                        </Animated.View>
                      ))}
                    </View>

                    <TouchableOpacity 
                      style={[styles.button, loading && styles.buttonDisabled]} 
                      onPress={verifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Verify OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* ✅ STEP 3 */}
                {step === 3 && (
                  <>
                    <Text style={styles.label}>New Password</Text>

                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!passwordVisible}
                        placeholder="Enter new password"
                        placeholderTextColor="#999"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        disabled={loading}
                      >
                        <Icon
                          name={passwordVisible ? "eye" : "eye-off"}
                          size={responsiveScale(20)}
                          color="#888"
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirm Password</Text>

                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!confirmVisible}
                        placeholder="Confirm password"
                        placeholderTextColor="#999"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setConfirmVisible(!confirmVisible)}
                        disabled={loading}
                      >
                        <Icon
                          name={confirmVisible ? "eye" : "eye-off"}
                          size={responsiveScale(20)}
                          color="#888"
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={resetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* ✅ Back to Login */}
                <TouchableOpacity onPress={() => navigation.replace("Login")} disabled={loading}>
                  <Text style={styles.backToLogin}>
                    Remember your password?{" "}
                    <Text style={styles.backToLoginLink}>Back to Login</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* ✅ Bottom Space - Scrolling ke liye space */}
            <View style={styles.bottomSpace} />
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ STYLES - Updated for full page scrolling
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
  },
  bgImage: {
    width: "100%",
    height: Math.max(height, 100), // Sufficient height for scrolling
  },
  topSpace: {
    height: responsiveScale(200), // Adjust as needed
  },
  bottomSpace: {
    height: responsiveScale(20), // Adjust as needed
  },

  // ✅ Transparent card
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: responsiveScale(26),
    elevation: 0,
    shadowColor: "transparent",
    width: '90%',
    alignSelf: 'center',
    top: responsiveScale(250),
  },

  title: {
    fontSize: responsiveScale(26),
    fontWeight: "800",
    textAlign: "center",
    color: "#22C55E",
    marginBottom: responsiveScale(25),
  },

  label: {
    fontSize: responsiveScale(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: responsiveScale(8),
  },

  input: {
    height: responsiveScale(48),
    borderRadius: responsiveScale(10),
    backgroundColor: "#fff",
    borderColor: "#d8d8d8",
    borderWidth: 1,
    paddingHorizontal: responsiveScale(12),
    fontSize: responsiveScale(16),
    marginBottom: responsiveScale(20),
  },

  button: {
    backgroundColor: "#22C55E",
    borderRadius: responsiveScale(10),
    paddingVertical: responsiveScale(14),
    alignItems: "center",
    marginTop: responsiveScale(8),
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontSize: responsiveScale(17),
    color: "#fff",
    fontWeight: "700",
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveScale(20),
  },

  otpBox: {
    width: responsiveScale(55),
    height: responsiveScale(55),
    borderRadius: responsiveScale(12),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: responsiveScale(20),
    color: "#000",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: responsiveScale(10),
    paddingHorizontal: responsiveScale(10),
    marginBottom: responsiveScale(20),
    backgroundColor: "#fff",
    height: responsiveScale(50),
  },

  passwordInput: {
    flex: 1,
    fontSize: responsiveScale(16),
    color: "#333",
  },

  backToLogin: {
    textAlign: "center",
    marginTop: responsiveScale(18),
    fontSize: responsiveScale(15),
    color: "#666",
  },

  backToLoginLink: {
    color: "#22C55E",
    fontWeight: "700",
  },

  loaderContainer: {
    alignItems: 'center',
    marginBottom: responsiveScale(10),
  },
});