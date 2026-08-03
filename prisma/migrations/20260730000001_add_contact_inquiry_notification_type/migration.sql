-- Add NEW_CONTACT_INQUIRY to manager_notification_type so managers get a
-- bell notification when a new /contact form submission comes in — mirrors
-- the existing vendor location/service request notifications.

ALTER TABLE `manager_notifications`
  MODIFY COLUMN `type` ENUM('NEW_LOCATION_REQUEST', 'NEW_SERVICE_REQUEST', 'NEW_CONTACT_INQUIRY') NOT NULL;
