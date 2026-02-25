import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../api';
import RazorpayCheckout from 'react-native-razorpay';
import paymentService from '../../services/paymentService';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const SUPPORT_PHONE = '+91 97379 65551';

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
      // Razorpay fires code=0 or description containing "cancel"/"dismiss" when user goes back
      const desc = (error?.description || '').toLowerCase();
      const isCancelled =
        error?.code === 0 ||
        error?.code === 'PAYMENT_CANCELLED' ||
        desc.includes('cancel') ||
        desc.includes('dismiss') ||
        !error?.description; // no description → user closed the sheet
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Advance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.amountIconWrap}>
            <Ionicons name="shield-checkmark" size={28} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.amountLabel}>Advance Payment</Text>
          <Text style={styles.amountValue}>₹{paymentAmount.toLocaleString()}</Text>
          {booking?.bookingNumber && (
            <View style={styles.bookingRefPill}>
              <Text style={styles.bookingRef}>#{booking.bookingNumber}</Text>
            </View>
          )}
        </View>

        {/* Razorpay Primary Card */}
        <View style={styles.primaryCard}>
          <View style={styles.primaryCardHeader}>
            <View style={styles.primaryCardIconBg}>
              <Ionicons name="card" size={22} color={GREEN} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.primaryCardTitle}>Pay Online</Text>
              <Text style={styles.primaryCardSub}>Cards · UPI · NetBanking · Wallets</Text>
            </View>
            <View style={styles.fastBadge}>
              <Ionicons name="flash" size={11} color="#fff" />
              <Text style={styles.fastBadgeText}>INSTANT</Text>
            </View>
          </View>

          <View style={styles.primaryCardFeatures}>
            {['100% Secure & Encrypted', 'Instant confirmation', 'All payment methods accepted'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payNowBtnText}>Pay ₹{paymentAmount.toLocaleString()} Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Manual Payment Toggle */}
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManual(v => !v)}
          activeOpacity={0.7}
        >
          <Ionicons name="alert-circle-outline" size={18} color="#888" />
          <Text style={styles.manualToggleText}>
            Online payment not working? Use manual payment
          </Text>
          <Ionicons
            name={showManual ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#888"
          />
        </TouchableOpacity>

        {/* Manual Payment Section — collapsed by default */}
        {showManual && (
          <View style={styles.manualSection}>
            <Text style={styles.manualSectionTitle}>Manual Payment</Text>
            <Text style={styles.manualSectionNote}>
              Transfer the advance amount and submit your transaction ID below.
            </Text>

            {/* Method Tabs */}
            <View style={styles.methodTabs}>
              {paymentDetails?.upiId && (
                <TouchableOpacity
                  style={[styles.methodTab, manualMethod === 'upi' && styles.methodTabActive]}
                  onPress={() => setManualMethod('upi')}
                >
                  <Ionicons name="phone-portrait-outline" size={16} color={manualMethod === 'upi' ? GREEN : '#666'} />
                  <Text style={[styles.methodTabText, manualMethod === 'upi' && styles.methodTabTextActive]}>
                    UPI
                  </Text>
                </TouchableOpacity>
              )}
              {paymentDetails && (
                <TouchableOpacity
                  style={[styles.methodTab, manualMethod === 'bank' && styles.methodTabActive]}
                  onPress={() => setManualMethod('bank')}
                >
                  <Ionicons name="business-outline" size={16} color={manualMethod === 'bank' ? GREEN : '#666'} />
                  <Text style={[styles.methodTabText, manualMethod === 'bank' && styles.methodTabTextActive]}>
                    Bank Transfer
                  </Text>
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
                      <Ionicons name="copy-outline" size={18} color={GREEN} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.upiPayBtn} onPress={openUPIApp}>
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.upiPayBtnText}>Open UPI App</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bank Details */}
            {manualMethod === 'bank' && paymentDetails && (
              <View style={styles.detailsCard}>
                {[
                  { label: 'Bank Name', value: paymentDetails.bankName },
                  { label: 'Account Name', value: paymentDetails.accountHolderName },
                  { label: 'Account Number', value: paymentDetails.accountNumber, copy: true },
                  { label: 'IFSC Code', value: paymentDetails.ifscCode, copy: true },
                  paymentDetails.branchName && { label: 'Branch', value: paymentDetails.branchName },
                  paymentDetails.accountType && { label: 'Account Type', value: paymentDetails.accountType },
                ].filter(Boolean).map((row, i, arr) => (
                  <View key={i} style={[styles.detailRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <View style={styles.detailValueRow}>
                      <Text style={styles.detailValue}>{row.value}</Text>
                      {row.copy && (
                        <TouchableOpacity onPress={() => copyToClipboard(row.value, row.label)} style={styles.copyBtn}>
                          <Ionicons name="copy-outline" size={18} color={GREEN} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Transaction ID Input */}
            {paymentDetails && (
              <View style={styles.manualInputSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Transaction / Reference ID *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter UTR or transaction ID"
                    value={transactionId}
                    onChangeText={setTransactionId}
                    placeholderTextColor="#bbb"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payer Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name as per bank / UPI"
                    value={payerName}
                    onChangeText={setPayerName}
                    placeholderTextColor="#bbb"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleSubmitManualPayment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Payment Details</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Help */}
        <View style={styles.helpSection}>
          <Ionicons name="headset-outline" size={18} color="#aaa" />
          <Text style={styles.helpText}>Need help? Call {SUPPORT_PHONE}</Text>
        </View>
      </ScrollView>

      {/* ── Custom Success Modal ── */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Animated circle checkmark */}
            <View style={styles.successCircle}>
              <View style={styles.successCircleInner}>
                <Ionicons name="checkmark" size={44} color="#fff" />
              </View>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your advance payment has been received and confirmed.
            </Text>

            <View style={styles.successAmountRow}>
              <Text style={styles.successAmountLabel}>Amount Paid</Text>
              <Text style={styles.successAmountValue}>₹{paymentAmount.toLocaleString()}</Text>
            </View>

            {booking?.bookingNumber && (
              <View style={[styles.successAmountRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                <Text style={styles.successAmountLabel}>Booking ID</Text>
                <Text style={styles.successAmountValue}>#{booking.bookingNumber}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.viewBookingBtn} onPress={handleViewBooking}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.viewBookingBtnText}>View Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

  // Amount Card
  amountCard: {
    backgroundColor: GREEN,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  amountIconWrap: { marginBottom: 8 },
  amountLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  amountValue: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  bookingRefPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 10,
  },
  bookingRef: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

  // Primary Razorpay Card
  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  primaryCardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  primaryCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  fastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  fastBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  primaryCardFeatures: { marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  featureText: { fontSize: 13, color: '#555' },

  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payNowBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnDisabled: { opacity: 0.65 },

  // Manual Toggle
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  manualToggleText: { flex: 1, fontSize: 13, color: '#777', fontWeight: '500' },

  // Manual Section
  manualSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  manualSectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  manualSectionNote: { fontSize: 12, color: '#999', marginBottom: 14, lineHeight: 18 },

  // Method Tabs
  methodTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    gap: 6,
  },
  methodTabActive: { borderColor: GREEN, backgroundColor: 'rgba(9,179,104,0.07)' },
  methodTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  methodTabTextActive: { color: GREEN },

  // Details Card
  detailsCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 14 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: { fontSize: 12, color: '#888' },
  detailValueRow: { flexDirection: 'row', alignItems: 'center' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  copyBtn: { marginLeft: 8, padding: 4 },

  // QR
  qrContainer: { alignItems: 'center', paddingVertical: 12 },
  qrTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GREEN,
    elevation: 2,
  },
  qrImage: { width: 180, height: 180 },
  qrHint: { fontSize: 11, color: '#aaa', marginTop: 10 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e8e8e8' },
  dividerText: { marginHorizontal: 10, fontSize: 10, color: '#bbb', fontWeight: '700' },

  upiPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  upiPayBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Manual Input Section
  manualInputSection: { marginTop: 4 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Help
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  helpText: { fontSize: 12, color: '#aaa' },

  // ── Success Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(9,179,104,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCircleInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  successAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 0,
  },
  successAmountLabel: { fontSize: 13, color: '#888' },
  successAmountValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  viewBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    marginTop: 24,
    gap: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewBookingBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
