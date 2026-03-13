import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Image,
  Dimensions, Platform, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { getFleetDocuments, uploadFleetDocument, extractDocumentData, getBaseURL } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const { width: SCREEN_W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#DBEAFE',
  red: '#EF4444', redL: '#FEE2E2',
  amber: '#D97706', amberL: '#FEF3C7',
  purple: '#8B5CF6', purpleL: '#F3E8FF',
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.heroLoading}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.loadTitle}>Vehicle Documents</Text>
      </LinearGradient>
      <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </SafeAreaView>
  );

  const extractedItems = getExtractedDisplayItems();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Hero Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
        <View style={s.deco1} />
        <View style={s.deco2} />

        <View style={s.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.heroTopRight}>
            <TouchableOpacity onPress={toggleSearch} style={[s.refreshBtn, showSearch && s.searchBtnActive]}>
              <Icon name="search" size={18} color={showSearch ? C.g400 : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
              <Icon name="refresh-cw" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.heroBadgeRow}>
          <View style={s.heroBadge}>
            <MaterialCommunityIcons name="file-document-multiple" size={14} color={C.g400} />
            <Text style={s.heroBadgeText}>Fleet Management</Text>
          </View>
        </View>
        <Text style={s.heroTitle}>Vehicle Documents</Text>
        <Text style={s.heroSub}>Insurance · Fitness · Permit · RC</Text>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {[
            { label: 'Total',   value: summary.total,   color: '#fff' },
            { label: 'Valid',   value: summary.valid,   color: C.g400 },
            { label: 'Expired', value: summary.expired, color: '#FCA5A5' },
            { label: 'Missing', value: summary.missing, color: '#FCD34D' },
          ].map((st, i) => (
            <React.Fragment key={st.label}>
              {i > 0 && <View style={s.statDivider} />}
              <View style={s.statBox}>
                <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* Animated Search Bar */}
      {showSearch && (
        <Animated.View style={[s.searchBarWrap, {
          opacity: searchAnim,
          transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <View style={s.searchBarInner}>
            <Icon name="search" size={17} color={C.g600} />
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
                  <Icon name="x" size={12} color={C.sub} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} />}
      >
        {filteredVehicles.map(vehicle => (
          <View key={vehicle.id} style={s.card}>
            {/* Vehicle Header */}
            <View style={s.vehicleHeader}>
              <LinearGradient colors={[C.g800, C.g600]} style={s.vehicleIconGrad}>
                <MaterialCommunityIcons name="car" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.vehicleName} numberOfLines={1}>{vehicle.vehicleName}</Text>
                <Text style={s.vehicleReg}>{vehicle.registrationNumber || 'No Reg. Number'}</Text>
              </View>
              <View style={s.docCountBadge}>
                <Text style={s.docCountText}>{vehicle.documents?.filter(d => d.status === 'VALID').length || 0}/{vehicle.documents?.length || 0}</Text>
                <Text style={s.docCountSub}>valid</Text>
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
                        <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
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
                          <Icon name="eye" size={12} color="#fff" />
                          <Text style={s.viewText}>View</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={s.uploadHint} onPress={() => openAddModal(vehicle, doc.type)}>
                        <Icon name="upload" size={12} color={C.muted} />
                        <Text style={s.uploadHintText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {filteredVehicles.length === 0 && (
          <View style={s.emptyState}>
            <LinearGradient colors={[C.g800, C.g600]} style={s.emptyIcon}>
              <Icon name={searchQuery.trim() ? 'search' : 'file-text'} size={28} color="#fff" />
            </LinearGradient>
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
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add/Update Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalHandle} />
          <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={s.modalContent}>
              {/* Modal Header */}
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Update {DOC_CFG[selDocType]?.label}</Text>
                  <Text style={s.modalVehicle}>{selVehicle?.vehicleName}</Text>
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModal(false)}>
                  <Icon name="x" size={18} color={C.sub} />
                </TouchableOpacity>
              </View>

              {/* Doc Type Selector */}
              <Text style={s.formLabel}>DOCUMENT TYPE</Text>
              <View style={s.docTypeRow}>
                {Object.entries(DOC_CFG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.docTypeChip, selDocType === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                    onPress={() => { setSelDocType(key); setProvider(''); setSelectedFile(null); setExtractedData(null); }}
                  >
                    {selDocType === key && <MaterialCommunityIcons name={cfg.icon} size={13} color={cfg.color} />}
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
                        <MaterialCommunityIcons name="file-pdf-box" size={28} color={C.red} />
                      </View>
                    )}
                    <View style={s.fileInfo}>
                      <Text style={s.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                      <Text style={s.fileSize}>{selectedFile.fileSize ? `${(selectedFile.fileSize / 1024).toFixed(0)} KB` : 'Ready to upload'}</Text>
                    </View>
                    <TouchableOpacity style={s.fileRemoveBtn} onPress={() => { setSelectedFile(null); setExtractedData(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="x-circle" size={18} color={C.red} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.filePickerEmpty}>
                    <View style={s.filePickerIconCircle}>
                      <Icon name="camera" size={20} color={C.g600} />
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
                    <MaterialCommunityIcons name="robot-outline" size={16} color={C.purple} />
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
                    <Icon name="calendar" size={16} color={extractedData?.validUntil ? C.purple : C.muted} />
                    <Text style={s.dateText}>{validity.toLocaleDateString('en-IN')}</Text>
                    {extractedData?.validUntil && <MaterialCommunityIcons name="robot-outline" size={14} color={C.purple} style={{ marginLeft: 'auto' }} />}
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
                      <MaterialCommunityIcons name="robot-outline" size={14} color={C.purple} style={{ position: 'absolute', right: 14, top: 14 }} />
                    ) : null}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[s.saveBtn, (saving || extracting) && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving || extracting}
              >
                <LinearGradient colors={[C.g800, C.g600]} style={s.saveBtnInner}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <Icon name="check" size={18} color="#fff" />
                      <Text style={s.saveBtnText}>Save Document</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Full-Screen Image Viewer */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <View style={s.viewerOverlay}>
          <SafeAreaView style={s.viewerSafe} edges={['top']}>
            <View style={s.viewerHeader}>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={s.viewerCloseBtn}>
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={s.viewerTitle} numberOfLines={1}>{viewerTitle}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
          <View style={s.viewerBody}>
            {viewerImage && <Image source={{ uri: viewerImage }} style={s.viewerImage} resizeMode="contain" />}
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero
  hero: { paddingBottom: 20, overflow: 'hidden' },
  heroLoading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  deco1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(52,211,153,0.08)', top: -60, right: -40 },
  deco2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(52,211,153,0.06)', top: 20, right: 80 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  heroTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  heroBadgeRow: { paddingHorizontal: 16, marginBottom: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { fontSize: 11, fontWeight: '600', color: C.g400, letterSpacing: 0.5 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 16, marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', paddingHorizontal: 16, marginBottom: 16 },

  searchBtnActive: { backgroundColor: 'rgba(52,211,153,0.18)' },
  searchBarWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 14, paddingVertical: 10 },
  searchBarInner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
  searchClearBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },

  scroll: { padding: 16, gap: 12 },

  // Vehicle Card
  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  vehicleIconGrad: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '700', color: C.text },
  vehicleReg: { fontSize: 11, color: C.muted, marginTop: 1, fontFamily: 'monospace' },
  docCountBadge: { alignItems: 'center', backgroundColor: C.g50, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.g100 },
  docCountText: { fontSize: 14, fontWeight: '800', color: C.g700 },
  docCountSub: { fontSize: 9, color: C.g600, fontWeight: '600', marginTop: 1 },

  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docItem: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border },
  docInfoArea: { alignItems: 'center' },
  docIconWrap: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  docLabel: { fontSize: 11, fontWeight: '700', color: C.text, marginBottom: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  docValidity: { fontSize: 9, color: C.muted, marginTop: 3 },
  docProvider: { fontSize: 9, color: C.sub, marginTop: 2 },

  docImagePreview: { marginTop: 8, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  docThumb: { width: '100%', height: 56, borderRadius: 8 },
  viewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  viewText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  uploadHint: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  uploadHintText: { fontSize: 10, color: C.muted, fontWeight: '500' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptyMsg: { fontSize: 13, color: C.muted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalVehicle: { fontSize: 12, color: C.muted, marginTop: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  docTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docTypeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: 'transparent' },
  docTypeText: { fontSize: 12, color: C.sub },

  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateText: { fontSize: 14, color: C.text },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  autoFilledInput: { borderColor: '#C4B5FD', backgroundColor: '#FAF5FF' },

  // File picker
  filePickerBtn: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' },
  filePickerEmpty: { alignItems: 'center', paddingVertical: 22 },
  filePickerIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  filePickerText: { fontSize: 13, fontWeight: '600', color: C.text },
  filePickerHint: { fontSize: 11, color: C.muted, marginTop: 3 },
  filePickerSelected: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  filePreviewThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F1F5F9' },
  filePdfIcon: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: C.text },
  fileSize: { fontSize: 11, color: C.muted, marginTop: 2 },
  fileRemoveBtn: { padding: 4 },

  // AI Extraction
  extractingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E9D5FF' },
  extractingText: { fontSize: 13, color: C.purple, fontWeight: '600' },
  extractedCard: { backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#E9D5FF' },
  extractedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  extractedTitle: { fontSize: 12, fontWeight: '700', color: C.purple, flex: 1 },
  extractedBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  extractedBadgeText: { fontSize: 9, fontWeight: '700', color: C.purple },
  extractedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
  extractedLabel: { fontSize: 11, color: C.muted, fontWeight: '600' },
  extractedValue: { fontSize: 11, color: C.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Save Button
  saveBtn: { marginTop: 22, borderRadius: 14, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Image Viewer
  viewerOverlay: { flex: 1, backgroundColor: '#000' },
  viewerSafe: { backgroundColor: 'rgba(0,0,0,0.8)' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  viewerCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  viewerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center', marginHorizontal: 8 },
  viewerBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: SCREEN_W, height: SCREEN_W * 1.3 },
});
