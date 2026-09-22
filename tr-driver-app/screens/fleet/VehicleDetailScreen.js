import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Modal, Dimensions,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getVehicle, updateVehicle, uploadVehiclePhoto, deleteVehiclePhoto, deleteFuelLog, deleteIncident, deleteMaintenanceLog, getBaseURL } from '../api/client';
import moment from 'moment';

// Build full URL for relative paths from server (e.g. /uploads/...)
function fullUrl(path, base) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

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

  const statusColor = expired || urgent ? C.danger : warning ? C.warn : C.success;
  const statusBg    = expired || urgent ? '#FEF2F2' : warning ? '#FFFBEB' : '#F0FDF4';
  const statusLabel = expired ? 'Expired' : days !== null ? `${days}d left` : '—';
  const statusIcon  = expired || urgent ? 'warning' : warning ? 'alert-circle-outline' : 'checkmark-circle-outline';
  const borderColor = expired || urgent ? C.danger : warning ? C.warn : C.success;

  return (
    <View style={[styles.docCard, { borderLeftColor: borderColor }]}>
      <View style={styles.docLeft}>
        <Text style={styles.docLabel}>{label}</Text>
        {number ? <Text style={styles.docNumber}>{number}</Text> : null}
        {expiry ? (
          <Text style={styles.docExpiry}>
            {expired ? 'Expired ' : 'Expires '}{moment(expiry).format('DD MMM YYYY')}
          </Text>
        ) : null}
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
  const [uploadingSlot, setUploadingSlot]   = useState(null);
  const [lightboxUrl, setLightboxUrl]       = useState(null);
  const [toggling, setToggling]             = useState(false);
  const [baseURL, setBaseURL]               = useState('');

  useFocusEffect(useCallback(() => {
    getBaseURL().then(b => setBaseURL(b));
    setLoading(true);
    getVehicle(vehicleId)
      .then(res => setVehicle(res.data.vehicle))
      .catch(() => Alert.alert('Error', 'Failed to load vehicle'))
      .finally(() => setLoading(false));
  }, [vehicleId]));

  function reload() {
    getVehicle(vehicleId)
      .then(res => setVehicle(res.data.vehicle))
      .catch(() => {});
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

  async function handleDeleteMaintenanceLog(logId) {
    Alert.alert('Delete Log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteMaintenanceLog(vehicleId, logId); reload(); }
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
            <Ionicons name="car" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.heroName}>{vehicle.make} {vehicle.model}</Text>
            {vehicle.registrationNo ? (
              <View style={styles.regBadge}>
                <Ionicons name="card-outline" size={11} color="#FDE68A" />
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

      {/* Stats Strip */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="speedometer-outline" size={16} color={C.blue} />
          </View>
          <Text style={styles.statValue}>{vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString('en-IN')}` : '—'}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="calendar-outline" size={16} color={C.success} />
          </View>
          <Text style={styles.statValue}>{vehicle.lastServiceDate ? moment(vehicle.lastServiceDate).format('MMM YY') : '—'}</Text>
          <Text style={styles.statLabel}>Last Svc</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="build-outline" size={16} color={C.warn} />
          </View>
          <Text style={styles.statValue}>{logs.length}</Text>
          <Text style={styles.statLabel}>Maint.</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="water-outline" size={16} color="#EA580C" />
          </View>
          <Text style={styles.statValue}>{fuelLogs.length}</Text>
          <Text style={styles.statLabel}>Fuel</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Documents */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={[styles.cardHeader, { backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="document-text-outline" size={15} color={C.blue} />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: '#1E40AF' }]}>Documents</Text>
            </View>
            <View style={styles.cardBody}>
              <DocCard label="Insurance" number={vehicle.insuranceNumber} expiry={vehicle.insuranceExpiry} />
              <DocCard label="RC (Registration)" number={vehicle.rcNumber} expiry={vehicle.rcExpiry} />
              <DocCard label="Fitness Certificate" expiry={vehicle.fitnessExpiry} />
              <DocCard label="Permit" expiry={vehicle.permitExpiry} />
            </View>
          </View>
        </View>

        {/* Vehicle Photos — only show uploaded ones */}
        {(() => {
          const filledSlots = PHOTO_SLOTS.map(slot => {
            const fieldKey = Object.keys(FIELD_TO_KEY).find(k => FIELD_TO_KEY[k] === slot.key);
            const url = vehicle[fieldKey] ? fullUrl(vehicle[fieldKey], baseURL) : null;
            return { ...slot, fieldKey, url };
          }).filter(s => s.url);

          if (filledSlots.length === 0) return null;

          return (
            <View style={styles.sectionWrap}>
              <View style={styles.card}>
                <View style={[styles.cardHeader, { backgroundColor: '#FDF4FF' }]}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="camera-outline" size={15} color="#9333EA" />
                  </View>
                  <Text style={[styles.cardHeaderTitle, { color: '#7E22CE' }]}>Vehicle Photos</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 11, color: '#9333EA', fontWeight: '600' }}>{filledSlots.length} photo{filledSlots.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.photoSlotGrid}>
                    {filledSlots.map(slot => (
                      <View key={slot.key} style={styles.photoSlot}>
                        <TouchableOpacity
                          style={styles.photoSlotBox}
                          onPress={() => setLightboxUrl(slot.url)}
                          activeOpacity={0.9}
                        >
                          {uploadingSlot === slot.key ? (
                            <ActivityIndicator size="small" color={C.primary} />
                          ) : (
                            <Image source={{ uri: slot.url }} style={styles.photoSlotImg} resizeMode="cover" />
                          )}
                        </TouchableOpacity>
                        <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Service Info */}
        {(vehicle.currentOdometer || vehicle.lastServiceDate || vehicle.nextServiceDate) && (
          <View style={styles.sectionWrap}>
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#FFF7ED' }]}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="construct-outline" size={15} color="#EA580C" />
                </View>
                <Text style={[styles.cardHeaderTitle, { color: '#C2410C' }]}>Service Info</Text>
              </View>
              <View style={styles.cardBody}>
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
          </View>
        )}

        {/* Maintenance Logs */}
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <View style={[styles.cardHeader, { backgroundColor: '#FFFBEB' }]}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="build-outline" size={15} color="#D97706" />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: '#B45309' }]}>Maintenance Logs</Text>
              <View style={{ flex: 1 }} />
              {!isVendor && (
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: '#F59E0B' }]}
                  onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
                >
                  <Ionicons name="add" size={12} color="#fff" />
                  <Text style={styles.addPillText}>Add Log</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardBody}>
              {logs.length === 0 ? (
                isVendor ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="build-outline" size={28} color="#D97706" />
                    <Text style={styles.emptyTitle}>No maintenance logs</Text>
                    <Text style={styles.emptySubText}>No records available</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyBoxCta}
                    onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
                  >
                    <Ionicons name="add-circle-outline" size={28} color="#D97706" />
                    <Text style={[styles.emptyTitle, { color: '#D97706' }]}>No logs yet</Text>
                    <Text style={[styles.emptySubText, { color: '#B45309' }]}>Tap to add first log</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={{ gap: 10 }}>
                  {logs.map((log) => (
                    <View key={log.id} style={[styles.logCard, { borderLeftColor: '#F59E0B' }]}>
                      <View style={styles.logTopRow}>
                        <View style={[styles.typeBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.typeBadgeText, { color: '#D97706' }]}>{log.type}</Text>
                        </View>
                        <View style={styles.logActions}>
                          <Text style={styles.logDate}>{moment(log.date).format('DD MMM YYYY')}</Text>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id, log })}>
                            <Ionicons name="pencil-outline" size={14} color="#D97706" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteMaintenanceLog(log.id)}>
                            <Ionicons name="trash-outline" size={14} color={C.danger} />
                          </TouchableOpacity>
                        </View>
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
                            <Ionicons name="speedometer-outline" size={11} color={C.blue} />
                            <Text style={[styles.logMetaText, { color: C.blue }]}>{log.odometer.toLocaleString('en-IN')} km</Text>
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
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Fuel Logs — own vehicles only */}
        {!isVendor && (
          <View style={styles.sectionWrap}>
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#FFF7ED' }]}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="water-outline" size={15} color="#EA580C" />
                </View>
                <Text style={[styles.cardHeaderTitle, { color: '#C2410C' }]}>Fuel Logs</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: '#EA580C' }]}
                  onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id })}
                >
                  <Ionicons name="add" size={12} color="#fff" />
                  <Text style={styles.addPillText}>Add Log</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                {fuelLogs.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyBoxCta}
                    onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id })}
                  >
                    <Ionicons name="water-outline" size={28} color="#EA580C" />
                    <Text style={[styles.emptyTitle, { color: '#EA580C' }]}>No fuel logs yet</Text>
                    <Text style={[styles.emptySubText, { color: '#C2410C' }]}>Tap to add first fuel log</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 10 }}>
                    {fuelLogs.map((log) => (
                      <View key={log.id} style={[styles.logCard, { borderLeftColor: '#EA580C' }]}>
                        <View style={styles.logTopRow}>
                          <View style={[styles.typeBadge, { backgroundColor: '#FFEDD5' }]}>
                            <Text style={[styles.typeBadgeText, { color: '#EA580C' }]}>
                              {log.fuelType || 'Fuel'} · {log.liters}L
                            </Text>
                          </View>
                          <View style={styles.logActions}>
                            <Text style={styles.logDate}>{moment(log.date).format('DD MMM YYYY')}</Text>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddFuel', { vehicleId: vehicle.id, log })}>
                              <Ionicons name="pencil-outline" size={14} color="#EA580C" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteFuelLog(log.id)}>
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
                              <Ionicons name="speedometer-outline" size={11} color={C.blue} />
                              <Text style={[styles.logMetaText, { color: C.blue }]}>{log.odometer.toLocaleString('en-IN')} km</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Incidents — own vehicles only */}
        {!isVendor && (
          <View style={styles.sectionWrap}>
            <View style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="warning-outline" size={15} color={C.danger} />
                </View>
                <Text style={[styles.cardHeaderTitle, { color: '#B91C1C' }]}>Incidents</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={[styles.addPill, { backgroundColor: C.danger }]}
                  onPress={() => navigation.navigate('AddIncident', { vehicleId: vehicle.id })}
                >
                  <Ionicons name="add" size={12} color="#fff" />
                  <Text style={styles.addPillText}>Report</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                {incidents.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyBoxCta}
                    onPress={() => navigation.navigate('AddIncident', { vehicleId: vehicle.id })}
                  >
                    <Ionicons name="warning-outline" size={28} color={C.danger} />
                    <Text style={[styles.emptyTitle, { color: C.danger }]}>No incidents</Text>
                    <Text style={[styles.emptySubText, { color: '#B91C1C' }]}>Tap to report an incident</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 10 }}>
                    {incidents.map((inc) => {
                      const sevColor = inc.severity === 'HIGH' ? C.danger : inc.severity === 'LOW' ? C.success : C.warn;
                      const sevBg    = inc.severity === 'HIGH' ? '#FEF2F2' : inc.severity === 'LOW' ? '#F0FDF4' : '#FFFBEB';
                      const statusColor = inc.repairStatus === 'RESOLVED' ? C.success : inc.repairStatus === 'IN_PROGRESS' ? C.blue : C.sub;
                      return (
                        <View key={inc.id} style={[styles.logCard, { borderLeftColor: sevColor }]}>
                          <View style={styles.logTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={[styles.typeBadge, { backgroundColor: sevBg }]}>
                                <Text style={[styles.typeBadgeText, { color: sevColor }]}>{inc.type}</Text>
                              </View>
                              <View style={[styles.sevPill, { backgroundColor: sevBg, borderColor: sevColor }]}>
                                <Text style={[styles.sevPillText, { color: sevColor }]}>{inc.severity}</Text>
                              </View>
                            </View>
                            <View style={styles.logActions}>
                              <Text style={styles.logDate}>{moment(inc.date).format('DD MMM YYYY')}</Text>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddIncident', { vehicleId: vehicle.id, log: inc })}>
                                <Ionicons name="pencil-outline" size={14} color={sevColor} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteIncident(inc.id)}>
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
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Hero
  hero:         { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22 },
  heroNav:      { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 8 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
  editBtnText:  { fontSize: 12, color: '#fff', fontWeight: '700' },
  toggleBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, marginLeft: 6 },
  toggleBtnText:{ fontSize: 12, color: '#fff', fontWeight: '700' },

  heroBody:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroIconBox:  { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  heroName:     { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  regBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  regText:      { fontSize: 13, fontWeight: '800', color: '#FDE68A', letterSpacing: 1.2 },
  inactiveBadge:     { backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  inactiveBadgeText: { fontSize: 10, color: '#FCA5A5', fontWeight: '800', letterSpacing: 0.5 },
  vendorBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(147,197,253,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  vendorBadgeText:   { fontSize: 10, color: '#93C5FD', fontWeight: '700' },

  heroChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  heroChipText: { fontSize: 11, color: 'rgba(255,255,255,0.88)', fontWeight: '600' },

  // Stats card
  statsCard:    { marginHorizontal: 16, marginTop: -18, backgroundColor: C.card, borderRadius: 16, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  statItem:     { flex: 1, alignItems: 'center', gap: 4 },
  statDivider:  { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statIcon:     { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statValue:    { fontSize: 13, fontWeight: '800', color: C.text },
  statLabel:    { fontSize: 10, color: C.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Section wrapper
  sectionWrap:  { paddingHorizontal: 16, marginTop: 16 },

  // Card
  card:         { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  cardHeaderIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardHeaderTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardBody:     { padding: 14 },

  addPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  addPillText:  { fontSize: 11, color: '#fff', fontWeight: '800' },

  // Document card
  docCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border, borderLeftWidth: 3 },
  docLeft:      {},
  docLabel:     { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  docNumber:    { fontSize: 11, color: C.sub, fontWeight: '500' },
  docExpiry:    { fontSize: 11, color: C.sub, marginTop: 1 },
  docStatus:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  docStatusText:{ fontSize: 11, fontWeight: '700' },

  // Info row (service)
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoRowLast:  { borderBottomWidth: 0 },
  infoIcon:     { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoLabel:    { flex: 1, fontSize: 13, color: C.sub, fontWeight: '500' },
  infoValue:    { fontSize: 13, color: C.text, fontWeight: '700' },

  // Photo slots
  photoSlotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot:     { width: (SCREEN_W - 96) / 3, alignItems: 'center' },
  photoSlotBox:  { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: C.bg, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  photoSlotImg:  { width: '100%', height: '100%' },
  photoSlotEdit: { position: 'absolute', bottom: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  photoSlotHint: { fontSize: 10, color: C.sub, marginTop: 4, fontWeight: '600' },
  photoSlotLabel:{ fontSize: 11, color: C.sub, fontWeight: '700', marginTop: 5, textAlign: 'center' },

  // Empty states
  emptyBox:    { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyBoxCta: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle:  { fontSize: 14, fontWeight: '700', color: C.sub },
  emptySubText:{ fontSize: 12, color: C.sub, fontWeight: '500' },

  // Log cards
  logCard:      { backgroundColor: C.bg, borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  logTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logActions:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn:      { padding: 3 },
  typeBadge:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:{ fontSize: 11, fontWeight: '800' },
  sevPill:      { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  sevPillText:  { fontSize: 10, fontWeight: '800' },
  logDate:      { fontSize: 11, color: C.sub, fontWeight: '600' },
  logDesc:      { fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 18 },
  logMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  logMetaChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  logMetaText:  { fontSize: 11, color: C.sub, fontWeight: '600' },

  // Lightbox
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  lightboxImg:     { width: SCREEN_W, height: SCREEN_W * 1.2, maxHeight: '90%' },
  lightboxClose:   { position: 'absolute', top: 48, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});
