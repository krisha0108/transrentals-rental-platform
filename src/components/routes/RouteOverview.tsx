import { MapPin, Clock, Navigation, Coins } from 'lucide-react';

interface RouteOverviewProps {
  fromCity: string;
  fromState: string;
  toCity: string;
  toState: string;
  distance: number;
  estimatedTime?: string | null;
  tollCharges?: number | null;
  routeDescription?: string | null;
  routeType?: 'one-way' | 'round-trip';
}

export function RouteOverview({
  fromCity,
  fromState,
  toCity,
  toState,
  distance,
  estimatedTime,
  tollCharges,
  routeDescription,
  routeType = 'one-way',
}: RouteOverviewProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-10">
          Route Overview: {fromCity} to {toCity}
        </h2>

        {/* Route Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center">
            <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1">Distance</p>
            <p className="text-2xl font-bold text-gray-900">{distance} km</p>
          </div>

          {estimatedTime && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Estimated Time</p>
              <p className="text-2xl font-bold text-gray-900">{estimatedTime}</p>
            </div>
          )}

          {tollCharges !== null && tollCharges !== undefined && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl text-center">
              <Coins className="w-8 h-8 text-amber-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Toll Charges</p>
              <p className="text-2xl font-bold text-gray-900">
                {tollCharges > 0 ? `₹${tollCharges}` : (
                  <span className="text-emerald-600">Included</span>
                )}
              </p>
            </div>
          )}

          <div className={`bg-gradient-to-br ${routeType === 'round-trip' ? 'from-purple-50 to-purple-100' : 'from-emerald-50 to-emerald-100'} p-6 rounded-xl text-center`}>
            <Navigation className={`w-8 h-8 ${routeType === 'round-trip' ? 'text-purple-600' : 'text-emerald-600'} mx-auto mb-3`} />
            <p className="text-sm text-gray-600 mb-1">Route Type</p>
            <p className="text-2xl font-bold text-gray-900">{routeType === 'round-trip' ? 'Round Trip' : 'One Way'}</p>
          </div>
        </div>

        {/* Route Description */}
        {routeDescription && (
          <div className="bg-gray-50 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-bold mb-4">About This Route</h3>
            <p className="text-gray-700 leading-relaxed">{routeDescription}</p>
          </div>
        )}

        {/* Route Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Starting Point */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Starting Point</h3>
                <p className="text-sm text-gray-600">Pickup Location</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900">{fromCity}</p>
            <p className="text-gray-600">{fromState}</p>
          </div>

          {/* Destination */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Destination</h3>
                <p className="text-sm text-gray-600">Drop Location</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900">{toCity}</p>
            <p className="text-gray-600">{toState}</p>
          </div>
        </div>

        {/* What's Included */}
        <div className="mt-12 bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold mb-6 text-center">What's Included in Your Journey</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '✓', title: 'Professional Driver', desc: 'Experienced & courteous' },
              { icon: '✓', title: 'Fuel Charges', desc: 'Complete fuel included' },
              { icon: '✓', title: 'Toll & Parking', desc: 'All charges covered' },
              { icon: '✓', title: 'State Permits', desc: 'Inter-state permits' },
              { icon: '✓', title: 'GST & Taxes', desc: 'All taxes included' },
              { icon: '✓', title: '24/7 Support', desc: 'Always available' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
