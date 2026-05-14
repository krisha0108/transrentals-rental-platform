/**
 * Builds a rich context object about a city for use in AI content prompts.
 * Pulls from existing static data files (indian-cities, city-seo-content,
 * city-rich-content) so the AI has concrete facts to anchor unique content
 * around — population numbers, named neighborhoods, real routes, terrain
 * type — rather than generic boilerplate.
 */

import { getCityBySlug, type City } from '@/data/indian-cities';
import { CITY_SEO } from '@/data/city-seo-content';
import { CITY_RICH } from '@/data/city-rich-content';

export type TerrainType =
  | 'coastal'
  | 'hill-station'
  | 'plains'
  | 'desert'
  | 'religious'
  | 'metro'
  | 'tourist-heritage'
  | 'mixed';

export type CityContext = {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  tier: 1 | 2 | 3 | 4 | 5;
  population?: number;
  keywords: string[];
  priority: number;
  terrain: TerrainType;

  intro?: string;
  routes?: Array<{ to: string; distance: string; duration: string; via?: string }>;
  tips?: string[];
  stats?: { population: string; knownFor: string; airport: string };

  neighborhoods?: Array<{ name: string; type: string; pickupNote: string }>;
  attractions?: Array<{ name: string; distance: string; type: string; bestVehicle: string }>;
  drivingInfo?: { restrictions: string; parking: string; highwayNote: string };
};

const COASTAL_STATES = new Set(['GA', 'MH', 'KL', 'TN', 'KA', 'AP', 'OR', 'WB', 'GJ']);
const HILL_KEYWORDS = ['shimla', 'manali', 'darjeeling', 'ooty', 'munnar', 'mussoorie',
  'nainital', 'kasol', 'mcleodganj', 'dharamshala', 'gangtok', 'kodaikanal', 'leh',
  'srinagar', 'kufri', 'auli', 'rishikesh', 'haridwar'];
const DESERT_KEYWORDS = ['jaisalmer', 'jodhpur', 'bikaner', 'pushkar'];
const RELIGIOUS_KEYWORDS = ['varanasi', 'tirupati', 'amritsar', 'mathura', 'vrindavan',
  'haridwar', 'rishikesh', 'ujjain', 'puri', 'shirdi', 'ajmer'];
const HERITAGE_KEYWORDS = ['agra', 'jaipur', 'udaipur', 'jaisalmer', 'hampi', 'khajuraho',
  'mahabalipuram', 'aurangabad'];
const METRO_TIERS = new Set([1]);

function inferTerrain(city: City): TerrainType {
  const slug = city.slug.toLowerCase();
  if (HILL_KEYWORDS.some(k => slug.includes(k))) return 'hill-station';
  if (DESERT_KEYWORDS.some(k => slug.includes(k))) return 'desert';
  if (HERITAGE_KEYWORDS.some(k => slug.includes(k))) return 'tourist-heritage';
  if (RELIGIOUS_KEYWORDS.some(k => slug.includes(k))) return 'religious';
  if (METRO_TIERS.has(city.tier)) return 'metro';
  if (COASTAL_STATES.has(city.stateCode) && city.tier <= 3) return 'coastal';
  return 'plains';
}

export function buildCityContext(citySlug: string): CityContext | null {
  const city = getCityBySlug(citySlug);
  if (!city) return null;

  const seo = CITY_SEO[citySlug];
  const rich = CITY_RICH[citySlug];

  return {
    slug: city.slug,
    name: city.name,
    state: city.state,
    stateCode: city.stateCode,
    tier: city.tier,
    population: city.population,
    keywords: city.keywords ?? [],
    priority: city.priority,
    terrain: inferTerrain(city),

    intro: seo?.intro,
    routes: seo?.routes,
    tips: seo?.tips,
    stats: seo?.stats,

    neighborhoods: rich?.neighborhoods,
    attractions: rich?.attractions,
    drivingInfo: rich?.drivingInfo,
  };
}

export function formatCityContextForPrompt(ctx: CityContext): string {
  const lines: string[] = [];

  lines.push(`CITY: ${ctx.name}, ${ctx.state} (${ctx.stateCode})`);
  lines.push(`Tier ${ctx.tier} | Priority ${ctx.priority}/10 | Terrain: ${ctx.terrain}`);
  if (ctx.population) lines.push(`Population: ${ctx.population.toLocaleString('en-IN')}`);
  if (ctx.keywords.length) lines.push(`SEO keywords: ${ctx.keywords.join(', ')}`);

  if (ctx.stats) {
    lines.push('');
    lines.push(`Known for: ${ctx.stats.knownFor}`);
    lines.push(`Nearest airport: ${ctx.stats.airport}`);
  }

  if (ctx.intro) {
    lines.push('');
    lines.push(`CITY INTRO (existing on site): ${ctx.intro}`);
  }

  if (ctx.routes?.length) {
    lines.push('');
    lines.push('POPULAR OUTSTATION ROUTES:');
    for (const r of ctx.routes) {
      lines.push(`  - ${ctx.name} → ${r.to} (${r.distance}, ${r.duration}${r.via ? `, via ${r.via}` : ''})`);
    }
  }

  if (ctx.neighborhoods?.length) {
    lines.push('');
    lines.push('PICKUP ZONES / NEIGHBORHOODS:');
    for (const n of ctx.neighborhoods) {
      lines.push(`  - ${n.name} [${n.type}]: ${n.pickupNote}`);
    }
  }

  if (ctx.attractions?.length) {
    lines.push('');
    lines.push('NEARBY ATTRACTIONS / DESTINATIONS:');
    for (const a of ctx.attractions) {
      lines.push(`  - ${a.name} (${a.distance}, ${a.type}) — recommended: ${a.bestVehicle}`);
    }
  }

  if (ctx.drivingInfo) {
    lines.push('');
    lines.push('LOCAL DRIVING REGULATIONS:');
    lines.push(`  Restrictions: ${ctx.drivingInfo.restrictions}`);
    lines.push(`  Parking: ${ctx.drivingInfo.parking}`);
    lines.push(`  Highways: ${ctx.drivingInfo.highwayNote}`);
  }

  if (ctx.tips?.length) {
    lines.push('');
    lines.push('LOCAL TIPS:');
    for (const t of ctx.tips) lines.push(`  - ${t}`);
  }

  return lines.join('\n');
}
