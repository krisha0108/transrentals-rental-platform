import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { logoutDriver, getBaseURL, getDriverAppVersion } from '../api/client';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', mid: '#065F46', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6', purple: '#8B5CF6',
};

function licenseStatus(expiry) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days <= 0)  return { label: 'Expired', color: C.danger, bg: '#FEF2F2' };
  if (days <= 30) return { label: `${days}d`,  color: C.danger, bg: '#FEF2F2' };
  if (days <= 90) return { label: `${days}d`,  color: C.warn,   bg: '#FFFBEB' };
  return { label: 'Valid', color: C.success, bg: '#F0FDF4' };
}

function MenuRow({ icon, iconBg, iconColor, label, sublabel, badge, onPress, isLast, danger }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#FEF2F2' : (iconBg || '#F0FDF4') }]}>
        <Ionicons name={icon} size={17} color={danger ? C.danger : (iconColor || C.primary)} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSub}>{sublabel}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.menuBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.menuBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionLabel}>{title}</Text> : null}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { driver, signOut } = useAuth();
  const [baseURL, setBaseURL] = useState('');
  const [appVersion, setAppVersion] = useState('1.0.0');
  useEffect(() => { getBaseURL().then(url => setBaseURL(url)); }, []);
  useEffect(() => {
    getDriverAppVersion()
      .then(res => { if (res.data?.latestVersion) setAppVersion(res.data.latestVersion); })
      .catch(() => {});
  }, []);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (driver?.status !== 'ACTIVE') return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [driver?.status]);

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          try { await logoutDriver(); } catch {}
          await signOut();
          navigation.replace('Login');
        },
      },
    ]);
  }

  const initials  = driver?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'DR';
  const isActive  = driver?.status === 'ACTIVE';
  const licStat   = licenseStatus(driver?.licenseExpiry);

  const checks = [
    driver?.phone, driver?.city, driver?.licenseNumber,
    driver?.aadharNumber, driver?.panNumber,
    driver?.bankName, driver?.accountNumber, driver?.ifscCode,
  ];
  const pct        = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const isComplete = pct >= 100;

  const photoUri = driver?.profilePhoto
    ? (driver.profilePhoto.startsWith('http')
        ? driver.profilePhoto
        : baseURL ? `${baseURL}${driver.profilePhoto}` : null)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <LinearGradient
          colors={[C.dark, C.mid, '#1D8348']}
          style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />

          {/* Top bar */}
          <View style={styles.heroBar}>
            <Text style={styles.heroBarTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={isActive ? ['#4ADE80', '#16A34A'] : ['#94A3B8', '#64748B']}
                style={styles.avatarInitials}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}

            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={11} color="#fff" />
            </View>

            {/* Status dot */}
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#4ADE80' : '#94A3B8' }]}>
              {isActive && (
                <Animated.View style={[styles.statusPulse, { transform: [{ scale: pulse }] }]} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{driver?.name || 'Driver'}</Text>

          <View style={styles.statusBadge}>
            <View style={[styles.statusBadgeDot, { backgroundColor: isActive ? '#4ADE80' : '#94A3B8' }]} />
            <Text style={[styles.statusBadgeText, { color: isActive ? '#BBF7D0' : '#CBD5E1' }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {/* Contact info */}
          <View style={styles.contactRow}>
            {driver?.email && (
              <View style={styles.contactChip}>
                <Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.65)" />
                <Text style={styles.contactText} numberOfLines={1}>{driver.email}</Text>
              </View>
            )}
            {driver?.phone && (
              <View style={styles.contactChip}>
                <Ionicons name="call-outline" size={11} color="rgba(255,255,255,0.65)" />
                <Text style={styles.contactText}>{driver.phone}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Profile Completeness ── */}
        {!isComplete && (
          <TouchableOpacity
            style={styles.completeBanner}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <View style={styles.completeLeft}>
              <Ionicons name="alert-circle" size={18} color={C.warn} />
              <View style={{ flex: 1 }}>
                <Text style={styles.completeTitle}>Profile incomplete — {pct}%</Text>
                <Text style={styles.completeSub}>Add remaining details to receive bookings</Text>
                <View style={styles.completeTrack}>
                  <View style={[styles.completeFill, { width: `${pct}%` }]} />
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.warn} />
          </TouchableOpacity>
        )}

        {/* ── Personal Info ── */}
        {(driver?.city || driver?.dateOfBirth || driver?.licenseNumber) && (
          <Section title="Personal Info">
            {driver?.city && (
              <MenuRow
                icon="location-outline" iconBg="#EFF6FF" iconColor={C.blue}
                label={[driver.city, driver.state].filter(Boolean).join(', ')}
                sublabel="City · State"
              />
            )}
            {driver?.dateOfBirth && (
              <MenuRow
                icon="calendar-outline" iconBg="#F5F3FF" iconColor={C.purple}
                label={moment(driver.dateOfBirth).format('DD MMMM YYYY')}
                sublabel="Date of Birth"
              />
            )}
            {driver?.licenseNumber && (
              <MenuRow
                icon="card-outline" iconBg="#F0FDF4" iconColor={C.primary}
                label={driver.licenseNumber}
                sublabel={driver.licenseExpiry ? `Expires ${moment(driver.licenseExpiry).format('DD MMM YYYY')}` : 'Driving License'}
                badge={licStat}
                isLast
              />
            )}
          </Section>
        )}

        {/* ── Quick Access ── */}
        <Section title="Quick Access">
          <MenuRow icon="car-sport-outline" iconBg="#F0FDF4" iconColor={C.primary}
            label="My Fleet" sublabel="Manage your vehicles"
            onPress={() => navigation.navigate('Fleet')} />
          <MenuRow icon="time-outline" iconBg="#FFFBEB" iconColor={C.warn}
            label="Trip History" sublabel="View completed trips"
            onPress={() => navigation.navigate('TripHistory')} />
          <MenuRow icon="notifications-outline" iconBg="#EFF6FF" iconColor={C.blue}
            label="Notifications" sublabel="Booking alerts & updates"
            onPress={() => navigation.navigate('Notifications')} isLast />
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <MenuRow icon="person-outline" iconBg="#F0FDF4" iconColor={C.primary}
            label="Edit Profile" sublabel="Update personal & document info"
            onPress={() => navigation.navigate('EditProfile')} />
          <MenuRow icon="card-outline" iconBg="#F5F3FF" iconColor={C.purple}
            label="Bank Details"
            sublabel={driver?.bankName || 'Add bank account for payments'}
            onPress={() => navigation.navigate('EditProfile')} isLast />
        </Section>

        {/* ── Support ── */}
        <Section title="Support">
          <MenuRow icon="headset-outline" iconBg="#EFF6FF" iconColor={C.blue}
            label="Help & Support" sublabel="FAQs, contact & assistance"
            onPress={() => navigation.navigate('Support')} />
          <MenuRow icon="information-circle-outline" iconBg="#F0FDF4" iconColor={C.primary}
            label="About TransRentals" sublabel="Our mission, services & app info"
            onPress={() => navigation.navigate('About')} isLast />
        </Section>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={C.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionRow}>
          <View style={styles.versionDot} />
          <Text style={styles.versionText}>TransRentals Driver · v{appVersion}</Text>
          <View style={styles.versionDot} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 90;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero:    { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, alignItems: 'center', overflow: 'hidden' },
  bubble1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -50 },
  bubble2: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: -30 },

  heroBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  heroBarTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText:  { fontSize: 12, color: '#fff', fontWeight: '700' },

  avatarWrap:     { marginBottom: 14, position: 'relative' },
  avatarImg:      { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarInitials: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:     { fontSize: 32, fontWeight: '900', color: '#fff' },
  cameraBadge:    { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  statusDot:      { position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  statusPulse:    { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(74,222,128,0.35)' },

  heroName:     { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  statusBadgeDot:{ width: 6, height: 6, borderRadius: 3 },
  statusBadgeText:{ fontSize: 12, fontWeight: '700' },

  contactRow:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5 },
  contactText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500', maxWidth: 160 },

  // Complete banner
  completeBanner: { marginHorizontal: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  completeLeft:   { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  completeTitle:  { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 2 },
  completeSub:    { fontSize: 11, color: '#B45309', marginBottom: 8 },
  completeTrack:  { height: 4, backgroundColor: '#FDE68A', borderRadius: 2, overflow: 'hidden' },
  completeFill:   { height: '100%', backgroundColor: C.warn, borderRadius: 2 },

  // Section
  section:     { paddingHorizontal: 14, marginTop: 14 },
  sectionLabel:{ fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionCard: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },

  // Menu row
  menuRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon:   { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  menuLabel:  { fontSize: 14, fontWeight: '700', color: C.text },
  menuSub:    { fontSize: 11, color: C.sub, marginTop: 1 },
  menuBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  menuBadgeText: { fontSize: 10, fontWeight: '800' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA' },
  logoutText:{ fontSize: 14, fontWeight: '700', color: C.danger },

  // Version
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  versionDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.border },
  versionText:{ fontSize: 11, color: C.sub, fontWeight: '500' },
});
