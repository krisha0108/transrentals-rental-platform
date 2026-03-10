-- Add PAYMENT_SUBMITTED to chauffeur_bookings status enum (idempotent)
DROP PROCEDURE IF EXISTS add_payment_submitted_status;
CREATE PROCEDURE add_payment_submitted_status()
BEGIN
    DECLARE col_type TEXT;
    SELECT COLUMN_TYPE INTO col_type
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'chauffeur_bookings'
      AND COLUMN_NAME = 'status';

    IF col_type NOT LIKE '%PAYMENT_SUBMITTED%' THEN
        ALTER TABLE `chauffeur_bookings` MODIFY COLUMN `status`
            ENUM('PENDING_PAYMENT','PAYMENT_SUBMITTED','PENDING_VENDOR','BROADCASTED','ACCEPTED','DRIVER_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED','REFUNDED')
            NOT NULL DEFAULT 'PENDING_PAYMENT';
    END IF;
END;
CALL add_payment_submitted_status();
DROP PROCEDURE IF EXISTS add_payment_submitted_status;
