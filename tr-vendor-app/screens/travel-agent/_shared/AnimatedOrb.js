// screens/travel-agent/_shared/AnimatedOrb.js
// Slowly drifting/pulsing decorative orb for gradient heroes — gentle ambient
// motion behind the hero content. Native-driven (transform-only), so it costs
// almost nothing on the JS thread.
//
// Previously inlined verbatim in TravelAgentDashboardScreen and
// LeadsListScreen; extracted here so new screens stop re-declaring it.
//
//   <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
import React from "react";
import { Animated, Easing } from "react-native";

export default function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, {
          toValue: 1,
          duration: 5200,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);

  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]}
    />
  );
}
