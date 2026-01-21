import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import messaging from '@react-native-firebase/messaging';
import { authService } from '../../services';

export default function OtpScreen({ route, navigation }) {
  const { name, email, phone, password } = route.params;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600);  // 10 minutes (matching new API)
  const inputs = useRef([]);

  // Format time to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Handle OTP verification - Updated for new API
  const handleOtpSubmit = async () => {
    const code = otp.join("");  // Concatenate OTP
    if (code.length !== 4) {
      return Alert.alert("Error", "Please enter a valid OTP.");
    }

    try {
      const response = await authService.verifyOtp(email, code);

      if (response.status === 'success') {
        console.log('response data:', response);

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

        navigation.replace("CustomerDashboard");
      } else {
        Alert.alert("Error", response.message || "OTP verification failed");
      }
    } catch (err) {
      console.log("OTP Verification Error:", err.message || "Unknown error");
      const errorMessage = err.response?.data?.message || err.message || "Something went wrong during OTP verification.";
      Alert.alert("Error", errorMessage);
    }
  };

  // Start countdown timer when OTP screen is loaded
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);  // Stop the timer when it reaches 0
          Alert.alert("OTP Expired", "Your OTP has expired. Please try registering again.");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000); // Update every second

    // Clean up interval when the component is unmounted or timer ends
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.phone}>{email}</Text>

      <Text style={styles.timer}>Expires at: {formatTime(timeLeft)}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => (inputs.current[index] = el)}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => {
              if (/^\d*$/.test(text)) {
                const updated = [...otp];
                updated[index] = text;
                setOtp(updated);
                if (text && index < 3) {
                  inputs.current[index + 1]?.focus();
                }
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleOtpSubmit}>
        <Text style={styles.verifyText}>Verify & Register</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F7F7", padding: 20, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  phone: { fontSize: 16, fontWeight: "700", color: "#2ECC71", textAlign: "center", marginBottom: 30 },
  timer: { fontSize: 16, fontWeight: "700", color: "#FF0000", textAlign: "center", marginBottom: 20 },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 40,
    marginTop: 10,
  },
  otpBox: {
    width: 50, height: 55, borderWidth: 1,
    borderColor: "#ccc", borderRadius: 10,
    fontSize: 22, textAlign: "center", fontWeight: "600", backgroundColor: "#fff"
  },
  verifyButton: {
    backgroundColor: "#06152B",
    marginTop: 40,
    height: 54,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});