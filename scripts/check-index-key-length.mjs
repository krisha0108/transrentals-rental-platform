// Fail when schema.prisma asks for an index MySQL cannot build.
//
// This is the check that would have prevented the outage it was written after.
//
// `site_audit_pages.url` is VARCHAR(1000) in utf8mb4 and carried `@unique`
// with no length. That is a 4000-byte key; InnoDB stops at 3072. Production
// (MySQL 8) refused it with error 1071 half way through a migration, and
// because MySQL does not roll DDL back, the site sat in a crash loop with the
// unique constraint already dropped.
//
// It was not caught first because development runs MariaDB 10.4, which
// accepts that exact statement without an error or even a warning and quietly
// builds a whole-column index. Testing against the dev database proved
// nothing. So this check reads the schema instead of asking a database, and
// gives the same answer everywhere.
//
//   node scripts/check-index-key-length.mjs
import { readFileSync } from 'node:fs';

// InnoDB, DYNAMIC or COMPRESSED row format, 16K page.
const MAX_KEY_BYTES = 3072;
// utf8mb4 — the charset every table in this schema uses.
const BYTES_PER_CHAR = 4;
// What `String` becomes on MySQL when no native type is given.
const DEFAULT_VARCHAR = 191;

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');

/** Characters this field occupies, or null when it is not a keyable string. */
function fieldLength(line) {
  if (/@db\.VarChar\((\d+)\)/.test(line)) return Number(line.match(/@db\.VarChar\((\d+)\)/)[1]);
  if (/@db\.Char\((\d+)\)/.test(line)) return Number(line.match(/@db\.Char\((\d+)\)/)[1]);
  // TEXT and friends have no length at all and always need a prefix.
  if (/@db\.(Text|MediumText|LongText|TinyText)\b/.test(line)) return Infinity;
  if (/^\s*\w+\s+String(\?|\[\])?\s/.test(line) || /^\s*\w+\s+String(\?|\[\])?$/.test(line.trimEnd())) {
    return DEFAULT_VARCHAR;
  }
  return null;
}

const problems = [];
let model = null;
let fields = new Map();

for (const raw of schema.split('\n')) {
  const line = raw.replace(/\/\/.*$/, '');

  const open = line.match(/^model\s+(\w+)\s*\{/);
  if (open) { model = open[1]; fields = new Map(); continue; }
  if (!model) continue;
  if (/^\}/.test(line)) { model = null; continue; }

  // ── Model-level indexes: @@unique([...]) / @@index([...]) ────────────────
  const block = line.match(/@@(unique|index|id)\(\s*\[([^\]]+)\]/);
  if (block) {
    const [, kind, inner] = block;
    // A `length:` anywhere in the list means the author has already bounded it.
    if (/length\s*:/.test(inner)) continue;
    const names = inner.split(',').map((s) => s.trim().replace(/\(.*$/, '')).filter(Boolean);
    const bytes = names.reduce((sum, n) => sum + (fields.get(n) ?? 0) * BYTES_PER_CHAR, 0);
    if (bytes > MAX_KEY_BYTES) {
      problems.push({ model, target: `@@${kind}([${names.join(', ')}])`, bytes, names });
    }
    continue;
  }

  // ── Field definitions, and field-level @unique / @id ─────────────────────
  const name = line.match(/^\s{2,}(\w+)\s+\S/);
  if (!name) continue;
  const len = fieldLength(line);
  if (len !== null) fields.set(name[1], len);

  if (/@(unique|id)\b/.test(line) && !/@@/.test(line)) {
    if (/@(unique|id)\s*\(\s*[^)]*length\s*:/.test(line)) continue;
    if (len === null) continue;
    const bytes = len * BYTES_PER_CHAR;
    if (bytes > MAX_KEY_BYTES) {
      problems.push({ model, target: `${name[1]} @unique`, bytes, names: [name[1]] });
    }
  }
}

if (problems.length === 0) {
  console.log(`\n  OK — every index key fits inside MySQL's ${MAX_KEY_BYTES}-byte limit.\n`);
  process.exit(0);
}

console.error(`\n  ${problems.length} index(es) in schema.prisma exceed MySQL's ${MAX_KEY_BYTES}-byte key limit.\n`);
for (const p of problems) {
  const size = p.bytes === Infinity ? 'unbounded (a TEXT column)' : `${p.bytes} bytes`;
  console.error(`    ${p.model}.${p.target}`);
  console.error(`      ${size} — MySQL will reject this with error 1071.\n`);
}
console.error(`  MariaDB accepts these silently, so a green run against the dev
  database means nothing here. MySQL 8 refuses them mid-migration, and MySQL
  does not roll DDL back.

  Give the index a prefix length instead:

      url String @unique(length: 768) @db.VarChar(1000)
      @@index([slug(length: 191), city])

  768 characters x 4 bytes = 3072, the most utf8mb4 will take in one key.
`);
process.exit(1);
