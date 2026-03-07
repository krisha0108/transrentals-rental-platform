'use client';

import { useState } from 'react';
import { CITY_SEO, STATE_SEO } from '@/data/city-seo-content';
import { ChevronDown, ChevronUp, MapPin, Clock, Lightbulb, BarChart3 } from 'lucide-react';

const SERVICE_LABELS: Record<string, string> = {
  'car-rental': 'Car Rental',
  'bike-on-rent': 'Bike Rental',
  'bus-rental': 'Bus Rental',
  'packers-and-movers': 'Packers and Movers',
  'self-drive-car-rentals': 'Self-Drive Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
  'local-taxi': 'Local Taxi',
  'outstation-cab': 'Outstation Cab',
  'chauffeur-service': 'Chauffeur Service',
  'equipment-rental': 'Equipment Rental',
  'tempo-traveller': 'Tempo Traveller',
  'transporter': 'Truck Rental',
  'activa-on-rent': 'Activa Rental',
  'royal-enfield-on-rent': 'Royal Enfield Rental',
  'innova-on-rent': 'Innova Rental',
  'fortuner-on-rent': 'Fortuner Rental',
  'corporate-car-rental': 'Corporate Car Rental',
  'corporate-bus-rental': 'Corporate Bus Rental',
  'wedding-car-rental': 'Wedding Car Rental',
  'wedding-bus-rental': 'Wedding Bus Rental',
  'monthly-car-rental': 'Monthly Car Rental',
  'monthly-bike-rental': 'Monthly Bike Rental',
  'hourly-car-rental': 'Hourly Car Rental',
};

interface Props {
  citySlug: string;
  serviceSlug: string;
  cityName: string;
  stateCode?: string;
}

export function CityContentSection({ citySlug, serviceSlug, cityName, stateCode }: Props) {
  const [expanded, setExpanded] = useState(false);

  const cityData = CITY_SEO[citySlug];
  const stateData = stateCode ? STATE_SEO[stateCode] : null;

  // Nothing to show
  if (!cityData && !stateData) return null;

  const serviceLabel = SERVICE_LABELS[serviceSlug] || 'Vehicle Rental';

  // Pick the right intro
  const intro =
    cityData?.serviceIntros?.[serviceSlug] ||
    cityData?.intro ||
    stateData?.intro;

  if (!intro) return null;

  const faqs = cityData?.serviceFAQs?.[serviceSlug] || null;
  const routes = cityData?.routes || null;
  const tips = cityData?.tips || stateData?.tips || null;
  const stats = cityData?.stats || null;

  const hasExpandable = faqs || routes || tips || stats;

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container-custom max-w-4xl">

        {/* Block 1 — Always visible intro */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {serviceLabel} in {cityName} — Complete Guide
          </h2>
          <p className="text-gray-600 leading-relaxed">{intro}</p>
        </div>

        {/* Expandable section — all content is in DOM for Google */}
        {hasExpandable && (
          <div>
            {/* Toggle button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-primary font-medium hover:underline mb-4 focus:outline-none"
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read More About {cityName}
                </>
              )}
            </button>

            {/* Hidden content — present in DOM so Google indexes it */}
            <div
              className={expanded ? 'block' : 'hidden'}
              aria-hidden={!expanded}
            >
              <div className="space-y-10">

                {/* Block 2 — Popular Routes */}
                {routes && routes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Popular {serviceLabel} Routes from {cityName}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {routes.map((route) => (
                        <div
                          key={route.to}
                          className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {cityName} → {route.to}
                            </p>
                            {route.via && (
                              <p className="text-xs text-gray-500 mt-0.5">via {route.via}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-sm font-medium text-primary">{route.distance}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-0.5">
                              <Clock className="w-3 h-3" />
                              {route.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block 3 — City-Specific FAQs */}
                {faqs && faqs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {serviceLabel} in {cityName} — Frequently Asked Questions
                    </h3>
                    <div className="space-y-3">
                      {faqs.map((faq, i) => (
                        <details key={i} className="bg-gray-50 rounded-lg border border-gray-100">
                          <summary className="px-4 py-3 font-medium text-gray-900 cursor-pointer select-none list-none flex justify-between items-center">
                            {faq.q}
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                          </summary>
                          <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block 4 — Local Tips */}
                {tips && tips.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Tips for {serviceLabel} in {cityName}
                    </h3>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600">
                          <span className="mt-1 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Block 5 — City Stats */}
                {stats && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      {cityName} at a Glance
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg px-4 py-3">
                        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Population</p>
                        <p className="text-gray-900 font-semibold">{stats.population}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg px-4 py-3">
                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Known For</p>
                        <p className="text-gray-900 font-semibold text-sm">{stats.knownFor}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg px-4 py-3">
                        <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Nearest Airport</p>
                        <p className="text-gray-900 font-semibold text-sm">{stats.airport}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
