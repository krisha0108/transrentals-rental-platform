import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequestById } from '../../../api/client';
import { showError, showInfo } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  amber: '#D97706', amberL: '#FFFBEB',
  blue: '#2563EB', blueL: '#EFF6FF',
  red: '#DC2626', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CONFIG = {
  PENDING:         { color: C.amber, bg: C.amberL, border: '#FDE68A', icon: 'time-outline',             label: 'Pending' },
  QUOTED:          { color: C.blue,  bg: C.blueL,  border: '#BFDBFE', icon: 'paper-plane-outline',      label: 'Quote Sent' },
  QUOTES_RECEIVED: { color: C.blue,  bg: C.blueL,  border: '#BFDBFE', icon: 'document-text-outline',    label: 'Quotes Received' },
  ACCEPTED:        { color: C.g600,  bg: C.g50,    border: C.g100,    icon: 'checkmark-circle-outline', label: 'Accepted' },
  REJECTED:        { color: C.red,   bg: C.redL,   border: '#FECACA', icon: 'close-circle-outline',     label: 'Rejected' },
  EXPIRED:         { color: C.muted, bg: '#F8FAFC', border: C.border, icon: 'alert-circle-outline',     label: 'Expired' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

function Section({ iconName, iconLib = 'ion', iconColor, title, children }) {
  const renderIcon = () => {
    if (iconLib === 'mci') return <MaterialCommunityIcons name={iconName} size={18} color={iconColor || C.g600} />;
    if (iconLib === 'feather') return <Icon name={iconName} size={18} color={iconColor || C.g600} />;
    return <Ionicons name={iconName} size={18} color={iconColor || C.g600} />;
  };
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconBox, { backgroundColor: `${iconColor || C.g600}15` }]}>
          {renderIcon()}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, icon, iconLib = 'ion', iconColor }) {
  const renderIcon = () => {
    if (!icon) return null;
    if (iconLib === 'mci') return <MaterialCommunityIcons name={icon} size={16} color={iconColor || C.muted} />;
    return <Ionicons name={icon} size={16} color={iconColor || C.muted} />;
  };
  return (
    <View style={styles.infoRow}>
      {icon ? (
        <View style={[styles.infoIconBox, { backgroundColor: `${iconColor || C.muted}15` }]}>
          {renderIcon()}
        </View>
      ) : null}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
}

export default function BusQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request,    setRequest]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId,  setBookingId]  = useState(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) { showError('Request ID is missing'); navigation.goBack(); return; }
    try {
      const data = await getQuoteRequestById('bus', requestId);
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

  const handleSendQuote = () => {
    navigation.navigate('BusSendQuote', { requestId: request.id || request._id });
  };

  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Request Details</Text>
              <Text style={styles.headerSub}>Bus & Tempo</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <Header />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.sectionCard, { marginBottom: 16 }]}>
              <View style={{ width: '40%', height: 14, backgroundColor: '#E2E8F0', borderRadius: 7, marginBottom: 12 }} />
              <View style={{ width: '80%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
              <View style={{ width: '60%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 6 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={56} color={C.muted} />
          <Text style={styles.emptyTitle}>Request Not Found</Text>
          <Text style={styles.emptySubtitle}>This request may have been removed</Text>
        </View>
      </View>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const customerName  = request.customerName || 'Customer';
  const customerEmail = request.customerEmail;
  const tripType      = request.tripType || request.serviceType;
  const serviceTypeLabel = tripType === 'outstation' || tripType === '1' ? 'Outstation'
    : tripType === 'local' || tripType === '2' ? 'Local' : tripType;
  const busType       = request.busType || request.vehicleType;
  const pickupLocation = request.pickupLocation || request.pickupCity || request.locationName || 'N/A';
  const destination    = request.destination || request.dropLocation || request.dropCity;
  const pickupDate     = request.pickupDate || request.startDate;
  const pickupTime     = request.pickupTime || '10:00';
  const returnDate     = request.returnDate || request.endDate;
  const returnTime     = request.returnTime || '10:00';
  const passengers     = request.passengers || request.passengerCount;
  const notes          = request.customerNotes || request.notes || request.description || request.specialRequirements;
  const requestNumber  = request.requestNumber || (request.id || request._id)?.toString().slice(-8);
  const canSendQuote   = !request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED');

  return (
    <View style={styles.root}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g500} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIconBox, { backgroundColor: `${sc.color}20` }]}>
              <Ionicons name={sc.icon} size={22} color={sc.color} />
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
              <Text style={styles.requestNumText}>Request #{requestNumber}</Text>
            </View>
          </View>
          {request.hasQuoted ? (
            <View style={styles.quotedPill}>
              <Ionicons name="checkmark-circle" size={13} color={C.g600} />
              <Text style={styles.quotedPillText}>Quoted</Text>
            </View>
          ) : canSendQuote ? (
            <TouchableOpacity style={styles.sendQuickBtn} onPress={handleSendQuote}>
              <Ionicons name="paper-plane" size={14} color="#fff" />
              <Text style={styles.sendQuickBtnText}>Send Quote</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {request.hasQuoted && (
          <View style={styles.quotedBanner}>
            <View style={styles.quotedBannerIcon}>
              <Ionicons name="checkmark-circle" size={20} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quotedBannerTitle}>You've already sent a quote</Text>
              {request.vendorQuote?.grandTotal ? (
                <Text style={styles.quotedBannerAmt}>
                  ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                  {request.vendorQuote?.status ? `  ·  ${request.vendorQuote.status}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <Section iconName="person-circle-outline" iconColor={C.blue} title="Customer">
          <InfoRow label="Name" value={customerName} icon="person-outline" iconColor={C.blue} />
          {customerEmail ? <InfoRow label="Email" value={customerEmail} icon="mail-outline" iconColor={C.blue} /> : null}
        </Section>

        {serviceTypeLabel ? (
          <Section iconName="bus" iconLib="mci" iconColor={C.amber} title="Service Type">
            <View style={styles.vehicleBox}>
              <View style={styles.vehicleIconWrap}>
                <MaterialCommunityIcons name="bus" size={28} color={C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {serviceTypeLabel === 'Outstation' ? '🛣️ Outstation Trip' : '🏙️ Local Trip'}
                </Text>
                {busType ? (
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{busType}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Section>
        ) : null}

        <Section iconName="calendar-outline" iconColor={C.g600} title="Trip Details">
          <InfoRow label="Pickup Location" value={pickupLocation} icon="location-outline" iconColor={C.g600} />
          {destination ? <InfoRow label="Destination" value={destination} icon="location-outline" iconColor={C.red} /> : null}
          <View style={styles.dateGrid}>
            <View style={[styles.dateBox, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
              <Text style={[styles.dateBoxLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={styles.dateBoxDate}>{formatDate(pickupDate)}</Text>
              <Text style={styles.dateBoxTime}>{formatTime(pickupTime)}</Text>
            </View>
            {returnDate ? (
              <View style={[styles.dateBox, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                <Text style={[styles.dateBoxLabel, { color: C.red }]}>RETURN</Text>
                <Text style={styles.dateBoxDate}>{formatDate(returnDate)}</Text>
                <Text style={styles.dateBoxTime}>{formatTime(returnTime)}</Text>
              </View>
            ) : null}
          </View>
        </Section>

        {passengers ? (
          <Section iconName="people-outline" iconColor={C.purple} title="Passengers">
            <InfoRow
              label="Passengers"
              value={`${passengers} ${parseInt(passengers) === 1 ? 'Passenger' : 'Passengers'}`}
              icon="people-outline"
              iconColor={C.purple}
            />
          </Section>
        ) : null}

        {notes ? (
          <Section iconName="chatbox-outline" iconColor={C.purple} title="Customer Notes">
            <Text style={styles.notesText}>{notes}</Text>
          </Section>
        ) : null}

        <Section iconName="time-outline" iconColor={C.muted} title="Request Timeline">
          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: C.g500 }]} />
            <Text style={styles.timelineText}>Received · {formatDate(request.createdAt || request.created_at)}</Text>
          </View>
          {request.updatedAt && request.updatedAt !== request.createdAt ? (
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: C.muted }]} />
              <Text style={styles.timelineText}>Updated · {formatDate(request.updatedAt)}</Text>
            </View>
          ) : null}
        </Section>
      </ScrollView>

      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: C.blue }]}
            onPress={() => {
              if (bookingId) navigation.navigate('BusBookingDetail', { bookingId });
              else showInfo('Booking details will appear in your Bookings section shortly.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.bottomBtnText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      ) : canSendQuote ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: C.g600 }]} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.bottomBtnText}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      ) : request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' ? (
        <View style={[styles.bottomBar, { backgroundColor: C.g50, borderTopColor: C.g100 }]}>
          <Ionicons name="checkmark-circle" size={20} color={C.g600} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.bottomBtnText, { color: C.g700, fontSize: 14 }]}>Quote Already Sent</Text>
            {request.vendorQuote?.grandTotal ? (
              <Text style={{ fontSize: 12, color: C.g600, marginTop: 1 }}>
                ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                {request.vendorQuote?.status ? `  ·  ${request.vendorQuote.status}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerGrad: {},
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  statusBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  statusLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusIconBox:{ width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  statusLabel:  { fontSize: 15, fontWeight: '700' },
  requestNumText: { fontSize: 12, color: C.muted, marginTop: 2 },
  quotedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.g100,
  },
  quotedPillText: { fontSize: 12, fontWeight: '600', color: C.g600 },
  sendQuickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  sendQuickBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  quotedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.g50, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.g100, marginBottom: 12,
  },
  quotedBannerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center',
  },
  quotedBannerTitle: { fontSize: 13, fontWeight: '700', color: C.g700 },
  quotedBannerAmt:   { fontSize: 12, color: C.g600, marginTop: 2 },

  section:       { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionIconBox:{ width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
  sectionCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },

  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox:{ width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoContent:{ flex: 1 },
  infoLabel:  { fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:  { fontSize: 14, fontWeight: '600', color: C.text },

  vehicleBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleName: { fontSize: 15, fontWeight: '700', color: C.text },
  catPill: {
    alignSelf: 'flex-start', backgroundColor: C.g50,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6,
    borderWidth: 1, borderColor: C.g100,
  },
  catPillText: { fontSize: 11, fontWeight: '600', color: C.g700 },

  dateGrid: { flexDirection: 'row', gap: 10 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  dateBoxLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  dateBoxDate:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateBoxTime:  { fontSize: 12, color: C.sub },

  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineText:{ fontSize: 13, color: C.sub },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  bottomBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  emptyState:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: C.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
