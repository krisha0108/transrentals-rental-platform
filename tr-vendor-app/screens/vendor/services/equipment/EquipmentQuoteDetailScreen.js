import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, getQuoteRequestById, withdrawQuote } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';
import { SC as T, G, rs, shade, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// How far the ticket summary card rides up over the hero's rounded bottom
// edge. The hero's own paddingBottom is shortened by the same amount and the
// scroll content gets it back as paddingTop, so the gap stays the same —
// only the visual overlap changes. Same technique as the bike side's
// BikeQuoteDetailScreen.
const TICKET_OVERLAP = 40;

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange,
};

const STATUS_CONFIG = {
  PENDING:  { color: C.amber, bg: C.amberL, icon: 'hourglass-outline',       label: 'Pending' },
  SENT:     { color: C.blue,  bg: C.blueL,  icon: 'paper-plane-outline',     label: 'Sent' },
  ACCEPTED: { color: C.g600,  bg: C.g50,    icon: 'checkmark-circle',         label: 'Accepted' },
  REJECTED: { color: C.red,   bg: C.redL,   icon: 'close-circle',             label: 'Rejected' },
  EXPIRED:  { color: C.muted, bg: C.bg,     icon: 'time-outline',            label: 'Expired' },
  WITHDRAWN:{ color: C.muted, bg: C.bg,     icon: 'arrow-undo-outline',      label: 'Withdrawn' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/* ── Section wrapper ─────────────────────────────────────────────────────── */
const Section = ({ icon, title, iconBg, children }) => (
  <View style={s.card}>
    <View style={s.cardHead}>
      <View style={[s.cardIcon, iconBg && { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={s.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

/* ── Info row inside a card ──────────────────────────────────────────────── */
const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <View style={s.infoIconWrap}>{icon}</View>
    <View style={s.infoContent}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  </View>
);

function PriceRow({ label, value }) {
  return (
    <View style={s.payRow}>
      <Text style={s.payLabel}>{label}</Text>
      <Text style={s.payVal}>{value}</Text>
    </View>
  );
}

export default function EquipmentQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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

  const handleWithdraw = () => {
    showConfirm(
      'Withdraw Quote',
      'Are you sure you want to withdraw this quote?',
      async () => {
        try {
          setIsWithdrawing(true);
          await withdrawQuote('equipment', quoteId);
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

  /* ── Loading ── */
  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="toolbox" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Quote Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            {/* Identity block skeleton */}
            <View style={s.identityBlock}>
              <Bone w={rs(48)} h={rs(48)} r={rs(14)} style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12), gap: 6 }}>
                <Bone w={70} h={9} r={3} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Bone w={130} h={16} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.26)' }} />
                <Bone w={100} h={11} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Ticket summary skeleton */}
          <View style={s.ticketWrap}>
            <View style={[s.ticketRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={s.ticketUpperStub}>
              <Bone w={rs(44)} h={rs(44)} r={rs(12)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={60} h={9} r={3} />
                <Bone w={100} h={16} r={4} />
              </View>
              <Bone w={70} h={22} r={20} />
            </View>
            <View style={s.perforationRow}>
              <View style={s.dashLine} />
            </View>
            <View style={s.ticketLowerStub}>
              <Bone w={rs(30)} h={rs(30)} r={rs(9)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={90} h={9} r={3} />
                <Bone w={120} h={16} r={4} />
              </View>
            </View>
          </View>

          {/* Customer card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={100} h={13} r={4} />
            </View>
            {[0,1].map(i => (
              <View key={i} style={s.infoRow}>
                <Bone w={32} h={32} r={8} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Bone w={50} h={9} r={3} />
                  <Bone w={120} h={13} r={4} />
                </View>
              </View>
            ))}
          </View>

          {/* Booking Details card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={130} h={13} r={4} />
            </View>
            <View style={s.routeCard}>
              <View style={s.routeRail}>
                <Bone w={10} h={10} r={5} />
                <View style={s.routeLine} />
                <Bone w={10} h={10} r={5} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Bone w={50} h={9} r={3} />
                <Bone w={100} h={14} r={4} style={{ marginBottom: rs(12) }} />
                <Bone w={40} h={9} r={3} />
                <Bone w={90} h={14} r={4} />
              </View>
            </View>
          </View>

          {/* Pricing card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            {[0,1,2].map(i => (
              <View key={i} style={s.payRow}>
                <Bone w={70} h={11} r={4} />
                <Bone w={60} h={11} r={4} />
              </View>
            ))}
            <Bone w="100%" h={48} r={12} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ── Not found ── */
  if (!quote) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="toolbox" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Quote Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={44} color={C.g400} />
          </View>
          <Text style={s.emptyTitle}>Quote Not Found</Text>
          <Text style={s.emptySubtitle}>This quote may have been removed</Text>
        </View>
      </View>
    );
  }

  /* ── Data extraction ── */
  const status = quote.status || 'PENDING';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const request = quote.request || {};
  const isActive   = ['SENT', 'VIEWED'].includes(status);
  const canReQuote = status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes((quote.request || {}).status);

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

  // Timeline events — same two possible entries the original screen showed,
  // just assembled into a list so the connecting line can be drawn between
  // whichever dots actually render.
  const timelineEvents = [
    { key: 'sent', label: 'Quote Sent', date: quote.createdAt || quote.created_at, color: C.g500 },
  ];
  if (quote.updatedAt && quote.updatedAt !== quote.createdAt) {
    timelineEvents.push({ key: 'updated', label: 'Last Updated', date: quote.updatedAt, color: C.sub });
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero Header ══════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={s.titleWrap}>
              <MaterialCommunityIcons name="toolbox" size={18} color={C.g400} />
              <Text style={s.heroTitle}>Quote Details</Text>
            </View>
            <TouchableOpacity style={s.backBtn} onPress={onRefresh}>
              <Icon name="refresh-cw" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Identity block — who this quote is for */}
        <View style={s.identityBlock}>
          <View style={s.identityIcon}>
            <MaterialCommunityIcons name="account" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12) }}>
            <Text style={s.identityLabel}>QUOTE FOR</Text>
            <Text style={s.identityName} numberOfLines={1}>{customerName}</Text>
            <Text style={s.identitySub} numberOfLines={1}>
              {pickupCity}{dropCity ? ` → ${dropCity}` : ''}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ══ Body ═════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
        {/* ── Ticket summary — quote #, status & total, floated over the hero ── */}
        <View style={s.ticketWrap}>
          <LinearGradient
            colors={[cfg.color, shade(cfg.color, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.ticketRail}
          />
          <View style={s.ticketUpperStub}>
            <View style={s.ticketIconBox}>
              <MaterialCommunityIcons name="toolbox" size={22} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.ticketLabel}>QUOTE #</Text>
              <Text style={s.ticketNumber} numberOfLines={1}>{quoteNumber}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[s.statusPillTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Perforation — torn-ticket edge */}
          <View style={s.perforationRow}>
            <View style={s.notchLeft} />
            <View style={s.dashLine} />
            <View style={s.notchRight} />
          </View>

          <View style={s.ticketLowerStub}>
            <View style={s.moneyIconWrap}>
              <Ionicons name="cash" size={16} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ticketAmountLabel}>TOTAL QUOTED</Text>
              <Text style={s.ticketAmountVal}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* ── Request Reference ── */}
        {requestNumber && (
          <Section
            icon={<Ionicons name="document-text-outline" size={15} color={C.g700} />}
            title="Reference"
          >
            <View style={s.refBadge}>
              <Ionicons name="document-text-outline" size={16} color={C.g700} />
              <Text style={s.refBadgeText}>Request #{requestNumber}</Text>
            </View>
          </Section>
        )}

        {/* ── Customer ── */}
        <Section
          icon={<Ionicons name="person-circle-outline" size={15} color={C.g700} />}
          title="Customer"
        >
          <InfoRow icon={<Ionicons name="person" size={16} color={C.muted} />} label="Name" value={customerName} />
          {customerEmail && <InfoRow icon={<Ionicons name="mail" size={16} color={C.muted} />} label="Email" value={customerEmail} />}
        </Section>

        {/* ── Equipment Details ── */}
        {vehicleName && (
          <Section
            icon={<MaterialCommunityIcons name="toolbox" size={15} color={C.g700} />}
            title="Equipment Details"
          >
            <View style={s.vehicleHero}>
              <View style={s.vehicleHeroIcon}>
                <MaterialCommunityIcons name="toolbox" size={26} color={C.g700} />
              </View>
              <View style={s.vehicleHeroText}>
                <Text style={s.vehicleHeroName}>{vehicleName}</Text>
                {vehicleBrand && <Text style={s.vehicleHeroBrand}>{vehicleBrand}</Text>}
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
                    <Ionicons name="checkmark-circle" size={15} color={C.g600} />
                    <Text style={s.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}

        {/* ── Booking Details ── */}
        <Section
          icon={<Ionicons name="calendar-outline" size={15} color={C.g700} />}
          title="Booking Details"
        >
          <View style={s.routeCard}>
            <View style={s.routeRail}>
              <View style={[s.routeDot, { backgroundColor: C.g600 }]} />
              {!!dropCity && <View style={s.routeLine} />}
              {!!dropCity && <View style={[s.routeDot, { backgroundColor: C.red }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>LOCATION</Text>
              <Text style={s.routeValue} numberOfLines={1}>{pickupCity}</Text>
              {!!dropCity && (
                <>
                  <View style={{ height: rs(12) }} />
                  <Text style={s.routeLabel}>DROP LOCATION</Text>
                  <Text style={s.routeValue} numberOfLines={1}>{dropCity}</Text>
                </>
              )}
            </View>
          </View>

          <View style={s.dateGrid}>
            {pickupDate && (
              <View style={s.dateCell}>
                <Ionicons name="calendar" size={14} color={C.sub} />
                <Text style={s.dateCellLabel}>START DATE</Text>
                <Text style={s.dateCellValue}>{formatDate(pickupDate)}</Text>
              </View>
            )}
            {returnDate && (
              <View style={s.dateCell}>
                <Ionicons name="calendar" size={14} color={C.sub} />
                <Text style={s.dateCellLabel}>END DATE</Text>
                <Text style={s.dateCellValue}>{formatDate(returnDate)}</Text>
              </View>
            )}
          </View>
        </Section>

        {/* ── Pricing Breakdown ── */}
        <Section
          icon={<Ionicons name="receipt-outline" size={15} color={C.g700} />}
          title="Pricing Breakdown"
        >
          {quote.dailyRate > 0 && <PriceRow label="Daily Rate" value={formatCurrency(quote.dailyRate)} />}
          {quote.operatorCharges > 0 && <PriceRow label="Operator Charges" value={formatCurrency(quote.operatorCharges)} />}
          {quote.transportCharges > 0 && <PriceRow label="Transport Charges" value={formatCurrency(quote.transportCharges)} />}
          {quote.maintenanceCharges > 0 && <PriceRow label="Maintenance" value={formatCurrency(quote.maintenanceCharges)} />}
          {quote.deliveryCharges > 0 && <PriceRow label="Delivery Charges" value={formatCurrency(quote.deliveryCharges)} />}
          {securityDeposit > 0 && <PriceRow label="Security Deposit" value={formatCurrency(securityDeposit)} />}
          {quote.gstAmount > 0 && <PriceRow label="GST" value={formatCurrency(quote.gstAmount)} />}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Grand Total</Text>
            <Text style={s.totalVal}>{formatCurrency(totalAmount)}</Text>
          </View>
        </Section>

        {/* ── Quote Validity ── */}
        {validTill && (
          <Section
            icon={<Ionicons name="time-outline" size={15} color={C.g700} />}
            title="Quote Validity"
          >
            <InfoRow icon={<Ionicons name="hourglass-outline" size={16} color={C.muted} />} label="Valid Until" value={formatDate(validTill)} />
          </Section>
        )}

        {/* ── Additional Notes ── */}
        {notes && (
          <Section
            icon={<Ionicons name="chatbox-outline" size={15} color={C.g700} />}
            title="Additional Notes"
            iconBg={C.amberL}
          >
            <View style={s.notesInner}>
              <Text style={s.notesTxt}>{notes}</Text>
            </View>
          </Section>
        )}

        {/* ── Inclusions ── */}
        {inclusions && inclusions.length > 0 && (
          <Section
            icon={<Ionicons name="checkmark-circle-outline" size={15} color={C.g700} />}
            title="Inclusions"
          >
            <View style={s.pillWrap}>
              {inclusions.map((item, idx) => (
                <View key={idx} style={[s.pill, { backgroundColor: C.g100 }]}>
                  <View style={[s.pillPip, { backgroundColor: C.g700 }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                  <Text style={[s.pillTxt, { color: C.g700 }]}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Exclusions ── */}
        {exclusions && exclusions.length > 0 && (
          <Section
            icon={<Ionicons name="close-circle-outline" size={15} color={C.g700} />}
            title="Exclusions"
          >
            <View style={s.pillWrap}>
              {exclusions.map((item, idx) => (
                <View key={idx} style={[s.pill, { backgroundColor: C.redL }]}>
                  <View style={[s.pillPip, { backgroundColor: C.red }]}>
                    <Ionicons name="close" size={10} color="#fff" />
                  </View>
                  <Text style={[s.pillTxt, { color: C.red }]}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Terms & Conditions ── */}
        {termsConditions && termsConditions.length > 0 && (
          <Section
            icon={<Ionicons name="document-text-outline" size={15} color={C.g700} />}
            title="Terms & Conditions"
          >
            <View style={s.termsCard}>
              {termsConditions.map((item, idx) => (
                <View key={idx} style={[s.termLine, idx === termsConditions.length - 1 && { marginBottom: 0 }]}>
                  <Text style={s.termNum}>{idx + 1}.</Text>
                  <Text style={s.termTxt}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Timeline ── */}
        <Section
          icon={<Ionicons name="time-outline" size={15} color={C.g700} />}
          title="Timeline"
        >
          {timelineEvents.map((ev, idx) => (
            <View key={ev.key} style={s.timelineItem}>
              <View style={s.timelineRail}>
                <View style={[s.timelineDot, { backgroundColor: ev.color }]} />
                {idx < timelineEvents.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={[s.timelineBody, idx < timelineEvents.length - 1 && { marginBottom: rs(14) }]}>
                <Text style={s.timelineEvent}>{ev.label}</Text>
                <Text style={s.timelineDate}>{formatDate(ev.date)}</Text>
              </View>
            </View>
          ))}
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={s.bottomBar}>
        {status === 'ACCEPTED' ? (
          <TouchableOpacity
            style={s.primaryBtnWrap}
            activeOpacity={0.9}
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
            <LinearGradient colors={G.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtnInner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={s.bottomBtnText}>View Booking Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : isActive ? (
          <View style={s.bottomRow}>
            <TouchableOpacity
              style={[s.withdrawBtn, isWithdrawing && { opacity: 0.6 }]}
              onPress={handleWithdraw}
              disabled={isWithdrawing}
              activeOpacity={0.75}
            >
              {isWithdrawing ? (
                <ActivityIndicator size="small" color={C.red} />
              ) : (
                <>
                  <Icon name="x-circle" size={16} color={C.red} />
                  <Text style={s.withdrawBtnText}>Withdraw</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.outlineBtn, { flex: 1 }]}
              activeOpacity={0.75}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('EquipmentQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={C.g700} />
              <Text style={s.outlineBtnText}>View Request</Text>
            </TouchableOpacity>
          </View>
        ) : canReQuote ? (
          <View style={s.bottomRow}>
            <TouchableOpacity
              style={[s.outlineBtn, { flex: 1 }]}
              activeOpacity={0.75}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('EquipmentQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={C.g700} />
              <Text style={s.outlineBtnText}>View Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryBtnWrap, { flex: 1 }]}
              activeOpacity={0.9}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('EquipmentSendQuote', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <LinearGradient colors={G.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtnInner}>
                <Icon name="refresh-cw" size={16} color="#fff" />
                <Text style={s.bottomBtnText}>Send Fresh Quote</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.primaryBtnWrap}
            activeOpacity={0.9}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('EquipmentQuoteRequestDetail', { requestId: rid });
              else showInfo('Request details not available.');
            }}
          >
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtnInner}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={s.bottomBtnText}>View Request Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: TICKET_OVERLAP, paddingBottom: 100 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  centeredTxt: { fontSize: 14, color: C.muted },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 16, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 16 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  identityBlock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  identityIcon: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  identityLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.4, marginBottom: 3 },
  identityName:  { fontFamily: DISPLAY, fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  identitySub:   { fontSize: 13.5, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 3 },

  // ── Ticket summary card — quote #, status, total; overlaps hero bottom ──
  ticketWrap: {
    marginTop: -TICKET_OVERLAP, backgroundColor: C.card,
    borderRadius: rs(16), overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    marginBottom: 12, ...cardShadow,
  },
  ticketRail: { height: 3, width: '100%' },
  ticketUpperStub: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  ticketIconBox: {
    width: rs(44), height: rs(44), borderRadius: rs(12),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  ticketLabel: { fontSize: 10.5, color: C.muted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  ticketNumber: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '900', color: C.text, letterSpacing: -0.3 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 12, fontWeight: '700' },

  perforationRow: { height: 2, justifyContent: 'center' },
  dashLine: { marginHorizontal: 20, borderTopWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  notchLeft: {
    position: 'absolute', left: -9, top: -8,
    width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg,
  },
  notchRight: {
    position: 'absolute', right: -9, top: -8,
    width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg,
  },

  ticketLowerStub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 14 },
  moneyIconWrap: {
    width: rs(30), height: rs(30), borderRadius: rs(9),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  ticketAmountLabel: { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  ticketAmountVal: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '900', color: C.g700, letterSpacing: -0.4 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  /* InfoRow */
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1, backgroundColor: C.bg },
  infoContent:  { flex: 1 },
  infoLabel:    { fontSize: 12, color: C.muted, marginBottom: 2 },
  infoValue:    { fontSize: 14, color: C.text, fontWeight: '600' },

  /* Ref badge */
  refBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g50, padding: 12, borderRadius: rs(10),
  },
  refBadgeText: { fontSize: 14, fontWeight: '700', color: C.g700 },

  /* Equipment hero */
  vehicleHero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  vehicleHeroIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleHeroText: { flex: 1 },
  vehicleHeroName:  { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text },
  vehicleHeroBrand: { fontSize: 14, color: C.sub, marginTop: 3 },

  /* Features */
  featuresWrap: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  featuresTitle: { fontSize: 12, fontWeight: '800', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  featureItem:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText:  { fontSize: 14, color: C.sub, flex: 1 },

  /* Route / booking details */
  routeCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.bg, borderRadius: rs(12), padding: 14,
  },
  routeRail: { alignItems: 'center', paddingTop: 3 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, flex: 1, minHeight: rs(28), backgroundColor: C.border, marginVertical: 4 },
  routeLabel: { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 0.6 },
  routeValue: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '700', color: C.text, marginTop: 2 },

  dateGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dateCell: {
    flex: 1, alignItems: 'flex-start', gap: 4,
    backgroundColor: C.g50, borderRadius: rs(12), padding: 12,
  },
  dateCellLabel: { fontSize: 10.5, color: C.g700, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },
  dateCellValue: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '800', color: C.text },

  /* Pricing */
  payRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  payLabel:{ fontSize: 14, color: C.sub },
  payVal:  { fontSize: 14, fontWeight: '600', color: C.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: rs(12), padding: 14,
    borderWidth: 1, borderColor: C.g100, marginVertical: 6,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal:   { fontFamily: DISPLAY, fontSize: 22, fontWeight: '900', color: C.g700 },

  /* Inclusions / Exclusions pills */
  pillWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 12, paddingLeft: 7, borderRadius: 20 },
  pillPip:   { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillTxt:   { fontSize: 13, fontWeight: '600' },

  /* Terms */
  termsCard: { backgroundColor: C.bg, borderRadius: rs(12), padding: 12 },
  termLine:  { flexDirection: 'row', gap: 8, marginBottom: 8 },
  termNum:   { fontSize: 13, fontWeight: '800', color: C.text },
  termTxt:   { flex: 1, fontSize: 13.5, color: C.sub, lineHeight: 18 },

  /* Notes */
  notesInner: { borderLeftWidth: 3, borderLeftColor: C.amber, paddingLeft: 12 },
  notesTxt: { fontSize: 14, color: C.text, lineHeight: 20 },

  /* Timeline */
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center' },
  timelineDot:  { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, minHeight: rs(20), backgroundColor: C.border, marginTop: 4 },
  timelineBody: { flex: 1, paddingTop: 0 },
  timelineEvent: { fontSize: 14, fontWeight: '600', color: C.text },
  timelineDate:  { fontSize: 13, color: C.muted, marginTop: 2 },

  /* Bottom Bar */
  bottomBar: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...cardShadow,
  },
  bottomRow: { flexDirection: 'row', gap: 10 },

  primaryBtnWrap: { borderRadius: rs(14), overflow: 'hidden' },
  primaryBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.card, paddingVertical: 14, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.g100,
  },
  outlineBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700 },

  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.redL, paddingVertical: 14, borderRadius: rs(14), flex: 1,
    borderWidth: 1.5, borderColor: '#FECACA',
  },
  withdrawBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.red },

  bottomBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },

  /* Empty */
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle:    { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center' },
});
