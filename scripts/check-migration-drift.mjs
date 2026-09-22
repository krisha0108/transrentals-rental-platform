// Fail when prisma/migrations no longer reproduces prisma/schema.prisma.
//
// This is the check that would have caught the mess it was written after.
// For months people changed schema.prisma and pushed the change straight at a
// database — `prisma db push`, or SQL by hand — without committing a migration
// file. Nothing complained, because nobody replays the folder from scratch in
// day-to-day work. By the time anyone looked, replaying the whole folder into
// an empty database produced a schema 42 statements away from schema.prisma,
// including foreign-key and enum changes, and there was no safe starting point
// left to write the next migration from.
//
// So: replay the folder into a scratch database, diff the result against
// schema.prisma, and fail if anything comes back.
//
//   node scripts/check-migration-drift.mjs
//
// Run it in CI on pull requests, and before cutting a release.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Statements the diff reports forever because the database server cannot do
// what the schema asks, not because a migration is missing. Keep this list
// short, and say why for each one.
const KNOWN_UNFIXABLE = [
  // MariaDB 10.4 stores '?' for a 4-byte emoji used as a column DEFAULT, even
  // on a utf8mb4 column over a utf8mb4 connection. Correct on MySQL 8.
  'ALTER TABLE `wander_friend_groups` MODIFY `emoji` VARCHAR(191) NULL DEFAULT',
];

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const line = env.match(/^DATABASE_URL=(.*)$/m);
  if (!line) throw new Error('DATABASE_URL not found in the environment or .env');
  return line[1].trim().replace(/^["']|["']$/g, '');
}

const shell = process.platform === 'win32';

function prisma(args, input) {
  return execFileSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    input,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    shell,
  });
}

const url = databaseUrl();
// Same server, a scratch database beside the real one. It is created and
// dropped here; the database in DATABASE_URL is only ever read from.
const shadowUrl = url.replace(/\/([^/?]+)(\?|$)/, '/$1_drift_check$2');
const scratchName = shadowUrl.split('/').pop().split('?')[0];
const q = '`' + scratchName + '`';

// `migrate diff` does not create its shadow database the way `migrate dev`
// does, so make it first and take it away afterwards.
function runSql(sql) {
  prisma(['db', 'execute', '--url', url, '--stdin'], sql);
}

let out;
try {
  runSql('DROP DATABASE IF EXISTS ' + q + ';');
  runSql('CREATE DATABASE ' + q + ';');
  out = prisma([
    'migrate', 'diff',
    '--from-migrations', 'prisma/migrations',
    '--to-schema-datamodel', 'prisma/schema.prisma',
    '--shadow-database-url', shadowUrl,
    '--script',
  ]);
} catch (err) {
  console.error('\n  Could not run the drift check.\n');
  console.error(String(err.stderr || err.message).trim());
  console.error('\n  The scratch database must be creatable by the DATABASE_URL user.\n');
  process.exit(1);
} finally {
  try { runSql('DROP DATABASE IF EXISTS ' + q + ';'); } catch {}
}

const statements = out
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /^(ALTER|CREATE|DROP|RENAME)\b/i.test(l))
  .filter((l) => !KNOWN_UNFIXABLE.some((k) => l.startsWith(k)));

if (statements.length === 0) {
  console.log('\n  OK — replaying prisma/migrations reproduces schema.prisma.\n');
  process.exit(0);
}

console.error('\n  DRIFT: prisma/migrations does not reproduce schema.prisma (' + statements.length + ' statement(s)).\n');
for (const s of statements.slice(0, 40)) console.error('    ' + s);
if (statements.length > 40) console.error('    ... and ' + (statements.length - 40) + ' more');
console.error([
  '',
  '  Someone changed schema.prisma without committing a migration for it — or',
  '  applied a change straight to a database with `prisma db push`.',
  '',
  '  Generate the missing migration rather than hand-writing it:',
  '',
  '    npx prisma migrate diff \\',
  '      --from-migrations prisma/migrations \\',
  '      --to-schema-datamodel prisma/schema.prisma \\',
  '      --shadow-database-url "' + shadowUrl + '" \\',
  '      --script > prisma/migrations/<timestamp>_<name>/migration.sql',
  '',
  '  then run this check again. On MariaDB, review the output first: Prisma',
  '  emits `ALTER TABLE ... RENAME INDEX`, which MariaDB only supports from',
  '  10.5.2 — it has to become a CREATE INDEX followed by a DROP INDEX, in',
  '  that order, so a foreign key is never left without an index.',
  '',
].join('\n'));
process.exit(1);
