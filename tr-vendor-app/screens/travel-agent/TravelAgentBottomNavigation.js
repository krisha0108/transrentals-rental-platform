// screens/travel-agent/TravelAgentBottomNavigation.js
// REDESIGNED — floating rounded-card bottom nav for the Travel Agent portal.
// The tab bar hovers above content with margin on left/right + bottom, has
// strong shadow, and shows icon + label for every tab. Active tab uses
// emerald accent (filled icon tile + emerald label).
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TravelAgentDashboardScreen from "./dashboard/TravelAgentDashboardScreen";
import LeadsListScreen from "./leads/LeadsListScreen";
import BookingsListScreen from "./bookings/BookingsListScreen";
import ChatsListScreen from "./chats/ChatsListScreen";
import MoreScreen from "./more/MoreScreen";
import { DISPLAY } from "./_shared/typography";
import {
  listTravelAgentConversations,
  getTravelAgentNotifications,
} from "../api/travelAgentClient";
import { SC as C } from "./_shared/theme";

const Tab = createBottomTabNavigator();

/**
 * Exported so tab screens can pad the bottom of their scroll content and
 * make sure the last item isn't hidden behind the floating bar. Use it as
 * `contentContainerStyle={{ paddingBottom: TA_TAB_BOTTOM_INSET, ... }}`.
 * Generous value (covers iOS notch + Android gesture bar + card height).
 */
export const TA_TAB_BOTTOM_INSET = 100;


const TABS = [
  { name: "TADashboard", icon: "home",          iconOutline: "home-outline",          label: "Home" },
  { name: "TALeads",     icon: "people",        iconOutline: "people-outline",        label: "Leads" },
  { name: "TABookings",  icon: "calendar",      iconOutline: "calendar-outline",      label: "Bookings" },
  { name: "TAChats",     icon: "chatbubbles",   iconOutline: "chatbubbles-outline",   label: "Chats",   badgeKey: "chats" },
  // 5th tab opens the MoreScreen (account hub) but is labelled "Profile" since
  // that's the user's mental model for the bottom-nav entry point.
  { name: "TAMore",      icon: "person-circle", iconOutline: "person-circle-outline", label: "Profile", badgeKey: "more" },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [badges, setBadges] = useState({ chats: 0, more: 0 });

  // Fetch unread counts (chats + notifications) periodically + on focus.
  const fetchBadges = useCallback(async () => {
    try {
      const [chatRes, notifRes] = await Promise.all([
        listTravelAgentConversations({ status: "ACTIVE" }).catch(() => null),
        getTravelAgentNotifications({ filter: "unread", limit: 1 }).catch(() => null),
      ]);
      const chatsUnread =
        typeof chatRes?.totalUnread === "number"
          ? chatRes.totalUnread
          : (chatRes?.conversations || []).reduce(
              (sum, c) => sum + (c.unreadCount || c.agentUnread || 0), 0
            );
      const notifUnread =
        notifRes?.unreadCount ??
        notifRes?.totalUnread ??
        (notifRes?.notifications || []).filter((n) => !n.readAt && !n.isRead).length;
      setBadges({ chats: chatsUnread || 0, more: notifUnread || 0 });
    } catch {}
  }, []);

  useEffect(() => {
    fetchBadges();
    const t = setInterval(fetchBadges, 30000);
    return () => clearInterval(t);
  }, [fetchBadges]);
  useEffect(() => { fetchBadges(); }, [state.index, fetchBadges]);

  // Outer container is absolute (overlays content) so no surrounding
  // "page-bg" strip is visible — the bar truly floats. Content overflow
  // is prevented by sceneContainerStyle paddingBottom in the Navigator.
  const bottomGap = Math.max(insets.bottom, 8);

  return (
    <View pointerEvents="box-none" style={[styles.outerWrap, { paddingBottom: bottomGap }]}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[index];
          if (!tab) return null;
          const badgeCount = tab.badgeKey ? badges[tab.badgeKey] || 0 : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center tab — elevated gradient FAB (same route/badge, only styled)
          if (index === 2) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.fabItem}
              >
                <LinearGradient
                  colors={["#2E9E78", "#1C6B52"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fab}
                >
                  <Ionicons name={tab.icon} size={24} color="#fff" />
                  {badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
                    </View>
                  )}
                </LinearGradient>
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={focused ? tab.icon : tab.iconOutline}
                  size={focused ? 23 : 21}
                  color={focused ? C.emerald600 : C.subText}
                />
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  focused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {/* Active-tab indicator dot under the label */}
              {focused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TravelAgentBottomNavigation() {
  // Reserve space at the bottom of every screen so the absolute-positioned
  // floating bar overlays empty padding (not content). Calculated from:
  //   bar inner card (~56) + outer paddingTop (8) + safe-area bottom + buffer.
  const insets = useSafeAreaInsets();
  const sceneBottomPad = 64 + Math.max(insets.bottom, 8) + 14;

  return (
    <Tab.Navigator
      initialRouteName="TADashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { paddingBottom: sceneBottomPad },
      }}
    >
      <Tab.Screen name="TADashboard" component={TravelAgentDashboardScreen} />
      <Tab.Screen name="TALeads" component={LeadsListScreen} />
      <Tab.Screen name="TABookings" component={BookingsListScreen} />
      <Tab.Screen name="TAChats" component={ChatsListScreen} />
      <Tab.Screen name="TAMore" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Outer wrap — absolute positioned & TRANSPARENT (no surrounding strip
  // visible). Holds the floating card with horizontal margin so it sits
  // away from screen edges. pointerEvents box-none lets taps pass through
  // outside the card area (so users don't accidentally tap "dead zones").
  outerWrap: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
  },
  // The actual floating card — rounded, white, shadowed.
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: C.bg,
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 16 },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
  },
  fabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 19,
    marginTop: -24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B3327",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  tabLabel: {
    fontFamily: DISPLAY,
    fontSize: 10.5,
    color: C.subText,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  tabLabelActive: { color: C.emerald600, fontWeight: "bold" },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.emerald600,
    marginTop: 2,
  },

  // Red unread badge (top-right of icon, white-bordered to "float" off icon).
  badge: {
    position: "absolute",
    top: -5, right: -10,
    minWidth: 16, height: 16,
    paddingHorizontal: 4, borderRadius: 8,
    backgroundColor: C.red,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.bg,
  },
  badgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", lineHeight: 11 },
});
