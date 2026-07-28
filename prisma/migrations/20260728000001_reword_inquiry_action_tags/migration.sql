-- Replace the vendor-sales-CRM-flavored action/tag vocabulary (Connected,
-- Responded, No Response, Hot Lead, Cold Lead) with wording that actually
-- fits inquiry fulfillment (vendor availability + customer responsiveness).
-- Old values are KEPT in both enums (not dropped) so any historical rows
-- stay valid — they're just no longer offered in the UI going forward.
-- Widening an enum is always safe to re-run.

ALTER TABLE `manager_action_logs`
  MODIFY COLUMN `actionType` ENUM(
    'CALLED',
    'NOTE_ADDED',
    'FOLLOW_UP',
    'CONVERTED',
    'NOT_INTERESTED',
    'STATUS_CHANGED',
    'VENDOR_ASSIGNED',
    'CANCELLED',
    'WRONG_NUMBER',
    'PRICE_TOO_HIGH',
    'DUPLICATE_INQUIRY',
    'CUSTOMER_CONNECTED',
    'NO_VENDOR_AVAILABLE',
    'VENDOR_NOT_RESPONDING',
    'AWAITING_VENDOR_QUOTE',
    'CUSTOMER_NOT_RESPONDING',
    'CONNECTED',
    'RESPONDED',
    'NO_RESPONSE',
    'HOT_LEAD',
    'COLD_LEAD'
  ) NOT NULL;

ALTER TABLE `inquiry_tag_assignments`
  MODIFY COLUMN `tag` ENUM(
    'FOLLOW_UP_REQUIRED',
    'NOT_INTERESTED',
    'WRONG_NUMBER',
    'PRICE_TOO_HIGH',
    'CONVERTED',
    'DUPLICATE_INQUIRY',
    'CUSTOMER_CONNECTED',
    'NO_VENDOR_AVAILABLE',
    'VENDOR_NOT_RESPONDING',
    'AWAITING_VENDOR_QUOTE',
    'CUSTOMER_NOT_RESPONDING',
    'CONNECTED',
    'RESPONDED',
    'NO_RESPONSE',
    'HOT_LEAD',
    'COLD_LEAD'
  ) NOT NULL;
