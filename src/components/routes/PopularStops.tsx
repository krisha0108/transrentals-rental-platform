import { Coffee, Utensils, Landmark, Camera } from 'lucide-react';

interface PopularStopsProps {
  fromCity: string;
  toCity: string;
  distance: number;
}

// Helper function to generate stops based on route
function generatePopularStops(fromCity: string, toCity: string, distance: number) {
  // This can be enhanced with actual data from database
  const stops = [];

  if (distance > 150) {
    stops.push({
      icon: Coffee,
      name: 'Highway Rest Stop',
      description: 'Refreshments & washrooms',
      distance: Math.floor(distance / 2),
      color: 'from-amber-500 to-orange-500',
    });
  }

  if (distance > 200) {
    stops.push({
      icon: Utensils,
      name: 'Dhaba / Restaurant',
      description: 'Food & meal break',
      distance: Math.floor(distance * 0.6),
      color: 'from-red-500 to-pink-500',
    });
  }

  // Add attractions based on common routes
  const commonAttractions: Record<string, any> = {
    'Delhi-Agra': {
      icon: Landmark,
      name: 'Mathura/Vrindavan',
      description: 'Religious sites (optional)',
      distance: 145,
      color: 'from-purple-500 to-indigo-500',
    },
    'Mumbai-Pune': {
      icon: Camera,
      name: 'Lonavala',
      description: 'Hill station viewpoint',
      distance: 80,
      color: 'from-green-500 to-teal-500',
    },
  };

  const routeKey = `${fromCity}-${toCity}`;
  if (commonAttractions[routeKey]) {
    stops.push(commonAttractions[routeKey]);
  }

  // Add fuel stop if distance > 100km
  if (distance > 100 && stops.length < 3) {
    stops.push({
      icon: Coffee,
      name: 'Fuel Station',
      description: 'Fuel & quick stop',
      distance: Math.floor(distance * 0.4),
      color: 'from-blue-500 to-cyan-500',
    });
  }

  return stops;
}

export function PopularStops({ fromCity, toCity, distance }: PopularStopsProps) {
  const stops = generatePopularStops(fromCity, toCity, distance);

  if (stops.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">
          Popular Stops on the Way
        </h2>
        <p className="text-center text-gray-600 mb-10">
          You can request stops at these locations during your journey
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stops.map((stop, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${stop.color} rounded-full flex items-center justify-center mb-4`}>
                <stop.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {stop.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">{stop.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>~{stop.distance} km from {fromCity}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-blue-900 font-semibold mb-2">
            💡 Flexible Journey
          </p>
          <p className="text-blue-700 text-sm">
            Inform your driver about preferred stops in advance. Most stops add 15-30 minutes to journey time.
          </p>
        </div>
      </div>
    </section>
  );
}
