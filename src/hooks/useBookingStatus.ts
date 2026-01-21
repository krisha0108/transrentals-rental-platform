'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { BookingAcceptedData, PaymentReceivedData } from '@/lib/socket/types';

export type BookingStatusType =
  | 'WAITING'      // Waiting for vendor to accept
  | 'ACCEPTED'     // Vendor accepted, waiting for payment
  | 'PAID'         // Payment completed
  | 'CANCELLED'    // Booking cancelled
  | 'EXPIRED';     // No vendor accepted in time

interface UseBookingStatusOptions {
  bookingId: string;
  onAccepted?: (data: BookingAcceptedData) => void;
  onPaymentConfirmed?: (data: PaymentReceivedData) => void;
  onCancelled?: (reason: string) => void;
  onExpired?: (reason: string) => void;
}

export function useBookingStatus({
  bookingId,
  onAccepted,
  onPaymentConfirmed,
  onCancelled,
  onExpired,
}: UseBookingStatusOptions) {
  const [status, setStatus] = useState<BookingStatusType>('WAITING');
  const [acceptedData, setAcceptedData] = useState<BookingAcceptedData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentReceivedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isConnected,
    connectionError,
    joinBookingRoom,
    leaveBookingRoom,
    on,
  } = useSocket();

  // Join booking room when connected
  useEffect(() => {
    if (isConnected && bookingId) {
      joinBookingRoom(bookingId);
      console.log(`[BookingStatus] Joined room for booking: ${bookingId}`);

      return () => {
        leaveBookingRoom(bookingId);
      };
    }
  }, [isConnected, bookingId, joinBookingRoom, leaveBookingRoom]);

  // Handle booking accepted
  useEffect(() => {
    const handleAccepted = (data: BookingAcceptedData) => {
      console.log('[BookingStatus] Booking accepted:', data);
      setStatus('ACCEPTED');
      setAcceptedData(data);
      onAccepted?.(data);
    };

    const unsubscribe = on('booking:accepted', handleAccepted);
    return unsubscribe;
  }, [on, onAccepted]);

  // Handle payment received
  useEffect(() => {
    const handlePaymentReceived = (data: PaymentReceivedData) => {
      console.log('[BookingStatus] Payment confirmed:', data);
      setStatus('PAID');
      setPaymentData(data);
      onPaymentConfirmed?.(data);
    };

    const unsubscribe = on('payment:received', handlePaymentReceived);
    return unsubscribe;
  }, [on, onPaymentConfirmed]);

  // Handle booking cancelled
  useEffect(() => {
    const handleCancelled = (data: { bookingId: string; reason: string }) => {
      if (data.bookingId === bookingId) {
        console.log('[BookingStatus] Booking cancelled:', data);
        setStatus('CANCELLED');
        setError(data.reason);
        onCancelled?.(data.reason);
      }
    };

    const unsubscribe = on('booking:cancelled', handleCancelled);
    return unsubscribe;
  }, [on, bookingId, onCancelled]);

  // Handle booking expired
  useEffect(() => {
    const handleExpired = (data: { bookingId: string; reason: string }) => {
      if (data.bookingId === bookingId) {
        console.log('[BookingStatus] Booking expired:', data);
        setStatus('EXPIRED');
        setError(data.reason);
        onExpired?.(data.reason);
      }
    };

    const unsubscribe = on('booking:expired', handleExpired);
    return unsubscribe;
  }, [on, bookingId, onExpired]);

  // Handle socket errors
  useEffect(() => {
    const handleError = (data: { message: string }) => {
      console.error('[BookingStatus] Socket error:', data);
      setError(data.message);
    };

    const unsubscribe = on('error', handleError);
    return unsubscribe;
  }, [on]);

  return {
    status,
    isConnected,
    connectionError,
    acceptedData,
    paymentData,
    error,
  };
}
