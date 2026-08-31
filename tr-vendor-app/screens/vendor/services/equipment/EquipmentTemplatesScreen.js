import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, StatusBar, Modal, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplates, deleteTemplate, updateTemplate } from '../../../api/client';
import { showConfirm, showError, showSuccess } from '../../../../services/alertService';
import { SC as T, G, rs, shade, cardShadow, SHEET_RADIUS } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';
import SheetHandle from '../../_shared/SheetHandle';

const { width: W } = Dimensions.get('window');

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, text: T.ink,
  sub: T.text, muted: T.subText,
  amber: T.amber, amberD: shade(T.amber, -15), amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange,
  indigo: T.indigo, indigoL: T.indigoLight,
};

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'heavy', name: 'Heavy Machinery' },
  { id: 'construction', name: 'Construction' },
  { id: 'agricultural', name: 'Agricultural' },
  { id: 'lifting', name: 'Lifting/Crane' },
  { id: 'generator', name: 'Generator' },
  { id: 'compressor', name: 'Compressor' },
];

export default function EquipmentTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => { fetchTemplates(); }, [categoryFilter]);

  useFocusEffect(
    useCallback(() => { fetchTemplates(); }, [categoryFilter])
  );

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const data = await getTemplates('equipment', params);
      if (Array.isArray(data)) setTemplates(data);
      else if (data?.templates) setTemplates(data.templates);
      else setTemplates([]);
    } catch { showError('Failed to load templates'); setTemplates([]); }
    finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchTemplates(); setRefreshing(false); };

  const handleDelete = (id, name) => {
    showConfirm('Delete Template', `Delete "${name}"?`, async () => {
      try {
        if (previewTemplate?.id === id) setPreviewTemplate(null);
        await deleteTemplate('equipment', id);
        showSuccess('Template deleted');
        fetchTemplates();
      } catch { showError('Failed to delete'); }
    }, { confirmText: 'Delete', destructive: true });
  };

  const handleToggle = async (template) => {
    try {
      await updateTemplate('equipment', template.id, { isActive: !template.isActive });
      if (previewTemplate?.id === template.id)
        setPreviewTemplate(p => ({ ...p, isActive: !p.isActive }));
      fetchTemplates();
    } catch { showError('Failed to update template'); }
  };

  const catLabel = (id) => CATEGORIES.find(c => c.id === id)?.name || id;

  const TemplateCard = ({ t }) => (
    <View style={s.card}>
      <TouchableOpacity style={s.cardMain} onPress={() => setPreviewTemplate(t)} activeOpacity={0.8}>
        <View style={s.cardIconWrap}>
          <LinearGradient colors={[C.g800, C.g600]} style={s.cardIconGrad}>
            <MaterialCommunityIcons name="hammer" size={22} color="#fff" />
          </LinearGradient>
          {t.isDefault && (
            <View style={s.cardStarBadge}>
              <Icon name="star" size={9} color="#fff" />
            </View>
          )}
        </View>

        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>{t.name}</Text>
          <View style={s.cardMetaRow}>
            <View style={s.catTag}>
              <Text style={s.catTagText}>{catLabel(t.category)}</Text>
            </View>
            {t.dailyRateHint ? (
              <Text style={s.cardRate}>₹{t.dailyRateHint}/day</Text>
            ) : null}
          </View>
        </View>

        <View style={[s.activePill, t.isActive ? s.activePillOn : s.activePillOff]}>
          <View style={[s.activeDot, { backgroundColor: t.isActive ? C.g500 : C.muted }]} />
          <Text style={[s.activePillText, { color: t.isActive ? C.g700 : C.muted }]}>
            {t.isActive ? 'Active' : 'Off'}
          </Text>
        </View>

        <Icon name="chevron-right" size={16} color={C.muted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <View style={s.statsBar}>
        <View style={s.statChip}>
          <Icon name="check-circle" size={12} color={C.g600} />
          <Text style={s.statText}>{t.inclusions?.length || 0} inclusions</Text>
        </View>
        {t.exclusions?.length > 0 && (
          <View style={s.statChip}>
            <Icon name="x-circle" size={12} color={C.red} />
            <Text style={s.statText}>{t.exclusions.length} exclusions</Text>
          </View>
        )}
        <View style={s.statChip}>
          <Icon name="bar-chart-2" size={12} color={C.muted} />
          <Text style={s.statText}>Used {t.usageCount || 0}×</Text>
        </View>
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity
          style={[s.actionBtn, s.actionEdit]}
          onPress={() => navigation.navigate('EquipmentEditTemplate', { templateId: t.id })}
        >
          <Icon name="edit-2" size={14} color={C.indigo} />
          <Text style={[s.actionBtnText, { color: C.indigo }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, t.isActive ? s.actionDeactivate : s.actionActivate]}
          onPress={() => handleToggle(t)}
        >
          <Icon name={t.isActive ? 'x' : 'check'} size={14} color={t.isActive ? C.orange : C.g600} />
          <Text style={[s.actionBtnText, { color: t.isActive ? C.orange : C.g600 }]}>
            {t.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, s.actionDelete]}
          onPress={() => handleDelete(t.id, t.name)}
        >
          <Icon name="trash-2" size={14} color={C.red} />
          <Text style={[s.actionBtnText, { color: C.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PreviewModal = () => {
    const t = previewTemplate;
    if (!t) return null;
    return (
      <Modal visible={!!t} animationType="slide" transparent onRequestClose={() => setPreviewTemplate(null)}>
        <View style={s.modalOverlay}>
          <View style={s.sheet}>
            <SheetHandle />
            <LinearGradient colors={G.hero} style={s.sheetHeader}>
            <AnimatedOrb style={s.sheetDeco} />
            <View style={s.sheetHeaderRow}>
              <View style={s.sheetIconRing}>
                <LinearGradient colors={[C.g800, C.g600]} style={s.sheetIconGrad}>
                  <MaterialCommunityIcons name="hammer" size={26} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.sheetName} numberOfLines={2}>{t.name}</Text>
                <View style={s.sheetMetaRow}>
                  <View style={s.sheetCatTag}>
                    <Text style={s.sheetCatText}>{catLabel(t.category)}</Text>
                  </View>
                  {t.isDefault && (
                    <View style={s.sheetStarTag}>
                      <Icon name="star" size={10} color={C.amber} />
                      <Text style={s.sheetStarText}>Default</Text>
                    </View>
                  )}
                  <View style={[s.sheetStatusTag, { backgroundColor: t.isActive ? C.g600 + '30' : 'rgba(255,255,255,0.1)' }]}>
                    <View style={[s.activeDot, { backgroundColor: t.isActive ? C.g400 : C.muted }]} />
                    <Text style={s.sheetStatusText}>{t.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setPreviewTemplate(null)} style={s.sheetCloseX}>
              <Icon name="x" size={18} color="#fff" />
            </TouchableOpacity>
            {t.description ? <Text style={s.sheetDesc}>{t.description}</Text> : null}
          </LinearGradient>

          <ScrollView style={s.sheetScroll} contentContainerStyle={s.sheetScrollContent} showsVerticalScrollIndicator={false}>
            {(t.dailyRateHint || t.weeklyRateHint || t.monthlyRateHint || t.securityDepositHint) ? (
              <View style={s.mCard}>
                <View style={s.mCardHead}>
                  <View style={[s.mCardIcon, { backgroundColor: C.g50 }]}>
                    <Icon name="tag" size={14} color={C.g700} />
                  </View>
                  <Text style={s.mCardTitle}>Rate Hints</Text>
                </View>
                <View style={s.rateGrid}>
                  {[
                    { l: 'Daily', v: t.dailyRateHint },
                    { l: 'Weekly', v: t.weeklyRateHint },
                    { l: 'Monthly', v: t.monthlyRateHint },
                    { l: 'Deposit', v: t.securityDepositHint },
                  ].filter(r => r.v).map((r, i) => (
                    <View key={i} style={s.rateBox}>
                      <Text style={s.rateBoxLabel}>{r.l}</Text>
                      <Text style={s.rateBoxVal}>₹{r.v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {t.inclusions?.length > 0 && (
              <View style={s.mCard}>
                <View style={s.mCardHead}>
                  <View style={[s.mCardIcon, { backgroundColor: C.g50 }]}>
                    <Icon name="check-circle" size={14} color={C.g600} />
                  </View>
                  <Text style={s.mCardTitle}>Inclusions ({t.inclusions.length})</Text>
                </View>
                {t.inclusions.map((item, i) => (
                  <View key={i} style={s.mListRow}>
                    <View style={[s.mListDot, { backgroundColor: C.g500 }]} />
                    <Text style={s.mListText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {t.exclusions?.length > 0 && (
              <View style={s.mCard}>
                <View style={s.mCardHead}>
                  <View style={[s.mCardIcon, { backgroundColor: C.redL }]}>
                    <Icon name="x-circle" size={14} color={C.red} />
                  </View>
                  <Text style={[s.mCardTitle, { color: C.red }]}>Exclusions ({t.exclusions.length})</Text>
                </View>
                {t.exclusions.map((item, i) => (
                  <View key={i} style={s.mListRow}>
                    <View style={[s.mListDot, { backgroundColor: C.red }]} />
                    <Text style={s.mListText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {t.termsConditions?.length > 0 && (
              <View style={s.mCard}>
                <View style={s.mCardHead}>
                  <View style={[s.mCardIcon, { backgroundColor: C.indigoL }]}>
                    <Icon name="file-text" size={14} color={C.indigo} />
                  </View>
                  <Text style={s.mCardTitle}>Terms & Conditions</Text>
                </View>
                {t.termsConditions.map((item, i) => (
                  <View key={i} style={s.mListRow}>
                    <View style={s.mTermNum}>
                      <Text style={s.mTermNumText}>{i + 1}</Text>
                    </View>
                    <Text style={s.mListText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient colors={G.hero} style={s.header}>
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Equipment Templates</Text>
            <Text style={s.headerSub}>
              {isLoading ? 'Loading...' : `${templates.length} template${templates.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('EquipmentCreateTemplate')}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={s.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.filterChip, categoryFilter === cat.id && s.filterChipOn]}
              onPress={() => setCategoryFilter(cat.id)}
            >
              <Text style={[s.filterChipText, categoryFilter === cat.id && s.filterChipTextOn]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={s.centerWrap}>
          <MaterialCommunityIcons name="hammer" size={56} color={C.g500} style={{ opacity: 0.35 }} />
          <Text style={s.centerText}>Loading templates...</Text>
        </View>
      ) : templates.length === 0 ? (
        <View style={s.centerWrap}>
          <View style={s.emptyBox}>
            <Icon name="file-text" size={36} color={C.muted} />
          </View>
          <Text style={s.emptyTitle}>No templates yet</Text>
          <Text style={s.emptyText}>Create templates to speed up quote process</Text>
          <TouchableOpacity style={s.emptyCreateBtn} onPress={() => navigation.navigate('EquipmentCreateTemplate')}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={s.emptyCreateText}>Create Template</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={t => String(t.id)}
          renderItem={({ item }) => <TemplateCard t={item} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        />
      )}

      <PreviewModal />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  deco1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50 },
  deco2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)', top: 10, right: 90 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  filterWrap: { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
  },
  filterChipOn: { backgroundColor: C.g700, borderColor: C.g700 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.sub },
  filterChipTextOn: { color: '#fff' },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: C.card, borderRadius: rs(18), marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardMain: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, gap: 12,
  },
  cardIconWrap: { position: 'relative' },
  cardIconGrad: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cardStarBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.amber, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.card,
  },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 5 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catTag: {
    backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: C.g100,
  },
  catTagText: { fontSize: 11, fontWeight: '700', color: C.g700 },
  cardRate: { fontSize: 12, color: C.sub, fontWeight: '600' },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  activePillOn: { backgroundColor: C.g50 },
  activePillOff: { backgroundColor: C.bg },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activePillText: { fontSize: 11, fontWeight: '700' },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: rs(10),
    borderWidth: 1, borderColor: C.border,
  },
  statText: { fontSize: 11, color: C.muted, fontWeight: '600' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11,
  },
  actionEdit: { backgroundColor: C.indigoL },
  actionDeactivate: { backgroundColor: '#FFF7ED' },
  actionActivate: { backgroundColor: C.g50 },
  actionDelete: { backgroundColor: C.redL },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  centerText: { fontSize: 14, color: C.muted, marginTop: 12 },
  emptyCreateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g700, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
  },
  emptyCreateText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%', backgroundColor: C.bg, overflow: 'hidden',
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
  },
  sheetHeader: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 18, overflow: 'hidden' },
  sheetDeco: { position: 'absolute', width: 130, height: 130, borderRadius: 65, top: -40, right: -20, backgroundColor: 'rgba(255,255,255,0.06)' },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sheetIconRing: {
    width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  sheetIconGrad: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  sheetCloseX: {
    position: 'absolute', top: 14, right: 16,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  sheetName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 8 },
  sheetMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sheetCatTag: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  sheetCatText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  sheetStarTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.amber + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  sheetStarText: { fontSize: 12, fontWeight: '600', color: C.amber },
  sheetStatusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  sheetStatusText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  sheetDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 12, lineHeight: 19 },

  sheetScroll: { flexGrow: 0, backgroundColor: C.bg },
  sheetScrollContent: { padding: 16 },

  mCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  mCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  mCardIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mCardTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.text },
  rateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rateBox: {
    flex: 1, minWidth: '40%', backgroundColor: C.g50,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.g100,
  },
  rateBoxLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  rateBoxVal: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.g700 },
  mListRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 },
  mListDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  mListText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 19 },
  mTermNum: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: C.indigo,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  mTermNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
