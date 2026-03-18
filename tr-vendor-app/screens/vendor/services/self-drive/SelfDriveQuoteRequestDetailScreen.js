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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getQuoteRequestById } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g500: '#059669', g400: '#34D399',
  g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  green: '#059669', greenL: '#ECFDF5', greenD: '#065F46',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CFG = {
  PENDING:         { label: 'Pending',          bg: C.amberL,   text: C.amber,  icon: 'time-outline' },
  QUOTED:          { label: 'Quoted',           bg: C.blueL,    text: C.blue,   icon: 'document-text' },
  QUOTES_RECEIVED: { label: 'Quotes Received',  bg: C.g50,      text: C.g700,   icon: 'mail-outline' },
  ACCEPTED:        { label: 'Accepted',         bg: C.greenL,   text: C.green,  icon: 'checkmark-circle' },
  REJECTED:        { label: 'Rejected',         bg: C.redL,     text: C.red,    icon: 'close-circle' },
  EXPIRED:         { label: 'Expired',          bg: '#F1F5F9',  text: '#6B7280', icon: 'alert-circle' },
  CANCELLED:       { label: 'Cancelled',        bg: C.redL,     text: C.red,    icon: 'close-circle-outline' },
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
      showError('Request ID is missing');
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
    navigation.navigate('SelfDriveSendQuote', { requestId: request.id || request._id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Request Details</Text>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 16, paddingTop: 16 }}>
            <View style={styles.skeletonBanner} />
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
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Request Detail</Text>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="clipboard-outline" size={48} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>Request Not Found</Text>
          <Text style={styles.emptySubtitle}>This request may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const cfg = STATUS_CFG[status] || { label: status, bg: '#F1F5F9', text: '#6B7280', icon: 'help-circle-outline' };

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
  const returnDate = request.returnDate || request.return_date || request.dropDate || request.drop_date || request.endDate || request.return_datetime;
  const returnTime = request.returnTime || request.return_time || request.dropTime || request.drop_time;

  // Additional Details
  const doorstepDelivery = request.doorstepDelivery || request.doorstep_delivery || request.is_doorstep_delivery || request.isDoorstepDelivery;
  const isDoorstepDelivery = doorstepDelivery === '1' || doorstepDelivery === 1 || doorstepDelivery === 'yes' || doorstepDelivery === true;
  const passengers = request.passengers || request.total_passengers || request.totalPassengers || request.total_passangers;

  // Request Metadata
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.customerNotes || request.customer_notes || request.notes || request.description || request.additionalInfo || request.specialRequirements || request.additional_details || request.other_info;

  const vehicleName = vehicleModelName || vehicleTypeDisplay || 'Vehicle';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Request Details</Text>
            <Text style={styles.headerSubtitle}>Self Drive</Text>
          </View>
          {/* Right status badge */}
          <View style={[styles.headerStatusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.text} />
            <Text style={[styles.headerStatusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g700]} tintColor={C.g700} />
        }
      >
        {/* Status/Quote Banner */}
        <View style={[styles.statusBanner, { backgroundColor: cfg.bg, borderColor: cfg.text + '22' }]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIconCircle, { backgroundColor: cfg.text + '18' }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.text} />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusLabel, { color: cfg.text }]}>{cfg.label}</Text>
              <Text style={styles.requestNumberText}>Request #{requestNumber}</Text>
            </View>
          </View>
          {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
            <TouchableOpacity style={styles.sendQuoteBtn} onPress={handleSendQuote}>
              <Ionicons name="paper-plane" size={15} color="#fff" />
              <Text style={styles.sendQuoteBtnText}>Send Quote</Text>
            </TouchableOpacity>
          )}
          {request.hasQuoted && (
            <View style={styles.quotedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.green} />
              <Text style={styles.quotedBadgeText}>Quoted ✓</Text>
            </View>
          )}
        </View>

        {/* Quoted Banner */}
        {request.hasQuoted && (
          <View style={styles.quotedBanner}>
            <View style={styles.quotedBannerLeft}>
              <Ionicons name="checkmark-circle" size={22} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quotedBannerTitle}>You've already sent a quote</Text>
              {request.vendorQuote?.grandTotal ? (
                <View style={styles.quotedBannerRow}>
                  <Text style={styles.quotedBannerAmount}>
                    ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                  </Text>
                  {request.vendorQuote?.status ? (
                    <View style={[styles.quotedStatusPill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.quotedStatusPillText, { color: cfg.text }]}>
                        {request.vendorQuote.status}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.content}>

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="person-circle-outline" size={17} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBox, { backgroundColor: C.blueL }]}>
                  <Ionicons name="person" size={16} color={C.blue} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName}</Text>
                </View>
              </View>
              {customerEmail && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: C.purpleL }]}>
                    <Ionicons name="mail" size={16} color={C.purple} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{customerEmail}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle Preference */}
          {(vehicleModelName || vehicleBrand || vehicleTypeDisplay || transmission || fuelType) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <MaterialCommunityIcons name="car" size={17} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Vehicle Preference</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.vehicleInfo}>
                  <LinearGradient colors={[C.g50, C.g100]} style={styles.vehicleIconBox}>
                    <MaterialCommunityIcons name="car" size={28} color={C.g700} />
                  </LinearGradient>
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
                        <View style={[styles.specIconBox, { backgroundColor: C.g50 }]}>
                          <MaterialCommunityIcons name="car-shift-pattern" size={15} color={C.g700} />
                        </View>
                        <View style={styles.specContent}>
                          <Text style={styles.specLabel}>Transmission</Text>
                          <Text style={styles.specValue}>{transmissionName}</Text>
                        </View>
                      </View>
                    )}
                    {fuelTypeName && (
                      <View style={styles.specItem}>
                        <View style={[styles.specIconBox, { backgroundColor: C.g50 }]}>
                          <MaterialCommunityIcons name="gas-station" size={15} color={C.g700} />
                        </View>
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

          {/* Rental Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="calendar-outline" size={17} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Rental Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBox, { backgroundColor: C.greenL }]}>
                  <Ionicons name="location" size={16} color={C.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupLocation}</Text>
                </View>
              </View>
              {destination && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: C.redL }]}>
                    <Ionicons name="location" size={16} color={C.red} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Destination</Text>
                    <Text style={styles.infoValue}>{destination}</Text>
                  </View>
                </View>
              )}
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <View style={[styles.dateTimeIconBox, { backgroundColor: C.g50 }]}>
                    <Ionicons name="calendar" size={14} color={C.g700} />
                  </View>
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Pickup Date</Text>
                    <Text style={styles.dateTimeValue}>{formatDate(pickupDate)}</Text>
                  </View>
                </View>
                <View style={styles.dateTimeItem}>
                  <View style={[styles.dateTimeIconBox, { backgroundColor: C.g50 }]}>
                    <Ionicons name="time" size={14} color={C.g700} />
                  </View>
                  <View style={styles.dateTimeContent}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.dateTimeValue}>{formatTime(pickupTime)}</Text>
                  </View>
                </View>
              </View>
              {returnDate && (
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <View style={[styles.dateTimeIconBox, { backgroundColor: C.g50 }]}>
                      <Ionicons name="calendar" size={14} color={C.g700} />
                    </View>
                    <View style={styles.dateTimeContent}>
                      <Text style={styles.infoLabel}>Return Date</Text>
                      <Text style={styles.dateTimeValue}>{formatDate(returnDate)}</Text>
                    </View>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <View style={[styles.dateTimeIconBox, { backgroundColor: C.g50 }]}>
                      <Ionicons name="time" size={14} color={C.g700} />
                    </View>
                    <View style={styles.dateTimeContent}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.dateTimeValue}>{formatTime(returnTime)}</Text>
                    </View>
                  </View>
                </View>
              )}
              {passengers && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: C.g50 }]}>
                    <Ionicons name="people" size={16} color={C.g700} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Total Passengers</Text>
                    <Text style={styles.infoValue}>{passengers}</Text>
                  </View>
                </View>
              )}
              {doorstepDelivery !== null && doorstepDelivery !== undefined && (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIconBox, { backgroundColor: isDoorstepDelivery ? C.greenL : C.redL }]}>
                    <MaterialCommunityIcons name="truck-delivery" size={16} color={isDoorstepDelivery ? C.green : C.red} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Doorstep Delivery</Text>
                    <Text style={[styles.infoValue, { color: isDoorstepDelivery ? C.green : C.red }]}>
                      {isDoorstepDelivery ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Special Requirements */}
          {notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="chatbox-outline" size={17} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Special Requirements</Text>
              </View>
              <View style={[styles.card, { backgroundColor: C.amberL, borderColor: C.amber + '30' }]}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={18} color={C.amber} style={{ marginTop: 1 }} />
                  <Text style={styles.notesText}>{notes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Request Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="time-outline" size={17} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Request Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineIconBox, { backgroundColor: C.g50 }]}>
                  <Ionicons name="add-circle" size={14} color={C.g700} />
                </View>
                <Text style={styles.timelineText}>
                  Received on {formatDate(request.createdAt || request.created_at)}
                </Text>
              </View>
              {request.updatedAt && request.updatedAt !== request.createdAt && (
                <View style={styles.timelineRow}>
                  <View style={[styles.timelineIconBox, { backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="refresh" size={14} color={C.muted} />
                  </View>
                  <Text style={styles.timelineText}>
                    Updated on {formatDate(request.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bars */}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.viewBookingButton}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('SelfDriveBookingDetail', { bookingId });
              } else {
                showInfo('Booking details will appear in your Bookings section shortly.');
              }
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.bottomBtnText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      )}
      {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sendQuoteButton} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={styles.bottomBtnText}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      {request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' && (
        <View style={styles.quotedBottomBar}>
          <Ionicons name="checkmark-circle" size={22} color={C.green} />
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
  safe: { flex: 1, backgroundColor: C.bg },

  /* ── Gradient Header ── */
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  headerStatusText: { fontSize: 11, fontWeight: '700' },

  /* ── Skeleton ── */
  skeletonBanner: {
    height: 76,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 16,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    marginBottom: 16,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    width: '100%',
  },

  scrollView: { flex: 1 },

  /* ── Status Banner ── */
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  requestNumberText: { fontSize: 12, color: C.muted, marginTop: 2 },
  sendQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.g700,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: C.g700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sendQuoteBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  quotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.greenL,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quotedBadgeText: { fontSize: 12, fontWeight: '600', color: C.greenD },

  /* ── Quoted Banner ── */
  quotedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.g700,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  quotedBannerLeft: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotedBannerTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  quotedBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  quotedBannerAmount: { fontSize: 15, fontWeight: '800', color: C.g800 },
  quotedStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quotedStatusPillText: { fontSize: 11, fontWeight: '700' },

  /* ── Content ── */
  content: { padding: 16, paddingTop: 12, paddingBottom: 110 },

  /* ── Sections ── */
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  /* ── Card ── */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },

  /* ── Info Rows ── */
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoContent: { flex: 1, paddingTop: 2 },
  infoLabel: { fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  /* ── Vehicle ── */
  vehicleInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  vehicleIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
    flexShrink: 0,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  vehicleBrand: { fontSize: 13, color: C.sub },
  categoryBadge: {
    backgroundColor: C.g50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.g100,
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  vehicleSpecsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  specItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  specIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  specContent: { flex: 1, paddingTop: 1 },
  specLabel: { fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  specValue: { fontSize: 13, fontWeight: '600', color: C.text },

  /* ── Date/Time Grid ── */
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateTimeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dateTimeContent: { flex: 1, paddingTop: 1 },
  dateTimeValue: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: 2 },

  /* ── Notes ── */
  notesText: { fontSize: 14, color: C.sub, lineHeight: 22, flex: 1 },

  /* ── Timeline ── */
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineText: { fontSize: 13, color: C.sub },

  /* ── Bottom Bars ── */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sendQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.g700,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: C.g700,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  viewBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.green,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bottomBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  quotedBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.g50,
    borderTopWidth: 1,
    borderTopColor: C.g100,
  },
  quotedBottomTitle: { fontSize: 14, fontWeight: '700', color: C.g800 },
  quotedBottomSub: { fontSize: 12, color: C.g700, marginTop: 2 },

  /* ── Empty State ── */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 20 },
  emptySubtitle: {
    fontSize: 14,
    color: C.sub,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
