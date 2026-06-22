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

const C = { sub: "#64748B", card: "#FFFFFF", border: "#E6EDF5" };

// Each group's operations, in the same order as the web sidebar.
export const SECTION_OPS = {
  leads: [
    { route: "TALeads", label: "All Leads", icon: "people", color: "#059669", tab: true },
    { route: "TAAddEditLead", label: "Add Lead", icon: "person-add", color: "#3B82F6" },
    { route: "TAPipeline", label: "Pipeline", icon: "git-network", color: "#6366F1" },
    { route: "TAFollowUps", label: "Follow-Ups", icon: "alarm", color: "#F59E0B" },
    { route: "TACaptureLinks", label: "Capture Links", icon: "link", color: "#14B8A6" },
    { route: "TATourQuoteRequests", label: "Quote Requests", icon: "mail-unread", color: "#EF4444" },
  ],
  tours: [
    { route: "TATours", label: "My Tours", icon: "map", color: "#059669" },
    { route: "TAAddEditTour", label: "Add Tour", icon: "add-circle", color: "#3B82F6" },
  ],
  properties: [
    { route: "TAProperties", label: "My Properties", icon: "bed", color: "#F59E0B" },
    { route: "TAAddEditProperty", label: "Add Property", icon: "add-circle", color: "#3B82F6" },
  ],
  fleet: [
    { route: "TAFleet", label: "All Vehicles", icon: "car-sport", color: "#3B82F6" },
    { route: "TAFleetCalendar", label: "Calendar", icon: "calendar", color: "#6366F1" },
    { route: "TAFleetInsurance", label: "Insurance", icon: "shield-checkmark", color: "#14B8A6" },
    { route: "TAAddEditFleet", label: "Add Vehicle", icon: "add-circle", color: "#F59E0B" },
  ],
  bookings: [
    { route: "TABookings", label: "All Bookings", icon: "receipt", color: "#8B5CF6", tab: true },
    { route: "TAAddEditBooking", label: "Add Booking", icon: "add-circle", color: "#3B82F6" },
  ],
  social: [
    { route: "TASocialFeed", label: "Feed", icon: "newspaper", color: "#059669" },
    { route: "TACreatePost", label: "Create Post", icon: "create", color: "#3B82F6" },
    { route: "TASocialProfile", label: "My Profile", icon: "person", color: "#8B5CF6", params: { me: true } },
    { route: "TASocialMessages", label: "Messages", icon: "paper-plane", color: "#F59E0B" },
  ],
};

// Tab routes live in the bottom-tab navigator; reach them via the parent.
export function navigateToOp(navigation, op) {
  if (op.tab) navigation.navigate("TravelAgentDashboard", { screen: op.route });
  else navigation.navigate(op.route, op.params);
}

export default function SectionOpsBar({ navigation, group = "leads", active }) {
  const items = SECTION_OPS[group] || [];
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((op) => {
          const isActive = op.route === active;
          return (
            <TouchableOpacity
              key={op.route}
              style={styles.item}
              onPress={() => { if (!isActive) navigateToOp(navigation, op); }}
              activeOpacity={0.7}
            >
              <View style={[styles.circle, { backgroundColor: isActive ? op.color : op.color + "14" }]}>
                <Ionicons name={op.icon} size={22} color={isActive ? "#fff" : op.color} />
              </View>
              <Text
                style={[styles.label, isActive && { color: op.color, fontWeight: "800" }]}
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
  item: { alignItems: "center", width: 64 },
  circle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  label: { fontSize: 9.5, fontWeight: "700", color: C.sub, textAlign: "center", lineHeight: 12 },
});
