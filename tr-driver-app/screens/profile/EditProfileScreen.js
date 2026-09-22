import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import { updateDriverProfile, uploadDriverProfilePhoto, getBaseURL } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';

const C = {
  primary: '#16A34A', dark: '#043927', mid: '#065F46', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', blue: '#3B82F6', purple: '#8B5CF6', warn: '#F59E0B',
};

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, icon, value, onChangeText, required, half, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, half && styles.fieldHalf]}>
      <Text style={styles.fieldLabel}>
        {label}{required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
      <View style={[styles.fieldBox, focused && styles.fieldBoxFocus]}>
        {icon && (
          <Ionicons
            name={icon}
            size={15}
            color={focused ? C.primary : C.sub}
            style={styles.fieldIcon}
          />
        )}
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={C.sub}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────
function Block({ icon, iconColor, iconBg, title, children }) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <View style={[styles.blockIconWrap, { backgroundColor: iconBg || '#F0FDF4' }]}>
          <Ionicons name={icon} size={16} color={iconColor || C.primary} />
        </View>
        <Text style={styles.blockTitle}>{title}</Text>
      </View>
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditProfileScreen({ navigation }) {
  const { driver, updateDriver } = useAuth();
  const [saving, setSaving]               = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localPhoto, setLocalPhoto]       = useState(null);
  const [baseURL, setBaseURL]             = useState('');

  useEffect(() => {
    getBaseURL().then(url => setBaseURL(url));
  }, []);

  const [name,             setName]             = useState(driver?.name              || '');
  const [phone,            setPhone]            = useState(driver?.phone             || '');
  const [address,          setAddress]          = useState(driver?.address           || '');
  const [city,             setCity]             = useState(driver?.city              || '');
  const [stateName,        setStateName]        = useState(driver?.state             || '');
  const [aadhar,           setAadhar]           = useState(driver?.aadharNumber      || '');
  const [pan,              setPan]              = useState(driver?.panNumber         || '');
  const [licenseNo,        setLicenseNo]        = useState(driver?.licenseNumber     || '');
  const [bankName,         setBankName]         = useState(driver?.bankName          || '');
  const [accountHolder,    setAccountHolder]    = useState(driver?.accountHolderName || '');
  const [accountNo,        setAccountNo]        = useState(driver?.accountNumber     || '');
  const [ifsc,             setIfsc]             = useState(driver?.ifscCode          || '');
  const [emergencyContact, setEmergencyContact] = useState(driver?.emergencyContact  || '');
  const [emergencyPhone,   setEmergencyPhone]   = useState(driver?.emergencyPhone    || '');

  // ── Photo — open picker → crop → upload ──────────────────────────────────
  async function handlePickPhoto() {
    try {
      // 1. Open picker with built-in crop + circle overlay (Instagram-style)
      const image = await ImageCropPicker.openPicker({
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true,       // ← dark circle mask like Instagram
        compressImageQuality: 0.85,
        cropperToolbarTitle: 'Move and Scale',
        cropperStatusBarColor: '#043927',
        cropperToolbarColor: '#043927',
        cropperToolbarWidgetColor: '#ffffff',
        cropperActiveWidgetColor: '#16A34A',
        cropperCancelText: 'Cancel',
        cropperChooseText: 'Use Photo',
        includeBase64: false,
      });

      // 2. Show local preview immediately
      setLocalPhoto(image.path);

      // 3. Upload
      setPhotoUploading(true);
      const res = await uploadDriverProfilePhoto(
        image.path,
        `profile-${Date.now()}.jpg`,
        image.mime || 'image/jpeg',
      );

      if (res.data?.success) {
        updateDriver({ ...driver, profilePhoto: res.data.url });
      } else {
        throw new Error(res.data?.error || 'Upload failed');
      }
    } catch (err) {
      // User cancelled → no error
      if (err?.code === 'E_PICKER_CANCELLED') return;
      Alert.alert('Upload Failed', err?.response?.data?.error || err?.message || 'Could not upload photo. Please try again.');
      setLocalPhoto(null);
    } finally {
      setPhotoUploading(false);
    }
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Full name is required'); return; }
    setSaving(true);
    try {
      const res = await updateDriverProfile({
        name:              name.trim(),
        phone:             phone.trim()     || null,
        address:           address          || null,
        city:              city             || null,
        state:             stateName        || null,
        aadharNumber:      aadhar           || null,
        panNumber:         pan              || null,
        licenseNumber:     licenseNo        || null,
        bankName:          bankName         || null,
        accountHolderName: accountHolder    || null,
        accountNumber:     accountNo        || null,
        ifscCode:          ifsc             || null,
        emergencyContact:  emergencyContact || null,
        emergencyPhone:    emergencyPhone   || null,
      });
      if (res.data.success) {
        updateDriver(res.data.driver);
        Alert.alert('Saved!', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const initials = driver?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'DR';

  // Resolve photo URI — local preview > saved URL > null
  const savedPhotoUri = driver?.profilePhoto
    ? (driver.profilePhoto.startsWith('http')
        ? driver.profilePhoto
        : baseURL ? `${baseURL}${driver.profilePhoto}` : null)
    : null;
  const photoUri = localPhoto || savedPhotoUri;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.dark, C.mid, C.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSub}>Keep your info up to date</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )
          }
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Photo Picker ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoWrap}
              onPress={handlePickPhoto}
              activeOpacity={0.88}
              disabled={photoUploading}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImg} />
              ) : (
                <LinearGradient
                  colors={['#4ADE80', '#16A34A']}
                  style={styles.photoPlaceholder}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.photoInitials}>{initials}</Text>
                </LinearGradient>
              )}

              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                {photoUploading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={14} color="#fff" />
                }
              </View>
            </TouchableOpacity>

            <Text style={styles.photoLabel}>Profile Photo</Text>
            <Text style={styles.photoHint}>
              Tap to choose · Crop to a square · Preview in circle
            </Text>
          </View>

          {/* ── Personal Info ── */}
          <Block icon="person-outline" iconColor={C.primary} iconBg="#F0FDF4" title="Personal Info">
            <Field label="Full Name"     icon="person-outline"   value={name}      onChangeText={setName}      placeholder="Enter full name"      required />
            <Field label="Phone Number"  icon="call-outline"     value={phone}     onChangeText={setPhone}     placeholder="10-digit mobile"      keyboardType="phone-pad" maxLength={10} />
            <Field label="Address"       icon="home-outline"     value={address}   onChangeText={setAddress}   placeholder="Full address"         multiline numberOfLines={2} />
            <View style={styles.rowFields}>
              <Field label="City"  icon="location-outline" value={city}      onChangeText={setCity}      placeholder="City"  half />
              <Field label="State" icon="map-outline"      value={stateName} onChangeText={setStateName} placeholder="State" half />
            </View>
          </Block>

          {/* ── Documents ── */}
          <Block icon="document-text-outline" iconColor="#0369A1" iconBg="#F0F9FF" title="Documents & KYC">
            <Field label="Aadhar Number"  icon="id-card-outline" value={aadhar}   onChangeText={setAadhar}   placeholder="XXXXXXXXXXXX"    keyboardType="numeric" maxLength={12} />
            <Field label="PAN Number"     icon="card-outline"    value={pan}       onChangeText={setPan}       placeholder="ABCDE1234F"      autoCapitalize="characters" maxLength={10} />
            <Field label="License Number" icon="car-outline"     value={licenseNo} onChangeText={setLicenseNo} placeholder="MH0120231234567" autoCapitalize="characters" />
          </Block>

          {/* ── Bank Details ── */}
          <Block icon="card-outline" iconColor={C.purple} iconBg="#F5F3FF" title="Bank Details">
            <Field label="Bank Name"           icon="business-outline" value={bankName}      onChangeText={setBankName}      placeholder="e.g. State Bank of India" />
            <Field label="Account Holder Name" icon="person-outline"   value={accountHolder} onChangeText={setAccountHolder} placeholder="As per bank records" />
            <Field label="Account Number"      icon="keypad-outline"   value={accountNo}     onChangeText={setAccountNo}     placeholder="Account number" keyboardType="numeric" />
            <Field label="IFSC Code"           icon="code-outline"     value={ifsc}          onChangeText={setIfsc}          placeholder="e.g. SBIN0001234" autoCapitalize="characters" maxLength={11} />
          </Block>

          {/* ── Emergency Contact ── */}
          <Block icon="call-outline" iconColor={C.warn} iconBg="#FFFBEB" title="Emergency Contact">
            <Field label="Contact Name"  icon="person-outline" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Full name" />
            <Field label="Contact Phone" icon="call-outline"   value={emergencyPhone}   onChangeText={setEmergencyPhone}   placeholder="Mobile number" keyboardType="phone-pad" maxLength={10} />
          </Block>

          {/* ── Bottom Save ── */}
          <TouchableOpacity
            style={[styles.bottomSave, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.mid, C.primary]}
              style={styles.bottomSaveInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.bottomSaveText}>Save Profile</Text>
                  </>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PHOTO_SIZE = 88;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16, gap: 10 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  scroll: { padding: 14, gap: 12 },

  // Photo section
  photoSection:    { alignItems: 'center', paddingVertical: 4 },
  photoWrap:       { position: 'relative', marginBottom: 10 },
  photoImg:        { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2, borderWidth: 3, borderColor: '#fff' },
  photoPlaceholder:{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  photoInitials:   { fontSize: 28, fontWeight: '900', color: '#fff' },
  cameraBadge:     { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, borderWidth: 2.5, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  photoLabel:      { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  photoHint:       { fontSize: 11, color: C.sub },

  // Block
  block:        { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  blockHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  blockIconWrap:{ width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  blockTitle:   { fontSize: 13, fontWeight: '800', color: C.text },
  blockBody:    { padding: 12 },

  rowFields: { flexDirection: 'row', gap: 10 },

  // Field
  field:         { marginBottom: 10 },
  fieldHalf:     { flex: 1 },
  fieldLabel:    { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 5 },
  fieldBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 10, minHeight: 44 },
  fieldBoxFocus: { borderColor: C.primary, backgroundColor: '#F0FDF4' },
  fieldIcon:     { marginRight: 6 },
  fieldInput:    { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },

  // Bottom save
  bottomSave:      { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  bottomSaveInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  bottomSaveText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
});
