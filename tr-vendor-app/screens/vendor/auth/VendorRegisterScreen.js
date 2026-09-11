// screens/vendor/VendorRegisterScreen.js
// 2-step vendor registration for the Next.js backend.
//
// Visual language ported from TravelAgentRegisterScreen's "Elevate" design
// (forest→emerald hero, serif DISPLAY type, gold progress rail, glass form
// card) — with one deliberate swap: the hero's floating bubble orbs are
// replaced with a static grid-line pattern here instead.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  StatusBar,
  Dimensions,
  Keyboard,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../CustomAlertmahek";
import { SafeAreaView } from "react-native-safe-area-context";
import { DISPLAY } from "../../travel-agent/_shared/typography";
import { C, G, rs, rf, GUT, cardShadow, SHEET_RADIUS } from "../../travel-agent/_shared/theme";
import SheetHandle from "../../travel-agent/_shared/SheetHandle";
import { registerVendor, loginVendorDirect, getServiceLocations } from "../../api/client";

const BUSINESS_TYPES = [
  "Sole Proprietor",
  "Partnership Firm",
  "Private Limited Company",
  "Limited Liability Partnership (LLP)",
  "Public Limited Company",
  "One Person Company (OPC)",
  "Other",
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

// Fade + rise reveal driven by a 0→1 Animated.Value. Used to stagger the hero.
const revealStyle = (v) => ({
  opacity: v,
  transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
});

// Static grid-line overlay for the hero — this screen's stand-in for the
// travel-agent hero's floating bubble orbs. Fixed small cells (not a fixed
// line count) so the squares stay tight regardless of hero height; the
// hero's own `overflow: hidden` clips whatever extends past its edge.
function HeroGridPattern() {
  const CELL = rs(20);
  const cols = Math.ceil(SCREEN_W / CELL) + 1;
  const rowsCount = Math.ceil(rs(360) / CELL) + 1;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: cols }).map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLineV, { left: i * CELL }]} />
      ))}
      {Array.from({ length: rowsCount }).map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLineH, { top: i * CELL }]} />
      ))}
    </View>
  );
}

// ---- Stable presentational helpers (module scope so inputs keep focus) ----
const SectionHeader = ({ label, hint }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
    <View style={styles.sectionRule} />
  </View>
);

const Field = ({ label, icon, required, valid, invalid, helper, children }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.req}> *</Text>}
    </Text>
    <View style={[styles.inputWrap, valid && styles.inputOK, invalid && styles.inputError]}>
      {!!icon && <Ionicons name={icon} size={rs(18)} color={C.muted} style={styles.leftIcon} />}
      {children}
    </View>
    {!!helper && <Text style={[styles.helperText, invalid && styles.helperError]}>{helper}</Text>}
  </View>
);

const PrimaryButton = ({ onPress, disabled, loading: btnLoading, label, icon = "arrow-forward", style }) => {
  // Press feedback — a small spring "squeeze" so the CTA feels physical.
  const press = useRef(new Animated.Value(0)).current;
  // Slow light sweep across the gradient; idles while disabled/loading.
  const sheen = useRef(new Animated.Value(0)).current;
  // Gentle right-drift of the trailing chevron, hinting "forward".
  const nudge = useRef(new Animated.Value(0)).current;

  const idle = !disabled && !btnLoading;

  useEffect(() => {
    if (!idle) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(sheen, {
          toValue: 1, duration: 950,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen, idle]);

  useEffect(() => {
    if (!idle) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, {
          toValue: 1, duration: 900,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(nudge, {
          toValue: 0, duration: 900,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [nudge, idle]);

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-rs(140), SCREEN_W] });
  const sheenOpacity = sheen.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.5, 0.5, 0],
  });
  const nudgeX = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, rs(4)] });

  return (
    <Animated.View style={[styles.cta, style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || btnLoading}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 26, bounciness: 9 }).start()
        }
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={disabled ? ["#B7C6BF", "#A3B5AC"] : G.emerald}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaInner}
        >
          {/* Light sweep */}
          {idle && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ctaSheen,
                { opacity: sheenOpacity, transform: [{ translateX: sheenX }, { skewX: "-20deg" }] },
              ]}
            />
          )}

          {btnLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.ctaText}>{label}</Text>
              <Animated.View style={{ transform: [{ translateX: nudgeX }] }}>
                <Ionicons name={icon} size={rs(18)} color="#fff" />
              </Animated.View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Its own component (not inline JSX in the screen) so the search query and
// the keyboard-height tracking below stay local to this modal — a keystroke
// or a keyboard show/hide event only re-renders this subtree, not the whole
// screen (hero, floating icons, the other two modals). Combined with
// FlatList's windowed rendering (instead of a ScrollView that mounts every
// row up front), this is what keeps a 100+ city list from making the modal
// feel slow to open, or slow to react to the keyboard.
function ServiceLocationModal({ visible, onClose, allCities, citiesLoading, serviceLocations, onAdd, onRemove }) {
  const [query, setQuery] = useState("");
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height || 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (q ? allCities.filter((c) => c.name.toLowerCase().includes(q)) : allCities)
      .filter((c) => !serviceLocations.some((s) => s.locationId === c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    // While searching, keep the list short (top matches). With no query yet,
    // show the full A–Z list so cities can be browsed alphabetically —
    // FlatList only renders what's on screen, so this stays cheap either way.
    return q ? base.slice(0, 8) : base;
  }, [query, allCities, serviceLocations]);

  const handleAdd = (loc) => {
    onAdd(loc);
    setQuery("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          {
            maxHeight: Math.max(rs(280), SCREEN_H * 0.8 - kbHeight),
            marginBottom: kbHeight,
          },
        ]}>
          <SheetHandle />
          <LinearGradient
            colors={G.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service Location</Text>
              <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                <Ionicons name="close" size={rs(21)} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={{ paddingHorizontal: rs(18), paddingTop: rs(14) }}>
            <View style={styles.inputWrap}>
              <Ionicons name="search-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                placeholder={citiesLoading ? "Loading cities…" : "Search your city…"}
                placeholderTextColor={C.muted}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
            </View>
          </View>

          <FlatList
            style={[styles.modalList, { flexGrow: 0, flexShrink: 1 }]}
            contentContainerStyle={{ paddingTop: rs(12) }}
            data={matches}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={14}
            maxToRenderPerBatch={14}
            windowSize={7}
            removeClippedSubviews
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleAdd({ locationId: item.id, name: item.name, state: item.state, isCustom: false })}
              >
                <Text style={styles.modalItemText} numberOfLines={1}>
                  {item.name}{item.state ? `, ${item.state}` : ""}
                </Text>
                <Ionicons name="add-circle-outline" size={rs(20)} color={C.emeraldDeep} />
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <>
                {!citiesLoading && query.trim().length > 0 && matches.length === 0 && (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderColor: C.gold }]}
                    onPress={() => handleAdd({ locationId: null, name: query.trim(), isCustom: true })}
                  >
                    <Text style={[styles.modalItemText, { color: C.gold, fontWeight: "700" }]} numberOfLines={1}>
                      Add &quot;{query.trim()}&quot; — not in the list
                    </Text>
                    <Ionicons name="add-circle" size={rs(20)} color={C.gold} />
                  </TouchableOpacity>
                )}
                {citiesLoading && matches.length === 0 && (
                  <Text style={styles.modalHint}>Loading cities…</Text>
                )}
                {!citiesLoading && matches.length === 0 && !query.trim() && (
                  <Text style={styles.modalHint}>No cities available</Text>
                )}
              </>
            }
          />

          {serviceLocations.length > 0 && (
            <View style={styles.modalSelectedWrap}>
              <Text style={styles.modalSelectedLabel}>Selected ({serviceLocations.length})</Text>
              <View style={styles.chipsWrap}>
                {serviceLocations.map((loc, idx) => (
                  <View key={`sel-${loc.locationId ?? loc.name}-${idx}`} style={[styles.chip, loc.isCustom && styles.chipCustom]}>
                    <Text style={[styles.chipText, loc.isCustom && styles.chipTextCustom]} numberOfLines={1}>{loc.name}</Text>
                    <TouchableOpacity onPress={() => onRemove(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close" size={13} color={loc.isCustom ? C.gold : C.emeraldDeep} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <PrimaryButton
            label="Done"
            icon="checkmark"
            onPress={onClose}
            style={{ marginHorizontal: rs(18), marginTop: rs(14), marginBottom: rs(4) }}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function VendorRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Info
    businessName: "",
    businessType: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2 - Business Details
    gstNumber: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);

  // ── Service Location(s) — searchable multi-select + custom-add fallback,
  // same as the web vendor-register form. Selecting these creates the
  // vendor's first location request(s) automatically on submit.
  // The search query and keyboard-height tracking live inside
  // ServiceLocationModal itself (not here) so a keystroke or a keyboard
  // show/hide event only re-renders that modal, not this whole screen
  // (hero, floating icons, both other modals) — that cross-tree re-render
  // was what made the modal feel slow to open/close and to react to the
  // keyboard.
  const [allCities, setAllCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);

  // CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  // ── Presentation-only animations ─────────────────────────────────────
  // Staggered hero reveal: logo → title → subtitle → progress.
  const heroSteps = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      95,
      heroSteps.map((v) =>
        Animated.timing(v, {
          toValue: 1, duration: 560,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        })
      )
    ).start();
  }, [heroSteps]);

  // Logo badge springs in with a slight overshoot.
  const logoPop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(logoPop, {
      toValue: 1, useNativeDriver: true, speed: 11, bounciness: 12, delay: 120,
    }).start();
  }, [logoPop]);

  // Progress rail glides between 50% and 100% instead of snapping.
  const progress = useRef(new Animated.Value(step === 1 ? 0.5 : 1)).current;
  const pctPop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: step === 1 ? 0.5 : 1, duration: 700,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    Animated.sequence([
      Animated.timing(pctPop, { toValue: 1.22, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(pctPop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]).start();
  }, [step, progress, pctPop]);

  // Step swap: forward slides in from the right, Back from the left.
  const stepAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1, duration: 420,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [step, stepAnim]);

  // Success badge: spring pop + a repeating halo.
  const successPop = useRef(new Animated.Value(0)).current;
  const successRing = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!success) return undefined;
    Animated.spring(successPop, {
      toValue: 1, useNativeDriver: true, speed: 9, bounciness: 14,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(successRing, {
          toValue: 1, duration: 1700,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(successRing, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [success, successPop, successRing]);

  // Floating icons — full-screen ambient overlay (kept from the reference
  // design; only the hero's blob orbs were swapped for a grid pattern).
  const L = 6;
  const R = SCREEN_W - 32;
  const FLOAT_ICONS = [
    // LEFT SIDE
    { name: "calendar",    color: C.emeraldDeep, size: 22, x: L,     startY: SCREEN_H * 0.06, delay: 0,    duration: 3400 },
    { name: "bicycle",     color: C.rose,        size: 22, x: L + 2, startY: SCREEN_H * 0.18, delay: 550,  duration: 3000 },
    { name: "people",      color: C.plum,        size: 20, x: L,     startY: SCREEN_H * 0.30, delay: 250,  duration: 3200 },
    { name: "car-sport",   color: C.ocean,       size: 22, x: L + 2, startY: SCREEN_H * 0.43, delay: 800,  duration: 3800 },
    { name: "bus",         color: C.gold,        size: 22, x: L,     startY: SCREEN_H * 0.56, delay: 350,  duration: 3100 },
    { name: "location",    color: C.emeraldDeep, size: 20, x: L + 2, startY: SCREEN_H * 0.68, delay: 650,  duration: 3500 },
    { name: "trending-up", color: C.rose,        size: 19, x: L,     startY: SCREEN_H * 0.80, delay: 150,  duration: 3600 },
    // RIGHT SIDE
    { name: "airplane",    color: C.ocean,       size: 22, x: R,     startY: SCREEN_H * 0.05, delay: 400,  duration: 3300 },
    { name: "map",         color: C.emeraldDeep, size: 22, x: R - 2, startY: SCREEN_H * 0.17, delay: 900,  duration: 3100 },
    { name: "bar-chart",   color: C.gold,        size: 20, x: R,     startY: SCREEN_H * 0.29, delay: 100,  duration: 3700 },
    { name: "card",        color: C.rose,        size: 22, x: R - 2, startY: SCREEN_H * 0.41, delay: 600,  duration: 2900 },
    { name: "train",       color: C.plum,        size: 22, x: R,     startY: SCREEN_H * 0.54, delay: 300,  duration: 3400 },
    { name: "briefcase",   color: C.ocean,       size: 20, x: R - 2, startY: SCREEN_H * 0.66, delay: 750,  duration: 3500 },
    { name: "key",         color: C.emeraldDeep, size: 19, x: R,     startY: SCREEN_H * 0.79, delay: 500,  duration: 3200 },
  ];
  const floatAnims = useRef(FLOAT_ICONS.map((_, i) => new Animated.Value(i % 2 === 0 ? 0 : 0.5))).current;
  useEffect(() => {
    const anims = FLOAT_ICONS.map((cfg, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.timing(floatAnims[i], { toValue: 1, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnims[i], { toValue: 0, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach(a => a.stop());
  }, []);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Fetch the city list once, same public endpoint the web form uses
  useEffect(() => {
    let cancelled = false;
    setCitiesLoading(true);
    getServiceLocations()
      .then((data) => {
        if (cancelled) return;
        const list = (data.locations || []).map((l) => ({
          id: l.id,
          name: l.name,
          state: l.locations?.name,
        }));
        setAllCities(list);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const addServiceLocation = (loc) => {
    setServiceLocations((prev) => [...prev, loc]);
  };

  const removeServiceLocation = (idx) => {
    setServiceLocations((prev) => prev.filter((_, i) => i !== idx));
  };

  // Validations
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()),
    [formData.email]
  );
  const isPhoneValid = useMemo(
    () => /^[6-9]\d{9}$/.test((formData.phone || "").replace(/\D/g, "")),
    [formData.phone]
  );
  const isPasswordValid = useMemo(
    () => formData.password.length >= 8,
    [formData.password]
  );
  const passwordsMatch = useMemo(
    () => formData.password === formData.confirmPassword,
    [formData.password, formData.confirmPassword]
  );

  const isStep1Valid = useMemo(() => {
    return (
      formData.businessName.trim().length >= 2 &&
      formData.ownerName.trim().length >= 2 &&
      isEmailValid &&
      isPhoneValid &&
      isPasswordValid &&
      passwordsMatch
    );
  }, [formData, isEmailValid, isPhoneValid, isPasswordValid, passwordsMatch]);

  const handleNextStep = () => {
    if (!formData.businessName.trim()) {
      return showAlert("Required", "Business name is required");
    }
    if (!formData.ownerName.trim()) {
      return showAlert("Required", "Owner name is required");
    }
    if (!isEmailValid) {
      return showAlert("Invalid Email", "Please enter a valid email");
    }
    if (!isPhoneValid) {
      return showAlert("Invalid Phone", "Please enter a valid 10-digit phone number");
    }
    if (!isPasswordValid) {
      return showAlert("Weak Password", "Password must be at least 8 characters");
    }
    if (!passwordsMatch) {
      return showAlert("Password Mismatch", "Passwords do not match");
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (serviceLocations.length === 0) {
      return showAlert("Required", "Add at least one service location — where you want to operate");
    }
    try {
      setLoading(true);

      const result = await registerVendor({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ""),
        businessName: formData.businessName.trim(),
        businessType: formData.businessType || null,
        ownerName: formData.ownerName.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase() || null,
        panNumber: formData.panNumber.trim().toUpperCase() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        pincode: formData.pincode.trim() || null,
        serviceLocations: serviceLocations.map((l) => ({
          locationId: l.locationId,
          name: l.name,
          isCustom: l.isCustom,
        })),
      });

      if (result.vendor || result.message) {
        // Store vendor ID from registration response
        if (result.vendor?.vid) {
          await AsyncStorage.setItem("vendor_id", String(result.vendor.vid));
        }

        // Auto-login the user after successful registration
        try {
          const loginResult = await loginVendorDirect(
            formData.email.trim().toLowerCase(),
            formData.password
          );

          if (loginResult.success && loginResult.vendor) {
            navigation.reset({
              index: 0,
              routes: [{ name: "VendorDocuments" }],
            });
          } else {
            setSuccess(true);
          }
        } catch (loginErr) {
          console.log("Auto-login failed:", loginErr);
          setSuccess(true);
        }
      } else {
        showAlert("Error", result.error || "Registration failed");
      }
    } catch (err) {
      console.log("Register Error:", err?.response?.data || err);
      const errorMessage = err?.response?.data?.error
        || err?.message
        || "Something went wrong. Please try again.";
      showAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== Success screen =====
  if (success) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.successHero}
        >
          <HeroGridPattern />
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
            <View style={styles.successIconWrap}>
              {/* Expanding halo behind the badge */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.successRing,
                  {
                    opacity: successRing.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                    transform: [{ scale: successRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.successIcon,
                  {
                    transform: [
                      { scale: successPop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                    ],
                  },
                ]}
              >
                <Ionicons name="checkmark" size={rs(40)} color="#fff" />
              </Animated.View>
            </View>
            <Text style={styles.successTitle}>Registration successful</Text>
            <Text style={styles.successText}>
              Your vendor account has been created. Please login and upload your business
              documents for verification.
            </Text>
            <View style={{ height: rs(26) }} />
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.stepsCard, cardShadow]}>
            <Text style={styles.stepsTitle}>Next steps</Text>
            {[
              "Login to your account",
              "Upload business documents",
              "Request services & locations",
              "Start receiving bookings!",
            ].map((t, i) => (
              <View key={i} style={[styles.stepItem, i === 3 && { marginBottom: 0 }]}>
                <LinearGradient
                  colors={G.emerald}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.stepNumber}
                >
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </LinearGradient>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="Go to login"
            icon="arrow-forward"
            style={{ width: "100%" }}
            onPress={() => navigation.navigate("VendorLoginScreen")}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* Floating icons overlay */}
      <View style={styles.floatOverlay} pointerEvents="none">
        {FLOAT_ICONS.map((cfg, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          return (
            <Animated.View
              key={i}
              style={[
                styles.floatIcon,
                {
                  left: cfg.x,
                  top: cfg.startY,
                  opacity: floatAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.25, 0.10] }),
                  transform: [
                    { translateY: floatAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                    { translateX: floatAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 7 * dir, 0] }) },
                    {
                      rotate: floatAnims[i].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [`${-7 * dir}deg`, `${7 * dir}deg`, `${-7 * dir}deg`],
                      }),
                    },
                    { scale: floatAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.12, 0.9] }) },
                  ],
                },
              ]}
            >
              <Ionicons name={cfg.name} size={cfg.size} color={cfg.color} />
            </Animated.View>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={G.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <HeroGridPattern />

            <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
              {/* Back button — only on Step 2. */}
              {step === 2 && (
                <TouchableOpacity
                  style={styles.headerBackBtn}
                  onPress={() => setStep(1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={rs(17)} color="#fff" />
                  <Text style={styles.headerBackText}>Back to Basic Info</Text>
                </TouchableOpacity>
              )}

              <Animated.View style={[styles.logoRow, revealStyle(heroSteps[0])]}>
                <Animated.View
                  style={[
                    styles.logoBadge,
                    {
                      transform: [
                        { scale: logoPop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                        { rotate: logoPop.interpolate({ inputRange: [0, 1], outputRange: ["-25deg", "0deg"] }) },
                      ],
                    },
                  ]}
                >
                  <Image source={require("../../../assets/logo-white-tr.png")} style={{ width: rs(28), height: rs(28) }} />
                </Animated.View>
                <Image
                  source={require("../../../assets/logo-trans.png")}
                  style={styles.logoWordmark}
                  resizeMode="contain"
                />
              </Animated.View>

              <Animated.Text style={[styles.title, revealStyle(heroSteps[1])]}>
                Become a Vendor Partner
              </Animated.Text>
              <Animated.Text style={[styles.subtitle, revealStyle(heroSteps[2])]}>
                List your fleet, manage bookings and grow your rental business.
              </Animated.Text>

              {/* Progress */}
              <Animated.View style={[styles.progressBlock, revealStyle(heroSteps[3])]}>
                <View style={styles.progressTopRow}>
                  <Text style={styles.progressStepText}>
                    Step {step} of 2 · <Text style={styles.progressStepName}>
                      {step === 1 ? "Basic Info" : "Business Details"}
                    </Text>
                  </Text>
                  <Animated.Text style={[styles.progressPct, { transform: [{ scale: pctPop }] }]}>
                    {step === 1 ? "50%" : "100%"}
                  </Animated.Text>
                </View>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFillWrap,
                      { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                    ]}
                  >
                    <LinearGradient
                      colors={G.gold}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.progressFill}
                    />
                  </Animated.View>
                </View>
              </Animated.View>

              <View style={{ height: rs(26) }} />
            </SafeAreaView>
          </LinearGradient>

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {/* ── Form card tucked into the hero curve ── */}
            <Animated.View
              style={[
                styles.formCard,
                cardShadow,
                {
                  opacity: stepAnim,
                  transform: [
                    {
                      translateX: stepAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [step === 2 ? rs(30) : -rs(30), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Step 1 */}
              {step === 1 && (
                <>
                  <SectionHeader label="BUSINESS" />

                  <Field label="Business Name" required valid={formData.businessName.trim().length >= 2} icon="business-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="Your company name"
                      placeholderTextColor={C.muted}
                      value={formData.businessName}
                      onChangeText={(v) => handleChange("businessName", v)}
                    />
                    {formData.businessName.trim().length >= 2 && (
                      <Ionicons name="checkmark-circle" size={rs(20)} color={C.emerald} style={styles.rightIcon} />
                    )}
                  </Field>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Type</Text>
                    <TouchableOpacity style={styles.inputWrap} onPress={() => setShowBusinessTypeModal(true)} activeOpacity={0.7}>
                      <Ionicons name="briefcase-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                      <Text style={[styles.dropdownText, !formData.businessType && styles.dropdownPlaceholder]}>
                        {formData.businessType || "Select business type"}
                      </Text>
                      <Ionicons name="chevron-down" size={rs(20)} color={C.muted} style={styles.rightIcon} />
                    </TouchableOpacity>
                  </View>

                  <SectionHeader label="CONTACT" />

                  <Field label="Owner/Contact Name" required valid={formData.ownerName.trim().length >= 2} icon="person-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor={C.muted}
                      value={formData.ownerName}
                      onChangeText={(v) => handleChange("ownerName", v)}
                    />
                    {formData.ownerName.trim().length >= 2 && (
                      <Ionicons name="checkmark-circle" size={rs(20)} color={C.emerald} style={styles.rightIcon} />
                    )}
                  </Field>

                  <Field
                    label="Email"
                    required
                    icon="mail-outline"
                    valid={!!formData.email && isEmailValid}
                    invalid={!!formData.email && !isEmailValid}
                    helper={formData.email && !isEmailValid ? "Please enter a valid email" : undefined}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="business@example.com"
                      placeholderTextColor={C.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(v) => handleChange("email", v)}
                    />
                    {!!formData.email && (
                      <Ionicons
                        name={isEmailValid ? "checkmark-circle" : "alert-circle"}
                        size={rs(20)}
                        color={isEmailValid ? C.emerald : C.red}
                        style={styles.rightIcon}
                      />
                    )}
                  </Field>

                  {/* Phone */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone<Text style={styles.req}> *</Text></Text>
                    <View
                      style={[
                        styles.inputWrap,
                        formData.phone && (isPhoneValid ? styles.inputOK : styles.inputError),
                      ]}
                    >
                      <View style={styles.phonePrefix}>
                        <Text style={styles.phonePrefixText}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="9737965551"
                        placeholderTextColor={C.muted}
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(v) => handleChange("phone", v.replace(/\D/g, ""))}
                        maxLength={10}
                      />
                      {!!formData.phone && (
                        <Ionicons
                          name={isPhoneValid ? "checkmark-circle" : "alert-circle"}
                          size={rs(20)}
                          color={isPhoneValid ? C.emerald : C.red}
                          style={styles.rightIcon}
                        />
                      )}
                    </View>
                    {formData.phone && !isPhoneValid && (
                      <Text style={styles.helperError}>Please enter a valid 10-digit phone number</Text>
                    )}
                  </View>

                  <SectionHeader label="SECURITY" />

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password<Text style={styles.req}> *</Text></Text>
                    <View
                      style={[
                        styles.inputWrap,
                        formData.password && (isPasswordValid ? styles.inputOK : styles.inputError),
                      ]}
                    >
                      <Ionicons name="lock-closed-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Min 8 characters"
                        placeholderTextColor={C.muted}
                        secureTextEntry={!isPasswordVisible}
                        value={formData.password}
                        onChangeText={(v) => handleChange("password", v)}
                      />
                      <TouchableOpacity onPress={() => setIsPasswordVisible((v) => !v)} style={styles.eyeBtn}>
                        <Ionicons name={isPasswordVisible ? "eye" : "eye-off"} size={rs(18)} color={C.muted} />
                      </TouchableOpacity>
                    </View>
                    {!!formData.password && (() => {
                      const p = formData.password;
                      let s = 0;
                      if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[a-z]/.test(p)) s++;
                      if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
                      s = Math.min(s, 5);
                      const color = s <= 2 ? C.red : s === 3 ? C.gold : C.emerald;
                      const label = s <= 2 ? "Weak" : s === 3 ? "Fair" : "Strong";
                      return (
                        <View style={styles.pwStrengthRow}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <View key={i} style={[styles.pwStrengthSeg, { backgroundColor: i <= s ? color : C.border }]} />
                          ))}
                          <Text style={[styles.pwStrengthText, { color }]}>{label}</Text>
                        </View>
                      );
                    })()}
                    {formData.password && !isPasswordValid && (
                      <Text style={styles.helperError}>Password must be at least 8 characters</Text>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password<Text style={styles.req}> *</Text></Text>
                    <View
                      style={[
                        styles.inputWrap,
                        formData.confirmPassword && (passwordsMatch ? styles.inputOK : styles.inputError),
                      ]}
                    >
                      <Ionicons name="lock-closed-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor={C.muted}
                        secureTextEntry={!isConfirmPasswordVisible}
                        value={formData.confirmPassword}
                        onChangeText={(v) => handleChange("confirmPassword", v)}
                      />
                      <TouchableOpacity onPress={() => setIsConfirmPasswordVisible((v) => !v)} style={styles.eyeBtn}>
                        <Ionicons name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={rs(18)} color={C.muted} />
                      </TouchableOpacity>
                    </View>
                    {formData.confirmPassword && !passwordsMatch && (
                      <Text style={styles.helperError}>Passwords do not match</Text>
                    )}
                  </View>

                  <PrimaryButton label="Continue" onPress={handleNextStep} disabled={!isStep1Valid} />
                </>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <>
                  <SectionHeader label="TAX INFORMATION" hint="Optional" />

                  <Field label="GST Number" icon="document-text-outline" helper="Can be added later">
                    <TextInput
                      style={[styles.input, { textTransform: "uppercase" }]}
                      placeholder="22AAAAA0000A1Z5"
                      placeholderTextColor={C.muted}
                      value={formData.gstNumber}
                      onChangeText={(v) => handleChange("gstNumber", v.toUpperCase())}
                      maxLength={15}
                      autoCapitalize="characters"
                    />
                  </Field>

                  <Field label="PAN Number" icon="card-outline">
                    <TextInput
                      style={[styles.input, { textTransform: "uppercase" }]}
                      placeholder="AAAAA0000A"
                      placeholderTextColor={C.muted}
                      value={formData.panNumber}
                      onChangeText={(v) => handleChange("panNumber", v.toUpperCase())}
                      maxLength={10}
                      autoCapitalize="characters"
                    />
                  </Field>

                  <SectionHeader label="BUSINESS ADDRESS" />

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Street Address</Text>
                    <View style={[styles.inputWrap, styles.textareaWrap]}>
                      <Ionicons name="location-outline" size={rs(18)} color={C.muted} style={[styles.leftIcon, { top: rs(16) }]} />
                      <TextInput
                        style={[styles.input, { textAlignVertical: "top", paddingTop: 0 }]}
                        placeholder="Street address, building name, etc."
                        placeholderTextColor={C.muted}
                        value={formData.address}
                        onChangeText={(v) => handleChange("address", v)}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </View>

                  <Field label="City" icon="business-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={C.muted}
                      value={formData.city}
                      onChangeText={(v) => handleChange("city", v)}
                    />
                  </Field>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>State</Text>
                    <TouchableOpacity style={styles.inputWrap} onPress={() => setShowStateModal(true)} activeOpacity={0.7}>
                      <Ionicons name="map-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                      <Text style={[styles.dropdownText, !formData.state && styles.dropdownPlaceholder]}>
                        {formData.state || "Select state"}
                      </Text>
                      <Ionicons name="chevron-down" size={rs(20)} color={C.muted} style={styles.rightIcon} />
                    </TouchableOpacity>
                  </View>

                  <Field label="Pincode" icon="navigate-outline">
                    <TextInput
                      style={styles.input}
                      placeholder="380001"
                      placeholderTextColor={C.muted}
                      keyboardType="number-pad"
                      value={formData.pincode}
                      onChangeText={(v) => handleChange("pincode", v.replace(/\D/g, ""))}
                      maxLength={6}
                    />
                  </Field>

                  <SectionHeader label="SERVICE LOCATIONS" hint="Add at least 1" />

                  <View style={styles.inputGroup}>
                    <TouchableOpacity style={styles.inputWrap} onPress={() => setShowLocationModal(true)} activeOpacity={0.7}>
                      <Ionicons name="location-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                      <Text style={[styles.dropdownText, serviceLocations.length === 0 && styles.dropdownPlaceholder]}>
                        {serviceLocations.length > 0
                          ? `${serviceLocations.length} location${serviceLocations.length > 1 ? "s" : ""} selected`
                          : "Search & add cities…"}
                      </Text>
                      <Ionicons name="add-circle-outline" size={rs(20)} color={C.emeraldDeep} style={styles.rightIcon} />
                    </TouchableOpacity>

                    {serviceLocations.length > 0 && (
                      <View style={styles.chipsWrap}>
                        {serviceLocations.map((loc, idx) => (
                          <View key={`${loc.locationId ?? loc.name}-${idx}`} style={[styles.chip, loc.isCustom && styles.chipCustom]}>
                            <Text style={[styles.chipText, loc.isCustom && styles.chipTextCustom]} numberOfLines={1}>
                              {loc.name}{loc.isCustom ? " · custom" : ""}
                            </Text>
                            <TouchableOpacity onPress={() => removeServiceLocation(idx)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                              <Ionicons name="close" size={13} color={loc.isCustom ? C.gold : C.emeraldDeep} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
                      <Ionicons name="arrow-back" size={rs(18)} color={C.sub} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>

                    <PrimaryButton
                      label="Create Account"
                      onPress={handleRegister}
                      loading={loading}
                      disabled={loading}
                      style={{ flex: 1, marginTop: 0 }}
                    />
                  </View>
                </>
              )}
            </Animated.View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.smallText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("VendorLoginScreen")}>
                <Text style={styles.linkBold}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Trust note */}
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={rs(15)} color={C.muted} />
              <Text style={styles.trustText}>Your details are kept private &amp; secure.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Business Type Modal */}
      <Modal
        visible={showBusinessTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SheetHandle />
            <LinearGradient
              colors={G.hero}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.modalHeaderGrad}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Business Type</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowBusinessTypeModal(false)}>
                  <Ionicons name="close" size={rs(21)} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <ScrollView style={styles.modalList} contentContainerStyle={{ paddingVertical: rs(14) }} showsVerticalScrollIndicator={false}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.modalItem, formData.businessType === type && styles.modalItemSelected]}
                  onPress={() => {
                    handleChange("businessType", type);
                    setShowBusinessTypeModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, formData.businessType === type && styles.modalItemTextSelected]}>
                    {type}
                  </Text>
                  {formData.businessType === type && (
                    <Ionicons name="checkmark-circle" size={rs(21)} color={C.emeraldDeep} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SheetHandle />
            <LinearGradient
              colors={G.hero}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.modalHeaderGrad}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select State</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowStateModal(false)}>
                  <Ionicons name="close" size={rs(21)} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <ScrollView style={styles.modalList} contentContainerStyle={{ paddingVertical: rs(14) }} showsVerticalScrollIndicator={false}>
              {STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[styles.modalItem, formData.state === state && styles.modalItemSelected]}
                  onPress={() => {
                    handleChange("state", state);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, formData.state === state && styles.modalItemTextSelected]}>
                    {state}
                  </Text>
                  {formData.state === state && (
                    <Ionicons name="checkmark-circle" size={rs(21)} color={C.emeraldDeep} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ServiceLocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        allCities={allCities}
        citiesLoading={citiesLoading}
        serviceLocations={serviceLocations}
        onAdd={addServiceLocation}
        onRemove={removeServiceLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  floatOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  floatIcon: { position: "absolute" },
  scrollContent: { flexGrow: 1, paddingBottom: rs(36) },

  // ===== Hero =====
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.09)" },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.09)" },
  headerBackBtn: {
    flexDirection: "row", alignItems: "center", gap: rs(6),
    alignSelf: "flex-start", marginTop: rs(8), marginBottom: rs(4),
    paddingVertical: rs(7), paddingHorizontal: rs(12), borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  headerBackText: { fontFamily: DISPLAY, fontSize: rf(12.5), color: "#fff", fontWeight: "bold" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: rs(10), marginTop: rs(14), marginBottom: rs(18) },
  logoBadge: {
    width: rs(46), height: rs(46), borderRadius: rs(15),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  logoWordmark: { height: rs(26), width: rs(136), tintColor: "#fff" },
  title: { fontFamily: DISPLAY, fontSize: rf(25), color: "#fff", letterSpacing: 0.2 },
  subtitle: {
    fontFamily: DISPLAY, fontSize: rf(12.5), color: "rgba(255,255,255,0.7)",
    marginTop: rs(5), lineHeight: rf(18), fontWeight: "600",
  },

  // ===== Progress =====
  progressBlock: { marginTop: rs(20) },
  progressTopRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: rs(8),
  },
  progressStepText: {
    fontFamily: DISPLAY, fontSize: rf(11.5),
    color: "rgba(255,255,255,0.6)", fontWeight: "600",
  },
  progressStepName: { color: "#fff", fontWeight: "bold" },
  progressPct: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.goldLight, fontWeight: "bold" },
  progressTrack: {
    height: rs(7), borderRadius: rs(4),
    backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden",
  },
  progressFillWrap: { height: "100%", borderRadius: rs(4), overflow: "hidden" },
  progressFill: { flex: 1, borderRadius: rs(4) },

  // ===== Form card =====
  formCard: {
    marginHorizontal: GUT, marginTop: -rs(20),
    backgroundColor: C.card, borderRadius: rs(20),
    paddingHorizontal: rs(16), paddingTop: rs(6), paddingBottom: rs(18),
    borderWidth: 1, borderColor: C.glassBorder,
  },

  // ===== Section header =====
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: rs(14), marginBottom: rs(14) },
  sectionLabel: {
    fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold",
    color: C.emeraldDeep, letterSpacing: 1.2,
  },
  sectionHint: {
    fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "600",
    color: C.muted, marginLeft: rs(8), fontStyle: "italic",
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: C.border, marginLeft: rs(12) },

  // ===== Inputs =====
  inputGroup: { marginBottom: rs(16) },
  label: {
    fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold",
    color: C.sub, marginBottom: rs(7),
    letterSpacing: 0.3,
  },
  req: { color: C.gold, fontWeight: "bold" },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.ivory,
    borderWidth: 1, borderColor: C.border, borderRadius: rs(13), height: rs(52),
  },
  textareaWrap: { height: rs(80), alignItems: "flex-start", paddingTop: rs(12) },
  input: {
    fontFamily: DISPLAY, flex: 1, paddingLeft: rs(42), paddingRight: rs(42),
    fontSize: rf(15), color: C.ink, fontWeight: "500",
  },
  leftIcon: { position: "absolute", left: rs(14) },
  rightIcon: { position: "absolute", right: rs(14) },
  eyeBtn: {
    position: "absolute", right: rs(10), height: "100%", width: rs(40),
    alignItems: "center", justifyContent: "center",
  },

  // Phone +91 prefix
  phonePrefix: {
    height: "100%", justifyContent: "center", paddingLeft: rs(14), paddingRight: rs(12),
    borderRightWidth: 1, borderRightColor: C.border, marginRight: rs(12),
  },
  phonePrefixText: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: "bold", color: C.ink },
  phoneInput: {
    fontFamily: DISPLAY, flex: 1, paddingRight: rs(42),
    fontSize: rf(15), color: C.ink, fontWeight: "500",
  },

  dropdownText: {
    fontFamily: DISPLAY, flex: 1, paddingLeft: rs(42), paddingRight: rs(42),
    fontSize: rf(15), color: C.ink, fontWeight: "500",
  },
  dropdownPlaceholder: { color: C.muted, fontWeight: "400" },

  inputOK: { borderColor: C.emerald, backgroundColor: C.card },
  inputError: { borderColor: C.red, backgroundColor: C.card },
  helperText: { fontFamily: DISPLAY, color: C.muted, fontSize: rf(11.5), marginTop: rs(6), fontWeight: "600" },
  helperError: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12), marginTop: rs(6), fontWeight: "600" },

  pwStrengthRow: { flexDirection: "row", alignItems: "center", gap: rs(6), marginTop: rs(10) },
  pwStrengthSeg: { flex: 1, height: rs(4), borderRadius: rs(2) },
  pwStrengthText: { fontFamily: DISPLAY, marginLeft: rs(6), fontWeight: "bold", fontSize: rf(11.5) },

  // Service Location chips
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: rs(8), marginTop: rs(10) },
  chip: {
    flexDirection: "row", alignItems: "center", gap: rs(6),
    paddingLeft: rs(12), paddingRight: rs(8), paddingVertical: rs(7),
    borderRadius: 999, backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.28)", maxWidth: "100%",
  },
  chipCustom: { backgroundColor: C.tintGold, borderColor: "rgba(221,163,63,0.4)" },
  chipText: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "700", color: C.emeraldDeep, maxWidth: rs(180) },
  chipTextCustom: { color: "#9A6B16" },
  modalHint: { fontFamily: DISPLAY, textAlign: "center", color: C.muted, fontSize: rf(13), paddingVertical: rs(20) },
  modalSelectedWrap: { paddingHorizontal: rs(18), paddingTop: rs(10) },
  modalSelectedLabel: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold", color: C.sub, marginBottom: rs(8) },

  // ===== Buttons =====
  buttonRow: { flexDirection: "row", gap: rs(12), marginTop: rs(22), alignItems: "stretch" },
  backBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", height: rs(54),
    paddingHorizontal: rs(20), borderRadius: rs(14), borderWidth: 1, borderColor: C.border,
    backgroundColor: C.ivory, gap: rs(6),
  },
  backBtnText: { fontFamily: DISPLAY, fontSize: rf(14.5), fontWeight: "bold", color: C.sub },

  cta: { height: rs(54), borderRadius: rs(14), overflow: "hidden", marginTop: rs(24) },
  ctaInner: {
    flex: 1, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: rs(8), overflow: "hidden",
  },
  ctaSheen: {
    position: "absolute", top: -rs(20), bottom: -rs(20), left: 0,
    width: rs(70), backgroundColor: "rgba(255,255,255,0.35)",
  },
  ctaText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: rf(16),
    fontWeight: "bold", letterSpacing: 0.2,
  },

  // ===== Footer =====
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: rs(22) },
  smallText: { fontFamily: DISPLAY, color: C.sub, fontSize: rf(13.5), fontWeight: "600" },
  linkBold: { fontFamily: DISPLAY, color: C.emeraldDeep, fontWeight: "bold", fontSize: rf(13.5) },
  trustRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), marginTop: rs(14),
  },
  trustText: { fontFamily: DISPLAY, color: C.muted, fontSize: rf(11.5), fontWeight: "600" },

  // ===== Success =====
  successHero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  successScroll: { paddingHorizontal: GUT, paddingTop: rs(20), paddingBottom: rs(36) },
  successIconWrap: {
    width: rs(78), height: rs(78),
    alignItems: "center", justifyContent: "center",
    marginTop: rs(24), marginBottom: rs(20),
  },
  successIcon: {
    width: rs(78), height: rs(78), borderRadius: rs(39),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  successRing: {
    position: "absolute",
    width: rs(78), height: rs(78), borderRadius: rs(39),
    borderWidth: rs(2), borderColor: "rgba(255,255,255,0.55)",
  },
  successTitle: { fontFamily: DISPLAY, fontSize: rf(24), color: "#fff", letterSpacing: 0.2 },
  successText: {
    fontFamily: DISPLAY, fontSize: rf(13), color: "rgba(255,255,255,0.72)",
    marginTop: rs(8), lineHeight: rf(20), fontWeight: "600",
  },
  stepsCard: {
    width: "100%", backgroundColor: C.card, borderRadius: rs(20),
    padding: rs(20), marginBottom: rs(4),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  stepsTitle: {
    fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold",
    color: C.emeraldDeep, letterSpacing: 1, marginBottom: rs(16),
    textTransform: "uppercase",
  },
  stepItem: { flexDirection: "row", alignItems: "center", marginBottom: rs(14) },
  stepNumber: {
    width: rs(27), height: rs(27), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center", marginRight: rs(12),
  },
  stepNumberText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(12.5) },
  stepText: { fontFamily: DISPLAY, fontSize: rf(13.5), color: C.sub, flex: 1, fontWeight: "600" },

  // ===== Modal =====
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: C.bg, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    paddingBottom: rs(28), maxHeight: "72%", overflow: "hidden",
  },
  modalHeaderGrad: { paddingHorizontal: rs(18), paddingVertical: rs(16) },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: "#fff" },
  modalClose: {
    width: rs(34), height: rs(34), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  modalList: { paddingHorizontal: rs(18) },
  modalItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: rs(15), paddingHorizontal: rs(16), marginBottom: rs(8),
    backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border,
  },
  modalItemSelected: { backgroundColor: C.tintEmerald, borderColor: "rgba(28,107,82,0.28)" },
  modalItemText: { fontFamily: DISPLAY, fontSize: rf(14.5), color: C.sub, fontWeight: "600" },
  modalItemTextSelected: { color: C.emeraldDeep, fontWeight: "bold" },
});
