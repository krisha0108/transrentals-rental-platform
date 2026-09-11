import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorStaff } from '../../api/client';
import { useVerificationGate, VerificationBanner } from '../../../components/VerificationGate';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex, mirroring the
// mapping convention already used in FleetListScreen.js (sibling folder).
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
};

const ROLE_COLORS = {
  driver:     { bg: C.blueL,   text: C.blue,   dot: C.blue },
  manager:    { bg: C.purpleL, text: C.purple, dot: C.purple },
  helper:     { bg: C.amberL,  text: C.amber,  dot: C.amber },
  accountant: { bg: C.tealL,   text: C.teal,   dot: C.teal },
  mechanic:   { bg: C.redL,    text: C.red,    dot: C.red },
  supervisor: { bg: C.indigoL, text: C.indigo, dot: C.indigo },
  default:    { bg: C.bg,      text: C.muted,  dot: C.muted },
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'driver',  label: 'Drivers' },
  { key: 'manager', label: 'Managers' },
  { key: 'helper',  label: 'Helpers' },
];

const STAFF_TOOLS = [
  { label: 'Attendance', icon: 'calendar-check', screen: 'StaffAttendanceScreen' },
  { label: 'Payroll',    icon: 'cash-multiple',  screen: 'StaffPayrollScreen' },
];

/* ── Illustrated empty state — mirrors FleetListScreen's motif ──────────── */
const StaffEmptyState = ({ noneAtAll, onAddStaff, addIcon }) => (
  <View style={styles.emptyCardWrap}>
    <View style={styles.emptyArt}>
      <View style={styles.emptyArtCardBack} />
      <View style={styles.emptyArtCard}>
        <MaterialCommunityIcons name={noneAtAll ? 'account-group-outline' : 'account-search-outline'} size={rs(40)} color={C.g400} />
      </View>
      <View style={styles.emptyArtDot} />
      <View style={styles.emptyArtTag}>
        <Text style={styles.emptyArtTagTxt}>{noneAtAll ? 'EMPTY' : 'NO MATCH'}</Text>
      </View>
    </View>

    <Text style={styles.emptyTitle}>No Staff Found</Text>
    <Text style={styles.emptyBody}>
      {noneAtAll ? 'Add your first team member to get started' : 'No staff match this filter'}
    </Text>

    {noneAtAll && (
      <TouchableOpacity style={styles.emptyCtaWrap} onPress={onAddStaff} activeOpacity={0.9}>
        <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCta}>
          <Icon name={addIcon} size={16} color="#fff" />
          <Text style={styles.emptyCtaText}>Add Staff Member</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

export default function StaffListScreen({ navigation }) {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff]           = useState([]);
  const [filter, setFilter]         = useState('all');
  // Verification gate — pending vendors can view staff but add/edit is locked.
  const { status: vendorStatus, gate, LockGateModal } = useVerificationGate(navigation);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await getVendorStaff();
      setStaff(res?.staff || []);
    } catch (e) {
      console.log('Error fetching staff:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [fetchStaff]);

  const getRoleColor = (role) =>
    ROLE_COLORS[role?.toLowerCase()] || ROLE_COLORS.default;

  const filteredStaff = filter === 'all'
    ? staff
    : staff.filter((s) => s.role?.toLowerCase() === filter);

  const addIcon = vendorStatus === 'APPROVED' ? 'user-plus' : 'lock';

  const renderStaff = ({ item }) => {
    const rc = getRoleColor(item.role);
    const isDriver = item.role?.toUpperCase() === 'DRIVER';

    return (
      <View style={styles.card}>
        {/* Accent rail — tinted by role, mirroring the fleet card's
            status-tinted rail. */}
        <LinearGradient
          colors={[rc.dot, shade(rc.dot, -20)]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.cardRail}
        />

        <View style={styles.cardInner}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StaffDetailScreen', { staffId: item.id })}
          >
            <View style={styles.cardTopStripe}>
              <View style={styles.avatarWrap}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={[C.g800, C.g600]} style={styles.avatarGrad}>
                    <Text style={styles.avatarLetter}>
                      {item.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Text>
                  </LinearGradient>
                )}
                <View style={[styles.avatarDot, { backgroundColor: item.isActive ? C.g500 : C.muted }]} />
              </View>

              <Text style={styles.cardName} numberOfLines={1}>{item.name || 'Staff Member'}</Text>

              <View style={[styles.rolePill, { backgroundColor: rc.bg }]}>
                <Text style={[styles.rolePillTxt, { color: rc.text }]} numberOfLines={1}>
                  {item.role?.replace(/_/g, ' ') || 'Staff'}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.metaRow}>
                {isDriver && item.did && (
                  <View style={styles.didTag}>
                    <MaterialCommunityIcons name="shield-account" size={10} color="#0EA5E9" />
                    <Text style={styles.didTagTxt}>{item.did}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Icon name="phone" size={10} color={C.muted} />
                  <Text style={styles.metaText}>{item.phone || 'No phone'}</Text>
                </View>
                {item.email && (
                  <View style={styles.metaItem}>
                    <Icon name="mail" size={10} color={C.muted} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.headerLoading}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.topBar}>
              <Bone w={40} h={40} r={20} />
              <View style={styles.titleWrap}>
                <Bone w={90} h={11} r={4} style={{ marginBottom: 6 }} />
                <Bone w={90} h={17} r={5} />
              </View>
              <Bone w={40} h={40} r={20} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={[styles.overviewCard, { marginHorizontal: 16, marginTop: rs(14) }]}>
          <View style={styles.statsRow}>
            {[0,1,2,3].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statBox}>
                  <Bone w={26} h={17} r={4} style={{ marginBottom: 6 }} />
                  <Bone w={44} h={9} r={3} />
                </View>
              </React.Fragment>
            ))}
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.toolsInnerRow}>
            {[0,1].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.toolCol}>
                  <Bone w={34} h={34} r={10} />
                  <Bone w={50} h={9} r={3} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
              <View style={{ width: 3, backgroundColor: '#DDE4EE' }} />
              <View style={{ flex: 1, padding: 11, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bone w={42} h={42} r={21} />
                  <Bone w={120} h={13} r={4} />
                  <Bone w={60} h={18} r={9} style={{ marginLeft: 'auto' }} />
                </View>
                <Bone w={140} h={11} r={4} style={{ marginLeft: 50 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const driversCount  = staff.filter(s => s.role?.toLowerCase() === 'driver').length;
  const activeCount   = staff.filter(s => s.isActive).length;
  const inactiveCount = staff.filter(s => !s.isActive).length;
  const isFilteredEmpty = filteredStaff.length === 0;
  const noneAtAll = staff.length === 0;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={G.hero} style={styles.header}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="account-group" size={11} color={C.g400} />
                <Text style={styles.heroBadgeTxt}>Staff Manager</Text>
              </View>
              <Text style={styles.headerTitle}>My Team</Text>
            </View>
            <TouchableOpacity
              style={styles.addCircle}
              onPress={gate(() => navigation.navigate('AddStaffScreen'), 'add staff members')}
              activeOpacity={0.85}
            >
              <Icon name={addIcon} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Role filters — fixed, always visible above the scrolling list */}
      <View style={styles.filtersFixed}>
        <View style={styles.roleRow}>
          {FILTERS.map(f => {
            const cnt = f.key === 'all' ? staff.length : staff.filter(s => s.role?.toLowerCase() === f.key).length;
            const isActive = filter === f.key;
            const color = f.key === 'all' ? C.g600 : getRoleColor(f.key).dot;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.roleTab, isActive && { borderBottomColor: color }]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.roleTabTxt, isActive && { color, fontWeight: '800' }]}>{f.label}</Text>
                <View style={[styles.roleTabCnt, isActive && { backgroundColor: color }]}>
                  <Text style={[styles.roleTabCntTxt, isActive && { color: '#fff' }]}>{cnt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filter !== 'all' && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterTxt}>{filteredStaff.length} result{filteredStaff.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => setFilter('all')}>
              <Text style={styles.clearFilterTxt}>Clear filter ×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── STAFF LIST — stats/banner/tools scroll away with the list;
          filters above stay fixed so the active filter is always visible. ── */}
      <FlatList
        style={{ flex: 1 }}
        data={filteredStaff}
        renderItem={renderStaff}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: rs(14), gap: 14 }}>
            {/* Team overview — one panel: stats on top, quick tools below */}
            <View style={styles.overviewCard}>
              <View style={styles.statsRow}>
                {[
                  { label: 'Total',    value: staff.length,   color: C.text  },
                  { label: 'Drivers',  value: driversCount,    color: C.blue  },
                  { label: 'Active',   value: activeCount,     color: C.g700  },
                  { label: 'Inactive', value: inactiveCount,   color: C.red   },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <View style={styles.statDiv} />}
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.toolsInnerRow}>
                {STAFF_TOOLS.map((tool, idx) => {
                  const gc = idx === 0 ? ['#1D4ED8', '#60A5FA'] : ['#6D28D9', '#C4B5FD'];
                  return (
                    <React.Fragment key={tool.label}>
                      {idx > 0 && <View style={styles.statDiv} />}
                      <TouchableOpacity style={styles.toolCol} onPress={() => navigation.navigate(tool.screen)} activeOpacity={0.7}>
                        <LinearGradient colors={gc} style={styles.toolColIcon}>
                          <MaterialCommunityIcons name={tool.icon} size={17} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.toolColLabel} numberOfLines={1}>{tool.label}</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            {/* Pending-vendor verification banner */}
            <VerificationBanner status={vendorStatus} navigation={navigation} />

            {!isFilteredEmpty && (
              <View style={[styles.sectionHead, { paddingBottom: 0 }]}>
                <Text style={styles.sectionTitle}>TEAM MEMBERS</Text>
                <Text style={styles.sectionCount}>{filteredStaff.length} of {staff.length}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <StaffEmptyState
            noneAtAll={noneAtAll}
            onAddStaff={gate(() => navigation.navigate('AddStaffScreen'), 'add staff members')}
            addIcon={addIcon}
          />
        }
      />
      {LockGateModal}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Hero */
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerLoading: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerSafe: { paddingHorizontal: 16 },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(16) },
  titleWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  addCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  heroBadgeTxt: { fontSize: 12, fontWeight: '600', color: C.g400, fontFamily: DISPLAY },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2, fontFamily: DISPLAY },

  /* Team overview panel — stats on top, quick tools below, one card */
  overviewCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statsRow: { flexDirection: 'row', paddingVertical: 13 },
  overviewDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  statDiv:  { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 17, fontWeight: '800', fontFamily: DISPLAY, marginBottom: 2 },
  statLabel:{ fontSize: 10.5, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },

  toolsInnerRow: { flexDirection: 'row', paddingVertical: 12 },
  toolCol: { flex: 1, alignItems: 'center', gap: 6 },
  toolColIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  toolColLabel: { fontSize: 10.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY },

  /* Fixed role filters */
  filtersFixed: { paddingTop: 8 },
  roleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  roleTab: { flex: 1, alignItems: 'center', paddingVertical: 9, gap: 3, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  roleTabTxt: { fontSize: 12, fontWeight: '700', color: C.muted, fontFamily: DISPLAY },
  roleTabCnt: { minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: C.bg, alignItems: 'center' },
  roleTabCntTxt: { fontSize: 11, fontWeight: '800', color: C.muted },

  activeFilterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  activeFilterTxt: { fontSize: 13, color: C.sub, fontWeight: '600' },
  clearFilterTxt: { fontSize: 13, color: C.red, fontWeight: '700' },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 10, paddingTop: 4 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: DISPLAY },
  sectionCount: { fontSize: 13, fontWeight: '600', color: C.sub },

  /* Staff card */
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardRail: { width: 3 },
  cardInner: { flex: 1, padding: 11, minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarGrad: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '900', color: '#fff', fontFamily: DISPLAY },
  avatarDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 5.5, borderWidth: 2, borderColor: C.card,
  },
  cardName: { fontSize: 14.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY, flex: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, flexShrink: 0, maxWidth: rs(96) },
  rolePillTxt: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },

  cardBody: { marginLeft: 50 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, color: C.sub, fontWeight: '600' },
  didTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: '#E0F2FE' },
  didTagTxt: { fontSize: 11, fontWeight: '700', color: '#0EA5E9', letterSpacing: 0.3, fontFamily: DISPLAY },

  /* Illustrated empty state */
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 20, paddingVertical: rs(30),
    marginTop: rs(6),
  },
  emptyArt: {
    width: rs(140), height: rs(112), marginBottom: rs(16),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(20),
    width: rs(88), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(88), height: rs(78), borderRadius: rs(16),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(16),
    width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.g400,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g50,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontSize: 8.5, fontWeight: '700', color: C.g700, letterSpacing: 0.6, fontFamily: DISPLAY },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, fontFamily: DISPLAY, textAlign: 'center' },
  emptyBody: {
    fontSize: 14, color: C.muted, textAlign: 'center',
    lineHeight: 19, maxWidth: rs(260),
  },
  emptyCtaWrap: { marginTop: rs(16) },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: rs(14),
  },
  emptyCtaText: { fontSize: 13.5, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
});
