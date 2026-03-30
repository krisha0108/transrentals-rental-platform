import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getVehicle, updateVehicle, uploadVehiclePhoto, deleteVehiclePhoto, deleteFuelLog, deleteIncident } from '../api/client';
import moment from 'moment';

const SCREEN_W = Dimensions.get('window').width;

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6', purple: '#7C3AED',
};

// Photo slots for labeled uploads
const PHOTO_SLOTS = [
  { key: 'front',     label: 'Front',     icon: 'car-outline' },
  { key: 'back',      label: 'Back',      icon: 'car-outline' },
  { key: 'leftSide',  label: 'Left Side', icon: 'car-outline' },
  { key: 'rightSide', label: 'Right Side',icon: 'car-outline' },
  { key: 'interior',  label: 'Interior',  icon: 'grid-outline' },
];

const FIELD_TO_KEY = {
  photoFront:     'front',
  photoBack:      'back',
  photoLeftSide:  'leftSide',
  photoRightSide: 'rightSide',
  photoInterior:  'interior',
};

function docDays(expiry) {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry) - new Date()) / 86400000);
}

function DocCard({ label, number, expiry }) {
  if (!number && !expiry) return null;
  const days = docDays(expiry);
  const expired  = days !== null && days <= 0;
  const urgent   = days !== null && days > 0 && days <= 7;
  const warning  = days !== null && days > 7  && days <= 30;
  const ok       = days !== null && days > 30;

  const statusColor = expired || urgent ? C.danger : warning ? C.warn : C.success;
  const statusBg    = expired || urgent ? '#FEF2F2' : warning ? '#FFFBEB' : '#F0FDF4';
  const statusLabel = expired ? 'Expired' : days !== null ? `${days}d left` : '—';
  const statusIcon  = expired || urgent ? 'warning' : warning ? 'alert-circle-outline' : 'checkmark-circle-outline';

  return (
    <View style={styles.docCard}>
      <View style={styles.docLeft}>
        <Text style={styles.docLabel}>{label}</Text>
        {number ? <Text style={styles.docNumber}>{number}</Text> : null}
        {expiry ? <Text style={styles.docExpiry}>{expired ? 'Expired ' : 'Expires '}{moment(expiry).format('DD MMM YYYY')}</Text> : null}
      </View>
      {expiry ? (
        <View style={[styles.docStatus, { backgroundColor: statusBg }]}>
          <Ionicons name={statusIcon} size={13} color={statusColor} />
          <Text style={[styles.docStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [uploadingSlot, setUploadingSlot]   = useState(null); // which slot is uploading
  const [lightboxUrl, setLightboxUrl]       = useState(null);
  const [toggling, setToggling]             = useState(false);

  useEffect(() => {
    getVehicle(vehicleId)
      .then(res => setVehicle(res.data.vehicle))
      .catch(() => Alert.alert('Error', 'Failed to load vehicle'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  function reload() {
    getVehicle(vehicleId).then(res => setVehicle(res.data.vehicle)).catch(() => {});
  }

  async function uploadSlot(slotKey) {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingSlot(slotKey);
    try {
      await uploadVehiclePhoto(vehicleId, asset.uri, asset.fileName || 'photo.jpg', asset.type || 'image/jpeg', slotKey);
      reload();
    } catch {
      Alert.alert('Error', 'Failed to upload photo');
    }
    setUploadingSlot(null);
  }

  async function removeSlotPhoto(slotKey) {
    Alert.alert('Remove Photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteVehiclePhoto(vehicleId, null, slotKey); reload(); }
          catch { Alert.alert('Error', 'Failed to remove photo'); }
        }
      },
    ]);
  }

  async function handleDeleteFuelLog(logId) {
    Alert.alert('Delete Fuel Log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteFuelLog(vehicleId, logId); reload(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  }

  async function handleDeleteIncident(incidentId) {
    Alert.alert('Delete Incident', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteIncident(vehicleId, incidentId); reload(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  }

  async function toggleActive() {
    setToggling(true);
    try {
      const res = await updateVehicle(vehicleId, { isActive: !vehicle.isActive });
      setVehicle(res.data.vehicle);
    } catch {
      Alert.alert('Error', 'Failed to update vehicle');
    }
    setToggling(false);
  }

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color={C.primary} /></View>
  );
  if (!vehicle) return null;

  const isVendor = !!vehicle.isVendorVehicle;
  const logs = vehicle.maintenance_logs || [];
  const fuelLogs = vehicle.fuel_logs || [];
  const incidents = vehicle.incidents || [];

  const metaChips = [
    vehicle.year            && { icon: 'calendar-outline',      label: String(vehicle.year) },
    vehicle.category        && { icon: 'car-sport-outline',     label: vehicle.category },
    vehicle.fuelType        && { icon: 'flash-outline',          label: vehicle.fuelType },
    vehicle.seatingCapacity && { icon: 'people-outline',         label: `${vehicle.seatingCapacity} seats` },
    vehicle.color           && { icon: 'color-palette-outline',  label: vehicle.color },
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Lightbox */}
      <Modal visible={!!lightboxUrl} transparent animationType="fade" onRequestClose={() => setLightboxUrl(null)}>
        <TouchableOpacity style={styles.lightboxOverlay} onPress={() => setLightboxUrl(null)} activeOpacity={1}>
          {lightboxUrl && <Image source={{ uri: lightboxUrl }} style={styles.lightboxImg} resizeMode="contain" />}
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxUrl(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Gradient Hero Header */}
      <LinearGradient
        colors={vehicle.isActive ? ['#043927', '#065F46', '#16A34A'] : ['#1E293B', '#334155', '#64748B']}
        style={styles.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {!isVendor && (
            <>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id, vehicle })}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil-outline" size={14} color="#fff" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: vehicle.isActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)' }]}
                onPress={toggleActive}
                disabled={toggling}
                activeOpacity={0.85}
              >
                {toggling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Ionicons name={vehicle.isActive ? 'pause-circle-outline' : 'play-circle-outline'} size={14} color="#fff" />
                      <Text style={styles.toggleBtnText}>{vehicle.isActive ? 'Deactivate' : 'Activate'}</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.heroBody}>
          <View style={styles.heroIconBox}>
            <Ionicons name="car" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.heroName}>{vehicle.make} {vehicle.model}</Text>
            {vehicle.registrationNo ? (
              <View style={styles.regBadge}>
                <Text style={styles.regText}>{vehicle.registrationNo}</Text>
              </View>
            ) : null}
          </View>
          {!vehicle.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
            </View>
          )}
          {isVendor && (
            <View style={styles.vendorBadge}>
              <Ionicons name="business-outline" size={11} color="#93C5FD" />
              <Text style={styles.vendorBadgeText}>Vendor</Text>
            </View>
          )}
        </View>

        {metaChips.length > 0 && (
          <View style={styles.heroChips}>
            {metaChips.map((c, i) => (
              <View key={i} style={styles.heroChip}>
                <Ionicons name={c.icon} size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroChipText}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Documents ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={13} color={C.blue} />
            </View>
            <Text style={styles.sectionTitle}>Documents</Text>
          </View>
          <View style={styles.sectionBody}>
            <DocCard label="Insurance" number={vehicle.insuranceNumber} expiry={vehicle.insuranceExpiry} />
            <DocCard label="RC (Registration)" number={vehicle.rcNumber} expiry={vehicle.rcExpiry} />
            <DocCard label="Fitness Certificate" expiry={vehicle.fitnessExpiry} />
            <DocCard label="Permit" expiry={vehicle.permitExpiry} />
          </View>
        </View>

        {/* ── Vehicle Photos (labeled slots) — own vehicles only ── */}
        {!isVendor && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="camera-outline" size={13} color="#9333EA" />
              </View>
              <Text style={styles.sectionTitle}>Vehicle Photos</Text>
            </View>
            <View style={styles.photoSlotGrid}>
              {PHOTO_SLOTS.map(slot => {
                const fieldKey = Object.keys(FIELD_TO_KEY).find(k => FIELD_TO_KEY[k] === slot.key);
                const url = vehicle[fieldKey] || null;
                const isUploading = uploadingSlot === slot.key;

                return (
                  <View key={slot.key} style={styles.photoSlot}>
                    <TouchableOpacity
                      style={[styles.photoSlotBox, url && styles.photoSlotFilled]}
                      onPress={() => url ? setLightboxUrl(url) : uploadSlot(slot.key)}
                      onLongPress={() => url ? removeSlotPhoto(slot.key) : null}
                      activeOpacity={0.85}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color={C.primary} />
                      ) : url ? (
                        <>
                          <Image source={{ uri: url }} style={styles.photoSlotImg} resizeMode="cover" />
                          <TouchableOpacity
                            style={styles.photoSlotEdit}
                            onPress={() => uploadSlot(slot.key)}
                          >
                            <Ionicons name="camera" size={12} color="#fff" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={20} color={C.sub} />
                          <Text style={styles.photoSlotHint}>Tap to add</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Service Info ── */}
        {(vehicle.currentOdometer || vehicle.lastServiceDate || vehicle.nextServiceDate) && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="construct-outline" size={13} color="#EA580C" />
              </View>
              <Text style={styles.sectionTitle}>Service Info</Text>
            </View>
            <View style={styles.sectionBody}>
              {vehicle.currentOdometer ? (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="speedometer-outline" size={14} color={C.blue} />
                  </View>
                  <Text style={styles.infoLabel}>Odometer</Text>
                  <Text style={styles.infoValue}>{vehicle.currentOdometer.toLocaleString('en-IN')} km</Text>
                </View>
              ) : null}
              {vehicle.lastServiceDate ? (
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={C.success} />
                  </View>
                  <Text style={styles.infoLabel}>Last Service</Text>
                  <Text style={styles.infoValue}>{moment(vehicle.lastServiceDate).format('DD MMM YYYY')}</Text>
                </View>
              ) : null}
              {vehicle.nextServiceDate ? (
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <View style={[styles.infoIcon, { backgroundColor: '#FFFBEB' }]}>
                    <Ionicons name="calendar-outline" size={14} color={C.warn} />
                  </View>
                  <Text style={styles.infoLabel}>Next Service</Text>
                  <Text style={[styles.infoValue, { color: C.warn }]}>{moment(vehicle.nextServiceDate).format('DD MMM YYYY')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Maintenance Logs ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="clipboard-outline" size={13} color={C.purple} />
            </View>
            <Text style={styles.sectionTitle}>Maintenance Logs</Text>
            {!isVendor && (
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add" size={13} color={C.primary} />
                <Text style={styles.sectionActionText}>Add Log</Text>
              </TouchableOpacity>
            )}
          </View>

          {logs.length === 0 ? (
            isVendor ? (
              <View style={styles.emptyBox}>
                <Ionicons name="clipboard-outline" size={20} color={C.sub} />
                <Text style={styles.emptyText}>No maintenance logs</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.emptyBox}
                onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
                <Text style={[styles.emptyText, { color: C.primary }]}>Add first maintenance log</Text>
              </TouchableOpacity>
            )
          ) : (
            <View>
              {logs.map((log, i) => (
                <View key={log.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: C.purple }]} />
                    {i < logs.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.logTopRow}>
                      <View style={[styles.typeBadge, { backgroundColor: '#F5F3FF' }]}>
                        <Text style={[styles.typeBadgeText, { color: C.purple }]}>{log.type}</Text>
                      </View>
                      <Text style={styles.logDate}>{moment(log.date).format('DD MMM YYYY')}</Text>
                    </View>
                    {log.description ? <Text style={styles.logDesc}>{log.description}</Text> : null}
                    <View style={styles.logMeta}>
                      {log.cost > 0 && (
                        <View style={styles.logMetaChip}>
                          <Ionicons name="cash-outline" size={11} color={C.success} />
                          <Text style={[styles.logMetaText, { color: C.success }]}>₹{log.cost.toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      {log.odometer ? (
                        <View style={styles.logMetaChip}>
                          <Ionicons name="speedometer-outline" size={11} color={C.sub} />
                          <Text style={styles.logMetaText}>{log.odometer.toLocaleString('en-IN')} km</Text>
                        </View>
                      ) : null}
                      {log.nextDueDate ? (
                        <View style={styles.logMetaChip}>
                          <Ionicons name="calendar-outline" size={11} color={C.warn} />
                          <Text style={[styles.logMetaText, { color: C.warn }]}>Next: {moment(log.nextDueDate).format('DD MMM')}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Fuel Logs — own vehicles only ── */}
        {!isVendor && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="water-outline" size={13} color="#EA580C" />
              </View>
              <Text style={styles.sectionTitle}>Fuel Logs</Text>
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add" size={13} color={C.primary} />
                <Text style={styles.sectionActionText}>Add Log</Text>
              </TouchableOpacity>
            </View>

            {fuelLogs.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyBox}
                onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
                <Text style={[styles.emptyText, { color: C.primary }]}>Add first fuel log</Text>
              </TouchableOpacity>
            ) : (
              <View>
                {fuelLogs.map((log, i) => (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: '#EA580C' }]} />
                      {i < fuelLogs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineBody}>
                      <View style={styles.logTopRow}>
                        <View style={[styles.typeBadge, { backgroundColor: '#FFF7ED' }]}>
                          <Text style={[styles.typeBadgeText, { color: '#EA580C' }]}>
                            {log.fuelType || 'Fuel'} · {log.liters}L
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.logDate}>{moment(log.date).format('DD MMM YYYY')}</Text>
                          <TouchableOpacity onPress={() => handleDeleteFuelLog(log.id)}>
                            <Ionicons name="trash-outline" size={14} color={C.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {log.fuelStation ? <Text style={styles.logDesc}>{log.fuelStation}</Text> : null}
                      <View style={styles.logMeta}>
                        <View style={styles.logMetaChip}>
                          <Ionicons name="cash-outline" size={11} color={C.success} />
                          <Text style={[styles.logMetaText, { color: C.success }]}>₹{log.totalAmount.toLocaleString('en-IN')}</Text>
                        </View>
                        {log.pricePerLiter ? (
                          <View style={styles.logMetaChip}>
                            <Ionicons name="pricetag-outline" size={11} color={C.sub} />
                            <Text style={styles.logMetaText}>₹{log.pricePerLiter}/L</Text>
                          </View>
                        ) : null}
                        {log.odometer ? (
                          <View style={styles.logMetaChip}>
                            <Ionicons name="speedometer-outline" size={11} color={C.sub} />
                            <Text style={styles.logMetaText}>{log.odometer.toLocaleString('en-IN')} km</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Incidents — own vehicles only ── */}
        {!isVendor && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="warning-outline" size={13} color={C.danger} />
              </View>
              <Text style={styles.sectionTitle}>Incidents</Text>
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() => navigation.navigate('AddIncident', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add" size={13} color={C.primary} />
                <Text style={styles.sectionActionText}>Report</Text>
              </TouchableOpacity>
            </View>

            {incidents.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyBox}
                onPress={() => navigation.navigate('AddIncident', { vehicleId: vehicle.id })}
              >
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
                <Text style={[styles.emptyText, { color: C.primary }]}>Report an incident</Text>
              </TouchableOpacity>
            ) : (
              <View>
                {incidents.map((inc, i) => {
                  const sevColor = inc.severity === 'HIGH' ? C.danger : inc.severity === 'LOW' ? C.success : C.warn;
                  const sevBg    = inc.severity === 'HIGH' ? '#FEF2F2' : inc.severity === 'LOW' ? '#F0FDF4' : '#FFFBEB';
                  const statusColor = inc.repairStatus === 'RESOLVED' ? C.success : inc.repairStatus === 'IN_PROGRESS' ? C.blue : C.sub;
                  return (
                    <View key={inc.id} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: sevColor }]} />
                        {i < incidents.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineBody}>
                        <View style={styles.logTopRow}>
                          <View style={[styles.typeBadge, { backgroundColor: sevBg }]}>
                            <Text style={[styles.typeBadgeText, { color: sevColor }]}>{inc.type}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.logDate}>{moment(inc.date).format('DD MMM YYYY')}</Text>
                            <TouchableOpacity onPress={() => handleDeleteIncident(inc.id)}>
                              <Ionicons name="trash-outline" size={14} color={C.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {inc.description ? <Text style={styles.logDesc}>{inc.description}</Text> : null}
                        <View style={styles.logMeta}>
                          <View style={styles.logMetaChip}>
                            <Ionicons name="ellipse" size={8} color={statusColor} />
                            <Text style={[styles.logMetaText, { color: statusColor }]}>
                              {inc.repairStatus === 'IN_PROGRESS' ? 'In Progress' : inc.repairStatus === 'RESOLVED' ? 'Resolved' : 'Pending'}
                            </Text>
                          </View>
                          {inc.repairCost ? (
                            <View style={styles.logMetaChip}>
                              <Ionicons name="cash-outline" size={11} color={C.sub} />
                              <Text style={styles.logMetaText}>₹{inc.repairCost.toLocaleString('en-IN')}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },

  // Hero
  hero:        { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  heroNav:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  editBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  toggleBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, marginLeft: 6 },
  toggleBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  heroBody:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  heroName:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 5 },
  regBadge:    { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  regText:     { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  inactiveBadge:   { backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  inactiveBadgeText: { fontSize: 10, color: '#FCA5A5', fontWeight: '800', letterSpacing: 0.5 },
  vendorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(147,197,253,0.2)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  vendorBadgeText: { fontSize: 10, color: '#93C5FD', fontWeight: '700' },

  heroChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  heroChipText:{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Sections
  section:      { paddingHorizontal: 16, marginTop: 16 },
  sectionHead:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  sectionIcon:  { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionAction:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionActionText: { fontSize: 12, color: C.primary, fontWeight: '700' },
  sectionBody:  { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },

  // Document card
  docCard:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  docLeft:     {},
  docLabel:    { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  docNumber:   { fontSize: 11, color: C.sub, fontWeight: '500' },
  docExpiry:   { fontSize: 11, color: C.sub, marginTop: 1 },
  docStatus:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  docStatusText: { fontSize: 11, fontWeight: '700' },

  // Info row (service)
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  infoRowLast:  { borderBottomWidth: 0 },
  infoIcon:     { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoLabel:    { flex: 1, fontSize: 13, color: C.sub, fontWeight: '500' },
  infoValue:    { fontSize: 13, color: C.text, fontWeight: '700' },

  // Photo slots
  photoSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot:     { width: (SCREEN_W - 64) / 3, alignItems: 'center' },
  photoSlotBox:  { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoSlotFilled: { borderStyle: 'solid', borderColor: 'transparent' },
  photoSlotImg:  { width: '100%', height: '100%' },
  photoSlotEdit: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  photoSlotHint: { fontSize: 10, color: C.sub, marginTop: 4, fontWeight: '600' },
  photoSlotLabel:{ fontSize: 11, color: C.sub, fontWeight: '700', marginTop: 5, textAlign: 'center' },

  // Empty state
  emptyBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  emptyText: { fontSize: 14, color: C.sub, fontWeight: '600' },

  // Timeline logs
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { width: 28, alignItems: 'center', paddingTop: 14 },
  timelineDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  timelineLine: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },
  timelineBody: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  logTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:{ fontSize: 11, fontWeight: '800' },
  logDate:      { fontSize: 11, color: C.sub },
  logDesc:      { fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 18 },
  logMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  logMetaChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  logMetaText:  { fontSize: 11, color: C.sub, fontWeight: '600' },

  // Lightbox
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  lightboxImg:     { width: SCREEN_W, height: SCREEN_W * 1.2, maxHeight: '90%' },
  lightboxClose:   { position: 'absolute', top: 48, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});
