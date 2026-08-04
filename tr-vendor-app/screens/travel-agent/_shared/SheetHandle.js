// screens/travel-agent/_shared/SheetHandle.js
// The grab bar at the top of a bottom sheet.
//
// Only one sheet in the portal had one (the Tours "how would you like to add"
// chooser); the other eighteen rose from the bottom edge with nothing marking
// them as draggable-looking sheets, so they read as pages that had slid in
// rather than panels sitting over the screen.
//
//   <SheetHandle />           — first child inside the sheet container
import React from "react";
import { View, StyleSheet } from "react-native";
import { C, rs } from "./theme";

export default function SheetHandle({ style }) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: rs(10), paddingBottom: rs(6) },
  bar: {
    width: rs(40),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: C.sand,
  },
});
