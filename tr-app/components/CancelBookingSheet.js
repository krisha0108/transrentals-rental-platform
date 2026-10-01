import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './SafeModal';

const REASONS = ['Change of plans', 'Booked by mistake', 'Found a better option', 'Dates changed', 'Other'];
const rupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Bottom sheet for cancelling a booking: confirm (with a reason), then a
 * success or error state in place of the old system alerts.
 *
 * @param {boolean} visible
 * @param {() => void} onClose - also called after "Done"
 * @param {(reason: string) => Promise<{refundAmount?: number|null}>} onConfirm -
 *   performs the cancellation; throw an Error with a readable message on failure
 * @param {{title: string, number?: string, when?: string, paid?: number}} booking
 */
export default function CancelBookingSheet({ visible, onClose, onConfirm, booking }) {
  const [step, setStep] = useState('confirm'); // confirm | working | done | error
  const [reason, setReason] = useState(REASONS[0]);
  const [refund, setRefund] = useState(null);
  const [error, setError] = useState('');
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('confirm');
      setReason(REASONS[0]);
      setRefund(null);
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (step === 'done') {
      pop.setValue(0);
      Animated.timing(pop, { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }).start();
    }
  }, [step, pop]);

  const confirm = async () => {
    setStep('working');
    try {
      const result = await onConfirm(reason);
      setRefund(result?.refundAmount ?? null);
      setStep('done');
    } catch (e) {
      setError(e?.message || 'Could not cancel the booking. Please try again.');
      setStep('error');
    }
  };

  const busy = step === 'working';
  const close = () => { if (!busy) onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={step === 'confirm' ? close : undefined}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          {(step === 'confirm' || step === 'working') && (
            <>
              <View style={[styles.iconRing, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.iconDot, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="close" size={26} color="#fff" />
                </View>
              </View>
              <Text style={styles.title}>Cancel this booking?</Text>
              <Text style={styles.sub}>Your vendor will be told right away. This can't be undone.</Text>

              <View style={styles.summary}>
                <Ionicons name="receipt-outline" size={18} color="#475569" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle} numberOfLines={1}>{booking?.title || 'Booking'}</Text>
                  <Text style={styles.summaryMeta} numberOfLines={1}>
                    {[booking?.number ? `#${booking.number}` : null, booking?.when].filter(Boolean).join('  ·  ')}
                  </Text>
                </View>
                {booking?.paid > 0 ? <Text style={styles.summaryPaid}>{rupees(booking.paid)} paid</Text> : null}
              </View>

              <View style={styles.policy}>
                <Ionicons name="information-circle" size={16} color="#1D4ED8" style={{ marginTop: 1 }} />
                <Text style={styles.policyText}>
                  Refunds follow the cancellation policy: the earlier you cancel before pickup, the more comes back.
                  Any refund goes to the account you paid from.
                </Text>
              </View>

              <Text style={styles.label}>Why are you cancelling?</Text>
              <View style={styles.reasons}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    disabled={busy}
                    onPress={() => setReason(r)}
                    style={[styles.reason, reason === r && styles.reasonActive]}
                  >
                    <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.keepBtn} onPress={close} disabled={busy}>
                  <Text style={styles.keepText}>Keep booking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, busy && { opacity: 0.7 }]} onPress={confirm} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.cancelText}>Yes, cancel</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'done' && (
            <>
              <Animated.View style={[styles.iconRing, { backgroundColor: '#ECFDF5', transform: [{ scale: pop }] }]}>
                <View style={[styles.iconDot, { backgroundColor: '#059669' }]}>
                  <Ionicons name="checkmark" size={28} color="#fff" />
                </View>
              </Animated.View>
              <Text style={styles.title}>Booking cancelled</Text>
              <Text style={styles.sub}>
                {booking?.number ? `#${booking.number} ` : ''}has been cancelled and your vendor has been told.
              </Text>

              <View style={[styles.refundBox, refund > 0 ? styles.refundYes : styles.refundNo]}>
                <Ionicons name={refund > 0 ? 'wallet' : 'shield-checkmark-outline'} size={20} color={refund > 0 ? '#047857' : '#475569'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refundTitle, { color: refund > 0 ? '#065F46' : '#1F2937' }]}>
                    {refund > 0 ? `${rupees(refund)} refund on its way` : 'Refund details'}
                  </Text>
                  <Text style={styles.refundText}>
                    {refund > 0
                      ? 'It goes back to the account you paid from — usually 5 to 7 working days. Track it on this booking or in Payments.'
                      : 'If anything is owed back you will see it on this booking and in Payments.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'error' && (
            <>
              <View style={[styles.iconRing, { backgroundColor: '#FFFBEB' }]}>
                <View style={[styles.iconDot, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="alert" size={26} color="#fff" />
                </View>
              </View>
              <Text style={styles.title}>Couldn't cancel</Text>
              <Text style={styles.sub}>{error}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.keepBtn} onPress={onClose}>
                  <Text style={styles.keepText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={confirm}>
                  <Text style={styles.cancelText}>Try again</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, alignItems: 'stretch' },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 18 },
  iconRing: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  iconDot: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  sub: { fontSize: 13.5, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginTop: 18, borderWidth: 1, borderColor: '#EEF2F7' },
  summaryTitle: { fontSize: 14.5, fontWeight: '700', color: '#0F172A' },
  summaryMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryPaid: { fontSize: 13, fontWeight: '800', color: '#047857' },
  policy: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 10 },
  policyText: { flex: 1, fontSize: 12.5, color: '#1E3A8A', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 8 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  reasonActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  reasonText: { fontSize: 12.5, fontWeight: '600', color: '#475569' },
  reasonTextActive: { color: '#B91C1C' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  keepBtn: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  keepText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  refundBox: { flexDirection: 'row', gap: 12, borderRadius: 14, padding: 14, marginTop: 18, borderWidth: 1 },
  refundYes: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  refundNo: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  refundTitle: { fontSize: 14.5, fontWeight: '800' },
  refundText: { fontSize: 12.5, color: '#475569', marginTop: 3, lineHeight: 18 },
  doneBtn: { height: 52, borderRadius: 14, backgroundColor: '#09B368', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  doneText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
