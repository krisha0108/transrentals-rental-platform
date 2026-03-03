import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../../api';
import RazorpayCheckout from 'react-native-razorpay';
import paymentService from '../../services/paymentService';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';

const BG = '#F0FDF4';
const SUPPORT_PHONE = '+91 97379 65551';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  android: { elevation: 6 },
});

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, bookingType, amount } = route.params || {};

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Manual payment toggle & method
  const [showManual, setShowManual] = useState(false);
  const [manualMethod, setManualMethod] = useState('upi'); // 'upi' | 'bank'
  const [transactionId, setTransactionId] = useState('');
  const [payerName, setPayerName] = useState('');

  // Custom success modal
  const [successModal, setSuccessModal] = useState(false);

  // ── StatusBar ──
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(TEAL_DEEP);
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') StatusBar.setBackgroundColor('#ffffff');
      };
    }, [])
  );

  const getServiceSlug = () => {
    switch (bookingType) {
      case 'bike': return 'bike-rental';
      case 'car':
      case 'chauffeur': return 'car-rental';
      case 'self-drive': return 'self-drive';
      case 'bus': return 'bus-rental';
      case 'truck': return 'truck-rental';
      case 'equipment': return 'equipment-rental';
      case 'packers': return 'packers-movers';
      case 'luxury': return 'luxury-car';
      default: return '';
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
    if (bookingId) fetchBookingDetails();
    else setLoading(false);
  }, [bookingId]);

  const fetchPaymentDetails = async () => {
    try {
      const serviceSlug = getServiceSlug();
      const url = serviceSlug ? `/payment-details?service=${serviceSlug}` : '/payment-details';
      const response = await api.get(url);
      if (response.data?.success && response.data?.primaryAccount) {
        setPaymentDetails(response.data.primaryAccount);
      }
    } catch (err) {
      console.log('Error fetching payment details:', err);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      let endpoint;
      if (bookingType === 'bike') endpoint = `/bike-bookings/${bookingId}`;
      else if (bookingType === 'self-drive') endpoint = `/self-drive-bookings/${bookingId}`;
      else if (bookingType === 'luxury') endpoint = `/customer/luxury-bookings/${bookingId}`;
      else if (bookingType === 'truck') endpoint = `/truck-bookings/${bookingId}`;
      else if (bookingType === 'packers') endpoint = `/packers-bookings/${bookingId}`;
      else if (bookingType === 'equipment') endpoint = `/equipment-bookings/${bookingId}`;
      else if (bookingType === 'bus') endpoint = `/bus-bookings/${bookingId}`;
      else endpoint = `/customer-booking-detail/${bookingId}`;

      const response = await api.get(endpoint);
      if (response.data?.success || response.data?.booking) {
        setBooking(response.data.booking || response.data);
      }
    } catch (err) {
      console.log('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  const getUpiUrl = () => {
    if (!paymentDetails?.upiId) return '';
    const upiAmount = paymentAmount;
    const payeeName = encodeURIComponent(paymentDetails.accountHolderName || 'TransRentals');
    const txnNote = encodeURIComponent(`Booking ${bookingId}`);
    return `upi://pay?pa=${paymentDetails.upiId}&pn=${payeeName}&am=${upiAmount}&cu=INR&tn=${txnNote}`;
  };

  const getQrCodeUrl = () => {
    const upiUrl = getUpiUrl();
    if (!upiUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  const openUPIApp = () => {
    const upiUrl = getUpiUrl();
    if (!upiUrl) { Alert.alert('Error', 'UPI payment is not configured'); return; }
    Linking.canOpenURL(upiUrl).then((supported) => {
      if (supported) Linking.openURL(upiUrl);
      else Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm');
    });
  };

  const getDetailScreen = () => {
    if (bookingType === 'bike') return 'BikeBookingDetail';
    if (bookingType === 'self-drive') return 'SelfDriveBookingDetail';
    if (bookingType === 'luxury') return 'LuxuryBookingDetail';
    if (bookingType === 'truck') return 'TruckBookingDetail';
    if (bookingType === 'packers') return 'PackersBookingDetail';
    if (bookingType === 'equipment') return 'EquipmentBookingDetail';
    if (bookingType === 'bus') return 'BusBookingDetail';
    return 'BookingDetail';
  };

  const handleRazorpayPayment = async () => {
    if (!bookingId) { Alert.alert('Error', 'Booking ID is missing. Please try again.'); return; }
    setSubmitting(true);
    try {
      const orderData = await paymentService.createOrder(bookingId, bookingType || 'bike');
      if (!orderData.success || !orderData.order) {
        Alert.alert('Error', orderData.error || 'Failed to create payment order. Please try again.');
        return;
      }

      const options = {
        description: orderData.razorpayConfig?.description || 'Advance Payment',
        currency: orderData.order.currency || 'INR',
        key: orderData.razorpayConfig?.key || '',
        amount: String(orderData.order.amount),
        name: orderData.razorpayConfig?.name || 'TransRentals',
        order_id: orderData.order.id,
        prefill: orderData.razorpayConfig?.prefill || {},
      };

      const data = await RazorpayCheckout.open(options);

      const verifyResult = await paymentService.verifyPayment(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
        bookingId,
        bookingType || 'bike'
      );

      if (verifyResult.success) {
        setSuccessModal(true);
      } else {
        Alert.alert('Verification Failed', 'Payment received but verification failed. Please contact support.');
      }
    } catch (error) {
      const desc = (error?.description || '').toLowerCase();
      const isCancelled =
        error?.code === 0 ||
        error?.code === 'PAYMENT_CANCELLED' ||
        desc.includes('cancel') ||
        desc.includes('dismiss') ||
        !error?.description;
      if (!isCancelled) {
        Alert.alert('Payment Failed', error?.description || error?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitManualPayment = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Required', 'Please enter the transaction/reference ID');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post('/customer/submit-payment', {
        bookingId,
        bookingType: bookingType || 'bike',
        paymentMethod: manualMethod,
        transactionId: transactionId.trim(),
        payerName: payerName.trim(),
        amount: paymentAmount,
      });
      if (response.data?.success) {
        Alert.alert(
          'Payment Submitted!',
          'Your payment details have been submitted. We will verify and confirm your booking shortly.',
          [{ text: 'OK', onPress: () => navigation.replace(getDetailScreen(), { bookingId, ...((bookingType === 'chauffeur' || bookingType === 'car') ? { bookingType: 'car' } : {}) }) }],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit payment');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewBooking = () => {
    setSuccessModal(false);
    navigation.replace(getDetailScreen(), {
      bookingId,
      ...((bookingType === 'chauffeur' || bookingType === 'car') ? { bookingType: 'car' } : {}),
    });
  };

  const paymentAmount = amount || booking?.advanceAmount || 0;
  const qrCodeUrl = getQrCodeUrl();

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.loadingHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={wp('5.5%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Advance</Text>
          <View style={{ width: wp('10%') }} />
        </View>

        {/* Amount Display in Header */}
        <View style={styles.amountSection}>
          <View style={styles.amountIconWrap}>
            <Ionicons name="shield-checkmark" size={wp('7%')} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.amountLabel}>Advance Payment</Text>
          <Text style={styles.amountValue}>₹{paymentAmount.toLocaleString()}</Text>
          {booking?.bookingNumber && (
            <View style={styles.bookingRefPill}>
              <Ionicons name="receipt-outline" size={wp('3%')} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bookingRef}>#{booking.bookingNumber}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp('5%') }}>

        {/* ── Razorpay Primary Card ── */}
        <View style={styles.primaryCard}>
          <View style={styles.primaryCardHeader}>
            <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.primaryCardIconBg}>
              <Ionicons name="card" size={wp('5.5%')} color={TEAL_MID} />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: wp('3%') }}>
              <Text style={styles.primaryCardTitle}>Pay Online</Text>
              <Text style={styles.primaryCardSub}>Cards · UPI · NetBanking · Wallets</Text>
            </View>
            <LinearGradient colors={[TEAL, '#059669']} style={styles.fastBadge}>
              <Ionicons name="flash" size={wp('2.8%')} color="#fff" />
              <Text style={styles.fastBadgeText}>INSTANT</Text>
            </LinearGradient>
          </View>

          <View style={styles.primaryCardFeatures}>
            {['100% Secure & Encrypted', 'Instant confirmation', 'All payment methods accepted'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureCheckCircle}>
                  <Ionicons name="checkmark" size={wp('2.5%')} color={TEAL} />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.payNowBtn, submitting && styles.btnDisabled]}
            onPress={handleRazorpayPayment}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <LinearGradient colors={[TEAL, '#059669']} style={styles.payNowBtnGradient}>
                <Ionicons name="lock-closed" size={wp('4.5%')} color="#fff" />
                <Text style={styles.payNowBtnText}>Pay ₹{paymentAmount.toLocaleString()} Now</Text>
                <Ionicons name="arrow-forward" size={wp('4.5%')} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Manual Payment Toggle ── */}
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManual(v => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.manualToggleIconWrap}>
            <Ionicons name="alert-circle-outline" size={wp('4%')} color={TEXT_MUTED} />
          </View>
          <Text style={styles.manualToggleText}>
            Online payment not working? Use manual payment
          </Text>
          <Ionicons
            name={showManual ? 'chevron-up' : 'chevron-down'}
            size={wp('4.5%')}
            color={TEXT_MUTED}
          />
        </TouchableOpacity>

        {/* ── Manual Payment Section ── */}
        {showManual && (
          <View style={styles.manualSection}>
            <View style={styles.manualSectionHeader}>
              <View style={styles.manualSectionIconWrap}>
                <Ionicons name="swap-horizontal" size={wp('4.5%')} color={TEAL_MID} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.manualSectionTitle}>Manual Payment</Text>
                <Text style={styles.manualSectionNote}>
                  Transfer the advance amount and submit your transaction ID below.
                </Text>
              </View>
            </View>

            {/* Method Tabs */}
            <View style={styles.methodTabs}>
              {paymentDetails?.upiId && (
                <TouchableOpacity
                  style={[styles.methodTab, manualMethod === 'upi' && styles.methodTabActive]}
                  onPress={() => setManualMethod('upi')}
                >
                  <Ionicons name="phone-portrait-outline" size={wp('4%')} color={manualMethod === 'upi' ? TEAL_MID : TEXT_MUTED} />
                  <Text style={[styles.methodTabText, manualMethod === 'upi' && styles.methodTabTextActive]}>
                    UPI
                  </Text>
                  {manualMethod === 'upi' && (
                    <View style={styles.methodTabCheck}>
                      <Ionicons name="checkmark" size={wp('2.5%')} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              {paymentDetails && (
                <TouchableOpacity
                  style={[styles.methodTab, manualMethod === 'bank' && styles.methodTabActive]}
                  onPress={() => setManualMethod('bank')}
                >
                  <Ionicons name="business-outline" size={wp('4%')} color={manualMethod === 'bank' ? TEAL_MID : TEXT_MUTED} />
                  <Text style={[styles.methodTabText, manualMethod === 'bank' && styles.methodTabTextActive]}>
                    Bank Transfer
                  </Text>
                  {manualMethod === 'bank' && (
                    <View style={styles.methodTabCheck}>
                      <Ionicons name="checkmark" size={wp('2.5%')} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* UPI Details */}
            {manualMethod === 'upi' && paymentDetails?.upiId && (
              <View style={styles.detailsCard}>
                {qrCodeUrl ? (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrTitle}>Scan to Pay</Text>
                    <View style={styles.qrWrapper}>
                      <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.qrHint}>Use any UPI app to scan</Text>
                  </View>
                ) : null}

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR PAY USING UPI ID</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UPI ID</Text>
                  <View style={styles.detailValueRow}>
                    <Text style={styles.detailValue}>{paymentDetails.upiId}</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(paymentDetails.upiId, 'UPI ID')} style={styles.copyBtn}>
                      <View style={styles.copyBtnInner}>
                        <Ionicons name="copy-outline" size={wp('3.8%')} color={TEAL} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.upiPayBtn} onPress={openUPIApp} activeOpacity={0.8}>
                  <LinearGradient colors={[TEAL, '#059669']} style={styles.upiPayBtnGradient}>
                    <Ionicons name="wallet-outline" size={wp('5%')} color="#fff" />
                    <Text style={styles.upiPayBtnText}>Open UPI App</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Bank Details */}
            {manualMethod === 'bank' && paymentDetails && (
              <View style={styles.detailsCard}>
                {[
                  { label: 'Bank Name', value: paymentDetails.bankName, icon: 'business' },
                  { label: 'Account Name', value: paymentDetails.accountHolderName, icon: 'person' },
                  { label: 'Account Number', value: paymentDetails.accountNumber, copy: true, icon: 'card' },
                  { label: 'IFSC Code', value: paymentDetails.ifscCode, copy: true, icon: 'code-working' },
                  paymentDetails.branchName && { label: 'Branch', value: paymentDetails.branchName, icon: 'location' },
                  paymentDetails.accountType && { label: 'Account Type', value: paymentDetails.accountType, icon: 'wallet' },
                ].filter(Boolean).map((row, i, arr) => (
                  <View key={i} style={[styles.bankDetailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.bankDetailIconWrap}>
                      <Ionicons name={row.icon} size={wp('3.5%')} color={TEAL} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                    {row.copy && (
                      <TouchableOpacity onPress={() => copyToClipboard(row.value, row.label)} style={styles.copyBtn}>
                        <View style={styles.copyBtnInner}>
                          <Ionicons name="copy-outline" size={wp('3.8%')} color={TEAL} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Transaction ID Input */}
            {paymentDetails && (
              <View style={styles.manualInputSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Transaction / Reference ID *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="document-text-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter UTR or transaction ID"
                      value={transactionId}
                      onChangeText={setTransactionId}
                      placeholderTextColor={TEXT_MUTED}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payer Name (Optional)</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={wp('4%')} color={TEXT_MUTED} style={{ marginRight: wp('2%') }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Name as per bank / UPI"
                      value={payerName}
                      onChangeText={setPayerName}
                      placeholderTextColor={TEXT_MUTED}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleSubmitManualPayment}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <LinearGradient colors={[TEAL_MID, TEAL_DEEP]} style={styles.submitBtnGradient}>
                      <Ionicons name="checkmark-circle" size={wp('5%')} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Payment Details</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Help ── */}
        <View style={styles.helpSection}>
          <View style={styles.helpIconWrap}>
            <Ionicons name="headset-outline" size={wp('4%')} color={TEAL} />
          </View>
          <Text style={styles.helpText}>Need help? Call {SUPPORT_PHONE}</Text>
        </View>
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successCircle}>
              <LinearGradient colors={[TEAL, '#059669']} style={styles.successCircleInner}>
                <Ionicons name="checkmark" size={wp('11%')} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your advance payment has been received and confirmed.
            </Text>

            <View style={styles.successInfoCard}>
              <View style={styles.successAmountRow}>
                <Text style={styles.successAmountLabel}>Amount Paid</Text>
                <Text style={styles.successAmountValue}>₹{paymentAmount.toLocaleString()}</Text>
              </View>

              {booking?.bookingNumber && (
                <View style={[styles.successAmountRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.successAmountLabel}>Booking ID</Text>
                  <Text style={styles.successAmountValue}>#{booking.bookingNumber}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.viewBookingBtn} onPress={handleViewBooking} activeOpacity={0.8}>
              <LinearGradient colors={[TEAL, '#059669']} style={styles.viewBookingBtnGradient}>
                <Ionicons name="document-text-outline" size={wp('5%')} color="#fff" />
                <Text style={styles.viewBookingBtnText}>View Booking</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Decorative Circles ──
  decorCircle1: {
    position: 'absolute',
    width: wp('35%'),
    height: wp('35%'),
    borderRadius: wp('17.5%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -wp('10%'),
    right: -wp('8%'),
  },
  decorCircle2: {
    position: 'absolute',
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -wp('5%'),
    left: -wp('5%'),
  },

  // ── Header ──
  header: {
    paddingTop: hp('1%'),
    paddingBottom: hp('3%'),
    paddingHorizontal: wp('5%'),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Amount Section (in header) ──
  amountSection: {
    alignItems: 'center',
    paddingVertical: hp('1%'),
  },
  amountIconWrap: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: wp('3.2%'),
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  amountValue: {
    color: '#fff',
    fontSize: wp('10%'),
    fontWeight: '800',
    letterSpacing: -1,
  },
  bookingRefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.5%'),
    marginTop: hp('1%'),
    gap: wp('1.5%'),
  },
  bookingRef: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  // ── Loading ──
  loadingHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingText: {
    marginTop: hp('2%'),
    color: 'rgba(255,255,255,0.8)',
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
  },

  // ── Primary Razorpay Card ──
  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: wp('4.5%'),
    padding: wp('5%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1.5,
    borderColor: TEAL_LIGHT,
    ...SHADOW_MD,
  },
  primaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  primaryCardIconBg: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCardTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  primaryCardSub: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  fastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    gap: wp('1%'),
  },
  fastBadgeText: {
    color: '#fff',
    fontSize: wp('2.5%'),
    fontWeight: '800',
  },

  primaryCardFeatures: {
    marginBottom: hp('2%'),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
    gap: wp('2.5%'),
  },
  featureCheckCircle: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  payNowBtn: {
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  payNowBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    gap: wp('2%'),
  },
  payNowBtnText: {
    color: '#fff',
    fontSize: wp('4.2%'),
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.6 },

  // ── Manual Toggle ──
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('1.5%'),
    gap: wp('2.5%'),
    ...SHADOW_SM,
  },
  manualToggleIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualToggleText: {
    flex: 1,
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },

  // ── Manual Section ──
  manualSection: {
    backgroundColor: '#fff',
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    marginBottom: hp('1.5%'),
    ...SHADOW_SM,
  },
  manualSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('2%'),
    gap: wp('3%'),
  },
  manualSectionIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSectionTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('0.3%'),
  },
  manualSectionNote: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    lineHeight: wp('4.5%'),
  },

  // ── Method Tabs ──
  methodTabs: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginBottom: hp('2%'),
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.3%'),
    borderRadius: wp('3%'),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: wp('1.5%'),
  },
  methodTabActive: {
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
  },
  methodTabText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  methodTabTextActive: { color: TEAL_MID },
  methodTabCheck: {
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Details Card ──
  detailsCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: wp('3.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: wp('3.3%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  copyBtn: { marginLeft: wp('2%'), padding: wp('1%') },
  copyBtnInner: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Bank Detail Rows ──
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.3%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: wp('3%'),
  },
  bankDetailIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── QR ──
  qrContainer: {
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
  },
  qrTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: wp('3%'),
    borderRadius: wp('4%'),
    borderWidth: 2,
    borderColor: TEAL_LIGHT,
    ...SHADOW_SM,
  },
  qrImage: {
    width: wp('44%'),
    height: wp('44%'),
  },
  qrHint: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('1.2%'),
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1.5%'),
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: {
    marginHorizontal: wp('3%'),
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── UPI Pay Button ──
  upiPayBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    marginTop: hp('1.2%'),
  },
  upiPayBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    gap: wp('2%'),
  },
  upiPayBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // ── Manual Input Section ──
  manualInputSection: { marginTop: hp('0.5%') },
  inputGroup: { marginBottom: hp('1.5%') },
  inputLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: hp('0.8%'),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('3.3%'),
    color: TEXT_PRIMARY,
  },

  submitBtn: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    marginTop: hp('0.5%'),
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.8%'),
    gap: wp('2%'),
  },
  submitBtnText: {
    color: '#fff',
    fontSize: wp('3.5%'),
    fontWeight: '700',
  },

  // ── Help ──
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('2%'),
    gap: wp('2%'),
  },
  helpIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  // ── Success Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: wp('6%'),
    padding: wp('7%'),
    width: '100%',
    alignItems: 'center',
    ...SHADOW_MD,
  },
  successCircle: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  successCircleInner: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_SM,
  },
  successTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: hp('1%'),
  },
  successSubtitle: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('2.5%'),
    paddingHorizontal: wp('3%'),
  },
  successInfoCard: {
    width: '100%',
    backgroundColor: '#F8FAF9',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('2.5%'),
  },
  successAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  successAmountLabel: {
    fontSize: wp('3.2%'),
    color: TEXT_MUTED,
  },
  successAmountValue: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  viewBookingBtn: {
    width: '100%',
    borderRadius: wp('3.5%'),
    overflow: 'hidden',
  },
  viewBookingBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    gap: wp('2%'),
  },
  viewBookingBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
  },
});
