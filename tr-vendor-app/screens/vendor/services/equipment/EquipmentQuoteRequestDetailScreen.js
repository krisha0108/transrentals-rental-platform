import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequestById, getBaseURL, getSessionToken } from '../../../api/client';
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
  PENDING:         { color: C.amber,  bg: C.amberL,  icon: 'time-outline',           label: 'Pending' },
  QUOTES_RECEIVED: { color: C.blue,   bg: C.blueL,   icon: 'document-text-outline',  label: 'Quotes Received' },
  QUOTED:          { color: C.blue,   bg: C.blueL,   icon: 'document-text-outline',  label: 'Quoted' },
  ACCEPTED:        { color: C.g600,   bg: C.g50,     icon: 'checkmark-circle',        label: 'Accepted' },
  REJECTED:        { color: C.red,    bg: C.redL,    icon: 'close-circle',            label: 'Rejected' },
  EXPIRED:         { color: C.muted,  bg: '#F8FAFC', icon: 'alert-circle-outline',    label: 'Expired' },
};

const EQUIPMENT_TYPE_MAP = {
  '1': 'Grove crane', '2': 'Truck mounted crane', '3': 'Tower crane',
  '4': 'Telescopic crane', '5': 'Rough terrain crane', '6': 'Overhead crane',
  '7': 'Bulldozer', '8': 'Dumper', '9': 'Loader', '10': 'Excavators', '11': 'Backhoe loader',
};

const JOB_DURATION_MAP = {
  '1': '1 to 5 Days', '2': '6 to 15 Days', '3': '16 to 30 Days', '4': 'More than 30 Days',
};

export default function EquipmentQuoteRequestDetailScreen({ route, navigation }) {
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
      const data = await getQuoteRequestById('equipment', requestId);
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
                <MaterialCommunityIcons name="hammer-wrench" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Request Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
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
              <Text style={s.heroTitle}>Request Details</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="clipboard-outline" size={64} color={C.muted} />
          <Text style={s.emptyTitle}>Request Not Found</Text>
        </View>
      </View>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);

  const customerName  = request.customerName || request.customer_name || 'Customer';
  const customerEmail = request.customerEmail || request.customer_email;
  const customerPhone = request.customerPhone || request.customer_phone;

  const handleCallCustomer = () => {
    if (!customerPhone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType: 'equipment_quote_request', bookingId: request.id, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${customerPhone}`);
  };

  const equipmentCategory = request.equipmentCategory || request.equipment_category;
  const equipmentTypeRaw = request.equipmentType || request.equipment_type;
  const equipmentType = EQUIPMENT_TYPE_MAP[equipmentTypeRaw] || equipmentTypeRaw;
  const equipmentName = request.equipmentName || request.equipment_name || request.specificModel;
  const companyName = request.companyName || request.company_name;
  const quantity = request.quantity || 1;
  const rentalDays = request.rentalDays || request.rental_days;
  const jobDurationRaw = request.jobDuration || request.job_duration || request.rentalDuration;
  const jobDuration = JOB_DURATION_MAP[jobDurationRaw] || jobDurationRaw;

  const deliveryCity = request.deliveryCity || request.delivery_city || request.pickupCity;
  const deliveryAddress = request.deliveryAddress || request.delivery_address;
  const siteType = request.siteType || request.site_type;

  const startDate = request.startDate || request.start_date || request.pickupDate;
  const endDate = request.endDate || request.end_date;

  const needOperator = request.needOperator || request.need_operator;
  const needDelivery = request.needDelivery || request.need_delivery;
  const needInstallation = request.needInstallation || request.need_installation;

  const notes = request.requirements || request.customerNotes || request.notes || request.description;

  const handleSendQuote = () => {
    navigation.navigate('EquipmentSendQuote', { requestId: request.id || request._id });
  };

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
            <MaterialCommunityIcons name="hammer-wrench" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Request Details</Text>
          </View>
          <TouchableOpacity style={s.backBtn} onPress={onRefresh}>
            <Icon name="refresh-cw" size={16} color={C.g400} />
          </TouchableOpacity>
        </View>

        <View style={s.heroCard}>
          <View style={s.heroRow}>
            <View>
              <Text style={s.heroReqNum}>Request #{requestNumber}</Text>
              <Text style={s.heroService}>Equipment Rental</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[s.statusPillTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          {request.hasQuoted && (
            <View style={s.quotedBanner}>
              <Ionicons name="checkmark-circle" size={14} color={C.g600} />
              <Text style={s.quotedBannerTxt}>
                Quote sent{request.vendorQuote?.grandTotal ? ` · ₹${Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}` : ''}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
        contentContainerStyle={s.content}
      >
        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer</Text>
          <View style={s.card}>
            <InfoRow icon={<Ionicons name="person" size={16} color={C.muted} />} label="Name" value={customerName} />
            {customerEmail && <InfoRow icon={<Ionicons name="mail" size={16} color={C.muted} />} label="Email" value={customerEmail} />}
            {customerPhone ? (
              <TouchableOpacity
                onPress={handleCallCustomer}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 }}
              >
                <Ionicons name="call" size={16} color={C.g600} />
                <Text style={{ color: C.g600, fontWeight: '700', fontSize: 14 }}>Call Customer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Equipment Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Equipment Details</Text>
          <View style={s.card}>
            {equipmentCategory && <InfoRow icon={<MaterialCommunityIcons name="shape-outline" size={16} color={C.muted} />} label="Category" value={equipmentCategory} />}
            {equipmentType && <InfoRow icon={<MaterialCommunityIcons name="tag-outline" size={16} color={C.muted} />} label="Equipment Type" value={equipmentType} />}
            {equipmentName && <InfoRow icon={<MaterialCommunityIcons name="hammer-wrench" size={16} color={C.g600} />} label="Model / Name" value={equipmentName} />}
            <InfoRow icon={<Ionicons name="layers-outline" size={16} color={C.muted} />} label="Quantity" value={`${quantity}`} />
            {rentalDays && <InfoRow icon={<Ionicons name="calendar-outline" size={16} color={C.muted} />} label="Rental Days" value={`${rentalDays} days`} />}
            {jobDuration && <InfoRow icon={<Ionicons name="time-outline" size={16} color={C.muted} />} label="Duration" value={jobDuration} />}
            {companyName && <InfoRow icon={<Ionicons name="business-outline" size={16} color={C.muted} />} label="Company" value={companyName} />}
          </View>
        </View>

        {/* Delivery Location */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Location</Text>
          <View style={s.card}>
            {deliveryCity && <InfoRow icon={<Ionicons name="location" size={16} color={C.g600} />} label="City" value={deliveryCity} />}
            {deliveryAddress && <InfoRow icon={<Ionicons name="navigate" size={16} color={C.muted} />} label="Address" value={deliveryAddress} />}
            {siteType && <InfoRow icon={<MaterialCommunityIcons name="home-city-outline" size={16} color={C.muted} />} label="Site Type" value={siteType} />}
          </View>
        </View>

        {/* Rental Period */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Rental Period</Text>
          <View style={s.card}>
            {startDate && <InfoRow icon={<Ionicons name="calendar" size={16} color={C.g600} />} label="Start Date" value={formatDate(startDate)} />}
            {endDate && <InfoRow icon={<Ionicons name="calendar" size={16} color={C.red} />} label="End Date" value={formatDate(endDate)} />}
          </View>
        </View>

        {/* Service Requirements */}
        {(needOperator !== undefined || needDelivery !== undefined || needInstallation !== undefined) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Service Requirements</Text>
            <View style={s.card}>
              {needOperator !== undefined && (
                <View style={s.reqRow}>
                  <Ionicons name={needOperator ? 'checkmark-circle' : 'close-circle'} size={18} color={needOperator ? C.g600 : C.red} />
                  <Text style={s.reqText}>Operator Required</Text>
                </View>
              )}
              {needDelivery !== undefined && (
                <View style={s.reqRow}>
                  <Ionicons name={needDelivery ? 'checkmark-circle' : 'close-circle'} size={18} color={needDelivery ? C.g600 : C.red} />
                  <Text style={s.reqText}>Delivery Required</Text>
                </View>
              )}
              {needInstallation !== undefined && (
                <View style={s.reqRow}>
                  <Ionicons name={needInstallation ? 'checkmark-circle' : 'close-circle'} size={18} color={needInstallation ? C.g600 : C.red} />
                  <Text style={s.reqText}>Installation Required</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Customer Notes</Text>
            <View style={s.card}>
              <Text style={s.notesText}>{notes}</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Timeline</Text>
          <View style={s.card}>
            <View style={s.timelineRow}>
              <Ionicons name="add-circle" size={14} color={C.g600} />
              <Text style={s.timelineText}>Received on {formatDate(request.createdAt || request.created_at)}</Text>
            </View>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <View style={s.timelineRow}>
                <Ionicons name="refresh" size={14} color={C.muted} />
                <Text style={s.timelineText}>Updated on {formatDate(request.updatedAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.sendQuoteBtn} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={s.bottomBtnTxt}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.sendQuoteBtn, { backgroundColor: C.blue }]}
            onPress={() => {
              if (bookingId) navigation.navigate('EquipmentBookingDetail', { bookingId });
              else showInfo('Booking details will appear in your Bookings section shortly.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={s.bottomBtnTxt}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      )}
      {request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' && (
        <View style={[s.bottomBar, { backgroundColor: C.g50, borderTopColor: C.g100 }]}>
          <View style={s.quotedBottomRow}>
            <Ionicons name="checkmark-circle" size={20} color={C.g600} />
            <View style={{ flex: 1 }}>
              <Text style={s.quotedBottomTitle}>Quote Already Sent</Text>
              {request.vendorQuote?.grandTotal && (
                <Text style={s.quotedBottomSub}>₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}{request.vendorQuote?.status ? ` · ${request.vendorQuote.status}` : ''}</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      {icon}
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(52,211,153,0.08)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.06)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  heroCard: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroReqNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroService: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  quotedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  quotedBannerTxt: { fontSize: 13, color: C.g400, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.muted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqText: { fontSize: 14, color: C.text, fontWeight: '500' },
  notesText: { fontSize: 14, color: C.sub, lineHeight: 20 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineText: { fontSize: 13, color: C.sub },

  emptyTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginTop: 16 },

  bottomBar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  sendQuoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.g600, paddingVertical: 14, borderRadius: 12 },
  bottomBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  quotedBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quotedBottomTitle: { fontSize: 14, fontWeight: '700', color: C.g700 },
  quotedBottomSub: { fontSize: 12, color: C.g600, marginTop: 2 },
});
