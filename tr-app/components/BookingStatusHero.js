import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { TEAL, TEAL_MID, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SHADOW_SM } from '../theme';

// Top-of-page summary for every booking detail screen: what state the booking
// is in, what the customer has paid, and what happens next.

const STEPS = ['Booked', 'Confirmed', 'Assigned', 'On Trip', 'Done'];

// Status keys differ per service; map each onto the shared five steps.
const STEP_OF_STATUS = {
  PENDING_PAYMENT: 0,
  PAYMENT_SUBMITTED: 0,
  BROADCASTED: 1,
  ACCEPTED: 1,
  ADVANCE_PAID: 1,
  PAID: 1,
  PAYMENT_VERIFIED: 1,
  PENDING_VENDOR: 1,
  CONFIRMED: 1,
  VEHICLE_ASSIGNED: 2,
  DRIVER_ASSIGNED: 2,
  TEAM_ASSIGNED: 2,
  READY_FOR_PICKUP: 2,
  IN_PROGRESS: 3,
  PACKING: 3,
  LOADING: 3,
  IN_TRANSIT: 3,
  UNLOADING: 3,
  UNPACKING: 3,
  COMPLETED: 4,
};

const CLOSED_STATUSES = ['CANCELLED', 'DROPPED', 'EXPIRED', 'REFUNDED', 'REJECTED'];
const PAID_UP_STATUSES = ['COMPLETED'];

const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const nextStepText = (step, balance) => {
  switch (step) {
    case 0:
      return 'Complete the advance payment to confirm your booking.';
    case 1:
      return 'Booking confirmed. The vendor will share the assignment details soon.';
    case 2:
      return balance > 0
        ? `Assigned and ready. Keep ${rupees(balance)} ready for the balance payment.`
        : 'Assigned and ready. You are all set.';
    case 3:
      return 'Your booking is in progress.';
    case 4:
      return 'Completed. Thank you for booking with TransRentals.';
    default:
      return '';
  }
};

/**
 * @param {object} props
 * @param {{label: string, color: string, icon: string}} props.statusConfig
 * @param {string} props.status - raw status key, e.g. ADVANCE_PAID
 * @param {number} [props.totalAmount]
 * @param {number} [props.advanceAmount]
 * @param {boolean} [props.advancePaid]
 * @param {string} [props.paymentStatus]
 * @param {number} [props.paidAmount] - amount actually received, when the API reports it
 * @param {string} [props.message] - overrides the "what happens next" line
 * @param {string} [props.meta] - small line such as "#BK123 · Booked on 12 Sep"
 * @param {object} [props.style] - extra container style, e.g. to match a screen's margins
 */
const BookingStatusHero = ({
  statusConfig,
  status,
  totalAmount,
  advanceAmount,
  advancePaid,
  paymentStatus,
  paidAmount,
  message,
  meta,
  style,
}) => {
  const color = statusConfig?.color || TEAL;
  const statusKey = String(status || '').toUpperCase();
  const closed = CLOSED_STATUSES.includes(statusKey);
  const step = STEP_OF_STATUS[statusKey];

  const total = Number(totalAmount) || 0;
  const advance = Number(advanceAmount) || 0;
  // The backend writes paymentStatus 'PAID' once the ADVANCE is paid, so it
  // cannot mean "fully paid"; only a completed booking counts as settled.
  const fullyPaid = PAID_UP_STATUSES.includes(statusKey);
  const advanceDone = advancePaid || (step !== undefined && step >= 1);
  const reportedPaid = Number(paidAmount) || 0;
  const paid = fullyPaid
    ? total
    : reportedPaid > 0
      ? Math.min(reportedPaid, total)
      : advanceDone
        ? Math.min(advance, total)
        : 0;
  // Always Total - Paid, so the three figures add up. The API's balanceAmount
  // is Total - Advance even before the advance is paid.
  const balance = Math.max(total - paid, 0);
  const paidRatio = total > 0 ? Math.min(paid / total, 1) : 0;

  const subtitle =
    message ||
    (closed
      ? 'This booking is no longer active.'
      : step !== undefined
        ? nextStepText(step, balance)
        : '');

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.headRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
          <Ionicons name={statusConfig?.icon || 'information-circle-outline'} size={wp('6%')} color={color} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.caption}>BOOKING STATUS</Text>
          <Text style={[styles.statusLabel, { color }]} numberOfLines={1}>
            {statusConfig?.label || statusKey}
          </Text>
        </View>
      </View>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!meta && <Text style={styles.meta}>{meta}</Text>}

      {!closed && step !== undefined && (
        <View style={styles.stepper}>
          {STEPS.map((label, i) => {
            const done = i < step || (i === step && step === STEPS.length - 1);
            const current = i === step && !done;
            return (
              <View key={label} style={styles.stepItem}>
                <View style={styles.stepTrack}>
                  <View style={[styles.stepLine, i === 0 && styles.hidden, i <= step && { backgroundColor: color }]} />
                  <View
                    style={[
                      styles.stepDot,
                      (done || current) && { borderColor: color },
                      done && { backgroundColor: color },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={wp('2.6%')} color="#fff" />
                    ) : current ? (
                      <View style={[styles.stepDotInner, { backgroundColor: color }]} />
                    ) : null}
                  </View>
                  <View
                    style={[styles.stepLine, i === STEPS.length - 1 && styles.hidden, i < step && { backgroundColor: color }]}
                  />
                </View>
                <Text
                  style={[styles.stepLabel, (done || current) && { color: TEXT_PRIMARY, fontWeight: '700' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {total > 0 && (
        <View style={styles.payBox}>
          <View style={styles.payRow}>
            <View style={styles.payCol}>
              <Text style={styles.payCaption}>Total</Text>
              <Text style={styles.payValue}>{rupees(total)}</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payCol}>
              <Text style={styles.payCaption}>Paid</Text>
              <Text style={[styles.payValue, { color: TEAL_MID }]}>{rupees(paid)}</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payCol}>
              <Text style={styles.payCaption}>Balance</Text>
              <Text style={[styles.payValue, balance > 0 && !closed && { color: '#B45309' }]}>{rupees(balance)}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidRatio * 100}%` }]} />
          </View>
          {balance > 0 && !closed && paid > 0 && (
            <Text style={styles.payNote}>Balance is payable at the time of the trip.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD,
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    padding: wp('4%'),
    paddingTop: wp('4.5%'),
    overflow: 'hidden',
    ...SHADOW_SM,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  headText: {
    flex: 1,
  },
  caption: {
    fontSize: wp('2.6%'),
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 1,
  },
  statusLabel: {
    fontSize: wp('4.8%'),
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    fontSize: wp('3.3%'),
    color: TEXT_SECONDARY,
    lineHeight: wp('4.8%'),
    marginTop: hp('1.2%'),
  },
  meta: {
    fontSize: wp('2.9%'),
    color: TEXT_MUTED,
    marginTop: hp('0.6%'),
  },
  stepper: {
    flexDirection: 'row',
    marginTop: hp('2%'),
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  hidden: {
    opacity: 0,
  },
  stepDot: {
    width: wp('4.6%'),
    height: wp('4.6%'),
    borderRadius: wp('2.3%'),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotInner: {
    width: wp('1.8%'),
    height: wp('1.8%'),
    borderRadius: wp('0.9%'),
  },
  stepLabel: {
    fontSize: wp('2.5%'),
    color: TEXT_MUTED,
    marginTop: hp('0.6%'),
  },
  payBox: {
    marginTop: hp('2%'),
    backgroundColor: '#F8FAFC',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: wp('3.5%'),
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payCol: {
    flex: 1,
    alignItems: 'center',
  },
  payDivider: {
    width: 1,
    height: hp('3.5%'),
    backgroundColor: '#E5E7EB',
  },
  payCaption: {
    fontSize: wp('2.8%'),
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  payValue: {
    fontSize: wp('4%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginTop: hp('1.5%'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: TEAL,
  },
  payNote: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.8%'),
    textAlign: 'center',
  },
});

export default BookingStatusHero;
