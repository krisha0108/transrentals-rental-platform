import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions, Platform,
  NativeModules, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import RazorpayCheckout from 'react-native-razorpay';
import { b2bService } from '../services';
import { BASE_URL } from '../api';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

export default function B2BInvoiceDetailScreen({ navigation, route }) {
  const { invoiceId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Custom alert modal state
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '', extra: null });

  const loadInvoice = useCallback(async () => {
    try {
      const res = await b2bService.getInvoiceDetail(invoiceId);
      setInvoice(res?.invoice || res);
    } catch (err) {
      console.log('Invoice detail error:', err.message);
      setAlertModal({ visible: true, type: 'error', title: 'Load Failed', message: 'Failed to load invoice details. Pull down to retry.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId]);

  useEffect(() => { loadInvoice(); }, [loadInvoice]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const formatShortDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatCurrency = (amt) => amt ? `₹${Number(amt).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0';
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const TRIP_TYPE_LABELS = {
    ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
  };

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const res = await b2bService.createPaymentOrder(invoiceId);
      if (res?.order) {
        const options = {
          description: res.razorpayConfig?.description || 'B2B Invoice Payment',
          currency: res.order.currency || 'INR',
          key: res.razorpayConfig?.key || '',
          amount: String(res.order.amount),
          name: res.razorpayConfig?.name || 'TransRentals',
          order_id: res.order.id,
          prefill: res.razorpayConfig?.prefill || {},
          theme: { color: '#22C55E' },
        };

        const data = await RazorpayCheckout.open(options);

        await b2bService.markInvoicePaid(invoiceId, {
          paymentId: data.razorpay_payment_id,
          transactionRef: data.razorpay_payment_id,
          paidAmount: invoice?.totalAmount,
        });

        setAlertModal({
          visible: true, type: 'success', title: 'Payment Successful!',
          message: `Your invoice ${invoice?.invoiceNumber || ''} has been paid successfully.`,
          extra: { paymentId: data.razorpay_payment_id, amount: invoice?.totalAmount },
        });
        loadInvoice();
      } else {
        setAlertModal({ visible: true, type: 'error', title: 'Payment Error', message: res?.message || 'Failed to create payment order. Please try again.' });
      }
    } catch (err) {
      const desc = (err?.description || err?.message || '').toLowerCase();
      if (desc.includes('cancel') || desc.includes('dismiss')) {
        // User cancelled - do nothing
      } else {
        setAlertModal({ visible: true, type: 'error', title: 'Payment Failed', message: err?.description || err?.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setPayLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await b2bService.downloadInvoicePDF(invoiceId);
      if (!res?.pdf) {
        setAlertModal({ visible: true, type: 'error', title: 'PDF Error', message: 'Failed to generate PDF. Please try again.' });
        return;
      }
      const filename = res.filename || `Invoice_${invoice?.invoiceNumber || invoiceId}.pdf`;

      const { FileUtil } = NativeModules;
      if (FileUtil && FileUtil.saveBase64ToDownloads) {
        await FileUtil.saveBase64ToDownloads(res.pdf, filename, 'application/pdf');
        setAlertModal({ visible: true, type: 'download', title: 'Downloaded!', message: `Invoice saved to Downloads folder`, extra: { filename } });
      } else {
        // Fallback: open in browser
        const pdfUrl = `${BASE_URL}/invoice/b2b/${invoiceId}`;
        const { Linking } = require('react-native');
        await Linking.openURL(pdfUrl);
      }
    } catch (err) {
      console.log('PDF download error:', err);
      setAlertModal({ visible: true, type: 'error', title: 'Download Failed', message: 'Failed to download PDF. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={scale(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <View style={{ width: scale(22) }} />
        </View>
        <View style={styles.center}><Text style={{ color: '#999' }}>Invoice not found</Text></View>
      </SafeAreaView>
    );
  }

  const isPaid = invoice.status === 'PAID';
  const booking = invoice.booking;
  const trips = booking?.trips || [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Teal Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={scale(20)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <TouchableOpacity onPress={handleDownloadPDF} disabled={downloading} style={styles.headerBtn}>
          {downloading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Icon name="download" size={scale(20)} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInvoice(); }} colors={['#0D9488']} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Card - Teal Header */}
        <View style={styles.invoiceCard}>
          <View style={styles.tealHeader}>
            <View>
              <Text style={styles.brandName}>TransRentals</Text>
              <Text style={styles.brandSub}>Corporate Transport Solutions</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
          </View>

          {/* Status Banner */}
          {isPaid && (
            <View style={styles.paidBanner}>
              <Icon name="check-circle" size={scale(16)} color="#16A34A" />
              <Text style={styles.paidText}>PAID</Text>
              <Text style={styles.paidDate}>on {formatDate(invoice.paidAt)}</Text>
            </View>
          )}
          {!isPaid && invoice.status === 'OVERDUE' && (
            <View style={[styles.paidBanner, { backgroundColor: '#FEF2F2', borderBottomColor: '#FECACA' }]}>
              <Icon name="alert-circle" size={scale(16)} color="#DC2626" />
              <Text style={[styles.paidText, { color: '#DC2626' }]}>OVERDUE</Text>
            </View>
          )}
          {!isPaid && invoice.status !== 'OVERDUE' && invoice.status !== 'CANCELLED' && (
            <View style={[styles.paidBanner, { backgroundColor: '#FFFBEB', borderBottomColor: '#FDE68A' }]}>
              <Icon name="clock" size={scale(16)} color="#D97706" />
              <Text style={[styles.paidText, { color: '#D97706' }]}>PENDING</Text>
              <Text style={[styles.paidDate, { color: '#B45309' }]}>Due {formatShortDate(invoice.dueDate)}</Text>
            </View>
          )}

          {/* Bill To & Invoice Info */}
          <View style={styles.section}>
            <View style={styles.billRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>BILL TO</Text>
                <Text style={styles.companyName}>{invoice.companyName}</Text>
                {booking?.customer?.name && <Text style={styles.infoText}>{booking.customer.name}</Text>}
                {invoice.customerEmail && (
                  <View style={styles.infoRow}>
                    <Icon name="mail" size={scale(12)} color="#9CA3AF" />
                    <Text style={styles.infoText}>{invoice.customerEmail}</Text>
                  </View>
                )}
                {invoice.customerPhone && (
                  <View style={styles.infoRow}>
                    <Icon name="phone" size={scale(12)} color="#9CA3AF" />
                    <Text style={styles.infoText}>{invoice.customerPhone}</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Invoice Date</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.createdAt)}</Text>
                <Text style={[styles.metaLabel, { marginTop: scale(8) }]}>Due Date</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
                <Text style={[styles.metaLabel, { marginTop: scale(8) }]}>Booking Ref</Text>
                <Text style={[styles.metaValue, { color: '#0D9488', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>{booking?.bookingNumber}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Booking Details */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BOOKING DETAILS</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Service Type</Text>
                <Text style={styles.detailValue}>
                  {booking?.serviceType === 'self-drive' ? 'Self Drive' : `${booking?.serviceType || '-'} Rental`}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Trip Type</Text>
                <Text style={styles.detailValue}>{TRIP_TYPE_LABELS[booking?.tripType] || booking?.tripType || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Vehicles</Text>
                <Text style={styles.detailValue}>
                  {booking?.vehiclesRequired || '-'}{booking?.passengerCount ? ` (${booking.passengerCount} pax)` : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pickup</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{booking?.pickupLocation || '-'}</Text>
              </View>
            </View>
            <View style={[styles.detailsGrid, { marginTop: scale(8) }]}>
              {booking?.dropLocation && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Drop</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>{booking.dropLocation}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pickup Date</Text>
                <Text style={styles.detailValue}>{formatShortDate(booking?.scheduledDate)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pickup Time</Text>
                <Text style={styles.detailValue}>{formatTime(booking?.scheduledTime)}</Text>
              </View>
              {booking?.returnDate && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Return</Text>
                  <Text style={styles.detailValue}>{formatShortDate(booking.returnDate)}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Vehicles & Trips */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VEHICLES & TRIPS</Text>
            {trips.map((trip, i) => {
              const vehName = trip.vehicleName || trip.vehicle?.vehicleName
                || [trip.vehicle?.brands?.name, trip.vehicle?.vehicle_models?.name].filter(Boolean).join(' ')
                || booking?.serviceType?.replace(/-/g, ' ') || '-';
              const vehNumber = trip.vehicleNumber || trip.vehicle?.registrationNumber || '-';
              const drvName = trip.driverName || trip.driver?.name || '-';
              const statusColor = trip.status === 'COMPLETED' ? '#059669' : trip.status === 'STARTED' ? '#2563EB' : trip.status === 'CANCELLED' ? '#DC2626' : '#6B7280';
              const statusBg = trip.status === 'COMPLETED' ? '#ECFDF5' : trip.status === 'STARTED' ? '#EFF6FF' : trip.status === 'CANCELLED' ? '#FEF2F2' : '#F3F4F6';

              return (
                <View key={trip.id || i} style={[styles.tripCard, i > 0 && { marginTop: scale(8) }]}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripNum}>
                      <Text style={styles.tripNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.tripCode}>{trip.tripCode || '-'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>{trip.status}</Text>
                    </View>
                  </View>
                  <View style={styles.tripDetails}>
                    <View style={styles.tripDetailItem}>
                      <Icon name="truck" size={scale(11)} color="#9CA3AF" />
                      <Text style={styles.tripDetailText} numberOfLines={1}>{vehName}</Text>
                    </View>
                    <View style={styles.tripDetailItem}>
                      <Icon name="hash" size={scale(11)} color="#9CA3AF" />
                      <Text style={styles.tripDetailMono}>{vehNumber}</Text>
                    </View>
                    <View style={styles.tripDetailItem}>
                      <Icon name="user" size={scale(11)} color="#9CA3AF" />
                      <Text style={styles.tripDetailText}>{drvName}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {trips.length === 0 && (
              <Text style={{ fontSize: scale(12), color: '#9CA3AF', textAlign: 'center', paddingVertical: scale(12) }}>No trips found</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Pricing Summary */}
          <View style={styles.section}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Total Vehicles</Text>
              <Text style={styles.pricingValue}>{invoice.totalVehicles || '-'}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Trips Completed</Text>
              <Text style={styles.pricingValue}>{invoice.tripsCompleted || '-'}</Text>
            </View>
            <View style={styles.pricingDivider} />
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Service Charges</Text>
              <Text style={styles.pricingValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.pricingRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Payment Info (if paid) */}
          {isPaid && invoice.transactionRef && (
            <View style={[styles.section, { marginTop: scale(4) }]}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Transaction Ref</Text>
                <Text style={[styles.pricingValue, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: scale(11) }]}>
                  {invoice.transactionRef}
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>This is a computer-generated invoice and does not require a signature.</Text>
            <Text style={styles.footerText}>TransRentals | Corporate Transport Solutions</Text>
            <Text style={styles.footerText}>For queries, contact book@transrentals.in | +91 9737965551</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Download Button */}
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#0D9488" />
            ) : (
              <>
                <Icon name="download" size={scale(18)} color="#0D9488" />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Pay Button */}
          {!isPaid && invoice.status !== 'CANCELLED' && (
            <TouchableOpacity
              style={[styles.payBtn, payLoading && { opacity: 0.6 }]}
              onPress={handlePay}
              disabled={payLoading}
            >
              {payLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.payBtnText}>  Processing...</Text>
                </View>
              ) : (
                <>
                  <Icon name="credit-card" size={scale(18)} color="#fff" />
                  <Text style={styles.payBtnText}>Pay {formatCurrency(invoice.totalAmount)}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Icon Circle */}
            <View style={[
              styles.modalIconCircle,
              alertModal.type === 'success' && { backgroundColor: '#ECFDF5' },
              alertModal.type === 'download' && { backgroundColor: '#EFF6FF' },
              alertModal.type === 'error' && { backgroundColor: '#FEF2F2' },
            ]}>
              <View style={[
                styles.modalIconInner,
                alertModal.type === 'success' && { backgroundColor: '#16A34A' },
                alertModal.type === 'download' && { backgroundColor: '#2563EB' },
                alertModal.type === 'error' && { backgroundColor: '#DC2626' },
              ]}>
                <Icon
                  name={
                    alertModal.type === 'success' ? 'check' :
                    alertModal.type === 'download' ? 'download' :
                    'alert-triangle'
                  }
                  size={scale(24)}
                  color="#fff"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>{alertModal.title}</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>{alertModal.message}</Text>

            {/* Extra info for success */}
            {alertModal.type === 'success' && alertModal.extra && (
              <View style={styles.modalInfoBox}>
                <View style={styles.modalInfoRow}>
                  <Icon name="credit-card" size={scale(13)} color="#16A34A" />
                  <Text style={styles.modalInfoLabel}>Payment ID</Text>
                </View>
                <Text style={styles.modalInfoValue}>{alertModal.extra.paymentId}</Text>
                <View style={styles.modalInfoDivider} />
                <View style={styles.modalInfoRow}>
                  <Icon name="dollar-sign" size={scale(13)} color="#16A34A" />
                  <Text style={styles.modalInfoLabel}>Amount Paid</Text>
                </View>
                <Text style={styles.modalInfoValueBold}>{formatCurrency(alertModal.extra.amount)}</Text>
              </View>
            )}

            {/* Extra info for download */}
            {alertModal.type === 'download' && alertModal.extra && (
              <View style={[styles.modalInfoBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={styles.modalInfoRow}>
                  <Icon name="file" size={scale(13)} color="#2563EB" />
                  <Text style={[styles.modalInfoLabel, { color: '#1E40AF' }]}>File Name</Text>
                </View>
                <Text style={[styles.modalInfoValue, { color: '#1E3A8A' }]}>{alertModal.extra.filename}</Text>
              </View>
            )}

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.modalBtn,
                alertModal.type === 'success' && { backgroundColor: '#16A34A' },
                alertModal.type === 'download' && { backgroundColor: '#2563EB' },
                alertModal.type === 'error' && { backgroundColor: '#DC2626' },
              ]}
              onPress={() => setAlertModal(prev => ({ ...prev, visible: false }))}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>
                {alertModal.type === 'success' ? 'Great!' : alertModal.type === 'download' ? 'OK' : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(12),
    paddingTop: scale(12),
    backgroundColor: '#0D9488',
  },
  headerBtn: { padding: scale(4) },
  headerTitle: { fontSize: scale(17), fontWeight: '700', color: '#fff' },
  scrollContent: { padding: scale(12), paddingBottom: scale(100) },

  // Invoice Card
  invoiceCard: {
    backgroundColor: '#fff', borderRadius: scale(12), overflow: 'hidden',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },

  // Teal header inside card
  tealHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(16),
    backgroundColor: '#0D9488',
  },
  brandName: { fontSize: scale(16), fontWeight: '800', color: '#fff' },
  brandSub: { fontSize: scale(9), color: '#99F6E4', letterSpacing: 0.5, marginTop: scale(2) },
  invoiceLabel: { fontSize: scale(18), fontWeight: '800', color: '#fff', letterSpacing: 2 },
  invoiceNumber: {
    fontSize: scale(11), color: '#CCFBF1', marginTop: scale(2),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Status Banners
  paidBanner: {
    flexDirection: 'row', alignItems: 'center', gap: scale(6),
    paddingHorizontal: scale(16), paddingVertical: scale(8),
    backgroundColor: '#F0FDF4', borderBottomWidth: 1, borderBottomColor: '#BBF7D0',
  },
  paidText: { fontSize: scale(13), fontWeight: '700', color: '#16A34A' },
  paidDate: { fontSize: scale(11), color: '#15803D' },

  // Section
  section: { paddingHorizontal: scale(16), paddingVertical: scale(12) },
  sectionLabel: {
    fontSize: scale(10), color: '#9CA3AF', letterSpacing: 1,
    fontWeight: '600', marginBottom: scale(8),
  },

  // Bill To
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  companyName: { fontSize: scale(15), fontWeight: '700', color: '#111827', marginBottom: scale(4) },
  infoText: { fontSize: scale(12), color: '#6B7280', marginTop: scale(2) },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4), marginTop: scale(3) },

  // Invoice meta (right side)
  metaLabel: { fontSize: scale(10), color: '#9CA3AF', textTransform: 'uppercase' },
  metaValue: { fontSize: scale(12), fontWeight: '600', color: '#1F2937', marginTop: scale(1) },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: scale(16) },

  // Booking Details Grid
  detailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#F9FAFB', borderRadius: scale(8), padding: scale(12),
  },
  detailItem: { width: '50%', marginBottom: scale(8) },
  detailLabel: { fontSize: scale(10), color: '#6B7280' },
  detailValue: { fontSize: scale(12), fontWeight: '600', color: '#111827', marginTop: scale(2) },

  // Trip Cards
  tripCard: {
    backgroundColor: '#F9FAFB', borderRadius: scale(8), padding: scale(10),
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  tripHeader: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
  },
  tripNum: {
    width: scale(22), height: scale(22), borderRadius: scale(11),
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  tripNumText: { fontSize: scale(11), fontWeight: '700', color: '#6B7280' },
  tripCode: {
    flex: 1, fontSize: scale(12), fontWeight: '700', color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: { paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) },
  statusText: { fontSize: scale(10), fontWeight: '600' },
  tripDetails: {
    flexDirection: 'row', flexWrap: 'wrap', gap: scale(12), marginTop: scale(8),
    paddingLeft: scale(30),
  },
  tripDetailItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  tripDetailText: { fontSize: scale(11), color: '#4B5563' },
  tripDetailMono: {
    fontSize: scale(11), color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Pricing
  pricingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: scale(4),
  },
  pricingLabel: { fontSize: scale(13), color: '#6B7280' },
  pricingValue: { fontSize: scale(13), fontWeight: '500', color: '#1F2937' },
  pricingDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: scale(6) },
  totalDivider: { height: 2, backgroundColor: '#0D9488', marginVertical: scale(8) },
  totalLabel: { fontSize: scale(16), fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: scale(18), fontWeight: '800', color: '#0D9488' },

  // Notes
  notesCard: {
    marginHorizontal: scale(16), marginVertical: scale(8),
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: scale(8), padding: scale(12),
  },
  notesTitle: { fontSize: scale(10), fontWeight: '600', color: '#D97706', marginBottom: scale(4) },
  notesText: { fontSize: scale(12), color: '#92400E' },

  // Footer
  footerSection: {
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    marginHorizontal: scale(16), marginTop: scale(8),
    paddingVertical: scale(12), alignItems: 'center',
  },
  footerText: { fontSize: scale(10), color: '#9CA3AF', textAlign: 'center', marginVertical: scale(1) },

  // Action Buttons
  actionButtons: { marginTop: scale(16), gap: scale(10) },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#0D9488',
    height: scale(50), borderRadius: scale(12), gap: scale(8),
  },
  downloadBtnText: { fontSize: scale(15), fontWeight: '600', color: '#0D9488' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0D9488', height: scale(54), borderRadius: scale(12), gap: scale(8),
    elevation: 3, shadowColor: '#0D9488', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  payBtnText: { fontSize: scale(16), fontWeight: '700', color: '#fff' },

  // Custom Alert Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: scale(20),
    paddingHorizontal: scale(24), paddingTop: scale(28), paddingBottom: scale(20),
    width: '100%', alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20,
  },
  modalIconCircle: {
    width: scale(72), height: scale(72), borderRadius: scale(36),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: scale(16),
  },
  modalIconInner: {
    width: scale(48), height: scale(48), borderRadius: scale(24),
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: {
    fontSize: scale(19), fontWeight: '800', color: '#111827',
    textAlign: 'center', marginBottom: scale(6),
  },
  modalMessage: {
    fontSize: scale(13), color: '#6B7280', textAlign: 'center',
    lineHeight: scale(19), marginBottom: scale(16),
    paddingHorizontal: scale(4),
  },
  modalInfoBox: {
    width: '100%', backgroundColor: '#F0FDF4',
    borderRadius: scale(12), padding: scale(14),
    borderWidth: 1, borderColor: '#BBF7D0',
    marginBottom: scale(16),
  },
  modalInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: scale(6),
    marginBottom: scale(4),
  },
  modalInfoLabel: {
    fontSize: scale(11), fontWeight: '600', color: '#15803D',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: scale(12), color: '#166534',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: scale(4),
  },
  modalInfoValueBold: {
    fontSize: scale(16), fontWeight: '800', color: '#16A34A',
  },
  modalInfoDivider: {
    height: 1, backgroundColor: '#BBF7D0', marginVertical: scale(8),
  },
  modalBtn: {
    width: '100%', height: scale(48), borderRadius: scale(12),
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtnText: {
    fontSize: scale(15), fontWeight: '700', color: '#fff',
  },
});
