/**
 * Batch transformation: wire every (services)/<slug>/[location]/page.tsx
 * to render <ServiceCitySections> (block-based admin-managed content) and
 * remove duplicate hardcoded sections (CityContentSection / FAQSection /
 * PopularRoutes).
 *
 * For each page:
 *   1. Add imports for getServiceCityContent + ServiceCitySections (idempotent)
 *   2. Inject scContent fetch into existing Promise.all OR add a new await
 *   3. Inject <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />
 *      just before the first <RelatedServices ...> JSX (or before the closing
 *      </div></> if no RelatedServices found).
 *   4. Comment out <CityContentSection .../> with a marker (safer than delete)
 *
 * Pages that already have <ServiceCitySections> are skipped.
 *
 * Run:
 *   npx tsx scripts/wire-service-pages.ts            # dry-run
 *   npx tsx scripts/wire-service-pages.ts --apply    # actually edit
 *   npx tsx scripts/wire-service-pages.ts --apply --only=innova-on-rent
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

function findServicePages(): { serviceSlug: string; path: string }[] {
  const out: { serviceSlug: string; path: string }[] = [];
  const services = fs.readdirSync(SERVICES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('('))
    .map((d) => d.name);

  for (const svc of services) {
    const p = path.join(SERVICES_DIR, svc, '[location]', 'page.tsx');
    if (fs.existsSync(p)) out.push({ serviceSlug: svc, path: p });
  }
  return out;
}

type Transform = {
  changed: boolean;
  notes: string[];
  content: string;
};

function addImports(src: string): { content: string; added: boolean } {
  if (src.includes('@/components/seo/ServiceCitySections')) {
    return { content: src, added: false };
  }
  // Find the last import line
  const importLines = [...src.matchAll(/^import .+ from .+;?$/gm)];
  if (importLines.length === 0) return { content: src, added: false };
  const lastImport = importLines[importLines.length - 1];
  const insertPos = lastImport.index! + lastImport[0].length;
  const additions = `\nimport { getServiceCityContent } from '@/lib/seo/service-city-content';\nimport { ServiceCitySections } from '@/components/seo/ServiceCitySections';`;
  return { content: src.slice(0, insertPos) + additions + src.slice(insertPos), added: true };
}

function addScContentFetch(src: string, serviceSlug: string): { content: string; added: boolean } {
  if (src.includes('getServiceCityContent(')) return { content: src, added: false };

  // Strategy 1: there is already a `const [..., ...] = await Promise.all([...]);` — add scContent into it
  const pa = /const \[(.+?)\] = await Promise\.all\(\[\s*([\s\S]+?)\s*\]\);/m;
  const m = pa.exec(src);
  if (m) {
    const vars = m[1].trim();
    const calls = m[2].trim();
    const newVars = vars + ', scContent';
    const newCalls = calls + (calls.endsWith(',') ? '\n    ' : ',\n    ') + `getServiceCityContent('${serviceSlug}', params.location),`;
    const replacement = `const [${newVars}] = await Promise.all([\n    ${newCalls}\n  ]);`;
    return { content: src.replace(pa, replacement), added: true };
  }

  // Strategy 2: single `await resolvePageMeta(...)` — convert to Promise.all
  const single = /const (seoData) = await resolvePageMeta\((.+?)\);/m;
  const m2 = single.exec(src);
  if (m2) {
    const replacement = `const [${m2[1]}, scContent] = await Promise.all([\n    resolvePageMeta(${m2[2]}),\n    getServiceCityContent('${serviceSlug}', params.location),\n  ]);`;
    return { content: src.replace(single, replacement), added: true };
  }

  // Strategy 3: there is `const city = pageContext.city;` — inject fetch after it
  const cityAnchor = /(const city = pageContext\.city;\s*\n(?:.*\n){0,3})/;
  const m3 = cityAnchor.exec(src);
  if (m3) {
    const insertion = m3[0] + `  const scContent = await getServiceCityContent('${serviceSlug}', params.location);\n`;
    return { content: src.replace(cityAnchor, insertion), added: true };
  }

  return { content: src, added: false };
}

function addServiceCitySectionsRender(src: string): { content: string; added: boolean } {
  if (src.includes('<ServiceCitySections ')) return { content: src, added: false };

  const inject = `      {/* All editable SEO content — block-based sectionsConfig from admin */}\n      <ServiceCitySections sectionsConfig={scContent?.sectionsConfig} cityName={locationName} />\n\n      `;

  // Strategy 1: inject before the first <RelatedServices ...>
  const rs = /(\s+)(<RelatedServices)/;
  if (rs.test(src)) {
    return { content: src.replace(rs, `\n\n${inject}$2`), added: true };
  }

  // Strategy 2: inject before final closing fragment / div </> at end of return
  const tail = /(\s*<\/div>\s*<\/>\s*\);?\s*\n}\s*$)/;
  if (tail.test(src)) {
    return { content: src.replace(tail, `\n\n${inject}\n$1`), added: true };
  }

  const tail2 = /(\s*<\/div>\s*\);?\s*\n}\s*$)/;
  if (tail2.test(src)) {
    return { content: src.replace(tail2, `\n\n${inject}\n$1`), added: true };
  }

  return { content: src, added: false };
}

function commentOutCityContentSection(src: string): { content: string; added: boolean } {
  if (!src.includes('<CityContentSection')) return { content: src, added: false };
  // Comment out the CityContentSection JSX with a marker
  const re = /<CityContentSection[\s\S]+?\/>/g;
  const replaced = src.replace(re, (match) => {
    // Wrap in JSX comment using {/* */}
    return `{/* DEPRECATED — admin block editor now manages this content\n      ${match.replace(/\n/g, '\n      ')}\n      */}`;
  });
  if (replaced === src) return { content: src, added: false };
  return { content: replaced, added: true };
}

function transformOne(src: string, serviceSlug: string): Transform {
  const notes: string[] = [];
  let content = src;
  let changed = false;

  const imports = addImports(content);
  content = imports.content;
  if (imports.added) { notes.push('+ imports'); changed = true; }

  const fetch = addScContentFetch(content, serviceSlug);
  content = fetch.content;
  if (fetch.added) { notes.push('+ scContent fetch'); changed = true; }
  else if (!content.includes('getServiceCityContent(')) {
    notes.push('⚠ could not inject scContent fetch (manual review needed)');
  }

  const render = addServiceCitySectionsRender(content);
  content = render.content;
  if (render.added) { notes.push('+ ServiceCitySections render'); changed = true; }
  else if (!content.includes('<ServiceCitySections ')) {
    notes.push('⚠ could not inject ServiceCitySections (manual review needed)');
  }

  const ccs = commentOutCityContentSection(content);
  content = ccs.content;
  if (ccs.added) { notes.push('- CityContentSection commented out'); changed = true; }

  return { changed, notes, content };
}

function main() {
  const args = parseArgs();
  const pages = findServicePages();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔧 Batch wiring service pages (${args.apply ? 'APPLY' : 'DRY RUN'})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let modified = 0;
  let skipped = 0;
  let needsManual = 0;
  const manualList: string[] = [];

  for (const { serviceSlug, path: filePath } of pages) {
    if (args.only && args.only !== serviceSlug) continue;
    const src = fs.readFileSync(filePath, 'utf-8');

    if (src.includes('<ServiceCitySections ') && src.includes('getServiceCityContent(')) {
      skipped += 1;
      continue;
    }

    const t = transformOne(src, serviceSlug);

    if (!t.changed) {
      skipped += 1;
      continue;
    }

    const hasManualNote = t.notes.some((n) => n.startsWith('⚠'));
    if (hasManualNote) {
      needsManual += 1;
      manualList.push(serviceSlug);
    }

    console.log(`${args.apply ? '✓' : '+'} ${serviceSlug}`);
    for (const n of t.notes) console.log(`    ${n}`);

    if (args.apply) {
      fs.writeFileSync(filePath, t.content, 'utf-8');
    }
    modified += 1;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${args.apply ? 'Modified' : 'Would modify'}: ${modified}`);
  console.log(`Skipped (already wired): ${skipped}`);
  if (needsManual > 0) {
    console.log(`Need manual review:      ${needsManual}`);
    console.log(`  ${manualList.join(', ')}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
