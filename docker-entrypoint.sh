#!/bin/sh
# Runs before the app starts on every container boot. `prisma migrate deploy`
# only applies migrations that haven't run yet (and takes its own advisory
# lock, so multiple replicas booting at once still apply each migration
# exactly once) — safe to run unconditionally on every deploy.
#
# `set -e` is the point: if migrate deploy fails, this script exits non-zero
# and the container never reaches `exec node server.js` — a broken migration
# fails the deploy (and trips Coolify's rollback_on_failure) instead of
# quietly leaving the DB schema out of sync with the running code, which is
# exactly what happened on 2026-09-10 (add_social_media_tracking and
# add_system_event_logs sat unapplied until someone ran this by hand).
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec node server.js
