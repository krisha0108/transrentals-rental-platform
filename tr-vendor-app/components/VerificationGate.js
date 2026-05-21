// Reusable verification gate for the vendor app.
//
// A pending / under-review vendor can still browse every screen (Fleet,
// Staff, P2P etc.) — but the write actions on those screens are locked
// behind a verification prompt. This file exports three pieces a screen
// composes together:
//
//   useVendorStatus()        → { status, isApproved, loading, refresh }
//                              shared in-memory cache, one /vendor/profile
//                              fetch is reused across screens.
//
//   useVerificationGate(nav) → { isApproved, gate, LockGateModal }
//                              `gate(fn, label)` returns a click handler
//                              that runs `fn` when approved, else opens
//                              the lock modal with the action label.
//                              Render `{LockGateModal}` once in the screen.
//
//   <VerificationBanner status={s} navigation={nav} />
//                              amber strip at the top of restricted screens.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getVendorProfile } from '../screens/api/client';

// ── status cache + subscriber set (so every mounted screen stays in sync
// when one of them triggers refresh) ─────────────────────────────────
let cached = null; // { status, fetchedAt }
const listeners = new Set();
const TTL_MS = 60_000;

async function fetchStatus(force = false) {
  if (!force && cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.status;
  }
  try {
    const res = await getVendorProfile();
    const status = res?.data?.status || res?.status || res?.vendor?.status || null;
    cached = { status, fetchedAt: Date.now() };
    listeners.forEach((fn) => fn(status));
    return status;
  } catch {
    return cached?.status || null;
  }
}

export function useVendorStatus() {
  const [status, setStatus] = useState(cached?.status || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const listener = (s) => setStatus(s);
    listeners.add(listener);
    if (!cached) {
      fetchStatus().then((s) => { setStatus(s); setLoading(false); });
    }
    return () => { listeners.delete(listener); };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const s = await fetchStatus(true);
    setStatus(s);
    setLoading(false);
  }, []);

  return { status, isApproved: status === 'APPROVED', loading, refresh };
}

export function useVerificationGate(navigation) {
  const { status, isApproved } = useVendorStatus();
  const [modal, setModal] = useState({ visible: false, label: '' });

  // gate(handler, "add vehicles") → returns a click handler that either
  // runs `handler` (approved) or opens the lock modal with the given label.
  const gate = useCallback((handler, label = 'use this feature') => {
    return (...args) => {
      if (isApproved) return handler?.(...args);
      setModal({ visible: true, label });
    };
  }, [isApproved]);

  const LockGateModal = useMemo(() => (
    <LockOverlay
      visible={modal.visible}
      onClose={() => setModal({ visible: false, label: '' })}
      navigation={navigation}
      actionLabel={modal.label}
      status={status}
    />
  ), [modal, navigation, status]);

  return { status, isApproved, gate, LockGateModal };
}

// Amber strip — pin at top of restricted screens (above scroll content
// but below the screen's own hero / status bar).
export function VerificationBanner({ navigation, status }) {
  if (!status || status === 'APPROVED') return null;
  const isReview = status === 'UNDER_REVIEW';
  return (
    <View style={vb.bar}>
      <Ionicons
        name={isReview ? 'time-outline' : 'lock-closed-outline'}
        size={15}
        color="#92400E"
      />
      <Text style={vb.txt} numberOfLines={2}>
        {isReview
          ? 'Account under review — you can browse but actions are disabled.'
          : 'Verify your account to unlock actions on this screen.'}
      </Text>
      <TouchableOpacity
        onPress={() => navigation?.navigate('VendorDashboard')}
        style={vb.btn}
        activeOpacity={0.8}
      >
        <Text style={vb.btnTxt}>{isReview ? 'Status' : 'Verify'}</Text>
        <Ionicons name="arrow-forward" size={12} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// Centered popup shown when a locked action is tapped.
function LockOverlay({ visible, onClose, navigation, actionLabel, status }) {
  const isReview = status === 'UNDER_REVIEW';
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={ov.backdrop}>
        <View style={ov.card}>
          <View style={ov.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color="#2563EB" />
          </View>
          <Text style={ov.title}>
            {isReview ? 'Account Under Review' : 'Verification Required'}
          </Text>
          <Text style={ov.body}>
            {isReview
              ? `You'll be able to ${actionLabel} once our team approves your account (usually 1–2 business days).`
              : `Complete your verification to ${actionLabel}. Our team approves new vendors within 1–2 business days.`}
          </Text>
          <TouchableOpacity
            onPress={() => { onClose(); navigation?.navigate('VendorDashboard'); }}
            style={ov.cta}
            activeOpacity={0.85}
          >
            <Text style={ov.ctaTxt}>
              {isReview ? 'Check Status' : 'Complete Verification'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={ov.dismiss}>
            <Text style={ov.dismissTxt}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const vb = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  txt: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 16, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#92400E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  btnTxt: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});

const ov = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 20,
    padding: 24, alignItems: 'center',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 13, color: '#475569', lineHeight: 19, textAlign: 'center', marginBottom: 20 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', paddingVertical: 13, paddingHorizontal: 20, borderRadius: 12,
    width: '100%',
  },
  ctaTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  dismiss: { paddingVertical: 10, paddingHorizontal: 14, marginTop: 6 },
  dismissTxt: { color: '#64748B', fontSize: 13, fontWeight: '600' },
});
