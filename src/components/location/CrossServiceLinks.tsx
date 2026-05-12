import Link from 'next/link';

const MAIN_SERVICES = [
  { slug: 'car-rental',          name: 'Car Rental' },
  { slug: 'bike-on-rent',        name: 'Bike Rental' },
  { slug: 'bus-rental',          name: 'Bus Rental' },
  { slug: 'mini-truck-rental',   name: 'Mini Truck Rental' },
  { slug: 'packers-and-movers',  name: 'Packers & Movers' },
  { slug: 'equipment-rental',    name: 'Equipment Rental' },
  { slug: 'luxury-car-rental',   name: 'Luxury Car Rental' },
];

interface CrossServiceLinksProps {
  citySlug: string;
  cityName: string;
  currentServiceSlug: string;
}

export function CrossServiceLinks({ citySlug, cityName, currentServiceSlug }: CrossServiceLinksProps) {
  const others = MAIN_SERVICES.filter((s) => s.slug !== currentServiceSlug);

  return (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="container-custom">
        <h2 className="text-base font-bold text-gray-800 mb-4">
          More Rental Services in {cityName}
        </h2>
        <div className="flex flex-wrap gap-2">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/${citySlug}`}
              className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
