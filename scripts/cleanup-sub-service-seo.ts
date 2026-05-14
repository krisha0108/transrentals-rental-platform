/**
 * Remove hardcoded SEO content sections from sub-service pages so the
 * admin-managed ServiceCitySections is the only source of SEO text.
 *
 * Targets (in order of risk):
 *   1. Self-closing <FAQSection ... />                             (lowest risk)
 *   2. Conditional wrapper around FAQSection
 *      e.g. `{cityFAQs.length === 0 && <FAQSection .../>}`
 *      e.g. `{cityFAQs.length === 0 && (\n  <FAQSection .../>\n)}`
 *   3. Self-closing <PopularRoutes ... />
 *   4. Inline JSX `<section>` blocks whose H2 is "Frequently Asked Questions"
 *
 * Skips the 8 main service pages (already cleaned in Phase 6).
 *
 * Run:
 *   npx tsx scripts/cleanup-sub-service-seo.ts          # dry-run
 *   npx tsx scripts/cleanup-sub-service-seo.ts --apply  # actually edit
 *   npx tsx scripts/cleanup-sub-service-seo.ts --apply --only=innova-on-rent
 */

import fs from 'fs';
import path from 'path';

const SERVICES_DIR = path.join(process.cwd(), 'src', 'app', '(services)');
const MAIN_SERVICES = new Set([
  'car-rental', 'self-drive-car-rentals', 'bike-on-rent', 'bus-rental',
  'transporter', 'packers-and-movers', 'equipment-rental', 'luxury-car-rental',
]);

type Args = { apply: boolean; only?: string };
function parseArgs(): Args {
  const a: Args = { apply: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') a.apply = true;
    else if (arg.startsWith('--only=')) a.only = arg.split('=')[1];
  }
  return a;
}

function findSubServicePages(): { slug: string; path: string }[] {
  const out: { slug: string; path: string }[] = [];
  for (const d of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('(') || MAIN_SERVICES.has(d.name)) continue;
    const p = path.join(SERVICES_DIR, d.name, '[location]', 'page.tsx');
    if (fs.existsSync(p)) out.push({ slug: d.name, path: p });
  }
  return out;
}

type Removal = { description: string; count: number };

function applyAllRemovals(src: string): { content: string; removals: Removal[] } {
  let content = src;
  const removals: Removal[] = [];

  // ── 1. Conditional FAQSection variants
  // `{cityFAQs.length === 0 && (\n  <FAQSection .../>\n)}`
  // (multi-line parenthesised block)
  const condParenRe = /\{[a-zA-Z_$][\w$]*\.length === 0 && \(\s*<FAQSection[^>]*\/>\s*\)\}/g;
  let m = content.match(condParenRe);
  if (m) {
    content = content.replace(condParenRe, '');
    removals.push({ description: 'conditional FAQSection (paren block)', count: m.length });
  }

  // `{cityFAQs.length === 0 && <FAQSection .../>}`
  const condInlineRe = /\{[a-zA-Z_$][\w$]*\.length === 0 && <FAQSection[^>]*\/>\}/g;
  m = content.match(condInlineRe);
  if (m) {
    content = content.replace(condInlineRe, '');
    removals.push({ description: 'conditional FAQSection (inline)', count: m.length });
  }

  // Bare `<FAQSection ... />` (self-closing, possibly multi-line)
  const faqSelfRe = /\n\s*<FAQSection[^>]*\/>/g;
  m = content.match(faqSelfRe);
  if (m) {
    content = content.replace(faqSelfRe, '');
    removals.push({ description: 'self-closing FAQSection', count: m.length });
  }

  // ── 2. Self-closing <PopularRoutes ... />  (may span multiple lines)
  const popRoutesRe = /\n\s*<PopularRoutes[\s\S]*?\/>/g;
  m = content.match(popRoutesRe);
  if (m) {
    // Cautious: only replace if the match doesn't accidentally cross a closing `>`
    // Already enforced by `?` non-greedy
    content = content.replace(popRoutesRe, '');
    removals.push({ description: 'self-closing PopularRoutes', count: m.length });
  }

  // ── 3. Conditional FAQ section block — paired with .length > 0
  // `{cityFAQs.length > 0 && (\n  <section className="...">\n    ...Frequently Asked Questions...\n  </section>\n)}`
  // This is a more complex pattern; only handle the common shape:
  //   {<varname>.length > 0 && (\n<section ...>[content with "Frequently Asked Questions"]</section>\n)}
  const condFaqBlockRe = /\{[a-zA-Z_$][\w$]*\.length > 0 && \(\s*<section[\s\S]*?Frequently Asked Questions[\s\S]*?<\/section>\s*\)\}/g;
  m = content.match(condFaqBlockRe);
  if (m) {
    content = content.replace(condFaqBlockRe, '');
    removals.push({ description: 'conditional FAQ section block', count: m.length });
  }

  // ── 4. Bare inline `<section>` containing "Frequently Asked Questions"
  // Only the simplest case: <section className=...> ... Frequently Asked Questions ... </section>
  // We guard against eating too much: section opening tag must be on its own indented line,
  // and we stop at the first </section> after a "Frequently Asked Questions" mention.
  const bareFaqSectionRe = /\n\s*\{?\s*\/\*\s*FAQ.*?\*\/\s*\}?\s*\n\s*<section[\s\S]*?Frequently Asked Questions[\s\S]*?<\/section>/g;
  m = content.match(bareFaqSectionRe);
  if (m) {
    content = content.replace(bareFaqSectionRe, '');
    removals.push({ description: 'inline FAQ <section> block', count: m.length });
  } else {
    // Try without the comment marker
    const plainFaqSectionRe = /\n\s*<section[^>]*>\s*<div[^>]*>\s*<h2[^>]*>\s*Frequently Asked Questions[\s\S]*?<\/section>/g;
    m = content.match(plainFaqSectionRe);
    if (m) {
      content = content.replace(plainFaqSectionRe, '');
      removals.push({ description: 'inline FAQ <section> block (no comment)', count: m.length });
    }
  }

  return { content, removals };
}

function main() {
  const args = parseArgs();
  const pages = findSubServicePages();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🧹 Cleanup hardcoded SEO from sub-service pages (${args.apply ? 'APPLY' : 'DRY RUN'})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let modified = 0;
  let skipped = 0;
  let stillNeedsManual = 0;
  const manualList: string[] = [];

  for (const { slug, path: filePath } of pages) {
    if (args.only && args.only !== slug) continue;
    const src = fs.readFileSync(filePath, 'utf-8');
    const { content, removals } = applyAllRemovals(src);

    if (removals.length === 0) {
      skipped += 1;
      continue;
    }

    if (args.apply) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ ${slug}`);
    } else {
      console.log(`+ ${slug}`);
    }
    for (const r of removals) console.log(`    − ${r.description}: ${r.count}`);

    // Detect residual hardcoded patterns
    const residual: string[] = [];
    if (/<FAQSection/.test(content)) residual.push('FAQSection');
    if (/<PopularRoutes/.test(content)) residual.push('PopularRoutes');
    if (/Frequently Asked Questions/.test(content)) residual.push('inline-FAQ-heading');
    if (residual.length > 0) {
      stillNeedsManual += 1;
      manualList.push(`${slug} (${residual.join(', ')})`);
      console.log(`    ⚠ residual: ${residual.join(', ')}`);
    }

    modified += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.apply ? 'Modified' : 'Would modify'}: ${modified}`);
  console.log(`Skipped (already clean):  ${skipped}`);
  if (stillNeedsManual > 0) {
    console.log(`Still need manual review: ${stillNeedsManual}`);
    for (const m of manualList) console.log(`  • ${m}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
