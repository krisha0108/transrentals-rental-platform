import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import api from '../screens/api';

// Refund status on a cancelled booking — the app version of the website's
// RefundStatusCard, fed by the same /customer/refund-status endpoint so both
// say the same thing. When money is moving it draws the three steps and marks
// the current one; a cancellation that owes nothing just gets the reason.
// Renders nothing when there is no refund to talk about.

const TONES = {
  waiting: { border: '#FDE68A', bar: '#FFFBEB', chip: '#F59E0B', head: '#78350F', body: '#92400E', icon: 'time-outline' },
  moving: { border: '#BFDBFE', bar: '#EFF6FF', chip: '#2563EB', head: '#1E3A8A', body: '#1E40AF', icon: 'sync-outline' },
  done: { border: '#A7F3D0', bar: '#ECFDF5', chip: '#059669', head: '#064E3B', body: '#065F46', icon: 'checkmark' },
  none: { border: '#E5E7EB', bar: '#F9FAFB', chip: '#374151', head: '#111827', body: '#4B5563', icon: 'shield-checkmark-outline' },
};

const STEPS = ['Cancelled', 'Being arranged', 'Sent to your bank'];
const REACHED = { arranged: 1, retry: 1, sending: 2, sent: 3 };

/**
 * @param {string} source - booking table, e.g. 'bike_bookings'
 * @param {string} bookingId
 * @param {any} [refreshKey] - change it to fetch the status again
 */
export default function RefundStatusCard({ source, bookingId, refreshKey, style }) {
  const [refund, setRefund] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!source || !bookingId) return undefined;
    api.get('/customer/refund-status', { params: { source, bookingId } })
      .then((res) => { if (alive) setRefund(res.data?.refund || null); })
      .catch(() => {}); // a refund panel that can't load isn't worth an error
    return () => { alive = false; };
  }, [source, bookingId, refreshKey]);

  if (!refund) return null;

  const t = TONES[refund.tone] || TONES.waiting;
  const showRail = refund.stage !== 'none';
  const reached = REACHED[refund.stage] || 0;

  return (
    <View style={[styles.card, { borderColor: t.border }, style]}>
      <View style={[styles.header, { backgroundColor: t.bar }]}>
        <View style={[styles.chip, { backgroundColor: t.chip }]}>
          <Ionicons name={t.icon} size={18} color="#fff" />
        </View>
        <Text style={[styles.title, { color: t.head }]}>{refund.label}</Text>
        {refund.stage === 'retry' && (
          <View style={styles.retry}>
            <Ionicons name="alert-circle" size={11} color="#B45309" />
            <Text style={styles.retryText}>RETRYING</Text>
          </View>
        )}
      </View>

      <View style={styles.bodyWrap}>
        {showRail && (
          <View style={styles.rail}>
            {STEPS.map((step, i) => {
              const n = i + 1;
              const done = n < reached || refund.stage === 'sent';
              const here = n === reached && refund.stage !== 'sent';
              const live = done || here;
              return (
                <View key={step} style={styles.step}>
                  <View style={styles.stepRow}>
                    <View style={[styles.line, { backgroundColor: i === 0 ? 'transparent' : n <= reached ? t.chip : '#E5E7EB' }]} />
                    <View style={[
                      styles.dot,
                      { backgroundColor: live ? t.chip : '#E5E7EB' },
                      here && { borderWidth: 3, borderColor: t.border },
                    ]}>
                      {done
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <Text style={[styles.dotText, { color: live ? '#fff' : '#6B7280' }]}>{n}</Text>}
                    </View>
                    <View style={[styles.line, { backgroundColor: i === STEPS.length - 1 ? 'transparent' : n < reached ? t.chip : '#E5E7EB' }]} />
                  </View>
                  <Text style={[styles.stepLabel, { color: live ? t.head : '#9CA3AF' }]}>{step}</Text>
                </View>
              );
            })}
          </View>
        )}
        <Text style={[styles.detail, { color: t.body }]}>{refund.detail}</Text>
      </View>

      {refund.aside ? (
        <View style={[styles.aside, { backgroundColor: t.bar, borderTopColor: t.border }]}>
          <Ionicons name="headset-outline" size={14} color={t.body} style={{ marginTop: 1 }} />
          <Text style={[styles.asideText, { color: t.body }]}>{refund.aside}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginHorizontal: wp('4%'), marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  chip: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FDE68A' },
  retryText: { fontSize: 9.5, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },
  bodyWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  rail: { flexDirection: 'row', marginBottom: 14 },
  step: { flex: 1, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 3, borderRadius: 2 },
  dot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  dotText: { fontSize: 11, fontWeight: '900' },
  stepLabel: { fontSize: 10.5, fontWeight: '700', textAlign: 'center', marginTop: 6, paddingHorizontal: 2 },
  detail: { fontSize: 13.5, lineHeight: 20 },
  aside: { flexDirection: 'row', gap: 8, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  asideText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
});
