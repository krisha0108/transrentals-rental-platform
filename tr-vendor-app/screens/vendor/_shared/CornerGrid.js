import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

// Static grid-line decoration (graph-paper style), denser near one corner
// and fading out toward the opposite side. No image asset and no
// animation — plain <View>s with hairline borders forming the grid cells,
// the same reliable technique CornerDots uses for its dots.
//
// Row/column count is derived from the box's own measured size (onLayout)
// divided by cellSize, so cells always come out square regardless of the
// caller's width/height — passing a fixed row/col count directly (like
// CornerDots does for its dots) let the box's real aspect ratio stretch
// the cells into rectangles.
export default function CornerGrid({ style, lineColor = 'rgba(255,255,255,0.3)', cellSize = 26, corner = 'top-right' }) {
  const [size, setSize] = useState(null);

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  if (!size) {
    return <View style={[styles.wrap, style]} onLayout={onLayout} pointerEvents="none" />;
  }

  const cols = Math.max(1, Math.round(size.width / cellSize));
  const rows = Math.max(1, Math.round(size.height / cellSize));
  const cornerX = corner.includes('right') ? cols - 1 : 0;
  const cornerY = corner.includes('bottom') ? rows - 1 : 0;
  const maxDist = Math.hypot(cornerX, cornerY) || 1;

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout} pointerEvents="none">
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: cols }).map((_, c) => {
            const dist = Math.hypot(c - cornerX, r - cornerY);
            const t = Math.max(0, 1 - dist / maxDist);
            const opacity = t * 0.9;
            return (
              <View key={c} style={[styles.cell, { borderColor: lineColor, opacity }]} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'column' },
  row: { flexDirection: 'row', flex: 1 },
  cell: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
});
