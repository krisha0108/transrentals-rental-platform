-- Expand manager_action_logs.actionType with more inquiry follow-up categories
-- (mirrors the inquiry_tag_assignments tag set, but as loggable, timestamped
-- actions rather than current-state tags). Safe to re-run: MODIFY COLUMN to
-- the same widened list is a no-op if already applied.
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
    'CONNECTED',
    'RESPONDED',
    'NO_RESPONSE',
    'WRONG_NUMBER',
    'PRICE_TOO_HIGH',
    'HOT_LEAD',
    'COLD_LEAD',
    'DUPLICATE_INQUIRY'
  ) NOT NULL;
