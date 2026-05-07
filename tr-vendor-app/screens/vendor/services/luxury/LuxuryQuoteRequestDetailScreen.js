import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Linking,
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
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED', indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CONFIG = {
  PENDING:         { color: C.amber,  bg: C.amberL,  border: '#FDE68A', icon: 'time-outline',             label: 'Pending'         },
  QUOTED:          { color: C.blue,   bg: C.blueL,   border: '#BFDBFE', icon: 'paper-plane-outline',      label: 'Quote Sent'      },
  QUOTES_RECEIVED: { color: C.blue,   bg: C.blueL,   border: '#BFDBFE', icon: 'document-text-outline',    label: 'Quotes Received' },
  ACCEPTED:        { color: C.g600,   bg: C.g50,     border: C.g100,    icon: 'checkmark-circle-outline', label: 'Accepted'        },
  REJECTED:        { color: C.red,    bg: C.redL,    border: '#FECACA', icon: 'close-circle-outline',     label: 'Rejected'        },
  EXPIRED:         { color: C.muted,  bg: '#F8FAFC', border: C.border,  icon: 'alert-circle-outline',     label: 'Expired'         },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
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

/* ─── Section component ───────────────────────────────────────── */
function Section({ iconName, iconLib = 'ion', iconColor, title, children }) {
  const renderIcon = () => {
    if (iconLib === 'mci') return <MaterialCommunityIcons name={iconName} size={18} color={iconColor || C.g600} />;
    if (iconLib === 'feather') return <Icon name={iconName} size={18} color={iconColor || C.g600} />;
    return <Ionicons name={iconName} size={18} color={iconColor || C.g600} />;
  };
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIconBox, { backgroundColor: `${iconColor || C.g600}15` }]}>
          {renderIcon()}
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

/* ─── InfoRow component ───────────────────────────────────────── */
function InfoRow({ label, value, icon, iconLib = 'ion', iconColor }) {
  const renderIcon = () => {
    if (!icon) return null;
    if (iconLib === 'mci') return <MaterialCommunityIcons name={icon} size={16} color={iconColor || C.muted} />;
    return <Ionicons name={icon} size={16} color={iconColor || C.muted} />;
  };
  return (
    <View style={s.infoRow}>
      {icon ? (
        <View style={[s.infoIconBox, { backgroundColor: `${iconColor || C.muted}15` }]}>
          {renderIcon()}
        </View>
      ) : null}
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
}

/* ─── Screen ──────────────────────────────────────────────────── */
export default function LuxuryQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request,    setRequest]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId,  setBookingId]  = useState(null);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) { showError('Request ID is missing'); navigation.goBack(); return; }
    try {
      const data = await getQuoteRequestById('luxury', requestId);
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
    navigation.navigate('LuxurySendQuote', { requestId: request.id || request._id });
  };

  /* ─── Gradient header ─────────────────────────────────────── */
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <View style={s.headerTitleRow}>
                <MaterialCommunityIcons name="car-sports" size={16} color={C.g400} />
                <Text style={s.headerTitle}>Request Details</Text>
              </View>
              <Text style={s.headerSub}>Luxury Cars</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );

  /* ─── Loading skeleton ────────────────────────────────────── */
  if (loading) {
    return (
      <View style={s.root}>
        <Header />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[s.sectionCard, { marginBottom: 16 }]}>
              <View style={{ width: '40%', height: 14, backgroundColor: C.border, borderRadius: 7, marginBottom: 12 }} />
              <View style={{ width: '80%', height: 12, backgroundColor: C.border, borderRadius: 6, marginBottom: 8 }} />
              <View style={{ width: '60%', height: 12, backgroundColor: C.border, borderRadius: 6 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  /* ─── Not found ───────────────────────────────────────────── */
  if (!request) {
    return (
      <View style={s.root}>
        <Header />
        <View style={s.emptyState}>
          <Ionicons name="clipboard-outline" size={56} color={C.muted} />
          <Text style={s.emptyTitle}>Request Not Found</Text>
          <Text style={s.emptySubtitle}>This request may have been removed</Text>
        </View>
      </View>
    );
  }

  /* ─── Derived data ────────────────────────────────────────── */
  const status = request.status?.toUpperCase() || 'PENDING';
  const sc     = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const pickupLocation      = request.pickupLocation || request.pickupCity || 'N/A';
  const pickupAddress       = request.pickupAddress;
  const destination         = request.destination || request.dropLocation || request.dropCity;
  const destinationAddress  = request.destinationAddress || request.dropAddress;
  const startDate           = request.startDate || request.pickupDate;
  const startTime           = request.startTime || request.pickupTime || '10:00';
  const returnDate          = request.returnDate || request.endDate;
  const returnTime          = request.returnTime || request.dropTime || '10:00';
  const bookingType         = request.bookingType || 'N/A';
  const packageType         = request.packageType;
  const vehicleModelName    = request.vehicleModelName || request.specificModel;
  const vehicleBrand        = request.vehicleBrand;
  const vehicleCategory     = request.vehicleCategory;
  const vehicleCategoryName = request.vehicleCategoryName || vehicleCategory;
  const passengers          = request.passengers;
  const occasion            = request.occasion;
  const needChauffeur       = request.needChauffeur !== false;
  const needDecoration      = request.needDecoration === true;
  const decorationType      = request.decorationType;
  const budgetMin           = request.budgetMin;
  const budgetMax           = request.budgetMax;
  const requestNumber       = request.requestNumber || (request.id || request._id)?.toString().slice(-8);
  const notes               = request.customerNotes || request.notes || request.requirements;
  const customerName  = request.customerName || 'Customer';
  const customerPhone = request.customerPhone || request.customer_phone;

  const handleCallCustomer = () => {
    if (!customerPhone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType: 'luxury_quote_request', bookingId: request.id, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${customerPhone}`);
  };

  const canSendQuote = !request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED');

  /* ─── Render ──────────────────────────────────────────────── */
  return (
    <View style={s.root}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g500} />
        }
        contentContainerStyle={s.scrollContent}
      >
        {/* Status banner */}
        <View style={[s.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={s.statusLeft}>
            <View style={[s.statusIconBox, { backgroundColor: `${sc.color}20` }]}>
              <Ionicons name={sc.icon} size={22} color={sc.color} />
            </View>
            <View>
              <Text style={[s.statusLabel, { color: sc.color }]}>{sc.label}</Text>
              <Text style={s.requestNumText}>Request #{requestNumber}</Text>
            </View>
          </View>
          {request.hasQuoted ? (
            <View style={s.quotedPill}>
              <Ionicons name="checkmark-circle" size={13} color={C.g600} />
              <Text style={s.quotedPillText}>Quoted</Text>
            </View>
          ) : canSendQuote ? (
            <TouchableOpacity style={s.sendQuickBtn} onPress={handleSendQuote}>
              <Ionicons name="paper-plane" size={14} color="#fff" />
              <Text style={s.sendQuickBtnText}>Send Quote</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Already-quoted banner */}
        {request.hasQuoted ? (
          <View style={s.quotedBanner}>
            <View style={s.quotedBannerIcon}>
              <Ionicons name="checkmark-circle" size={20} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.quotedBannerTitle}>You've already sent a quote</Text>
              {request.vendorQuote?.grandTotal ? (
                <Text style={s.quotedBannerAmt}>
                  ₹{Number(request.vendorQuote.grandTotal).toLocaleString('en-IN')}
                  {request.vendorQuote?.status ? `  ·  ${request.vendorQuote.status}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 1. Customer Info */}
        <Section iconName="person-circle-outline" iconColor={C.blue} title="Customer">
          <InfoRow label="Name" value={customerName} icon="person-outline" iconColor={C.blue} />
          {customerPhone ? (
            <TouchableOpacity
              onPress={handleCallCustomer}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 }}
            >
              <Ionicons name="call" size={16} color={C.g600} />
              <Text style={{ color: C.g600, fontWeight: '700', fontSize: 14 }}>Call Customer</Text>
            </TouchableOpacity>
          ) : null}
        </Section>

        {/* 2. Vehicle Preference */}
        {(vehicleModelName || vehicleBrand || vehicleCategoryName) ? (
          <Section iconName="car-sports" iconLib="mci" iconColor={C.g700} title="Vehicle Preference">
            <View style={s.vehicleBox}>
              <View style={s.vehicleIconWrap}>
                <MaterialCommunityIcons name="car-sports" size={28} color={C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleName}>{vehicleModelName || 'Any Luxury Car'}</Text>
                {vehicleBrand ? (
                  <Text style={s.vehicleBrandTxt}>{vehicleBrand}</Text>
                ) : null}
                {vehicleCategoryName ? (
                  <View style={s.catPill}>
                    <Text style={s.catPillText}>{vehicleCategoryName}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Section>
        ) : null}

        {/* 3. Booking Type & Package */}
        <Section iconName="pricetag-outline" iconColor={C.indigo} title="Booking Type & Package">
          <InfoRow label="Booking Type" value={bookingType} icon="timer-outline" iconColor={C.indigo} />
          {packageType ? (
            <InfoRow label="Package" value={packageType} icon="cube-outline" iconColor={C.indigo} />
          ) : null}
          {passengers ? (
            <InfoRow label="Passengers" value={String(passengers)} icon="people-outline" iconColor={C.blue} />
          ) : null}
          {occasion ? (
            <InfoRow
              label="Occasion"
              value={occasion.charAt(0).toUpperCase() + occasion.slice(1)}
              icon="star-outline"
              iconColor={C.amber}
            />
          ) : null}
        </Section>

        {/* 4. Trip Details */}
        <Section iconName="calendar-outline" iconColor={C.g600} title="Trip Details">
          <InfoRow
            label="Pickup Location"
            value={pickupAddress ? `${pickupLocation}\n${pickupAddress}` : pickupLocation}
            icon="location-outline"
            iconColor={C.g600}
          />
          {destination ? (
            <InfoRow
              label="Destination"
              value={destinationAddress ? `${destination}\n${destinationAddress}` : destination}
              icon="location-outline"
              iconColor={C.red}
            />
          ) : null}
          <View style={s.dateGrid}>
            <View style={[s.dateBox, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
              <Text style={[s.dateBoxLabel, { color: C.blue }]}>START</Text>
              <Text style={s.dateBoxDate}>{formatDate(startDate)}</Text>
              <Text style={s.dateBoxTime}>{formatTime(startTime)}</Text>
            </View>
            {returnDate ? (
              <View style={[s.dateBox, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                <Text style={[s.dateBoxLabel, { color: C.red }]}>RETURN</Text>
                <Text style={s.dateBoxDate}>{formatDate(returnDate)}</Text>
                <Text style={s.dateBoxTime}>{formatTime(returnTime)}</Text>
              </View>
            ) : null}
          </View>
        </Section>

        {/* 5. Requirements */}
        <Section iconName="shield-check" iconLib="mci" iconColor={C.g700} title="Requirements">
          <InfoRow
            label="Chauffeur"
            value={needChauffeur ? 'Required' : 'Not Required'}
            icon="person-outline"
            iconColor={needChauffeur ? C.g600 : C.muted}
          />
          {needDecoration ? (
            <InfoRow
              label="Decoration"
              value={decorationType || 'Required'}
              iconLib="mci"
              icon="party-popper"
              iconColor={C.purple}
            />
          ) : (
            <InfoRow
              label="Decoration"
              value="Not Required"
              iconLib="mci"
              icon="party-popper"
              iconColor={C.muted}
            />
          )}
        </Section>

        {/* 6. Budget Range */}
        {(budgetMin || budgetMax) ? (
          <Section iconName="wallet-outline" iconColor={C.purple} title="Budget Range">
            <View style={s.budgetRow}>
              {budgetMin ? (
                <View style={[s.budgetBox, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                  <Text style={[s.budgetLabel, { color: C.g600 }]}>Minimum</Text>
                  <Text style={[s.budgetValue, { color: C.g700 }]}>₹{budgetMin?.toLocaleString()}</Text>
                </View>
              ) : null}
              {budgetMax ? (
                <View style={[s.budgetBox, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
                  <Text style={[s.budgetLabel, { color: C.blue }]}>Maximum</Text>
                  <Text style={[s.budgetValue, { color: C.blue }]}>₹{budgetMax?.toLocaleString()}</Text>
                </View>
              ) : null}
            </View>
          </Section>
        ) : null}

        {/* 7. Customer Notes */}
        {notes ? (
          <Section iconName="chatbox-outline" iconColor={C.purple} title="Customer Notes">
            <Text style={s.notesText}>{notes}</Text>
          </Section>
        ) : null}

        {/* 8. Request Timeline */}
        <Section iconName="time-outline" iconColor={C.muted} title="Request Timeline">
          <View style={s.timelineRow}>
            <View style={[s.timelineDot, { backgroundColor: C.g500 }]} />
            <Text style={s.timelineText}>
              Received · {formatDate(request.createdAt || request.created_at)}
            </Text>
          </View>
          {request.updatedAt && request.updatedAt !== request.createdAt ? (
            <View style={s.timelineRow}>
              <View style={[s.timelineDot, { backgroundColor: C.muted }]} />
              <Text style={s.timelineText}>
                Updated · {formatDate(request.updatedAt)}
              </Text>
            </View>
          ) : null}
        </Section>
      </ScrollView>

      {/* ── Bottom bar ── */}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') ? (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.blue }]}
            onPress={() => {
              if (bookingId) navigation.navigate('LuxuryBookingDetail', { bookingId });
              else showInfo('Booking details will appear in your Bookings section shortly.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={s.bottomBtnText}>View Booking Details</Text>
          </TouchableOpacity>
        </View>
      ) : canSendQuote ? (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.g600 }]}
            onPress={handleSendQuote}
          >
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={s.bottomBtnText}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      ) : request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' ? (
        <View style={[s.bottomBar, { backgroundColor: C.g50, borderTopColor: C.g100 }]}>
          <Ionicons name="checkmark-circle" size={20} color={C.g600} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.bottomBtnText, { color: C.g700, fontSize: 14 }]}>Quote Already Sent</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  headerGrad: {},
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:   { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  /* Status banner */
  statusBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  statusLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusIconBox: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  statusLabel:   { fontSize: 15, fontWeight: '700' },
  requestNumText:{ fontSize: 12, color: C.muted, marginTop: 2 },
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

  /* Quoted banner */
  quotedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.g50, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.g100, marginBottom: 12,
  },
  quotedBannerIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center' },
  quotedBannerTitle: { fontSize: 13, fontWeight: '700', color: C.g700 },
  quotedBannerAmt:   { fontSize: 12, color: C.g600, marginTop: 2 },

  /* Sections */
  section:       { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionIconBox:{ width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
  sectionCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },

  /* InfoRow */
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue:   { fontSize: 14, fontWeight: '600', color: C.text },

  /* Vehicle */
  vehicleBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleName:    { fontSize: 15, fontWeight: '700', color: C.text },
  vehicleBrandTxt:{ fontSize: 12, color: C.sub, marginTop: 2 },
  catPill: {
    alignSelf: 'flex-start', backgroundColor: C.g50,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6,
    borderWidth: 1, borderColor: C.g100,
  },
  catPillText: { fontSize: 11, fontWeight: '600', color: C.g700 },

  /* Date grid */
  dateGrid:    { flexDirection: 'row', gap: 10 },
  dateBox:     { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  dateBoxLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  dateBoxDate: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateBoxTime: { fontSize: 12, color: C.sub },

  /* Budget */
  budgetRow:  { flexDirection: 'row', gap: 10 },
  budgetBox:  { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  budgetLabel:{ fontSize: 11, fontWeight: '600', marginBottom: 6 },
  budgetValue:{ fontSize: 18, fontWeight: '800' },

  /* Notes */
  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  /* Timeline */
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineText:{ fontSize: 13, color: C.sub },

  /* Bottom bar */
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

  /* Empty state */
  emptyState:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 14 },
  emptySubtitle: { fontSize: 13, color: C.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
