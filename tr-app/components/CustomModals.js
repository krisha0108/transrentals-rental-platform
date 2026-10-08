import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Modal from './SafeModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';

// ========================================
// LOGIN SUCCESS MODAL
// ========================================
export const LoginSuccessModal = ({ visible, onClose, userName = 'User' }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      checkmarkAnim.setValue(0);
      confettiAnim.setValue(0);

      // Animate modal appearance
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.elastic(1.5),
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.successModalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Confetti particles */}
          <Animated.View
            style={[
              styles.confettiContainer,
              { opacity: confettiAnim }
            ]}
          >
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confettiParticle,
                  {
                    backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB', '#32CD32'][i % 6],
                    top: `${(i % 4) * 25}%`,
                    left: `${(i % 5) * 20}%`,
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Success Icon */}
          <Animated.View
            style={[
              styles.successIconCircle,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[GREEN, '#07A55E']}
              style={styles.successGradient}
            >
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Title & Message */}
          <Text style={styles.successTitle}>Welcome Back!</Text>
          <Text style={styles.successMessage}>
            Hi {userName}, you've successfully logged in
          </Text>

          {/* Success Badges */}
          <View style={styles.successBadges}>
            <View style={styles.successBadge}>
              <Ionicons name="shield-checkmark" size={18} color={GREEN} />
              <Text style={styles.successBadgeText}>Secure</Text>
            </View>
            <View style={styles.successBadge}>
              <Ionicons name="flash" size={18} color="#FFB800" />
              <Text style={styles.successBadgeText}>Fast</Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.successButton}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[GREEN, '#07A55E']}
              style={styles.successButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.successButtonText}>Continue to Dashboard</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ========================================
// LOCATION PERMISSION MODAL
// ========================================
export const LocationPermissionModal = ({ visible, onAllow, onDeny }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(400);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for location icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDeny}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.locationModalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Map Background Pattern */}
          <View style={styles.mapPattern}>
            <View style={styles.mapGrid} />
            <View style={[styles.mapGrid, { top: 20 }]} />
            <View style={[styles.mapGrid, { top: 40 }]} />
          </View>

          {/* Location Icon with Pulse */}
          <View style={styles.locationIconContainer}>
            <Animated.View
              style={[
                styles.locationPulseOuter,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.3, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.locationPulseMiddle,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.5, 0.2],
                  }),
                },
              ]}
            />
            <View style={styles.locationIconCircle}>
              <LinearGradient
                colors={[GREEN, '#07A55E']}
                style={styles.locationGradient}
              >
                <Ionicons name="location" size={50} color="#fff" />
              </LinearGradient>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.locationTitle}>Enable Location</Text>
          <Text style={styles.locationDescription}>
            We need access to your location to show you nearby vendors and provide better service recommendations
          </Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="navigate" size={16} color={GREEN} />
              </View>
              <Text style={styles.featureText}>Find nearby vendors</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="time" size={16} color={GREEN} />
              </View>
              <Text style={styles.featureText}>Get accurate ETAs</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="trending-up" size={16} color={GREEN} />
              </View>
              <Text style={styles.featureText}>Better recommendations</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={styles.allowButton}
              onPress={onAllow}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[GREEN, '#07A55E']}
                style={styles.allowButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.allowButtonText}>Allow Location</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.denyButton}
              onPress={onDeny}
              activeOpacity={0.8}
            >
              <Text style={styles.denyButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
            <Text style={styles.privacyNoteText}>
              Your privacy is protected. We only use location when the app is active.
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ========================================
// EXIT CONFIRMATION MODAL
// ========================================
export const ExitConfirmationModal = ({ visible, onCancel, onExit }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconShakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Shake animation for warning icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconShakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(iconShakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(iconShakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(iconShakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.exitModalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Warning Icon with Shake */}
          <Animated.View
            style={[
              styles.exitIconContainer,
              {
                transform: [{ rotate: iconShakeAnim.interpolate({
                  inputRange: [-10, 10],
                  outputRange: ['-3deg', '3deg'],
                })}],
              },
            ]}
          >
            <View style={styles.exitIconCircle}>
              <LinearGradient
                colors={['#FF6B6B', '#EE5A52']}
                style={styles.exitGradient}
              >
                <Ionicons name="exit-outline" size={60} color="#fff" />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Title & Message */}
          <Text style={styles.exitTitle}>Exit App?</Text>
          <Text style={styles.exitMessage}>
            Are you sure you want to close the app?
          </Text>

          {/* Info Note */}
          <View style={styles.exitNote}>
            <Ionicons name="information-circle" size={18} color="#64748B" />
            <Text style={styles.exitNoteText}>
              Your session and data will be saved
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.exitButtons}>
            <TouchableOpacity
              style={styles.exitCancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={GREEN} />
              <Text style={styles.exitCancelButtonText}>Stay Here</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitConfirmButton}
              onPress={onExit}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF6B6B', '#EE5A52']}
                style={styles.exitConfirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.exitConfirmButtonText}>Exit App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // ===== LOGIN SUCCESS MODAL STYLES =====
  successModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: width - 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  successIconCircle: {
    marginBottom: 20,
  },
  successGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successBadges: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  successButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ===== LOCATION PERMISSION MODAL STYLES =====
  locationModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  mapPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: 'hidden',
    opacity: 0.05,
  },
  mapGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GREEN,
  },
  locationIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  locationPulseOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: GREEN,
  },
  locationPulseMiddle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GREEN,
  },
  locationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  locationGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  locationButtons: {
    gap: 12,
    marginBottom: 16,
  },
  allowButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  allowButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  denyButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  denyButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // ===== EXIT CONFIRMATION MODAL STYLES =====
  exitModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  exitIconContainer: {
    marginBottom: 20,
  },
  exitIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  exitGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  exitMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  exitNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exitNoteText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  exitButtons: {
    width: '100%',
    gap: 12,
  },
  exitCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GREEN,
  },
  exitCancelButtonText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '700',
  },
  exitConfirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exitConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  exitConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
