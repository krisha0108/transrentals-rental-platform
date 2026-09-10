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
# `npx prisma` resolves the local package by looking for a
# node_modules/.bin/prisma symlink — npm creates that symlink itself during
# `npm install`, it is NOT part of the prisma package's own files, so a
# Dockerfile COPY of node_modules/prisma (the package directory) never
# brings it along, and Next.js standalone tracing doesn't add it either.
# Without that symlink npx falls back to fetching prisma from the registry,
# which failed here as `sh: prisma: not found` -> exit 127 -> crash-loop
# under `set -e`. Invoking the CLI's own JS entrypoint directly sidesteps
# npx's resolution entirely — no symlink, no PATH, no registry fallback.
node node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
exec node server.js
