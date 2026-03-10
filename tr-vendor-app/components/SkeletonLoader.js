import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E5E7EB', opacity },
        style,
      ]}
    />
  );
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonBox width={120} height={14} />
        <SkeletonBox width={70} height={22} borderRadius={12} />
      </View>
      <View style={[styles.cardRow, { marginTop: 10 }]}>
        <SkeletonBox width={160} height={12} />
      </View>
      <View style={[styles.cardRow, { marginTop: 8 }]}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={80} height={12} />
      </View>
      <View style={[styles.cardRow, { marginTop: 12 }]}>
        <SkeletonBox width={90} height={32} borderRadius={8} />
        <SkeletonBox width={90} height={32} borderRadius={8} />
      </View>
    </View>
  );
}

// List skeleton - renders multiple booking cards
export function ListSkeleton({ count = 5 }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </View>
  );
}

// Detail screen skeleton
export function DetailSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      {/* Header */}
      <View style={styles.card}>
        <SkeletonBox width={180} height={18} style={{ marginBottom: 10 }} />
        <SkeletonBox width={100} height={24} borderRadius={12} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={12} />
      </View>
      {/* Details block */}
      <View style={styles.card}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.cardRow, { marginBottom: 12 }]}>
            <SkeletonBox width={80} height={12} />
            <SkeletonBox width={120} height={12} />
          </View>
        ))}
      </View>
      {/* Action buttons */}
      <View style={styles.cardRow}>
        <SkeletonBox width="47%" height={44} borderRadius={10} />
        <SkeletonBox width="47%" height={44} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
