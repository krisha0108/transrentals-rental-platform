-- Add NEW_TRAVEL_AGENT_REGISTRATION to manager_notification_type so managers
-- get a bell notification when a new travel agent registers/onboards —
-- mirrors the existing vendor location/service request notifications.

ALTER TABLE `manager_notifications`
  MODIFY COLUMN `type` ENUM('NEW_LOCATION_REQUEST', 'NEW_SERVICE_REQUEST', 'NEW_CONTACT_INQUIRY', 'NEW_TRAVEL_AGENT_REGISTRATION') NOT NULL;
