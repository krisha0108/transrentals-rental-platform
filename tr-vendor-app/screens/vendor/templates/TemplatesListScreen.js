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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplates, deleteTemplate, toggleTemplateActive, setTemplateDefault } from '../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  teal: '#14B8A6',
};

const { width } = Dimensions.get('window');

// Service configurations
const SERVICE_CONFIG = {
  bus: {
    name: 'Bus',
    icon: 'bus',
    color: '#EC4899',
    createScreen: 'CreateBusTemplateScreen',
    categories: [
      { key: 'local', label: 'Local' },
      { key: 'outstation', label: 'Outstation' },
    ],
  },
  truck: {
    name: 'Transporter',
    icon: 'truck-delivery',
    color: '#EF4444',
    createScreen: 'CreateTruckTemplateScreen',
    categories: [
      { key: 'full-load', label: 'Full Load' },
      { key: 'part-load', label: 'Part Load' },
      { key: 'container', label: 'Container' },
    ],
  },
  equipment: {
    name: 'Equipment',
    icon: 'hammer-wrench',
    color: '#6366F1',
    createScreen: 'CreateEquipmentTemplateScreen',
    categories: [
      { key: 'daily', label: 'Daily' },
      { key: 'weekly', label: 'Weekly' },
      { key: 'monthly', label: 'Monthly' },
      { key: 'project', label: 'Project' },
    ],
  },
  luxury: {
    name: 'Luxury',
    icon: 'car-sports',
    color: '#8B5CF6',
    createScreen: 'CreateLuxuryTemplateScreen',
    categories: [
      { key: 'luxury_sedan', label: 'Luxury Sedan' },
      { key: 'luxury_suv', label: 'Luxury SUV' },
      { key: 'premium_sedan', label: 'Premium Sedan' },
      { key: 'premium_suv', label: 'Premium SUV' },
      { key: 'vintage', label: 'Vintage' },
      { key: 'sports', label: 'Sports' },
      { key: 'limousine', label: 'Limousine' },
    ],
  },
  packers: {
    name: 'Packers & Movers',
    icon: 'package-variant',
    color: '#14B8A6',
    createScreen: 'CreatePackersTemplateScreen',
    categories: [
      { key: 'home', label: 'Home Shifting' },
      { key: 'office', label: 'Office Shifting' },
      { key: 'local', label: 'Local Moving' },
      { key: 'intercity', label: 'Intercity' },
    ],
  },
};

export default function TemplatesListScreen({ route, navigation }) {
  const { serviceType = 'bus' } = route.params || {};
  const config = SERVICE_CONFIG[serviceType] || SERVICE_CONFIG.bus;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTemplates = useCallback(async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await getTemplates(serviceType, params);
      setTemplates(response?.templates || []);
    } catch (error) {
      console.log('Error fetching templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [serviceType, selectedCategory]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  }, [fetchTemplates]);

  const handleDelete = (templateId, templateName) => {
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
              await deleteTemplate(serviceType, templateId);
              setTemplates(prev => prev.filter(t => t.id !== templateId));
              Alert.alert('Success', 'Template deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (templateId, currentStatus) => {
    try {
      await toggleTemplateActive(serviceType, templateId, !currentStatus);
      setTemplates(prev =>
        prev.map(t => (t.id === templateId ? { ...t, isActive: !currentStatus } : t))
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update template');
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await setTemplateDefault(serviceType, templateId);
      setTemplates(prev =>
        prev.map(t => ({
          ...t,
          isDefault: t.id === templateId,
        }))
      );
      Alert.alert('Success', 'Default template updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to set default template');
    }
  };

  const getCategoryLabel = (categoryKey) => {
    const cat = config.categories.find(c => c.key === categoryKey);
    return cat?.label || categoryKey;
  };

  const renderTemplate = ({ item }) => (
    <View style={styles.templateCard}>
      {/* Header */}
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <Text style={styles.templateName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Icon name="star" size={10} color="#D97706" />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2' }]}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? C.brand : C.red }]} />
          <Text style={[styles.statusText, { color: item.isActive ? '#166534' : '#991B1B' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Category & Description */}
      <View style={styles.templateBody}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      {/* Inclusions Preview */}
      {item.inclusions && item.inclusions.length > 0 && (
        <View style={styles.inclusionsRow}>
          <Icon name="check-circle" size={12} color={C.brand} />
          <Text style={styles.inclusionsText} numberOfLines={1}>
            {item.inclusions.slice(0, 3).join(' • ')}
            {item.inclusions.length > 3 && ` +${item.inclusions.length - 3} more`}
          </Text>
        </View>
      )}

      {/* Rate Hints (Service-specific) */}
      {renderRateHints(item)}

      {/* Footer with actions */}
      <View style={styles.templateFooter}>
        <View style={styles.usageRow}>
          <Icon name="bar-chart-2" size={12} color={C.muted} />
          <Text style={styles.usageText}>Used {item.usageCount || 0} times</Text>
        </View>
        <View style={styles.actionsRow}>
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleSetDefault(item.id)}
            >
              <Icon name="star" size={16} color={C.orange} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleActive(item.id, item.isActive)}
          >
            <Icon name={item.isActive ? 'eye-off' : 'eye'} size={16} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate(config.createScreen, { templateId: item.id, serviceType })}
          >
            <Icon name="edit-2" size={16} color={C.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Icon name="trash-2" size={16} color={C.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRateHints = (item) => {
    switch (serviceType) {
      case 'bus':
        return (
          <View style={styles.ratesRow}>
            {item.baseRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Base</Text>
                <Text style={styles.rateValue}>₹{item.baseRateHint}</Text>
              </View>
            )}
            {item.perKmRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Per KM</Text>
                <Text style={styles.rateValue}>₹{item.perKmRateHint}</Text>
              </View>
            )}
            {item.perDayRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Per Day</Text>
                <Text style={styles.rateValue}>₹{item.perDayRateHint}</Text>
              </View>
            )}
          </View>
        );
      case 'truck':
        return item.ratePerKm ? (
          <View style={styles.ratesRow}>
            <View style={styles.rateChip}>
              <Text style={styles.rateLabel}>Rate/KM</Text>
              <Text style={styles.rateValue}>₹{item.ratePerKm}</Text>
            </View>
          </View>
        ) : null;
      case 'equipment':
        return (
          <View style={styles.ratesRow}>
            {item.dailyRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Daily</Text>
                <Text style={styles.rateValue}>₹{item.dailyRateHint}</Text>
              </View>
            )}
            {item.weeklyRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Weekly</Text>
                <Text style={styles.rateValue}>₹{item.weeklyRateHint}</Text>
              </View>
            )}
            {item.monthlyRateHint && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Monthly</Text>
                <Text style={styles.rateValue}>₹{item.monthlyRateHint}</Text>
              </View>
            )}
          </View>
        );
      case 'luxury':
        return (
          <View style={styles.ratesRow}>
            <View style={styles.rateChip}>
              <Text style={styles.rateLabel}>Base</Text>
              <Text style={styles.rateValue}>₹{item.baseAmount || 0}</Text>
            </View>
            {item.perKmRate && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Per KM</Text>
                <Text style={styles.rateValue}>₹{item.perKmRate}</Text>
              </View>
            )}
            {item.perHourRate && (
              <View style={styles.rateChip}>
                <Text style={styles.rateLabel}>Per Hour</Text>
                <Text style={styles.rateValue}>₹{item.perHourRate}</Text>
              </View>
            )}
          </View>
        );
      case 'packers':
        return item.baseRateHint ? (
          <View style={styles.ratesRow}>
            <View style={styles.rateChip}>
              <Text style={styles.rateLabel}>Base Rate</Text>
              <Text style={styles.rateValue}>₹{item.baseRateHint}</Text>
            </View>
          </View>
        ) : null;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.name} Templates</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={config.color} />
        </View>
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
        <Text style={styles.headerTitle}>{config.name} Templates</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: config.color }]}
          onPress={() => navigation.navigate(config.createScreen, { serviceType })}
        >
          <Icon name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[{ key: 'all', label: 'All' }, ...config.categories]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item.key && { backgroundColor: config.color },
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
        />
      </View>

      {/* Templates List */}
      {templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: `${config.color}14` }]}>
            <MaterialCommunityIcons name={config.icon} size={48} color={config.color} />
          </View>
          <Text style={styles.emptyTitle}>No Templates</Text>
          <Text style={styles.emptyText}>
            Create your first {config.name.toLowerCase()} template to quickly send quotes
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: config.color }]}
            onPress={() => navigation.navigate(config.createScreen, { serviceType })}
          >
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Template</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={config.color}
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
  },
  filterContainer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    height: 56, // Fixed height to prevent overflow
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center', // Vertically center the chips
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    marginRight: 8,
    height: 36, // Fixed height for consistent sizing
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  templateCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    gap: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  templateBody: {
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.text,
  },
  description: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 18,
  },
  inclusionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  inclusionsText: {
    fontSize: 12,
    color: C.muted,
    flex: 1,
  },
  ratesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  rateChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  rateLabel: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageText: {
    fontSize: 12,
    color: C.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
