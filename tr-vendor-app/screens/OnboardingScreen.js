import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  FlatList,
  Image,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const slides = [
  {
    key: "1",
    title: "List once. Get endless leads",
    subtitle: "Post vehicles and receive genuine rental inquiries effortlessly.",
    bg: "#DFF7FF",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "2",
    title: "Quotes made simple",
    subtitle: "Respond instantly and win more bookings with ease.",
    bg: "#EAEFFF",
    image:
      "https://images.unsplash.com/photo-1541348263662-e068662d82af?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "3",
    title: "Smart Dashboard. Total Control.",
    subtitle: "Manage fleet, pricing, and availability in one place.",
    bg: "#E9FFE9",
    image:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    key: "4",
    title: "Grow with TransRentals",
    subtitle: "Scale your rental business with verified leads & 24/7 support.",
    bg: "#FFF3E6",
    image:
      "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function OnboardingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const IS_TABLET = Math.max(width, height) >= 900;
  const CARD_W = Math.min(820, width * 0.88);
  const HERO_H = IS_TABLET ? height * 0.44 : height * 0.36;
  const AUTO_DELAY = 3600;

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isInteractingRef = useRef(false);
  const timerRef = useRef(null);

  // Entrance / loop animations
  const slideIn = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  const startSlideIn = useCallback(() => {
    slideIn.setValue(0);
    Animated.spring(slideIn, {
      toValue: 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [slideIn]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const goTo = useCallback(
    (i) => listRef.current?.scrollToOffset({ offset: i * width, animated: true }),
    [width]
  );

  // autoplay (no jitter with refs)
  useEffect(() => {
    startSlideIn();
    const start = () => {
      stop();
      timerRef.current = setInterval(() => {
        if (isInteractingRef.current) return;
        const next = (indexRef.current + 1) % slides.length;
        goTo(next);
        indexRef.current = next;
        startSlideIn();
      }, AUTO_DELAY);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    start();
    return stop;
  }, [goTo, AUTO_DELAY, startSlideIn]);

  const onMomentumEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
    indexRef.current = i;
    isInteractingRef.current = false;
    startSlideIn();
  };

  const handleSkip = () => navigation?.replace?.("VendorLoginScreen");
  const handleGetStarted = () => navigation?.replace?.("VendorRegisterScreen");
  const handleLogin = () => navigation?.replace?.("VendorLoginScreen");

  // Dots: animate scaleX (native-driver safe)
  const renderDots = () => (
    <View style={styles.dotsRow}>
      {slides.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const scaleX = scrollX.interpolate({
          inputRange,
          outputRange: [1, 3.5, 1],
          extrapolate: "clamp",
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: "clamp",
        });
        return <Animated.View key={i} style={[styles.dot, { opacity, transform: [{ scaleX }] }]} />;
      })}
    </View>
  );

  // Reusable helper: how focused is this slide? (0 = off, 1 = centered)
  const focusFor = (i) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

  const SlideCard = ({ item, i }) => {
    // focus-dependent values to avoid “double card”
    const focus = focusFor(i);

    // Fade/scales so only the active slide looks fully present
    const contentOpacity = focus;
    const contentScale = focus.interpolate({
      inputRange: [0, 1],
      outputRange: [0.98, 1],
    });

    const parallax = scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: [-34, 0, 34],
      extrapolate: "clamp",
    });
    const tilt = scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: ["12deg", "0deg", "-12deg"],
      extrapolate: "clamp",
    });
    const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
    const inTranslateY = slideIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
    const inOpacity = slideIn; // 0 -> 1
    const breatheY = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

    // Wider/overflowing sheet to kill edge seam
    const SHEET_H = Math.min(560, HERO_H + 180);

    return (
      <View style={{ width, backgroundColor: item.bg }}>
        <View style={{ height: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 8 }} />

        {/* Edge-safe diagonal sheet (extends beyond edges) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.diagonal,
            {
              height: SHEET_H,
              backgroundColor: "rgba(255,255,255,0.66)",
              left: -100,
              right: -100,
              opacity: focus, // only strong on active slide
            },
          ]}
        />

        <View style={{ alignItems: "center" }}>
          {/* Parallax + Float hero */}
          <Animated.View
            style={{
              transform: [{ translateX: parallax }, { translateY: floatY }],
              opacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
            }}
          >
            <Animated.View
              style={{
                width: Math.min(860, CARD_W),
                height: HERO_H,
                borderRadius: 26,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                transform: [{ perspective: 900 }, { rotateY: tilt }],
              }}
            >
              <Image source={{ uri: item.image }} style={{ width: "100%", height: "100%" }} />
            </Animated.View>
          </Animated.View>

          {/* Content card (focus-gated) */}
          <Animated.View
            style={[
              styles.card,
              {
                width: Math.min(860, CARD_W),
                transform: [{ translateY: inTranslateY }, { scale: contentScale }],
                opacity: Animated.multiply(inOpacity, contentOpacity),
              },
            ]}
          >
            <Text style={[styles.title, { fontSize: IS_TABLET ? 30 : 22 }]}>{item.title}</Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: IS_TABLET ? 18 : 15, lineHeight: IS_TABLET ? 24 : 22 },
              ]}
            >
              {item.subtitle}
            </Text>

            <Animated.View style={[styles.badgesRow, { transform: [{ translateY: breatheY }] }]}>
              {i === 0 && (
                <>
                  <Badge text="Verified Leads" />
                  <Badge text="Zero Spam" />
                  <Badge text="One Profile • All Cities" />
                </>
              )}
              {i === 1 && (
                <>
                  <Badge text="1-Tap Quote" />
                  <Badge text="Auto-Templates" />
                  <Badge text="Win Faster" />
                </>
              )}
              {i === 2 && (
                <>
                  <Badge text="Fleet Control" />
                  <Badge text="Smart Pricing" />
                  <Badge text="Live Availability" />
                </>
              )}
              {i === 3 && (
                <>
                  <Badge text="24/7 Support" />
                  <Badge text="Verified Buyers" />
                  <Badge text="Scale Confidently" />
                </>
              )}
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Skip pill */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 6 : 6 }]}>
        <Pressable onPress={handleSkip} hitSlop={10} style={styles.skipBtn}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        removeClippedSubviews
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => (isInteractingRef.current = true)}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
          indexRef.current = i;
          isInteractingRef.current = false;
          startSlideIn();
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index: i }) => <SlideCard item={item} i={i} />}
        scrollEventThrottle={16}
        style={{ backgroundColor: slides[index]?.bg || "#fff" }}
      />

      {renderDots()}

      <View style={[styles.ctaWrap, { paddingBottom: 20 + (Platform.OS === "android" ? 6 : 0) }]}>
        <Pressable style={styles.primaryBtn} onPress={handleGetStarted}>
          <Text style={styles.primaryTxt}>Get Started</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleLogin}>
          <Text style={styles.secondaryTxt}>Log in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const Badge = ({ text }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeTxt}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    zIndex: 20,
    right: 18,
  },
  skipBtn: {
    backgroundColor: "rgba(15,23,32,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skip: { fontSize: 13.5, color: "#0F1720", fontWeight: "600" },

  diagonal: {
    position: "absolute",
    top: 0,
    // left/right overridden per-item to extend past edges
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    transform: [{ rotate: "-2.6deg" }],
  },

  card: {
    marginTop: 18,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(15,23,32,0.06)",
    alignSelf: "center",
    maxWidth: 860,
  },
  title: { fontWeight: "800", color: "#0F1720", letterSpacing: 0.2 },
  subtitle: { marginTop: 8, color: "#344256" },
  badgesRow: { marginTop: 14, flexDirection: "row", flexWrap: "wrap" },
  badge: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,32,0.10)",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  badgeTxt: { fontSize: 12.5, color: "#0F1720", fontWeight: "700" },

  dotsRow: {
    position: "absolute",
    bottom: 118,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#0F1720",
    marginHorizontal: 4,
  },

  ctaWrap: { position: "absolute", bottom: 24, left: 20, right: 20 },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F1720",
  },
  primaryTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    borderColor: "rgba(15,23,32,0.12)",
    backgroundColor: "#fff",
    marginTop: 12,
  },
  secondaryTxt: { color: "#0F1720", fontSize: 15, fontWeight: "800" },
});
