import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Alert, ActivityIndicator,Image
} from 'react-native';
import Modal from '../../components/SafeModal';
import Svg, { Path, Image as SvgImage, Defs, ClipPath } from 'react-native-svg';
import api from '../api';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
const WHEEL_SIZE = 350;
const CENTER = WHEEL_SIZE / 2;
const R = CENTER;
const SLICE_ANGLE = 45; // 360 / 8
const CALIBRATION_DEG =  -3;  // tweak ±1..±6 until the stop is visually perfect
const INNER_MARGIN_DEG = 2;   // keeps the stop away from slice borders

// Fixed visual order (clockwise from the TOP / pointer)
const SEGMENTS = [
  { key: 'better_luck',   label: 'Better Luck', start:   0, end:  45, landable: true  },
  { key: 'coin_1',        label: '1 Backr',     start:  45, end:  90, landable: true  },
  { key: 'disc_10',       label: '10% OFF',     start:  90, end: 135, landable: false },
  { key: 'coin_5',        label: '5 Backr',     start: 135, end: 180, landable: true  },
  { key: 'disc_50',       label: '50% OFF',     start: 180, end: 225, landable: false },
  { key: 'coin_10',       label: '10 Backr',    start: 225, end: 270, landable: true  },
  { key: 'disc_20',       label: '20% OFF',     start: 270, end: 315, landable: false },
  { key: 'free_booking',  label: 'Free Booking',start: 315, end: 360, landable: false },
];

// Use ONE full wheel image (easiest) OR set per-slice images below.
// The clip paths make each wedge exact.
const WHEEL_IMAGE = require('../../assets/spinner-win.png');

// If you have per-slice images, uncomment and use these instead of WHEEL_IMAGE:
// const SLICE_IMAGES = [
//   require('../../assets/slices/better.png'),
//   require('../../assets/slices/1backr.png'),
//   require('../../assets/slices/10off.png'),
//   require('../../assets/slices/5backr.png'),
//   require('../../assets/slices/50off.png'),
//   require('../../assets/slices/10backr.png'),
//   require('../../assets/slices/20off.png'),
//   require('../../assets/slices/free.png'),
// ];

const deg2rad = d => (Math.PI * d) / 180;
const normalize = d => ((d % 360) + 360) % 360;

// build 0° at top, clockwise wedge
function wedgePath(cx, cy, r, aDeg, bDeg) {
  const a = deg2rad(aDeg - 90);
  const b = deg2rad(bDeg - 90);
  const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
  const x2 = cx + r * Math.cos(b), y2 = cy + r * Math.sin(b);
  const largeArc = (bDeg - aDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/** ---------- Result Modal ---------- */
function ResultModal({
 visible,
  type,    // 'win' | 'lose'
  value,   // number | null
  label,   // e.g., "1 Backr"
  onClose,
}) {
  const isWin = type === 'win';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.resultBackdrop}>
        <LinearGradient
          colors={isWin ? ['#0ea5e9', '#22c55e'] : ['#64748b', '#0f172a']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          {isWin ? (
            <>
              {/* Confetti burst */}
              <ConfettiCannon
                count={120}
                fallSpeed={2400}
                fadeOut
                origin={{ x: 0, y: 0 }}
              />
              <Text style={styles.resultTitle}>Congratulations! 🎉</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 }}>
                     <Image source={require('../../assets/coin-front.png')} style={{width: 30 , height: 30, marginTop: 8 }}/>
 <Text style={styles.resultBig}>
                {value ? `${value} Backr` : label || 'You Won!'}
              </Text>
  
              </View>
             
             
              <View>
 <Text style={styles.resultSub}>Added to your wallet.</Text>
  
              </View>
             
              <TouchableOpacity onPress={onClose} style={[styles.resultBtn, { backgroundColor: '#0b8f4a' }]}>
                <Text style={styles.resultBtnText}>Awesome</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.resultTitle}>Maybe next time 😔</Text>
              <Text style={styles.resultBig}>No Backr earned</Text>
              <Text style={styles.resultSub}>Spin again and try your luck!</Text>
              <TouchableOpacity onPress={onClose} style={[styles.resultBtn, { backgroundColor: '#6b7e99ff' }]}>
                <Text style={styles.resultBtnText}>Got it</Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}
export default function SpinAndWinModal({ visible, onClose, customerId }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [canSpin, setCanSpin] = useState(false);
  const timerRef = useRef(null);
const spinKeyFor = (id) => `lastSpinTime:${String(id)}`;
  const rotation = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
 // result modal state
  const [resultVisible, setResultVisible] = useState(false);
 const [resultType, setResultType] = useState('win');            // 'win' | 'lose'
 const [resultValue, setResultValue] = useState(null);           // number | null
 const [resultLabel, setResultLabel] = useState(undefined); 
  // reset to 0 each time the modal opens (so every spin looks fresh)
  useEffect(() => {
    if (!visible) return;
console.log('SpinAndWinModal mounted with customerId:', customerId);
  // Don’t run until we definitely have an ID
  {console.log('render -> loading:', loading, 'canSpin:', canSpin, 'timeLeft:', timeLeft)}
  if (!customerId) {
   setLoading(true);
    setCanSpin(false);
    setTimeLeft('Loading...');
    return;
  }
  if (visible) {
    rotation.stopAnimation();
    rotation.setValue(0);
    currentDeg.current = 0;

    setResultVisible(false);
    setResultValue(null);
    setResultLabel(undefined);
setLoading(true);
checkSpinAvailability().finally(() => setLoading(false));

    // ✨ also re-check availability on open
    // checkSpinAvailability();
  } else {
    // ✨ when hiding modal, kill any running timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
}, [visible, customerId]);


  const checkSpinAvailability = async () => {
    if (!customerId) return;
  try {
    const key = spinKeyFor(String(customerId)); 
    const lastSpinTime = await AsyncStorage.getItem(key);
    console.log('lastSpinTime=', lastSpinTime, typeof lastSpinTime);
console.log('customerId=', customerId, typeof customerId);
console.log('spin key=', spinKeyFor(String(customerId)));

    if (lastSpinTime) {
      const diff = Date.now() - Number(lastSpinTime);
      const remaining = (24 * 60 * 60 * 1000) - diff;

      if (remaining > 0) {
        setCanSpin(false);
        startCountdown(remaining);
      } else {
        setCanSpin(true);
        setTimeLeft(null);
      }
    } else {
      setCanSpin(true);
      setTimeLeft(null);
    }
//     setCanSpin(true);
// setTimeLeft(null);
  } catch (e) {
    console.log('Error checking spin availability', e);
    setCanSpin(true);
    setTimeLeft(null);
  }
};

  const startCountdown = (ms) => {
  // ✨ ensure only one timer lives at a time
  if (timerRef.current) clearInterval(timerRef.current);

  updateTime(ms);
  timerRef.current = setInterval(() => {
    ms -= 1000;
    if (ms <= 0) {
      clearInterval(timerRef.current);
      timerRef.current = null; // <— keep ref clean
      setCanSpin(true);
      setTimeLeft(null);
    } else {
      updateTime(ms);
    }
  }, 1000);
};

  const updateTime = (ms) => {
    const hours = String(Math.floor(ms / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((ms % (1000 * 60)) / 1000)).padStart(2, '0');
    setTimeLeft(`${hours}:${minutes}:${seconds}`);
  };
  // Spin so that the CENTER of the segment sits under the pointer (top)
  const spinToSegmentIndex = (i) => {
  // 1) choose a safe target angle inside the slice (not on borders)
  const start = i * SLICE_ANGLE + INNER_MARGIN_DEG;
  const end   = (i + 1) * SLICE_ANGLE - INNER_MARGIN_DEG;

  // pick somewhere inside (use center or a tiny random point)
  // const artAngle = (start + end) / 2;         // deterministic center
  const artAngle = start + Math.random() * (end - start); // slight randomness inside slice

  // 2) apply global calibration so the pointer tip = our 0°
  const artAngleAdj = artAngle + CALIBRATION_DEG;

  // 3) compute the wheel angle needed to put that art angle under the fixed pointer (top)
  const neededMod = normalize(360 - artAngleAdj);
  const curMod    = normalize(currentDeg.current);
  const delta     = normalize(neededMod - curMod);

  const extraTurns = 6 * 360; // drama
  const finalDeg   = currentDeg.current + extraTurns + delta;

  rotation.stopAnimation();
  rotation.setValue(currentDeg.current);

  return new Promise((resolve) => {
    Animated.timing(rotation, {
      toValue: finalDeg,
      duration: 6000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      currentDeg.current = normalize(finalDeg);
      resolve();
    });
  });
};

  const handleSpin = async () => {
  if (!canSpin || spinning || !customerId) return;
  setCanSpin(false);
  setSpinning(true);

  const key = spinKeyFor(String(customerId));

  // Lock immediately (per-user)
  await AsyncStorage.setItem(key, String(Date.now()));
  startCountdown(24 * 60 * 60 * 1000); // optimistic; will be corrected by checkSpinAvailability()

  try {
    const res = await api.post('/spin/start', { customer_id: customerId });
    const { key: prizeKey, index, value, label } = res.data;

    const targetIndex = (typeof index === 'number')
      ? index
      : Math.max(0, SEGMENTS.findIndex(s => s.key === prizeKey));

    await spinToSegmentIndex(targetIndex);

    if (!value) {
      setResultType('lose');
      setResultValue(null);
      setResultLabel('Better Luck');
      setResultVisible(true);
    } else {
      setPosting(true);
      await api.post('/spin/result', { 
  customer_id: customerId, 
  prize: value ?? 0 // your backend expects integer prize
});
      await api.post('/spin/confirm', { customer_id: customerId, key: prizeKey, index: targetIndex });
      setResultType('win');
      setResultValue(value);
      setResultLabel(label || `${value} Backr`);
      setResultVisible(true);
    }

    await checkSpinAvailability(); // recompute true remaining after spin
  } catch (e) {
    // rollback lock on failure so user isn’t stuck
    await AsyncStorage.removeItem(key);
    setResultType('lose');
    setResultValue(null);
    setResultLabel('Error. Please try again.');
    setResultVisible(true);
    setCanSpin(true);
    setTimeLeft(null);
  } finally {
    setPosting(false);
    setSpinning(false);
  }
};



  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend'
  });

  const handleResultClose = () => {
    setResultVisible(false);
    onClose && onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* <Text style={styles.title}>Spin & Win</Text> */}
          <Image source={require('../../assets/spin-win-ribbon.png')} style={{width: 240, height:70}}/>
          <Text style={styles.sub}>Try your luck and stand a chance to win exciting prizes!</Text>

          <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                {/* {SEGMENTS.map((seg, i) => (
                  <Path
                    key={`bg${i}`}
                    d={wedgePath(CENTER, CENTER, R, seg.start, seg.end)}
                    fill={seg.bgColor || ['#FDE68A', '#86EFAC', '#93C5FD', '#FCA5A5', '#C4B5FD', '#FBCFE8', '#A7F3D0', '#FDBA74'][i % 8]}
                  />
                ))} */}

                <Defs>
                  {SEGMENTS.map((seg, i) => (
                    <ClipPath id={`clip${i}`} key={`c${i}`}>
                      <Path d={wedgePath(CENTER, CENTER, R, seg.start, seg.end)} />
                    </ClipPath>
                  ))}
                </Defs>

                {/* Option 1: use one full wheel image repeatedly, each clipped to its wedge */}
                {SEGMENTS.map((_, i) => (
                  <SvgImage
                    key={`img${i}`}
                    href={WHEEL_IMAGE}
                    x={0}
                    y={0}
                    width={WHEEL_SIZE}
                    height={WHEEL_SIZE}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip${i})`}
                    transform={`rotate(24, ${WHEEL_SIZE / 2}, ${WHEEL_SIZE / 2})`}
                  />
                ))}

                {/* Option 2: if you have per-slice images, swap the block above with:
                {SLICE_IMAGES.map((src, i) => (
                  <SvgImage key={`img${i}`} href={src} x={0} y={0} width={WHEEL_SIZE} height={WHEEL_SIZE}
                    preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip${i})`} />
                ))} */}
              </Svg>
            </Animated.View>

            {/* fixed pointer at top */}
            <View style={styles.pointer} />
          </View>

          {/* <TouchableOpacity
            style={[styles.spinBtn, (spinning || posting) && { opacity: 0.7 }]}
            disabled={spinning || posting}
            onPress={handleSpin}
          >
            {spinning || posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.spinText}>Spin Now</Text>}
          </TouchableOpacity> */}
        {loading ? (
  <Text style={[styles.spinBtn, { paddingVertical: 12, textAlign: 'center', color: '#fff', backgroundColor: '#9c9fa3ff' }]}>
    {timeLeft || 'Loading...'}
  </Text>
) : canSpin ? (
  <TouchableOpacity
    style={[styles.spinBtn, (spinning || posting) && { opacity: 0.7 }]}
    disabled={spinning || posting}
    onPress={handleSpin}
  >
    {spinning || posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.spinText}>Spin Now</Text>}
  </TouchableOpacity>
) : (
  <Text style={[styles.spinBtn, { paddingVertical: 12, textAlign: 'center', color: '#fff', backgroundColor: '#9c9fa3ff' }]}>
    Next spin in {timeLeft || 'Loading...'}
  </Text>
)}


          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
            {/* Result sheet */}
      <ResultModal
        visible={resultVisible}
        type={resultType}
        value={resultValue}
        label={resultLabel}
        onClose={handleResultClose}
      />
    </Modal>
  );
}

const POINTER_SIZE = 26;
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#475569', marginTop: 4, marginBottom: 12, textAlign: 'center' },
  pointer: {
    position: 'absolute',
    top: -POINTER_SIZE + 45,
    left: '50%',
    marginLeft: -POINTER_SIZE / 2,
    transform: [{ rotate: '180deg' }],
    width: 0, height: 0,
    borderLeftWidth: POINTER_SIZE / 2,
    borderRightWidth: POINTER_SIZE / 2,
    borderBottomWidth: POINTER_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#27d8bdff',
    zIndex: 1
  },
  spinBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8, width: '60%' },
  spinText: { color: '#fff', fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 6 },
  closeText: { color: '#334155', fontWeight: '600' },



  
  // Result modal styles
  resultBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  resultCard: {
    width: '92%',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden'
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  resultBig: { fontSize: 34, fontWeight: '900', color: '#ffffff', marginTop: 8, textAlign: 'center' },
  resultSub: { fontSize: 14, color: '#e2e8f0', marginTop: 6, marginBottom: 16, textAlign: 'center' },
  resultBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12 },
  resultBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

