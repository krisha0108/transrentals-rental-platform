import { getSocketServer } from './server';
import {
  BookingNotification,
  BookingAcceptedData,
  PaymentReceivedData,
  SOCKET_ROOMS,
} from './types';

/**
 * Emit new booking notification to all vendors with the vehicle model in the location
 */
export function emitNewBooking(
  vendorIds: string[],
  booking: BookingNotification
): boolean {
  const io = getSocketServer();
  if (!io) {
    console.error('[Socket.io] Server not initialized');
    return false;
  }

  // Emit to each vendor's room
  vendorIds.forEach((vendorId) => {
    const room = SOCKET_ROOMS.vendor(vendorId);
    io.to(room).emit('booking:new', booking);
  });

  console.log(`[Socket.io] Emitted booking:new to ${vendorIds.length} vendors`);
  return true;
}

/**
 * Emit booking accepted notification
 * - To customer (via booking room)
 * - To other vendors (booking expired)
 */
export function emitBookingAccepted(
  bookingId: string,
  acceptedVendorId: string,
  allVendorIds: string[],
  acceptedData: BookingAcceptedData
): boolean {
  const io = getSocketServer();
  if (!io) {
    console.error('[Socket.io] Server not initialized');
    return false;
  }

  // Emit to booking room (customer is listening here)
  const bookingRoom = SOCKET_ROOMS.booking(bookingId);
  io.to(bookingRoom).emit('booking:accepted', acceptedData);

  // Emit expired to other vendors (not the one who accepted)
  allVendorIds
    .filter((id) => id !== acceptedVendorId)
    .forEach((vendorId) => {
      const vendorRoom = SOCKET_ROOMS.vendor(vendorId);
      io.to(vendorRoom).emit('booking:expired', {
        bookingId,
        reason: 'Another vendor accepted this booking',
      });
    });

  console.log(`[Socket.io] Emitted booking:accepted for ${bookingId}`);
  return true;
}

/**
 * Emit booking cancelled notification
 */
export function emitBookingCancelled(
  bookingId: string,
  vendorIds: string[],
  reason: string
): boolean {
  const io = getSocketServer();
  if (!io) {
    console.error('[Socket.io] Server not initialized');
    return false;
  }

  // Emit to booking room
  const bookingRoom = SOCKET_ROOMS.booking(bookingId);
  io.to(bookingRoom).emit('booking:cancelled', { bookingId, reason });

  // Emit to all notified vendors
  vendorIds.forEach((vendorId) => {
    const vendorRoom = SOCKET_ROOMS.vendor(vendorId);
    io.to(vendorRoom).emit('booking:cancelled', { bookingId, reason });
  });

  console.log(`[Socket.io] Emitted booking:cancelled for ${bookingId}`);
  return true;
}

/**
 * Emit payment received notification to vendor
 */
export function emitPaymentReceived(
  vendorId: string,
  bookingId: string,
  paymentData: PaymentReceivedData
): boolean {
  const io = getSocketServer();
  if (!io) {
    console.error('[Socket.io] Server not initialized');
    return false;
  }

  // Emit to vendor
  const vendorRoom = SOCKET_ROOMS.vendor(vendorId);
  io.to(vendorRoom).emit('payment:received', paymentData);

  // Also emit to booking room
  const bookingRoom = SOCKET_ROOMS.booking(bookingId);
  io.to(bookingRoom).emit('payment:received', paymentData);

  console.log(`[Socket.io] Emitted payment:received to vendor ${vendorId}`);
  return true;
}

/**
 * Emit booking expired to all vendors
 */
export function emitBookingExpired(
  bookingId: string,
  vendorIds: string[],
  reason: string = 'Booking expired'
): boolean {
  const io = getSocketServer();
  if (!io) {
    console.error('[Socket.io] Server not initialized');
    return false;
  }

  vendorIds.forEach((vendorId) => {
    const vendorRoom = SOCKET_ROOMS.vendor(vendorId);
    io.to(vendorRoom).emit('booking:expired', { bookingId, reason });
  });

  console.log(`[Socket.io] Emitted booking:expired to ${vendorIds.length} vendors`);
  return true;
}
