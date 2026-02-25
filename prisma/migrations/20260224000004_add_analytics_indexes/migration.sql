-- Add indexes to analytics tables for query performance
-- page_views, click_events, web_vitals

-- page_views indexes
CREATE INDEX IF NOT EXISTS `page_views_createdAt_idx` ON `page_views`(`createdAt`);
CREATE INDEX IF NOT EXISTS `page_views_sessionId_idx` ON `page_views`(`sessionId`);
CREATE INDEX IF NOT EXISTS `page_views_path_idx` ON `page_views`(`path`);

-- click_events indexes
CREATE INDEX IF NOT EXISTS `click_events_createdAt_idx` ON `click_events`(`createdAt`);
CREATE INDEX IF NOT EXISTS `click_events_sessionId_idx` ON `click_events`(`sessionId`);
CREATE INDEX IF NOT EXISTS `click_events_pagePath_idx` ON `click_events`(`pagePath`);

-- web_vitals indexes
CREATE INDEX IF NOT EXISTS `web_vitals_createdAt_idx` ON `web_vitals`(`createdAt`);
CREATE INDEX IF NOT EXISTS `web_vitals_sessionId_idx` ON `web_vitals`(`sessionId`);
CREATE INDEX IF NOT EXISTS `web_vitals_pagePath_idx` ON `web_vitals`(`pagePath`);
