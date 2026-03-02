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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#22C55E',
};

// Status configurations for different booking types
const STATUS_CONFIG = {
  // Common statuses
  PENDING_PAYMENT: { color: C.amber, bg: '#FEF3C7', label: 'Awaiting Payment' },
  PAYMENT_SUBMITTED: { color: C.orange, bg: '#FED7AA', label: 'Payment Review' },
  PAYMENT_VERIFIED: { color: C.green, bg: '#D1FAE5', label: 'Payment Verified' },
  PENDING_VENDOR: { color: C.orange, bg: '#FEF3C7', label: 'Pending' },
  BROADCASTED: { color: C.blue, bg: '#DBEAFE', label: 'Open' },
  ACCEPTED: { color: C.green, bg: '#DCFCE7', label: 'Accepted' },
  IN_PROGRESS: { color: C.purple, bg: '#F3E8FF', label: 'In Progress' },
  COMPLETED: { color: C.muted, bg: '#F3F4F6', label: 'Completed' },
  CANCELLED: { color: C.red, bg: '#FEE2E2', label: 'Cancelled' },

  // Bus/Truck/Packers statuses
  ADVANCE_PAID: { color: C.green, bg: '#DCFCE7', label: 'Booking Confirmed' },
  CONFIRMED: { color: C.green, bg: '#DCFCE7', label: 'Confirmed' },
  VEHICLE_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Vehicle Assigned' },
  TEAM_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Team Assigned' },
  DRIVER_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Driver Assigned' },
  EQUIPMENT_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Equipment Assigned' },

  // Equipment statuses
  DISPATCHED: { color: C.orange, bg: '#FED7AA', label: 'Dispatched' },
  DELIVERED: { color: C.amber, bg: '#FEF3C7', label: 'Delivered' },
  ON_RENT: { color: C.purple, bg: '#F3E8FF', label: 'On Rent' },
  IN_USE: { color: C.purple, bg: '#F3E8FF', label: 'In Use' },
  PICKUP_SCHEDULED: { color: C.orange, bg: '#FED7AA', label: 'Pickup Scheduled' },
  RETURNED: { color: C.green, bg: '#DCFCE7', label: 'Returned' },

  // Truck/Packers specific
  LOADING: { color: C.orange, bg: '#FED7AA', label: 'Loading' },
  IN_TRANSIT: { color: C.blue, bg: '#DBEAFE', label: 'In Transit' },
  UNLOADING: { color: C.purple, bg: '#F3E8FF', label: 'Unloading' },
  PACKING: { color: C.orange, bg: '#FED7AA', label: 'Packing' },
  UNPACKING: { color: C.purple, bg: '#F3E8FF', label: 'Unpacking' },
};

// Service-specific progress steps
const SERVICE_PROGRESS_STEPS = {
  equipment: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ADVANCE_PAID', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'CONFIRMED', label: 'Operator Assigned', icon: 'user-check' },
    { status: 'DISPATCHED', label: 'Ready for Delivery', icon: 'truck' },
    { status: 'DELIVERED', label: 'Equipment Delivered', icon: 'package' },
    { status: 'ON_RENT', label: 'In Use', icon: 'tool' },
    { status: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', icon: 'calendar' },
    { status: 'RETURNED', label: 'Equipment Returned', icon: 'check' },
    { status: 'COMPLETED', label: 'Rental Completed', icon: 'check-circle' },
  ],
  bike: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ACCEPTED', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: 'clock' },
    { status: 'IN_PROGRESS', label: 'In Use', icon: 'activity' },
    { status: 'COMPLETED', label: 'Trip Completed', icon: 'check-circle' },
  ],
  car: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ACCEPTED', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'DRIVER_ASSIGNED', label: 'Driver Assigned', icon: 'user-check' },
    { status: 'IN_PROGRESS', label: 'Trip in Progress', icon: 'navigation' },
    { status: 'COMPLETED', label: 'Trip Completed', icon: 'check-circle' },
  ],
  'self-drive': [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ACCEPTED', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: 'clock' },
    { status: 'IN_PROGRESS', label: 'In Use', icon: 'activity' },
    { status: 'COMPLETED', label: 'Trip Completed', icon: 'check-circle' },
  ],
  luxury: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ADVANCE_PAID', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'CONFIRMED', label: 'Driver Assigned', icon: 'user-check' },
    { status: 'IN_PROGRESS', label: 'Trip in Progress', icon: 'navigation' },
    { status: 'COMPLETED', label: 'Trip Completed', icon: 'check-circle' },
  ],
  bus: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ADVANCE_PAID', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'CONFIRMED', label: 'Vehicle Assigned', icon: 'check' },
    { status: 'VEHICLE_ASSIGNED', label: 'Driver Assigned', icon: 'user-check' },
    { status: 'IN_PROGRESS', label: 'Trip in Progress', icon: 'navigation' },
    { status: 'COMPLETED', label: 'Trip Completed', icon: 'check-circle' },
  ],
  truck: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ADVANCE_PAID', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'CONFIRMED', label: 'Vehicle Assigned', icon: 'check' },
    { status: 'VEHICLE_ASSIGNED', label: 'Driver Assigned', icon: 'user-check' },
    { status: 'LOADING', label: 'Loading', icon: 'upload' },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: 'navigation' },
    { status: 'UNLOADING', label: 'Unloading', icon: 'download' },
    { status: 'COMPLETED', label: 'Delivery Completed', icon: 'check-circle' },
  ],
  packers: [
    { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: 'check-circle' },
    { status: 'ADVANCE_PAID', label: 'Booking Confirmed', icon: 'check-circle' },
    { status: 'CONFIRMED', label: 'Team Assigned', icon: 'users' },
    { status: 'PACKING', label: 'Packing', icon: 'package' },
    { status: 'LOADING', label: 'Loading', icon: 'upload' },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: 'navigation' },
    { status: 'UNLOADING', label: 'Unloading', icon: 'download' },
    { status: 'UNPACKING', label: 'Unpacking', icon: 'box' },
    { status: 'COMPLETED', label: 'Move Completed', icon: 'check-circle' },
  ],
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
      console.log('[BookingDetail] Fetching booking:', { serviceType, bookingId });
      const response = await getBookingById(serviceType, bookingId);
      console.log('[BookingDetail] Response:', JSON.stringify(response, null, 2));
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[BookingDetail] Error fetching booking:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to load booking details';
      Alert.alert('Error', errorMsg);
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

    // Services that need assignment
    const servicesWithAssignment = ['equipment', 'bus', 'truck', 'luxury', 'packers', 'car'];

    if (servicesWithAssignment.includes(serviceType) && booking) {
      // Check if assignment form is shown OR if assignment is needed
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
          // Filter vehicles by service type
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

          // Log each vehicle's service slug
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

    // Services that need vehicle assignment (not equipment)
    const servicesWithVehicles = ['bus', 'truck', 'luxury', 'packers', 'car'];

    if (servicesWithVehicles.includes(serviceType) && booking) {
      // Fetch if form is shown OR if driver not assigned
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
    Alert.alert('Accept Booking', 'Are you sure you want to accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setActionLoading(true);
            await acceptBooking(serviceType, bookingId);
            await fetchBooking();
            Alert.alert('Success', 'Booking accepted successfully');
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.error || 'Failed to accept booking');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await rejectBooking(serviceType, bookingId, 'Vendor rejected');
            await fetchBooking();
            Alert.alert('Success', 'Booking rejected');
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAssignment = async () => {
    // Prepare data based on service type
    let assignmentData = {};

    if (serviceType === 'equipment') {
      // Equipment → Operator assignment
      const data = selectedStaff
        ? { operatorName: selectedStaff.name, operatorPhone: selectedStaff.phone }
        : manualInput;

      if (!data.operatorName || !data.operatorPhone) {
        Alert.alert('Error', 'Please select an operator or enter details manually');
        return;
      }
      assignmentData = { operatorName: data.operatorName, operatorPhone: data.operatorPhone };
    } else {
      // Other services → Driver assignment
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
        Alert.alert('Error', 'Please select a driver or enter details manually');
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
      Alert.alert(
        'Success',
        serviceType === 'equipment' ? 'Operator assigned successfully' : 'Driver assigned successfully'
      );
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
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
      Alert.alert('Error', 'Please enter the OTP provided by customer');
      return;
    }

    try {
      setActionLoading(true);

      // Use the correct API endpoint for start trip
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
        Alert.alert('Success', 'Trip started successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to start trip');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Invalid OTP or failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!completeForm.endKmReading) {
      Alert.alert('Error', 'Please enter end kilometer reading');
      return;
    }

    try {
      setActionLoading(true);

      // Use the correct API endpoint for end trip
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
        Alert.alert('Success', 'Trip completed successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to complete trip');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to complete trip');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking #{booking.bookingNumber || booking.id}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header Card */}
        <View style={styles.statusHeaderCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              <Text style={styles.createdDate}>
                Created on {formatDate(booking.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle/Equipment/Service Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name={getServiceIcon(serviceType)}
              size={24}
              color={C.brand}
            />
            <Text style={styles.cardTitle}>{getServiceTitle(booking, serviceType)}</Text>
          </View>

          {/* Service specific details */}
          {renderServiceDetails(booking, serviceType)}
        </View>

        {/* Location/Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>

          <View style={styles.tripLocations}>
            {/* Pickup Location */}
            <View style={styles.locationItem}>
              <View style={[styles.locationDot, { backgroundColor: C.brand }]} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>
                  {serviceType === 'equipment' ? 'Delivery Location' : 'Pickup Location'}
                </Text>
                <Text style={styles.locationText}>
                  {booking.pickupLocation || booking.pickupAddress || booking.pickupCity ||
                   booking.deliveryCity || booking.locationName || 'Not specified'}
                </Text>
                {booking.pickupAddress && booking.pickupCity && (
                  <Text style={styles.locationSubtext}>{booking.pickupCity}</Text>
                )}
              </View>
            </View>

            {/* Drop Location */}
            {(booking.dropLocation || booking.dropAddress || booking.dropCity) && (
              <View style={styles.locationItem}>
                <View style={[styles.locationDot, { backgroundColor: C.red }]} />
                <View style={styles.locationContent}>
                  <Text style={styles.locationLabel}>Drop Location</Text>
                  <Text style={styles.locationText}>
                    {booking.dropLocation || booking.dropAddress || booking.dropCity}
                  </Text>
                  {booking.dropAddress && booking.dropCity && (
                    <Text style={styles.locationSubtext}>{booking.dropCity}</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Date and Time Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={16} color={C.muted} />
              <Text style={styles.detailLabel}>
                {serviceType === 'equipment' ? 'Start Date' : 'Pickup Date'}
              </Text>
              <Text style={styles.detailValue}>
                {formatDate(booking.pickupDate || booking.startDate || booking.scheduledDate)}
              </Text>
            </View>

            {booking.pickupTime && (
              <View style={styles.detailItem}>
                <Icon name="clock" size={16} color={C.muted} />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(booking.pickupTime || booking.startTime)}
                </Text>
              </View>
            )}

            {(booking.dropDate || booking.returnDate || booking.endDate) && (
              <View style={styles.detailItem}>
                <Icon name="calendar" size={16} color={C.muted} />
                <Text style={styles.detailLabel}>
                  {serviceType === 'equipment' ? 'End Date' : 'Return Date'}
                </Text>
                <Text style={styles.detailValue}>
                  {formatDate(booking.dropDate || booking.returnDate || booking.endDate)}
                </Text>
              </View>
            )}

            {(booking.totalDays || booking.tripDays || booking.rentalDays) && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar-range" size={16} color={C.muted} />
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {booking.totalDays || booking.tripDays || booking.rentalDays} days
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Info</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Icon name="user" size={20} color={C.blue} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName || 'Customer'}</Text>
            </View>
            <View style={styles.customerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={handleChat}
              >
                <Icon name="message-circle" size={18} color={C.blue} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
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
                <Text style={[styles.paymentValue, { color: C.green }]}>
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
                        ? '#DCFCE7'
                        : ((booking.advancePaid || booking.paidAmount || 0) > 0)
                        ? '#FEF3C7'
                        : '#FEE2E2',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paymentStatusText,
                    {
                      color:
                        ((booking.advancePaid || booking.paidAmount || 0) >= (booking.totalAmount || 0))
                          ? '#166534'
                          : ((booking.advancePaid || booking.paidAmount || 0) > 0)
                          ? '#92400E'
                          : '#991B1B',
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

        {/* Assignment Section - Operator for Equipment, Driver for others, None for Bike/Self-Drive */}
        {['equipment', 'bus', 'truck', 'luxury', 'packers', 'car'].includes(serviceType) &&
          ['ADVANCE_PAID', 'CONFIRMED', 'ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) &&
          (showAssignForm ||
           (serviceType === 'equipment' && !booking.operatorName) ||
           (serviceType !== 'equipment' && !booking.driverName)) && (
            <View style={styles.card}>
              <View style={styles.assignHeader}>
                <Text style={styles.cardTitle}>
                  {serviceType === 'equipment' ? 'Operator Assignment' : 'Driver Assignment'}
                </Text>
                {!showAssignForm && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => setShowAssignForm(true)}
                  >
                    <Icon name="user-plus" size={16} color="#fff" />
                    <Text style={styles.assignButtonText}>
                      Assign {serviceType === 'equipment' ? 'Operator' : 'Driver'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {!showAssignForm ? (
                <View style={styles.notAssignedContainer}>
                  <Icon name="alert-circle" size={40} color={C.muted} />
                  <Text style={styles.notAssignedText}>
                    No {serviceType === 'equipment' ? 'operator' : 'driver'} assigned yet
                  </Text>
                  <Text style={styles.notAssignedSubtext}>
                    Please assign {serviceType === 'equipment' ? 'an operator' : 'a driver'} to proceed
                  </Text>
                </View>
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
                      {/* Driver/Operator Dropdown Selection */}
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

                      {/* Vehicle Selection for Driver Assignment */}
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
                                    <Icon name="check" size={20} color={C.brand} />
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
                              <Icon name="check" size={20} color={C.brand} />
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
                                    <Icon name="check" size={20} color={C.brand} />
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
                              <Icon name="check" size={20} color={C.brand} />
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
                          {booking.driverName || booking.operatorName ? 'Update' : 'Assign'} {serviceType === 'equipment' ? 'Operator' : 'Driver'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

        {/* Status Progress Tracker */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.progressHeader}
            onPress={() => setShowStatusProgress(!showStatusProgress)}
            activeOpacity={0.7}
          >
            <View style={styles.progressHeaderLeft}>
              <Icon name="activity" size={20} color={C.brand} />
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                {serviceType === 'equipment' ? 'Rental Progress' : 'Booking Progress'}
              </Text>
            </View>
            <Icon
              name={showStatusProgress ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={C.muted}
            />
          </TouchableOpacity>

          {showStatusProgress && (
            <View style={styles.progressStepsContainer}>
              {getProgressSteps(serviceType, booking.status).map((step, index) => (
                <View key={index} style={styles.progressStepWrapper}>
                  <View style={styles.progressStep}>
                    {/* Step Icon/Indicator */}
                    <View style={styles.stepIconContainer}>
                      <View
                        style={[
                          styles.stepIconCircle,
                          step.isCompleted && styles.stepIconCircleCompleted,
                          step.isCurrent && styles.stepIconCircleCurrent,
                        ]}
                      >
                        {step.isCompleted ? (
                          <Icon name="check" size={14} color="#fff" />
                        ) : (
                          <View
                            style={[
                              styles.stepIconDot,
                              step.isCurrent && styles.stepIconDotCurrent,
                            ]}
                          />
                        )}
                      </View>

                      {/* Connector Line */}
                      {index < getProgressSteps(serviceType, booking.status).length - 1 && (
                        <View
                          style={[
                            styles.stepConnector,
                            step.isCompleted && styles.stepConnectorCompleted,
                          ]}
                        />
                      )}
                    </View>

                    {/* Step Content */}
                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepLabel,
                          step.isCompleted && styles.stepLabelCompleted,
                          step.isCurrent && styles.stepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {step.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                      {step.isCompleted && !step.isCurrent && (
                        <Icon name="check-circle" size={14} color={C.green} />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Driver/Operator Info (if assigned) */}
        {(booking.driverName || booking.operatorName) && !showAssignForm && (
          <View style={styles.card}>
            <View style={styles.assignHeader}>
              <Text style={styles.cardTitle}>
                {booking.driverName ? 'Driver Details' : 'Operator Details'}
              </Text>
              {/* Only show edit button if booking is not in progress/completed/cancelled */}
              {!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status) && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    // Pre-fill form with existing data
                    setManualInput({
                      name: booking.driverName || booking.operatorName || '',
                      phone: booking.driverPhone || booking.operatorPhone || '',
                      vehicleNumber: booking.vehicleNumber || '',
                      vehicleModel: booking.vehicleModel || '',
                    });
                    setSelectedStaff('manual');
                    setSelectedVehicle('manual');
                    setShowAssignForm(true);
                  }}
                >
                  <Icon name="edit-2" size={16} color={C.blue} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Icon name="user" size={20} color={C.blue} />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>
                  {booking.driverName || booking.operatorName}
                </Text>
                <Text style={styles.driverPhone}>
                  {booking.driverPhone || booking.operatorPhone}
                </Text>
                {booking.vehicleNumber && (
                  <Text style={styles.vehicleNumber}>
                    Vehicle: {booking.vehicleNumber}
                    {booking.vehicleModel && ` (${booking.vehicleModel})`}
                  </Text>
                )}
              </View>
              {(booking.driverPhone || booking.operatorPhone) && (
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: '#DCFCE7' }]}
                  onPress={() => handleCall(booking.driverPhone || booking.operatorPhone)}
                >
                  <Icon name="phone" size={18} color={C.green} />
                </TouchableOpacity>
              )}
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

        {/* Trip Management Actions - For Car Rental */}
        {serviceType === 'car' && (
          <>
            {/* End Trip Button */}
            {booking.status === 'IN_PROGRESS' && (
              <View style={styles.card}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.endTripButton]}
                  onPress={() => setShowEndTripModal(true)}
                  disabled={actionLoading}
                >
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete Trip</Text>
                </TouchableOpacity>
                <Text style={styles.otpHintText}>
                  Enter trip details to complete the journey
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

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
        <View style={styles.completeModalOverlay}>
          <View style={styles.completeModalContent}>
            <View style={styles.otpModalHeader}>
              <Text style={styles.otpModalTitle}>Complete Trip</Text>
              <TouchableOpacity onPress={() => setShowEndTripModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.otpModalDescription}>
                Enter trip details to complete the journey
              </Text>

              {/* End KM Reading */}
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

              {/* Extra Hours */}
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

              {/* Toll Charges */}
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

              {/* Parking Charges */}
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
      </Modal>
    </SafeAreaView>
  );
}

// Helper function to get progress steps for current service and status
function getProgressSteps(serviceType, currentStatus) {
  const steps = SERVICE_PROGRESS_STEPS[serviceType] || SERVICE_PROGRESS_STEPS.car;
  const currentIndex = steps.findIndex((step) => step.status === currentStatus);

  return steps.map((step, index) => ({
    ...step,
    isCompleted: index <= currentIndex,
    isCurrent: index === currentIndex,
    isPending: index > currentIndex,
  }));
}

// Helper function to get service icon
function getServiceIcon(serviceType) {
  const icons = {
    bike: 'motorbike',
    car: 'car',
    'self-drive': 'car-side',
    luxury: 'car-sports',
    bus: 'bus',
    truck: 'truck-delivery',
    packers: 'package-variant',
    equipment: 'hammer-wrench',
  };
  return icons[serviceType] || 'car';
}

// Helper function to get service title
function getServiceTitle(booking, serviceType) {
  if (booking.vehicleName || booking.requestedVehicleName) {
    return booking.vehicleName || booking.requestedVehicleName;
  }
  if (booking.equipmentName) {
    return booking.equipmentName;
  }
  if (booking.vehicleCategory || booking.vehicleCategoryName) {
    return booking.vehicleCategory || booking.vehicleCategoryName;
  }
  if (booking.equipmentCategory) {
    return booking.equipmentCategory;
  }
  return 'Service Details';
}

// Helper function to render service-specific details
function renderServiceDetails(booking, serviceType) {
  return (
    <View style={styles.serviceDetails}>
      {/* Vehicle/Equipment Name */}
      {(booking.vehicleName || booking.equipmentName || booking.vehicleCategory) && (
        <View style={styles.serviceDetailRow}>
          <Icon name="info" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>
              {serviceType === 'equipment' ? 'Equipment' : 'Vehicle'}
            </Text>
            <Text style={styles.serviceDetailValue}>
              {booking.vehicleName || booking.equipmentName || booking.vehicleCategory}
            </Text>
          </View>
        </View>
      )}

      {/* Brand/Model */}
      {(booking.requestedBrand || booking.vehicleModel || booking.equipmentModel) && (
        <View style={styles.serviceDetailRow}>
          <Icon name="tag" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>
              {serviceType === 'equipment' ? 'Model' : 'Brand'}
            </Text>
            <Text style={styles.serviceDetailValue}>
              {booking.requestedBrand || booking.vehicleModel || booking.equipmentModel}
            </Text>
          </View>
        </View>
      )}

      {/* Category */}
      {booking.requestedCategory && (
        <View style={styles.serviceDetailRow}>
          <Icon name="grid" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>Category</Text>
            <Text style={styles.serviceDetailValue}>{booking.requestedCategory}</Text>
          </View>
        </View>
      )}

      {/* Daily Rate */}
      {booking.dailyRate && (
        <View style={styles.serviceDetailRow}>
          <Icon name="dollar-sign" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>Daily Rate</Text>
            <Text style={styles.serviceDetailValue}>₹{booking.dailyRate.toLocaleString()}/day</Text>
          </View>
        </View>
      )}

      {/* Passengers/Capacity */}
      {booking.passengers && (
        <View style={styles.serviceDetailRow}>
          <Icon name="users" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>Passengers</Text>
            <Text style={styles.serviceDetailValue}>{booking.passengers}</Text>
          </View>
        </View>
      )}

      {/* Trip Type */}
      {booking.tripType && (
        <View style={styles.serviceDetailRow}>
          <Icon name="navigation" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>Trip Type</Text>
            <Text style={styles.serviceDetailValue}>{booking.tripType}</Text>
          </View>
        </View>
      )}

      {/* Equipment Quantity */}
      {booking.quantity && (
        <View style={styles.serviceDetailRow}>
          <MaterialCommunityIcons name="counter" size={16} color={C.muted} />
          <View style={styles.serviceDetailContent}>
            <Text style={styles.serviceDetailLabel}>Quantity</Text>
            <Text style={styles.serviceDetailValue}>{booking.quantity}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusHeaderCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createdDate: {
    fontSize: 12,
    color: C.muted,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  serviceDetails: {
    gap: 12,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  serviceDetailContent: {
    flex: 1,
  },
  serviceDetailLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  serviceDetailValue: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  tripLocations: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  locationSubtext: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  customerContact: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: C.muted,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    gap: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentRowDivider: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 8,
    paddingTop: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: C.muted,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  paymentStatusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  progressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressStepsContainer: {
    paddingTop: 8,
  },
  progressStepWrapper: {
    marginBottom: 0,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIconContainer: {
    alignItems: 'center',
    width: 24,
  },
  stepIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCircleCompleted: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  stepIconCircleCurrent: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  stepIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.border,
  },
  stepIconDotCurrent: {
    backgroundColor: '#fff',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: C.border,
    marginTop: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: C.green,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    color: C.muted,
    flex: 1,
  },
  stepLabelCompleted: {
    color: C.text,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: C.blue,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 2,
  },
  vehicleNumber: {
    fontSize: 12,
    color: C.blue,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: C.surface,
    borderColor: '#FEE2E2',
  },
  acceptBtn: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: C.surface,
    borderColor: C.red,
  },
  acceptButton: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  assignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.blue,
  },
  notAssignedContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  notAssignedText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  notAssignedSubtext: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
  assignFormContainer: {
    gap: 16,
  },
  assignFormTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  staffList: {
    gap: 12,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  staffItemSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: C.brand,
  },
  staffRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.brand,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: 13,
    color: C.muted,
  },
  vehicleInputContainer: {
    marginTop: 12,
  },
  manualInputContainer: {
    gap: 8,
  },
  manualInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  assignFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  submitButton: {
    backgroundColor: C.brand,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalItemDisabled: {
    opacity: 0.5,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
    marginBottom: 2,
  },
  modalItemPhone: {
    fontSize: 13,
    color: C.muted,
  },
  modalItemTextDisabled: {
    color: C.muted,
  },
  startTripButton: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  endTripButton: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  otpHintText: {
    fontSize: 12,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  otpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  otpModalContent: {
    backgroundColor: C.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  otpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
  },
  otpModalDescription: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 20,
    lineHeight: 20,
  },
  otpInputContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.brand,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    color: C.text,
  },
  otpModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  completeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  completeModalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
