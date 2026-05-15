/**
 * Wire every service-city page's `generateMetadata` and hero props to read
 * `scContent` (new admin → service_city_content) before `_seoDb`
 * (legacy admin → seo_meta). This is the consolidation step that makes
 * `/admin/seo-content/<svc>/<city>` the single source of truth for:
 *
 *   - <title>           ← scContent.metaTitle || _seoDb.metaTitle
 *   - <meta description>← scContent.metaDescription || _seoDb.metaDescription
 *   - keywords          ← scContent.metaKeywords || _seoDb.metaKeywords
 *   - hero pageHeading  ← scContent.pageHeading  || _seoDb.pageHeading
 *   - hero pageDescription ← scContent.pageDescription || _seoDb.pageDescription
 *
 * Strategy per file:
 *   1. Ensure imports include getServiceCityContent (idempotent).
 *   2. In generateMetadata: if it does `const _seoDb = await resolvePageMeta(...)`
 *      OR `const seoData = await resolvePageMeta(...)`, lift that into a
 *      `Promise.all` that also fetches `getServiceCityContent(...)` and
 *      introduce a local `scContent` variable. Skip if already merged.
 *   3. Rewrite `_seoDb?.X` / `seoData?.X` references inside that function
 *      to `scContent?.X || _seoDb?.X` (only first hit per field, leaves
 *      existing chains intact).
 *   4. In the rendered JSX, swap `pageHeading={_seoDb?.pageHeading ...}`
 *      and `pageHeading={seoData?.pageHeading ...}` to prefer scContent.
 *
 * Pages where generateMetadata cannot be parsed cleanly are reported for
 * manual review.
 *
 * Run:
 *   npx tsx scripts/wire-meta-to-new-admin.ts            # dry-run
 *   npx tsx scripts/wire-meta-to-new-admin.ts --apply
 *   npx tsx scripts/wire-meta-to-new-admin.ts --apply --only=innova-on-rent
 */

import fs from 'fs';
import path from 'path';

const SERVICES_DIR = path.join(process.cwd(), 'src', 'app', '(services)');

type Args = { apply: boolean; only?: string };
function parseArgs(): Args {
  const a: Args = { apply: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') a.apply = true;
    else if (arg.startsWith('--only=')) a.only = arg.split('=')[1];
  }
  return a;
}

function findPages(): { slug: string; path: string }[] {
  const out: { slug: string; path: string }[] = [];
  for (const d of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('(')) continue;
    const p = path.join(SERVICES_DIR, d.name, '[location]', 'page.tsx');
    if (fs.existsSync(p)) out.push({ slug: d.name, path: p });
  }
  return out;
}

function ensureImports(src: string): { content: string; changed: boolean } {
  if (src.includes("from '@/lib/seo/service-city-content'")) {
    return { content: src, changed: false };
  }
  const importLines = [...src.matchAll(/^import .+ from .+;?$/gm)];
  if (importLines.length === 0) return { content: src, changed: false };
  const last = importLines[importLines.length - 1];
  const insertPos = last.index! + last[0].length;
  const addition = `\nimport { getServiceCityContent } from '@/lib/seo/service-city-content';`;
  return { content: src.slice(0, insertPos) + addition + src.slice(insertPos), changed: true };
}

/**
 * Find the body of `generateMetadata` and operate inside it only.
 * Returns the rewritten file or null if generateMetadata couldn't be located.
 */
function rewriteGenerateMetadata(src: string, serviceSlug: string): { content: string; changed: boolean; note?: string } {
  // Match the function signature including destructured params, optional return type, and the opening brace.
  const sigRe = /export async function generateMetadata\s*\([\s\S]*?\)\s*(?::\s*[\w<>,\s|&]+)?\s*\{/;
  const sigMatch = sigRe.exec(src);
  if (!sigMatch) return { content: src, changed: false, note: 'no generateMetadata' };
  const openBraceIdx = sigMatch.index + sigMatch[0].length - 1; // points at the function-body `{`

  let depth = 1;
  let i = openBraceIdx + 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const closeBraceIdx = i - 1;
  if (depth !== 0) return { content: src, changed: false, note: 'unbalanced braces' };

  const before = src.slice(0, openBraceIdx + 1);
  let body = src.slice(openBraceIdx + 1, closeBraceIdx);
  const after = src.slice(closeBraceIdx);

  // Skip if scContent is already wired in this function
  if (body.includes('getServiceCityContent(')) {
    return { content: src, changed: false, note: 'already wired' };
  }

  // Pattern A: `const _seoDb = await resolvePageMeta(<arg>);`
  // Pattern B: `const seoData = await resolvePageMeta(<arg>);`
  // Pattern C: `const [_seoDb, ...] = await Promise.all([... resolvePageMeta(...) ...])`
  const seoDbSingle = /const\s+(_seoDb|seoData)\s*=\s*await\s+resolvePageMeta\(([^)]+)\);/;
  const singleM = seoDbSingle.exec(body);

  let varName: string;

  if (singleM) {
    varName = singleM[1];
    const arg = singleM[2];
    const replacement = `const [${varName}, scContent] = await Promise.all([\n    resolvePageMeta(${arg}),\n    getServiceCityContent('${serviceSlug}', params.location),\n  ]);`;
    body = body.replace(seoDbSingle, replacement);
  } else {
    // Promise.all already present? Then inject scContent into it.
    const paAll = /const\s+\[([^\]]+)\]\s*=\s*await\s+Promise\.all\(\[\s*([\s\S]+?)\s*\]\);/;
    const paM = paAll.exec(body);
    if (!paM) return { content: src, changed: false, note: 'no resolvePageMeta call' };

    const vars = paM[1].split(',').map((v) => v.trim());
    if (vars.includes('scContent')) {
      varName = vars.includes('_seoDb') ? '_seoDb' : vars.includes('seoData') ? 'seoData' : vars[0];
    } else {
      varName = vars.includes('_seoDb') ? '_seoDb' : vars.includes('seoData') ? 'seoData' : vars[0];
      const newVars = paM[1] + ', scContent';
      const calls = paM[2].trim();
      const newCalls = (calls.endsWith(',') ? calls : calls + ',') +
        `\n    getServiceCityContent('${serviceSlug}', params.location),`;
      body = body.replace(paAll, `const [${newVars}] = await Promise.all([\n    ${newCalls}\n  ]);`);
    }
  }

  // Now in the body, replace _seoDb?.metaTitle / metaDescription / metaKeywords / pageHeading / pageDescription
  // with scContent?.X || varName?.X
  const fields = ['metaTitle', 'metaDescription', 'metaKeywords', 'pageHeading', 'pageDescription'];
  for (const field of fields) {
    // Only replace the FIRST occurrence in body (the chain start) per field — leave repeated usages untouched
    // Pattern: `<varName>?.<field>` not preceded by `scContent?.<field> || `
    const fieldRe = new RegExp(`(?<!scContent\\?\\.${field}\\s*\\|\\|\\s*)${varName}\\?\\.${field}\\b`, 'g');
    let replaced = false;
    body = body.replace(fieldRe, (match) => {
      if (replaced) return match; // keep secondary uses
      replaced = true;
      return `scContent?.${field} || ${varName}?.${field}`;
    });
  }

  return { content: before + body + after, changed: true };
}

/**
 * In the rendered JSX outside generateMetadata, swap hero props from seoData/_seoDb to scContent priority.
 * Patterns handled (one shot per file):
 *   pageHeading={seoData?.pageHeading || undefined}
 *   pageHeading={_seoDb?.pageHeading || undefined}
 *   pageDescription={seoData?.pageDescription || undefined}
 *   pageDescription={_seoDb?.pageDescription || undefined}
 *
 * The hero is called from the page body where the existing fetch usually
 * exposes `seoData` (or `_seoDb`). Most pages fetch both `seoData` AND
 * `scContent` in their main body Promise.all (already), so we don't need
 * to lift the fetch — just rewrite the JSX prop.
 */
function rewriteHeroProps(src: string): { content: string; changed: boolean } {
  let changed = false;
  let out = src;

  const patterns: [RegExp, string][] = [
    [/pageHeading=\{seoData\?\.pageHeading\s*\|\|\s*undefined\}/g,
      'pageHeading={scContent?.pageHeading || seoData?.pageHeading || undefined}'],
    [/pageHeading=\{_seoDb\?\.pageHeading\s*\|\|\s*undefined\}/g,
      'pageHeading={scContent?.pageHeading || _seoDb?.pageHeading || undefined}'],
    [/pageDescription=\{seoData\?\.pageDescription\s*\|\|\s*undefined\}/g,
      'pageDescription={scContent?.pageDescription || seoData?.pageDescription || undefined}'],
    [/pageDescription=\{_seoDb\?\.pageDescription\s*\|\|\s*undefined\}/g,
      'pageDescription={scContent?.pageDescription || _seoDb?.pageDescription || undefined}'],
  ];

  for (const [re, replacement] of patterns) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      changed = true;
    }
  }

  return { content: out, changed };
}

function main() {
  const args = parseArgs();
  const pages = findPages();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔧 Wiring meta + hero props to scContent (${args.apply ? 'APPLY' : 'DRY RUN'})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let modified = 0;
  let skipped = 0;
  const issues: string[] = [];

  for (const { slug, path: filePath } of pages) {
    if (args.only && args.only !== slug) continue;

    let src = fs.readFileSync(filePath, 'utf-8');
    const notes: string[] = [];

    const imp = ensureImports(src);
    src = imp.content;
    if (imp.changed) notes.push('+ getServiceCityContent import');

    const metaRes = rewriteGenerateMetadata(src, slug);
    src = metaRes.content;
    if (metaRes.changed) notes.push('+ generateMetadata wired');
    else if (metaRes.note && metaRes.note !== 'already wired') notes.push(`⚠ generateMetadata: ${metaRes.note}`);

    const heroRes = rewriteHeroProps(src);
    src = heroRes.content;
    if (heroRes.changed) notes.push('+ hero props wired');

    if (notes.length === 0) {
      skipped += 1;
      continue;
    }

    const hadIssue = notes.some((n) => n.startsWith('⚠'));
    if (hadIssue) issues.push(`${slug}: ${notes.filter((n) => n.startsWith('⚠')).join(', ')}`);

    console.log(`${args.apply ? '✓' : '+'} ${slug}`);
    for (const n of notes) console.log(`    ${n}`);

    if (args.apply) {
      fs.writeFileSync(filePath, src, 'utf-8');
    }
    modified += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.apply ? 'Modified' : 'Would modify'}: ${modified}`);
  console.log(`Skipped (already wired): ${skipped}`);
  if (issues.length > 0) {
    console.log(`Manual review needed: ${issues.length}`);
    for (const i of issues) console.log(`  • ${i}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
