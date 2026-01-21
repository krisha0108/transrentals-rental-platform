import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../../../lib/api';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#A855F7',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

const VEHICLE_CATEGORIES = {
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
  premium_sedan: 'Premium Sedan',
  premium_suv: 'Premium SUV',
  vintage: 'Vintage Car',
  sports: 'Sports Car',
  limousine: 'Limousine',
  convertible: 'Convertible',
};

export default function LuxuryTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await api.get('/vendor/luxury-templates');
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      Alert.alert('Error', 'Failed to fetch templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTemplates();
  };

  const handleToggleActive = async (template) => {
    setActionLoading(template.id);
    try {
      const response = await api.patch(`/vendor/luxury-templates/${template.id}`, {
        isActive: !template.isActive,
      });

      if (response.data.success) {
        setTemplates(prev =>
          prev.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t)
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update template');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (template) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(template.id);
            try {
              const response = await api.delete(`/vendor/luxury-templates/${template.id}`);
              if (response.data.success) {
                fetchTemplates();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderTemplate = ({ item }) => {
    const isLoading = actionLoading === item.id;

    return (
      <View style={[styles.card, !item.isActive && styles.cardInactive]}>
        {/* Header */}
        <View style={[styles.cardHeader, { backgroundColor: item.isActive ? C.brand : C.muted }]}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="car-sports" size={16} color="#fff" />
            <Text style={styles.categoryText}>
              {VEHICLE_CATEGORIES[item.category] || item.category}
            </Text>
          </View>
          <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.templateName}>{item.name}</Text>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Amount</Text>
              <Text style={styles.priceValue}>₹{item.baseAmount?.toLocaleString() || 0}</Text>
            </View>
            {item.chauffeurCharges > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Chauffeur</Text>
                <Text style={styles.priceValueSmall}>+₹{item.chauffeurCharges?.toLocaleString()}</Text>
              </View>
            )}
            {item.decorationCharges > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Decoration</Text>
                <Text style={styles.priceValueSmall}>+₹{item.decorationCharges?.toLocaleString()}</Text>
              </View>
            )}
            {item.extraKmRate && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Extra Km</Text>
                <Text style={styles.priceValueSmall}>₹{item.extraKmRate}/km</Text>
              </View>
            )}
          </View>

          {/* Trip Types */}
          {item.tripTypes && item.tripTypes.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tripTypes.map((tt) => (
                <View key={tt} style={styles.tag}>
                  <Text style={styles.tagText}>{tt}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Inclusions Preview */}
          {item.inclusions && item.inclusions.length > 0 && (
            <View style={styles.inclusionsPreview}>
              <Text style={styles.inclusionsLabel}>Includes:</Text>
              <Text style={styles.inclusionsText} numberOfLines={2}>
                {item.inclusions.slice(0, 3).join(', ')}
                {item.inclusions.length > 3 && ` +${item.inclusions.length - 3} more`}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.isActive ? styles.actionBtnActive : styles.actionBtnInactive,
              ]}
              onPress={() => handleToggleActive(item)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={item.isActive ? C.green : C.muted} />
              ) : (
                <>
                  <Ionicons
                    name={item.isActive ? 'toggle' : 'toggle-outline'}
                    size={16}
                    color={item.isActive ? C.green : C.muted}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: item.isActive ? C.green : C.muted },
                    ]}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnEdit]}
              onPress={() => navigation.navigate('LuxuryEditTemplate', { templateId: item.id })}
              disabled={isLoading}
            >
              <Icon name="edit-2" size={14} color={C.blue} />
              <Text style={[styles.actionBtnText, { color: C.blue }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDelete]}
              onPress={() => handleDelete(item)}
              disabled={isLoading}
            >
              <Icon name="trash-2" size={14} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quote Templates</Text>
          <Text style={styles.headerSubtitle}>Luxury Car Rental</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Icon name="refresh-cw" size={20} color={C.brand} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={C.muted} />
            <Text style={styles.emptyTitle}>No Templates Yet</Text>
            <Text style={styles.emptyText}>
              Create templates to quickly fill quote details when sending quotes to customers
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('LuxuryCreateTemplate')}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Create First Template</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Button */}
      {templates.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('LuxuryCreateTemplate')}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#6B7280',
  },
  cardBody: {
    padding: 16,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  pricingSection: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: C.muted,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  priceValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.brand,
  },
  inclusionsPreview: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inclusionsLabel: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 4,
  },
  inclusionsText: {
    fontSize: 12,
    color: C.text,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.bg,
  },
  actionBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  actionBtnInactive: {
    backgroundColor: '#F3F4F6',
  },
  actionBtnEdit: {
    backgroundColor: '#EFF6FF',
  },
  actionBtnDelete: {
    flex: 0,
    paddingHorizontal: 14,
    backgroundColor: '#FEE2E2',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: C.brand,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: C.brand,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.brand,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
