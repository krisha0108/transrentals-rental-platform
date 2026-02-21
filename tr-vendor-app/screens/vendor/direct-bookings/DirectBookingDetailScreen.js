import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getDirectBookingById, updateDirectBooking, cancelDirectBooking,
  getDirectBookingExpenses, addDirectBookingExpense, deleteDirectBookingExpense,
  getDirectBookingAssignOptions,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#3B82F6', green: '#10B981',
  orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', emerald: '#059669',
  indigo: '#6366F1',
};

const STATUS_CONFIG = {
  inquiry:     { label: 'Inquiry',     color: C.orange, bg: '#FEF3C7' },
  confirmed:   { label: 'Confirmed',   color: C.brand,  bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: C.purple, bg: '#F3E8FF' },
  completed:   { label: 'Completed',   color: C.emerald,bg: '#DCFCE7' },
  rejected:    { label: 'Rejected',    color: C.red,    bg: '#FEE2E2' },
  cancelled:   { label: 'Cancelled',   color: C.muted,  bg: '#F3F4F6' },
};

const STATUS_FLOW = {
  inquiry:     [{ next: 'confirmed',   label: 'Confirm Booking', color: C.brand,   icon: 'check-circle' },
                { next: 'rejected',    label: 'Reject',          color: C.red,     icon: 'x-circle' }],
  confirmed:   [{ next: 'in_progress', label: 'Start Trip',      color: C.purple,  icon: 'play-circle' },
                { next: 'cancelled',   label: 'Cancel',          color: C.muted,   icon: 'x-circle' }],
  in_progress: [{ next: 'completed',   label: 'Complete',        color: C.emerald, icon: 'check-circle' }],
  completed: [], rejected: [], cancelled: [],
};

const JOURNEY = ['inquiry', 'confirmed', 'in_progress', 'completed'];

const PAYMENT_CONFIG = {
  pending:     { label: 'Payment Pending', color: C.orange },
  partial:     { label: 'Advance Paid',    color: C.orange },
  collected:   { label: 'Fully Paid',      color: C.green  },
  link_sent:   { label: 'Link Sent',       color: C.brand  },
  paid_online: { label: 'Paid Online',     color: C.green  },
  waived:      { label: 'Waived',          color: C.muted  },
};

const SERVICE_LABELS = {
  'car-with-driver': 'Car with Driver', 'self-drive': 'Self-Drive Car',
  bike: 'Bike Rental', bus: 'Bus & Tempo', luxury: 'Luxury Car',
  transporter: 'Transporter', 'packers-movers': 'Packers & Movers',
  equipment: 'Equipment Rental', general: 'General',
};

const EXPENSE_CATEGORIES = [
  { value: 'fuel',           label: 'Fuel',           icon: 'gas-station' },
  { value: 'driver_payment', label: 'Driver Pay',     icon: 'account'     },
  { value: 'toll',           label: 'Toll',           icon: 'road-variant'},
  { value: 'parking',        label: 'Parking',        icon: 'parking'     },
  { value: 'maintenance',    label: 'Maintenance',    icon: 'wrench'      },
  { value: 'cleaning',       label: 'Cleaning',       icon: 'broom'       },
  { value: 'other',          label: 'Other',          icon: 'dots-horizontal'},
];

const EXTRA_KEYS = {
  'Trip type':    { icon: 'map',        label: 'Trip Type'  },
  'Pickup time':  { icon: 'clock',      label: 'Time'       },
  'Passengers':   { icon: 'users',      label: 'Passengers' },
  'Helmets':      { icon: 'shield',     label: 'Helmets'    },
  'Occasion':     { icon: 'star',       label: 'Occasion'   },
  'License':      { icon: 'credit-card',label: 'License'    },
  'Use Type':     { icon: 'briefcase',  label: 'Use Type'   },
  'Truck':        { icon: 'truck',      label: 'Truck Type' },
  'Goods':        { icon: 'package',    label: 'Goods'      },
  'Weight':       { icon: 'database',   label: 'Weight'     },
  'Move size':    { icon: 'home',       label: 'Move Size'  },
  'Packing':      { icon: 'box',        label: 'Packing'    },
  'Floor info':   { icon: 'layers',     label: 'Floor Info' },
  'Duration':     { icon: 'calendar',   label: 'Duration'   },
  'Units':        { icon: 'hash',       label: 'Units'      },
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
  const [showAssignModal, setShowAssignModal] = useState(null); // 'driver' | 'vehicle'
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
      isDestructive ? 'warning' : 'info',
      label,
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
        // If totalAmount was 0, also set it to match
        if (total <= 0) updateData.totalAmount = newPaid;
      } else {
        // Advance: add to existing
        newPaid = existingPaid + amount;
        // Auto-mark as collected if advance covers full amount
        newStatus = (total > 0 && newPaid >= total) ? 'collected' : 'partial';
        if (total > 0 && newPaid > total) newPaid = total;
        updateData = { paymentStatus: newStatus, paidAmount: newPaid, paymentMode: payMode };
        // If totalAmount was 0, set it to what's been paid so far
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

  /* ── Loading state ── */
  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.centered}><ActivityIndicator size="large" color={C.brand} /></View>
    </SafeAreaView>
  );

  if (!booking) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.centered}><Text style={{ color: C.muted }}>Booking not found</Text></View>
    </SafeAreaView>
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Booking Details</Text>
          <Text style={s.headerSub}>#{booking.bookingNumber}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}>

        {/* ── Status Banner ── */}
        <View style={[s.card, { borderTopWidth: 4, borderTopColor: sc.color }]}>
          <View style={s.statusRow}>
            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <Icon name={booking.status === 'rejected' || booking.status === 'cancelled' ? 'x-circle' : 'check-circle'} size={16} color={sc.color} />
              <Text style={[s.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
            </View>
            <View style={[s.payBadge, { backgroundColor: pc.color + '15' }]}>
              <Text style={[s.payBadgeText, { color: pc.color }]}>{pc.label}</Text>
            </View>
          </View>

          {/* Journey tracker */}
          <View style={s.journey}>
            {JOURNEY.map((step, i) => {
              const stepIdx = JOURNEY.indexOf(booking.status);
              const done = JOURNEY.indexOf(step) <= stepIdx;
              const isCurrent = step === booking.status;
              return (
                <React.Fragment key={step}>
                  {i > 0 && <View style={[s.journeyLine, done && { backgroundColor: sc.color }]} />}
                  <View style={[s.journeyDot, done && { backgroundColor: sc.color, borderColor: sc.color }, isCurrent && s.journeyDotCurrent]}>
                    {done && <Icon name="check" size={10} color="#fff" />}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
          <View style={s.journeyLabels}>
            {JOURNEY.map(step => (
              <Text key={step} style={[s.journeyLabel, booking.status === step && { color: sc.color, fontWeight: '700' }]}>
                {STATUS_CONFIG[step]?.label}
              </Text>
            ))}
          </View>
          <Text style={s.createdDate}>Created {fmtFull(booking.createdAt)}</Text>
        </View>

        {/* ── Customer Info ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="person-circle-outline" size={22} color={C.brand} />
            <Text style={s.cardTitle}>Customer Information</Text>
          </View>
          <View style={s.customerRow}>
            <View style={s.avatar}><Text style={s.avatarText}>{(booking.customerName || '?')[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName}</Text>
              <Text style={s.customerPhone}>{booking.customerPhone}</Text>
              {booking.customerEmail ? <Text style={s.customerEmail}>{booking.customerEmail}</Text> : null}
            </View>
          </View>
          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#DBEAFE' }]} onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}>
              <Icon name="phone" size={18} color={C.brand} />
              <Text style={[s.actionBtnText, { color: C.brand }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#DCFCE7' }]} onPress={() => Linking.openURL(`whatsapp://send?phone=91${booking.customerPhone}`)}>
              <Ionicons name="logo-whatsapp" size={18} color={C.green} />
              <Text style={[s.actionBtnText, { color: C.green }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trip Details ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="map-marker-path" size={22} color={C.purple} />
            <Text style={s.cardTitle}>Trip Details</Text>
          </View>

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

          {/* Parsed extras from notes */}
          {Object.entries(extras).map(([key, val]) => {
            const meta = EXTRA_KEYS[key] || { icon: 'info', label: key };
            return (
              <View key={key} style={s.detailRow}>
                <View style={s.detailLabelRow}>
                  <Icon name={meta.icon} size={13} color={C.muted} />
                  <Text style={s.detailLabel}>{meta.label}</Text>
                </View>
                <Text style={s.detailValue}>{val}</Text>
              </View>
            );
          })}

          {/* Locations */}
          {booking.pickupLocation || booking.dropLocation ? (
            <View style={s.locationBlock}>
              {booking.pickupLocation ? (
                <View style={s.locationRow}>
                  <View style={[s.locationDot, { backgroundColor: C.green }]} />
                  <Text style={s.locationText}>{booking.pickupLocation}</Text>
                </View>
              ) : null}
              {booking.dropLocation ? (
                <View style={s.locationRow}>
                  <View style={[s.locationDot, { backgroundColor: C.red }]} />
                  <Text style={s.locationText}>{booking.dropLocation}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Dates */}
          <View style={s.datesRow}>
            <View style={[s.dateBox, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[s.dateBoxLabel, { color: C.brand }]}>PICKUP</Text>
              <Text style={s.dateBoxDate}>{fmt(booking.pickupDate)}</Text>
            </View>
            {booking.returnDate ? (
              <View style={[s.dateBox, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[s.dateBoxLabel, { color: C.red }]}>RETURN</Text>
                <Text style={s.dateBoxDate}>{fmt(booking.returnDate)}</Text>
              </View>
            ) : null}
          </View>

          {freeText ? (
            <View style={s.notesBox}>
              <Icon name="file-text" size={14} color={C.muted} />
              <Text style={s.notesText}>{freeText}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Assignment ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="user-check" size={20} color={C.indigo} />
            <Text style={s.cardTitle}>Driver & Vehicle</Text>
          </View>

          {/* Driver */}
          <View style={s.assignSection}>
            <Text style={s.assignLabel}>Driver</Text>
            {booking.assignedDriver ? (
              <View style={s.assignedRow}>
                <View style={[s.avatar, { width: 36, height: 36, backgroundColor: '#DBEAFE' }]}>
                  <Text style={[s.avatarText, { fontSize: 14, color: C.brand }]}>{booking.assignedDriver.name[0]}</Text>
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
              <TouchableOpacity style={s.assignBtn} onPress={() => openAssignModal('driver')} disabled={isTerminal}>
                <Icon name="plus" size={16} color={C.brand} />
                <Text style={s.assignBtnText}>Assign Driver</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle */}
          <View style={[s.assignSection, { marginTop: 12 }]}>
            <Text style={s.assignLabel}>Vehicle</Text>
            {booking.assignedVehicle ? (
              <View style={s.assignedRow}>
                <View style={[s.avatar, { width: 36, height: 36, backgroundColor: '#F3E8FF' }]}>
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
              <TouchableOpacity style={s.assignBtn} onPress={() => openAssignModal('vehicle')} disabled={isTerminal}>
                <Icon name="plus" size={16} color={C.purple} />
                <Text style={[s.assignBtnText, { color: C.purple }]}>Assign Vehicle</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Payment ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="card-outline" size={22} color={C.indigo} />
            <Text style={s.cardTitle}>Payment</Text>
          </View>

          <View style={s.payRow}>
            <Text style={s.payLabel}>{totalAmt > 0 ? 'Total Amount' : 'Amount Collected'}</Text>
            <Text style={s.payTotal}>₹{displayTotal.toLocaleString('en-IN')}</Text>
          </View>
          {totalAmt > 0 && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Collected</Text>
              <Text style={[s.payCollected, { color: C.green }]}>₹{paidAmt.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {/* Progress bar */}
          {displayTotal > 0 && (
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${paymentPercent}%`, backgroundColor: paymentPercent >= 100 ? C.green : C.brand }]} />
            </View>
          )}

          {balance > 0 && (
            <View style={s.balanceBox}>
              <Text style={s.balanceLabel}>Balance Due</Text>
              <Text style={s.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {booking.paymentMode ? (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Mode</Text>
              <Text style={s.payModeText}>{booking.paymentMode}</Text>
            </View>
          ) : null}

          {booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.paymentStatus !== 'collected' && booking.paymentStatus !== 'paid_online' && (
            <View style={s.payActions}>
              <TouchableOpacity style={[s.payActionBtn, { backgroundColor: '#DCFCE7' }]} onPress={() => openPayModal('mark_paid')}>
                <Icon name="check-circle" size={16} color={C.green} />
                <Text style={[s.payActionText, { color: C.green }]}>Mark Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.payActionBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => openPayModal('advance')}>
                <Icon name="plus-circle" size={16} color={C.orange} />
                <Text style={[s.payActionText, { color: C.orange }]}>Advance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.payActionBtn, { backgroundColor: '#DCFCE7' }]} onPress={() => openPayModal('whatsapp')}>
                <Ionicons name="logo-whatsapp" size={16} color={C.green} />
                <Text style={[s.payActionText, { color: C.green }]}>Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Expenses ── */}
        <View style={s.card}>
          <TouchableOpacity style={s.cardHeader} onPress={() => setShowExpenses(v => !v)}>
            <Icon name="trending-down" size={20} color={C.red} />
            <Text style={s.cardTitle}>Expenses</Text>
            {expenses.length > 0 && (
              <View style={[s.countBadge, { backgroundColor: C.red + '15' }]}>
                <Text style={[s.countBadgeText, { color: C.red }]}>{expenses.length}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <Icon name={showExpenses ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
          </TouchableOpacity>

          {showExpenses && (
            <View>
              {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                <TouchableOpacity style={s.addExpenseBtn} onPress={() => setShowAddExpense(v => !v)}>
                  <Icon name="plus" size={16} color={C.orange} />
                  <Text style={{ color: C.orange, fontWeight: '700', fontSize: 13 }}>Add Expense</Text>
                </TouchableOpacity>
              )}

              {showAddExpense && (
                <View style={s.expenseForm}>
                  <Text style={s.expFormLabel}>Category</Text>
                  <View style={s.expCatGrid}>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <TouchableOpacity key={cat.value}
                        style={[s.expCatChip, expenseForm.category === cat.value && s.expCatChipActive]}
                        onPress={() => setExpenseForm(p => ({ ...p, category: cat.value }))}
                      >
                        <MaterialCommunityIcons name={cat.icon} size={16} color={expenseForm.category === cat.value ? C.orange : C.muted} />
                        <Text style={[s.expCatText, expenseForm.category === cat.value && { color: C.orange }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={s.expFormLabel}>Amount (₹)</Text>
                  <TextInput style={s.expInput} placeholder="0" placeholderTextColor={C.muted} value={expenseForm.amount}
                    onChangeText={v => setExpenseForm(p => ({ ...p, amount: v }))} keyboardType="number-pad" />
                  <Text style={s.expFormLabel}>Note (optional)</Text>
                  <TextInput style={s.expInput} placeholder="e.g. Highway toll" placeholderTextColor={C.muted} value={expenseForm.note}
                    onChangeText={v => setExpenseForm(p => ({ ...p, note: v }))} />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity style={[s.expSaveBtn, savingExpense && { opacity: 0.6 }]} onPress={handleAddExpense} disabled={savingExpense}>
                      {savingExpense ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.expSaveBtnText}>Save</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.expCancelBtn} onPress={() => setShowAddExpense(false)}>
                      <Text style={s.expCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {expenses.map(exp => {
                const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category) || EXPENSE_CATEGORIES[6];
                return (
                  <View key={exp.id} style={s.expItem}>
                    <MaterialCommunityIcons name={cat.icon} size={18} color={C.orange} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.expItemLabel}>{cat.label}{exp.note ? ` - ${exp.note}` : ''}</Text>
                      <Text style={s.expItemDate}>{fmt(exp.expenseDate)}</Text>
                    </View>
                    <Text style={s.expItemAmount}>-₹{exp.amount.toLocaleString('en-IN')}</Text>
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
                    <Text style={s.profitLabel}>Collected</Text>
                    <Text style={[s.profitVal, { color: C.green }]}>₹{(booking.paidAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={s.profitRow}>
                    <Text style={s.profitLabel}>Total Expenses</Text>
                    <Text style={[s.profitVal, { color: C.red }]}>-₹{totalExpenses.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[s.profitRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 }]}>
                    <Text style={s.profitLabelBold}>Net Earnings</Text>
                    <Text style={[s.profitValBold, { color: netEarnings >= 0 ? C.green : C.red }]}>₹{netEarnings.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Vendor Notes ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="edit-3" size={20} color={C.muted} />
            <Text style={s.cardTitle}>Vendor Notes</Text>
            {!editingNotes && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
              <TouchableOpacity onPress={() => setEditingNotes(true)} style={{ marginLeft: 'auto' }}>
                <Icon name="edit" size={16} color={C.brand} />
              </TouchableOpacity>
            )}
          </View>
          {editingNotes ? (
            <View>
              <TextInput style={[s.notesInput, { textAlignVertical: 'top' }]} multiline numberOfLines={4}
                placeholder="Add private notes..." placeholderTextColor={C.muted}
                value={notesVal} onChangeText={setNotesVal} />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={s.notesSaveBtn} onPress={handleSaveNotes}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.notesCancelBtn} onPress={() => { setEditingNotes(false); setNotesVal(booking.vendorNotes || ''); }}>
                  <Text style={{ color: C.muted, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={s.notesDisplay}>{booking.vendorNotes || 'No notes yet'}</Text>
          )}
        </View>

        {/* ── Booking Info ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="info" size={20} color={C.muted} />
            <Text style={s.cardTitle}>Booking Info</Text>
          </View>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      {actions.length > 0 && !actionLoading && (
        <View style={s.bottomBar}>
          {actions.map(act => (
            <TouchableOpacity key={act.next}
              style={[s.bottomBtn, { backgroundColor: act.next === 'rejected' || act.next === 'cancelled' ? C.surface : act.color, borderWidth: act.next === 'rejected' || act.next === 'cancelled' ? 2 : 0, borderColor: act.color }]}
              onPress={() => handleStatusChange(act.next, act.label)}
            >
              <Icon name={act.icon} size={18} color={act.next === 'rejected' || act.next === 'cancelled' ? act.color : '#fff'} />
              <Text style={[s.bottomBtnText, { color: act.next === 'rejected' || act.next === 'cancelled' ? act.color : '#fff' }]}>{act.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {actionLoading && (
        <View style={s.bottomBar}>
          <ActivityIndicator size="small" color={C.brand} />
        </View>
      )}

      {/* ── Payment Modal ── */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {payAction === 'mark_paid' ? 'Mark as Paid' : payAction === 'advance' ? 'Collect Advance' : 'Send via WhatsApp'}
            </Text>
            {payAction !== 'whatsapp' && (
              <>
                <Text style={s.modalLabel}>Amount (₹)</Text>
                <TextInput style={s.modalInput} value={payAmount} onChangeText={setPayAmount} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.muted} />
                <Text style={s.modalLabel}>Payment Mode</Text>
                <View style={s.modalModeRow}>
                  {['cash', 'upi', 'card', 'bank_transfer'].map(m => (
                    <TouchableOpacity key={m} style={[s.modalModeBtn, payMode === m && s.modalModeBtnActive]} onPress={() => setPayMode(m)}>
                      <Text style={[s.modalModeText, payMode === m && s.modalModeTextActive]}>{m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}</Text>
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
      </Modal>

      {/* ── Assignment Modal ── */}
      <Modal visible={!!showAssignModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>
              {showAssignModal === 'driver' ? 'Select Driver' : 'Select Vehicle'}
            </Text>
            {assignLoading ? (
              <ActivityIndicator size="large" color={C.brand} style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {showAssignModal === 'driver' && (assignOptions?.drivers || []).map(d => (
                  <TouchableOpacity key={d.id} style={s.assignOptionItem} onPress={() => handleAssign('driver', d.id)}>
                    <View style={[s.avatar, { width: 36, height: 36, backgroundColor: '#DBEAFE' }]}>
                      <Text style={[s.avatarText, { fontSize: 14, color: C.brand }]}>{d.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.assignOptionName}>{d.name}</Text>
                      <Text style={s.assignOptionSub}>{d.phone}</Text>
                    </View>
                    {!d.isAvailable && <Text style={{ fontSize: 11, color: C.red }}>Busy</Text>}
                  </TouchableOpacity>
                ))}
                {showAssignModal === 'vehicle' && (assignOptions?.vehicles || []).map(v => (
                  <TouchableOpacity key={v.id} style={s.assignOptionItem} onPress={() => handleAssign('vehicle', v.id)}>
                    <View style={[s.avatar, { width: 36, height: 36, backgroundColor: '#F3E8FF' }]}>
                      <MaterialCommunityIcons name="car" size={18} color={C.purple} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.assignOptionName}>{v.displayName || v.vehicleName || 'Vehicle'}</Text>
                      <Text style={s.assignOptionSub}>{v.registrationNumber || ''}</Text>
                    </View>
                    {!v.isAvailable && <Text style={{ fontSize: 11, color: C.red }}>In Use</Text>}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  headerSub: { fontSize: 12, color: C.muted, fontFamily: 'monospace' },

  scroll: { padding: 16, gap: 12 },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  // Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  payBadgeText: { fontSize: 11, fontWeight: '700' },

  // Journey
  journey: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, paddingHorizontal: 8 },
  journeyDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
  journeyDotCurrent: { width: 26, height: 26, borderRadius: 13 },
  journeyLine: { flex: 1, height: 3, backgroundColor: C.border, borderRadius: 2 },
  journeyLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 },
  journeyLabel: { fontSize: 10, color: C.muted, textAlign: 'center', width: '25%' },
  createdDate: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 },

  // Customer
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.brand },
  customerName: { fontSize: 16, fontWeight: '700', color: C.text },
  customerPhone: { fontSize: 13, color: C.subtext },
  customerEmail: { fontSize: 12, color: C.muted },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Detail rows
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 13, color: C.muted },
  detailValue: { fontSize: 13, fontWeight: '600', color: C.text, maxWidth: '55%', textAlign: 'right' },

  // Location
  locationBlock: { marginTop: 12, gap: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationDot: { width: 10, height: 10, borderRadius: 5 },
  locationText: { fontSize: 13, color: C.text, flex: 1 },

  // Dates
  datesRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  dateBox: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  dateBoxLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dateBoxDate: { fontSize: 13, fontWeight: '600', color: C.text, marginTop: 2 },

  // Notes inline
  notesBox: { flexDirection: 'row', gap: 8, marginTop: 14, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10 },
  notesText: { fontSize: 13, color: C.subtext, flex: 1 },

  // Assignment
  assignSection: {},
  assignLabel: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12 },
  assignedName: { fontSize: 14, fontWeight: '600', color: C.text },
  assignedSub: { fontSize: 12, color: C.muted },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border },
  assignBtnText: { fontSize: 13, fontWeight: '700', color: C.brand },

  // Payment
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  payLabel: { fontSize: 13, color: C.muted },
  payTotal: { fontSize: 20, fontWeight: '800', color: C.text },
  payCollected: { fontSize: 15, fontWeight: '700' },
  payModeText: { fontSize: 13, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 8, marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  balanceBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 10, marginVertical: 8 },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: C.orange },
  balanceAmount: { fontSize: 14, fontWeight: '800', color: C.orange },
  payActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  payActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  payActionText: { fontSize: 12, fontWeight: '700' },

  // Expenses
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  addExpenseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.orange + '40', marginBottom: 10 },
  expenseForm: { backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, marginBottom: 10 },
  expFormLabel: { fontSize: 12, fontWeight: '700', color: C.subtext, marginBottom: 6, marginTop: 6 },
  expCatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expCatChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  expCatChipActive: { borderColor: C.orange, backgroundColor: '#FEF3C7' },
  expCatText: { fontSize: 11, fontWeight: '600', color: C.muted },
  expInput: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  expSaveBtn: { flex: 1, backgroundColor: C.orange, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  expSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  expCancelBtnText: { color: C.muted, fontWeight: '600', fontSize: 14 },
  expItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  expItemLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  expItemDate: { fontSize: 11, color: C.muted },
  expItemAmount: { fontSize: 14, fontWeight: '700', color: C.red },

  // Profit
  profitBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginTop: 12, gap: 4 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  profitLabel: { fontSize: 13, color: C.muted },
  profitVal: { fontSize: 13, fontWeight: '600' },
  profitLabelBold: { fontSize: 14, fontWeight: '700', color: C.text },
  profitValBold: { fontSize: 15, fontWeight: '800' },

  // Vendor Notes
  notesInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, minHeight: 100 },
  notesSaveBtn: { backgroundColor: C.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  notesCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  notesDisplay: { fontSize: 14, color: C.subtext, lineHeight: 20 },

  // Bottom action bar
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  bottomBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  bottomBtnText: { fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text },
  modalModeRow: { flexDirection: 'row', gap: 8 },
  modalModeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center' },
  modalModeBtnActive: { borderColor: C.brand, backgroundColor: '#EFF6FF' },
  modalModeText: { fontSize: 12, fontWeight: '700', color: C.muted },
  modalModeTextActive: { color: C.brand },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.brand, alignItems: 'center' },

  // Assign modal items
  assignOptionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  assignOptionName: { fontSize: 14, fontWeight: '600', color: C.text },
  assignOptionSub: { fontSize: 12, color: C.muted },
});
