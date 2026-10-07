-- Adds NEW_PROPERTY_ENQUIRY so a customer enquiry on a travel-agent property
-- listing notifies managers too, not just the owning agent. Also backfills
-- NEW_DRIVER_REGISTRATION, which schema.prisma already declared but the
-- live enum column was missing (an earlier migration's MODIFY list dropped
-- it) — this MODIFY replaces the whole list, so it has to be included or
-- it would be silently removed again.
ALTER TABLE `manager_notifications`
  MODIFY `type` ENUM(
    'REFUND_PENDING',
    'NEW_LOCATION_REQUEST',
    'NEW_SERVICE_REQUEST',
    'NEW_CONTACT_INQUIRY',
    'NEW_TRAVEL_AGENT_REGISTRATION',
    'NEW_VENDOR_AGREEMENT_SIGNED',
    'NEW_DRIVER_REGISTRATION',
    'NEW_PROPERTY_ENQUIRY'
  ) NOT NULL;
