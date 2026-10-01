import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GREEN = '#09B368';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameDay = (a, b) => !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();
const addDays = (d, n) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Quick picks a group usually means when they say "let's go".
const quickPicks = (today) => {
  // Coming Saturday (today, if it is Saturday).
  const thisSat = addDays(today, (6 - today.getDay() + 7) % 7);
  const nextSat = addDays(thisSat, 7);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return [
    { label: 'This weekend', date: thisSat },
    { label: 'Next weekend', date: nextSat },
    { label: 'In 2 weeks', date: addDays(today, 14) },
    { label: 'Next month', date: nextMonth },
  ];
};

/**
 * In-app calendar for choosing a trip date: quick picks plus a month grid.
 * Past days are disabled. Renders inline, so it works inside a Modal.
 *
 * @param {Date|null} value
 * @param {(date: Date) => void} onChange
 */
export default function TripDatePicker({ value, onChange }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(() => {
    const base = value || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = month.getDay();
  const cells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const pick = (date) => {
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    onChange(date);
  };

  return (
    <View style={styles.card}>
      <View style={styles.quickRow}>
        {quickPicks(today).map((q) => {
          const active = sameDay(value, q.date);
          return (
            <TouchableOpacity key={q.label} style={[styles.quick, active && styles.quickActive]} onPress={() => pick(q.date)}>
              <Text style={[styles.quickText, active && styles.quickTextActive]}>{q.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          disabled={isCurrentMonth}
          style={[styles.navBtn, isCurrentMonth && { opacity: 0.3 }]}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          style={styles.navBtn}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <View key={`w${i}`} style={styles.cell}><Text style={styles.weekday}>{d}</Text></View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`b${i}`} style={styles.cell} />;
          const past = date < today;
          const selected = sameDay(value, date);
          const isToday = sameDay(today, date);
          return (
            <View key={date.toISOString()} style={styles.cell}>
              <TouchableOpacity
                disabled={past}
                onPress={() => pick(date)}
                style={[styles.day, isToday && styles.dayToday, selected && styles.daySelected]}
              >
                <Text style={[styles.dayText, past && styles.dayPast, selected && styles.dayTextSelected]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const toText = (date) => (date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : '');

// "25122026" -> "25/12/2026" while typing.
const maskDate = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// A real calendar date from DD/MM/YYYY, or null ("31/02/2026" is not one).
const parseDate = (text) => {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
};

/**
 * Date field the customer can type into (DD/MM/YYYY) or fill from the
 * calendar. Reports a valid, not-past date through onChange, or null while
 * the field is empty or incomplete.
 *
 * @param {Date|null} value
 * @param {(date: Date|null) => void} onChange
 * @param {string} [placeholder]
 */
export function DateTypeField({ value, onChange, placeholder = 'DD/MM/YYYY' }) {
  const [text, setText] = useState(toText(value));
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');

  // A date picked in the calendar (or cleared by the parent) shows up here.
  useEffect(() => {
    const current = parseDate(text);
    if (!value && !current) return;
    if (!value || !current || !sameDay(value, current)) setText(toText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleText = (raw) => {
    const masked = maskDate(raw);
    setText(masked);
    if (masked.length < 10) {
      setError('');
      if (value) onChange(null);
      return;
    }
    const date = parseDate(masked);
    if (!date) {
      setError('That date doesn’t exist. Use DD/MM/YYYY.');
      onChange(null);
    } else if (date < startOfDay(new Date())) {
      setError('Please choose today or a later date.');
      onChange(null);
    } else {
      setError('');
      onChange(date);
    }
  };

  const clear = () => {
    setText('');
    setError('');
    onChange(null);
  };

  return (
    <View>
      <View style={[styles.typeRow, !!error && styles.typeRowError]}>
        <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.typeInput}
          value={text}
          onChangeText={handleText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          maxLength={10}
        />
        {text ? (
          <TouchableOpacity onPress={clear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Clear date">
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={() => setShowCalendar((v) => !v)}
          style={[styles.calendarBtn, showCalendar && styles.calendarBtnActive]}
          accessibilityLabel={showCalendar ? 'Hide calendar' : 'Pick from calendar'}
        >
          <Ionicons name="calendar" size={16} color={showCalendar ? '#fff' : GREEN} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {showCalendar && (
        <TripDatePicker
          value={value}
          onChange={(date) => {
            setError('');
            setText(toText(date));
            onChange(date);
            setShowCalendar(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingLeft: 14, paddingRight: 6, height: 50,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  typeRowError: { borderColor: '#EF4444' },
  typeInput: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 0, letterSpacing: 0.5 },
  calendarBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F8F2', justifyContent: 'center', alignItems: 'center' },
  calendarBtnActive: { backgroundColor: GREEN },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginTop: 8, marginBottom: 4 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quick: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  quickActive: { backgroundColor: '#E8F8F2', borderColor: GREEN },
  quickText: { fontSize: 12.5, fontWeight: '600', color: '#334155' },
  quickTextActive: { color: '#047857' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  monthTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  weekday: { fontSize: 11, fontWeight: '700', color: '#94A3B8', paddingVertical: 4 },
  day: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: GREEN },
  daySelected: { backgroundColor: GREEN, borderColor: GREEN },
  dayText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  dayPast: { color: '#CBD5E1' },
  dayTextSelected: { color: '#fff', fontWeight: '800' },
});
