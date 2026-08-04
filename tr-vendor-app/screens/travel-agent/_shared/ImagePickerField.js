// screens/travel-agent/_shared/ImagePickerField.js
// Reusable image picker + uploader. Wraps react-native-image-picker and
// uploads via the TA /upload endpoint. Used by Tours / Properties / Fleet.
//
// Two modes:
//   - Single cover:        <ImagePickerField value={url} onChange={setUrl} folder="tours" />
//   - Multi-gallery (max): <ImagePickerField multi value={urls[]} onChange={setUrls} folder="tours" max={8} />
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { launchImageLibrary } from "react-native-image-picker";
import { uploadTravelAgentImage } from "../../api/travelAgentClient";
import RemoteImage from "./RemoteImage";
import { DISPLAY } from "./typography";
// Named BRAND rather than C only because the styles below already say BRAND.x —
// the values are the shared palette, same as every screen.
import { SC as BRAND } from "./theme";

function assetToRNFile(asset) {
  return {
    uri: asset.uri,
    name: asset.fileName || `photo-${Date.now()}.jpg`,
    type: asset.type || "image/jpeg",
  };
}

export default function ImagePickerField({
  value,
  onChange,
  multi = false,
  folder = "images",
  max = 8,
  label,
  helperText,
}) {
  const [busy, setBusy] = useState(false);

  const urls = multi ? (Array.isArray(value) ? value : []) : value;

  const pick = async () => {
    const remaining = multi ? max - urls.length : 1;
    if (multi && remaining <= 0) {
      Alert.alert("Limit reached", `Maximum ${max} images.`);
      return;
    }
    try {
      const res = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.85,
        selectionLimit: multi ? remaining : 1,
      });
      if (res.didCancel) return;
      if (!res.assets?.length) {
        Alert.alert("No image selected", "Please select an image and try again.");
        return;
      }
      setBusy(true);
      const uploaded = [];
      const failures = [];
      for (const asset of res.assets) {
        try {
          const file = assetToRNFile(asset);
          const out = await uploadTravelAgentImage(file, folder);
          if (out?.url) uploaded.push(out.url);
          else failures.push(asset.fileName || "image");
        } catch (err) {
          failures.push(`${asset.fileName || "image"}: ${err?.response?.data?.error || err?.message || "upload failed"}`);
        }
      }
      if (failures.length > 0 && uploaded.length === 0) {
        Alert.alert("Upload failed", failures.join("\n"));
        return;
      }
      if (failures.length > 0) {
        Alert.alert("Some images failed", failures.join("\n"));
      }
      if (uploaded.length > 0) {
        if (multi) onChange([...urls, ...uploaded]);
        else onChange(uploaded[0]);
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to pick image");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (idx) => {
    if (!multi) {
      onChange(null);
      return;
    }
    const next = urls.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      {multi ? (
        <View style={styles.grid}>
          {urls.map((u, i) => (
            <View key={`${u}-${i}`} style={styles.thumbWrap}>
              <RemoteImage source={{ uri: u }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeAt(i)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {urls.length < max && (
            <TouchableOpacity style={styles.addTile} onPress={pick} disabled={busy}>
              {busy ? (
                <ActivityIndicator size="small" color={BRAND.emerald600} />
              ) : (
                <>
                  <Ionicons name="add" size={28} color={BRAND.emerald600} />
                  <Text style={styles.addText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : value ? (
        <View style={styles.singleWrap}>
          <RemoteImage source={{ uri: value }} style={styles.singleImage} />
          <View style={styles.singleActions}>
            <TouchableOpacity style={styles.iconAction} onPress={pick} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="swap-horizontal" size={16} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconAction, { backgroundColor: BRAND.red }]} onPress={() => onChange(null)}>
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.singleEmpty} onPress={pick} disabled={busy} activeOpacity={0.8}>
          {busy ? (
            <ActivityIndicator size="small" color={BRAND.emerald600} />
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={BRAND.emerald600} />
              <Text style={styles.singleEmptyText}>Pick image</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {!!helperText && <Text style={styles.helper}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: BRAND.text, marginBottom: 6 },
  helper: { fontFamily: DISPLAY, fontSize: 11, color: BRAND.subText, marginTop: 6 },

  singleEmpty: {
    height: 140, borderRadius: 12,
    backgroundColor: BRAND.emerald50,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(28,107,82,0.35)",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  singleEmptyText: { fontFamily: DISPLAY, color: BRAND.emerald600, fontWeight: "bold", fontSize: 13 },
  singleWrap: { position: "relative" },
  singleImage: { width: "100%", height: 180, borderRadius: 12, backgroundColor: BRAND.tintSand },
  singleActions: { position: "absolute", top: 8, right: 8, flexDirection: "row", gap: 6 },
  iconAction: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: BRAND.emerald600, alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { position: "relative" },
  thumb: { width: 88, height: 88, borderRadius: 10, backgroundColor: BRAND.tintSand },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BRAND.red, alignItems: "center", justifyContent: "center",
  },
  addTile: {
    width: 88, height: 88, borderRadius: 10,
    backgroundColor: BRAND.emerald50,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(28,107,82,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  addText: { fontFamily: DISPLAY, color: BRAND.emerald600, fontSize: 11, fontWeight: "bold", marginTop: 2 },
});
