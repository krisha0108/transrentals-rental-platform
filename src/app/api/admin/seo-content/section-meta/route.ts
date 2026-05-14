/**
 * Section metadata for a (service, city) edit page.
 *
 * Returns the default section list for the given service plus
 * per-section help text and city-specific placeholder HTML so the editor
 * shows something useful when the admin opens an empty section.
 *
 * Query: ?service=<slug>&city=<slug>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getDefaultSectionsForService, SECTION_LIBRARY } from '@/lib/ai/service-sections';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { buildCityContext } from '@/lib/ai/city-context';

function placeholderForSection(
  sectionId: string,
  serviceLabel: string,
  cityName: string,
  routes?: { to: string; distance: string; duration: string; via?: string }[],
): string {
  switch (sectionId) {
    case 'hero':
      return `<p>${serviceLabel} in ${cityName}. Verified vendors, transparent pricing, instant booking. Replace this with city-specific intro.</p>`;

    case 'why_choose':
      return `<ul>
<li><strong>Verified vendors:</strong> Background-checked partners across ${cityName}</li>
<li><strong>Transparent pricing:</strong> No hidden charges, free quotes</li>
<li><strong>Local expertise:</strong> Vendors who know ${cityName} routes and traffic</li>
<li><strong>24/7 support:</strong> Round-the-clock assistance</li>
</ul>`;

    case 'popular_routes':
      if (routes && routes.length > 0) {
        const items = routes
          .map((r) => `<li><strong>${cityName} → ${r.to}</strong> — ${r.distance} · ${r.duration}${r.via ? ` via ${r.via}` : ''}</li>`)
          .join('');
        return `<p>Popular outstation routes from ${cityName}:</p><ul>${items}</ul>`;
      }
      return `<p>List popular outstation routes from ${cityName} here with distances and travel times.</p>`;

    case 'tips':
      return `<ol>
<li>Tip about local traffic / peak hours in ${cityName}</li>
<li>Tip about preferred vehicle for this city's terrain</li>
<li>Tip about seasonal considerations</li>
</ol>`;

    case 'pricing_table':
      return `<table>
<thead><tr><th>Category</th><th>Duration</th><th>Price</th></tr></thead>
<tbody>
<tr><td>Hatchback</td><td>4hr/40km</td><td>₹999</td></tr>
<tr><td>Sedan</td><td>8hr/80km</td><td>₹1,800</td></tr>
<tr><td>SUV</td><td>12hr/120km</td><td>₹2,800</td></tr>
</tbody>
</table>`;

    case 'faqs':
      return JSON.stringify([
        { q: `What is the cost of ${serviceLabel.toLowerCase()} in ${cityName}?`, a: '' },
        { q: `Which areas of ${cityName} do you cover?`, a: '' },
        { q: `How do I book ${serviceLabel.toLowerCase()} in ${cityName}?`, a: '' },
      ]);

    default:
      return `<p>Add content for the ${SECTION_LIBRARY[sectionId]?.label ?? sectionId} section here.</p>`;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || '';
  const city = searchParams.get('city') || '';

  if (!service) return NextResponse.json({ error: 'service required' }, { status: 400 });
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });

  const defaults = getDefaultSectionsForService(service);
  const serviceLabel = SERVICE_LABELS[service]?.label ?? service;
  const cityCtx = buildCityContext(city);
  const cityName = cityCtx?.name ?? city;

  const hints: Record<string, string> = {};
  for (const s of defaults) {
    hints[s.id] = SECTION_LIBRARY[s.id]?.hint ?? `Edit the ${s.label} section.`;
  }

  const defaultContent: Record<string, string> = {};
  for (const s of defaults) {
    defaultContent[s.id] = placeholderForSection(s.id, serviceLabel, cityName, cityCtx?.routes);
  }

  return NextResponse.json({ defaults, hints, defaultContent });
}
