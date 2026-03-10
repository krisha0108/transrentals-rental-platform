import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, deleteStaff, debugAuthState } from '../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

const getRoleColor = (role) => {
  switch (role?.toLowerCase()) {
    case 'driver':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'manager':
      return { bg: '#F3E8FF', text: '#7C3AED' };
    case 'helper':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'accountant':
      return { bg: '#DCFCE7', text: '#166534' };
    default:
      return { bg: '#F3F4F6', text: '#374151' };
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: '#DCFCE7', text: '#166534' };
    case 'on_leave':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'inactive':
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#F3F4F6', text: '#374151' };
  }
};

export default function StaffDetailScreen({ route, navigation }) {
  const { staffId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);

  const fetchStaff = useCallback(async () => {
    if (!staffId) return;

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        console.log(`[StaffDetail] Fetching staff (attempt ${retries + 1}/${maxRetries + 1}):`, staffId);

        // Debug auth state before request
        if (retries === 0) {
          await debugAuthState();
        }

        const response = await apiGet(`/vendor/staff/${staffId}`);
        console.log('[StaffDetail] ✅ Response received successfully');
        setStaff(response.data?.staff || response.data);
        setLoading(false);
        return; // Success, exit
      } catch (error) {
        console.error(`[StaffDetail] ❌ Attempt ${retries + 1} failed:`, error?.response?.status, error?.response?.data);

        if (error?.response?.status === 401 && retries < maxRetries) {
          retries++;
          console.log(`[StaffDetail] Retrying in 500ms...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Max retries reached or non-401 error
        showError(error?.response?.status === 401
            ? 'You do not have permission to view this staff member. This staff might belong to another vendor.'
            : 'Failed to load staff details. Please try again.');
        setLoading(false);
        return;
      }
    }
  }, [staffId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = () => {
    showConfirm('Delete Staff', 'Are you sure you want to delete this staff member?', async () => {
          try {
            await deleteStaff(staffId);
            navigation.goBack();
          } catch (error) {
            showError('Failed to delete staff');
          }
        }, { confirmText: 'Delete', destructive: true });
  };

  const handleCall = () => {
    if (staff?.phone) {
      const url = `tel:${staff.phone}`;
      import('react-native').then(({ Linking }) => {
        Linking.openURL(url);
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Staff not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleColors = getRoleColor(staff.role);
  const statusColors = getStatusColor(staff.status);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Details</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={handleDelete}>
          <Icon name="trash-2" size={18} color={C.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {staff.photo ? (
              <Image source={{ uri: staff.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="user" size={36} color={C.muted} />
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
          </View>

          <Text style={styles.staffName}>{staff.name}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: roleColors.bg }]}>
              <Text style={[styles.badgeText, { color: roleColors.text }]}>
                {staff.role?.replace(/_/g, ' ') || 'N/A'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.text }]}>
                {staff.status?.replace(/_/g, ' ') || 'Active'}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Icon name="phone" size={20} color={C.brand} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddStaffScreen', { staffId, staff })}
            >
              <Icon name="edit-2" size={20} color={C.blue} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Icon name="phone" size={16} color={C.brand} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{staff.phone || '--'}</Text>
            </View>
          </View>

          {staff.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Icon name="mail" size={16} color={C.blue} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{staff.email}</Text>
              </View>
            </View>
          )}

          {(staff.address || staff.city || staff.state) && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Icon name="map-pin" size={16} color={C.orange} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {[staff.address, staff.city, staff.state, staff.pincode].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Personal Details */}
        {(staff.dateOfBirth) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{formatDate(staff.dateOfBirth)}</Text>
            </View>
          </View>
        )}

        {/* Identity Documents */}
        {(staff.aadharNumber || staff.panNumber) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Identity Documents</Text>
            {staff.aadharNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aadhar Number</Text>
                <Text style={styles.detailValue}>{staff.aadharNumber}</Text>
              </View>
            )}
            {staff.panNumber && (
              <View style={[styles.detailRow, !staff.aadharNumber && { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>PAN Number</Text>
                <Text style={styles.detailValue}>{staff.panNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* Employment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Joining Date</Text>
            <Text style={styles.detailValue}>{formatDate(staff.joiningDate)}</Text>
          </View>

          {staff.salary && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monthly Salary</Text>
              <Text style={styles.detailValue}>₹{parseInt(staff.salary).toLocaleString()}</Text>
            </View>
          )}

          {staff.employeeId && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Employee ID</Text>
              <Text style={styles.detailValue}>{staff.employeeId}</Text>
            </View>
          )}
        </View>

        {/* License Details (for drivers) */}
        {staff.role?.toLowerCase() === 'driver' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>License Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Number</Text>
              <Text style={styles.detailValue}>{staff.licenseNumber || '--'}</Text>
            </View>

            {staff.licenseType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License Type</Text>
                <Text style={styles.detailValue}>{staff.licenseType}</Text>
              </View>
            )}

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>License Expiry</Text>
              <Text style={[
                styles.detailValue,
                staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date() && { color: C.red }
              ]}>
                {formatDate(staff.licenseExpiry)}
              </Text>
            </View>

            {staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date() && (
              <View style={styles.warningBanner}>
                <Icon name="alert-triangle" size={16} color="#92400E" />
                <Text style={styles.warningText}>License has expired!</Text>
              </View>
            )}
          </View>
        )}

        {/* Bank Details */}
        {(staff.bankName || staff.accountNumber || staff.ifscCode) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank Details</Text>
            {staff.bankName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{staff.bankName}</Text>
              </View>
            )}
            {staff.accountHolderName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Holder</Text>
                <Text style={styles.detailValue}>{staff.accountHolderName}</Text>
              </View>
            )}
            {staff.accountNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>{staff.accountNumber}</Text>
              </View>
            )}
            {staff.ifscCode && (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>IFSC Code</Text>
                <Text style={styles.detailValue}>{staff.ifscCode}</Text>
              </View>
            )}
          </View>
        )}

        {/* Emergency Contact */}
        {(staff.emergencyContact || staff.emergencyPhone) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
            {staff.emergencyContact && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Name</Text>
                <Text style={styles.detailValue}>{staff.emergencyContact}</Text>
              </View>
            )}
            {staff.emergencyPhone && (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Contact Phone</Text>
                <Text style={styles.detailValue}>{staff.emergencyPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        {staff.stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{staff.stats.totalTrips || 0}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{staff.stats.completedTrips || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{staff.stats.rating?.toFixed(1) || '--'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        )}

        {/* Documents */}
        {staff.documents && staff.documents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documents</Text>
            {staff.documents.map((doc, index) => (
              <View key={index} style={styles.documentRow}>
                <View style={styles.documentIcon}>
                  <Icon name="file-text" size={18} color={C.blue} />
                </View>
                <View style={styles.documentContent}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentDate}>
                    Uploaded: {formatDate(doc.uploadedAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={C.muted} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.border,
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.surface,
  },
  staffName: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: C.bg,
    borderRadius: 10,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: {
    fontSize: 14,
    color: C.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
  },
  statLabel: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  documentDate: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
});
