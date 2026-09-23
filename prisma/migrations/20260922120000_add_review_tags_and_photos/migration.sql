-- Quick tags the reviewer picked ("Clean Vehicle", "On-Time Delivery", …) and
-- the photos they attached, both as small JSON arrays. Nullable and additive:
-- reviews written before this keep working and simply carry neither.
ALTER TABLE `customer_reviews`
  ADD COLUMN `tags`   TEXT NULL,
  ADD COLUMN `photos` TEXT NULL;
