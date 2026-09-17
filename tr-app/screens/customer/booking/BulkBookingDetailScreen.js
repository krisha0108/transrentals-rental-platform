// BulkBookingDetailScreen.js — Customer-facing detail view for a CUSTOM_BULK
// (multi-day event) booking. Mirrors what admin/manager see but trimmed to
// what's relevant for the customer:
//   - Status + booking number + occasion summary
//   - Day-wise plan (read-only) parsed from bulkBreakdown JSON
//   - Super quote received → Accept / Reject actions
//   - Trips list (once confirmed) — each trip links out to /trip/<code>
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  RefreshControl, Linking, Pressable, Modal, Image, Dimensions, Share, ToastAndroid, Platform,} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import api from '../../api';

const ACCENT = '#7C3AED';
const ACCENT_DARK = '#5B21B6';
const BG = '#F5F5F7';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const MUTED = '#6B7280';

const STATUS_META = {
  OPEN_FOR_QUOTES:  { label: 'Awaiting Vendor Quotes', color: '#0284C7', bg: '#E0F2FE' },
  QUOTES_RECEIVED:  { label: 'Quotes Received',         color: '#7C3AED', bg: '#EDE9FE' },
  SUPER_QUOTE_SENT: { label: 'Quote Ready For You',     color: '#B45309', bg: '#FEF3C7' },
  CONFIRMED:        { label: 'Confirmed',               color: '#059669', bg: '#D1FAE5' },
  TRIPS_CREATED:    { label: 'Trips Scheduled',         color: '#0D9488', bg: '#CCFBF1' },
  IN_PROGRESS:      { label: 'In Progress',             color: '#16A34A', bg: '#DCFCE7' },
  COMPLETED:        { label: 'Completed',               color: '#475569', bg: '#E2E8F0' },
  INVOICED:         { label: 'Invoiced',                color: '#EA580C', bg: '#FFEDD5' },
  PAID:             { label: 'Paid',                    color: '#15803D', bg: '#DCFCE7' },
  CANCELLED:        { label: 'Cancelled',               color: '#B91C1C', bg: '#FEE2E2' },
};

// Per-service chip styling for the day-wise plan.
const SERVICE_META = {
  car:          { icon: 'car',                  cls: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }, label: 'Car Rental' },
  selfdrive:    { icon: 'key',                  cls: { bg: '#F0F9FF', border: '#BAE6FD', color: '#075985' }, label: 'Self Drive' },
  'self-drive': { icon: 'key',                  cls: { bg: '#F0F9FF', border: '#BAE6FD', color: '#075985' }, label: 'Self Drive' },
  bus:          { icon: 'bus',                  cls: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }, label: 'Bus' },
  truck:        { icon: 'truck',                cls: { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B' }, label: 'Truck' },
  bike:         { icon: 'bicycle',              cls: { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E' }, label: 'Bike' },
  equipment:    { icon: 'toolbox',              cls: { bg: '#ECFEFF', border: '#A5F3FC', color: '#155E75' }, label: 'Equipment' },
  packers:      { icon: 'package-variant',      cls: { bg: '#FDF2F8', border: '#FBCFE8', color: '#9D174D' }, label: 'Packers' },
  luxury:       { icon: 'star',                 cls: { bg: '#FAF5FF', border: '#E9D5FF', color: '#6B21A8' }, label: 'Luxury Car' },
};

const formatDayLabel = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};
const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Derive the host root (no /api) from the configured API baseURL so we can
// resolve relative image paths like /uploads/... into full URLs.
const HOST_ROOT = (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '');
const resolveImageUrl = (u) => {
  if (!u || typeof u !== 'string') return null;
  if (/^https?:\/\//.test(u)) return u;
  return `${HOST_ROOT}${u.startsWith('/') ? '' : '/'}${u}`;
};

// Parse vehicle images from various shapes the picker / fleet APIs return:
// JSON string, object map, array, or single side-image fallback.
const collectImages = (vehicle) => {
  if (!vehicle) return [];
  const out = [];
  if (vehicle.images) {
    try {
      const parsed = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
      if (Array.isArray(parsed)) {
        for (const x of parsed) if (typeof x === 'string' && x) out.push(x);
      } else if (parsed && typeof parsed === 'object') {
        for (const x of Object.values(parsed)) if (typeof x === 'string' && x) out.push(x);
      }
    } catch { /* ignore */ }
  }
  if (vehicle.vehicle_models?.sideImage && !out.includes(vehicle.vehicle_models.sideImage)) {
    out.unshift(vehicle.vehicle_models.sideImage);
  }
  if (out.length === 0 && vehicle.chauffeur_vehicle_categories?.image) {
    out.push(vehicle.chauffeur_vehicle_categories.image);
  }
  return out.map(resolveImageUrl).filter(Boolean);
};

// VehicleCard — single column card with horizontal image carousel + chips.
// Used in the "Assigned Vehicles" section once a super quote exists.
const CARD_IMG_HEIGHT = 180;
function VehicleCard({ index, vehicle, driver, isSelfDrive }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = collectImages(vehicle);
  const v = vehicle || {};
  const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
  const modelName = v?.vehicle_models?.name || v?.vehicleName || '';
  const displayName = (brandName + ' ' + modelName).trim() || 'Vehicle';
  const screenWidth = Dimensions.get('window').width;
  // Card sits inside ScrollView with padding: 16, so available width is
  // screenWidth - 32. The image fills that width.
  const imgWidth = screenWidth - 32 - 2; // subtract border

  return (
    <View style={vcStyles.card}>
      {images.length > 0 ? (
        <View style={[vcStyles.carouselWrap, { height: CARD_IMG_HEIGHT }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / imgWidth);
              setImgIdx(Math.max(0, Math.min(images.length - 1, idx)));
            }}
          >
            {images.map((src, i) => (
              <View key={i} style={{ width: imgWidth, height: CARD_IMG_HEIGHT }}>
                <Image source={{ uri: src }} style={vcStyles.carouselImg} resizeMode="cover" />
                <View style={vcStyles.imageGradient} />
              </View>
            ))}
          </ScrollView>
          <View style={vcStyles.indexBadge}><Text style={vcStyles.indexBadgeText}>{index + 1}</Text></View>
          <View style={vcStyles.nameOverlay}>
            <Text style={vcStyles.nameOverlayText} numberOfLines={1}>{displayName}</Text>
          </View>
          {images.length > 1 && (
            <View style={vcStyles.dotsRow}>
              {images.map((_, j) => (
                <View
                  key={j}
                  style={[vcStyles.dot, j === imgIdx && vcStyles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={vcStyles.noImage}>
          <Icon name="truck" size={36} color="#CBD5E1" />
          <View style={vcStyles.indexBadge}><Text style={[vcStyles.indexBadgeText, { color: '#475569' }]}>{index + 1}</Text></View>
        </View>
      )}

      <View style={vcStyles.body}>
        {images.length === 0 && (
          <Text style={vcStyles.bodyName}>{displayName}</Text>
        )}
        <View style={vcStyles.chipRow}>
          {!!v.registrationNumber && (
            <View style={[vcStyles.chip, vcStyles.chipReg]}>
              <Text style={vcStyles.chipRegText}>{v.registrationNumber}</Text>
            </View>
          )}
          {!!v.color && (
            <View style={[vcStyles.chip, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[vcStyles.chipText, { color: '#4B5563' }]}>{v.color}</Text>
            </View>
          )}
          {!!v.seatingCapacity && (
            <View style={[vcStyles.chip, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="users" size={10} color="#1D4ED8" />
              <Text style={[vcStyles.chipText, { color: '#1D4ED8' }]}>{v.seatingCapacity} seats</Text>
            </View>
          )}
          {!!v.fuelType && (
            <View style={[vcStyles.chip, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="droplet" size={10} color="#15803D" />
              <Text style={[vcStyles.chipText, { color: '#15803D' }]}>{v.fuelType}</Text>
            </View>
          )}
          {!!v.transmission && (
            <View style={[vcStyles.chip, { backgroundColor: '#EDE9FE' }]}>
              <MaterialCommunityIcons name="cog" size={10} color="#6D28D9" />
              <Text style={[vcStyles.chipText, { color: '#6D28D9' }]}>{v.transmission}</Text>
            </View>
          )}
          {!!v.yearOfManufacture && (
            <View style={[vcStyles.chip, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[vcStyles.chipText, { color: '#B45309' }]}>{v.yearOfManufacture}</Text>
            </View>
          )}
        </View>

        {!isSelfDrive && driver ? (
          <View style={vcStyles.driverCard}>
            {driver.profilePhoto ? (
              <Image source={{ uri: resolveImageUrl(driver.profilePhoto) }} style={vcStyles.driverPhoto} />
            ) : (
              <View style={vcStyles.driverPhotoFallback}>
                <Text style={vcStyles.driverPhotoLetter}>
                  {driver.name ? driver.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={vcStyles.driverName} numberOfLines={1}>{driver.name || 'Driver'}</Text>
              {!!driver.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
                  <Text style={vcStyles.driverPhone}>
                    <Icon name="phone" size={11} color="#0D9488" /> {driver.phone}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : !isSelfDrive ? (
          <View style={vcStyles.driverPending}>
            <Icon name="clock" size={14} color="#9CA3AF" />
            <Text style={vcStyles.driverPendingText}>Driver to be assigned</Text>
          </View>
        ) : (
          <View style={vcStyles.selfDriveBadge}>
            <Icon name="key" size={12} color="#0369A1" />
            <Text style={vcStyles.selfDriveBadgeText}>Self Drive — you drive the vehicle</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const vcStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden', marginBottom: 12,
  },
  carouselWrap: { backgroundColor: '#111827', position: 'relative' },
  carouselImg: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  indexBadge: {
    position: 'absolute', top: 10, left: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  indexBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  nameOverlay: { position: 'absolute', left: 12, right: 60, bottom: 12 },
  nameOverlayText: { color: '#fff', fontWeight: '800', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  dotsRow: {
    position: 'absolute', bottom: 6, alignSelf: 'center', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 16, backgroundColor: '#fff' },
  noImage: {
    height: 110, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  body: { padding: 12 },
  bodyName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  chipReg: {
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: 4, paddingHorizontal: 6,
  },
  chipRegText: { fontSize: 11, fontWeight: '800', color: '#92400E', letterSpacing: 0.5, fontFamily: 'monospace' },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, padding: 10,
    backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0',
  },
  driverPhoto: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#34D399' },
  driverPhotoFallback: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0D9488',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#34D399',
  },
  driverPhotoLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
  driverName: { fontSize: 13, fontWeight: '800', color: '#064E3B' },
  driverPhone: { fontSize: 11, color: '#0D9488', fontWeight: '700', marginTop: 2 },
  driverPending: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, padding: 9, backgroundColor: '#F9FAFB',
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB',
  },
  driverPendingText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
  selfDriveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#E0F2FE', borderRadius: 999, alignSelf: 'flex-start',
  },
  selfDriveBadgeText: { fontSize: 11, fontWeight: '700', color: '#0369A1' },
});

// Trip link is derived from the host root so it works in dev and prod.
const buildTripLink = (tripCode) => `${HOST_ROOT}/trip/${tripCode}`;

export default function BulkBookingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const bookingId = route.params?.bookingId;

  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [acceptModal, setAcceptModal] = useState(null); // { superQuoteId, finalAmount }
  const [accepting, setAccepting] = useState(false);
  // Brief inline toast — Android uses ToastAndroid natively; iOS shows our banner.
  const [toast, setToast] = useState('');
  const showToast = useCallback((msg) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      setToast(msg);
      setTimeout(() => setToast(''), 1800);
    }
  }, []);

  // Copy a single trip link to the clipboard.
  const handleCopyTripLink = useCallback((tripCode) => {
    const link = buildTripLink(tripCode);
    Clipboard.setString(link);
    showToast('Trip link copied');
  }, [showToast]);

  // Native share sheet — WhatsApp / Messages / Mail / etc.
  const handleShareTripLink = useCallback(async (trip) => {
    const link = buildTripLink(trip.tripCode);
    const vehicleLabel = [trip.vehicleName, trip.vehicleNumber].filter(Boolean).join(' · ') || 'Vehicle';
    const dateLine = trip.scheduledDate
      ? new Date(trip.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      : '';
    const message =
      `Your TransRentals trip — ${trip.tripCode}\n` +
      `${vehicleLabel}${dateLine ? `\n${dateLine}${trip.scheduledTime ? ` · ${trip.scheduledTime}` : ''}` : ''}\n\n` +
      `Track here: ${link}`;
    try {
      await Share.share({ message, url: link, title: `Trip ${trip.tripCode}` });
    } catch { /* user dismissed share sheet — no-op */ }
  }, []);

  const fetchBooking = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/b2b/bookings/${bookingId}`);
      const data = res?.data;
      if (data?.status === 'success' && data?.booking) {
        setBooking(data.booking);
      } else {
        setError(data?.error || 'Could not load booking.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);
  // Auto-refresh every 30s — manager / super-quote status updates flow in.
  useEffect(() => {
    const iv = setInterval(fetchBooking, 30_000);
    return () => clearInterval(iv);
  }, [fetchBooking]);

  const onRefresh = () => { setRefreshing(true); fetchBooking(); };

  const acceptSuperQuote = async () => {
    if (!acceptModal?.superQuoteId) return;
    setAccepting(true);
    try {
      const res = await api.post(`/b2b/super-quotes/${acceptModal.superQuoteId}/accept`);
      const data = res?.data;
      if (data?.status === 'success') {
        setAcceptModal(null);
        fetchBooking();
      } else {
        setError(data?.error || 'Could not accept the quote.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Network error');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={{ marginTop: 12, color: MUTED }}>Loading your event…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={styles.center}>
          <Icon name="alert-circle" size={36} color={MUTED} />
          <Text style={{ marginTop: 12, color: MUTED }}>{error || 'Booking not found.'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse the bulk plan JSON.
  let plan = null;
  if (booking.bulkBreakdown) {
    try { plan = JSON.parse(booking.bulkBreakdown); } catch { plan = null; }
  }
  const statusMeta = STATUS_META[booking.status] || { label: booking.status, color: TEXT, bg: '#F3F4F6' };

  // Surface the latest "SENT" super quote — that's the one customer can accept.
  const sentSuperQuote = (booking.superQuotes || []).find((sq) => sq.status === 'SENT');
  const acceptedSuperQuote = (booking.superQuotes || []).find((sq) => sq.status === 'ACCEPTED');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{booking.bookingNumber}</Text>
          <Text style={styles.headerSub}>Multi-Day Event Booking</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Occasion summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.occasionRow}>
            <View style={styles.occasionIconWrap}>
              <MaterialCommunityIcons name="party-popper" size={26} color={ACCENT_DARK} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.occasionName} numberOfLines={1}>
                {plan?.occasion_name || (plan?.occasion_type ? `${plan.occasion_type[0].toUpperCase()}${plan.occasion_type.slice(1)} Event` : 'Multi-Day Event')}
              </Text>
              <View style={styles.occasionMeta}>
                {plan?.occasion_type && (
                  <View style={styles.occasionTypeChip}>
                    <Text style={styles.occasionTypeChipText}>{plan.occasion_type}</Text>
                  </View>
                )}
                {plan?.base_location && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Icon name="map-pin" size={12} color={MUTED} />
                    <Text style={styles.occasionMetaText}>{plan.base_location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.summaryStats}>
            {plan?.total_days != null && (
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{plan.total_days}</Text>
                <Text style={styles.summaryStatLabel}>Days</Text>
              </View>
            )}
            {plan?.total_people != null && (
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, { color: '#059669' }]}>{plan.total_people}</Text>
                <Text style={styles.summaryStatLabel}>People</Text>
              </View>
            )}
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: '#2563EB' }]}>{booking.vehiclesRequired}</Text>
              <Text style={styles.summaryStatLabel}>Vehicles</Text>
            </View>
          </View>
        </View>

        {/* Super-quote action card */}
        {sentSuperQuote && (
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <Icon name="zap" size={18} color="#B45309" />
              <Text style={styles.actionCardTitle}>Final Quote Ready</Text>
            </View>
            <Text style={styles.actionCardSub}>
              Our team has reviewed vendor quotes and prepared your final price.
            </Text>
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>{formatINR(sentSuperQuote.finalAmount)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAcceptModal({ superQuoteId: sentSuperQuote.id, finalAmount: sentSuperQuote.finalAmount })}
                style={styles.acceptBtn}
                activeOpacity={0.7}
              >
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Accept & Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {acceptedSuperQuote && (
          <View style={styles.acceptedCard}>
            <Icon name="check-circle" size={18} color="#059669" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.acceptedTitle}>Quote Accepted</Text>
              <Text style={styles.acceptedSub}>Final amount {formatINR(acceptedSuperQuote.finalAmount)} — trips will appear below.</Text>
            </View>
          </View>
        )}

        {/* Invoice card(s) — once the manager generates an invoice, the customer
            sees it here with a tap-to-pay button. Matches the web detail page. */}
        {Array.isArray(booking.invoices) && booking.invoices.length > 0 && booking.invoices.map((inv) => {
          const isPaid = inv.status === 'PAID';
          const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
          const isOverdue = !isPaid && inv.status !== 'CANCELLED' && dueDate && dueDate < new Date();
          const webBase = (api?.defaults?.baseURL || '').replace(/\/api\/?$/, '');
          const invoiceUrl = `${webBase}/invoice/b2b/${inv.id}`;
          // PDF endpoint returns Content-Disposition: attachment so the device
          // browser triggers a download (or opens its PDF viewer).
          const pdfUrl = `${webBase}/api/b2b/invoices/${inv.id}/pdf`;
          const openExternal = (url) => Linking.openURL(url).catch(() => {
            if (Platform.OS === 'android') ToastAndroid.show('Could not open link', ToastAndroid.SHORT);
          });
          return (
            <View key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.invoiceLabel}>Invoice</Text>
                  <Text style={styles.invoiceNumber} numberOfLines={1}>{inv.invoiceNumber}</Text>
                </View>
                <View style={[styles.invoiceStatusPill, isPaid ? styles.invoiceStatusPaid : styles.invoiceStatusUnpaid]}>
                  <Text style={[styles.invoiceStatusText, { color: isPaid ? '#fff' : '#9A3412' }]}>
                    {isOverdue ? 'OVERDUE' : inv.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.invoiceAmountLabel}>Total Amount</Text>
              <Text style={styles.invoiceAmount}>{formatINR(inv.totalAmount)}</Text>
              <View style={styles.invoiceMeta}>
                {dueDate && (
                  <Text style={styles.invoiceMetaText}>
                    Due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {(inv.totalVehicles != null || inv.tripsCompleted != null) && (
                  <Text style={styles.invoiceMetaText}>
                    {inv.totalVehicles ?? 0} vehicles · {inv.tripsCompleted ?? 0} trips completed
                  </Text>
                )}
              </View>
              <View style={styles.invoiceBtnRow}>
                <TouchableOpacity
                  onPress={() => openExternal(invoiceUrl)}
                  style={[styles.invoiceBtn, { flex: 1 }, isPaid && styles.invoiceBtnPaid]}
                  activeOpacity={0.7}
                >
                  <Icon name="external-link" size={15} color={isPaid ? '#fff' : '#9A3412'} />
                  <Text style={[styles.invoiceBtnText, { color: isPaid ? '#fff' : '#9A3412' }]}>
                    {isPaid ? 'View Invoice' : 'View & Pay'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openExternal(pdfUrl)}
                  style={[styles.invoiceBtn, styles.invoiceBtnSecondary]}
                  activeOpacity={0.7}
                >
                  <Icon name="download" size={15} color="#fff" />
                  <Text style={[styles.invoiceBtnText, { color: '#fff' }]}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Day-wise plan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-multiple" size={18} color={ACCENT} />
            <Text style={styles.sectionTitle}>Day-wise Plan</Text>
          </View>
          {Array.isArray(plan?.days) && plan.days.length > 0 ? plan.days.map((day, dIdx) => {
            const dayVehTotal = (day.services || []).reduce((sum, s) => {
              if (typeof s.total_vehicles === 'number') return sum + s.total_vehicles;
              if (Array.isArray(s.vehicles)) return sum + s.vehicles.reduce((a, v) => a + (Number(v.count) || 0), 0);
              return sum;
            }, 0);
            return (
              <View key={dIdx} style={styles.dayBlock}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayPill}><Text style={styles.dayPillText}>D{dIdx + 1}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.dayHeaderTitle}>Day {dIdx + 1}</Text>
                    {day.date && <Text style={styles.dayHeaderSub}>{formatDayLabel(day.date)}</Text>}
                  </View>
                  <Text style={styles.dayCount}>{dayVehTotal} veh</Text>
                </View>
                <View style={styles.dayDivider} />
                {(day.services || []).map((svc, sIdx) => {
                  const meta = SERVICE_META[svc.service_type] || { icon: 'car', cls: { bg: '#F3F4F6', border: BORDER, color: TEXT }, label: svc.service_type || 'Service' };
                  return (
                    <View key={sIdx} style={styles.serviceRow}>
                      <View style={styles.serviceTopRow}>
                        <View style={[styles.serviceChip, { backgroundColor: meta.cls.bg, borderColor: meta.cls.border }]}>
                          <MaterialCommunityIcons name={meta.icon} size={13} color={meta.cls.color} />
                          <Text style={[styles.serviceChipText, { color: meta.cls.color }]}>{meta.label}</Text>
                        </View>
                        <View style={styles.serviceMetaInline}>
                          {svc.total_vehicles != null && <Text style={styles.serviceMetaText}>{svc.total_vehicles} veh</Text>}
                          {svc.people_count != null && <Text style={styles.serviceMetaText}>· {svc.people_count} pax</Text>}
                          {svc.pickup_time && <Text style={styles.serviceMetaText}>· {svc.pickup_time}</Text>}
                        </View>
                      </View>
                      {Array.isArray(svc.vehicles) && svc.vehicles.length > 0 && (
                        <View style={styles.vehicleChipsRow}>
                          {svc.vehicles.map((v, vIdx) => (
                            <View key={vIdx} style={styles.vehicleChip}>
                              <Text style={styles.vehicleChipCount}>×{v.count}</Text>
                              <Text style={styles.vehicleChipName} numberOfLines={1}>
                                {v.vehicle_name || v.vehicle_slug || 'Vehicle'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {(svc.pickup_location || svc.drop_location) && (
                        <View style={styles.locationRow}>
                          {svc.pickup_location && (
                            <View style={styles.locationItem}>
                              <Icon name="map-pin" size={11} color="#059669" />
                              <Text style={styles.locationText} numberOfLines={1}>{svc.pickup_location}</Text>
                            </View>
                          )}
                          {svc.drop_location && (
                            <>
                              <Icon name="arrow-right" size={11} color="#D1D5DB" />
                              <View style={styles.locationItem}>
                                <Icon name="map-pin" size={11} color="#DC2626" />
                                <Text style={styles.locationText} numberOfLines={1}>{svc.drop_location}</Text>
                              </View>
                            </>
                          )}
                        </View>
                      )}
                      {svc.notes && (
                        <View style={styles.notesRow}>
                          <Icon name="message-circle" size={11} color={MUTED} />
                          <Text style={styles.notesText} numberOfLines={2}>{svc.notes}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          }) : (
            <Text style={styles.empty}>No day-wise breakdown available.</Text>
          )}
          {plan?.special_requirements && (
            <View style={styles.specialReq}>
              <Text style={styles.specialReqLabel}>Special requirements</Text>
              <Text style={styles.specialReqText}>{plan.special_requirements}</Text>
            </View>
          )}
        </View>

        {/* Assigned Vehicles — shown when a super quote exists (SENT or
            ACCEPTED). Image carousel + chips + driver, mirrors the web
            customer view. */}
        {(() => {
          const sq = sentSuperQuote || acceptedSuperQuote;
          if (!sq) return null;
          const allVehicles = (sq.items || []).flatMap((it) => it.vendorQuote?.quoteVehicles || []);
          if (allVehicles.length === 0) return null;
          // Self-drive only when ALL assigned vehicles have no driver (loose
          // heuristic; for mixed-day bulk events, individual rows still show
          // the right state per vehicle below).
          const allSelfDrive = allVehicles.every((qv) => !qv.driver && !qv.driverName);
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="car-multiple" size={18} color={ACCENT} />
                <Text style={styles.sectionTitle}>Assigned Vehicles ({allVehicles.length})</Text>
              </View>
              {allVehicles.map((qv, i) => (
                <VehicleCard
                  key={qv.id || i}
                  index={i}
                  vehicle={qv.vehicle}
                  driver={qv.driver}
                  isSelfDrive={!qv.driver && !qv.driverName}
                />
              ))}
            </View>
          );
        })()}

        {/* Trips section — appears after confirmation */}
        {Array.isArray(booking.trips) && booking.trips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="navigation" size={18} color={ACCENT} />
              <Text style={styles.sectionTitle}>Your Trips ({booking.trips.length})</Text>
            </View>
            {booking.trips.map((t) => (
              <View key={t.id} style={styles.tripCard}>
                <View style={styles.tripCardHeader}>
                  <View style={styles.tripCardLeft}>
                    <Text style={styles.tripCode}>{t.tripCode}</Text>
                    <Text style={styles.tripVehicle} numberOfLines={1}>
                      {t.vehicleName || 'Vehicle'}
                      {t.vehicleNumber ? ` · ${t.vehicleNumber}` : ''}
                    </Text>
                    <View style={styles.tripMetaRow}>
                      <Icon name="calendar" size={11} color={MUTED} />
                      <Text style={styles.tripMetaText}>
                        {new Date(t.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {t.scheduledTime}
                      </Text>
                    </View>
                    {!!t.pickupLocation && (
                      <View style={styles.tripMetaRow}>
                        <Icon name="map-pin" size={11} color="#059669" />
                        <Text style={styles.tripMetaText} numberOfLines={1}>{t.pickupLocation}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tripCardRight}>
                    <View style={[styles.tripStatusPill, { backgroundColor: (STATUS_META[t.status]?.bg || '#F3F4F6') }]}>
                      <Text style={[styles.tripStatusText, { color: STATUS_META[t.status]?.color || TEXT }]}>
                        {(t.status || 'PENDING').replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Link preview + action row */}
                <View style={styles.tripLinkRow}>
                  <Icon name="link" size={11} color={ACCENT} />
                  <Text style={styles.tripLinkText} numberOfLines={1}>{buildTripLink(t.tripCode)}</Text>
                </View>
                <View style={styles.tripActionsRow}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(buildTripLink(t.tripCode))}
                    style={[styles.tripActionBtn, styles.tripActionBtnPrimary]}
                    activeOpacity={0.7}
                  >
                    <Icon name="external-link" size={13} color="#fff" />
                    <Text style={styles.tripActionBtnTextPrimary}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCopyTripLink(t.tripCode)}
                    style={styles.tripActionBtn}
                    activeOpacity={0.7}
                  >
                    <Icon name="copy" size={13} color={ACCENT_DARK} />
                    <Text style={styles.tripActionBtnText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleShareTripLink(t)}
                    style={styles.tripActionBtn}
                    activeOpacity={0.7}
                  >
                    <Icon name="share-2" size={13} color={ACCENT_DARK} />
                    <Text style={styles.tripActionBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Vendor responses count (informational) */}
        {!!(booking.vendorQuotes?.length || 0) && !sentSuperQuote && !acceptedSuperQuote && (
          <View style={styles.infoBox}>
            <Icon name="info" size={14} color={ACCENT_DARK} />
            <Text style={styles.infoBoxText}>
              {booking.vendorQuotes.length} vendor{booking.vendorQuotes.length === 1 ? '' : 's'} responded so far.
              Our team is finalising your quote — you'll be notified once it's ready.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* iOS-friendly inline toast (Android uses native ToastAndroid above) */}
      {!!toast && Platform.OS !== 'android' && (
        <View pointerEvents="none" style={styles.toastBanner}>
          <Icon name="check" size={14} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Accept-quote confirmation modal */}
      <Modal visible={!!acceptModal} transparent animationType="fade" onRequestClose={() => setAcceptModal(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable onPress={() => !accepting && setAcceptModal(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Icon name="check-circle" size={28} color="#059669" />
            </View>
            <Text style={styles.modalTitle}>Confirm Booking?</Text>
            <Text style={styles.modalMessage}>
              You'll confirm this booking at {formatINR(acceptModal?.finalAmount || 0)}.
              Trips will be scheduled and you'll receive trip details.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAcceptModal(null)}
                disabled={accepting}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={acceptSuperQuote}
                disabled={accepting}
                style={[styles.modalConfirmBtn, accepting && { opacity: 0.6 }]}
              >
                {accepting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Icon name="check" size={16} color="#fff" />}
                <Text style={styles.modalConfirmText}>{accepting ? 'Confirming…' : 'Yes, Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: ACCENT, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  // Summary card
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14, marginBottom: 14,
  },
  occasionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  occasionIconWrap: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  occasionName: { fontSize: 16, fontWeight: '800', color: TEXT },
  occasionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  occasionTypeChip: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9D5FF',
  },
  occasionTypeChipText: { fontSize: 10, fontWeight: '800', color: ACCENT_DARK, textTransform: 'uppercase', letterSpacing: 0.5 },
  occasionMetaText: { fontSize: 12, color: MUTED, fontWeight: '600' },
  summaryStats: {
    flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  summaryStat: {
    flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10,
    paddingVertical: 8,
  },
  summaryStatValue: { fontSize: 20, fontWeight: '800', color: ACCENT_DARK, fontVariant: ['tabular-nums'] },
  summaryStatLabel: { fontSize: 10, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  // Action card
  actionCard: {
    backgroundColor: '#FEFCE8', borderRadius: 14, borderWidth: 1, borderColor: '#FDE68A',
    padding: 14, marginBottom: 14,
  },
  actionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCardTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  actionCardSub: { fontSize: 12, color: '#78350F', marginTop: 4 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, gap: 12, flexWrap: 'wrap',
  },
  amountLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 22, fontWeight: '800', color: '#78350F' },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  // Accepted card
  acceptedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', borderWidth: 1,
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  acceptedTitle: { fontSize: 13, fontWeight: '800', color: '#065F46' },
  acceptedSub: { fontSize: 11, color: '#065F46', marginTop: 2 },
  // Invoice card — orange gradient look (no LinearGradient dep, so flat orange)
  invoiceCard: {
    backgroundColor: '#F97316', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#F97316', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  invoiceHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  invoiceLabel: { color: '#FED7AA', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  invoiceNumber: { color: '#fff', fontSize: 13, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2 },
  invoiceStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  invoiceStatusPaid: { backgroundColor: 'rgba(255,255,255,0.25)' },
  invoiceStatusUnpaid: { backgroundColor: '#fff' },
  invoiceStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  invoiceAmountLabel: { color: '#FED7AA', fontSize: 11 },
  invoiceAmount: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  invoiceMeta: { marginTop: 8, marginBottom: 12 },
  invoiceMetaText: { color: '#FFEDD5', fontSize: 11, marginTop: 2 },
  invoiceBtnRow: { flexDirection: 'row', gap: 8 },
  invoiceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
  },
  invoiceBtnPaid: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  invoiceBtnSecondary: {
    backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14,
  },
  invoiceBtnText: { fontSize: 14, fontWeight: '900' },
  // Section
  section: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14, marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT },
  empty: { fontSize: 12, color: MUTED, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  // Day block
  dayBlock: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    marginBottom: 10, overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    backgroundColor: '#F9FAFB',
  },
  dayPill: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  dayPillText: { fontSize: 11, fontWeight: '800', color: ACCENT_DARK },
  dayHeaderTitle: { fontSize: 13, fontWeight: '800', color: TEXT },
  dayHeaderSub: { fontSize: 11, color: MUTED, marginTop: 1 },
  dayCount: {
    fontSize: 11, fontWeight: '800', color: ACCENT_DARK, backgroundColor: '#EDE9FE',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  dayDivider: { height: 1, backgroundColor: BORDER },
  // Service row
  serviceRow: { padding: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  serviceTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  serviceChipText: { fontSize: 11, fontWeight: '800' },
  serviceMetaInline: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  serviceMetaText: { fontSize: 11, color: MUTED, fontWeight: '600' },
  vehicleChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  vehicleChipCount: { fontSize: 10, fontWeight: '800', color: ACCENT_DARK, fontVariant: ['tabular-nums'] },
  vehicleChipName: { fontSize: 11, color: TEXT, fontWeight: '600', maxWidth: 160 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 },
  locationText: { fontSize: 11, color: TEXT, flex: 1 },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6 },
  notesText: { fontSize: 11, color: MUTED, fontStyle: 'italic', flex: 1 },
  specialReq: {
    marginTop: 4, padding: 10, backgroundColor: '#F5F3FF',
    borderRadius: 10, borderWidth: 1, borderColor: '#E9D5FF',
  },
  specialReqLabel: { fontSize: 10, fontWeight: '800', color: ACCENT_DARK, textTransform: 'uppercase', letterSpacing: 0.5 },
  specialReqText: { fontSize: 12, color: ACCENT_DARK, marginTop: 4 },
  // Trip card
  tripCard: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    padding: 10, marginBottom: 10, backgroundColor: '#F9FAFB',
  },
  tripCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripCardLeft: { flex: 1, minWidth: 0 },
  tripCode: { fontSize: 12, fontWeight: '800', color: ACCENT_DARK, fontFamily: 'monospace' },
  tripVehicle: { fontSize: 13, fontWeight: '700', color: TEXT, marginTop: 2 },
  tripMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  tripMetaText: { fontSize: 11, color: MUTED, flex: 1 },
  tripCardRight: { alignItems: 'flex-end', gap: 8 },
  tripStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tripStatusText: { fontSize: 10, fontWeight: '700' },
  // Trip share-link row + actions
  tripLinkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F3FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    marginTop: 10,
  },
  tripLinkText: {
    fontSize: 11, color: ACCENT_DARK, flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tripActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tripActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  tripActionBtnText: { fontSize: 12, fontWeight: '700', color: ACCENT_DARK },
  tripActionBtnPrimary: { backgroundColor: ACCENT, borderColor: ACCENT },
  tripActionBtnTextPrimary: { fontSize: 12, fontWeight: '800', color: '#fff' },
  // iOS toast banner
  toastBanner: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(15,23,42,0.92)', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  toastText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, backgroundColor: '#F5F3FF', borderRadius: 10,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  infoBoxText: { fontSize: 12, color: ACCENT_DARK, flex: 1, lineHeight: 17 },
  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 340, backgroundColor: '#fff',
    borderRadius: 18, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: TEXT, textAlign: 'center' },
  modalMessage: { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { color: TEXT, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '800' },
});
