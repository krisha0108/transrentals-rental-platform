import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getVendorStaff } from '../../api/client';
import EmptyState from '../../../components/EmptyState';
import { ListSkeleton } from '../../../components/SkeletonLoader';

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

const ROLE_COLORS = {
  driver: { bg: '#DBEAFE', text: '#1E40AF' },
  manager: { bg: '#F3E8FF', text: '#7C3AED' },
  helper: { bg: '#FEF3C7', text: '#92400E' },
  accountant: { bg: '#DCFCE7', text: '#166534' },
  default: { bg: '#F3F4F6', text: '#374151' },
};

export default function StaffListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchStaff = useCallback(async () => {
    try {
      const response = await getVendorStaff();
      setStaff(response?.staff || []);
    } catch (error) {
      console.log('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [fetchStaff]);

  const getRoleColor = (role) => {
    const normalizedRole = role?.toLowerCase() || 'default';
    return ROLE_COLORS[normalizedRole] || ROLE_COLORS.default;
  };

  const filters = [
    { key: 'all', label: 'All Staff' },
    { key: 'driver', label: 'Drivers' },
    { key: 'manager', label: 'Managers' },
    { key: 'helper', label: 'Helpers' },
  ];

  const filteredStaff = staff.filter((s) => {
    if (filter === 'all') return true;
    return s.role?.toLowerCase() === filter;
  });

  const renderStaff = ({ item }) => {
    const roleColors = getRoleColor(item.role);

    return (
      <TouchableOpacity
        style={styles.staffCard}
        onPress={() => navigation.navigate('StaffDetailScreen', { staffId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isActive ? C.brand : C.muted },
            ]}
          />
        </View>

        <View style={styles.staffInfo}>
          <View style={styles.staffHeader}>
            <Text style={styles.staffName} numberOfLines={1}>
              {item.name || 'Staff Member'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
              <Text style={[styles.roleText, { color: roleColors.text }]}>
                {item.role || 'Staff'}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <Icon name="phone" size={12} color={C.muted} />
            <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
          </View>

          {item.email && (
            <View style={styles.contactRow}>
              <Icon name="mail" size={12} color={C.muted} />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
        </View>

        <Icon name="chevron-right" size={18} color={C.muted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Management</Text>
          <View style={{ width: 36 }} />
        </View>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddStaffScreen')}
        >
          <Icon name="plus" size={20} color={C.brand} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{staff.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: C.blue }]}>
            {staff.filter((s) => s.role?.toLowerCase() === 'driver').length}
          </Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: C.brand }]}>
            {staff.filter((s) => s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('StaffAttendanceScreen')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="calendar" size={18} color={C.blue} />
          </View>
          <Text style={styles.quickActionTitle}>Attendance</Text>
          <Text style={styles.quickActionSub}>Track daily</Text>
          <Icon name="chevron-right" size={14} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('StaffPayrollScreen')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
            <Icon name="dollar-sign" size={18} color={C.purple} />
          </View>
          <Text style={styles.quickActionTitle}>Payroll</Text>
          <Text style={styles.quickActionSub}>Salaries</Text>
          <Icon name="chevron-right" size={14} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="users" size={48} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Staff Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'Add your first staff member'
              : `No ${filter}s found`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={styles.addStaffBtn}
              onPress={() => navigation.navigate('AddStaffScreen')}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={styles.addStaffBtnText}>Add Staff</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          renderItem={renderStaff}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="No staff members"
              message="Add your first staff member to get started"
              actionLabel="Add Staff"
              onAction={() => navigation.navigate('AddStaff')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.brand}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  statLabel: {
    fontSize: 11,
    color: C.muted,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  quickActionSub: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 2,
  },
  filtersContainer: {
    height: 56,
    marginTop: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  filterText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#166534',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: C.purple,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  staffInfo: {
    flex: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: C.muted,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addStaffBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
