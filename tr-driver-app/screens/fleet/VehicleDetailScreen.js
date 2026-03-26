import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getVehicle, updateVehicle, uploadVehiclePhoto, deleteVehiclePhoto } from '../api/client';
import moment from 'moment';

const SCREEN_W = Dimensions.get('window').width;

const C = {
  primary: '#16A34A', dark: '#064E3B', bg: '#F0F4F8',
  card: '#FFFFFF', border: '#E2EAF4', text: '#0F172A',
  sub: '#64748B', success: '#10B981', warn: '#F59E0B', danger: '#EF4444',
  blue: '#3B82F6',
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

  const statusColor = expired ? C.danger : urgent ? C.danger : warning ? C.warn : C.success;
  const statusBg    = expired ? '#FEF2F2' : urgent ? '#FEF2F2' : warning ? '#FFFBEB' : '#F0FDF4';
  const statusLabel = expired ? 'Expired' : urgent ? `${days}d left` : warning ? `${days}d left` : ok ? `${days}d left` : '—';
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
  const [vehicle, setVehicle]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxUrl, setLightboxUrl]   = useState(null);
  const [toggling, setToggling]         = useState(false);

  useEffect(() => {
    getVehicle(vehicleId)
      .then(res => setVehicle(res.data.vehicle))
      .catch(() => Alert.alert('Error', 'Failed to load vehicle'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  function reload() {
    getVehicle(vehicleId).then(res => setVehicle(res.data.vehicle)).catch(() => {});
  }

  async function addPhoto() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      await uploadVehiclePhoto(vehicleId, asset.uri, asset.fileName || 'photo.jpg', asset.type || 'image/jpeg', 'vehicle');
      reload();
    } catch {
      Alert.alert('Error', 'Failed to upload photo');
    }
    setUploadingPhoto(false);
  }

  async function removePhoto(url) {
    Alert.alert('Remove Photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteVehiclePhoto(vehicleId, url, null); reload(); }
        catch { Alert.alert('Error', 'Failed to remove photo'); }
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

  let photos = [];
  try { photos = JSON.parse(vehicle.vehiclePhotos || '[]'); } catch {}
  const logs = vehicle.maintenance_logs || [];

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
        {/* Nav row */}
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {!vehicle.isVendorVehicle && (
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

        {/* Vehicle info */}
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
          {vehicle.isVendorVehicle && (
            <View style={styles.vendorBadge}>
              <Ionicons name="business-outline" size={11} color="#93C5FD" />
              <Text style={styles.vendorBadgeText}>Vendor</Text>
            </View>
          )}
        </View>

        {/* Meta chips */}
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

        {/* ── Vehicle Photos ── */}
        {!vehicle.isVendorVehicle && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="camera-outline" size={13} color="#9333EA" />
              </View>
              <Text style={styles.sectionTitle}>Vehicle Photos</Text>
              <TouchableOpacity onPress={addPhoto} disabled={uploadingPhoto} style={styles.sectionAction}>
                {uploadingPhoto
                  ? <ActivityIndicator size="small" color={C.primary} />
                  : <>
                      <Ionicons name="add" size={13} color={C.primary} />
                      <Text style={styles.sectionActionText}>Add Photo</Text>
                    </>
                }
              </TouchableOpacity>
            </View>

            {photos.length === 0 ? (
              <TouchableOpacity style={styles.photoEmpty} onPress={addPhoto}>
                <Ionicons name="camera-outline" size={26} color={C.primary} />
                <Text style={styles.photoEmptyText}>Add vehicle photos</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.photoThumb}
                    onPress={() => setLightboxUrl(p)}
                    onLongPress={() => removePhoto(p)}
                  >
                    <Image source={{ uri: p }} style={styles.photoImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.photoThumb, styles.photoAddBtn]} onPress={addPhoto}>
                  <Ionicons name="add" size={22} color={C.primary} />
                </TouchableOpacity>
              </View>
            )}
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
              <Ionicons name="clipboard-outline" size={13} color="#7C3AED" />
            </View>
            <Text style={styles.sectionTitle}>Maintenance Logs</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
            >
              <Ionicons name="add" size={13} color={C.primary} />
              <Text style={styles.sectionActionText}>Add Log</Text>
            </TouchableOpacity>
          </View>

          {logs.length === 0 ? (
            <TouchableOpacity
              style={styles.logEmpty}
              onPress={() => navigation.navigate('AddMaintenance', { vehicleId: vehicle.id })}
            >
              <Ionicons name="add-circle-outline" size={22} color={C.primary} />
              <Text style={styles.logEmptyText}>Add first maintenance log</Text>
            </TouchableOpacity>
          ) : (
            <View>
              {logs.map((log, i) => (
                <View key={log.id} style={styles.logItem}>
                  {/* Timeline connector */}
                  <View style={styles.logLeft}>
                    <View style={styles.logDot} />
                    {i < logs.length - 1 && <View style={styles.logLine} />}
                  </View>

                  <View style={styles.logBody}>
                    <View style={styles.logTopRow}>
                      <View style={styles.logTypeBadge}>
                        <Text style={styles.logTypeText}>{log.type}</Text>
                      </View>
                      <Text style={styles.logDate}>{moment(log.date).format('DD MMM YYYY')}</Text>
                    </View>
                    {log.description ? <Text style={styles.logDesc}>{log.description}</Text> : null}
                    <View style={styles.logMeta}>
                      {log.cost > 0 ? (
                        <View style={styles.logMetaChip}>
                          <Ionicons name="cash-outline" size={11} color={C.success} />
                          <Text style={[styles.logMetaText, { color: C.success }]}>₹{log.cost.toLocaleString('en-IN')}</Text>
                        </View>
                      ) : null}
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

  // Photos
  photoEmpty:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 20, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  photoEmptyText: { fontSize: 14, color: C.primary, fontWeight: '600' },
  photoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb:   { width: (SCREEN_W - 64) / 3, height: (SCREEN_W - 64) / 3, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  photoImg:     { width: '100%', height: '100%' },
  photoAddBtn:  { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderColor: C.primary },

  // Maintenance logs
  logEmpty:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
  logEmptyText: { fontSize: 14, color: C.primary, fontWeight: '600' },
  logItem:      { flexDirection: 'row', marginBottom: 4 },
  logLeft:      { width: 28, alignItems: 'center', paddingTop: 14 },
  logDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, flexShrink: 0 },
  logLine:      { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },
  logBody:      { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 13, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  logTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logTypeBadge: { backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  logTypeText:  { fontSize: 11, color: C.primary, fontWeight: '800' },
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
