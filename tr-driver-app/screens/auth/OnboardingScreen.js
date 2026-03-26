import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, StatusBar, FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CARD_H = height * 0.44; // white card height from bottom

const SLIDES = [
  {
    id: '1',
    gradient: ['#064E3B', '#047857', '#10B981'],
    accent: '#10B981',
    darkAccent: '#064E3B',
    tag: 'TRIPS',
    title: 'Accept & Manage\nYour Trips',
    subtitle: 'Get trip requests instantly. Accept, track and complete bookings — all from one screen.',
    art: 'trips',
  },
  {
    id: '2',
    gradient: ['#1E1B4B', '#3730A3', '#6366F1'],
    accent: '#818CF8',
    darkAccent: '#1E1B4B',
    tag: 'EARNINGS',
    title: 'Know Every\nRupee You Earn',
    subtitle: 'Daily, weekly and monthly earnings at a glance. Vendor trips clearly separated.',
    art: 'earnings',
  },
  {
    id: '3',
    gradient: ['#0C1A2E', '#1E40AF', '#3B82F6'],
    accent: '#60A5FA',
    darkAccent: '#0C1A2E',
    tag: 'FLEET',
    title: 'Manage Your\nVehicles & Docs',
    subtitle: 'Add vehicles, upload documents, track maintenance and insurance expiry in one place.',
    art: 'fleet',
  },
  {
    id: '4',
    gradient: ['#1A0533', '#6D28D9', '#A78BFA'],
    accent: '#C4B5FD',
    darkAccent: '#1A0533',
    tag: 'READY',
    title: "You're All Set\nLet's Drive!",
    subtitle: 'Join thousands of drivers already using TransRentals Driver App. Start your journey today.',
    art: 'ready',
  },
];

// ── Illustration components ────────────────────────────────────────────────────

function ArtTrips({ accent }) {
  return (
    <View style={art.wrap}>
      {/* Map card */}
      <View style={art.mapCard}>
        {/* Route line */}
        <View style={art.routeCol}>
          <View style={[art.routeDot, { backgroundColor: accent }]} />
          {[0,1,2,3,4].map(i => (
            <View key={i} style={art.routeDash} />
          ))}
          <View style={[art.routeDotEnd, { backgroundColor: '#F87171' }]} />
        </View>
        {/* Labels */}
        <View style={art.routeLabels}>
          <View style={art.routeLabel}>
            <Text style={art.routeCity}>Mumbai</Text>
            <Text style={art.routeSub}>Pickup point</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={art.routeLabel}>
            <Text style={art.routeCity}>Pune</Text>
            <Text style={art.routeSub}>Drop point</Text>
          </View>
        </View>
        {/* Bottom meta */}
        <View style={art.mapMeta}>
          <View style={art.metaBadge}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={art.metaText}>2h 30m</Text>
          </View>
          <View style={art.metaBadge}>
            <Ionicons name="speedometer-outline" size={12} color="#64748B" />
            <Text style={art.metaText}>149 km</Text>
          </View>
          <View style={[art.metaBadge, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
            <Text style={[art.metaText, { color: '#16A34A' }]}>Accepted</Text>
          </View>
        </View>
      </View>

      {/* Notification pill */}
      <View style={[art.pill, { top: 24, right: 16 }]}>
        <View style={[art.pillDot, { backgroundColor: '#FCD34D' }]} />
        <Text style={art.pillText}>New Trip Request!</Text>
      </View>

      {/* Car icon */}
      <View style={[art.iconBubble, { bottom: 28, left: 24, backgroundColor: 'rgba(255,255,255,0.15)' }]}>
        <Ionicons name="car" size={28} color="#FFFFFF" />
      </View>

      {/* Fare badge */}
      <View style={[art.fareBadge, { bottom: 28, right: 16 }]}>
        <Text style={art.fareLabel}>Trip Fare</Text>
        <Text style={art.fareAmt}>₹2,400</Text>
      </View>
    </View>
  );
}

function ArtEarnings({ accent }) {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <View style={art.wrap}>
      {/* Earnings card */}
      <View style={art.earningsCard}>
        <Text style={art.earLabel}>This Week</Text>
        <Text style={art.earAmount}>₹18,450</Text>
        <View style={art.earRow}>
          <Ionicons name="trending-up" size={14} color="#22C55E" />
          <Text style={art.earGrow}>+12% from last week</Text>
        </View>
        {/* Bar chart */}
        <View style={art.barChart}>
          {bars.map((h, i) => (
            <View key={i} style={art.barWrap}>
              <View style={[art.bar, { height: h * 0.8, backgroundColor: i === 5 ? accent : 'rgba(129,140,248,0.35)' }]} />
              <Text style={art.barLabel}>{['M','T','W','T','F','S','S'][i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stat pills */}
      <View style={[art.pill, { top: 20, right: 12 }]}>
        <Ionicons name="car-outline" size={13} color="#818CF8" />
        <Text style={art.pillText}>24 Trips</Text>
      </View>
      <View style={[art.pill, { bottom: 20, left: 16 }]}>
        <Ionicons name="wallet-outline" size={13} color="#818CF8" />
        <Text style={art.pillText}>₹4,200 Today</Text>
      </View>
    </View>
  );
}

function ArtFleet({ accent }) {
  const docs = [
    { icon: 'shield-checkmark', label: 'Insurance', color: '#22C55E', sub: 'Valid' },
    { icon: 'document-text', label: 'RC Book', color: '#60A5FA', sub: 'Uploaded' },
    { icon: 'medical', label: 'Fitness', color: '#F59E0B', sub: '45 days' },
    { icon: 'map', label: 'Permit', color: '#A78BFA', sub: 'Valid' },
  ];
  return (
    <View style={art.wrap}>
      {/* Car display */}
      <View style={art.carCard}>
        <View style={art.carIconRow}>
          <Ionicons name="car-sport" size={44} color="#FFFFFF" />
        </View>
        <Text style={art.carName}>Maruti Swift</Text>
        <Text style={art.carReg}>MH 12 AB 1234</Text>
        <View style={[art.activeBadge, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
          <View style={[art.activeDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[art.activeText, { color: '#22C55E' }]}>Active</Text>
        </View>
      </View>

      {/* Doc grid */}
      <View style={art.docGrid}>
        {docs.map(d => (
          <View key={d.label} style={art.docItem}>
            <View style={[art.docIcon, { backgroundColor: d.color + '22' }]}>
              <Ionicons name={d.icon} size={16} color={d.color} />
            </View>
            <Text style={art.docLabel}>{d.label}</Text>
            <Text style={[art.docSub, { color: d.color }]}>{d.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ArtReady({ accent }) {
  const features = [
    { icon: 'flash', text: 'Instant notifications', color: '#FCD34D' },
    { icon: 'shield-checkmark', text: 'Secure & trusted', color: '#6EE7B7' },
    { icon: 'star', text: 'Rated 4.8 by drivers', color: '#FCA5A5' },
  ];
  return (
    <View style={art.wrap}>
      {/* Central badge */}
      <View style={art.readyBadge}>
        <LinearGradient colors={['#7C3AED', '#A78BFA']} style={art.readyGradBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="rocket" size={48} color="#FFFFFF" />
        </LinearGradient>
        <Text style={art.readyBadgeText}>TransRentals</Text>
        <Text style={art.readyBadgeSub}>Driver Partner</Text>
      </View>

      {/* Feature list */}
      <View style={art.featureList}>
        {features.map(f => (
          <View key={f.text} style={art.featureRow}>
            <View style={[art.featureIcon, { backgroundColor: f.color + '22' }]}>
              <Ionicons name={f.icon} size={16} color={f.color} />
            </View>
            <Text style={art.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function finishOnboarding() {
    await AsyncStorage.setItem('driver_onboarding_done', '1');
    navigation.replace('Login');
  }

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  }

  const slide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  const renderItem = ({ item }) => (
    <View style={{ width }}>
      <LinearGradient
        colors={item.gradient}
        style={styles.gradientHalf}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />

        {/* Illustration */}
        <View style={styles.artWrap}>
          {item.art === 'trips'    && <ArtTrips    accent={item.accent} />}
          {item.art === 'earnings' && <ArtEarnings accent={item.accent} />}
          {item.art === 'fleet'    && <ArtFleet    accent={item.accent} />}
          {item.art === 'ready'    && <ArtReady    accent={item.accent} />}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Slide list — only the gradient/art part scrolls */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={renderItem}
        style={styles.flatList}
      />

      {/* White bottom card — static, text updates based on activeIndex */}
      <View style={styles.card}>
        {/* Tag */}
        <View style={[styles.tag, { backgroundColor: slide.accent + '22' }]}>
          <Text style={[styles.tagText, { color: slide.accent }]}>{slide.tag}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Dots + Button row */}
        <View style={styles.navRow}>
          {/* Animated dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((s, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotW = scrollX.interpolate({
                inputRange, outputRange: [8, 28, 8], extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange, outputRange: [0.25, 1, 0.25], extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={s.id}
                  style={[styles.dot, {
                    width: dotW,
                    opacity: dotOpacity,
                    backgroundColor: slide.accent,
                  }]}
                />
              );
            })}
          </View>

          {/* Next / Skip */}
          <View style={styles.btnGroup}>
            {!isLast && (
              <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={goNext} activeOpacity={0.88}>
              <LinearGradient
                colors={[slide.gradient[0], slide.gradient[2]]}
                style={isLast ? styles.getStartedBtn : styles.nextBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLast ? (
                  <>
                    <Text style={styles.nextText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                ) : (
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Art styles ─────────────────────────────────────────────────────────────────
const art = StyleSheet.create({
  wrap: { width: width - 48, alignItems: 'center', justifyContent: 'center', flex: 1 },

  // Trip art
  mapCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  routeCol: { position: 'absolute', left: 18, top: 18, bottom: 60, alignItems: 'center', gap: 3 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeDash: { width: 2, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  routeDotEnd: { width: 12, height: 12, borderRadius: 6 },
  routeLabels: { paddingLeft: 32, justifyContent: 'space-between', height: 80 },
  routeLabel: {},
  routeCity: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  routeSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  mapMeta: { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  metaText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  pill: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, elevation: 4 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  iconBubble: { position: 'absolute', width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fareBadge: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  fareLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  fareAmt: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  // Earnings art
  earningsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  earLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  earAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  earRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 16 },
  earGrow: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // Fleet art
  carCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 12,
  },
  carIconRow: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  carName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  carReg: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
  activeText: { fontSize: 12, fontWeight: '700' },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  docItem: { flex: 1, minWidth: '44%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  docIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  docSub: { fontSize: 11, fontWeight: '700' },

  // Ready art
  readyBadge: { alignItems: 'center', marginBottom: 20 },
  readyGradBadge: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14, elevation: 12 },
  readyBadgeText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  readyBadgeSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginTop: 3 },
  featureList: { width: '100%', gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});

// ── Screen styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  flatList: { flex: 1 },

  gradientHalf: {
    height: height - CARD_H + 24, // overlaps behind card
    width,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Decorative bg circles
  bgCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)' },
  bgCircle1: { width: width * 1.2, height: width * 1.2, top: -width * 0.4, right: -width * 0.3 },
  bgCircle2: { width: width * 0.7, height: width * 0.7, bottom: 0, left: -width * 0.15 },

  artWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width,
  },

  // White bottom card
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },

  tag: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '400',
    flex: 1,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },

  btnGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  skipText: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },

  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#6D28D9',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: '#6D28D9',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  nextText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
