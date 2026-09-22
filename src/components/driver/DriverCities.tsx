import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { Reveal } from '@/components/driver/Reveal';

/**
 * Where you can drive.
 *
 * "500+ cities" is a number in the stats strip; naming them is what makes it
 * believable. The list scrolls on its own so it reads as a long list without
 * taking a long column, and it is duplicated once so the loop has no visible
 * seam.
 *
 * The marquee is decorative — the real answer for a driver checking their own
 * city is the link underneath, which is why the strip is aria-hidden and the
 * link is not.
 */

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Pune', 'Hyderabad', 'Chennai',
  'Kolkata', 'Jaipur', 'Surat', 'Lucknow', 'Indore', 'Nagpur', 'Chandigarh',
  'Kochi', 'Coimbatore', 'Bhopal', 'Vadodara', 'Visakhapatnam', 'Goa',
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  // Three copies, shifted by exactly one copy's width, so the loop has no seam.
  //
  // The gap has to live inside each copy (as a trailing margin) rather than on
  // the outer flex: a `gap` between the copies would add one extra gap that the
  // -33.333% shift does not account for, and that mismatch is the jump you see
  // once a lap completes. Three copies rather than two also keeps the strip
  // full on wide screens, where a single copy is narrower than the viewport.
  const copy = (key: string) => (
    <div key={key} className="flex shrink-0">
      {items.map((city, i) => (
        <span
          key={`${key}-${city}-${i}`}
          className="mr-3 flex shrink-0 items-center gap-2 rounded-full border-[1.5px] border-gray-100 bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-700 shadow-sm"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          {city}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="flex w-max"
      style={{
        animation: `drv-marquee ${reverse ? '46s' : '38s'} linear infinite${reverse ? ' reverse' : ''}`,
      }}
    >
      {copy('a')}
      {copy('b')}
      {copy('c')}
    </div>
  );
}

export function DriverCities() {
  const half = Math.ceil(CITIES.length / 2);

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes drv-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.3333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="drv-marquee"] { animation: none !important; }
        }
      `,
        }}
      />

      <div className="container-custom">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <MapPin className="h-3.5 w-3.5" />
              Where you can drive
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] font-black leading-[1.12] tracking-tight text-gray-900">
              Live in <span className="text-emerald-600">500+ cities</span>
            </h2>
            <p className="mt-3 text-gray-500">
              Accept trips in your own city, or take outstation runs across states.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Phones get a plain grid. A strip that slides past on its own is
          pleasant on a wide screen and awkward on a narrow one — the names
          move out of reach before they can be read. */}
      <div className="container-custom md:hidden">
        <Reveal>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {CITIES.map((city) => (
              <span
                key={city}
                className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-gray-100 bg-white px-3 py-2.5 text-[13px] font-semibold text-gray-700 shadow-sm"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{city}</span>
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* full-bleed strip, faded at both edges so it reads as endless */}
      <div className="relative hidden md:block" aria-hidden>
        <div className="space-y-3 overflow-hidden">
          <Row items={CITIES.slice(0, half)} />
          <Row items={CITIES.slice(half)} reverse />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent md:w-40" />
      </div>

      <div className="container-custom">
        <Reveal delay={150}>
          <div className="mt-10 text-center">
            <Link
              href="/locations"
              className="group/link inline-flex items-center gap-2 rounded-xl border-[1.5px] border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md"
            >
              Check if we are live in your city
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
