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

export default function SelfDriveQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      console.log('❌ [SelfDriveRequestDetail] Request ID is missing');
      Alert.alert('Error', 'Request ID is missing');
      navigation.goBack();
      return;
    }

    console.log('🔍 [SelfDriveRequestDetail] Fetching request with ID:', requestId);

    try {
      const data = await getQuoteRequestById('self-drive', requestId);
      const requestData = data.request || data;
      setRequest({ ...requestData, hasQuoted: data.hasQuoted, vendorQuote: data.vendorQuote });
      setBookingId(data.bookingId || null);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      Alert.alert('Error', 'Failed to load request details');
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
    navigation.navigate('SelfDriveSendQuote', { requestId: request.id || request._id });
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
            <Text style={styles.headerSubtitle}>Self Drive</Text>
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

  // Vehicle Details
  const vehicleModelName = request.vehicleModelName || request.vehicle_model_name;
  const vehicleBrand = request.vehicleBrand || request.vehicle_brand;
  const vehicleType = request.vehicleType || request.vehicle_type;
  const carType = request.carType || request.car_type;
  const carTypeName = request.carTypeName || request.car_type_name || request.vehicleCategoryName || request.vehicle_category_name;

  // Map vehicleType to display name
  const vehicleTypeDisplay =
    vehicleType === '1' ? 'Hatchback' :
    vehicleType === '2' ? 'Sedan' :
    vehicleType === '3' ? 'MUV' :
    vehicleType === '4' ? 'SUV' :
    vehicleType === '5' ? 'Luxury' :
    vehicleType || carTypeName || carType;
  const transmission = request.transmission;
  const transmissionName = transmission === '1' || transmission === 1 ? 'Automatic' : transmission === '2' || transmission === 2 ? 'Manual' : transmission;
  const fuelType = request.fuelType || request.fuel_type;
  const fuelTypeName =
    fuelType === '1' || fuelType === 1 ? 'Diesel' :
    fuelType === '2' || fuelType === 2 ? 'Petrol' :
    fuelType === '3' || fuelType === 3 ? 'Electric' :
    fuelType === '4' || fuelType === 4 ? 'CNG' : fuelType;

  // Location & Trip Details
  const pickupLocation = request.locationName || request.location?.name || request.pickupLocation || request.pickup_location || request.pickupCity || 'N/A';
  const destination = request.destination || request.dropLocation || request.drop_location || request.dropCity;
  const pickupDate = request.pickupDate || request.pickup_date || request.startDate || request.journey_date;
  const pickupTime = request.pickupTime || request.pickup_time || request.start_time || request.journey_time;
  const returnDate = request.returnDate || request.return_date || request.endDate || request.return_datetime;
  const returnTime = request.returnTime || request.return_time;

  // Additional Details
  const doorstepDelivery = request.doorstepDelivery || request.doorstep_delivery || request.is_doorstep_delivery || request.isDoorstepDelivery;
  const isDoorstepDelivery = doorstepDelivery === '1' || doorstepDelivery === 1 || doorstepDelivery === 'yes' || doorstepDelivery === true;
  const passengers = request.passengers || request.total_passengers || request.totalPassengers || request.total_passangers;

  // Request Metadata
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.customerNotes || request.customer_notes || request.notes || request.description || request.additionalInfo || request.specialRequirements || request.additional_details || request.other_info;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>Self Drive</Text>
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
          {(vehicleModelName || vehicleBrand || vehicleTypeDisplay || transmission || fuelType) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="car" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Vehicle Preference</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.vehicleInfo}>
                  <MaterialCommunityIcons name="car" size={32} color={GREEN} />
                  <View style={{ flex: 1 }}>
                    {vehicleModelName ? (
                      <>
                        <View style={styles.vehicleHeader}>
                          <Text style={styles.vehicleName}>{vehicleModelName}</Text>
                          {vehicleTypeDisplay && (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryText}>{vehicleTypeDisplay}</Text>
                            </View>
                          )}
                        </View>
                        {vehicleBrand && (
                          <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                        )}
                      </>
                    ) : (
                      <>
                        <View style={styles.vehicleHeader}>
                          <Text style={styles.vehicleName}>{vehicleTypeDisplay || 'Vehicle'}</Text>
                        </View>
                        {vehicleBrand && (
                          <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
                {(transmission || fuelType) && (
                  <View style={styles.vehicleSpecsRow}>
                    {transmissionName && (
                      <View style={styles.specItem}>
                        <MaterialCommunityIcons name="car-shift-pattern" size={18} color="#64748B" />
                        <View style={styles.specContent}>
                          <Text style={styles.specLabel}>Transmission</Text>
                          <Text style={styles.specValue}>{transmissionName}</Text>
                        </View>
                      </View>
                    )}
                    {fuelTypeName && (
                      <View style={styles.specItem}>
                        <MaterialCommunityIcons name="gas-station" size={18} color="#64748B" />
                        <View style={styles.specContent}>
                          <Text style={styles.specLabel}>Fuel Type</Text>
                          <Text style={styles.specValue}>{fuelTypeName}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Rental Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupLocation}</Text>
                </View>
              </View>
              {destination && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Destination</Text>
                    <Text style={styles.infoValue}>{destination}</Text>
                  </View>
                </View>
              )}
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar" size={16} color="#64748B" />
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Pickup Date</Text>
                    <Text style={styles.dateTimeValue}>{formatDate(pickupDate)}</Text>
                  </View>
                </View>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time" size={16} color="#64748B" />
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.dateTimeValue}>{formatTime(pickupTime)}</Text>
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
              {passengers && (
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Total Passengers</Text>
                    <Text style={styles.infoValue}>{passengers}</Text>
                  </View>
                </View>
              )}
              {doorstepDelivery !== null && doorstepDelivery !== undefined && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="truck-delivery" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Doorstep Delivery</Text>
                    <Text style={[styles.infoValue, { color: isDoorstepDelivery ? GREEN : '#EF4444' }]}>
                      {isDoorstepDelivery ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          {notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbox-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Special Requirements</Text>
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
                navigation.navigate('SelfDriveBookingDetail', { bookingId });
              } else {
                Alert.alert('Info', 'Booking details will appear in your Bookings section shortly.');
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
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: { fontSize: 16, fontWeight: '700', color: DARK, flex: 1 },
  vehicleBrand: { fontSize: 13, color: '#64748B', marginTop: 0 },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#92400E' },

  vehicleSpecsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  specItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  specContent: { flex: 1 },
  specLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '600', color: DARK },

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
