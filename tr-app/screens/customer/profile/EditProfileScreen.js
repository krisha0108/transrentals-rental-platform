import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api, { IMAGE_BASE_URL } from '../../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, BG, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';

const CARD_BORDER = '#F0F2F5';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 3 },
});

/* ── Input Field Component ───────────────────────── */
const FormField = ({ label, icon, children }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputCard}>
      <View style={styles.inputIconWrap}>
        <Icon name={icon} size={18} color={TEAL} />
      </View>
      {children}
    </View>
  </View>
);

/* ── Main Screen ───────────────────────── */
const EditProfileScreen = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success'); // 'success' | 'error'
  const [alertMessage, setAlertMessage] = useState('');
  const alertScale = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();

  const showCustomAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
    alertScale.setValue(0);
    Animated.spring(alertScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  };

  const hideCustomAlert = () => {
    Animated.timing(alertScale, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setAlertVisible(false);
    });
  };

  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('light');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  useEffect(() => {
    const fetchCustomerData = async () => {
      const customerData = await AsyncStorage.getItem('customer');
      if (customerData) {
        const parsed = JSON.parse(customerData);
        setCustomer(parsed);
        setName(parsed.name);
        setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.image) {
          setProfileImage(`${IMAGE_BASE_URL}/profile_images/${parsed.image}`);
        }
      }
      setLoading(false);
    };
    fetchCustomerData();
  }, []);

  const handleRemoveImage = () => {
    setProfileImage(null);
    setRemoveImage(true);
  };

  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append('customer_id', customer.id);

    if (name !== customer.name) formData.append('name', name);
    if (email !== customer.email) formData.append('email', email);
    if (phone) formData.append('phone', phone);

    if (removeImage) {
      formData.append('remove_image', '1');
    } else if (profileImage && !profileImage.startsWith('http')) {
      const localUri = profileImage;
      const filename = localUri.split('/').pop();
      formData.append('image', { uri: localUri, type: 'image/jpeg', name: filename });
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showCustomAlert('error', 'Authorization token not found. Please log in again.');
        return;
      }

      const response = await api.post('/customer/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });

      const result = response.data;
      if (result.success) {
        showCustomAlert('success', result.message || 'Profile updated successfully!');
        const updatedCustomer = {
          ...customer, name, email,
          phone: result.customers.phone,
          image: result.customers.image,
        };
        await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));
        setCustomer(updatedCustomer);
        setName(updatedCustomer.name);
        setEmail(updatedCustomer.email);
        setPhone(updatedCustomer.phone);
        setRemoveImage(false);
        setProfileImage(
          updatedCustomer.image
            ? `${IMAGE_BASE_URL}/profile_images/${updatedCustomer.image}`
            : null
        );
      } else {
        showCustomAlert('error', 'Failed to update profile');
      }
    } catch (error) {
      console.log(error);
      showCustomAlert('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (!response.didCancel && !response.errorCode) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  if (loading && !customer) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Gradient Header + Avatar ── */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        style={styles.headerGrad}
      >
        {/* Decorative */}
        <View style={[styles.decoCircle, { top: -30, right: -20, width: 100, height: 100 }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: 60, height: 60 }]} pointerEvents="none" />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[TEAL_LIGHT, '#A7F3D0']} style={styles.avatarPlaceholder}>
                <Icon name="person" size={36} color={TEAL_MID} />
              </LinearGradient>
            )}
            <TouchableOpacity style={styles.cameraBadge} onPress={handleImagePick}>
              <Icon name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleImagePick}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          {profileImage && (
            <TouchableOpacity onPress={handleRemoveImage} style={styles.removePhotoBtn}>
              <Icon name="trash-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Form ── */}
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
          <View style={styles.formCard}>
            {/* Name */}
            <FormField label="Full Name" icon="person-outline">
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={TEXT_MUTED}
              />
            </FormField>

            {/* Email */}
            <FormField label="Email Address" icon="mail-outline">
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={TEXT_MUTED}
              />
            </FormField>

            {/* Phone */}
            <FormField label="Phone Number" icon="call-outline">
              <TextInput
                style={styles.input}
                placeholder="Enter your phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={TEXT_MUTED}
              />
            </FormField>

          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#9CA3AF'] : [TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGrad}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: hp('4%') }} />
      </KeyboardAwareScrollView>

      {/* Custom Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={hideCustomAlert}>
        <View style={styles.alertOverlay}>
          <Animated.View style={[styles.alertCard, { transform: [{ scale: alertScale }] }]}>
            <View style={[styles.alertIconCircle, { backgroundColor: alertType === 'success' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Icon
                name={alertType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={wp('12%')}
                color={alertType === 'success' ? '#059669' : '#DC2626'}
              />
            </View>
            <Text style={styles.alertTitle}>
              {alertType === 'success' ? 'Success!' : 'Oops!'}
            </Text>
            <Text style={styles.alertMsg}>{alertMessage}</Text>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: alertType === 'success' ? TEAL : '#DC2626' }]}
              onPress={hideCustomAlert}
              activeOpacity={0.85}
            >
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ── Styles ───────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TEAL_DEEP,
  },
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: wp('4%'),
  },

  /* Header */
  headerGrad: {
    paddingHorizontal: wp('4%'),
    paddingTop: Platform.OS === 'android' ? 8 : 8,
    paddingBottom: wp('5%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: wp('4%'),
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
  },
  avatarRing: {
    position: 'relative',
    padding: 4,
    borderRadius: wp('13%'),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  avatar: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
  },
  avatarPlaceholder: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: TEAL_DEEP,
  },
  changePhotoText: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  removePhotoText: {
    fontSize: wp('2.8%'),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  /* Form */
  formCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: wp('5%'),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SHADOW_SM,
  },
  fieldGroup: {
    marginBottom: wp('4%'),
  },
  fieldLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: wp('3%'),
    minHeight: 50,
  },
  inputIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  /* Save Button */
  saveBtn: {
    marginTop: wp('5%'),
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: TEAL, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp('4%'),
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Custom Alert Modal
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: wp('8%'),
    paddingBottom: wp('6%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 15 },
    }),
  },
  alertIconCircle: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: wp('4%'),
  },
  alertTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: wp('2%'),
  },
  alertMsg: {
    fontSize: wp('3.5%'),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: wp('6%'),
  },
  alertBtn: {
    width: '100%',
    paddingVertical: wp('3.5%'),
    borderRadius: 14,
    alignItems: 'center',
  },
  alertBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '700',
  },
});

export default EditProfileScreen;
