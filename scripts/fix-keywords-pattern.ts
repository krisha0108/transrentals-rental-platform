/**
 * Quick follow-up: fix the keywords ternary that wire-meta-to-new-admin.ts
 * left in a broken state. After that script's rewrite, files contain:
 *
 *   keywords: scContent?.metaKeywords || _seoDb?.metaKeywords
 *     ? _seoDb.metaKeywords.split(',').map((k) => k.trim())
 *     : [...fallback...]
 *
 * Bug: when scContent has keywords but _seoDb is null, the truthy branch
 * dereferences `_seoDb.metaKeywords` and throws. Fix uses optional
 * chaining + nullish coalescing so either source works:
 *
 *   keywords: (scContent?.metaKeywords ?? _seoDb?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [...fallback...]
 */

import fs from 'fs';
import path from 'path';

const SERVICES_DIR = path.join(process.cwd(), 'src', 'app', '(services)');

type Args = { apply: boolean };
function parseArgs(): Args {
  return { apply: process.argv.includes('--apply') };
}

function findPages(): string[] {
  const out: string[] = [];
  for (const d of fs.readdirSync(SERVICES_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('(')) continue;
    const p = path.join(SERVICES_DIR, d.name, '[location]', 'page.tsx');
    if (fs.existsSync(p)) out.push(p);
  }
  return out;
}

function fixFile(src: string): { content: string; changed: boolean } {
  // Match the broken pattern. Handles both `_seoDb` and `seoData` legacy varnames.
  //
  // before:
  //   keywords: scContent?.metaKeywords || (_seoDb|seoData)?.metaKeywords ? (_seoDb|seoData).metaKeywords.split(',').map((k) => k.trim()) : [
  // after:
  //   keywords: (scContent?.metaKeywords ?? (_seoDb|seoData)?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [
  const re = /keywords:\s*scContent\?\.metaKeywords\s*\|\|\s*(_seoDb|seoData)\?\.metaKeywords\s*\?\s*\1\.metaKeywords\.split\(','\)\.map\(\(k\)\s*=>\s*k\.trim\(\)\)\s*:\s*\[/g;
  const replacement = `keywords: (scContent?.metaKeywords ?? $1?.metaKeywords)?.split(',').map((k) => k.trim()) ?? [`;

  if (!re.test(src)) return { content: src, changed: false };
  re.lastIndex = 0;
  return { content: src.replace(re, replacement), changed: true };
}

function main() {
  const args = parseArgs();
  const pages = findPages();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔧 Fix keywords ternary (${args.apply ? 'APPLY' : 'DRY RUN'})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let modified = 0;
  for (const p of pages) {
    const src = fs.readFileSync(p, 'utf-8');
    const { content, changed } = fixFile(src);
    if (!changed) continue;
    if (args.apply) fs.writeFileSync(p, content, 'utf-8');
    const slug = p.replace(/\\/g, '/').split('/(services)/')[1].split('/')[0];
    console.log(`${args.apply ? '✓' : '+'} ${slug}`);
    modified += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.apply ? 'Fixed' : 'Would fix'}: ${modified}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
