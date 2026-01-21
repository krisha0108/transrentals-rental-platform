// components/ChatListOverlay.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const C = { text: "#E5E7EB", dim: "rgba(226,232,240,0.7)", line: "rgba(148,163,184,0.15)" };

const DUMMY = [
  { id: "c1", name: "Aashi Travels", avatar: "https://i.pravatar.cc/100?img=21", last: "Pickup at 7am confirmed." },
  { id: "c2", name: "Shah Motors", avatar: "https://i.pravatar.cc/100?img=22", last: "Send the route card pdf." },
  { id: "c3", name: "A1 Logistics", avatar: "https://i.pravatar.cc/100?img=23", last: "Spare tyre sorted 👍" },
  { id: "c4", name: "TransRentals", avatar: "https://i.pravatar.cc/100?img=24", last: "Hey, join the Udaipur thread." },
];

export default function ChatListOverlay({ visible, onClose }) {
  if (!visible) return null;
  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Search (dummy) */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={18} color={C.dim} />
        <Text style={styles.searchTxt}>Search vendors…</Text>
      </View>

      {/* List */}
      <FlatList
        data={DUMMY}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => <Row item={item} />}
        contentContainerStyle={{ padding: 14, paddingTop: 6 }}
      />
    </View>
  );
}

function Row({ item }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.85}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.last} numberOfLines={1}>{item.last}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(226,232,240,0.5)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
    borderLeftWidth: 1, borderColor: "rgba(148,163,184,0.2)",
  },
  header: {
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  title: { color: C.text, fontSize: 18, fontWeight: "800" },
  iconBtn: { padding: 6, borderRadius: 10, backgroundColor: "rgba(148,163,184,0.12)" },
  search: {
    marginHorizontal: 14, marginBottom: 8, height: 40, borderRadius: 12,
    backgroundColor: "#0F172A", borderWidth: 1, borderColor: "rgba(148,163,184,0.15)",
    flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12,
  },
  searchTxt: { color: "rgba(226,232,240,0.5)" },
  sep: { height: 10 },
  row: {
    backgroundColor: "#0F172A", borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)", padding: 12, flexDirection: "row", gap: 12,
    alignItems: "center",
  },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: "#111827" },
  name: { color: C.text, fontSize: 14, fontWeight: "700" },
  last: { color: "rgba(226,232,240,0.7)", fontSize: 12, marginTop: 2 },
});
