// CustomBookingScreen.js — Multi-day event (CUSTOM_BULK) booking flow.
// Mirrors the web /custom-booking form and POSTs to the unified
// /api/bookings endpoint with bookingType: 'custom-bulk'.
//
// Three steps:
//   1. Event details (occasion, dates, base city, addresses)
//   2. Day-wise plan (per-day services + vehicles)
//   3. Customer info + submit

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Image, Platform, ActivityIndicator, Alert, Modal, Pressable, KeyboardAvoidingView,
  findNodeHandle, UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { fleetService, locationService } from '../../services';
import api from '../../api';
// Phase 7 — TA Personal/Company toggle (self-gated).
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { isTravelAgentCustomer, getCachedCustomer } from '../../../utils/isTravelAgent';

const ACCENT = '#7C3AED';     // purple/indigo to match web's bulk event branding
const ACCENT_DARK = '#5B21B6';
const BG = '#F5F5F7';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const MUTED = '#6B7280';

const OCCASIONS = [
  { id: 'wedding',        label: 'Wedding',          emoji: '💒' },
  { id: 'corporate',      label: 'Corporate',        emoji: '🏢' },
  { id: 'birthday',       label: 'Birthday',         emoji: '🎂' },
  { id: 'tour',           label: 'Tour/Trip',        emoji: '🗺️' },
  { id: 'religious',      label: 'Religious',        emoji: '🛕' },
  { id: 'sports',         label: 'Sports Event',     emoji: '⚽' },
  { id: 'other',          label: 'Other',            emoji: '🎉' },
];

// Service catalogue — keys match what the backend stores in bulkBreakdown JSON.
// `slug` must match an active row in the `services` table (used by
// /api/services/[slug]/fleet) — these are the same slugs the web custom-
// booking form uses.
const SERVICES = [
  { id: 'bike',      label: 'Bike',          slug: 'bike-on-rent' },
  { id: 'car',       label: 'Car Rental',    slug: 'car-rental' },
  { id: 'selfdrive', label: 'Self-Drive',    slug: 'self-drive-car-rentals' },
  { id: 'luxury',    label: 'Luxury Car',    slug: 'luxury-car-rental' },
  { id: 'bus',       label: 'Bus',           slug: 'bus-rental' },
  { id: 'truck',     label: 'Truck',         slug: 'transporter' },
];

// Bus + truck are quote-based services — vendor fleet is rarely listed
// per city. The web custom-booking form falls back to hardcoded category
// presets so the customer can still pick a capacity / tonnage class.
// Mirror those presets verbatim so submissions look identical to web.
const BUS_SEATER_PRESETS = [
  { id: 'bus-12', name: '12-Seater Tempo Traveller', slug: 'bus-12', seatingCapacity: 12, basePricePerDay: 0 },
  { id: 'bus-17', name: '17-Seater Tempo Traveller', slug: 'bus-17', seatingCapacity: 17, basePricePerDay: 0 },
  { id: 'bus-26', name: '26-Seater Mini Bus',        slug: 'bus-26', seatingCapacity: 26, basePricePerDay: 0 },
  { id: 'bus-35', name: '35-Seater Bus',             slug: 'bus-35', seatingCapacity: 35, basePricePerDay: 0 },
  { id: 'bus-45', name: '45-Seater Luxury Bus',      slug: 'bus-45', seatingCapacity: 45, basePricePerDay: 0 },
  { id: 'bus-50', name: '50+ Seater Coach',          slug: 'bus-50', seatingCapacity: 50, basePricePerDay: 0 },
];
const TRUCK_PRESETS = [
  { id: 'truck-mini',         name: 'Mini Truck',              slug: 'truck-mini',         tonnage: '1 Ton',         examples: 'Tata Ace, Mahindra Jeeto',  basePricePerDay: 0 },
  { id: 'truck-light',        name: 'Light Commercial',        slug: 'truck-light',        tonnage: '1.5 – 5 Ton',   examples: 'Tata 407, Bolero Pickup',   basePricePerDay: 0 },
  { id: 'truck-medium',       name: 'Medium Truck',            slug: 'truck-medium',       tonnage: '3 – 7 Ton',     examples: 'Eicher 14/17/19 ft',        basePricePerDay: 0 },
  { id: 'truck-container-20', name: 'Container Truck (20 ft)', slug: 'truck-container-20', tonnage: '10 – 15 Ton',                                          basePricePerDay: 0 },
  { id: 'truck-container-24', name: 'Container Truck (24 ft)', slug: 'truck-container-24', tonnage: '15 – 20 Ton',                                          basePricePerDay: 0 },
  { id: 'truck-container-32', name: 'Container Truck (32 ft)', slug: 'truck-container-32', tonnage: '20 – 25 Ton',                                          basePricePerDay: 0 },
  { id: 'truck-trailer-40',   name: 'Trailer (40 ft)',         slug: 'truck-trailer-40',   tonnage: '25 – 40 Ton',   examples: 'Flatbed / Container',       basePricePerDay: 0 },
];
const USES_PRESETS = new Set(['bus', 'truck']);

const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const getTomorrow = () => {
  const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() + 1);
  return t;
};
const formatHumanDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
// Parse "HH:MM" into a Date (today, with that time) for DateTimePicker.
const hhmmToDate = (hhmm) => {
  const [h = '9', m = '00'] = (hhmm || '09:00').split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
  return d;
};
// Convert a Date back to "HH:MM" (24h, zero-padded).
const dateToHhmm = (d) => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};
// Friendly 12-hour render of "HH:MM" → e.g. "09:00 AM".
const formatTime12 = (hhmm) => {
  if (!hhmm) return '';
  const [h = '0', m = '00'] = hhmm.split(':');
  const hr = parseInt(h, 10) || 0;
  const period = hr >= 12 ? 'PM' : 'AM';
  const h12 = ((hr + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${(m || '00').padStart(2, '0')} ${period}`;
};
const enumerateDays = (startIso, endIso) => {
  if (!startIso || !endIso) return [];
  const out = [];
  const s = new Date(startIso); const e = new Date(endIso);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    out.push(toIsoDate(new Date(d)));
  }
  return out;
};
// DatePickerModal — custom in-app calendar modal that matches the app's
// purple theme. Renders the month grid, lets the user tap a day, and blocks
// days before `minimumDate` (used to forbid today/past on event start, and
// any date before the chosen start on event end).
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const stripTime = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isSameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function DatePickerModal({ visible, initialValue, minimumDate, rangeStart, onClose, onConfirm }) {
  // The month currently shown in the grid (1st of that month).
  const [viewMonth, setViewMonth] = useState(() => {
    const v = initialValue || new Date();
    return new Date(v.getFullYear(), v.getMonth(), 1);
  });
  // The day the user has tapped on (not yet confirmed).
  const [picked, setPicked] = useState(() => stripTime(initialValue || new Date()));

  // Reset whenever the modal re-opens so a fresh "value" prop sticks.
  useEffect(() => {
    if (!visible) return;
    const v = initialValue || new Date();
    setViewMonth(new Date(v.getFullYear(), v.getMonth(), 1));
    setPicked(stripTime(v));
  }, [visible, initialValue]);

  const minDay = minimumDate ? stripTime(minimumDate) : null;
  const today = stripTime(new Date());

  // Build the day cells for the current viewMonth — 6 weeks × 7 days.
  // Leading/trailing slots from neighbouring months are shown faintly.
  const cells = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstOfMonth = new Date(y, m, 1);
    const startWeekday = firstOfMonth.getDay(); // 0..6 (Sun..Sat)
    const gridStart = new Date(y, m, 1 - startWeekday);
    const out = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push(d);
    }
    return out;
  }, [viewMonth]);

  const goPrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleConfirm = () => {
    if (!picked) return;
    if (minDay && picked < minDay) return;
    onConfirm(picked);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.timePickerBackdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.datePickerCard}>
          {/* Header: month nav */}
          <View style={styles.datePickerHeader}>
            <Icon name="calendar" size={18} color={ACCENT} />
            <Text style={styles.timePickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto' }}>
              <Icon name="x" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Selected day preview — switches to a range summary in the
              End-date picker once both endpoints are known. */}
          {rangeStart && picked && picked >= stripTime(rangeStart) && !isSameDay(picked, rangeStart) ? (
            <View style={styles.dateRangePreview}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateRangeLabel}>Start</Text>
                <Text style={styles.dateRangeText}>
                  {`${rangeStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </Text>
                <Text style={styles.dateRangeWeekday}>
                  {rangeStart.toLocaleDateString('en-IN', { weekday: 'short' })}
                </Text>
              </View>
              <View style={styles.dateRangeArrow}>
                <Icon name="arrow-right" size={16} color={ACCENT} />
                <Text style={styles.dateRangeDays}>
                  {Math.round((stripTime(picked) - stripTime(rangeStart)) / (1000 * 60 * 60 * 24)) + 1} days
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.dateRangeLabel}>End</Text>
                <Text style={styles.dateRangeText}>
                  {`${picked.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </Text>
                <Text style={styles.dateRangeWeekday}>
                  {picked.toLocaleDateString('en-IN', { weekday: 'short' })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.dateBigPreview}>
              <Text style={styles.dateBigDay}>{picked ? picked.getDate() : '—'}</Text>
              <View>
                <Text style={styles.dateBigWeekday}>
                  {picked ? picked.toLocaleDateString('en-IN', { weekday: 'long' }) : ''}
                </Text>
                <Text style={styles.dateBigMonth}>
                  {picked ? `${MONTH_NAMES[picked.getMonth()]} ${picked.getFullYear()}` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Month nav row */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.monthNavBtn}>
              <Icon name="chevron-left" size={18} color={ACCENT_DARK} />
            </TouchableOpacity>
            <Text style={styles.monthNavTitle}>
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.monthNavBtn}>
              <Icon name="chevron-right" size={18} color={ACCENT_DARK} />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekLabel}>{w[0]}</Text>
            ))}
          </View>

          {/* Day grid — each cell has a centered fixed-size circle so the
              "picked" highlight is always a clean circle (not stretched).
              When rangeStart is set (End-date picker), days between
              rangeStart and picked get a light-purple band so the user
              sees the full event range as they pick. */}
          <View style={styles.dayGrid}>
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const disabled = minDay ? d < minDay : false;
              const isToday = isSameDay(d, today);
              const isPicked = isSameDay(d, picked);
              const rs = rangeStart ? stripTime(rangeStart) : null;
              const isRangeStart = rs && isSameDay(d, rs);
              // Only treat the picked day as range-end when it's actually
              // after the start (so the band doesn't draw backwards).
              const validRange = rs && picked && picked >= rs && !isSameDay(picked, rs);
              const isRangeEnd = validRange && isSameDay(d, picked);
              const inRangeMiddle = validRange && d > rs && d < picked;
              // Pick which band stripe to draw (back layer, behind circle).
              const bandStyle =
                inRangeMiddle ? [styles.rangeBand, styles.rangeBandFull] :
                isRangeStart && validRange ? [styles.rangeBand, styles.rangeBandRight] :
                isRangeEnd ? [styles.rangeBand, styles.rangeBandLeft] :
                null;
              return (
                <TouchableOpacity
                  key={i}
                  disabled={disabled}
                  onPress={() => setPicked(stripTime(d))}
                  activeOpacity={0.6}
                  style={styles.dayCell}
                >
                  {bandStyle && <View style={bandStyle} />}
                  <View
                    style={[
                      styles.dayCircle,
                      // Range start gets the same solid purple treatment as
                      // the picked end so both endpoints look the same.
                      (isPicked || isRangeStart) && styles.dayCirclePicked,
                      !isPicked && !isRangeStart && isToday && styles.dayCircleToday,
                      // Middle cells: no circle, just leave background bare
                      // so the band shows through.
                      inRangeMiddle && styles.dayCircleTransparent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        !inMonth && styles.dayCellOutOfMonth,
                        disabled && styles.dayCellDisabled,
                        isToday && !isPicked && !isRangeStart && styles.dayCellToday,
                        (isPicked || isRangeStart) && styles.dayCellPickedText,
                        inRangeMiddle && styles.dayCellInRange,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.timePickerActions}>
            <TouchableOpacity onPress={onClose} style={styles.timeCancelBtn}>
              <Text style={styles.timeCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.timeConfirmBtn}>
              <Text style={styles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// TimePickerModal — custom in-app time picker that matches the app's
// purple theme. Three vertical wheels (hour / minute / AM-PM) backed by
// scroll-snap ScrollViews so the centred row is the selection.
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);  // 0..55 in 5-min steps
const PERIODS = ['AM', 'PM'];
const ROW_H = 44; // single wheel row height (must match style)

function TimeWheel({ items, valueIdx, onChange, formatItem }) {
  const ref = React.useRef(null);
  // Keep wheel synced when the parent updates valueIdx (e.g. on open).
  useEffect(() => {
    if (ref.current && typeof valueIdx === 'number') {
      requestAnimationFrame(() => {
        try { ref.current.scrollTo({ y: valueIdx * ROW_H, animated: false }); } catch {}
      });
    }
  }, [valueIdx]);
  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_H}
      decelerationRate="fast"
      contentContainerStyle={{ paddingVertical: ROW_H }}
      onMomentumScrollEnd={(e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ROW_H);
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        onChange(clamped);
      }}
    >
      {items.map((item, i) => {
        const isActive = i === valueIdx;
        return (
          <View key={i} style={styles.wheelRow}>
            <Text style={[styles.wheelText, isActive && styles.wheelTextActive]}>
              {formatItem ? formatItem(item) : item}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function TimePickerModal({ visible, initialValue, onClose, onConfirm }) {
  // Parse the incoming "HH:MM" into wheel positions on open.
  const [h12, setH12] = useState(0);         // index into HOURS_12
  const [minIdx, setMinIdx] = useState(0);   // index into MINUTES
  const [periodIdx, setPeriodIdx] = useState(0); // 0 AM, 1 PM

  useEffect(() => {
    if (!visible) return;
    const [hStr = '9', mStr = '00'] = (initialValue || '09:00').split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    setPeriodIdx(h >= 12 ? 1 : 0);
    const h12Val = ((h + 11) % 12) + 1; // 1..12
    setH12(Math.max(0, HOURS_12.indexOf(h12Val)));
    // Snap minute to nearest 5-min slot
    const nearestMin = Math.round(m / 5) * 5;
    setMinIdx(Math.max(0, MINUTES.indexOf(nearestMin === 60 ? 0 : nearestMin)));
  }, [visible, initialValue]);

  const handleConfirm = () => {
    const hr12 = HOURS_12[h12];
    const min = MINUTES[minIdx];
    const period = PERIODS[periodIdx];
    // Convert back to 24h "HH:MM"
    let hr24 = hr12 % 12;
    if (period === 'PM') hr24 += 12;
    onConfirm(`${String(hr24).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.timePickerBackdrop}>
        {/* Separate dismiss layer behind the card so it doesn't intercept
            the wheels' scroll gestures. */}
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.timePickerCard}>
          {/* Header */}
          <View style={styles.timePickerHeader}>
            <Icon name="clock" size={18} color={ACCENT} />
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto' }}>
              <Icon name="x" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Big preview of current selection */}
          <View style={styles.timePreview}>
            <Text style={styles.timePreviewText}>
              {String(HOURS_12[h12]).padStart(2, '0')}
              <Text style={{ color: ACCENT }}>{':'}</Text>
              {String(MINUTES[minIdx]).padStart(2, '0')}
              <Text style={styles.timePreviewPeriod}>{` ${PERIODS[periodIdx]}`}</Text>
            </Text>
          </View>

          {/* Three wheels */}
          <View style={styles.wheelRowWrap}>
            {/* Selection band (centred, behind the wheels) */}
            <View pointerEvents="none" style={styles.wheelHighlight} />
            <TimeWheel
              items={HOURS_12}
              valueIdx={h12}
              onChange={setH12}
              formatItem={(n) => String(n).padStart(2, '0')}
            />
            <Text style={styles.wheelSep}>:</Text>
            <TimeWheel
              items={MINUTES}
              valueIdx={minIdx}
              onChange={setMinIdx}
              formatItem={(n) => String(n).padStart(2, '0')}
            />
            <TimeWheel
              items={PERIODS}
              valueIdx={periodIdx}
              onChange={setPeriodIdx}
            />
          </View>

          {/* Actions */}
          <View style={styles.timePickerActions}>
            <TouchableOpacity onPress={onClose} style={styles.timeCancelBtn}>
              <Text style={styles.timeCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.timeConfirmBtn}>
              <Text style={styles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// AppAlert — themed alert/confirmation modal that replaces native Alert.alert.
// Used for success / warning / error toasts and booking confirmation.
const ALERT_TYPES = {
  success: { icon: 'check-circle', color: '#059669', bg: '#D1FAE5', ring: '#A7F3D0' },
  warning: { icon: 'alert-triangle', color: '#B45309', bg: '#FEF3C7', ring: '#FDE68A' },
  error:   { icon: 'alert-octagon', color: '#B91C1C', bg: '#FEE2E2', ring: '#FCA5A5' },
  info:    { icon: 'info',         color: ACCENT_DARK, bg: '#F5F3FF', ring: '#E9D5FF' },
};
function AppAlert({ visible, type = 'info', title, message, buttons, onClose }) {
  const meta = ALERT_TYPES[type] || ALERT_TYPES.info;
  const list = (buttons && buttons.length > 0) ? buttons : [{ label: 'OK' }];
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.alertBackdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.alertCard}>
          <View style={[styles.alertIconCircle, { backgroundColor: meta.bg, borderColor: meta.ring }]}>
            <Icon name={meta.icon} size={26} color={meta.color} />
          </View>
          <Text style={styles.alertTitle}>{title || ''}</Text>
          {!!message && <Text style={styles.alertMessage}>{message}</Text>}
          <View style={[styles.alertActions, list.length === 1 && { justifyContent: 'center' }]}>
            {list.map((b, i) => {
              const isCancel = b.style === 'cancel';
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (onClose) onClose();
                    if (b.onPress) b.onPress();
                  }}
                  style={[
                    styles.alertBtn,
                    isCancel ? styles.alertBtnCancel : { backgroundColor: meta.color },
                    list.length === 1 && { flex: 0, minWidth: 140 },
                  ]}
                >
                  <Text style={isCancel ? styles.alertBtnTextCancel : styles.alertBtnTextPrimary}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// TimeField — tappable button that opens the custom TimePickerModal and
// emits the chosen time as "HH:MM". Used for event start/end and per-
// service pickup-time inputs.
function TimeField({ label, value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.timeField, { borderColor: accent ? accent : BORDER }]}
        activeOpacity={0.7}
      >
        <Icon name="clock" size={14} color={accent || MUTED} />
        <Text style={styles.timeFieldText}>{formatTime12(value)}</Text>
        <Icon name="chevron-down" size={14} color={MUTED} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
      <TimePickerModal
        visible={open}
        initialValue={value}
        onClose={() => setOpen(false)}
        onConfirm={(hhmm) => { onChange(hhmm); setOpen(false); }}
      />
    </View>
  );
}

const makeEmptyService = () => ({
  serviceType: 'car',
  selectedVehicles: [], // [{ vehicleId, count, name, brand, slug, dailyRate }]
  peopleCount: 4,
  pickupLocation: '',
  dropLocation: '',
  pickupTime: '09:00',
  notes: '',
});
const makeEmptyDay = (date) => ({ date, services: [makeEmptyService()], copiedFrom: null });

export default function CustomBookingScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const scrollFocusedInputIntoView = (event) => {
    const inputHandle = findNodeHandle(event.target);
    setTimeout(() => {
      if (!scrollRef.current || !inputHandle) return;
      const scrollHandle = findNodeHandle(scrollRef.current);
      if (!scrollHandle) return;
      scrollRef.current.measure((sx, sy, sWidth, sHeight) => {
        UIManager.measureLayout(
          inputHandle,
          scrollHandle,
          () => {},
          (x, y, width, height) => {
            const target = y + height - sHeight + 130;
            scrollRef.current.scrollTo({ y: Math.max(target, 0), animated: true });
          }
        );
      });
    }, 280);
  };

  // ── Step state ────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1: event details ────────────────────────────────────────────
  const [occasionType, setOccasionType] = useState('');
  const [occasionName, setOccasionName] = useState('');
  const [startDate, setStartDate] = useState(getTomorrow());
  const [endDate, setEndDate] = useState(() => {
    const t = getTomorrow(); t.setDate(t.getDate() + 1); return t;
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [totalPeople, setTotalPeople] = useState('10');
  const [baseLocation, setBaseLocation] = useState('');
  const [baseLocationId, setBaseLocationId] = useState(null);
  const [baseLocationSlug, setBaseLocationSlug] = useState('');
  const [allLocations, setAllLocations] = useState([]);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityList, setShowCityList] = useState(false);
  const [customerAddress, setCustomerAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Date/time picker visibility
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  // ── Step 2: days plan ────────────────────────────────────────────────
  const [days, setDays] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);   // dayIndex string
  const [fleetByService, setFleetByService] = useState({}); // { serviceId: [vehicles] }
  const [fleetLoading, setFleetLoading] = useState(false);

  // ── Themed alert modal (replaces native Alert.alert) ─────────────────
  const [appAlert, setAppAlert] = useState(null); // null | { type, title, message, buttons }
  const showAlert = (config) => setAppAlert(config);
  const closeAlert = () => setAppAlert(null);

  // ── Step 3: customer info ────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Phase 7 — TA booking-mode state.
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });

  // Preload customer info if available
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('customer');
        if (raw) {
          const c = JSON.parse(raw);
          setCustomerName(c?.name || '');
          setCustomerEmail(c?.email || '');
          setCustomerPhone(c?.phone || '');
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Load city list once
  useEffect(() => {
    (async () => {
      try {
        const res = await locationService.getLocations?.();
        const list = res?.locations || res?.data || res || [];
        if (Array.isArray(list)) setAllLocations(list);
      } catch { /* network */ }
    })();
  }, []);

  // Rebuild day list whenever the date range changes
  useEffect(() => {
    const range = enumerateDays(toIsoDate(startDate), toIsoDate(endDate));
    setDays((prev) => range.map((date) => {
      const existing = prev.find((d) => d.date === date);
      return existing || makeEmptyDay(date);
    }));
  }, [startDate, endDate]);

  // Fetch fleet for a service the first time it's asked for, scoped to base city.
  // - bus + truck: use the hardcoded category presets (quote-based services,
  //   no per-city fleet listing) — same approach the web custom-booking form
  //   uses.
  // - everything else: hit /api/booking/picker (same endpoint the web hits).
  //   This returns categories for car-rental / luxury-car-rental and
  //   vehicle_models for the rest, all in a unified shape with city scope.
  const ensureFleet = async (serviceId) => {
    if (fleetByService[serviceId]) return;
    if (USES_PRESETS.has(serviceId)) {
      const presets = serviceId === 'bus' ? BUS_SEATER_PRESETS : TRUCK_PRESETS;
      setFleetByService((prev) => ({ ...prev, [serviceId]: presets }));
      return;
    }
    const svc = SERVICES.find((s) => s.id === serviceId);
    if (!svc || !baseLocationSlug) return;
    setFleetLoading(true);
    try {
      const res = await api.get('/booking/picker', {
        params: { service: svc.slug, location: baseLocationSlug },
      });
      const data = res?.data || {};
      const list = data.items || data.fleet || [];
      setFleetByService((prev) => ({ ...prev, [serviceId]: Array.isArray(list) ? list : [] }));
    } catch {
      setFleetByService((prev) => ({ ...prev, [serviceId]: [] }));
    } finally {
      setFleetLoading(false);
    }
  };

  // Whenever the user expands a day, prefetch fleet for each service inside it
  useEffect(() => {
    if (!expandedDay) return;
    const idx = parseInt(expandedDay, 10);
    const day = days[idx];
    if (!day) return;
    day.services.forEach((s) => ensureFleet(s.serviceType));
  }, [expandedDay, days, baseLocationSlug]);

  // ── Derived values ───────────────────────────────────────────────────
  const totalDays = days.length;
  const totalNights = Math.max(totalDays - 1, 0);
  const totalVehicles = useMemo(() => {
    let n = 0;
    for (const d of days) for (const s of d.services) for (const v of s.selectedVehicles) n += v.count;
    return n;
  }, [days]);
  const totalServices = useMemo(() => days.reduce((acc, d) => acc + d.services.length, 0), [days]);
  const estimatedCost = useMemo(() => {
    let total = 0;
    for (const d of days) for (const s of d.services) {
      for (const v of s.selectedVehicles) total += (v.dailyRate || 0) * (v.count || 1);
    }
    return total;
  }, [days]);

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return allLocations.slice(0, 8);
    const q = cityQuery.toLowerCase();
    return allLocations.filter((c) => (c.name || c.city || '').toLowerCase().includes(q)).slice(0, 8);
  }, [allLocations, cityQuery]);

  // ── Step 1 helpers ───────────────────────────────────────────────────
  // Use the custom DatePickerModal for both platforms — same purple-themed UI
  // as the time picker, so the form feels cohesive.
  const openStartDate = () => setShowStartDate(true);
  const openEndDate = () => setShowEndDate(true);
  const handleStartDateConfirm = (picked) => {
    setShowStartDate(false);
    if (!picked) return;
    setStartDate(picked);
    if (endDate < picked) setEndDate(picked);
  };
  const handleEndDateConfirm = (picked) => {
    setShowEndDate(false);
    if (!picked) return;
    if (picked < startDate) {
      showAlert({
        type: 'warning',
        title: 'End date must be after start',
        message: 'Pick an end date that\'s on or after the event start.',
      });
      return;
    }
    setEndDate(picked);
  };

  const pickCity = (loc) => {
    setBaseLocation(loc.name || loc.city || '');
    setBaseLocationId(loc.id || null);
    setBaseLocationSlug(loc.slug || loc.citySlug || (loc.name || '').toLowerCase().replace(/\s+/g, '-'));
    setShowCityList(false);
    setCityQuery('');
    setFleetByService({}); // city changed → reset fleet cache
  };

  const canContinueStep1 =
    occasionType &&
    startDate && endDate &&
    baseLocationSlug &&
    customerAddress.trim() &&
    destinationAddress.trim();

  // ── Step 2 helpers — mutate `days` immutably ─────────────────────────
  // Editing the day clears any "Copied from Day X" mark — the day no longer
  // matches its source.
  const updateService = (dayIdx, serviceIdx, patch) => {
    setDays((prev) => prev.map((d, di) => {
      if (di !== dayIdx) return d;
      const services = d.services.map((s, si) => (si === serviceIdx ? { ...s, ...patch } : s));
      return { ...d, services, copiedFrom: null };
    }));
  };
  const addService = (dayIdx) => {
    setDays((prev) => prev.map((d, di) => (di === dayIdx ? { ...d, services: [...d.services, makeEmptyService()], copiedFrom: null } : d)));
  };
  const removeService = (dayIdx, serviceIdx) => {
    setDays((prev) => prev.map((d, di) => {
      if (di !== dayIdx) return d;
      if (d.services.length <= 1) return d;
      return { ...d, services: d.services.filter((_, si) => si !== serviceIdx), copiedFrom: null };
    }));
  };

  // Replace `toIdx`'s services with a deep-clone of `fromIdx`'s services.
  // Used by the "Copy from Day X" chips so a customer doesn't have to re-fill
  // an identical day. Cloning keeps subsequent edits independent.
  // Marks the day with copiedFrom so a "Copied from Day X" badge can render
  // until the user edits anything on that day.
  const copyServicesFromDay = (toIdx, fromIdx) => {
    setDays((prev) => {
      const fromDay = prev[fromIdx];
      if (!fromDay) return prev;
      const cloned = fromDay.services.map((s) => ({
        ...s,
        selectedVehicles: s.selectedVehicles.map((v) => ({ ...v })),
      }));
      return prev.map((d, di) =>
        (di === toIdx ? { ...d, services: cloned, copiedFrom: fromIdx } : d));
    });
    // Make sure the fleet for each pasted service is cached so the vehicles
    // show up immediately in the picker.
    const fromDay = days[fromIdx];
    if (fromDay) fromDay.services.forEach((s) => ensureFleet(s.serviceType));
  };

  // ── Copy-to-many-days modal ───────────────────────────────────────────
  // Customer picks one source day and multi-selects destinations. Useful
  // for symmetric events where every day uses the same fleet.
  const [copyToModal, setCopyToModal] = useState({ visible: false, fromIdx: null, selected: [] });
  const openCopyToModal = (fromIdx) => {
    setCopyToModal({ visible: false, fromIdx: null, selected: [] });
    // Defer so the close→open transition triggers a fresh state on the modal.
    setTimeout(() => setCopyToModal({ visible: true, fromIdx, selected: [] }), 0);
  };
  const closeCopyToModal = () => setCopyToModal({ visible: false, fromIdx: null, selected: [] });
  const toggleCopyTarget = (idx) => {
    setCopyToModal((prev) => ({
      ...prev,
      selected: prev.selected.includes(idx)
        ? prev.selected.filter((x) => x !== idx)
        : [...prev.selected, idx],
    }));
  };
  const selectAllCopyTargets = (allEligibleIdxs) => {
    setCopyToModal((prev) => ({ ...prev, selected: allEligibleIdxs }));
  };
  const clearCopyTargets = () => {
    setCopyToModal((prev) => ({ ...prev, selected: [] }));
  };
  const applyCopyToTargets = () => {
    const { fromIdx, selected } = copyToModal;
    if (fromIdx == null || selected.length === 0) {
      closeCopyToModal();
      return;
    }
    setDays((prev) => {
      const src = prev[fromIdx];
      if (!src) return prev;
      const cloneServices = () => src.services.map((s) => ({
        ...s,
        selectedVehicles: s.selectedVehicles.map((v) => ({ ...v })),
      }));
      return prev.map((d, di) => {
        if (di === fromIdx || !selected.includes(di)) return d;
        return { ...d, services: cloneServices(), copiedFrom: fromIdx };
      });
    });
    const src = days[fromIdx];
    if (src) src.services.forEach((s) => ensureFleet(s.serviceType));
    closeCopyToModal();
  };
  const setVehicleCount = (dayIdx, serviceIdx, vehicle, nextCount) => {
    setDays((prev) => prev.map((d, di) => {
      if (di !== dayIdx) return d;
      const services = d.services.map((s, si) => {
        if (si !== serviceIdx) return s;
        const without = s.selectedVehicles.filter((v) => v.vehicleId !== vehicle.id);
        if (nextCount <= 0) return { ...s, selectedVehicles: without };
        const next = {
          vehicleId: vehicle.id,
          count: nextCount,
          name: vehicle.name || vehicle.vehicleName || vehicle.modelName || 'Vehicle',
          brand: vehicle.brand || vehicle.brandName || vehicle.brands?.name || '',
          slug: vehicle.slug || null,
          dailyRate: vehicle.basePricePerDay || vehicle.dailyRate || vehicle.price || 0,
        };
        return { ...s, selectedVehicles: [...without, next] };
      });
      return { ...d, services, copiedFrom: null };
    }));
  };
  const getVehicleCount = (day, serviceIdx, vehicleId) => {
    const s = day.services[serviceIdx];
    return s?.selectedVehicles.find((v) => v.vehicleId === vehicleId)?.count || 0;
  };

  const canContinueStep2 =
    days.length > 0 &&
    days.every((d) => d.services.length > 0 && d.services.every((s) => s.selectedVehicles.length > 0));

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setSubmitError('Please fill in your name, email, and phone.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    setSubmitting(true);
    try {
      const startIso = toIsoDate(startDate);
      const endIso = toIsoDate(endDate);
      // Phase 7 — pull cached customer once to inspect linkedTravelAgentId.
      const cachedCustomer = await getCachedCustomer();
      const isTA = isTravelAgentCustomer(cachedCustomer);
      const payload = {
        bookingType: 'custom-bulk',
        customerInfo: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
        },
        // Phase 7 — top-level TA fields (some backend routes read these here).
        ...(isTA && {
          taBookingMode: taState.mode,
          numberOfVehicles: taState.mode === 'COMPANY'
            ? (parseInt(taState.vehicleCount) || 1)
            : 1,
          numberOfEmployees: taState.mode === 'COMPANY' && taState.employeeCount
            ? parseInt(taState.employeeCount)
            : null,
        }),
        bookingData: {
          service_id: 99,
          service_name: 'Custom Bulk Booking',
          occasion_type: occasionType,
          occasion_name: occasionName.trim(),
          total_days: totalDays,
          total_people: parseInt(totalPeople, 10) || 0,
          start_date: startIso,
          start_time: startTime,
          end_date: endIso,
          end_time: endTime,
          start_datetime: `${startIso} ${startTime}:00`,
          end_datetime: `${endIso} ${endTime}:00`,
          base_location: baseLocation,
          base_location_id: baseLocationId,
          base_location_slug: baseLocationSlug,
          customer_address: customerAddress.trim(),
          destination_address: destinationAddress.trim(),
          total_vehicles: totalVehicles,
          total_services: totalServices,
          estimated_cost: estimatedCost,
          special_requirements: specialRequirements.trim(),
          source: 'app',
          days: days.map((d) => ({
            date: d.date,
            services: d.services.map((s) => ({
              service_type: s.serviceType,
              total_vehicles: s.selectedVehicles.reduce((acc, v) => acc + v.count, 0),
              estimated_cost: s.selectedVehicles.reduce((acc, v) => acc + (v.dailyRate || 0) * v.count, 0),
              vehicles: s.selectedVehicles.map((v) => ({
                vehicle_id: v.vehicleId,
                vehicle_slug: v.slug,
                vehicle_name: `${v.brand ? v.brand + ' ' : ''}${v.name}`,
                vehicle_brand: v.brand || null,
                daily_rate: v.dailyRate || 0,
                count: v.count,
              })),
              people_count: s.peopleCount,
              pickup_location: s.pickupLocation,
              pickup_location_id: null,
              drop_location: s.dropLocation,
              pickup_time: s.pickupTime,
              notes: s.notes,
            })),
          })),
        },
      };
      const res = await api.post('/bookings', payload);
      const data = res?.data || {};
      if (data?.success === false) {
        setSubmitError(data?.message || 'Failed to submit booking. Please try again.');
        return;
      }
      // Booking created — go to confirmation/dashboard
      showAlert({
        type: 'success',
        title: 'Booking received!',
        message: `Your event ${data?.bookingNumber ? `(${data.bookingNumber}) ` : ''}is in. Our team will share quotes shortly.`,
        buttons: [
          { label: 'View My Bookings', onPress: () => navigation.navigate('CustomerDashboard') },
        ],
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────
  const renderStepBar = () => (
    <View style={styles.stepBar}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={styles.stepCell}>
          <View style={[styles.stepDot, step >= n && { backgroundColor: ACCENT }]}>
            {step > n ? (
              <Icon name="check" size={14} color="#fff" />
            ) : (
              <Text style={[styles.stepDotText, step >= n && { color: '#fff' }]}>{n}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, step >= n && { color: ACCENT, fontWeight: '700' }]}>
            {n === 1 ? 'Event' : n === 2 ? 'Plan' : 'Confirm'}
          </Text>
          {n < 3 && <View style={[styles.stepLine, step > n && { backgroundColor: ACCENT }]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>What's the occasion?</Text>
      <View style={styles.chipRow}>
        {OCCASIONS.map((o) => (
          <TouchableOpacity
            key={o.id}
            onPress={() => setOccasionType(o.id)}
            style={[styles.chip, occasionType === o.id && styles.chipActive]}
          >
            <Text style={{ marginRight: 6 }}>{o.emoji}</Text>
            <Text style={[styles.chipText, occasionType === o.id && { color: '#fff' }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Event Name (optional)</Text>
      <TextInput
        style={styles.input}
        value={occasionName}
        onChangeText={setOccasionName}
        placeholder="e.g. Sharma Wedding, Annual Sales Meet"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Event Dates</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.input, { flex: 1, justifyContent: 'center' }]}
          onPress={openStartDate}
        >
          <Text style={styles.subtle}>Starts</Text>
          <Text style={styles.value}>{formatHumanDate(toIsoDate(startDate))}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.input, { flex: 1, justifyContent: 'center' }]}
          onPress={openEndDate}
        >
          <Text style={styles.subtle}>Ends</Text>
          <Text style={styles.value}>{formatHumanDate(toIsoDate(endDate))}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, { marginTop: 4 }]}>
        {totalDays} day{totalDays === 1 ? '' : 's'}{totalNights > 0 ? ` · ${totalNights} night${totalNights === 1 ? '' : 's'}` : ''}
      </Text>
      {/* Custom calendar modal (purple themed, same on iOS + Android). */}
      <DatePickerModal
        visible={showStartDate}
        initialValue={startDate}
        minimumDate={getTomorrow()}
        onClose={() => setShowStartDate(false)}
        onConfirm={handleStartDateConfirm}
      />
      <DatePickerModal
        visible={showEndDate}
        initialValue={endDate}
        minimumDate={startDate}
        rangeStart={startDate}
        onClose={() => setShowEndDate(false)}
        onConfirm={handleEndDateConfirm}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <TimeField label="Start Time" value={startTime} onChange={setStartTime} accent={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="End Time" value={endTime} onChange={setEndTime} accent={ACCENT} />
        </View>
      </View>

      <Text style={styles.label}>Total People</Text>
      <TextInput style={styles.input} value={totalPeople} onChangeText={(t) => setTotalPeople(t.replace(/\D/g, ''))} keyboardType="numeric" />

      <Text style={styles.label}>Base City</Text>
      <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowCityList(true)}>
        <Text style={{ color: baseLocation ? TEXT : '#9CA3AF', fontSize: 15 }}>
          {baseLocation || 'Choose your base city'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Your Pickup Address</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        value={customerAddress}
        onChangeText={setCustomerAddress}
        placeholder="Address where vehicles arrive on Day 1"
        placeholderTextColor="#9CA3AF"
        multiline
        onFocus={scrollFocusedInputIntoView}
      />

      <Text style={styles.label}>Main Destination / Venue</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        value={destinationAddress}
        onChangeText={setDestinationAddress}
        placeholder="e.g. Venue address, hotel, etc."
        placeholderTextColor="#9CA3AF"
        multiline
        onFocus={scrollFocusedInputIntoView}
      />

      <Text style={styles.label}>Special Requirements (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        value={specialRequirements}
        onChangeText={setSpecialRequirements}
        placeholder="Anything else our team should know?"
        placeholderTextColor="#9CA3AF"
        multiline
        onFocus={scrollFocusedInputIntoView}
      />
    </View>
  );

  const renderVehicleList = (dayIdx, serviceIdx) => {
    const day = days[dayIdx];
    const service = day.services[serviceIdx];
    const usesPresets = USES_PRESETS.has(service.serviceType);
    const isTruck = service.serviceType === 'truck';
    const fleet = fleetByService[service.serviceType] || [];
    // Bus + truck use hardcoded presets, so they don't need the base city.
    if (!baseLocationSlug && !usesPresets) {
      return <Text style={styles.hint}>Pick a base city first.</Text>;
    }
    if (!usesPresets && fleetLoading && fleet.length === 0) {
      return <ActivityIndicator color={ACCENT} style={{ marginVertical: 12 }} />;
    }
    if (fleet.length === 0) {
      return (
        <Text style={styles.hint}>
          No vehicles listed for this service in {baseLocation} yet. Submit anyway — our team will arrange a custom quote.
        </Text>
      );
    }
    return (
      <View style={{ marginTop: 8 }}>
        {usesPresets && (
          <Text style={[styles.hint, { marginBottom: 8 }]}>
            {isTruck
              ? 'Pick a truck size — final vehicle confirmed by the vendor.'
              : 'Pick a capacity — final bus confirmed by the vendor.'}
          </Text>
        )}
        {fleet.map((v) => {
          const id = v.id || v.fleetId;
          const brand = v.brand || v.brandName || v.brands?.name || '';
          const modelName = v.name || v.vehicleName || v.modelName || 'Vehicle';
          const count = getVehicleCount(day, serviceIdx, id);
          const isSelected = count > 0;

          // Build the chip list — different fields make sense per service.
          const chips = [];
          if (isTruck) {
            if (v.tonnage) chips.push({ icon: 'package', text: v.tonnage });
            if (v.examples) chips.push({ icon: 'truck', text: v.examples });
          } else {
            if (v.seatingCapacity || v.seating)
              chips.push({ icon: 'users', text: `${v.seatingCapacity || v.seating} seats` });
            if (v.fuelType || v.fuel)
              chips.push({ icon: 'droplet', text: v.fuelType || v.fuel });
            if (v.transmission)
              chips.push({ icon: 'settings', text: v.transmission });
            if (v.acType)
              chips.push({ icon: 'wind', text: v.acType });
          }
          // Bikes + self-drive are quote-based on this flow — fleet may
          // carry a rate but showing it on the picker is misleading
          // (customer sees the final number after the vendor quote).
          const showRate = service.serviceType !== 'bike' && service.serviceType !== 'selfdrive';
          const rate = showRate ? (v.basePricePerDay || v.dailyRate || v.price) : 0;
          const image = v.image || v.sideImage || (Array.isArray(v.images) ? v.images[0] : null);

          return (
            <View
              key={id}
              style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
            >
              {/* Thumbnail (skipped for bus/truck presets — no image available) */}
              {!usesPresets && (
                <View style={styles.vehicleThumb}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.vehicleThumbImg} resizeMode="cover" />
                  ) : (
                    <Icon
                      name={service.serviceType === 'bike' ? 'cpu' : 'truck'}
                      size={24}
                      color="#9CA3AF"
                    />
                  )}
                </View>
              )}
              {usesPresets && (
                <View style={[styles.vehicleThumb, styles.vehicleThumbPreset]}>
                  <Icon name={isTruck ? 'truck' : 'users'} size={26} color={ACCENT_DARK} />
                </View>
              )}

              {/* Body — name + chips */}
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleCardName} numberOfLines={1}>
                  {brand ? <Text style={styles.vehicleCardBrand}>{brand} </Text> : null}
                  {modelName}
                </Text>
                {chips.length > 0 && (
                  <View style={styles.vehicleChipRow}>
                    {chips.map((c, i) => (
                      <View key={i} style={styles.vehicleChip}>
                        <Icon name={c.icon} size={10} color={ACCENT_DARK} />
                        <Text style={styles.vehicleChipText} numberOfLines={1}>{c.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {rate ? (
                  <Text style={styles.vehicleCardRate}>
                    ₹{Number(rate).toLocaleString('en-IN')} <Text style={styles.vehicleCardRateUnit}>/ day</Text>
                  </Text>
                ) : null}
              </View>

              {/* Quantity controls — sits as a pill on the right edge */}
              {count === 0 ? (
                <TouchableOpacity
                  onPress={() => setVehicleCount(dayIdx, serviceIdx, v, 1)}
                  style={styles.vehicleAddBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="plus" size={14} color="#fff" />
                  <Text style={styles.vehicleAddBtnText}>Add</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.vehicleQtyPill}>
                  <TouchableOpacity
                    onPress={() => setVehicleCount(dayIdx, serviceIdx, v, Math.max(count - 1, 0))}
                    style={styles.vehicleQtyBtn}
                    activeOpacity={0.7}
                  >
                    <Icon name="minus" size={14} color={ACCENT_DARK} />
                  </TouchableOpacity>
                  <Text style={styles.vehicleQtyNum}>{count}</Text>
                  <TouchableOpacity
                    onPress={() => setVehicleCount(dayIdx, serviceIdx, v, count + 1)}
                    style={styles.vehicleQtyBtn}
                    activeOpacity={0.7}
                  >
                    <Icon name="plus" size={14} color={ACCENT_DARK} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderStep2 = () => (
    <View style={{ padding: 16 }}>
      <View style={styles.summaryCard}>
        <Icon name="calendar" size={18} color={ACCENT} />
        <Text style={styles.summaryText}>
          {totalDays}-day event in {baseLocation || '—'} · {totalServices} service{totalServices === 1 ? '' : 's'} · {totalVehicles} vehicle{totalVehicles === 1 ? '' : 's'}
        </Text>
      </View>

      {days.map((day, dayIdx) => {
        const isOpen = String(dayIdx) === expandedDay;
        const isCopied = typeof day.copiedFrom === 'number';
        return (
          <View key={day.date} style={[styles.dayCard, isCopied && styles.dayCardCopied]}>
            <TouchableOpacity onPress={() => setExpandedDay(isOpen ? null : String(dayIdx))} style={styles.dayHeader}>
              <View style={[styles.dayPill, isCopied && styles.dayPillCopied]}>
                <Text style={[styles.dayPillText, isCopied && styles.dayPillTextCopied]}>D{dayIdx + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.dayTitle}>Day {dayIdx + 1} · {formatHumanDate(day.date)}</Text>
                  {isCopied && (
                    <View style={styles.copiedBadge}>
                      <Icon name="corner-up-left" size={10} color="#065F46" />
                      <Text style={styles.copiedBadgeText}>Copied from Day {day.copiedFrom + 1}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dayMeta}>{day.services.length} service{day.services.length === 1 ? '' : 's'}</Text>
              </View>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={MUTED} />
            </TouchableOpacity>

            {isOpen && (
              <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: BORDER }}>
                {/* Copy THIS day to other days — shown when this day has
                    any picked vehicles and the event has multiple days. */}
                {days.length > 1 && day.services.some((s) => s.selectedVehicles.length > 0) && (
                  <TouchableOpacity
                    onPress={() => openCopyToModal(dayIdx)}
                    style={styles.copyToBtn}
                    activeOpacity={0.7}
                  >
                    <Icon name="copy" size={13} color={ACCENT} />
                    <Text style={styles.copyToBtnText}>Copy this day to other days</Text>
                  </TouchableOpacity>
                )}

                {/* Copy services from a previous day. Hidden on Day 1
                    (nothing to copy from). Dim chips for empty source days. */}
                {dayIdx > 0 && (
                  <View style={styles.copyFromRow}>
                    <Icon name="copy" size={12} color={MUTED} />
                    <Text style={styles.copyFromLabel}>Copy from</Text>
                    {days.slice(0, dayIdx).map((srcDay, srcIdx) => {
                      const hasContent = srcDay.services.some((s) => s.selectedVehicles.length > 0);
                      return (
                        <TouchableOpacity
                          key={srcIdx}
                          onPress={() => copyServicesFromDay(dayIdx, srcIdx)}
                          disabled={!hasContent}
                          style={[styles.copyFromPill, !hasContent && styles.copyFromPillDim]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.copyFromPillText, !hasContent && { color: '#9CA3AF' }]}>
                            Day {srcIdx + 1}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {day.services.map((service, serviceIdx) => (
                  <View key={serviceIdx} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceTitle}>Service {serviceIdx + 1}</Text>
                      {day.services.length > 1 && (
                        <TouchableOpacity onPress={() => removeService(dayIdx, serviceIdx)}>
                          <Icon name="trash-2" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Service type tabs */}
                    <View style={styles.chipRow}>
                      {SERVICES.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => {
                            if (service.serviceType === s.id) return;
                            updateService(dayIdx, serviceIdx, { serviceType: s.id, selectedVehicles: [] });
                            ensureFleet(s.id);
                          }}
                          style={[styles.miniChip, service.serviceType === s.id && styles.chipActive]}
                        >
                          <Text style={[styles.miniChipText, service.serviceType === s.id && { color: '#fff' }]}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {service.serviceType === 'selfdrive' && (
                      <View style={styles.infoBox}>
                        <Icon name="key" size={14} color={ACCENT_DARK} />
                        <Text style={styles.infoBoxText}>
                          <Text style={{ fontWeight: '700' }}>Driver not included.</Text> Self-drive means you drive the vehicle yourself. Carry your DL & ID at pickup.
                        </Text>
                      </View>
                    )}

                    <Text style={styles.label}>Choose Vehicles</Text>
                    {renderVehicleList(dayIdx, serviceIdx)}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>People</Text>
                        <TextInput
                          style={styles.input}
                          value={String(service.peopleCount)}
                          onChangeText={(t) => updateService(dayIdx, serviceIdx, { peopleCount: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TimeField
                          label="Pickup Time"
                          value={service.pickupTime}
                          onChange={(t) => updateService(dayIdx, serviceIdx, { pickupTime: t })}
                          accent={ACCENT}
                        />
                      </View>
                    </View>

                    <Text style={styles.label}>Pickup Location</Text>
                    <TextInput
                      style={styles.input}
                      value={service.pickupLocation}
                      onChangeText={(t) => updateService(dayIdx, serviceIdx, { pickupLocation: t })}
                      placeholder="Pickup address for this service"
                      placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Drop Location</Text>
                    <TextInput
                      style={styles.input}
                      value={service.dropLocation}
                      onChangeText={(t) => updateService(dayIdx, serviceIdx, { dropLocation: t })}
                      placeholder="Drop address (optional)"
                      placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 50 }]}
                      value={service.notes}
                      onChangeText={(t) => updateService(dayIdx, serviceIdx, { notes: t })}
                      placeholder="Anything specific for this service?"
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>
                ))}

                <TouchableOpacity onPress={() => addService(dayIdx)} style={styles.addBtn}>
                  <Icon name="plus" size={14} color={ACCENT} />
                  <Text style={{ color: ACCENT, fontWeight: '700', marginLeft: 6 }}>Add another service for Day {dayIdx + 1}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderStep3 = () => (
    <View style={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>Your Contact Details</Text>
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Full name" placeholderTextColor="#9CA3AF" />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={customerEmail} onChangeText={setCustomerEmail} placeholder="you@example.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.label}>Phone (10-digit)</Text>
      <TextInput style={styles.input} value={customerPhone} onChangeText={(t) => setCustomerPhone(t.replace(/\D/g, '').slice(0, 10))} placeholder="98xxxxxxxx" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} />

      {/* Phase 7 — TA Personal/Company toggle (self-gated). */}
      <TravelAgentBookingToggle value={taState} onChange={setTaState} />

      <View style={styles.reviewCard}>
        <Text style={styles.sectionTitle}>Quick Review</Text>
        <Text style={styles.reviewLine}>
          <Text style={{ fontWeight: '700' }}>{OCCASIONS.find(o => o.id === occasionType)?.label || 'Event'}</Text>
          {occasionName ? ` · ${occasionName}` : ''}
        </Text>
        <Text style={styles.reviewLine}>
          {totalDays}-day event in {baseLocation} · {totalVehicles} vehicles
        </Text>
        <Text style={styles.reviewLine}>
          {formatHumanDate(toIsoDate(startDate))} → {formatHumanDate(toIsoDate(endDate))}
        </Text>
        {estimatedCost > 0 && (
          <Text style={[styles.reviewLine, { fontWeight: '700' }]}>
            Estimated reference cost: ₹{estimatedCost.toLocaleString('en-IN')}
          </Text>
        )}
        <Text style={[styles.hint, { marginTop: 6 }]}>
          Final amount comes once vendors share quotes. You'll be notified on each step.
        </Text>
      </View>

      {!!submitError && (
        <View style={styles.errorBox}>
          <Icon name="alert-circle" size={14} color="#B91C1C" />
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      )}
    </View>
  );

  // ── Outer layout ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Custom Event Booking</Text>
          <Text style={styles.headerSub}>Multi-day · Multiple services · One quote</Text>
        </View>
      </View>

      {renderStepBar()}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View style={styles.footer}>
        {step < 3 ? (
          <TouchableOpacity
            onPress={() => {
              if (step === 1 && !canContinueStep1) {
                showAlert({
                  type: 'warning',
                  title: 'Missing details',
                  message: 'Please complete the event details before continuing.',
                });
                return;
              }
              if (step === 2 && !canContinueStep2) {
                showAlert({
                  type: 'warning',
                  title: 'Each service needs a vehicle',
                  message: 'Pick at least one vehicle for each service on each day before submitting.',
                });
                return;
              }
              setStep(step + 1);
            }}
            style={[styles.primaryBtn, ((step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)) && { opacity: 0.5 }]}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Icon name="send" size={18} color="#fff" />}
            <Text style={styles.primaryBtnText}>{submitting ? 'Submitting…' : 'Submit Booking'}</Text>
          </TouchableOpacity>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* Copy-to-many-days modal — pick one or more destination days to
          paste the source day's services into. */}
      <Modal
        visible={copyToModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeCopyToModal}
      >
        <View style={styles.timePickerBackdrop}>
          <Pressable onPress={closeCopyToModal} style={StyleSheet.absoluteFill} />
          <View style={styles.copyModalCard}>
            <View style={styles.timePickerHeader}>
              <Icon name="copy" size={18} color={ACCENT} />
              <Text style={styles.timePickerTitle}>
                Copy Day {(copyToModal.fromIdx ?? 0) + 1} to…
              </Text>
              <TouchableOpacity onPress={closeCopyToModal} style={{ marginLeft: 'auto' }}>
                <Icon name="x" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.hint, { marginBottom: 10 }]}>
              These days will be replaced with Day {(copyToModal.fromIdx ?? 0) + 1}'s services.
            </Text>

            {(() => {
              const eligible = days
                .map((_, i) => i)
                .filter((i) => i !== copyToModal.fromIdx);
              const allSelected = eligible.length > 0 && eligible.every((i) => copyToModal.selected.includes(i));
              return (
                <>
                  <View style={styles.copyModalSelectBar}>
                    <TouchableOpacity onPress={() => allSelected ? clearCopyTargets() : selectAllCopyTargets(eligible)}>
                      <Text style={styles.copyModalSelectLink}>
                        {allSelected ? 'Clear all' : 'Select all'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.copyModalCount}>
                      {copyToModal.selected.length} selected
                    </Text>
                  </View>
                  <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingVertical: 4 }}>
                    {eligible.map((i) => {
                      const checked = copyToModal.selected.includes(i);
                      const tgt = days[i];
                      const tgtHasContent = tgt.services.some((s) => s.selectedVehicles.length > 0);
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => toggleCopyTarget(i)}
                          activeOpacity={0.7}
                          style={[styles.copyTargetRow, checked && styles.copyTargetRowChecked]}
                        >
                          <View style={[styles.copyCheckbox, checked && styles.copyCheckboxChecked]}>
                            {checked && <Icon name="check" size={12} color="#fff" />}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.copyTargetTitle}>Day {i + 1}</Text>
                            <Text style={styles.copyTargetMeta}>
                              {formatHumanDate(tgt.date)}
                              {tgtHasContent && (
                                <Text style={{ color: '#B45309' }}>  · will be overwritten</Text>
                              )}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              );
            })()}

            <View style={styles.timePickerActions}>
              <TouchableOpacity onPress={closeCopyToModal} style={styles.timeCancelBtn}>
                <Text style={styles.timeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyCopyToTargets}
                disabled={copyToModal.selected.length === 0}
                style={[styles.timeConfirmBtn, copyToModal.selected.length === 0 && { opacity: 0.5 }]}
              >
                <Text style={styles.timeConfirmText}>
                  Apply{copyToModal.selected.length > 0 ? ` (${copyToModal.selected.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Themed alert modal — replaces all native Alert.alert() popups */}
      <AppAlert
        visible={!!appAlert}
        type={appAlert?.type}
        title={appAlert?.title}
        message={appAlert?.message}
        buttons={appAlert?.buttons}
        onClose={closeAlert}
      />

      {/* City picker modal */}
      <Modal visible={showCityList} animationType="slide" transparent onRequestClose={() => setShowCityList(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Base City</Text>
              <TouchableOpacity onPress={() => setShowCityList(false)}><Icon name="x" size={20} color={TEXT} /></TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { margin: 12 }]}
              value={cityQuery}
              onChangeText={setCityQuery}
              placeholder="Search city…"
              placeholderTextColor="#9CA3AF"
            />
            <ScrollView style={{ maxHeight: 360 }}>
              {filteredCities.map((c) => (
                <TouchableOpacity key={c.id || c.slug || c.name} onPress={() => pickCity(c)} style={styles.cityRow}>
                  <Icon name="map-pin" size={16} color={ACCENT} />
                  <Text style={{ marginLeft: 10, fontSize: 15, color: TEXT }}>{c.name || c.city}</Text>
                </TouchableOpacity>
              ))}
              {filteredCities.length === 0 && (
                <Text style={[styles.hint, { padding: 16, textAlign: 'center' }]}>No cities match "{cityQuery}".</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TEXT },
  headerSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  stepBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  stepCell: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotText: { fontSize: 12, fontWeight: '700', color: MUTED },
  stepLabel: { fontSize: 12, color: MUTED, marginLeft: 6 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: MUTED, marginTop: 12, marginBottom: 6 },
  hint: { fontSize: 12, color: MUTED, fontStyle: 'italic' },
  subtle: { fontSize: 11, color: MUTED, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: TEXT },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15, color: TEXT,
  },
  timeField: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  timeFieldText: { fontSize: 15, color: TEXT, fontWeight: '600' },
  timePickerBackdrop: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  // Themed alert modal styles
  alertBackdrop: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  alertCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 22,
    padding: 22, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 }, elevation: 14,
  },
  alertIconCircle: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  alertTitle: {
    fontSize: 18, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 6,
  },
  alertMessage: {
    fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 18,
  },
  alertActions: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  alertBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  alertBtnCancel: { backgroundColor: '#F3F4F6' },
  alertBtnTextCancel: { color: TEXT, fontWeight: '700', fontSize: 14 },
  alertBtnTextPrimary: { color: '#fff', fontWeight: '800', fontSize: 14 },
  datePickerCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 22,
    padding: 18, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  datePickerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  dateBigPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F5F3FF', borderRadius: 14, borderWidth: 1, borderColor: '#E9D5FF',
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14,
  },
  dateBigDay: { fontSize: 40, fontWeight: '800', color: ACCENT_DARK, lineHeight: 44 },
  dateBigWeekday: { fontSize: 14, fontWeight: '700', color: ACCENT_DARK },
  dateBigMonth: { fontSize: 13, color: '#6D28D9', marginTop: 2 },
  monthNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthNavBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#E9D5FF',
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },
  monthNavTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: {
    flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700',
    color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  dayCell: {
    width: `${100 / 7}%`, height: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  dayCirclePicked: {
    backgroundColor: ACCENT, borderColor: ACCENT,
  },
  dayCircleToday: {
    borderColor: ACCENT, backgroundColor: '#F5F3FF',
  },
  dayCircleTransparent: { backgroundColor: 'transparent', borderColor: 'transparent' },
  dayCellText: { fontSize: 14, fontWeight: '600', color: TEXT, fontVariant: ['tabular-nums'] },
  dayCellOutOfMonth: { color: '#D1D5DB' },
  dayCellDisabled: { color: '#E5E7EB' },
  dayCellToday: { color: ACCENT_DARK, fontWeight: '800' },
  dayCellPickedText: { color: '#fff', fontWeight: '800' },
  dayCellInRange: { color: ACCENT_DARK, fontWeight: '700' },
  // Range band — sits behind the day circle. top/bottom inset (42-36)/2 = 3.
  rangeBand: {
    position: 'absolute', top: 3, bottom: 3, backgroundColor: '#EDE9FE',
  },
  rangeBandFull:  { left: 0, right: 0 },
  rangeBandLeft:  { left: 0, right: '50%' },
  rangeBandRight: { left: '50%', right: 0 },
  // Range summary preview for the End-date picker.
  dateRangePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: 14, borderWidth: 1, borderColor: '#E9D5FF',
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14,
  },
  dateRangeLabel: {
    fontSize: 10, fontWeight: '700', color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateRangeText: { fontSize: 18, fontWeight: '800', color: ACCENT_DARK, marginTop: 2 },
  dateRangeWeekday: { fontSize: 11, color: '#6D28D9', marginTop: 1 },
  dateRangeArrow: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  dateRangeDays: { fontSize: 10, color: ACCENT_DARK, fontWeight: '700', marginTop: 2 },
  timePickerCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 22,
    padding: 18, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  timePickerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  timePickerTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  timePreview: {
    backgroundColor: '#F5F3FF', borderRadius: 14, borderWidth: 1, borderColor: '#E9D5FF',
    paddingVertical: 14, marginBottom: 14,
  },
  timePreviewText: {
    fontSize: 36, fontWeight: '800', color: ACCENT_DARK, textAlign: 'center',
    letterSpacing: 2, fontVariant: ['tabular-nums'],
  },
  timePreviewPeriod: { fontSize: 18, color: ACCENT, fontWeight: '700' },
  wheelRowWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: ROW_H * 3, position: 'relative', marginBottom: 14,
  },
  wheelHighlight: {
    position: 'absolute', left: 8, right: 8, top: ROW_H, height: ROW_H,
    borderRadius: 12, backgroundColor: '#F5F3FF',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DDD6FE',
  },
  wheel: { width: 70, height: ROW_H * 3 },
  wheelRow: { height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontSize: 18, color: '#9CA3AF', fontWeight: '500', fontVariant: ['tabular-nums'] },
  wheelTextActive: { fontSize: 22, color: ACCENT_DARK, fontWeight: '800' },
  wheelSep: { fontSize: 22, fontWeight: '800', color: ACCENT, marginHorizontal: 2 },
  timePickerActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  timeCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  timeCancelText: { color: TEXT, fontWeight: '700', fontSize: 14 },
  timeConfirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  timeConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER,
  },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, color: TEXT, fontWeight: '600' },
  miniChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER,
  },
  miniChipText: { fontSize: 12, color: TEXT, fontWeight: '600' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3E8FF', borderColor: '#E9D5FF', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 14,
  },
  summaryText: { color: ACCENT_DARK, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    marginBottom: 12, overflow: 'hidden',
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  dayPill: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  dayPillCopied: { backgroundColor: '#D1FAE5' },
  dayPillText: { color: ACCENT_DARK, fontWeight: '800' },
  dayPillTextCopied: { color: '#065F46' },
  dayTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  dayMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  // Outer-card tint when this day was filled by copying from another day.
  // Subtle green so the user spots them at a glance in the day list.
  dayCardCopied: {
    backgroundColor: '#F0FDF4', borderColor: '#A7F3D0',
  },
  // Small "Copied from Day X" chip in the day header.
  copiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
  },
  copiedBadgeText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
  serviceCard: {
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 10,
  },
  copyFromRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6,
    marginBottom: 10, paddingHorizontal: 4,
  },
  copyFromLabel: {
    fontSize: 11, fontWeight: '700', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.3, marginRight: 4,
  },
  copyFromPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#E9D5FF',
  },
  copyFromPillDim: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  copyFromPillText: { fontSize: 11, fontWeight: '700', color: ACCENT_DARK },
  // "Copy this day to other days" trigger button
  copyToBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10,
    backgroundColor: '#F5F3FF', borderRadius: 10,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  copyToBtnText: { color: ACCENT_DARK, fontWeight: '700', fontSize: 12 },
  // Copy-to-many-days modal
  copyModalCard: {
    width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 22,
    padding: 18, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  copyModalSelectBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingBottom: 8,
  },
  copyModalSelectLink: { color: ACCENT, fontWeight: '700', fontSize: 12 },
  copyModalCount: { color: MUTED, fontWeight: '600', fontSize: 12 },
  copyTargetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: BORDER, borderRadius: 10,
  },
  copyTargetRowChecked: { backgroundColor: '#F5F3FF', borderColor: '#C4B5FD' },
  copyCheckbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  copyCheckboxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
  copyTargetTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  copyTargetMeta: { fontSize: 11, color: MUTED, marginTop: 2 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  serviceTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  infoBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1,
    borderRadius: 8, padding: 10, marginTop: 8,
  },
  infoBoxText: { color: '#075985', fontSize: 12, flex: 1, lineHeight: 17 },
  // Image-led card replacing the old plain row. Selected state tints the
  // whole card light-purple with a thicker purple border so picks are
  // unmistakable when scrolling.
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, padding: 10, marginBottom: 8,
  },
  vehicleCardSelected: {
    backgroundColor: '#F5F3FF', borderColor: ACCENT, borderWidth: 1.5,
  },
  vehicleThumb: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  vehicleThumbPreset: { backgroundColor: '#EDE9FE' },
  vehicleThumbImg: { width: '100%', height: '100%' },
  vehicleBody: { flex: 1, minWidth: 0, gap: 4 },
  vehicleCardName: { fontSize: 13, fontWeight: '700', color: TEXT },
  vehicleCardBrand: { color: MUTED, fontWeight: '600' },
  vehicleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F5F3FF', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  vehicleChipText: { fontSize: 10, color: ACCENT_DARK, fontWeight: '600', maxWidth: 110 },
  vehicleCardRate: { fontSize: 12, fontWeight: '800', color: ACCENT_DARK },
  vehicleCardRateUnit: { color: MUTED, fontWeight: '500' },
  // Single "Add" button shown when count == 0
  vehicleAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 999,
  },
  vehicleAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  // Pill with ± and live count, shown when count > 0
  vehicleQtyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#fff', borderRadius: 999,
    borderWidth: 1, borderColor: ACCENT, paddingHorizontal: 2,
  },
  vehicleQtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleQtyNum: { fontSize: 14, fontWeight: '800', color: ACCENT_DARK, minWidth: 18, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: ACCENT,
    backgroundColor: '#F5F3FF',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 14, marginTop: 16,
  },
  reviewLine: { fontSize: 13, color: TEXT, marginTop: 4 },
  errorBox: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5',
    borderRadius: 8, padding: 10, marginTop: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 13, flex: 1 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: BORDER,
  },
  primaryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
});
