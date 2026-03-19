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
import { ListSkeleton } from '../../../components/SkeletonLoader';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#EF4444', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const ROLE_COLORS = {
  driver:     { bg: '#DBEAFE', text: '#1E40AF' },
  manager:    { bg: '#F3E8FF', text: '#7C3AED' },
  helper:     { bg: '#FEF3C7', text: '#92400E' },
  accountant: { bg: '#DCFCE7', text: '#166534' },
  mechanic:   { bg: '#FEE2E2', text: '#991B1B' },
  supervisor: { bg: '#E0E7FF', text: '#3730A3' },
  default:    { bg: '#F1F5F9', text: '#64748B' },
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'driver',  label: 'Drivers' },
  { key: 'manager', label: 'Managers' },
  { key: 'helper',  label: 'Helpers' },
];

export default function StaffListScreen({ navigation }) {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff]           = useState([]);
  const [filter, setFilter]         = useState('all');

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

  /* ── Everything above the cards is the list header ── */
  const ListHeader = () => (
    <>
      {/* Gradient with back + hero + stats — all in one, no separate bar */}
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={st.grad}>
        <SafeAreaView edges={['top']}>
          {/* Back + Add row */}
          <View style={st.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.glassBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={st.addBtn}
              onPress={() => navigation.navigate('AddStaffScreen')}
            >
              <Icon name="user-plus" size={15} color={C.g400} />
              <Text style={st.addBtnTxt}>Add Staff</Text>
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={st.hero}>
            <View style={st.heroIconWrap}>
              <MaterialCommunityIcons name="account-group" size={30} color={C.g400} />
            </View>
            <Text style={st.heroTitle}>Staff Management</Text>
            <Text style={st.heroSub}>Manage your team members</Text>
          </View>

          {/* Stats */}
          <View style={st.statsRow}>
            {[
              { val: staff.length, lbl: 'Total',    col: '#fff' },
              { val: staff.filter(s => s.role?.toLowerCase() === 'driver').length, lbl: 'Drivers', col: C.g400 },
              { val: staff.filter(s => s.isActive).length,  lbl: 'Active',   col: '#86EFAC' },
              { val: staff.filter(s => !s.isActive).length, lbl: 'Inactive', col: '#FCA5A5' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.lbl}>
                <View style={st.statItem}>
                  <Text style={[st.statVal, { color: item.col }]}>{item.val}</Text>
                  <Text style={st.statLbl}>{item.lbl}</Text>
                </View>
                {i < arr.length - 1 && <View style={st.statSep} />}
              </React.Fragment>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Quick Nav */}
      <View style={st.quickRow}>
        <TouchableOpacity
          style={st.quickCard}
          onPress={() => navigation.navigate('StaffAttendanceScreen')}
          activeOpacity={0.75}
        >
          <View style={[st.quickIcon, { backgroundColor: C.blueL }]}>
            <Icon name="calendar" size={20} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.quickTitle}>Attendance</Text>
            <Text style={st.quickSub}>Track daily presence</Text>
          </View>
          <Icon name="chevron-right" size={15} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={st.quickCard}
          onPress={() => navigation.navigate('StaffPayrollScreen')}
          activeOpacity={0.75}
        >
          <View style={[st.quickIcon, { backgroundColor: C.purpleL }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={C.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.quickTitle}>Payroll</Text>
            <Text style={st.quickSub}>Manage salaries</Text>
          </View>
          <Icon name="chevron-right" size={15} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* Section bar */}
      <View style={st.sectionBar}>
        <Text style={st.sectionTitle}>
          Team Members{' '}
          <Text style={{ color: C.g600 }}>{filteredStaff.length}</Text>
        </Text>
        <View style={st.chips}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[st.chip, filter === f.key && st.chipOn]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[st.chipTxt, filter === f.key && st.chipTxtOn]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Empty */}
      {filteredStaff.length === 0 && (
        <View style={st.emptyWrap}>
          <View style={st.emptyCircle}>
            <MaterialCommunityIcons name="account-group-outline" size={40} color={C.muted} />
          </View>
          <Text style={st.emptyTitle}>No Staff Found</Text>
          <Text style={st.emptySub}>
            {filter === 'all' ? 'Add your first team member' : `No ${filter}s in your team`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddStaffScreen')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[C.g700, C.g500]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.emptyCta}
              >
                <Icon name="plus" size={15} color="#fff" />
                <Text style={st.emptyCtaTxt}>Add Staff Member</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={st.grad}>
          <SafeAreaView edges={['top']}>
            <View style={st.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={st.glassBtn}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={st.hero}>
              <View style={st.heroIconWrap}>
                <MaterialCommunityIcons name="account-group" size={30} color={C.g400} />
              </View>
              <Text style={st.heroTitle}>Staff Management</Text>
              <Text style={st.heroSub}>Manage your team members</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ListSkeleton count={6} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id?.toString()}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g500} />
        }
        renderItem={({ item }) => {
          const rc = getRoleColor(item.role);
          return (
            <TouchableOpacity
              style={st.card}
              onPress={() => navigation.navigate('StaffDetailScreen', { staffId: item.id })}
              activeOpacity={0.7}
            >
              <View style={st.avatarWrap}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={st.avatar} />
                ) : (
                  <LinearGradient colors={[C.g800, C.g600]} style={st.avatarGrad}>
                    <Text style={st.avatarLetter}>
                      {item.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Text>
                  </LinearGradient>
                )}
                <View style={[st.dot, { backgroundColor: item.isActive ? C.g500 : C.muted }]} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={st.nameRow}>
                  <Text style={st.staffName} numberOfLines={1}>{item.name || 'Staff Member'}</Text>
                  <View style={[st.badge, { backgroundColor: rc.bg }]}>
                    <Text style={[st.badgeTxt, { color: rc.text }]}>
                      {item.role?.replace(/_/g, ' ') || 'Staff'}
                    </Text>
                  </View>
                </View>
                <View style={st.metaRow}>
                  <Icon name="phone" size={11} color={C.muted} />
                  <Text style={st.metaTxt}>{item.phone || 'No phone'}</Text>
                  {item.email && (
                    <>
                      <Text style={st.dot2}>·</Text>
                      <Icon name="mail" size={11} color={C.muted} />
                      <Text style={st.metaTxt} numberOfLines={1}>{item.email}</Text>
                    </>
                  )}
                </View>
              </View>

              <Icon name="chevron-right" size={15} color={C.muted} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  /* Gradient */
  grad: { paddingHorizontal: 16, paddingBottom: 20 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 8, marginBottom: 18,
  },
  glassBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
  },
  addBtnTxt: { fontSize: 13, fontWeight: '700', color: C.g400 },

  hero: { alignItems: 'center', marginBottom: 20 },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: {
    fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 2,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },

  /* Quick */
  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 14 },
  quickCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  quickSub: { fontSize: 11, color: C.muted, marginTop: 1 },

  /* Section bar */
  sectionBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  chipOn: { backgroundColor: C.g50, borderColor: C.g100 },
  chipTxt: { fontSize: 11, color: C.muted, fontWeight: '600' },
  chipTxtOn: { color: C.g700, fontWeight: '700' },

  /* Staff card */
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14, padding: 13,
    marginHorizontal: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarGrad: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '900', color: '#fff' },
  dot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.card,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  staffName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 12, color: C.muted, flexShrink: 1 },
  dot2: { color: C.border, marginHorizontal: 2 },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 40 },
  emptyCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, gap: 8,
  },
  emptyCtaTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
