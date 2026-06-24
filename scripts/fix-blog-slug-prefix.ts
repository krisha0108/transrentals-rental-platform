/**
 * Fix blog_posts where slug was saved with a stray "blog" prefix.
 *
 * Affected pattern: slug starts with "blog" immediately followed by a
 * lowercase letter (e.g. "blogfestival-travel-...", "blogtop-monsoon-...").
 * This differs from intentional slugs that start with "blog-..." (hyphen).
 *
 * Run:  npx ts-node -P tsconfig.json scripts/fix-blog-slug-prefix.ts
 * Add --dry-run to preview without writing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(DRY_RUN ? '[DRY RUN] No changes will be written.\n' : '[LIVE] Changes will be written.\n');

  // Find all slugs starting with "blog" immediately followed by a word char (not a hyphen).
  // Prisma doesn't support REGEXP in MySQL directly via where(), so we fetch candidates
  // with LIKE and filter in JS.
  const candidates = await prisma.blog_posts.findMany({
    where: { slug: { startsWith: 'blog' } },
    select: { id: true, slug: true, title: true, status: true },
  });

  // Keep only the ones that match ^blog[a-z0-9] (no hyphen after "blog")
  const affected = candidates.filter((p) => /^blog[a-z0-9]/.test(p.slug));

  if (affected.length === 0) {
    console.log('No affected slugs found. Nothing to do.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${affected.length} affected post(s):\n`);
  console.log('ID'.padEnd(30), 'OLD SLUG'.padEnd(55), 'NEW SLUG');
  console.log('-'.repeat(120));

  const updates: Array<{ id: string; oldSlug: string; newSlug: string }> = [];
  const conflicts: string[] = [];

  for (const post of affected) {
    const newSlug = post.slug.replace(/^blog/, '');

    // Check for slug collision
    const collision = await prisma.blog_posts.findUnique({ where: { slug: newSlug } });
    if (collision && collision.id !== post.id) {
      conflicts.push(`  CONFLICT: "${post.slug}" → "${newSlug}" already exists (id: ${collision.id})`);
      continue;
    }

    console.log(post.id.padEnd(30), post.slug.padEnd(55), newSlug);
    updates.push({ id: post.id, oldSlug: post.slug, newSlug });
  }

  if (conflicts.length > 0) {
    console.log('\nSkipped due to slug collisions:');
    conflicts.forEach((c) => console.log(c));
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would update ${updates.length} post(s). Run without --dry-run to apply.`);
    await prisma.$disconnect();
    return;
  }

  if (updates.length === 0) {
    console.log('\nNo updates to apply (all were conflicts).');
    await prisma.$disconnect();
    return;
  }

  console.log(`\nApplying ${updates.length} update(s)...`);
  for (const { id, oldSlug, newSlug } of updates) {
    await prisma.blog_posts.update({ where: { id }, data: { slug: newSlug } });
    console.log(`  ✓  ${oldSlug}  →  ${newSlug}`);
  }

  console.log('\nDone. Also update the seo_meta.canonicalUrl for these posts if they were set.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
