// components/TravelAgentBookingToggle.js
// Phase 7 — Personal vs Company booking-mode selector for Travel Agents.
//
// Mirrors the web UI at
// src/app/(services)/car-rental/[location]/book/page.tsx:342-425.
//
// SELF-GATED: renders nothing when the customer isn't a TA, so calling
// screens can include it unconditionally — no need for them to wrap it in
// their own `if (isTA)` check.
//
// Wire it up like:
//
//   const [taState, setTaState] = useState({
//     mode: "PERSONAL",
//     vehicleCount: "1",
//     employeeCount: "",
//   });
//
//   <TravelAgentBookingToggle value={taState} onChange={setTaState} />
//
//   // On submit:
//   const payload = {
//     ...requestData,
//     ...(isTA && {
//       taBookingMode: taState.mode,
//       numberOfVehicles: taState.mode === "COMPANY"
//         ? Number(taState.vehicleCount) || 1 : 1,
//       numberOfEmployees: taState.mode === "COMPANY"
//         ? Number(taState.employeeCount) || null : null,
//     }),
//   };
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTravelAgent } from "../utils/isTravelAgent";

const C = {
  indigo:    "#4F46E5",
  indigoBg:  "#EEF2FF",
  indigoBg2: "#E0E7FF",
  emeraldBg: "#ECFDF5",
  emerald:   "#059669",
  ink:       "#0F172A",
  text:      "#334155",
  sub:       "#64748B",
  muted:     "#94A3B8",
  border:    "#E2E8F0",
  borderIdg: "#C7D2FE",
  card:      "#FFFFFF",
};

/**
 * @param {object} props
 * @param {{mode:'PERSONAL'|'COMPANY', vehicleCount:string, employeeCount:string}} props.value
 *   Current state from the parent.
 * @param {(next:object) => void} props.onChange
 *   Called with the next state on any user interaction.
 */
export default function TravelAgentBookingToggle({ value, onChange }) {
  const { isTravelAgent, customer, loading } = useTravelAgent();

  // Local fallback so parents can omit `value` initially and we still render.
  const [internal, setInternal] = useState({
    mode: "PERSONAL",
    vehicleCount: "1",
    employeeCount: "",
  });
  const state = value ?? internal;
  const setState = (patch) => {
    const next = { ...state, ...patch };
    setInternal(next);
    onChange?.(next);
  };

  // Initial sync — fire onChange so the parent sees the default PERSONAL
  // selection even if it didn't pass `value`.
  useEffect(() => {
    if (!value && onChange) onChange(internal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !isTravelAgent) return null;

  const agencyName =
    customer?.agencyName ||
    customer?.linkedTravelAgentName ||
    customer?.name ||
    "your agency";

  return (
    <View style={s.wrap}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerIconBox}>
          <Icon name="check-circle" size={16} color={C.indigo} />
        </View>
        <Text style={s.headerText} numberOfLines={1}>
          Booking as Travel Agent — {agencyName}
        </Text>
      </View>
      <Text style={s.subtext}>
        No upfront payment required. Your request goes to the manager who
        shares a quote and assigns vehicles.
      </Text>

      {/* ── Personal / Company picker ────────────────────── */}
      <View style={s.optionsRow}>
        <Option
          active={state.mode === "PERSONAL"}
          emoji="👤"
          title="Personal"
          subtitle={"For you / family.\n1 vehicle, manager review."}
          onPress={() => setState({ mode: "PERSONAL" })}
        />
        <Option
          active={state.mode === "COMPANY"}
          emoji="🏢"
          title="Company"
          subtitle={"For your agency.\nMulti-vehicle, invoiced."}
          onPress={() => setState({ mode: "COMPANY" })}
        />
      </View>

      {/* ── Company-only fields ──────────────────────────── */}
      {state.mode === "COMPANY" && (
        <View style={s.companyInputsRow}>
          <View style={s.companyField}>
            <Text style={s.companyLabel}># of Vehicles *</Text>
            <TextInput
              style={s.companyInput}
              keyboardType="number-pad"
              value={state.vehicleCount}
              onChangeText={(v) => setState({ vehicleCount: v.replace(/\D/g, "") })}
              placeholder="1"
              placeholderTextColor={C.muted}
            />
          </View>
          <View style={s.companyField}>
            <Text style={s.companyLabel}># of Passengers</Text>
            <TextInput
              style={s.companyInput}
              keyboardType="number-pad"
              value={state.employeeCount}
              onChangeText={(v) => setState({ employeeCount: v.replace(/\D/g, "") })}
              placeholder="Optional"
              placeholderTextColor={C.muted}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function Option({ active, emoji, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={[s.option, active && s.optionActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={s.optionTopRow}>
        <Text style={s.optionEmoji}>{emoji}</Text>
        <Text style={s.optionTitle}>{title}</Text>
        {active && (
          <View style={s.optionTick}>
            <Icon name="check" size={11} color="#fff" />
          </View>
        )}
      </View>
      <Text style={s.optionSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.indigoBg,
    borderColor: C.borderIdg,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBox: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.indigoBg2,
    alignItems: "center", justifyContent: "center",
  },
  headerText: { flex: 1, fontSize: 13.5, fontWeight: "800", color: C.indigo },
  subtext: { fontSize: 11.5, color: C.text, marginTop: 6, lineHeight: 16 },

  optionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  option: {
    flex: 1, backgroundColor: C.card, borderColor: C.border, borderWidth: 1.5,
    borderRadius: 10, padding: 10,
  },
  optionActive: { borderColor: C.indigo, backgroundColor: "#fff" },
  optionTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  optionEmoji: { fontSize: 16 },
  optionTitle: { flex: 1, fontSize: 13, fontWeight: "800", color: C.ink },
  optionTick: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: C.indigo,
    alignItems: "center", justifyContent: "center",
  },
  optionSub: { fontSize: 10.5, color: C.sub, marginTop: 4, lineHeight: 14 },

  companyInputsRow: {
    flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.borderIdg,
  },
  companyField: { flex: 1 },
  companyLabel: {
    fontSize: 11, fontWeight: "800", color: C.indigo, marginBottom: 4,
  },
  companyInput: {
    backgroundColor: C.card, borderColor: C.borderIdg, borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: C.ink,
  },
});
