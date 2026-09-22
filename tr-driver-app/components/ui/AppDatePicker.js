/**
 * The app's date picker.
 *
 * The OS picker it replaces was the single worst interaction in the app: on
 * Android it opens on the current month, and the only way back to a 2008
 * birthday was tapping the month arrow a hundred-odd times — twelve taps per
 * year. There was also no way to simply type a date you already know.
 *
 * So this one gives three ways in, and they all edit the same value:
 *   • type it — "20082008" becomes 20/08/2008 as you go
 *   • jump — the month and the year in the header are buttons that open a
 *     grid, and the year grid pages twelve at a time
 *   • tap a day on the calendar
 *
 * Nothing is committed until "Select", so wandering around the calendar
 * cannot damage the value that is already saved.
 *
 *   <AppDatePicker
 *     visible={show}
 *     value={dob}
 *     maximumDate={new Date()}
 *     title="Date of Birth"
 *     onCancel={() => setShow(false)}
 *     onConfirm={(d) => { setShow(false); setDob(d); }}
 *   />
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, SHADOW, scaleFor } from './theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const YEARS_PER_PAGE = 12;

// ── Date helpers (no timezone maths — these are calendar dates) ──────────────
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => !!a && !!b
  && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const pad2 = (n) => String(n).padStart(2, '0');

function clampDate(d, min, max) {
  if (min && d < startOfDay(min)) return startOfDay(min);
  if (max && d > startOfDay(max)) return startOfDay(max);
  return d;
}

function isDisabled(d, min, max) {
  if (min && d < startOfDay(min)) return true;
  if (max && d > startOfDay(max)) return true;
  return false;
}

/** "20/08/2008" → Date, but only when it is a real calendar date. */
function parseTyped(text) {
  const digits = text.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2200) return null;
  // Rejects 31/02 rather than rolling it into March, which is what `new Date`
  // would quietly do.
  if (day < 1 || day > daysInMonth(year, month - 1)) return null;
  return new Date(year, month - 1, day);
}

/** Insert the slashes as the digits arrive, so the field reads as a date. */
function maskTyped(text) {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const formatTyped = (d) => (d ? `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}` : '');

/** Six weeks of cells, so the grid never changes height between months. */
function buildGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const total = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= total; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

export default function AppDatePicker({
  visible,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title = 'Select Date',
  confirmLabel = 'Select',
  allowClear = false,
}) {
  const { width, height } = useWindowDimensions();
  const f = (n) => scaleFor(width, n);

  const today = useMemo(() => startOfDay(new Date()), []);
  const openingDate = value ? startOfDay(new Date(value)) : clampDate(today, minimumDate, maximumDate);

  const [picked, setPicked] = useState(value ? startOfDay(new Date(value)) : null);
  const [cursor, setCursor] = useState({ year: openingDate.getFullYear(), month: openingDate.getMonth() });
  const [view, setView] = useState('days');
  const [text, setText] = useState(value ? formatTyped(new Date(value)) : '');
  const [typedError, setTypedError] = useState('');

  // Re-open on whatever is saved now, not on wherever the last visit ended.
  useEffect(() => {
    if (!visible) return;
    const base = value ? startOfDay(new Date(value)) : clampDate(today, minimumDate, maximumDate);
    setPicked(value ? startOfDay(new Date(value)) : null);
    setCursor({ year: base.getFullYear(), month: base.getMonth() });
    setText(value ? formatTyped(new Date(value)) : '');
    setTypedError('');
    setView('days');
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const minYear = minimumDate ? new Date(minimumDate).getFullYear() : 1900;
  const maxYear = maximumDate ? new Date(maximumDate).getFullYear() : today.getFullYear() + 30;

  const [yearPageStart, setYearPageStart] = useState(() =>
    Math.floor((openingDate.getFullYear() - minYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE + minYear);

  // Keep the year grid on the page holding the cursor whenever it is opened.
  useEffect(() => {
    if (view !== 'years') return;
    setYearPageStart(Math.floor((cursor.year - minYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE + minYear);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const grid = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor]);

  function shiftMonth(delta) {
    setCursor(c => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  // A whole month is out of range only when both its ends are — otherwise the
  // arrow has to stay live so you can reach the days that are selectable.
  const monthBlocked = (delta) => {
    const probe = new Date(cursor.year, cursor.month + delta, 1);
    const last = new Date(probe.getFullYear(), probe.getMonth(), daysInMonth(probe.getFullYear(), probe.getMonth()));
    if (maximumDate && probe > startOfDay(maximumDate)) return true;
    if (minimumDate && last < startOfDay(minimumDate)) return true;
    return false;
  };

  function onTyped(raw) {
    const masked = maskTyped(raw);
    setText(masked);
    setTypedError('');
    if (masked.replace(/\D/g, '').length < 8) return;

    const parsed = parseTyped(masked);
    if (!parsed) { setTypedError('That is not a real date'); return; }
    if (isDisabled(parsed, minimumDate, maximumDate)) {
      setTypedError(maximumDate && parsed > startOfDay(maximumDate) ? 'That date is too late' : 'That date is too early');
      return;
    }
    setPicked(parsed);
    setCursor({ year: parsed.getFullYear(), month: parsed.getMonth() });
    setView('days');
  }

  function pickDay(d) {
    if (isDisabled(d, minimumDate, maximumDate)) return;
    setPicked(d);
    setText(formatTyped(d));
    setTypedError('');
  }

  function confirm() {
    // A complete typed date that was never blurred still counts — nobody
    // should have to tap the day they just typed.
    const typed = parseTyped(text);
    const result = typed && !isDisabled(typed, minimumDate, maximumDate) ? typed : picked;
    if (!result) { setTypedError('Pick a date first'); return; }
    onConfirm(result);
  }

  const sheetWidth = Math.min(width - f(28), 400);
  const cellSize = Math.floor((sheetWidth - f(36)) / 7);
  const bodyMaxHeight = height * 0.52;

  const yearPage = [];
  for (let y = yearPageStart; y < yearPageStart + YEARS_PER_PAGE; y++) {
    if (y >= minYear && y <= maxYear) yearPage.push(y);
  }

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessible={false} />

        <View style={[styles.sheet, { width: sheetWidth }]}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingVertical: f(14), paddingHorizontal: f(16) }]}
          >
            <Text style={[styles.headerLabel, { fontSize: f(11) }]}>{title.toUpperCase()}</Text>
            <Text style={[styles.headerValue, { fontSize: f(21) }]} numberOfLines={1}>
              {picked
                ? `${WEEKDAYS_FULL[picked.getDay()]}, ${picked.getDate()} ${MONTHS_SHORT[picked.getMonth()]} ${picked.getFullYear()}`
                : 'No date chosen'}
            </Text>
          </LinearGradient>

          {/* Typed entry — the fast path when you already know the date */}
          <View style={[styles.typeRow, { paddingHorizontal: f(16), paddingTop: f(13) }]}>
            <View style={[styles.typeBox, typedError && styles.typeBoxError]}>
              <Ionicons name="create-outline" size={f(16)} color={typedError ? COLORS.danger : COLORS.muted} />
              <TextInput
                style={[styles.typeInput, { fontSize: f(15) }]}
                value={text}
                onChangeText={onTyped}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.faint}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
              />
              {!!text && (
                <TouchableOpacity onPress={() => { setText(''); setTypedError(''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={f(16)} color={COLORS.faint} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {!!typedError && (
            <Text style={[styles.typeError, { paddingHorizontal: f(16), fontSize: f(11.5) }]}>{typedError}</Text>
          )}

          {/* Month / year navigation */}
          <View style={[styles.navRow, { paddingHorizontal: f(16), marginTop: f(12) }]}>
            <TouchableOpacity
              onPress={() => shiftMonth(-1)}
              disabled={view !== 'days' || monthBlocked(-1)}
              style={[styles.navArrow, (view !== 'days' || monthBlocked(-1)) && styles.navArrowOff]}
            >
              <Ionicons name="chevron-back" size={f(18)} color={COLORS.primaryDark} />
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <TouchableOpacity
                style={[styles.navPill, view === 'months' && styles.navPillOn]}
                onPress={() => setView(v => (v === 'months' ? 'days' : 'months'))}
              >
                <Text style={[styles.navPillText, { fontSize: f(14) }, view === 'months' && styles.navPillTextOn]}>
                  {MONTHS[cursor.month]}
                </Text>
                <Ionicons name="chevron-down" size={f(13)} color={view === 'months' ? COLORS.white : COLORS.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navPill, view === 'years' && styles.navPillOn]}
                onPress={() => setView(v => (v === 'years' ? 'days' : 'years'))}
              >
                <Text style={[styles.navPillText, { fontSize: f(14) }, view === 'years' && styles.navPillTextOn]}>
                  {cursor.year}
                </Text>
                <Ionicons name="chevron-down" size={f(13)} color={view === 'years' ? COLORS.white : COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => shiftMonth(1)}
              disabled={view !== 'days' || monthBlocked(1)}
              style={[styles.navArrow, (view !== 'days' || monthBlocked(1)) && styles.navArrowOff]}
            >
              <Ionicons name="chevron-forward" size={f(18)} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </View>

          <View style={{ maxHeight: bodyMaxHeight }}>
            {view === 'days' && (
              <View style={{ paddingHorizontal: f(16), paddingTop: f(10) }}>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={`${w}-${i}`} style={[styles.weekday, { width: cellSize, fontSize: f(11) }]}>{w}</Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {grid.map((d, i) => {
                    if (!d) return <View key={`e-${i}`} style={{ width: cellSize, height: cellSize }} />;
                    const off = isDisabled(d, minimumDate, maximumDate);
                    const on = sameDay(d, picked);
                    const isToday = sameDay(d, today);
                    return (
                      <TouchableOpacity
                        key={d.toISOString()}
                        onPress={() => pickDay(d)}
                        disabled={off}
                        activeOpacity={0.7}
                        style={[styles.cell, { width: cellSize, height: cellSize }]}
                      >
                        <View style={[
                          styles.cellInner,
                          { width: cellSize - 6, height: cellSize - 6, borderRadius: (cellSize - 6) / 2 },
                          isToday && !on && styles.cellToday,
                          on && styles.cellOn,
                        ]}>
                          <Text style={[
                            styles.cellText,
                            { fontSize: f(14) },
                            off && styles.cellTextOff,
                            isToday && !on && styles.cellTextToday,
                            on && styles.cellTextOn,
                          ]}>
                            {d.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {view === 'months' && (
              <View style={[styles.pickGrid, { paddingHorizontal: f(16), paddingTop: f(12) }]}>
                {MONTHS_SHORT.map((m, i) => {
                  const on = i === cursor.month;
                  // Grey out a month with nothing selectable in it, e.g. any
                  // month after today when the field is a date of birth.
                  const first = new Date(cursor.year, i, 1);
                  const last = new Date(cursor.year, i, daysInMonth(cursor.year, i));
                  const off = (maximumDate && first > startOfDay(maximumDate))
                    || (minimumDate && last < startOfDay(minimumDate));
                  return (
                    <TouchableOpacity
                      key={m}
                      disabled={!!off}
                      onPress={() => { setCursor(c => ({ ...c, month: i })); setView('days'); }}
                      style={[styles.pickItem, on && styles.pickItemOn, off && styles.pickItemOff]}
                    >
                      <Text style={[styles.pickText, { fontSize: f(13.5) }, on && styles.pickTextOn, off && styles.pickTextOff]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {view === 'years' && (
              <View style={{ paddingTop: f(12) }}>
                <View style={[styles.yearPager, { paddingHorizontal: f(16) }]}>
                  <TouchableOpacity
                    onPress={() => setYearPageStart(s => Math.max(minYear, s - YEARS_PER_PAGE))}
                    disabled={yearPageStart <= minYear}
                    style={[styles.navArrow, yearPageStart <= minYear && styles.navArrowOff]}
                  >
                    <Ionicons name="chevron-back" size={f(16)} color={COLORS.primaryDark} />
                  </TouchableOpacity>
                  <Text style={[styles.yearRange, { fontSize: f(13) }]}>
                    {yearPage.length ? `${yearPage[0]} – ${yearPage[yearPage.length - 1]}` : '—'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setYearPageStart(s => Math.min(maxYear, s + YEARS_PER_PAGE))}
                    disabled={yearPageStart + YEARS_PER_PAGE > maxYear}
                    style={[styles.navArrow, yearPageStart + YEARS_PER_PAGE > maxYear && styles.navArrowOff]}
                  >
                    <Ionicons name="chevron-forward" size={f(16)} color={COLORS.primaryDark} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: bodyMaxHeight - f(50) }} keyboardShouldPersistTaps="handled">
                  <View style={[styles.pickGrid, { paddingHorizontal: f(16), paddingTop: f(10), paddingBottom: f(6) }]}>
                    {yearPage.map(y => {
                      const on = y === cursor.year;
                      return (
                        <TouchableOpacity
                          key={y}
                          onPress={() => {
                            // Keep the month in range when jumping years —
                            // e.g. moving to the current year from December
                            // when the field cannot go past today.
                            setCursor(c => {
                              let month = c.month;
                              if (maximumDate && new Date(y, month, 1) > startOfDay(maximumDate)) {
                                month = new Date(maximumDate).getMonth();
                              }
                              if (minimumDate && new Date(y, month, daysInMonth(y, month)) < startOfDay(minimumDate)) {
                                month = new Date(minimumDate).getMonth();
                              }
                              return { year: y, month };
                            });
                            setView('months');
                          }}
                          style={[styles.pickItem, on && styles.pickItemOn]}
                        >
                          <Text style={[styles.pickText, { fontSize: f(13.5) }, on && styles.pickTextOn]}>{y}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Shortcuts */}
          <View style={[styles.shortcuts, { paddingHorizontal: f(16), marginTop: f(10) }]}>
            {!isDisabled(today, minimumDate, maximumDate) && (
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => { setCursor({ year: today.getFullYear(), month: today.getMonth() }); setPicked(today); setText(formatTyped(today)); setTypedError(''); setView('days'); }}
              >
                <Ionicons name="today-outline" size={f(13)} color={COLORS.primary} />
                <Text style={[styles.shortcutText, { fontSize: f(12) }]}>Today</Text>
              </TouchableOpacity>
            )}
            {allowClear && (
              <TouchableOpacity style={styles.shortcut} onPress={() => onConfirm(null)}>
                <Ionicons name="close-circle-outline" size={f(13)} color={COLORS.subText} />
                <Text style={[styles.shortcutText, { fontSize: f(12), color: COLORS.subText }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.actions, { padding: f(16) }]}>
            <TouchableOpacity style={[styles.cancelBtn, { height: f(48) }]} onPress={onCancel} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { fontSize: f(15) }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmWrap, { height: f(48) }]} onPress={confirm} activeOpacity={0.85}>
              <LinearGradient
                colors={[COLORS.primaryDark, COLORS.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                <Text style={[styles.confirmText, { fontSize: f(15) }]}>{confirmLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.card,
  },

  header: { alignItems: 'flex-start' },
  headerLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.1 },
  headerValue: { color: COLORS.white, fontWeight: '800', marginTop: 3 },

  typeRow: { flexDirection: 'row' },
  typeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 46,
  },
  typeBoxError: { borderColor: '#FCA5A5', backgroundColor: COLORS.dangerSoft },
  typeInput: { flex: 1, color: COLORS.text, fontWeight: '600', padding: 0 },
  typeError: { color: COLORS.danger, fontWeight: '600', marginTop: 5 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navArrow: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  navArrowOff: { opacity: 0.35 },
  navPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F1F5F9',
  },
  navPillOn: { backgroundColor: COLORS.primary },
  navPillText: { fontWeight: '800', color: COLORS.text },
  navPillTextOn: { color: COLORS.white },

  weekRow: { flexDirection: 'row' },
  weekday: { textAlign: 'center', color: COLORS.muted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  cellInner: { alignItems: 'center', justifyContent: 'center' },
  cellOn: { backgroundColor: COLORS.primary },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.primaryBorder },
  cellText: { color: COLORS.text, fontWeight: '600' },
  cellTextOff: { color: COLORS.faint, fontWeight: '500' },
  cellTextToday: { color: COLORS.primary, fontWeight: '800' },
  cellTextOn: { color: COLORS.white, fontWeight: '800' },

  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickItem: {
    width: '30.6%',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  pickItemOn: { backgroundColor: COLORS.primary },
  pickItemOff: { opacity: 0.4 },
  pickText: { fontWeight: '700', color: COLORS.text },
  pickTextOn: { color: COLORS.white },
  pickTextOff: { color: COLORS.muted },

  yearPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yearRange: { fontWeight: '800', color: COLORS.text },

  shortcuts: { flexDirection: 'row', gap: 8 },
  shortcut: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
  },
  shortcutText: { fontWeight: '700', color: COLORS.primary },

  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontWeight: '700', color: COLORS.subText },
  confirmWrap: { flex: 1.3, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.button },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: COLORS.white, fontWeight: '800', letterSpacing: 0.3 },
});
