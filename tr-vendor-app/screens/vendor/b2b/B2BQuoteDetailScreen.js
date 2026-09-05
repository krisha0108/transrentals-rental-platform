import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getB2BMyQuotes, withdrawB2BQuote } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g300: T.oceanLight, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText, border: T.border,
  amber: T.amber, amberBg: T.amberLight, amberDark: shade(T.amber, -15),
  red: T.red, redBg: T.redLight, redDark: shade(T.red, -15),
  blue: T.blue, blueBg: T.blueLight,
};

const STATUS_CONFIG = {
  SUBMITTED:    { label: 'Submitted',    color: C.amber,   bg: C.amberBg,  border: C.amberDark, icon: 'clock' },
  UNDER_REVIEW: { label: 'Under Review', color: C.blue,    bg: C.blueBg,   border: C.blue,      icon: 'eye' },
  CONFIRMED:    { label: 'Confirmed',    color: C.g600,    bg: C.g50,      border: C.g500,      icon: 'check-circle' },
  REJECTED:     { label: 'Rejected',     color: C.red,     bg: C.redBg,    border: C.redDark,   icon: 'x-circle' },
  WITHDRAWN:    { label: 'Withdrawn',    color: C.muted,   bg: '#F1F5F9',  border: C.muted,     icon: 'minus-circle' },
};

const SERVICE_ICONS = {
  'car':        'car',
  'bus':        'bus',
  'truck':      'truck',
  'bike':       'motorbike',
  'equipment':  'crane',
  'packers':    'package-variant-closed',
  'luxury':     'car-estate',
  'chauffeur':  'steering',
  'self-drive': 'car-key',
  'self_drive': 'car-key',
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const fmtPrice = (n) => (n || 0).toLocaleString('en-IN');

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

function parseNotes(notes) {
  if (!notes) return null;
  try { return typeof notes === 'string' ? JSON.parse(notes) : notes; }
  catch { return null; }
}

export default function B2BQuoteDetailScreen({ navigation, route }) {
  const { quoteId } = route.params;
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'success', title: '', message: '', actions: null });

  const showAlert = (type, title, message, actions) =>
    setAlert({ visible: true, type, title, message, actions: actions || null });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor(C.g950);
    }, [])
  );

  const fetchQuote = useCallback(async () => {
    try {
      const res = await getB2BMyQuotes(null, { limit: 100 });
      const found = (res.quotes || []).find(q => q.id === quoteId);
      if (found) setQuote(found);
    } catch (e) {
      console.error('Failed to fetch quote:', e);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchQuote();
    }, [fetchQuote])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuote();
    setRefreshing(false);
  }, [fetchQuote]);

  const handleWithdraw = () => {
    showAlert('warning', 'Withdraw Quote', 'Are you sure? This will withdraw your quote and cannot be undone.', [
      { label: 'Cancel', onPress: hideAlert, variant: 'ghost' },
      {
        label: 'Withdraw', variant: 'primary', destructive: true,
        onPress: async () => {
          hideAlert();
          try {
            setWithdrawing(true);
            await withdrawB2BQuote(quoteId);
            showAlert('success', 'Quote Withdrawn', 'Your quote has been withdrawn successfully.', [
              { label: 'OK', onPress: () => { hideAlert(); fetchQuote(); }, variant: 'primary' },
            ]);
          } catch (e) {
            showAlert('error', 'Failed', e?.response?.data?.error || 'Could not withdraw quote. Please try again.');
          } finally {
            setWithdrawing(false);
          }
        },
      },
    ]);
  };

  const Header = () => (
    <LinearGradient colors={G.hero} style={s.header}>
      <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Icon name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>Quote Detail</Text>
      </View>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header />
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Status Banner skeleton */}
          <View style={[s.statusBanner, { borderColor: C.border }]}>
            <View style={s.statusBannerLeft}>
              <Bone w={90} h={17} />
              <Bone w={100} h={22} r={20} />
            </View>
            <Bone w={80} h={24} />
          </View>

          {/* Booking Reference skeleton */}
          <View style={s.card}>
            <Bone w={130} h={12} style={{ marginBottom: 12 }} />
            <Bone w={160} h={18} style={{ marginBottom: 10 }} />
            <View style={s.bookingMeta}>
              <Bone w={70} h={13} />
              <Bone w={90} h={22} r={20} />
            </View>
            <View style={s.routeRow}>
              <Bone w={8} h={8} r={4} />
              <View style={{ flex: 1 }} />
              <Bone w={8} h={8} r={4} />
            </View>
            <View style={s.chipRow}>
              <Bone w={90} h={22} r={20} />
              <Bone w={80} h={22} r={20} />
            </View>
          </View>

          {/* Pricing Summary skeleton */}
          <View style={s.card}>
            <Bone w={130} h={12} style={{ marginBottom: 12 }} />
            <View style={s.pricingHero}>
              <Bone w={110} h={12} style={{ marginBottom: 6 }} />
              <Bone w={140} h={26} />
            </View>
            {[0, 1, 2].map((i) => (
              <View key={i} style={s.pricingRow}>
                <Bone w={90} h={12} />
                <Bone w={70} h={13} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header />
        <View style={s.loadingWrap}>
          <MCI name="file-question-outline" size={52} color={C.muted} />
          <Text style={s.emptyTitle}>Quote not found</Text>
          <Text style={s.emptySub}>This quote may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_CONFIG[quote.status] || { label: quote.status, color: C.muted, bg: '#F1F5F9', border: C.muted, icon: 'help-circle' };
  const booking = quote.booking || quote.b2bBooking;
  const serviceType = (booking?.serviceType || '').toLowerCase().replace(' ', '-').replace('_', '-');
  const serviceIcon = SERVICE_ICONS[serviceType] || 'briefcase';
  const vehicleCount = quote.vehicleCount || quote.quoteVehicles?.length || 0;

  const canWithdraw = ['SUBMITTED', 'UNDER_REVIEW'].includes(quote.status);
  const canFreshQuote = ['REJECTED', 'WITHDRAWN'].includes(quote.status);
  const isConfirmed = quote.status === 'CONFIRMED';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header />

      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[s.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={s.statusBannerLeft}>
            <Text style={s.statusQuoteNum}>#{quote.quoteNumber}</Text>
            <View style={[s.statusChip, { backgroundColor: sc.color + '22', borderColor: sc.color + '44' }]}>
              <Icon name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusChipText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <Text style={s.statusPrice}>₹{(quote.totalPrice || 0).toLocaleString('en-IN')}</Text>
        </View>

        {/* Card 1: Booking Reference */}
        {booking && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Booking Reference</Text>
            <Text style={s.companyName}>{booking.companyName || 'Unknown Company'}</Text>

            <View style={s.bookingMeta}>
              <Text style={s.bookingNum}>#{booking.bookingNumber}</Text>
              <View style={[s.serviceBadge, { backgroundColor: C.g50, borderColor: C.g300 }]}>
                <MCI name={serviceIcon} size={13} color={C.g700} />
                <Text style={s.serviceBadgeText}>{booking.serviceType || 'N/A'}</Text>
              </View>
            </View>

            {/* Route row */}
            {(booking.pickupLocation || booking.dropLocation) && (
              <View style={s.routeRow}>
                <View style={[s.routeDot, { backgroundColor: C.g500 }]} />
                <View style={s.routeLine} />
                <MCI name="truck-outline" size={14} color={C.sub} />
                <View style={s.routeLine} />
                <View style={[s.routeDot, { backgroundColor: C.red }]} />
                <Text style={s.routeFrom} numberOfLines={1}>
                  {booking.pickupLocation || 'N/A'}
                </Text>
                <Text style={s.routeArrow}>→</Text>
                <Text style={s.routeTo} numberOfLines={1}>
                  {booking.dropLocation || 'N/A'}
                </Text>
              </View>
            )}

            <View style={s.chipRow}>
              {booking.scheduledDate && (
                <View style={s.metaChip}>
                  <Icon name="calendar" size={12} color={C.sub} />
                  <Text style={s.metaChipText}>{fmt(booking.scheduledDate)}</Text>
                </View>
              )}
              {vehicleCount > 0 && (
                <View style={s.metaChip}>
                  <MCI name="car-multiple" size={12} color={C.sub} />
                  <Text style={s.metaChipText}>{vehicleCount} vehicle{vehicleCount > 1 ? 's' : ''}</Text>
                </View>
              )}
              {booking.tripType && (
                <View style={s.metaChip}>
                  <Icon name="repeat" size={12} color={C.sub} />
                  <Text style={s.metaChipText}>{booking.tripType}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Card 2: Your Vehicles */}
        {quote.quoteVehicles?.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Your Vehicles</Text>
            {quote.quoteVehicles.map((qv, i) => {
              const vName = qv.vehicle?.vehicle_models?.name || qv.vehicle?.vehicleName || qv.vehicleName || `Vehicle ${i + 1}`;
              const vPlate = qv.vehicle?.registrationNumber || qv.registrationNumber || '';
              const driverName = qv.driver?.name || '';
              const driverPhone = qv.driver?.phone || '';
              const perPrice = qv.basePrice || 0;
              return (
                <View key={qv.id || i} style={[s.vehicleItem, i < quote.quoteVehicles.length - 1 && s.vehicleItemBorder]}>
                  <View style={s.vehicleIconBox}>
                    <MCI name={serviceIcon} size={20} color={C.g700} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.vehicleName}>{vName}</Text>
                    {!!vPlate && <Text style={s.vehiclePlate}>{vPlate}</Text>}
                    {!!driverName && (
                      <View style={s.driverRow}>
                        <MCI name="account" size={13} color={C.muted} />
                        <Text style={s.driverText}>{driverName}{driverPhone ? ` · ${driverPhone}` : ''}</Text>
                      </View>
                    )}
                  </View>
                  {perPrice > 0 && (
                    <Text style={s.vehiclePrice}>₹{perPrice.toLocaleString('en-IN')}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Card 3: Pricing Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Pricing Summary</Text>
          <View style={s.pricingHero}>
            <Text style={s.pricingHeroLabel}>Total Quote Price</Text>
            <Text style={s.pricingHeroValue}>₹{(quote.totalPrice || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.pricingRows}>
            {vehicleCount > 0 && (
              <View style={s.pricingRow}>
                <Text style={s.pricingRowLabel}>Per Vehicle</Text>
                <Text style={s.pricingRowValue}>
                  ₹{(vehicleCount > 0 ? Math.round((quote.totalPrice || 0) / vehicleCount) : 0).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View style={s.pricingRow}>
              <Text style={s.pricingRowLabel}>Vehicle Count</Text>
              <Text style={s.pricingRowValue}>{vehicleCount}</Text>
            </View>
            <View style={[s.pricingRow, { borderBottomWidth: 0 }]}>
              <Text style={s.pricingRowLabel}>Submitted</Text>
              <Text style={s.pricingRowValue}>{fmt(quote.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Self-Drive Details or Notes */}
        {(() => {
          const sd = parseNotes(quote.notes);
          if (sd?.isSelfDriveQuote) {
            return (
              <>
                {/* SD Details */}
                <View style={s.card}>
                  <Text style={s.cardTitle}>Self-Drive Details</Text>
                  <View style={s.sdGrid}>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Daily Rate</Text>
                      <Text style={s.sdVal}>₹{fmtPrice(sd.dailyRate)}/day</Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Rental Days</Text>
                      <Text style={s.sdVal}>{sd.rentalDays} days</Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Price / Vehicle</Text>
                      <Text style={s.sdVal}>₹{fmtPrice(sd.pricePerVehicle)}</Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Security Deposit</Text>
                      <Text style={s.sdVal}>₹{fmtPrice(sd.securityDeposit)}</Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>KM Limit</Text>
                      <Text style={s.sdVal}>{sd.kmLimitPerDay || 200} km/day</Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Extra KM Rate</Text>
                      <Text style={s.sdVal}>₹{sd.extraKmRate || 10}/km</Text>
                    </View>
                    {sd.deliveryCharges > 0 && (
                      <View style={s.sdItem}>
                        <Text style={s.sdLabel}>Delivery Charges</Text>
                        <Text style={s.sdVal}>₹{fmtPrice(sd.deliveryCharges)}</Text>
                      </View>
                    )}
                    {sd.pickupCharges > 0 && (
                      <View style={s.sdItem}>
                        <Text style={s.sdLabel}>Pickup Charges</Text>
                        <Text style={s.sdVal}>₹{fmtPrice(sd.pickupCharges)}</Text>
                      </View>
                    )}
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Advance</Text>
                      <Text style={[s.sdVal, { color: C.amberDark }]}>
                        {sd.advancePercent}% (₹{fmtPrice(sd.advanceAmount)})
                      </Text>
                    </View>
                    <View style={s.sdItem}>
                      <Text style={s.sdLabel}>Quote Valid</Text>
                      <Text style={s.sdVal}>{sd.validityDays || 3} days</Text>
                    </View>
                  </View>
                </View>

                {/* Inclusions */}
                {sd.inclusions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Inclusions ({sd.inclusions.length})</Text>
                    <View style={s.tagRow}>
                      {sd.inclusions.map((item, i) => (
                        <View key={i} style={s.tagGreen}>
                          <Icon name="check" size={10} color={C.g700} />
                          <Text style={s.tagGreenText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Exclusions */}
                {sd.exclusions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Exclusions ({sd.exclusions.length})</Text>
                    <View style={s.tagRow}>
                      {sd.exclusions.map((item, i) => (
                        <View key={i} style={s.tagRed}>
                          <Icon name="x" size={10} color={C.redDark} />
                          <Text style={s.tagRedText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Terms */}
                {sd.termsConditions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Terms & Conditions ({sd.termsConditions.length})</Text>
                    {sd.termsConditions.map((item, i) => (
                      <View key={i} style={s.termRow}>
                        <View style={s.termNum}>
                          <Text style={s.termNumText}>{i + 1}</Text>
                        </View>
                        <Text style={s.termText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Vendor Message */}
                {!!sd.vendorMessage && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Your Message</Text>
                    <Text style={s.notesText}>{sd.vendorMessage}</Text>
                  </View>
                )}
              </>
            );
          }
          // Car rental / Bus / Luxury: show pricing details + inclusions/exclusions/terms
          if (sd?.isCarRentalQuote) {
            const pricingRows = [
              { label: 'Base Price', value: sd.basePrice, show: !!sd.basePrice },
              { label: 'Per KM Rate', value: sd.perKmRate, show: !!sd.perKmRate },
              { label: 'Per Hour Rate', value: sd.perHourRate, show: !!sd.perHourRate },
              { label: 'Per Day Rate', value: sd.perDayRate, show: !!sd.perDayRate },
              { label: 'Driver Allowance', value: sd.driverAllowance, show: !!sd.driverAllowance },
              { label: 'Night Charges', value: sd.nightCharges, show: !!sd.nightCharges },
              { label: 'Extra KM Charge', value: sd.extraKmCharge, show: !!sd.extraKmCharge },
              { label: 'Extra Hour Charge', value: sd.extraHourCharge, show: !!sd.extraHourCharge },
            ].filter(r => r.show);
            return (
              <>
                {pricingRows.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Pricing Details</Text>
                    <View style={s.sdGrid}>
                      {pricingRows.map((row, i) => (
                        <View key={i} style={s.sdItem}>
                          <Text style={s.sdLabel}>{row.label}</Text>
                          <Text style={s.sdVal}>₹{fmtPrice(row.value)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {sd.inclusions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Inclusions ({sd.inclusions.length})</Text>
                    <View style={s.tagRow}>
                      {sd.inclusions.map((item, i) => (
                        <View key={i} style={s.tagGreen}>
                          <Icon name="check" size={10} color={C.g700} />
                          <Text style={s.tagGreenText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {sd.exclusions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Exclusions ({sd.exclusions.length})</Text>
                    <View style={s.tagRow}>
                      {sd.exclusions.map((item, i) => (
                        <View key={i} style={s.tagRed}>
                          <Icon name="x" size={10} color={C.red} />
                          <Text style={s.tagRedText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {sd.termsConditions?.length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Terms & Conditions</Text>
                    {sd.termsConditions.map((t, i) => (
                      <View key={i} style={s.termRow}>
                        <View style={s.termNum}><Text style={s.termNumText}>{i + 1}</Text></View>
                        <Text style={s.termText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {!!sd.vendorMessage && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Your Message</Text>
                    <Text style={s.notesText}>{sd.vendorMessage}</Text>
                  </View>
                )}
              </>
            );
          }
          // Non-SD or unparseable: show plain notes
          if (quote.notes && !sd) {
            return (
              <View style={s.card}>
                <Text style={s.cardTitle}>Notes</Text>
                <Text style={s.notesText}>{quote.notes}</Text>
              </View>
            );
          }
          if (sd?.vendorMessage) {
            return (
              <View style={s.card}>
                <Text style={s.cardTitle}>Notes</Text>
                <Text style={s.notesText}>{sd.vendorMessage}</Text>
              </View>
            );
          }
          return null;
        })()}

        {/* Action Buttons */}
        <View style={s.actions}>
          {canWithdraw && (
            <TouchableOpacity
              style={s.withdrawBtn}
              onPress={handleWithdraw}
              disabled={withdrawing}
              activeOpacity={0.8}
            >
              {withdrawing ? (
                <ActivityIndicator color={C.red} size="small" />
              ) : (
                <>
                  <Icon name="trash-2" size={18} color={C.red} />
                  <Text style={s.withdrawBtnText}>Withdraw Quote</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canFreshQuote && booking && (
            <TouchableOpacity
              style={s.freshBtn}
              onPress={() => navigation.navigate('B2BBookingDetail', {
                bookingId: booking.id || quote.bookingId,
                booking: booking,
                isFreshQuote: true,
              })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[C.g700, C.g600]} style={s.freshBtnGrad}>
                <Icon name="refresh-cw" size={18} color="#fff" />
                <Text style={s.freshBtnText}>Submit Fresh Quote</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isConfirmed && (
            <TouchableOpacity
              style={s.freshBtn}
              onPress={() => navigation.navigate('B2BTrips', { serviceFilter: booking?.serviceType || '' })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[C.g700, C.g600]} style={s.freshBtnGrad}>
                <MCI name="truck-outline" size={20} color="#fff" />
                <Text style={s.freshBtnText}>View My Trips</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden',
    borderBottomLeftRadius: rs(22), borderBottomRightRadius: rs(22),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 4, fontFamily: DISPLAY },
  emptySub: { fontSize: 14, color: C.muted },
  scroll: { flex: 1 },

  // Status Banner
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: rs(16), borderWidth: 1,
  },
  statusBannerLeft: { flex: 1, gap: 6 },
  statusQuoteNum: {
    fontSize: 17, fontWeight: '800', color: C.text, fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusChipText: { fontSize: 13, fontWeight: '700' },
  statusPrice: { fontSize: 24, fontWeight: '900', color: C.g700, fontFamily: DISPLAY },

  // Cards
  card: {
    backgroundColor: C.surface, borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    marginHorizontal: 16, marginTop: 12,
    padding: 16,
    ...cardShadow,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Booking ref
  companyName: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bookingNum: { fontSize: 14, fontWeight: '600', color: C.sub },
  serviceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  serviceBadgeText: { fontSize: 13, fontWeight: '600', color: C.g700 },

  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10,
    gap: 6, marginBottom: 10,
  },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: C.border },
  routeFrom: { fontSize: 13, color: C.sub, flex: 2, textAlign: 'left' },
  routeArrow: { fontSize: 13, color: C.muted },
  routeTo: { fontSize: 13, color: C.sub, flex: 2, textAlign: 'right' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  metaChipText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // Vehicles
  vehicleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  vehicleItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  vehicleIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleName: { fontSize: 14, fontWeight: '700', color: C.text },
  vehiclePlate: { fontSize: 13, color: C.sub, marginTop: 2 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  driverText: { fontSize: 13, color: C.muted },
  vehiclePrice: { fontSize: 15, fontWeight: '700', color: C.g700 },

  // Pricing
  pricingHero: {
    backgroundColor: C.g50, borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: C.g100,
  },
  pricingHeroLabel: { fontSize: 13, color: C.g700, fontWeight: '600', marginBottom: 4 },
  pricingHeroValue: { fontSize: 28, fontWeight: '900', color: C.g700, fontFamily: DISPLAY },
  pricingRows: { gap: 0 },
  pricingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pricingRowLabel: { fontSize: 14, color: C.sub },
  pricingRowValue: { fontSize: 14, fontWeight: '600', color: C.text },

  // Notes
  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  // Self-drive details grid
  sdGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  sdItem: {
    width: '50%', paddingVertical: 10, paddingRight: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sdLabel: { fontSize: 12, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  sdVal: { fontSize: 14, fontWeight: '700', color: C.text },

  // Tags (inclusions/exclusions)
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.g50, borderRadius: 20, borderWidth: 1, borderColor: C.g300,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagGreenText: { fontSize: 13, color: C.g700, fontWeight: '500' },
  tagRed: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.redBg, borderRadius: 20, borderWidth: 1, borderColor: C.red + '40',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagRedText: { fontSize: 13, color: C.redDark, fontWeight: '500' },

  // Terms
  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  termNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  termNumText: { fontSize: 12, fontWeight: '700', color: C.sub },
  termText: { flex: 1, fontSize: 14, color: C.sub, lineHeight: 20 },

  // Actions
  actions: { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 2, borderColor: C.red,
    backgroundColor: C.redBg,
  },
  withdrawBtnText: { fontSize: 15, fontWeight: '700', color: C.red },
  freshBtn: { borderRadius: 14, overflow: 'hidden' },
  freshBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14,
  },
  freshBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
