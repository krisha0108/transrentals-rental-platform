import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, getQuoteRequestById } from '../../../api/client';
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
  PENDING:  { color: C.amber, bg: C.amberL, icon: 'hourglass-outline',       label: 'Pending' },
  SENT:     { color: C.blue,  bg: C.blueL,  icon: 'paper-plane-outline',     label: 'Sent' },
  ACCEPTED: { color: C.g600,  bg: C.g50,    icon: 'checkmark-circle',         label: 'Accepted' },
  REJECTED: { color: C.red,   bg: C.redL,   icon: 'close-circle',             label: 'Rejected' },
  EXPIRED:  { color: C.muted, bg: '#F8FAFC', icon: 'time-outline',            label: 'Expired' },
  WITHDRAWN:{ color: C.muted, bg: '#F8FAFC', icon: 'arrow-undo-outline',      label: 'Withdrawn' },
};

export default function EquipmentQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const fetchQuoteDetail = useCallback(async () => {
    if (!quoteId) {
      showError('Quote ID is missing');
      navigation.goBack();
      return;
    }
    try {
      const response = await getVendorQuotes('equipment', {});
      const quotes = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('equipment', rid);
              setBookingId(reqData.bookingId || null);
            } catch (_) {}
          }
        }
      } else {
        showError('Quote not found');
      }
    } catch (error) {
      showError('Failed to load quote details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quoteId, navigation]);

  useEffect(() => { fetchQuoteDetail(); }, [fetchQuoteDetail]);

  const onRefresh = () => { setRefreshing(true); fetchQuoteDetail(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const parseJSON = (field) => {
    if (!field) return null;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed).filter(Boolean);
        return null;
      } catch { return null; }
    }
    return null;
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
              <Text style={s.heroTitle}>Quote Details</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={s.heroTitle}>Quote Details</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="document-text-outline" size={64} color={C.muted} />
          <Text style={s.emptyTitle}>Quote Not Found</Text>
          <Text style={s.emptySubtitle}>This quote may have been removed</Text>
        </View>
      </View>
    );
  }

  const status = quote.status || 'PENDING';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const request = quote.request || {};
  const customerName = request.customerName || quote.customerName || 'Customer';
  const customerEmail = request.customerEmail || quote.customerEmail;
  const pickupCity = request.locationName || request.pickupCity || quote.pickupCity || 'N/A';
  const dropCity = request.dropCity || quote.dropCity;
  const pickupDate = request.pickupDate || quote.pickupDate || request.startDate;
  const returnDate = request.returnDate || quote.returnDate || request.endDate;
  const vehicleName = quote.vehicleName || quote.equipmentType || request.equipmentType;
  const vehicleBrand = quote.vehicleBrand || quote.equipmentBrand;
  const registrationNumber = quote.registrationNumber || quote.vehicleNumber;
  const vehicleYear = quote.vehicleYear;

  const totalAmount = quote.grandTotal || quote.totalAmount || quote.quotedAmount || quote.baseAmount || 0;
  const securityDeposit = quote.securityDeposit || quote.deposit || 0;
  const quoteNumber = quote.quoteNumber || (quote.id || quote._id)?.toString().slice(-8);
  const requestNumber = request.requestNumber;
  const validTill = quote.validTill || quote.validUntil;
  const notes = quote.notes || quote.description || quote.additionalInfo;

  const vehicleFeatures = parseJSON(quote.vehicleFeatures);
  const inclusions = parseJSON(quote.inclusions);
  const exclusions = parseJSON(quote.exclusions);
  const termsConditions = parseJSON(quote.termsConditions);

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
            <MaterialCommunityIcons name="toolbox" size={16} color={C.g400} />
            <Text style={s.heroTitle}>Quote Details</Text>
          </View>
          <TouchableOpacity style={s.backBtn} onPress={onRefresh}>
            <Icon name="refresh-cw" size={16} color={C.g400} />
          </TouchableOpacity>
        </View>

        <View style={s.heroCard}>
          <View style={s.heroRow}>
            <View>
              <Text style={s.heroQuoteNum}>Quote #{quoteNumber}</Text>
              <Text style={s.heroService}>Equipment Rental</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[s.statusPillTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <View style={s.heroAmountRow}>
            <Text style={s.heroAmountLabel}>Grand Total</Text>
            <Text style={s.heroAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
        contentContainerStyle={s.content}
      >
        {/* Request Reference */}
        {requestNumber && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reference</Text>
            <View style={s.card}>
              <Text style={s.refText}>Request #{requestNumber}</Text>
            </View>
          </View>
        )}

        {/* Customer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer</Text>
          <View style={s.card}>
            <InfoRow icon={<Ionicons name="person" size={16} color={C.muted} />} label="Name" value={customerName} />
            {customerEmail && <InfoRow icon={<Ionicons name="mail" size={16} color={C.muted} />} label="Email" value={customerEmail} />}
          </View>
        </View>

        {/* Equipment Details */}
        {vehicleName && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Equipment Details</Text>
            <View style={s.card}>
              <View style={s.equipRow}>
                <MaterialCommunityIcons name="toolbox" size={30} color={C.g600} />
                <View style={{ flex: 1 }}>
                  <Text style={s.equipName}>{vehicleName}</Text>
                  {vehicleBrand && <Text style={s.equipBrand}>{vehicleBrand}</Text>}
                </View>
              </View>
              {registrationNumber && <InfoRow icon={<Ionicons name="document-outline" size={16} color={C.muted} />} label="Registration No." value={registrationNumber} />}
              {vehicleYear && <InfoRow icon={<Ionicons name="calendar" size={16} color={C.muted} />} label="Model Year" value={`${vehicleYear}`} />}
              {quote.condition && <InfoRow icon={<Ionicons name="star-outline" size={16} color={C.muted} />} label="Condition" value={quote.condition} />}
              {quote.capacity && <InfoRow icon={<Ionicons name="resize-outline" size={16} color={C.muted} />} label="Capacity" value={`${quote.capacity}`} />}
              {vehicleFeatures && vehicleFeatures.length > 0 && (
                <View style={s.featuresWrap}>
                  <Text style={s.featuresTitle}>Features</Text>
                  {vehicleFeatures.map((feature, idx) => (
                    <View key={idx} style={s.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color={C.g600} />
                      <Text style={s.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Booking Details</Text>
          <View style={s.card}>
            <InfoRow icon={<Ionicons name="location" size={16} color={C.g600} />} label="Location" value={pickupCity} />
            {dropCity && <InfoRow icon={<Ionicons name="location" size={16} color={C.red} />} label="Drop Location" value={dropCity} />}
            {pickupDate && <InfoRow icon={<Ionicons name="calendar" size={16} color={C.muted} />} label="Start Date" value={formatDate(pickupDate)} />}
            {returnDate && <InfoRow icon={<Ionicons name="calendar" size={16} color={C.muted} />} label="End Date" value={formatDate(returnDate)} />}
          </View>
        </View>

        {/* Pricing */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pricing Breakdown</Text>
          <View style={s.card}>
            {quote.dailyRate > 0 && <PriceRow label="Daily Rate" value={formatCurrency(quote.dailyRate)} />}
            {quote.operatorCharges > 0 && <PriceRow label="Operator Charges" value={formatCurrency(quote.operatorCharges)} />}
            {quote.transportCharges > 0 && <PriceRow label="Transport Charges" value={formatCurrency(quote.transportCharges)} />}
            {quote.maintenanceCharges > 0 && <PriceRow label="Maintenance" value={formatCurrency(quote.maintenanceCharges)} />}
            {quote.deliveryCharges > 0 && <PriceRow label="Delivery Charges" value={formatCurrency(quote.deliveryCharges)} />}
            {securityDeposit > 0 && <PriceRow label="Security Deposit" value={formatCurrency(securityDeposit)} />}
            {quote.gstAmount > 0 && <PriceRow label="GST" value={formatCurrency(quote.gstAmount)} />}
            <View style={s.priceDivider} />
            <View style={s.priceRow}>
              <Text style={[s.priceLabel, { fontSize: 15, fontWeight: '700', color: C.text }]}>Grand Total</Text>
              <Text style={[s.priceValue, { fontSize: 18, fontWeight: '700', color: C.g600 }]}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Validity */}
        {validTill && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quote Validity</Text>
            <View style={s.card}>
              <InfoRow icon={<Ionicons name="hourglass-outline" size={16} color={C.muted} />} label="Valid Until" value={formatDate(validTill)} />
            </View>
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Additional Notes</Text>
            <View style={s.card}><Text style={s.notesText}>{notes}</Text></View>
          </View>
        )}

        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Inclusions</Text>
            <View style={s.card}>
              {inclusions.map((item, idx) => (
                <View key={idx} style={s.listItem}>
                  <Ionicons name="checkmark-circle" size={14} color={C.g600} />
                  <Text style={s.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exclusions */}
        {exclusions && exclusions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Exclusions</Text>
            <View style={s.card}>
              {exclusions.map((item, idx) => (
                <View key={idx} style={s.listItem}>
                  <Ionicons name="close-circle" size={14} color={C.red} />
                  <Text style={s.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Terms */}
        {termsConditions && termsConditions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Terms & Conditions</Text>
            <View style={s.card}>
              {termsConditions.map((item, idx) => (
                <View key={idx} style={s.listItem}>
                  <Text style={s.listNum}>{idx + 1}.</Text>
                  <Text style={s.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Timeline</Text>
          <View style={s.card}>
            <View style={s.timelineRow}>
              <Ionicons name="paper-plane" size={14} color={C.g600} />
              <Text style={s.timelineText}>Sent on {formatDate(quote.createdAt || quote.created_at)}</Text>
            </View>
            {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
              <View style={s.timelineRow}>
                <Ionicons name="refresh" size={14} color={C.muted} />
                <Text style={s.timelineText}>Updated on {formatDate(quote.updatedAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={s.bottomBar}>
        {status !== 'ACCEPTED' ? (
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.sub }]}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('EquipmentQuoteRequestDetail', { requestId: rid });
              else showInfo('Request details not available.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={s.bottomBtnTxt}>View Request Details</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.g700 }]}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('EquipmentBookingDetail', { bookingId });
              } else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('EquipmentQuoteRequestDetail', { requestId: rid });
                else showInfo('Please check your Bookings section.');
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={s.bottomBtnTxt}>View Booking Details</Text>
          </TouchableOpacity>
        )}
      </View>
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

function PriceRow({ label, value }) {
  return (
    <View style={s.priceRow}>
      <Text style={s.priceLabel}>{label}</Text>
      <Text style={s.priceValue}>{value}</Text>
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
  heroQuoteNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroService: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  heroAmountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroAmount: { fontSize: 22, fontWeight: '700', color: C.g400 },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  refText: { fontSize: 14, fontWeight: '600', color: C.sub },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.muted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  equipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  equipName: { fontSize: 16, fontWeight: '700', color: C.text },
  equipBrand: { fontSize: 13, color: C.sub, marginTop: 2 },
  featuresWrap: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  featuresTitle: { fontSize: 12, fontWeight: '600', color: C.sub, marginBottom: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { fontSize: 13, color: C.sub, flex: 1 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: C.sub },
  priceValue: { fontSize: 14, color: C.text, fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  notesText: { fontSize: 14, color: C.sub, lineHeight: 20 },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText: { fontSize: 13, color: C.sub, flex: 1, lineHeight: 18 },
  listNum: { fontSize: 13, fontWeight: '600', color: C.muted, width: 18 },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineText: { fontSize: 13, color: C.sub },

  emptyTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.muted, marginTop: 8 },

  bottomBar: { backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  bottomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  bottomBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
