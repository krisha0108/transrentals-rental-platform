import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequestById, getBaseURL, getSessionToken } from '../../../api/client';
import { showError, showInfo } from '../../../../services/alertService';
import { SC as T, G, rs, cardShadow, shade } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// How far the ticket summary card rides up over the hero's rounded bottom
// edge — same technique/constant role as BikeQuoteDetailScreen's ticket and
// the travel-agent BookingDetailScreen's contact bar. The hero's own bottom
// padding is shortened by the same amount and the scroll content gets it
// back as paddingTop, so the gap stays the same, only the overlap changes.
const TICKET_OVERLAP = 40;

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight,
  blue: T.blue, blueL: T.blueLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
};

const STATUS_CONFIG = {
  PENDING:         { color: C.amber, bg: C.amberL, border: '#FDE68A', icon: 'time-outline',          label: 'Pending' },
  QUOTED:          { color: C.blue,  bg: C.blueL,  border: '#BFDBFE', icon: 'paper-plane-outline',   label: 'Quote Sent' },
  QUOTES_RECEIVED: { color: C.blue,  bg: C.blueL,  border: '#BFDBFE', icon: 'document-text-outline', label: 'Quotes Received' },
  ACCEPTED:        { color: C.g600,  bg: C.g50,    border: C.g100,    icon: 'checkmark-circle-outline', label: 'Accepted' },
  REJECTED:        { color: C.red,   bg: C.redL,   border: '#FECACA', icon: 'close-circle-outline',  label: 'Rejected' },
  EXPIRED:         { color: C.muted, bg: '#F8FAFC', border: C.border, icon: 'alert-circle-outline',  label: 'Expired' },
  CANCELLED:       { color: C.red,   bg: C.redL,   border: '#FECACA', icon: 'close-circle-outline',  label: 'Cancelled' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  // Handle both HH:MM and HH:MM:SS formats
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

// Reusable section card — icon + title header inside one bordered card,
// same shape BikeQuoteDetailScreen's sibling Section uses.
function Section({ iconName, iconLib = 'ion', iconColor, title, children }) {
  const renderIcon = () => {
    if (iconLib === 'mci') return <MaterialCommunityIcons name={iconName} size={15} color={iconColor || C.g700} />;
    if (iconLib === 'feather') return <Icon name={iconName} size={15} color={iconColor || C.g700} />;
    return <Ionicons name={iconName} size={15} color={iconColor || C.g700} />;
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: `${iconColor || C.g700}15` }]}>
          {renderIcon()}
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function SelfDriveQuoteRequestDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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
      const data = await getQuoteRequestById('self-drive', requestId);
      const requestData = data.request || data;
      setRequest({ ...requestData, hasQuoted: data.hasQuoted, vendorQuote: data.vendorQuote });
      setBookingId(data.bookingId || null);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      showError('Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId, navigation]);

  useEffect(() => { fetchRequestDetail(); }, [fetchRequestDetail]);

  const onRefresh = () => { setRefreshing(true); fetchRequestDetail(); };

  const handleSendQuote = () => {
    navigation.navigate('SelfDriveSendQuote', { requestId: request.id || request._id });
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.headerGrad}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons name="car" size={18} color={C.amber} />
                <Text style={styles.heroTitle}>Quote Request</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            {/* Identity block skeleton */}
            <View style={styles.identityBlock}>
              <Bone w={36} h={36} r={12} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                <Bone w={130} h={9} r={3} style={{ backgroundColor: 'rgba(255,255,255,0.22)' }} />
                <Bone w={150} h={16} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {/* Ticket summary skeleton */}
          <View style={styles.ticketWrap}>
            <View style={[styles.ticketRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={styles.ticketUpperStub}>
              <Bone w={rs(44)} h={rs(44)} r={rs(12)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={70} h={9} r={3} />
                <Bone w={100} h={16} r={4} />
              </View>
              <Bone w={70} h={22} r={20} />
            </View>
            <View style={styles.perforationRow}>
              <View style={styles.dashLine} />
            </View>
            <View style={styles.ticketLowerStub}>
              <Bone w={rs(30)} h={rs(30)} r={rs(9)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={50} h={9} r={3} />
                <Bone w={160} h={13} r={4} />
              </View>
            </View>
          </View>

          {/* Contact row skeleton */}
          <View style={styles.contactRow}>
            <Bone h={44} r={rs(14)} style={{ flex: 1 }} />
            <Bone h={44} r={rs(14)} style={{ flex: 1 }} />
          </View>

          {/* Section card skeletons */}
          {[1, 2].map(i => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHead}>
                <Bone w={34} h={34} r={10} />
                <Bone w={130} h={13} r={4} />
              </View>
              <View style={styles.factGrid}>
                {[0,1].map(j => (
                  <View key={j} style={styles.factCell}>
                    <Bone w={50} h={8} r={3} style={{ marginBottom: 6 }} />
                    <Bone w={70} h={13} r={4} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!request) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.headerGrad}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons name="car" size={18} color={C.amber} />
                <Text style={styles.heroTitle}>Quote Request</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
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

  // Customer Information
  const customerName    = request.customerName || request.customer_name || 'Customer';
  const customerEmail   = request.customerEmail || request.customer_email;
  const customerPhone   = request.customerPhone || request.customer_phone;

  const handleCallCustomer = () => {
    if (!customerPhone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType: 'self_drive_quote_request', bookingId: request.id, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${customerPhone}`);
  };

  // Vehicle Details
  const vehicleModelName = request.vehicleModelName || request.vehicle_model_name;
  const vehicleBrand = request.vehicleBrand || request.vehicle_brand;
  const vehicleType = request.vehicleType || request.vehicle_type;
  const carType = request.carType || request.car_type;
  const carTypeName = request.carTypeName || request.car_type_name || request.vehicleCategoryName || request.vehicle_category_name;

  // Map vehicleType to display name
  const vehicleTypeDisplay =
    vehicleType === '1' ? 'Hatchback' :
    vehicleType === '2' ? 'Sedan' :
    vehicleType === '3' ? 'MUV' :
    vehicleType === '4' ? 'SUV' :
    vehicleType === '5' ? 'Luxury' :
    vehicleType || carTypeName || carType;
  const transmission = request.transmission;
  const transmissionName = transmission === '1' || transmission === 1 ? 'Automatic' : transmission === '2' || transmission === 2 ? 'Manual' : transmission;
  const fuelType = request.fuelType || request.fuel_type;
  const fuelTypeName =
    fuelType === '1' || fuelType === 1 ? 'Diesel' :
    fuelType === '2' || fuelType === 2 ? 'Petrol' :
    fuelType === '3' || fuelType === 3 ? 'Electric' :
    fuelType === '4' || fuelType === 4 ? 'CNG' : fuelType;

  // Location & Trip Details
  const pickupLocation = request.locationName || request.location?.name || request.pickupLocation || request.pickup_location || request.pickupCity || 'N/A';
  const destination = request.destination || request.dropLocation || request.drop_location || request.dropCity;
  const pickupDate = request.pickupDate || request.pickup_date || request.startDate || request.journey_date;
  const pickupTime = request.pickupTime || request.pickup_time || request.start_time || request.journey_time;
  const returnDate = request.returnDate || request.return_date || request.dropDate || request.drop_date || request.endDate || request.return_datetime;
  const returnTime = request.returnTime || request.return_time || request.dropTime || request.drop_time;

  // Additional Details
  const doorstepDelivery = request.doorstepDelivery || request.doorstep_delivery || request.is_doorstep_delivery || request.isDoorstepDelivery;
  const isDoorstepDelivery = doorstepDelivery === '1' || doorstepDelivery === 1 || doorstepDelivery === 'yes' || doorstepDelivery === true;
  const passengers = request.passengers || request.total_passengers || request.totalPassengers || request.total_passangers;

  // Request Metadata
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.customerNotes || request.customer_notes || request.notes || request.description || request.additionalInfo || request.specialRequirements || request.additional_details || request.other_info;

  const canSendQuote = !request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero ══════════════════════════════════════════════════════════ */}
      <LinearGradient colors={G.hero} style={styles.headerGrad}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <MaterialCommunityIcons name="car" size={18} color={C.amber} />
              <Text style={styles.heroTitle}>Quote Request</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Identity block — who this request is from. The "Send Quote"
              action is NOT duplicated here — it already lives in the sticky
              bottom bar below; only the "Quoted" state (info, not an action)
              gets a small inline badge so the header stays a single row. */}
          <View style={styles.identityBlock}>
            <View style={styles.identityIcon}>
              <Text style={styles.identityIconTxt}>{customerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
              <Text style={styles.identityLabel}>QUOTE REQUEST FROM</Text>
              <Text style={styles.identityName} numberOfLines={1}>{customerName}</Text>
              {customerPhone ? (
                <View style={styles.identityPhoneRow}>
                  <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.identityPhoneTxt}>{customerPhone}</Text>
                </View>
              ) : null}
            </View>
            {request.hasQuoted && (
              <View style={styles.quotedPill}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.quotedPillText}>Quoted</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g500} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Ticket summary — request #, status & route, floated over hero ── */}
        <View style={styles.ticketWrap}>
          <LinearGradient
            colors={[sc.color, shade(sc.color, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ticketRail}
          />
          <View style={styles.ticketUpperStub}>
            <View style={styles.ticketIconBox}>
              <Ionicons name="document-text-outline" size={20} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ticketLabel}>REQUEST #</Text>
              <Text style={styles.ticketNumber} numberOfLines={1}>{requestNumber}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[styles.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Perforation — torn-ticket edge, echoes the My Quotes list card */}
          <View style={styles.perforationRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashLine} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.ticketLowerStub}>
            <View style={styles.ticketRouteIconWrap}>
              <Ionicons name="location" size={16} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ticketRouteLabel}>ROUTE</Text>
              <Text style={styles.ticketRouteValue} numberOfLines={1}>
                {pickupLocation}{destination ? `  →  ${destination}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick contact — Call (existing handler) + Email (mailto:, same
            already-fetched customerEmail, no new data/fetch) */}
        {(customerPhone || customerEmail) && (
          <View style={styles.contactRow}>
            {customerPhone && (
              <TouchableOpacity style={styles.contactBtn} onPress={handleCallCustomer} activeOpacity={0.8}>
                <Ionicons name="call" size={16} color={C.g600} />
                <Text style={styles.contactBtnTxt}>Call</Text>
              </TouchableOpacity>
            )}
            {customerEmail && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`mailto:${customerEmail}`)} activeOpacity={0.8}>
                <Ionicons name="mail" size={16} color={C.blue} />
                <Text style={[styles.contactBtnTxt, { color: C.blue }]}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Already quoted banner */}
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

        {/* Vehicle */}
        {(vehicleModelName || vehicleBrand || vehicleTypeDisplay || transmission || fuelType) ? (
          <Section iconName="car" iconLib="mci" iconColor={C.amber} title="Vehicle Preference">
            <View style={styles.vehicleBox}>
              <View style={styles.vehicleIconWrap}>
                <MaterialCommunityIcons name="car" size={28} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{vehicleModelName || vehicleTypeDisplay || 'Vehicle'}</Text>
                {vehicleBrand ? <Text style={styles.vehicleBrand}>{vehicleBrand}</Text> : null}
                {vehicleModelName && vehicleTypeDisplay ? (
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{vehicleTypeDisplay}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {(transmissionName || fuelTypeName) ? (
              <View style={styles.vehicleSpecsRow}>
                {transmissionName ? (
                  <View style={styles.specItem}>
                    <View style={styles.specIconBox}>
                      <MaterialCommunityIcons name="car-shift-pattern" size={15} color={C.g700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.specLabel}>TRANSMISSION</Text>
                      <Text style={styles.specValue}>{transmissionName}</Text>
                    </View>
                  </View>
                ) : null}
                {fuelTypeName ? (
                  <View style={styles.specItem}>
                    <View style={styles.specIconBox}>
                      <MaterialCommunityIcons name="gas-station" size={15} color={C.g700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.specLabel}>FUEL TYPE</Text>
                      <Text style={styles.specValue}>{fuelTypeName}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Section>
        ) : null}

        {/* Trip details — route line + fact grid (same fields, new layout) */}
        <Section iconName="calendar-outline" iconColor={C.g600} title="Rental Details">
          <View style={styles.routeWrap}>
            <View style={styles.routeGutter}>
              <View style={[styles.routeDot, { backgroundColor: C.g600 }]} />
              {destination ? <View style={styles.routeLine} /> : null}
              {destination ? <View style={[styles.routeDot, { backgroundColor: C.red }]} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue}>{pickupLocation}</Text>
              {destination ? (
                <>
                  <Text style={[styles.routeLabel, { marginTop: 10 }]}>DESTINATION</Text>
                  <Text style={styles.routeValue}>{destination}</Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.factGrid}>
            <View style={styles.factCell}>
              <Text style={styles.factLabel}>PICKUP</Text>
              <Text style={styles.factValue}>{formatDate(pickupDate)}</Text>
              <Text style={styles.factSub}>{formatTime(pickupTime)}</Text>
            </View>
            {returnDate ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>RETURN</Text>
                <Text style={styles.factValue}>{formatDate(returnDate)}</Text>
                <Text style={styles.factSub}>{formatTime(returnTime)}</Text>
              </View>
            ) : null}
            {passengers ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>PASSENGERS</Text>
                <Text style={styles.factValue}>{passengers}</Text>
                <Text style={styles.factSub}>{passengers === 1 ? 'Passenger' : 'Passengers'}</Text>
              </View>
            ) : null}
            {doorstepDelivery !== null && doorstepDelivery !== undefined ? (
              <View style={styles.factCell}>
                <Text style={styles.factLabel}>DELIVERY</Text>
                <Text style={[styles.factValue, { color: isDoorstepDelivery ? C.g600 : C.red }]}>
                  {isDoorstepDelivery ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.factSub}>{isDoorstepDelivery ? 'Doorstep' : 'Self Pickup'}</Text>
              </View>
            ) : null}
          </View>
        </Section>

        {/* Notes */}
        {notes ? (
          <Section iconName="chatbox-outline" iconColor={C.purple} title="Special Requirements">
            <Text style={styles.notesText}>{notes}</Text>
          </Section>
        ) : null}

        {/* Timeline — dot + connecting line, same 2 real events as before */}
        <Section iconName="time-outline" iconColor={C.muted} title="Request Timeline">
          <View style={styles.tlRow}>
            <View style={styles.tlGutter}>
              <View style={[styles.tlDot, { backgroundColor: C.g500 }]} />
              {request.updatedAt && request.updatedAt !== request.createdAt ? <View style={styles.tlLine} /> : null}
            </View>
            <Text style={styles.timelineText}>Received · {formatDate(request.createdAt || request.created_at)}</Text>
          </View>
          {request.updatedAt && request.updatedAt !== request.createdAt ? (
            <View style={styles.tlRow}>
              <View style={styles.tlGutter}>
                <View style={[styles.tlDot, { backgroundColor: C.muted }]} />
              </View>
              <Text style={styles.timelineText}>Updated · {formatDate(request.updatedAt)}</Text>
            </View>
          ) : null}
        </Section>
      </ScrollView>

      {/* Bottom bar */}
      {request.hasQuoted && (status === 'ACCEPTED' || request.vendorQuote?.status === 'ACCEPTED') ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity
            style={styles.primaryBtnWrap}
            activeOpacity={0.9}
            onPress={() => {
              if (bookingId) navigation.navigate('SelfDriveBookingDetail', { bookingId });
              else showInfo('Booking details will appear in your Bookings section shortly.');
            }}
          >
            <LinearGradient colors={G.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnInner}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.bottomBtnText}>View Booking Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : canSendQuote ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
          <TouchableOpacity style={styles.primaryBtnWrap} activeOpacity={0.9} onPress={handleSendQuote}>
            <LinearGradient colors={G.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtnInner}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.bottomBtnText}>Send Quote to Customer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : request.hasQuoted && status !== 'ACCEPTED' && request.vendorQuote?.status !== 'ACCEPTED' ? (
        <View style={[styles.quotedSentBar, { paddingBottom: insets.bottom + 12 }]}>
          <Ionicons name="checkmark-circle" size={20} color={C.g600} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.quotedSentText}>Quote Already Sent</Text>
            {request.vendorQuote?.grandTotal ? (
              <Text style={styles.quotedSentAmt}>
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

  // ── Hero ──────────────────────────────────────────────────────────────
  headerGrad: { paddingHorizontal: 16, paddingBottom: 14, overflow: 'hidden', borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, marginBottom: 10 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // Identity block (customer avatar + name + phone)
  identityBlock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  identityIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  identityIconTxt: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },
  identityLabel: { fontSize: 8.5, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  identityName: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  identityPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  identityPhoneTxt: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  // Inline "Quoted" badge — sits at the end of the identity row
  quotedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  quotedPillText: { fontSize: 12.5, fontWeight: '700', color: '#fff' },

  scrollContent: { paddingHorizontal: 16, paddingTop: TICKET_OVERLAP, paddingBottom: 100 },

  // ── Ticket summary card — request #, status, route; overlaps hero bottom ──
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
  notchLeft: { position: 'absolute', left: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },
  notchRight: { position: 'absolute', right: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },

  ticketLowerStub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 14 },
  ticketRouteIconWrap: { width: rs(30), height: rs(30), borderRadius: rs(9), backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  ticketRouteLabel: { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  ticketRouteValue: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '800', color: C.g700 },

  // Quick contact row
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.card, borderRadius: rs(14), paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  contactBtnTxt: { fontSize: 14, fontWeight: '800', color: C.g600 },

  // Quoted banner
  quotedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.g50, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.g100, marginBottom: 12,
  },
  quotedBannerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center' },
  quotedBannerTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700 },
  quotedBannerAmt: { fontSize: 13, color: C.g600, marginTop: 2 },

  // ── Section card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  // Vehicle
  vehicleBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.amberL, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  vehicleName: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  vehicleBrand: { fontSize: 13, color: C.sub, marginTop: 2 },
  catPill: {
    alignSelf: 'flex-start', backgroundColor: C.amberL,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  catPillText: { fontSize: 12, fontWeight: '600', color: C.amber },

  // Vehicle specs (transmission / fuel)
  vehicleSpecsRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  specItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  specIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  specLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 1 },
  specValue: { fontSize: 14, fontWeight: '700', color: C.text },

  // Route line (pickup → destination) inside Rental Details
  routeWrap: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 12 },
  routeGutter: { width: 20, alignItems: 'center', marginRight: 10 },
  routeDot: { width: 9, height: 9, borderRadius: 4.5 },
  routeLine: { width: 1.5, flex: 1, minHeight: 24, backgroundColor: C.border, marginVertical: 3 },
  routeLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  routeValue: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },

  // Fact grid (pickup/return/passengers/delivery)
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCell: { flexGrow: 1, minWidth: '30%', backgroundColor: C.g50, borderRadius: rs(12), padding: 10 },
  factLabel: { fontSize: 10, fontWeight: '700', color: C.g700, letterSpacing: 0.5, marginBottom: 4 },
  factValue: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  factSub: { fontSize: 12, color: C.sub, marginTop: 1 },

  // Notes
  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  // Timeline (dot + connecting line)
  tlRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tlGutter: { width: 18, alignItems: 'center' },
  tlDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  tlLine: { width: 1.5, flex: 1, minHeight: 16, backgroundColor: C.border, marginVertical: 2 },
  timelineText: { fontSize: 14, color: C.sub, marginLeft: 6, paddingBottom: 10 },

  // ── Bottom bar ────────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  primaryBtnWrap: { borderRadius: rs(14), overflow: 'hidden' },
  primaryBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  bottomBtnText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },

  quotedSentBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.g50,
    borderTopWidth: 1, borderTopColor: C.g100,
  },
  quotedSentText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700 },
  quotedSentAmt: { fontSize: 13, color: C.g600, marginTop: 1 },

  // Empty / Loading
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text, marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
