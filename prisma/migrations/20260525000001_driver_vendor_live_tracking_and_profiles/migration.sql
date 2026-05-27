-- Driver/vendor live trip tracking + public profile-sharing pages.
--
-- Two features land together because they share the same records:
--
--   1. LIVE LOCATION (trip tracking)
--      Drivers push their browser GPS while on an active trip. We keep only
--      the *current* fix on the driver row (a snapshot, not a history trail)
--      so the vendor dashboard and the public booking-track page can render a
--      moving marker by polling. `isSharingLocation` is the explicit consent /
--      on-off switch — location is never shown unless the driver turned it on.
--
--   2. PUBLIC PROFILE (shareable page)
--      `slug` gives each driver/vendor a clean, shareable public URL
--      (/partner/<slug>, /captain/<slug>) mirroring the travel-agent /agent
--      page. Slug is nullable + UNIQUE: MySQL allows many NULLs in a unique
--      index, so un-slugged records simply fall back to matching by id.
--      `isProfilePublic` lets them hide the page; `bio` / `yearsExperience`
--      are the public-facing copy.
--
-- Drivers exist as two kinds in this system and BOTH get the columns:
--   * vendor_staff  — drivers employed under a vendor (assigned to
--                     vendor_direct_bookings via assignedDriverId)
--   * drivers       — independent drivers (chauffeur_bookings.acceptedDriverId)
--
-- All columns are nullable / defaulted, so this is a purely additive,
-- back-compatible migration: existing rows keep working untouched.

-- ── vendor_staff (employed drivers) ──────────────────────────────────────────
ALTER TABLE `vendor_staff`
  ADD COLUMN `slug`              VARCHAR(191) NULL,
  ADD COLUMN `bio`               TEXT         NULL,
  ADD COLUMN `yearsExperience`   INT          NULL,
  ADD COLUMN `isProfilePublic`   BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN `currentLat`        DOUBLE       NULL,
  ADD COLUMN `currentLng`        DOUBLE       NULL,
  ADD COLUMN `currentHeading`    DOUBLE       NULL,
  ADD COLUMN `currentSpeed`      DOUBLE       NULL,
  ADD COLUMN `locationAccuracy`  DOUBLE       NULL,
  ADD COLUMN `locationUpdatedAt` DATETIME(3)  NULL,
  ADD COLUMN `isSharingLocation` BOOLEAN      NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `vendor_staff_slug_key` ON `vendor_staff`(`slug`);

-- ── drivers (independent drivers) ────────────────────────────────────────────
ALTER TABLE `drivers`
  ADD COLUMN `slug`              VARCHAR(191) NULL,
  ADD COLUMN `bio`               TEXT         NULL,
  ADD COLUMN `yearsExperience`   INT          NULL,
  ADD COLUMN `isProfilePublic`   BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN `currentLat`        DOUBLE       NULL,
  ADD COLUMN `currentLng`        DOUBLE       NULL,
  ADD COLUMN `currentHeading`    DOUBLE       NULL,
  ADD COLUMN `currentSpeed`      DOUBLE       NULL,
  ADD COLUMN `locationAccuracy`  DOUBLE       NULL,
  ADD COLUMN `locationUpdatedAt` DATETIME(3)  NULL,
  ADD COLUMN `isSharingLocation` BOOLEAN      NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `drivers_slug_key` ON `drivers`(`slug`);

-- ── vendors (slug already exists; just the public-page visibility flag) ───────
ALTER TABLE `vendors`
  ADD COLUMN `isProfilePublic` BOOLEAN NOT NULL DEFAULT true;
