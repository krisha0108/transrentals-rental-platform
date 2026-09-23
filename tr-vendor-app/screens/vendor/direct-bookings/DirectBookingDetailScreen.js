import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, TextInput, Modal, StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getDirectBookingById, updateDirectBooking, cancelDirectBooking,
  getDirectBookingExpenses, addDirectBookingExpense, deleteDirectBookingExpense,
  getDirectBookingAssignOptions,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);
import SheetHandle from '../_shared/SheetHandle';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g300: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, subtext: T.text, muted: T.subText, border: T.border,
  blue: T.blue, indigo: T.indigo, purple: T.purple,
  amber: T.amber, orange: T.orange, red: T.red, teal: T.teal,
};

const STATUS_CONFIG = {
  inquiry:     { label: 'Inquiry',     color: C.amber,  bg: '#FEF3C7' },
  confirmed:   { label: 'Confirmed',   color: C.blue,   bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: C.purple, bg: '#F3E8FF' },
  completed:   { label: 'Completed',   color: C.g600,   bg: C.g100    },
  rejected:    { label: 'Rejected',    color: C.red,    bg: '#FEE2E2' },
  cancelled:   { label: 'Cancelled',   color: C.muted,  bg: '#F3F4F6' },
};

const STATUS_FLOW = {
  inquiry:     [{ next: 'confirmed',   label: 'Confirm Booking', color: C.g600,   icon: 'check-circle' },
                { next: 'rejected',    label: 'Reject',          color: C.red,    icon: 'x-circle'     }],
  confirmed:   [{ next: 'in_progress', label: 'Start Trip',      color: C.g600,   icon: 'play-circle'  },
                { next: 'cancelled',   label: 'Cancel',          color: C.red,    icon: 'x-circle'     }],
  in_progress: [{ next: 'completed',   label: 'Complete',        color: C.g600,   icon: 'check-circle' }],
  completed: [], rejected: [], cancelled: [],
};

const JOURNEY = ['inquiry', 'confirmed', 'in_progress', 'completed'];

const PAYMENT_CONFIG = {
  pending:     { label: 'Payment Pending', color: C.amber  },
  partial:     { label: 'Advance Paid',    color: C.orange },
  collected:   { label: 'Fully Paid',      color: C.g600   },
  link_sent:   { label: 'Link Sent',       color: C.blue   },
  paid_online: { label: 'Paid Online',     color: C.g600   },
  waived:      { label: 'Waived',          color: C.muted  },
};

const SERVICE_LABELS = {
  'car-with-driver': 'Car with Driver', 'self-drive': 'Self-Drive Car',
  bike: 'Bike Rental', bus: 'Bus & Tempo', luxury: 'Luxury Car',
  transporter: 'Transporter', 'packers-movers': 'Packers & Movers',
  equipment: 'Equipment Rental', general: 'General',
};

const SERVICE_ICONS = {
  'car-with-driver': 'car',           'self-drive': 'car-side',
  bike: 'motorbike',                  bus: 'bus',
  luxury: 'car-sports',               transporter: 'truck',
  'packers-movers': 'package-variant',equipment: 'wrench',
  general: 'clipboard-text',
};

const EXPENSE_CATEGORIES = [
  { value: 'fuel',           label: 'Fuel',       icon: 'gas-station'       },
  { value: 'driver_payment', label: 'Driver Pay', icon: 'account'           },
  { value: 'toll',           label: 'Toll',       icon: 'road-variant'      },
  { value: 'parking',        label: 'Parking',    icon: 'parking'           },
  { value: 'maintenance',    label: 'Maintain',   icon: 'wrench'            },
  { value: 'cleaning',       label: 'Cleaning',   icon: 'broom'             },
  { value: 'other',          label: 'Other',      icon: 'dots-horizontal'   },
];

const EXTRA_KEYS = {
  'Trip type':   { icon: 'map',         label: 'Trip Type'  },
  'Pickup time': { icon: 'clock',       label: 'Time'       },
  'Passengers':  { icon: 'users',       label: 'Passengers' },
  'Helmets':     { icon: 'shield',      label: 'Helmets'    },
  'Occasion':    { icon: 'star',        label: 'Occasion'   },
  'License':     { icon: 'credit-card', label: 'License'    },
  'Use Type':    { icon: 'briefcase',   label: 'Use Type'   },
  'Truck':       { icon: 'truck',       label: 'Truck Type' },
  'Goods':       { icon: 'package',     label: 'Goods'      },
  'Weight':      { icon: 'database',    label: 'Weight'     },
  'Move size':   { icon: 'home',        label: 'Move Size'  },
  'Packing':     { icon: 'box',         label: 'Packing'    },
  'Floor info':  { icon: 'layers',      label: 'Floor Info' },
  'Duration':    { icon: 'calendar',    label: 'Duration'   },
  'Units':       { icon: 'hash',        label: 'Units'      },
};

function parseNotes(raw) {
  if (!raw) return { extras: {}, freeText: '' };
  const lines = raw.split('\n');
  const extras = {};
  const freeLines = [];
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match && EXTRA_KEYS[match[1].trim()]) {
      extras[match[1].trim()] = match[2].trim();
    } else if (line.trim()) {
      freeLines.push(line);
    }
  }
  return { extras, freeText: freeLines.join('\n').trim() };
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';
const fmtFull = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '--';

/* ── Card header helper ── */
function CardHead({ icon, iconLib = 'feather', iconColor = C.g600, bg, title, right }) {
  const IC = iconLib === 'ion' ? Ionicons : iconLib === 'mci' ? MaterialCommunityIcons : Icon;
  return (
    <View style={s.cardHead}>
      <View style={[s.cardHeadIcon, { backgroundColor: bg || iconColor + '18' }]}>
        <IC name={icon} size={17} color={iconColor} />
      </View>
      <Text style={s.cardTitle}>{title}</Text>
      {right && <View style={{ flex: 1, alignItems: 'flex-end' }}>{right}</View>}
    </View>
  );
}

export default function DirectBookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'fuel', amount: '', note: '' });
  const [savingExpense, setSavingExpense] = useState(false);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAction, setPayAction] = useState('mark_paid');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');

  // Notes
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState('');

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [assignOptions, setAssignOptions] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Custom alert state
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: null });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: null });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));
  const showConfirm = (type, title, message, confirmLabel, onConfirm, destructive = false) => {
    setAlert({
      visible: true, type, title, message,
      actions: [
        { label: 'Cancel', onPress: () => hideAlert(), variant: 'ghost' },
        { label: confirmLabel, onPress: () => { hideAlert(); onConfirm(); }, variant: 'primary', destructive },
      ],
    });
  };

  const fetchBooking = useCallback(async () => {
    try {
      const res = await getDirectBookingById(bookingId);
      const b = res?.booking || res;
      setBooking(b);
      setNotesVal(b?.vendorNotes || '');
    } catch (err) {
      console.error('[DirectBookingDetail] Error:', err);
      showAlert('error', 'Load Failed', 'Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await getDirectBookingExpenses(bookingId);
      setExpenses(res?.expenses || []);
    } catch (err) {
      console.error('[Expenses] Error:', err);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); fetchExpenses(); }, [fetchBooking, fetchExpenses]);

  const onRefresh = () => { setRefreshing(true); fetchBooking(); fetchExpenses(); };

  /* ── Status actions ── */
  const handleStatusChange = (nextStatus, label) => {
    const isDestructive = nextStatus === 'rejected' || nextStatus === 'cancelled';
    showConfirm(
      isDestructive ? 'warning' : 'success', label,
      `Are you sure you want to ${label.toLowerCase()}?`,
      'Yes, Proceed',
      async () => {
        try {
          setActionLoading(true);
          await updateDirectBooking(bookingId, { status: nextStatus });
          await fetchBooking();
          showAlert('success', 'Updated!', `Booking ${label.toLowerCase()} successfully`);
        } catch (err) {
          showAlert('error', 'Failed', err?.response?.data?.error || 'Failed to update booking');
        } finally { setActionLoading(false); }
      },
      isDestructive,
    );
  };

  /* ── Payment ── */
  const openPayModal = (action) => {
    setPayAction(action);
    const total = Number(booking?.totalAmount || 0);
    const paid = Number(booking?.paidAmount || 0);
    const bal = total > 0 ? Math.max(0, total - paid) : 0;
    setPayAmount(action === 'mark_paid' && bal > 0 ? String(bal) : '');
    setPayMode('cash');
    setShowPayModal(true);
  };

  const handlePayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return showAlert('warning', 'Invalid Amount', 'Enter a valid amount');

    if (payAction === 'whatsapp') {
      const bal = (booking.totalAmount || 0) - (booking.paidAmount || 0);
      const msg = `Hi ${booking.customerName}, your payment of ₹${bal.toLocaleString('en-IN')} is pending for booking #${booking.bookingNumber}. Please pay at your earliest convenience.`;
      Linking.openURL(`whatsapp://send?phone=91${booking.customerPhone}&text=${encodeURIComponent(msg)}`);
      setShowPayModal(false);
      return;
    }

    try {
      setActionLoading(true);
      const existingPaid = Number(booking.paidAmount || 0);
      const total = Number(booking.totalAmount || 0);
      let newPaid, newStatus, updateData;
      if (payAction === 'mark_paid') {
        newPaid = total > 0 ? total : existingPaid + amount;
        newStatus = 'collected';
        updateData = { paymentStatus: newStatus, paidAmount: newPaid, paymentMode: payMode };
        if (total <= 0) updateData.totalAmount = newPaid;
      } else {
        newPaid = existingPaid + amount;
        newStatus = (total > 0 && newPaid >= total) ? 'collected' : 'partial';
        if (total > 0 && newPaid > total) newPaid = total;
        updateData = { paymentStatus: newStatus, paidAmount: newPaid, paymentMode: payMode };
        if (total <= 0) updateData.totalAmount = newPaid;
      }
      await updateDirectBooking(bookingId, updateData);
      await fetchBooking();
      setShowPayModal(false);
      showAlert('success', 'Payment Updated', `₹${amount.toLocaleString('en-IN')} recorded successfully`);
    } catch (err) {
      showAlert('error', 'Payment Failed', 'Failed to update payment');
    } finally { setActionLoading(false); }
  };

  /* ── Expenses ── */
  const handleAddExpense = async () => {
    if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount))) return showAlert('warning', 'Invalid Amount', 'Enter a valid expense amount');
    setSavingExpense(true);
    try {
      await addDirectBookingExpense(bookingId, {
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        note: expenseForm.note || null,
      });
      await fetchExpenses();
      setExpenseForm({ category: 'fuel', amount: '', note: '' });
      setShowAddExpense(false);
    } catch (err) {
      showAlert('error', 'Failed', 'Failed to add expense');
    } finally { setSavingExpense(false); }
  };

  const handleDeleteExpense = (expenseId) => {
    showConfirm('warning', 'Delete Expense', 'Are you sure you want to delete this expense?', 'Delete', async () => {
      try {
        await deleteDirectBookingExpense(bookingId, expenseId);
        await fetchExpenses();
      } catch (err) { showAlert('error', 'Failed', 'Failed to delete expense'); }
    }, true);
  };

  /* ── Notes ── */
  const handleSaveNotes = async () => {
    try {
      await updateDirectBooking(bookingId, { vendorNotes: notesVal });
      setEditingNotes(false);
      fetchBooking();
    } catch (err) { showAlert('error', 'Failed', 'Failed to save notes'); }
  };

  /* ── Assignment ── */
  const openAssignModal = async (type) => {
    setShowAssignModal(type);
    if (!assignOptions) {
      setAssignLoading(true);
      try {
        const res = await getDirectBookingAssignOptions(booking?.pickupDate);
        setAssignOptions(res);
      } catch (err) { console.error('Assign options error:', err); }
      finally { setAssignLoading(false); }
    }
  };

  const handleAssign = async (type, id) => {
    try {
      setActionLoading(true);
      const update = type === 'driver' ? { assignedDriverId: id } : { assignedVehicleId: id };
      await updateDirectBooking(bookingId, update);
      await fetchBooking();
      setShowAssignModal(null);
      showAlert('success', 'Assigned!', `${type === 'driver' ? 'Driver' : 'Vehicle'} assigned successfully`);
    } catch (err) {
      showAlert('error', 'Failed', 'Failed to assign');
    } finally { setActionLoading(false); }
  };

  const handleRemoveAssign = async (type) => {
    showConfirm('warning', 'Remove Assignment', `Remove assigned ${type}?`, 'Remove', async () => {
      try {
        const update = type === 'driver' ? { assignedDriverId: null } : { assignedVehicleId: null };
        await updateDirectBooking(bookingId, update);
        await fetchBooking();
      } catch (err) { showAlert('error', 'Failed', 'Failed to remove assignment'); }
    }, true);
  };

  /* ── Loading ── */
  if (loading) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={s.loadingGrad}>
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 6 }}>
              <Bone w={110} h={16} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.24)' }} />
              <Bone w={90} h={11} r={4} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
            <Bone w={70} h={22} r={11} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
          </View>
          <View style={{ height: rs(22) }} />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress card skeleton */}
        <View style={s.progressWrap}>
          <View style={[s.progressCard, cardShadow]}>
            <View style={s.journeyWrap}>
              {[0,1,2,3].map(i => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.journeyLine} />}
                  <View style={s.journeyItem}>
                    <Bone w={22} h={22} r={11} />
                    <Bone w={40} h={8} r={3} />
                  </View>
                </React.Fragment>
              ))}
            </View>
            <View style={s.progressDivider} />
            <View style={s.heroStrip}>
              {[0,1,2].map(i => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.heroStripDiv} />}
                  <View style={s.heroStripItem}>
                    <Bone w={50} h={8} r={3} style={{ marginBottom: 5 }} />
                    <Bone w={60} h={14} r={4} />
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* Info card skeletons */}
        <View style={s.cards}>
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={150} h={13} r={4} />
            </View>
            <View style={s.customerRow}>
              <Bone w={48} h={48} r={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Bone w={140} h={14} r={4} />
                <Bone w={100} h={11} r={4} />
              </View>
            </View>
            <View style={s.actionRow}>
              <Bone h={40} r={12} style={{ flex: 1 }} />
              <Bone h={40} r={12} style={{ flex: 1 }} />
            </View>
          </View>

          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={110} h={13} r={4} />
            </View>
            {[0,1,2].map(i => (
              <View key={i} style={s.detailRow}>
                <Bone w={60} h={11} r={4} />
                <Bone w={100} h={11} r={4} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (!booking) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <View style={s.centered}>
        <Text style={{ color: C.muted }}>Booking not found</Text>
      </View>
    </View>
  );

  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.inquiry;
  const pc = PAYMENT_CONFIG[booking.paymentStatus] || PAYMENT_CONFIG.pending;
  const actions = STATUS_FLOW[booking.status] || [];
  const { extras, freeText } = parseNotes(booking.notes);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netEarnings = (booking.paidAmount || 0) - totalExpenses;
  const isTerminal = ['completed', 'rejected', 'cancelled'].includes(booking.status);
  const totalAmt = Number(booking.totalAmount || 0);
  const paidAmt = Number(booking.paidAmount || 0);
  const displayTotal = totalAmt > 0 ? totalAmt : paidAmt;
  const balance = totalAmt > 0 ? Math.max(0, totalAmt - paidAmt) : 0;
  const paymentPercent = displayTotal > 0 ? Math.min(100, (paidAmt / displayTotal) * 100) : 0;
  const svcIcon = SERVICE_ICONS[booking.serviceType] || 'clipboard-text';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Gradient Hero — static, stays fixed above the scrolling content ── */}
      <LinearGradient colors={G.hero} style={s.grad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.gradNum}>#{booking.bookingNumber}</Text>
              <View style={s.gradSvcRow}>
                <MaterialCommunityIcons name={svcIcon} size={13} color={C.g300} />
                <Text style={s.gradSvcText}>{SERVICE_LABELS[booking.serviceType] || booking.serviceType}</Text>
              </View>
            </View>
            <View style={[s.gradStatusPill, { backgroundColor: sc.color + '30' }]}>
              <View style={[s.gradStatusDot, { backgroundColor: sc.color }]} />
              <Text style={s.gradStatusText}>{sc.label}</Text>
            </View>
          </View>
          <View style={{ height: rs(22) }} />
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: actions.length > 0 ? 120 : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress card — journey + amounts, tucks into the hero's curve ── */}
        <View style={s.progressWrap}>
          <View style={[s.progressCard, cardShadow]}>
            {/* Journey tracker */}
            <View style={s.journeyWrap}>
              {JOURNEY.map((step, i) => {
                const stepIdx = JOURNEY.indexOf(booking.status);
                const done = JOURNEY.indexOf(step) <= stepIdx;
                const isCurrent = step === booking.status;
                return (
                  <React.Fragment key={step}>
                    {i > 0 && (
                      <View style={[s.journeyLine, done && { backgroundColor: C.g500 }]} />
                    )}
                    <View style={s.journeyItem}>
                      <View style={[
                        s.journeyDot,
                        done && { backgroundColor: C.g500, borderColor: C.g500 },
                        isCurrent && { backgroundColor: C.g700, borderColor: C.g700, transform: [{ scale: 1.15 }] },
                      ]}>
                        {done && <Icon name="check" size={9} color="#fff" />}
                      </View>
                      <Text style={[
                        s.journeyLabel,
                        done && { color: C.g700 },
                        isCurrent && { color: C.g700, fontWeight: '700' },
                      ]}>
                        {STATUS_CONFIG[step]?.label}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            <View style={s.progressDivider} />

            {/* Amount strip */}
            <View style={s.heroStrip}>
              <View style={s.heroStripItem}>
                <Text style={s.heroStripLbl}>Total</Text>
                <Text style={s.heroStripVal}>₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.heroStripDiv} />
              <View style={s.heroStripItem}>
                <Text style={s.heroStripLbl}>Collected</Text>
                <Text style={[s.heroStripVal, { color: C.g700 }]}>₹{paidAmt.toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.heroStripDiv} />
              <View style={s.heroStripItem}>
                <Text style={s.heroStripLbl}>Payment</Text>
                <Text style={[s.heroStripVal, { color: ['collected','paid_online'].includes(booking.paymentStatus) ? C.g700 : C.amber, fontSize: 13 }]}>{pc.label}</Text>
              </View>
            </View>

            <Text style={s.gradCreated}>Created {fmtFull(booking.createdAt)}</Text>
          </View>
        </View>

        {/* ── Cards ── */}
        <View style={s.cards}>

          {/* ── Customer Info ── */}
          <View style={s.card}>
            <CardHead icon="person-circle-outline" iconLib="ion" iconColor={C.blue} title="Customer Information" />
            <View style={s.customerRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(booking.customerName || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.custName}>{booking.customerName}</Text>
                <Text style={s.custPhone}>{booking.customerPhone}</Text>
                {booking.customerEmail ? <Text style={s.custEmail}>{booking.customerEmail}</Text> : null}
              </View>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#DBEAFE' }]} onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}>
                <Icon name="phone" size={16} color={C.blue} />
                <Text style={[s.actionBtnTxt, { color: C.blue }]}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.g100 }]} onPress={() => Linking.openURL(`whatsapp://send?phone=91${booking.customerPhone}`)}>
                <Ionicons name="logo-whatsapp" size={16} color={C.g600} />
                <Text style={[s.actionBtnTxt, { color: C.g600 }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Trip Details ── */}
          <View style={s.card}>
            <CardHead icon="map-marker-path" iconLib="mci" iconColor={C.purple} title="Trip Details" />

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Service</Text>
              <Text style={s.detailValue}>{SERVICE_LABELS[booking.serviceType] || booking.serviceType}</Text>
            </View>
            {booking.vehicleType ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Vehicle</Text>
                <Text style={s.detailValue}>{booking.vehicleType}</Text>
              </View>
            ) : null}

            {Object.entries(extras).map(([key, val]) => {
              const meta = EXTRA_KEYS[key] || { icon: 'info', label: key };
              return (
                <View key={key} style={s.detailRow}>
                  <View style={s.detailLabelRow}>
                    <Icon name={meta.icon} size={12} color={C.muted} />
                    <Text style={s.detailLabel}>{meta.label}</Text>
                  </View>
                  <Text style={s.detailValue}>{val}</Text>
                </View>
              );
            })}

            {(booking.pickupLocation || booking.dropLocation) ? (
              <View style={s.routeBox}>
                {booking.pickupLocation ? (
                  <View style={s.routeRow}>
                    <View style={[s.routeDot, { backgroundColor: C.g500 }]} />
                    <Text style={s.routeText}>{booking.pickupLocation}</Text>
                  </View>
                ) : null}
                {booking.pickupLocation && booking.dropLocation ? <View style={s.routeConnector} /> : null}
                {booking.dropLocation ? (
                  <View style={s.routeRow}>
                    <View style={[s.routeDot, { backgroundColor: C.red }]} />
                    <Text style={s.routeText}>{booking.dropLocation}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={s.datesRow}>
              <View style={[s.dateBox, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                <Text style={[s.dateBoxLabel, { color: C.g600 }]}>PICKUP</Text>
                <Text style={s.dateBoxDate}>{fmt(booking.pickupDate)}</Text>
              </View>
              {booking.returnDate ? (
                <View style={[s.dateBox, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                  <Text style={[s.dateBoxLabel, { color: C.red }]}>RETURN</Text>
                  <Text style={s.dateBoxDate}>{fmt(booking.returnDate)}</Text>
                </View>
              ) : null}
            </View>

            {freeText ? (
              <View style={s.notesBox}>
                <Icon name="file-text" size={13} color={C.muted} />
                <Text style={s.notesText}>{freeText}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Driver & Vehicle ── */}
          <View style={s.card}>
            <CardHead icon="user-check" iconColor={C.indigo} title="Driver & Vehicle" />

            <Text style={s.assignLabel}>Driver</Text>
            {booking.assignedDriver ? (
              <View style={s.assignedRow}>
                <View style={[s.assignAvatar, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[s.assignAvatarText, { color: C.blue }]}>{booking.assignedDriver.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.assignedName}>{booking.assignedDriver.name}</Text>
                  <Text style={s.assignedSub}>{booking.assignedDriver.phone}</Text>
                </View>
                {!isTerminal && (
                  <TouchableOpacity onPress={() => handleRemoveAssign('driver')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x" size={18} color={C.red} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={[s.assignBtn, { borderColor: C.blue + '60' }]} onPress={() => openAssignModal('driver')} disabled={isTerminal}>
                <Icon name="plus" size={15} color={C.blue} />
                <Text style={[s.assignBtnTxt, { color: C.blue }]}>Assign Driver</Text>
              </TouchableOpacity>
            )}

            <View style={s.assignDivider} />

            <Text style={s.assignLabel}>Vehicle</Text>
            {booking.assignedVehicle ? (
              <View style={s.assignedRow}>
                <View style={[s.assignAvatar, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialCommunityIcons name="car" size={18} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.assignedName}>{booking.assignedVehicle.vehicleName || 'Vehicle'}</Text>
                  <Text style={s.assignedSub}>{booking.assignedVehicle.registrationNumber || ''}</Text>
                </View>
                {!isTerminal && (
                  <TouchableOpacity onPress={() => handleRemoveAssign('vehicle')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x" size={18} color={C.red} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={[s.assignBtn, { borderColor: C.purple + '60' }]} onPress={() => openAssignModal('vehicle')} disabled={isTerminal}>
                <Icon name="plus" size={15} color={C.purple} />
                <Text style={[s.assignBtnTxt, { color: C.purple }]}>Assign Vehicle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Payment ── */}
          <View style={s.card}>
            <CardHead icon="card-outline" iconLib="ion" iconColor={C.indigo} title="Payment" />

            <View style={s.payAmtRow}>
              <View style={s.payAmtBlock}>
                <Text style={s.payAmtLbl}>{totalAmt > 0 ? 'Total Amount' : 'Amount Collected'}</Text>
                <Text style={s.payAmtTotal}>₹{displayTotal.toLocaleString('en-IN')}</Text>
              </View>
              {totalAmt > 0 && (
                <View style={s.payAmtBlock}>
                  <Text style={s.payAmtLbl}>Collected</Text>
                  <Text style={[s.payAmtTotal, { color: C.g600 }]}>₹{paidAmt.toLocaleString('en-IN')}</Text>
                </View>
              )}
            </View>

            {displayTotal > 0 && (
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${paymentPercent}%`, backgroundColor: paymentPercent >= 100 ? C.g600 : C.blue }]} />
              </View>
            )}

            {balance > 0 && (
              <View style={s.balanceBox}>
                <Icon name="alert-circle" size={14} color={C.amber} />
                <Text style={s.balanceLbl}>Balance Due</Text>
                <Text style={s.balanceVal}>₹{balance.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {booking.paymentMode ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Mode</Text>
                <Text style={[s.detailValue, { textTransform: 'capitalize' }]}>{booking.paymentMode.replace('_', ' ')}</Text>
              </View>
            ) : null}

            {booking.status !== 'cancelled' && booking.status !== 'rejected' &&
              booking.paymentStatus !== 'collected' && booking.paymentStatus !== 'paid_online' && (
              <View style={s.payActions}>
                <TouchableOpacity style={[s.payActBtn, { backgroundColor: C.g100 }]} onPress={() => openPayModal('mark_paid')}>
                  <Icon name="check-circle" size={16} color={C.g600} />
                  <Text style={[s.payActTxt, { color: C.g600 }]}>Mark Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.payActBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => openPayModal('advance')}>
                  <Icon name="plus-circle" size={16} color={C.amber} />
                  <Text style={[s.payActTxt, { color: C.amber }]}>Advance</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.payActBtn, { backgroundColor: C.g100 }]} onPress={() => openPayModal('whatsapp')}>
                  <Ionicons name="logo-whatsapp" size={16} color={C.g600} />
                  <Text style={[s.payActTxt, { color: C.g600 }]}>Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Expenses ── */}
          <View style={s.card}>
            <TouchableOpacity style={s.cardHead} onPress={() => setShowExpenses(v => !v)}>
              <View style={[s.cardHeadIcon, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="trending-down" size={17} color={C.red} />
              </View>
              <Text style={s.cardTitle}>Expenses</Text>
              {expenses.length > 0 && (
                <View style={s.expCountBadge}>
                  <Text style={s.expCountTxt}>{expenses.length}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <Icon name={showExpenses ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
            </TouchableOpacity>

            {showExpenses && (
              <View>
                {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                  <TouchableOpacity style={s.addExpenseBtn} onPress={() => setShowAddExpense(v => !v)}>
                    <Icon name="plus" size={15} color={C.orange} />
                    <Text style={{ color: C.orange, fontWeight: '700', fontSize: 14 }}>Add Expense</Text>
                  </TouchableOpacity>
                )}

                {showAddExpense && (
                  <View style={s.expForm}>
                    <Text style={s.expFormLbl}>Category</Text>
                    <View style={s.expCatGrid}>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat.value}
                          style={[s.expCatChip, expenseForm.category === cat.value && s.expCatActive]}
                          onPress={() => setExpenseForm(p => ({ ...p, category: cat.value }))}
                        >
                          <MaterialCommunityIcons name={cat.icon} size={16} color={expenseForm.category === cat.value ? C.orange : C.muted} />
                          <Text style={[s.expCatTxt, expenseForm.category === cat.value && { color: C.orange }]}>{cat.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={s.expFormLbl}>Amount (₹)</Text>
                    <TextInput style={s.expInput} placeholder="0" placeholderTextColor={C.muted}
                      value={expenseForm.amount} onChangeText={v => setExpenseForm(p => ({ ...p, amount: v }))} keyboardType="number-pad" />
                    <Text style={s.expFormLbl}>Note (optional)</Text>
                    <TextInput style={s.expInput} placeholder="e.g. Highway toll" placeholderTextColor={C.muted}
                      value={expenseForm.note} onChangeText={v => setExpenseForm(p => ({ ...p, note: v }))} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <TouchableOpacity style={[s.expSaveBtn, savingExpense && { opacity: 0.6 }]} onPress={handleAddExpense} disabled={savingExpense}>
                        {savingExpense ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.expSaveTxt}>Save Expense</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={s.expCancelBtn} onPress={() => setShowAddExpense(false)}>
                        <Text style={s.expCancelTxt}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {expenses.map(exp => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category) || EXPENSE_CATEGORIES[6];
                  return (
                    <View key={exp.id} style={s.expItem}>
                      <View style={s.expItemIcon}>
                        <MaterialCommunityIcons name={cat.icon} size={16} color={C.orange} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.expItemLabel}>{cat.label}{exp.note ? ` · ${exp.note}` : ''}</Text>
                        <Text style={s.expItemDate}>{fmt(exp.expenseDate)}</Text>
                      </View>
                      <Text style={s.expItemAmt}>-₹{exp.amount.toLocaleString('en-IN')}</Text>
                      {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                        <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Icon name="trash-2" size={14} color={C.red} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {expenses.length > 0 && (
                  <View style={s.profitBox}>
                    <View style={s.profitRow}>
                      <Text style={s.profitLbl}>Collected</Text>
                      <Text style={[s.profitVal, { color: C.g600 }]}>₹{(booking.paidAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={s.profitRow}>
                      <Text style={s.profitLbl}>Total Expenses</Text>
                      <Text style={[s.profitVal, { color: C.red }]}>-₹{totalExpenses.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[s.profitRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, marginTop: 4 }]}>
                      <Text style={[s.profitLbl, { fontWeight: '700', color: C.text }]}>Net Earnings</Text>
                      <Text style={[s.profitVal, { fontWeight: '800', color: netEarnings >= 0 ? C.g600 : C.red }]}>₹{netEarnings.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Vendor Notes ── */}
          <View style={s.card}>
            <CardHead
              icon="edit-3"
              iconColor={C.muted}
              title="Vendor Notes"
              right={!editingNotes && booking.status !== 'cancelled' && booking.status !== 'rejected' ? (
                <TouchableOpacity onPress={() => setEditingNotes(true)}>
                  <Icon name="edit" size={15} color={C.g600} />
                </TouchableOpacity>
              ) : null}
            />
            {editingNotes ? (
              <View>
                <TextInput
                  style={[s.notesInput, { textAlignVertical: 'top' }]}
                  multiline numberOfLines={4}
                  placeholder="Add private notes..."
                  placeholderTextColor={C.muted}
                  value={notesVal}
                  onChangeText={setNotesVal}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={s.notesSaveBtn} onPress={handleSaveNotes}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.notesCancelBtn} onPress={() => { setEditingNotes(false); setNotesVal(booking.vendorNotes || ''); }}>
                    <Text style={{ color: C.muted, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={s.notesDisplay}>{booking.vendorNotes || 'No notes yet. Tap edit to add private notes.'}</Text>
            )}
          </View>

          {/* ── Booking Info ── */}
          <View style={s.card}>
            <CardHead icon="info" iconColor={C.muted} title="Booking Info" />
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Reference</Text>
              <Text style={[s.detailValue, { fontFamily: 'monospace' }]}>{booking.bookingNumber}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Source</Text>
              <Text style={s.detailValue}>{booking.bookingSource === 'shared_form' ? 'Booking Form' : 'Manual Entry'}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Created</Text>
              <Text style={s.detailValue}>{fmtFull(booking.createdAt)}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      {actions.length > 0 && !actionLoading && (
        <View style={s.bottomBar}>
          {actions.map(act => {
            const isDestructive = act.next === 'rejected' || act.next === 'cancelled';
            return (
              <TouchableOpacity
                key={act.next}
                style={[
                  s.bottomBtn,
                  isDestructive
                    ? { borderWidth: 2, borderColor: act.color, backgroundColor: C.surface }
                    : { backgroundColor: act.color },
                ]}
                onPress={() => handleStatusChange(act.next, act.label)}
              >
                <Icon name={act.icon} size={18} color={isDestructive ? act.color : '#fff'} />
                <Text style={[s.bottomBtnTxt, { color: isDestructive ? act.color : '#fff' }]}>{act.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {actionLoading && (
        <View style={s.bottomBar}>
          <ActivityIndicator size="small" color={C.g600} />
        </View>
      )}

      {/* ── Payment Modal ── */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <SheetHandle />
            <Text style={s.modalTitle}>
              {payAction === 'mark_paid' ? 'Mark as Paid' : payAction === 'advance' ? 'Collect Advance' : 'Send via WhatsApp'}
            </Text>
            {payAction !== 'whatsapp' && (
              <>
                <Text style={s.modalLabel}>Amount (₹)</Text>
                <TextInput
                  style={s.modalInput}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={C.muted}
                />
                <Text style={s.modalLabel}>Payment Mode</Text>
                <View style={s.modalModeRow}>
                  {['cash', 'upi', 'card', 'bank_transfer'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.modalModeBtn, payMode === m && s.modalModeBtnActive]}
                      onPress={() => setPayMode(m)}
                    >
                      <Text style={[s.modalModeTxt, payMode === m && { color: '#fff' }]}>
                        {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowPayModal(false)}>
                <Text style={{ color: C.muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirmBtn} onPress={handlePayment}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Assignment Modal ── */}
      <Modal visible={!!showAssignModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { maxHeight: '70%' }]}>
            <SheetHandle />
            <Text style={s.modalTitle}>
              {showAssignModal === 'driver' ? 'Select Driver' : 'Select Vehicle'}
            </Text>
            {assignLoading ? (
              <ActivityIndicator size="large" color={C.g600} style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {showAssignModal === 'driver' && (assignOptions?.drivers || []).map(d => (
                  <TouchableOpacity key={d.id} style={s.assignOptItem} onPress={() => handleAssign('driver', d.id)}>
                    <View style={[s.assignAvatar, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[s.assignAvatarText, { color: C.blue }]}>{d.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.assignedName}>{d.name}</Text>
                      <Text style={s.assignedSub}>{d.phone}</Text>
                    </View>
                    {!d.isAvailable && <Text style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>Busy</Text>}
                  </TouchableOpacity>
                ))}
                {showAssignModal === 'vehicle' && (assignOptions?.vehicles || []).map(v => (
                  <TouchableOpacity key={v.id} style={s.assignOptItem} onPress={() => handleAssign('vehicle', v.id)}>
                    <View style={[s.assignAvatar, { backgroundColor: '#F3E8FF' }]}>
                      <MaterialCommunityIcons name="car" size={18} color={C.purple} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.assignedName}>{v.displayName || v.vehicleName || 'Vehicle'}</Text>
                      <Text style={s.assignedSub}>{v.registrationNumber || ''}</Text>
                    </View>
                    {!v.isAvailable && <Text style={{ fontSize: 12, color: C.red, fontWeight: '600' }}>In Use</Text>}
                  </TouchableOpacity>
                ))}
                {((showAssignModal === 'driver' && !(assignOptions?.drivers?.length)) ||
                  (showAssignModal === 'vehicle' && !(assignOptions?.vehicles?.length))) && (
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <Icon name="inbox" size={32} color={C.muted} />
                    <Text style={{ color: C.muted, marginTop: 8 }}>No {showAssignModal}s found</Text>
                  </View>
                )}
              </ScrollView>
            )}
            <TouchableOpacity style={[s.modalCancelBtn, { marginTop: 12, alignSelf: 'center' }]} onPress={() => setShowAssignModal(null)}>
              <Text style={{ color: C.muted, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Loading */
  loadingGrad: { paddingBottom: 20, overflow: 'hidden', borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26) },

  /* Gradient hero — static, compact identity bar only */
  grad: { paddingBottom: rs(6), overflow: 'hidden', borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  gradTop: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  gradNum: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  gradSvcRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  gradSvcText: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  gradStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  gradStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  gradStatusText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* Progress card — floats into the hero's bottom curve */
  progressWrap: { marginHorizontal: 16, marginTop: rs(14) },
  progressCard: { backgroundColor: C.surface, borderRadius: rs(18), paddingTop: 16, paddingBottom: 4, borderWidth: 1, borderColor: C.border },
  progressDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 12 },

  /* Journey */
  journeyWrap: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 4 },
  journeyLine: { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11, alignSelf: 'flex-start' },
  journeyItem: { alignItems: 'center', gap: 5 },
  journeyDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  journeyLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3, width: 56 },

  /* Amount strip */
  heroStrip: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, backgroundColor: C.g50, marginBottom: 12 },
  heroStripItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  heroStripDiv: { width: 1, backgroundColor: C.g100, marginVertical: 10 },
  heroStripLbl: { fontSize: 10, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  heroStripVal: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },

  gradCreated: { fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 4 },

  /* Cards container */
  cards: { padding: 14, paddingTop: 12, gap: 12 },
  card: { backgroundColor: C.surface, borderRadius: rs(18), padding: 16, borderWidth: 1, borderColor: C.border, ...cardShadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardHeadIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },

  /* Customer */
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.g700, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  custName: { fontSize: 16, fontWeight: '700', color: C.text },
  custPhone: { fontSize: 14, color: C.subtext, marginTop: 2 },
  custEmail: { fontSize: 13, color: C.muted, marginTop: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  actionBtnTxt: { fontSize: 14, fontWeight: '700' },

  /* Details */
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border + '80' },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailLabel: { fontSize: 14, color: C.muted },
  detailValue: { fontSize: 14, color: C.text, fontWeight: '600', flex: 1, textAlign: 'right' },

  /* Route */
  routeBox: { backgroundColor: C.g50, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 6, marginVertical: 8, borderWidth: 1, borderColor: C.g100 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { fontSize: 14, color: C.text, fontWeight: '600', flex: 1 },
  routeConnector: { width: 1.5, height: 10, backgroundColor: C.border, marginLeft: 5 },

  /* Dates */
  datesRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  dateBox: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1 },
  dateBoxLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  dateBoxDate: { fontSize: 14, fontWeight: '700', color: C.text },

  /* Notes box (trip) */
  notesBox: { flexDirection: 'row', gap: 8, backgroundColor: C.g50, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.g100 },
  notesText: { fontSize: 14, color: C.subtext, flex: 1, lineHeight: 18 },

  /* Assignment */
  assignLabel: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: C.g50, borderRadius: 12, borderWidth: 1, borderColor: C.g100 },
  assignAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  assignAvatarText: { fontSize: 15, fontWeight: '800' },
  assignedName: { fontSize: 14, fontWeight: '700', color: C.text },
  assignedSub: { fontSize: 13, color: C.muted, marginTop: 1 },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'transparent' },
  assignBtnTxt: { fontSize: 14, fontWeight: '700' },
  assignDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  /* Payment */
  payAmtRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  payAmtBlock: { flex: 1, backgroundColor: C.g50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.g100 },
  payAmtLbl: { fontSize: 11, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  payAmtTotal: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  progressTrack: { height: 7, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  balanceBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#FDE68A' },
  balanceLbl: { flex: 1, fontSize: 14, color: '#92400E', fontWeight: '600' },
  balanceVal: { fontSize: 15, fontWeight: '800', color: '#92400E' },
  payActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  payActBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12 },
  payActTxt: { fontSize: 13, fontWeight: '700' },

  /* Expenses */
  expCountBadge: { marginLeft: 6, backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  expCountTxt: { fontSize: 12, fontWeight: '700', color: C.red },
  addExpenseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.orange + '60', borderStyle: 'dashed', backgroundColor: '#FFF7ED', marginBottom: 10 },
  expForm: { backgroundColor: C.g50, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.g100, marginBottom: 12 },
  expFormLbl: { fontSize: 12, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  expCatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  expCatChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  expCatActive: { borderColor: C.orange, backgroundColor: '#FFF7ED' },
  expCatTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  expInput: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  expSaveBtn: { flex: 1, backgroundColor: C.orange, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  expSaveTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expCancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  expCancelTxt: { color: C.muted, fontWeight: '600', fontSize: 14 },
  expItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border + '60' },
  expItemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  expItemLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  expItemDate: { fontSize: 12, color: C.muted, marginTop: 1 },
  expItemAmt: { fontSize: 14, fontWeight: '700', color: C.red },
  profitBox: { backgroundColor: C.g50, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.g100 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  profitLbl: { fontSize: 14, color: C.subtext },
  profitVal: { fontSize: 14, fontWeight: '700' },

  /* Vendor notes */
  notesInput: { backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, minHeight: 90 },
  notesDisplay: { fontSize: 14, color: C.subtext, lineHeight: 22 },
  notesSaveBtn: { flex: 1, backgroundColor: C.g700, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  notesCancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },

  /* Bottom bar */
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 24, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, ...cardShadow },
  bottomBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(14) },
  bottomBtnTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800' },

  /* Payment Modal */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, padding: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  modalInput: { backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, color: C.text, fontWeight: '700', marginBottom: 4 },
  modalModeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  modalModeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface },
  modalModeBtnActive: { backgroundColor: C.g700, borderColor: C.g700 },
  modalModeTxt: { fontSize: 13, fontWeight: '700', color: C.muted },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.g700, alignItems: 'center' },

  /* Assignment modal items */
  assignOptItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
});
