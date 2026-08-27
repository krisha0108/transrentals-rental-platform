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
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getStaffPayroll, markStaffPayment } from '../../api/staff-api';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';
import { SC as T, G, rs, rf, GUT, shade, cardShadow, rowShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex, mirroring the mapping
// convention already used in StaffListScreen.js (sibling folder).
const C = {
  bg: T.bg, card: T.card, border: T.border, glassBorder: T.glassBorder,
  text: T.ink, sub: T.text, muted: T.subText,
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g50: T.tintEmerald,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
  scrim: T.scrim,
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PAYMENT_METHODS = [
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'credit-card' },
  { key: 'CASH', label: 'Cash', icon: 'dollar-sign' },
  { key: 'UPI', label: 'UPI', icon: 'smartphone' },
  { key: 'CHEQUE', label: 'Cheque', icon: 'file-text' },
];

const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString('en-IN');
};

export default function StaffPayrollScreen({ navigation }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState({});

  // Payment modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [txnId, setTxnId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paying, setPaying] = useState(false);

  // Detail expand
  const [expandedId, setExpandedId] = useState(null);

  // Paid tracking (local since backend is placeholder)
  const [paidMap, setPaidMap] = useState({});

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const fetchPayroll = useCallback(async () => {
    try {
      const data = await getStaffPayroll(month, year);
      setPayroll(data?.payroll || []);
      setSummary(data?.summary || {});
    } catch (error) {
      console.log('Error fetching payroll:', error);
      showError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    setLoading(true);
    setPaidMap({});
    setExpandedId(null);
    fetchPayroll();
  }, [fetchPayroll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayroll();
    setRefreshing(false);
  }, [fetchPayroll]);

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const openPayModal = (item) => {
    setSelectedStaff(item);
    setPayMethod('BANK_TRANSFER');
    setTxnId('');
    setRemarks('');
    setModalVisible(true);
  };

  const handlePay = async () => {
    if (!selectedStaff) return;
    setPaying(true);
    try {
      await markStaffPayment({
        staffId: selectedStaff.staffId,
        month,
        year,
        netSalary: selectedStaff.netSalary,
        paymentMethod: payMethod,
        transactionId: txnId || undefined,
        remarks: remarks || undefined,
      });
      setPaidMap((prev) => ({ ...prev, [selectedStaff.staffId]: { method: payMethod, txnId, date: new Date() } }));
      setModalVisible(false);
      showSuccess(`Payment marked for ${selectedStaff.staff?.name}`);
    } catch (error) {
      console.log('Error marking payment:', error);
      showError('Failed to mark payment');
    } finally {
      setPaying(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Computed
  const totalPaid = payroll.filter((p) => paidMap[p.staffId]).reduce((s, p) => s + p.netSalary, 0);
  const totalPending = (summary?.totalNetSalary || 0) - totalPaid;
  const paidCount = payroll.filter((p) => paidMap[p.staffId]).length;

  const GradHeader = () => (
    <LinearGradient colors={G.hero} style={styles.header}>
      <AnimatedOrb style={styles.orbA} />
      <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Icon name="arrow-left" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={onRefresh} style={styles.refreshCircle}>
            <Icon name="refresh-cw" size={rs(17)} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="cash-multiple" size={rs(12)} color={C.g400} />
          <Text style={styles.heroBadgeTxt}>Team Finance</Text>
        </View>
        <Text style={styles.bigTitle}>Staff Payroll</Text>
        <Text style={styles.bigSub}>{MONTH_NAMES[month]} {year}</Text>

        <View style={{ height: rs(30) }} />
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <GradHeader />
        <View style={styles.loader}><ActivityIndicator size="large" color={C.g600} /></View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <GradHeader />

      {/* Floating stats card — tucks into the hero's bottom curve */}
      <View style={styles.statsWrap}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: C.blue }]}>{summary?.totalStaff || 0}</Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: C.purple }]}>{fmt(summary?.totalBaseSalary)}</Text>
            <Text style={styles.statLabel}>Base</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: C.g600 }]}>{fmt(totalPaid)}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: C.amber }]}>{fmt(totalPending)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Month picker — fixed row, kept outside the ScrollView so it never
          shifts while the list scrolls. */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow} activeOpacity={0.6}>
          <Icon name="chevron-left" size={rs(20)} color={C.text} />
        </TouchableOpacity>
        <View style={styles.monthPill}>
          <Icon name="calendar" size={rs(14)} color={C.g600} />
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        </View>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.monthArrow, isCurrentMonth && { opacity: 0.25 }]}
          disabled={isCurrentMonth}
          activeOpacity={0.6}
        >
          <Icon name="chevron-right" size={rs(20)} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Payment Progress</Text>
            <Text style={styles.progressCount}>{paidCount}/{payroll.length} paid</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: payroll.length > 0 ? `${(paidCount / payroll.length) * 100}%` : '0%' }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressNet}>Net Payable: <Text style={{ fontWeight: '800', color: C.text }}>{fmt(summary?.totalNetSalary)}</Text></Text>
            <Text style={styles.progressDays}>{summary?.daysInMonth || 0} days</Text>
          </View>
        </View>

        {/* Staff Payroll Cards */}
        {payroll.length === 0 ? (
          <View style={styles.emptyCardWrap}>
            <View style={styles.emptyArt}>
              <View style={styles.emptyArtCardBack} />
              <View style={styles.emptyArtCard}>
                <Icon name="inbox" size={rs(36)} color={C.g500} />
              </View>
              <View style={styles.emptyArtDot} />
              <View style={styles.emptyArtTag}>
                <Text style={styles.emptyArtTagTxt}>NO DATA</Text>
              </View>
            </View>
            <Text style={styles.emptyTitle}>No Payroll Data</Text>
            <Text style={styles.emptyDesc}>Add staff members with salary to see payroll</Text>
          </View>
        ) : (
          <View style={styles.staffSection}>
            <Text style={styles.sectionTitle}>STAFF SALARIES</Text>
            {payroll.map((item) => {
              const isPaid = !!paidMap[item.staffId];
              const isOpen = expandedId === item.staffId;
              const s = item.staff || {};
              const railColors = isPaid ? [C.g500, C.g700] : [C.amber, shade(C.amber, -20)];
              return (
                <View key={item.staffId} style={[styles.staffCard, isPaid && styles.staffCardPaid]}>
                  <LinearGradient colors={railColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cardRail} />
                  <View style={styles.cardInnerWrap}>
                    {/* Top row */}
                    <TouchableOpacity style={styles.cardTop} onPress={() => toggleExpand(item.staffId)} activeOpacity={0.6}>
                      <View style={[styles.cardAvatar, isPaid && { backgroundColor: C.g50 }]}>
                        <Text style={[styles.cardAvatarText, isPaid && { color: C.g700 }]}>
                          {s.name?.charAt(0)?.toUpperCase() || 'S'}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.cardNameRow}>
                          <Text style={styles.cardName} numberOfLines={1}>{s.name || 'Staff'}</Text>
                          {isPaid && (
                            <View style={styles.paidBadge}>
                              <Icon name="check" size={9} color="#fff" />
                              <Text style={styles.paidBadgeText}>PAID</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.cardMeta}>
                          {s.role ? <Text style={styles.cardRole}>{s.role}</Text> : null}
                          {s.phone ? <Text style={styles.cardPhone}>{s.phone}</Text> : null}
                        </View>
                      </View>
                      <View style={styles.cardRight}>
                        <Text style={[styles.cardNetSalary, isPaid && { color: C.g700 }]}>{fmt(item.netSalary)}</Text>
                        <Text style={styles.cardNetLabel}>Net Pay</Text>
                      </View>
                      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={rs(16)} color={C.muted} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    {/* Salary Breakdown Visual */}
                    <View style={styles.calcBox}>
                      {/* Full Salary → Earned → Cut */}
                      <View style={styles.salaryRow}>
                        <View style={styles.salaryBlock}>
                          <Text style={styles.salaryBlockLabel}>Monthly Salary</Text>
                          <Text style={styles.salaryBlockVal}>{fmt(item.baseSalary)}</Text>
                        </View>
                        <Icon name="arrow-right" size={14} color={C.muted} />
                        <View style={[styles.salaryBlock, styles.salaryBlockEarned]}>
                          <Text style={styles.salaryBlockLabel}>Earned</Text>
                          <Text style={[styles.salaryBlockVal, { color: C.g600 }]}>{fmt(item.netSalary)}</Text>
                        </View>
                        <View style={[styles.salaryBlock, styles.salaryBlockCut]}>
                          <Text style={styles.salaryBlockLabel}>Deducted</Text>
                          <Text style={[styles.salaryBlockVal, { color: C.red }]}>{fmt(item.baseSalary - item.netSalary)}</Text>
                        </View>
                      </View>

                      {/* Salary progress bar: earned vs total */}
                      <View style={styles.salaryBarWrap}>
                        <View style={styles.salaryBarBg}>
                          <View style={[styles.salaryBarEarned, { width: item.baseSalary > 0 ? `${(item.netSalary / item.baseSalary) * 100}%` : '0%' }]} />
                        </View>
                        <View style={styles.salaryBarLabels}>
                          <Text style={styles.salaryBarPct}>
                            {item.baseSalary > 0 ? Math.round((item.netSalary / item.baseSalary) * 100) : 0}% earned
                          </Text>
                          <Text style={styles.salaryBarRight}>
                            {item.effectiveDays}/{item.workingDays} days
                          </Text>
                        </View>
                      </View>

                      {/* Attendance breakdown */}
                      <View style={styles.attBar}>
                        <View style={styles.attItem}>
                          <View style={[styles.attDot, { backgroundColor: C.g600 }]} />
                          <Text style={styles.attText}>{item.presentDays} present</Text>
                        </View>
                        <View style={styles.attItem}>
                          <View style={[styles.attDot, { backgroundColor: C.red }]} />
                          <Text style={styles.attText}>{item.absentDays} absent</Text>
                        </View>
                        <View style={styles.attItem}>
                          <View style={[styles.attDot, { backgroundColor: C.amber }]} />
                          <Text style={styles.attText}>{item.leaveDays} leave</Text>
                        </View>
                        {item.halfDays > 0 && (
                          <View style={styles.attItem}>
                            <View style={[styles.attDot, { backgroundColor: '#F97316' }]} />
                            <Text style={styles.attText}>{item.halfDays} half</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Expanded Detail */}
                    {isOpen && (
                      <View style={styles.detailBox}>
                        <View style={styles.detailGrid}>
                          <DetailRow label="Monthly Salary" value={`${fmt(item.baseSalary)}`} />
                          <DetailRow label="Days in Month" value={`${item.workingDays}`} />
                          <DetailRow label="Present (Effective)" value={`${item.effectiveDays} days`} color={C.g600} />
                          <DetailRow label="Gross Salary" value={`${fmt(item.grossSalary)}`} />
                          {item.deductions > 0 && <DetailRow label="Deductions" value={`- ${fmt(item.deductions)}`} color={C.red} />}
                          <View style={styles.detailDivider} />
                          <DetailRow label="Net Salary" value={`${fmt(item.netSalary)}`} bold color={C.g600} />
                        </View>

                        {/* Bank Info */}
                        {(s.bankName || s.accountNumber) && (
                          <View style={styles.bankBox}>
                            <Icon name="credit-card" size={13} color={C.blue} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.bankName}>{s.bankName || 'Bank'}</Text>
                              <Text style={styles.bankAcc}>A/C: {s.accountNumber ? `****${s.accountNumber.slice(-4)}` : 'N/A'}</Text>
                            </View>
                            {s.ifscCode ? <Text style={styles.bankIfsc}>{s.ifscCode}</Text> : null}
                          </View>
                        )}

                        {/* Pay Button */}
                        {!isPaid && (
                          <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(item)} activeOpacity={0.7}>
                            <Icon name="send" size={15} color="#fff" />
                            <Text style={styles.payBtnText}>Mark as Paid - {fmt(item.netSalary)}</Text>
                          </TouchableOpacity>
                        )}
                        {isPaid && paidMap[item.staffId] && (
                          <View style={styles.paidInfo}>
                            <Icon name="check-circle" size={14} color={C.g600} />
                            <Text style={styles.paidInfoText}>
                              Paid via {PAYMENT_METHODS.find(m => m.key === paidMap[item.staffId].method)?.label || paidMap[item.staffId].method}
                              {paidMap[item.staffId].txnId ? ` (${paidMap[item.staffId].txnId})` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>

            <ScrollView contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              <View style={styles.mHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mTitle}>Mark Payment</Text>
                  <Text style={styles.mSub}>{selectedStaff?.staff?.name} - {MONTH_SHORT[month]} {year}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.mCloseBtn}>
                  <Icon name="x" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.mBody}>
                {/* Amount */}
                <View style={styles.mAmountCard}>
                  <Text style={styles.mAmountLabel}>Net Salary</Text>
                  <Text style={styles.mAmountVal}>{fmt(selectedStaff?.netSalary)}</Text>
                  <View style={styles.mAmountRow}>
                    <Text style={styles.mAmountSub}>Base: {fmt(selectedStaff?.baseSalary)}</Text>
                    <Text style={styles.mAmountSub}>Effective: {selectedStaff?.effectiveDays}d</Text>
                  </View>
                </View>

                {/* Payment Method */}
                <Text style={styles.mLabel}>Payment Method</Text>
                <View style={styles.methodGrid}>
                  {PAYMENT_METHODS.map((m) => {
                    const active = payMethod === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.methodBtn, active && styles.methodBtnActive]}
                        onPress={() => setPayMethod(m.key)}
                        activeOpacity={0.6}
                      >
                        <Icon name={m.icon} size={18} color={active ? C.g600 : C.muted} />
                        <Text style={[styles.methodBtnText, active && styles.methodBtnTextActive]}>{m.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Txn ID */}
                <Text style={styles.mLabel}>Transaction ID (Optional)</Text>
                <TextInput
                  style={styles.mInput}
                  placeholder="Enter transaction/reference ID"
                  placeholderTextColor={C.muted}
                  value={txnId}
                  onChangeText={setTxnId}
                />

                {/* Remarks */}
                <Text style={styles.mLabel}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.mInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Add any notes..."
                  placeholderTextColor={C.muted}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                />

                {/* Confirm */}
                <TouchableOpacity
                  style={[styles.confirmBtn, paying && { opacity: 0.6 }]}
                  onPress={handlePay}
                  disabled={paying}
                  activeOpacity={0.7}
                >
                  {paying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={18} color="#fff" />
                      <Text style={styles.confirmBtnText}>Confirm Payment - {fmt(selectedStaff?.netSalary)}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, bold, color }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, bold && { fontWeight: '700', color: C.text }]}>{label}</Text>
      <Text style={[styles.detailValue, bold && { fontWeight: '800', fontSize: 14 }, color && { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero header
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerSafe: { paddingHorizontal: GUT },
  orbA: {
    position: 'absolute', top: -rs(46), right: -rs(30), width: rs(150), height: rs(150),
    borderRadius: rs(75), backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(40), left: -rs(34), width: rs(120), height: rs(120),
    borderRadius: rs(60), backgroundColor: 'rgba(255,255,255,0.045)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(4), marginBottom: rs(14) },
  backCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  heroBadgeTxt: { fontSize: rf(11), fontWeight: '600', color: C.g400, fontFamily: DISPLAY },
  bigTitle: { fontSize: rf(24), fontWeight: '700', color: '#fff', fontFamily: DISPLAY, letterSpacing: 0.2, marginBottom: 3 },
  bigSub: { fontSize: rf(12.5), color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: DISPLAY },

  // Floating stats card
  statsWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: C.card, borderRadius: rs(16),
    paddingVertical: 13,
    borderWidth: 1, borderColor: C.glassBorder,
    ...cardShadow,
  },
  statDiv: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: rf(15), fontWeight: '800', fontFamily: DISPLAY, marginBottom: 2 },
  statLabel: { fontSize: rf(9), fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Month picker (fixed row)
  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: GUT, marginTop: rs(14), marginBottom: 2,
  },
  monthArrow: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border, ...rowShadow,
  },
  monthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: rs(12), borderWidth: 1, borderColor: C.border, ...rowShadow,
  },
  monthLabel: { fontSize: rf(15), fontWeight: '700', color: C.text, fontFamily: DISPLAY },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(14), paddingBottom: rs(100) },

  // Progress
  progressCard: {
    backgroundColor: C.card, borderRadius: rs(14), padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: rs(14), ...rowShadow,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: rf(13), fontWeight: '700', color: C.text, fontFamily: DISPLAY },
  progressCount: { fontSize: rf(11), fontWeight: '700', color: C.g600 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: C.bg, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: C.g600 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressNet: { fontSize: rf(11), color: C.muted, fontWeight: '600' },
  progressDays: { fontSize: rf(11), color: C.muted, fontWeight: '600' },

  // Section
  staffSection: { marginTop: 2 },
  sectionTitle: { fontSize: rf(11), fontWeight: '800', color: C.muted, marginBottom: 10, letterSpacing: 1.2, fontFamily: DISPLAY },

  // Staff Card
  staffCard: {
    flexDirection: 'row',
    backgroundColor: C.card, borderRadius: rs(14), marginBottom: 10,
    borderWidth: 1, borderColor: C.glassBorder, overflow: 'hidden', ...cardShadow,
  },
  staffCardPaid: { borderColor: C.g50 },
  cardRail: { width: 4 },
  cardInnerWrap: { flex: 1, minWidth: 0 },

  cardTop: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
  },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.purpleL,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardAvatarText: { fontSize: 16, fontWeight: '800', color: C.purple, fontFamily: DISPLAY },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: rf(14), fontWeight: '700', color: C.text, flex: 1, fontFamily: DISPLAY },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.g600, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  paidBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  cardRole: { fontSize: 10, fontWeight: '700', color: C.blue, textTransform: 'capitalize' },
  cardPhone: { fontSize: 10, color: C.muted },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  cardNetSalary: { fontSize: rf(16), fontWeight: '800', color: C.text, fontFamily: DISPLAY },
  cardNetLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },

  // Salary Breakdown Box
  calcBox: {
    marginHorizontal: 12, marginBottom: 12, backgroundColor: C.bg,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border,
  },
  salaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  salaryBlock: {
    flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  salaryBlockEarned: { borderColor: C.g50, backgroundColor: C.g50 },
  salaryBlockCut: { borderColor: C.redL, backgroundColor: C.redL },
  salaryBlockLabel: { fontSize: 8, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  salaryBlockVal: { fontSize: 14, fontWeight: '900', color: C.text, marginTop: 2, fontFamily: DISPLAY },
  salaryBarWrap: { marginBottom: 10 },
  salaryBarBg: { height: 8, borderRadius: 4, backgroundColor: C.redL, overflow: 'hidden' },
  salaryBarEarned: { height: 8, borderRadius: 4, backgroundColor: C.g600 },
  salaryBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  salaryBarPct: { fontSize: 10, fontWeight: '800', color: C.g600 },
  salaryBarRight: { fontSize: 10, fontWeight: '600', color: C.muted },

  // Attendance Bar
  attBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  attItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attDot: { width: 7, height: 7, borderRadius: 4 },
  attText: { fontSize: 10, color: C.muted, fontWeight: '600' },

  // Detail Box
  detailBox: {
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  detailGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: C.muted, fontWeight: '500' },
  detailValue: { fontSize: 12, color: C.sub, fontWeight: '700' },
  detailDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  // Bank Box
  bankBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, backgroundColor: C.blueL, borderRadius: 10, padding: 10,
  },
  bankName: { fontSize: 11, fontWeight: '700', color: C.text },
  bankAcc: { fontSize: 10, color: C.muted, marginTop: 1 },
  bankIfsc: { fontSize: 9, fontWeight: '700', color: C.blue, backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // Pay Button
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, backgroundColor: C.g600, paddingVertical: 12, borderRadius: 12,
    ...rowShadow,
  },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: DISPLAY },

  paidInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: C.g50, borderRadius: 10, padding: 10,
  },
  paidInfoText: { fontSize: 11, color: C.g700, fontWeight: '600', flex: 1 },

  // Empty
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: 20, paddingVertical: rs(30),
    marginTop: rs(2),
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
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 4, fontFamily: DISPLAY, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: C.muted, textAlign: 'center' },

  // Modal — ScrollView lives INSIDE modalContent (after the sheet handle),
  // wrapping header + body + confirm button. modalContent is height-capped
  // with overflow:'hidden' and is NOT itself wrapped in an outer ScrollView.
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '92%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4, backgroundColor: C.card },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border },

  mHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  mTitle: { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.3, fontFamily: DISPLAY },
  mSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  mCloseBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  mBody: { paddingHorizontal: 20, paddingTop: 16 },

  // Amount Card
  mAmountCard: {
    backgroundColor: C.g50, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: C.g50, alignItems: 'center', marginBottom: 20,
  },
  mAmountLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  mAmountVal: { fontSize: 32, fontWeight: '900', color: C.g600, marginVertical: 4, fontFamily: DISPLAY },
  mAmountRow: { flexDirection: 'row', gap: 16 },
  mAmountSub: { fontSize: 11, color: C.muted, fontWeight: '600' },

  // Labels
  mLabel: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 8, marginTop: 4 },

  // Method Grid
  methodGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 4,
  },
  methodBtnActive: { borderColor: C.g600, backgroundColor: C.g50 },
  methodBtnText: { fontSize: 10, fontWeight: '600', color: C.muted },
  methodBtnTextActive: { color: C.g600, fontWeight: '700' },

  // Input
  mInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: C.text,
    marginBottom: 14,
  },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.g600, paddingVertical: 15, borderRadius: 14,
    ...cardShadow,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, fontFamily: DISPLAY },
});
