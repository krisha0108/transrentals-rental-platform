/**
 * WanderQuoteDetailScreen.js
 * Full parity with /customer/wander-quotes/[id] web page
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, Modal,
  Dimensions, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import wanderService from '../../services/wanderService';
import paymentService from '../../services/paymentService';
import { BASE_URL } from '../../api';
import api from '../../api';
import RazorpayCheckout from 'react-native-razorpay';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG    = '#F5F5F7';

/* ─── helpers ─────────────────────────────────────────────────────────── */
function safeArr(val, fb = []) {
  if (Array.isArray(val)) return val;
  if (!val) return fb;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : fb; } catch { return fb; }
}
function getImg(img) {
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/'))    return `${BASE_URL}${img}`;
  return `${BASE_URL}/uploads/${img}`;
}
function fmtDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return str; }
}
function fmtMoney(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; }

const REQ_STATUS = {
  PENDING:   { label: 'Pending',   color: '#D97706', bg: '#FEF3C7' },
  QUOTED:    { label: 'Quoted',    color: '#2563EB', bg: '#DBEAFE' },
  ACCEPTED:  { label: 'Accepted',  color: GREEN,     bg: '#D1FAE5' },
  COMPLETED: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6' },
  DROPPED:   { label: 'Dropped',   color: '#DC2626', bg: '#FEE2E2' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
  EXPIRED:   { label: 'Expired',   color: '#9CA3AF', bg: '#F9FAFB' },
};
const QUOTE_STATUS = {
  AWAITING: { label: 'Awaiting',  color: '#D97706', bg: '#FEF3C7' },
  ACCEPTED: { label: 'Accepted',  color: GREEN,     bg: '#D1FAE5' },
  REJECTED: { label: 'Rejected',  color: '#DC2626', bg: '#FEE2E2' },
  EXPIRED:  { label: 'Expired',   color: '#9CA3AF', bg: '#F3F4F6' },
};
const BOOKING_STATUS = {
  PAYMENT_PENDING: { label: 'Payment Pending', color: '#D97706', bg: '#FEF3C7' },
  CONFIRMED:       { label: 'Confirmed',       color: GREEN,     bg: '#D1FAE5' },
  STARTED:         { label: 'Trip Started',    color: '#2563EB', bg: '#DBEAFE' },
  COMPLETED:       { label: 'Completed',       color: '#6B7280', bg: '#F3F4F6' },
  CANCELLED:       { label: 'Cancelled',       color: '#DC2626', bg: '#FEE2E2' },
};

/* ════════════════════════════════════════════════════════════════════════
   IMAGE CAROUSEL
═══════════════════════════════════════════════════════════════════════ */
function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef(null);
  const imgs = images.filter(Boolean);

  if (imgs.length === 0) {
    return (
      <View style={[styles.heroImg, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="compass-outline" size={52} color="#94A3B8" />
      </View>
    );
  }

  const goTo = (i) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIdx(i);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ height: 240 }}
      >
        {imgs.map((img, i) => {
          const uri = getImg(img);
          return uri
            ? <Image key={i} source={{ uri }} style={styles.heroImg} resizeMode="cover" />
            : <View key={i} style={[styles.heroImg, { backgroundColor: '#E2E8F0' }]} />;
        })}
      </ScrollView>

      {/* Counter */}
      <View style={styles.imgCounter}>
        <Text style={styles.imgCounterText}>{idx + 1} / {imgs.length}</Text>
      </View>

      {/* Arrows */}
      {idx > 0 && (
        <TouchableOpacity style={[styles.imgArrow, styles.imgArrowLeft]} onPress={() => goTo(idx - 1)}>
          <Icon name="chevron-left" size={18} color="#fff" />
        </TouchableOpacity>
      )}
      {idx < imgs.length - 1 && (
        <TouchableOpacity style={[styles.imgArrow, styles.imgArrowRight]} onPress={() => goTo(idx + 1)}>
          <Icon name="chevron-right" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Dots */}
      <View style={styles.dotRow}>
        {imgs.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot, i === idx && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 14 }}>
          {imgs.map((img, i) => {
            const uri = getImg(img);
            return (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                {uri
                  ? <Image source={{ uri }} style={[styles.thumb, i === idx && styles.thumbActive]} resizeMode="cover" />
                  : <View style={[styles.thumb, { backgroundColor: '#E2E8F0' }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PRICE COMPARISON BOX
═══════════════════════════════════════════════════════════════════════ */
function PriceCompareBox({ listedPrice, quotedPerPerson, groupSize }) {
  if (!listedPrice || !quotedPerPerson) return null;
  const listed = Number(listedPrice);
  const quoted = Number(quotedPerPerson);
  const diff   = listed > 0 ? Math.round(((quoted - listed) / listed) * 100) : 0;
  const isLower = diff < 0;
  const isSame  = diff === 0;

  return (
    <View style={styles.compareBox}>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Listed price / person</Text>
        <Text style={styles.compareVal}>{fmtMoney(listed)}</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={styles.compareLabel}>Quoted price / person</Text>
        <Text style={[styles.compareVal, { color: isLower ? GREEN : '#DC2626' }]}>
          {fmtMoney(quoted)}
        </Text>
      </View>
      <View style={[styles.compareDiffRow, { backgroundColor: isLower ? '#D1FAE5' : isSame ? '#F3F4F6' : '#FEE2E2' }]}>
        <Ionicons
          name={isLower ? 'trending-down' : isSame ? 'remove' : 'trending-up'}
          size={14}
          color={isLower ? GREEN : isSame ? '#6B7280' : '#DC2626'}
        />
        <Text style={[styles.compareDiffText, { color: isLower ? GREEN : isSame ? '#6B7280' : '#DC2626' }]}>
          {isSame
            ? 'Same as listed price'
            : `${Math.abs(diff)}% ${isLower ? 'below' : 'above'} listed price`}
        </Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ADVANCE PAYMENT INFO
═══════════════════════════════════════════════════════════════════════ */
function AdvancePaymentInfo({ listing, quoteAmount }) {
  if (!listing?.requireAdvancePayment || !listing?.advancePaymentValue) return null;
  const total    = Number(quoteAmount || 0);
  const advAmt   = listing.advancePaymentType === 'PERCENTAGE'
    ? Math.round((total * listing.advancePaymentValue) / 100)
    : Number(listing.advancePaymentValue);
  const balance  = total - advAmt;

  return (
    <View style={styles.advanceBox}>
      <View style={styles.advanceHeader}>
        <Ionicons name="information-circle-outline" size={15} color="#2563EB" />
        <Text style={styles.advanceHeaderText}>Advance Payment Required</Text>
      </View>
      <View style={styles.advanceRow}>
        <Text style={styles.advanceLabel}>
          Advance ({listing.advancePaymentType === 'PERCENTAGE' ? `${listing.advancePaymentValue}%` : 'Fixed'})
        </Text>
        <Text style={styles.advanceAmt}>{fmtMoney(advAmt)}</Text>
      </View>
      <View style={styles.advanceRow}>
        <Text style={styles.advanceLabel}>Balance due on trip day</Text>
        <Text style={styles.advanceAmt}>{fmtMoney(balance)}</Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   INCLUSIONS / EXCLUSIONS
═══════════════════════════════════════════════════════════════════════ */
function InclExclGrid({ inclusions, exclusions }) {
  const incl = safeArr(inclusions);
  const excl = safeArr(exclusions);
  if (incl.length === 0 && excl.length === 0) return null;
  return (
    <View style={styles.inclExclGrid}>
      {incl.length > 0 && (
        <View style={styles.inclBox}>
          <Text style={styles.inclTitle}>Includes</Text>
          {incl.map((it, i) => (
            <View key={i} style={styles.inclRow}>
              <Icon name="check-circle" size={13} color={GREEN} />
              <Text style={styles.inclText}>{it}</Text>
            </View>
          ))}
        </View>
      )}
      {excl.length > 0 && (
        <View style={styles.exclBox}>
          <Text style={styles.exclTitle}>Excludes</Text>
          {excl.map((it, i) => (
            <View key={i} style={styles.inclRow}>
              <Icon name="x-circle" size={13} color="#DC2626" />
              <Text style={[styles.inclText, { color: '#6B7280' }]}>{it}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   QUOTE CARD
═══════════════════════════════════════════════════════════════════════ */
function QuoteCard({ quote, listing, groupSize, canAccept, onAccept }) {
  const isAccepted = quote.status === 'ACCEPTED';
  const isRejected = quote.status === 'REJECTED' || quote.status === 'EXPIRED';
  const qStatus = QUOTE_STATUS[quote.status] || QUOTE_STATUS.AWAITING;

  const incl = safeArr(quote.customInclusions);
  const excl = safeArr(quote.customExclusions);
  const hasInclExcl = incl.length > 0 || excl.length > 0;

  return (
    <View style={[styles.quoteCard, isAccepted && styles.quoteCardAccepted, isRejected && { opacity: 0.65 }]}>
      {/* Accepted top bar */}
      {isAccepted && (
        <LinearGradient colors={[GREEN, '#06A35C']} style={styles.acceptedBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="checkmark-circle" size={15} color="#fff" />
          <Text style={styles.acceptedBarText}>You accepted this quote</Text>
        </LinearGradient>
      )}

      <View style={styles.quotePad}>
        {/* Vendor row */}
        <View style={styles.vendorTopRow}>
          <View style={styles.vendorAvatarBox}>
            <Ionicons name="business-outline" size={22} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorNameTxt}>{quote.vendor?.businessName || 'Tour Operator'}</Text>
            {quote.vendor?.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${quote.vendor.phone}`)}>
                <Text style={styles.vendorPhoneTxt}>
                  <Icon name="phone" size={11} color="#64748B" /> {quote.vendor.phone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.qStatusPill, { backgroundColor: qStatus.bg }]}>
            <Text style={[styles.qStatusText, { color: qStatus.color }]}>{qStatus.label}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceSect}>
          <Text style={styles.quotedTotalLabel}>Total Quoted Price</Text>
          <Text style={styles.quotedTotalAmt}>{fmtMoney(quote.amount)}</Text>
          {quote.perPersonAmount && groupSize > 1 && (
            <Text style={styles.perPaxTxt}>
              {fmtMoney(quote.perPersonAmount)} × {groupSize} persons
            </Text>
          )}
        </View>

        {/* Price comparison */}
        <PriceCompareBox
          listedPrice={listing?.basePrice}
          quotedPerPerson={quote.perPersonAmount}
          groupSize={groupSize}
        />

        {/* Advance payment info */}
        <AdvancePaymentInfo listing={listing} quoteAmount={quote.amount} />

        {/* Inclusions / Exclusions */}
        {hasInclExcl && (
          <InclExclGrid inclusions={incl} exclusions={excl} />
        )}

        {/* Vendor note */}
        {quote.notes ? (
          <View style={styles.vendorNoteBox}>
            <Icon name="info" size={13} color="#D97706" />
            <Text style={styles.vendorNoteText}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Metadata */}
        <View style={styles.quoteMeta}>
          <View style={styles.metaTag}>
            <Icon name="calendar" size={11} color="#64748B" />
            <Text style={styles.metaTagText}>Received {fmtDate(quote.createdAt)}</Text>
          </View>
          {quote.validUntil && (
            <View style={[styles.metaTag, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Icon name="clock" size={11} color="#D97706" />
              <Text style={[styles.metaTagText, { color: '#D97706' }]}>
                Valid till {fmtDate(quote.validUntil)}
              </Text>
            </View>
          )}
        </View>

        {/* Accept button */}
        {canAccept && !isAccepted && !isRejected && (
          <TouchableOpacity style={styles.acceptQuoteBtn} onPress={() => onAccept(quote)} activeOpacity={0.85}>
            <LinearGradient
              colors={[GREEN, '#06A35C']} style={styles.acceptQuoteBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Icon name="check" size={15} color="#fff" />
              <Text style={styles.acceptQuoteBtnText}>Accept This Quote</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   REVIEW CARD
═══════════════════════════════════════════════════════════════════════ */
function ReviewCard({ requestId, existingReview }) {
  const [rating, setRating]     = useState(existingReview?.rating || 0);
  const [title, setTitle]       = useState(existingReview?.title || '');
  const [review, setReview]     = useState(existingReview?.comment || '');
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating === 0) return Alert.alert('Rating needed', 'Please select a star rating.');
    setSubmitting(true);
    try {
      await api.post(`/wander/reviews`, { quoteRequestId: requestId, rating, title, comment: review });
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Your Review</Text>

      {submitted ? (
        <View style={styles.reviewSubmittedBox}>
          <Ionicons name="star" size={28} color="#F59E0B" />
          <Text style={styles.reviewSubmittedTitle}>Review Submitted</Text>
          <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
            {[1,2,3,4,5].map(s => (
              <Ionicons key={s} name={s <= rating ? 'star' : 'star-outline'} size={18} color="#F59E0B" />
            ))}
          </View>
          {review ? <Text style={styles.reviewSubmittedTxt}>{review}</Text> : null}
          {existingReview?.vendorReply && (
            <View style={styles.vendorReplyBox}>
              <Text style={styles.vendorReplyLabel}>Vendor reply</Text>
              <Text style={styles.vendorReplyTxt}>{existingReview.vendorReply}</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Stars */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {[1,2,3,4,5].map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Title (optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Short title for your experience"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Your Experience</Text>
          <TextInput
            style={[styles.reviewInput, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Share details about your tour…"
            placeholderTextColor="#9CA3AF"
            multiline numberOfLines={4}
            value={review}
            onChangeText={setReview}
          />

          <TouchableOpacity
            style={[styles.reviewSubmitBtn, submitting && { opacity: 0.6 }]}
            onPress={submit} disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="star" size={15} color="#fff" /><Text style={styles.reviewSubmitBtnText}>Submit Review</Text></>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   BOOKING STATUS SECTION
═══════════════════════════════════════════════════════════════════════ */
function BookingSection({ booking, isB2B, onPay, isPaying }) {
  if (!booking) return null;
  const bCfg    = BOOKING_STATUS[booking.status] || BOOKING_STATUS.CONFIRMED;
  const isPending  = booking.status === 'PAYMENT_PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isOngoing   = booking.status === 'STARTED';
  const isDone      = booking.status === 'COMPLETED';

  /* ── B2B paths ── */
  if (isB2B) {
    if (booking.invoiceSent) {
      return (
        <View style={[styles.card, styles.b2bInvoiceCard]}>
          <Ionicons name="document-text-outline" size={22} color="#2563EB" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.b2bCardTitle}>Invoice Received</Text>
            {booking.amount && <Text style={styles.b2bCardAmt}>{fmtMoney(booking.amount)}</Text>}
            {booking.invoiceNotes && <Text style={styles.b2bCardNote}>{booking.invoiceNotes}</Text>}
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.card, styles.b2bWaitCard]}>
        <Ionicons name="hourglass-outline" size={22} color="#D97706" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.b2bCardTitle}>Awaiting Invoice</Text>
          {booking.companyName && <Text style={styles.b2bCardNote}>{booking.companyName}</Text>}
          <Text style={styles.b2bCardNote}>Invoice will be sent after trip completion</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>

      {/* ── Booking ID header banner ── */}
      <LinearGradient
        colors={isDone ? ['#1E293B','#334155'] : isOngoing ? ['#1E3A5F','#1E40AF'] : ['#064E3B','#065F46']}
        style={styles.bookingBanner}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={[styles.decoCircle, { width: 80, height: 80, top: -22, right: 40, opacity: 0.1 }]} />
        <View style={[styles.decoCircle, { width: 45, height: 45, bottom: -14, right: 8, opacity: 0.08 }]} />

        <View style={styles.bookingBannerIcon}>
          <Ionicons
            name={isDone ? 'checkmark-done-circle' : isOngoing ? 'navigate-circle' : 'checkmark-circle'}
            size={28}
            color={isDone ? '#94A3B8' : isOngoing ? '#60A5FA' : '#34D399'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookingBannerLabel}>
            {isDone ? 'Trip Completed' : isOngoing ? 'Trip In Progress' : 'Booking Created'}
          </Text>
          <Text style={styles.bookingBannerId}>#{booking.bookingId}</Text>
        </View>
        <View style={[styles.bStatusPill, { backgroundColor: bCfg.bg }]}>
          <Text style={[styles.bStatusText, { color: bCfg.color }]}>{bCfg.label}</Text>
        </View>
      </LinearGradient>

      {/* ── Details grid ── */}
      <View style={styles.bookingGrid}>
        {booking.amount && (
          <View style={styles.bookingGridItem}>
            <Text style={styles.bookingGridLabel}>Total Amount</Text>
            <Text style={styles.bookingGridVal}>{fmtMoney(booking.amount)}</Text>
          </View>
        )}
        {booking.advanceAmount ? (
          <View style={styles.bookingGridItem}>
            <Text style={styles.bookingGridLabel}>
              {isPending ? 'Advance Due' : 'Advance Paid'}
            </Text>
            <Text style={[styles.bookingGridVal, { color: isPending ? '#D97706' : GREEN }]}>
              {fmtMoney(booking.advanceAmount)}
            </Text>
          </View>
        ) : null}
        {booking.travelDate && (
          <View style={styles.bookingGridItem}>
            <Text style={styles.bookingGridLabel}>Travel Date</Text>
            <Text style={styles.bookingGridVal}>{fmtDate(booking.travelDate)}</Text>
          </View>
        )}
        {booking.groupSize && (
          <View style={styles.bookingGridItem}>
            <Text style={styles.bookingGridLabel}>Group Size</Text>
            <Text style={styles.bookingGridVal}>{booking.groupSize} pax</Text>
          </View>
        )}
        {booking.amount && booking.advanceAmount && (
          <View style={styles.bookingGridItem}>
            <Text style={styles.bookingGridLabel}>Balance on Trip</Text>
            <Text style={styles.bookingGridVal}>{fmtMoney(booking.amount - booking.advanceAmount)}</Text>
          </View>
        )}
      </View>

      {/* ── PAYMENT PENDING ── */}
      {isPending && booking.advanceAmount && (
        <>
          <View style={styles.payAlert}>
            <Icon name="alert-triangle" size={14} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.payAlertTitle}>Advance Payment Pending</Text>
              <Text style={styles.payAlertText}>
                Pay {fmtMoney(booking.advanceAmount)} to confirm your tour slot.
                Balance {fmtMoney(booking.amount - booking.advanceAmount)} will be collected on trip day.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.payNowBtn, isPaying && { opacity: 0.65 }]}
            onPress={onPay}
            disabled={isPaying}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.payNowBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {isPaying
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="card-outline" size={18} color="#fff" />
                    <Text style={styles.payNowBtnText}>Pay Advance · {fmtMoney(booking.advanceAmount)}</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.paySecureNote}>
            <Icon name="lock" size={11} color="#9CA3AF" /> Secured by Razorpay
          </Text>
        </>
      )}

      {/* ── CONFIRMED ── */}
      {isConfirmed && (
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7']}
          style={styles.confirmedBanner}
        >
          <View style={styles.confirmedIconWrap}>
            <Ionicons name="checkmark-circle" size={32} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmedSub}>
              Your tour is confirmed.{booking.advanceAmount
                ? ` Advance of ${fmtMoney(booking.advanceAmount)} received.`
                : ''} The vendor will contact you before the trip.
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* ── ONGOING ── */}
      {isOngoing && (
        <View style={styles.ongoingBanner}>
          <Ionicons name="navigate" size={16} color="#2563EB" />
          <Text style={styles.ongoingText}>Your trip is currently in progress. Enjoy your journey!</Text>
        </View>
      )}

      {/* ── COMPLETED ── */}
      {isDone && (
        <View style={styles.doneBanner}>
          <Ionicons name="ribbon-outline" size={16} color="#6B7280" />
          <Text style={styles.doneText}>Trip completed. We hope you had a great experience!</Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SUCCESS MODAL
═══════════════════════════════════════════════════════════════════════ */
function SuccessModal({ data, onClose, onMyTrips, onPayNow }) {
  if (!data) return null;
  const isPayment = data.type === 'payment';

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>

          {/* Top accent bar */}
          <LinearGradient
            colors={isPayment ? ['#F59E0B', '#D97706'] : [GREEN, '#06A35C']}
            style={styles.successTopBar}
          />

          {/* Icon ring */}
          <View style={styles.successRingOuter}>
            <View style={styles.successRingMid}>
              <LinearGradient
                colors={isPayment ? ['#F59E0B', '#D97706'] : [GREEN, '#06A35C']}
                style={styles.successIconCircle}
              >
                <Ionicons
                  name={isPayment ? 'checkmark-done' : 'checkmark'}
                  size={34} color="#fff"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.successTitle}>
            {isPayment ? 'Payment Successful!' : 'Booking Created!'}
          </Text>
          <Text style={styles.successSubtitle}>
            {isPayment
              ? 'Advance payment received & booking confirmed'
              : 'Your quote has been accepted successfully'}
          </Text>

          {/* Info box */}
          <View style={styles.successInfoBox}>

            {data.bookingId && (
              <View style={styles.successInfoRow}>
                <View style={styles.successInfoIcon}>
                  <Icon name="hash" size={13} color={isPayment ? '#D97706' : GREEN} />
                </View>
                <Text style={styles.successInfoLabel}>Booking ID</Text>
                <Text style={[styles.successInfoVal, { fontFamily: 'monospace' }]}>
                  #{data.bookingId}
                </Text>
              </View>
            )}

            {isPayment && data.amount && (
              <View style={styles.successInfoRow}>
                <View style={styles.successInfoIcon}>
                  <Ionicons name="card-outline" size={13} color="#D97706" />
                </View>
                <Text style={styles.successInfoLabel}>Amount Paid</Text>
                <Text style={[styles.successInfoVal, { color: GREEN }]}>{fmtMoney(data.amount)}</Text>
              </View>
            )}

            {isPayment && data.transactionId && (
              <View style={styles.successInfoRow}>
                <View style={styles.successInfoIcon}>
                  <Icon name="shield" size={13} color="#D97706" />
                </View>
                <Text style={styles.successInfoLabel}>Transaction ID</Text>
                <Text style={[styles.successInfoVal, { fontSize: 11, color: '#64748B' }]} numberOfLines={1}>
                  {data.transactionId}
                </Text>
              </View>
            )}

            {!isPayment && data.advanceAmount && (
              <View style={styles.successInfoRow}>
                <View style={styles.successInfoIcon}>
                  <Ionicons name="card-outline" size={13} color={GREEN} />
                </View>
                <Text style={styles.successInfoLabel}>Advance Due</Text>
                <Text style={[styles.successInfoVal, { color: '#D97706' }]}>{fmtMoney(data.advanceAmount)}</Text>
              </View>
            )}

            <View style={[styles.successInfoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.successInfoIcon}>
                <Icon name="phone" size={13} color={isPayment ? '#D97706' : GREEN} />
              </View>
              <Text style={styles.successInfoLabel}>Next step</Text>
              <Text style={styles.successInfoVal}>
                {isPayment ? 'Vendor will call you' : data.requiresPayment ? 'Pay advance below' : 'Vendor will contact you'}
              </Text>
            </View>
          </View>

          {/* Note */}
          <View style={[styles.successNote, isPayment && { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
            <Ionicons
              name="information-circle-outline" size={15}
              color={isPayment ? '#D97706' : GREEN}
            />
            <Text style={[styles.successNoteText, isPayment && { color: '#92400E' }]}>
              {isPayment
                ? 'Your tour slot is confirmed. The vendor will call you with trip details.'
                : data.requiresPayment
                  ? 'Booking created! Pay the advance amount to secure your tour slot.'
                  : 'Booking created! The vendor will call you to finalise trip details.'}
            </Text>
          </View>

          {/* Buttons */}
          {!isPayment && data.requiresPayment && (
            <TouchableOpacity style={styles.successPayBtn} onPress={onPayNow} activeOpacity={0.85}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.successPayBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="card-outline" size={17} color="#fff" />
                <Text style={styles.successPayBtnText}>Pay Advance — {fmtMoney(data.advanceAmount)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.successPrimaryBtn} onPress={onMyTrips} activeOpacity={0.85}>
            <LinearGradient
              colors={[GREEN, '#06A35C']}
              style={styles.successPrimaryBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="bookmark-outline" size={17} color="#fff" />
              <Text style={styles.successPrimaryBtnText}>View My Trips</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.successSecondaryBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.successSecondaryBtnText}>
              {isPayment ? 'Back to Booking' : 'Stay Here'}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CONFIRM ACCEPT MODAL
═══════════════════════════════════════════════════════════════════════ */
function ConfirmModal({ visible, quote, listing, groupSize, onCancel, onConfirm, isLoading }) {
  if (!quote) return null;
  const total    = Number(quote.amount || 0);
  const advAmt   = listing?.requireAdvancePayment && listing?.advancePaymentValue
    ? (listing.advancePaymentType === 'PERCENTAGE'
        ? Math.round((total * listing.advancePaymentValue) / 100)
        : Number(listing.advancePaymentValue))
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top gradient accent */}
          <LinearGradient colors={[GREEN, '#06A35C']} style={styles.modalTopBar} />

          <View style={styles.modalIconWrap}>
            <LinearGradient colors={[GREEN, '#06A35C']} style={styles.modalIconCircle}>
              <Icon name="check" size={26} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.modalTitle}>Accept this quote?</Text>
          <Text style={styles.modalSub}>
            You are accepting{' '}
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>
              {quote.vendor?.businessName || 'this vendor'}
            </Text>
            {'\'s quote.'}
          </Text>

          {/* Quote summary */}
          <View style={styles.modalSummaryBox}>
            <View style={styles.modalSummaryRow}>
              <Text style={styles.modalSummaryLabel}>Total Amount</Text>
              <Text style={styles.modalSummaryVal}>{fmtMoney(total)}</Text>
            </View>
            {quote.perPersonAmount && (
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Per Person</Text>
                <Text style={styles.modalSummaryVal}>{fmtMoney(quote.perPersonAmount)}</Text>
              </View>
            )}
            {advAmt && (
              <>
                <View style={[styles.modalSummaryRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 10 }]}>
                  <Text style={styles.modalSummaryLabel}>Advance Payment</Text>
                  <Text style={[styles.modalSummaryVal, { color: '#D97706' }]}>{fmtMoney(advAmt)}</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Balance on trip day</Text>
                  <Text style={styles.modalSummaryVal}>{fmtMoney(total - advAmt)}</Text>
                </View>
              </>
            )}
          </View>

          {quote.notes && (
            <View style={[styles.vendorNoteBox, { width: '100%', marginBottom: 16 }]}>
              <Icon name="info" size={13} color="#D97706" />
              <Text style={styles.vendorNoteText}>{quote.notes}</Text>
            </View>
          )}

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAcceptBtn} onPress={onConfirm} disabled={isLoading}>
              <LinearGradient colors={[GREEN, '#06A35C']} style={styles.modalAcceptGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalAcceptText}>Yes, Accept</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════════ */
export default function WanderQuoteDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { requestId, requestTitle } = route.params || {};

  const [data, setData]           = useState(null);
  const [isLoading, setLoading]   = useState(true);
  const [isAccepting, setAccepting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingQuote, setPending] = useState(null);
  const [isPaying, setIsPaying]   = useState(false);
  const [successModal, setSuccessModal] = useState(null);
  // successModal shape: { type: 'accept' | 'payment', bookingId, amount, transactionId }

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      setLoading(true);
      const res = await wanderService.getQuoteRequestById(requestId);
      setData(res?.id ? res : (res?.request || null));
    } catch (e) { console.log('QuoteDetail err:', e); }
    finally { setLoading(false); }
  };

  const handleAccept = (q) => { setPending(q); setShowModal(true); };

  const handlePay = async () => {
    const booking = data?.booking;
    if (!booking) return;
    setIsPaying(true);
    try {
      const orderRes = await paymentService.createOrder(booking.id, 'wander_quote');
      if (!orderRes?.success) {
        Alert.alert('Error', orderRes?.error || 'Could not create payment order.');
        return;
      }
      const { order, razorpayConfig, booking: bInfo } = orderRes;
      const options = {
        description: `Tour Advance — ${data.listing?.title || 'Wander Tour'}`,
        image: razorpayConfig?.image || '',
        currency: order.currency || 'INR',
        key: razorpayConfig?.key || '',
        amount: order.amount,
        name: razorpayConfig?.name || 'TransRentals',
        order_id: order.id,
        prefill: {
          email: bInfo?.customerEmail || '',
          contact: bInfo?.customerPhone || '',
          name: bInfo?.customerName || '',
        },
        theme: razorpayConfig?.theme || { color: GREEN },
      };

      const rzpData = await RazorpayCheckout.open(options);

      // Verify with backend
      const verifyRes = await paymentService.verifyPayment(
        rzpData.razorpay_order_id,
        rzpData.razorpay_payment_id,
        rzpData.razorpay_signature,
        booking.id,
        'wander_quote'
      );

      if (verifyRes?.success) {
        await load();
        setSuccessModal({
          type: 'payment',
          bookingId: verifyRes.booking?.bookingNumber || booking.bookingId,
          amount: booking.advanceAmount,
          transactionId: verifyRes.booking?.transactionId,
        });
      } else {
        Alert.alert('Verification Failed', verifyRes?.error || 'Payment received but verification failed. Contact support.');
      }
    } catch (e) {
      if (e?.code === 'PAYMENT_CANCELLED') {
        // User cancelled — do nothing
      } else {
        Alert.alert('Payment Error', e?.description || 'Payment failed. Please try again.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  const confirmAccept = async () => {
    setAccepting(true);
    try {
      const res = await wanderService.acceptQuote(data.id, pendingQuote.id);
      setShowModal(false);
      if (res?.success) {
        await load();
        setSuccessModal({
          type: 'accept',
          bookingId: res.booking?.bookingId,
          amount: res.booking?.amount,
          advanceAmount: res.booking?.advanceAmount,
          requiresPayment: res.booking?.status === 'PAYMENT_PENDING',
        });
      } else {
        Alert.alert('Error', res?.error || 'Could not accept. Try again.');
      }
    } catch { Alert.alert('Error', 'Network error. Try again.'); }
    finally { setAccepting(false); }
  };

  /* Loading */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title={requestTitle || 'Request Details'} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingTxt}>Loading details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title="Request Details" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#CBD5E1" />
          <Text style={styles.errorTitle}>Could not load</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const listing     = data.listing || {};
  const quotes      = data.quotes  || [];
  const booking     = data.booking;
  const images      = safeArr(listing.images);
  const rCfg        = REQ_STATUS[data.status] || REQ_STATUS.PENDING;
  const canAccept   = data.status === 'QUOTED' && quotes.some(q => q.status !== 'REJECTED' && q.status !== 'EXPIRED');
  const isCompleted = data.status === 'COMPLETED' || booking?.status === 'COMPLETED';
  const isB2B       = booking?.isB2BBooking;

  // Sort quotes: accepted first, then by price
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (a.status === 'ACCEPTED') return -1;
    if (b.status === 'ACCEPTED') return 1;
    return (a.amount || 0) - (b.amount || 0);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title={`Request ${data.requestId || ''}`} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* IMAGE CAROUSEL */}
        <ImageCarousel images={images} />

        {/* TOUR INFO */}
        <View style={styles.card}>
          {listing.category?.name && (
            <View style={styles.catBadge}>
              {listing.category.icon && <Text style={{ fontSize: 14 }}>{listing.category.icon}</Text>}
              <Text style={styles.catBadgeText}>{listing.category.name}</Text>
            </View>
          )}
          <Text style={styles.tourTitle}>{listing.title || 'Tour Request'}</Text>

          <View style={styles.tourMetaRow}>
            {listing.mainLocation?.name && (
              <View style={styles.tourMetaChip}>
                <Ionicons name="location-outline" size={13} color={GREEN} />
                <Text style={styles.tourMetaChipText}>{listing.mainLocation.name}</Text>
              </View>
            )}
            {listing.duration && (
              <View style={styles.tourMetaChip}>
                <Icon name="clock" size={13} color={GREEN} />
                <Text style={styles.tourMetaChipText}>{listing.duration}</Text>
              </View>
            )}
          </View>

          {/* Status + Request ID */}
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: rCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: rCfg.color }]} />
              <Text style={[styles.statusPillText, { color: rCfg.color }]}>{rCfg.label}</Text>
            </View>
            <View style={styles.reqIdChip}>
              <Text style={styles.reqIdText}>#{data.requestId}</Text>
            </View>
          </View>

          <Text style={styles.submittedDate}>Submitted {fmtDate(data.createdAt)}</Text>
        </View>

        {/* BOOKING SECTION (if exists) */}
        <BookingSection booking={booking} isB2B={isB2B} onPay={handlePay} isPaying={isPaying} />

        {/* REQUEST DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Your Request</Text>
          <InfoRow icon="calendar" label="Travel Date" value={fmtDate(data.travelDate)} />
          <InfoRow icon="users"    label="Group Size"  value={`${data.groupSize || 1} persons`} />
          {data.pickupLocation && (
            <InfoRow icon="map-pin" label="Pickup From" value={data.pickupLocation} />
          )}
          {data.bookingFor === 'COMPANY' && data.companyName && (
            <InfoRow icon="briefcase" label="Company" value={data.companyName} />
          )}
          {data.requirements && (
            <View style={styles.requirementsBox}>
              <Text style={styles.reqLabel}>Special Requirements</Text>
              <Text style={styles.reqText}>{data.requirements}</Text>
            </View>
          )}

          {/* View full tour page */}
          {listing.slug && (
            <TouchableOpacity
              style={styles.viewTourBtn}
              onPress={() => navigation.navigate('WanderListingDetail', {
                listingId: listing.id,
                listingTitle: listing.title,
              })}
            >
              <Ionicons name="compass-outline" size={15} color={GREEN} />
              <Text style={styles.viewTourBtnText}>View Full Tour Page</Text>
              <Icon name="arrow-right" size={13} color={GREEN} />
            </TouchableOpacity>
          )}
        </View>

        {/* QUOTES */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {quotes.length > 0 ? `${quotes.length} Quote${quotes.length > 1 ? 's' : ''} Received` : 'Vendor Quotes'}
          </Text>
          {quotes.length > 0 && (
            <View style={styles.quoteCountPill}>
              <Text style={styles.quoteCountText}>{quotes.length}</Text>
            </View>
          )}
        </View>

        {quotes.length === 0 ? (
          <View style={styles.noQuotesCard}>
            <Ionicons name="hourglass-outline" size={40} color="#CBD5E1" />
            <Text style={styles.noQuotesTitle}>Waiting for quotes</Text>
            <Text style={styles.noQuotesSub}>
              Vendors are reviewing your request.{'\n'}You'll receive quotes within 24 hours.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 14, gap: 12, marginBottom: 4 }}>
            {sortedQuotes.map(q => (
              <QuoteCard
                key={q.id}
                quote={q}
                listing={listing}
                groupSize={data.groupSize || 1}
                canAccept={canAccept}
                onAccept={handleAccept}
              />
            ))}
          </View>
        )}

        {/* REVIEW (only for completed) */}
        {isCompleted && (
          <ReviewCard requestId={data.id} existingReview={data.review} />
        )}

        <View style={{ height: 36 }} />
      </ScrollView>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        visible={showModal}
        quote={pendingQuote}
        listing={listing}
        groupSize={data.groupSize || 1}
        onCancel={() => setShowModal(false)}
        onConfirm={confirmAccept}
        isLoading={isAccepting}
      />

      {/* SUCCESS MODAL */}
      <SuccessModal
        data={successModal}
        onClose={() => setSuccessModal(null)}
        onMyTrips={() => { setSuccessModal(null); navigation.navigate('MyWanderBookings'); }}
        onPayNow={() => { setSuccessModal(null); handlePay(); }}
      />
    </SafeAreaView>
  );
}

/* ─── Small reusables ─────────────────────────────────────────────── */
function TopBar({ title, onBack }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Icon name="arrow-left" size={20} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Icon name={icon} size={13} color={GREEN} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoVal}>{value}</Text>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between', backgroundColor: BG,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingTxt: { color: '#64748B', fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 8 },
  retryBtn: { backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  /* Carousel */
  heroImg: { width, height: 240 },
  imgCounter: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  imgCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  imgArrow: {
    position: 'absolute', top: '38%',
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20,
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
  },
  imgArrowLeft: { left: 10 },
  imgArrowRight: { right: 10 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  dotActive: { backgroundColor: GREEN, width: 14 },
  thumbRow: { marginTop: 8, marginBottom: 4 },
  thumb: { width: 52, height: 40, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: GREEN },

  /* Card */
  card: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 20,
    padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  /* Tour info */
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)', marginBottom: 10,
  },
  catBadgeText: { fontSize: 12, fontWeight: '700', color: GREEN },
  tourTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', lineHeight: 27, marginBottom: 10 },
  tourMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tourMetaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  tourMetaChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  reqIdChip: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  reqIdText: { fontSize: 12, fontWeight: '700', color: '#475569', fontFamily: 'monospace' },
  submittedDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  /* Info row */
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  infoIconBox: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  infoLabel: { flex: 1, fontSize: 13, color: '#64748B' },
  infoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A', maxWidth: '55%', textAlign: 'right' },
  requirementsBox: {
    backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#C7D2FE', marginTop: 4,
  },
  reqLabel: { fontSize: 11, color: '#6366F1', fontWeight: '700', marginBottom: 5 },
  reqText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  viewTourBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 14,
    backgroundColor: '#F0FDF4',
  },
  viewTourBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: GREEN },

  /* Section header */
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  quoteCountPill: {
    backgroundColor: '#E8F8F2', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.25)',
  },
  quoteCountText: { fontSize: 12, color: GREEN, fontWeight: '700' },

  /* No quotes */
  noQuotesCard: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 20, padding: 28,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1,
  },
  noQuotesTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 10 },
  noQuotesSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 },

  /* Quote card */
  quoteCard: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, overflow: 'hidden',
  },
  quoteCardAccepted: { borderColor: GREEN + '70', backgroundColor: '#FAFFFE' },
  acceptedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  acceptedBarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  quotePad: { padding: 14 },

  /* Vendor top row */
  vendorTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  vendorAvatarBox: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8F8F2',
    justifyContent: 'center', alignItems: 'center',
  },
  vendorNameTxt: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  vendorPhoneTxt: { fontSize: 12, color: '#64748B', marginTop: 3 },
  qStatusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  qStatusText: { fontSize: 11, fontWeight: '700' },

  /* Price */
  priceSect: { marginBottom: 12 },
  quotedTotalLabel: { fontSize: 11, color: '#64748B', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  quotedTotalAmt: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  perPaxTxt: { fontSize: 12, color: '#64748B', marginTop: 3 },

  /* Price compare */
  compareBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  compareLabel: { fontSize: 12, color: '#64748B' },
  compareVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  compareDiffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4,
  },
  compareDiffText: { fontSize: 12, fontWeight: '600' },

  /* Advance */
  advanceBox: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 12,
  },
  advanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  advanceHeaderText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  advanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  advanceLabel: { fontSize: 12, color: '#3B82F6' },
  advanceAmt: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

  /* Incl/Excl */
  inclExclGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  inclBox: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  exclBox: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FECACA' },
  inclTitle: { fontSize: 11, fontWeight: '700', color: GREEN, marginBottom: 6 },
  exclTitle: { fontSize: 11, fontWeight: '700', color: '#DC2626', marginBottom: 6 },
  inclRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 4 },
  inclText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 17 },

  /* Vendor note */
  vendorNoteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 12,
  },
  vendorNoteText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  /* Meta tags */
  quoteMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  metaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  metaTagText: { fontSize: 11, color: '#64748B' },

  /* Accept button */
  acceptQuoteBtn: { borderRadius: 14, overflow: 'hidden' },
  acceptQuoteBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  acceptQuoteBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* Booking section */
  bookingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    marginBottom: 14, overflow: 'hidden',
  },
  decoCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  bookingBannerIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(52,211,153,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  bookingBannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  bookingBannerId: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bStatusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  bStatusText: { fontSize: 12, fontWeight: '700' },
  bookingGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  bookingGridItem: { width: '50%', marginBottom: 12 },
  bookingGridLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 3 },
  bookingGridVal: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  payAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  payAlertTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 3 },
  payAlertText: { fontSize: 12, color: '#B45309', lineHeight: 18 },
  payNowBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 14 },
  payNowBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16,
    shadowColor: '#D97706', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  payNowBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  paySecureNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },

  confirmedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  confirmedIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  confirmedTitle: { fontSize: 15, fontWeight: '800', color: '#065F46', marginBottom: 4 },
  confirmedSub: { fontSize: 12, color: '#047857', lineHeight: 18 },

  ongoingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  ongoingText: { flex: 1, fontSize: 13, color: '#1D4ED8', fontWeight: '600' },

  doneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  doneText: { flex: 1, fontSize: 13, color: '#4B5563', fontWeight: '600' },

  /* B2B cards */
  b2bInvoiceCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  b2bWaitCard:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  b2bCardTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  b2bCardAmt:   { fontSize: 18, fontWeight: '800', color: '#1D4ED8', marginBottom: 3 },
  b2bCardNote:  { fontSize: 12, color: '#64748B', lineHeight: 18 },

  /* Review */
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 7, marginTop: 12 },
  reviewInput: {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A',
  },
  reviewSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F59E0B', borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  reviewSubmitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  reviewSubmittedBox: { alignItems: 'center', paddingVertical: 12 },
  reviewSubmittedTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  reviewSubmittedTxt: { fontSize: 13, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  vendorReplyBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 12, width: '100%' },
  vendorReplyLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 },
  vendorReplyTxt: { fontSize: 13, color: '#374151', lineHeight: 19 },

  /* Confirm modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, width: '100%', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, elevation: 16,
  },
  modalTopBar: { height: 5 },
  modalIconWrap: { alignItems: 'center', marginTop: 22, marginBottom: 14 },
  modalIconCircle: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 },
  modalSub: { fontSize: 13, color: '#374151', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginBottom: 18 },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC', borderRadius: 14, marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0', padding: 14,
  },
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  modalSummaryLabel: { fontSize: 13, color: '#64748B' },
  modalSummaryVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  modalBtns: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 0 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  modalAcceptBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalAcceptGrad: { paddingVertical: 14, alignItems: 'center' },
  modalAcceptText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* ── Success Modal ── */
  successOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20,
  },
  successCard: {
    backgroundColor: '#fff', borderRadius: 28, width: '100%',
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 32, elevation: 18,
  },
  successTopBar: { width: '100%', height: 5 },

  successRingOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(9,179,104,0.08)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 22, marginBottom: 16,
  },
  successRingMid: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  successIconCircle: {
    width: 58, height: 58, borderRadius: 29,
    justifyContent: 'center', alignItems: 'center',
  },

  successTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6, paddingHorizontal: 24, textAlign: 'center' },
  successSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 20, paddingHorizontal: 24, textAlign: 'center', lineHeight: 19 },

  successInfoBox: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    width: '100%', marginHorizontal: 0, overflow: 'hidden', marginBottom: 14,
  },
  successInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  successInfoIcon: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  successInfoLabel: { flex: 1, fontSize: 12, color: '#64748B' },
  successInfoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A', maxWidth: '50%', textAlign: 'right' },

  successNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)',
    marginHorizontal: 20, marginBottom: 18,
  },
  successNoteText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },

  successPayBtn: { width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  successPayBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: '#D97706', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  successPayBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  successPrimaryBtn: { width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  successPrimaryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  successPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  successSecondaryBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16,
    paddingVertical: 13, marginHorizontal: 20, marginBottom: 20,
    alignItems: 'center', backgroundColor: '#F8FAFC', width: 'auto',
    alignSelf: 'stretch',
  },
  successSecondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '700' },
});
