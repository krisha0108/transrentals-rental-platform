// screens/vendor/documents/VendorDocumentsScreen.js
// REDESIGNED — "Elevate" visual language, matching
// screens/travel-agent/documents/DocumentsScreen.js and
// screens/vendor/fleet/FleetDocumentsScreen.js (same app, same session).
//
// UI ONLY. All behaviour is preserved exactly: same GET / POST (multipart) /
// DELETE calls, same document types, same status logic, same onboarding
// navigation targets (Continue to Services / Skip / Go to Dashboard).
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { showError, showConfirm, showSuccess } from '../../../services/alertService';
import {
  getVendorDocuments, uploadVendorDocument,
  deleteVendorDocument, getStoredVendor,
} from '../../api/client';
import { SC as T, G, rs, rf, GUT, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
// Follows the same construction FleetDocumentsScreen.js (this folder) uses,
// extended with orange/indigo which this screen's document types need.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
  orange: T.orange, orangeL: T.orangeL,
  indigo: T.indigo, indigoL: T.indigoLight,
};

const DOCUMENT_TYPES = [
  { type: 'ADDRESS_PROOF',        name: 'Address Proof',         required: true,  description: 'Current address — Aadhaar card, Voter ID, utility bill or rent agreement', icon: 'map-marker-outline',       color: C.orange, bg: C.orangeL },
  { type: 'GST_CERTIFICATE',      name: 'GST Certificate',       required: false, description: 'Optional — GST registration certificate', icon: 'file-certificate-outline', color: C.g700,   bg: C.g50 },
  { type: 'PAN_CARD',             name: 'PAN Card',              required: false, description: 'Optional — business or proprietor PAN',    icon: 'card-account-details-outline', color: C.blue,   bg: C.blueL },
  { type: 'BUSINESS_REGISTRATION',name: 'Business Registration', required: false, description: 'Company registration certificate',    icon: 'domain',                   color: C.indigo, bg: C.indigoL },
  { type: 'CANCELLED_CHEQUE',     name: 'Cancelled Cheque',      required: false, description: 'For bank verification',              icon: 'bank-outline',             color: C.purple, bg: C.purpleL },
  { type: 'OWNER_AADHAAR',        name: 'Owner Aadhaar',         required: false, description: 'Owner/proprietor Aadhaar card',      icon: 'shield-account-outline',   color: C.amber,  bg: C.amberL },
];

const STATUS_META = {
  APPROVED: { label: 'Approved', color: C.g700,  bg: C.g50,   icon: 'check-circle',        mcIcon: 'check-decagram' },
  REJECTED: { label: 'Rejected', color: C.red,   bg: C.redL,  icon: 'x-circle',            mcIcon: 'close-circle-outline' },
  PENDING:  { label: 'Pending',  color: C.amber, bg: C.amberL,icon: 'clock',               mcIcon: 'timer-sand' },
};

// Hero ↔ stats-card spacing — the card is pulled up by STATS_OVERLAP so it
// tucks into the hero's rounded bottom curve, matching FleetDocumentsScreen /
// travel-agent DocumentsScreen.
const HERO_TAIL = rs(26);
const STATS_OVERLAP = rs(22);

export default function VendorDocumentsScreen({ navigation }) {
  const [documents, setDocuments]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [uploading, setUploading]           = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile]     = useState(null);
  const [vendor, setVendor]                 = useState(null);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await getVendorDocuments();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (e) {
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadVendor = useCallback(async () => {
    const v = await getStoredVendor();
    setVendor(v);
  }, []);

  useEffect(() => { fetchDocuments(); loadVendor(); }, [fetchDocuments, loadVendor]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDocuments(); }, [fetchDocuments]);

  const getDocumentByType = (type) => documents.find((d) => d.documentType === type);

  const openUploadModal = (docType) => {
    setSelectedDocType(docType);
    setDocumentNumber('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleSelectFile = async (source) => {
    try {
      if (source === 'camera') {
        const result = await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
        if (result.didCancel) return;
        if (result.errorCode) { showError(result.errorMessage || 'Failed to capture image'); return; }
        const asset = result.assets?.[0];
        if (asset) setSelectedFile({ uri: asset.uri, name: asset.fileName || `photo_${Date.now()}.jpg`, type: asset.type || 'image/jpeg', size: asset.fileSize });
      } else if (source === 'gallery') {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
        if (result.didCancel) return;
        if (result.errorCode) { showError(result.errorMessage || 'Failed to select image'); return; }
        const asset = result.assets?.[0];
        if (asset) setSelectedFile({ uri: asset.uri, name: asset.fileName || `image_${Date.now()}.jpg`, type: asset.type || 'image/jpeg', size: asset.fileSize });
      } else if (source === 'document') {
        const [result] = await pick({ type: [types.pdf, types.images] });
        if (result) {
          if (result.size > 5 * 1024 * 1024) { showError('File size must be less than 5MB'); return; }
          setSelectedFile({ uri: result.uri, name: result.name, type: result.type, size: result.size });
        }
      }
    } catch (e) {
      if (e?.code !== 'DOCUMENT_PICKER_CANCELED') showError('Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) return;
    setUploading(selectedDocType.type);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      });
      formData.append('documentType', selectedDocType.type);
      if (documentNumber.trim()) formData.append('documentNumber', documentNumber.trim());
      await uploadVendorDocument(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocumentNumber('');
      fetchDocuments();
      showSuccess('Document uploaded successfully');
    } catch (e) {
      showError(e?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId) => {
    showConfirm('Delete Document', 'Are you sure you want to delete this document?', async () => {
      try {
        await deleteVendorDocument(docId);
        fetchDocuments();
        showSuccess('Document deleted');
      } catch (e) {
        showError('Failed to delete document');
      }
    }, { confirmText: 'Delete', destructive: true });
  };

  const handleContinue = () => {
    if (vendor?.status === 'DOCUMENTS_PENDING' || vendor?.status === 'PENDING_APPROVAL') {
      navigation.navigate('VendorServices');
    } else {
      navigation.navigate('VendorDashboard');
    }
  };

  const allRequiredUploaded = DOCUMENT_TYPES.filter(d => d.required).every(d => getDocumentByType(d.type));
  const approvedCount  = documents.filter(d => d.status === 'APPROVED').length;
  const pendingCount   = documents.filter(d => d.status === 'PENDING').length;
  const rejectedCount  = documents.filter(d => d.status === 'REJECTED').length;
  const uploadedCount  = documents.length;

  if (loading) {
    return (
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={st.heroLoading}>
          <SafeAreaView edges={['top']} style={st.heroLoadingInner}>
            <Text style={st.heroLoadingTitle}>Documents</Text>
          </SafeAreaView>
        </LinearGradient>
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero ── */}
      <LinearGradient colors={G.hero} style={st.hero}>
        <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={st.heroBadge}>
            <MaterialCommunityIcons name="file-document-multiple-outline" size={rs(11)} color={C.g400} />
            <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
          </View>
          <Text style={st.heroTitle}>Business Documents</Text>
          <Text style={st.heroSub}>Upload & manage your verification documents</Text>

          {/* spacer so the floating stats card can tuck into the curve */}
          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Stats card tucked into the hero curve ── */}
      <View style={st.statsWrap}>
        <View style={[st.statsCard, cardShadow]}>
          {[
            { value: uploadedCount, label: 'Uploaded', icon: 'cloud-upload-outline', color: C.text },
            { value: approvedCount, label: 'Approved', icon: 'check-circle-outline', color: C.g700 },
            { value: pendingCount,  label: 'Pending',  icon: 'clock-outline',        color: C.amber },
            { value: rejectedCount, label: 'Rejected', icon: 'close-circle-outline', color: C.red },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={st.statDivider} />}
              <View style={st.statCell}>
                <MaterialCommunityIcons name={s.icon} size={rs(14)} color={s.color} />
                <Text style={[st.statValue, { color: s.color }]} numberOfLines={1}>{s.value}</Text>
                <Text style={st.statLabel} numberOfLines={1}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {/* ── STATUS BANNER ── */}
        {documents.length === 0 ? (
          <LinearGradient colors={[C.blueL, '#DBEAFE']} style={st.welcomeBanner}>
            <View style={st.welcomeIconBox}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={rs(28)} color={C.blue} />
            </View>
            <Text style={st.welcomeTitle}>Welcome to TransRentals!</Text>
            <Text style={st.welcomeText}>Upload your business documents to verify your account and start receiving bookings.</Text>
            <View style={st.stepsRow}>
              {['Upload Docs', 'Select Services', 'Add Locations'].map((step, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <MaterialCommunityIcons name="chevron-right" size={rs(16)} color={C.blue + '80'} />}
                  <View style={st.stepItem}>
                    <LinearGradient colors={i === 0 ? G.emerald : ['#CBD5E1', '#CBD5E1']} style={st.stepBadge}>
                      <Text style={st.stepNum}>{i + 1}</Text>
                    </LinearGradient>
                    <Text style={st.stepTxt}>{step}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        ) : allRequiredUploaded ? (
          <View style={[st.statusBanner, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <View style={[st.statusBannerIcon, { backgroundColor: C.g100 }]}>
              <MaterialCommunityIcons name="check-decagram" size={rs(22)} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.statusBannerTitle, { color: C.g700 }]}>All Required Documents Uploaded</Text>
              <Text style={[st.statusBannerSub, { color: C.g600 }]}>Documents will be verified within 24–48 hours.</Text>
            </View>
          </View>
        ) : (
          <View style={[st.statusBanner, { backgroundColor: C.amberL, borderColor: '#FDE68A' }]}>
            <View style={[st.statusBannerIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="timer-sand" size={rs(22)} color={C.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.statusBannerTitle, { color: C.amber }]}>Documents Pending</Text>
              <Text style={[st.statusBannerSub, { color: C.amber + 'BB' }]}>Upload all required (*) documents to proceed.</Text>
            </View>
          </View>
        )}

        {/* ── DOCUMENT LIST ── */}
        <View style={st.sectionLabelWrap}>
          <View style={st.sectionLabelRow}>
            <View style={[st.sectionLabelIcon, { backgroundColor: C.indigoL }]}>
              <MaterialCommunityIcons name="file-document-multiple-outline" size={rs(15)} color={C.indigo} />
            </View>
            <Text style={st.sectionLabelText}>Required Documents</Text>
            <View style={st.sectionLabelBadge}>
              <Text style={st.sectionLabelBadgeText}>{uploadedCount}/{DOCUMENT_TYPES.length}</Text>
            </View>
          </View>
        </View>

        {DOCUMENT_TYPES.map((docType) => {
          const uploaded = getDocumentByType(docType.type);
          const sm = uploaded ? (STATUS_META[uploaded.status] || STATUS_META.PENDING) : null;
          return (
            <DocCard
              key={docType.type}
              docType={docType}
              uploaded={uploaded}
              sm={sm}
              onUpload={() => openUploadModal(docType)}
              onDelete={() => handleDelete(uploaded.id)}
            />
          );
        })}

        {/* ── CONTINUE / SKIP ── */}
        {documents.length > 0 ? (
          <TouchableOpacity onPress={handleContinue} style={st.continueWrap} activeOpacity={0.85}>
            <LinearGradient colors={G.emerald} style={st.continueBtn}>
              <Text style={st.continueTxt}>Continue to Services</Text>
              <MaterialCommunityIcons name="arrow-right" size={rs(20)} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={st.skipBtn} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={st.skipTxt}>Skip for now — upload documents later</Text>
            <Icon name="chevron-right" size={rs(16)} color={C.muted} />
          </TouchableOpacity>
        )}

        {/* ── INFO NOTE ── */}
        <View style={st.infoNote}>
          <MaterialCommunityIcons name="information-outline" size={rs(16)} color={C.blue} />
          <Text style={st.infoNoteTxt}>
            {allRequiredUploaded
              ? 'All required documents uploaded! Verification takes 24–48 hours.'
              : 'Upload all required documents marked * to proceed. Verification takes 24–48 hours.'}
          </Text>
        </View>

        {/* ── GO TO DASHBOARD ── secondary action so a vendor who landed here
            from signup/login can reach the onboarding dashboard at any time
            without the upload step. Kept visually quieter than the green
            "Continue to Services" CTA above. */}
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorDashboard')}
          style={st.goDashboardBtn}
          activeOpacity={0.8}
        >
          <Icon name="home" size={rs(18)} color={C.g700} />
          <Text style={st.goDashboardBtnTxt}>Go to Dashboard</Text>
          <Icon name="arrow-right" size={rs(16)} color={C.g700} />
        </TouchableOpacity>

        <View style={{ height: rs(120) }} />
      </ScrollView>

      {/* ── UPLOAD MODAL ── */}
      <Modal visible={showUploadModal} animationType="slide" transparent onRequestClose={() => setShowUploadModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.sheetHandleWrap}><View style={st.sheetHandle} /></View>

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: rs(50) }} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={st.modalHeader}>
                <View style={[st.modalIconBox, { backgroundColor: selectedDocType?.bg || C.g50 }]}>
                  <MaterialCommunityIcons name={selectedDocType?.icon || 'file-upload-outline'} size={rs(20)} color={selectedDocType?.color || C.g700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.modalTitle}>Upload Document</Text>
                  <Text style={st.modalSub}>{selectedDocType?.name}</Text>
                </View>
                <TouchableOpacity style={st.modalCloseBtn} onPress={() => setShowUploadModal(false)}>
                  <Icon name="x" size={rs(18)} color={C.sub} />
                </TouchableOpacity>
              </View>

              <View style={st.modalBody}>
                {/* Doc number input */}
                <View style={st.inputGroup}>
                  <Text style={st.inputLabel}>Document Number <Text style={st.inputOptional}>(Optional)</Text></Text>
                  <TextInput
                    style={st.input}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    placeholderTextColor={C.muted}
                    value={documentNumber}
                    onChangeText={setDocumentNumber}
                    autoCapitalize="characters"
                  />
                </View>

                {/* File picker */}
                <View style={st.inputGroup}>
                  <Text style={st.inputLabel}>File <Text style={{ color: C.red }}>*</Text></Text>
                  {selectedFile ? (
                    <View style={st.selectedFileBox}>
                      <View style={[st.selectedFileIcon, { backgroundColor: C.g50 }]}>
                        <MaterialCommunityIcons name="file-check-outline" size={rs(22)} color={C.g700} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
                        <Text style={st.selectedFileSize}>
                          {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '—'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedFile(null)}>
                        <Icon name="x-circle" size={rs(20)} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={st.sourceBtns}>
                      {[
                        { key: 'camera',   icon: 'camera-outline',  label: 'Camera',  color: C.g700,   bg: C.g50 },
                        { key: 'gallery',  icon: 'image-multiple-outline', label: 'Gallery', color: C.blue,   bg: C.blueL },
                        { key: 'document', icon: 'file-pdf-box',    label: 'Files',   color: C.purple, bg: C.purpleL },
                      ].map(s => (
                        <TouchableOpacity key={s.key} style={[st.sourceBtn, { borderColor: s.color + '40' }]} onPress={() => handleSelectFile(s.key)}>
                          <View style={[st.sourceBtnIcon, { backgroundColor: s.bg }]}>
                            <MaterialCommunityIcons name={s.icon} size={rs(22)} color={s.color} />
                          </View>
                          <Text style={[st.sourceBtnTxt, { color: s.color }]}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <Text style={st.fileHint}>PNG, JPG, WebP, or PDF · Max 5MB</Text>
                </View>

                {/* Actions */}
                <View style={st.modalActions}>
                  <TouchableOpacity style={st.cancelBtn} onPress={() => setShowUploadModal(false)}>
                    <Text style={st.cancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.submitWrap, (!selectedFile || !!uploading) && { opacity: 0.5 }]}
                    onPress={handleUpload}
                    disabled={!selectedFile || !!uploading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={G.emerald} style={st.submitBtn}>
                      {uploading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <MaterialCommunityIcons name="cloud-upload-outline" size={rs(18)} color="#fff" />
                            <Text style={st.submitTxt}>Upload</Text>
                          </>
                      }
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ───────── Sub-component ───────── */

function DocCard({ docType, uploaded, sm, onUpload, onDelete }) {
  return (
    <View
      style={[
        st.docCard,
        uploaded && { borderColor: sm.color + '30' },
      ]}
    >
      {uploaded && <View style={[st.docTopRail, { backgroundColor: sm.color }]} />}

      <View style={st.docBody}>
        <View style={st.docRow}>
          {/* Icon */}
          <View style={[st.docIconBox, { backgroundColor: uploaded ? docType.bg : C.bg }]}>
            <MaterialCommunityIcons
              name={uploaded ? docType.icon : 'file-upload-outline'}
              size={rs(20)}
              color={uploaded ? docType.color : C.muted}
            />
          </View>

          {/* Content */}
          <View style={st.docContent}>
            <View style={st.docTopRow}>
              <Text style={st.docName}>{docType.name}</Text>
              {docType.required && (
                <View style={st.requiredPill}>
                  <Text style={st.requiredTxt}>Required</Text>
                </View>
              )}
            </View>
            <Text style={st.docDesc}>{docType.description}</Text>
            {uploaded?.documentNumber && (
              <Text style={st.docNum}>#{uploaded.documentNumber}</Text>
            )}

            {/* Status + Actions */}
            <View style={st.docActions}>
              {uploaded ? (
                <>
                  <View style={[st.statusPill, { backgroundColor: sm.bg }]}>
                    <MaterialCommunityIcons name={sm.mcIcon} size={rs(12)} color={sm.color} />
                    <Text style={[st.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                  </View>
                  {uploaded.status !== 'APPROVED' && (
                    <TouchableOpacity style={st.deleteBtn} onPress={onDelete}>
                      <Icon name="trash-2" size={rs(14)} color={C.red} />
                      <Text style={st.deleteTxt}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity style={st.uploadBtn} onPress={onUpload}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={rs(14)} color={C.blue} />
                  <Text style={st.uploadBtnTxt}>Upload</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rejection reason */}
            {uploaded?.status === 'REJECTED' && uploaded.rejectionReason && (
              <View style={st.rejectionBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={rs(14)} color={C.red} />
                <Text style={st.rejectionTxt}>{uploaded.rejectionReason}</Text>
                <TouchableOpacity style={st.reuploadBtn} onPress={onUpload}>
                  <Text style={st.reuploadTxt}>Re-upload</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: GUT, paddingTop: rs(18) },

  /* ── Hero ── */
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute', top: -rs(60), right: -rs(40),
    width: rs(180), height: rs(180), borderRadius: rs(90),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  heroLoading:      { paddingBottom: rs(14), borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26), overflow: 'hidden' },
  heroLoadingInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUT, paddingTop: rs(14), gap: rs(12) },
  heroLoadingTitle: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: '800', color: '#fff' },

  heroBadge:   { flexDirection: 'row', alignItems: 'center', gap: rs(5), backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 20, marginTop: rs(10), marginBottom: rs(5) },
  heroBadgeTxt:{ fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '600', color: C.g400 },
  heroTitle:   { fontFamily: DISPLAY, fontSize: rf(24), fontWeight: '800', color: '#fff', marginBottom: rs(3) },
  heroSub:     { fontFamily: DISPLAY, fontSize: rf(13), color: 'rgba(255,255,255,0.6)' },

  /* ── Stats card tucked into the hero curve ── */
  statsWrap: { marginHorizontal: GUT, marginTop: -STATS_OVERLAP },
  statsCard: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: rs(16),
    paddingVertical: rs(12), paddingHorizontal: rs(6),
    borderWidth: 1, borderColor: T.glassBorder,
  },
  statCell:    { flex: 1, alignItems: 'center', gap: rs(2) },
  statValue:   { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800' },
  statLabel:   { fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: rs(2) },

  /* ── Banners ── */
  welcomeBanner: { marginTop: rs(4), borderRadius: rs(18), padding: rs(18), borderWidth: 1, borderColor: '#BFDBFE' },
  welcomeIconBox:{ width: rs(50), height: rs(50), borderRadius: rs(14), backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', marginBottom: rs(10), borderWidth: 1, borderColor: '#BFDBFE' },
  welcomeTitle:  { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800', color: C.text, marginBottom: rs(5) },
  welcomeText:   { fontSize: rf(13), color: C.sub, lineHeight: rf(20), marginBottom: rs(14) },
  stepsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(12), borderTopWidth: 1, borderTopColor: '#BFDBFE' },
  stepItem:      { alignItems: 'center', flex: 1 },
  stepBadge:     { width: rs(26), height: rs(26), borderRadius: rs(13), alignItems: 'center', justifyContent: 'center', marginBottom: rs(4) },
  stepNum:       { fontSize: rf(12), fontWeight: '800', color: '#fff' },
  stepTxt:       { fontSize: rf(10), color: C.sub, fontWeight: '600', textAlign: 'center' },

  statusBanner:      { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginTop: rs(4), borderRadius: rs(14), padding: rs(14), borderWidth: 1 },
  statusBannerIcon:  { width: rs(42), height: rs(42), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  statusBannerTitle: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', marginBottom: rs(2) },
  statusBannerSub:   { fontSize: rf(12), fontWeight: '500' },

  /* ── Section label ── */
  sectionLabelWrap: { marginTop: rs(18), marginBottom: rs(4) },
  sectionLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  sectionLabelIcon: { width: rs(30), height: rs(30), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  sectionLabelText: { flex: 1, fontFamily: DISPLAY, fontSize: rf(13), fontWeight: '700', color: C.text },
  sectionLabelBadge:{ fontSize: rf(12), fontWeight: '700', color: C.muted, backgroundColor: C.bg, paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(10) },
  sectionLabelBadgeText: { fontSize: rf(12), fontWeight: '700', color: C.muted },

  /* ── Doc card ── */
  docCard: {
    backgroundColor: C.card, borderRadius: rs(16), marginTop: rs(10),
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: rs(8), elevation: 2,
  },
  docTopRail: { height: rs(3), width: '100%' },
  docBody:    { padding: rs(14) },
  docRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12) },
  docIconBox: { width: rs(42), height: rs(42), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: rs(2) },
  docContent: { flex: 1 },
  docTopRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(3) },
  docName:    { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '700', color: C.text },
  requiredPill:{ backgroundColor: C.redL, paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: rs(8) },
  requiredTxt: { fontSize: rf(10), fontWeight: '700', color: C.red },
  docDesc:    { fontSize: rf(12), color: C.muted, marginBottom: rs(4) },
  docNum:     { fontSize: rf(11), color: C.sub, fontWeight: '600', marginBottom: rs(4) },

  docActions:  { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(6) },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 20 },
  statusTxt:   { fontSize: rf(11), fontWeight: '700' },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 20, backgroundColor: C.redL },
  deleteTxt:   { fontSize: rf(11), fontWeight: '700', color: C.red },
  uploadBtn:   { flexDirection: 'row', alignItems: 'center', gap: rs(5), paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: 20, backgroundColor: C.blueL, borderWidth: 1, borderColor: C.blue + '30' },
  uploadBtnTxt:{ fontSize: rf(12), fontWeight: '700', color: C.blue },

  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(8), padding: rs(10), backgroundColor: C.redL, borderRadius: rs(10), flexWrap: 'wrap' },
  rejectionTxt: { flex: 1, fontSize: rf(12), color: C.red, lineHeight: rf(18) },
  reuploadBtn:  { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(8), backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  reuploadTxt:  { fontSize: rf(11), fontWeight: '700', color: C.sub },

  /* ── Continue / Skip ── */
  continueWrap: { marginTop: rs(16), borderRadius: rs(16), overflow: 'hidden' },
  continueBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(16), gap: rs(8) },
  continueTxt:  { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff' },
  skipBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: rs(12), paddingVertical: rs(14), borderRadius: rs(14), borderWidth: 1, borderColor: C.border, backgroundColor: C.card, gap: rs(6) },
  skipTxt:      { fontSize: rf(13), fontWeight: '600', color: C.muted },

  /* ── Info note ── */
  infoNote:    { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), marginTop: rs(14), padding: rs(12), backgroundColor: C.blueL, borderRadius: rs(12) },
  infoNoteTxt: { flex: 1, fontSize: rf(12), color: C.blue, lineHeight: rf(18), fontWeight: '500' },

  /* ── Go to dashboard ── */
  goDashboardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    marginTop: rs(12), paddingVertical: rs(14),
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  goDashboardBtnTxt: { fontSize: rf(14), fontWeight: '700', color: C.text, letterSpacing: 0.2 },

  /* ── Loader ── */
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(10) },
  loaderTxt:  { fontSize: rf(14), color: C.muted },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '88%', overflow: 'hidden' },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle:     { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },

  modalHeader:  { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingHorizontal: rs(20), paddingTop: rs(14), paddingBottom: rs(16) },
  modalIconBox: { width: rs(42), height: rs(42), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  modalTitle:   { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800', color: C.text },
  modalSub:     { fontSize: rf(12), color: C.muted, marginTop: rs(1) },
  modalCloseBtn:{ width: rs(32), height: rs(32), borderRadius: rs(10), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { paddingHorizontal: rs(20), paddingBottom: rs(20) },

  inputGroup: { marginBottom: rs(18) },
  inputLabel: { fontSize: rf(13), fontWeight: '700', color: C.sub, marginBottom: rs(8), textTransform: 'uppercase', letterSpacing: 0.4 },
  inputOptional:{ fontSize: rf(11), fontWeight: '500', color: C.muted, textTransform: 'none' },
  input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: rs(14), paddingHorizontal: rs(14), paddingVertical: rs(13), fontSize: rf(14), color: C.text, backgroundColor: '#FAFBFC' },

  sourceBtns:   { flexDirection: 'row', gap: rs(10) },
  sourceBtn:    { flex: 1, alignItems: 'center', paddingVertical: rs(16), borderRadius: rs(14), borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: '#FAFBFC' },
  sourceBtnIcon:{ width: rs(44), height: rs(44), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', marginBottom: rs(6) },
  sourceBtnTxt: { fontSize: rf(12), fontWeight: '700' },
  fileHint:     { fontSize: rf(11), color: C.muted, textAlign: 'center', marginTop: rs(8) },

  selectedFileBox:  { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(12), borderWidth: 1.5, borderColor: C.g500 + '60', borderRadius: rs(14), backgroundColor: C.g50 },
  selectedFileIcon: { width: rs(42), height: rs(42), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  selectedFileName: { fontSize: rf(13), fontWeight: '700', color: C.text },
  selectedFileSize: { fontSize: rf(11), color: C.muted, marginTop: rs(2) },

  modalActions: { flexDirection: 'row', gap: rs(12), marginTop: rs(4) },
  cancelBtn:    { flex: 1, paddingVertical: rs(14), borderRadius: rs(14), borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelTxt:    { fontSize: rf(15), fontWeight: '700', color: C.sub },
  submitWrap:   { flex: 1, borderRadius: rs(14), overflow: 'hidden' },
  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(14), gap: rs(8) },
  submitTxt:    { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff' },
});
