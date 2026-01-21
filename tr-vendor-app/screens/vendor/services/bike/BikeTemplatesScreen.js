/**
 * BikeTemplatesScreen.js - Bike rental quote templates list
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplates, deleteTemplate, updateTemplate } from '../../../api/client';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';
const SERVICE_COLOR = '#FF6B35';

const BIKE_CATEGORIES = [
  { id: 'all', name: 'All Templates' },
  { id: 'commuter', name: 'Commuter' },
  { id: 'sports', name: 'Sports' },
  { id: 'touring', name: 'Touring' },
  { id: 'cruiser', name: 'Cruiser' },
  { id: 'scooter', name: 'Scooter' },
  { id: 'electric', name: 'Electric' },
];

export default function BikeTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const data = await getTemplates('bike', params);

      console.log('[Bike Templates] API Response:', data);
      console.log('[Bike Templates] Is Array?:', Array.isArray(data));

      // Ensure we always set an array
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      } else {
        console.log('[Bike Templates] Setting empty array, data was:', typeof data, data);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching bike templates:', error);
      setTemplates([]); // Set empty array on error
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate('bike', templateId);
              Alert.alert('Success', 'Template deleted successfully');
              fetchTemplates();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (template) => {
    try {
      await updateTemplate('bike', template.id, {
        isActive: !template.isActive,
      });
      fetchTemplates();
    } catch (error) {
      Alert.alert('Error', 'Failed to update template');
    }
  };

  const getCategoryLabel = (category) => {
    return BIKE_CATEGORIES.find((c) => c.id === category)?.name || category;
  };

  const TemplateCard = ({ template }) => {
    const isExpanded = expandedId === template.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="motorbike" size={24} color={SERVICE_COLOR} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={styles.templateName}>{template.name}</Text>
                {template.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Icon name="star" size={10} color="#F59E0B" />
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
                {!template.isActive && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={styles.categoryText}>{getCategoryLabel(template.category)}</Text>
              {template.description && (
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {template.description}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="trending-up" size={14} color="#6B7280" />
            <Text style={styles.statText}>Used {template.usageCount} times</Text>
          </View>
          <TouchableOpacity
            onPress={() => setExpandedId(isExpanded ? null : template.id)}
            style={styles.expandButton}
          >
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={SERVICE_COLOR} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Rate Hints */}
            {(template.dailyRateHint || template.weeklyRateHint || template.monthlyRateHint) && (
              <View style={styles.ratesBox}>
                <Text style={styles.sectionTitle}>Rate Hints</Text>
                {template.dailyRateHint && (
                  <Text style={styles.rateText}>Daily: ₹{template.dailyRateHint}</Text>
                )}
                {template.weeklyRateHint && (
                  <Text style={styles.rateText}>Weekly: ₹{template.weeklyRateHint}</Text>
                )}
                {template.monthlyRateHint && (
                  <Text style={styles.rateText}>Monthly: ₹{template.monthlyRateHint}</Text>
                )}
                {template.securityDepositHint && (
                  <Text style={styles.rateText}>Deposit: ₹{template.securityDepositHint}</Text>
                )}
              </View>
            )}

            {/* Inclusions */}
            {template.inclusions && template.inclusions.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  <Icon name="check-circle" size={14} color={GREEN} /> Inclusions ({template.inclusions.length})
                </Text>
                {template.inclusions.slice(0, 3).map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item}
                  </Text>
                ))}
                {template.inclusions.length > 3 && (
                  <Text style={styles.moreText}>+{template.inclusions.length - 3} more</Text>
                )}
              </View>
            )}

            {/* Exclusions */}
            {template.exclusions && template.exclusions.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>
                  <Icon name="x-circle" size={14} color="#EF4444" /> Exclusions ({template.exclusions.length})
                </Text>
                {template.exclusions.slice(0, 3).map((item, idx) => (
                  <Text key={idx} style={styles.listItem}>
                    • {item}
                  </Text>
                ))}
                {template.exclusions.length > 3 && (
                  <Text style={styles.moreText}>+{template.exclusions.length - 3} more</Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F3F4F6' }]}
            onPress={() => navigation.navigate('BikeEditTemplate', { templateId: template.id })}
          >
            <Icon name="edit-2" size={16} color={DARK} />
            <Text style={[styles.actionButtonText, { color: DARK }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: template.isActive ? '#FEE2E2' : '#D1FAE5' },
            ]}
            onPress={() => handleToggleActive(template)}
          >
            <Icon name={template.isActive ? 'x' : 'check'} size={16} color={template.isActive ? '#EF4444' : GREEN} />
            <Text
              style={[
                styles.actionButtonText,
                { color: template.isActive ? '#EF4444' : GREEN },
              ]}
            >
              {template.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleDeleteTemplate(template.id, template.name)}
          >
            <Icon name="trash-2" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bike Templates</Text>
          <Text style={styles.headerSubtitle}>Manage reusable quote templates</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('BikeCreateTemplate')}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {BIKE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              categoryFilter === cat.id && styles.filterChipActive,
            ]}
            onPress={() => setCategoryFilter(cat.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                categoryFilter === cat.id && styles.filterChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Templates List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading templates...</Text>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No templates found</Text>
            <Text style={styles.emptyText}>Create templates to speed up your quote process</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('BikeCreateTemplate')}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Your First Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map((template) => <TemplateCard key={template.id} template={template} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SERVICE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: SERVICE_COLOR,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    flex: 1,
  },
  categoryText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  expandButton: {
    padding: 4,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ratesBox: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  rateText: {
    fontSize: 13,
    color: '#EA580C',
    marginBottom: 4,
  },
  listSection: {
    marginBottom: 12,
  },
  listItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
  moreText: {
    fontSize: 12,
    color: SERVICE_COLOR,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SERVICE_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
