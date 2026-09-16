import Link from 'next/link';
import { CITY_SUBLOCATIONS } from '@/data/city-sublocations';
import { stripPricesFromText } from '@/lib/content/strip-prices';

interface ServiceAreasSectionProps {
  serviceSlug: string;
  citySlug: string;
  cityName: string;
  serviceName: string;
  /** Opt-in: drop rate-quoting sentences from the area blurbs. Off by
   *  default so other service pages keep their copy as authored. */
  hidePrices?: boolean;
}

export function ServiceAreasSection({ serviceSlug, citySlug, cityName, serviceName, hidePrices = false }: ServiceAreasSectionProps) {
  const areas = CITY_SUBLOCATIONS[serviceSlug]?.[citySlug];
  if (!areas || areas.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom max-w-5xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {serviceName} by Area in {cityName}
        </h2>
        <p className="text-gray-600 mb-6">
          We serve all major neighborhoods in {cityName}. Click on an area for specific availability and local info.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Link
              key={area.slug}
              href={`/${serviceSlug}/${citySlug}/${area.slug}`}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {serviceName} in {area.name}
                </h3>
                <span className="text-xs text-gray-400 capitalize bg-gray-50 px-2 py-0.5 rounded-full">{area.type}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{hidePrices ? stripPricesFromText(area.description) : area.description}</p>
              {area.pickupAddress && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <span>📍</span> {area.pickupAddress}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
