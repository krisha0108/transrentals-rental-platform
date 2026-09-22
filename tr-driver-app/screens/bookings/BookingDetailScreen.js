import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Modal,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { acceptBooking, getOrCreateDriverChat } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6', purple: '#9333EA',
};

const SVC_STYLE = {
  chauffeur: { color: '#3B82F6', bg: '#EFF6FF',  label: 'Chauffeur' },
  bus:       { color: '#D97706', bg: '#FEF3C7',  label: 'Bus' },
  luxury:    { color: '#9333EA', bg: '#FDF4FF',  label: 'Luxury' },
  truck:     { color: '#EA580C', bg: '#FFF7ED',  label: 'Truck' },
  packers:   { color: '#15803D', bg: '#F0FDF4',  label: 'Packers' },
  equipment: { color: '#0369A1', bg: '#F0F9FF',  label: 'Equipment' },
  b2b:       { color: '#7C3AED', bg: '#F5F3FF',  label: 'B2B' },
  direct:    { color: '#16A34A', bg: '#F0FDF4',  label: 'Vendor Direct' },
};

const STATUS_CFG = {
  ACCEPTED:         { color: '#16A34A', bg: '#DCFCE7', label: 'Accepted' },
  DRIVER_ASSIGNED:  { color: '#0369A1', bg: '#DBEAFE', label: 'Vehicle Assigned' },
  VEHICLE_ASSIGNED: { color: '#0369A1', bg: '#DBEAFE', label: 'Vehicle Assigned' },
  IN_PROGRESS:      { color: '#EA580C', bg: '#FFEDD5', label: 'In Progress' },
  STARTED:          { color: '#EA580C', bg: '#FFEDD5', label: 'In Progress' },
  COMPLETED:        { color: '#6366F1', bg: '#EDE9FE', label: 'Completed' },
  CONFIRMED:        { color: '#16A34A', bg: '#DCFCE7', label: 'Confirmed' },
  confirmed:        { color: '#16A34A', bg: '#DCFCE7', label: 'Confirmed' },
  assigned:         { color: '#0369A1', bg: '#DBEAFE', label: 'Assigned' },
  vehicle_assigned: { color: '#0369A1', bg: '#DBEAFE', label: 'Vehicle Assigned' },
  in_progress:      { color: '#EA580C', bg: '#FFEDD5', label: 'In Progress' },
  completed:        { color: '#6366F1', bg: '#EDE9FE', label: 'Completed' },
};

const TRIP_LABELS = {
  LOCAL: 'Local', OUTSTATION: 'Outstation', AIRPORT: 'Airport Transfer',
  ROUND_TRIP: 'Round Trip', ONE_WAY: 'One Way',
};

function getStatus(s) {
  return STATUS_CFG[s] || { color: C.sub, bg: '#F1F5F9', label: s?.replace(/_/g, ' ') || 'Unknown' };
}

// ── Compact info row ──────────────────────────────────────────────────────────
function Row({ icon, iconColor = C.primary, iconBg = '#F0FDF4', label, value, mono, last }) {
  if (!value && value !== 0) return null;
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowMono]} numberOfLines={2}>{String(value)}</Text>
    </View>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, iconColor = C.primary, iconBg = '#F0FDF4', children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={13} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ── Service-specific rows ─────────────────────────────────────────────────────
function ServiceRows({ booking }) {
  const { source } = booking;

  if (source === 'chauffeur') {
    return (
      <>
        <Row icon="repeat-outline" iconBg="#F5F3FF" iconColor={C.purple} label="Trip Type" value={TRIP_LABELS[booking.serviceLabel] || booking.serviceLabel} />
        <Row icon="car-sport-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Vehicle" value={booking.carCategoryName} />
        {booking.localPackageHours ? (
          <Row icon="timer-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Package" value={`${booking.localPackageHours}h / ${booking.localPackageKm || '?'}km`} />
        ) : null}
        {booking.estimatedDistance > 0 ? (
          <Row icon="speedometer-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Est. Distance" value={`${booking.estimatedDistance} km`} />
        ) : null}
        {booking.totalDays > 1 ? (
          <Row icon="calendar-outline" label="Total Days" value={`${booking.totalDays} days`} />
        ) : null}
        {booking.flightNumber ? (
          <Row icon="airplane-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Flight No." value={booking.flightNumber} mono />
        ) : null}
        {booking.terminalNumber ? (
          <Row icon="business-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Terminal" value={booking.terminalNumber} />
        ) : null}
        {booking.airportName ? (
          <Row icon="location-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Airport" value={booking.airportName} last />
        ) : null}
      </>
    );
  }

  if (source === 'luxury') {
    let brands = null, models = null;
    try { brands = booking.preferredBrands ? JSON.parse(booking.preferredBrands).join(', ') : null; } catch {}
    try { models = booking.preferredModels ? JSON.parse(booking.preferredModels).join(', ') : null; } catch {}
    return (
      <>
        <Row icon="repeat-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Trip Type" value={TRIP_LABELS[booking.serviceLabel] || booking.serviceLabel} />
        <Row icon="car-sport-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Car Category" value={booking.carCategoryName} />
        <Row icon="ribbon-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Event Type" value={booking.eventType} />
        <Row icon="gift-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Occasion" value={booking.occasion} />
        <Row icon="location-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Venue" value={booking.venueName} />
        <Row icon="calendar-outline" label="Total Days" value={booking.totalDays > 1 ? `${booking.totalDays} days` : null} />
        <Row icon="timer-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Total Hours" value={booking.totalHours > 0 ? `${booking.totalHours} hrs` : null} />
        <Row icon="star-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Preferred Brands" value={brands} />
        <Row icon="car-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Preferred Models" value={models} />
        {booking.needDecoration ? (
          <Row icon="sparkles-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Decoration" value={booking.decorationType ? `Yes — ${booking.decorationType}` : 'Required'} />
        ) : null}
        {booking.needChauffeur === false ? (
          <Row icon="person-remove-outline" iconBg="#FEF2F2" iconColor={C.danger} label="Chauffeur" value="Not required (self-drive)" />
        ) : null}
        <Row icon="shirt-outline" label="Chauffeur Attire" value={booking.chauffeurAttire} />
        <Row icon="business-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Vehicle Brand" value={booking.vehicleBrand} last />
      </>
    );
  }

  if (source === 'bus') return (
    <>
      <Row icon="bus-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Bus Type" value={booking.carCategoryName} />
      <Row icon="repeat-outline" iconBg="#FEF3C7" iconColor="#D97706" label="Trip Type" value={booking.serviceLabel} last />
    </>
  );

  if (source === 'truck') return (
    <>
      <Row icon="construct-outline" iconBg="#FFF7ED" iconColor="#EA580C" label="Vehicle Type" value={booking.carCategoryName} />
      <Row icon="cube-outline" iconBg="#FFF7ED" iconColor="#EA580C" label="Service" value={booking.serviceLabel} last />
    </>
  );

  if (source === 'packers') return (
    <>
      <Row icon="cube-outline" label="Service Type" value={booking.serviceLabel} />
      <Row icon="people-outline" label="Team" value={booking.carCategoryName} last />
    </>
  );

  if (source === 'equipment') return (
    <>
      <Row icon="hammer-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Equipment" value={booking.carCategoryName} />
      <Row icon="build-outline" iconBg="#F0F9FF" iconColor={C.blue} label="Type" value={booking.serviceLabel} />
      {booking.returnDate ? (
        <Row icon="calendar-outline" iconBg="#F0F9FF" iconColor={C.blue} label="End Date" value={moment(booking.returnDate).format('DD MMM YYYY')} last />
      ) : null}
    </>
  );

  if (source === 'b2b') return (
    <>
      <Row icon="briefcase-outline" iconBg="#F5F3FF" iconColor="#7C3AED" label="Service Type" value={booking.serviceType} />
      <Row icon="car-outline" iconBg="#F5F3FF" iconColor="#7C3AED" label="Vehicle" value={booking.carCategoryName} />
      <Row icon="document-text-outline" iconBg="#F5F3FF" iconColor="#7C3AED" label="Registration" value={booking.vehicleNumber} mono last />
    </>
  );

  if (source === 'direct') return (
    <>
      <Row icon="clipboard-outline" label="Service" value={booking.serviceLabel} />
      <Row icon="car-outline" label="Vehicle" value={[booking.vehicleModel, booking.vehicleNumber].filter(Boolean).join(' · ')} last />
    </>
  );

  return null;
}

// ── Accept Confirmation Modal ──────────────────────────────────────────────────
function AcceptModal({ booking, visible, onConfirm, onCancel, loading }) {
  if (!booking) return null;
  const svc = SVC_STYLE[booking.source] || SVC_STYLE.direct;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: svc.bg }]}>
              <Ionicons name="checkmark-circle" size={28} color={svc.color} />
            </View>
            <Text style={styles.modalTitle}>Confirm Acceptance</Text>
            <Text style={styles.modalSubtitle}>Please review before accepting this booking</Text>
          </View>

          <View style={styles.modalSummary}>
            {[
              { icon: 'receipt-outline',  label: 'Booking', value: booking.bookingNumber },
              { icon: 'location-outline', label: 'Route',   value: booking.dropCity ? `${booking.pickupCity} → ${booking.dropCity}` : booking.pickupCity },
              { icon: 'calendar-outline', label: 'Pickup',  value: `${moment(booking.pickupDate).format('DD MMM YYYY')}${booking.pickupTime ? `, ${booking.pickupTime}` : ''}` },
              { icon: 'car-outline',      label: 'Vehicle', value: booking.carCategoryName || '—' },
            ].map((r, i, arr) => (
              <View key={r.label} style={[styles.modalRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.modalRowIcon}>
                  <Ionicons name={r.icon} size={15} color={C.primary} />
                </View>
                <Text style={styles.modalRowLabel}>{r.label}</Text>
                <Text style={styles.modalRowValue} numberOfLines={1}>{r.value}</Text>
              </View>
            ))}

            {(booking.earnings ?? booking.driverBatta) > 0 && (
              <LinearGradient colors={['#064E3B', '#16A34A']} style={styles.modalEarnings} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View>
                  <Text style={styles.modalEarningsLabel}>Your Earning (Driver Batta)</Text>
                  <Text style={styles.modalEarningsAmt}>₹{(booking.earnings ?? booking.driverBatta).toLocaleString('en-IN')}</Text>
                </View>
                <Ionicons name="wallet" size={26} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            )}
          </View>

          <View style={styles.modalWarning}>
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text style={styles.modalWarningText}>
              Once accepted, you must assign your vehicle and complete this trip. Make sure you are available on{' '}
              <Text style={{ fontWeight: '800' }}>{moment(booking.pickupDate).format('DD MMM YYYY')}</Text>.
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, loading && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
                    <Text style={styles.modalConfirmText}>Yes, Accept Booking</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BookingDetailScreen({ route, navigation }) {
  const { booking, isAvailable, isDirect } = route.params;
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const sc  = getStatus(booking.status);
  const svc = SVC_STYLE[booking.source] || SVC_STYLE.direct;
  const isVendorDirect   = booking.source === 'direct';
  const personalEarnings = isVendorDirect ? null : (booking.earnings ?? booking.driverBatta);

  async function confirmAccept() {
    setLoading(true);
    try {
      const res = await acceptBooking(booking.id);
      if (res.data.success) {
        setShowModal(false);
        navigation.replace('AssignVehicle', { booking: res.data.booking });
      }
    } catch (err) {
      setShowModal(false);
      Alert.alert('Failed', err.response?.data?.error || 'Could not accept. It may have been taken by someone else.');
    } finally { setLoading(false); }
  }

  function callCustomer() {
    if (booking.customerPhone) Linking.openURL(`tel:${booking.customerPhone}`);
  }

  async function openChat() {
    try {
      setChatLoading(true);
      const res = await getOrCreateDriverChat(booking.id, booking.source === 'chauffeur' ? 'chauffeur' : booking.source);
      if (res.data?.conversation) {
        navigation.navigate('DriverChat', {
          conversationId: res.data.conversation.id,
          customerName: booking.customerName || 'Customer',
          bookingId: booking.id,
          bookingType: booking.source || 'chauffeur',
          bookingNumber: booking.bookingNumber,
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  }

  function openMaps() {
    const q = encodeURIComponent(booking.pickupAddress || booking.pickupCity || '');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Gradient Hero Header ── */}
      <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.heroBookingNum}>#{booking.bookingNumber}</Text>
            <Text style={styles.heroTitle}>Booking Details</Text>
          </View>
          <View style={styles.svcBadge}>
            <Text style={styles.svcBadgeText}>{booking.serviceType || svc.label}</Text>
          </View>
        </View>

        {/* Status + available badge */}
        <View style={styles.heroStatusRow}>
          <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
            <Text style={styles.statusText}>{sc.label}</Text>
          </View>
          {isAvailable && (
            <View style={styles.availBadge}>
              <Ionicons name="flash" size={11} color="#FDE68A" />
              <Text style={styles.availBadgeText}>Accept Now</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.heroRoute}>
          <View style={styles.heroRoutePoint}>
            <View style={styles.heroGreenDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroCity}>{booking.pickupCity || 'Pickup'}</Text>
              {booking.pickupAddress ? (
                <Text style={styles.heroAddr} numberOfLines={1}>{booking.pickupAddress}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={openMaps} style={styles.mapBtn}>
              <Ionicons name="navigate-outline" size={15} color="#fff" />
            </TouchableOpacity>
          </View>

          {booking.dropCity ? (
            <>
              <View style={styles.heroLine} />
              <View style={styles.heroRoutePoint}>
                <View style={styles.heroRedDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroCity}>{booking.dropCity}</Text>
                  {booking.dropAddress ? (
                    <Text style={styles.heroAddr} numberOfLines={1}>{booking.dropAddress}</Text>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Date / time strip */}
        <View style={styles.heroStrip}>
          {booking.pickupDate ? (
            <View style={styles.heroChip}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroChipText}>{moment(booking.pickupDate).format('DD MMM YYYY')}</Text>
            </View>
          ) : null}
          {booking.pickupTime ? (
            <View style={styles.heroChip}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroChipText}>{booking.pickupTime}</Text>
            </View>
          ) : null}
          {booking.returnDate ? (
            <View style={[styles.heroChip, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
              <Ionicons name="return-down-back-outline" size={12} color="#FDE68A" />
              <Text style={[styles.heroChipText, { color: '#FDE68A' }]}>
                Return {moment(booking.returnDate).format('DD MMM')}
                {booking.returnTime ? `, ${booking.returnTime}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Trip Details ── */}
        <Section title="Trip Details" icon="car-outline" iconBg="#EFF6FF" iconColor={C.blue}>
          <ServiceRows booking={booking} />
        </Section>

        {/* ── Customer ── */}
        <Section title="Customer" icon="person-outline" iconBg="#FDF4FF" iconColor={C.purple}>
          <Row icon="person-circle-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Name" value={booking.customerName} />
          <View style={[styles.row, !booking.customerEmail && styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: isAvailable ? '#F8FAFC' : '#F0FDF4' }]}>
              <Ionicons name="call-outline" size={14} color={isAvailable ? C.sub : C.primary} />
            </View>
            <Text style={styles.rowLabel}>Phone</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <Text style={[styles.rowValue, { flex: 1 }]} numberOfLines={1}>
                {isAvailable
                  ? `${booking.customerPhone?.slice(0, 4) || ''}xxxxxxx`
                  : (booking.customerPhone || '—')}
              </Text>
              {!isAvailable && booking.customerPhone ? (
                <TouchableOpacity onPress={callCustomer} style={styles.callBtn}>
                  <Ionicons name="call" size={13} color="#fff" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}
              {!isAvailable ? (
                <TouchableOpacity onPress={openChat} style={[styles.callBtn, { backgroundColor: '#0369A1' }]} disabled={chatLoading}>
                  {chatLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Ionicons name="chatbubble-ellipses" size={13} color="#fff" /><Text style={styles.callBtnText}>Chat</Text></>
                  }
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {!isAvailable && booking.customerEmail ? (
            <Row icon="mail-outline" iconBg="#FDF4FF" iconColor={C.purple} label="Email" value={booking.customerEmail} last />
          ) : null}
        </Section>

        {/* ── Special Instructions ── */}
        {booking.customerNotes ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="chatbox-ellipses-outline" size={13} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
            </View>
            <View style={styles.notesCard}>
              <Ionicons name="information-circle-outline" size={16} color="#D97706" style={{ marginTop: 1 }} />
              <Text style={styles.notesText}>{booking.customerNotes}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Your Earnings ── */}
        {personalEarnings > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="wallet-outline" size={13} color={C.primary} />
              </View>
              <Text style={styles.sectionTitle}>Your Earnings</Text>
            </View>
            <LinearGradient colors={['#064E3B', '#16A34A']} style={styles.earningsCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View>
                <Text style={styles.earningsLabel}>Driver Batta</Text>
                <Text style={styles.earningsAmt}>₹{personalEarnings.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.earningsIconBox}>
                <Ionicons name="wallet" size={26} color="rgba(255,255,255,0.5)" />
              </View>
            </LinearGradient>
          </View>
        ) : isVendorDirect ? (
          <View style={styles.section}>
            <View style={styles.vendorNote}>
              <Ionicons name="business-outline" size={15} color={C.blue} />
              <Text style={styles.vendorNoteText}>Earnings paid as vendor salary — contact your vendor for details</Text>
            </View>
          </View>
        ) : null}

        {/* ── Booking Payment ── */}
        {booking.grandTotal > 0 ? (
          <Section title="Booking Payment" icon="card-outline" iconBg="#EFF6FF" iconColor={C.blue}>
            <Row icon="cash-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Total Amount" value={`₹${booking.grandTotal.toLocaleString('en-IN')}`} />
            {booking.paidAmount > 0 ? (
              <Row icon="checkmark-circle-outline" iconBg="#F0FDF4" iconColor={C.success} label="Amount Paid" value={`₹${booking.paidAmount.toLocaleString('en-IN')}`} />
            ) : null}
            <View style={[styles.row, styles.rowLast, styles.balanceRow]}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="alert-circle-outline" size={14} color="#EA580C" />
              </View>
              <Text style={[styles.rowLabel, { color: '#92400E' }]}>Balance Due</Text>
              <Text style={styles.balanceAmt}>
                ₹{(booking.remainingPayment ?? Math.max(0, booking.grandTotal - (booking.paidAmount || 0))).toLocaleString('en-IN')}
              </Text>
            </View>
          </Section>
        ) : null}

        {/* ── Assigned Vehicle ── */}
        {(booking.vehicleNumber || booking.vehicleModel) ? (
          <Section title="Assigned Vehicle" icon="car-sport-outline" iconBg="#EFF6FF" iconColor={C.blue}>
            {booking.vehicleModel ? (
              <Row icon="car-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Model"
                value={[booking.vehicleBrand, booking.vehicleModel].filter(Boolean).join(' ')} />
            ) : null}
            {booking.vehicleColor ? (
              <Row icon="color-palette-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Color" value={booking.vehicleColor} />
            ) : null}
            {booking.vehicleNumber ? (
              <Row icon="document-text-outline" iconBg="#EFF6FF" iconColor={C.blue} label="Reg. No." value={booking.vehicleNumber} mono last />
            ) : null}
          </Section>
        ) : null}

        {/* ── Timeline ── */}
        {(booking.createdAt || booking.assignedAt || booking.tripStartedAt || booking.completedAt) ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="time-outline" size={13} color={C.purple} />
              </View>
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            <View style={styles.sectionBody}>
              {[
                booking.createdAt && { icon: 'add-circle',        color: C.sub,      bg: '#F1F5F9', label: 'Booking Created',  time: booking.createdAt },
                booking.assignedAt && { icon: 'checkmark-circle', color: C.primary,  bg: '#F0FDF4', label: 'Driver Assigned',  time: booking.assignedAt },
                booking.tripStartedAt && { icon: 'play-circle',   color: '#EA580C',  bg: '#FFF7ED', label: 'Trip Started',     time: booking.tripStartedAt },
                booking.completedAt && { icon: 'flag',            color: C.purple,   bg: '#F5F3FF', label: 'Completed',        time: booking.completedAt },
              ].filter(Boolean).map((item, i, arr) => (
                <View key={item.label} style={styles.tlRow}>
                  <View style={styles.tlLeft}>
                    <View style={[styles.tlDot, { backgroundColor: item.bg }]}>
                      <Ionicons name={`${item.icon}-outline`} size={14} color={item.color} />
                    </View>
                    {i < arr.length - 1 ? <View style={styles.tlLine} /> : null}
                  </View>
                  <View style={styles.tlContent}>
                    <Text style={styles.tlLabel}>{item.label}</Text>
                    <Text style={styles.tlTime}>{moment(item.time).format('DD MMM YYYY, h:mm A')}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Rating ── */}
        {booking.rating > 0 ? (
          <Section title="Customer Rating" icon="star-outline" iconBg="#FFFBEB" iconColor="#D97706">
            <View style={styles.ratingBox}>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map(s => (
                  <Ionicons key={s} name={s <= booking.rating ? 'star' : 'star-outline'} size={20} color="#F59E0B" />
                ))}
                <Text style={styles.ratingNum}>{booking.rating}/5</Text>
              </View>
              {booking.review ? (
                <Text style={styles.reviewText}>"{booking.review}"</Text>
              ) : null}
            </View>
          </Section>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer Action ── */}
      {isAvailable ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Accept This Booking</Text>
          </TouchableOpacity>
        </View>
      ) : booking.status === 'ACCEPTED' ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.blue }]}
            onPress={() => navigation.navigate('AssignVehicle', { booking })} activeOpacity={0.85}>
            <Ionicons name="car-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Assign Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : booking.source === 'equipment' && ['CONFIRMED','DELIVERED','IN_USE','PICKUP_SCHEDULED','RETURNED'].includes(booking.status) ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0369A1' }]}
            onPress={() => navigation.navigate('ActiveTrip', { booking })} activeOpacity={0.85}>
            <Ionicons name="hammer-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Manage Equipment Rental</Text>
          </TouchableOpacity>
        </View>
      ) : booking.source === 'packers' && ['TEAM_ASSIGNED','PACKING','LOADING','IN_TRANSIT','UNLOADING','UNPACKING'].includes(booking.status) ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0369A1' }]}
            onPress={() => navigation.navigate('ActiveTrip', { booking })} activeOpacity={0.85}>
            <Ionicons name="cube-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Manage Packers Job</Text>
          </TouchableOpacity>
        </View>
      ) : ['DRIVER_ASSIGNED','VEHICLE_ASSIGNED','vehicle_assigned'].includes(booking.status) ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EA580C' }]}
            onPress={() => navigation.navigate('ActiveTrip', { booking })} activeOpacity={0.85}>
            <Ionicons name="play-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>{booking.source === 'truck' ? 'Manage Truck Trip' : 'Start Trip (Enter OTP)'}</Text>
          </TouchableOpacity>
        </View>
      ) : booking.source === 'truck' && ['LOADING','IN_TRANSIT','UNLOADING'].includes(booking.status) ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EA580C' }]}
            onPress={() => navigation.navigate('ActiveTrip', { booking })} activeOpacity={0.85}>
            <Ionicons name="construct-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Manage Truck Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (isDirect || booking.source === 'b2b') && ['confirmed','assigned','vehicle_assigned','in_progress','STARTED'].includes(booking.status) ? (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={() => navigation.navigate('ActiveTrip', { booking })} activeOpacity={0.85}>
            <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Manage Trip</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <AcceptModal
        booking={isAvailable ? booking : null}
        visible={showModal}
        onConfirm={confirmAccept}
        onCancel={() => !loading && setShowModal(false)}
        loading={loading}
      />

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Hero header
  hero:        { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  heroNav:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroBookingNum: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5 },
  heroTitle:   { fontSize: 17, fontWeight: '800', color: '#fff' },
  svcBadge:    { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  svcBadgeText:{ fontSize: 11, color: '#fff', fontWeight: '700' },

  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 12, color: '#fff', fontWeight: '700' },
  availBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  availBadgeText: { fontSize: 11, color: '#FDE68A', fontWeight: '700' },

  // Route in hero
  heroRoute:      { marginBottom: 12 },
  heroRoutePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  heroGreenDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#86EFAC', marginTop: 4, flexShrink: 0 },
  heroRedDot:     { width: 10, height: 10, borderRadius: 2, backgroundColor: '#FCA5A5', marginTop: 4, flexShrink: 0 },
  heroLine:       { width: 1.5, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 4, marginVertical: 2 },
  heroCity:       { fontSize: 16, fontWeight: '800', color: '#fff' },
  heroAddr:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  mapBtn:         { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Date strip
  heroStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  heroChipText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Sections
  section:     { paddingHorizontal: 16, marginTop: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  sectionIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:{ fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionBody: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },

  // Row
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLast:  { borderBottomWidth: 0 },
  rowIcon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowLabel: { fontSize: 12, color: C.sub, fontWeight: '500', width: 110, flexShrink: 0 },
  rowValue: { flex: 1, fontSize: 13, color: C.text, fontWeight: '600', textAlign: 'right' },
  rowMono:  { fontFamily: 'monospace', letterSpacing: 1 },

  // Call button
  callBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  callBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  // Notes
  notesCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  notesText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 19 },

  // Earnings
  earningsCard:    { borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginBottom: 4 },
  earningsAmt:     { fontSize: 30, fontWeight: '900', color: '#fff' },
  earningsIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Vendor note
  vendorNote:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#BFDBFE' },
  vendorNoteText: { flex: 1, fontSize: 13, color: '#1D4ED8', fontWeight: '500' },

  // Payment balance row
  balanceRow: { backgroundColor: '#FFF7ED' },
  balanceAmt: { fontSize: 15, fontWeight: '900', color: '#EA580C' },

  // Timeline
  tlRow:     { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 12 },
  tlLeft:    { alignItems: 'center', marginRight: 12, width: 28 },
  tlDot:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tlLine:    { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4, marginBottom: 4, minHeight: 16 },
  tlContent: { flex: 1, paddingBottom: 14 },
  tlLabel:   { fontSize: 13, fontWeight: '700', color: C.text },
  tlTime:    { fontSize: 11, color: C.sub, marginTop: 2 },

  // Rating
  ratingBox:  { padding: 14 },
  starsRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  ratingNum:  { fontSize: 15, fontWeight: '800', color: '#D97706', marginLeft: 6 },
  reviewText: { fontSize: 13, color: C.sub, fontStyle: 'italic', lineHeight: 19 },

  // Footer
  footer:       { padding: 14, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, height: 52 },
  actionBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },

  // Accept Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 30 },
  modalHandle:     { width: 38, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 6 },
  modalHeader:     { alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18 },
  modalHeaderIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  modalTitle:      { fontSize: 19, fontWeight: '800', color: C.text, marginBottom: 3 },
  modalSubtitle:   { fontSize: 13, color: C.sub, textAlign: 'center' },
  modalSummary:    { marginHorizontal: 16, backgroundColor: C.bg, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  modalRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  modalRowIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  modalRowLabel:   { fontSize: 11, color: C.sub, fontWeight: '600', width: 68 },
  modalRowValue:   { flex: 1, fontSize: 13, color: C.text, fontWeight: '700', textAlign: 'right' },
  modalEarnings:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  modalEarningsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 3 },
  modalEarningsAmt:   { fontSize: 26, fontWeight: '900', color: '#fff' },
  modalWarning:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 14 },
  modalWarningText:{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  modalActions:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  modalCancelBtn:  { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: C.text },
  modalConfirmBtn: { flex: 2, height: 50, borderRadius: 14, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  modalConfirmText:{ fontSize: 14, fontWeight: '800', color: '#fff' },
});
