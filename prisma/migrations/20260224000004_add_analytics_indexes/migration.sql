-- Add indexes to analytics tables for query performance
-- page_views, click_events, web_vitals

-- page_views indexes
CREATE INDEX `page_views_createdAt_idx` ON `page_views`(`createdAt`);
CREATE INDEX `page_views_sessionId_idx` ON `page_views`(`sessionId`);
CREATE INDEX `page_views_path_idx` ON `page_views`(`path`);

-- click_events indexes
CREATE INDEX `click_events_createdAt_idx` ON `click_events`(`createdAt`);
CREATE INDEX `click_events_sessionId_idx` ON `click_events`(`sessionId`);
CREATE INDEX `click_events_pagePath_idx` ON `click_events`(`pagePath`);

-- web_vitals indexes
CREATE INDEX `web_vitals_createdAt_idx` ON `web_vitals`(`createdAt`);
CREATE INDEX `web_vitals_sessionId_idx` ON `web_vitals`(`sessionId`);
CREATE INDEX `web_vitals_pagePath_idx` ON `web_vitals`(`pagePath`);
