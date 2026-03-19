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
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import { showError, showConfirm, showSuccess } from '../../../services/alertService';
import {
  getVendorDocuments, uploadVendorDocument,
  deleteVendorDocument, getStoredVendor,
} from '../../api/client';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

const DOCUMENT_TYPES = [
  { type: 'GST_CERTIFICATE',      name: 'GST Certificate',       required: true,  description: 'GST registration certificate',      icon: 'file-certificate-outline', color: C.g700,   bg: C.g50 },
  { type: 'PAN_CARD',             name: 'PAN Card',              required: true,  description: 'Business or proprietor PAN',         icon: 'card-account-details-outline', color: C.blue,   bg: C.blueL },
  { type: 'BUSINESS_REGISTRATION',name: 'Business Registration', required: false, description: 'Company registration certificate',    icon: 'domain',                   color: C.indigo, bg: C.indigoL },
  { type: 'ADDRESS_PROOF',        name: 'Address Proof',         required: true,  description: 'Utility bill, rent agreement, etc.', icon: 'map-marker-outline',       color: C.orange, bg: C.orangeL },
  { type: 'CANCELLED_CHEQUE',     name: 'Cancelled Cheque',      required: false, description: 'For bank verification',              icon: 'bank-outline',             color: C.purple, bg: C.purpleL },
  { type: 'OWNER_AADHAAR',        name: 'Owner Aadhaar',         required: false, description: 'Owner/proprietor Aadhaar card',      icon: 'shield-account-outline',   color: C.amber,  bg: C.amberL },
];

const STATUS_META = {
  APPROVED: { label: 'Approved', color: C.g700,  bg: C.g50,   icon: 'check-circle',        mcIcon: 'check-decagram' },
  REJECTED: { label: 'Rejected', color: C.red,   bg: C.redL,  icon: 'x-circle',            mcIcon: 'close-circle-outline' },
  PENDING:  { label: 'Pending',  color: C.amber, bg: C.amberL,icon: 'clock',               mcIcon: 'timer-sand' },
};

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
      <SafeAreaView style={st.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.heroTitle}>Documents</Text>
          <View style={{ width: 38 }} />
        </LinearGradient>
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {/* ── HERO ── */}
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
          <View style={[st.blob, { width: 180, height: 180, top: -70, right: -50, opacity: 0.07 }]} />
          <View style={[st.blob, { width: 80, height: 80, bottom: 5, left: -20, opacity: 0.05 }]} />

          <View style={st.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={st.heroMid}>
              <View style={st.heroBadge}>
                <MaterialCommunityIcons name="file-document-multiple-outline" size={11} color={C.g400} />
                <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
              </View>
              <Text style={st.heroTitle}>Business Documents</Text>
              <Text style={st.heroSub}>Upload & manage your verification documents</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          {/* Stats strip */}
          <View style={st.statsStrip}>
            {[
              { value: uploadedCount, label: 'Uploaded',  color: '#fff' },
              { value: approvedCount, label: 'Approved',  color: C.g400 },
              { value: pendingCount,  label: 'Pending',   color: '#FCD34D' },
              { value: rejectedCount, label: 'Rejected',  color: '#FCA5A5' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={st.statsDivider} />}
                <View style={st.statItem}>
                  <Text style={[st.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={st.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* ── STATUS BANNER ── */}
        {documents.length === 0 ? (
          <LinearGradient colors={[C.blueL, '#DBEAFE']} style={st.welcomeBanner}>
            <View style={st.welcomeIconBox}>
              <MaterialCommunityIcons name="rocket-launch-outline" size={28} color={C.blue} />
            </View>
            <Text style={st.welcomeTitle}>Welcome to TransRentals!</Text>
            <Text style={st.welcomeText}>Upload your business documents to verify your account and start receiving bookings.</Text>
            <View style={st.stepsRow}>
              {['Upload Docs', 'Select Services', 'Add Locations'].map((step, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <MaterialCommunityIcons name="chevron-right" size={16} color={C.blue + '80'} />}
                  <View style={st.stepItem}>
                    <LinearGradient colors={i === 0 ? [C.g700, C.g500] : ['#CBD5E1', '#CBD5E1']} style={st.stepBadge}>
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
              <MaterialCommunityIcons name="check-decagram" size={22} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.statusBannerTitle, { color: C.g700 }]}>All Required Documents Uploaded</Text>
              <Text style={[st.statusBannerSub, { color: C.g600 }]}>Documents will be verified within 24–48 hours.</Text>
            </View>
          </View>
        ) : (
          <View style={[st.statusBanner, { backgroundColor: C.amberL, borderColor: '#FDE68A' }]}>
            <View style={[st.statusBannerIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="timer-sand" size={22} color={C.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.statusBannerTitle, { color: C.amber }]}>Documents Pending</Text>
              <Text style={[st.statusBannerSub, { color: C.amber + 'BB' }]}>Upload all required (*) documents to proceed.</Text>
            </View>
          </View>
        )}

        {/* ── DOCUMENT LIST ── */}
        <View style={st.section}>
          <View style={st.sectionHead}>
            <View style={[st.sectionIconBox, { backgroundColor: C.indigoL }]}>
              <MaterialCommunityIcons name="file-document-multiple-outline" size={18} color={C.indigo} />
            </View>
            <Text style={st.sectionTitle}>Required Documents</Text>
            <Text style={st.sectionCount}>{uploadedCount}/{DOCUMENT_TYPES.length}</Text>
          </View>

          {DOCUMENT_TYPES.map((docType, idx) => {
            const uploaded = getDocumentByType(docType.type);
            const sm = uploaded ? (STATUS_META[uploaded.status] || STATUS_META.PENDING) : null;
            const isLast = idx === DOCUMENT_TYPES.length - 1;

            return (
              <View key={docType.type} style={[st.docRow, isLast && { borderBottomWidth: 0 }]}>
                {/* Icon */}
                <View style={[st.docIconBox, { backgroundColor: uploaded ? docType.bg : C.bg }]}>
                  <MaterialCommunityIcons
                    name={uploaded ? docType.icon : 'file-upload-outline'}
                    size={20}
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
                          <MaterialCommunityIcons name={sm.mcIcon} size={12} color={sm.color} />
                          <Text style={[st.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                        </View>
                        {uploaded.status !== 'APPROVED' && (
                          <TouchableOpacity style={st.deleteBtn} onPress={() => handleDelete(uploaded.id)}>
                            <Icon name="trash-2" size={14} color={C.red} />
                            <Text style={st.deleteTxt}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : (
                      <TouchableOpacity style={st.uploadBtn} onPress={() => openUploadModal(docType)}>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={14} color={C.blue} />
                        <Text style={st.uploadBtnTxt}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Rejection reason */}
                  {uploaded?.status === 'REJECTED' && uploaded.rejectionReason && (
                    <View style={st.rejectionBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={14} color={C.red} />
                      <Text style={st.rejectionTxt}>{uploaded.rejectionReason}</Text>
                      <TouchableOpacity style={st.reuploadBtn} onPress={() => openUploadModal(docType)}>
                        <Text style={st.reuploadTxt}>Re-upload</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── CONTINUE / SKIP ── */}
        {documents.length > 0 ? (
          <TouchableOpacity onPress={handleContinue} style={st.continueWrap} activeOpacity={0.85}>
            <LinearGradient colors={[C.g700, C.g500]} style={st.continueBtn}>
              <Text style={st.continueTxt}>Continue to Services</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={st.skipBtn} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={st.skipTxt}>Skip for now — upload documents later</Text>
            <Icon name="chevron-right" size={16} color={C.muted} />
          </TouchableOpacity>
        )}

        {/* ── INFO NOTE ── */}
        <View style={st.infoNote}>
          <MaterialCommunityIcons name="information-outline" size={16} color={C.blue} />
          <Text style={st.infoNoteTxt}>
            {allRequiredUploaded
              ? 'All required documents uploaded! Verification takes 24–48 hours.'
              : 'Upload all required documents marked * to proceed. Verification takes 24–48 hours.'}
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── UPLOAD MODAL ── */}
      <Modal visible={showUploadModal} animationType="slide" transparent onRequestClose={() => setShowUploadModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            {/* Handle */}
            <View style={st.modalHandle} />

            {/* Header */}
            <View style={st.modalHeader}>
              <View style={[st.modalIconBox, { backgroundColor: selectedDocType?.bg || C.g50 }]}>
                <MaterialCommunityIcons name={selectedDocType?.icon || 'file-upload-outline'} size={20} color={selectedDocType?.color || C.g700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.modalTitle}>Upload Document</Text>
                <Text style={st.modalSub}>{selectedDocType?.name}</Text>
              </View>
              <TouchableOpacity style={st.modalCloseBtn} onPress={() => setShowUploadModal(false)}>
                <Icon name="x" size={18} color={C.sub} />
              </TouchableOpacity>
            </View>

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
                    <MaterialCommunityIcons name="file-check-outline" size={22} color={C.g700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
                    <Text style={st.selectedFileSize}>
                      {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '—'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <Icon name="x-circle" size={20} color={C.red} />
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
                        <MaterialCommunityIcons name={s.icon} size={22} color={s.color} />
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
                <LinearGradient colors={[C.g700, C.g500]} style={st.submitBtn}>
                  {uploading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <MaterialCommunityIcons name="cloud-upload-outline" size={18} color="#fff" />
                        <Text style={st.submitTxt}>Upload</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 20 },

  /* ── Hero ── */
  hero:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  heroLoading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 12 },
  blob:        { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroNav:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 2 },
  heroMid:     { flex: 1 },
  heroBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 5 },
  heroBadgeTxt:{ fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle:   { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  /* Stats strip */
  statsStrip:  { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  statsDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },

  /* ── Banners ── */
  welcomeBanner: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#BFDBFE' },
  welcomeIconBox:{ width: 50, height: 50, borderRadius: 14, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  welcomeTitle:  { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 5 },
  welcomeText:   { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 14 },
  stepsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#BFDBFE' },
  stepItem:      { alignItems: 'center', flex: 1 },
  stepBadge:     { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepNum:       { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepTxt:       { fontSize: 10, color: C.sub, fontWeight: '600', textAlign: 'center' },

  statusBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 14, borderWidth: 1 },
  statusBannerIcon:  { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  statusBannerSub:   { fontSize: 12, fontWeight: '500' },

  /* ── Section ── */
  section:       { backgroundColor: C.card, marginHorizontal: 16, marginTop: 14, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionHead:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#FAFBFC' },
  sectionIconBox:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  sectionCount:  { fontSize: 12, fontWeight: '700', color: C.muted, backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

  /* Doc row */
  docRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  docIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  docContent: { flex: 1 },
  docTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  docName:    { fontSize: 14, fontWeight: '700', color: C.text },
  requiredPill:{ backgroundColor: C.redL, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  requiredTxt: { fontSize: 10, fontWeight: '700', color: C.red },
  docDesc:    { fontSize: 12, color: C.muted, marginBottom: 4 },
  docNum:     { fontSize: 11, color: C.sub, fontWeight: '600', marginBottom: 4 },

  docActions:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: C.redL },
  deleteTxt:   { fontSize: 11, fontWeight: '700', color: C.red },
  uploadBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: C.blueL, borderWidth: 1, borderColor: C.blue + '30' },
  uploadBtnTxt:{ fontSize: 12, fontWeight: '700', color: C.blue },

  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, padding: 10, backgroundColor: C.redL, borderRadius: 10, flexWrap: 'wrap' },
  rejectionTxt: { flex: 1, fontSize: 12, color: C.red, lineHeight: 18 },
  reuploadBtn:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  reuploadTxt:  { fontSize: 11, fontWeight: '700', color: C.sub },

  /* ── Continue / Skip ── */
  continueWrap: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  continueBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  skipBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, gap: 6 },
  skipTxt:      { fontSize: 13, fontWeight: '600', color: C.muted },

  /* ── Info note ── */
  infoNote:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 14, padding: 12, backgroundColor: C.blueL, borderRadius: 12 },
  infoNoteTxt: { flex: 1, fontSize: 12, color: C.blue, lineHeight: 18, fontWeight: '500' },

  /* ── Loader ── */
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderTxt:  { fontSize: 14, color: C.muted },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 12 },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle:   { fontSize: 16, fontWeight: '800', color: C.text },
  modalSub:     { fontSize: 12, color: C.muted, marginTop: 1 },
  modalCloseBtn:{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputOptional:{ fontSize: 11, fontWeight: '500', color: C.muted, textTransform: 'none' },
  input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.text, backgroundColor: '#FAFBFC' },

  sourceBtns:   { flexDirection: 'row', gap: 10 },
  sourceBtn:    { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: '#FAFBFC' },
  sourceBtnIcon:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sourceBtnTxt: { fontSize: 12, fontWeight: '700' },
  fileHint:     { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8 },

  selectedFileBox:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1.5, borderColor: C.g500 + '60', borderRadius: 14, backgroundColor: C.g50 },
  selectedFileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectedFileName: { fontSize: 13, fontWeight: '700', color: C.text },
  selectedFileSize: { fontSize: 11, color: C.muted, marginTop: 2 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelTxt:    { fontSize: 15, fontWeight: '700', color: C.sub },
  submitWrap:   { flex: 1, borderRadius: 14, overflow: 'hidden' },
  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  submitTxt:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
