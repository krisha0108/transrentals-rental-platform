import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import api from '../screens/api';
import CancelBookingSheet from './CancelBookingSheet';

/**
 * "Cancel Booking" button plus the CancelBookingSheet it opens, for booking
 * detail screens whose API cancels with PATCH { action: 'cancel', reason }.
 *
 * @param {string} path - API path to PATCH, e.g. `/bus-bookings/${id}`
 * @param {{title: string, number?: string, when?: string, paid?: number}} booking - shown in the sheet
 * @param {() => void} onDone - called when the sheet closes after a cancel, to reload the booking
 */
export default function CancelBookingAction({ path, booking, onDone, style }) {
  const [open, setOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const cancel = async (reason) => {
    try {
      const res = await api.patch(path, { action: 'cancel', reason, cancellationReason: reason });
      if (res.data?.success === false) throw new Error(res.data?.error || 'Failed to cancel booking');
      setCancelled(true);
      return { refundAmount: res.data?.booking?.refundAmount ?? null };
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Failed to cancel booking');
    }
  };

  const close = () => {
    setOpen(false);
    if (cancelled) {
      setCancelled(false);
      onDone?.();
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.btn, style]} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Ionicons name="close-circle-outline" size={wp('4.5%')} color="#EF4444" />
        <Text style={styles.text}>Cancel Booking</Text>
      </TouchableOpacity>
      <CancelBookingSheet visible={open} onClose={close} onConfirm={cancel} booking={booking} />
    </>
  );
}

export const formatCancelDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
  },
  text: { color: '#EF4444', fontWeight: '700', marginLeft: wp('2%'), fontSize: wp('3.8%') },
});
