// screens/vendor/profile/BankDetailsScreen.js
// REDESIGNED — "Elevate" visual language, matching
// screens/travel-agent/bank/BankDetailsListScreen.js (credit-card style tile,
// EMV chip, masked account number) and this app's own
// VendorDocumentsScreen.js / BusinessProfileScreen.js (hero + floating banner
// pattern, shared theme tokens).
//
// UI ONLY. This screen manages a SINGLE bank account (not a list like the
// travel-agent equivalent) and has no Modal — the add/edit form renders
// inline in the same ScrollView, exactly as before. All behaviour is
// preserved exactly: same GET (/vendor/bank-details) / POST calls, same
// form state & validation, same masking, same edit/cancel flow.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, apiPost } from '../../api/client';
import { showError, showSuccess } from '../../../services/alertService';
import { SC as T, G, rs, rf, GUT, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  indigo: T.indigo, indigoL: T.indigoLight,
  red: T.red,
};

// Hero ↔ security-banner spacing. The banner is pulled up so it tucks into
// the hero's rounded bottom curve, matching VendorDocumentsScreen's stats
// card / BankDetailsListScreen's info banner. It is a static sibling
// between the hero and the ScrollView so it can never be clipped.
const HERO_TAIL = rs(24);
const BANNER_OVERLAP = rs(18);

export default function BankDetailsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
  });

  const fetchBankDetails = useCallback(async () => {
    try {
      const response = await apiGet('/vendor/bank-details');
      const data = response.data?.bankDetails || response.data;
      if (data) {
        setForm({
          accountHolderName: data.accountHolderName || '',
          accountNumber: data.accountNumber || '',
          confirmAccountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          bankName: data.bankName || '',
          branchName: data.branchName || '',
          upiId: data.upiId || '',
        });
      }
    } catch (error) {
      console.log('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateForm = () => {
    if (!form.accountHolderName.trim()) { showError('Please enter account holder name'); return false; }
    if (!form.accountNumber.trim()) { showError('Please enter account number'); return false; }
    if (form.accountNumber !== form.confirmAccountNumber) { showError('Account numbers do not match'); return false; }
    if (!form.ifscCode.trim()) { showError('Please enter IFSC code'); return false; }
    if (form.ifscCode.length !== 11) { showError('IFSC code should be 11 characters'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await apiPost('/vendor/bank-details', {
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode.toUpperCase(),
        bankName: form.bankName,
        branchName: form.branchName,
        upiId: form.upiId,
      });
      showSuccess('Bank details saved successfully');
      setIsEditing(false);
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const maskAccountNumber = (accNo) => {
    if (!accNo || accNo.length < 4) return accNo;
    return '●'.repeat(accNo.length - 4) + accNo.slice(-4);
  };

  const hasExistingDetails = !!form.accountNumber && !isEditing;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO — static sibling so it can never be clipped by the
          ScrollView's own viewport ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            {hasExistingDetails && (
              <TouchableOpacity style={styles.editBtnTop} onPress={() => setIsEditing(true)}>
                <Icon name="edit-2" size={rs(16)} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroIconWrap}>
              {loading ? (
                <ActivityIndicator size="large" color={C.g400} />
              ) : (
                <MaterialCommunityIcons name="bank-outline" size={rs(32)} color={C.g400} />
              )}
            </View>
            <Text style={styles.heroTitle}>Bank Details</Text>
            <Text style={styles.heroSub}>Secure payout account management</Text>
          </View>

          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Security banner tucked into the hero curve — static sibling
          between the hero and the ScrollView, never inside it ── */}
      <View style={styles.bannerWrap}>
        <View style={[styles.securityStrip, cardShadow]}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="shield-checkmark" size={rs(15)} color={C.g700} />
          </View>
          <Text style={styles.securityText}>256-bit encrypted · PCI DSS compliant · Secure storage</Text>
        </View>
      </View>

      {!loading && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {hasExistingDetails ? (
            /* ── VIEW MODE — credit-card style tile, matching
                BankDetailsListScreen's BankCard ── */
            <>
              <View style={styles.cardWrap}>
                <View style={[styles.cardTile, cardShadow]}>
                  <LinearGradient
                    colors={G.emerald}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.cardRail}
                  />
                  <View style={styles.cardWash} />

                  <View style={styles.cardBody}>
                    <View style={styles.emvRow}>
                      <EmvChip />
                      <Ionicons
                        name="wifi"
                        size={rs(15)}
                        color={C.muted}
                        style={{ transform: [{ rotate: '90deg' }] }}
                      />
                      <View style={{ flex: 1 }} />
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={rs(12)} color={C.g700} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    </View>

                    <Text style={styles.cardAccValue} numberOfLines={1}>
                      {maskAccountNumber(form.accountNumber)}
                    </Text>

                    <View style={styles.cardBottomRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.cardSubLabel}>ACCOUNT HOLDER</Text>
                        <Text style={styles.cardSubValue} numberOfLines={1}>
                          {form.accountHolderName}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', minWidth: 0 }}>
                        <Text style={styles.cardSubLabel}>IFSC CODE</Text>
                        <Text style={styles.cardSubValue} numberOfLines={1}>
                          {form.ifscCode}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.issuerRow}>
                      <View style={styles.cardChip}>
                        <MaterialCommunityIcons name="bank" size={rs(16)} color={C.blue} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.cardBankName} numberOfLines={1}>
                          {form.bankName || 'Your Bank'}
                        </Text>
                        <Text style={styles.cardBranchName} numberOfLines={1}>
                          {form.branchName || 'Primary Account'}
                        </Text>
                      </View>
                      {!!form.upiId && (
                        <View style={styles.cardFooterChip}>
                          <Ionicons name="phone-portrait-outline" size={rs(11)} color={C.g700} />
                          <Text style={styles.cardFooterChipText} numberOfLines={1}>{form.upiId}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.85}
              >
                <Icon name="edit-2" size={rs(15)} color={C.g700} />
                <Text style={styles.editBtnText}>Edit Bank Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── EDIT / ADD MODE ── */
            <View style={[styles.formCard, cardShadow]}>
              <View style={styles.formHeaderRow}>
                <View style={styles.formHeaderIcon}>
                  <MaterialCommunityIcons name="wallet-outline" size={rs(19)} color={C.g700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formHeaderTitle}>Payout Account</Text>
                  <Text style={styles.formHeaderSub}>Add your bank account for receiving payments</Text>
                </View>
              </View>

              <InputField label="Account Holder Name" required
                placeholder="Enter account holder name"
                value={form.accountHolderName}
                onChangeText={(v) => updateForm('accountHolderName', v)}
              />
              <InputField label="Account Number" required
                placeholder="Enter account number"
                value={form.accountNumber}
                onChangeText={(v) => updateForm('accountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
              <InputField label="Confirm Account Number" required
                placeholder="Re-enter account number"
                value={form.confirmAccountNumber}
                onChangeText={(v) => updateForm('confirmAccountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <InputField label="IFSC Code" required
                    placeholder="SBIN0001234"
                    value={form.ifscCode}
                    onChangeText={(v) => updateForm('ifscCode', v.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="Bank Name"
                    placeholder="e.g. HDFC"
                    value={form.bankName}
                    onChangeText={(v) => updateForm('bankName', v)}
                  />
                </View>
              </View>

              <InputField label="Branch Name"
                placeholder="Enter branch name"
                value={form.branchName}
                onChangeText={(v) => updateForm('branchName', v)}
              />
              <InputField label="UPI ID (Optional)"
                placeholder="name@upi"
                value={form.upiId}
                onChangeText={(v) => updateForm('upiId', v)}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={G.emerald}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGrad}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={rs(20)} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Details</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={() => { setIsEditing(false); fetchBankDetails(); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: rs(40) }} />
        </ScrollView>
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

// Purely decorative EMV contact-plate graphic, same anatomy as
// BankDetailsListScreen's card — makes the tile read as a real bank card.
function EmvChip() {
  return (
    <LinearGradient
      colors={G.gold}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.emv}
    >
      <View style={styles.emvRowLine} />
      <View style={[styles.emvColLine, { left: '33%' }]} />
      <View style={[styles.emvColLine, { left: '66%' }]} />
    </LinearGradient>
  );
}

function InputField({ label, required, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: C.red }}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={C.muted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Hero ── */
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute', top: -rs(60), right: -rs(40),
    width: rs(180), height: rs(180), borderRadius: rs(90),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rs(8), marginBottom: rs(14),
  },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnTop: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBody: { alignItems: 'center' },
  heroIconWrap: {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: rs(14),
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(22), fontWeight: '800',
    color: '#fff', letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(13),
    color: 'rgba(255,255,255,0.65)', marginTop: rs(4),
  },

  /* ── Security banner, tucked into the hero curve ── */
  bannerWrap: { marginHorizontal: GUT, marginTop: -BANNER_OVERLAP },
  securityStrip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: T.glassBorder,
    paddingVertical: rs(10), paddingHorizontal: rs(14),
  },
  securityIconWrap: {
    width: rs(28), height: rs(28), borderRadius: rs(9),
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  securityText: {
    flex: 1, fontSize: rf(11.5), color: C.sub, fontWeight: '600',
  },

  scroll: { padding: GUT, paddingTop: rs(18) },

  /* ── Card — white "credit card" tile, matching BankDetailsListScreen ── */
  cardWrap: { marginBottom: rs(14) },
  cardTile: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: T.glassBorder,
    overflow: 'hidden',
  },
  cardRail: { height: rs(4), width: '100%' },
  cardWash: {
    position: 'absolute', right: -rs(50), top: -rs(30),
    width: rs(160), height: rs(160), borderRadius: rs(80),
    backgroundColor: 'rgba(28,107,82,0.075)',
  },
  cardBody: { paddingHorizontal: rs(16), paddingTop: rs(14), paddingBottom: rs(14) },

  emvRow: { flexDirection: 'row', alignItems: 'center', gap: rs(9), marginBottom: rs(12) },
  emv: {
    width: rs(34), height: rs(25), borderRadius: rs(5),
    overflow: 'hidden', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(138,106,30,0.5)',
  },
  emvRowLine: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 1, backgroundColor: 'rgba(107,74,16,0.45)',
  },
  emvColLine: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(107,74,16,0.45)',
  },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: C.g50, borderRadius: 999,
    paddingHorizontal: rs(10), height: rs(22), justifyContent: 'center',
  },
  verifiedText: { fontSize: rf(11), fontWeight: '700', color: C.g700 },

  cardAccValue: {
    fontFamily: DISPLAY, fontSize: rf(19), color: C.text,
    fontWeight: '800', letterSpacing: 2.2, marginBottom: rs(12),
  },

  cardBottomRow: {
    flexDirection: 'row', gap: rs(12),
    alignItems: 'flex-end', marginBottom: rs(13),
  },
  cardSubLabel: {
    fontSize: rf(9.5), color: C.muted, fontWeight: '700',
    letterSpacing: 0.6, marginBottom: rs(2),
  },
  cardSubValue: {
    fontFamily: DISPLAY, fontSize: rf(13), color: C.text, fontWeight: '700',
  },

  issuerRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    paddingTop: rs(12), borderTopWidth: 1, borderTopColor: C.border,
  },
  cardChip: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    backgroundColor: C.blueL,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBankName: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: '800', color: C.text },
  cardBranchName: { fontSize: rf(11), color: C.muted, marginTop: rs(1), fontWeight: '600' },
  cardFooterChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(9), height: rs(22), borderRadius: 999,
    backgroundColor: C.g50, borderWidth: 1, borderColor: 'rgba(28,107,82,0.16)',
    maxWidth: '38%',
  },
  cardFooterChipText: { fontSize: rf(10), fontWeight: '700', color: C.g700, flexShrink: 1 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8), paddingVertical: rs(14), borderRadius: rs(14),
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g600,
    marginBottom: rs(12),
  },
  editBtnText: { fontSize: rf(15), fontWeight: '700', color: C.g700 },

  /* ── Form ── */
  formCard: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: T.glassBorder,
    overflow: 'hidden', marginBottom: rs(12),
  },
  formHeaderRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: rs(16), gap: rs(12),
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  formHeaderIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  formHeaderTitle: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: C.text },
  formHeaderSub: { fontSize: rf(12), color: C.sub, marginTop: rs(2) },

  inputGroup: { marginBottom: rs(14), paddingHorizontal: rs(16) },
  rowInputs: { flexDirection: 'row', gap: 0 },
  label: {
    fontSize: rf(11.5), fontWeight: '700', color: C.sub,
    marginBottom: rs(7), marginLeft: rs(2),
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1,
    borderColor: C.border, borderRadius: rs(12),
    paddingHorizontal: rs(14), paddingVertical: rs(12),
    fontSize: rf(14), color: C.text, fontWeight: '500',
  },

  saveBtn: { marginHorizontal: rs(16), marginTop: rs(4), marginBottom: rs(4), borderRadius: rs(12), overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: rs(15), gap: rs(8),
  },
  saveBtnText: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: rs(14), marginBottom: rs(4) },
  cancelBtnText: { fontSize: rf(14), color: C.sub, fontWeight: '600' },
});
