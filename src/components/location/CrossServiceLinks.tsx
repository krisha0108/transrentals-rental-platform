import Link from 'next/link';
import { Car, Bike, Bus, Truck, PackageOpen, Wrench, Gem, ArrowRight, type LucideIcon } from 'lucide-react';

const MAIN_SERVICES: { slug: string; name: string; icon: LucideIcon }[] = [
  { slug: 'car-rental',          name: 'Car Rental',          icon: Car },
  { slug: 'bike-on-rent',        name: 'Bike Rental',         icon: Bike },
  { slug: 'bus-rental',          name: 'Bus Rental',          icon: Bus },
  { slug: 'mini-truck-rental',   name: 'Mini Truck Rental',   icon: Truck },
  { slug: 'packers-and-movers',  name: 'Packers & Movers',    icon: PackageOpen },
  { slug: 'equipment-rental',    name: 'Equipment Rental',    icon: Wrench },
  { slug: 'luxury-car-rental',   name: 'Luxury Car Rental',   icon: Gem },
];

interface CrossServiceLinksProps {
  citySlug: string;
  cityName: string;
  currentServiceSlug: string;
}

export function CrossServiceLinks({ citySlug, cityName, currentServiceSlug }: CrossServiceLinksProps) {
  const others = MAIN_SERVICES.filter((s) => s.slug !== currentServiceSlug);

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container-custom">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          More Rental Services in <span className="text-emerald-600">{cityName}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/${citySlug}`}
              className="group flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all"
            >
              <span className="w-8 h-8 rounded-lg bg-white border border-gray-200 group-hover:border-emerald-200 group-hover:bg-emerald-600 flex items-center justify-center shrink-0 transition-colors">
                <s.icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" strokeWidth={2} />
              </span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">
                {s.name}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
