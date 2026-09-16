import { MapPin, Sparkles } from 'lucide-react';

/**
 * Hero for a city where the service has no partners onboarded yet.
 *
 * Deliberately has no search or booking form: there is nothing to search, so
 * a search box would only walk the visitor into a dead end. What the page can
 * honestly offer is where we're at and a route to the nearest city that is
 * actually bookable today — so that's what it leads with.
 */
export function ServiceExpandingHero({
  cityName,
  serviceLabel,
  nearbyAnchor = '#nearby-cities',
}: {
  cityName: string;
  /** Lowercase noun phrase, e.g. "bike rentals" or "Activa rentals". */
  serviceLabel: string;
  nearbyAnchor?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div className="container-custom relative text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Now expanding
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl md:text-[2.75rem] md:leading-[1.1] font-black tracking-tight text-white">
          We&apos;re setting up {serviceLabel} in <span className="text-emerald-300">{cityName}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm md:text-[15px] leading-relaxed text-emerald-100/80">
          Our team is onboarding verified rental partners in {cityName} right now. Until they go
          live, you can book instantly in the nearby cities below.
        </p>
        <a
          href={nearbyAnchor}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-900 shadow-lg shadow-emerald-950/30 transition-transform hover:-translate-y-0.5"
        >
          <MapPin className="h-4 w-4" />
          See cities you can book in
        </a>
      </div>
    </section>
  );
}
