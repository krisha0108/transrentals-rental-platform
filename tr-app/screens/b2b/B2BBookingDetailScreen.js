import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions, TextInput, Image, FlatList,
  Share, Linking, Clipboard, Platform, StatusBar, KeyboardAvoidingView,
} from 'react-native';
import Modal from '../../components/SafeModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { b2bService } from '../services';
import { BASE_URL } from '../api';

const TRACK_BASE = BASE_URL;

// Vehicle image component with slider + tap to fullscreen
const VehicleImage = ({ images, style, onOpenViewer }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [failed, setFailed] = useState({});
  const flatListRef = React.useRef(null);

  const validImages = images.filter((_, i) => !failed[i]);

  if (images.length === 0 || validImages.length === 0) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }]}>
        <Icon name="truck" size={scale(30)} color="#D1D5DB" />
        <Text style={{ fontSize: scale(10), color: '#9CA3AF', marginTop: scale(4) }}>No Image</Text>
      </View>
    );
  }

  const imageWidth = typeof style?.width === 'number' ? style.width : width;

  return (
    <View style={{ position: 'relative' }}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
          setImgIdx(idx);
        }}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onOpenViewer && onOpenViewer(images, index)}
            style={{ width: imageWidth }}
          >
            <Image
              source={{ uri: getImageUri(item) }}
              style={[style, { width: imageWidth }]}
              resizeMode="cover"
              onError={() => setFailed(prev => ({ ...prev, [index]: true }))}
            />
          </TouchableOpacity>
        )}
      />
      {/* Dot Indicators */}
      {images.length > 1 && (
        <View style={{
          position: 'absolute', bottom: scale(8), alignSelf: 'center',
          flexDirection: 'row', gap: scale(5), left: 0, right: 0,
          justifyContent: 'center',
        }}>
          {images.map((_, i) => (
            <View key={i} style={{
              width: i === imgIdx ? scale(16) : scale(6),
              height: scale(6), borderRadius: scale(3),
              backgroundColor: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)',
            }} />
          ))}
        </View>
      )}
      {/* Photo count badge */}
      <View style={{
        position: 'absolute', top: scale(8), right: scale(8),
        backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: scale(10),
        paddingHorizontal: scale(8), paddingVertical: scale(3),
        flexDirection: 'row', alignItems: 'center', gap: scale(3),
      }}>
        <Icon name="camera" size={scale(10)} color="#fff" />
        <Text style={{ color: '#fff', fontSize: scale(10), fontWeight: '600' }}>
          {imgIdx + 1}/{images.length}
        </Text>
      </View>
    </View>
  );
};

// Fullscreen Image Viewer Modal
const ImageViewerModal = ({ visible, images, initialIndex, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(initialIndex || 0);
  const flatListRef = React.useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible && flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
    setCurrentIdx(initialIndex || 0);
  }, [visible, initialIndex]);

  if (!visible || !images || images.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute', top: scale(45), right: scale(16), zIndex: 10,
            width: scale(36), height: scale(36), borderRadius: scale(18),
            backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Icon name="x" size={scale(20)} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        <View style={{
          position: 'absolute', top: scale(50), left: 0, right: 0, zIndex: 10,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: scale(14), fontWeight: '600' }}>
            {currentIdx + 1} / {images.length}
          </Text>
        </View>

        {/* Image Slider */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex || 0}
          getItemLayout={(_, index) => ({
            length: screenWidth, offset: screenWidth * index, index,
          })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIdx(idx);
          }}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={{
              width: screenWidth, height: screenHeight,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Image
                source={{ uri: getImageUri(item) }}
                style={{ width: screenWidth, height: screenHeight * 0.7 }}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {/* Bottom Dots */}
        {images.length > 1 && (
          <View style={{
            position: 'absolute', bottom: scale(40), left: 0, right: 0,
            flexDirection: 'row', justifyContent: 'center', gap: scale(6),
          }}>
            {images.map((_, i) => (
              <View key={i} style={{
                width: i === currentIdx ? scale(20) : scale(8),
                height: scale(8), borderRadius: scale(4),
                backgroundColor: i === currentIdx ? '#fff' : 'rgba(255,255,255,0.4)',
              }} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const STATUS_COLORS = {
  OPEN_FOR_QUOTES: '#F59E0B', QUOTES_RECEIVED: '#3B82F6', SUPER_QUOTE_SENT: '#8B5CF6',
  CONFIRMED: '#10B981', TRIPS_CREATED: '#06B6D4', IN_PROGRESS: '#F97316',
  COMPLETED: '#22C55E', INVOICED: '#6366F1', PAID: '#059669', CANCELLED: '#EF4444',
};

const STATUS_LABELS = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Ready', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const TRIP_STATUS_COLORS = {
  PENDING: '#F59E0B', DRIVER_ARRIVED: '#3B82F6', STARTED: '#F97316',
  COMPLETED: '#22C55E', CANCELLED: '#EF4444', VENDOR_CANCELLED: '#EF4444',
};

const TIMELINE_STEPS = [
  { key: 'OPEN_FOR_QUOTES', label: 'Open', icon: 'send' },
  { key: 'QUOTES', label: 'Quotes', icon: 'file-text' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: 'check-circle' },
  { key: 'TRIPS', label: 'Trips', icon: 'map-pin' },
  { key: 'DONE', label: 'Done', icon: 'flag' },
];

const formatServiceType = (type) => {
  if (!type) return '-';
  return type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatTripType = (type) => {
  if (!type) return '-';
  const map = {
    one_way: 'One Way', round_trip: 'Round Trip', local: 'Local',
    airport_transfer: 'Airport Transfer', outstation: 'Outstation',
    multi_city: 'Multi City', SELF_DRIVE: 'Self Drive',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Parse specialNotes JSON for self-drive/bus vehicle preferences
const parseSpecialNotesPreferences = (specialNotes) => {
  if (!specialNotes) return null;
  try {
    const parsed = typeof specialNotes === 'string' ? JSON.parse(specialNotes) : specialNotes;
    if (parsed && typeof parsed === 'object' && (parsed.vehicleModelName || parsed.vehicleCategory || parsed.vehicleCategoryName || parsed.transmission || parsed.needAC !== undefined)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const getVehicleImages = (qv) => {
  const v = qv?.vehicle;
  let images = [];

  // Parse vehicle images (stored as JSON)
  if (v?.images) {
    try {
      const parsed = typeof v.images === 'string' ? JSON.parse(v.images) : v.images;
      if (Array.isArray(parsed)) {
        images = parsed.filter(x => typeof x === 'string' && x);
      } else if (parsed && typeof parsed === 'object') {
        images = Object.values(parsed).filter(x => typeof x === 'string' && x);
      }
    } catch {}
  }

  // Add model sideImage as priority
  if (v?.vehicle_models?.sideImage) {
    images = [v.vehicle_models.sideImage, ...images.filter(img => img !== v.vehicle_models.sideImage)];
  }

  // Fallback to category image
  if (images.length === 0 && v?.chauffeur_vehicle_categories?.image) {
    images.push(v.chauffeur_vehicle_categories.image);
  }

  return images;
};

const getImageUri = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const uri = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('[B2B-IMG]', uri);
  return uri;
};

const getTimelineStep = (status) => {
  if (!status) return 0;
  if (status === 'CANCELLED') return -1;
  if (['COMPLETED', 'INVOICED', 'PAID'].includes(status)) return 5;
  if (['TRIPS_CREATED', 'IN_PROGRESS'].includes(status)) return 4;
  if (status === 'CONFIRMED') return 3;
  if (['QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(status)) return 2;
  return 1;
};

export default function B2BBookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(null);
  const [imageViewer, setImageViewer] = useState({ visible: false, images: [], index: 0 });
  const [copiedTripId, setCopiedTripId] = useState(null);

  const openImageViewer = (images, index) => {
    setImageViewer({ visible: true, images, index: index || 0 });
  };

  const getTripLink = (tripCode) => `${TRACK_BASE}/trip/${tripCode}`;

  const copyTripLink = (trip) => {
    const link = getTripLink(trip.tripCode);
    Clipboard.setString(link);
    setCopiedTripId(trip.id);
    setTimeout(() => setCopiedTripId(null), 2000);
  };

  const shareTrip = async (trip, index) => {
    const link = getTripLink(trip.tripCode);
    const vehicleInfo = trip.vehicleName || trip.vehicleNumber || `Vehicle ${index + 1}`;
    const driverInfo = trip.driverName ? `\nDriver: ${trip.driverName}${trip.driverPhone ? ` (${trip.driverPhone})` : ''}` : '';
    const text = `🚗 *Trip ${index + 1} Details*\nBooking: ${booking?.bookingNumber}\nVehicle: ${vehicleInfo}${driverInfo}\n\nTrack live: ${link}`;
    try {
      await Share.share({ message: text });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  const openTripLink = (tripCode) => {
    Linking.openURL(getTripLink(tripCode));
  };

  const loadData = useCallback(async () => {
    try {
      const res = await b2bService.getBookingDetail(bookingId);
      setBooking(res?.booking || res);
    } catch (err) {
      console.log('Booking detail error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAcceptQuote = async (superQuoteId) => {
    setActionLoading(true);
    try {
      await b2bService.acceptSuperQuote(superQuoteId);
      setShowQuoteDetail(null);
      loadData();
    } catch (err) {
      console.log('Accept error:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await b2bService.cancelBooking(bookingId, cancelReason);
      setShowCancelModal(false);
      loadData();
    } catch (err) {
      console.log('Cancel error:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatTime = (t) => t || '-';
  const formatCurrency = (amt) => amt ? `₹${Number(amt).toLocaleString('en-IN')}` : '-';

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color="#22C55E" /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={scale(22)} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Detail</Text>
          <View style={{ width: scale(22) }} />
        </View>
        <View style={s.center}><Text style={{ color: '#999' }}>Booking not found</Text></View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] || '#999';
  const superQuotes = booking.superQuotes || [];
  const trips = booking.trips || [];
  const invoices = booking.invoices || [];
  const canCancel = !['COMPLETED', 'CANCELLED', 'INVOICED', 'PAID'].includes(booking.status);
  const timelineStep = getTimelineStep(booking.status);
  const customer = booking.customer;

  // Get confirmed vendor quotes for vehicles display
  const confirmedQuotes = [];
  superQuotes.forEach(sq => {
    (sq.items || []).forEach(item => {
      if (item.vendorQuote) confirmedQuotes.push(item.vendorQuote);
    });
  });

  // Trip stats
  const tripStats = [
    { label: 'Total', value: trips.length, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Pending', value: trips.filter(t => t.status === 'PENDING').length, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Arrived', value: trips.filter(t => t.status === 'DRIVER_ARRIVED').length, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Started', value: trips.filter(t => t.status === 'STARTED').length, color: '#F97316', bg: '#FFF7ED' },
    { label: 'Done', value: trips.filter(t => t.status === 'COMPLETED').length, color: '#22C55E', bg: '#F0FDF4' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{booking.bookingNumber}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BookingChat', {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          vendorName: booking.trips?.[0]?.vendor?.businessName || booking.vendorQuotes?.[0]?.vendor?.businessName || 'Vendor',
          bookingType: 'b2b',
        })}>
          <Icon name="message-circle" size={scale(22)} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#22C55E']} />}
        contentContainerStyle={s.scrollContent}
      >
        {/* Status Banner */}
        <View style={[s.statusBanner, { backgroundColor: statusColor + '15' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusBannerText, { color: statusColor }]}>
            {STATUS_LABELS[booking.status] || booking.status?.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Status Timeline */}
        {booking.status !== 'CANCELLED' && (
          <View style={s.card}>
            <View style={s.timelineRow}>
              {TIMELINE_STEPS.map((step, i) => {
                const isActive = i < timelineStep;
                const isCurrent = i === timelineStep - 1;
                return (
                  <React.Fragment key={step.key}>
                    <View style={s.timelineStep}>
                      <View style={[
                        s.timelineCircle,
                        isActive && { backgroundColor: '#22C55E', borderColor: '#22C55E' },
                        isCurrent && { backgroundColor: '#22C55E', borderColor: '#22C55E', transform: [{ scale: 1.15 }] },
                      ]}>
                        <Icon name={step.icon} size={scale(12)} color={isActive ? '#fff' : '#ccc'} />
                      </View>
                      <Text style={[s.timelineLabel, isActive && { color: '#22C55E', fontWeight: '700' }]}>
                        {step.label}
                      </Text>
                    </View>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <View style={[s.timelineLine, isActive && { backgroundColor: '#22C55E' }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* Company Info */}
        {customer && (
          <View style={s.card}>
            <View style={s.companyHeader}>
              <View style={s.companyIcon}>
                <Icon name="briefcase" size={scale(18)} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.companyName}>{customer.companyName || 'Company'}</Text>
                <Text style={s.companyDetail}>{customer.name}</Text>
                {customer.email && <Text style={s.companyDetail}>{customer.email}</Text>}
                {customer.phone && <Text style={s.companyDetail}>{customer.phone}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Booking Details</Text>
          {[
            { label: 'Service', value: formatServiceType(booking.serviceType), icon: booking.serviceType === 'self-drive' ? 'key' : 'truck' },
            { label: 'Trip Type', value: formatTripType(booking.tripType), icon: 'navigation' },
            { label: 'Vehicles', value: `${booking.vehiclesRequired} required`, icon: 'layers' },
            ...(booking.passengerCount ? [{ label: 'Passengers', value: `${booking.passengerCount}`, icon: 'users' }] : []),
            ...(booking.vehicleCategory ? [{ label: 'Category', value: booking.vehicleCategory, icon: 'grid' }] : []),
          ].map((item, i) => (
            <View key={i} style={s.infoRow}>
              <Icon name={item.icon} size={scale(15)} color="#666" />
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Vehicle/Bus Preference Card (for self-drive and bus-rental) */}
        {(() => {
          const prefs = parseSpecialNotesPreferences(booking.specialNotes);
          if (!prefs || !['self-drive', 'bus-rental'].includes(booking.serviceType)) return null;

          const isBus = booking.serviceType === 'bus-rental';
          const prefItems = isBus ? [
            prefs.vehicleCategoryName && { label: 'Bus Type', value: prefs.vehicleCategoryName, icon: 'truck' },
            prefs.passengers && { label: 'Passengers', value: `${prefs.passengers}`, icon: 'users' },
            prefs.needAC !== undefined && { label: 'AC', value: prefs.needAC ? 'Yes' : 'No', icon: 'wind' },
            prefs.needLuxury && { label: 'Luxury', value: 'Yes', icon: 'star' },
            prefs.needSleeper && { label: 'Sleeper', value: 'Yes', icon: 'moon' },
          ].filter(Boolean) : [
            prefs.vehicleModelName && { label: 'Model', value: prefs.vehicleModelName, icon: 'truck' },
            prefs.vehicleBrand && { label: 'Brand', value: prefs.vehicleBrand, icon: 'tag' },
            prefs.vehicleCategory && { label: 'Category', value: prefs.vehicleCategory, icon: 'grid' },
            prefs.transmission && { label: 'Transmission', value: prefs.transmission, icon: 'settings' },
            prefs.fuelType && { label: 'Fuel Type', value: prefs.fuelType, icon: 'droplet' },
            prefs.minSeats && { label: 'Min Seats', value: `${prefs.minSeats}`, icon: 'users' },
          ].filter(Boolean);

          if (prefItems.length === 0) return null;
          return (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(12) }}>
                <View style={{ width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={isBus ? 'truck' : 'key'} size={scale(14)} color="#0D9488" />
                </View>
                <Text style={[s.cardTitle, { marginBottom: 0 }]}>{isBus ? 'Bus Preference' : 'Vehicle Preference'}</Text>
              </View>
              {prefItems.map((item, i) => (
                <View key={i} style={s.infoRow}>
                  <Icon name={item.icon} size={scale(15)} color="#0D9488" />
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <Text style={s.infoValue}>{item.value}</Text>
                </View>
              ))}
              {prefs.isDeliveryRequested && (
                <View style={[s.sdInfoPill, { marginTop: scale(8) }]}>
                  <Icon name="map-pin" size={scale(12)} color="#0D9488" />
                  <Text style={s.sdInfoPillText}>Delivery requested{prefs.pickupAddress ? `: ${prefs.pickupAddress}` : ''}</Text>
                </View>
              )}
              {(prefs.customerNotes || prefs.requirements) && (
                <View style={[s.notesBox, { marginTop: scale(8) }]}>
                  <Icon name="edit-3" size={scale(14)} color="#666" />
                  <Text style={s.notesText}>{prefs.customerNotes || prefs.requirements}</Text>
                </View>
              )}
            </View>
          );
        })()}

        {/* Route & Schedule */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{booking.serviceType === 'self-drive' ? 'Location & Schedule' : 'Route & Schedule'}</Text>

          {/* For self-drive: single location. For chauffeur: pickup & drop */}
          {booking.serviceType === 'self-drive' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(10), marginBottom: scale(4) }}>
              <View style={[s.dot, { backgroundColor: '#22C55E' }]} />
              <View>
                <Text style={s.locationLabel}>Pickup Location</Text>
                <Text style={s.locationText}>{booking.pickupLocation}</Text>
              </View>
            </View>
          ) : (
            <View style={s.locationBox}>
              <View style={s.locationDot}>
                <View style={[s.dot, { backgroundColor: '#22C55E' }]} />
                <View style={s.dotLine} />
                <View style={[s.dot, { backgroundColor: '#EF4444' }]} />
              </View>
              <View style={{ flex: 1, gap: scale(16) }}>
                <View>
                  <Text style={s.locationLabel}>Pickup</Text>
                  <Text style={s.locationText}>{booking.pickupLocation}</Text>
                </View>
                <View>
                  <Text style={s.locationLabel}>Drop</Text>
                  <Text style={s.locationText}>{booking.dropLocation || 'Not specified'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Pickup Date */}
          <View style={[s.scheduleCard, { borderLeftColor: '#22C55E' }]}>
            <Icon name="calendar" size={scale(14)} color="#22C55E" />
            <View>
              <Text style={s.scheduleLbl}>Pickup Date & Time</Text>
              <Text style={s.scheduleVal}>{formatDate(booking.scheduledDate)} • {formatTime(booking.scheduledTime)}</Text>
            </View>
          </View>

          {/* Return Date */}
          {booking.returnDate && (
            <View style={[s.scheduleCard, { borderLeftColor: '#F59E0B' }]}>
              <Icon name="calendar" size={scale(14)} color="#F59E0B" />
              <View>
                <Text style={s.scheduleLbl}>{booking.serviceType === 'self-drive' ? 'Return Date & Time' : 'Return Date'}</Text>
                <Text style={s.scheduleVal}>
                  {formatDate(booking.returnDate)}{booking.returnTime ? ` • ${formatTime(booking.returnTime)}` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Duration for self-drive */}
          {booking.serviceType === 'self-drive' && booking.scheduledDate && booking.returnDate && (
            <View style={[s.scheduleCard, { borderLeftColor: '#8B5CF6' }]}>
              <Icon name="clock" size={scale(14)} color="#8B5CF6" />
              <View>
                <Text style={s.scheduleLbl}>Duration</Text>
                <Text style={s.scheduleVal}>
                  {(() => {
                    const start = new Date(booking.scheduledDate);
                    const end = new Date(booking.returnDate);
                    const s1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    const e1 = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                    const days = Math.round((e1 - s1) / (1000 * 60 * 60 * 24)) + 1;
                    return `${Math.max(1, days)} day${days > 1 ? 's' : ''}`;
                  })()}
                </Text>
              </View>
            </View>
          )}

          {/* Special notes (non-self-drive/bus or unparseable) */}
          {booking.specialNotes && (!['self-drive', 'bus-rental'].includes(booking.serviceType) || !parseSpecialNotesPreferences(booking.specialNotes)) && (
            <View style={s.notesBox}>
              <Icon name="edit-3" size={scale(14)} color="#666" />
              <Text style={s.notesText}>{booking.specialNotes}</Text>
            </View>
          )}
        </View>

        {/* Assigned Vehicles & Drivers */}
        {confirmedQuotes.length > 0 && (() => {
          const allVehicles = confirmedQuotes.flatMap(q =>
            (q.quoteVehicles || []).map(qv => ({ ...qv, vendorName: q.vendor?.businessName }))
          );
          if (allVehicles.length === 0) return null;

          return (
            <View style={s.card}>
              <Text style={s.cardTitle}>Assigned Vehicles & Drivers</Text>
              {allVehicles.map((qv, i) => {
                const v = qv.vehicle;
                const d = qv.driver;
                const images = getVehicleImages(qv);
                const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
                const modelName = v?.vehicle_models?.name || '';
                const displayName = v?.vehicleName || `${brandName} ${modelName}`.trim() || qv.vehicleName || 'Vehicle';

                return (
                  <View key={qv.id || i} style={s.vehicleCard}>
                    {/* Vehicle Number Badge */}
                    <View style={s.vehicleNumBadge}>
                      <Text style={s.vehicleNumBadgeText}>{i + 1}</Text>
                    </View>

                    {/* Vehicle Image */}
                    <VehicleImage images={images} style={s.vehicleImg} onOpenViewer={openImageViewer} />

                    <View style={s.vehicleInfo}>
                      <Text style={s.vehicleName}>{displayName}</Text>
                      <View style={s.vehicleTags}>
                        {v?.registrationNumber && (
                          <View style={s.vehicleTag}>
                            <Text style={s.vehicleTagText}>{v.registrationNumber}</Text>
                          </View>
                        )}
                        {v?.color && <Text style={s.vehicleTagSmall}>{v.color}</Text>}
                        {v?.seatingCapacity && <Text style={s.vehicleTagSmall}>{v.seatingCapacity} seats</Text>}
                        {v?.fuelType && <Text style={s.vehicleTagSmall}>{v.fuelType}</Text>}
                      </View>

                      {/* Driver */}
                      {d ? (
                        <View style={s.driverRow}>
                          {d.profilePhoto ? (
                            <Image source={{ uri: getImageUri(d.profilePhoto) }} style={s.driverPhoto} />
                          ) : (
                            <View style={[s.driverPhoto, s.driverPhotoPlaceholder]}>
                              <Text style={s.driverInitial}>{d.name?.charAt(0)?.toUpperCase()}</Text>
                            </View>
                          )}
                          <View>
                            <Text style={s.driverName}>{d.name}</Text>
                            {d.phone && <Text style={s.driverPhone}>{d.phone}</Text>}
                          </View>
                        </View>
                      ) : (
                        <Text style={s.driverPending}>Driver to be assigned</Text>
                      )}

                      {qv.vendorName && (
                        <Text style={s.vendorLabel}>Vendor: {qv.vendorName}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* Super Quotes */}
        {superQuotes.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Quotes</Text>
            {superQuotes.map((sq) => {
              const totalVehicles = (sq.items || []).reduce((sum, item) => sum + (item.vendorQuote?.vehicleCount || 0), 0);
              return (
                <View key={sq.id} style={s.quoteCard}>
                  <View style={s.quoteHeader}>
                    <Text style={s.quoteNum}>{sq.quoteNumber}</Text>
                    <View style={[s.quoteBadge, {
                      backgroundColor: sq.status === 'ACCEPTED' ? '#F0FDF4' : sq.status === 'SENT' ? '#FFF7ED' : '#F3F4F6',
                    }]}>
                      <Text style={[s.quoteBadgeText, {
                        color: sq.status === 'ACCEPTED' ? '#22C55E' : sq.status === 'SENT' ? '#F59E0B' : '#666',
                      }]}>{sq.status}</Text>
                    </View>
                  </View>

                  <View style={s.quoteSummaryRow}>
                    <View style={s.quoteSummaryItem}>
                      <Text style={s.quoteSummaryLabel}>Vehicles</Text>
                      <Text style={s.quoteSummaryValue}>{totalVehicles || booking.vehiclesRequired}</Text>
                    </View>
                    <View style={s.quoteSummaryItem}>
                      <Text style={s.quoteSummaryLabel}>Total Amount</Text>
                      <Text style={[s.quoteSummaryValue, { color: '#22C55E' }]}>{formatCurrency(sq.finalAmount)}</Text>
                    </View>
                  </View>

                  {/* Action Row: View Details + Accept */}
                  <View style={s.quoteActionRow}>
                    <TouchableOpacity
                      style={s.viewDetailBtn}
                      onPress={() => setShowQuoteDetail(sq)}
                    >
                      <Icon name="eye" size={scale(14)} color="#8B5CF6" />
                      <Text style={s.viewDetailBtnText}>View Details</Text>
                    </TouchableOpacity>
                    {sq.status === 'SENT' && (
                      <TouchableOpacity
                        style={s.acceptBtn}
                        onPress={() => handleAcceptQuote(sq.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="check" size={scale(14)} color="#fff" />
                            <Text style={s.acceptBtnText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Trip Stats */}
        {trips.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Trip Monitor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(12) }}>
              {tripStats.map((st, i) => (
                <View key={i} style={[s.statCard, { backgroundColor: st.bg }]}>
                  <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                  <Text style={[s.statLabel, { color: st.color }]}>{st.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Trip Cards */}
            <Text style={s.cardSubTitle}>Trip Details ({trips.length})</Text>
            {trips.map((trip, i) => {
              const tripColor = TRIP_STATUS_COLORS[trip.status] || '#999';
              const isCopied = copiedTripId === trip.id;
              return (
                <View key={trip.id} style={s.tripCard}>
                  <View style={s.tripHeader}>
                    <View style={s.tripIndexBadge}>
                      <Text style={s.tripIndexText}>{i + 1}</Text>
                    </View>
                    <Text style={s.tripCode}>{trip.tripCode}</Text>
                    <View style={[s.tripBadge, { backgroundColor: tripColor + '18' }]}>
                      <Text style={[s.tripBadgeText, { color: tripColor }]}>
                        {trip.status?.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={s.tripDetails}>
                    {(trip.vehicleName || trip.vehicleNumber) && (
                      <View style={s.tripInfoRow}>
                        <Icon name="truck" size={scale(12)} color="#888" />
                        <Text style={s.tripInfo}>{trip.vehicleName || ''} {trip.vehicleNumber ? `(${trip.vehicleNumber})` : ''}</Text>
                      </View>
                    )}
                    {trip.driverName && (
                      <View style={s.tripInfoRow}>
                        <Icon name="user" size={scale(12)} color="#888" />
                        <Text style={s.tripInfo}>{trip.driverName} {trip.driverPhone ? `(${trip.driverPhone})` : ''}</Text>
                      </View>
                    )}
                    {trip.vendor?.businessName && (
                      <View style={s.tripInfoRow}>
                        <Icon name="briefcase" size={scale(12)} color="#888" />
                        <Text style={[s.tripInfo, { color: '#0D9488' }]}>{trip.vendor.businessName}</Text>
                      </View>
                    )}
                  </View>

                  {/* Trip Link Actions */}
                  <View style={s.tripLinkRow}>
                    <TouchableOpacity
                      style={[s.tripLinkBtn, isCopied && s.tripLinkBtnCopied]}
                      onPress={() => copyTripLink(trip)}
                    >
                      <Icon name={isCopied ? 'check-circle' : 'copy'} size={scale(13)} color={isCopied ? '#16A34A' : '#555'} />
                      <Text style={[s.tripLinkBtnText, isCopied && { color: '#16A34A' }]}>
                        {isCopied ? 'Copied!' : 'Copy Link'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.tripLinkBtn, s.tripShareBtn]}
                      onPress={() => shareTrip(trip, i)}
                    >
                      <Icon name="share-2" size={scale(13)} color="#16A34A" />
                      <Text style={[s.tripLinkBtnText, { color: '#16A34A' }]}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.tripLinkBtn, s.tripOpenBtn]}
                      onPress={() => openTripLink(trip.tripCode)}
                    >
                      <Icon name="external-link" size={scale(13)} color="#fff" />
                      <Text style={[s.tripLinkBtnText, { color: '#fff' }]}>Track</Text>
                    </TouchableOpacity>
                  </View>

                  {trip.status === 'DRIVER_ARRIVED' && (
                    <TouchableOpacity
                      style={s.otpAlert}
                      onPress={() => navigation.navigate('B2BOtpVerify', { tripCode: trip.tripCode, booking })}
                    >
                      <Icon name="key" size={scale(14)} color="#3B82F6" />
                      <Text style={s.otpAlertText}>Driver arrived - Tap to verify OTP & start trip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Invoices */}
        {invoices.length > 0 && (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(12) }}>
              <Icon name="file-text" size={scale(18)} color="#F97316" />
              <Text style={[s.cardTitle, { marginBottom: 0 }]}>Invoices</Text>
            </View>
            {invoices.map((inv) => (
              <View key={inv.id} style={s.invoiceCard}>
                <View style={s.invoiceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.invoiceNum}>{inv.invoiceNumber}</Text>
                    {inv.dueDate && (
                      <Text style={s.invoiceDue}>Due: {formatDate(inv.dueDate)}</Text>
                    )}
                    {(inv.totalVehicles || inv.tripsCompleted) && (
                      <Text style={s.invoiceMeta}>
                        {inv.totalVehicles ? `${inv.totalVehicles} vehicles` : ''}
                        {inv.totalVehicles && inv.tripsCompleted ? ' | ' : ''}
                        {inv.tripsCompleted ? `${inv.tripsCompleted} trips` : ''}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.invoiceAmount}>{formatCurrency(inv.totalAmount)}</Text>
                    <View style={[s.invoiceBadge, { backgroundColor: inv.status === 'PAID' ? '#F0FDF4' : '#FFF7ED', marginTop: scale(4) }]}>
                      <Text style={[s.invoiceBadgeText, { color: inv.status === 'PAID' ? '#22C55E' : '#F97316' }]}>
                        {inv.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.invoiceViewBtn, { backgroundColor: inv.status === 'PAID' ? '#22C55E' : '#F97316' }]}
                  onPress={() => {
                    const url = `${BASE_URL}/invoice/b2b/${inv.id}`;
                    Linking.openURL(url);
                  }}
                >
                  <Icon name="external-link" size={scale(14)} color="#fff" />
                  <Text style={s.invoiceViewBtnText}>
                    {inv.status === 'PAID' ? 'View Invoice' : 'View & Pay Invoice'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Total Amount (no vendor cost, no margin, no GST) */}
        {booking.finalAmount > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Amount</Text>
            <View style={s.totalAmountBox}>
              <Text style={s.totalAmountLabel}>Total Amount</Text>
              <Text style={s.totalAmountValue}>{formatCurrency(booking.finalAmount)}</Text>
            </View>
            <Text style={s.billingNote}>Post-trip corporate billing. No payment required now.</Text>
          </View>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Icon name="x-circle" size={scale(18)} color="#EF4444" />
            <Text style={s.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Quote Detail Modal */}
      <Modal visible={!!showQuoteDetail} transparent animationType="slide" onRequestClose={() => setShowQuoteDetail(null)}>
        <View style={s.qdOverlay}>
          <View style={s.qdSheet}>
            <View style={s.qdHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(30) }}>
              {showQuoteDetail && (() => {
                const sq = showQuoteDetail;
                const items = sq.items || [];
                const allVendorQuotes = items.map(it => it.vendorQuote).filter(Boolean);

                // Parse inclusions/exclusions from notes JSON
                let allInclusions = [];
                let allExclusions = [];
                let allTerms = [];
                allVendorQuotes.forEach(vq => {
                  if (vq.notes) {
                    try {
                      const parsed = typeof vq.notes === 'string' ? JSON.parse(vq.notes) : vq.notes;
                      if (parsed.inclusions) allInclusions = [...new Set([...allInclusions, ...parsed.inclusions])];
                      if (parsed.exclusions) allExclusions = [...new Set([...allExclusions, ...parsed.exclusions])];
                      if (parsed.termsConditions) allTerms = [...new Set([...allTerms, ...parsed.termsConditions])];
                    } catch {}
                  }
                });

                // All vehicles from all vendor quotes
                const allVehicles = allVendorQuotes.flatMap(vq =>
                  (vq.quoteVehicles || []).map(qv => ({ ...qv, vendorName: vq.vendor?.businessName }))
                );

                return (
                  <>
                    {/* Header */}
                    <View style={s.qdHeader}>
                      <View>
                        <Text style={s.qdTitle}>Quote Details</Text>
                        <Text style={s.qdSubtitle}>{sq.quoteNumber}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setShowQuoteDetail(null)} style={s.qdClose}>
                        <Icon name="x" size={scale(20)} color="#666" />
                      </TouchableOpacity>
                    </View>

                    {/* Status + Summary */}
                    <View style={s.qdSummaryCard}>
                      <View style={[s.quoteBadge, {
                        backgroundColor: sq.status === 'ACCEPTED' ? '#F0FDF4' : sq.status === 'SENT' ? '#FFF7ED' : '#F3F4F6',
                        alignSelf: 'flex-start', marginBottom: scale(10),
                      }]}>
                        <Text style={[s.quoteBadgeText, {
                          color: sq.status === 'ACCEPTED' ? '#22C55E' : sq.status === 'SENT' ? '#F59E0B' : '#666',
                        }]}>{sq.status}</Text>
                      </View>
                      <View style={s.quoteSummaryRow}>
                        <View style={s.quoteSummaryItem}>
                          <Text style={s.quoteSummaryLabel}>Total Vehicles</Text>
                          <Text style={[s.quoteSummaryValue, { fontSize: scale(22) }]}>
                            {allVendorQuotes.reduce((sum, vq) => sum + (vq.vehicleCount || 0), 0) || booking.vehiclesRequired}
                          </Text>
                        </View>
                        <View style={s.quoteSummaryItem}>
                          <Text style={s.quoteSummaryLabel}>Total Amount</Text>
                          <Text style={[s.quoteSummaryValue, { fontSize: scale(22), color: '#22C55E' }]}>
                            {formatCurrency(sq.finalAmount)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Notes */}
                    {sq.notes && (
                      <View style={s.qdSection}>
                        <Text style={s.qdSectionTitle}>Notes</Text>
                        <Text style={s.qdNotes}>{sq.notes}</Text>
                      </View>
                    )}

                    {/* Inclusions */}
                    {allInclusions.length > 0 && (
                      <View style={[s.qdSection, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={s.qdSectionHeaderRow}>
                          <Icon name="check-circle" size={scale(14)} color="#22C55E" />
                          <Text style={[s.qdSectionTitle, { color: '#16A34A', marginBottom: 0 }]}>What's Included</Text>
                        </View>
                        {allInclusions.map((item, i) => (
                          <View key={i} style={s.qdListItem}>
                            <Text style={s.qdCheckMark}>✓</Text>
                            <Text style={s.qdListText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Exclusions */}
                    {allExclusions.length > 0 && (
                      <View style={[s.qdSection, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <View style={s.qdSectionHeaderRow}>
                          <Icon name="alert-circle" size={scale(14)} color="#EF4444" />
                          <Text style={[s.qdSectionTitle, { color: '#DC2626', marginBottom: 0 }]}>What's Not Included</Text>
                        </View>
                        {allExclusions.map((item, i) => (
                          <View key={i} style={s.qdListItem}>
                            <Text style={[s.qdCheckMark, { color: '#EF4444' }]}>✗</Text>
                            <Text style={s.qdListText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Terms */}
                    {allTerms.length > 0 && (
                      <View style={s.qdSection}>
                        <View style={s.qdSectionHeaderRow}>
                          <Icon name="file-text" size={scale(14)} color="#666" />
                          <Text style={[s.qdSectionTitle, { color: '#666', marginBottom: 0 }]}>Terms & Conditions</Text>
                        </View>
                        {allTerms.map((item, i) => (
                          <View key={i} style={s.qdListItem}>
                            <Text style={[s.qdCheckMark, { color: '#999' }]}>{i + 1}.</Text>
                            <Text style={s.qdListText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Vehicles */}
                    {allVehicles.length > 0 && (
                      <View style={s.qdSection}>
                        <Text style={s.qdSectionTitle}>Vehicles ({allVehicles.length})</Text>
                        {allVehicles.map((qv, i) => {
                          const v = qv.vehicle;
                          const d = qv.driver;
                          const images = getVehicleImages(qv);
                          const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
                          const modelName = v?.vehicle_models?.name || '';
                          const displayName = v?.vehicleName || `${brandName} ${modelName}`.trim() || qv.vehicleName || 'Vehicle';

                          return (
                            <View key={qv.id || i} style={s.qdVehicleCard}>
                              {/* Vehicle Image */}
                              <VehicleImage images={images} style={s.qdVehicleImage} onOpenViewer={openImageViewer} />

                              <View style={s.qdVehicleInfo}>
                                <Text style={s.qdVehicleName}>{displayName}</Text>

                                {v?.registrationNumber && (
                                  <View style={s.regBadge}>
                                    <Text style={s.regBadgeText}>{v.registrationNumber}</Text>
                                  </View>
                                )}

                                <View style={s.qdVehicleSpecs}>
                                  {v?.seatingCapacity && (
                                    <View style={s.specItem}>
                                      <Icon name="users" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.seatingCapacity} seats</Text>
                                    </View>
                                  )}
                                  {v?.fuelType && (
                                    <View style={s.specItem}>
                                      <Icon name="droplet" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.fuelType}</Text>
                                    </View>
                                  )}
                                  {v?.transmission && (
                                    <View style={s.specItem}>
                                      <Icon name="settings" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.transmission}</Text>
                                    </View>
                                  )}
                                  {v?.chauffeur_vehicle_categories?.acType && (
                                    <View style={s.specItem}>
                                      <Icon name="wind" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.chauffeur_vehicle_categories.acType}</Text>
                                    </View>
                                  )}
                                  {v?.color && (
                                    <View style={s.specItem}>
                                      <Icon name="circle" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.color}</Text>
                                    </View>
                                  )}
                                  {v?.yearOfManufacture && (
                                    <View style={s.specItem}>
                                      <Icon name="calendar" size={scale(10)} color="#888" />
                                      <Text style={s.specText}>{v.yearOfManufacture}</Text>
                                    </View>
                                  )}
                                </View>

                                {/* Driver */}
                                {d ? (
                                  <View style={s.qdDriverRow}>
                                    {d.profilePhoto ? (
                                      <Image source={{ uri: getImageUri(d.profilePhoto) }} style={s.qdDriverPhoto} />
                                    ) : (
                                      <View style={[s.qdDriverPhoto, s.driverPhotoPlaceholder]}>
                                        <Text style={s.driverInitial}>{d.name?.charAt(0)?.toUpperCase()}</Text>
                                      </View>
                                    )}
                                    <View>
                                      <Text style={s.qdDriverName}>{d.name}</Text>
                                      {d.phone && <Text style={s.qdDriverPhone}>{d.phone}</Text>}
                                    </View>
                                  </View>
                                ) : (
                                  <Text style={s.driverPending}>Driver to be assigned</Text>
                                )}

                                {qv.vendorName && (
                                  <Text style={s.vendorLabel}>Vendor: {qv.vendorName}</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Booking Info */}
                    <View style={s.qdSection}>
                      <Text style={s.qdSectionTitle}>Booking Information</Text>
                      {[
                        { label: 'Service Type', value: formatServiceType(booking.serviceType), icon: 'truck' },
                        { label: 'Trip Type', value: formatTripType(booking.tripType), icon: 'navigation' },
                        { label: 'Category', value: booking.vehicleCategory || '-', icon: 'grid' },
                        { label: 'Pickup', value: booking.pickupLocation, icon: 'map-pin' },
                        { label: 'Drop', value: booking.dropLocation || '-', icon: 'map-pin' },
                        { label: 'Date', value: formatDate(booking.scheduledDate), icon: 'calendar' },
                        { label: 'Time', value: formatTime(booking.scheduledTime), icon: 'clock' },
                        ...(booking.returnDate ? [{ label: 'Return', value: formatDate(booking.returnDate), icon: 'calendar' }] : []),
                      ].map((item, i) => (
                        <View key={i} style={s.qdInfoRow}>
                          <Icon name={item.icon} size={scale(13)} color="#888" />
                          <Text style={s.qdInfoLabel}>{item.label}</Text>
                          <Text style={s.qdInfoValue}>{item.value}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Created By */}
                    {sq.createdBy && (
                      <View style={s.qdSection}>
                        <Text style={s.qdSectionTitle}>Created By</Text>
                        <View style={s.createdByRow}>
                          <View style={s.createdByAvatar}>
                            <Text style={s.createdByInitial}>{sq.createdBy.name?.charAt(0)?.toUpperCase()}</Text>
                          </View>
                          <Text style={s.createdByName}>{sq.createdBy.name}</Text>
                        </View>
                      </View>
                    )}

                    {/* Accept Button */}
                    {sq.status === 'SENT' && (
                      <TouchableOpacity
                        style={s.qdAcceptBtn}
                        onPress={() => handleAcceptQuote(sq.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="check-circle" size={scale(18)} color="#fff" />
                            <Text style={s.qdAcceptBtnText}>Accept Quote & Confirm Booking</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.cancelModal}>
            <Text style={s.cancelModalTitle}>Cancel Booking</Text>
            <Text style={s.cancelModalSub}>Please provide a reason for cancellation:</Text>
            <TextInput
              style={s.cancelInput}
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            <View style={s.cancelModalBtns}>
              <TouchableOpacity style={s.cancelModalNoBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={s.cancelModalNoText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.cancelModalYesBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.cancelModalYesText}>Confirm Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Image Viewer */}
      <ImageViewerModal
        visible={imageViewer.visible}
        images={imageViewer.images}
        initialIndex={imageViewer.index}
        onClose={() => setImageViewer({ visible: false, images: [], index: 0 })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    paddingBottom: scale(20),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(16), fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: scale(16), paddingBottom: scale(100) },

  // Status Banner
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: scale(12),
    borderRadius: scale(12), marginBottom: scale(12), gap: scale(8),
  },
  statusDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  statusBannerText: { fontSize: scale(14), fontWeight: '700', textTransform: 'uppercase' },

  // Timeline
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: scale(8) },
  timelineStep: { alignItems: 'center', width: scale(50) },
  timelineCircle: {
    width: scale(30), height: scale(30), borderRadius: scale(15),
    backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
  },
  timelineLabel: { fontSize: scale(9), color: '#999', marginTop: scale(4), fontWeight: '500' },
  timelineLine: { height: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: scale(14) },

  // Company Info
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
  companyIcon: {
    width: scale(44), height: scale(44), borderRadius: scale(22),
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },
  companyName: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A' },
  companyDetail: { fontSize: scale(12), color: '#666', marginTop: scale(2) },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: scale(14), padding: scale(16),
    marginBottom: scale(12), elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A', marginBottom: scale(12) },
  cardSubTitle: { fontSize: scale(13), fontWeight: '600', color: '#555', marginBottom: scale(8) },

  // Info Rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(8), borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', gap: scale(8) },
  infoLabel: { flex: 1, fontSize: scale(13), color: '#666' },
  infoValue: { fontSize: scale(13), fontWeight: '600', color: '#333' },

  // Location
  locationBox: { flexDirection: 'row', gap: scale(12) },
  locationDot: { alignItems: 'center', paddingTop: scale(4) },
  dot: { width: scale(10), height: scale(10), borderRadius: scale(5) },
  dotLine: { width: 1.5, height: scale(30), backgroundColor: '#ddd', marginVertical: scale(4) },
  locationLabel: { fontSize: scale(11), color: '#999', fontWeight: '500' },
  locationText: { fontSize: scale(14), color: '#333', fontWeight: '500', marginTop: scale(2) },

  // Schedule
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: scale(10),
    marginTop: scale(12), padding: scale(10), backgroundColor: '#F8F9FA',
    borderRadius: scale(8), borderLeftWidth: 3,
  },
  scheduleLbl: { fontSize: scale(11), color: '#999' },
  scheduleVal: { fontSize: scale(13), color: '#333', fontWeight: '600' },

  notesBox: { flexDirection: 'row', gap: scale(8), marginTop: scale(12), backgroundColor: '#F8F9FA', padding: scale(10), borderRadius: scale(8) },
  notesText: { fontSize: scale(12), color: '#666', flex: 1 },
  sdInfoPill: {
    flexDirection: 'row', alignItems: 'center', gap: scale(6),
    backgroundColor: '#F0FDFA', paddingHorizontal: scale(10), paddingVertical: scale(6),
    borderRadius: scale(8), borderWidth: 1, borderColor: '#CCFBF1',
  },
  sdInfoPillText: { fontSize: scale(12), color: '#0D9488', fontWeight: '500', flex: 1 },

  // Vehicle Cards (main page)
  vehicleCard: {
    backgroundColor: '#FAFAFA', borderRadius: scale(12), overflow: 'hidden',
    marginBottom: scale(10), borderWidth: 1, borderColor: '#f0f0f0',
  },
  vehicleNumBadge: {
    position: 'absolute', top: scale(8), left: scale(8), zIndex: 1,
    width: scale(24), height: scale(24), borderRadius: scale(12),
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  vehicleNumBadgeText: { color: '#fff', fontSize: scale(11), fontWeight: '700' },
  vehicleImg: {
    width: '100%', height: scale(160), backgroundColor: '#f5f5f5',
  },
  vehicleImgPlaceholder: {
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
  },
  vehicleInfo: { padding: scale(12) },
  vehicleName: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A' },
  vehicleTags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: scale(6), marginTop: scale(6) },
  vehicleTag: { backgroundColor: '#E5E7EB', paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4) },
  vehicleTagText: { fontSize: scale(11), fontWeight: '600', color: '#555', fontFamily: 'monospace' },
  vehicleTagSmall: { fontSize: scale(11), color: '#888' },

  driverRow: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    marginTop: scale(10), padding: scale(8), backgroundColor: '#fff',
    borderRadius: scale(8), borderWidth: 1, borderColor: '#f0f0f0',
  },
  driverPhoto: { width: scale(32), height: scale(32), borderRadius: scale(16) },
  driverPhotoPlaceholder: {
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
  },
  driverInitial: { fontSize: scale(13), fontWeight: '700', color: '#047857' },
  driverName: { fontSize: scale(13), fontWeight: '600', color: '#333' },
  driverPhone: { fontSize: scale(11), color: '#888' },
  driverPending: { fontSize: scale(11), color: '#aaa', fontStyle: 'italic', marginTop: scale(8) },
  vendorLabel: { fontSize: scale(11), color: '#888', marginTop: scale(6) },

  // Quote Cards
  quoteCard: { backgroundColor: '#FAFAFA', borderRadius: scale(12), padding: scale(14), marginBottom: scale(10), borderWidth: 1, borderColor: '#f0f0f0' },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(10) },
  quoteNum: { fontSize: scale(13), fontWeight: '700', color: '#333' },
  quoteBadge: { paddingHorizontal: scale(10), paddingVertical: scale(3), borderRadius: scale(10) },
  quoteBadgeText: { fontSize: scale(10), fontWeight: '700' },
  quoteSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: scale(8) },
  quoteSummaryItem: { alignItems: 'center' },
  quoteSummaryLabel: { fontSize: scale(11), color: '#999' },
  quoteSummaryValue: { fontSize: scale(18), fontWeight: '800', color: '#1A1A1A', marginTop: scale(2) },

  quoteActionRow: { flexDirection: 'row', gap: scale(8), marginTop: scale(10) },
  viewDetailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#8B5CF6', borderRadius: scale(10),
    paddingVertical: scale(10), gap: scale(4),
  },
  viewDetailBtnText: { color: '#8B5CF6', fontWeight: '700', fontSize: scale(13) },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', borderRadius: scale(10), paddingVertical: scale(10), gap: scale(4),
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: scale(13) },

  // Trip Stats
  statCard: {
    paddingHorizontal: scale(16), paddingVertical: scale(10), borderRadius: scale(10),
    alignItems: 'center', marginRight: scale(8), minWidth: scale(65),
  },
  statValue: { fontSize: scale(20), fontWeight: '800' },
  statLabel: { fontSize: scale(10), fontWeight: '600', marginTop: scale(2) },

  // Trip Cards
  tripCard: { backgroundColor: '#FAFAFA', borderRadius: scale(12), padding: scale(14), marginBottom: scale(10), borderWidth: 1, borderColor: '#f0f0f0' },
  tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(8), gap: scale(8) },
  tripIndexBadge: {
    width: scale(22), height: scale(22), borderRadius: scale(11),
    backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center',
  },
  tripIndexText: { fontSize: scale(10), fontWeight: '800', color: '#555' },
  tripCode: { flex: 1, fontSize: scale(12), fontWeight: '700', color: '#333', fontFamily: 'monospace' },
  tripBadge: { paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) },
  tripBadgeText: { fontSize: scale(10), fontWeight: '700', textTransform: 'uppercase' },
  tripDetails: { gap: scale(5), marginBottom: scale(10) },
  tripInfoRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  tripInfo: { fontSize: scale(12), color: '#666', flex: 1 },
  tripLinkRow: { flexDirection: 'row', gap: scale(6), borderTopWidth: 1, borderTopColor: '#EBEBEB', paddingTop: scale(10) },
  tripLinkBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(4), paddingVertical: scale(7), borderRadius: scale(8),
    backgroundColor: '#F3F4F6',
  },
  tripLinkBtnCopied: { backgroundColor: '#F0FDF4' },
  tripLinkBtnText: { fontSize: scale(11), fontWeight: '600', color: '#555' },
  tripShareBtn: { backgroundColor: '#F0FDF4' },
  tripOpenBtn: { backgroundColor: '#22C55E' },
  otpAlert: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginTop: scale(8), backgroundColor: '#EFF6FF', padding: scale(10), borderRadius: scale(8) },
  otpAlertText: { fontSize: scale(11), color: '#3B82F6', fontWeight: '500', flex: 1 },

  // Invoice
  invoiceCard: { backgroundColor: '#FAFAFA', borderRadius: scale(12), padding: scale(14), marginBottom: scale(10), borderWidth: 1, borderColor: '#f0f0f0' },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceNum: { fontSize: scale(13), fontWeight: '700', color: '#333', fontFamily: 'monospace' },
  invoiceDue: { fontSize: scale(11), color: '#888', marginTop: scale(2) },
  invoiceMeta: { fontSize: scale(11), color: '#888', marginTop: scale(2) },
  invoiceBadge: { paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) },
  invoiceBadgeText: { fontSize: scale(10), fontWeight: '700' },
  invoiceAmount: { fontSize: scale(18), fontWeight: '800', color: '#1A1A1A' },
  invoiceViewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(6), paddingVertical: scale(10), borderRadius: scale(8),
    marginTop: scale(10),
  },
  invoiceViewBtnText: { color: '#fff', fontWeight: '700', fontSize: scale(13) },

  // Total Amount
  totalAmountBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: scale(8),
  },
  totalAmountLabel: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A' },
  totalAmountValue: { fontSize: scale(20), fontWeight: '800', color: '#22C55E' },
  billingNote: { fontSize: scale(11), color: '#888', textAlign: 'center', marginTop: scale(6) },

  // Cancel
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#EF4444', borderRadius: scale(12),
    paddingVertical: scale(12), marginTop: scale(8), gap: scale(6),
  },
  cancelBtnText: { color: '#EF4444', fontWeight: '600', fontSize: scale(14) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: scale(20) },
  cancelModal: { backgroundColor: '#fff', borderRadius: scale(16), padding: scale(20) },
  cancelModalTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A', marginBottom: scale(6) },
  cancelModalSub: { fontSize: scale(13), color: '#666', marginBottom: scale(14) },
  cancelInput: { backgroundColor: '#F8F9FA', borderRadius: scale(10), padding: scale(12), height: scale(80), fontSize: scale(14), color: '#333', borderWidth: 1, borderColor: '#E9ECEF' },
  cancelModalBtns: { flexDirection: 'row', gap: scale(10), marginTop: scale(16) },
  cancelModalNoBtn: { flex: 1, paddingVertical: scale(12), borderRadius: scale(10), alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  cancelModalNoText: { fontSize: scale(14), fontWeight: '600', color: '#666' },
  cancelModalYesBtn: { flex: 1, paddingVertical: scale(12), borderRadius: scale(10), alignItems: 'center', backgroundColor: '#EF4444' },
  cancelModalYesText: { fontSize: scale(14), fontWeight: '600', color: '#fff' },

  // Quote Detail Modal
  qdOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  qdSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20),
    maxHeight: '90%', paddingHorizontal: scale(16), paddingTop: scale(8),
  },
  qdHandle: {
    width: scale(40), height: scale(4), borderRadius: scale(2),
    backgroundColor: '#ddd', alignSelf: 'center', marginBottom: scale(12),
  },
  qdHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: scale(16),
  },
  qdTitle: { fontSize: scale(18), fontWeight: '800', color: '#1A1A1A' },
  qdSubtitle: { fontSize: scale(12), color: '#888', marginTop: scale(2) },
  qdClose: { padding: scale(4) },

  qdSummaryCard: {
    backgroundColor: '#F8F9FA', borderRadius: scale(12), padding: scale(16),
    marginBottom: scale(12),
  },

  qdSection: {
    backgroundColor: '#F8F9FA', borderRadius: scale(12), padding: scale(14),
    marginBottom: scale(12), borderWidth: 1, borderColor: '#E5E7EB',
  },
  qdSectionTitle: { fontSize: scale(13), fontWeight: '700', color: '#555', marginBottom: scale(10) },
  qdSectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: scale(10) },
  qdNotes: { fontSize: scale(13), color: '#555', fontStyle: 'italic' },

  qdListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: scale(8), marginBottom: scale(6) },
  qdCheckMark: { fontSize: scale(13), color: '#22C55E', fontWeight: '700', marginTop: scale(1) },
  qdListText: { fontSize: scale(13), color: '#444', flex: 1 },

  // Vehicle in Quote Detail
  qdVehicleCard: {
    backgroundColor: '#fff', borderRadius: scale(12), overflow: 'hidden',
    marginBottom: scale(10), borderWidth: 1, borderColor: '#E5E7EB',
  },
  qdVehicleImage: {
    width: '100%', height: scale(160), backgroundColor: '#F9FAFB',
  },
  qdVehicleInfo: { padding: scale(12) },
  qdVehicleName: { fontSize: scale(15), fontWeight: '700', color: '#1A1A1A' },
  regBadge: {
    alignSelf: 'flex-start', backgroundColor: '#E5E7EB',
    paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4),
    marginTop: scale(4),
  },
  regBadgeText: { fontSize: scale(11), fontWeight: '600', color: '#555', fontFamily: 'monospace' },
  qdVehicleSpecs: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8), marginTop: scale(8) },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: scale(3) },
  specText: { fontSize: scale(11), color: '#888' },

  qdDriverRow: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    marginTop: scale(10), padding: scale(8), backgroundColor: '#F0FDF4',
    borderRadius: scale(8),
  },
  qdDriverPhoto: { width: scale(30), height: scale(30), borderRadius: scale(15) },
  qdDriverName: { fontSize: scale(12), fontWeight: '600', color: '#333' },
  qdDriverPhone: { fontSize: scale(10), color: '#888' },

  // Booking Info in QD
  qdInfoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: scale(6),
    borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', gap: scale(8),
  },
  qdInfoLabel: { flex: 1, fontSize: scale(12), color: '#888' },
  qdInfoValue: { fontSize: scale(12), fontWeight: '600', color: '#333', flex: 1.5 },

  // Created By
  createdByRow: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  createdByAvatar: {
    width: scale(32), height: scale(32), borderRadius: scale(16),
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
  },
  createdByInitial: { fontSize: scale(14), fontWeight: '700', color: '#047857' },
  createdByName: { fontSize: scale(13), fontWeight: '600', color: '#333' },

  // Accept in QD
  qdAcceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', borderRadius: scale(12), paddingVertical: scale(14),
    marginTop: scale(8), gap: scale(8),
  },
  qdAcceptBtnText: { color: '#fff', fontWeight: '700', fontSize: scale(15) },
});
