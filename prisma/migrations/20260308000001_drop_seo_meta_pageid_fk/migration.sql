-- Drop the foreign key constraint on seo_meta.pageId
-- pageId is used as a generic string identifier (e.g. "car-rental:mumbai"),
-- not a reference to the pages table.

DROP PROCEDURE IF EXISTS drop_seo_meta_pageid_fk;
CREATE PROCEDURE drop_seo_meta_pageid_fk()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'seo_meta'
          AND CONSTRAINT_NAME = 'seo_meta_pageId_fkey'
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE `seo_meta` DROP FOREIGN KEY `seo_meta_pageId_fkey`;
    END IF;
END;
CALL drop_seo_meta_pageid_fk();
DROP PROCEDURE IF EXISTS drop_seo_meta_pageid_fk;
