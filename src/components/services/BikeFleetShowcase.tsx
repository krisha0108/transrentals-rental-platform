import React from 'react';
import { CheckCircle2, Sparkles, Compass, Gauge, Zap, Route } from 'lucide-react';

const POPULAR_BIKES = [
  { name: 'Royal Enfield Classic 350', icon: Compass, tag: 'Cruiser', anim: 'tick' },
  { name: 'KTM Duke 390', icon: Gauge, tag: 'Sport', anim: 'pulse' },
  { name: 'Honda Activa', icon: Zap, tag: 'Scooter', anim: 'pulse' },
  { name: 'Yamaha FZ', icon: Route, tag: 'Street', anim: 'drive' },
];

/* Wahi wide-brochure card language jo Bus Rental Rates aur
   Bike Types sections me use hui hai. */
const PBK_CSS = `
.pbk-card {
  opacity: 0;
  animation: pbk-in .6s cubic-bezier(.22,1,.36,1) forwards;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
@keyframes pbk-in {
  from { opacity: 0; transform: translateY(24px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
.pbk-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 42px -18px rgba(16,185,129,.4);
}
@media (prefers-reduced-motion: reduce) {
  .pbk-card { opacity: 1; animation: none; }
  .pbk-card:hover { transform: none; }
}
`;

/* Har icon apne hisaab se hilta hai — plain Tailwind group-hover. */
const ICON_HOVER_ANIM: Record<string, string> = {
  drive: 'group-hover:translate-x-2',
  pulse: 'group-hover:scale-125',
  tick: 'group-hover:rotate-[360deg]',
};

export function BikeFleetShowcase() {
  return (
    <section className="relative py-16 md:py-20 bg-gray-50 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: PBK_CSS }} />
      <div className="container-custom relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Rider Favourites
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Popular Bikes</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {POPULAR_BIKES.map((bike, idx) => (
            <div
              key={bike.name}
              className="pbk-card group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <bike.icon
                  className={`w-7 h-7 text-emerald-600 transition-transform duration-500 ${ICON_HOVER_ANIM[bike.anim]}`}
                  strokeWidth={1.8}
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-600 mb-1.5">{bike.tag}</span>
              <h3 className="font-bold text-[16px] text-gray-900 leading-snug flex-1">{bike.name}</h3>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[12.5px] font-semibold text-gray-600">Available to book</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
