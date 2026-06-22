// screens/travel-agent/_shared/PhasePlaceholder.js
// Lightweight placeholder for sections that will land in later phases.
// Keeps the navigator wired without crashing while we build the TA portal
// section-by-section. Replace each usage with the real screen as phases ship.
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

const BRAND = {
  ink: "#0F1720",
  text: "#334155",
  subText: "#64748B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6EDF5",
  primary: "#1FC77A",
  blue: "#3B82F6",
};

export default function PhasePlaceholder({
  title,
  description,
  phase,
  icon = "construct-outline",
  navigation,
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={BRAND.ink} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={48} color={BRAND.blue} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          {!!description && <Text style={styles.cardDesc}>{description}</Text>}

          <View style={styles.phasePill}>
            <Ionicons name="time-outline" size={14} color={BRAND.blue} />
            <Text style={styles.phasePillText}>Coming in {phase}</Text>
          </View>

          <Text style={styles.hint}>
            Aapke approval ke baad ye section enable ho jayega. Web portal pe
            yahi feature already live hai.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  scroll: { padding: 20, flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: BRAND.ink, flex: 1 },
  card: {
    backgroundColor: BRAND.card,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: BRAND.ink, marginBottom: 8, textAlign: "center" },
  cardDesc: { fontSize: 14, color: BRAND.subText, textAlign: "center", lineHeight: 21, marginBottom: 16 },
  phasePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 18,
  },
  phasePillText: { fontSize: 12, fontWeight: "700", color: BRAND.blue },
  hint: {
    fontSize: 12.5,
    color: BRAND.subText,
    textAlign: "center",
    lineHeight: 19,
    fontStyle: "italic",
  },
});
