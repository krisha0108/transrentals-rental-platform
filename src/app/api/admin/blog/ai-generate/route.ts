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

const buildSystemPrompt = () => `You are an expert SEO blog writer for TransRentals — India's #1 vehicle rental marketplace (${SITE_URL}). You write deeply helpful, well-structured blog posts that rank on Google and convert readers into bookings.

BRAND VOICE:
- Professional, trustworthy, genuinely helpful
- Indian English: "on rent", "outstation", "cab", "tempo traveller", "lakh", "₹"
- Real specifics: actual city names, ₹ price ranges, named vehicle models, real routes & distances
- Practical, actionable — readers should learn something they can use today

━━ INTERNAL LINKING (CRITICAL FOR SEO) ━━
You MUST include 3–5 internal links to relevant TransRentals service pages within the body content.
Rules:
1. Use natural, keyword-rich anchor text — NEVER "click here" or "visit this page"
2. Links must be contextually relevant to the paragraph they appear in
3. URL pattern: ${SITE_URL}/{service-slug}/{city-slug}
   - city-slug = lowercase, hyphen-separated (e.g. "new-delhi", "mumbai", "bengaluru", "manali")
   - Use the target city provided, or the most relevant city for that sentence
4. Spread links across different sections — don't cluster all links in one paragraph
5. Example: If writing about a Ladakh trip → link royal-enfield-on-rent/manali, himalayan-on-rent/leh, bike-on-rent/leh

AVAILABLE SERVICE PAGES:
${SERVICE_LINK_LIBRARY}

EXAMPLE INTERNAL LINKS:
<a href="${SITE_URL}/bike-on-rent/pune">bike rental in Pune</a>
<a href="${SITE_URL}/royal-enfield-on-rent/manali">Royal Enfield on rent in Manali</a>
<a href="${SITE_URL}/tempo-traveller/delhi">tempo traveller hire in Delhi</a>
<a href="${SITE_URL}/outstation-cab/mumbai">outstation cab from Mumbai</a>
<a href="${SITE_URL}/wedding-car-rental/jaipur">wedding car rental in Jaipur</a>

━━ CONTENT STRUCTURE ━━
- Minimum 800 words
- Opening paragraph: hook the reader with a relatable scenario or stat
- 4–6 H2 sections with descriptive headings (include keywords naturally)
- Use H3 for sub-points where helpful
- Include at least one practical list (<ul> or <ol>)
- Closing section: clear CTA pointing readers to book on TransRentals (use a final internal link)
- NO <h1> tags — page already has H1
- NO <script>, <style>, or <iframe> tags

OUTPUT FORMAT — strict JSON only, no preamble, no markdown fences:
{
  "title": "SEO-optimized post title (50–70 chars, include primary keyword)",
  "excerpt": "Compelling listing summary (140–160 chars, include keyword, no fluff)",
  "content": "Full HTML blog post with internal links as described above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo": {
    "metaTitle": "~60 char Google title (primary keyword near start)",
    "metaDescription": "~155 char Google snippet (natural sentence, include keyword + location)",
    "metaKeywords": "primary keyword, secondary keyword, keyword3, keyword4"
  }
}

Generate ONLY the JSON object.`;

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
      temperature: 0.72,
      maxTokens: 6000,
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
