import React from 'react';
import { Truck, Layers, Container, PanelBottom, Boxes, Snowflake, Weight } from 'lucide-react';

const TRAILER_TYPES = [
  {
    id: 'flatbed',
    name: 'Flatbed Trailer',
    icon: Truck,
    anim: 'drive',
    capacity: '20–35 Ton',
    bestFor: 'General cargo, machinery, and construction material',
    features: ['Open loading', 'Any side access', 'Machinery haul'],
  },
  {
    id: 'lowbed',
    name: 'Lowbed Trailer',
    icon: Layers,
    anim: 'lift',
    capacity: '25–60 Ton',
    bestFor: 'Oversized and heavy equipment transport',
    features: ['Low ground clearance', 'Heavy machinery', 'Escort available'],
  },
  {
    id: 'container',
    name: 'Container Trailer',
    icon: Container,
    anim: 'drive',
    capacity: '20–32 Ton',
    bestFor: 'Sealed cargo and export-import shipments',
    features: ['20ft / 40ft container', 'Weatherproof', 'Port transport'],
  },
  {
    id: 'curtain-side',
    name: 'Curtain-Side Trailer',
    icon: PanelBottom,
    anim: 'wrench',
    capacity: '18–28 Ton',
    bestFor: 'Fast side-loading for palletized goods',
    features: ['Side curtain access', 'Palletized goods', 'Quick loading'],
  },
  {
    id: 'skeletal',
    name: 'Skeletal Trailer',
    icon: Boxes,
    anim: 'pulse',
    capacity: '20–40 Ton',
    bestFor: 'Container chassis for port and depot transfers',
    features: ['Container chassis', 'Port transfers', 'Lightweight frame'],
  },
  {
    id: 'refrigerated',
    name: 'Refrigerated Trailer',
    icon: Snowflake,
    anim: 'tick',
    capacity: '15–25 Ton',
    bestFor: 'Temperature-controlled goods over long distance',
    features: ['Cold chain', 'Food grade', 'Long haul'],
  },
];

/* Wahi wide-brochure card language jo Excavator/Truck Types sections me hai. */
const TRT_CSS = `
.trt-card {
  opacity: 0;
  animation: trt-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes trt-in {
  from { opacity: 0; transform: translateY(26px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.trt-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 46px -18px rgba(16,185,129,.45);
}
@media (prefers-reduced-motion: reduce) {
  .trt-card { opacity: 1; animation: none; }
  .trt-card:hover { transform: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover, no custom keyframes. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  lift: 'group-hover:-translate-y-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
  wrench: 'group-hover:rotate-45',
};

export function TrailerTypes() {
  return (
    <section className="trt relative py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: TRT_CSS }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(620px 380px at 50% 0%, rgba(16,185,129,.10), transparent 70%)' }}
      />
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <h2 className="text-3xl md:text-[2.75rem] leading-[1.1] font-black tracking-tight text-gray-900 mb-3">
            Trailer Types &amp; Capacity
          </h2>
          <p className="text-gray-500">
            From general flatbeds to heavy lowbeds — choose the right trailer for your cargo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {TRAILER_TYPES.map((trailer, idx) => (
            <div
              key={trailer.id}
              className="trt-card group relative flex w-full max-w-lg mx-auto rounded-[18px] bg-white border border-gray-100 shadow-sm overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="w-[124px] shrink-0 flex flex-col items-center justify-center gap-3 px-3 py-6 bg-emerald-50">
                <span className="inline-flex">
                  <trailer.icon
                    className={`w-9 h-9 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[trailer.anim]}`}
                    strokeWidth={1.7}
                  />
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-center leading-tight text-emerald-700">
                  <Weight className="w-3 h-3 shrink-0" />
                  {trailer.capacity}
                </span>
              </div>

              <div className="flex-1 min-w-0 p-5">
                <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{trailer.name}</h3>
                <div className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400">Best for</div>
                <p className="mt-0.5 text-[13px] text-gray-600">{trailer.bestFor}</p>

                <ul className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
                  {trailer.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-50 grid place-items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
