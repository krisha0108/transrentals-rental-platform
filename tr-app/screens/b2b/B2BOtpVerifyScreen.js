import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions, Platform,} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { b2bService } from '../services';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

export default function B2BOtpVerifyScreen({ navigation, route }) {
  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const { tripCode, booking } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 4) {
      return Alert.alert('Error', 'Please enter the complete 4-digit OTP.');
    }
    setLoading(true);
    try {
      const res = await b2bService.verifyTripOtp(tripCode, otpStr);
      if (res.success || res.trip) {
        Alert.alert('Trip Started!', 'OTP verified successfully. Your trip has started.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Invalid OTP');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Icon name="key" size={scale(40)} color="#22C55E" />
          </View>

          <Text style={styles.title}>Enter Trip OTP</Text>
          <Text style={styles.subtitle}>
            The driver has arrived. Enter the 4-digit OTP shared by the driver to start your trip.
          </Text>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <Text style={styles.tripCode}>Trip: {tripCode}</Text>
            {booking?.bookingNumber && (
              <Text style={styles.bookingNum}>Booking: {booking.bookingNumber}</Text>
            )}
          </View>

          {/* OTP Input */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
                value={digit}
                onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, loading && { backgroundColor: '#A9A9A9' }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.verifyBtnText}>Verifying...</Text>
                <ActivityIndicator size="small" color="#fff" style={{ marginLeft: scale(8) }} />
              </View>
            ) : (
              <>
                <Icon name="check-circle" size={scale(20)} color="#fff" />
                <Text style={styles.verifyBtnText}>Verify & Start Trip</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>OTP expires in 10 minutes. Ask the driver to resend if expired.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    paddingTop: Platform.OS === 'android' ? scale(10) : scale(14),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: scale(30), paddingTop: scale(40) },
  iconCircle: {
    width: scale(80), height: scale(80), borderRadius: scale(40),
    backgroundColor: '#F0FFF4', alignItems: 'center', justifyContent: 'center', marginBottom: scale(20),
  },
  title: { fontSize: scale(22), fontWeight: '800', color: '#1A1A1A', marginBottom: scale(8) },
  subtitle: { fontSize: scale(14), color: '#666', textAlign: 'center', lineHeight: scale(22), marginBottom: scale(20) },
  tripInfo: { alignItems: 'center', marginBottom: scale(24) },
  tripCode: { fontSize: scale(14), fontWeight: '600', color: '#333' },
  bookingNum: { fontSize: scale(12), color: '#999', marginTop: scale(4) },
  otpRow: { flexDirection: 'row', gap: scale(14), marginBottom: scale(30) },
  otpInput: {
    width: scale(56), height: scale(60), borderRadius: scale(14),
    backgroundColor: '#fff', fontSize: scale(24), fontWeight: '800', color: '#333',
    borderWidth: 2, borderColor: '#E9ECEF', elevation: 2,
  },
  otpInputFilled: { borderColor: '#22C55E', backgroundColor: '#F0FFF4' },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', width: '100%', height: scale(54),
    borderRadius: scale(14), gap: scale(8),
  },
  verifyBtnText: { fontSize: scale(16), fontWeight: '700', color: '#fff' },
  note: { fontSize: scale(11), color: '#999', textAlign: 'center', marginTop: scale(16), lineHeight: scale(18) },
});
