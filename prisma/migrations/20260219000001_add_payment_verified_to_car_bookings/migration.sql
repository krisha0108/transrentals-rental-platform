-- Add PAYMENT_VERIFIED to car_bookings_status enum
-- Required for self-drive (SD-) payment flow (quote-based, same as bike)
ALTER TABLE `car_bookings`
  MODIFY `status` ENUM(
    'PENDING_PAYMENT',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'PENDING_VENDOR',
    'BROADCASTED',
    'ACCEPTED',
    'READY_FOR_PICKUP',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
    'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING_PAYMENT';
