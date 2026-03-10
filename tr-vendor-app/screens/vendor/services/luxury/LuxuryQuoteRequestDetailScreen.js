import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequestById } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  QUOTED: '#3B82F6',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#6B7280',
};

export default function LuxuryQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      console.log('❌ [LuxuryRequestDetail] Request ID is missing');
      showError('Request ID is missing');
      navigation.goBack();
      return;
    }

    console.log('🔍 [LuxuryRequestDetail] Fetching request with ID:', requestId);

    try {
      const data = await getQuoteRequestById('luxury', requestId);
      const requestData = data.request || data;
      setRequest({ ...requestData, hasQuoted: data.hasQuoted, vendorQuote: data.vendorQuote });
      setBookingId(data.bookingId || null);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      showError('Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId, navigation]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequestDetail();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = timeStr.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] || '00';

    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hours}:${minutes} ${period}`;
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'time-outline';
      case 'QUOTED':
        return 'document-text';
      case 'ACCEPTED':
        return 'checkmark-circle';
      case 'REJECTED':
        return 'close-circle';
      case 'EXPIRED':
        return 'alert-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const handleSendQuote = () => {
    navigation.navigate('LuxurySendQuote', { requestId: request.id || request._id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={DARK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Request Details</Text>
            <Text style={styles.headerSubtitle}>Luxury Car</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.skeletonBanner} />
          <View style={{ padding: 16, paddingTop: 8 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '70%' }]} />
                <View style={[styles.skeletonLine, { width: '50%' }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Request Not Found</Text>
          <Text style={styles.emptySubtitle}>This request may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const statusColor = STATUS_COLORS[status] || '#6B7280';

  // Customer Information
  const customerName = request.customerName || request.customer_name || 'Customer';
  const customerEmail = request.customerEmail || request.customer_email;
  const customerPhone = request.customerPhone || request.customer_phone;

  // Location Details
  const pickupLocation = request.pickupLocation || request.pickup_location || request.pickupCity || 'N/A';
  const pickupAddress = request.pickupAddress || request.pickup_address;
  const destination = request.destination || request.drop_location || request.dropLocation || request.dropCity;
  const destinationAddress = request.destinationAddress || request.destination_address || request.dropAddress || request.drop_address;

  // Date & Time Details
  const startDate = request.startDate || request.pickup_date || request.pickupDate;
  const startTime = request.startTime || request.pickup_time || request.pickupTime || '10:00';
  const returnDate = request.returnDate || request.return_date || request.endDate;
  const returnTime = request.returnTime || request.return_time || request.dropTime || '10:00';

  // Booking Type & Package
  const bookingType = request.bookingType || request.booking_type || 'N/A';
  const packageType = request.packageType || request.package_type;

  // Vehicle Details
  const vehicleModelName = request.vehicleModelName || request.vehicle_model_name || request.specificModel || request.specific_model;
  const vehicleBrand = request.vehicleBrand || request.vehicle_brand;
  const vehicleCategory = request.vehicleCategory || request.vehicle_category;
  const vehicleCategoryName = request.vehicleCategoryName || request.vehicle_category_name || vehicleCategory;

  // Trip Details
  const passengers = request.passengers;
  const tripType = request.tripType || request.trip_type;
  const occasion = request.occasion;
  const tripDays = request.tripDays || request.trip_days;
  const tripHours = request.tripHours || request.trip_hours;

  // Requirements
  const needChauffeur = request.needChauffeur !== false;
  const needDecoration = request.needDecoration === true;
  const decorationType = request.decorationType || request.decoration_type;

  // Budget Information
  const budgetMin = request.budgetMin || request.budget_min;
  const budgetMax = request.budgetMax || request.budget_max;

  // Request Metadata
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.customerNotes || request.customer_notes || request.notes || request.requirements || request.description || request.additionalInfo || request.specialRequirements;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>Luxury Car</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={styles.statusContent}>
            <Ionicons name={getStatusIcon(status)} size={24} color={statusColor} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{status}</Text>
              <Text style={styles.requestNumberText}>Request #{requestNumber}</Text>
            </View>
          </View>
          {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
            <TouchableOpacity style={styles.sendQuoteBtn} onPress={handleSendQuote}>
              <Ionicons name="paper-plane" size={16} color="#fff" />
              <Text style={styles.sendQuoteBtnText}>Send Quote</Text>
            </TouchableOpacity>
          )}
          {request.hasQuoted && (
            <View style={styles.quotedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.quotedBadgeText}>Quoted</Text>
            </View>
          )}
        </View>

        {request.hasQuoted && (
          <View style={styles.quotedBanner}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.quotedBannerTitle}>You've already sent a quote</Text>
              {request.vendorQuote?.grandTotal ? (
                <Text style={styles.quotedBannerAmount}>
                  ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                  {request.vendorQuote?.status ? `  •  ${request.vendorQuote.status}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName}</Text>
                </View>
              </View>
              {customerEmail && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{customerEmail}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle Information */}
          {(vehicleModelName || vehicleCategoryName) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="car-sports" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Vehicle Preference</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.vehicleInfo}>
                  <MaterialCommunityIcons name="car-sports" size={32} color={GREEN} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>
                      {vehicleModelName || 'Any Luxury Car'}
                    </Text>
                    {vehicleBrand && (
                      <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                    )}
                    {vehicleCategoryName && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{vehicleCategoryName}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Booking Type & Package */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Booking Type & Package</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="timer-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Booking Type</Text>
                  <Text style={styles.infoValue}>{bookingType}</Text>
                </View>
              </View>
              {packageType && (
                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Package</Text>
                    <Text style={styles.infoValue}>{packageType}</Text>
                  </View>
                </View>
              )}
              {passengers && (
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Passengers</Text>
                    <Text style={styles.infoValue}>{passengers}</Text>
                  </View>
                </View>
              )}
              {occasion && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Occasion</Text>
                    <Text style={styles.infoValue}>{occasion.charAt(0).toUpperCase() + occasion.slice(1)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Trip Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>
                    {pickupLocation}
                    {pickupAddress ? `\n${pickupAddress}` : ''}
                  </Text>
                </View>
              </View>
              {destination && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Destination</Text>
                    <Text style={styles.infoValue}>
                      {destination}
                      {destinationAddress ? `\n${destinationAddress}` : ''}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar" size={16} color="#64748B" />
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Start Date</Text>
                    <Text style={styles.dateTimeValue}>{formatDate(startDate)}</Text>
                  </View>
                </View>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time" size={16} color="#64748B" />
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.dateTimeValue}>{formatTime(startTime)}</Text>
                  </View>
                </View>
              </View>
              {returnDate && (
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar" size={16} color="#64748B" />
                    <View style={styles.dateTimeContent}>
                      <Text style={styles.infoLabel}>Return Date</Text>
                      <Text style={styles.dateTimeValue}>{formatDate(returnDate)}</Text>
                    </View>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time" size={16} color="#64748B" />
                    <View style={styles.dateTimeContent}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.dateTimeValue}>{formatTime(returnTime)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Requirements</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Chauffeur</Text>
                  <Text style={[styles.infoValue, { color: needChauffeur ? GREEN : '#64748B' }]}>
                    {needChauffeur ? 'Required' : 'Not Required'}
                  </Text>
                </View>
              </View>
              {needDecoration && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="party-popper" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Decoration</Text>
                    <Text style={styles.infoValue}>{decorationType || 'Required'}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Budget Range */}
          {(budgetMin || budgetMax) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Budget Range</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.budgetRow}>
                  {budgetMin && (
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Minimum</Text>
                      <Text style={styles.budgetValue}>₹{budgetMin?.toLocaleString()}</Text>
                    </View>
                  )}
                  {budgetMax && (
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Maximum</Text>
                      <Text style={styles.budgetValue}>₹{budgetMax?.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Customer Notes */}
          {notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbox-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Customer Notes</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}

          {/* Request Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Request Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <Ionicons name="add-circle" size={16} color={GREEN} />
                <Text style={styles.timelineText}>
                  Received on {formatDate(request.createdAt || request.created_at)}
                </Text>
              </View>
              {request.updatedAt && request.updatedAt !== request.createdAt && (
                <View style={styles.timelineRow}>
                  <Ionicons name="refresh" size={16} color="#64748B" />
                  <Text style={styles.timelineText}>
                    Updated on {formatDate(request.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.viewBookingButton}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('LuxuryBookingDetail', { bookingId });
              } else {
                showInfo('Booking details will appear in your Bookings section shortly.');
              }
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.sendQuoteButtonText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      )}
      {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sendQuoteButton} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={styles.sendQuoteButtonText}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      {request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' && (
        <View style={styles.quotedBottomBar}>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.quotedBottomTitle}>Quote Already Sent</Text>
            {request.vendorQuote?.grandTotal ? (
              <Text style={styles.quotedBottomSub}>
                ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                {request.vendorQuote?.status ? `  •  ${request.vendorQuote.status}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      )}
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
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  skeletonBanner: { height: 80, backgroundColor: '#E2E8F0', borderRadius: 16, marginHorizontal: 16, marginTop: 16 },
  skeletonCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12, marginBottom: 20 },
  skeletonLine: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, width: '100%' },

  quotedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  quotedBadgeText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  quotedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  quotedBannerTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  quotedBannerAmount: { fontSize: 12, color: '#166534', marginTop: 2 },
  quotedBottomBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F0FDF4', borderTopWidth: 1, borderTopColor: '#BBF7D0' },
  quotedBottomTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  quotedBottomSub: { fontSize: 12, color: '#166534', marginTop: 2 },

  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 14, color: '#64748B', marginTop: 8 },

  scrollView: { flex: 1 },

  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  requestNumberText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sendQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sendQuoteBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  content: { padding: 16, paddingTop: 8, paddingBottom: 100 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DARK },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  infoValue: { fontSize: 14, color: DARK, fontWeight: '600' },

  vehicleInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: DARK },
  vehicleBrand: { fontSize: 13, color: '#64748B', marginTop: 2 },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#92400E' },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateTimeContent: { flex: 1 },
  dateTimeValue: { fontSize: 13, fontWeight: '600', color: DARK, marginTop: 2 },

  budgetRow: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetItem: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  budgetLabel: { fontSize: 11, color: '#166534', marginBottom: 4 },
  budgetValue: { fontSize: 16, fontWeight: '700', color: '#15803D' },

  notesText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timelineText: { fontSize: 13, color: '#64748B' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sendQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendQuoteButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
