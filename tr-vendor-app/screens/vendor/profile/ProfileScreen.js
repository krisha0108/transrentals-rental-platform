import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVendorProfile, logoutVendor, uploadVendorLogo, getBaseURL } from '../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  card: '#F9FAFB',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444',
};

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [baseURL, setBaseURL] = useState('');

  // Get base URL on mount
  useEffect(() => {
    const loadBaseURL = async () => {
      const url = await getBaseURL();
      setBaseURL(url);
    };
    loadBaseURL();
  }, []);

  // Helper to get full image URL
  const getFullImageURL = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url; // Already full URL
    // Only prepend baseURL if it's loaded
    if (!baseURL) return null;
    return `${baseURL}${url}`; // Prepend baseURL for relative paths
  };

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getVendorProfile();
      console.log('[Profile] Fetched profile, logo:', data?.logo);
      setProfile(data);
    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleUpdateProfileImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showError(result.errorMessage || 'Failed to pick image');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        showError('No image selected');
        return;
      }

      // Validate file size (max 5MB)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      setUploading(true);

      console.log('[ProfileScreen] Starting upload process...');
      console.log('[ProfileScreen] Asset details:', {
        uri: asset.uri,
        type: asset.type,
        size: asset.fileSize,
        name: asset.fileName,
      });

      // Create FormData
      const formData = new FormData();

      // For Android, ensure proper file URI format
      const fileUri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');

      formData.append('logo', {
        uri: fileUri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `logo-${Date.now()}.jpg`,
      });

      console.log('[ProfileScreen] FormData created with file URI:', fileUri);

      // Upload
      const response = await uploadVendorLogo(formData);

      if (response.success) {
        // Update local profile with new logo
        setProfile({ ...profile, logo: response.logo });
        showSuccess('Profile image updated successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError(error?.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', async () => {
            try {
              await logoutVendor();
              navigation.reset({
                index: 0,
                routes: [{ name: 'VendorLoginScreen' }],
              });
            } catch (error) {
              console.log('Logout error:', error);
            }
          }, { confirmText: 'Logout', destructive: true });
  };

  const profileMenuItems = [
    {
      section: 'Account',
      items: [
        { name: 'Business Profile', icon: 'briefcase', route: 'BusinessProfileScreen' },
        { name: 'Documents', icon: 'file-text', route: 'VendorDocuments' },
        { name: 'Bank Details', icon: 'credit-card', route: 'BankDetailsScreen' },
      ],
    },
    {
      section: 'Services',
      items: [
        { name: 'My Services', icon: 'layers', route: 'VendorServices' },
        { name: 'My Locations', icon: 'map-pin', route: 'VendorLocations' },
      ],
    },
    {
      section: 'Support',
      items: [
        { name: 'Help & Support', icon: 'help-circle', route: 'HelpSupportScreen' },
        { name: 'About Us', icon: 'info', route: 'AboutUsScreen' },
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'DOCUMENTS_PENDING':
      case 'PENDING':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'UNDER_REVIEW':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      default:
        return { bg: '#FEE2E2', text: '#991B1B' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(profile?.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.logo ? (
              <Image
                key={profile.logo} // Force re-render when logo changes
                source={{ uri: getFullImageURL(profile.logo) }}
                style={styles.avatar}
                onError={(e) => {
                  console.log('[Profile] Image load error:', e.nativeEvent.error);
                  console.log('[Profile] Image URL:', getFullImageURL(profile.logo));
                  console.log('[Profile] baseURL:', baseURL);
                }}
                onLoad={() => {
                  console.log('[Profile] Image loaded successfully:', getFullImageURL(profile.logo));
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="building" size={32} color={C.brand} />
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={handleUpdateProfileImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="camera" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.businessName}>{profile?.businessName || 'Business Name'}</Text>
          <Text style={styles.ownerName}>{profile?.ownerName || 'Owner Name'}</Text>

          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {profile?.status?.replace(/_/g, ' ') || 'PENDING'}
            </Text>
          </View>

          {/* Contact Info */}
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Icon name="mail" size={14} color={C.muted} />
              <Text style={styles.contactText}>{profile?.email || 'email@example.com'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="phone" size={14} color={C.muted} />
              <Text style={styles.contactText}>{profile?.phone || '+91 XXXXXXXXXX'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.fleetsCount || 0}</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.approvedServicesCount || 0}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.approvedLocationsCount || 0}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '--'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {profileMenuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => item.route && navigation.navigate(item.route)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Icon name={item.icon} size={18} color={C.brand} />
                    </View>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={C.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={18} color={C.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 14,
    color: C.muted,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactRow: {
    marginTop: 16,
    width: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: C.muted,
    marginLeft: 8,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
  statLabel: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },

  // Menu Section
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.red,
    marginLeft: 8,
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: C.muted,
    marginTop: 16,
  },
});
