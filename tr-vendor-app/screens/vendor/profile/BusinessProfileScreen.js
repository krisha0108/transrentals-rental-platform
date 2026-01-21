import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorProfile, getBaseURL } from '../../api/client';

const BRAND = {
  primary: '#22C55E',
  blue: '#3B82F6',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
};

export default function BusinessProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    if (url.startsWith('http')) return url;
    // Only prepend baseURL if it's loaded
    if (!baseURL) return null;
    return `${baseURL}${url}`;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getVendorProfile();
      console.log('[Business Profile] Fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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

  // Info row component for displaying data
  const InfoRow = ({ icon, label, value, iconColor = BRAND.primary }) => {
    if (!value) return null;

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <View style={[styles.infoIcon, { backgroundColor: iconColor + '15' }]}>
            <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
          </View>
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={BRAND.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={BRAND.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Business Logo */}
        {profile?.logo && (
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                key={profile.logo} // Force re-render when logo changes
                source={{ uri: getFullImageURL(profile.logo) }}
                style={styles.logo}
                resizeMode="contain"
                onError={(e) => {
                  console.log('[BusinessProfile] Image load error:', e.nativeEvent.error);
                  console.log('[BusinessProfile] Image URL:', getFullImageURL(profile.logo));
                  console.log('[BusinessProfile] baseURL:', baseURL);
                }}
                onLoad={() => {
                  console.log('[BusinessProfile] Image loaded successfully:', getFullImageURL(profile.logo));
                }}
              />
            </View>
            <Text style={styles.logoLabel}>Business Logo</Text>
          </View>
        )}

        {/* Business Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="office-building" size={20} color={BRAND.blue} />
            </View>
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>

          <InfoRow icon="office-building" label="Business Name" value={profile?.businessName} iconColor={BRAND.primary} />
          <InfoRow icon="briefcase" label="Business Type" value={profile?.businessType} iconColor={BRAND.blue} />
          <InfoRow icon="file-document" label="GST Number" value={profile?.gstNumber} iconColor={BRAND.primary} />
          <InfoRow icon="card-account-details" label="PAN Number" value={profile?.panNumber} iconColor={BRAND.blue} />
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="account" size={20} color={BRAND.primary} />
            </View>
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <InfoRow icon="account" label="Owner Name" value={profile?.ownerName} iconColor={BRAND.primary} />
          <InfoRow icon="email" label="Email" value={profile?.email} iconColor={BRAND.blue} />
          <InfoRow icon="phone" label="Phone" value={profile?.phone} iconColor={BRAND.primary} />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <MaterialCommunityIcons name="map-marker" size={20} color={BRAND.blue} />
            </View>
            <Text style={styles.sectionTitle}>Business Address</Text>
          </View>

          {profile?.address && (
            <View style={styles.fullWidthInfo}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIcon, { backgroundColor: BRAND.blue + '15' }]}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={BRAND.blue} />
                </View>
                <Text style={styles.infoLabel}>Address</Text>
              </View>
              <Text style={styles.fullWidthValue}>{profile.address}</Text>
            </View>
          )}

          <View style={styles.locationRow}>
            {profile?.city && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>City</Text>
                <Text style={styles.locationValue}>{profile.city}</Text>
              </View>
            )}
            {profile?.pincode && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Pincode</Text>
                <Text style={styles.locationValue}>{profile.pincode}</Text>
              </View>
            )}
          </View>

          <InfoRow icon="map" label="State" value={profile?.state} iconColor={BRAND.blue} />
        </View>

        {/* Additional Info */}
        {(profile?.website || profile?.description) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <MaterialCommunityIcons name="information" size={20} color={BRAND.primary} />
              </View>
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>

            <InfoRow icon="web" label="Website" value={profile?.website} iconColor={BRAND.blue} />

            {profile?.description && (
              <View style={styles.fullWidthInfo}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: BRAND.primary + '15' }]}>
                    <MaterialCommunityIcons name="text" size={18} color={BRAND.primary} />
                  </View>
                  <Text style={styles.infoLabel}>Description</Text>
                </View>
                <Text style={styles.fullWidthValue}>{profile.description}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  logoSection: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BRAND.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BRAND.primary + '30',
    marginBottom: 12,
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.text,
  },

  section: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    flex: 1,
  },

  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border + '50',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.subText,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.ink,
    textAlign: 'right',
    flex: 1,
  },

  // Full width info (for address, description)
  fullWidthInfo: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border + '50',
  },
  fullWidthValue: {
    fontSize: 14,
    color: BRAND.text,
    lineHeight: 20,
    marginTop: 8,
    marginLeft: 42,
  },

  // Location Row
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border + '50',
  },
  locationItem: {
    flex: 1,
    backgroundColor: BRAND.bg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: BRAND.subText,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.ink,
  },
});
