import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert
} from "react-native";
import { OtplessHeadlessModule } from "otpless-headless-rn";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from '@react-native-firebase/messaging';

export default function LoginOtpScreen({ route, navigation }) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef([]);
  const [userTriedToVerify, setUserTriedToVerify] = useState(false);
  const headlessModule = useRef(new OtplessHeadlessModule()).current;
  const [sdkReady, setSdkReady] = useState(false);
  useEffect(() => {
    console.log(":rocket: Initializing OTPless SDK...");
    headlessModule.initialize("CNANMO473ON4Z9PA20JH");
    headlessModule.setResponseCallback(onOtpResult);
    return () => {
      console.log(":broom: Cleaning up OTPless SDK listeners...");
      headlessModule.clearListener();
      headlessModule.cleanup();
    };
  }, []);
  useEffect(() => {
    if (sdkReady) {
      console.log(":white_check_mark: SDK_READY received. Sending OTP now...");
      headlessModule.start({
        phone,
        countryCode: "+91",
        authType: "OTP",
        deliveryChannel: "SMS",
      });
    }
  }, [sdkReady]);
  const onOtpResult = async (result) => {
    const { responseType, response, statusCode } = result;
    console.log(":large_yellow_circle: OTPless responseType:", responseType);
    console.log(":large_green_circle: Full OTPless result:", result);
    if (responseType === "SDK_READY") {
      setSdkReady(true);
    }
    if ((responseType === "VERIFY" || responseType === "ONETAP") && statusCode === 200) {
      const token = response?.token || response?.data?.token;
      console.log(":white_check_mark: Token received from OTPless:", token);
      if (!token) {
        return Alert.alert("Error", "Token missing from OTPless response.");
      }
      try {
        console.log(":satellite_antenna: Verifying token with Laravel...");
        const res = await axios.post("https://app.transrentals.in/api/login-via-otpless", {
          phone,
          token
        });
        console.log(":white_check_mark: Laravel Response:", res.data);
       if (res.data.customer && res.data.token) {
  // Get FCM token
  const fcmToken = await messaging().getToken();
  console.log('Got FCM token:', fcmToken);

  // Send FCM token to backend to update existing customer record
  try {
    await axios.post('https://app.transrentals.in/api/save-fcm-token', {
      phone,
      fcm_token: fcmToken,
    });
    console.log('FCM token sent to backend successfully');
  } catch (err) {
    console.log('Error sending FCM token to backend:', err.message);
  }

  await AsyncStorage.clear();
  await AsyncStorage.setItem("customer", JSON.stringify(res.data.customer));
  await AsyncStorage.setItem("token", res.data.token);
  navigation.replace("CustomerDashboard");
}else {
          Alert.alert("Login Failed", res.data.message || "Invalid login.");
        }
      } catch (err) {
        console.error(":x: Laravel login error:", err);
        Alert.alert("Error", "Server error during login.");
      }
    }
  // :white_check_mark: Always check this AFTER VERIFY comes back
  if ((responseType === "VERIFY" || responseType === "FAILED") && statusCode !== 200) {
    console.log(":x: OTP verification failed. Invalid or expired OTP.");
    Alert.alert("OTP verification failed", "The OTP you entered is incorrect or expired.");
  }
  };
  const handleOtpSubmit = () => {
    const code = otp.join("");
    if (code.length !== 4) {
      return Alert.alert("Incomplete OTP", "Please enter all 4 digits.");
    }
    if (!sdkReady) {
      return Alert.alert("OTP session not ready", "Please wait and try again.");
    }
    console.log(":outbox_tray: Verifying entered OTP:", code);
    setUserTriedToVerify(true);
    headlessModule.start({ phone, countryCode: "+91", otp: code });
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>OTP</Text>
      <Text style={styles.subtitle}>Enter the 4-digit OTP sent to</Text>
      
      <Text style={styles.phone}>+91 {phone}</Text>
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
              // const updated = [...otp];
              // updated[index] = text;
              // setOtp(updated);
              // if (text && index < 3) inputs.current[index + 1]?.focus();
              // if (!text && index > 0) inputs.current[index - 1]?.focus();
              if (/^\d*$/.test(text)) {
        const updated = [...otp];
        updated[index] = text;
        setOtp(updated);
        // Move focus forward if a digit is entered
        if (text && index < 3) {
          inputs.current[index + 1]?.focus();
        }
      }
    }}
    onKeyPress={({ nativeEvent }) => {
      if (
        nativeEvent.key === 'Backspace' &&
        otp[index] === '' &&
        index > 0
      ) {
        inputs.current[index - 1]?.focus();
      }
            
            }}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.verifyButton} onPress={handleOtpSubmit}>
        <Text style={styles.verifyText}>Verify & Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F7F7", padding: 20, justifyContent: "center", alignItems: 'left', width:'100%', height: '100%',},
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 10, fontFamily: 'Manarope'},
  subtitle: { fontSize: 16, fontWeight: "500", textAlign: "center" },
  phone: { fontSize: 16, fontWeight: "700", color: "#2ECC71", textAlign: "center", marginBottom: 30 },
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
    backgroundColor: "#09B368",
    marginTop: 40,
    height: 54,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});

