import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplates, deleteTemplate, updateTemplate } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';

const SERVICE_COLOR = '#3B82F6'; // Blue for self-drive
const GREEN = '#09B368';
const DARK = '#0F172A';
const BG = '#F5F5F7';

const SELF_DRIVE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: 'view-grid' },
  { id: 'hatchback', name: 'Hatchback', icon: 'car-hatchback' },
  { id: 'sedan', name: 'Sedan', icon: 'car-sedan' },
  { id: 'suv', name: 'SUV', icon: 'car-estate' },
  { id: 'muv', name: 'MUV', icon: 'van-utility' },
  { id: 'compact-suv', name: 'Compact SUV', icon: 'car-sports' },
  { id: 'luxury', name: 'Luxury', icon: 'car-sports' },
];

const SelfDriveTemplatesScreen = ({ navigation }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const data = await getTemplates('self-drive', params);

      console.log('[SelfDrive Templates] API Response:', data);
      console.log('[SelfDrive Templates] Is Array?:', Array.isArray(data));

      // Ensure we always set an array
      if (Array.isArray(data)) {
        setTemplates(data);
      } else if (data && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      } else {
        console.log('[SelfDrive Templates] Setting empty array, data was:', typeof data, data);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching self-drive templates:', error);
      setTemplates([]); // Set empty array on error
      showError('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  }, [categoryFilter]);

  const handleDelete = (template) => {
    showConfirm('Delete Template', `Are you sure you want to delete "${template.name}"?`, async () => {
            try {
              await deleteTemplate('self-drive', template.id);
              showSuccess('Template deleted successfully!');
              fetchTemplates();
            } catch (error) {
              console.error('Error deleting template:', error);
              showError('Failed to delete template');
            }
          }, { confirmText: 'Delete', destructive: true });
  };

  const handleToggleActive = async (template) => {
    try {
      await updateTemplate('self-drive', template.id, {
        isActive: !template.isActive,
      });
      showSuccess(`Template ${!template.isActive ? 'activated' : 'deactivated'} successfully!`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      showError('Failed to update template status');
    }
  };

  const handleEdit = (template) => {
    navigation.navigate('SelfDriveEditTemplate', { templateId: template.id });
  };

  const toggleExpand = (templateId) => {
    setExpandedTemplateId(expandedTemplateId === templateId ? null : templateId);
  };

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query))
    );
  });

  const getCategoryIcon = (category) => {
    const cat = SELF_DRIVE_CATEGORIES.find((c) => c.id === category);
    return cat ? cat.icon : 'car';
  };

  const getCategoryName = (category) => {
    const cat = SELF_DRIVE_CATEGORIES.find((c) => c.id === category);
    return cat ? cat.name : category;
  };

  const renderTemplate = (template) => {
    const isExpanded = expandedTemplateId === template.id;

    return (
      <View key={template.id} style={styles.templateCard}>
        {/* Header */}
        <TouchableOpacity
          onPress={() => toggleExpand(template.id)}
          style={styles.templateHeader}
          activeOpacity={0.7}
        >
          <View style={styles.templateHeaderLeft}>
            <MaterialCommunityIcons
              name={getCategoryIcon(template.category)}
              size={24}
              color={template.isActive ? SERVICE_COLOR : '#94A3B8'}
            />
            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, !template.isActive && styles.inactiveText]}>
                {template.name}
              </Text>
              {template.description && (
                <Text style={styles.templateDescription} numberOfLines={1}>
                  {template.description}
                </Text>
              )}
              <View style={styles.templateMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: template.isActive ? SERVICE_COLOR + '15' : '#F1F5F9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      { color: template.isActive ? SERVICE_COLOR : '#64748B' },
                    ]}
                  >
                    {getCategoryName(template.category)}
                  </Text>
                </View>
                {template.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Icon name="star" size={12} color="#F59E0B" />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.templateBody}>
            {/* Rate Hints */}
            {(template.dailyRateHint || template.kmLimitPerDay || template.extraKmRateHint) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rate Hints</Text>
                {template.dailyRateHint && (
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Daily Rate:</Text>
                    <Text style={styles.rateValue}>₹{template.dailyRateHint}</Text>
                  </View>
                )}
                {template.kmLimitPerDay && (
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>KM Limit/Day:</Text>
                    <Text style={styles.rateValue}>{template.kmLimitPerDay} km</Text>
                  </View>
                )}
                {template.extraKmRateHint && (
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Extra KM Rate:</Text>
                    <Text style={styles.rateValue}>₹{template.extraKmRateHint}/km</Text>
                  </View>
                )}
                {template.securityDepositHint && (
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Security Deposit:</Text>
                    <Text style={styles.rateValue}>₹{template.securityDepositHint}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Inclusions */}
            {template.inclusions && template.inclusions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inclusions</Text>
                {template.inclusions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Icon name="check-circle" size={16} color={GREEN} />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Exclusions */}
            {template.exclusions && template.exclusions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Exclusions</Text>
                {template.exclusions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Icon name="x-circle" size={16} color="#EF4444" />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Terms & Conditions */}
            {template.termsConditions && template.termsConditions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                {template.termsConditions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Icon name="info" size={16} color={SERVICE_COLOR} />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEdit(template)}
              >
                <Icon name="edit-2" size={16} color={SERVICE_COLOR} />
                <Text style={[styles.actionButtonText, { color: SERVICE_COLOR }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.toggleButton]}
                onPress={() => handleToggleActive(template)}
              >
                <Icon
                  name={template.isActive ? 'eye-off' : 'eye'}
                  size={16}
                  color={template.isActive ? '#F59E0B' : GREEN}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: template.isActive ? '#F59E0B' : GREEN },
                  ]}
                >
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(template)}
              >
                <Icon name="trash-2" size={16} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Self-Drive Templates</Text>
          <Text style={styles.headerSubtitle}>Manage your quote templates</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('SelfDriveCreateTemplate')}
        >
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="x" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {SELF_DRIVE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              categoryFilter === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setCategoryFilter(cat.id)}
          >
            <MaterialCommunityIcons
              name={cat.icon}
              size={18}
              color={categoryFilter === cat.id ? '#FFF' : SERVICE_COLOR}
            />
            <Text
              style={[
                styles.categoryChipText,
                categoryFilter === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Templates List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SERVICE_COLOR} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : filteredTemplates.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <MaterialCommunityIcons name="file-document-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No templates found' : 'No templates yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first template to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('SelfDriveCreateTemplate')}
            >
              <Icon name="plus" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Create Template</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredTemplates.map(renderTemplate)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: SERVICE_COLOR,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
  },
  clearButton: {
    padding: 4,
  },
  categoryContainer: {
    maxHeight: 56,
    marginBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: SERVICE_COLOR,
    marginRight: 8,
    height: 40,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: SERVICE_COLOR,
    borderColor: SERVICE_COLOR,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: SERVICE_COLOR,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SERVICE_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  templateHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  inactiveText: {
    color: '#94A3B8',
  },
  templateDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  templateBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rateLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: SERVICE_COLOR + '15',
  },
  toggleButton: {
    backgroundColor: '#F1F5F9',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SelfDriveTemplatesScreen;
