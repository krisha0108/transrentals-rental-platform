import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getSocialCategories, createSocialPost } from '../../api/socialApi';
import { uploadVendorImage, getFullImageURL } from '../../api/client';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const MAX_IMAGES = 4;

// getFullImageURL is async (resolves the base URL), so resolve into state.
const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function RemoteThumb({ url, style }) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    let alive = true;
    getFullImageURL(url).then((u) => { if (alive) setUri(u); });
    return () => { alive = false; };
  }, [url]);
  return <Image source={uri ? { uri } : undefined} style={style} />;
}

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex,
// mirroring the mapping convention used in AddStaffScreen.js / FuelTrackingScreen.js.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, muted: T.subText,
  violet: T.emerald600, violetL: T.tintEmerald,
  red: T.red, redL: T.redLight,
  amber: T.amber,
};

const MAX_CHARS = 1000;

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [images, setImages] = useState([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 350);
    return () => clearTimeout(t);
  }, []);

  const pickImages = async () => {
    const room = MAX_IMAGES - images.length;
    if (room <= 0) { Alert.alert('Limit reached', `Up to ${MAX_IMAGES} images.`); return; }
    let res;
    try {
      res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: room, quality: 0.8 });
    } catch (e) { return; }
    if (!res || res.didCancel || !res.assets?.length) return;
    setUploadingImg(true);
    try {
      const urls = [];
      for (const asset of res.assets.slice(0, room)) {
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Too large', 'Each image must be under 5 MB.');
          continue;
        }
        const out = await uploadVendorImage(
          { uri: asset.uri, name: asset.fileName, type: asset.type },
          'social',
        );
        if (out?.url) urls.push(out.url);
      }
      if (urls.length) setImages((prev) => [...prev, ...urls]);
    } catch (e) {
      console.log('[CreatePost] image upload error', e);
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
    } finally {
      setUploadingImg(false);
    }
  };
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getSocialCategories();
      setCategories(res?.data?.categories || res?.categories || []);
    } catch (e) {
      console.log('[CreatePost] categories error', e);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const isSOS = selectedCategory?.name?.toLowerCase() === 'sos';

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Required', 'Please write something for your post.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a category for your post.');
      return;
    }
    setSubmitting(true);
    try {
      await createSocialPost(content.trim(), selectedCategory.id, images);
      Alert.alert('Posted!', 'Your post has been published.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.log('[CreatePost] submit error', e);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(C.g900);
  }, []));

  if (initializing) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} translucent={false} />
        <LinearGradient colors={G.hero} style={styles.hero}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleBlock}>
                <Text style={styles.headerEyebrow}>COMPOSE</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>Create Post</Text>
              </View>
              <View style={[styles.submitBtn, styles.submitBtnDisabled]}>
                <Text style={styles.submitBtnText}>Post</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Bone w={70} h={13} style={{ marginBottom: 6 }} />
                <Bone w={140} h={10} />
              </View>
            </View>
            <View style={styles.categoryPicker}>
              <Bone w={130} h={14} />
              <Icon name="chevron-down" size={18} color={C.muted} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Bone w={150} h={13} style={{ marginBottom: 6 }} />
                <Bone w={170} h={10} />
              </View>
            </View>
            <View style={[styles.contentInputWrap, { justifyContent: 'flex-start', paddingTop: rs(12) }]}>
              <Bone w="90%" h={11} style={{ marginBottom: 8 }} />
              <Bone w="70%" h={11} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Bone w={60} h={13} style={{ marginBottom: 6 }} />
                <Bone w={110} h={10} />
              </View>
            </View>
            <View style={styles.imageRow}>
              <Bone w={rs(84)} h={rs(84)} r={rs(12)} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} translucent={false} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── HERO HEADER ── */}
        <LinearGradient colors={G.hero} style={styles.hero}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleBlock}>
                <Text style={styles.headerEyebrow}>COMPOSE</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>Create Post</Text>
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, (!content.trim() || !selectedCategory || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!content.trim() || !selectedCategory || submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitBtnText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Category picker */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]}>
                <Icon name="tag" size={16} color={C.violet} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardLabel}>Category <Text style={styles.required}>*</Text></Text>
                <Text style={styles.cardHint} numberOfLines={1}>Helps partners find your post</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.categoryPicker} onPress={() => setCatModalVisible(true)} activeOpacity={0.85}>
              {loadingCats ? (
                <Bone w={130} h={14} />
              ) : selectedCategory ? (
                <View style={styles.catSelected}>
                  <View style={[styles.catDot, { backgroundColor: isSOS ? C.red : C.violet }]} />
                  <Text style={[styles.catSelectedText, { color: isSOS ? C.red : C.violet }]}>
                    {isSOS ? '🚨 ' : ''}{selectedCategory.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.catPlaceholder}>Select a category...</Text>
              )}
              <Icon name="chevron-down" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* SOS warning */}
          {isSOS && (
            <View style={styles.sosWarning}>
              <View style={styles.sosIcon}>
                <Icon name="alert-triangle" size={16} color={C.red} />
              </View>
              <Text style={styles.sosWarningText}>
                SOS posts are urgent alerts visible to all vendors. Use only for genuine emergencies or urgent help requests.
              </Text>
            </View>
          )}

          {/* Content input */}
          <View style={[styles.card, isSOS && styles.contentCardSOS]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]}>
                <Icon name="edit-3" size={16} color={C.violet} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardLabel}>What's on your mind? <Text style={styles.required}>*</Text></Text>
                <Text style={styles.cardHint} numberOfLines={1}>Share news, ask for help, or connect</Text>
              </View>
            </View>
            <View style={[styles.contentInputWrap, isSOS && styles.contentInputWrapSOS]}>
              <TextInput
                style={styles.contentInput}
                multiline
                placeholder={isSOS ? 'Describe your emergency or urgent need...' : 'Share news, ask for help, or connect with fellow vendors...'}
                placeholderTextColor={C.muted}
                value={content}
                onChangeText={(t) => { if (t.length <= MAX_CHARS) setContent(t); }}
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.charCounter, content.length > MAX_CHARS * 0.9 && styles.charCounterWarning]}>
              {content.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Photos */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: C.violetL }]}>
                <Icon name="image" size={16} color={C.violet} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardLabel}>Photos</Text>
                <Text style={styles.cardHint} numberOfLines={1}>Optional · up to {MAX_IMAGES}</Text>
              </View>
              <View style={[styles.imgCountBadge, images.length >= MAX_IMAGES && styles.imgCountBadgeFull]}>
                <Text style={[styles.imgCountText, images.length >= MAX_IMAGES && styles.imgCountTextFull]}>
                  {images.length}/{MAX_IMAGES}
                </Text>
              </View>
            </View>
            <View style={styles.imageRow}>
              {images.map((url, i) => (
                <View key={i} style={styles.imageThumbWrap}>
                  <RemoteThumb url={url} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(i)}>
                    <Icon name="x" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.imageAdd} onPress={pickImages} disabled={uploadingImg}>
                  {uploadingImg
                    ? <ActivityIndicator size="small" color={C.violet} />
                    : <><Icon name="image" size={20} color={C.violet} /><Text style={styles.imageAddText}>Add</Text></>}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIcon}>
                <Icon name="info" size={14} color={C.violet} />
              </View>
              <Text style={styles.tipsTitle}>Posting tips</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Be specific and clear about what you need or offer</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Mention your city/location if relevant</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Use SOS only for genuine urgent situations</Text>
            </View>
          </View>

          <View style={{ height: rs(60) }} />
        </ScrollView>

        {/* Category picker Modal */}
        <Modal visible={catModalVisible} transparent animationType="slide" onRequestClose={() => setCatModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.catOverlay}>
            <TouchableOpacity style={styles.catBackdrop} activeOpacity={1} onPress={() => setCatModalVisible(false)} />
            <View style={styles.catSheet}>
              <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
              <View style={styles.catSheetHeader}>
                <Text style={styles.catSheetTitle}>Select Category</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCatModalVisible(false)}>
                  <Icon name="x" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.catSearchWrap}>
                <Icon name="search" size={16} color={C.muted} />
                <TextInput
                  style={styles.catSearchInput}
                  placeholder="Search categories..."
                  placeholderTextColor={C.muted}
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                  autoFocus
                />
                {categorySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCategorySearch('')}>
                    <Icon name="x-circle" size={16} color={C.muted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.catList} keyboardShouldPersistTaps="handled">
                {filteredCategories.length === 0 ? (
                  <Text style={styles.catEmpty}>No categories found</Text>
                ) : filteredCategories.map((cat) => {
                  const isActive = selectedCategory?.id === cat.id;
                  const isCatSOS = cat.name?.toLowerCase() === 'sos';
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catItem, isActive && styles.catItemActive]}
                      onPress={() => { setSelectedCategory(cat); setCatModalVisible(false); setCategorySearch(''); }}
                    >
                      <View style={[styles.catItemDot, { backgroundColor: isCatSOS ? C.redL : C.violetL }]}>
                        <Icon name={isCatSOS ? 'alert-circle' : 'tag'} size={14} color={isCatSOS ? C.red : C.violet} />
                      </View>
                      <Text style={[styles.catItemText, isActive && styles.catItemTextActive, isCatSOS && { color: C.red }]}>
                        {isCatSOS ? '🚨 ' : ''}{cat.name}
                      </Text>
                      {cat.description && (
                        <Text style={styles.catItemDesc} numberOfLines={1}>{cat.description}</Text>
                      )}
                      {isActive && <Icon name="check" size={16} color={C.violet} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: rs(40) }} />
              </ScrollView>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: rs(16), paddingTop: rs(14) },

  // Hero header
  hero: { borderBottomLeftRadius: rs(28), borderBottomRightRadius: rs(28), overflow: 'hidden' },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  heroSafe: { paddingHorizontal: rs(16), paddingTop: rs(8), paddingBottom: rs(14) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerEyebrow: {
    fontFamily: DISPLAY, fontSize: rs(9.5), fontWeight: 'bold', color: T.gold,
    letterSpacing: 1.4, textTransform: 'uppercase', includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: rs(19), fontWeight: 'bold', color: '#fff',
    letterSpacing: 0.2, marginTop: rs(2), includeFontPadding: false,
  },
  submitBtn: {
    backgroundColor: '#fff', paddingHorizontal: rs(16), paddingVertical: rs(9),
    borderRadius: rs(999), minWidth: rs(64), alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.25)' },
  submitBtnText: { fontFamily: DISPLAY, color: C.g700, fontWeight: 'bold', fontSize: rs(13) },

  // Section card
  card: {
    marginBottom: rs(14),
    backgroundColor: C.card, borderRadius: rs(18), borderWidth: 1, borderColor: C.border,
    padding: rs(16),
    ...cardShadow,
  },
  contentCardSOS: { borderColor: C.red },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(11), marginBottom: rs(13) },
  cardIcon: { width: rs(34), height: rs(34), borderRadius: rs(11), alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontFamily: DISPLAY, fontSize: rs(14.5), fontWeight: 'bold', color: C.text, includeFontPadding: false },
  cardHint: { fontFamily: DISPLAY, fontSize: rs(11.5), color: C.muted, fontWeight: '600', marginTop: rs(2), includeFontPadding: false },
  required: { color: C.red },

  // Category picker
  categoryPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: T.field, borderWidth: 1, borderColor: C.border,
    borderRadius: rs(12), paddingHorizontal: rs(14), paddingVertical: rs(13),
  },
  catSelected: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  catDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  catSelectedText: { fontFamily: DISPLAY, fontSize: rs(14.5), fontWeight: 'bold' },
  catPlaceholder: { fontFamily: DISPLAY, fontSize: rs(14.5), color: C.muted },

  // SOS warning
  sosWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: rs(10),
    backgroundColor: C.redL, marginBottom: rs(14),
    borderRadius: rs(14), padding: rs(13), borderWidth: 1, borderColor: '#F3C9C4',
  },
  sosIcon: { width: rs(28), height: rs(28), borderRadius: rs(9), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sosWarningText: { flex: 1, fontFamily: DISPLAY, fontSize: rs(12.5), color: C.red, lineHeight: rs(18), fontWeight: '600' },

  // Content input
  contentInputWrap: {
    backgroundColor: T.field, borderWidth: 1, borderColor: C.border,
    borderRadius: rs(12), padding: rs(14), minHeight: rs(150),
  },
  contentInputWrapSOS: { borderColor: C.red, borderWidth: 1.5 },
  contentInput: { fontFamily: DISPLAY, fontSize: rs(15), color: C.text, lineHeight: rs(22), minHeight: rs(120) },
  charCounter: { fontFamily: DISPLAY, textAlign: 'right', fontSize: rs(11), color: C.muted, marginTop: rs(8), fontWeight: '600' },
  charCounterWarning: { color: C.amber },

  // Photos
  imgCountBadge: { paddingHorizontal: rs(9), paddingVertical: rs(3), borderRadius: rs(999), backgroundColor: C.violetL },
  imgCountBadgeFull: { backgroundColor: C.violetL },
  imgCountText: { fontFamily: DISPLAY, fontSize: rs(10.5), fontWeight: 'bold', color: C.violet, includeFontPadding: false },
  imgCountTextFull: { color: C.g700 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
  imageThumbWrap: { width: rs(84), height: rs(84), borderRadius: rs(12), overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  imageThumb: { width: '100%', height: '100%' },
  imageRemove: { position: 'absolute', top: rs(4), right: rs(4), width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  imageAdd: { width: rs(84), height: rs(84), borderRadius: rs(12), borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: rs(3), backgroundColor: T.field },
  imageAddText: { fontFamily: DISPLAY, fontSize: rs(11), fontWeight: '700', color: C.violet },

  // Tips
  tipsCard: {
    marginBottom: rs(14), padding: rs(16), borderRadius: rs(18),
    backgroundColor: T.tintGold, borderWidth: 1, borderColor: '#EEDFB4',
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(9), marginBottom: rs(10) },
  tipsIcon: { width: rs(28), height: rs(28), borderRadius: rs(9), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tipsTitle: { fontFamily: DISPLAY, fontSize: rs(13.5), fontWeight: 'bold', color: '#8A5A0B' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(9), marginTop: rs(7) },
  tipDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: T.gold, marginTop: rs(6) },
  tipText: { fontFamily: DISPLAY, flex: 1, fontSize: rs(12.5), color: '#7A5A1F', fontWeight: '500', lineHeight: rs(18) },

  // Category modal
  catOverlay: { flex: 1, justifyContent: 'flex-end' },
  catBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: T.scrim },
  catSheet: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '80%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },
  catSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs(18), paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: C.border },
  catSheetTitle: { fontFamily: DISPLAY, fontSize: rs(16), fontWeight: 'bold', color: C.text },
  modalCloseBtn: { padding: rs(4) },
  catSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    margin: rs(14), paddingHorizontal: rs(12), paddingVertical: rs(10),
    backgroundColor: T.field, borderRadius: rs(10), borderWidth: 1, borderColor: C.border,
  },
  catSearchInput: { flex: 1, fontFamily: DISPLAY, fontSize: rs(14), color: C.text, padding: 0 },
  catList: { paddingHorizontal: rs(14) },
  catEmpty: { fontFamily: DISPLAY, textAlign: 'center', color: C.muted, fontSize: rs(14), paddingVertical: rs(24) },
  catItem: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingVertical: rs(13), borderBottomWidth: 1, borderBottomColor: C.border,
  },
  catItemActive: { backgroundColor: C.violetL, marginHorizontal: -rs(14), paddingHorizontal: rs(14), borderRadius: rs(8) },
  catItemDot: { width: rs(34), height: rs(34), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  catItemText: { flex: 1, fontFamily: DISPLAY, fontSize: rs(15), fontWeight: '600', color: C.text },
  catItemTextActive: { color: C.violet },
  catItemDesc: { fontFamily: DISPLAY, fontSize: rs(11), color: C.muted },
});
