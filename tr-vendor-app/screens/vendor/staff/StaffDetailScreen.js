import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, deleteStaff, debugAuthState } from '../../api/client';
import { showConfirm, showError } from '../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex, mirroring the mapping
// convention already used in StaffListScreen.js (sibling file, same folder).
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  indigo: T.indigo, indigoL: T.indigoLight,
  purple: T.purple, purpleL: T.purpleLight,
  teal: T.teal, tealL: T.tintOcean,
  goldLight: T.goldLight, roseLight: T.roseLight,
};

// Mirrors StaffListScreen's ROLE_COLORS exactly so a staff member's role
// reads the same colour whether you're looking at the list card or here.
const ROLE_COLORS = {
  driver:     { bg: C.blueL,   text: C.blue,   dot: C.blue },
  manager:    { bg: C.purpleL, text: C.purple, dot: C.purple },
  helper:     { bg: C.amberL,  text: C.amber,  dot: C.amber },
  accountant: { bg: C.tealL,   text: C.teal,   dot: C.teal },
  mechanic:   { bg: C.redL,    text: C.red,    dot: C.red },
  supervisor: { bg: C.indigoL, text: C.indigo, dot: C.indigo },
  default:    { bg: C.bg,      text: C.muted,  dot: C.muted },
};

const getStatusDot = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':   return C.g400;
    case 'on_leave': return C.goldLight;
    case 'inactive': return C.roseLight;
    default:         return C.muted;
  }
};

function Section({ icon, iconLib = 'feather', color, bg, title, children }) {
  const I = iconLib === 'mci' ? MaterialCommunityIcons : Icon;
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: bg }]}>
          <I name={icon} size={15} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function IRow({ icon, iColor, iBg, label, value, last }) {
  return (
    <View style={[styles.iRow, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.iIcon, { backgroundColor: iBg }]}>
        <Icon name={icon} size={13} color={iColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.iLbl}>{label}</Text>
        <Text style={styles.iVal}>{value || '--'}</Text>
      </View>
    </View>
  );
}

function KVRow({ label, value, last, green }) {
  return (
    <View style={[styles.kv, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.kvLbl}>{label}</Text>
      <Text style={[styles.kvVal, green && { color: C.g600 }]}>{value || '--'}</Text>
    </View>
  );
}

export default function StaffDetailScreen({ route, navigation }) {
  const { staffId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [staff, setStaff]     = useState(null);

  const fetchStaff = useCallback(async () => {
    if (!staffId) return;
    let retries = 0;
    while (retries <= 2) {
      try {
        if (retries === 0) await debugAuthState();
        const res = await apiGet(`/vendor/staff/${staffId}`);
        setStaff(res.data?.staff || res.data);
        setLoading(false);
        return;
      } catch (err) {
        if (err?.response?.status === 401 && retries < 2) {
          retries++;
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        showError(err?.response?.status === 401
          ? 'No permission to view this staff member.'
          : 'Failed to load staff details.');
        setLoading(false);
        return;
      }
    }
  }, [staffId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = () =>
    showConfirm('Delete Staff', 'Are you sure you want to delete this staff member?',
      async () => {
        try { await deleteStaff(staffId); navigation.goBack(); }
        catch { showError('Failed to delete staff'); }
      },
      { confirmText: 'Delete', destructive: true }
    );

  const handleCall = () => {
    if (staff?.phone)
      import('react-native').then(({ Linking }) => Linking.openURL(`tel:${staff.phone}`));
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '--';

  if (loading) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.heroLoading}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 32 }} />
            </View>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="account" size={12} color={C.g400} />
              <Text style={styles.heroBadgeTxt}>Staff Profile</Text>
            </View>

            <Bone w={72} h={72} r={36} style={{ alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 10 }} />
            <Bone w={140} h={18} r={5} style={{ alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.24)', marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Bone w={80} h={22} r={11} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <Bone w={70} h={22} r={11} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>

            <View style={{ height: rs(30) }} />
          </SafeAreaView>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Summary card skeleton */}
          <View style={styles.summaryWrap}>
            <View style={styles.summaryCard}>
              <View style={styles.actionsRow}>
                <Bone h={44} r={rs(12)} style={{ flex: 1 }} />
                <Bone h={44} r={rs(12)} style={{ flex: 1 }} />
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.strip}>
                {[0,1,2].map(i => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.stripSep} />}
                    <View style={styles.stripItem}>
                      <Bone w={50} h={13} r={4} style={{ marginBottom: 4 }} />
                      <Bone w={40} h={9} r={3} />
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>

          {/* Info card skeletons */}
          <View style={styles.cardsWrap}>
            {[1,2].map(i => (
              <View key={i} style={styles.card}>
                <View style={styles.cardHead}>
                  <Bone w={30} h={30} r={10} />
                  <Bone w={140} h={13} r={4} />
                </View>
                {[0,1,2].map(j => (
                  <View key={j} style={styles.iRow}>
                    <Bone w={30} h={30} r={8} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Bone w={60} h={9} r={3} />
                      <Bone w={140} h={13} r={4} />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.heroLoading}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.loadTitle}>Staff Profile</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="account-off-outline" size={40} color={C.g400} />
          </View>
          <Text style={styles.emptyTitle}>Staff not found</Text>
        </View>
      </View>
    );
  }

  const rc = ROLE_COLORS[staff.role?.toLowerCase()] || ROLE_COLORS.default;
  const dotColor = getStatusDot(staff.status);
  const licExpired = staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date();

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Fixed identity hero ── */}
      <LinearGradient colors={G.hero} style={styles.hero}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteCircle} onPress={handleDelete}>
              <Icon name="trash-2" size={16} color="#FCA5A5" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="account" size={12} color={C.g400} />
            <Text style={styles.heroBadgeTxt}>Staff Profile</Text>
          </View>

          <View style={styles.avatarWrap}>
            {staff.photo ? (
              <Image source={{ uri: staff.photo }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{staff.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
              </View>
            )}
            <View style={[styles.onlineDot, { backgroundColor: dotColor }]} />
          </View>

          <Text style={styles.name}>{staff.name}</Text>

          <View style={styles.badges}>
            <View style={[styles.rolePill, { backgroundColor: rc.bg }]}>
              <Text style={[styles.rolePillTxt, { color: rc.text }]}>
                {staff.role?.replace(/_/g, ' ') || 'Staff'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
              <Text style={[styles.statusPillTxt, { color: dotColor }]}>
                {staff.status?.replace(/_/g, ' ') || 'Active'}
              </Text>
            </View>
          </View>

          <View style={{ height: rs(30) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Single scroll — floating summary card + all info cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Floating summary card — tucks into the hero's bottom curve ── */}
        <View style={styles.summaryWrap}>
          <View style={styles.summaryCard}>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
                <Icon name="phone" size={15} color="#fff" />
                <Text style={styles.callTxt}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('AddStaffScreen', { staffId, staff })}
                activeOpacity={0.85}
              >
                <Icon name="edit-2" size={15} color={C.g700} />
                <Text style={styles.editTxt}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stripDivider} />

            <View style={styles.strip}>
              <View style={styles.stripItem}>
                <Text style={styles.stripVal}>{fmt(staff.joiningDate)}</Text>
                <Text style={styles.stripLbl}>Joined</Text>
              </View>
              {staff.salary > 0 && (
                <>
                  <View style={styles.stripSep} />
                  <View style={styles.stripItem}>
                    <Text style={[styles.stripVal, { color: C.g700 }]}>
                      ₹{parseInt(staff.salary).toLocaleString()}
                    </Text>
                    <Text style={styles.stripLbl}>Monthly Pay</Text>
                  </View>
                </>
              )}
              {staff.employeeId && (
                <>
                  <View style={styles.stripSep} />
                  <View style={styles.stripItem}>
                    <Text style={styles.stripVal}>{staff.employeeId}</Text>
                    <Text style={styles.stripLbl}>Employee ID</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Info Cards ── */}
        <View style={styles.cardsWrap}>

          {/* Contact */}
          <Section icon="phone" color={C.g700} bg={C.g50} title="Contact Information">
            <IRow icon="phone" iColor={C.g700} iBg={C.g50} label="Phone" value={staff.phone} />
            {staff.email && (
              <IRow icon="mail" iColor={C.blue} iBg={C.blueL} label="Email" value={staff.email} />
            )}
            {(staff.address || staff.city || staff.state) && (
              <IRow
                icon="map-pin" iColor={C.amber} iBg={C.amberL}
                label="Address"
                value={[staff.address, staff.city, staff.state, staff.pincode].filter(Boolean).join(', ')}
                last
              />
            )}
          </Section>

          {/* Employment */}
          <Section icon="briefcase" color={C.purple} bg={C.purpleL} title="Employment">
            {staff.employeeId && <KVRow label="Employee ID" value={staff.employeeId} />}
            <KVRow label="Joining Date" value={fmt(staff.joiningDate)} />
            {staff.salary > 0 && (
              <KVRow label="Monthly Salary" value={`₹${parseInt(staff.salary).toLocaleString()}`} green />
            )}
            <KVRow label="Status" value={staff.status?.replace(/_/g, ' ')} last />
          </Section>

          {/* Personal */}
          {staff.dateOfBirth && (
            <Section icon="user" color={C.amber} bg={C.amberL} title="Personal">
              <KVRow label="Date of Birth" value={fmt(staff.dateOfBirth)} last />
            </Section>
          )}

          {/* Identity */}
          {(staff.aadharNumber || staff.panNumber) && (
            <Section icon="shield" color={C.blue} bg={C.blueL} title="Identity Documents">
              {staff.aadharNumber && (
                <KVRow label="Aadhar" value={staff.aadharNumber} last={!staff.panNumber} />
              )}
              {staff.panNumber && <KVRow label="PAN" value={staff.panNumber} last />}
            </Section>
          )}

          {/* License */}
          {staff.role?.toLowerCase() === 'driver' && (
            <Section icon="credit-card" color={C.g700} bg={C.g50} title="Driving License">
              <KVRow label="License No." value={staff.licenseNumber} />
              {staff.licenseType && <KVRow label="License Type" value={staff.licenseType} />}
              <KVRow label="Expiry" value={fmt(staff.licenseExpiry)} last={!licExpired} />
              {licExpired && (
                <View style={styles.warning}>
                  <Icon name="alert-triangle" size={13} color={C.amber} />
                  <Text style={styles.warningTxt}>License expired — please renew</Text>
                </View>
              )}
            </Section>
          )}

          {/* Driver ID */}
          {staff.role?.toLowerCase() === 'driver' && staff.did && (
            <Section icon="shield-account" iconLib="mci" color={C.blue} bg={C.blueL} title="Driver Identification">
              <KVRow label="Driver ID" value={staff.did} green last />
            </Section>
          )}

          {/* Bank */}
          {(staff.bankName || staff.accountNumber) && (
            <Section icon="credit-card" iconLib="mci" color={C.blue} bg={C.blueL} title="Bank Details">
              {staff.bankName && <KVRow label="Bank" value={staff.bankName} />}
              {staff.accountHolderName && <KVRow label="Account Holder" value={staff.accountHolderName} />}
              {staff.accountNumber && <KVRow label="Account No." value={staff.accountNumber} />}
              {staff.ifscCode && <KVRow label="IFSC" value={staff.ifscCode} last />}
            </Section>
          )}

          {/* Emergency */}
          {(staff.emergencyContact || staff.emergencyPhone) && (
            <Section icon="alert-circle" color={C.red} bg={C.redL} title="Emergency Contact">
              {staff.emergencyContact && (
                <KVRow label="Name" value={staff.emergencyContact} last={!staff.emergencyPhone} />
              )}
              {staff.emergencyPhone && <KVRow label="Phone" value={staff.emergencyPhone} last />}
            </Section>
          )}

          {/* Performance */}
          {staff.stats && (
            <Section icon="bar-chart-2" color={C.purple} bg={C.purpleL} title="Performance">
              <View style={styles.perf}>
                <View style={styles.perfItem}>
                  <Text style={styles.perfVal}>{staff.stats.totalTrips || 0}</Text>
                  <Text style={styles.perfLbl}>Total Trips</Text>
                </View>
                <View style={[styles.perfItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border }]}>
                  <Text style={[styles.perfVal, { color: C.g600 }]}>{staff.stats.completedTrips || 0}</Text>
                  <Text style={styles.perfLbl}>Completed</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={[styles.perfVal, { color: C.amber }]}>
                    {staff.stats.rating?.toFixed(1) || '--'}
                  </Text>
                  <Text style={styles.perfLbl}>Rating</Text>
                </View>
              </View>
            </Section>
          )}

          {/* Documents */}
          {staff.documents?.length > 0 && (
            <Section icon="file-text" color={C.blue} bg={C.blueL} title="Documents">
              {staff.documents.map((doc, i) => (
                <View
                  key={i}
                  style={[styles.docRow, i === staff.documents.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.docIcon}>
                    <Icon name="file-text" size={14} color={C.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docDate}>Uploaded {fmt(doc.uploadedAt)}</Text>
                  </View>
                  <Icon name="chevron-right" size={14} color={C.muted} />
                </View>
              ))}
            </Section>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// How far the floating summary card rides up over the hero's rounded bottom edge.
const SUMMARY_OVERLAP = rs(24);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Hero */
  hero: {
    paddingHorizontal: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
  },
  heroLoading: {
    paddingHorizontal: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
  },
  heroSafe: {},
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 0, marginBottom: rs(8),
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  heroBadgeTxt: { fontSize: 11.5, fontWeight: '700', color: C.g400, fontFamily: DISPLAY, textTransform: 'uppercase', letterSpacing: 0.5 },

  avatarWrap: { position: 'relative', alignSelf: 'center', marginBottom: 10 },
  avatarImg: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderWidth: 2.5, borderColor: 'rgba(52,211,153,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 28, fontWeight: '900', color: '#34D399', fontFamily: DISPLAY },
  onlineDot: {
    position: 'absolute', bottom: 3, right: 3,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: C.g900,
  },

  name: {
    fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff',
    textAlign: 'center', letterSpacing: -0.4, marginBottom: 8,
  },
  badges: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  rolePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  rolePillTxt: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillTxt: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },

  /* Empty state */
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.muted },

  /* Scroll body */
  scrollContent: { paddingHorizontal: 14, paddingTop: SUMMARY_OVERLAP, paddingBottom: 60 },

  /* Floating summary card */
  summaryWrap: { marginTop: -SUMMARY_OVERLAP },
  summaryCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: T.glassBorder,
    padding: 14, ...cardShadow,
  },
  actionsRow: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.g600, paddingVertical: 12, borderRadius: rs(12),
  },
  callTxt: { fontSize: 14, fontWeight: '800', color: '#fff', fontFamily: DISPLAY },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: rs(12),
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  editTxt: { fontSize: 14, fontWeight: '700', color: C.g700, fontFamily: DISPLAY },

  stripDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  strip: { flexDirection: 'row' },
  stripItem: { flex: 1, alignItems: 'center' },
  stripVal: { fontSize: 14, fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  stripLbl: {
    fontSize: 10, color: C.muted,
    marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  stripSep: { width: 1, backgroundColor: C.border, marginVertical: 3 },

  /* Info cards */
  cardsWrap: { marginTop: 10, gap: 10 },

  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 14,
    borderWidth: 1, borderColor: T.glassBorder, ...cardShadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: '800', color: C.text },

  iRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  iLbl: { fontSize: 11, color: C.muted, marginBottom: 2, fontWeight: '500' },
  iVal: { fontSize: 14, color: C.text, fontWeight: '600', lineHeight: 20 },

  kv: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  kvLbl: { fontSize: 14, color: C.sub, fontWeight: '500' },
  kvVal: { fontSize: 14, color: C.text, fontWeight: '700' },

  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.amberL, marginTop: 10, padding: 10, borderRadius: rs(10),
  },
  warningTxt: { fontSize: 13, color: C.amber, fontWeight: '600', flex: 1 },

  perf: { flexDirection: 'row', paddingVertical: 4 },
  perfItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  perfVal: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: C.text },
  perfLbl: { fontSize: 11, color: C.muted, marginTop: 3, fontWeight: '600' },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  docIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 14, fontWeight: '600', color: C.text },
  docDate: { fontSize: 12, color: C.muted, marginTop: 2 },
});
