import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
  Image,
  PermissionsAndroid,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { BASE_URL } from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

export default function InvoiceScreen({ navigation, route }) {
  const { booking, bookingType } = route.params;
  const webViewRef = useRef(null);
  const viewShotRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Get invoice URL based on booking type
  const getInvoiceUrl = () => {
    const bookingId = booking.id || booking.bookingNumber;

    switch (bookingType) {
      case 'bus':
        return `${BASE_URL}/api/bus-bookings/${bookingId}/invoice`;
      case 'truck':
        return `${BASE_URL}/api/truck-bookings/${bookingId}/invoice`;
      case 'equipment':
        return `${BASE_URL}/api/equipment-bookings/${bookingId}/invoice`;
      case 'luxury':
        return `${BASE_URL}/api/luxury-bookings/${bookingId}/invoice`;
      case 'packers':
        return `${BASE_URL}/api/packers-bookings/${bookingId}/invoice`;
      case 'chauffeur':
      case 'car':
        return `${BASE_URL}/api/car-rental/bookings/${bookingId}/invoice`;
      case 'self-drive':
      case 'bike':
      default:
        // Fallback — use manual receipt
        return null;
    }
  };

  const invoiceUrl = getInvoiceUrl();

  const handleShare = async () => {
    try {
      const message = `Invoice for Booking ${booking.bookingNumber || booking.id}\n\n` +
        `Vendor: ${booking.vendor?.name || booking.vendor?.businessName || 'TransRentals'}\n` +
        `Amount: ₹${(booking.totalAmount || booking.finalAmount || 0).toLocaleString()}\n` +
        `Status: ${booking.status}\n\n` +
        `View invoice: ${invoiceUrl}`;

      await Share.share({
        message,
        title: `Invoice - ${booking.bookingNumber || booking.id}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const uri = await viewShotRef.current.capture();
      await RNShare.open({
        url: `file://${uri}`,
        type: 'image/png',
        filename: `TransRentals_Invoice_${booking.bookingNumber || booking.id}`,
        title: 'Save Invoice',
        subject: `Invoice - ${booking.bookingNumber || booking.id}`,
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        console.log('Download error:', error);
        Alert.alert('Error', 'Failed to save invoice. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  // If no invoice URL, show manual receipt
  if (!invoiceUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={GREEN} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
          <View style={styles.receiptCard}>
            {/* Header with Logo */}
            <View style={styles.receiptHeader}>
              <View style={styles.logoRow}>
                <Image source={require('../../../assets/logp-1.png')} style={styles.logoImage} />
                <Text style={styles.logoText}>Trans<Text style={{ color: GREEN }}>Rentals</Text></Text>
              </View>
              <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceBadgeText}>INVOICE</Text>
              </View>
            </View>

            <Text style={styles.invoiceNumber}>#{booking.bookingNumber || booking.id}</Text>
            <Text style={styles.invoiceDate}>
              {new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </Text>

            <View style={styles.divider} />

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CUSTOMER</Text>
              <Text style={styles.customerName}>{booking.customerName || 'Customer'}</Text>
              {!!(booking.customerPhone) && <Text style={styles.customerInfo}>{booking.customerPhone}</Text>}
              {!!(booking.customerEmail) && <Text style={styles.customerInfo}>{booking.customerEmail}</Text>}
            </View>

            <View style={styles.divider} />

            {/* Trip Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRIP DETAILS</Text>

              {!!(booking.pickupAddress || booking.pickupCity || booking.locationName) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="location" size={16} color={GREEN} />
                    <Text style={styles.tripLabel}>Pickup</Text>
                  </View>
                  <Text style={styles.tripValue}>{booking.pickupAddress || booking.pickupCity || booking.locationName || '-'}</Text>
                </View>
              )}

              {!!(booking.dropAddress || booking.dropCity) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="flag" size={16} color="#EF4444" />
                    <Text style={styles.tripLabel}>Drop</Text>
                  </View>
                  <Text style={styles.tripValue}>{booking.dropAddress || booking.dropCity || '-'}</Text>
                </View>
              )}

              {!!(booking.pickupDate || booking.startDate) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="calendar" size={16} color="#64748B" />
                    <Text style={styles.tripLabel}>From</Text>
                  </View>
                  <Text style={styles.tripValue}>
                    {new Date(booking.pickupDate || booking.startDate).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    {booking.pickupTime ? `, ${booking.pickupTime}` : ''}
                  </Text>
                </View>
              )}

              {!!(booking.dropDate || booking.returnDate) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.tripLabel}>To</Text>
                  </View>
                  <Text style={styles.tripValue}>
                    {new Date(booking.dropDate || booking.returnDate).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    {booking.dropTime ? `, ${booking.dropTime}` : ''}
                  </Text>
                </View>
              )}

              {!!(booking.totalDays) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.tripLabel}>Duration</Text>
                  </View>
                  <Text style={styles.tripValue}>{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</Text>
                </View>
              )}

              {!!(booking.vehicleName || booking.quote?.vehicleName) && (
                <View style={styles.tripRow}>
                  <View style={styles.tripPoint}>
                    <Ionicons name="car" size={16} color="#64748B" />
                    <Text style={styles.tripLabel}>Vehicle</Text>
                  </View>
                  <Text style={styles.tripValue}>{booking.vehicleName || booking.quote?.vehicleName}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Fare Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FARE BREAKDOWN</Text>

              {!!(booking.dailyRate) && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Daily Rate</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.dailyRate).toLocaleString()}</Text>
                </View>
              )}

              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Amount</Text>
                <Text style={styles.fareValue}>₹{Number(booking.baseAmount || booking.quoteAmount || 0).toLocaleString()}</Text>
              </View>

              {Number(booking.extraKmCharges) > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Extra KM Charges</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.extraKmCharges).toLocaleString()}</Text>
                </View>
              )}

              {Number(booking.additionalCharges) > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Additional Charges</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.additionalCharges).toLocaleString()}</Text>
                </View>
              )}

              {Number(booking.tollCharges) > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Toll Charges</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.tollCharges).toLocaleString()}</Text>
                </View>
              )}

              {Number(booking.gstAmount) > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>GST</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.gstAmount).toLocaleString()}</Text>
                </View>
              )}

              {Number(booking.platformFee) > 0 && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Platform Fee</Text>
                  <Text style={styles.fareValue}>₹{Number(booking.platformFee).toLocaleString()}</Text>
                </View>
              )}

              {(() => {
                const grandTotal = Number(booking.grandTotal || booking.totalAmount || booking.finalAmount || booking.baseAmount || 0);
                const deposit = Number(booking.securityDeposit || 0);
                const totalPayable = grandTotal + deposit;
                const advancePaid = Number(booking.advanceAmount || booking.advancePaid || 0);
                const balanceDue = Number(booking.balanceAmount) || (totalPayable - advancePaid);

                return (
                  <>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Grand Total</Text>
                      <Text style={styles.totalValue}>₹{grandTotal.toLocaleString()}</Text>
                    </View>

                    {deposit > 0 && (
                      <>
                        <View style={[styles.fareRow, { marginTop: 12 }]}>
                          <Text style={styles.fareLabel}>Security Deposit <Text style={{ color: '#64748B', fontSize: 11 }}>(Refundable)</Text></Text>
                          <Text style={styles.fareValue}>₹{deposit.toLocaleString()}</Text>
                        </View>
                        <View style={styles.fareRow}>
                          <Text style={[styles.fareLabel, { fontWeight: '700', color: '#0F172A' }]}>Total Payable</Text>
                          <Text style={[styles.fareValue, { fontWeight: '700', color: '#0F172A' }]}>₹{totalPayable.toLocaleString()}</Text>
                        </View>
                      </>
                    )}

                    {advancePaid > 0 && (
                      <>
                        <View style={[styles.fareRow, { marginTop: deposit > 0 ? 8 : 12 }]}>
                          <Text style={styles.fareLabel}>Advance Paid</Text>
                          <Text style={[styles.fareValue, { color: GREEN }]}>-₹{advancePaid.toLocaleString()}</Text>
                        </View>
                        <View style={styles.fareRow}>
                          <Text style={[styles.fareLabel, { fontWeight: '600' }]}>Balance Due</Text>
                          <Text style={[styles.fareValue, { fontWeight: '600' }]}>₹{balanceDue.toLocaleString()}</Text>
                        </View>
                      </>
                    )}

                    {Number(booking.paidAmount) > 0 && !advancePaid && (
                      <View style={[styles.fareRow, { marginTop: 12 }]}>
                        <Text style={styles.fareLabel}>Amount Paid</Text>
                        <Text style={[styles.fareValue, { color: GREEN }]}>₹{Number(booking.paidAmount).toLocaleString()}</Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>

            <View style={styles.divider} />

            {/* Vendor Info */}
            {booking.vendor && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>VENDOR</Text>
                  <Text style={styles.customerName}>{booking.vendor.name || booking.vendor.businessName}</Text>
                  {!!(booking.vendor.phone) && <Text style={styles.customerInfo}>{booking.vendor.phone}</Text>}
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Status */}
            <View style={styles.statusSection}>
              <View style={[
                styles.statusBadge,
                booking.status === 'COMPLETED' ? styles.statusCompleted :
                booking.status === 'CANCELLED' || booking.status === 'DROPPED' ? styles.statusCancelled :
                styles.statusPending
              ]}>
                <Text style={styles.statusText}>{(booking.status || 'PENDING').replace(/_/g, ' ')}</Text>
              </View>
              {(booking.paymentStatus === 'PAID' || booking.paymentStatus === 'COMPLETED') && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.paidText}>Payment Received</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for choosing TransRentals!</Text>
              <Text style={styles.footerContact}>book@transrentals.in | +91 9737965551</Text>
            </View>
          </View>
          </ViewShot>

          {/* Download & Share Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownloadInvoice}
              activeOpacity={0.85}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#fff" />
              )}
              <Text style={styles.downloadBtnText}>{downloading ? 'Saving...' : 'Download Invoice'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareInvoiceBtn}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Ionicons name="share-social-outline" size={20} color={GREEN} />
              <Text style={styles.shareInvoiceBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render WebView for services with invoice API
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={GREEN} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: invoiceUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.log('WebView error:', e);
          Alert.alert('Error', 'Failed to load invoice');
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: { flex: 1, padding: 16 },
  webview: { flex: 1 },

  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: { marginTop: 10, color: '#64748B' },

  // Receipt Card
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 36, height: 36, borderRadius: 8 },
  logoText: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  invoiceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  invoiceBadgeText: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 1 },

  invoiceNumber: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  invoiceDate: { fontSize: 13, color: '#64748B', marginTop: 4 },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },

  section: { marginBottom: 0 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },

  customerName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  customerInfo: { fontSize: 13, color: '#64748B', marginTop: 2 },

  tripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  tripLabel: { fontSize: 12, color: '#64748B' },
  tripValue: { flex: 1, fontSize: 14, color: '#0F172A' },

  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: { fontSize: 14, color: '#64748B' },
  fareValue: { fontSize: 14, color: '#0F172A' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: GREEN,
    marginHorizontal: -20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#fff' },

  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusCompleted: { backgroundColor: '#DCFCE7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#0F172A' },

  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: { fontSize: 13, color: '#059669', fontWeight: '600' },

  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  footerContact: { fontSize: 12, color: '#64748B', marginTop: 4 },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  shareInvoiceBtnText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '700',
  },
});
