import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Image,
  Dimensions, Platform, StatusBar, Animated,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { getFleetDocuments, uploadFleetDocument, extractDocumentData, getBaseURL } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, TONES, rs, rf, GUT, cardShadow, shade, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const { width: SCREEN_W } = Dimensions.get('window');

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
// Follows the same construction AddVehicleScreen.js (this folder) uses,
// extended with the extra accent keys (blue/amber/purple) this screen needs.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  red: T.red, redL: T.redLight,
  amber: T.amber, amberL: T.amberLight,
  purple: T.purple, purpleL: T.purpleLight,
};

const DOC_CFG = {
  INSURANCE:  { label: 'Insurance',     icon: 'shield-check',         color: C.blue,   bg: C.blueL,   needsValidity: true,  providerLabel: 'Provider' },
  FITNESS:    { label: 'Fitness Cert',  icon: 'certificate',          color: C.g600,   bg: C.g100,    needsValidity: true,  providerLabel: null },
  PERMIT:     { label: 'Permit',        icon: 'card-account-details', color: C.purple, bg: C.purpleL, needsValidity: false, providerLabel: 'Permit Type' },
  RC:         { label: 'RC',            icon: 'file-document',        color: C.amber,  bg: C.amberL,  needsValidity: false, providerLabel: 'Reg. Number' },
};

const STATUS_CFG = {
  VALID:        { label: 'Valid',   color: C.g500,  bg: C.g100 },
  EXPIRED:      { label: 'Expired', color: C.red,   bg: C.redL },
  NOT_UPLOADED: { label: 'Missing', color: C.muted, bg: '#F1F5F9' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

export default function FleetDocumentsScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState({ total: 0, valid: 0, expired: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [baseURL, setBaseURL] = useState('');

  const [modal, setModal] = useState(false);
  const [selVehicle, setSelVehicle] = useState(null);
  const [selDocType, setSelDocType] = useState('INSURANCE');
  const [validity, setValidity] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [provider, setProvider] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery('');
      Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setShowSearch(false));
    } else {
      setShowSearch(true);
      Animated.timing(searchAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start(() => {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      });
    }
  };

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const res = await getFleetDocuments();
      setVehicles(res?.vehicles || []);
      setSummary(res?.summary || { total: 0, valid: 0, expired: 0, missing: 0 });
    } catch (err) {
      showAlert('error', 'Load Failed', 'Could not load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#022C22');
  }, []));
  useEffect(() => {
    (async () => { const url = await getBaseURL(); setBaseURL(url); })();
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    const base = baseURL || 'https://transrentals.in';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const openAddModal = (vehicle, docType) => {
    setSelVehicle(vehicle);
    setSelDocType(docType);
    setValidity(new Date());
    setProvider('');
    setSelectedFile(null);
    setExtractedData(null);
    setModal(true);
  };

  const applyExtractedData = (data, docType) => {
    if (!data) return;
    const dateStr = data.validUntil;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) setValidity(parsed);
    }
    if (docType === 'INSURANCE' && data.insuranceProvider) setProvider(data.insuranceProvider);
    else if (docType === 'PERMIT' && data.permitType) setProvider(data.permitType);
    else if (docType === 'RC' && data.registrationNumber) setProvider(data.registrationNumber);
  };

  const pickFile = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1, quality: 0.8 });
      if (result.didCancel) return;
      if (result.errorCode) { showAlert('error', 'Error', result.errorMessage || 'Could not pick file'); return; }
      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { showAlert('warning', 'Too Large', 'File must be under 5MB'); return; }
        const file = { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `document_${Date.now()}.jpg`, fileSize: asset.fileSize };
        setSelectedFile(file);
        setExtractedData(null);
        runExtract(file);
      }
    } catch (err) { showAlert('error', 'Error', 'Could not open file picker'); }
  };

  const runExtract = async (file) => {
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('documentType', selDocType);
      formData.append('photo', { uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''), type: file.type, name: file.name });
      const res = await extractDocumentData(formData);
      if (res?.success && res?.extracted) {
        setExtractedData(res.extracted);
        applyExtractedData(res.extracted, selDocType);
        showAlert('success', 'Data Extracted!', 'Document data auto-filled. Please verify and save.');
      }
    } catch (err) { console.log('[Extract] Error:', err?.message || err); }
    finally { setExtracting(false); }
  };

  const handleSave = async () => {
    const cfg = DOC_CFG[selDocType];
    if (cfg.needsValidity && !validity) return showAlert('warning', 'Required', 'Please select validity date');
    if (cfg.providerLabel && !provider.trim()) return showAlert('warning', 'Required', `Please enter ${cfg.providerLabel}`);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('vendorFleetId', selVehicle.id);
      formData.append('documentType', selDocType);
      if (cfg.needsValidity) formData.append('validity', validity.toISOString());
      if (provider.trim()) formData.append('provider', provider.trim());
      if (selectedFile) formData.append('photo', { uri: Platform.OS === 'android' ? selectedFile.uri : selectedFile.uri.replace('file://', ''), type: selectedFile.type, name: selectedFile.name });
      await uploadFleetDocument(formData);
      setModal(false);
      showAlert('success', 'Saved!', 'Document updated successfully');
      fetchData();
    } catch (err) { showAlert('error', 'Failed', 'Could not save document'); }
    finally { setSaving(false); }
  };

  const openViewer = (imageUrl, title) => {
    const full = getFullUrl(imageUrl);
    if (!full) return;
    setViewerImage(full);
    setViewerTitle(title);
    setViewerVisible(true);
  };

  const getExtractedDisplayItems = () => {
    if (!extractedData) return [];
    const items = [];
    const d = extractedData;
    if (selDocType === 'INSURANCE') {
      if (d.insuranceProvider) items.push({ label: 'Provider', value: d.insuranceProvider });
      if (d.policyNumber) items.push({ label: 'Policy No.', value: d.policyNumber });
      if (d.vehicleRegNumber) items.push({ label: 'Reg. No.', value: d.vehicleRegNumber });
      if (d.validUntil) items.push({ label: 'Valid Until', value: fmtDate(d.validUntil) });
    } else if (selDocType === 'FITNESS') {
      if (d.certificateNumber) items.push({ label: 'Cert. No.', value: d.certificateNumber });
      if (d.issuingAuthority) items.push({ label: 'Authority', value: d.issuingAuthority });
      if (d.vehicleRegNumber) items.push({ label: 'Reg. No.', value: d.vehicleRegNumber });
      if (d.validUntil) items.push({ label: 'Valid Until', value: fmtDate(d.validUntil) });
    } else if (selDocType === 'PERMIT') {
      if (d.permitType) items.push({ label: 'Permit Type', value: d.permitType });
      if (d.permitNumber) items.push({ label: 'Permit No.', value: d.permitNumber });
      if (d.vehicleRegNumber) items.push({ label: 'Reg. No.', value: d.vehicleRegNumber });
      if (d.validUntil) items.push({ label: 'Valid Until', value: fmtDate(d.validUntil) });
    } else if (selDocType === 'RC') {
      if (d.registrationNumber) items.push({ label: 'Reg. No.', value: d.registrationNumber });
      if (d.ownerName) items.push({ label: 'Owner', value: d.ownerName });
      if (d.vehicleClass) items.push({ label: 'Class', value: d.vehicleClass });
      if (d.fuelType) items.push({ label: 'Fuel', value: d.fuelType });
      if (d.engineNumber) items.push({ label: 'Engine No.', value: d.engineNumber });
      if (d.chassisNumber) items.push({ label: 'Chassis No.', value: d.chassisNumber });
      if (d.validUntil) items.push({ label: 'Valid Until', value: fmtDate(d.validUntil) });
    }
    return items;
  };

  const filteredVehicles = searchQuery.trim()
    ? vehicles.filter(v => {
        const q = searchQuery.toLowerCase();
        return (
          (v.vehicleName || '').toLowerCase().includes(q) ||
          (v.registrationNumber || '').toLowerCase().includes(q)
        );
      })
    : vehicles;

  if (loading) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={G.hero} style={s.headerGrad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: rs(10) }}>
              <View style={s.heroBadge}>
                <MaterialCommunityIcons name="file-document-multiple" size={rs(11)} color={C.g400} />
                <Text style={s.heroBadgeText}>FLEET MANAGEMENT</Text>
              </View>
              <Text style={s.headerTitle}>Vehicle Documents</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={s.summaryWrap}>
        <View style={[s.summaryCard, cardShadow]}>
          <View style={s.summaryRow}>
            {[0, 1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={s.summaryDivider} />}
                <View style={s.summaryItem}>
                  <Bone w={22} h={22} r={11} style={{ marginBottom: 6 }} />
                  <Bone w={26} h={9} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      <View style={s.scroll}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.card, cardShadow]}>
            <View style={[s.cardRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={s.cardInner}>
              <View style={s.vehicleHeader}>
                <Bone w={rs(42)} h={rs(42)} r={rs(12)} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Bone w={130} h={14} style={{ marginBottom: 6 }} />
                  <Bone w={90} h={10} />
                </View>
                <Bone w={44} h={34} r={10} />
              </View>
              <View style={s.docsGrid}>
                {[0, 1, 2, 3].map((j) => (
                  <View key={j} style={s.docItem}>
                    <Bone w={rs(38)} h={rs(38)} r={rs(11)} style={{ marginBottom: 6 }} />
                    <Bone w={60} h={10} style={{ marginBottom: 6 }} />
                    <Bone w={50} h={16} r={8} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const extractedItems = getExtractedDisplayItems();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero header ── */}
      <LinearGradient colors={G.hero} style={s.headerGrad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-left" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: rs(10) }}>
              <View style={s.heroBadge}>
                <MaterialCommunityIcons name="file-document-multiple" size={rs(11)} color={C.g400} />
                <Text style={s.heroBadgeText}>FLEET MANAGEMENT</Text>
              </View>
              <Text style={s.headerTitle}>Vehicle Documents</Text>
            </View>
            <TouchableOpacity onPress={toggleSearch} style={[s.iconCircle, showSearch && s.iconCircleActive]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="search" size={rs(17)} color={showSearch ? C.g400 : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh} style={[s.iconCircle, { marginLeft: rs(8) }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="refresh-cw" size={rs(17)} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Control panel — stats + search live inside ONE card as two
          stacked rows, in the body now below the compact header. */}
      <View style={s.summaryWrap}>
        <View style={[s.summaryCard, cardShadow]}>
          <View style={s.summaryRow}>
            {[
              { label: 'Total',   value: summary.total,   color: C.text,  icon: 'folder' },
              { label: 'Valid',   value: summary.valid,   color: C.g600,  icon: 'check-circle' },
              { label: 'Expired', value: summary.expired, color: C.red,   icon: 'alert-triangle' },
              { label: 'Missing', value: summary.missing, color: C.amber, icon: 'alert-circle' },
            ].map((st, i) => (
              <React.Fragment key={st.label}>
                {i > 0 && <View style={s.summaryDivider} />}
                <View style={s.summaryItem}>
                  <Icon name={st.icon} size={rs(12)} color={st.color} style={{ marginBottom: rs(3) }} />
                  <Text style={[s.summaryValue, { color: st.color }]} numberOfLines={1}>{st.value}</Text>
                  <Text style={s.summaryLabel}>{st.label.toUpperCase()}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Animated Search — folds out beneath the stats, inside the same card */}
          {showSearch && (
            <Animated.View style={{
              opacity: searchAnim,
              transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            }}>
              <View style={s.searchDivider} />
              <View style={s.searchRow}>
                <View style={s.searchIconBadge}>
                  <Icon name="search" size={rs(13)} color={C.g600} />
                </View>
                <TextInput
                  ref={searchInputRef}
                  style={s.searchInput}
                  placeholder="Search by vehicle name or reg. number..."
                  placeholderTextColor={C.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <View style={s.searchClearBtn}>
                      <Icon name="x" size={rs(12)} color={C.sub} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {filteredVehicles.map(vehicle => (
          <View key={vehicle.id} style={[s.card, cardShadow]}>
            {/* Compact accent rail */}
            <LinearGradient colors={TONES.emerald.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.cardRail} />

            <View style={s.cardInner}>
              {/* Vehicle Header */}
              <View style={s.vehicleHeader}>
                <LinearGradient colors={G.emerald} style={s.vehicleIconGrad}>
                  <MaterialCommunityIcons name="car" size={rs(17)} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.vehicleName} numberOfLines={1}>{vehicle.vehicleName}</Text>
                  <Text style={s.vehicleReg}>{vehicle.registrationNumber || 'No Reg. Number'}</Text>
                </View>
                <View style={s.docCountBadge}>
                  <Text style={s.docCountText}>{vehicle.documents?.filter(d => d.status === 'VALID').length || 0}/{vehicle.documents?.length || 0}</Text>
                  <Text style={s.docCountSub}>VALID</Text>
                </View>
              </View>

              {/* Docs Grid */}
              <View style={s.docsGrid}>
                {vehicle.documents.map(doc => {
                  const cfg = DOC_CFG[doc.type];
                  const st = STATUS_CFG[doc.status];
                  const hasImage = !!doc.image;
                  return (
                    <View key={doc.type} style={s.docItem}>
                      <TouchableOpacity
                        style={s.docInfoArea}
                        onPress={() => openAddModal(vehicle, doc.type)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.docIconWrap, { backgroundColor: cfg.bg }]}>
                          <MaterialCommunityIcons name={cfg.icon} size={rs(17)} color={cfg.color} />
                        </View>
                        <Text style={s.docLabel}>{cfg.label}</Text>
                        <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                          <View style={[s.statusDot, { backgroundColor: st.color }]} />
                          <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                        {doc.validity && <Text style={s.docValidity}>{fmtDate(doc.validity)}</Text>}
                        {doc.provider && <Text style={s.docProvider} numberOfLines={1}>{doc.provider}</Text>}
                      </TouchableOpacity>

                      {hasImage ? (
                        <TouchableOpacity
                          style={s.docImagePreview}
                          onPress={() => openViewer(doc.image, `${vehicle.vehicleName} - ${cfg.label}`)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: getFullUrl(doc.image) }} style={s.docThumb} resizeMode="cover" />
                          <View style={s.viewOverlay}>
                            <Icon name="eye" size={rs(11)} color="#fff" />
                            <Text style={s.viewText}>View</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={s.uploadHint} onPress={() => openAddModal(vehicle, doc.type)}>
                          <Icon name="upload" size={rs(11)} color={C.muted} />
                          <Text style={s.uploadHintText}>Upload</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ))}

        {filteredVehicles.length === 0 && (
          <View style={[s.empty, s.emptyCardWrap]}>
            <View style={s.emptyArt}>
              <View style={s.emptyArtCardBack} />
              <View style={s.emptyArtCard}>
                <Icon name={searchQuery.trim() ? 'search' : 'file-text'} size={rs(34)} color={C.g500} />
              </View>
              <View style={s.emptyArtDot} />
              <View style={s.emptyArtTag}>
                <Text style={s.emptyArtTagTxt}>{searchQuery.trim() ? 'NO MATCH' : 'FLEET'}</Text>
              </View>
            </View>

            <Text style={s.emptyTitle}>
              {searchQuery.trim() ? 'No results found' : 'No active vehicles'}
            </Text>
            <Text style={s.emptyMsg}>
              {searchQuery.trim()
                ? `No vehicle matches "${searchQuery}"`
                : 'Add vehicles to manage their documents'}
            </Text>
          </View>
        )}
        <View style={{ height: rs(30) }} />
      </ScrollView>

      {/* Add/Update Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.sheetHandleWrap}><View style={s.sheetHandle} /></View>

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              {/* Modal Header */}
              <View style={s.modalHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.modalTitle}>Update {DOC_CFG[selDocType]?.label}</Text>
                  <Text style={s.modalVehicle} numberOfLines={1}>{selVehicle?.vehicleName}</Text>
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModal(false)}>
                  <Icon name="x" size={rs(18)} color={C.sub} />
                </TouchableOpacity>
              </View>

              <View style={s.modalBody}>
                {/* Doc Type Selector */}
                <Text style={s.formLabel}>DOCUMENT TYPE</Text>
                <View style={s.docTypeRow}>
                  {Object.entries(DOC_CFG).map(([key, cfg]) => (
                    <TouchableOpacity
                      key={key}
                      style={[s.docTypeChip, selDocType === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                      onPress={() => { setSelDocType(key); setProvider(''); setSelectedFile(null); setExtractedData(null); }}
                    >
                      {selDocType === key && <MaterialCommunityIcons name={cfg.icon} size={rs(13)} color={cfg.color} />}
                      <Text style={[s.docTypeText, selDocType === key && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* File Upload */}
                <Text style={s.formLabel}>UPLOAD DOCUMENT (IMAGE / PDF)</Text>
                <TouchableOpacity style={s.filePickerBtn} onPress={pickFile} disabled={extracting}>
                  {selectedFile ? (
                    <View style={s.filePickerSelected}>
                      {selectedFile.type?.startsWith('image/') ? (
                        <Image source={{ uri: selectedFile.uri }} style={s.filePreviewThumb} resizeMode="cover" />
                      ) : (
                        <View style={s.filePdfIcon}>
                          <MaterialCommunityIcons name="file-pdf-box" size={rs(26)} color={C.red} />
                        </View>
                      )}
                      <View style={s.fileInfo}>
                        <Text style={s.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={s.fileSize}>{selectedFile.fileSize ? `${(selectedFile.fileSize / 1024).toFixed(0)} KB` : 'Ready to upload'}</Text>
                      </View>
                      <TouchableOpacity style={s.fileRemoveBtn} onPress={() => { setSelectedFile(null); setExtractedData(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="x-circle" size={rs(18)} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={s.filePickerEmpty}>
                      <View style={s.filePickerIconCircle}>
                        <Icon name="camera" size={rs(19)} color={C.g600} />
                      </View>
                      <Text style={s.filePickerText}>Tap to select image or file</Text>
                      <Text style={s.filePickerHint}>JPG, PNG, WebP, PDF (max 5MB)</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* AI Extracting */}
                {extracting && (
                  <View style={s.extractingBanner}>
                    <ActivityIndicator size="small" color={C.purple} />
                    <Text style={s.extractingText}>AI reading document...</Text>
                  </View>
                )}

                {/* Extracted Data */}
                {extractedItems.length > 0 && !extracting && (
                  <View style={s.extractedCard}>
                    <View style={s.extractedHeader}>
                      <MaterialCommunityIcons name="robot-outline" size={rs(15)} color={C.purple} />
                      <Text style={s.extractedTitle}>AI Extracted Data</Text>
                      <View style={s.extractedBadge}><Text style={s.extractedBadgeText}>Auto-filled</Text></View>
                    </View>
                    {extractedItems.map((item, idx) => (
                      <View key={idx} style={s.extractedRow}>
                        <Text style={s.extractedLabel}>{item.label}</Text>
                        <Text style={s.extractedValue} numberOfLines={1}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {DOC_CFG[selDocType]?.needsValidity && (
                  <>
                    <Text style={s.formLabel}>VALID UNTIL {extractedData?.validUntil ? '(auto-filled)' : ''}</Text>
                    <TouchableOpacity style={[s.dateInput, extractedData?.validUntil && s.autoFilledInput]} onPress={() => setShowDatePicker(true)}>
                      <Icon name="calendar" size={rs(15)} color={extractedData?.validUntil ? C.purple : C.muted} />
                      <Text style={s.dateText}>{validity.toLocaleDateString('en-IN')}</Text>
                      {extractedData?.validUntil && <MaterialCommunityIcons name="robot-outline" size={rs(13)} color={C.purple} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={validity}
                        mode="date"
                        minimumDate={new Date()}
                        onChange={(_, d) => { setShowDatePicker(false); if (d) setValidity(d); }}
                      />
                    )}
                  </>
                )}

                {DOC_CFG[selDocType]?.providerLabel && (
                  <>
                    <Text style={s.formLabel}>{DOC_CFG[selDocType].providerLabel.toUpperCase()} {extractedData && provider ? '(auto-filled)' : ''}</Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={[s.textInput, extractedData && provider ? s.autoFilledInput : null]}
                        value={provider}
                        onChangeText={setProvider}
                        placeholder={`Enter ${DOC_CFG[selDocType].providerLabel}`}
                        placeholderTextColor={C.muted}
                      />
                      {extractedData && provider ? (
                        <MaterialCommunityIcons name="robot-outline" size={rs(13)} color={C.purple} style={{ position: 'absolute', right: 14, top: 14 }} />
                      ) : null}
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[s.saveBtn, (saving || extracting) && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving || extracting}
                >
                  <LinearGradient colors={G.emerald} style={s.saveBtnInner}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Icon name="check" size={rs(17)} color="#fff" />
                        <Text style={s.saveBtnText}>Save Document</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-Screen Image Viewer */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <View style={s.viewerOverlay}>
          <SafeAreaView style={s.viewerSafe} edges={['top']}>
            <View style={s.viewerHeader}>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={s.viewerCloseBtn}>
                <Icon name="x" size={rs(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={s.viewerTitle} numberOfLines={1}>{viewerTitle}</Text>
              <View style={{ width: rs(40) }} />
            </View>
          </SafeAreaView>
          <View style={s.viewerBody}>
            {viewerImage && <Image source={{ uri: viewerImage }} style={s.viewerImage} resizeMode="contain" />}
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero header ──
  headerGrad: { paddingBottom: rs(8), overflow: 'hidden', borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingTop: rs(10) },
  backCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  iconCircle: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  iconCircleActive: { backgroundColor: 'rgba(52,211,153,0.18)' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },
  heroBadgeText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: '700', color: C.g400, letterSpacing: 1 },
  headerTitle: { fontFamily: DISPLAY, fontSize: rf(19), color: '#fff', letterSpacing: -0.2, fontWeight: '800' },

  // Floating control panel — stats row + folding search row, one card
  summaryWrap: { marginHorizontal: GUT, marginTop: rs(14) },
  summaryCard: {
    backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: T.glassBorder,
    overflow: 'hidden',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(8), paddingVertical: rs(13) },
  summaryItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  summaryLabel: { fontFamily: DISPLAY, fontSize: rf(8), color: C.muted, fontWeight: 'bold', letterSpacing: 0.5, marginTop: rs(2) },
  summaryValue: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800' },
  summaryDivider: { width: 1, height: rs(28), backgroundColor: C.border },

  // Search row — folds out beneath the stats, inside the same card
  searchDivider: { height: 1, backgroundColor: C.border, marginHorizontal: rs(14) },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(10) },
  searchIconBadge: { width: rs(26), height: rs(26), borderRadius: rs(9), backgroundColor: C.g100, alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, fontSize: rf(13.5), color: C.text, paddingVertical: 0 },
  searchClearBtn: { width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(14), gap: rs(12) },

  // Vehicle Card
  card: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: T.glassBorder,
    marginBottom: rs(12), overflow: 'hidden', flexDirection: 'row',
  },
  cardRail: { width: rs(4) },
  cardInner: { flex: 1, padding: rs(14), minWidth: 0 },

  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(14) },
  vehicleIconGrad: { width: rs(42), height: rs(42), borderRadius: rs(12), justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: C.text },
  vehicleReg: { fontSize: rf(11), color: C.muted, marginTop: rs(1), fontFamily: 'monospace' },
  docCountBadge: { alignItems: 'center', backgroundColor: C.g50, borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(6), borderWidth: 1, borderColor: C.g100 },
  docCountText: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '800', color: C.g700 },
  docCountSub: { fontSize: rf(8), color: C.g600, fontWeight: '700', marginTop: rs(1), letterSpacing: 0.4 },

  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  docItem: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: rs(14), padding: rs(10), borderWidth: 1, borderColor: C.border },
  docInfoArea: { alignItems: 'center' },
  docIconWrap: { width: rs(38), height: rs(38), borderRadius: rs(11), justifyContent: 'center', alignItems: 'center', marginBottom: rs(6) },
  docLabel: { fontSize: rf(11), fontWeight: '700', color: C.text, marginBottom: rs(4) },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(8) },
  statusDot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
  statusText: { fontSize: rf(9), fontWeight: '700' },
  docValidity: { fontSize: rf(9), color: C.muted, marginTop: rs(3) },
  docProvider: { fontSize: rf(9), color: C.sub, marginTop: rs(2) },

  docImagePreview: { marginTop: rs(8), borderRadius: rs(8), overflow: 'hidden', position: 'relative' },
  docThumb: { width: '100%', height: rs(56), borderRadius: rs(8) },
  viewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4), backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: rs(4), borderBottomLeftRadius: rs(8), borderBottomRightRadius: rs(8) },
  viewText: { fontSize: rf(10), color: '#fff', fontWeight: '600' },
  uploadHint: { marginTop: rs(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4), paddingVertical: rs(6), borderRadius: rs(8), borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  uploadHintText: { fontSize: rf(10), color: C.muted, fontWeight: '500' },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingVertical: rs(30) },
  emptyCardWrap: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: T.glassBorder,
    paddingHorizontal: rs(20), marginTop: rs(4), marginBottom: rs(12),
  },
  emptyArt: { width: rs(150), height: rs(120), marginBottom: rs(18), alignItems: 'center', justifyContent: 'center' },
  emptyArtCardBack: {
    position: 'absolute', top: rs(14), right: rs(24),
    width: rs(96), height: rs(70), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: '#F1F6F3', borderWidth: 1, borderColor: C.g100,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(6), right: rs(20),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.g500,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(10), left: rs(6),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g100, transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: '700', color: C.g700, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '700', color: C.text, textAlign: 'center' },
  emptyMsg: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.muted, textAlign: 'center', marginTop: rs(6), fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '88%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: rs(20), paddingTop: rs(12), paddingBottom: rs(14), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: C.text },
  modalVehicle: { fontSize: rf(12), color: C.muted, marginTop: rs(2) },
  modalCloseBtn: { width: rs(34), height: rs(34), borderRadius: rs(10), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: rs(20), paddingBottom: rs(34) },

  formLabel: { fontSize: rf(10), fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: rs(8), marginTop: rs(14) },
  docTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  docTypeChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(10), backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent' },
  docTypeText: { fontSize: rf(12), color: C.sub },

  dateInput: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: rs(12), paddingHorizontal: rs(14), paddingVertical: rs(12) },
  dateText: { fontSize: rf(14), color: C.text },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: rs(12), paddingHorizontal: rs(14), paddingVertical: rs(12), fontSize: rf(14), color: C.text },
  autoFilledInput: { borderColor: '#C4B5FD', backgroundColor: '#FAF5FF' },

  // File picker
  filePickerBtn: { borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), overflow: 'hidden' },
  filePickerEmpty: { alignItems: 'center', paddingVertical: rs(22) },
  filePickerIconCircle: { width: rs(50), height: rs(50), borderRadius: rs(25), backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', marginBottom: rs(8) },
  filePickerText: { fontSize: rf(13), fontWeight: '600', color: C.text },
  filePickerHint: { fontSize: rf(11), color: C.muted, marginTop: rs(3) },
  filePickerSelected: { flexDirection: 'row', alignItems: 'center', padding: rs(10), gap: rs(10) },
  filePreviewThumb: { width: rs(56), height: rs(56), borderRadius: rs(10), backgroundColor: '#F1F5F9' },
  filePdfIcon: { width: rs(56), height: rs(56), borderRadius: rs(10), backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { fontSize: rf(13), fontWeight: '600', color: C.text },
  fileSize: { fontSize: rf(11), color: C.muted, marginTop: rs(2) },
  fileRemoveBtn: { padding: rs(4) },

  // AI Extraction
  extractingBanner: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: '#F5F3FF', borderRadius: rs(12), padding: rs(12), marginTop: rs(10), borderWidth: 1, borderColor: '#E9D5FF' },
  extractingText: { fontSize: rf(13), color: C.purple, fontWeight: '600' },
  extractedCard: { backgroundColor: '#FAFAFA', borderRadius: rs(14), padding: rs(14), marginTop: rs(10), borderWidth: 1, borderColor: '#E9D5FF' },
  extractedHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(10) },
  extractedTitle: { fontSize: rf(12), fontWeight: '700', color: C.purple, flex: 1 },
  extractedBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6) },
  extractedBadgeText: { fontSize: rf(9), fontWeight: '700', color: C.purple },
  extractedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: rs(4), borderBottomWidth: 0.5, borderBottomColor: C.border },
  extractedLabel: { fontSize: rf(11), color: C.muted, fontWeight: '600' },
  extractedValue: { fontSize: rf(11), color: C.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Save Button
  saveBtn: { marginTop: rs(22), borderRadius: rs(14), overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), paddingVertical: rs(15) },
  saveBtnText: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff' },

  // Image Viewer
  viewerOverlay: { flex: 1, backgroundColor: '#000' },
  viewerSafe: { backgroundColor: 'rgba(0,0,0,0.8)' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(12), paddingVertical: rs(10) },
  viewerCloseBtn: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  viewerTitle: { flex: 1, fontSize: rf(16), fontWeight: '600', color: '#fff', textAlign: 'center', marginHorizontal: rs(8) },
  viewerBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: SCREEN_W, height: SCREEN_W * 1.3 },
});
