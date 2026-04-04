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
import { getVendorQuotes, getQuoteRequestById, withdrawQuote } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const STATUS_COLORS = {
  PENDING:   { color: C.amber, bg: C.amberL },
  SENT:      { color: C.amber, bg: C.amberL },
  ACCEPTED:  { color: C.g600,  bg: C.g50    },
  REJECTED:  { color: C.red,   bg: C.redL   },
  EXPIRED:   { color: C.muted, bg: '#F8FAFC' },
  WITHDRAWN: { color: C.muted, bg: '#F8FAFC' },
};

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amt) => {
  if (!amt) return '₹0';
  return '₹' + Number(amt).toLocaleString('en-IN');
};

export default function LuxuryQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchQuoteDetail = useCallback(async () => {
    if (!quoteId) { showError('Quote ID is missing'); navigation.goBack(); return; }
    try {
      const response = await getVendorQuotes('luxury', {});
      const quotes = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('luxury', rid);
              setBookingId(reqData.bookingId || null);
            } catch (_) {}
          }
        }
      } else {
        showError('Quote not found');
        navigation.goBack();
      }
    } catch (error) {
      showError('Failed to load quote details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quoteId]);

  useEffect(() => { fetchQuoteDetail(); }, [fetchQuoteDetail]);

  const onRefresh = () => { setRefreshing(true); fetchQuoteDetail(); };

  const handleWithdraw = () => {
    showConfirm(
      'Withdraw Quote',
      'Are you sure you want to withdraw this quote?',
      async () => {
        try {
          setIsWithdrawing(true);
          await withdrawQuote('luxury', quoteId);
          setQuote(prev => prev ? { ...prev, status: 'WITHDRAWN' } : null);
          showSuccess('Quote withdrawn successfully');
        } catch (err) {
          showError(err?.response?.data?.error || 'Failed to withdraw quote');
        } finally {
          setIsWithdrawing(false);
        }
      },
      { confirmText: 'Withdraw', destructive: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Quote Details</Text>
            <Text style={st.headerSub}>Luxury Cars</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={st.loadingWrap}>
          <View style={st.loadingCard}>
            <ActivityIndicator size="large" color={C.g600} />
            <Text style={st.loadingText}>Loading quote...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) return null;

  const status = quote.status || 'PENDING';
  const sc = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const request = quote.request || {};
  const isActive   = ['SENT', 'VIEWED'].includes(status);
  const canReQuote = status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(request.status);
  const customerName = request.customerName || quote.customerName || 'Customer';
  const requestNumber = request.requestNumber || quote.requestNumber;
  const vehicleName = quote.vehicleName || 'Luxury Vehicle';
  const vehicleBrand = quote.vehicleBrand || quote.vehicleModel;
  const vehicleNumber = quote.vehicleNumber || quote.registrationNumber;
  const baseAmount = quote.baseAmount || 0;
  const extraKmRate = quote.extraKmRate;
  const includedKm = quote.includedKm || quote.kmLimitPerDay;
  const totalAmount = quote.grandTotal || quote.totalAmount || 0;
  const advancePercent = quote.advancePercent || 50;
  const advanceAmount = quote.advanceAmount || Math.round(totalAmount * advancePercent / 100);
  const inclusions = quote.inclusions || [];
  const exclusions = quote.exclusions || [];
  const termsConditions = quote.termsConditions || [];
  const vendorMessage = quote.vendorMessage || quote.notes;
  const validTill = quote.validTill || quote.validUntil;
  const quoteNumber = quote.quoteNumber || (quote.id || quote._id)?.toString().slice(-8) || 'N/A';
  const pickupCity = request.pickupCity || quote.pickupCity || 'Location';
  const destination = request.destination || request.dropCity || quote.dropCity;

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.header}>
        <View style={[st.deco, { width: 120, height: 120, top: -40, right: -20, opacity: 0.07 }]} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <View style={st.quoteNumRow}>
            <Text style={st.quoteNumText}>#{quoteNumber}</Text>
            <View style={[st.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[st.statusPillText, { color: sc.color }]}>{status}</Text>
            </View>
          </View>
          <Text style={st.headerSub}>Luxury Cars</Text>
        </View>
        <View style={st.headerIconBox}>
          <MaterialCommunityIcons name="car-sports" size={22} color={C.g400} />
        </View>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} />}
      >
        {/* Accepted Banner */}
        {status === 'ACCEPTED' && (
          <View style={st.acceptedBanner}>
            <View style={st.acceptedIconBox}>
              <Ionicons name="checkmark-circle" size={22} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.acceptedTitle}>Quote Accepted by Customer!</Text>
              {bookingId ? (
                <TouchableOpacity onPress={() => navigation.navigate('LuxuryBookingDetail', { bookingId })}>
                  <Text style={st.acceptedLink}>View Booking Details →</Text>
                </TouchableOpacity>
              ) : (
                <Text style={st.acceptedSub}>Booking will appear in your Bookings section</Text>
              )}
            </View>
          </View>
        )}

        {/* Customer & Request */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <View style={[st.cardIconBox, { backgroundColor: C.blueL }]}>
              <Ionicons name="person-outline" size={16} color={C.blue} />
            </View>
            <Text style={st.cardTitle}>Customer</Text>
          </View>
          <Text style={st.customerName}>{customerName}</Text>
          {requestNumber && (
            <View style={st.refRow}>
              <Ionicons name="document-text-outline" size={13} color={C.muted} />
              <Text style={st.refText}>Request #{requestNumber}</Text>
            </View>
          )}
        </View>

        {/* Vehicle Details */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <View style={[st.cardIconBox, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="car-sports" size={16} color={C.g700} />
            </View>
            <Text style={st.cardTitle}>Vehicle</Text>
          </View>
          <View style={st.vehicleRow}>
            <View style={st.vehicleIconWrap}>
              <MaterialCommunityIcons name="car-sports" size={32} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.vehicleName}>{vehicleName}</Text>
              {vehicleBrand && <Text style={st.vehicleBrand}>{vehicleBrand}</Text>}
              {vehicleNumber && (
                <View style={st.regPill}>
                  <Text style={st.regText}>{vehicleNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={[st.card, { backgroundColor: C.amberL, borderColor: C.amber + '30' }]}>
          <View style={st.cardHead}>
            <View style={[st.cardIconBox, { backgroundColor: '#fff' }]}>
              <Icon name="tag" size={16} color={C.amber} />
            </View>
            <Text style={[st.cardTitle, { color: C.amber }]}>Pricing</Text>
          </View>
          <View style={st.priceRow}>
            <Text style={st.priceLabel}>Base Rate</Text>
            <Text style={st.priceValue}>{formatCurrency(baseAmount)}/day</Text>
          </View>
          {extraKmRate && (
            <View style={st.priceRow}>
              <Text style={st.priceLabel}>Extra KM Rate</Text>
              <Text style={st.priceValue}>{formatCurrency(extraKmRate)}/km</Text>
            </View>
          )}
          {includedKm && (
            <View style={st.priceRow}>
              <Text style={st.priceLabel}>KM Limit/Day</Text>
              <Text style={st.priceValue}>{includedKm} km</Text>
            </View>
          )}
          <View style={st.divider} />
          <View style={st.priceRow}>
            <Text style={st.priceLabelBold}>Total Amount</Text>
            <Text style={st.priceTotalValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={st.priceRow}>
            <Text style={st.priceLabel}>Advance ({advancePercent}%)</Text>
            <Text style={st.priceValue}>{formatCurrency(advanceAmount)}</Text>
          </View>
        </View>

        {/* Route */}
        {(pickupCity || destination) && (
          <View style={st.card}>
            <View style={st.cardHead}>
              <View style={[st.cardIconBox, { backgroundColor: C.g50 }]}>
                <Icon name="map-pin" size={16} color={C.g700} />
              </View>
              <Text style={st.cardTitle}>Route</Text>
            </View>
            <View style={st.routeRow}>
              <View style={st.routePin}>
                <View style={[st.pinDot, { backgroundColor: C.g500 }]} />
                <Text style={st.routeCity} numberOfLines={1}>{pickupCity}</Text>
              </View>
              {destination && (
                <>
                  <Icon name="arrow-right" size={14} color={C.muted} style={{ marginHorizontal: 6 }} />
                  <View style={st.routePin}>
                    <View style={[st.pinDot, { backgroundColor: C.red }]} />
                    <Text style={st.routeCity} numberOfLines={1}>{destination}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Validity */}
        <View style={st.card}>
          <View style={st.cardHead}>
            <View style={[st.cardIconBox, { backgroundColor: C.indigoL }]}>
              <Icon name="calendar" size={16} color={C.indigo} />
            </View>
            <Text style={st.cardTitle}>Dates</Text>
          </View>
          <View style={st.dateRow}>
            <View style={st.dateChip}>
              <Ionicons name="calendar-outline" size={13} color={C.muted} />
              <Text style={st.dateLabel}>Sent:</Text>
              <Text style={st.dateValue}>{formatDate(quote.createdAt || quote.created_at)}</Text>
            </View>
            {validTill && (
              <View style={st.dateChip}>
                <Ionicons name="time-outline" size={13} color={C.muted} />
                <Text style={st.dateLabel}>Valid:</Text>
                <Text style={st.dateValue}>{formatDate(validTill)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <View style={st.card}>
            <View style={st.cardHead}>
              <View style={[st.cardIconBox, { backgroundColor: C.g50 }]}>
                <Icon name="check-circle" size={16} color={C.g600} />
              </View>
              <Text style={st.cardTitle}>Inclusions</Text>
            </View>
            <View style={st.chipWrap}>
              {inclusions.map((item, i) => (
                <View key={i} style={[st.chip, { backgroundColor: C.g50, borderColor: C.g400 + '40' }]}>
                  <Icon name="check" size={11} color={C.g600} />
                  <Text style={[st.chipText, { color: C.g700 }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exclusions */}
        {exclusions.length > 0 && (
          <View style={st.card}>
            <View style={st.cardHead}>
              <View style={[st.cardIconBox, { backgroundColor: C.redL }]}>
                <Icon name="x-circle" size={16} color={C.red} />
              </View>
              <Text style={st.cardTitle}>Exclusions</Text>
            </View>
            <View style={st.chipWrap}>
              {exclusions.map((item, i) => (
                <View key={i} style={[st.chip, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
                  <Icon name="x" size={11} color={C.red} />
                  <Text style={[st.chipText, { color: C.red }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Terms */}
        {termsConditions.length > 0 && (
          <View style={st.card}>
            <View style={st.cardHead}>
              <View style={[st.cardIconBox, { backgroundColor: C.indigoL }]}>
                <Icon name="file-text" size={16} color={C.indigo} />
              </View>
              <Text style={st.cardTitle}>Terms & Conditions</Text>
            </View>
            {termsConditions.map((term, i) => (
              <View key={i} style={st.termRow}>
                <View style={st.termNum}><Text style={st.termNumText}>{i + 1}</Text></View>
                <Text style={st.termText}>{term}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Message */}
        {vendorMessage && (
          <View style={st.card}>
            <View style={st.cardHead}>
              <View style={[st.cardIconBox, { backgroundColor: C.amberL }]}>
                <Icon name="message-square" size={16} color={C.amber} />
              </View>
              <Text style={st.cardTitle}>Note to Customer</Text>
            </View>
            <Text style={st.messageText}>{vendorMessage}</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={st.bottomBar}>
        {status === 'ACCEPTED' ? (
          <TouchableOpacity
            style={st.viewBookingBtn}
            onPress={() => {
              if (bookingId) navigation.navigate('LuxuryBookingDetail', { bookingId });
              else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('LuxuryQuoteRequestDetail', { requestId: rid });
                else showInfo('Please check your Bookings section.');
              }
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={st.viewBookingText}>View Booking Details</Text>
          </TouchableOpacity>
        ) : isActive ? (
          <View style={st.bottomRow}>
            <TouchableOpacity
              style={[st.withdrawBtn, isWithdrawing && { opacity: 0.6 }]}
              onPress={handleWithdraw}
              disabled={isWithdrawing}
            >
              <Icon name="x-circle" size={17} color="#fff" />
              <Text style={st.bottomBtnText}>{isWithdrawing ? 'Withdrawing...' : 'Withdraw'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.viewRequestBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('LuxuryQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={17} color="#fff" />
              <Text style={st.bottomBtnText}>View Request</Text>
            </TouchableOpacity>
          </View>
        ) : canReQuote ? (
          <View style={st.bottomRow}>
            <TouchableOpacity
              style={[st.viewRequestBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('LuxuryQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={17} color="#fff" />
              <Text style={st.bottomBtnText}>View Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.freshQuoteBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('LuxurySendQuote', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Icon name="refresh-cw" size={17} color="#fff" />
              <Text style={st.bottomBtnText}>Send Fresh Quote</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={st.viewRequestBtn}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('LuxuryQuoteRequestDetail', { requestId: rid });
              else showInfo('Request details not available.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={st.bottomBtnText}>View Request Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const C_indigo = '#4F46E5';

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  quoteNumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quoteNumText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  headerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingCard: { backgroundColor: C.card, borderRadius: 20, padding: 32, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.border, elevation: 4 },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: '500' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.g50, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.g400 + '40' },
  acceptedIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center' },
  acceptedTitle: { fontSize: 14, fontWeight: '700', color: C.g700, marginBottom: 4 },
  acceptedLink: { fontSize: 13, fontWeight: '600', color: C.blue },
  acceptedSub: { fontSize: 12, color: C.g600 },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text },

  customerName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  refText: { fontSize: 12, color: C.muted },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  vehicleIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 3 },
  vehicleBrand: { fontSize: 13, color: C.sub, marginBottom: 6 },
  regPill: { alignSelf: 'flex-start', backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  regText: { fontSize: 12, fontWeight: '600', color: C.sub },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: C.sub },
  priceLabelBold: { fontSize: 14, fontWeight: '700', color: C.text },
  priceValue: { fontSize: 14, fontWeight: '600', color: C.text },
  priceTotalValue: { fontSize: 18, fontWeight: '800', color: C.g700 },
  divider: { height: 1, backgroundColor: C.amber + '40', marginVertical: 10 },

  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routePin: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  pinDot: { width: 10, height: 10, borderRadius: 5 },
  routeCity: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },

  dateRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  dateLabel: { fontSize: 12, color: C.muted },
  dateValue: { fontSize: 12, fontWeight: '600', color: C.text },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },

  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  termNum: { width: 22, height: 22, borderRadius: 6, backgroundColor: C_indigo, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  termNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  termText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 19 },

  messageText: { fontSize: 13, color: C.sub, lineHeight: 20 },

  bottomBar: { padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  viewBookingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, paddingVertical: 14, borderRadius: 14 },
  viewBookingText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  bottomRow: { flexDirection: 'row', gap: 10 },
  viewRequestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sub, paddingVertical: 15, borderRadius: 14,
  },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.red, paddingVertical: 15, borderRadius: 14, flex: 1,
  },
  freshQuoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.orange, paddingVertical: 15, borderRadius: 14,
  },
  bottomBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
