// components/NoteComposer.js
import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getCategories } from "../lib/socialActions"; // adjust path if needed

const C = {
  text: "#0F172A",
  dim: "rgba(15,23,42,0.6)",
  line: "rgba(2,6,23,0.08)"
};
export default function NoteComposer({ visible, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState(null);
  const [loadingCats, setLoadingCats] = useState(false);
  const limit = 500;

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    (async () => {
      setLoadingCats(true);
      try {
        const list = await getCategories();
        if (!mounted) return;
        setCategories(list);
        setCatId(list?.[0]?.id ?? null);  // default first
      } finally {
        setLoadingCats(false);
      }
    })();
    return () => { mounted = false; };
  }, [visible]);

  const canPost = text.trim().length > 0 && text.trim().length <= limit && !!catId;

  const handlePost = () => {
    if (!canPost) return;
    onSubmit?.({ caption: text.trim(), category_id: catId });
    setText("");
    setCatId(categories?.[0]?.id ?? null);
    onClose?.();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Write a note</Text>
          <TouchableOpacity onPress={handlePost} disabled={!canPost} style={[styles.postBtn, !canPost && { opacity: 0.5 }]}>
            <Text style={{ color: "#0E9F6E", fontWeight: "700" }}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {loadingCats ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}>
              <ActivityIndicator color="#06B6D4" />
              <Text style={{ color: C.dim }}>Loading categories…</Text>
            </View>
          ) : categories.length ? (
            categories.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setCatId(c.id)} style={[styles.chip, catId === c.id && styles.chipActive]}>
                <Text style={[styles.chipTxt, catId === c.id && styles.chipTxtActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: C.dim, paddingHorizontal: 14 }}>No categories.</Text>
          )}
        </ScrollView>

        {/* Note input */}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share tips, urgent alerts (SOS), route updates…"
          placeholderTextColor="rgba(59, 59, 59, 0.45)"
          multiline
          autoFocus
          style={styles.input}
          maxLength={limit}
        />

        <View style={styles.footer}>
          <Text style={styles.counter}>{text.trim().length}/{limit}</Text>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
 sheet: {
  backgroundColor: "#FFFFFF",
  borderTopLeftRadius: 18, borderTopRightRadius: 18,
  borderTopWidth: 1, borderColor: C.line,
  paddingBottom: 20,
},
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6,
  },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: "rgba(2,6,23,0.06)"},
  title: { color: C.text, fontSize: 16, fontWeight: "800" },
  postBtn: {
    paddingHorizontal: 14, height: 36, borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.10)", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
  },
  catRow: { gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  chip: {
    height: 32, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderColor: C.line,
    backgroundColor: "rgba(2,6,23,0.04)", justifyContent: "center",
    marginRight: 8,
  },
  chipActive: {borderColor: "rgba(8,145,178,0.35)", backgroundColor: "rgba(8,145,178,0.10)" },
  chipTxt: { color:C.text, fontSize: 12, fontWeight: "700" },
  chipTxtActive: { color:C.text, },
  input: {
    minHeight: 150, paddingHorizontal: 16, paddingTop: 12,
    color: C.text, fontSize: 15, lineHeight: 22,
  },
  footer: { alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 6 },
  counter: { color: C.dim, fontSize: 12 },
});
