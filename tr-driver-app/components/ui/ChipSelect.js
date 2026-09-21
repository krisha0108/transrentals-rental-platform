/**
 * Wrapping chip picker, single- or multi-select.
 *
 * Fuel type is the reason this exists: plenty of vehicles on the fleet run on
 * two fuels (a CNG retrofit still runs on petrol, a hybrid is petrol plus
 * electric), and a single-choice row forced the driver to pick one and lose
 * the other. With `multiple` the chips toggle and the picked set is stored as
 * one comma-separated string, which is what the `fuelType` column already
 * holds and what every screen that displays it already prints.
 *
 * The chips wrap instead of scrolling sideways: with several selected, the
 * ones scrolled off the edge were invisible, and "what did I pick?" is the
 * whole question a multi-select has to answer at a glance.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS } from './theme';

/** "Petrol, CNG" → ['Petrol', 'CNG'] — tolerant of the separators real data uses. */
export function parseList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/[,+/|]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** ['Petrol', 'CNG'] → "Petrol, CNG"; an empty pick becomes null, not "". */
export function formatList(values) {
  const list = (values || []).filter(Boolean);
  return list.length ? list.join(', ') : null;
}

/**
 * Line up stored values with the known options so casing differences from
 * older rows ("petrol") still light up the right chip.
 */
export function matchOptions(value, options) {
  const wanted = parseList(value);
  const byLower = new Map(options.map(o => [String(o).toLowerCase(), o]));
  const out = [];
  for (const w of wanted) {
    const hit = byLower.get(w.toLowerCase());
    // Keep an unrecognised value rather than silently dropping it — saving
    // the form would otherwise erase data nobody asked to change.
    const val = hit || w;
    if (!out.includes(val)) out.push(val);
  }
  return out;
}

export default function ChipSelect({
  options,
  value,
  onChange,
  multiple = false,
  hint,
  disabled = false,
}) {
  const selected = multiple ? (Array.isArray(value) ? value : parseList(value)) : value;
  const isOn = (opt) => (multiple ? selected.includes(opt) : selected === opt);

  function toggle(opt) {
    if (disabled) return;
    if (!multiple) {
      // Tapping the active chip again clears it, so a wrong single pick is
      // undoable without a separate "none" chip.
      onChange(selected === opt ? '' : opt);
      return;
    }
    onChange(isOn(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);
  }

  return (
    <View>
      <View style={styles.row}>
        {options.map(opt => {
          const on = isOn(opt);
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => toggle(opt)}
              activeOpacity={0.75}
              disabled={disabled}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: on, disabled }}
              style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
            >
              {multiple && (
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={on ? COLORS.white : COLORS.muted}
                />
              )}
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {multiple && (
        <Text style={styles.hint}>
          {selected.length
            ? `Selected: ${selected.join(', ')}`
            : hint || 'Tap all that apply'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: 12.5, fontWeight: '600', color: COLORS.subText },
  chipTextOn: { color: COLORS.white },
  hint: { fontSize: 11.5, color: COLORS.muted, fontWeight: '500', marginTop: 7 },
});
