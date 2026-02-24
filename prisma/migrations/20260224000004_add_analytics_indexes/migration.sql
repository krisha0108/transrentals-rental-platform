-- Add missing sessionId index to web_vitals
-- (createdAt, pagePath indexes already exist on all 3 analytics tables)
-- (sessionId, pagePath indexes already exist on click_events and page_views)

CREATE INDEX IF NOT EXISTS `web_vitals_sessionId_idx` ON `web_vitals`(`sessionId`);
