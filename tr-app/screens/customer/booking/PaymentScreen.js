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
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import api, { BASE_URL } from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const SUPPORT_PHONE = '+91 88003 02030';

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, bookingType, amount } = route.params || {};

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(true);

  // Get service slug based on booking type
  const getServiceSlug = () => {
    switch (bookingType) {
      case 'bike': return 'bike-rental';
      case 'car': return 'car-rental';
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
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
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
      console.error('Error fetching payment details:', err);
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      let endpoint;
      if (bookingType === 'bike') {
        endpoint = `/bike-bookings/${bookingId}`;
      } else if (bookingType === 'self-drive') {
        endpoint = `/self-drive-bookings/${bookingId}`;
      } else if (bookingType === 'luxury') {
        endpoint = `/customer/luxury-bookings/${bookingId}`;
      } else if (bookingType === 'truck') {
        endpoint = `/truck-bookings/${bookingId}`;
      } else if (bookingType === 'packers') {
        endpoint = `/packers-bookings/${bookingId}`;
      } else if (bookingType === 'equipment') {
        endpoint = `/equipment-bookings/${bookingId}`;
      } else if (bookingType === 'bus') {
        endpoint = `/bus-bookings/${bookingId}`;
      } else {
        endpoint = `/customer-booking-detail/${bookingId}`;
      }

      const response = await api.get(endpoint);
      if (response.data?.success || response.data?.booking) {
        setBooking(response.data.booking || response.data);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  // Generate UPI URL for payment
  const getUpiUrl = () => {
    if (!paymentDetails?.upiId) return '';
    const upiAmount = amount || booking?.advanceAmount || 0;
    const payeeName = encodeURIComponent(paymentDetails.accountHolderName || 'TransRentals');
    const txnNote = encodeURIComponent(`Booking ${bookingId}`);
    return `upi://pay?pa=${paymentDetails.upiId}&pn=${payeeName}&am=${upiAmount}&cu=INR&tn=${txnNote}`;
  };

  // Generate QR code URL using a free QR code API
  const getQrCodeUrl = () => {
    const upiUrl = getUpiUrl();
    if (!upiUrl) return '';
    // Using QR Server API to generate QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  const openUPIApp = () => {
    const upiUrl = getUpiUrl();
    if (!upiUrl) {
      Alert.alert('Error', 'UPI payment is not configured');
      return;
    }

    Linking.canOpenURL(upiUrl).then((supported) => {
      if (supported) {
        Linking.openURL(upiUrl);
      } else {
        Alert.alert('UPI App Not Found', 'Please install a UPI app like Google Pay, PhonePe, or Paytm');
      }
    });
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      Alert.alert('Required', 'Please enter the transaction/reference ID');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/customer/submit-payment', {
        bookingId,
        bookingType: bookingType || 'bike',
        paymentMethod: selectedMethod,
        transactionId: transactionId.trim(),
        payerName: payerName.trim(),
        amount: amount || booking?.advanceAmount,
      });

      if (response.data?.success) {
        // Determine the correct detail screen based on booking type
        let detailScreen = 'BookingDetail';
        if (bookingType === 'bike') {
          detailScreen = 'BikeBookingDetail';
        } else if (bookingType === 'self-drive') {
          detailScreen = 'SelfDriveBookingDetail';
        } else if (bookingType === 'luxury') {
          detailScreen = 'LuxuryBookingDetail';
        } else if (bookingType === 'truck') {
          detailScreen = 'TruckBookingDetail';
        } else if (bookingType === 'packers') {
          detailScreen = 'PackersBookingDetail';
        } else if (bookingType === 'equipment') {
          detailScreen = 'EquipmentBookingDetail';
        } else if (bookingType === 'bus') {
          detailScreen = 'BusBookingDetail';
        }

        Alert.alert(
          'Payment Submitted!',
          'Your payment details have been submitted. We will verify and confirm your booking shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Use replace to go back to booking detail (replaces current payment screen)
                navigation.replace(detailScreen, { bookingId });
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit payment');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to submit payment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentAmount = amount || booking?.advanceAmount || 0;

  if (loading || loadingPaymentDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paymentDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Advance</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorTitle}>Payment Not Available</Text>
          <Text style={styles.errorText}>Payment details are not configured. Please contact support.</Text>
          <TouchableOpacity
            style={styles.supportBtnLarge}
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.supportBtnLargeText}>Call Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const qrCodeUrl = getQrCodeUrl();

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>₹{paymentAmount.toLocaleString()}</Text>
          {booking?.bookingNumber && (
            <Text style={styles.bookingRef}>Booking: #{booking.bookingNumber}</Text>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {paymentDetails.upiId && (
            <TouchableOpacity
              style={[styles.methodCard, selectedMethod === 'upi' && styles.methodCardActive]}
              onPress={() => setSelectedMethod('upi')}
            >
              <View style={styles.methodRadio}>
                {selectedMethod === 'upi' && <View style={styles.methodRadioInner} />}
              </View>
              <Ionicons name="phone-portrait-outline" size={24} color={selectedMethod === 'upi' ? GREEN : '#666'} />
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, selectedMethod === 'upi' && styles.methodNameActive]}>
                  UPI Payment
                </Text>
                <Text style={styles.methodDesc}>GPay, PhonePe, Paytm, etc.</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'bank' && styles.methodCardActive]}
            onPress={() => setSelectedMethod('bank')}
          >
            <View style={styles.methodRadio}>
              {selectedMethod === 'bank' && <View style={styles.methodRadioInner} />}
            </View>
            <Ionicons name="business-outline" size={24} color={selectedMethod === 'bank' ? GREEN : '#666'} />
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, selectedMethod === 'bank' && styles.methodNameActive]}>
                Bank Transfer
              </Text>
              <Text style={styles.methodDesc}>NEFT, IMPS, RTGS</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedMethod === 'upi' ? 'UPI Payment' : 'Bank Account Details'}
          </Text>

          {selectedMethod === 'upi' ? (
            <View style={styles.detailsCard}>
              {/* QR Code */}
              {qrCodeUrl && (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrTitle}>Scan QR Code to Pay</Text>
                  <View style={styles.qrWrapper}>
                    <Image
                      source={{ uri: qrCodeUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.qrHint}>Use any UPI app to scan</Text>
                </View>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>UPI ID</Text>
                <View style={styles.detailValueRow}>
                  <Text style={styles.detailValue}>{paymentDetails.upiId}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(paymentDetails.upiId, 'UPI ID')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={18} color={GREEN} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.upiPayBtn} onPress={openUPIApp}>
                <Ionicons name="wallet-outline" size={20} color="#fff" />
                <Text style={styles.upiPayBtnText}>Pay via UPI App</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{paymentDetails.bankName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Name</Text>
                <Text style={styles.detailValue}>{paymentDetails.accountHolderName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <View style={styles.detailValueRow}>
                  <Text style={styles.detailValue}>{paymentDetails.accountNumber}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(paymentDetails.accountNumber, 'Account Number')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={18} color={GREEN} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IFSC Code</Text>
                <View style={styles.detailValueRow}>
                  <Text style={styles.detailValue}>{paymentDetails.ifscCode}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(paymentDetails.ifscCode, 'IFSC Code')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={18} color={GREEN} />
                  </TouchableOpacity>
                </View>
              </View>
              {paymentDetails.branchName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Branch</Text>
                  <Text style={styles.detailValue}>{paymentDetails.branchName}</Text>
                </View>
              )}
              {paymentDetails.accountType && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Account Type</Text>
                  <Text style={styles.detailValue}>{paymentDetails.accountType}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payment Confirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Payment</Text>
          <Text style={styles.confirmNote}>
            After making the payment, enter the transaction details below:
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Transaction/Reference ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter transaction ID or UTR number"
              value={transactionId}
              onChangeText={setTransactionId}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payer Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Name as per bank account"
              value={payerName}
              onChangeText={setPayerName}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmitPayment}
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

        {/* Help */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.helpText}>
            Need help? Call us at {SUPPORT_PHONE}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  supportBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  supportBtnLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Amount Card
  amountCard: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  bookingRef: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 8,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  // Payment Methods
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: GREEN,
    backgroundColor: 'rgba(9,179,104,0.05)',
  },
  methodRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  methodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  methodNameActive: {
    color: GREEN,
  },
  methodDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  copyBtn: {
    marginLeft: 10,
    padding: 4,
  },

  // QR Code
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },

  upiPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  upiPayBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Inputs
  confirmNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Help
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
});
