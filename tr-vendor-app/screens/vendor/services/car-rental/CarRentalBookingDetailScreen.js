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
  Linking,
  TextInput,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showError, showConfirm, showInfo, showSuccess } from '../../../../services/alertService';
import {
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  assignOperator,
  getStaffDrivers,
  getFleetVehicles,
  getBaseURL,
  getSessionToken,
} from '../../../api/client';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight,
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  red: T.red, redL: T.redLight,
  orange: T.orange, orangeL: T.orangeL,
};

// Status configurations for different booking types
const STATUS_CONFIG = {
  // Common statuses
  PENDING_PAYMENT:   { color: C.amber,  bg: C.amberL,  label: 'Awaiting Payment' },
  PAYMENT_SUBMITTED: { color: C.orange, bg: C.orangeL, label: 'Payment Review' },
  PAYMENT_VERIFIED:  { color: C.g600,   bg: C.g50,     label: 'Payment Verified' },
  PENDING_VENDOR:    { color: C.amber,  bg: C.amberL,  label: 'Pending' },
  BROADCASTED:       { color: C.blue,   bg: C.blueL,   label: 'Open' },
  ACCEPTED:          { color: C.g600,   bg: C.g50,     label: 'Accepted' },
  IN_PROGRESS:       { color: C.purple, bg: C.purpleL, label: 'In Progress' },
  COMPLETED:         { color: C.g700,   bg: C.g100,    label: 'Completed' },
  CANCELLED:         { color: C.red,    bg: C.redL,    label: 'Cancelled' },

  // Bus/Truck/Packers statuses
  ADVANCE_PAID:       { color: C.g600, bg: C.g50,     label: 'Booking Confirmed' },
  CONFIRMED:          { color: C.g600, bg: C.g50,     label: 'Confirmed' },
  VEHICLE_ASSIGNED:   { color: C.blue, bg: C.blueL,   label: 'Vehicle Assigned' },
  TEAM_ASSIGNED:      { color: C.blue, bg: C.blueL,   label: 'Team Assigned' },
  DRIVER_ASSIGNED:    { color: C.blue, bg: C.blueL,   label: 'Driver Assigned' },
  EQUIPMENT_ASSIGNED: { color: C.blue, bg: C.blueL,   label: 'Equipment Assigned' },

  // Equipment statuses
  DISPATCHED:        { color: C.orange, bg: C.orangeL, label: 'Dispatched' },
  DELIVERED:         { color: C.amber,  bg: C.amberL,  label: 'Delivered' },
  ON_RENT:           { color: C.purple, bg: C.purpleL, label: 'On Rent' },
  IN_USE:            { color: C.purple, bg: C.purpleL, label: 'In Use' },
  PICKUP_SCHEDULED:  { color: C.orange, bg: C.orangeL, label: 'Pickup Scheduled' },
  RETURNED:          { color: C.g600,   bg: C.g50,     label: 'Returned' },

  // Truck/Packers specific
  LOADING:    { color: C.orange, bg: C.orangeL, label: 'Loading' },
  IN_TRANSIT: { color: C.blue,   bg: C.blueL,   label: 'In Transit' },
  UNLOADING:  { color: C.purple, bg: C.purpleL, label: 'Unloading' },
  PACKING:    { color: C.orange, bg: C.orangeL, label: 'Packing' },
  UNPACKING:  { color: C.purple, bg: C.purpleL, label: 'Unpacking' },
};

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId, serviceType = 'car' } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [manualInput, setManualInput] = useState({ name: '', phone: '', vehicleNumber: '', vehicleModel: '' });
  const [showStatusProgress, setShowStatusProgress] = useState(true);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [startTripOtp, setStartTripOtp] = useState('');
  const [completeForm, setCompleteForm] = useState({
    endKmReading: '',
    extraHours: '0',
    tollCharges: '0',
    parkingCharges: '0',
  });

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      console.log('[BookingDetail] Fetching booking => serviceType:', serviceType, '| bookingId:', bookingId);
      const response = await getBookingById(serviceType, bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[BookingDetail] FAILED => status:', error?.response?.status, '| url:', error?.config?.url, '| msg:', error?.response?.data?.message || error?.message);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to load booking details';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [bookingId, serviceType]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Fetch staff/drivers for assignment
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await getStaffDrivers();
        if (response.success) {
          setStaffList(response.drivers || []);
        }
      } catch (error) {
        console.error('Failed to fetch staff:', error);
      }
    };

    const servicesWithAssignment = ['equipment', 'bus', 'truck', 'luxury', 'packers', 'car'];

    if (servicesWithAssignment.includes(serviceType) && booking) {
      const shouldFetch = showAssignForm ||
        (serviceType === 'equipment' && !booking.operatorName) ||
        (serviceType !== 'equipment' && !booking.driverName);

      const statusAllowed = ['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status);

      if (shouldFetch && statusAllowed) {
        fetchStaff();
      }
    }
  }, [serviceType, booking, showAssignForm]);

  // Fetch fleet vehicles for vehicle assignment
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const response = await getFleetVehicles();
        console.log('[Fleet Debug] Full response:', JSON.stringify(response, null, 2));

        if (response.success) {
          const serviceSlugMap = {
            'car': 'car-rental',
            'bike': 'bike-rental',
            'bus': 'bus-rental',
            'truck': 'truck-rental',
            'luxury': 'luxury-car',
            'equipment': 'equipment-rental',
            'packers': 'packers-movers',
          };

          const serviceSlug = serviceSlugMap[serviceType] || serviceType;
          console.log('[Fleet Debug] Service Type:', serviceType);
          console.log('[Fleet Debug] Expected Service Slug:', serviceSlug);
          console.log('[Fleet Debug] Total fleet count:', response.fleet?.length || 0);

          (response.fleet || []).forEach((v, index) => {
            console.log(`[Fleet Debug] Vehicle ${index + 1}:`, {
              id: v.id,
              registrationNumber: v.registrationNumber,
              serviceSlug: v.services?.slug || v.service?.slug,
              serviceName: v.services?.name || v.service?.name,
              isActive: v.isActive,
              brand: v.brands?.name || v.brand?.name,
              category: v.vehicleCategory?.name || v.chauffeur_vehicle_categories?.name,
            });
          });

          const filteredVehicles = (response.fleet || []).filter(
            (v) => {
              const vehicleServiceSlug = v.services?.slug || v.service?.slug;
              return vehicleServiceSlug === serviceSlug && v.isActive;
            }
          );

          console.log('[Fleet Debug] Filtered vehicles count:', filteredVehicles.length);
          setFleetVehicles(filteredVehicles);
        }
      } catch (error) {
        console.error('Failed to fetch fleet vehicles:', error);
      }
    };

    const servicesWithVehicles = ['bus', 'truck', 'luxury', 'packers', 'car'];

    if (servicesWithVehicles.includes(serviceType) && booking) {
      const shouldFetch = showAssignForm || !booking.driverName;
      const statusAllowed = ['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status);

      if (shouldFetch && statusAllowed) {
        fetchFleet();
      }
    }
  }, [serviceType, booking, showAssignForm]);

  // Auto-select 'manual' when form opens and no staff is selected
  useEffect(() => {
    if (showAssignForm && !selectedStaff) {
      setSelectedStaff('manual');
    }
  }, [showAssignForm]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const handleAccept = async () => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
          try {
            setActionLoading(true);
            await acceptBooking(serviceType, bookingId);
            await fetchBooking();
            showSuccess('Booking accepted successfully');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to accept booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Accept' });
  };

  const handleReject = async () => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
          try {
            setActionLoading(true);
            await rejectBooking(serviceType, bookingId, 'Vendor rejected');
            await fetchBooking();
            showSuccess('Booking rejected');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Reject', destructive: true });
  };

  const handleAssignment = async () => {
    let assignmentData = {};

    if (serviceType === 'equipment') {
      const data = selectedStaff
        ? { operatorName: selectedStaff.name, operatorPhone: selectedStaff.phone }
        : manualInput;

      if (!data.operatorName || !data.operatorPhone) {
        showError('Please select an operator or enter details manually');
        return;
      }
      assignmentData = { operatorName: data.operatorName, operatorPhone: data.operatorPhone };
    } else {
      const data = selectedStaff
        ? {
            driverName: selectedStaff.name,
            driverPhone: selectedStaff.phone,
            vehicleNumber: manualInput.vehicleNumber,
            vehicleModel: manualInput.vehicleModel
          }
        : {
            driverName: manualInput.name,
            driverPhone: manualInput.phone,
            vehicleNumber: manualInput.vehicleNumber,
            vehicleModel: manualInput.vehicleModel
          };

      if (!data.driverName || !data.driverPhone) {
        showError('Please select a driver or enter details manually');
        return;
      }
      assignmentData = {
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        vehicleNumber: data.vehicleNumber || '',
        vehicleModel: data.vehicleModel || '',
      };
    }

    try {
      setActionLoading(true);
      await assignOperator(serviceType, bookingId, assignmentData);
      await fetchBooking();
      setShowAssignForm(false);
      setSelectedStaff(null);
      setSelectedVehicle(null);
      setManualInput({ name: '', phone: '', vehicleNumber: '', vehicleModel: '' });
      showSuccess(serviceType === 'equipment' ? 'Operator assigned successfully' : 'Driver assigned successfully');
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleCustomerCall = (phone, bookingId) => {
    if (!phone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType: 'car_rental_booking', bookingId, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${phone}`);
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId: booking.id,
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType: 'chauffeur',
    });
  };

  const handleStartTrip = async () => {
    if (!startTripOtp) {
      showError('Please enter the OTP provided by customer');
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch(`${await getBaseURL()}/api/vendor/${serviceType}-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSessionToken()}`
        },
        body: JSON.stringify({
          action: 'start_trip',
          otp: startTripOtp
        })
      });

      const response = await res.json();

      if (response.success) {
        await fetchBooking();
        setShowStartTripModal(false);
        setStartTripOtp('');
        showSuccess('Trip started successfully');
      } else {
        showError(response.error || 'Failed to start trip');
      }
    } catch (error) {
      showError(error?.message || 'Invalid OTP or failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!completeForm.endKmReading) {
      showError('Please enter end kilometer reading');
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch(`${await getBaseURL()}/api/vendor/${serviceType}-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getSessionToken()}`
        },
        body: JSON.stringify({
          action: 'end_trip',
          endKmReading: parseInt(completeForm.endKmReading) || 0,
          extraHours: parseInt(completeForm.extraHours) || 0,
          tollCharges: parseFloat(completeForm.tollCharges) || 0,
          parkingCharges: parseFloat(completeForm.parkingCharges) || 0,
        })
      });

      const response = await res.json();

      if (response.success) {
        await fetchBooking();
        setShowEndTripModal(false);
        setCompleteForm({
          endKmReading: '',
          extraHours: '0',
          tollCharges: '0',
          parkingCharges: '0',
        });
        showSuccess('Trip completed successfully');
      } else {
        showError(response.error || 'Failed to complete trip');
      }
    } catch (error) {
      showError(error?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
      return timeStr;
    }
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;
  };

  const canAccept = () => {
    const acceptableStatuses = ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'];
    return acceptableStatuses.includes(booking?.status);
  };

  const canReject = () => {
    const rejectableStatuses = ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'];
    return rejectableStatuses.includes(booking?.status);
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <MaterialCommunityIcons name="car" size={18} color={C.g400} />
              <Text style={styles.headerTitle}>Booking Detail</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </LinearGradient>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.g600} />
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Not found state ─── */
  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <MaterialCommunityIcons name="car" size={18} color={C.g400} />
              <Text style={styles.headerTitle}>Booking Detail</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={C.muted} />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      {/* Gradient Header */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <AnimatedOrb style={styles.decCircle1} />
        <AnimatedOrb style={styles.decCircle2} delay={1200} dx={-10} dy={8} />

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <MaterialCommunityIcons name="car" size={18} color={C.g400} />
            <Text style={styles.headerTitle}>Booking Detail</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCardTop}>
            <View>
              <Text style={styles.heroLabel}>BOOKING #</Text>
              <Text style={styles.heroNumber}>{booking.bookingNumber || String(booking.id).slice(-8)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '22', borderColor: statusConfig.color + '40' }]}>
              <Text style={[styles.statusPillTxt, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={styles.heroMetaTxt}>Created {formatDate(booking.createdAt)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} colors={[C.g600]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status progression: Payment Verified → Booking Confirmed → Driver Assigned → Pickup OTP → Trip in Progress → Trip Completed */}
        {(() => {
          const STAGE = {
            PENDING_PAYMENT: 0, PAYMENT_SUBMITTED: 0, PENDING_VENDOR: 0, BROADCASTED: 0,
            PAYMENT_VERIFIED: 1, ACCEPTED: 2, CONFIRMED: 2, DRIVER_ASSIGNED: 3,
            IN_PROGRESS: 5, COMPLETED: 6,
          };
          const curStage = STAGE[booking.status] ?? -1;
          const steps = [
            { key: 'verified', label: 'Verified', stage: 1 },
            { key: 'confirmed', label: 'Confirmed', stage: 2 },
            { key: 'assigned', label: 'Driver Assigned', stage: 3 },
            { key: 'otp', label: 'Pickup OTP', stage: 4 },
            { key: 'progress', label: 'In Progress', stage: 5 },
            { key: 'completed', label: 'Completed', stage: 6 },
          ].map(s => ({ ...s, done: curStage >= s.stage, current: curStage === s.stage }));
          return (
            <View style={styles.statusStrip}>
              {steps.map((stp, i) => (
                <React.Fragment key={stp.key}>
                  {i > 0 && <View style={[styles.statusLine, steps[i - 1].done && { backgroundColor: C.g500 }]} />}
                  <View style={[styles.statusStep, { width: 46 }]}>
                    <View style={[styles.statusDot, stp.done && styles.statusDotDone, stp.current && styles.statusDotCurrent]}>
                      {stp.done
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <Text style={[styles.statusDotNum, stp.current && { color: '#fff' }]}>{i + 1}</Text>}
                    </View>
                    <Text style={[styles.statusStepLbl, { fontSize: 8.5 }, (stp.done || stp.current) && { color: C.text, fontWeight: '700' }]}>{stp.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          );
        })()}

        {/* Vehicle & Trip */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="car" size={15} color={C.g700} />
            </View>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Vehicle & Trip</Text>
          </View>

          <View style={styles.vehicleBox}>
            <View style={styles.vehicleIconWrap}>
              <MaterialCommunityIcons name="car" size={34} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName} numberOfLines={2}>
                {booking.carCategoryName || booking.carCategory || 'Car'}
              </Text>
              {booking.tripType ? (
                <Text style={styles.vehicleSub}>
                  {(() => {
                    const t = booking.tripType?.toUpperCase();
                    if (t === 'LOCAL') return 'Local';
                    if (t === 'OUTSTATION_ONEWAY') return 'Outstation (One Way)';
                    if (t === 'OUTSTATION_ROUNDTRIP') return 'Outstation (Round Trip)';
                    if (t === 'AIRPORT_PICKUP') return 'Airport Pickup';
                    if (t === 'AIRPORT_DROP') return 'Airport Drop';
                    return booking.tripType;
                  })()}
                </Text>
              ) : null}
              {booking.vehicleNumber ? (
                <View style={styles.assignedBadge}>
                  <Ionicons name="car-outline" size={11} color={C.g600} />
                  <Text style={styles.assignedTxt}>{booking.vehicleNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.tripMetaRow}>
            <View style={styles.tripMetaItem}>
              <View style={[styles.tripMetaIcon, { backgroundColor: C.indigoL }]}>
                <Ionicons name="location" size={14} color={C.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripMetaLabel}>Pickup</Text>
                <Text style={styles.tripMetaValue} numberOfLines={1}>
                  {booking.pickupCity || booking.pickupAddress || booking.locationName || 'Not specified'}
                </Text>
              </View>
            </View>
            {(booking.dropCity || booking.dropAddress) ? (
              <View style={styles.tripMetaItem}>
                <View style={[styles.tripMetaIcon, { backgroundColor: C.redL }]}>
                  <Ionicons name="location" size={14} color={C.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripMetaLabel}>Drop</Text>
                  <Text style={styles.tripMetaValue} numberOfLines={1}>{booking.dropCity || booking.dropAddress}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.dateRow}>
            <View style={[styles.dateBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <View style={[styles.dateDot, { backgroundColor: C.blue }]} />
              <Text style={[styles.dateLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={styles.dateVal}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime ? <Text style={styles.dateTime}>{formatTime(booking.pickupTime)}</Text> : null}
            </View>
            {booking.returnDate ? (
              <View style={[styles.dateBox, { backgroundColor: C.redL, borderColor: C.red + '25' }]}>
                <View style={[styles.dateDot, { backgroundColor: C.red }]} />
                <Text style={[styles.dateLabel, { color: C.red }]}>RETURN</Text>
                <Text style={styles.dateVal}>{formatDate(booking.returnDate)}</Text>
              </View>
            ) : null}
          </View>

          {booking.passengers ? (
            <View style={styles.passengerChip}>
              <Ionicons name="people-outline" size={14} color={C.sub} />
              <Text style={styles.passengerText}>{booking.passengers} Passengers</Text>
            </View>
          ) : null}
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <Ionicons name="person" size={16} color={C.blue} />
            </View>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Customer Info</Text>
          </View>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Icon name="user" size={20} color={C.g700} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName || 'Customer'}</Text>
            </View>
            <View style={styles.customerActions}>
              {booking.customerPhone && (
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: '#F0FDFA', marginRight: 6 }]}
                  onPress={() => handleCustomerCall(booking.customerPhone, booking.id)}
                >
                  <Ionicons name="call" size={18} color="#0D9488" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: C.blueL }]}
                onPress={handleChat}
              >
                <Icon name="message-circle" size={18} color={C.blue} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: C.g50 }]}>
              <Ionicons name="card" size={16} color={C.g700} />
            </View>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Payment Summary</Text>
          </View>
          <View style={styles.paymentDetails}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentValue}>
                ₹{(booking.totalAmount || booking.amount || booking.baseAmount || 0).toLocaleString()}
              </Text>
            </View>

            {(booking.securityDeposit > 0) && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Security Deposit</Text>
                <Text style={[styles.paymentValue, { color: C.amber }]}>
                  ₹{booking.securityDeposit.toLocaleString()}
                </Text>
              </View>
            )}

            {((booking.advanceAmount || booking.advancePaid || booking.paidAmount || 0) > 0) && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Advance Paid</Text>
                <Text style={[styles.paymentValue, { color: C.g600 }]}>
                  ₹{(booking.advancePaid || booking.paidAmount || booking.advanceAmount || 0).toLocaleString()}
                </Text>
              </View>
            )}

            {(booking.balanceAmount > 0 ||
              (booking.totalAmount && (booking.advancePaid || booking.paidAmount) &&
               booking.totalAmount > (booking.advancePaid || booking.paidAmount || 0))) && (
              <View style={[styles.paymentRow, styles.paymentRowDivider]}>
                <Text style={[styles.paymentLabel, { fontWeight: '600' }]}>Remaining Balance</Text>
                <Text style={[styles.paymentValue, { color: C.amber, fontSize: 18, fontWeight: '700' }]}>
                  ₹{((booking.totalAmount || 0) - (booking.advancePaid || booking.paidAmount || 0)).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.paymentStatusContainer}>
              <View
                style={[
                  styles.paymentStatusBadge,
                  {
                    backgroundColor:
                      ((booking.advancePaid || booking.paidAmount || 0) >= (booking.totalAmount || 0))
                        ? C.g50
                        : ((booking.advancePaid || booking.paidAmount || 0) > 0)
                        ? C.amberL
                        : C.redL,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentStatusText,
                    {
                      color:
                        ((booking.advancePaid || booking.paidAmount || 0) >= (booking.totalAmount || 0))
                          ? C.g700
                          : ((booking.advancePaid || booking.paidAmount || 0) > 0)
                          ? C.amber
                          : C.red,
                    },
                  ]}
                >
                  {((booking.advancePaid || booking.paidAmount || 0) >= (booking.totalAmount || 0))
                    ? 'FULLY PAID'
                    : ((booking.advancePaid || booking.paidAmount || 0) > 0)
                    ? 'ADVANCE PAID'
                    : 'PAYMENT PENDING'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assignment Section */}
        {['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) &&
          (showAssignForm || !booking.driverName) && (
            <View style={styles.card}>
              <View style={styles.assignHeader}>
                <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Driver Assignment</Text>
                {!showAssignForm && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => setShowAssignForm(true)}
                  >
                    <Icon name="user-plus" size={15} color="#fff" />
                    <Text style={styles.assignButtonText}>Assign Driver</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!showAssignForm ? (
                <TouchableOpacity style={styles.assignBtnDashed} onPress={() => setShowAssignForm(true)}>
                  <Icon name="plus" size={15} color={C.blue} />
                  <Text style={styles.assignBtnDashedTxt}>Assign Driver</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.assignFormContainer}>
                  {/* Equipment - Simple Manual Input */}
                  {serviceType === 'equipment' ? (
                    <View style={styles.manualInputContainer}>
                      <Text style={styles.manualInputLabel}>Operator Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter operator name"
                        value={manualInput.name}
                        onChangeText={(text) => {
                          setManualInput({ ...manualInput, name: text });
                        }}
                      />

                      <Text style={[styles.manualInputLabel, { marginTop: 12 }]}>Phone Number *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        value={manualInput.phone}
                        onChangeText={(text) => {
                          setManualInput({ ...manualInput, phone: text });
                        }}
                      />
                    </View>
                  ) : (
                    <>
                      {/* Driver Dropdown Selection */}
                      <View>
                        <Text style={styles.manualInputLabel}>Select Driver *</Text>
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => setShowStaffDropdown(true)}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {selectedStaff === 'manual'
                              ? 'Enter Manually'
                              : selectedStaff
                              ? selectedStaff.name
                              : 'Select driver'}
                          </Text>
                          <Icon name="chevron-down" size={20} color={C.muted} />
                        </TouchableOpacity>
                      </View>

                      {/* Manual Input Fields for Driver */}
                      {selectedStaff === 'manual' && (
                        <View>
                          <Text style={[styles.manualInputLabel, { marginTop: 12 }]}>
                            Driver Name *
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="Enter driver name"
                            value={manualInput.name}
                            onChangeText={(text) => {
                              setManualInput({ ...manualInput, name: text });
                            }}
                          />

                          <Text style={[styles.manualInputLabel, { marginTop: 12 }]}>Phone Number *</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            value={manualInput.phone}
                            onChangeText={(text) => {
                              setManualInput({ ...manualInput, phone: text });
                            }}
                          />
                        </View>
                      )}

                      {/* Vehicle Selection */}
                      {selectedStaff && (
                        <View style={{ marginTop: 16 }}>
                          <Text style={styles.manualInputLabel}>Select Vehicle</Text>
                          <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setShowVehicleDropdown(true)}
                          >
                            <Text style={styles.dropdownButtonText}>
                              {selectedVehicle === 'manual'
                                ? 'Enter Manually'
                                : selectedVehicle
                                ? `${selectedVehicle.brands?.name || selectedVehicle.brand?.name || ''} ${selectedVehicle.vehicleCategory?.name || selectedVehicle.chauffeur_vehicle_categories?.name || ''} - ${selectedVehicle.registrationNumber || ''}`
                                : 'Select vehicle from fleet'}
                            </Text>
                            <Icon name="chevron-down" size={20} color={C.muted} />
                          </TouchableOpacity>

                          {/* Manual Vehicle Input Fields */}
                          {(selectedVehicle === 'manual' || !selectedVehicle || fleetVehicles.length === 0) && (
                            <>
                              <Text style={[styles.manualInputLabel, { marginTop: 12 }]}>
                                Vehicle Number
                              </Text>
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g., DL 01 AB 1234"
                                value={manualInput.vehicleNumber}
                                onChangeText={(text) =>
                                  setManualInput({ ...manualInput, vehicleNumber: text })
                                }
                              />

                              <Text style={[styles.manualInputLabel, { marginTop: 12 }]}>
                                Vehicle Model (Optional)
                              </Text>
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g., Maruti Dzire"
                                value={manualInput.vehicleModel}
                                onChangeText={(text) =>
                                  setManualInput({ ...manualInput, vehicleModel: text })
                                }
                              />
                            </>
                          )}
                        </View>
                      )}

                      {/* Staff Selection Modal */}
                      <Modal
                        visible={showStaffDropdown}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowStaffDropdown(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                              <Text style={styles.modalTitle}>
                                Select {serviceType === 'equipment' ? 'Operator' : 'Driver'}
                              </Text>
                              <TouchableOpacity onPress={() => setShowStaffDropdown(false)}>
                                <Icon name="x" size={24} color={C.text} />
                              </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalList}>
                              {staffList.length > 0 ? (
                                <>
                                  {staffList.map((staff) => (
                                    <TouchableOpacity
                                      key={staff.id}
                                      style={styles.modalItem}
                                      onPress={() => {
                                        setSelectedStaff(staff);
                                        setManualInput({
                                          name: staff.name,
                                          phone: staff.phone,
                                          vehicleNumber: manualInput.vehicleNumber,
                                          vehicleModel: manualInput.vehicleModel
                                        });
                                        setShowStaffDropdown(false);
                                      }}
                                    >
                                      <View>
                                        <Text style={styles.modalItemName}>{staff.name}</Text>
                                        <Text style={styles.modalItemPhone}>{staff.phone}</Text>
                                      </View>
                                      {selectedStaff?.id === staff.id && (
                                        <Icon name="check" size={20} color={C.g600} />
                                      )}
                                    </TouchableOpacity>
                                  ))}
                                </>
                              ) : null}

                              <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                  setSelectedStaff('manual');
                                  setManualInput({ name: '', phone: '', vehicleNumber: '', vehicleModel: '' });
                                  setShowStaffDropdown(false);
                                }}
                              >
                                <View>
                                  <Text style={styles.modalItemName}>Enter Manually</Text>
                                  <Text style={styles.modalItemPhone}>Add custom details</Text>
                                </View>
                                {selectedStaff === 'manual' && (
                                  <Icon name="check" size={20} color={C.g600} />
                                )}
                              </TouchableOpacity>
                            </ScrollView>
                          </View>
                        </View>
                      </Modal>

                      {/* Vehicle Selection Modal */}
                      <Modal
                        visible={showVehicleDropdown}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowVehicleDropdown(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                              <Text style={styles.modalTitle}>Select Vehicle</Text>
                              <TouchableOpacity onPress={() => setShowVehicleDropdown(false)}>
                                <Icon name="x" size={24} color={C.text} />
                              </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalList}>
                              {fleetVehicles.length > 0 ? (
                                <>
                                  {fleetVehicles.map((vehicle) => (
                                    <TouchableOpacity
                                      key={vehicle.id}
                                      style={[styles.modalItem, !vehicle.isAvailable && styles.modalItemDisabled]}
                                      onPress={() => {
                                        if (vehicle.isAvailable) {
                                          setSelectedVehicle(vehicle);
                                          const brandName = vehicle.brands?.name || vehicle.brand?.name;
                                          const categoryName = vehicle.vehicleCategory?.name || vehicle.chauffeur_vehicle_categories?.name;
                                          const vehicleModel = brandName
                                            ? `${brandName} ${categoryName || ''}`
                                            : categoryName || '';
                                          setManualInput({
                                            ...manualInput,
                                            vehicleNumber: vehicle.registrationNumber || '',
                                            vehicleModel: vehicleModel.trim(),
                                          });
                                          setShowVehicleDropdown(false);
                                        }
                                      }}
                                      disabled={!vehicle.isAvailable}
                                    >
                                      <View>
                                        <Text style={[styles.modalItemName, !vehicle.isAvailable && styles.modalItemTextDisabled]}>
                                          {vehicle.brands?.name || vehicle.brand?.name} {vehicle.vehicleCategory?.name || vehicle.chauffeur_vehicle_categories?.name}
                                        </Text>
                                        <Text style={styles.modalItemPhone}>
                                          {vehicle.registrationNumber || 'No registration'}
                                          {(vehicle.vehicleCategory?.seatingCapacity || vehicle.chauffeur_vehicle_categories?.seatingCapacity) ? ` • ${vehicle.vehicleCategory?.seatingCapacity || vehicle.chauffeur_vehicle_categories?.seatingCapacity} Seater` : ''}
                                          {!vehicle.isAvailable ? ' • Unavailable' : ''}
                                        </Text>
                                      </View>
                                      {selectedVehicle?.id === vehicle.id && (
                                        <Icon name="check" size={20} color={C.g600} />
                                      )}
                                    </TouchableOpacity>
                                  ))}
                                </>
                              ) : null}

                              <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                  setSelectedVehicle('manual');
                                  setManualInput({ ...manualInput, vehicleNumber: '', vehicleModel: '' });
                                  setShowVehicleDropdown(false);
                                }}
                              >
                                <View>
                                  <Text style={styles.modalItemName}>Enter Manually</Text>
                                  <Text style={styles.modalItemPhone}>Add custom vehicle details</Text>
                                </View>
                                {selectedVehicle === 'manual' && (
                                  <Icon name="check" size={20} color={C.g600} />
                                )}
                              </TouchableOpacity>
                            </ScrollView>
                          </View>
                        </View>
                      </Modal>
                    </>
                  )}

                  <View style={styles.assignFormActions}>
                    <TouchableOpacity
                      style={[styles.formButton, styles.cancelButton]}
                      onPress={() => {
                        setShowAssignForm(false);
                        setSelectedStaff(null);
                        setSelectedVehicle(null);
                        setManualInput({ name: '', phone: '', vehicleNumber: '', vehicleModel: '' });
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.formButton, styles.submitButton]}
                      onPress={handleAssignment}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {booking.driverName || booking.operatorName ? 'Update' : 'Assign'}{' '}
                          {serviceType === 'equipment' ? 'Operator' : 'Driver'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

        {/* Driver/Vehicle Info (if assigned) */}
        {booking.driverName && !showAssignForm && (
          <View style={styles.card}>
            <View style={styles.assignHeader}>
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Driver Details</Text>
              {!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status) && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setManualInput({
                      name: booking.driverName || '',
                      phone: booking.driverPhone || '',
                      vehicleNumber: booking.vehicleNumber || '',
                      vehicleModel: booking.vehicleModel || '',
                    });
                    setSelectedStaff('manual');
                    setSelectedVehicle('manual');
                    setShowAssignForm(true);
                  }}
                >
                  <Icon name="edit-2" size={15} color={C.g700} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.assignedRow}>
              <View style={styles.assignAvatar}>
                <Icon name="user" size={20} color={C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignedName}>{booking.driverName}</Text>
                <Text style={styles.assignedSub}>{booking.driverPhone}</Text>
                {booking.vehicleNumber && (
                  <Text style={styles.assignedSub}>
                    Vehicle: {booking.vehicleNumber}
                    {booking.vehicleModel && ` (${booking.vehicleModel})`}
                  </Text>
                )}
              </View>
              {booking.driverPhone && (
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: C.g50 }]}
                  onPress={() => handleCall(booking.driverPhone)}
                >
                  <Icon name="phone" size={18} color={C.g700} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Trip Control */}
        {(booking.status === 'DRIVER_ASSIGNED' || booking.status === 'IN_PROGRESS') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: C.purpleL }]}>
                <Ionicons name="key" size={16} color={C.purple} />
              </View>
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Trip Control</Text>
            </View>

            {booking.status === 'DRIVER_ASSIGNED' && (
              <View>
                <Text style={styles.tripDesc}>Enter the OTP shared with the customer to start the trip.</Text>
                <View style={[styles.otpInputWrap, startTripOtp.length === 6 && { borderColor: C.purple }]}>
                  <Icon name="key" size={17} color={startTripOtp.length === 6 ? C.purple : C.muted} />
                  <TextInput
                    style={styles.otpInput}
                    value={startTripOtp}
                    onChangeText={(t) => setStartTripOtp(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    placeholderTextColor={C.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: startTripOtp.length === 6 ? C.g600 : C.muted }]}
                  onPress={handleStartTrip}
                  disabled={actionLoading || startTripOtp.length !== 6}
                >
                  {actionLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<><Ionicons name="play-circle" size={17} color="#fff" /><Text style={styles.ctaTxt}>Start Trip</Text></>)}
                </TouchableOpacity>
              </View>
            )}

            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[styles.infoAlert, { backgroundColor: C.purpleL, borderColor: C.purple + '20' }]}>
                  <Ionicons name="car" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoAlertTitle, { color: C.purple }]}>Trip is in progress</Text>
                    <Text style={styles.infoAlertDesc}>When the trip ends, complete it below.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: C.red }]}
                  onPress={() => setShowEndTripModal(true)}
                  disabled={actionLoading}
                >
                  <Icon name="stop-circle" size={17} color="#fff" />
                  <Text style={styles.ctaTxt}>End Trip & Complete Booking</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Completed */}
        {booking.status === 'COMPLETED' && (
          <View style={[styles.card, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <LinearGradient colors={[C.g800, C.g500]} style={styles.trophyRing}>
                <Ionicons name="trophy" size={36} color="#fff" />
              </LinearGradient>
              <Text style={styles.completedTitle}>Trip Completed!</Text>
              <Text style={styles.completedDesc}>This booking has been successfully completed.</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {(booking.notes || booking.customerNotes) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes || booking.customerNotes}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Accept/Reject Action Bar */}
      {(canAccept() || canReject()) && (
        <View style={styles.actionBar}>
          {canReject() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Icon name="x" size={18} color={C.red} />
              <Text style={[styles.actionBtnText, { color: C.red }]}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Accept Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* End Trip Modal */}
      <Modal
        visible={showEndTripModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndTripModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.completeModalOverlay}>
          <View style={styles.completeModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalTitleIconBox}>
                  <Icon name="check-circle" size={18} color={C.g700} />
                </View>
                <Text style={styles.modalTitle}>Complete Trip</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEndTripModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.otpModalDescription}>
                Enter trip details to complete the journey
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.manualInputLabel}>End KM Reading *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter odometer reading"
                  value={completeForm.endKmReading}
                  onChangeText={(text) => setCompleteForm({ ...completeForm, endKmReading: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.manualInputLabel}>Extra Hours</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  value={completeForm.extraHours}
                  onChangeText={(text) => setCompleteForm({ ...completeForm, extraHours: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={styles.manualInputLabel}>Toll Charges (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  value={completeForm.tollCharges}
                  onChangeText={(text) => setCompleteForm({ ...completeForm, tollCharges: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={styles.manualInputLabel}>Parking Charges (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  value={completeForm.parkingCharges}
                  onChangeText={(text) => setCompleteForm({ ...completeForm, parkingCharges: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.otpModalActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEndTripModal(false);
                    setCompleteForm({
                      endKmReading: '',
                      extraHours: '0',
                      tollCharges: '0',
                      parkingCharges: '0',
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton, { flex: 1 }]}
                  onPress={handleEndTrip}
                  disabled={actionLoading || !completeForm.endKmReading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Complete Trip</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.g900 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.bg },
  emptyText: { fontSize: 16, color: C.muted, fontWeight: '500' },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    right: 20,
  },
  decCircle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 50,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  heroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: rs(16), padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  heroCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  heroLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroNumber: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroMeta: { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  scrollView: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16 },

  /* Status progression strip */
  statusStrip: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12 },
  statusStep: { alignItems: 'center', width: 66 },
  statusLine: { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11 },
  statusDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusDotDone: { backgroundColor: C.g600, borderColor: C.g600 },
  statusDotCurrent: { backgroundColor: C.blue, borderColor: C.blue },
  statusDotNum: { fontSize: 11, fontWeight: '800', color: C.muted },
  statusStepLbl: { fontSize: 10, fontWeight: '600', color: C.muted, textAlign: 'center' },

  /* Card */
  card: {
    backgroundColor: C.card,
    borderRadius: rs(16),
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.g100,
  },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12 },

  /* Vehicle box */
  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, backgroundColor: C.g50,
    borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  vehicleName:     { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 12, color: C.sub },
  assignedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7, alignSelf: 'flex-start', backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  assignedTxt:     { fontSize: 11, fontWeight: '600', color: C.g700 },

  /* Trip meta (pickup/drop) */
  tripMetaRow:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripMetaItem:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripMetaIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tripMetaLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tripMetaValue: { fontSize: 13, fontWeight: '700', color: C.text },

  /* Dates */
  dateRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 11, color: C.sub, fontWeight: '500' },

  passengerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  passengerText: { fontSize: 13, color: C.sub, fontWeight: '600' },

  /* Customer */
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerContact: { fontSize: 13, color: C.muted, marginBottom: 2 },
  customerEmail: { fontSize: 12, color: C.muted },
  customerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  /* Payment */
  paymentDetails: { gap: 10 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  paymentRowDivider: {
    borderTopWidth: 1, borderTopColor: C.border, marginTop: 8, paddingTop: 12,
  },
  paymentLabel: { fontSize: 14, color: C.muted },
  paymentValue: { fontSize: 15, fontWeight: '700', color: C.text },
  paymentStatusContainer: { alignItems: 'center', marginTop: 8 },
  paymentStatusBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  paymentStatusText: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
  },

  /* Assigned driver/vehicle row */
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  assignedName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  assignedSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  /* Trip Control */
  tripDesc: { fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 19 },
  otpInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, borderColor: C.border, borderRadius: rs(14), backgroundColor: C.bg, marginBottom: 14 },
  otpInput: { flex: 1, fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: C.text },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(14), marginBottom: 10 },
  ctaTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  infoAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: rs(12), borderWidth: 1, marginBottom: 14 },
  infoAlertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoAlertDesc: { fontSize: 12, color: C.sub, lineHeight: 16 },

  /* Completed */
  trophyRing: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc: { fontSize: 13, color: C.sub, textAlign: 'center' },

  notesText: { fontSize: 14, color: C.text, lineHeight: 20 },

  /* Action Bar */
  actionBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: rs(12), borderWidth: 1,
  },
  rejectBtn: { backgroundColor: C.card, borderColor: C.redL },
  acceptBtn: { backgroundColor: C.g700, borderColor: C.g700 },
  actionBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800' },

  /* Assignment */
  assignHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  assignButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.g700, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  assignButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: C.g100,
  },
  editButtonText: { fontSize: 12, fontWeight: '600', color: C.g700 },
  assignBtnDashed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: rs(12), borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.blue + '60', backgroundColor: 'transparent' },
  assignBtnDashedTxt: { fontSize: 13, fontWeight: '700', color: C.blue },
  assignFormContainer: { gap: 16 },

  /* Form */
  manualInputContainer: { gap: 8 },
  manualInputLabel: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 4 },
  textInput: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: C.text,
  },
  assignFormActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  formButton: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: C.text },
  submitButton: { backgroundColor: C.g700 },
  submitButtonText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginTop: 6,
  },
  dropdownButtonText: { fontSize: 14, color: C.text, flex: 1 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '80%', paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitleIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  modalTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text },
  modalList: { paddingHorizontal: 20 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalItemDisabled: { opacity: 0.5 },
  modalItemName: { fontSize: 15, fontWeight: '500', color: C.text, marginBottom: 2 },
  modalItemPhone: { fontSize: 13, color: C.muted },
  modalItemTextDisabled: { color: C.muted },

  /* Complete trip modal */
  completeModalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  completeModalContent: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '85%', paddingHorizontal: 20, paddingBottom: 20,
  },
  otpModalDescription: { fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 20 },
  otpModalActions: { flexDirection: 'row', gap: 12 },
});
