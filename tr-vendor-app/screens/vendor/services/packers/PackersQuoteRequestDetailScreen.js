import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getQuoteRequestById } from '../../../api/client';
import { showError, showInfo } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
};

const STATUS_CONFIG = {
  PENDING:         { color: '#D97706', bg: '#FFFBEB', label: 'Pending',         icon: 'time-outline'         },
  QUOTES_RECEIVED: { color: '#2563EB', bg: '#EFF6FF', label: 'Quotes Received', icon: 'document-text'        },
  ACCEPTED:        { color: '#059669', bg: '#ECFDF5', label: 'Accepted',        icon: 'checkmark-circle'     },
  REJECTED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected',        icon: 'close-circle'         },
  EXPIRED:         { color: '#94A3B8', bg: '#F1F5F9', label: 'Expired',         icon: 'alert-circle'         },
};

export default function PackersQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      showError('Request ID is missing');
      navigation.goBack();
      return;
    }
    try {
      const data = await getQuoteRequestById('packers', requestId);
      const requestData = data.request || data;
      setRequest({ ...requestData, hasQuoted: data.hasQuoted, vendorQuote: data.vendorQuote });
      setBookingId(data.bookingId || null);
    } catch (error) {
      showError('Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId, navigation]);

  useEffect(() => { fetchRequestDetail(); }, [fetchRequestDetail]);

  const onRefresh = () => { setRefreshing(true); fetchRequestDetail(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    const timeParts = timeStr.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] || '00';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  const handleSendQuote = () => {
    navigation.navigate('PackersSendQuote', { requestId: request.id || request._id });
  };

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Request Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.centeredTxt}>Loading request...</Text>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Request Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="clipboard-outline" size={56} color={C.muted} />
          <Text style={s.centeredTxt}>Request not found</Text>
        </View>
      </View>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const customerName = request.customerName || request.customer_name || 'Customer';
  const customerEmail = request.customerEmail || request.customer_email;
  const shiftingType = request.shiftingType || request.shifting_type;
  const specificType = request.specificType || request.specific_type;
  const fromAddress = request.fromAddress || request.from_address || request.pickupAddress || request.pickupCity || 'N/A';
  const toAddress = request.toAddress || request.to_address || request.dropAddress || request.dropCity;
  const movingDate = request.movingDate || request.moving_date || request.preferredDate || request.scheduledDate;
  const movingTime = request.movingTime || request.moving_time || request.scheduledTime;
  const customerNotes = request.customerNotes || request.notes || request.description;
  const requestNumber = request.requestNumber || (request.id || request._id)?.toString().slice(-8);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.deco1} /><View style={s.deco2} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Quote Request</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.heroCard}>
          <View style={s.heroCardTop}>
            <View>
              <Text style={s.heroLabel}>REQUEST #</Text>
              <Text style={s.heroNumber}>{requestNumber}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.color + '22', borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.heroMetaTxt}>Received {formatDate(request.createdAt)}</Text>
            </View>
            {request.hasQuoted && (
              <View style={s.heroMetaItem}>
                <Ionicons name="checkmark-circle" size={11} color={C.g400} />
                <Text style={[s.heroMetaTxt, { color: C.g400 }]}>Quote Sent</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
      >
        {/* Quote sent banner */}
        {request.hasQuoted && (
          <View style={s.quotedBanner}>
            <View style={[s.quotedIconBox, { backgroundColor: C.g50 }]}>
              <Ionicons name="checkmark-circle" size={20} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.quotedBannerTitle}>Quote Already Sent</Text>
              {request.vendorQuote?.grandTotal && (
                <Text style={s.quotedBannerAmount}>
                  ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                  {request.vendorQuote?.status ? `  ·  ${request.vendorQuote.status}` : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Customer */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.blueL }]}>
              <Ionicons name="person-outline" size={16} color={C.blue} />
            </View>
            <Text style={s.sectionTitle}>Customer</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Name</Text>
            <Text style={s.infoValue}>{customerName}</Text>
          </View>
          {customerEmail && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue}>{customerEmail}</Text>
            </View>
          )}
        </View>

        {/* Shifting Details */}
        {(shiftingType || specificType) && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.amberL }]}>
                <MaterialCommunityIcons name="home-switch-outline" size={16} color={C.amber} />
              </View>
              <Text style={s.sectionTitle}>Shifting Type</Text>
            </View>
            <View style={s.shiftRow}>
              <MaterialCommunityIcons
                name={shiftingType?.toLowerCase() === 'office' ? 'office-building' : 'home'}
                size={32} color={C.g600}
              />
              <View style={{ flex: 1 }}>
                {shiftingType && <Text style={s.shiftTypeText}>{shiftingType.charAt(0).toUpperCase() + shiftingType.slice(1)} Shifting</Text>}
                {specificType && (
                  <View style={s.specificBadge}>
                    <Text style={s.specificBadgeTxt}>{specificType}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Address */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.g50 }]}>
              <Ionicons name="location-outline" size={16} color={C.g600} />
            </View>
            <Text style={s.sectionTitle}>Addresses</Text>
          </View>
          <View style={s.locationRow}>
            <View style={[s.locationDot, { backgroundColor: C.g600 }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.locationLabel}>FROM (Pickup)</Text>
              <Text style={s.locationValue}>{fromAddress}</Text>
            </View>
          </View>
          {toAddress && (
            <>
              <View style={s.locationLine} />
              <View style={s.locationRow}>
                <View style={[s.locationDot, { backgroundColor: C.red }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.locationLabel}>TO (Destination)</Text>
                  <Text style={s.locationValue}>{toAddress}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Moving Date */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.blueL }]}>
              <Ionicons name="calendar-outline" size={16} color={C.blue} />
            </View>
            <Text style={s.sectionTitle}>Moving Date</Text>
          </View>
          <View style={s.dateRow}>
            <View style={s.dateItem}>
              <Ionicons name="calendar" size={16} color={C.muted} />
              <View>
                <Text style={s.infoLabel}>Date</Text>
                <Text style={s.dateValue}>{formatDate(movingDate)}</Text>
              </View>
            </View>
            {movingTime && (
              <View style={s.dateItem}>
                <Ionicons name="time-outline" size={16} color={C.muted} />
                <View>
                  <Text style={s.infoLabel}>Time</Text>
                  <Text style={s.dateValue}>{formatTime(movingTime)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Customer Notes */}
        {customerNotes && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="chatbox-outline" size={16} color="#0D9488" />
              </View>
              <Text style={s.sectionTitle}>Customer Notes</Text>
            </View>
            <Text style={s.notesText}>{customerNotes}</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.bg }]}>
              <Ionicons name="time-outline" size={16} color={C.muted} />
            </View>
            <Text style={s.sectionTitle}>Timeline</Text>
          </View>
          <View style={s.timelineRow}>
            <Ionicons name="add-circle" size={16} color={C.g600} />
            <Text style={s.timelineText}>Received on {formatDate(request.createdAt)}</Text>
          </View>
          {request.updatedAt && request.updatedAt !== request.createdAt && (
            <View style={s.timelineRow}>
              <Ionicons name="refresh" size={16} color={C.muted} />
              <Text style={s.timelineText}>Updated on {formatDate(request.updatedAt)}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.blue }]}
            onPress={() => {
              if (bookingId) navigation.navigate('PackersBookingDetail', { bookingId });
              else showInfo('Booking details will appear in your Bookings section shortly.');
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={s.bottomBtnTxt}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      )}
      {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.bottomBtn, { backgroundColor: C.g600 }]} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={s.bottomBtnTxt}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      {request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' && (
        <View style={[s.bottomBar, { backgroundColor: C.g50, borderTopColor: C.g100 }]}>
          <View style={s.quotedBar}>
            <Ionicons name="checkmark-circle" size={22} color={C.g600} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.quotedBarTitle}>Quote Already Sent</Text>
              {request.vendorQuote?.grandTotal && (
                <Text style={s.quotedBarSub}>₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centeredTxt: { fontSize: 15, color: C.muted, marginTop: 8 },

  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(52,211,153,0.08)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.06)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: C.g400, letterSpacing: 1, marginBottom: 4 },
  heroNumber: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroMeta: { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  quotedBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.g50,
    borderRadius: 14, padding: 14, gap: 12, marginBottom: 12,
    borderWidth: 1, borderColor: C.g100,
  },
  quotedIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quotedBannerTitle: { fontSize: 13, fontWeight: '700', color: C.g700 },
  quotedBannerAmount: { fontSize: 12, color: C.g600, marginTop: 2 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shiftTypeText: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  specificBadge: { backgroundColor: C.amberL, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  specificBadgeTxt: { fontSize: 12, fontWeight: '600', color: C.amber },

  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  locationLine: { width: 2, height: 14, backgroundColor: C.border, marginLeft: 4, marginVertical: 2 },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  locationLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  locationValue: { fontSize: 14, fontWeight: '600', color: C.text },

  dateRow: { flexDirection: 'row', gap: 20 },
  dateItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  dateValue: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 3 },

  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  timelineText: { fontSize: 13, color: C.sub },

  amberL: C.amberL,

  bottomBar: {
    backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
  },
  bottomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  bottomBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  quotedBar: { flexDirection: 'row', alignItems: 'center' },
  quotedBarTitle: { fontSize: 14, fontWeight: '700', color: C.g700 },
  quotedBarSub: { fontSize: 12, color: C.g600, marginTop: 2 },
});
