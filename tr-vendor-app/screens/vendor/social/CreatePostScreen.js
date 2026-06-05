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
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { getSocialCategories, createSocialPost } from '../../api/socialApi';
import { uploadVendorImage, getFullImageURL } from '../../api/client';

const MAX_IMAGES = 4;

// getFullImageURL is async (resolves the base URL), so resolve into state.
function RemoteThumb({ url, style }) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    let alive = true;
    getFullImageURL(url).then((u) => { if (alive) setUri(u); });
    return () => { alive = false; };
  }, [url]);
  return <Image source={uri ? { uri } : undefined} style={style} />;
}

const G = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1E293B', muted: '#64748B',
  border: '#E2E8F0', violet: '#059669', violetL: '#ECFDF5',
  red: '#EF4444', redL: '#FEF2F2', green: '#059669', greenL: '#ECFDF5',
  orange: '#F97316', orangeL: '#FFF7ED', amber: '#D97706', amberL: '#FFFBEB',
  g950: '#011B14', g900: '#022C22', g800: '#064E3B',
};

const MAX_CHARS = 1000;

export default function CreatePostScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [images, setImages] = useState([]);
  const [uploadingImg, setUploadingImg] = useState(false);

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
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(G.g950);
  }, []));

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={G.g950} translucent={false} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <LinearGradient colors={[G.g950, G.g900, G.g800]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.submitBtn, (!content.trim() || !selectedCategory || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!content.trim() || !selectedCategory || submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitBtnText}>Post</Text>}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Category picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.categoryPicker} onPress={() => setCatModalVisible(true)}>
              {loadingCats ? (
                <ActivityIndicator size="small" color={G.violet} />
              ) : selectedCategory ? (
                <View style={styles.catSelected}>
                  <View style={[styles.catDot, { backgroundColor: isSOS ? G.red : G.violet }]} />
                  <Text style={[styles.catSelectedText, { color: isSOS ? G.red : G.violet }]}>
                    {isSOS ? '🚨 ' : ''}{selectedCategory.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.catPlaceholder}>Select a category...</Text>
              )}
              <Icon name="chevron-down" size={18} color={G.muted} />
            </TouchableOpacity>
          </View>

          {/* SOS warning */}
          {isSOS && (
            <View style={styles.sosWarning}>
              <Icon name="alert-triangle" size={18} color={G.red} />
              <Text style={styles.sosWarningText}>
                SOS posts are urgent alerts visible to all vendors. Use only for genuine emergencies or urgent help requests.
              </Text>
            </View>
          )}

          {/* Content input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What's on your mind? <Text style={styles.required}>*</Text></Text>
            <View style={[styles.contentInputWrap, isSOS && styles.contentInputWrapSOS]}>
              <TextInput
                style={styles.contentInput}
                multiline
                placeholder={isSOS ? 'Describe your emergency or urgent need...' : 'Share news, ask for help, or connect with fellow vendors...'}
                placeholderTextColor={G.muted}
                value={content}
                onChangeText={(t) => { if (t.length <= MAX_CHARS) setContent(t); }}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={[styles.charCounter, content.length > MAX_CHARS * 0.9 && styles.charCounterWarning]}>
                {content.length}/{MAX_CHARS}
              </Text>
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photos (optional · up to {MAX_IMAGES})</Text>
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
                    ? <ActivityIndicator size="small" color={G.violet} />
                    : <><Icon name="image" size={20} color={G.violet} /><Text style={styles.imageAddText}>Add</Text></>}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              <Icon name="info" size={13} color={G.violet} /> Posting tips
            </Text>
            <Text style={styles.tipItem}>· Be specific and clear about what you need or offer</Text>
            <Text style={styles.tipItem}>· Mention your city/location if relevant</Text>
            <Text style={styles.tipItem}>· Use SOS only for genuine urgent situations</Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* Category picker Modal */}
        <Modal visible={catModalVisible} transparent animationType="slide" onRequestClose={() => setCatModalVisible(false)}>
          <View style={styles.catOverlay}>
            <TouchableOpacity style={styles.catBackdrop} onPress={() => setCatModalVisible(false)} />
            <View style={styles.catSheet}>
              <View style={styles.catSheetHandle} />
              <View style={styles.catSheetHeader}>
                <Text style={styles.catSheetTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                  <Icon name="x" size={20} color={G.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.catSearchWrap}>
                <Icon name="search" size={16} color={G.muted} />
                <TextInput
                  style={styles.catSearchInput}
                  placeholder="Search categories..."
                  placeholderTextColor={G.muted}
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                  autoFocus
                />
                {categorySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCategorySearch('')}>
                    <Icon name="x-circle" size={16} color={G.muted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.catList}>
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
                      <View style={[styles.catItemDot, { backgroundColor: isCatSOS ? G.redL : G.violetL }]}>
                        <Icon name={isCatSOS ? 'alert-circle' : 'tag'} size={14} color={isCatSOS ? G.red : G.violet} />
                      </View>
                      <Text style={[styles.catItemText, isActive && styles.catItemTextActive, isCatSOS && { color: G.red }]}>
                        {isCatSOS ? '🚨 ' : ''}{cat.name}
                      </Text>
                      {cat.description && (
                        <Text style={styles.catItemDesc} numberOfLines={1}>{cat.description}</Text>
                      )}
                      {isActive && <Icon name="check" size={16} color={G.violet} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: G.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  submitBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 10, minWidth: 64, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: G.red },

  // Category picker
  categoryPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  },
  catSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catSelectedText: { fontSize: 15, fontWeight: '600' },
  catPlaceholder: { fontSize: 15, color: G.muted },

  // SOS warning
  sosWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: G.redL, marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  sosWarningText: { flex: 1, fontSize: 13, color: G.red, lineHeight: 18 },

  // Content input
  contentInputWrap: {
    backgroundColor: G.surface, borderWidth: 1, borderColor: G.border,
    borderRadius: 12, padding: 14, minHeight: 160,
  },
  contentInputWrapSOS: { borderColor: G.red, borderWidth: 1.5 },
  contentInput: { fontSize: 15, color: G.text, lineHeight: 22, minHeight: 120 },
  charCounter: { textAlign: 'right', fontSize: 11, color: G.muted, marginTop: 8 },
  charCounterWarning: { color: G.orange },

  // Photos
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumbWrap: { width: 84, height: 84, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: G.border },
  imageThumb: { width: '100%', height: '100%' },
  imageRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  imageAdd: { width: 84, height: 84, borderRadius: 12, borderWidth: 1.5, borderColor: G.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: G.surface },
  imageAddText: { fontSize: 11, fontWeight: '700', color: G.violet },

  // Tips
  tipsCard: {
    margin: 16, backgroundColor: G.violetL, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#6EE7B7',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: G.violet, marginBottom: 8 },
  tipItem: { fontSize: 13, color: G.violet, lineHeight: 20, opacity: 0.8 },

  // Category modal
  catOverlay: { flex: 1, justifyContent: 'flex-end' },
  catBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  catSheet: { backgroundColor: G.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '80%' },
  catSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  catSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: G.border },
  catSheetTitle: { fontSize: 16, fontWeight: '700', color: G.text },
  catSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 14, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: G.bg, borderRadius: 10, borderWidth: 1, borderColor: G.border,
  },
  catSearchInput: { flex: 1, fontSize: 14, color: G.text, padding: 0 },
  catList: { paddingHorizontal: 14 },
  catEmpty: { textAlign: 'center', color: G.muted, fontSize: 14, paddingVertical: 24 },
  catItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: G.border,
  },
  catItemActive: { backgroundColor: G.violetL, marginHorizontal: -14, paddingHorizontal: 14, borderRadius: 8 },
  catItemDot: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: G.text },
  catItemTextActive: { color: G.violet },
  catItemDesc: { fontSize: 11, color: G.muted },
});
