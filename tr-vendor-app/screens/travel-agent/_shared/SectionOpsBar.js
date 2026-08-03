// screens/travel-agent/_shared/SectionOpsBar.js
//
// Reusable horizontal "operations bar" shown at the top of a section's landing
// screen — mirrors the web sidebar's grouped sub-nav. Buttons use the dashboard
// quick-action look (tinted circle icon + label). Tapping any op jumps to it;
// the current screen's op is highlighted (filled circle).
//
// Usage:  <SectionOpsBar navigation={navigation} group="leads" active="TALeads" />
//
// SECTION_OPS is exported so the dashboard can render the same operations in the
// same style (single source of truth → no drift between dashboard & sub-nav).
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { DISPLAY } from "./typography";
import { C, TONES, alpha } from "./theme";

// Accent per op, drawn from the shared Elevate tones. Ordered so no two
// neighbouring ops inside a group repeat a colour.
const A = {
  emerald: C.emeraldDeep,      // deep forest emerald
  green:   TONES.emerald.ink,  // lighter emerald
  ocean:   TONES.ocean.ink,
  plum:    TONES.plum.ink,
  gold:    TONES.amber.ink,
  rose:    TONES.rose.ink,
  red:     C.red,
};

// Each group's operations, in the same order as the web sidebar.
export const SECTION_OPS = {
  leads: [
    { route: "TALeads", label: "All Leads", icon: "people", color: A.emerald, tab: true },
    { route: "TAAddEditLead", label: "Add Lead", icon: "person-add", color: A.ocean },
    { route: "TAPipeline", label: "Pipeline", icon: "git-network", color: A.plum },
    { route: "TAFollowUps", label: "Follow-Ups", icon: "alarm", color: A.gold },
    { route: "TACaptureLinks", label: "Capture Links", icon: "link", color: A.green },
    { route: "TATourQuoteRequests", label: "Quote Requests", icon: "mail-unread", color: A.red },
  ],
  tours: [
    { route: "TATours", label: "My Tours", icon: "map", color: A.emerald },
    { route: "TAAddEditTour", label: "Add Tour", icon: "add-circle", color: A.ocean },
  ],
  properties: [
    { route: "TAProperties", label: "My Properties", icon: "bed", color: A.gold },
    { route: "TAAddEditProperty", label: "Add Property", icon: "add-circle", color: A.ocean },
  ],
  fleet: [
    { route: "TAFleet", label: "All Vehicles", icon: "car-sport", color: A.ocean },
    { route: "TAFleetCalendar", label: "Calendar", icon: "calendar", color: A.plum },
    { route: "TAFleetInsurance", label: "Insurance", icon: "shield-checkmark", color: A.green },
    { route: "TAAddEditFleet", label: "Add Vehicle", icon: "add-circle", color: A.gold },
  ],
  bookings: [
    { route: "TABookings", label: "All Bookings", icon: "receipt", color: A.plum, tab: true },
    { route: "TAAddEditBooking", label: "Add Booking", icon: "add-circle", color: A.ocean },
  ],
  social: [
    { route: "TASocialFeed", label: "Feed", icon: "newspaper", color: A.emerald },
    { route: "TACreatePost", label: "Create Post", icon: "create", color: A.ocean },
    { route: "TASocialProfile", label: "My Profile", icon: "person", color: A.plum, params: { me: true } },
    { route: "TASocialMessages", label: "Messages", icon: "paper-plane", color: A.gold },
  ],
};

// Tab routes live in the bottom-tab navigator; reach them via the parent.
export function navigateToOp(navigation, op) {
  if (op.tab) navigation.navigate("TravelAgentDashboard", { screen: op.route });
  else navigation.navigate(op.route, op.params);
}

export default function SectionOpsBar({ navigation, group = "leads", active, bg, centered }) {
  const items = SECTION_OPS[group] || [];
  if (!items.length) return null;

  return (
    <View style={[styles.wrap, bg && { backgroundColor: bg, borderBottomWidth: 0 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, centered && styles.rowCentered]}
      >
        {items.map((op) => {
          const isActive = op.route === active;
          return (
            <TouchableOpacity
              key={op.route}
              style={styles.item}
              onPress={() => { if (!isActive) navigateToOp(navigation, op); }}
              activeOpacity={0.7}
            >
              <View style={[styles.circle, { backgroundColor: isActive ? op.color : alpha(op.color, 0.08) }]}>
                <Ionicons name={op.icon} size={22} color={isActive ? "#fff" : op.color} />
              </View>
              <Text
                style={[styles.label, isActive && { color: op.color, fontWeight: "bold" }]}
                numberOfLines={1}
              >
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  row: { paddingHorizontal: 12, paddingVertical: 10, gap: 14, flexDirection: "row", alignItems: "flex-start" },
  // When `centered`, the ops fill & center within the bar (fits → centered; overflows → scrolls).
  rowCentered: { flexGrow: 1, justifyContent: "center" },
  item: { alignItems: "center", width: 64 },
  circle: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  label: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", color: C.sub, textAlign: "center", lineHeight: 12 },
});
