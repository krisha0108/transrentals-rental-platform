import { Quote, Star } from 'lucide-react';
import { Reveal } from '@/components/driver/Reveal';

/**
 * What drivers say.
 *
 * The page had no social proof at all — every claim on it came from us. Three
 * short, specific stories do more than one polished quote, so they run as a
 * row of cards rather than a carousel the visitor has to operate.
 *
 * Deliberately no earnings figures: the rest of the page quotes none, and a
 * number in a testimonial reads as a promise just the same.
 */

const STORIES = [
  {
    quote:
      'I pick my own hours. Some days I start at six, some days after lunch — the trips are there either way, and nobody is calling me to ask where I am.',
    name: 'Rakesh K.',
    role: 'Chauffeur · Mumbai',
    tenure: '2 years driving',
    initials: 'RK',
  },
  {
    quote:
      'The app tells me the route and the drop before I accept, so I know what I am saying yes to. No arguing about the fare at the end of the trip.',
    name: 'Imran S.',
    role: 'Outstation · Jaipur',
    tenure: '1 year driving',
    initials: 'IS',
  },
  {
    quote:
      'Payment reaches my bank every week without me following up. That was the thing I was most worried about when I joined, and it has never slipped.',
    name: 'Venkatesh R.',
    role: 'Tempo Traveller · Bengaluru',
    tenure: '3 years driving',
    initials: 'VR',
  },
];

export function DriverTestimonials() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/40 to-white py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage:
            'radial-gradient(420px 320px at 8% 10%, #000 0%, transparent 70%), radial-gradient(420px 320px at 92% 90%, #000 0%, transparent 70%)',
          maskImage:
            'radial-gradient(420px 320px at 8% 10%, #000 0%, transparent 70%), radial-gradient(420px 320px at 92% 90%, #000 0%, transparent 70%)',
        }}
      />

      <div className="container-custom relative">
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <Quote className="h-3.5 w-3.5" />
              From our drivers
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] font-black leading-[1.12] tracking-tight text-gray-900">
              Drivers who <span className="text-emerald-600">stayed</span>
            </h2>
            <p className="mt-3 text-gray-500">
              Not a pitch — just three people who drive with us, in their own words.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {STORIES.map((s, i) => (
            <Reveal key={s.name} delay={i * 110}>
              <figure className="group flex h-full flex-col rounded-2xl border-[1.5px] border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100">
                <span className="flex gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <Star key={n} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>

                <Quote className="mt-4 h-6 w-6 text-emerald-200 transition-colors duration-300 group-hover:text-emerald-400" />

                <blockquote className="mt-2 flex-1 text-[14.5px] leading-relaxed text-gray-600">
                  {s.quote}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-[14px] font-black text-emerald-700">
                    {s.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-gray-900">{s.name}</span>
                    <span className="block truncate text-[12px] text-gray-400">
                      {s.role} · {s.tenure}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
