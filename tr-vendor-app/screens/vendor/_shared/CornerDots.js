import React from 'react';
import { View, StyleSheet } from 'react-native';

// Static dot-grid decoration, denser near one corner and fading out toward
// the opposite side. No image asset (nothing that can silently fail to
// load) and no animation — just plain <View>s, the same technique already
// proven to render reliably elsewhere in this app.
export default function CornerDots({ style, dotColor = 'rgba(255,255,255,0.5)', rows = 6, cols = 6, corner = 'top-right' }) {
  const cornerX = corner.includes('right') ? cols - 1 : 0;
  const cornerY = corner.includes('bottom') ? rows - 1 : 0;
  const maxDist = Math.hypot(cornerX, cornerY) || 1;

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: cols }).map((_, c) => {
            const dist = Math.hypot(c - cornerX, r - cornerY);
            const t = Math.max(0, 1 - dist / maxDist - 0.12);
            const opacity = t * 0.9;
            return <View key={c} style={[styles.dot, { backgroundColor: dotColor, opacity }]} />;
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-evenly' },
  row: { flexDirection: 'row', justifyContent: 'space-evenly' },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
});
