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
import { SC as T, G, rs, rf, GUT, shade, cardShadow, rowShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex, mirroring the mapping
// convention already used in StaffListScreen.js (sibling file, same folder).
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueLight: T.blueLight,
  amber: T.amber, amberLight: T.amberLight,
  red: T.red, redLight: T.redLight,
  orange: T.orange, orangeLight: T.orangeL,
  glassBorder: T.glassBorder, scrim: T.scrim,
};

const STATUS_CONFIG = {
  PRESENT:  { color: C.g600,  bg: C.g50,        label: 'Present',  short: 'P', icon: 'check' },
  ABSENT:   { color: C.red,   bg: C.redLight,   label: 'Absent',   short: 'A', icon: 'x' },
  LEAVE:    { color: C.amber, bg: C.amberLight, label: 'Leave',    short: 'L', icon: 'clock' },
  HALF_DAY: { color: C.orange,bg: C.orangeLight,label: 'Half Day', short: 'H', icon: 'sun' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const { width: SW } = Dimensions.get('window');
const DAY_W = rs(36);
const NAME_W = rs(120);

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

  if (loading) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.headerGradLoading}>
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
            <View style={s.headerTopRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle}>
                <Icon name="arrow-left" size={rs(20)} color="#fff" />
              </TouchableOpacity>
              <Text style={s.loadTitle}>Staff Attendance</Text>
              <View style={{ width: rs(40) }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
      </View>
    );
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const markedCount = Object.keys(modalRecords).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header — month/year nav integrated in the hero ── */}
      <LinearGradient colors={G.hero} style={s.headerGrad}>
        <AnimatedOrb style={s.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={s.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onRefresh} style={s.refreshCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="refresh-cw" size={rs(16)} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>

          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="calendar-check" size={rs(12)} color={C.g400} />
            <Text style={s.heroBadgeTxt}>Attendance Tracker</Text>
          </View>
          <Text style={s.bigTitle}>Staff Attendance</Text>
          <Text style={s.bigSub}>Track daily check-ins for your team</Text>

          <View style={s.monthNavRow}>
            <TouchableOpacity onPress={goToPrevMonth} style={s.monthNavBtn} activeOpacity={0.7}>
              <Icon name="chevron-left" size={rs(18)} color="#fff" />
            </TouchableOpacity>
            <View style={s.monthNavPill}>
              <Icon name="calendar" size={rs(13)} color={C.g400} />
              <Text style={s.monthNavPillTxt}>{MONTH_NAMES[month]} {year}</Text>
            </View>
            <TouchableOpacity
              onPress={goToNextMonth}
              style={[s.monthNavBtn, isCurrentMonth && s.monthNavBtnDisabled]}
              disabled={isCurrentMonth}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={rs(18)} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ height: rs(isCurrentMonth ? 28 : 12) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating today-summary card — tucks into the hero's bottom curve */}
      {isCurrentMonth && (
        <View style={s.statsWrap}>
          <TouchableOpacity
            style={[s.statsCard, cardShadow]}
            onPress={() => openMarkModal(now.getDate())}
            activeOpacity={0.85}
          >
            <View style={s.statsTodayBadge}>
              <Text style={s.statsTodayNum}>{now.getDate()}</Text>
              <Text style={s.statsTodaySub}>{MONTH_SHORT[month]}</Text>
            </View>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: C.g600 }]}>{todaySummary?.present || 0}</Text>
                <Text style={s.statLabel}>Present</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: C.red }]}>{todaySummary?.absent || 0}</Text>
                <Text style={s.statLabel}>Absent</Text>
              </View>
              {(todaySummary?.notMarked > 0) && (
                <>
                  <View style={s.statDiv} />
                  <View style={s.statItem}>
                    <Text style={[s.statVal, { color: C.muted }]}>{todaySummary.notMarked}</Text>
                    <Text style={s.statLabel}>Pending</Text>
                  </View>
                </>
              )}
            </View>
            <Icon name="edit-2" size={rs(15)} color={C.g600} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {staff.length === 0 ? (
          <View style={s.emptyCardWrap}>
            <View style={s.emptyArt}>
              <View style={s.emptyArtCardBack} />
              <View style={s.emptyArtCard}>
                <Icon name="users" size={rs(36)} color={C.g500} />
              </View>
              <View style={s.emptyArtDot} />
              <View style={s.emptyArtTag}><Text style={s.emptyArtTagTxt}>NO STAFF</Text></View>
            </View>
            <Text style={s.emptyTitle}>No Staff Found</Text>
            <Text style={s.emptyBody}>Add staff members to start tracking attendance</Text>
          </View>
        ) : (
          <View style={[s.gridCard, cardShadow]}>
            {/* Legend */}
            <View style={s.legendBar}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <View key={key} style={s.legendChip}>
                  <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
                  <Text style={s.legendTxt}>{cfg.short} · {cfg.label}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View>
                {/* Day Headers */}
                <View style={s.hRow}>
                  <View style={s.hName}>
                    <Text style={s.hNameTxt}>Staff</Text>
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
                        <Text style={[s.hDayLetter, today ? s.hTodayTxt : sun && !future ? s.hSunTxt : future ? s.hFutureTxt : null]}>
                          {DAY_LABELS[getDayOfWeek(day)]}
                        </Text>
                        <View style={[s.hDayNum, today && s.hDayNumToday]}>
                          <Text style={[s.hDayNumTxt, today && s.hDayNumTodayTxt, future && s.hFutureTxt, sun && !today && !future && s.hSunTxt]}>
                            {day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={s.hStat}><Text style={[s.hStatTxt, { color: C.g600 }]}>P</Text></View>
                  <View style={s.hStat}><Text style={[s.hStatTxt, { color: C.red }]}>A</Text></View>
                </View>

                {/* Staff Rows */}
                {staff.map((person, idx) => {
                  const stats = getStaffStats(person.id);
                  const isLast = idx === staff.length - 1;
                  const railColor = stats.a > 0 ? C.red : C.g600;
                  return (
                    <View key={person.id} style={[s.gRow, idx % 2 === 0 && s.gRowStripe, isLast && s.gRowLast]}>
                      <LinearGradient
                        colors={[railColor, shade(railColor, -18)]}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={s.gRail}
                      />
                      <View style={s.gName}>
                        <LinearGradient colors={[C.g800, C.g600]} style={s.gAvatar}>
                          <Text style={s.gAvatarTxt}>{person.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.gNameTxt} numberOfLines={1}>{person.name || 'Staff'}</Text>
                          {person.role ? <Text style={s.gRoleTxt} numberOfLines={1}>{person.role}</Text> : null}
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
                                <Text style={s.badgeTxt}>{cfg?.short}</Text>
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
                        <Text style={[s.gStatNum, { color: C.g600 }]}>{stats.p}</Text>
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
        <View style={{ height: rs(20) }} />
      </ScrollView>

      {/* ── Mark Attendance Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.sheetHandleWrap}><View style={s.sheetHandle} /></View>

            <ScrollView contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              {/* Modal hero */}
              <LinearGradient colors={[C.g900, C.g800]} style={s.modalHero}>
                <View style={s.modalHeroRow}>
                  <View style={s.modalHeroBadge}>
                    <MaterialCommunityIcons name="calendar-check" size={rs(20)} color={C.g400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalHeroTitle}>Mark Attendance</Text>
                    {modalDate && (
                      <Text style={s.modalHeroSub}>
                        {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Icon name="x" size={rs(16)} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={s.modalBody}>
                {/* Quick Actions */}
                <View style={s.quickRow}>
                  <Text style={s.quickLabel}>Quick mark:</Text>
                  <View style={s.quickChipsWrap}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <TouchableOpacity
                        key={key}
                        style={[s.quickBtn, { borderColor: cfg.color }]}
                        onPress={() => markAllAs(key)}
                        activeOpacity={0.6}
                      >
                        <Text style={[s.quickBtnTxt, { color: cfg.color }]}>All {cfg.short}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Staff List */}
                {staff.map((person, idx) => {
                  const sel = modalRecords[person.id];
                  const selCfg = STATUS_CONFIG[sel];
                  return (
                    <View
                      key={person.id}
                      style={[
                        s.mCard,
                        sel && { borderLeftWidth: rs(3), borderLeftColor: selCfg?.color },
                        idx === staff.length - 1 && { marginBottom: 0 },
                      ]}
                    >
                      <View style={s.mCardTop}>
                        <View style={[s.mAvatar, sel && { backgroundColor: selCfg?.bg }]}>
                          <Text style={[s.mAvatarTxt, sel && { color: selCfg?.color }]}>
                            {person.name?.charAt(0)?.toUpperCase() || 'S'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.mName} numberOfLines={1}>{person.name || 'Staff'}</Text>
                          {person.role ? <Text style={s.mRole} numberOfLines={1}>{person.role}</Text> : null}
                        </View>
                        {sel && (
                          <View style={[s.mSelBadge, { backgroundColor: selCfg?.bg }]}>
                            <Icon name={selCfg?.icon} size={rs(11)} color={selCfg?.color} />
                            <Text style={[s.mSelBadgeTxt, { color: selCfg?.color }]}>{selCfg?.label}</Text>
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
                              <Icon name={cfg.icon} size={rs(13)} color={active ? '#fff' : C.muted} />
                              <Text style={[s.mOptTxt, active && { color: '#fff', fontWeight: '700' }]}>
                                {cfg.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}

                {/* Save */}
                <View style={s.mFooter}>
                  <Text style={s.mFooterInfo}>{markedCount}/{staff.length} staff marked</Text>
                  <TouchableOpacity onPress={saveAttendance} disabled={saving} activeOpacity={0.85}>
                    <LinearGradient colors={[C.g800, C.g600]} style={[s.saveBtn, saving && { opacity: 0.6 }]}>
                      {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="check-circle" size={rs(18)} color="#fff" />
                          <Text style={s.saveBtnTxt}>Save Attendance</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero
  headerGrad: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(4),
  },
  headerGradLoading: { paddingBottom: rs(14) },
  orbA: {
    position: 'absolute', top: -rs(50), right: -rs(30),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4), marginBottom: rs(12) },
  backCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  refreshCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start',
    paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 999, marginBottom: rs(6),
  },
  heroBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: '700', color: C.g400, letterSpacing: 0.4 },
  bigTitle: { fontFamily: DISPLAY, fontSize: rf(25), color: '#fff', letterSpacing: 0.2, fontWeight: '800' },
  bigSub: { fontFamily: DISPLAY, fontSize: rf(12.5), color: 'rgba(255,255,255,0.68)', fontWeight: '600', marginTop: rs(3) },

  // Month nav (in-hero)
  monthNavRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(16) },
  monthNavBtn: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  monthNavBtnDisabled: { opacity: 0.3 },
  monthNavPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(7),
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: rs(14), paddingVertical: rs(9),
  },
  monthNavPillTxt: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: '700', color: '#fff' },

  // Floating today-summary card
  statsWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.card, borderRadius: rs(18),
    paddingHorizontal: rs(14), paddingVertical: rs(13),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  statsTodayBadge: {
    width: rs(46), height: rs(46), borderRadius: rs(13), backgroundColor: C.g600,
    alignItems: 'center', justifyContent: 'center',
  },
  statsTodayNum: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: '#fff', lineHeight: rf(19) },
  statsTodaySub: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: '#fff', opacity: 0.85, marginTop: -rs(1) },
  statsRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  statVal: { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800' },
  statLabel: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: '700', color: C.muted, marginTop: rs(2) },
  statDiv: { width: 1, height: rs(28), backgroundColor: C.border },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(14) },

  // Grid card
  gridCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.glassBorder,
    overflow: 'hidden',
  },

  // Legend
  legendBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: rs(10),
    paddingHorizontal: rs(14), paddingVertical: rs(10),
    backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  legendDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  legendTxt: { fontFamily: DISPLAY, fontSize: rf(10), color: C.muted, fontWeight: '600' },

  // Grid header row
  hRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  hName: { width: NAME_W, paddingHorizontal: rs(12), paddingVertical: rs(10), borderRightWidth: 1, borderRightColor: C.border },
  hNameTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  hDay: { width: DAY_W, alignItems: 'center', paddingVertical: rs(5) },
  hDayToday: { backgroundColor: C.g50 },
  hDayFuture: { opacity: 0.25 },
  hDayLetter: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: '600', color: C.muted },
  hDayNum: { width: rs(22), height: rs(22), borderRadius: rs(7), alignItems: 'center', justifyContent: 'center', marginTop: rs(1) },
  hDayNumTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '700', color: C.sub },
  hDayNumToday: { backgroundColor: C.g600, borderRadius: rs(7) },
  hDayNumTodayTxt: { color: '#fff' },
  hTodayTxt: { color: C.g600, fontWeight: '800' },
  hSunTxt: { color: C.red },
  hFutureTxt: { color: '#CBD5E1' },
  hStat: { width: rs(34), alignItems: 'center', justifyContent: 'center', paddingVertical: rs(5), borderLeftWidth: 1, borderLeftColor: C.border },
  hStatTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '900' },

  // Grid data row
  gRow: {
    flexDirection: 'row', alignItems: 'stretch',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  gRowStripe: { backgroundColor: '#FAFBFD' },
  gRowLast: { borderBottomWidth: 0 },
  gRail: { width: rs(3) },
  gName: {
    width: NAME_W, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(8), paddingVertical: rs(7),
    borderRightWidth: 1, borderRightColor: C.border,
  },
  gAvatar: {
    width: rs(26), height: rs(26), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center', marginRight: rs(6),
  },
  gAvatarTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '800', color: '#fff' },
  gNameTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '600', color: C.text, lineHeight: rf(14) },
  gRoleTxt: { fontFamily: DISPLAY, fontSize: rf(8), color: C.muted, textTransform: 'capitalize', marginTop: rs(1) },

  // Grid cell
  gCell: { width: DAY_W, height: rs(36), alignItems: 'center', justifyContent: 'center' },
  gCellToday: { backgroundColor: C.g50 },
  badge: { width: rs(24), height: rs(24), borderRadius: rs(7), alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '900', color: '#fff' },
  blankCell: { width: rs(20), height: rs(20), borderRadius: rs(6), borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  futureCell: { width: rs(20), height: rs(20), borderRadius: rs(6), backgroundColor: C.bg },

  gStat: { width: rs(34), height: rs(36), alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.border },
  gStatNum: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: '800' },

  // Empty state
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: rs(20), paddingVertical: rs(30),
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
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '700', color: C.text, marginBottom: rs(6), textAlign: 'center' },
  emptyBody: { fontFamily: DISPLAY, fontSize: rf(13), color: C.muted, textAlign: 'center', lineHeight: rf(19), maxWidth: rs(260) },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.bg, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '90%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10), backgroundColor: C.bg },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },

  // Modal hero
  modalHero: { paddingHorizontal: rs(20), paddingTop: rs(14), paddingBottom: rs(18) },
  modalHeroRow: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
  modalHeroBadge: { width: rs(46), height: rs(46), borderRadius: rs(14), backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  modalHeroTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: '#fff', marginBottom: rs(2) },
  modalHeroSub: { fontFamily: DISPLAY, fontSize: rf(12), color: 'rgba(255,255,255,0.6)' },
  modalCloseBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },

  // Modal body
  modalBody: { padding: rs(20) },

  // Quick actions
  quickRow: { marginBottom: rs(18) },
  quickLabel: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '800', color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: rs(8) },
  quickChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  quickBtn: { paddingHorizontal: rs(12), paddingVertical: rs(7), borderRadius: rs(10), borderWidth: 1.5, backgroundColor: C.card },
  quickBtnTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '800' },

  // Modal staff cards
  mCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(12), marginBottom: rs(8),
    borderWidth: 1, borderColor: C.border, ...rowShadow,
  },
  mCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(10) },
  mAvatar: {
    width: rs(38), height: rs(38), borderRadius: rs(12), backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center', marginRight: rs(10),
  },
  mAvatarTxt: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.g700 },
  mName: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: C.text },
  mRole: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, textTransform: 'capitalize', marginTop: rs(1) },
  mSelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8),
  },
  mSelBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '800' },

  // Modal options
  mOptions: { flexDirection: 'row', gap: rs(6) },
  mOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: rs(9), borderRadius: rs(10), borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.bg, gap: rs(4),
  },
  mOptTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '600', color: C.muted },

  // Modal footer / save
  mFooter: { paddingTop: rs(6) },
  mFooterInfo: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: '600', textAlign: 'center', marginBottom: rs(10) },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: rs(15), borderRadius: rs(14), gap: rs(8),
  },
  saveBtnTxt: { fontFamily: DISPLAY, color: '#fff', fontWeight: '800', fontSize: rf(15) },
});
