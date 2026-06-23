import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, deleteStaff, debugAuthState } from '../../api/client';
import { showConfirm, showError } from '../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#EF4444', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const ROLE_COLORS = {
  driver:     { bg: '#DBEAFE', text: '#1E40AF' },
  manager:    { bg: '#F3E8FF', text: '#7C3AED' },
  helper:     { bg: '#FEF3C7', text: '#92400E' },
  accountant: { bg: '#DCFCE7', text: '#166534' },
  mechanic:   { bg: '#FEE2E2', text: '#991B1B' },
  supervisor: { bg: '#E0E7FF', text: '#3730A3' },
  default:    { bg: '#F1F5F9', text: '#64748B' },
};

const getStatusDot = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':   return C.g400;
    case 'on_leave': return '#FCD34D';
    case 'inactive': return '#FCA5A5';
    default:         return C.muted;
  }
};

function Section({ icon, iconLib = 'feather', color, bg, title, children }) {
  const I = iconLib === 'mci' ? MaterialCommunityIcons : Icon;
  return (
    <View style={s.section}>
      <View style={s.sHead}>
        <View style={[s.sIcon, { backgroundColor: bg }]}>
          <I name={icon} size={13} color={color} />
        </View>
        <Text style={[s.sTitle, { color }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function IRow({ icon, iColor, iBg, label, value, last }) {
  return (
    <View style={[s.iRow, last && { borderBottomWidth: 0 }]}>
      <View style={[s.iIcon, { backgroundColor: iBg }]}>
        <Icon name={icon} size={13} color={iColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.iLbl}>{label}</Text>
        <Text style={s.iVal}>{value || '--'}</Text>
      </View>
    </View>
  );
}

function KVRow({ label, value, last, green }) {
  return (
    <View style={[s.kv, last && { borderBottomWidth: 0 }]}>
      <Text style={s.kvLbl}>{label}</Text>
      <Text style={[s.kvVal, green && { color: C.g600 }]}>{value || '--'}</Text>
    </View>
  );
}

export default function StaffDetailScreen({ route, navigation }) {
  const { staffId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [staff, setStaff]     = useState(null);

  const fetchStaff = useCallback(async () => {
    if (!staffId) return;
    let retries = 0;
    while (retries <= 2) {
      try {
        if (retries === 0) await debugAuthState();
        const res = await apiGet(`/vendor/staff/${staffId}`);
        setStaff(res.data?.staff || res.data);
        setLoading(false);
        return;
      } catch (err) {
        if (err?.response?.status === 401 && retries < 2) {
          retries++;
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        showError(err?.response?.status === 401
          ? 'No permission to view this staff member.'
          : 'Failed to load staff details.');
        setLoading(false);
        return;
      }
    }
  }, [staffId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = () =>
    showConfirm('Delete Staff', 'Are you sure you want to delete this staff member?',
      async () => {
        try { await deleteStaff(staffId); navigation.goBack(); }
        catch { showError('Failed to delete staff'); }
      },
      { confirmText: 'Delete', destructive: true }
    );

  const handleCall = () => {
    if (staff?.phone)
      import('react-native').then(({ Linking }) => Linking.openURL(`tel:${staff.phone}`));
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '--';

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.grad}>
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.center}><ActivityIndicator size="large" color={C.g600} /></View>
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.grad}>
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.center}><Text style={{ color: C.muted, fontSize: 16 }}>Staff not found</Text></View>
      </View>
    );
  }

  const rc = ROLE_COLORS[staff.role?.toLowerCase()] || ROLE_COLORS.default;
  const dotColor = getStatusDot(staff.status);
  const licExpired = staff.licenseExpiry && new Date(staff.licenseExpiry) < new Date();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Single scroll — gradient profile + all cards scroll together */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Gradient Profile Hero ── */}
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.grad}>
          <SafeAreaView edges={['top']}>
            {/* Back + Delete */}
            <View style={s.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <Icon name="trash-2" size={16} color="#FCA5A5" />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={s.avatarWrap}>
              {staff.photo ? (
                <Image source={{ uri: staff.photo }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarCircle}>
                  <Text style={s.avatarLetter}>{staff.name?.charAt(0)?.toUpperCase() || 'S'}</Text>
                </View>
              )}
              <View style={[s.onlineDot, { backgroundColor: dotColor }]} />
            </View>

            <Text style={s.name}>{staff.name}</Text>

            {/* Badges */}
            <View style={s.badges}>
              <View style={s.rolePill}>
                <Text style={s.rolePillTxt}>{staff.role?.replace(/_/g, ' ') || 'Staff'}</Text>
              </View>
              <View style={s.statusPill}>
                <View style={[s.statusDot, { backgroundColor: dotColor }]} />
                <Text style={[s.statusPillTxt, { color: dotColor }]}>
                  {staff.status?.replace(/_/g, ' ') || 'Active'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Icon name="phone" size={15} color={C.g900} />
                <Text style={s.callTxt}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => navigation.navigate('AddStaffScreen', { staffId, staff })}
                activeOpacity={0.8}
              >
                <Icon name="edit-2" size={15} color="#fff" />
                <Text style={s.editTxt}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom info strip */}
            <View style={s.strip}>
              <View style={s.stripItem}>
                <Text style={s.stripVal}>{fmt(staff.joiningDate)}</Text>
                <Text style={s.stripLbl}>Joined</Text>
              </View>
              {staff.salary && (
                <>
                  <View style={s.stripSep} />
                  <View style={s.stripItem}>
                    <Text style={[s.stripVal, { color: C.g400 }]}>
                      ₹{parseInt(staff.salary).toLocaleString()}
                    </Text>
                    <Text style={s.stripLbl}>Monthly Pay</Text>
                  </View>
                </>
              )}
              {staff.employeeId && (
                <>
                  <View style={s.stripSep} />
                  <View style={s.stripItem}>
                    <Text style={s.stripVal}>{staff.employeeId}</Text>
                    <Text style={s.stripLbl}>Employee ID</Text>
                  </View>
                </>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Info Cards ── */}
        <View style={s.cards}>

          {/* Contact */}
          <Section icon="phone" color={C.g700} bg={C.g50} title="Contact Information">
            <IRow icon="phone" iColor={C.g700} iBg={C.g50} label="Phone" value={staff.phone} />
            {staff.email && (
              <IRow icon="mail" iColor={C.blue} iBg={C.blueL} label="Email" value={staff.email} />
            )}
            {(staff.address || staff.city || staff.state) && (
              <IRow
                icon="map-pin" iColor={C.amber} iBg={C.amberL}
                label="Address"
                value={[staff.address, staff.city, staff.state, staff.pincode].filter(Boolean).join(', ')}
                last
              />
            )}
          </Section>

          {/* Employment */}
          <Section icon="briefcase" color={C.purple} bg={C.purpleL} title="Employment">
            {staff.employeeId && <KVRow label="Employee ID" value={staff.employeeId} />}
            <KVRow label="Joining Date" value={fmt(staff.joiningDate)} />
            {staff.salary && (
              <KVRow label="Monthly Salary" value={`₹${parseInt(staff.salary).toLocaleString()}`} green />
            )}
            <KVRow label="Status" value={staff.status?.replace(/_/g, ' ')} last />
          </Section>

          {/* Personal */}
          {staff.dateOfBirth && (
            <Section icon="user" color={C.amber} bg={C.amberL} title="Personal">
              <KVRow label="Date of Birth" value={fmt(staff.dateOfBirth)} last />
            </Section>
          )}

          {/* Identity */}
          {(staff.aadharNumber || staff.panNumber) && (
            <Section icon="shield" color={C.blue} bg={C.blueL} title="Identity Documents">
              {staff.aadharNumber && (
                <KVRow label="Aadhar" value={staff.aadharNumber} last={!staff.panNumber} />
              )}
              {staff.panNumber && <KVRow label="PAN" value={staff.panNumber} last />}
            </Section>
          )}

          {/* License */}
          {staff.role?.toLowerCase() === 'driver' && (
            <Section icon="credit-card" color={C.g700} bg={C.g50} title="Driving License">
              <KVRow label="License No." value={staff.licenseNumber} />
              {staff.licenseType && <KVRow label="License Type" value={staff.licenseType} />}
              <KVRow label="Expiry" value={fmt(staff.licenseExpiry)} last={!licExpired} />
              {licExpired && (
                <View style={s.warning}>
                  <Icon name="alert-triangle" size={13} color="#92400E" />
                  <Text style={s.warningTxt}>License expired — please renew</Text>
                </View>
              )}
            </Section>
          )}

          {/* Driver ID */}
          {staff.role?.toLowerCase() === 'driver' && staff.did && (
            <Section icon="shield-account" iconLib="mci" color="#0EA5E9" bg="#EFF6FF" title="Driver Identification">
              <KVRow label="Driver ID" value={staff.did} green last />
            </Section>
          )}

          {/* Bank */}
          {(staff.bankName || staff.accountNumber) && (
            <Section icon="credit-card" iconLib="mci" color={C.blue} bg={C.blueL} title="Bank Details">
              {staff.bankName && <KVRow label="Bank" value={staff.bankName} />}
              {staff.accountHolderName && <KVRow label="Account Holder" value={staff.accountHolderName} />}
              {staff.accountNumber && <KVRow label="Account No." value={staff.accountNumber} />}
              {staff.ifscCode && <KVRow label="IFSC" value={staff.ifscCode} last />}
            </Section>
          )}

          {/* Emergency */}
          {(staff.emergencyContact || staff.emergencyPhone) && (
            <Section icon="alert-circle" color={C.red} bg={C.redL} title="Emergency Contact">
              {staff.emergencyContact && (
                <KVRow label="Name" value={staff.emergencyContact} last={!staff.emergencyPhone} />
              )}
              {staff.emergencyPhone && <KVRow label="Phone" value={staff.emergencyPhone} last />}
            </Section>
          )}

          {/* Performance */}
          {staff.stats && (
            <Section icon="bar-chart-2" color={C.purple} bg={C.purpleL} title="Performance">
              <View style={s.perf}>
                <View style={s.perfItem}>
                  <Text style={s.perfVal}>{staff.stats.totalTrips || 0}</Text>
                  <Text style={s.perfLbl}>Total Trips</Text>
                </View>
                <View style={[s.perfItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border }]}>
                  <Text style={[s.perfVal, { color: C.g600 }]}>{staff.stats.completedTrips || 0}</Text>
                  <Text style={s.perfLbl}>Completed</Text>
                </View>
                <View style={s.perfItem}>
                  <Text style={[s.perfVal, { color: C.amber }]}>
                    {staff.stats.rating?.toFixed(1) || '--'}
                  </Text>
                  <Text style={s.perfLbl}>Rating</Text>
                </View>
              </View>
            </Section>
          )}

          {/* Documents */}
          {staff.documents?.length > 0 && (
            <Section icon="file-text" color={C.blue} bg={C.blueL} title="Documents">
              {staff.documents.map((doc, i) => (
                <View
                  key={i}
                  style={[s.docRow, i === staff.documents.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={s.docIcon}>
                    <Icon name="file-text" size={14} color={C.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docName}>{doc.name}</Text>
                    <Text style={s.docDate}>Uploaded {fmt(doc.uploadedAt)}</Text>
                  </View>
                  <Icon name="chevron-right" size={14} color={C.muted} />
                </View>
              ))}
            </Section>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  /* Gradient hero */
  grad: { paddingHorizontal: 16, paddingBottom: 0 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: 8, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarWrap: { position: 'relative', alignSelf: 'center', marginBottom: 14 },
  avatarImg: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderWidth: 2.5, borderColor: 'rgba(52,211,153,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: '#34D399' },
  onlineDot: {
    position: 'absolute', bottom: 3, right: 3,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: C.g900,
  },

  name: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', letterSpacing: -0.4, marginBottom: 10,
  },
  badges: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  rolePill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  rolePillTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillTxt: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  actions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.g400, paddingVertical: 11, paddingHorizontal: 26, borderRadius: 25,
  },
  callTxt: { fontSize: 14, fontWeight: '800', color: C.g900 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 11, paddingHorizontal: 26, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  editTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  strip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  stripItem: { flex: 1, alignItems: 'center' },
  stripVal: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stripLbl: {
    fontSize: 9, color: 'rgba(255,255,255,0.5)',
    marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4,
  },
  stripSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 3 },

  /* Info cards */
  cards: { padding: 14, paddingTop: 14, gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  section: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  sIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },

  iRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  iIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  iLbl: { fontSize: 10, color: C.muted, marginBottom: 2, fontWeight: '500' },
  iVal: { fontSize: 14, color: C.text, fontWeight: '600', lineHeight: 20 },

  kv: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  kvLbl: { fontSize: 13, color: C.sub, fontWeight: '500' },
  kvVal: { fontSize: 13, color: C.text, fontWeight: '700' },

  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FEF3C7', margin: 10, padding: 10, borderRadius: 8,
  },
  warningTxt: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },

  perf: { flexDirection: 'row', paddingVertical: 8 },
  perfItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  perfVal: { fontSize: 22, fontWeight: '800', color: C.text },
  perfLbl: { fontSize: 10, color: C.muted, marginTop: 3, fontWeight: '600' },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  docIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 13, fontWeight: '600', color: C.text },
  docDate: { fontSize: 11, color: C.muted, marginTop: 2 },
});
