-- Migration Script: HOC CRM (bugsolving) -> TransRentals CMS (transrentals_cms)
-- This script migrates locations and services data

-- =====================================================
-- STEP 1: Migrate Locations (with unique slugs using ID)
-- =====================================================

INSERT INTO transrentals_cms.locations (id, name, slug, type, parentId, isActive, image, latitude, longitude, displayOrder, timezone, createdAt, updatedAt)
SELECT
    CONCAT('hoc_loc_', id) as id,
    name,
    CONCAT(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), ',', ''), '.', '')), '-', id) as slug,
    CASE
        WHEN type = 'country' THEN 'COUNTRY'
        WHEN type = 'state' THEN 'STATE'
        WHEN type = 'city' THEN 'CITY'
        WHEN type = 'street' THEN 'AREA'
        ELSE 'CITY'
    END as type,
    CASE WHEN parent_id IS NOT NULL THEN CONCAT('hoc_loc_', parent_id) ELSE NULL END as parentId,
    status as isActive,
    image,
    latitude,
    longitude,
    0 as displayOrder,
    'Asia/Kolkata' as timezone,
    created_at as createdAt,
    updated_at as updatedAt
FROM bugsolving.locations
ORDER BY parent_id ASC;

-- =====================================================
-- STEP 2: Migrate Services (with unique slugs using ID)
-- =====================================================

INSERT INTO transrentals_cms.services (id, name, slug, parentId, isActive, image, flowType, displayOrder, createdAt, updatedAt)
SELECT
    CONCAT('hoc_svc_', id) as id,
    name,
    CONCAT(LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), ',', '')), '-', id) as slug,
    CASE WHEN parent_id IS NOT NULL THEN CONCAT('hoc_svc_', parent_id) ELSE NULL END as parentId,
    status as isActive,
    image,
    CASE
        WHEN LOWER(name) LIKE '%bike%' THEN 'FLEET_BASED'
        WHEN LOWER(name) LIKE '%selfdrive%' THEN 'FLEET_BASED'
        WHEN LOWER(name) LIKE '%self-drive%' THEN 'FLEET_BASED'
        WHEN LOWER(name) LIKE '%self drive%' THEN 'FLEET_BASED'
        ELSE 'QUOTE_BASED'
    END as flowType,
    0 as displayOrder,
    created_at as createdAt,
    updated_at as updatedAt
FROM bugsolving.services
ORDER BY parent_id ASC;
