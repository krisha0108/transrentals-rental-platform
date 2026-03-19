import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getStaffAttendance, markStaffAttendance } from '../../api/staff-api';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';

const C = {
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSec: '#334155',
  muted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  brand: '#22C55E',
  brandDark: '#16A34A',
  brandLight: '#DCFCE7',
  blue: '#3B82F6',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

const STATUS_CONFIG = {
  PRESENT:  { color: '#22C55E', bg: '#F0FDF4', label: 'Present',  short: 'P', icon: 'check' },
  ABSENT:   { color: '#EF4444', bg: '#FEF2F2', label: 'Absent',   short: 'A', icon: 'x' },
  LEAVE:    { color: '#F59E0B', bg: '#FFFBEB', label: 'Leave',    short: 'L', icon: 'clock' },
  HALF_DAY: { color: '#F97316', bg: '#FFF7ED', label: 'Half Day', short: 'H', icon: 'sun' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const { width: SW } = Dimensions.get('window');
const DAY_W = 36;
const NAME_W = 110;

const shadow = (elev = 4) => Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: elev / 2 }, shadowOpacity: 0.08, shadowRadius: elev },
  android: { elevation: elev / 2 },
});

export default function StaffAttendanceScreen({ navigation }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [todaySummary, setTodaySummary] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalRecords, setModalRecords] = useState({});
  const [saving, setSaving] = useState(false);

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await getStaffAttendance(month, year);
      setStaff(data?.staff || []);
      setAttendanceMap(data?.attendanceMap || {});
      setTodaySummary(data?.todaySummary || {});
      setDaysInMonth(data?.daysInMonth || new Date(year, month + 1, 0).getDate());
    } catch (error) {
      console.log('Error fetching attendance:', error);
      showError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { setLoading(true); fetchAttendance(); }, [fetchAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  }, [fetchAttendance]);

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const isFutureDate = (day) => {
    if (year > now.getFullYear()) return true;
    if (year === now.getFullYear() && month > now.getMonth()) return true;
    if (year === now.getFullYear() && month === now.getMonth() && day > now.getDate()) return true;
    return false;
  };
  const isToday = (day) => year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
  const isSunday = (day) => new Date(year, month, day).getDay() === 0;
  const getDayOfWeek = (day) => new Date(year, month, day).getDay();

  const formatDateStr = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getAttendanceStatus = (staffId, day) => {
    const dateStr = formatDateStr(day);
    const record = attendanceMap?.[staffId]?.[dateStr];
    return record?.status || null;
  };

  const getStaffStats = (staffId) => {
    let p = 0, a = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = getAttendanceStatus(staffId, d);
      if (s === 'PRESENT' || s === 'HALF_DAY') p++;
      else if (s === 'ABSENT') a++;
    }
    return { p, a };
  };

  const openMarkModal = (day) => {
    if (isFutureDate(day)) return;
    const dateStr = formatDateStr(day);
    setModalDate(dateStr);
    const records = {};
    staff.forEach((s) => {
      const existing = attendanceMap?.[s.id]?.[dateStr];
      if (existing?.status) records[s.id] = existing.status;
    });
    setModalRecords(records);
    setModalVisible(true);
  };

  const setStaffStatus = (staffId, status) => {
    setModalRecords((prev) => {
      if (prev[staffId] === status) {
        const next = { ...prev };
        delete next[staffId];
        return next;
      }
      return { ...prev, [staffId]: status };
    });
  };

  const markAllAs = (status) => {
    const records = {};
    staff.forEach((s) => { records[s.id] = status; });
    setModalRecords(records);
  };

  const saveAttendance = async () => {
    const records = Object.entries(modalRecords).map(([staffId, status]) => ({
      staffId, date: modalDate, status,
    }));
    if (records.length === 0) {
      showInfo('Please mark attendance for at least one staff member.', 'No Changes');
      return;
    }
    setSaving(true);
    try {
      await markStaffAttendance(records);
      setModalVisible(false);
      await fetchAttendance();
    } catch (error) {
      console.log('Error saving attendance:', error);
      showError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const GradHeader = () => (
    <LinearGradient colors={['#022C22', '#064E3B', '#047857']} style={s.headerGrad}>
      <SafeAreaView edges={['top']}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.glassBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={s.glassBtn}>
            <Icon name="refresh-cw" size={17} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <View style={s.heroSection}>
          <View style={s.heroIconWrap}>
            <MaterialCommunityIcons name="calendar-check" size={26} color="#34D399" />
          </View>
          <Text style={s.heroTitle}>Staff Attendance</Text>
          <Text style={s.heroSub}>{MONTH_NAMES[month]} {year}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#022C22" />
        <GradHeader />
        <View style={s.loader}><ActivityIndicator size="large" color={C.brand} /></View>
      </View>
    );
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const markedCount = Object.keys(modalRecords).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />
      <GradHeader />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Month Picker ── */}
        <View style={s.monthBar}>
          <TouchableOpacity onPress={goToPrevMonth} style={s.monthArrow} activeOpacity={0.6}>
            <Icon name="chevron-left" size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.monthPill} activeOpacity={0.8}>
            <Icon name="calendar" size={14} color={C.brand} />
            <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[s.monthArrow, isCurrentMonth && { opacity: 0.25 }]}
            disabled={isCurrentMonth}
            activeOpacity={0.6}
          >
            <Icon name="chevron-right" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* ── Today Card ── */}
        {isCurrentMonth && (
          <TouchableOpacity
            style={s.todayCard}
            onPress={() => openMarkModal(now.getDate())}
            activeOpacity={0.7}
          >
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>{now.getDate()}</Text>
              <Text style={s.todayBadgeSub}>{MONTH_SHORT[month]}</Text>
            </View>
            <View style={s.todayMid}>
              <Text style={s.todayHeading}>Today's Attendance</Text>
              <View style={s.todayChips}>
                <View style={[s.todayChip, { backgroundColor: '#F0FDF4' }]}>
                  <View style={[s.chipDot, { backgroundColor: C.brand }]} />
                  <Text style={[s.chipText, { color: '#16A34A' }]}>{todaySummary?.present || 0} Present</Text>
                </View>
                <View style={[s.todayChip, { backgroundColor: '#FEF2F2' }]}>
                  <View style={[s.chipDot, { backgroundColor: C.red }]} />
                  <Text style={[s.chipText, { color: C.red }]}>{todaySummary?.absent || 0} Absent</Text>
                </View>
                {(todaySummary?.notMarked > 0) && (
                  <View style={[s.todayChip, { backgroundColor: '#F8FAFC' }]}>
                    <View style={[s.chipDot, { backgroundColor: C.muted }]} />
                    <Text style={[s.chipText, { color: C.muted }]}>{todaySummary.notMarked} Pending</Text>
                  </View>
                )}
              </View>
            </View>
            <Icon name="edit-2" size={16} color={C.brand} />
          </TouchableOpacity>
        )}

        {/* ── Attendance Grid ── */}
        {staff.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyCircle}>
              <Icon name="users" size={36} color={C.muted} />
            </View>
            <Text style={s.emptyTitle}>No Staff Found</Text>
            <Text style={s.emptyDesc}>Add staff members to start tracking attendance</Text>
          </View>
        ) : (
          <View style={s.gridOuter}>
            {/* Legend */}
            <View style={s.legendBar}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <View key={key} style={s.legendChip}>
                  <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
                  <Text style={s.legendText}>{cfg.short} - {cfg.label}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View>
                {/* Day Headers */}
                <View style={s.hRow}>
                  <View style={s.hName}>
                    <Text style={s.hNameText}>Staff</Text>
                  </View>
                  {days.map((day) => {
                    const today = isToday(day);
                    const future = isFutureDate(day);
                    const sun = isSunday(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[s.hDay, today && s.hDayToday, future && s.hDayFuture]}
                        onPress={() => openMarkModal(day)}
                        disabled={future}
                        activeOpacity={0.5}
                      >
                        <Text style={[s.hDayLetter, today ? s.hTodayText : sun && !future ? s.hSunText : future ? s.hFutureText : null]}>
                          {DAY_LABELS[getDayOfWeek(day)]}
                        </Text>
                        <View style={[s.hDayNum, today && s.hDayNumToday]}>
                          <Text style={[s.hDayNumText, today && s.hDayNumTodayText, future && s.hFutureText, sun && !today && !future && s.hSunText]}>
                            {day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={s.hStat}><Text style={[s.hStatText, { color: C.brand }]}>P</Text></View>
                  <View style={s.hStat}><Text style={[s.hStatText, { color: C.red }]}>A</Text></View>
                </View>

                {/* Staff Rows */}
                {staff.map((person, idx) => {
                  const stats = getStaffStats(person.id);
                  const isLast = idx === staff.length - 1;
                  return (
                    <View key={person.id} style={[s.gRow, idx % 2 === 0 && s.gRowStripe, isLast && { borderBottomWidth: 0 }]}>
                      <View style={s.gName}>
                        <View style={s.gAvatar}>
                          <Text style={s.gAvatarText}>{person.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.gNameText} numberOfLines={1}>{person.name || 'Staff'}</Text>
                          {person.role ? <Text style={s.gRoleText} numberOfLines={1}>{person.role}</Text> : null}
                        </View>
                      </View>
                      {days.map((day) => {
                        const status = getAttendanceStatus(person.id, day);
                        const future = isFutureDate(day);
                        const today = isToday(day);
                        const cfg = STATUS_CONFIG[status];
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[s.gCell, today && s.gCellToday]}
                            onPress={() => openMarkModal(day)}
                            disabled={future}
                            activeOpacity={0.5}
                          >
                            {status ? (
                              <View style={[s.badge, { backgroundColor: cfg?.color }]}>
                                <Text style={s.badgeText}>{cfg?.short}</Text>
                              </View>
                            ) : future ? (
                              <View style={s.futureCell} />
                            ) : (
                              <View style={s.blankCell} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                      <View style={s.gStat}>
                        <Text style={[s.gStatNum, { color: C.brand }]}>{stats.p}</Text>
                      </View>
                      <View style={s.gStat}>
                        <Text style={[s.gStatNum, { color: C.red }]}>{stats.a}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Mark Attendance Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.mOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={s.mSheet} activeOpacity={1} onPress={() => {}}>
            {/* Grab Handle */}
            <View style={s.mHandle}><View style={s.mHandleBar} /></View>

            {/* Modal Header */}
            <View style={s.mHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.mTitle}>Mark Attendance</Text>
                {modalDate && (
                  <Text style={s.mDate}>
                    {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.mCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={s.quickRow}>
              <Text style={s.quickLabel}>Quick:</Text>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.quickBtn, { borderColor: cfg.color + '50' }]}
                  onPress={() => markAllAs(key)}
                  activeOpacity={0.6}
                >
                  <Text style={[s.quickBtnText, { color: cfg.color }]}>All {cfg.short}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Staff List */}
            <ScrollView style={s.mScroll} showsVerticalScrollIndicator={false}>
              {staff.map((person, idx) => {
                const sel = modalRecords[person.id];
                const selCfg = STATUS_CONFIG[sel];
                return (
                  <View
                    key={person.id}
                    style={[
                      s.mCard,
                      sel && { borderLeftWidth: 3, borderLeftColor: selCfg?.color },
                      idx === staff.length - 1 && { marginBottom: 0 },
                    ]}
                  >
                    <View style={s.mCardTop}>
                      <View style={[s.mAvatar, sel && { backgroundColor: selCfg?.bg }]}>
                        <Text style={[s.mAvatarText, sel && { color: selCfg?.color }]}>
                          {person.name?.charAt(0)?.toUpperCase() || 'S'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.mName}>{person.name || 'Staff'}</Text>
                        {person.role ? <Text style={s.mRole}>{person.role}</Text> : null}
                      </View>
                      {sel && (
                        <View style={[s.mSelBadge, { backgroundColor: selCfg?.bg }]}>
                          <Icon name={selCfg?.icon} size={11} color={selCfg?.color} />
                          <Text style={[s.mSelBadgeText, { color: selCfg?.color }]}>{selCfg?.label}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.mOptions}>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const active = sel === key;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[
                              s.mOpt,
                              active && { backgroundColor: cfg.color, borderColor: cfg.color },
                            ]}
                            onPress={() => setStaffStatus(person.id, key)}
                            activeOpacity={0.6}
                          >
                            <Icon name={cfg.icon} size={13} color={active ? '#fff' : C.muted} />
                            <Text style={[s.mOptText, active && { color: '#fff', fontWeight: '700' }]}>
                              {cfg.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Save */}
            <View style={s.mFooter}>
              <Text style={s.mFooterInfo}>{markedCount}/{staff.length} staff marked</Text>
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.6 }]}
                onPress={saveAttendance}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check-circle" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>Save Attendance</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Gradient Header
  headerGrad: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, marginBottom: 16,
  },
  glassBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroSection: { alignItems: 'center' },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

  // Month
  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 14,
  },
  monthArrow: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, ...shadow(2),
  },
  monthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, ...shadow(2),
  },
  monthLabel: { fontSize: 15, fontWeight: '700', color: C.text },

  // Today
  todayCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.brandLight,
    ...shadow(4),
  },
  todayBadge: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  todayBadgeText: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 20 },
  todayBadgeSub: { fontSize: 9, fontWeight: '700', color: '#fff', opacity: 0.8, marginTop: -1 },
  todayMid: { flex: 1 },
  todayHeading: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  todayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  todayChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700' },

  // Grid Outer
  gridOuter: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', ...shadow(4),
  },

  // Legend
  legendBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: C.muted, fontWeight: '600' },

  // Grid Header Row
  hRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: C.border },
  hName: { width: NAME_W, paddingHorizontal: 12, paddingVertical: 10, borderRightWidth: 1, borderRightColor: C.border },
  hNameText: { fontSize: 10, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  hDay: { width: DAY_W, alignItems: 'center', paddingVertical: 5 },
  hDayToday: { backgroundColor: C.brand + '10' },
  hDayFuture: { opacity: 0.25 },
  hDayLetter: { fontSize: 9, fontWeight: '600', color: C.muted },
  hDayNum: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  hDayNumText: { fontSize: 11, fontWeight: '700', color: C.textSec },
  hDayNumToday: { backgroundColor: C.brand, borderRadius: 7 },
  hDayNumTodayText: { color: '#fff' },
  hTodayText: { color: C.brand, fontWeight: '800' },
  hSunText: { color: C.red },
  hFutureText: { color: '#CBD5E1' },
  hStat: { width: 34, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderLeftWidth: 1, borderLeftColor: C.border },
  hStatText: { fontSize: 11, fontWeight: '900' },

  // Grid Data Row
  gRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  gRowStripe: { backgroundColor: '#FAFBFD' },
  gName: {
    width: NAME_W, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 7,
    borderRightWidth: 1, borderRightColor: C.border,
  },
  gAvatar: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  gAvatarText: { fontSize: 11, fontWeight: '800', color: C.purple },
  gNameText: { fontSize: 11, fontWeight: '600', color: C.text, lineHeight: 14 },
  gRoleText: { fontSize: 8, color: C.muted, textTransform: 'capitalize', marginTop: 1 },

  // Grid Cell
  gCell: { width: DAY_W, height: 36, alignItems: 'center', justifyContent: 'center' },
  gCellToday: { backgroundColor: C.brand + '06' },
  badge: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  blankCell: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  futureCell: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#F1F5F9' },

  gStat: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.borderLight },
  gStatNum: { fontSize: 12, fontWeight: '800' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: C.border, ...shadow(6),
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: C.muted },

  // Modal
  mOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  mSheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  mHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  mHandleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

  mHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  mTitle: { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  mDate: { fontSize: 13, color: C.muted, marginTop: 3 },
  mCloseBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  // Quick Actions
  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: C.muted, marginRight: 2 },
  quickBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5, backgroundColor: C.bg },
  quickBtnText: { fontSize: 10, fontWeight: '800' },

  // Modal Staff Cards
  mScroll: { paddingHorizontal: 16, paddingTop: 10 },
  mCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border, ...shadow(2),
  },
  mCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mAvatar: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  mAvatarText: { fontSize: 15, fontWeight: '800', color: C.purple },
  mName: { fontSize: 14, fontWeight: '700', color: C.text },
  mRole: { fontSize: 11, color: C.muted, textTransform: 'capitalize', marginTop: 1 },
  mSelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  mSelBadgeText: { fontSize: 10, fontWeight: '800' },

  // Modal Options
  mOptions: { flexDirection: 'row', gap: 6 },
  mOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.bg, gap: 4,
  },
  mOptText: { fontSize: 10, fontWeight: '600', color: C.muted },

  // Modal Footer
  mFooter: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
  },
  mFooterInfo: { fontSize: 11, color: C.muted, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.brand, paddingVertical: 15, borderRadius: 14, gap: 8,
    ...shadow(6),
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
