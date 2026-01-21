// components/CreateFab.js
import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const C = { text: "#E5E7EB" };

export default function CreateFab({ onNote }) {
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={onNote} style={styles.fab}>
        <Ionicons name="create-outline" size={22} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, bottom: 100, alignItems: "flex-end" },
  fab: {
    flexDirection: "row", alignItems: "center", gap: 8,
    height: 48, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: "#0F172A",
    borderWidth: 1, borderColor: "rgba(34,211,238,0.25)",
  },
  txt: { color: "#E5E7EB", fontWeight: "700", fontSize: 13 },
});
