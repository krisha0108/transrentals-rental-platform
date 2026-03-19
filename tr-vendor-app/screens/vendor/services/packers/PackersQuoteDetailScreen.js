import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  PENDING: { color: '#D97706', bg: '#FFFBEB', label: 'Pending',  icon: 'time-outline'     },
  SENT:    { color: '#2563EB', bg: '#EFF6FF', label: 'Sent',     icon: 'paper-plane'      },
  ACCEPTED:{ color: '#059669', bg: '#ECFDF5', label: 'Accepted', icon: 'checkmark-circle' },
  REJECTED:{ color: '#DC2626', bg: '#FEF2F2', label: 'Rejected', icon: 'close-circle'     },
  EXPIRED: { color: '#94A3B8', bg: '#F1F5F9', label: 'Expired',  icon: 'alert-circle'     },
};

export default function PackersQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const fetchQuoteDetail = useCallback(async () => {
    if (!quoteId) { showError('Quote ID is missing'); navigation.goBack(); return; }
    try {
      const response = await getVendorQuotes('packers', {});
      const quotes = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('packers', rid);
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

  const fmt = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const parseJSON = (field) => {
    if (!field) return null;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try { return JSON.parse(field); } catch { return null; }
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
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Quote Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
        </View>
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
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Quote Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="document-text-outline" size={56} color={C.muted} />
          <Text style={s.centeredTxt}>Quote not found</Text>
        </View>
      </View>
    );
  }

  const status = quote.status || 'PENDING';
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const quoteNumber = quote.quoteNumber || (quote.id || quote._id)?.toString().slice(-8);

  const request = quote.request || {};
  const customerName = request.customerName || quote.customerName || 'Customer';
  const customerEmail = request.customerEmail || quote.customerEmail;
  const pickupCity = request.pickupCity || quote.pickupCity || 'N/A';
  const dropCity = request.dropCity || quote.dropCity;
  const pickupDate = request.pickupDate || quote.pickupDate || request.startDate || request.scheduledDate;
  const validTill = quote.validTill || quote.validUntil;
  const notes = quote.notes || quote.description;

  const totalAmount = quote.grandTotal || quote.totalAmount || quote.quotedAmount || 0;

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
            <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Quote Details</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.heroCard}>
          <View style={s.heroCardTop}>
            <View>
              <Text style={s.heroLabel}>QUOTE #</Text>
              <Text style={s.heroNumber}>{quoteNumber}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.color + '22', borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={s.heroAmountRow}>
            <Text style={s.heroAmountLabel}>Total Quoted</Text>
            <Text style={s.heroAmount}>{fmt(totalAmount)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
      >
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

        {/* Booking Details */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.g50 }]}>
              <Ionicons name="calendar-outline" size={16} color={C.g600} />
            </View>
            <Text style={s.sectionTitle}>Booking Details</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>From</Text>
            <Text style={s.infoValue}>{pickupCity}</Text>
          </View>
          {dropCity && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>To</Text>
              <Text style={s.infoValue}>{dropCity}</Text>
            </View>
          )}
          {pickupDate && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Moving Date</Text>
              <Text style={s.infoValue}>{formatDate(pickupDate)}</Text>
            </View>
          )}
        </View>

        {/* Pricing Breakdown */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.g50 }]}>
              <Ionicons name="receipt-outline" size={16} color={C.g600} />
            </View>
            <Text style={s.sectionTitle}>Pricing Breakdown</Text>
          </View>
          {quote.packingCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Packing Charges</Text><Text style={s.priceValue}>{fmt(quote.packingCharges)}</Text></View>}
          {quote.unpackingCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Unpacking Charges</Text><Text style={s.priceValue}>{fmt(quote.unpackingCharges)}</Text></View>}
          {quote.loadingCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Loading Charges</Text><Text style={s.priceValue}>{fmt(quote.loadingCharges)}</Text></View>}
          {quote.unloadingCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Unloading Charges</Text><Text style={s.priceValue}>{fmt(quote.unloadingCharges)}</Text></View>}
          {quote.transportCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Transport Charges</Text><Text style={s.priceValue}>{fmt(quote.transportCharges)}</Text></View>}
          {quote.insuranceCharges > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Insurance</Text><Text style={s.priceValue}>{fmt(quote.insuranceCharges)}</Text></View>}
          {(quote.securityDeposit || quote.deposit) > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>Security Deposit</Text><Text style={s.priceValue}>{fmt(quote.securityDeposit || quote.deposit)}</Text></View>}
          {quote.gstAmount > 0 && <View style={s.priceRow}><Text style={s.priceLabel}>GST</Text><Text style={s.priceValue}>{fmt(quote.gstAmount)}</Text></View>}
          <View style={s.priceDivider} />
          <View style={s.priceRow}>
            <Text style={[s.priceLabel, { fontSize: 15, fontWeight: '700', color: C.text }]}>Grand Total</Text>
            <Text style={[s.priceValue, { fontSize: 17, color: C.g600 }]}>{fmt(totalAmount)}</Text>
          </View>
        </View>

        {/* Validity */}
        {validTill && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.amberL }]}>
                <Ionicons name="time-outline" size={16} color={C.amber} />
              </View>
              <Text style={s.sectionTitle}>Quote Validity</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Valid Until</Text>
              <Text style={s.infoValue}>{formatDate(validTill)}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.bg }]}>
                <Ionicons name="chatbox-outline" size={16} color={C.muted} />
              </View>
              <Text style={s.sectionTitle}>Additional Notes</Text>
            </View>
            <Text style={s.notesText}>{notes}</Text>
          </View>
        )}

        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
              </View>
              <Text style={s.sectionTitle}>Inclusions</Text>
            </View>
            {inclusions.map((item, idx) => (
              <View key={idx} style={s.listItem}>
                <Ionicons name="checkmark-circle" size={15} color={C.g600} />
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {exclusions && exclusions.length > 0 && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.redL }]}>
                <Ionicons name="close-circle-outline" size={16} color={C.red} />
              </View>
              <Text style={s.sectionTitle}>Exclusions</Text>
            </View>
            {exclusions.map((item, idx) => (
              <View key={idx} style={s.listItem}>
                <Ionicons name="close-circle" size={15} color={C.red} />
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Terms */}
        {termsConditions && termsConditions.length > 0 && (
          <View style={s.card}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIcon, { backgroundColor: C.blueL }]}>
                <Ionicons name="document-text-outline" size={16} color={C.blue} />
              </View>
              <Text style={s.sectionTitle}>Terms & Conditions</Text>
            </View>
            {termsConditions.map((item, idx) => (
              <View key={idx} style={s.listItem}>
                <Text style={s.listNumber}>{idx + 1}.</Text>
                <Text style={s.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        <View style={s.card}>
          <View style={s.sectionHead}>
            <View style={[s.sectionIcon, { backgroundColor: C.bg }]}>
              <Ionicons name="time-outline" size={16} color={C.muted} />
            </View>
            <Text style={s.sectionTitle}>Quote Timeline</Text>
          </View>
          <View style={s.listItem}>
            <Ionicons name="paper-plane" size={15} color={C.g600} />
            <Text style={s.listText}>Sent on {formatDate(quote.createdAt)}</Text>
          </View>
          {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
            <View style={s.listItem}>
              <Ionicons name="refresh" size={15} color={C.muted} />
              <Text style={s.listText}>Updated on {formatDate(quote.updatedAt)}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        {status !== 'ACCEPTED' ? (
          <TouchableOpacity
            style={[s.bottomBtn, { backgroundColor: C.sub }]}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('PackersQuoteRequestDetail', { requestId: rid });
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
              if (bookingId) navigation.navigate('PackersBookingDetail', { bookingId });
              else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('PackersQuoteRequestDetail', { requestId: rid });
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centeredTxt: { fontSize: 15, color: C.muted },

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
  heroNumber: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  heroAmount: { fontSize: 24, fontWeight: '800', color: C.g400 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  priceLabel: { fontSize: 14, color: C.sub },
  priceValue: { fontSize: 14, fontWeight: '600', color: C.text },
  priceDivider: { height: 1, backgroundColor: C.border, marginVertical: 8 },

  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  listText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },
  listNumber: { fontSize: 13, fontWeight: '700', color: C.muted, width: 20 },

  amberL: C.amberL,

  bottomBar: {
    backgroundColor: C.card, paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
  },
  bottomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  bottomBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
