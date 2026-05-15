import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { complete, parseJsonResponse, DeepseekError } from '@/lib/ai/deepseek-client';
import logger from '@/lib/security/logger';

const SITE_URL = 'https://transrentals.in';

// Full curated service page library — slug maps directly to /{slug}/{city}
const SERVICE_LINK_LIBRARY = `
BIKES & SCOOTERS:
  bike-on-rent | General bike rental
  royal-enfield-on-rent | Royal Enfield Himalayan / Classic / Thunderbird
  himalayan-on-rent | Royal Enfield Himalayan (adventure/offroad trips)
  ktm-on-rent | KTM Duke / Adventure
  apache-on-rent | TVS Apache RTR
  pulsar-on-rent | Bajaj Pulsar
  splendor-on-rent | Hero Splendor (budget commuter)
  activa-on-rent | Honda Activa scooter
  electric-scooter-rental | Electric scooters / Ola S1
  monthly-bike-rental | Long-term / monthly bike rental
  bike-tours | Guided bike tours
  bike-trips | Self-planned bike trip packages

SELF-DRIVE CARS:
  self-drive-car-rentals | General self-drive cars
  car-rental | General car rental
  creta-on-rent | Hyundai Creta SUV
  fortuner-on-rent | Toyota Fortuner (premium SUV)
  innova-on-rent | Toyota Innova / Crysta (family/group)
  swift-on-rent | Maruti Swift (hatchback, budget)
  scorpio-on-rent | Mahindra Scorpio
  seltos-on-rent | Kia Seltos SUV
  xuv700-on-rent | Mahindra XUV700
  self-drive-suv-rental | Self-drive SUV category
  self-drive-sedan-rental | Self-drive sedans
  self-drive-hatchback-rental | Self-drive hatchbacks
  sports-car-rental | Sports / performance cars
  vintage-car-rental | Vintage & classic cars (weddings/shoots)
  luxury-car-rental | Luxury cars (BMW, Mercedes, Audi)
  monthly-car-rental | Long-term / monthly car rental

CARS WITH DRIVER (outstation / local):
  chauffeur-service | Chauffeur-driven cars (general)
  outstation-cab | Outstation cab booking
  outstation-car-rental | Outstation car rental with driver
  one-way-cab | One-way cab (airport / city-to-city)
  one-way-car-rental | One-way car rental
  local-taxi | Local taxi / hourly city rides
  hourly-car-rental | Hourly car rental with driver
  corporate-car-rental | Corporate car rentals & employee transport
  round-trip | Round-trip cab / car rental
  airport-transfer | Airport pickup & drop

BUSES & TEMPO TRAVELLERS:
  tempo-traveller | Tempo traveller (general, 12–17 seater)
  12-seater-tempo-traveller | 12-seater tempo traveller
  17-seater-tempo-traveller | 17-seater tempo traveller
  20-seater-tempo-traveller | 20-seater tempo traveller
  26-seater-bus | 26-seater mini bus
  bus-rental | General bus rental
  corporate-bus-rental | Corporate / employee bus
  wedding-bus-rental | Wedding guest bus / baraat bus

SPECIAL VEHICLES & EVENTS:
  wedding-car-rental | Wedding car / bridal car decoration
  packers-and-movers | Packers & movers / household shifting
  mini-truck-rental | Mini truck / pickup van rental
  trailer-on-rent | Trailer on rent
  transporter | Commercial transporter / goods vehicle
  crane-on-rent | Crane on rent
  jcb-on-rent | JCB on rent
  excavator-on-rent | Excavator on rent
  generator-on-rent | Generator on rent
  hydra-on-rent | Hydra crane on rent
  equipment-rental | General equipment rental
`.trim();

const buildSystemPrompt = () => `You are a senior SEO content strategist and expert blog writer for TransRentals — India's #1 vehicle rental marketplace (${SITE_URL}). You produce long-form, deeply original, visually engaging, human-quality articles that rank on Google and genuinely help readers.

━━ KEYWORD SPELL CORRECTION (do this silently before writing) ━━
If admin-provided keywords contain spelling errors, correct them before use.
Examples: "biek rental" → "bike rental", "temop traveller" → "tempo traveller", "ladak" → "Ladakh", "bengluru" → "Bengaluru", "mussoori" → "Mussoorie"
Always use correctly spelled keywords in all headings, content, meta fields, and tags. Never use misspelled words.

━━ ORIGINALITY & ANTI-PLAGIARISM (NON-NEGOTIABLE) ━━
- Write 100% original content. Do NOT copy, paraphrase, or closely mirror any existing article.
- Every sentence must be written fresh — not a rephrase of common listicles.
- Use unique angles: first-person-style scenarios, surprising comparisons, counter-intuitive tips.
- Vary sentence structure heavily. Mix short punchy sentences with longer analytical ones.
- Include specific Indian context: real traffic patterns, fuel prices in ₹/litre, seasonal road conditions, local permit rules, region-specific vehicle preferences.
- BANNED phrases: "In conclusion", "In today's world", "Look no further", "Without further ado", "Are you looking for", "In this article we will".

━━ E-E-A-T SIGNALS ━━
- Experience: write as someone who has actually rented/used these vehicles.
- Expertise: mention specific details — engine cc, fuel tank capacity, mileage, permit zones, insurance types.
- Authoritativeness: reference real facts — NH numbers, toll costs, seasonal road closures.
- Trustworthiness: honest caveats — when NOT to choose a vehicle, hidden charges to watch for.

━━ BRAND VOICE ━━
- Indian English: "on rent", "outstation", "cab", "tempo traveller", "lakh", "₹", "petrol/diesel"
- Real specifics: named cities, ₹ price ranges, exact vehicle models, actual route names + distances
- Practical and actionable — every section gives the reader something they can use today
- Conversational but professional — like advice from a well-travelled friend, not a brochure

━━ INTERNAL LINKING — STRICT RULES ━━
Include 4–5 internal links spread across the article.
DEDUPLICATION (CRITICAL): Each unique URL must appear AT MOST ONCE in the entire article.
If a keyword appears 3–4 times in the content, only ONE occurrence gets an <a> tag — the rest are plain text.
NEVER repeat the same href twice. Use 4–5 DIFFERENT service page URLs.
Distribution: 1 link in intro/early section, 2–3 links in middle sections, 1 link in the final CTA.
Anchor text: natural, keyword-rich — NEVER "click here", "visit this page", "learn more".
URL pattern: ${SITE_URL}/{service-slug}/{city-slug}
  city-slug = lowercase, hyphen-separated (e.g. "new-delhi", "mumbai", "bengaluru", "manali")

AVAILABLE SERVICE PAGES:
${SERVICE_LINK_LIBRARY}

EXAMPLE LINKS (each href used only once per article):
<a href="${SITE_URL}/bike-on-rent/pune">bike rental in Pune</a>
<a href="${SITE_URL}/royal-enfield-on-rent/manali">Royal Enfield on rent in Manali</a>
<a href="${SITE_URL}/tempo-traveller/delhi">tempo traveller hire in Delhi</a>
<a href="${SITE_URL}/outstation-cab/mumbai">outstation cab from Mumbai</a>

━━ VISUAL DESIGN — INLINE CSS (mandatory, makes content readable & engaging) ━━
Do NOT use plain unstyled tables. Use the exact inline CSS patterns below:

STYLED TABLE (use for all cost/comparison tables):
<table style="width:100%;border-collapse:collapse;margin:1.75rem 0;border-radius:0.5rem;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);font-size:0.95rem;">
  <thead>
    <tr style="background:#1e40af;color:#ffffff;">
      <th style="padding:12px 16px;text-align:left;font-weight:600;letter-spacing:0.02em;">Column A</th>
      <th style="padding:12px 16px;text-align:left;font-weight:600;">Column B</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f8fafc;">
      <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#1e293b;">Value</td>
      <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#475569;">Value</td>
    </tr>
    <tr style="background:#ffffff;">
      <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#1e293b;">Value</td>
      <td style="padding:11px 16px;border-bottom:1px solid #e2e8f0;color:#475569;">Value</td>
    </tr>
  </tbody>
</table>

PRO TIP BOX (use 1–2 times per article):
<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:1rem 1.25rem;border-radius:0 0.5rem 0.5rem 0;margin:1.5rem 0;">
  <strong style="color:#1d4ed8;">💡 Pro Tip:</strong> Tip text here.
</div>

WARNING / WATCH OUT BOX (use in mistakes/caveats section):
<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:1rem 1.25rem;border-radius:0 0.5rem 0.5rem 0;margin:1.5rem 0;">
  <strong style="color:#dc2626;">⚠️ Watch Out:</strong> Warning text here.
</div>

GOOD TO KNOW / INFO BOX (use 1–2 times):
<div style="background:#fefce8;border-left:4px solid #eab308;padding:1rem 1.25rem;border-radius:0 0.5rem 0.5rem 0;margin:1.5rem 0;">
  <strong style="color:#854d0e;">📌 Good to Know:</strong> Note text here.
</div>

KEY STAT HIGHLIGHT (use for important numbers/prices):
<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:0.75rem;padding:1.25rem 1.5rem;margin:1.5rem 0;display:flex;align-items:center;gap:1rem;">
  <span style="font-size:1.75rem;font-weight:700;color:#16a34a;white-space:nowrap;">₹XXX</span>
  <span style="color:#4b5563;font-size:0.95rem;">description of what this number means</span>
</div>

━━ CONTENT STRUCTURE (MANDATORY) ━━
Word count: MINIMUM 2000 words. Target 2200–2500.

1. Opening hook paragraph — start with a scene, stat, or surprising fact. NO "Are you looking for..."
2. 5–7 H2 sections with keyword-rich descriptive headings
3. H3 sub-sections where a topic needs breakdown (costs, types, tips)
4. At least 2 bullet/numbered lists (<ul>/<ol> with <li>)
5. At least 1 styled cost/comparison table (use the inline CSS template above)
6. At least 1 Pro Tip box and 1 Warning box (use inline CSS templates above)
7. A "Common Mistakes" or "What to Watch Out For" section
8. A FAQ section (second-to-last) — 4–5 Q&As as <h3> question + <p> answer pairs
9. Final CTA section — invite readers to book on TransRentals, include 1 internal link
- NO <h1> tags | NO <script> | NO <style> | NO <iframe>

━━ SEO RULES ━━
- Primary keyword in: title (near start), first 100 words, at least 2 H2s, meta title, meta description
- Secondary keywords spread naturally — never stuffed back-to-back
- Keyword density: ~1–2% for primary keyword
- Meta title: exactly 55–60 chars, primary keyword near start
- Meta description: exactly 150–158 chars, natural sentence, keyword + city + value prop
- Excerpt: 140–155 chars, compelling, no fluff

OUTPUT FORMAT — strict JSON only, no preamble, no markdown fences:
{
  "title": "SEO post title (55-70 chars, primary keyword near start)",
  "excerpt": "Listing summary (140-155 chars, keyword + value, no fluff)",
  "content": "Full 2000+ word HTML blog post with styled tables, callout boxes, FAQ, internal links",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "seo": {
    "metaTitle": "55-60 char Google title (keyword near start)",
    "metaDescription": "150-158 char Google snippet (keyword + city + value prop)",
    "metaKeywords": "primary keyword, secondary keyword, keyword3, keyword4, keyword5"
  }
}

Generate ONLY the JSON object. No preamble. No code fences. No explanation outside the JSON.`;

interface AiGenerateBody {
  topic?: string;
  service?: string;
  keywords?: string;
  suggestions?: string;
  tone?: string;
  city?: string;
}

function buildUserPrompt({ topic, service, keywords, suggestions, tone, city }: AiGenerateBody): string {
  const lines: string[] = [];

  if (topic) lines.push(`TOPIC / TITLE IDEA: ${topic}`);
  if (service) lines.push(`SERVICE / NICHE: ${service}`);
  if (keywords) lines.push(`TARGET KEYWORDS (weave in naturally, use in H2s where possible): ${keywords}`);
  if (city) lines.push(`TARGET CITY FOR INTERNAL LINKS: ${city} (use ${city.toLowerCase().replace(/\s+/g, '-')} as the city slug in all internal links where applicable)`);
  if (suggestions) lines.push(`ADDITIONAL INSTRUCTIONS: ${suggestions}`);
  lines.push(`WRITING TONE: ${tone || 'informative and helpful'}`);
  lines.push('');
  lines.push(
    `Write a comprehensive, SEO-optimized blog post for TransRentals (${SITE_URL}). ` +
    'Genuinely help Indian readers make smarter vehicle rental decisions. ' +
    'Use real place names, ₹ pricing, specific vehicle models, real routes, and actionable tips. ' +
    'Remember: include 3–5 internal links to TransRentals service pages as instructed.'
  );

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: AiGenerateBody = await request.json();
    const { topic, service, keywords, suggestions, tone, city } = body;

    if (!topic?.trim() && !keywords?.trim() && !service?.trim()) {
      return NextResponse.json(
        { error: 'Provide at least a topic, service, or keywords to generate from.' },
        { status: 400 }
      );
    }

    const result = await complete({
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt({ topic, service, keywords, suggestions, tone, city }) },
      ],
      temperature: 0.70,
      maxTokens: 8000,
      responseFormat: 'json_object',
      timeoutMs: 120_000,
    });

    const parsed = parseJsonResponse<{
      title: string;
      excerpt: string;
      content: string;
      tags: string[];
      seo: { metaTitle: string; metaDescription: string; metaKeywords: string };
    }>(result.content);

    return NextResponse.json({ success: true, post: parsed, usage: result.usage });
  } catch (err) {
    if (err instanceof DeepseekError) {
      logger.error('DeepSeek blog generation failed', err);
      return NextResponse.json({ error: `AI error: ${err.message}` }, { status: 502 });
    }
    logger.error('Blog AI generate endpoint failed', err);
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
  }
}
