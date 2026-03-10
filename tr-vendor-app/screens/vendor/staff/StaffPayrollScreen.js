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
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getStaffPayroll, markStaffPayment } from '../../api/staff-api';
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
  blueBg: '#EFF6FF',
  orange: '#F59E0B',
  orangeBg: '#FFFBEB',
  red: '#EF4444',
  redBg: '#FEF2F2',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  teal: '#14B8A6',
  tealBg: '#F0FDFA',
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

const shadow = (elev = 4) => Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: elev / 2 }, shadowOpacity: 0.08, shadowRadius: elev },
  android: { elevation: elev / 2 },
});

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

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.headerBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={st.headerTitle}>Payroll</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={st.loader}><ActivityIndicator size="large" color={C.brand} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.headerBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Payroll</Text>
        <TouchableOpacity onPress={onRefresh} style={st.headerBtn}>
          <Icon name="refresh-cw" size={17} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Month Picker */}
        <View style={st.monthBar}>
          <TouchableOpacity onPress={goToPrevMonth} style={st.monthArrow} activeOpacity={0.6}>
            <Icon name="chevron-left" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={st.monthPill}>
            <Icon name="calendar" size={14} color={C.brand} />
            <Text style={st.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          </View>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[st.monthArrow, isCurrentMonth && { opacity: 0.25 }]}
            disabled={isCurrentMonth}
            activeOpacity={0.6}
          >
            <Icon name="chevron-right" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={st.summaryGrid}>
          <View style={[st.summaryCard, { borderLeftColor: C.blue }]}>
            <View style={[st.summaryIcon, { backgroundColor: C.blueBg }]}>
              <Icon name="users" size={16} color={C.blue} />
            </View>
            <Text style={st.summaryVal}>{summary?.totalStaff || 0}</Text>
            <Text style={st.summaryLbl}>Total Staff</Text>
          </View>
          <View style={[st.summaryCard, { borderLeftColor: C.purple }]}>
            <View style={[st.summaryIcon, { backgroundColor: C.purpleBg }]}>
              <Icon name="briefcase" size={16} color={C.purple} />
            </View>
            <Text style={st.summaryVal}>{fmt(summary?.totalBaseSalary)}</Text>
            <Text style={st.summaryLbl}>Base Salary</Text>
          </View>
          <View style={[st.summaryCard, { borderLeftColor: C.brand }]}>
            <View style={[st.summaryIcon, { backgroundColor: C.brandLight }]}>
              <Icon name="check-circle" size={16} color={C.brand} />
            </View>
            <Text style={[st.summaryVal, { color: C.brand }]}>{fmt(totalPaid)}</Text>
            <Text style={st.summaryLbl}>Paid</Text>
          </View>
          <View style={[st.summaryCard, { borderLeftColor: C.orange }]}>
            <View style={[st.summaryIcon, { backgroundColor: C.orangeBg }]}>
              <Icon name="clock" size={16} color={C.orange} />
            </View>
            <Text style={[st.summaryVal, { color: C.orange }]}>{fmt(totalPending)}</Text>
            <Text style={st.summaryLbl}>Pending</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={st.progressCard}>
          <View style={st.progressTop}>
            <Text style={st.progressTitle}>Payment Progress</Text>
            <Text style={st.progressCount}>{paidCount}/{payroll.length} paid</Text>
          </View>
          <View style={st.progressBarBg}>
            <View style={[st.progressBarFill, { width: payroll.length > 0 ? `${(paidCount / payroll.length) * 100}%` : '0%' }]} />
          </View>
          <View style={st.progressFooter}>
            <Text style={st.progressNet}>Net Payable: <Text style={{ fontWeight: '800', color: C.text }}>{fmt(summary?.totalNetSalary)}</Text></Text>
            <Text style={st.progressDays}>{summary?.daysInMonth || 0} days</Text>
          </View>
        </View>

        {/* Staff Payroll Cards */}
        {payroll.length === 0 ? (
          <View style={st.emptyWrap}>
            <View style={st.emptyCircle}>
              <Icon name="inbox" size={36} color={C.muted} />
            </View>
            <Text style={st.emptyTitle}>No Payroll Data</Text>
            <Text style={st.emptyDesc}>Add staff members with salary to see payroll</Text>
          </View>
        ) : (
          <View style={st.staffSection}>
            <Text style={st.sectionTitle}>Staff Salaries</Text>
            {payroll.map((item) => {
              const isPaid = !!paidMap[item.staffId];
              const isOpen = expandedId === item.staffId;
              const s = item.staff || {};
              return (
                <View key={item.staffId} style={[st.staffCard, isPaid && st.staffCardPaid]}>
                  {/* Top row */}
                  <TouchableOpacity style={st.cardTop} onPress={() => toggleExpand(item.staffId)} activeOpacity={0.6}>
                    <View style={[st.cardAvatar, isPaid && { backgroundColor: C.brandLight }]}>
                      <Text style={[st.cardAvatarText, isPaid && { color: C.brand }]}>
                        {s.name?.charAt(0)?.toUpperCase() || 'S'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={st.cardNameRow}>
                        <Text style={st.cardName} numberOfLines={1}>{s.name || 'Staff'}</Text>
                        {isPaid && (
                          <View style={st.paidBadge}>
                            <Icon name="check" size={9} color="#fff" />
                            <Text style={st.paidBadgeText}>PAID</Text>
                          </View>
                        )}
                      </View>
                      <View style={st.cardMeta}>
                        {s.role ? <Text style={st.cardRole}>{s.role}</Text> : null}
                        {s.phone ? <Text style={st.cardPhone}>{s.phone}</Text> : null}
                      </View>
                    </View>
                    <View style={st.cardRight}>
                      <Text style={[st.cardNetSalary, isPaid && { color: C.brand }]}>{fmt(item.netSalary)}</Text>
                      <Text style={st.cardNetLabel}>Net Pay</Text>
                    </View>
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>

                  {/* Salary Breakdown Visual */}
                  <View style={st.calcBox}>
                    {/* Full Salary → Earned → Cut */}
                    <View style={st.salaryRow}>
                      <View style={st.salaryBlock}>
                        <Text style={st.salaryBlockLabel}>Monthly Salary</Text>
                        <Text style={st.salaryBlockVal}>{fmt(item.baseSalary)}</Text>
                      </View>
                      <Icon name="arrow-right" size={14} color={C.muted} />
                      <View style={[st.salaryBlock, st.salaryBlockEarned]}>
                        <Text style={st.salaryBlockLabel}>Earned</Text>
                        <Text style={[st.salaryBlockVal, { color: C.brand }]}>{fmt(item.netSalary)}</Text>
                      </View>
                      <View style={[st.salaryBlock, st.salaryBlockCut]}>
                        <Text style={st.salaryBlockLabel}>Deducted</Text>
                        <Text style={[st.salaryBlockVal, { color: C.red }]}>{fmt(item.baseSalary - item.netSalary)}</Text>
                      </View>
                    </View>

                    {/* Salary progress bar: earned vs total */}
                    <View style={st.salaryBarWrap}>
                      <View style={st.salaryBarBg}>
                        <View style={[st.salaryBarEarned, { width: item.baseSalary > 0 ? `${(item.netSalary / item.baseSalary) * 100}%` : '0%' }]} />
                      </View>
                      <View style={st.salaryBarLabels}>
                        <Text style={st.salaryBarPct}>
                          {item.baseSalary > 0 ? Math.round((item.netSalary / item.baseSalary) * 100) : 0}% earned
                        </Text>
                        <Text style={st.salaryBarRight}>
                          {item.effectiveDays}/{item.workingDays} days
                        </Text>
                      </View>
                    </View>

                    {/* Attendance breakdown */}
                    <View style={st.attBar}>
                      <View style={st.attItem}>
                        <View style={[st.attDot, { backgroundColor: C.brand }]} />
                        <Text style={st.attText}>{item.presentDays} present</Text>
                      </View>
                      <View style={st.attItem}>
                        <View style={[st.attDot, { backgroundColor: C.red }]} />
                        <Text style={st.attText}>{item.absentDays} absent</Text>
                      </View>
                      <View style={st.attItem}>
                        <View style={[st.attDot, { backgroundColor: C.orange }]} />
                        <Text style={st.attText}>{item.leaveDays} leave</Text>
                      </View>
                      {item.halfDays > 0 && (
                        <View style={st.attItem}>
                          <View style={[st.attDot, { backgroundColor: '#F97316' }]} />
                          <Text style={st.attText}>{item.halfDays} half</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Expanded Detail */}
                  {isOpen && (
                    <View style={st.detailBox}>
                      <View style={st.detailGrid}>
                        <DetailRow label="Monthly Salary" value={`${fmt(item.baseSalary)}`} />
                        <DetailRow label="Days in Month" value={`${item.workingDays}`} />
                        <DetailRow label="Present (Effective)" value={`${item.effectiveDays} days`} color={C.brand} />
                        <DetailRow label="Gross Salary" value={`${fmt(item.grossSalary)}`} />
                        {item.deductions > 0 && <DetailRow label="Deductions" value={`- ${fmt(item.deductions)}`} color={C.red} />}
                        <View style={st.detailDivider} />
                        <DetailRow label="Net Salary" value={`${fmt(item.netSalary)}`} bold color={C.brand} />
                      </View>

                      {/* Bank Info */}
                      {(s.bankName || s.accountNumber) && (
                        <View style={st.bankBox}>
                          <Icon name="credit-card" size={13} color={C.blue} />
                          <View style={{ flex: 1 }}>
                            <Text style={st.bankName}>{s.bankName || 'Bank'}</Text>
                            <Text style={st.bankAcc}>A/C: {s.accountNumber ? `****${s.accountNumber.slice(-4)}` : 'N/A'}</Text>
                          </View>
                          {s.ifscCode ? <Text style={st.bankIfsc}>{s.ifscCode}</Text> : null}
                        </View>
                      )}

                      {/* Pay Button */}
                      {!isPaid && (
                        <TouchableOpacity style={st.payBtn} onPress={() => openPayModal(item)} activeOpacity={0.7}>
                          <Icon name="send" size={15} color="#fff" />
                          <Text style={st.payBtnText}>Mark as Paid - {fmt(item.netSalary)}</Text>
                        </TouchableOpacity>
                      )}
                      {isPaid && paidMap[item.staffId] && (
                        <View style={st.paidInfo}>
                          <Icon name="check-circle" size={14} color={C.brand} />
                          <Text style={st.paidInfoText}>
                            Paid via {PAYMENT_METHODS.find(m => m.key === paidMap[item.staffId].method)?.label || paidMap[item.staffId].method}
                            {paidMap[item.staffId].txnId ? ` (${paidMap[item.staffId].txnId})` : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={st.mOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={st.mSheet} activeOpacity={1} onPress={() => {}}>
            <View style={st.mHandle}><View style={st.mHandleBar} /></View>

            <View style={st.mHeader}>
              <View style={{ flex: 1 }}>
                <Text style={st.mTitle}>Mark Payment</Text>
                <Text style={st.mSub}>{selectedStaff?.staff?.name} - {MONTH_SHORT[month]} {year}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={st.mCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={st.mBody} showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={st.mAmountCard}>
                <Text style={st.mAmountLabel}>Net Salary</Text>
                <Text style={st.mAmountVal}>{fmt(selectedStaff?.netSalary)}</Text>
                <View style={st.mAmountRow}>
                  <Text style={st.mAmountSub}>Base: {fmt(selectedStaff?.baseSalary)}</Text>
                  <Text style={st.mAmountSub}>Effective: {selectedStaff?.effectiveDays}d</Text>
                </View>
              </View>

              {/* Payment Method */}
              <Text style={st.mLabel}>Payment Method</Text>
              <View style={st.methodGrid}>
                {PAYMENT_METHODS.map((m) => {
                  const active = payMethod === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[st.methodBtn, active && st.methodBtnActive]}
                      onPress={() => setPayMethod(m.key)}
                      activeOpacity={0.6}
                    >
                      <Icon name={m.icon} size={18} color={active ? C.brand : C.muted} />
                      <Text style={[st.methodBtnText, active && st.methodBtnTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Txn ID */}
              <Text style={st.mLabel}>Transaction ID (Optional)</Text>
              <TextInput
                style={st.mInput}
                placeholder="Enter transaction/reference ID"
                placeholderTextColor={C.muted}
                value={txnId}
                onChangeText={setTxnId}
              />

              {/* Remarks */}
              <Text style={st.mLabel}>Remarks (Optional)</Text>
              <TextInput
                style={[st.mInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Add any notes..."
                placeholderTextColor={C.muted}
                value={remarks}
                onChangeText={setRemarks}
                multiline
              />
            </ScrollView>

            {/* Footer */}
            <View style={st.mFooter}>
              <TouchableOpacity
                style={[st.confirmBtn, paying && { opacity: 0.6 }]}
                onPress={handlePay}
                disabled={paying}
                activeOpacity={0.7}
              >
                {paying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check-circle" size={18} color="#fff" />
                    <Text style={st.confirmBtnText}>Confirm Payment - {fmt(selectedStaff?.netSalary)}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, bold, color }) {
  return (
    <View style={st.detailRow}>
      <Text style={[st.detailLabel, bold && { fontWeight: '700', color: C.text }]}>{label}</Text>
      <Text style={[st.detailValue, bold && { fontWeight: '800', fontSize: 14 }, color && { color }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, ...shadow(3),
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },

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

  // Summary
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginHorizontal: 16, marginTop: 14,
  },
  summaryCard: {
    width: (Dimensions.get('window').width - 42) / 2,
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 3,
    ...shadow(3),
  },
  summaryIcon: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  summaryVal: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 2 },
  summaryLbl: { fontSize: 10, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Progress
  progressCard: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, ...shadow(3),
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  progressCount: { fontSize: 11, fontWeight: '700', color: C.brand },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: C.brand },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressNet: { fontSize: 11, color: C.muted, fontWeight: '600' },
  progressDays: { fontSize: 11, color: C.muted, fontWeight: '600' },

  // Section
  staffSection: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 10, letterSpacing: -0.2 },

  // Staff Card
  staffCard: {
    backgroundColor: C.surface, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...shadow(3),
  },
  staffCardPaid: { borderColor: C.brandLight },

  cardTop: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardAvatarText: { fontSize: 16, fontWeight: '800', color: C.purple },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  paidBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  cardRole: { fontSize: 10, fontWeight: '700', color: C.blue, textTransform: 'capitalize' },
  cardPhone: { fontSize: 10, color: C.muted },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  cardNetSalary: { fontSize: 16, fontWeight: '800', color: C.text },
  cardNetLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },

  // Salary Breakdown Box
  calcBox: {
    marginHorizontal: 14, marginBottom: 12, backgroundColor: '#F8FAFC',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.borderLight,
  },
  salaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
  },
  salaryBlock: {
    flex: 1, backgroundColor: C.surface, borderRadius: 10, padding: 8,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  salaryBlockEarned: { borderColor: C.brandLight, backgroundColor: '#F0FDF4' },
  salaryBlockCut: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  salaryBlockLabel: { fontSize: 8, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  salaryBlockVal: { fontSize: 14, fontWeight: '900', color: C.text, marginTop: 2 },
  salaryBarWrap: { marginBottom: 10 },
  salaryBarBg: { height: 8, borderRadius: 4, backgroundColor: '#FEE2E2', overflow: 'hidden' },
  salaryBarEarned: { height: 8, borderRadius: 4, backgroundColor: C.brand },
  salaryBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  salaryBarPct: { fontSize: 10, fontWeight: '800', color: C.brand },
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
    backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  detailGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: C.muted, fontWeight: '500' },
  detailValue: { fontSize: 12, color: C.textSec, fontWeight: '700' },
  detailDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  // Bank Box
  bankBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, backgroundColor: C.blueBg, borderRadius: 10, padding: 10,
  },
  bankName: { fontSize: 11, fontWeight: '700', color: C.text },
  bankAcc: { fontSize: 10, color: C.muted, marginTop: 1 },
  bankIfsc: { fontSize: 9, fontWeight: '700', color: C.blue, backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // Pay Button
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, backgroundColor: C.brand, paddingVertical: 12, borderRadius: 12,
    ...shadow(4),
  },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  paidInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: C.brandLight, borderRadius: 10, padding: 10,
  },
  paidInfoText: { fontSize: 11, color: C.brandDark, fontWeight: '600', flex: 1 },

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
  mHandleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border },

  mHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  mTitle: { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  mSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  mCloseBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  mBody: { paddingHorizontal: 20, paddingTop: 16 },

  // Amount Card
  mAmountCard: {
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center', marginBottom: 20,
  },
  mAmountLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  mAmountVal: { fontSize: 32, fontWeight: '900', color: C.brand, marginVertical: 4 },
  mAmountRow: { flexDirection: 'row', gap: 16 },
  mAmountSub: { fontSize: 11, color: C.muted, fontWeight: '600' },

  // Labels
  mLabel: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, marginTop: 4 },

  // Method Grid
  methodGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 4,
  },
  methodBtnActive: { borderColor: C.brand, backgroundColor: '#F0FDF4' },
  methodBtnText: { fontSize: 10, fontWeight: '600', color: C.muted },
  methodBtnTextActive: { color: C.brand, fontWeight: '700' },

  // Input
  mInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: C.text,
    marginBottom: 14,
  },

  // Footer
  mFooter: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brand, paddingVertical: 15, borderRadius: 14,
    ...shadow(6),
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
