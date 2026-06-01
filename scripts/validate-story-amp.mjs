#!/usr/bin/env node
/**
 * Web Story AMP structural checker (dependency-free).
 *
 * Pulls every published story's AMP URL from /sitemap-stories.xml, fetches the
 * HTML, and runs deterministic checks for the issues that actually break Web
 * Story indexing: amp-boilerplate exactness, mandatory scripts/tags, canonical
 * consistency, raw (non-AMP) media tags, the 75 KB inline-CSS budget, and the
 * non-AMP twin's canonical/H1. For each AMP page it also fetches the paired
 * React page (/stories/{slug}) to confirm it canonicalises to the AMP URL.
 *
 * Why not the `amphtml-validator` npm package? Its only/latest release (1.0.38)
 * is stale and returns false positives under modern Node (it fails even the
 * official minimal AMP doc). For the authoritative AMP-engine verdict use:
 *   • https://validator.ampproject.org/#url=<your-amp-url>
 *   • open the AMP URL in Chrome with #development=1 and read the console
 *   • Google Search Console → AMP report
 * This script catches the high-value structural problems reliably and offline.
 *
 * Usage:
 *   node scripts/validate-story-amp.mjs                      # https://transrentals.in
 *   node scripts/validate-story-amp.mjs http://localhost:3000
 *   node scripts/validate-story-amp.mjs https://transrentals.in things-to-do-in-agra
 *
 * Exit: 0 = no FAILs, 1 = at least one FAIL, 2 = script error.
 */

const BASE = (process.argv[2] || process.env.SITE_URL || 'https://transrentals.in').replace(/\/+$/, '');
const ONLY_SLUG = process.argv[3] || '';

// Spec-exact AMP boilerplate (must match byte-for-byte)
const BP =
  'body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}';
const BP_NOSCRIPT = 'body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}';

const CSS_BUDGET = 75000; // AMP total custom+inline CSS limit (bytes)

async function getText(url) {
  const r = await fetch(url, { redirect: 'follow' });
  return { ok: r.ok, status: r.status, html: r.ok ? await r.text() : '' };
}

async function getAmpUrls() {
  if (ONLY_SLUG) return [`${BASE}/stories/${ONLY_SLUG}/amp`];
  const { ok, status, html } = await getText(`${BASE}/sitemap-stories.xml`);
  if (!ok) throw new Error(`sitemap fetch failed: HTTP ${status}`);
  return [...new Set([...html.matchAll(/<loc>\s*([^<\s]+\/amp)\s*<\/loc>/g)].map((m) => m[1]))];
}

// Run all checks against one AMP page's HTML; returns {fails:[], warns:[]}
function checkAmp(html) {
  const fails = [];
  const warns = [];
  const has = (re) => re.test(html);

  // 1. <html amp> / <html ⚡>
  if (!/<html[^>]*\s(amp|⚡)(\s|>|=)/i.test(html)) fails.push('Missing `amp`/⚡ attribute on <html>');

  // 2 & 3. boilerplate exactness
  const bpTags = [...html.matchAll(/<style amp-boilerplate>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  if (!bpTags.length) fails.push('No <style amp-boilerplate> tag');
  else if (bpTags[0] !== BP) fails.push('Main amp-boilerplate text is not byte-exact');
  if (!has(/<noscript><style amp-boilerplate>/)) fails.push('Missing <noscript> amp-boilerplate');
  else if (!html.includes(BP_NOSCRIPT)) fails.push('noscript amp-boilerplate text is not byte-exact');

  // 4-6. mandatory runtime scripts
  if (!has(/<script[^>]+src="https:\/\/cdn\.ampproject\.org\/v0\.js"/)) fails.push('Missing AMP runtime v0.js');
  if (!has(/custom-element="amp-story"[^>]+amp-story-1\.0\.js/)) fails.push('Missing amp-story-1.0.js');
  if (has(/<amp-video[\s>]/) && !has(/custom-element="amp-video"/)) fails.push('Uses <amp-video> but amp-video script missing');
  if (has(/<amp-img[\s>]/) === false && has(/<img[\s>]/)) {} // handled below

  // 7. canonical (self for a web story)
  const canon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1]
    || html.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i)?.[1];
  if (!canon) fails.push('Missing <link rel="canonical">');
  else if (!canon.includes('/amp')) warns.push(`canonical does not point to the AMP URL (${canon})`);

  // 8. title
  if (!/<title>[^<]+<\/title>/.test(html)) warns.push('Missing/empty <title>');

  // 9. at least one story page
  if (!has(/<amp-story-page[\s>]/)) fails.push('No <amp-story-page> found');

  // 10. amp-story mandatory attrs
  const story = html.match(/<amp-story\b[^>]*>/i)?.[0] || '';
  for (const attr of ['title', 'publisher', 'publisher-logo-src', 'poster-portrait-src']) {
    if (!new RegExp(`\\s${attr}=`).test(story)) warns.push(`<amp-story> missing ${attr}`);
  }

  // 11. raw (non-AMP) media — disallowed in AMP
  const body = html.split(/<body[^>]*>/i)[1] || html;
  if (/<img\b/i.test(body)) fails.push('Raw <img> in body (use <amp-img>)');
  if (/<video\b/i.test(body)) fails.push('Raw <video> in body (use <amp-video>)');
  if (/<iframe\b/i.test(body)) fails.push('Raw <iframe> (use <amp-iframe>)');

  // 12. CSS budget (amp-custom + all inline style="")
  const ampCustom = (html.match(/<style amp-custom>([\s\S]*?)<\/style>/)?.[1] || '').length;
  const inline = [...html.matchAll(/\sstyle="([^"]*)"/g)].reduce((n, m) => n + m[1].length, 0);
  const totalCss = ampCustom + inline;
  if (totalCss > CSS_BUDGET) fails.push(`Inline+custom CSS ~${totalCss}B exceeds 75KB AMP budget`);
  else if (totalCss > CSS_BUDGET * 0.8) warns.push(`CSS ~${totalCss}B is near the 75KB budget`);

  // 13. structured data
  if (!has(/<script type="application\/ld\+json">/)) warns.push('No JSON-LD structured data');

  // 14. deprecated bookend
  if (has(/<amp-story-bookend\b/)) warns.push('Uses deprecated <amp-story-bookend> (prefer <amp-story-page-outlink>)');

  return { fails, warns };
}

// Verify the paired React page canonicalises to the AMP URL and has an H1
async function checkPaired(ampUrl) {
  const pageUrl = ampUrl.replace(/\/amp$/, '');
  const notes = [];
  try {
    const { ok, status, html } = await getText(pageUrl);
    if (!ok) return [`non-AMP page ${pageUrl} → HTTP ${status}`];
    const canon = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] || '';
    if (!canon.endsWith('/amp')) notes.push(`non-AMP canonical should point to /amp (got: ${canon || 'none'})`);
    if (!/<h1[\s>]/i.test(html)) notes.push('non-AMP page has no server-rendered <h1>');
  } catch (e) {
    notes.push(`non-AMP page fetch error: ${e.message}`);
  }
  return notes;
}

async function main() {
  console.log(`\nWeb Story AMP check → ${BASE}\n${'─'.repeat(64)}`);
  const urls = await getAmpUrls();
  if (!urls.length) {
    console.log('No story AMP URLs found (sitemap empty or no published stories).');
    return;
  }
  console.log(`Checking ${urls.length} story AMP page(s)…\n`);

  let okCount = 0;
  const broken = [];

  for (const url of urls) {
    const { ok, status, html } = await getText(url).catch((e) => ({ ok: false, status: e.message, html: '' }));
    if (!ok) {
      console.log(`✗ HTTP ${status}  ${url}`);
      broken.push(url);
      continue;
    }
    const { fails, warns } = checkAmp(html);
    const pairedNotes = await checkPaired(url);

    if (!fails.length && !warns.length && !pairedNotes.length) {
      console.log(`✓ OK    ${url}`);
      okCount++;
      continue;
    }
    if (fails.length) broken.push(url);
    console.log(`${fails.length ? '✗ FAIL' : '⚠ WARN'}  ${url}`);
    fails.forEach((f) => console.log(`   ✗ ${f}`));
    warns.forEach((w) => console.log(`   ⚠ ${w}`));
    pairedNotes.forEach((n) => console.log(`   ⚠ [paired] ${n}`));
    console.log('');
  }

  console.log(`${'─'.repeat(64)}`);
  console.log(`Done: ${okCount} clean, ${broken.length} with FAILs (of ${urls.length}).`);
  console.log('\nFor the authoritative AMP-engine verdict, also run each URL through');
  console.log('https://validator.ampproject.org/#url=<amp-url>  or GSC → AMP report.');
  process.exit(broken.length ? 1 : 0);
}

main().catch((e) => {
  console.error('\nScript error:', e.message);
  process.exit(2);
});
