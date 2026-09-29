/**
 * WanderGroupDetailScreen.js — Fixed version
 * Fixes: group delete, submit form, date picker, chat UX, duplicate tour
 * Added: remove member, pin date, nudge, cancel trip, change tour,
 *        message reactions, group avatar, read receipts, max members setting
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
  Modal, FlatList, KeyboardAvoidingView, Platform, Linking, Image, Share,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import wanderService from '../../services/wanderService';
import { BASE_URL } from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return str; }
}

function timeAgo(str) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const GOING_CONFIG = {
  YES:   { label: '✅ Going',  color: '#09B368', bg: '#E8F8F2' },
  MAYBE: { label: '🤔 Maybe', color: '#D97706', bg: '#FEF3C7' },
  NO:    { label: '❌ No',    color: '#DC2626', bg: '#FEE2E2' },
};

const REACTION_EMOJIS = ['👍', '❤️', '😄', '😮', '😢'];

/* ─── Avatar ──────────────────────────────────────────────────── */
function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'];
  const bg = colors[(name || '?').charCodeAt(0) % colors.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

/* ─── Respond Modal ───────────────────────────────────────────── */
function RespondModal({ visible, trip, memberId, currentResponse, onClose, onSave }) {
  const [going, setGoing] = useState(currentResponse?.isGoing || 'MAYBE');
  const [req, setReq] = useState(currentResponse?.requirements || '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setGoing(currentResponse?.isGoing || 'MAYBE');
      setReq(currentResponse?.requirements || '');
    }
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(trip.id, memberId, going, req);
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Your Response</Text>
          <Text style={styles.modalSub} numberOfLines={2}>{trip?.listing?.title || 'Trip Proposal'}</Text>

          <Text style={styles.fieldLabel}>Are you going?</Text>
          <View style={styles.goingRow}>
            {Object.entries(GOING_CONFIG).map(([key, cfg]) => (
              <TouchableOpacity key={key}
                style={[styles.goingBtn, going === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                onPress={() => setGoing(key)}>
                <Text style={[styles.goingBtnText, going === key && { color: cfg.color, fontWeight: '700' }]}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {going === 'YES' && (
            <>
              <Text style={styles.fieldLabel}>Special Requirements (optional)</Text>
              <TextInput style={styles.reqInput}
                placeholder="Dietary needs, room type, accessibility..."
                placeholderTextColor="#9CA3AF"
                value={req} onChangeText={setReq}
                multiline numberOfLines={3}
              />
            </>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Submit Quote Modal ──────────────────────────────────────── */
function SubmitQuoteModal({ visible, trip, myMemberId, groupCode, onClose, onSuccess }) {
  const [travelDate, setTravelDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [groupSize, setGroupSize] = useState('');
  const [pickup, setPickup] = useState('');
  const [reqs, setReqs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const goingCount = (trip?.tripMembers || []).filter(m => m.isGoing === 'YES').length;

  React.useEffect(() => {
    if (visible) {
      setTravelDate(trip?.travelDate ? new Date(trip.travelDate) : new Date());
      setShowPicker(false);
      setPickup('');
      setReqs('');
    }
  }, [visible]);

  // Always sync group size with confirmed going count
  React.useEffect(() => {
    setGroupSize(String(goingCount || 1));
  }, [goingCount]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const displayDate = (date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    if (travelDate < today) {
      Alert.alert('Invalid Date', 'Travel date cannot be in the past');
      return;
    }
    setSubmitting(true);
    try {
      const res = await wanderService.submitGroupTrip(groupCode, trip.id, {
        memberId: myMemberId,
        travelDate: formatDate(travelDate),
        groupSize: groupSize ? parseInt(groupSize) : undefined,
        pickupLocation: pickup.trim() || undefined,
        extraRequirements: reqs.trim() || undefined,
      });
      if (res?.success) {
        Alert.alert('Submitted! 🎉', `Quote request sent to vendors. Request ID: ${res.requestId}`);
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', res?.error || 'Failed to submit');
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
          <View style={styles.modalHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Submit Group Quote</Text>
            <Text style={styles.modalSub}>{trip?.listing?.title || 'Trip'} · {goingCount} members going</Text>

            <Text style={styles.fieldLabel}>Travel Date *</Text>
            <TouchableOpacity
              style={[styles.formInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#111827', fontSize: 15 }}>{displayDate(travelDate)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={travelDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (selectedDate) setTravelDate(selectedDate);
                }}
              />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 }}>
              <Text style={styles.fieldLabel}>Group Size</Text>
              <Text style={{ fontSize: 11, color: '#09B368', fontWeight: '600' }}>✅ {goingCount} confirmed going</Text>
            </View>
            <TextInput style={styles.formInput}
              placeholderTextColor="#9CA3AF"
              value={groupSize} onChangeText={setGroupSize}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Pickup Location (optional)</Text>
            <TextInput style={styles.formInput}
              placeholder="Hotel name / area / city"
              placeholderTextColor="#9CA3AF"
              value={pickup} onChangeText={setPickup}
            />

            <Text style={styles.fieldLabel}>Special Requirements (optional)</Text>
            <TextInput style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Any group-level special requests..."
              placeholderTextColor="#9CA3AF"
              value={reqs} onChangeText={setReqs}
              multiline numberOfLines={3}
            />

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#7C3AED' }]}
                onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Submit Quote</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Date Vote Modal ─────────────────────────────────────────── */
function DateVoteModal({ visible, trip, myMemberId, groupCode, onClose, onRefresh, isAdmin }) {
  const [options, setOptions] = useState([]);
  const [newDate, setNewDate] = useState(new Date());
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadOptions = async () => {
    if (!trip) return;
    setLoading(true);
    try {
      const res = await wanderService.getGroup(groupCode);
      const t = res?.group?.trips?.find(t => t.id === trip.id);
      if (t?.dateOptions) setOptions(t.dateOptions);
    } catch {}
    finally { setLoading(false); }
  };

  React.useEffect(() => { if (visible && trip) loadOptions(); }, [visible, trip]);

  const handleVote = async (optionId) => {
    try {
      await wanderService.voteDateOption(groupCode, trip.id, myMemberId, optionId);
      await loadOptions();
    } catch (e) {
      Alert.alert('Error', 'Could not vote');
    }
  };

  const handlePinDate = async (optionId) => {
    try {
      await wanderService.pinDate(groupCode, trip.id, myMemberId, optionId);
      Alert.alert('Pinned! 📌', 'Travel date set for this trip.');
      onRefresh();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not pin date');
    }
  };

  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleAdd = async () => {
    // Check duplicate before hitting API
    const selectedStr = formatDateStr(newDate);
    const alreadyExists = options.some(opt => {
      const optStr = formatDateStr(new Date(opt.date));
      return optStr === selectedStr;
    });
    if (alreadyExists) {
      Alert.alert('Date Already Added', 'This date has already been suggested. Please pick a different date.');
      return;
    }
    setLoading(true);
    try {
      const res = await wanderService.addDateOption(groupCode, trip.id, myMemberId, selectedStr);
      if (res?.error) Alert.alert('Error', res.error);
      else { setNewDate(new Date()); await loadOptions(); }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '75%' }]}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.modalTitle}>📅 Date Poll</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>Vote for dates that work for you</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading && options.length === 0 && (
              <ActivityIndicator color={GREEN} style={{ marginVertical: 16 }} />
            )}
            {options.length === 0 && !loading && (
              <Text style={{ color: '#9CA3AF', textAlign: 'center', marginVertical: 16 }}>
                No dates suggested yet. Add one below!
              </Text>
            )}
            {options.map(opt => {
              const myVote = opt.votes?.some(v => v.memberId === myMemberId);
              const voterNames = (opt.votes || []).map(v => v.member?.name || 'Someone');
              return (
                <View key={opt.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleVote(opt.id)}
                      style={[styles.dateOption, { flex: 1 }, myVote && styles.dateOptionVoted]}>
                      <View>
                        <Text style={[styles.dateOptionText, myVote && { color: '#fff' }]}>{fmtDate(opt.date)}</Text>
                        {opt.addedBy?.name ? (
                          <Text style={{ fontSize: 10, color: myVote ? '#C7D2FE' : '#9CA3AF', marginTop: 1 }}>
                            suggested by {opt.addedBy.name}
                          </Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="thumbs-up" size={13} color={myVote ? '#fff' : '#6366F1'} />
                        <Text style={[{ fontSize: 13, fontWeight: '700', color: '#6366F1' }, myVote && { color: '#fff' }]}>
                          {opt.votes?.length || 0}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => handlePinDate(opt.id)}
                        style={styles.pinDateBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ fontSize: 16 }}>📌</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {voterNames.length > 0 && (
                    <Text style={{ fontSize: 10, color: '#6366F1', marginTop: 3, marginLeft: 4 }}>
                      👍 {voterNames.join(', ')}
                    </Text>
                  )}
                </View>
              );
            })}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Suggest a date</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.formInput, { flex: 1, marginBottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowAddPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#111827', fontSize: 14 }}>
                  {newDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} disabled={loading}
                style={[styles.saveBtn, { flex: 0, paddingHorizontal: 18 }]}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
            {showAddPicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowAddPicker(Platform.OS === 'ios');
                  if (selectedDate) setNewDate(selectedDate);
                }}
              />
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.cancelBtn, { marginTop: 12 }]} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Change Tour Modal ───────────────────────────────────────── */
function ChangeTourModal({ visible, onClose, onSave, currentTrip, title, subtitle }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSearch('');
    wanderService.getListings().then(res => {
      setListings(res?.listings || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [visible]);

  const filtered = listings.filter(l =>
    !search.trim() || l.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.modalTitle}>{title || 'Change Tour'}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{subtitle}</Text>
          ) : currentTrip ? (
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
              Current: {currentTrip?.listing?.title || '—'}
            </Text>
          ) : null}
          <TextInput
            style={[styles.formInput, { marginBottom: 8 }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search tours..."
            placeholderTextColor="#9CA3AF"
          />
          {loading && <ActivityIndicator color={GREEN} style={{ marginVertical: 16 }} />}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
            ListEmptyComponent={!loading ? <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>No tours found</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSave(item.id, item.title)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{item.title}</Text>
                  {item.mainLocation?.name ? (
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>📍 {item.mainLocation.name}</Text>
                  ) : null}
                </View>
                {item.basePrice ? (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>₹{item.basePrice}</Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

/* ─── Trip Card ───────────────────────────────────────────────── */
function TripCard({ trip, myMember, isAdmin, onRespond, onSubmit, onDateVote, onNudge, onCancel, onChangeTour, onDelete, onRefresh }) {
  const navigation = useNavigation();
  const yesCount   = (trip.tripMembers || []).filter(m => m.isGoing === 'YES').length;
  const maybeCount = (trip.tripMembers || []).filter(m => m.isGoing === 'MAYBE').length;
  const noCount    = (trip.tripMembers || []).filter(m => m.isGoing === 'NO').length;
  const myTM       = myMember ? (trip.tripMembers || []).find(m => m.groupMemberId === myMember.id) : null;
  const myGoing    = myTM?.isGoing || 'MAYBE';
  const goingCfg   = GOING_CONFIG[myGoing];
  const canSubmit  = trip.status === 'PLANNING' && isAdmin && yesCount > 0;

  const hoursSince  = (Date.now() - new Date(trip.createdAt).getTime()) / 3600000;
  const showReminder = myMember && !isAdmin && myTM?.isGoing === 'MAYBE' && hoursSince >= 24 && trip.status === 'PLANNING';

  const statusCfg = {
    PLANNING:  { bg: '#ECFDF5', border: '#6EE7B7', color: '#059669', label: '🗓 Planning' },
    SUBMITTED: { bg: '#EDE9FE', border: '#8B5CF6', color: '#7C3AED', label: '✅ Submitted' },
    CANCELLED: { bg: '#FEE2E2', border: '#EF4444', color: '#DC2626', label: '❌ Cancelled' },
  }[trip.status] || { bg: '#F3F4F6', border: '#D1D5DB', color: '#6B7280', label: trip.status };

  return (
    <View style={styles.tripCard}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.tripTour} numberOfLines={2}>{trip.listing?.title || 'Unknown Tour'}</Text>
          {trip.travelDate && <Text style={styles.tripDate}>📅 {fmtDate(trip.travelDate)}</Text>}
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
          <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {trip.note ? <Text style={styles.tripNote} numberOfLines={2}>"{trip.note}"</Text> : null}

      {/* View Full Tour */}
      {trip.listing && (
        <TouchableOpacity
          onPress={() => navigation.navigate('WanderListingDetail', { listingId: trip.listing.slug || trip.listing.id })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
          <Ionicons name="compass-outline" size={13} color={GREEN} />
          <Text style={{ fontSize: 12, color: GREEN, fontWeight: '600' }}>View full tour details</Text>
          <Ionicons name="chevron-forward" size={12} color={GREEN} />
        </TouchableOpacity>
      )}

      {showReminder && (
        <View style={styles.reminderBanner}>
          <Text style={styles.reminderText}>⏰ Group is waiting for your response!</Text>
        </View>
      )}

      {/* Response counts */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <View style={[styles.countBadge, { backgroundColor: '#E8F8F2' }]}>
          <Text style={[styles.countBadgeText, { color: '#09B368' }]}>✅ {yesCount} Going</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.countBadgeText, { color: '#D97706' }]}>🤔 {maybeCount} Maybe</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.countBadgeText, { color: '#DC2626' }]}>❌ {noCount} No</Text>
        </View>
      </View>

      {/* Submitted quote info */}
      {trip.status === 'SUBMITTED' && trip.quoteRequest && (
        <View style={styles.quoteInfoCard}>
          <Text style={styles.quoteInfoTitle}>Quote #{trip.quoteRequest.requestId}</Text>
          <Text style={styles.quoteInfoSub}>👥 {trip.quoteRequest.groupSize} members · {trip.quoteRequest.status}</Text>
        </View>
      )}

      {/* Date poll button */}
      {trip.status === 'PLANNING' && myMember && (
        <TouchableOpacity style={styles.datePollBtn} onPress={() => onDateVote(trip)}>
          <Ionicons name="calendar-outline" size={14} color="#6366F1" />
          <Text style={styles.datePollBtnText}>
            Date Poll {trip.dateOptions?.length > 0 ? `(${trip.dateOptions.length} options)` : '— Suggest dates'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Admin: member responses */}
      {isAdmin && (trip.tripMembers || []).length > 0 && (
        <View style={styles.responsesBox}>
          <Text style={styles.responsesTitle}>Member Responses</Text>
          {(trip.tripMembers || []).map(tm => {
            const emoji = tm.isGoing === 'YES' ? '✅' : tm.isGoing === 'NO' ? '❌' : '🤔';
            const color = tm.isGoing === 'YES' ? '#09B368' : tm.isGoing === 'NO' ? '#DC2626' : '#D97706';
            return (
              <View key={tm.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color }}>{tm.groupMember?.name || 'Unknown'}</Text>
                  {tm.requirements ? <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>"{tm.requirements}"</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Admin: Nudge MAYBE members */}
      {isAdmin && trip.status === 'PLANNING' && maybeCount > 0 && (
        <TouchableOpacity style={styles.nudgeBtn} onPress={onNudge}>
          <Text style={styles.nudgeBtnText}>Nudge 🔔 ({maybeCount} Maybe)</Text>
        </TouchableOpacity>
      )}

      {/* Admin: Change Tour (PLANNING trips) */}
      {isAdmin && trip.status === 'PLANNING' && (
        <TouchableOpacity style={styles.changeTourBtn} onPress={() => onChangeTour(trip)}>
          <Ionicons name="swap-horizontal-outline" size={14} color="#6366F1" />
          <Text style={styles.changeTourBtnText}>Change Tour</Text>
        </TouchableOpacity>
      )}

      {/* Respond button (non-admin members only) */}
      {trip.status === 'PLANNING' && myMember && !isAdmin && (
        <TouchableOpacity
          style={[styles.respondBtn, { backgroundColor: goingCfg.bg, borderColor: goingCfg.color }]}
          onPress={() => onRespond(trip, myTM)}>
          <Text style={[styles.respondBtnText, { color: goingCfg.color }]}>{goingCfg.label} — Tap to change</Text>
        </TouchableOpacity>
      )}

      {/* Submit button (admin only, shows form modal) */}
      {canSubmit && (
        <TouchableOpacity style={styles.submitTripBtn} onPress={() => onSubmit(trip)}>
          <Ionicons name="send-outline" size={14} color="#fff" />
          <Text style={styles.submitTripBtnText}>Submit Group Quote ({yesCount} going)</Text>
        </TouchableOpacity>
      )}

      {trip.status === 'SUBMITTED' && (!trip.quotes || trip.quotes.length === 0) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6 }}>
          <Ionicons name="checkmark-circle" size={14} color="#7C3AED" />
          <Text style={{ fontSize: 12, color: '#7C3AED', fontWeight: '500' }}>Quote submitted — vendors responding</Text>
        </View>
      )}

      {/* Vendor Quotes — visible to ALL members */}
      {trip.status === 'SUBMITTED' && trip.quotes && trip.quotes.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
            💼 Vendor Quotes ({trip.quotes.length})
          </Text>
          {trip.quotes.map((q, idx) => {
            const inclusions = q.customInclusions ? (() => { try { return JSON.parse(q.customInclusions); } catch { return []; } })() : [];
            const exclusions = q.customExclusions ? (() => { try { return JSON.parse(q.customExclusions); } catch { return []; } })() : [];
            const isAccepted = q.status === 'ACCEPTED';
            const isRejected = q.status === 'REJECTED';
            return (
              <View key={q.id} style={{
                backgroundColor: isAccepted ? '#F0FDF4' : '#F9FAFB',
                borderWidth: 1.5,
                borderColor: isAccepted ? '#86EFAC' : '#E5E7EB',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }} numberOfLines={1}>
                    {q.vendor?.businessName || `Vendor ${idx + 1}`}
                  </Text>
                  {isAccepted && (
                    <View style={{ backgroundColor: '#22C55E', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>✓ Accepted</Text>
                    </View>
                  )}
                  {isRejected && (
                    <View style={{ backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>Rejected</Text>
                    </View>
                  )}
                </View>

                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 2 }}>
                  ₹{Number(q.amount).toLocaleString('en-IN')}
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}> total</Text>
                </Text>
                {q.perPersonAmount && (
                  <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    ₹{Number(q.perPersonAmount).toLocaleString('en-IN')}/person
                  </Text>
                )}
                {q.validUntil && (
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>
                    Valid till: {new Date(q.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {inclusions.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669', marginBottom: 2 }}>✅ Includes:</Text>
                    {inclusions.map((inc, i) => (
                      <Text key={i} style={{ fontSize: 11, color: '#374151' }}>• {inc}</Text>
                    ))}
                  </View>
                )}
                {exclusions.length > 0 && (
                  <View style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#DC2626', marginBottom: 2 }}>❌ Excludes:</Text>
                    {exclusions.map((exc, i) => (
                      <Text key={i} style={{ fontSize: 11, color: '#374151' }}>• {exc}</Text>
                    ))}
                  </View>
                )}
                {q.notes && (
                  <Text style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 4 }}>"{q.notes}"</Text>
                )}

                {/* Accept button — admin only, only for PENDING quotes */}
                {isAdmin && q.status === 'PENDING' && trip.quoteRequestId && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await wanderService.acceptQuote(trip.quoteRequestId, q.id);
                        navigation.navigate('WanderQuoteDetail', { requestId: trip.quoteRequestId });
                      } catch (e) {
                        Alert.alert('Error', 'Could not accept quote. Try again.');
                      }
                    }}
                    style={{
                      marginTop: 10, backgroundColor: '#059669', borderRadius: 10,
                      paddingVertical: 10, alignItems: 'center', flexDirection: 'row',
                      justifyContent: 'center', gap: 6,
                    }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Accept & Proceed to Payment</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Admin: Cancel / Remove Trip */}
      {isAdmin && trip.status === 'PLANNING' && (
        <TouchableOpacity style={styles.cancelTripBtn} onPress={() => onCancel(trip.id)}>
          <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
          <Text style={styles.cancelTripBtnText}>Cancel / Remove Trip</Text>
        </TouchableOpacity>
      )}
      {isAdmin && trip.status === 'CANCELLED' && (
        <TouchableOpacity style={[styles.cancelTripBtn, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }]}
          onPress={() => onDelete(trip.id)}>
          <Ionicons name="trash-outline" size={14} color="#6B7280" />
          <Text style={[styles.cancelTripBtnText, { color: '#6B7280' }]}>Remove from Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Join Group Card (for non-members arriving via deep link) ─── */
function JoinGroupCard({ groupCode, groupName, onJoined }) {
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    AsyncStorage.getItem('customer').then(raw => {
      if (!raw) return;
      const cust = JSON.parse(raw);
      if (cust?.name) setName(cust.name);
      if (cust?.phone) setPhone(cust.phone);
    }).catch(() => {});
  }, []);

  const handleJoin = async () => {
    if (!name.trim() || !phone.trim()) { setError('Name and phone required'); return; }
    setJoining(true); setError('');
    try {
      const stored = await AsyncStorage.getItem('customer');
      const cust = stored ? JSON.parse(stored) : null;
      const res = await wanderService.joinGroup(groupCode, {
        name: name.trim(),
        phone: phone.trim(),
        customerId: cust?.id || null,
      });
      if (res?.success || res?.member) {
        onJoined();
      } else {
        setError(res?.error || 'Failed to join');
      }
    } catch (e) {
      setError('Could not join. Try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={{ margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 3 }}>
      <LinearGradient colors={['#064E3B', '#059669']} style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#A7F3D0', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>YOU'RE INVITED</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{groupName}</Text>
          </View>
        </View>

        {error ? <Text style={{ color: '#FCA5A5', fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}

        <View style={{ gap: 10 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14 }}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="phone-pad"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14 }}
          />
          <TouchableOpacity
            onPress={handleJoin}
            disabled={joining}
            style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: joining ? 0.7 : 1, marginTop: 4 }}>
            {joining
              ? <ActivityIndicator size="small" color={GREEN} />
              : <Text style={{ color: GREEN, fontWeight: '800', fontSize: 15 }}>Join Group Trip</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────── */
export default function WanderGroupDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupCode, initialTab } = route.params || {};

  const [group, setGroup]     = useState(null);
  const [myMember, setMyMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab === 'chat' ? 'chat' : 'trips');

  // Modals
  const [respondModal, setRespondModal]   = useState(false);
  const [activeTrip, setActiveTrip]       = useState(null);
  const [activeTripMember, setActiveTripMember] = useState(null);
  const [submitModal, setSubmitModal]     = useState(false);
  const [submitTrip, setSubmitTrip]       = useState(null);
  const [dateVoteModal, setDateVoteModal] = useState(false);
  const [dateTripTarget, setDateTripTarget] = useState(null);

  // Chat
  const [messages, setMessages]   = useState([]);
  const [chatMsg, setChatMsg]     = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatListRef = useRef(null);

  // New state variables
  const [memberReads, setMemberReads] = useState([]);
  const [reactingMsgId, setReactingMsgId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [maxMembersInput, setMaxMembersInput] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [changeTourModal, setChangeTourModal] = useState(false);
  const [changeTourTrip, setChangeTourTrip] = useState(null);
  const [addTourModal, setAddTourModal] = useState(false);

  const loadGroup = async () => {
    try {
      const stored = await AsyncStorage.getItem('customer');
      const cust = stored ? JSON.parse(stored) : null;
      const data = await wanderService.getGroup(groupCode);
      const g = data.group || data;
      setGroup(g);
      if (cust && g.members) {
        const me = g.members.find(m => m.customerId === cust.id);
        setMyMember(me || null);
      }
    } catch {
      Alert.alert('Error', 'Failed to load group');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadChat = async () => {
    try {
      const data = await wanderService.getChatMessages(groupCode);
      if (data?.messages) { setMessages(data.messages); setChatLoaded(true); }
      if (data?.memberReads) setMemberReads(data.memberReads);
    } catch {}
  };

  useFocusEffect(useCallback(() => { loadGroup(); }, [groupCode]));

  React.useEffect(() => {
    if (!myMember) return;
    if (activeTab === 'chat') {
      // On chat tab: load, mark read, poll every 8s
      loadChat();
      setUnreadCount(0);
      wanderService.markChatRead(groupCode, myMember.id).catch(() => {});
      const t = setInterval(loadChat, 8000);
      return () => clearInterval(t);
    } else {
      // On trips tab: load chat once just to compute unread badge
      wanderService.getChatMessages(groupCode).then(data => {
        if (!data?.messages || !data?.memberReads) return;
        const myRead = data.memberReads.find(r => r.id === myMember.id);
        const count = myRead?.lastReadAt
          ? data.messages.filter(m => new Date(m.createdAt) > new Date(myRead.lastReadAt)).length
          : data.messages.length;
        setUnreadCount(count);
      }).catch(() => {});
    }
  }, [activeTab, myMember, groupCode]);

  const buildShareText = () => {
    const planningTrips = (group?.trips || []).filter(t => t.status === 'PLANNING');
    const tripLines = planningTrips.slice(0, 2).map(t => `  • ${t.listing?.title || 'Open Trip'}`).join('\n');
    const joinUrl = `${BASE_URL}/wander/group/${group?.groupCode}`;
    return [
      `🌏 *TransRentals Wander*`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `Hey! I'm planning a group trip and want you to join! ${group?.emoji || '🌏'}`,
      ``,
      `*Group:* ${group?.name}`,
      planningTrips.length > 0 ? `*Tours Planning:*\n${tripLines}` : null,
      ``,
      `🔗 *Join here:*\n${joinUrl}`,
      ``,
      `_Powered by TransRentals — Your Travel Partner_ ✈️`,
    ].filter(l => l !== null).join('\n');
  };

  const handleWhatsAppShare = async () => {
    if (!group) return;
    const text = buildShareText();
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const ok = await Linking.canOpenURL(waUrl);
      if (ok) await Linking.openURL(waUrl);
      else Alert.alert('WhatsApp not found', 'Please install WhatsApp to share');
    } catch {}
  };

  const handleNativeShare = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: buildShareText(),
        title: `Join "${group?.name}" — Group Trip on TransRentals`,
      });
    } catch {}
  };

  const handleSaveResponse = async (tripId, memberId, isGoing, requirements) => {
    await wanderService.respondToTrip(groupCode, tripId, { memberId: memberId || myMember?.id, isGoing, requirements });
    await loadGroup();
  };

  const handleLeaveGroup = () => {
    const isAdminUser = myMember?.role === 'ADMIN';
    Alert.alert(
      isAdminUser ? 'Delete Group' : 'Leave Group',
      isAdminUser ? 'Delete this group? All trips and data will be removed permanently.' : 'Leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAdminUser ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await wanderService.leaveGroup(groupCode, myMember?.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.error || 'Failed. Try again.');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!chatMsg.trim() || !myMember) return;
    const msgText = chatMsg.trim();
    setChatMsg('');
    setSendingMsg(true);
    try {
      const data = await wanderService.sendChatMessage(groupCode, myMember.id, msgText);
      if (data?.message) setMessages(prev => [...prev, data.message]);
    } catch {}
    finally { setSendingMsg(false); }
  };

  // Feature 1: Remove member
  const handleRemoveMember = async (targetMemberId, memberName) => {
    Alert.alert('Remove Member', `Remove ${memberName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await wanderService.removeMember(groupCode, targetMemberId, myMember.id);
          loadGroup();
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.error || 'Failed to remove member');
        }
      }},
    ]);
  };

  // Feature 3: Nudge MAYBE members
  const handleNudge = async () => {
    try {
      const res = await wanderService.nudgeMembers(groupCode, myMember.id);
      Alert.alert('Done!', `Nudged ${res.nudgedCount || 0} members who haven't responded`);
    } catch (e) {
      Alert.alert('Error', 'Failed to send nudge');
    }
  };

  // Delete trip completely
  const handleDeleteTrip = async (tripId) => {
    Alert.alert('Remove Trip', 'This will permanently remove the trip from the group.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await wanderService.deleteTrip(groupCode, tripId, myMember.id);
          loadGroup();
        } catch (e) {
          Alert.alert('Error', e?.response?.data?.error || 'Failed to remove trip');
        }
      }},
    ]);
  };

  // Feature 4: Cancel trip
  const handleCancelTrip = async (tripId) => {
    Alert.alert('Cancel Trip', 'What would you like to do?', [
      { text: 'Keep Planning', style: 'cancel' },
      { text: 'Cancel Trip', onPress: async () => {
        try {
          await wanderService.cancelTrip(groupCode, tripId, myMember.id);
          loadGroup();
        } catch (e) {
          Alert.alert('Error', 'Failed to cancel trip');
        }
      }},
      { text: 'Remove Trip', style: 'destructive', onPress: () => handleDeleteTrip(tripId) },
    ]);
  };

  // Propose a new tour to the group
  const handleAddTourToGroup = async (listingId, listingTitle) => {
    if (!listingId || !myMember) return;
    // Check if already planning this listing
    const alreadyPlanning = trips.some(t => t.listingId === listingId && t.status === 'PLANNING');
    if (alreadyPlanning) {
      Alert.alert('Already Added', `"${listingTitle}" is already in your planning list.`);
      return;
    }
    try {
      const res = await wanderService.proposeTrip(groupCode, {
        listingId,
        proposedByMemberId: myMember.id,
        travelDate: null,
        note: null,
      });
      if (res?.success) {
        setAddTourModal(false);
        loadGroup();
        Alert.alert('Tour Added! ✅', `"${listingTitle}" has been added to the group. Members will be notified.`);
      } else {
        Alert.alert('Error', res?.error || 'Failed to add tour');
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not add tour');
    }
  };

  // Feature 5: Change tour save
  const handleChangeTourSave = async (listingId, listingTitle) => {
    if (!listingId || !changeTourTrip) return;
    try {
      await wanderService.changeTour(groupCode, changeTourTrip.id, myMember.id, listingId, listingTitle);
      setChangeTourModal(false);
      setChangeTourTrip(null);
      loadGroup();
      Alert.alert('Done!', `Tour changed to "${listingTitle}"`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to change tour');
    }
  };

  // Feature 6: React to message
  const handleReact = async (messageId, emoji) => {
    try {
      await wanderService.reactToMessage(groupCode, myMember?.id, messageId, emoji);
      loadChat();
    } catch {}
  };

  // Feature 7: Group avatar upload
  const handleAvatarUpload = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (res) => {
      if (res.didCancel || !res.assets?.[0]) return;
      const uri = res.assets[0].uri;
      try {
        const result = await wanderService.uploadGroupAvatar(groupCode, myMember.id, uri);
        if (result?.avatarUrl) loadGroup();
      } catch (e) {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    });
  };

  // Feature 9: Save group settings
  const handleSaveSettings = async () => {
    if (!groupNameInput.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }
    setSavingSettings(true);
    try {
      await wanderService.updateGroupSettings(groupCode, myMember.id, {
        name: groupNameInput.trim(),
        maxMembers: maxMembersInput ? parseInt(maxMembersInput) : null,
      });
      loadGroup();
      setShowSettings(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={{ color: '#6B7280', marginTop: 8 }}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = myMember?.role === 'ADMIN';
  const trips   = group.trips || [];
  const members = group.members || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={['#064E3B', '#059669']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Feature 7: Group avatar */}
          <TouchableOpacity onPress={isAdmin ? handleAvatarUpload : undefined} activeOpacity={isAdmin ? 0.7 : 1}>
            {group.avatarUrl ? (
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: group.avatarUrl.startsWith('http') ? group.avatarUrl : `${BASE_URL}${group.avatarUrl}` }}
                  style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff', marginBottom: 2 }}
                />
                {isAdmin && (
                  <View style={styles.avatarCameraIcon}>
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                )}
              </View>
            ) : (
              <View style={{ position: 'relative' }}>
                <Text style={styles.headerEmoji}>{group.emoji || '🌏'}</Text>
                {isAdmin && (
                  <View style={[styles.avatarCameraIcon, { top: -4, right: -10 }]}>
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.groupCodeText}>{group.groupCode} · {members.length} members</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isAdmin && (
            <TouchableOpacity style={styles.waBtn} onPress={() => {
              setGroupNameInput(group.name || '');
              setMaxMembersInput(group.maxMembers ? String(group.maxMembers) : '');
              setShowSettings(true);
            }}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.waBtn} onPress={handleWhatsAppShare}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[{ key: 'trips', label: '🗺 Trips' }, { key: 'chat', label: '💬 Chat' }].map(tab => (
          <TouchableOpacity key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
              {tab.key === 'chat' && unreadCount > 0 && activeTab !== 'chat' && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TRIPS TAB ── */}
      {activeTab === 'trips' && (
        <ScrollView style={{ flex: 1, backgroundColor: BG }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadGroup(); }} tintColor={GREEN} />}
          showsVerticalScrollIndicator={false}>

          {/* ── Join Card (non-members only) ── */}
          {!myMember && (
            <JoinGroupCard groupCode={groupCode} groupName={group.name} onJoined={loadGroup} />
          )}

          {/* Members strip */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
              {members.map(m => (
                <View key={m.id} style={{ alignItems: 'center', marginRight: 16, width: 60 }}>
                  {/* Feature 1: Remove member button */}
                  <View style={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar name={m.name} size={40} />
                    {isAdmin && m.role !== 'ADMIN' && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(m.id, m.name)}
                        style={styles.removeMemberBtn}>
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, color: '#374151', marginTop: 4, textAlign: 'center', width: 56 }} numberOfLines={1}>{m.name}</Text>
                  {m.role === 'ADMIN' && <Text style={{ fontSize: 8, color: '#D97706', fontWeight: '700' }}>Admin</Text>}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Trips */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginBottom: 0 }]}>Trips ({trips.length})</Text>
              {isAdmin && (
                <TouchableOpacity onPress={() => setAddTourModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8F2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Ionicons name="add-circle-outline" size={15} color={GREEN} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>Add Tour</Text>
                </TouchableOpacity>
              )}
            </View>
            {trips.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
                <Ionicons name="map-outline" size={40} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 8, fontWeight: '600' }}>No trips yet</Text>
                {isAdmin ? (
                  <>
                    <Text style={{ color: '#D1D5DB', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      Tap "Add Tour" to propose a tour for your group
                    </Text>
                    <TouchableOpacity onPress={() => setAddTourModal(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 }}>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Browse & Add Tours</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={{ color: '#D1D5DB', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                    The admin will add a tour for the group soon!
                  </Text>
                )}
              </View>
            ) : (
              trips.map(trip => (
                <TripCard key={trip.id} trip={trip} myMember={myMember} isAdmin={isAdmin}
                  onRespond={(t, tm) => { setActiveTrip(t); setActiveTripMember(tm); setRespondModal(true); }}
                  onSubmit={(t) => { setSubmitTrip(t); setSubmitModal(true); }}
                  onDateVote={(t) => { setDateTripTarget(t); setDateVoteModal(true); }}
                  onNudge={handleNudge}
                  onCancel={handleCancelTrip}
                  onDelete={handleDeleteTrip}
                  onChangeTour={(t) => { setChangeTourTrip(t); setChangeTourModal(true); }}
                  onRefresh={loadGroup}
                />
              ))
            )}
          </View>

          {/* Invite card — branded */}
          <View style={styles.inviteCard}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <LinearGradient colors={['#09B368', '#065F46']} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="airplane" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: GREEN, letterSpacing: 1, textTransform: 'uppercase' }}>TransRentals Wander</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>Invite friends to join your trip!</Text>
              </View>
            </View>

            {/* Invite link box */}
            <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#BBF7D0' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600', marginBottom: 2 }}>INVITE LINK</Text>
                <Text style={{ fontSize: 11, color: '#065F46', fontWeight: '600' }} numberOfLines={1}>
                  transrentals.in/wander/group/{group.groupCode}
                </Text>
              </View>
            </View>

            {/* Share buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={handleWhatsAppShare}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 10 }}>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNativeShare}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: GREEN, borderRadius: 10, paddingVertical: 10 }}>
                <Ionicons name="share-social-outline" size={16} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Leave group */}
          {myMember && (
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveBtn}>
              <Ionicons name={isAdmin ? 'trash-outline' : 'exit-outline'} size={16} color="#EF4444" />
              <Text style={styles.leaveBtnText}>{isAdmin ? 'Delete Group' : 'Leave Group'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 16, flexGrow: 1 }}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                {!chatLoaded
                  ? <><ActivityIndicator size="small" color={GREEN} /><Text style={{ color: '#9CA3AF', marginTop: 8 }}>Loading chat...</Text></>
                  : <><Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" /><Text style={{ color: '#9CA3AF', marginTop: 12 }}>No messages yet</Text><Text style={{ color: '#D1D5DB', fontSize: 12, marginTop: 4 }}>Say hi! 👋</Text></>
                }
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.member?.id === myMember?.id;
              const isReacting = reactingMsgId === item.id;

              // Group reactions by emoji
              const reactionGroups = {};
              (item.reactions || []).forEach(r => {
                if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = 0;
                reactionGroups[r.emoji]++;
              });

              return (
                <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 }, isMe && { flexDirection: 'row-reverse' }]}>
                  {!isMe && <Avatar name={item.member?.name} size={28} />}
                  <View style={{ maxWidth: '75%' }}>
                    {!isMe && <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 3, marginLeft: 4 }}>{item.member?.name}</Text>}
                    {/* Feature 6: Tap message to toggle reaction picker */}
                    <TouchableOpacity
                      onPress={() => setReactingMsgId(isReacting ? null : item.id)}
                      activeOpacity={0.85}>
                      <View style={[{ borderRadius: 16, padding: 10 },
                        isMe ? { backgroundColor: GREEN, borderBottomRightRadius: 4 }
                             : { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 4 }]}>
                        <Text style={{ fontSize: 14, color: isMe ? '#fff' : '#111827', lineHeight: 20 }}>{item.message}</Text>
                      </View>
                    </TouchableOpacity>
                    {/* Existing reactions */}
                    {Object.keys(reactionGroups).length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, marginHorizontal: 4 }}>
                        {Object.entries(reactionGroups).map(([emoji, count]) => (
                          <View key={emoji} style={styles.reactionPill}>
                            <Text style={styles.reactionPillText}>{emoji} {count}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Reaction picker row */}
                    {isReacting && (
                      <View style={[styles.reactionPicker, isMe && { alignSelf: 'flex-end' }]}>
                        {REACTION_EMOJIS.map(emoji => (
                          <TouchableOpacity key={emoji}
                            onPress={() => { handleReact(item.id, emoji); setReactingMsgId(null); }}
                            style={styles.reactionPickerBtn}>
                            <Text style={{ fontSize: 20 }}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3, textAlign: isMe ? 'right' : 'left', marginHorizontal: 4 }}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={() => {
              // Feature 8: Read receipts
              const lastMsg = messages[messages.length - 1];
              const seenBy = lastMsg ? memberReads.filter(m =>
                m.id !== lastMsg.memberId && m.lastReadAt && new Date(m.lastReadAt) > new Date(lastMsg.createdAt)
              ).map(m => m.name) : [];
              return seenBy.length > 0 ? (
                <Text style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginRight: 8, marginTop: 2 }}>
                  Seen by {seenBy.join(', ')}
                </Text>
              ) : null;
            }}
          />
          <View style={styles.chatInputRow}>
            <TextInput style={styles.chatInput}
              value={chatMsg} onChangeText={setChatMsg}
              placeholder="Type a message..." placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity style={[styles.chatSendBtn, (!chatMsg.trim() || sendingMsg) && { opacity: 0.5 }]}
              onPress={handleSendMessage} disabled={sendingMsg || !chatMsg.trim()}>
              {sendingMsg
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Modals */}
      {activeTrip && (
        <RespondModal visible={respondModal} trip={activeTrip} memberId={myMember?.id}
          currentResponse={activeTripMember}
          onClose={() => setRespondModal(false)}
          onSave={handleSaveResponse}
        />
      )}

      {submitTrip && (
        <SubmitQuoteModal visible={submitModal} trip={submitTrip}
          myMemberId={myMember?.id} groupCode={groupCode}
          onClose={() => setSubmitModal(false)}
          onSuccess={loadGroup}
        />
      )}

      {dateTripTarget && (
        <DateVoteModal visible={dateVoteModal} trip={dateTripTarget}
          myMemberId={myMember?.id} groupCode={groupCode}
          onClose={() => setDateVoteModal(false)}
          onRefresh={loadGroup}
          isAdmin={isAdmin}
        />
      )}

      {/* Feature 5: Change Tour Modal */}
      <ChangeTourModal
        visible={changeTourModal}
        onClose={() => { setChangeTourModal(false); setChangeTourTrip(null); }}
        onSave={handleChangeTourSave}
        currentTrip={changeTourTrip}
      />

      {/* Add Tour to Group Modal */}
      <ChangeTourModal
        visible={addTourModal}
        onClose={() => setAddTourModal(false)}
        onSave={handleAddTourToGroup}
        title="Add Tour to Group"
        subtitle="Pick a tour to propose to your group"
      />

      {/* Feature 9: Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.modalTitle}>⚙️ Group Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Group Photo */}
              <Text style={styles.fieldLabel}>Group Photo</Text>
              <TouchableOpacity onPress={() => { setShowSettings(false); setTimeout(handleAvatarUpload, 300); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                  {group.avatarUrl ? (
                    <Image source={{ uri: group.avatarUrl.startsWith('http') ? group.avatarUrl : `${BASE_URL}${group.avatarUrl}` }} style={{ width: 52, height: 52 }} />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{group.emoji || '🌏'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>Change Group Photo</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Tap to pick from gallery</Text>
                </View>
                <Ionicons name="camera-outline" size={20} color="#6B7280" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Group Name</Text>
              <TextInput
                style={[styles.formInput, { marginBottom: 12 }]}
                value={groupNameInput}
                onChangeText={setGroupNameInput}
                placeholder="Enter group name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.fieldLabel}>Max Members</Text>
              <TextInput
                style={[styles.formInput, { marginBottom: 4 }]}
                value={maxMembersInput}
                onChangeText={setMaxMembersInput}
                placeholder="Leave blank for unlimited"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
                Currently: {group.maxMembers ? `${members.length}/${group.maxMembers} members` : 'No limit'}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSettings(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#064E3B' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEmoji: { fontSize: 18, marginBottom: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  groupCodeText: { fontSize: 11, color: '#A7F3D0', marginTop: 2 },
  waBtn: { padding: 4 },

  avatarCameraIcon: { position: 'absolute', bottom: 0, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: GREEN },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabBtnTextActive: { color: GREEN },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  section: { backgroundColor: '#fff', marginTop: 10, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 },

  removeMemberBtn: { position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },

  tripCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  tripTour: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },
  tripDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tripNote: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  countBadgeText: { fontSize: 11, fontWeight: '600' },
  reminderBanner: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 10, padding: 8, marginBottom: 8 },
  reminderText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  quoteInfoCard: { backgroundColor: '#EDE9FE', borderRadius: 10, padding: 10, marginBottom: 8 },
  quoteInfoTitle: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  quoteInfoSub: { fontSize: 11, color: '#8B5CF6', marginTop: 2 },
  datePollBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  datePollBtnText: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  responsesBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 8 },
  responsesTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  respondBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: 'center', marginBottom: 6 },
  respondBtnText: { fontSize: 13, fontWeight: '600' },
  submitTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#7C3AED', borderRadius: 10, paddingVertical: 10, marginTop: 4 },
  submitTripBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  nudgeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, marginTop: 6, borderWidth: 1, borderColor: '#FCD34D' },
  nudgeBtnText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  changeTourBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 10, paddingVertical: 8, marginTop: 6 },
  changeTourBtnText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  cancelTripBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF5F5', borderRadius: 10, paddingVertical: 8, marginTop: 6, borderWidth: 1, borderColor: '#FEE2E2' },
  cancelTripBtnText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  pinDateBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCD34D' },

  reactionPill: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#E5E7EB' },
  reactionPillText: { fontSize: 11, color: '#374151' },
  reactionPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 5, marginTop: 4, borderWidth: 1, borderColor: '#E5E7EB', alignSelf: 'flex-start', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, gap: 4 },
  reactionPickerBtn: { padding: 3 },

  inviteCard: { backgroundColor: '#F0FFF4', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  leaveBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  chatInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 },
  goingRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  goingBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  goingBtnText: { fontSize: 12, color: '#6B7280' },
  reqInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top', minHeight: 70, marginBottom: 16 },
  formInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 2, backgroundColor: GREEN, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  dateOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#C7D2FE', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, backgroundColor: '#fff' },
  dateOptionVoted: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  dateOptionText: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
});
