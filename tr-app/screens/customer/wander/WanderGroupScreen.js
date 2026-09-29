/**
 * WanderGroupScreen.js
 * Create group / manage existing groups / propose trips
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Share, FlatList,
  Modal, RefreshControl, Platform, Image, KeyboardAvoidingView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wanderService from '../../services/wanderService';
import { BASE_URL } from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return str; }
}

const GOING_CONFIG = {
  YES:   { label: '✅ Going',  color: '#09B368', bg: '#E8F8F2' },
  MAYBE: { label: '🤔 Maybe', color: '#D97706', bg: '#FEF3C7' },
  NO:    { label: '❌ No',    color: '#DC2626', bg: '#FEE2E2' },
};

export default function WanderGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId, listingTitle } = route.params || {};

  const [customer, setCustomer] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create group modal
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('🌏');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [maxMembers, setMaxMembers] = useState('');
  const [groupAvatarUri, setGroupAvatarUri] = useState(null);
  const [travelDate, setTravelDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tripNote, setTripNote] = useState('');
  const [creating, setCreating] = useState(false);

  const EMOJI_OPTIONS = ['🌏', '🏔️', '🏖️', '🗺️', '✈️', '🚂', '🌊', '🏕️', '🎒', '🌴', '🏜️', '❄️'];

  const handlePickGroupAvatar = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.assets?.[0]?.uri) setGroupAvatarUri(res.assets[0].uri);
    });
  };

  const formatDateStr = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Share modal
  const [shareGroup, setShareGroup] = useState(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      setIsLoading(true);
      const raw = await AsyncStorage.getItem('customer');
      if (!raw) { setIsLoading(false); return; }
      const c = JSON.parse(raw);
      setCustomer(c);

      const res = await wanderService.getMyGroups(c.id);
      setMyGroups(res?.groups || []);
    } catch (e) {
      console.log('WanderGroup load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return Alert.alert('Missing', 'Please enter a group name');
    if (!customer) return Alert.alert('Login required', 'Please login to create a group');

    setCreating(true);
    try {
      const res = await wanderService.createGroup({
        name: groupName.trim(),
        emoji: groupEmoji,
        maxMembers: maxMembers ? parseInt(maxMembers) : null,
        createdById: customer.id,
        creatorName: customer.name,
        creatorPhone: customer.phone,
        listingId: listingId || null,
        travelDate: formatDateStr(travelDate),
        tripNote: tripNote.trim() || null,
      });

      if (res?.success) {
        // Upload avatar if picked
        if (groupAvatarUri && res.memberId) {
          try {
            await wanderService.uploadGroupAvatar(res.groupCode, res.memberId, groupAvatarUri);
          } catch {}
        }
        setShowCreate(false);
        setGroupName(''); setGroupEmoji('🌏'); setMaxMembers('');
        setTravelDate(null); setTripNote(''); setGroupAvatarUri(null);
        await loadData();
        setShareGroup({ groupCode: res.groupCode, name: groupName.trim() });
        Alert.alert('Group Created!', `"${groupName}" is ready. Share the invite with your friends!`);
      } else {
        Alert.alert('Error', res?.error || 'Failed to create group');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not create group. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (group) => {
    const link = `${BASE_URL}/wander/group/${group.groupCode}`;
    try {
      await Share.share({
        message: `🌏 Join my group trip *"${group.name}"*!\n\nClick the link to join & plan together:\n${link}`,
        title: `Join "${group.name}" — Group Trip on TransRentals`,
      });
    } catch {}
  };

  const handleAddTripToGroup = async (groupCode, groupId, myMemberId, groupTrips) => {
    if (!listingId) {
      Alert.alert('No Tour Selected', 'Open this screen from a tour page to propose a trip');
      return;
    }
    // Check duplicate
    const alreadyProposed = (groupTrips || []).some(
      t => t.listingId === listingId && t.status === 'PLANNING'
    );
    if (alreadyProposed) {
      Alert.alert('Already Added', `"${listingTitle || 'This tour'}" is already in the planning list for this group.`);
      return;
    }
    try {
      const res = await wanderService.proposeTrip(groupCode, {
        listingId,
        proposedByMemberId: myMemberId,
        travelDate: formatDateStr(travelDate),
        note: tripNote.trim() || null,
      });
      if (res?.success) {
        Alert.alert('Trip Proposed! ✅', `"${listingTitle || 'This tour'}" has been added to ${groupCode}. Members will be notified.`);
        loadData();
      }
    } catch {
      Alert.alert('Error', 'Could not propose trip');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Group Trips</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Plan with Friends</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreate(true)}
        >
          <Icon name="plus" size={18} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Tour context banner */}
      {listingId && listingTitle && (
        <View style={styles.tourBanner}>
          <Ionicons name="compass-outline" size={16} color={GREEN} />
          <Text style={styles.tourBannerText} numberOfLines={1}>
            Planning for: <Text style={{ fontWeight: '700' }}>{listingTitle}</Text>
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* My Groups */}
        {myGroups.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptySub}>Create a group and invite your friends to plan a trip together</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Create First Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>My Groups ({myGroups.length})</Text>
            {myGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                customerId={customer?.id}
                listingId={listingId}
                listingTitle={listingTitle}
                onShare={() => handleShare(group)}
                onAddTrip={() => handleAddTripToGroup(group.groupCode, group.id, group.myMemberId, group.trips)}
                onNavigate={() => navigation.navigate('WanderGroupDetail', { groupCode: group.groupCode })}
              />
            ))}

            {listingId && (
              <TouchableOpacity style={styles.newGroupBtn} onPress={() => setShowCreate(true)}>
                <Icon name="plus-circle" size={18} color={GREEN} />
                <Text style={styles.newGroupBtnText}>Create New Group for This Tour</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* CREATE GROUP MODAL */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.backBtn}>
              <Icon name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>New Group Trip</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Tour context */}
            {listingTitle && (
              <View style={styles.tourPill}>
                <Ionicons name="compass-outline" size={15} color={GREEN} />
                <Text style={styles.tourPillText} numberOfLines={2}>{listingTitle}</Text>
              </View>
            )}

            {/* Group Photo picker */}
            <View style={{ alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
              <TouchableOpacity onPress={handlePickGroupAvatar} activeOpacity={0.8}>
                <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F8F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GREEN, borderStyle: 'dashed', overflow: 'hidden' }}>
                  {groupAvatarUri ? (
                    <Image source={{ uri: groupAvatarUri }} style={{ width: 90, height: 90, borderRadius: 45 }} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="camera-outline" size={28} color={GREEN} />
                      <Text style={{ fontSize: 10, color: GREEN, fontWeight: '600', marginTop: 4 }}>Add Photo</Text>
                    </View>
                  )}
                </View>
                {groupAvatarUri && (
                  <TouchableOpacity onPress={() => setGroupAvatarUri(null)}
                    style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' }}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Group photo (optional)</Text>
            </View>

            {/* Emoji picker */}
            <Text style={styles.fieldLabel}>Group Emoji</Text>
            <TouchableOpacity
              style={[styles.inputRow, { justifyContent: 'space-between' }]}
              onPress={() => setShowEmojiPicker(p => !p)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 28 }}>{groupEmoji}</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>Tap to change</Text>
            </TouchableOpacity>
            {showEmojiPicker && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12 }}>
                {EMOJI_OPTIONS.map(e => (
                  <TouchableOpacity key={e} onPress={() => { setGroupEmoji(e); setShowEmojiPicker(false); }}
                    style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: groupEmoji === e ? '#E8F8F2' : '#fff',
                      borderWidth: 1.5, borderColor: groupEmoji === e ? GREEN : '#E5E7EB' }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Group Name *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="people-outline" size={16} color="#94A3B8" />
              <TextInput
                style={styles.inputField}
                placeholder='e.g. "College Gang", "Family Trip"'
                placeholderTextColor="#94A3B8"
                value={groupName} onChangeText={setGroupName}
              />
            </View>

            <Text style={styles.fieldLabel}>Max Members (optional)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={16} color="#94A3B8" />
              <TextInput
                style={styles.inputField}
                placeholder="Leave empty for unlimited"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={maxMembers} onChangeText={setMaxMembers}
              />
            </View>

            <Text style={styles.fieldLabel}>Travel Date (optional)</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Icon name="calendar" size={16} color="#94A3B8" />
              <Text style={[styles.inputField, { paddingVertical: 0, color: travelDate ? '#111827' : '#94A3B8' }]}>
                {travelDate
                  ? travelDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Select date (optional)'}
              </Text>
              {travelDate && (
                <TouchableOpacity onPress={() => setTravelDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={travelDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setTravelDate(selectedDate);
                }}
              />
            )}

            <Text style={styles.fieldLabel}>Trip Note (optional)</Text>
            <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 12 }]}>
              <Icon name="edit-3" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.inputField, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Annual trip! Budget ~₹5000 per person"
                placeholderTextColor="#94A3B8"
                multiline numberOfLines={3}
                value={tripNote} onChangeText={setTripNote}
              />
            </View>

            <View style={styles.infoBox}>
              <Icon name="info" size={13} color={GREEN} />
              <Text style={styles.infoText}>
                {' '}After creating, you'll get a shareable link/code to invite your friends.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, creating && { opacity: 0.6 }]}
              onPress={handleCreateGroup} disabled={creating}
            >
              {creating
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="people-outline" size={17} color="#fff" /><Text style={styles.submitBtnText}>Create Group</Text></>
              }
            </TouchableOpacity>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* SHARE MODAL */}
      {shareGroup && (
        <Modal visible={!!shareGroup} animationType="fade" transparent onRequestClose={() => setShareGroup(null)}>
          <View style={styles.shareOverlay}>
            <View style={styles.shareCard}>
              <LinearGradient colors={['#09B368', '#06A35C']} style={styles.shareIconWrap}>
                <Ionicons name="people" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.shareTitle}>Share Invite</Text>
              <Text style={styles.shareSub}>"{shareGroup.name}"</Text>
              <View style={styles.shareCodeBox}>
                <Text style={styles.shareCodeLabel}>Invite Link</Text>
                <Text style={[styles.shareCode, { fontSize: 13, letterSpacing: 0, fontWeight: '700' }]} numberOfLines={2}>
                  transrentals.in/wander/group/{shareGroup.groupCode}
                </Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={() => { handleShare(shareGroup); setShareGroup(null); }}>
                <Icon name="share-2" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>Share with Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareDismiss} onPress={() => setShareGroup(null)}>
                <Text style={styles.shareDismissText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

/* ── Group Card ──────────────────────────────────────────────────────────── */
function GroupCard({ group, customerId, listingId, listingTitle, onShare, onAddTrip, onNavigate }) {
  const planningTrips = (group.trips || []).filter(t => t.status === 'PLANNING');
  const submittedTrips = (group.trips || []).filter(t => t.status === 'SUBMITTED');

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <LinearGradient colors={['#09B368', '#06A35C']} style={styles.groupAvatar}>
          <Text style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.hasUnread && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
            )}
          </View>
          <Text style={styles.groupMeta}>
            {group.members?.length || 0} members · {group.myRole === 'ADMIN' ? '👑 Admin' : 'Member'}
          </Text>
        </View>
        <TouchableOpacity onPress={onShare} style={styles.shareIconBtn}>
          <Icon name="share-2" size={16} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Trips summary */}
      {planningTrips.length > 0 && (
        <View style={styles.tripsSummary}>
          <Text style={styles.tripsLabel}>Planning ({planningTrips.length})</Text>
          {planningTrips.slice(0, 2).map(trip => {
            const myResponse = trip.tripMembers?.find(m => m.groupMemberId === group.myMemberId);
            const goingCfg = GOING_CONFIG[myResponse?.isGoing] || GOING_CONFIG.MAYBE;
            const goingCount = trip.tripMembers?.filter(m => m.isGoing === 'YES').length || 0;
            return (
              <View key={trip.id} style={styles.tripRow}>
                <Ionicons name="compass-outline" size={14} color={GREEN} />
                <Text style={styles.tripTitle} numberOfLines={1}>
                  {trip.listing?.title || 'Open Trip'}{trip.travelDate ? ` · ${fmtDate(trip.travelDate)}` : ''}
                </Text>
                <View style={[styles.goingBadge, { backgroundColor: goingCfg.bg }]}>
                  <Text style={[styles.goingText, { color: goingCfg.color }]}>{goingCfg.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {submittedTrips.length > 0 && (
        <View style={[styles.tripsSummary, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.tripsLabel, { color: GREEN }]}>✅ {submittedTrips.length} trip{submittedTrips.length > 1 ? 's' : ''} quoted</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onNavigate}>
          <Icon name="eye" size={14} color={GREEN} />
          <Text style={styles.actionBtnText}>View Group</Text>
        </TouchableOpacity>
        {listingId && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFilled]} onPress={onAddTrip}>
            <Icon name="plus" size={14} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Add This Tour</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between', backgroundColor: BG,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  createBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: '#E8F8F2',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  tourBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F8F2', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(9,179,104,0.15)',
  },
  tourBannerText: { flex: 1, fontSize: 13, color: '#0F172A' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, marginTop: 24,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Group card
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14,
    padding: 16, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  groupAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  groupAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  groupName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  groupMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  shareIconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F8F2',
    justifyContent: 'center', alignItems: 'center',
  },

  tripsSummary: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  tripsLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tripTitle: { flex: 1, fontSize: 12, color: '#374151' },
  goingBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  goingText: { fontSize: 10, fontWeight: '700' },

  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: GREEN, borderRadius: 12, paddingVertical: 10,
    backgroundColor: '#E8F8F2',
  },
  actionBtnFilled: { backgroundColor: GREEN, borderColor: GREEN },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: GREEN },

  // New group button
  newGroupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: GREEN, borderRadius: 14, paddingVertical: 14,
    borderStyle: 'dashed', marginTop: 4,
  },
  newGroupBtnText: { fontSize: 14, color: GREEN, fontWeight: '600' },

  // Modal form fields
  tourPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F8F2', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)',
  },
  tourPillText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 18, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
  },
  inputField: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4',
    borderRadius: 12, padding: 12, marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.15)',
  },
  infoText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, marginTop: 20,
    elevation: 4, shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Share modal
  shareOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  shareCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center',
    elevation: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30,
  },
  shareIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  shareTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  shareSub: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  shareCodeBox: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    width: '100%', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)',
  },
  shareCodeLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  shareCode: { fontSize: 28, fontWeight: '900', color: GREEN, letterSpacing: 3 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14,
    width: '100%', justifyContent: 'center', marginBottom: 10,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  shareDismiss: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  shareDismissText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
