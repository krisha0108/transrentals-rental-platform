import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getTemplates, deleteTemplate, updateTemplate } from '../../../api/client';
import { showConfirm, showError, showSuccess } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  red: '#DC2626', redL: '#FEF2F2',
};

export default function PackersTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await getTemplates('packers');
      if (data && data.templates) setTemplates(data.templates);
    } catch (error) {
      showError('Failed to fetch templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const onRefresh = () => { setRefreshing(true); fetchTemplates(); };

  const handleToggleActive = async (template) => {
    setActionLoading(template.id);
    try {
      await updateTemplate('packers', template.id, { isActive: !template.isActive });
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t));
      showSuccess(template.isActive ? 'Template deactivated' : 'Template activated');
    } catch (error) {
      showError('Failed to update template');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (template) => {
    showConfirm('Delete Template', `Delete "${template.name}"?`, async () => {
      setActionLoading(template.id);
      try {
        await deleteTemplate('packers', template.id);
        fetchTemplates();
        showSuccess('Template deleted');
      } catch (error) {
        showError('Failed to delete template');
      } finally {
        setActionLoading(null);
      }
    }, { confirmText: 'Delete', destructive: true });
  };

  const renderTemplate = ({ item }) => {
    const isLoading = actionLoading === item.id;
    return (
      <View style={[s.card, !item.isActive && { opacity: 0.6 }]}>
        <LinearGradient
          colors={item.isActive ? [C.g800, C.g700] : ['#475569', '#64748B']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.cardHeader}
        >
          <View style={s.cardHeaderLeft}>
            <MaterialCommunityIcons name="truck-delivery" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={s.cardHeaderText}>{item.category || 'Packers Template'}</Text>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeTxt}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </LinearGradient>

        <View style={s.cardBody}>
          <Text style={s.templateName}>{item.name}</Text>
          {item.description && <Text style={s.description} numberOfLines={2}>{item.description}</Text>}

          {item.baseRateHint ? (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Base Rate</Text>
              <Text style={s.priceValue}>₹{item.baseRateHint?.toLocaleString()}</Text>
            </View>
          ) : null}

          {Array.isArray(item.shiftingTypes) && item.shiftingTypes.length > 0 && (
            <View style={s.tagsRow}>
              {item.shiftingTypes.slice(0, 3).map((t, idx) => (
                <View key={idx} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
              ))}
              {item.shiftingTypes.length > 3 && (
                <View style={s.tag}><Text style={s.tagTxt}>+{item.shiftingTypes.length - 3}</Text></View>
              )}
            </View>
          )}

          {Array.isArray(item.inclusions) && item.inclusions.length > 0 && (
            <View style={s.inclusionsPreview}>
              <Text style={s.inclusionsLabel}>Includes:</Text>
              <Text style={s.inclusionsText} numberOfLines={2}>
                {item.inclusions.slice(0, 3).join(', ')}{item.inclusions.length > 3 ? ` +${item.inclusions.length - 3} more` : ''}
              </Text>
            </View>
          )}

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, item.isActive ? { backgroundColor: C.g50 } : { backgroundColor: C.bg }]}
              onPress={() => handleToggleActive(item)}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color={C.g600} /> : (
                <>
                  <Ionicons name={item.isActive ? 'toggle' : 'toggle-outline'} size={16} color={item.isActive ? C.g600 : C.muted} />
                  <Text style={[s.actionBtnTxt, { color: item.isActive ? C.g700 : C.muted }]}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.blueL }]}
              onPress={() => navigation.navigate('PackersEditTemplate', { templateId: item.id })}
              disabled={isLoading}
            >
              <Icon name="edit-2" size={14} color={C.blue} />
              <Text style={[s.actionBtnTxt, { color: C.blue }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { flex: 0, paddingHorizontal: 14, backgroundColor: C.redL }]}
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
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Quote Templates</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.heroMin}
      >
        <View style={s.deco1} /><View style={s.deco2} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Quote Templates</Text>
          </View>
          <TouchableOpacity style={s.backBtn} onPress={onRefresh}>
            <Icon name="refresh-cw" size={16} color={C.g400} />
          </TouchableOpacity>
        </View>
        <Text style={s.heroSub}>Packers & Movers</Text>
      </LinearGradient>

      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={C.muted} />
            <Text style={s.emptyTitle}>No Templates Yet</Text>
            <Text style={s.emptyText}>Create templates to quickly fill quote details when sending quotes to customers</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('PackersCreateTemplate')}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={s.emptyBtnTxt}>Create First Template</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {templates.length > 0 && (
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('PackersCreateTemplate')}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(52,211,153,0.08)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.06)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  list: { padding: 16, paddingBottom: 90 },

  card: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderText: { fontSize: 12, fontWeight: '600', color: '#fff', opacity: 0.9 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  statusBadgeTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },

  cardBody: { padding: 16 },
  templateName: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  description: { fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 18 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 13, color: C.muted },
  priceValue: { fontSize: 16, fontWeight: '700', color: C.text },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.g50, borderRadius: 12 },
  tagTxt: { fontSize: 11, fontWeight: '600', color: C.g700 },

  inclusionsPreview: { marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  inclusionsLabel: { fontSize: 11, color: C.muted, marginBottom: 4 },
  inclusionsText: { fontSize: 12, color: C.text, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  actionBtnTxt: { fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: C.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: C.g600, borderRadius: 12, marginTop: 24 },
  emptyBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.g600, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.g700, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
