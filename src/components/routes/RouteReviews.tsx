import { Star, Quote } from 'lucide-react';

interface RouteReviewsProps {
  fromCity: string;
  toCity: string;
  routeSlug: string;
}

// Mock reviews - In production, fetch from database
function generateMockReviews(fromCity: string, toCity: string) {
  return [
    {
      id: '1',
      name: 'Rajesh Kumar',
      rating: 5,
      date: '2 days ago',
      review: `Excellent service from ${fromCity} to ${toCity}! Driver was professional and reached on time. Car was clean and comfortable. Highly recommended!`,
      verified: true,
    },
    {
      id: '2',
      name: 'Priya Sharma',
      rating: 5,
      date: '1 week ago',
      review: `Very smooth journey. The driver knew the route well and took us via the fastest path. No hidden charges, exactly as quoted. Will book again!`,
      verified: true,
    },
    {
      id: '3',
      name: 'Amit Patel',
      rating: 4,
      date: '2 weeks ago',
      review: `Good experience overall. Car was comfortable and driver was courteous. Slight delay in pickup but they informed in advance. Fair pricing.`,
      verified: true,
    },
    {
      id: '4',
      name: 'Sneha Gupta',
      rating: 5,
      date: '3 weeks ago',
      review: `Best cab service for ${fromCity} to ${toCity} route! Professional driver, clean car, and transparent billing. Customer support was also very helpful.`,
      verified: true,
    },
  ];
}

export function RouteReviews({ fromCity, toCity, routeSlug }: RouteReviewsProps) {
  const reviews = generateMockReviews(fromCity, toCity);

  // Calculate stats
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const totalReviews = reviews.length;
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fourStarCount = reviews.filter(r => r.rating === 4).length;

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container-custom max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-4">
          Customer Reviews
        </h2>
        <p className="text-center text-gray-600 mb-10">
          What our customers say about {fromCity} to {toCity} journey
        </p>

        {/* Rating Summary */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-10">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Overall Rating */}
            <div className="text-center md:border-r border-gray-200">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on {totalReviews}+ reviews</p>
            </div>

            {/* Rating Breakdown */}
            <div className="md:col-span-2">
              <div className="space-y-3">
                {[
                  { stars: 5, count: fiveStarCount },
                  { stars: 4, count: fourStarCount },
                ].map((item) => (
                  <div key={item.stars} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <span className="text-sm font-semibold">{item.stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${(item.count / totalReviews) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 min-w-[60px] text-right">
                      {item.count} reviews
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="grid md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-start gap-4 mb-4">
                <Quote className="w-8 h-8 text-emerald-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        {review.verified && (
                          <p className="text-xs text-emerald-600">✓ Verified Booking</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{review.date}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">{review.review}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={`/reviews/${routeSlug}`}
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all"
          >
            Read all reviews →
          </a>
        </div>
      </div>
    </section>
  );
}
