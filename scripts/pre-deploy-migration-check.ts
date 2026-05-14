/**
 * Pre-deployment migration sanity check.
 *
 * Run this against the TARGET database (staging or production) BEFORE
 * `prisma migrate deploy`. It surfaces three classes of issues that have
 * bitten us locally so you don't discover them mid-deploy:
 *
 *   1. Local migration files diverged from the DB's _prisma_migrations
 *      history (e.g. a renamed migration whose checksum no longer matches).
 *   2. Pending migrations that will be applied on next deploy.
 *   3. Failed migrations that need `prisma migrate resolve` first.
 *
 * Exit code 0 = safe to deploy. 1 = manual intervention needed.
 *
 * Run:
 *   DATABASE_URL=mysql://... npx tsx scripts/pre-deploy-migration-check.ts
 */

import 'dotenv/config';
import { execSync } from 'child_process';

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err: any) {
    // `prisma migrate status` exits non-zero when migrations are pending —
    // that's normal. Return the stdout/stderr so we can parse it.
    return (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
  }
}

function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 PRE-DEPLOY MIGRATION CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in environment.');
    process.exit(1);
  }
  console.log(`Target DB: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

  const output = run('npx prisma migrate status');
  console.log(output);

  const upToDate = output.includes('Database schema is up to date');
  const pendingMigrations =
    output.includes('have not yet been applied') ||
    output.includes('not yet been applied');
  const failedMigration = output.includes('Following migration have failed');
  const divergence = output.includes('not found locally in prisma/migrations');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ASSESSMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failedMigration) {
    console.log('🔴 FAILED MIGRATION DETECTED');
    console.log('   Action: inspect the named migration. If the schema change');
    console.log('   it represents is already present, run:');
    console.log('     npx prisma migrate resolve --applied <migration-name>');
    console.log('   Then re-run this check.');
    process.exit(1);
  }

  if (divergence) {
    console.log('⚠️  HISTORY DIVERGENCE');
    console.log('   Some migrations recorded in this DB are NOT in your local');
    console.log('   migrations directory. This is normally harmless if the');
    console.log('   schema state matches, but indicates a renamed or removed');
    console.log('   migration upstream. Defensive migrations in this repo');
    console.log('   (using IF NOT EXISTS / INFORMATION_SCHEMA checks) handle');
    console.log('   the common cases. Inspect the listed migrations and check');
    console.log('   with the team if anything looks unfamiliar.\n');
  }

  if (pendingMigrations) {
    console.log('🟡 PENDING MIGRATIONS — `prisma migrate deploy` will apply them');
    console.log('   This is the normal state for any deploy that ships new');
    console.log('   schema changes. Each migration in this repo is designed');
    console.log('   to be additive and idempotent.\n');
  }

  if (upToDate && !divergence && !pendingMigrations) {
    console.log('✅ NO PENDING WORK — DB is fully in sync. Nothing to deploy.');
    process.exit(0);
  }

  if (upToDate || pendingMigrations) {
    console.log('✅ SAFE TO DEPLOY');
    console.log('   Next step: npx prisma migrate deploy');
    process.exit(0);
  }

  console.log('❓ UNRECOGNISED STATE — review the output above and consult');
  console.log('   prisma migrate status docs before proceeding.');
  process.exit(1);
}

main();
