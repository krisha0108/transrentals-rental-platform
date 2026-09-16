/**
 * Price scrubbing for public service pages.
 *
 * Some pages must not quote any price at all — the real rate depends on the
 * vendor and the dates, so a number baked into SEO copy is misleading. The
 * copy itself is authored in the admin, so this can't be fixed at the source;
 * it has to be filtered at render time.
 *
 * The rules below are deliberately conservative: a whole row or bullet goes
 * when it exists only to quote a rate, but inside prose only the offending
 * sentence is dropped so the surrounding paragraph still reads.
 */

// ₹1,299 · ₹1299/day · ₹300–₹500 · Rs. 499 · INR 899
const PRICE_RE = /(?:₹|\bRs\.?\s?|\bINR\s)\s?\d[\d,.]*/i;

/** Section ids/labels that exist purely to quote rates. */
const PRICING_SECTION_RE = /^(pricing|price|prices|rates|rate-card|charges|cost|costs|fare|fares|tariff)$/i;

export function containsPrice(text: string | null | undefined): boolean {
  return !!text && PRICE_RE.test(text);
}

/** True when a whole content block is a rate card and should be dropped. */
export function isPricingSection(id: string, label?: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (PRICING_SECTION_RE.test(norm(id))) return true;
  if (label && /\b(pricing|price|rates?|charges?|tariff|fare)\b/i.test(label)) return true;
  return false;
}

/**
 * Drop every sentence that quotes a rate, keeping the rest of the text.
 * Returns '' when nothing survives.
 */
export function stripPriceSentences(text: string): string {
  if (!containsPrice(text)) return text;
  const kept = text
    // Split on sentence ends but keep the terminator with the sentence.
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !PRICE_RE.test(sentence));
  return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Scrub prices out of stored rich-text HTML.
 *
 * Table rows and list items that quote a rate are removed whole; prose keeps
 * everything except the sentences that quote one. Containers left empty by
 * that removal are dropped too, so no stray bullets or header-only tables
 * survive.
 */
export function stripPricesFromHtml(html: string): string {
  if (!containsPrice(html)) return html;

  let out = html;

  // 1. Rate rows and bullets go whole — they carry nothing but the number.
  out = out.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi, (row) => (PRICE_RE.test(row) ? '' : row));
  out = out.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (item) => (PRICE_RE.test(item) ? '' : item));

  // 2. Inside prose, drop only the offending sentence. Operating on the text
  //    between tags keeps attributes and markup untouched.
  out = out.replace(/>([^<]+)</g, (match, text: string) => {
    if (!PRICE_RE.test(text)) return match;
    const cleaned = stripPriceSentences(text);
    return `>${cleaned}<`;
  });

  // 3. Tidy up whatever the removals emptied out.
  out = out
    .replace(/<table\b[^>]*>(?:\s|<thead\b[^>]*>[\s\S]*?<\/thead>|<tbody\b[^>]*>\s*<\/tbody>)*<\/table>/gi, '')
    .replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/gi, '')
    .replace(/<(p|h[1-6]|div|span|strong|em)\b[^>]*>\s*<\/\1>/gi, '')
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br />')
    .trim();

  return out;
}

/** Plain-text variant for headings, hero copy and FAQ answers. */
export function stripPricesFromText(text: string | null | undefined): string {
  if (!text) return '';
  return stripPriceSentences(text);
}
