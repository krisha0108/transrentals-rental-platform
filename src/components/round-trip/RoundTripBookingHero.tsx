import { ArrowLeftRight, MapPin, Clock, IndianRupee, Car } from 'lucide-react';

interface RoundTripBookingHeroProps {
  fromCity: string;
  fromSlug: string;
  toCity: string;
  toSlug: string;
  distance: number;
  estimatedTime: string | null;
  roundTripPrice: number;
  perKmRate: number;
  vehicleCategory: string;
}

export function RoundTripBookingHero({
  fromCity,
  fromSlug,
  toCity,
  toSlug,
  distance,
  estimatedTime,
  roundTripPrice,
  perKmRate,
  vehicleCategory,
}: RoundTripBookingHeroProps) {
  return (
    <section className="relative py-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <ArrowLeftRight className="w-4 h-4" />
              Round Trip Package
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6">
            {fromCity} <ArrowLeftRight className="inline w-10 h-10 mx-2" /> {toCity}
          </h1>

          <p className="text-xl md:text-2xl text-center mb-8 text-white/90">
            Round Trip Cab Service - Go and Return with Same Driver
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {/* Distance */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
              <MapPin className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Round Trip</p>
              <p className="text-2xl font-bold">{distance * 2}km</p>
            </div>

            {/* Time */}
            {estimatedTime && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <Clock className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm text-white/80 mb-1">Duration</p>
                <p className="text-2xl font-bold">{estimatedTime}</p>
              </div>
            )}

            {/* Price */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
              <IndianRupee className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Starting From</p>
              <p className="text-2xl font-bold">₹{roundTripPrice.toLocaleString()}</p>
            </div>

            {/* Rate */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
              <Car className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Per Km</p>
              <p className="text-2xl font-bold">₹{perKmRate}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={`/round-trip/${fromSlug}-to-${toSlug}-round-trip/book`}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              Book Round Trip Now
            </a>
            <a
              href="tel:+919737965551"
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition border-2 border-white/30"
            >
              📞 Call for Instant Booking
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            {[
              '✓ Professional Drivers',
              '✓ All Charges Included',
              '✓ 24/7 Support',
              '✓ Clean AC Vehicles',
            ].map((item) => (
              <span key={item} className="text-white/90 font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
