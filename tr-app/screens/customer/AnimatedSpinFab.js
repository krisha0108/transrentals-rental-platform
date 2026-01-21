// // AnimatedSpinFab.js
// import React, { useEffect, useRef, useState } from 'react';
// import { TouchableOpacity, Animated, Easing, Image, StyleSheet, View } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// export default function AnimatedSpinFab({ onPress }) {
//   const [showWheel, setShowWheel] = useState(true);

//   const spinAnim = useRef(new Animated.Value(0)).current; // for rotation
//   const scaleAnim = useRef(new Animated.Value(1)).current; // for popping effect
//   const fadeAnim = useRef(new Animated.Value(1)).current;  // for fading
// const glowAnim  = useRef(new Animated.Value(0)).current;   
//   const wheelImage = require('../../assets/spinner-win.png');  // your spinning wheel image
//   const giftImage  = require('../../assets/gift.png');     // your gift box image

//   // continuous spin animation for the wheel
//   const startSpin = () => {
//     spinAnim.setValue(0);
//     Animated.loop(
//       Animated.timing(spinAnim, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//  useEffect(() => {
//     let interval;

//     const loop = () => {
//       // Show wheel first
//       setShowWheel(true);
//       startSpin(); // <-- restart spin every time spinner is shown
//       fadeAnim.setValue(0);
//       scaleAnim.setValue(0.8);
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//         Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//       ]).start();

//       setTimeout(() => {
//         // Switch to gift
//         setShowWheel(false);
//         fadeAnim.setValue(0);
//         scaleAnim.setValue(0.8);
//         Animated.parallel([
//           Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//           Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//         ]).start();
//       }, 4000); // after 2.5s, switch to gift
//     };

//     loop();
//     interval = setInterval(loop, 5000); // every 5s, restart

//     return () => clearInterval(interval);
//   }, []);

//   const rotation = spinAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   return (
//     // <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.9}>
//     //   <Animated.View
//     //     style={{
//     //       transform: [
//     //         { rotate: showWheel ? rotation : '0deg' },
//     //         { scale: scaleAnim }
//     //       ],
//     //       opacity: fadeAnim,
//     //     }}
//     //   >
//     //     <Image
//     //       source={showWheel ? wheelImage : giftImage}
//     //       style={{ width: 50, height: 50 }}
//     //       resizeMode="contain"
//     //     />
//     //   </Animated.View>
//     // </TouchableOpacity>
//      <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.9}>
//       <Animated.View style={{
//         transform: [
//           { rotate: showWheel ? rotation : '0deg' },
//           { scale: scaleAnim }
//         ],
//         opacity: fadeAnim,
//       }}>
//         <Image
//           source={showWheel ? wheelImage : giftImage}
//           style={{ width: 50, height: 50 }}
//           resizeMode="contain"
//         />
//       </Animated.View>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   fab: {
//     position: 'absolute',
//     right: 16,
//     bottom: 100,
//     backgroundColor: '#fff',
//     padding: 8,
//     zIndex:500,
//     borderRadius: 999,
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
// });
// AnimatedSpinFab.js
// AnimatedSpinFab.js
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   TouchableOpacity,
//   Animated,
//   Easing,
//   Image,
//   StyleSheet,
//   View,
//   Platform,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';

// export default function AnimatedSpinFab({ onPress }) {
//   const [showWheel, setShowWheel] = useState(true);

//   // existing anims
//   const spinAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const fadeAnim  = useRef(new Animated.Value(1)).current;

//   // NEW: background spin
//   const bgAnim   = useRef(new Animated.Value(0)).current;

//   const wheelImage = require('../../assets/spinner-win.png');
//   const giftImage  = require('../../assets/gift.png');

//   const startSpin = () => {
//     spinAnim.setValue(0);
//     Animated.loop(
//       Animated.timing(spinAnim, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const startBgSpin = () => {
//     bgAnim.setValue(0);
//     Animated.loop(
//       Animated.timing(bgAnim, {
//         toValue: 1,
//         duration: 8000, // slower, ambient rotation
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   useEffect(() => {
//     let interval;
//     startBgSpin();

//     const loop = () => {
//       setShowWheel(true);
//       startSpin();
//       fadeAnim.setValue(0);
//       scaleAnim.setValue(0.8);
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//         Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//       ]).start();

//       setTimeout(() => {
//         setShowWheel(false);
//         fadeAnim.setValue(0);
//         scaleAnim.setValue(0.8);
//         Animated.parallel([
//           Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//           Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//         ]).start();
//       }, 4000);
//     };

//     loop();
//     interval = setInterval(loop, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const rotation = spinAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   const bgRotation = bgAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   // build 12 soft rays
//   const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

//   return (
//     <View pointerEvents="box-none" style={styles.fabWrap}>
//       {/* Spinning circular gradient background */}
//       <Animated.View
//         pointerEvents="none"
//         style={[styles.bg, { transform: [{ rotate: bgRotation }] }]}
//       >
//         <LinearGradient
//           colors={['#1F3AE0', '#7C3AED']} // blue -> purple
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.bgFill}
//         />
//         {RAYS.map((deg) => (
//           <View
//             key={deg}
//             style={[
//               styles.ray,
//               {
//                 transform: [{ rotate: `${deg}deg` }],
//                 left: BG / 2 - RAY_WIDTH / 2,
//               },
//             ]}
//           />
//         ))}
//       </Animated.View>

//       {/* Pressable foreground button */}
//       <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
//         <LinearGradient
//           colors={['#5B8CFF', '#8B5CF6']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.fab}
//         >
//           <Animated.View
//             style={{
//               transform: [{ rotate: showWheel ? rotation : '0deg' }, { scale: scaleAnim }],
//               opacity: fadeAnim,
//             }}
//           >
//             <Image
//               source={showWheel ? wheelImage : giftImage}
//               style={{ width: 50, height: 50 }}
//               resizeMode="contain"
//             />
//           </Animated.View>
//         </LinearGradient>
//       </TouchableOpacity>
//     </View>
//   );
// }

// /** sizes */
// const SIZE = 45;         // inner button
// const BG   = 70;         // outer spinning background
// const RAY_WIDTH = 6;

// const styles = StyleSheet.create({
//   fabWrap: {
//     position: 'absolute',
//     right: 28,
//     bottom: 100,
//     zIndex: 500,
//   },

//   // Spinning circular background (like your reference image)
//   bg: {
//     position: 'absolute',
//     width: BG,
//     height: BG,
//     borderRadius: BG / 2,
//     alignSelf: 'center',
//     top: -(BG - SIZE) / 2,
//     left: -(BG - SIZE) / 2,
//     zIndex: -1,
//     overflow: 'hidden',
//   },
//   bgFill: {
//     ...StyleSheet.absoluteFillObject,
//     borderRadius: BG / 2,
//   },
//   ray: {
//     position: 'absolute',
//     top: 0,
//     width: RAY_WIDTH,
//     height: BG,
//     borderRadius: RAY_WIDTH / 2,
//     backgroundColor: 'rgba(255,255,255,0.08)', // soft light beams
//   },

//   // Foreground gradient button with subtle shadow
//   fab: {
//     width: SIZE,
//     height: SIZE,
//     borderRadius: 999,
//     padding: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#7AA2FF',
//     shadowOpacity: 0.45,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//     ...Platform.select({ android: { elevation: 10 } }),
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.15)',
//   },
// });
// AnimatedSpinFab.js
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   TouchableOpacity,
//   Animated,
//   Easing,
//   Image,
//   StyleSheet,
//   View,
//   Platform,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';

// export default function AnimatedSpinFab({ onPress }) {
//   const [showWheel, setShowWheel] = useState(true);

//   // animations
//   const spinAnim = useRef(new Animated.Value(0)).current;  // center icon spin
//   const scaleAnim = useRef(new Animated.Value(1)).current; // pop
//   const fadeAnim  = useRef(new Animated.Value(1)).current; // fade
//   const bgAnim    = useRef(new Animated.Value(0)).current; // background spin

//   const wheelImage = require('../../assets/spinner-win.png');
//   const giftImage  = require('../../assets/gift.png');

//   const startSpin = () => {
//     spinAnim.setValue(0);
//     Animated.loop(
//       Animated.timing(spinAnim, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const startBgSpin = () => {
//     bgAnim.setValue(0);
//     Animated.loop(
//       Animated.timing(bgAnim, {
//         toValue: 1,
//         duration: 8000, // slow ambient rotation
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   useEffect(() => {
//     let interval;
//     startBgSpin();

//     const loop = () => {
//       setShowWheel(true);
//       startSpin();
//       fadeAnim.setValue(0);
//       scaleAnim.setValue(0.8);
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//         Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//       ]).start();

//       setTimeout(() => {
//         setShowWheel(false);
//         fadeAnim.setValue(0);
//         scaleAnim.setValue(0.8);
//         Animated.parallel([
//           Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
//           Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
//         ]).start();
//       }, 4000);
//     };

//     loop();
//     interval = setInterval(loop, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const rotation = spinAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   const bgRotation = bgAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   // 12 soft rays (sunburst)
//   const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

//   return (
//     <View pointerEvents="box-none" style={styles.fabWrap}>
//       {/* Spinning golden background disc */}
//       <Animated.View pointerEvents="none" style={[styles.bg, { transform: [{ rotate: bgRotation }] }]}>
//         <LinearGradient
//           colors={[GOLD.dark, GOLD.light]} // deep -> light gold
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.bgFill}
//         />
//         {RAYS.map((deg) => (
//           <View
//             key={deg}
//             style={[
//               styles.ray,
//               { transform: [{ rotate: `${deg}deg` }], left: BG / 2 - RAY_WIDTH / 2 },
//             ]}
//           />
//         ))}
//       </Animated.View>

//       {/* Foreground pressable button */}
//       <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
//         <LinearGradient
//           colors={[GOLD.mid, GOLD.light]} // glossy coin face
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.fab}
//         >
//           <Animated.View
//             style={{
//               transform: [{ rotate: showWheel ? rotation : '0deg' }, { scale: scaleAnim }],
//               opacity: fadeAnim,
//             }}
//           >
//             <Image
//               source={showWheel ? wheelImage : giftImage}
//               style={{ width: 50, height: 50 }}
//               resizeMode="contain"
//             />
//           </Animated.View>
//         </LinearGradient>
//       </TouchableOpacity>
//     </View>
//   );
// }

// /** palette inspired by your coin */
// const GOLD = {
//   dark: '#8A5D14', // outer ring / shadowed gold
//   mid:  '#C99628', // mid-tone gold
//   light:'#F5CE6A', // highlight gold
// };

// /** sizes */
// const SIZE = 45;       // inner button
// const BG   = 70;       // spinning background size
// const RAY_WIDTH = 6;

// const styles = StyleSheet.create({
//   fabWrap: {
//     position: 'absolute',
//     right: 26,
//     bottom: 100,
//     zIndex: 500,
//   },

//   // spinning background
//   bg: {
//     position: 'absolute',
//     width: BG,
//     height: BG,
//     borderRadius: BG / 2,
//     alignSelf: 'center',
//     top: -(BG - SIZE) / 2,
//     left: -(BG - SIZE) / 2,
//     zIndex: -1,
//     overflow: 'hidden',
//   },
//   bgFill: {
//     ...StyleSheet.absoluteFillObject,
//     borderRadius: BG / 2,
//   },
//   ray: {
//     position: 'absolute',
//     top: 0,
//     width: RAY_WIDTH,
//     height: BG,
//     borderRadius: RAY_WIDTH / 2,
//     backgroundColor: 'rgba(255, 228, 150, 0.18)', // warm golden beam
//   },

//   // button
//   fab: {
//     width: SIZE,
//     height: SIZE,
//     borderRadius: 999,
//     padding: 8,
//     justifyContent: 'center',
//     alignItems: 'center',

//     // iOS colored shadow (warm)
//     shadowColor: '#F2C14E',
//     shadowOpacity: 0.5,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },

//     // Android elevation (color approximated by the bg disc)
//     ...Platform.select({ android: { elevation: 10 } }),

//     borderWidth: 1,
//     borderColor: 'rgba(255, 245, 200, 0.25)',
//   },
// });
// AnimatedSpinFab.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function AnimatedSpinFab({ onPress }) {
  const [showWheel, setShowWheel] = useState(true);

  // center icon anims
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // spinning background + glow halos
  const bgAnim   = useRef(new Animated.Value(0)).current;
  const halo1    = useRef(new Animated.Value(0)).current;
  const halo2    = useRef(new Animated.Value(0)).current;
  const halo3    = useRef(new Animated.Value(0)).current;

  // coin burst
  const COIN_COUNT = 10;
  const [coinsOn, setCoinsOn] = useState(false);
  const coinTx = useRef([...Array(COIN_COUNT)].map(() => new Animated.Value(0))).current;
  const coinTy = useRef([...Array(COIN_COUNT)].map(() => new Animated.Value(0))).current;
  const coinOp = useRef([...Array(COIN_COUNT)].map(() => new Animated.Value(0))).current;
  const coinSc = useRef([...Array(COIN_COUNT)].map(() => new Animated.Value(0.6))).current;
  const coinRt = useRef([...Array(COIN_COUNT)].map(() => new Animated.Value(0))).current;

  const wheelImage = require('../../assets/spinner-win.png');
  const giftImage  = require('../../assets/gift.png');
  const coinImage  = require('../../assets/coin-front.png'); // <— add this

  /** gold palette (tweak to match your coin exactly) */
  const GOLD = {
    xdark: '#6E4A0E',
    dark:  '#8A5D14',
    mid:   '#C99628',
    light: '#F5CE6A',
    glow:  'rgba(255, 216, 120, 0.55)',
    glow2: 'rgba(255, 216, 120, 0.35)',
    ray:   'rgba(255, 235, 170, 0.22)',
  };

  /** sizes (bump BG or HALO sizes if you want even more presence) */
  const SIZE = 45;   // inner button
  const BG   = 70;  // spinning disc
  const HALO1= 100;  // outer pulsing halos
  const HALO2= 120;
  const HALO3= 150;

  // center icon rotation
  const startSpin = () => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // background slow rotation
  const startBgSpin = () => {
    bgAnim.setValue(0);
    Animated.loop(
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // BIGGER glow – three out-of-phase pulses
  const startHalos = () => {
    const mk = (v, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 1400, delay, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      ).start();

    halo1.setValue(0); halo2.setValue(0); halo3.setValue(0);
    mk(halo1, 0);
    mk(halo2, 350);
    mk(halo3, 700);
  };

  // coin celebration when gift appears
  const burstCoins = () => {
    setCoinsOn(true);

    const animations = [];
    for (let i = 0; i < COIN_COUNT; i++) {
      // random spread
      const dir = Math.random() * (Math.PI * 2);
      const dist = 40 + Math.random() * 55; // how far from gift
      const dx = Math.cos(dir) * dist;
      const dy = -Math.abs(Math.sin(dir)) * (dist + 20); // mostly upwards

      coinTx[i].setValue(0);
      coinTy[i].setValue(0);
      coinOp[i].setValue(0);
      coinSc[i].setValue(0.6);
      coinRt[i].setValue(0);

      animations.push(
        Animated.parallel([
          Animated.timing(coinOp[i], { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(coinSc[i], { toValue: 1, useNativeDriver: true, friction: 5 }),
          Animated.timing(coinTx[i], {
            toValue: dx,
            duration: 900 + Math.random() * 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(coinTy[i], {
              toValue: dy,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(coinTy[i], {
              toValue: dy * 0.5,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(coinRt[i], {
            toValue: 1,
            duration: 900 + Math.random() * 600,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );

      // fade out at the end
      animations.push(
        Animated.timing(coinOp[i], { toValue: 0, delay: 700, duration: 500, useNativeDriver: true })
      );
    }

    Animated.parallel(animations).start(() => setCoinsOn(false));
  };

  useEffect(() => {
    let interval;
    startBgSpin();
    startHalos();

    const loop = () => {
      setShowWheel(true);
      startSpin();
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        setShowWheel(false);
        // trigger coin burst right when gift shows
        burstCoins();

        fadeAnim.setValue(0);
        scaleAnim.setValue(0.85);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }, 4000);
    };

    loop();
    interval = setInterval(loop, 5000);
    return () => clearInterval(interval);
  }, []);

  const rotation = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bgRotation = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // halo transforms
  const haloScale1 = halo1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const haloScale2 = halo2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const haloScale3 = halo3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const haloOp1    = halo1.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0.55] });
  const haloOp2    = halo2.interpolate({ inputRange: [0, 1], outputRange: [0.20, 0.40] });
  const haloOp3    = halo3.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.30] });

  const RAYS = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 30), []);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {/* FAT pulsing halos (make it pop in the dashboard) */}
      <Animated.View style={[styles.halo, { width: HALO1, height: HALO1, borderRadius: HALO1/2, opacity: haloOp1, transform: [{ scale: haloScale1 }] }]}>
        <LinearGradient
          colors={[GOLD.glow, 'rgba(255,216,120,0)']}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={styles.haloFill}
        />
      </Animated.View>

      <Animated.View style={[styles.halo, { width: HALO2, height: HALO2, borderRadius: HALO2/2, opacity: haloOp2, transform: [{ scale: haloScale2 }] }]}>
        <LinearGradient
          colors={[GOLD.glow2, 'rgba(255,216,120,0)']}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.7, y: 0.7 }}
          style={styles.haloFill}
        />
      </Animated.View>

      <Animated.View style={[styles.halo, { width: HALO3, height: HALO3, borderRadius: HALO3/2, opacity: haloOp3, transform: [{ scale: haloScale3 }] }]}>
        <LinearGradient
          colors={['rgba(255,216,120,0.18)', 'rgba(255,216,120,0)']}
          start={{ x: 0.4, y: 0.4 }}
          end={{ x: 0.6, y: 0.6 }}
          style={styles.haloFill}
        />
      </Animated.View>

      {/* Spinning golden disc with rays */}
      <Animated.View pointerEvents="none" style={[styles.bg, { width: BG, height: BG, borderRadius: BG/2, transform: [{ rotate: bgRotation }] }]}>
        <LinearGradient colors={[GOLD.dark, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bgFill} />
        {RAYS.map((deg) => (
          <View
            key={deg}
            style={[styles.ray, { height: BG, left: BG/2 - 4, transform: [{ rotate: `${deg}deg` }] }]}
          />
        ))}
      </Animated.View>

      {/* Pressable button */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient colors={[GOLD.mid, GOLD.light]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, { width: SIZE, height: SIZE }]}>
          <Animated.View style={{ transform: [{ rotate: showWheel ? rotation : '0deg' }, { scale: scaleAnim }], opacity: fadeAnim }}>
            <Image source={showWheel ? wheelImage : giftImage} style={{ width: 50, height: 50 }} resizeMode="contain" />
          </Animated.View>

          {/* Coin burst layer (positioned on top of the gift) */}
          {coinsOn &&
            [...Array(COIN_COUNT)].map((_, i) => {
              const rotateZ = coinRt[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
              return (
                <Animated.Image
                  key={i}
                  source={coinImage}
                  style={[
                    styles.coin,
                    {
                      opacity: coinOp[i],
                      transform: [
                        { translateX: coinTx[i] },
                        { translateY: coinTy[i] },
                        { scale: coinSc[i] },
                        { rotate: rotateZ },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              );
            })}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 26,
    bottom: 100,
    zIndex: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // halos
  halo: {
    position: 'absolute',
    zIndex: -3,
  },
  haloFill: {
    flex: 1,
    borderRadius: 999,
  },

  // spinning background disc
  bg: {
    position: 'absolute',
    zIndex: -2,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  bgFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  ray: {
    position: 'absolute',
    top: 0,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 235, 170, 0.24)',
  },

  // button
  btn: {
    borderRadius: 999,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',

    // warm, stronger shadow to stand out on light dashboards
    shadowColor: '#FFD579',
    shadowOpacity: 0.65,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    ...Platform.select({ android: { elevation: 16 } }),

    borderWidth: 1,
    borderColor: 'rgba(255, 245, 200, 0.28)',
  },

  // coins
  coin: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: 22,   // start roughly from center of gift image
    left: 22,
  },
});
