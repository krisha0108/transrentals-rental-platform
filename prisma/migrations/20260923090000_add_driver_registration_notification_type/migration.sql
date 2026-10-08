-- Add NEW_DRIVER_REGISTRATION to manager_notification_type, so a new driver
-- signup can notify staff the same way a new vendor/travel-agent signup does.
-- The table is shared across every admin_users role (managers today, admins
-- as of this migration) despite the "manager" naming.
ALTER TABLE `manager_notifications`
  MODIFY `type` ENUM(
    'NEW_LOCATION_REQUEST',
    'NEW_SERVICE_REQUEST',
    'NEW_CONTACT_INQUIRY',
    'NEW_TRAVEL_AGENT_REGISTRATION',
    'NEW_VENDOR_AGREEMENT_SIGNED',
    'NEW_DRIVER_REGISTRATION'
  ) NOT NULL;
