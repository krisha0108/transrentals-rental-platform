// screens/vendor/documents/VendorDocumentsScreen.js
// Document upload screen matching web app flow
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import {
  getVendorDocuments,
  uploadVendorDocument,
  deleteVendorDocument,
  getStoredVendor,
} from '../../api/client';

const BRAND = {
  primary: '#1FC77A',
  primaryDark: '#12AD66',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
  error: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  green: '#10B981',
};

const DOCUMENT_TYPES = [
  { type: 'GST_CERTIFICATE', name: 'GST Certificate', required: true, description: 'GST registration certificate' },
  { type: 'PAN_CARD', name: 'PAN Card', required: true, description: 'Business or proprietor PAN' },
  { type: 'BUSINESS_REGISTRATION', name: 'Business Registration', required: false, description: 'Company registration certificate' },
  { type: 'ADDRESS_PROOF', name: 'Address Proof', required: true, description: 'Utility bill, rent agreement, etc.' },
  { type: 'CANCELLED_CHEQUE', name: 'Cancelled Cheque', required: false, description: 'For bank verification' },
  { type: 'OWNER_AADHAAR', name: 'Owner Aadhaar', required: false, description: 'Owner/proprietor Aadhaar card' },
];

export default function VendorDocumentsScreen({ navigation }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [vendor, setVendor] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await getVendorDocuments();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
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

  useEffect(() => {
    fetchDocuments();
    loadVendor();
  }, [fetchDocuments, loadVendor]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, [fetchDocuments]);

  const getDocumentByType = (type) => {
    return documents.find((doc) => doc.documentType === type);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />;
      case 'REJECTED':
        return <Ionicons name="alert-circle" size={20} color={BRAND.error} />;
      default:
        return <Ionicons name="time" size={20} color={BRAND.yellow} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const openUploadModal = (docType) => {
    setSelectedDocType(docType);
    setDocumentNumber('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleSelectFile = async (source) => {
    try {
      if (source === 'camera') {
        const result = await launchCamera({
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
        });

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert('Error', result.errorMessage || 'Failed to capture image');
          return;
        }

        const asset = result.assets?.[0];
        if (asset) {
          setSelectedFile({
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize,
          });
        }
      } else if (source === 'gallery') {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
        });

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert('Error', result.errorMessage || 'Failed to select image');
          return;
        }

        const asset = result.assets?.[0];
        if (asset) {
          setSelectedFile({
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            size: asset.fileSize,
          });
        }
      } else if (source === 'document') {
        const [result] = await pick({
          type: [types.pdf, types.images],
        });

        if (result) {
          // Check file size (max 5MB)
          if (result.size > 5 * 1024 * 1024) {
            Alert.alert('Error', 'File size must be less than 5MB');
            return;
          }
          setSelectedFile({
            uri: result.uri,
            name: result.name,
            type: result.type,
            size: result.size,
          });
        }
      }
    } catch (error) {
      // New picker throws error with code for cancel
      if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('File selection error:', error);
        Alert.alert('Error', 'Failed to select file');
      }
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
      if (documentNumber.trim()) {
        formData.append('documentNumber', documentNumber.trim());
      }

      await uploadVendorDocument(formData);

      setShowUploadModal(false);
      setSelectedFile(null);
      setDocumentNumber('');
      fetchDocuments();

      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVendorDocument(docId);
              fetchDocuments();
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const allRequiredUploaded = DOCUMENT_TYPES
    .filter((dt) => dt.required)
    .every((dt) => getDocumentByType(dt.type));

  const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;
  const pendingCount = documents.filter((d) => d.status === 'PENDING').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

  const handleContinue = () => {
    if (vendor?.status === 'DOCUMENTS_PENDING' || vendor?.status === 'PENDING_APPROVAL') {
      navigation.navigate('VendorServices');
    } else {
      navigation.navigate('VendorDashboard');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Business Documents</Text>
            <Text style={styles.headerSubtitle}>
              {documents.length === 0
                ? 'Step 1: Upload your business documents for verification'
                : 'Upload your documents for verification'}
            </Text>
          </View>
        </View>

        {/* First Time Welcome Banner */}
        {documents.length === 0 && (
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="rocket" size={32} color={BRAND.blue} />
            </View>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome to TransRentals!</Text>
              <Text style={styles.welcomeText}>
                Let's get you started. Upload your business documents to verify your account and start receiving bookings.
              </Text>
              <View style={styles.welcomeSteps}>
                <View style={styles.welcomeStepItem}>
                  <View style={styles.welcomeStepBadge}>
                    <Text style={styles.welcomeStepNumber}>1</Text>
                  </View>
                  <Text style={styles.welcomeStepText}>Upload Documents</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={BRAND.subText} />
                <View style={styles.welcomeStepItem}>
                  <View style={[styles.welcomeStepBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.welcomeStepNumber}>2</Text>
                  </View>
                  <Text style={styles.welcomeStepText}>Select Services</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={BRAND.subText} />
                <View style={styles.welcomeStepItem}>
                  <View style={[styles.welcomeStepBadge, { backgroundColor: '#E5E7EB' }]}>
                    <Text style={styles.welcomeStepNumber}>3</Text>
                  </View>
                  <Text style={styles.welcomeStepText}>Add Locations</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Document Status</Text>
            <View style={[styles.statusBadge, allRequiredUploaded ? styles.statusBadgeGreen : styles.statusBadgeYellow]}>
              <Text style={[styles.statusBadgeText, allRequiredUploaded ? styles.statusTextGreen : styles.statusTextYellow]}>
                {allRequiredUploaded ? 'All Required Uploaded' : 'Documents Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{documents.length}</Text>
              <Text style={styles.statLabel}>Uploaded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: BRAND.green }]}>{approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: BRAND.yellow }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: BRAND.error }]}>{rejectedCount}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Document List */}
        <View style={styles.docListCard}>
          <View style={styles.docListHeader}>
            <Ionicons name="document-text-outline" size={20} color={BRAND.ink} />
            <Text style={styles.docListTitle}>Required Documents</Text>
          </View>

          {DOCUMENT_TYPES.map((docType) => {
            const uploadedDoc = getDocumentByType(docType.type);
            const statusColors = uploadedDoc ? getStatusColor(uploadedDoc.status) : null;

            return (
              <View key={docType.type} style={styles.docItem}>
                <View style={styles.docItemLeft}>
                  <View style={[styles.docIcon, uploadedDoc && styles.docIconUploaded]}>
                    <Ionicons
                      name="document-text"
                      size={24}
                      color={uploadedDoc ? BRAND.blue : BRAND.subText}
                    />
                  </View>
                  <View style={styles.docInfo}>
                    <View style={styles.docNameRow}>
                      <Text style={styles.docName}>{docType.name}</Text>
                      {docType.required && <Text style={styles.requiredBadge}>*Required</Text>}
                    </View>
                    <Text style={styles.docDescription}>{docType.description}</Text>
                    {uploadedDoc?.documentNumber && (
                      <Text style={styles.docNumber}>Number: {uploadedDoc.documentNumber}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.docItemRight}>
                  {uploadedDoc ? (
                    <>
                      <View style={[styles.statusPill, { backgroundColor: statusColors?.bg }]}>
                        {getStatusIcon(uploadedDoc.status)}
                        <Text style={[styles.statusText, { color: statusColors?.text }]}>
                          {uploadedDoc.status}
                        </Text>
                      </View>
                      {uploadedDoc.status !== 'APPROVED' && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDelete(uploadedDoc.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color={BRAND.error} />
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => openUploadModal(docType)}
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color={BRAND.blue} />
                      <Text style={styles.uploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {uploadedDoc?.status === 'REJECTED' && uploadedDoc.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Ionicons name="alert-circle" size={16} color={BRAND.error} />
                    <Text style={styles.rejectionText}>
                      <Text style={styles.rejectionLabel}>Rejection Reason: </Text>
                      {uploadedDoc.rejectionReason}
                    </Text>
                    <TouchableOpacity
                      style={styles.reuploadBtn}
                      onPress={() => openUploadModal(docType)}
                    >
                      <Text style={styles.reuploadBtnText}>Re-upload</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Continue Button */}
        {allRequiredUploaded ? (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue to Services</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : documents.length > 0 ? (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue to Services</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.skipBtn} onPress={handleContinue}>
            <Text style={styles.skipBtnText}>Skip for now (You can upload documents later)</Text>
            <Ionicons name="arrow-forward" size={18} color={BRAND.subText} />
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={BRAND.blue} />
          <Text style={styles.infoText}>
            {allRequiredUploaded
              ? 'All required documents uploaded! Documents will be verified within 24-48 hours.'
              : 'Upload all required documents to proceed. Documents will be verified within 24-48 hours.'}
          </Text>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Upload {selectedDocType?.name}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowUploadModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            {/* Document Number Input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Document Number (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 22AAAAA0000A1Z5"
                placeholderTextColor="#A3B3C2"
                value={documentNumber}
                onChangeText={setDocumentNumber}
                autoCapitalize="characters"
              />
            </View>

            {/* File Selection */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Upload File *</Text>

              {selectedFile ? (
                <View style={styles.selectedFileBox}>
                  <View style={styles.selectedFileInfo}>
                    <Ionicons name="document" size={32} color={BRAND.blue} />
                    <View style={styles.selectedFileDetails}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.selectedFileSize}>
                        {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileBtn}
                    onPress={() => setSelectedFile(null)}
                  >
                    <Ionicons name="close-circle" size={24} color={BRAND.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.fileSourceOptions}>
                  <TouchableOpacity
                    style={styles.fileSourceBtn}
                    onPress={() => handleSelectFile('camera')}
                  >
                    <Ionicons name="camera" size={24} color={BRAND.blue} />
                    <Text style={styles.fileSourceText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fileSourceBtn}
                    onPress={() => handleSelectFile('gallery')}
                  >
                    <Ionicons name="images" size={24} color={BRAND.blue} />
                    <Text style={styles.fileSourceText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fileSourceBtn}
                    onPress={() => handleSelectFile('document')}
                  >
                    <Ionicons name="document" size={24} color={BRAND.blue} />
                    <Text style={styles.fileSourceText}>Files</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.fileHint}>PNG, JPG, WebP, or PDF (max 5MB)</Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, !selectedFile && styles.submitBtnDisabled]}
                onPress={handleUpload}
                disabled={!selectedFile || !!uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: BRAND.subText,
  },

  // Header
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 4,
  },

  // Welcome Banner
  welcomeBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: BRAND.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  welcomeSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  welcomeStepItem: {
    alignItems: 'center',
    flex: 1,
  },
  welcomeStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  welcomeStepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  welcomeStepText: {
    fontSize: 11,
    color: BRAND.text,
    textAlign: 'center',
  },

  // Progress Card
  progressCard: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextGreen: {
    color: '#059669',
  },
  statusTextYellow: {
    color: '#D97706',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.blue,
  },
  statLabel: {
    fontSize: 12,
    color: BRAND.subText,
    marginTop: 2,
  },

  // Document List
  docListCard: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 16,
  },
  docListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    gap: 8,
  },
  docListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.ink,
  },
  docItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  docItemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIconUploaded: {
    backgroundColor: '#EFF6FF',
  },
  docInfo: {
    flex: 1,
  },
  docNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  docName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.ink,
  },
  requiredBadge: {
    fontSize: 11,
    color: BRAND.error,
    fontWeight: '600',
  },
  docDescription: {
    fontSize: 13,
    color: BRAND.subText,
  },
  docNumber: {
    fontSize: 12,
    color: BRAND.subText,
    marginTop: 4,
  },
  docItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.blue,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.blue,
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.error,
  },
  rejectionLabel: {
    fontWeight: '700',
  },
  reuploadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: BRAND.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  reuploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.text,
  },

  // Continue Button
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Skip Button
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.subText,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.text,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.ink,
  },
  modalClose: {
    padding: 4,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: BRAND.ink,
    backgroundColor: '#FBFDFF',
  },
  fileSourceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  fileSourceBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BRAND.border,
    borderRadius: 12,
    backgroundColor: '#FBFDFF',
  },
  fileSourceText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.text,
  },
  fileHint: {
    marginTop: 8,
    fontSize: 12,
    color: BRAND.subText,
    textAlign: 'center',
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
  },
  selectedFileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedFileDetails: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.ink,
  },
  selectedFileSize: {
    fontSize: 12,
    color: BRAND.subText,
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.text,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND.blue,
    gap: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
